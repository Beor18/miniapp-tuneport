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

    // FIDs de usuarios conocidos de Farcaster para testing
    const sampleFids = [3, 5, 2, 602, 1, 280, 99, 190, 6806, 13242]; // dwr, vitalik, etc.

    // Construir URL con FIDs codificados correctamente
    const fidsParam = sampleFids.slice(0, limit).join("%2C%20"); // URL encoded comma-space
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

    // Preparar datos para el leaderboard
    const leaderboardData = usersWithAddresses.map((user: any) => ({
      address: user.address,
      nickname: user.username || "Unknown",
      displayName: user.display_name || user.username,
      fid: user.fid,
      pfp: user.pfp_url,
      verified: !!user.verified_addresses?.eth_addresses?.length,
      powerBadge: user.power_badge || false,
      followerCount: user.follower_count || 0,
      neynarScore: user.experimental?.neynar_user_score || 0,
    }));

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
