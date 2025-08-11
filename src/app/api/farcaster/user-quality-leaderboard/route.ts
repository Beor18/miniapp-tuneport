import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 20);

    const neynarApiKey = process.env.NEYNAR_API_KEY;

    if (!neynarApiKey) {
      return NextResponse.json(
        { error: "NEYNAR_API_KEY not configured" },
        { status: 500 }
      );
    }

    // 🆕 OBTENER FIDs REALES DE USUARIOS REGISTRADOS EN NUESTRA BD
    let realUserFids: number[] = [];
    let realUserNickname: string[] = [];
    let diagnostics: any = {};

    try {
      const fidsResponse = await fetch(
        `${process.env.API_ELEI}/api/users/getUserFids?limit=${limit}`
      );

      if (fidsResponse.ok) {
        const fidsData = await fidsResponse.json();
        realUserFids = fidsData.fids || [];
        diagnostics = fidsData.diagnostics || {};
        realUserNickname = fidsData.users.map((user: any) => user) || [];
        console.log(
          `✅ Obtenidos ${realUserFids.length} FIDs reales de la BD:`,
          realUserFids.slice(0, 5)
        );

        if (diagnostics.totalUsers || diagnostics.usersWithAnyFarcasterData) {
          console.log(
            `📊 Diagnóstico BD: ${diagnostics.totalUsers} usuarios totales, ${diagnostics.usersWithAnyFarcasterData} con datos Farcaster`
          );
        }
      } else {
        const errorData = await fidsResponse.json().catch(() => ({}));
        console.warn(
          "⚠️ Error obteniendo FIDs de BD:",
          fidsResponse.status,
          errorData
        );
      }
    } catch (error) {
      console.error("❌ Error fetching user FIDs from BD:", error);
    }

    // Solo usar usuarios reales de la base de datos
    const fidsToUse = realUserFids;
    const nicknamesToUse = realUserNickname;

    console.log(
      `🎯 Usando SOLO usuarios reales: ${fidsToUse.length} FIDs de la BD`
    );

    // Si no hay usuarios reales, retornar error específico
    if (fidsToUse.length === 0) {
      return NextResponse.json(
        {
          error: "No hay usuarios de Farcaster registrados",
          message:
            "Registra tu cuenta de Farcaster para aparecer en el leaderboard",
        },
        { status: 404 }
      );
    }

    // Construir URL con FIDs codificados correctamente
    const fidsParam = fidsToUse.join("%2C%20"); // URL encoded comma-space
    const url = `https://api.neynar.com/v2/farcaster/user/bulk/?fids=${fidsParam}`;

    // Obtener datos de usuarios de Farcaster usando Neynar API
    const neynarResponse = await fetch(url, {
      method: "GET",
      headers: {
        "x-api-key": neynarApiKey,
        "x-neynar-experimental": "false",
      },
    });

    if (!neynarResponse.ok) {
      throw new Error(
        `Error fetching Farcaster users: ${neynarResponse.status}`
      );
    }

    const farcasterData = await neynarResponse.json();
    const users = farcasterData.users;

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron usuarios de Farcaster" },
        { status: 404 }
      );
    }

    // Extraer direcciones verificadas de usuarios de Farcaster
    const usersWithAddresses = users
      .filter(
        (user: any) =>
          user.verified_addresses?.eth_addresses?.length > 0 ||
          user.verifications?.length > 0
      )
      .map((user: any) => {
        // Priorizar verified_addresses, luego verifications como fallback
        const address =
          user.verified_addresses?.eth_addresses?.[0] ||
          user.verifications?.[0] ||
          user.custody_address;

        return {
          ...user,
          address,
        };
      })
      .filter((user: any) => user.address) // Solo usuarios con dirección válida
      .slice(0, limit);

    if (usersWithAddresses.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron direcciones verificadas" },
        { status: 404 }
      );
    }

    console.log("nicknamesToUse: ", nicknamesToUse);

    // Crear mapa de address -> nickname desde la BD
    const dbNicknameMap = new Map<string, string>();
    nicknamesToUse.forEach((userData: any) => {
      if (userData.fid && userData.nickname) {
        dbNicknameMap.set(userData.fid, userData.nickname);
      }
    });

    // Preparar datos para el leaderboard
    const leaderboardData = usersWithAddresses.map((user: any) => {
      // Buscar nickname de la BD primero, luego fallback a Farcaster
      const dbNickname = dbNicknameMap.get(user.fid);

      return {
        address: user.address,
        nickname: dbNickname || user.username || "Unknown", // Nickname de BD o fallback a Farcaster
        nicknameVerified: user.username, // Username verificado de Farcaster
        displayName:
          user.display_name || dbNickname || user.username || "Unknown",
        fid: user.fid,
        pfp: user.pfp_url,
        verified: !!user.verified_addresses?.eth_addresses?.length,
        powerBadge: user.power_badge || false,
        followerCount: user.follower_count || 0,
        neynarScore: user.experimental?.neynar_user_score || 0,
      };
    });

    return NextResponse.json({
      success: true,
      users: leaderboardData,
      addresses: usersWithAddresses.map((u: any) => u.address),
    });
  } catch (error) {
    console.error("Error creating Farcaster quality leaderboard:", error);

    return NextResponse.json(
      {
        error: "Error al obtener el leaderboard de Farcaster",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
