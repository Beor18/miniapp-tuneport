import { NextRequest, NextResponse } from "next/server";

// Interface para métricas sociales de una canción
interface SongSocialMetrics {
  songTitle: string;
  artistName: string;
  socialData: {
    totalMentions: number;
    recentMentions: number; // Últimas 24h
    totalEngagement: number;
    avgEngagementPerMention: number;
    sentiment: "positive" | "neutral" | "negative";
    trendingScore: number; // 0-100
    viralStatus: "viral" | "trending" | "rising" | "stable" | "declining";
  };
  topMentions: Array<{
    hash: string;
    text: string;
    author: {
      fid: number;
      username: string;
      displayName: string;
      pfp: string;
      followerCount?: number;
    };
    reactions: {
      likes: number;
      recasts: number;
      replies: number;
    };
    timestamp: string;
    engagement: number;
  }>;
  timeWindow: string;
}

// Función para validar que la canción/artista existen en nuestro backend
async function validateSongData(
  songTitle?: string,
  artistName?: string
): Promise<{ isValid: boolean; enhancedData?: any }> {
  try {
    const backendUrl = process.env.API_ELEI || "http://localhost:3000";

    // Buscar colecciones que coincidan con el artista
    let collectionsUrl = `${backendUrl}/api/collections?category=MUSIC&community=tuneport`;

    const collectionsResponse = await fetch(collectionsUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!collectionsResponse.ok) {
      throw new Error(`Backend error: ${collectionsResponse.status}`);
    }

    const collections = await collectionsResponse.json();

    // Buscar colección que coincida con el artista
    const matchingCollection = collections.find(
      (col: any) =>
        artistName &&
        col.artist_name &&
        col.artist_name.toLowerCase().includes(artistName.toLowerCase())
    );

    if (matchingCollection) {
      return {
        isValid: true,
        enhancedData: {
          verified: true,
          collection: matchingCollection.name,
          artist: matchingCollection.artist_name,
          genre: matchingCollection.music_genre,
          network: matchingCollection.network,
        },
      };
    }

    // Si no se encuentra, continuar con la búsqueda pero marcar como no verificado
    return {
      isValid: true, // Permitir búsqueda de cualquier canción/artista
      enhancedData: {
        verified: false,
        message: "Datos no encontrados en el backend de Tuneport",
      },
    };
  } catch (error) {
    console.error("Error validating song data:", error);
    return { isValid: true }; // Continuar con la búsqueda en caso de error
  }
}

function calculateSentiment(casts: any[]): "positive" | "neutral" | "negative" {
  const positiveWords = [
    "amazing",
    "love",
    "fire",
    "banger",
    "hit",
    "masterpiece",
    "incredible",
    "perfect",
    "best",
    "awesome",
    "sick",
    "dope",
  ];
  const negativeWords = [
    "trash",
    "boring",
    "hate",
    "terrible",
    "worst",
    "sucks",
    "mid",
    "overrated",
  ];

  let positiveScore = 0;
  let negativeScore = 0;

  casts.forEach((cast) => {
    const text = cast.text.toLowerCase();
    positiveWords.forEach((word) => {
      if (text.includes(word)) positiveScore++;
    });
    negativeWords.forEach((word) => {
      if (text.includes(word)) negativeScore++;
    });
  });

  if (positiveScore > negativeScore * 1.2) return "positive";
  if (negativeScore > positiveScore * 1.2) return "negative";
  return "neutral";
}

function calculateViralStatus(
  metrics: any
): "viral" | "trending" | "rising" | "stable" | "declining" {
  const {
    totalMentions,
    recentMentions,
    avgEngagementPerMention,
    trendingScore,
  } = metrics;

  // Viral: Alto engagement reciente + menciones frecuentes
  if (
    recentMentions >= 5 &&
    avgEngagementPerMention >= 10 &&
    trendingScore >= 80
  ) {
    return "viral";
  }

  // Trending: Crecimiento sostenido
  if (recentMentions >= 3 && trendingScore >= 60) {
    return "trending";
  }

  // Rising: Empezando a ganar tracción
  if (recentMentions >= 1 && avgEngagementPerMention >= 5) {
    return "rising";
  }

  // Stable: Menciones consistentes pero sin crecimiento
  if (totalMentions >= 2) {
    return "stable";
  }

  return "declining";
}

