import { NextRequest, NextResponse } from "next/server";

// Interfaces para los datos del cast
interface CastEmbed {
  url?: string;
  castId?: {
    fid: number;
    hash: string;
  };
}

interface CastData {
  text: string;
  embeds?: CastEmbed[];
  parent?: string; // Para respuestas a casts
}

// Función para crear un cast usando Neynar API
async function createFarcasterCast(castData: CastData, signerUuid: string) {
  const neynarApiKey = process.env.NEYNAR_API_KEY;

  if (!neynarApiKey) {
    throw new Error("NEYNAR_API_KEY not configured");
  }

  const response = await fetch(
    "https://snapchain-api.neynar.com/v2/farcaster/cast",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${neynarApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        signer_uuid: signerUuid,
        text: castData.text,
        embeds: castData.embeds || [],
        parent: castData.parent || null,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Neynar API error: ${response.status} - ${
        errorData.message || "Unknown error"
      }`
    );
  }

  return await response.json();
}

export async function POST(request: NextRequest) {
  try {
    const { text, embeds, parent }: CastData = await request.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "El texto del cast es requerido" },
        { status: 400 }
      );
    }

    // Validar longitud del texto (máximo 320 caracteres para Farcaster)
    if (text.length > 320) {
      return NextResponse.json(
        { error: "El texto del cast no puede exceder 320 caracteres" },
        { status: 400 }
      );
    }

    // Obtener el signer UUID del usuario autenticado
    // Esto debe venir del contexto de autenticación de Farcaster Mini App
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Token de autenticación requerido" },
        { status: 401 }
      );
    }

    // Extraer el token y obtener el signer UUID
    // En una implementación real, aquí validarías el token y obtendrías el signer UUID
    // del contexto del usuario autenticado
    const token = authHeader.replace("Bearer ", "");

    // TODO: Implementar validación real del token y obtención del signer UUID
    // Por ahora, necesitaremos configurar esto según tu sistema de autenticación
    const signerUuid = process.env.FARCASTER_SIGNER_UUID;

    if (!signerUuid) {
      return NextResponse.json(
        { error: "Signer UUID no configurado" },
        { status: 500 }
      );
    }

    // Crear el cast usando Neynar API
    const castResult = await createFarcasterCast(
      {
        text,
        embeds: embeds || [],
        parent,
      },
      signerUuid
    );

    // Construir URL del cast para Warpcast
    const castUrl = `https://warpcast.com/~/conversations/${castResult.cast.hash}`;

    return NextResponse.json({
      success: true,
      cast: {
        hash: castResult.cast.hash,
        text: castResult.cast.text,
        embeds: castResult.cast.embeds || [],
        url: castUrl,
        warpcastUrl: castUrl,
      },
      castUrl,
      message: "Cast creado exitosamente",
    });
  } catch (error) {
    console.error("Error creating Farcaster cast:", error);

    return NextResponse.json(
      {
        error: "Error al crear el cast",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

// Endpoint para obtener información de un cast
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const castHash = searchParams.get("hash");

    if (!castHash) {
      return NextResponse.json(
        { error: "Hash del cast requerido" },
        { status: 400 }
      );
    }

    const neynarApiKey = process.env.NEYNAR_API_KEY;

    if (!neynarApiKey) {
      return NextResponse.json(
        { error: "NEYNAR_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Obtener información del cast usando Neynar API
    const response = await fetch(
      `https://snapchain-api.neynar.com/v2/farcaster/cast?identifier=${castHash}&type=hash`,
      {
        headers: {
          Authorization: `Bearer ${neynarApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Neynar API error: ${response.status}`);
    }

    const castData = await response.json();
    const cast = castData.cast;

    return NextResponse.json({
      cast: {
        hash: cast.hash,
        text: cast.text,
        author: {
          fid: cast.author.fid,
          username: cast.author.username,
          displayName: cast.author.display_name,
          pfp: cast.author.pfp_url,
        },
        timestamp: cast.timestamp,
        replies: cast.replies?.count || 0,
        recasts: cast.reactions?.recasts_count || 0,
        likes: cast.reactions?.likes_count || 0,
        embeds: cast.embeds || [],
      },
    });
  } catch (error) {
    console.error("Error fetching cast:", error);

    return NextResponse.json(
      {
        error: "Error al obtener el cast",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
