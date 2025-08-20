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
    let localArtists: any[] = []; // Artistas sin Farcaster de nuestra BD

    try {
      const fidsResponse = await fetch(
        `${process.env.API_ELEI}/api/users/getUserFids?limit=${limit}`,
        {
          cache: "no-store",
        }
      );

      if (fidsResponse.ok) {
        const fidsData = await fidsResponse.json();
        realUserFids = fidsData.fids || [];
        diagnostics = fidsData.diagnostics || {};
        realUserNickname = fidsData.users.map((user: any) => user) || [];

        // 🎨 OBTENER ARTISTAS SIN FARCASTER usando endpoint getUser separado
        try {
          const allUsersResponse = await fetch(
            `${process.env.API_ELEI}/api/users/getUser`,
            {
              cache: "no-store",
            }
          );

          if (allUsersResponse.ok) {
            const allUsers = await allUsersResponse.json();

            // Filtrar artistas que NO tienen FID de Farcaster
            localArtists = allUsers.filter((user: any) => {
              const hasNoFarcaster = !user.farcaster_fid;
              const isArtist = user.type === "artist";

              return hasNoFarcaster && isArtist;
            });

            console.log(
              `🎨 De ${allUsers.length} usuarios totales, encontrados ${localArtists.length} artistas sin Farcaster`
            );
          } else {
            console.warn(
              "⚠️ Error obteniendo todos los usuarios:",
              allUsersResponse.status
            );
          }
        } catch (getAllUsersError) {
          console.error(
            "❌ Error fetching all users for local artists:",
            getAllUsersError
          );
        }

        console.log(
          `✅ Obtenidos ${realUserFids.length} FIDs reales de la BD:`,
          realUserFids.slice(0, 5)
        );
        console.log(
          `🎨 Extraídos ${localArtists.length} artistas locales sin Farcaster`
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
      `🎯 Usando usuarios reales: ${fidsToUse.length} FIDs de Farcaster + ${localArtists.length} artistas locales`
    );

    // Si no hay usuarios reales ni artistas locales, retornar error específico
    if (fidsToUse.length === 0 && localArtists.length === 0) {
      return NextResponse.json(
        {
          error: "No hay artistas registrados",
          message: "Aún no hay artistas registrados en el leaderboard",
        },
        { status: 404 }
      );
    }

    // 🎭 PROCESAR USUARIOS DE FARCASTER (si existen)
    let farcasterUsers: any[] = [];

    if (fidsToUse.length > 0) {
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

      if (neynarResponse.ok) {
        const farcasterData = await neynarResponse.json();
        farcasterUsers = farcasterData.users || [];
        console.log(
          `✅ Obtenidos ${farcasterUsers.length} usuarios de Farcaster`
        );
      } else {
        console.warn(
          `⚠️ Error fetching Farcaster users: ${neynarResponse.status}`
        );
      }
    }

    // 🔗 PROCESAR USUARIOS DE FARCASTER CON DIRECCIONES VERIFICADAS
    const farcasterUsersWithAddresses = farcasterUsers
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
      .filter((user: any) => user.address); // Solo usuarios con dirección válida

    console.log(
      `🔗 Usuarios de Farcaster con direcciones: ${farcasterUsersWithAddresses.length}`
    );

    // 🎨 PROCESAR ARTISTAS LOCALES (sin Farcaster)
    const localArtistsFormatted = localArtists
      .filter((artist: any) => artist.address) // Solo artistas con dirección válida
      .map((artist: any) => {
        const formatted = {
          // Formatear como usuario estándar para el leaderboard
          address: artist.address,
          nickname: artist.nickname,
          displayName: artist.name || artist.nickname,
          fid: null, // No tiene FID de Farcaster
          pfp: artist.picture,
          verified: artist.verified || false,
          powerBadge: false, // No aplica para usuarios locales
          followerCount: artist.followers?.length || 0,
          neynarScore: 0, // No aplica para usuarios locales
          type: "local_artist",
          localFollowing: artist.followers?.length || 0, // Following interno de la plataforma
        };

        console.log(
          `🎨 Artista local formateado: ${formatted.nickname} (${formatted.followerCount} followers)`
        );
        return formatted;
      });

    console.log(
      `🎨 Artistas locales formateados: ${localArtistsFormatted.length}`
    );

    // 🔀 COMBINAR AMBAS LISTAS
    const allUsers = [...farcasterUsersWithAddresses, ...localArtistsFormatted];

    if (allUsers.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron artistas con datos válidos" },
        { status: 404 }
      );
    }

    console.log("nicknamesToUse: ", nicknamesToUse);

    // Crear mapa de FID -> nickname desde la BD
    const dbNicknameMap = new Map<string, string>();
    nicknamesToUse.forEach((userData: any) => {
      if (userData.fid && userData.nickname) {
        dbNicknameMap.set(userData.fid, userData.nickname);
      }
    });

    // 📊 PREPARAR DATOS PARA EL LEADERBOARD (combinando Farcaster + artistas locales)
    const leaderboardData = allUsers
      .map((user: any) => {
        // Para usuarios de Farcaster
        if (user.fid) {
          // Buscar nickname de la BD primero, luego fallback a Farcaster
          const dbNickname = dbNicknameMap.get(user.fid);

          return {
            address: user.address,
            nickname: dbNickname || user.username || "Unknown",
            nicknameVerified: user.username, // Username verificado de Farcaster
            displayName:
              user.display_name || dbNickname || user.username || "Unknown",
            fid: user.fid,
            pfp: user.pfp_url,
            verified: !!user.verified_addresses?.eth_addresses?.length,
            powerBadge: user.power_badge || false,
            followerCount: user.follower_count || 0,
            neynarScore: user.experimental?.neynar_user_score || 0,
            type: user.type || "farcaster_user",
            localFollowing: 0, // Los usuarios de Farcaster no tienen following local específico
          };
        } else {
          // Para artistas locales (sin Farcaster)
          return {
            address: user.address,
            nickname: user.nickname || "Unknown",
            nicknameVerified: null, // No tienen username verificado de Farcaster
            displayName: user.displayName || user.nickname || "Unknown",
            fid: null,
            pfp: user.pfp,
            verified: user.verified,
            powerBadge: false,
            followerCount: user.followerCount,
            neynarScore: 0,
            type: "local_artist",
            localFollowing: user.localFollowing, // Following interno de la plataforma
          };
        }
      })
      // 🔄 ORDENAR: Primero por following local (para artistas locales), luego por follower count
      .sort((a, b) => {
        // Si ambos son artistas locales, ordenar por following local
        if (a.type === "local_artist" && b.type === "local_artist") {
          return b.localFollowing - a.localFollowing;
        }
        // Si uno es local y otro de Farcaster, priorizar el que tenga más seguidores total
        if (a.type === "local_artist" && b.type !== "local_artist") {
          return b.followerCount - a.localFollowing;
        }
        if (a.type !== "local_artist" && b.type === "local_artist") {
          return b.localFollowing - a.followerCount;
        }
        // Si ambos son de Farcaster, ordenar por follower count
        return b.followerCount - a.followerCount;
      })
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      users: leaderboardData,
      addresses: leaderboardData.map((u: any) => u.address),
      stats: {
        farcasterUsers: farcasterUsersWithAddresses.length,
        localArtists: localArtistsFormatted.length,
        totalUsers: leaderboardData.length,
      },
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