function calculateTrendingScore(
  totalMentions: number,
  recentMentions: number,
  totalEngagement: number
): number {
  let score = 0;

  // Puntos base por menciones recientes (más peso)
  score += recentMentions * 25;

  // Puntos por menciones totales
  score += Math.min(totalMentions * 5, 30);

  // Puntos por engagement total
  score += Math.min(totalEngagement / 2, 40);

  // Bonus por actividad reciente vs. histórica
  if (totalMentions > 0) {
    const recentRatio = recentMentions / totalMentions;
    score += recentRatio * 20;
  }

  return Math.min(Math.round(score), 100);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const songTitle = searchParams.get("title");
    const artistName = searchParams.get("artist");
    const timeWindow = searchParams.get("timeWindow") || "7d";

    if (!songTitle && !artistName) {
      return NextResponse.json(
        { error: "Se requiere al menos título de canción o nombre de artista" },
        { status: 400 }
      );
    }

    // Validar datos contra nuestro backend
    const validation = await validateSongData(
      songTitle || undefined,
      artistName || undefined
    );

    const neynarApiKey = process.env.NEYNAR_API_KEY;

    if (!neynarApiKey) {
      return NextResponse.json(
        { error: "NEYNAR_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Configurar ventana temporal
    const timeMap = {
      "1h": 1,
      "6h": 6,
      "12h": 12,
      "24h": 24,
      "7d": 168,
    };
    const hoursBack = timeMap[timeWindow as keyof typeof timeMap] || 168;
    const startTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    const recent24hTime = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Construir queries de búsqueda
    const searchQueries = [];

    if (songTitle && artistName) {
      searchQueries.push(`"${songTitle}" AND "${artistName}"`);
      searchQueries.push(`"${songTitle}" "${artistName}"`);
      searchQueries.push(`${songTitle} ${artistName}`);
    } else if (songTitle) {
      searchQueries.push(`"${songTitle}"`);
      searchQueries.push(`${songTitle} song`);
      searchQueries.push(`${songTitle} track`);
    } else if (artistName) {
      searchQueries.push(`"${artistName}"`);
      searchQueries.push(`${artistName} music`);
    }

    // Ejecutar búsquedas en paralelo
    const searchPromises = searchQueries.map(async (query) => {
      try {
        const response = await fetch(
          `https://api.neynar.com/v2/farcaster/cast/search?q=${encodeURIComponent(
            query
          )}&limit=25&start_time=${startTime.toISOString()}`,
          {
            headers: {
              Authorization: `Bearer ${neynarApiKey}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          console.error(`Error searching for "${query}": ${response.status}`);
          return { casts: [] };
        }

        return await response.json();
      } catch (error) {
        console.error(`Error fetching data for "${query}":`, error);
        return { casts: [] };
      }
    });

    const searchResults = await Promise.all(searchPromises);

    // Combinar todos los casts y remover duplicados
    const allCasts = searchResults.flatMap((result) => result.casts || []);
    const uniqueCasts = allCasts.reduce((acc: any[], cast: any) => {
      if (!acc.find((c: any) => c.hash === cast.hash)) {
        acc.push(cast);
      }
      return acc;
    }, [] as any[]);

    // Filtrar casts relevantes y calcular métricas
    const relevantCasts = uniqueCasts.filter((cast: any) => {
      const text = cast.text.toLowerCase();
      const titleMatch = songTitle
        ? text.includes(songTitle.toLowerCase())
        : true;
      const artistMatch = artistName
        ? text.includes(artistName.toLowerCase())
        : true;
      return titleMatch || artistMatch;
    });

    // Separar menciones recientes (últimas 24h)
    const recentCasts = relevantCasts.filter(
      (cast: any) => new Date(cast.timestamp) >= recent24hTime
    );

    // Calcular engagement total
    const totalEngagement = relevantCasts.reduce(
      (sum: number, cast: any) =>
        sum +
        (cast.reactions?.likes_count || 0) +
        (cast.reactions?.recasts_count || 0) +
        (cast.replies?.count || 0),
      0
    );

    const avgEngagementPerMention =
      relevantCasts.length > 0 ? totalEngagement / relevantCasts.length : 0;

    // Calcular métricas
    const trendingScore = calculateTrendingScore(
      relevantCasts.length,
      recentCasts.length,
      totalEngagement
    );

    const socialData = {
      totalMentions: relevantCasts.length,
      recentMentions: recentCasts.length,
      totalEngagement,
      avgEngagementPerMention: Math.round(avgEngagementPerMention * 10) / 10,
      sentiment: calculateSentiment(relevantCasts),
      trendingScore,
      viralStatus: calculateViralStatus({
        totalMentions: relevantCasts.length,
        recentMentions: recentCasts.length,
        avgEngagementPerMention,
        trendingScore,
      }),
    };

    // Seleccionar las mejores menciones por engagement
    const topMentions = relevantCasts
      .map((cast: any) => {
        const engagement =
          (cast.reactions?.likes_count || 0) +
          (cast.reactions?.recasts_count || 0) +
          (cast.replies?.count || 0);
        return {
          hash: cast.hash,
          text: cast.text,
          author: {
            fid: cast.author.fid,
            username: cast.author.username,
            displayName: cast.author.display_name || cast.author.username,
            pfp: cast.author.pfp_url,
            followerCount: cast.author.follower_count,
          },
          reactions: {
            likes: cast.reactions?.likes_count || 0,
            recasts: cast.reactions?.recasts_count || 0,
            replies: cast.replies?.count || 0,
          },
          timestamp: cast.timestamp,
          engagement,
        };
      })
      .sort((a: any, b: any) => b.engagement - a.engagement)
      .slice(0, 5);

    const metrics: SongSocialMetrics = {
      songTitle: songTitle || "Unknown",
      artistName: artistName || "Unknown",
      socialData,
      topMentions,
      timeWindow,
    };

    return NextResponse.json({
      success: true,
      data: {
        ...metrics,
        tuneportData: validation.enhancedData, // Agregar datos del backend
      },
      message: `Found ${relevantCasts.length} mentions for "${
        songTitle || artistName
      }"`,
    });
  } catch (error) {
    console.error("Error fetching song metrics:", error);

    return NextResponse.json(
      {
        error: "Error fetching song social metrics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
