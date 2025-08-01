import { NextRequest, NextResponse } from "next/server";

// Interface para artistas trending
interface TrendingArtist {
  name: string;
  mentions: number;
  totalEngagement: number;
  sentiment: "positive" | "neutral" | "negative";
  topCasts: Array<{
    hash: string;
    text: string;
    author: {
      fid: number;
      username: string;
      displayName: string;
      pfp: string;
    };
    reactions: {
      likes: number;
      recasts: number;
      replies: number;
    };
    timestamp: string;
  }>;
  growthRate: number; // Porcentaje de crecimiento en menciones
  categories: string[];
}

// Función para obtener artistas reales del backend
async function getKnownArtists(): Promise<string[]> {
  try {
    // Hacer fetch al backend de elei-marketplace
    const backendUrl = process.env.API_ELEI || "http://localhost:3000";
    const response = await fetch(
      `${backendUrl}/api/collections?category=MUSIC&community=tuneport`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store", // Obtener datos frescos
      }
    );

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const collections = await response.json();

    // Extraer nombres únicos de artistas
    const artists: string[] = Array.from(
      new Set(
        collections
          .filter(
            (col: any) => col.artist_name && col.artist_name.trim().length > 0
          )
          .map((col: any) => col.artist_name.toLowerCase().trim())
      )
    );

    // Agregar algunos artistas populares como fallback si la BD está vacía
    const fallbackArtists = [
      "bad bunny",
      "j balvin",
      "karol g",
      "taylor swift",
      "drake",
      "billie eilish",
      "the weeknd",
      "dua lipa",
      "musician",
      "artist",
    ];

    return artists.length > 0 ? artists : fallbackArtists;
  } catch (error) {
    console.error("Error fetching artists from backend:", error);
    // Fallback en caso de error
    return ["musician", "artist", "singer", "producer", "dj"];
  }
}

// Categorías de música
const MUSIC_CATEGORIES = {
  reggaeton: ["reggaeton", "perreo", "dembow", "urbano", "latino"],
  pop: ["pop", "mainstream", "radio", "chart", "billboard"],
  electronic: ["edm", "house", "techno", "dubstep", "electronic", "dance"],
  "hip-hop": ["rap", "hip hop", "trap", "drill", "boom bap"],
  rock: ["rock", "metal", "punk", "indie rock", "alternative"],
  "r&b": ["r&b", "soul", "neo soul", "contemporary r&b"],
  web3: ["nft", "crypto", "blockchain", "web3", "metaverse"],
  indie: ["indie", "underground", "independent", "emerging"],
};

function categorizeArtist(mentions: any[]): string[] {
  const categories: string[] = [];
  const textContent = mentions.map((m) => m.text.toLowerCase()).join(" ");

  for (const [category, keywords] of Object.entries(MUSIC_CATEGORIES)) {
    if (keywords.some((keyword) => textContent.includes(keyword))) {
      categories.push(category);
    }
  }

  return categories.length > 0 ? categories : ["general"];
}

