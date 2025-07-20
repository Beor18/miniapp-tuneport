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

// Función para crear un cast usando Neynar API con autenticación dinámica
async function createFarcasterCast(castData: CastData, userToken?: string) {
  const neynarApiKey = process.env.NEYNAR_API_KEY;

  if (!neynarApiKey) {
    throw new Error("NEYNAR_API_KEY not configured");
  }

  // Si tenemos un token de usuario (Quick Auth), usarlo para obtener el signer dinámicamente
  if (userToken) {
    try {
      // Verificar el token con Farcaster y obtener información del usuario
      const userResponse = await fetch("https://api.farcaster.xyz/v2/me", {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();

        // Usar la información del usuario autenticado
        const response = await fetch(
          "https://api.neynar.com/v2/farcaster/cast",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${neynarApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: castData.text,
              embeds: castData.embeds || [],
              parent: castData.parent || null,
              // Usar el FID del usuario autenticado
              fid: userData.fid,
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
    } catch (error) {
      console.log("Error con Quick Auth, intentando método fallback:", error);
    }
  }

  // Método fallback usando signer UUID estático (para desarrollo/hackathon)
  const signerUuid = process.env.FARCASTER_SIGNER_UUID;

  if (!signerUuid) {
    throw new Error(
      "FARCASTER_SIGNER_UUID not configured and no user token provided"
    );
  }

  const response = await fetch("https://api.neynar.com/v2/farcaster/cast", {
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
  });

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

    // Extraer token de Quick Auth si está disponible
    const authHeader = request.headers.get("authorization");
    const userToken = authHeader?.replace("Bearer ", "");

    console.log("Creating cast with user token:", !!userToken);

    // Crear el cast usando autenticación dinámica o fallback
    const castResult = await createFarcasterCast(
      {
        text,
        embeds: embeds || [],
        parent,
      },
      userToken
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
      method: userToken ? "quickauth" : "fallback",
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
      `https://api.neynar.com/v2/farcaster/cast?identifier=${castHash}&type=hash`,
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
