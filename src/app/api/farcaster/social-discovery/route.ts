import { NextRequest, NextResponse } from "next/server";

// Interface para datos de descubrimiento social
interface SocialMusicData {
  cast: {
    hash: string;
    text: string;
    timestamp: string;
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
    embeds?: any[];
  };
  musicKeywords: string[];
  relevanceScore: number;
}

// Función para obtener palabras clave dinámicas desde el backend
async function getMusicKeywords(): Promise<string[]> {
  try {
    // Hacer fetch al backend para obtener colecciones y NFTs
    const backendUrl = process.env.API_ELEI || "http://localhost:3000";

    const collectionsResponse = await fetch(
      `${backendUrl}/api/collections?category=MUSIC&community=tuneport`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      }
    );

    if (!collectionsResponse.ok) {
      throw new Error(`Backend error: ${collectionsResponse.status}`);
    }

    const collections = await collectionsResponse.json();
    const keywords = new Set<string>();

    // Agregar nombres de artistas y álbumes
    collections.forEach((col: any) => {
      if (col.artist_name) {
        keywords.add(col.artist_name.toLowerCase());
        // Agregar palabras individuales del nombre del artista
        col.artist_name
          .toLowerCase()
          .split(" ")
          .forEach((word: string) => {
            if (word.length > 2) keywords.add(word);
          });
      }
      if (col.name) {
        keywords.add(col.name.toLowerCase());
      }
      if (col.music_genre) {
        keywords.add(col.music_genre.toLowerCase());
      }
    });

    // Palabras clave base de música
    const baseKeywords = [
      "music",
      "song",
      "track",
      "album",
      "artist",
      "beat",
      "remix",
      "nft",
      "mint",
      "tuneport",
      "spotify",
      "soundcloud",
      "musician",
      "producer",
      "vinyl",
      "concert",
      "festival",
      "band",
      "single",
      "ep",
      "mixtape",
      "playlist",
    ];

    baseKeywords.forEach((keyword) => keywords.add(keyword));

    return Array.from(keywords).filter((k) => k.length > 1);
  } catch (error) {
    console.error("Error fetching music keywords from backend:", error);
    // Fallback keywords
    return ["music", "song", "track", "album", "artist", "tuneport", "nft"];
  }
}

// Función para calcular relevancia del cast
function calculateRelevanceScore(cast: any, musicKeywords: string[]): number {
  let score = 0;

  // Puntos base por menciones musicales
  score += musicKeywords.length * 10;

  // Puntos por engagement
  score += (cast.reactions?.likes_count || 0) * 2;
  score += (cast.reactions?.recasts_count || 0) * 3;
  score += (cast.reactions?.replies_count || 0) * 1;

  // Puntos por seguidor del autor (influencia)
  const followerCount = cast.author?.follower_count || 0;
  if (followerCount > 10000) score += 50;
  else if (followerCount > 1000) score += 20;
  else if (followerCount > 100) score += 10;

  // Puntos por recencia (últimas 24h = más puntos)
  const castTime = new Date(cast.timestamp);
  const hoursAgo = (Date.now() - castTime.getTime()) / (1000 * 60 * 60);
  if (hoursAgo < 1) score += 30;
  else if (hoursAgo < 6) score += 20;
  else if (hoursAgo < 24) score += 10;

  return score;
}

// Detectar palabras clave musicales en el texto
function findMusicKeywords(text: string, keywords: string[]): string[] {
  const textLower = text.toLowerCase();
  return keywords.filter((keyword) =>
    textLower.includes(keyword.toLowerCase())
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const timeWindow = searchParams.get("timeWindow") || "24h"; // 24h, 12h, 6h, 1h

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
    };
    const hoursBack = timeMap[timeWindow as keyof typeof timeMap] || 24;
    const startTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    // Obtener palabras clave dinámicas de la base de datos
    const musicKeywords = await getMusicKeywords();

    // Crear búsquedas dinámicas basadas en datos reales
    const musicSearchQueries = [
      "music OR song OR album OR artist",
      "nft music OR music nft",
      "tuneport",
      "mint music OR music mint",
      ...musicKeywords.slice(0, 10).map((keyword) => `"${keyword}"`), // Top 10 keywords reales
      "beat OR remix OR track",
    ];

    // Ejecutar búsquedas en paralelo
    const searchPromises = musicSearchQueries.map(async (query) => {
      try {
        const response = await fetch(
          `https://api.neynar.com/v2/farcaster/cast/search?q=${encodeURIComponent(
            query
          )}&limit=${Math.ceil(
            limit / musicSearchQueries.length
          )}&start_time=${startTime.toISOString()}`,
          {
            headers: {
              Authorization: `Bearer ${neynarApiKey}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          console.error(
            `Neynar search error for "${query}": ${response.status}`
          );
          return { casts: [] };
        }

        return await response.json();
      } catch (error) {
        console.error(`Error searching for "${query}":`, error);
        return { casts: [] };
      }
    });

    const searchResults = await Promise.all(searchPromises);

    // Combinar y procesar todos los casts
    const allCasts = searchResults.flatMap((result) => result.casts || []);

    // Remover duplicados por hash
    const uniqueCasts = allCasts.reduce((acc: any[], cast: any) => {
      if (!acc.find((c: any) => c.hash === cast.hash)) {
        acc.push(cast);
      }
      return acc;
    }, [] as any[]);

    // Procesar y puntuar cada cast
    const processedCasts: SocialMusicData[] = uniqueCasts
      .map((cast: any) => {
        const foundKeywords = findMusicKeywords(cast.text, musicKeywords);

        // Solo incluir casts que realmente mencionen música
        if (foundKeywords.length === 0) return null;

        const relevanceScore = calculateRelevanceScore(cast, foundKeywords);

        return {
          cast: {
            hash: cast.hash,
            text: cast.text,
            timestamp: cast.timestamp,
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
            embeds: cast.embeds || [],
          },
          musicKeywords: foundKeywords,
          relevanceScore,
        };
      })
      .filter(Boolean) as SocialMusicData[];

    // Ordenar por relevancia y limitar resultados
    const topCasts = processedCasts
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);

    // Estadísticas adicionales
    const stats = {
      totalCastsFound: uniqueCasts.length,
      musicCasts: processedCasts.length,
      avgRelevanceScore:
        processedCasts.length > 0
          ? processedCasts.reduce((sum, cast) => sum + cast.relevanceScore, 0) /
            processedCasts.length
          : 0,
      timeWindow: timeWindow,
      topKeywords: musicKeywords
        .map((keyword) => ({
          keyword,
          count: processedCasts.filter((cast) =>
            cast.musicKeywords.includes(keyword)
          ).length,
        }))
        .filter((item) => item.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    };

    return NextResponse.json({
      success: true,
      data: topCasts,
      stats,
      message: `Found ${topCasts.length} relevant music discussions from Farcaster`,
    });
  } catch (error) {
    console.error("Error in social discovery:", error);

    return NextResponse.json(
      {
        error: "Error fetching social music discovery",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