function calculateSentiment(casts: any[]): "positive" | "neutral" | "negative" {
  const positiveWords = [
    "amazing",
    "love",
    "best",
    "incredible",
    "fire",
    "dope",
    "sick",
    "awesome",
    "great",
    "fantastic",
  ];
  const negativeWords = [
    "hate",
    "worst",
    "terrible",
    "awful",
    "boring",
    "bad",
    "sucks",
    "disappointed",
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

  if (positiveScore > negativeScore * 1.5) return "positive";
  if (negativeScore > positiveScore * 1.5) return "negative";
  return "neutral";
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 20);
    const timeWindow = searchParams.get("timeWindow") || "24h";
    const category = searchParams.get("category") || "all";

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
    const hoursBack = timeMap[timeWindow as keyof typeof timeMap] || 24;
    const startTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    // Obtener artistas reales de la base de datos
    const knownArtists = await getKnownArtists();

    // Búsqueda paralela para diferentes artistas
    const artistSearchPromises = knownArtists.map(async (artist) => {
      try {
        // Buscar menciones específicas del artista
        const response = await fetch(
          `https://api.neynar.com/v2/farcaster/cast/search?q="${artist}" OR ${artist.replace(
            " ",
            "+"
          )}&limit=50&start_time=${startTime.toISOString()}`,
          {
            headers: {
              Authorization: `Bearer ${neynarApiKey}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          console.error(
            `Error searching for artist "${artist}": ${response.status}`
          );
          return { artist, casts: [], mentions: 0 };
        }

        const result = await response.json();
        const casts = result.casts || [];

        // Filtrar casts que realmente mencionan al artista
        const relevantCasts = casts.filter((cast: any) =>
          cast.text.toLowerCase().includes(artist.toLowerCase())
        );

        return {
          artist,
          casts: relevantCasts,
          mentions: relevantCasts.length,
        };
      } catch (error) {
        console.error(`Error fetching data for artist "${artist}":`, error);
        return { artist, casts: [], mentions: 0 };
      }
    });

    const artistData = await Promise.all(artistSearchPromises);

    // Procesar y rankear artistas
    const trendingArtists: TrendingArtist[] = artistData
      .filter((data) => data.mentions > 0) // Solo artistas con menciones
      .map((data) => {
        const totalEngagement = data.casts.reduce(
          (sum: number, cast: any) =>
            sum +
            (cast.reactions?.likes_count || 0) +
            (cast.reactions?.recasts_count || 0) +
            (cast.replies?.count || 0),
          0
        );

        // Calcular tasa de crecimiento (simplificado - en una implementación real, compararías con datos históricos)
        const avgEngagementPerMention =
          data.mentions > 0 ? totalEngagement / data.mentions : 0;
        const growthRate = Math.min(avgEngagementPerMention * 10, 100); // Aproximación basada en engagement

        const sentiment = calculateSentiment(data.casts);
        const categories = categorizeArtist(data.casts);

        // Seleccionar los mejores casts por engagement
        const topCasts = data.casts
          .sort((a: any, b: any) => {
            const aEngagement =
              (a.reactions?.likes_count || 0) +
              (a.reactions?.recasts_count || 0) +
              (a.replies?.count || 0);
            const bEngagement =
              (b.reactions?.likes_count || 0) +
              (b.reactions?.recasts_count || 0) +
              (b.replies?.count || 0);
            return bEngagement - aEngagement;
          })
          .slice(0, 3)
          .map((cast: any) => ({
            hash: cast.hash,
            text: cast.text,
            author: {
              fid: cast.author.fid,
              username: cast.author.username,
              displayName: cast.author.display_name || cast.author.username,
              pfp: cast.author.pfp_url,
            },
            reactions: {
              likes: cast.reactions?.likes_count || 0,
              recasts: cast.reactions?.recasts_count || 0,
              replies: cast.replies?.count || 0,
            },
            timestamp: cast.timestamp,
          }));

        return {
          name: data.artist,
          mentions: data.mentions,
          totalEngagement,
          sentiment,
          topCasts,
          growthRate,
          categories,
        };
      })
      // Filtrar por categoría si se especifica
      .filter((artist) => {
        if (category === "all") return true;
        return artist.categories.includes(category);
      })
      // Ordenar por un score compuesto de menciones y engagement
      .sort((a, b) => {
        const scoreA = a.mentions * 10 + a.totalEngagement + a.growthRate;
        const scoreB = b.mentions * 10 + b.totalEngagement + b.growthRate;
        return scoreB - scoreA;
      })
      .slice(0, limit);

    // Estadísticas agregadas
    const stats = {
      totalArtistsAnalyzed: knownArtists.length,
      trendingArtistsFound: trendingArtists.length,
      totalMentions: trendingArtists.reduce(
        (sum, artist) => sum + artist.mentions,
        0
      ),
      totalEngagement: trendingArtists.reduce(
        (sum, artist) => sum + artist.totalEngagement,
        0
      ),
      timeWindow,
      topCategories: Object.entries(
        trendingArtists.reduce((acc, artist) => {
          artist.categories.forEach((cat) => {
            acc[cat] = (acc[cat] || 0) + artist.mentions;
          });
          return acc;
        }, {} as Record<string, number>)
      )
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([category, count]) => ({ category, mentions: count })),
      sentimentDistribution: {
        positive: trendingArtists.filter((a) => a.sentiment === "positive")
          .length,
        neutral: trendingArtists.filter((a) => a.sentiment === "neutral")
          .length,
        negative: trendingArtists.filter((a) => a.sentiment === "negative")
          .length,
      },
    };

    return NextResponse.json({
      success: true,
      data: trendingArtists,
      stats,
      message: `Found ${trendingArtists.length} trending artists in the last ${timeWindow}`,
    });
  } catch (error) {
    console.error("Error in trending artists detection:", error);

    return NextResponse.json(
      {
        error: "Error fetching trending artists",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
