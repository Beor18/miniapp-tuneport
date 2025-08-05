"use server";

import { revalidatePath } from "next/cache";

interface FollowUserInput {
  nickname: string;
  followerId: string;
  // Parámetros opcionales para Farcaster
  enableFarcaster?: boolean;
  signer_uuid?: string; // Si ya tienes un signer aprobado para este usuario
}

// Constantes de la aplicación
const APP_FID = parseInt("1129898"); // Tu FID de app en Farcaster

interface GetUserInput {
  address?: string;
  address_solana?: string;
}

interface FollowUserFarcasterInput {
  signer_uuid: string;
  target_fids: number[];
}

interface UnfollowUserFarcasterInput {
  signer_uuid: string;
  target_fids: number[];
}

interface CreateSignerResponse {
  signer_uuid: string;
  status: string;
  public_key: string;
  fid: number | null;
  approval_url: string | null;
}

interface RegisterSignedKeyInput {
  signer_uuid: string;
  app_fid: number;
  deadline: number;
  signature: string;
}

export async function getUserByAddress({
  address,
  address_solana,
}: GetUserInput) {
  try {
    // 🔧 VALIDACIÓN TEMPRANA: Verificar que al menos una dirección válida esté presente
    const hasValidAddress =
      (address && address.trim() !== "") ||
      (address_solana && address_solana.trim() !== "");

    if (!hasValidAddress) {
      console.log(
        "⚠️ [getUserByAddress] No valid addresses provided, skipping API call"
      );
      return null; // Retornar null sin hacer la llamada API
    }

    let queryString = "";
    if (address && address.trim() !== "") {
      queryString += `address=${encodeURIComponent(address.trim())}`;
    }
    if (address_solana && address_solana.trim() !== "") {
      queryString += queryString
        ? `&address_solana=${encodeURIComponent(address_solana.trim())}`
        : `address_solana=${encodeURIComponent(address_solana.trim())}`;
    }

    const response = await fetch(
      `${process.env.API_ELEI}/api/users/getUserByAddress?${queryString}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-cache",
      }
    );

    if (!response.ok) {
      // Si es 404 (usuario no encontrado), no es un error crítico
      if (response.status === 404) {
        console.log("ℹ️ [getUserByAddress] User not found in database");
        return null;
      }

      throw new Error(`Error fetching user data. Status: ${response.status}`);
    }

    const user = await response.json();

    if (
      (address && user.address?.toLowerCase() === address.toLowerCase()) ||
      (address_solana &&
        user.address_solana?.toLowerCase() === address_solana.toLowerCase())
    ) {
      return user._id;
    } else {
      return null; // Si no cumple la condición, retorna null
    }
  } catch (error) {
    console.error("❌ [getUserByAddress] Error checking user:", error);
    return null;
  }
}

export async function followUser({
  nickname,
  followerId,
  enableFarcaster = false,
  signer_uuid,
}: FollowUserInput) {
  try {
    // 1. FLUJO ORIGINAL: Follow en tu base de datos (siempre se ejecuta)
    console.log("🔄 [followUser] Iniciando follow en base de datos...");
    const dbResponse = await fetch(
      `${process.env.API_ELEI}/api/users/getUserByNickname?nickname=${nickname}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ followerId }),
      }
    );

    if (!dbResponse.ok) {
      throw new Error("Error al hacer follow en base de datos");
    }

    const dbResult = await dbResponse.json();
    console.log("✅ [followUser] Follow completado en base de datos");

    // 2. FLUJO FARCASTER: Opcional, solo si enableFarcaster = true
    let farcasterResult = null;
    if (enableFarcaster) {
      console.log("🔄 [followUser] Iniciando follow en Farcaster...");

      // Primero obtener el FID del usuario objetivo
      const targetFid = await getUserFidByNickname(nickname);
      if (!targetFid) {
        console.warn("⚠️ [followUser] No se pudo obtener FID para:", nickname);
        return {
          database: dbResult,
          farcaster: {
            error: "Usuario no encontrado en Farcaster",
          },
        };
      }

      // Si ya tienes un signer aprobado, usarlo directamente
      if (signer_uuid) {
        farcasterResult = await followUserFarcaster({
          signer_uuid,
          target_fids: [targetFid],
        });
      } else {
        // Si no tienes signer, crear el flujo completo
        console.log("🔧 [followUser] Creando nuevo signer para Farcaster...");
        const signerFlow = await initiateFarcasterSignerFlow();

        if (signerFlow) {
          console.log(
            "⚠️ [followUser] Signer creado. Usuario debe aprobar en Warpcast:",
            signerFlow.approval_url
          );
          // Aquí retornas la approval_url para que el usuario apruebe
          return {
            database: dbResult,
            farcaster: {
              status: "pending_approval",
              approval_url: signerFlow.approval_url,
              signer_uuid: signerFlow.signer_uuid,
              target_fid: targetFid, // Incluir el FID para usar después
              message:
                "Usuario debe aprobar en Warpcast para completar follow en Farcaster",
            },
          };
        }
      }
    }

    // Revalidar rutas
    revalidatePath("/");

    return {
      database: dbResult,
      farcaster: farcasterResult,
    };
  } catch (error) {
    console.error("❌ [followUser] Error:", error);
    return {
      database: null,
      farcaster: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// ============================================
// FUNCIONES AUXILIARES INTERNAS (NO EXPORTADAS)
// ============================================

/**
 * Obtiene el FID de Farcaster de un usuario por su nickname
 * Primero busca en tu base de datos, luego en Farcaster API si es necesario
 */
async function getUserFidByNickname(nickname: string): Promise<number | null> {
  try {
    // Opción 1: Buscar en tu base de datos si guardas FIDs
    const dbResponse = await fetch(
      `${process.env.API_ELEI}/api/users/getUserByNickname?nickname=${nickname}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (dbResponse.ok) {
      const userData = await dbResponse.json();
      if (userData.farcaster_fid) {
        return userData.farcaster_fid;
      }
    }

    // Opción 2: Buscar en Farcaster API por username
    const farcasterResponse = await fetch(
      `https://api.neynar.com/v2/farcaster/user/by_username?username=${nickname}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEYNAR_API_KEY || "",
        },
      }
    );

    if (farcasterResponse.ok) {
      const farcasterData = await farcasterResponse.json();
      return farcasterData.user?.fid || null;
    }

    console.warn(
      `⚠️ [getUserFidByNickname] No FID encontrado para: ${nickname}`
    );
    return null;
  } catch (error) {
    console.error("❌ [getUserFidByNickname] Error:", error);
    return null;
  }
}

async function followUserFarcaster({
  signer_uuid,
  target_fids,
}: FollowUserFarcasterInput) {
  try {
    const response = await fetch(
      "https://api.neynar.com/v2/farcaster/user/follow/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEYNAR_API_KEY || "",
        },
        body: JSON.stringify({
          signer_uuid,
          target_fids,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Error al seguir usuario en Farcaster. Status: ${response.status}`
      );
    }

    const result = await response.json();

    // Revalidar rutas relevantes
    revalidatePath("/");

    return result;
  } catch (error) {
    console.error("❌ [followUserFarcaster] Error:", error);
    return null;
  }
}

async function unfollowUserFarcaster({
  signer_uuid,
  target_fids,
}: UnfollowUserFarcasterInput) {
  try {
    const response = await fetch(
      "https://api.neynar.com/v2/farcaster/user/follow/",
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEYNAR_API_KEY || "",
        },
        body: JSON.stringify({
          signer_uuid,
          target_fids,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Error al dejar de seguir usuario en Farcaster. Status: ${response.status}`
      );
    }

    const result = await response.json();

    // Revalidar rutas relevantes
    revalidatePath("/");

    return result;
  } catch (error) {
    console.error("❌ [unfollowUserFarcaster] Error:", error);
    return null;
  }
}

/**
 * Función para iniciar el flujo completo de Farcaster
 * Esta función maneja los pasos 1-3 del flujo de signer
 */
async function initiateFarcasterSignerFlow(): Promise<CreateSignerResponse | null> {
  try {
    // Verificar que tengamos APP_FID configurado
    if (!APP_FID || APP_FID === 0) {
      console.error(
        "❌ [initiateFarcasterSignerFlow] FARCASTER_APP_FID no configurado en .env"
      );
      return null;
    }

    // Paso 1: Crear signer
    const signer = await createSigner();
    if (!signer) return null;

    // Paso 2 & 3: Por ahora solo retornamos el signer
    // TODO: Implementar creación y registro de firma cuando tengas tu clave privada
    console.log(
      "⚠️ [initiateFarcasterSignerFlow] Signer creado. APP_FID configurado:",
      APP_FID
    );
    console.log(
      "📝 [initiateFarcasterSignerFlow] Necesitas implementar la creación de firma con tu clave privada de Farcaster"
    );

    return signer;
  } catch (error) {
    console.error("❌ [initiateFarcasterSignerFlow] Error:", error);
    return null;
  }
}

/**
 * Paso 1: Crear un signer en Neynar
 * Documentación: https://docs.neynar.com/docs/write-to-farcaster-with-neynar-managed-signers
 */
async function createSigner(): Promise<CreateSignerResponse | null> {
  try {
    const response = await fetch("https://api.neynar.com/v2/farcaster/signer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.NEYNAR_API_KEY || "",
      },
    });

    if (!response.ok) {
      throw new Error(`Error al crear signer. Status: ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ [createSigner] Signer creado:", result.signer_uuid);

    return result;
  } catch (error) {
    console.error("❌ [createSigner] Error:", error);
    return null;
  }
}

/**
 * Paso 3: Registrar la clave firmada con Neynar
 * Nota: El paso 2 (crear la firma) debe hacerse en el cliente con la clave privada de la app
 */
async function registerSignedKey({
  signer_uuid,
  app_fid,
  deadline,
  signature,
}: RegisterSignedKeyInput): Promise<CreateSignerResponse | null> {
  try {
    const response = await fetch(
      "https://api.neynar.com/v2/farcaster/signer/signed_key",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEYNAR_API_KEY || "",
        },
        body: JSON.stringify({
          signer_uuid,
          app_fid,
          deadline,
          signature,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Error al registrar clave firmada. Status: ${response.status}`
      );
    }

    const result = await response.json();
    console.log("✅ [registerSignedKey] Clave registrada para:", signer_uuid);

    return result;
  } catch (error) {
    console.error("❌ [registerSignedKey] Error:", error);
    return null;
  }
}

/**
 * Paso 4 y 6: Verificar el estado del signer (polling)
 * Estados: 'generated' -> 'pending_approval' -> 'approved'
 */
async function getSignerStatus(
  signer_uuid: string
): Promise<CreateSignerResponse | null> {
  try {
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/signer?signer_uuid=${signer_uuid}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEYNAR_API_KEY || "",
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Error al obtener estado del signer. Status: ${response.status}`
      );
    }

    const result = await response.json();
    console.log(
      `📡 [getSignerStatus] Estado de ${signer_uuid}:`,
      result.status
    );

    return result;
  } catch (error) {
    console.error("❌ [getSignerStatus] Error:", error);
    return null;
  }
}

/**
 * Función auxiliar para hacer polling del estado del signer hasta que sea aprobado
 * Útil después de presentar la approval_url al usuario
 */
async function pollSignerUntilApproved(
  signer_uuid: string,
  maxAttempts: number = 30,
  intervalMs: number = 2000
): Promise<CreateSignerResponse | null> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const signerStatus = await getSignerStatus(signer_uuid);

    if (!signerStatus) {
      console.error("❌ [pollSignerUntilApproved] Error al obtener estado");
      return null;
    }

    if (signerStatus.status === "approved") {
      console.log("🎉 [pollSignerUntilApproved] Signer aprobado!");
      return signerStatus;
    }

    if (signerStatus.status === "revoked") {
      console.log("⚠️ [pollSignerUntilApproved] Signer revocado");
      return null;
    }

    console.log(
      `⏳ [pollSignerUntilApproved] Esperando aprobación... (${
        attempts + 1
      }/${maxAttempts})`
    );

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    attempts++;
  }

  console.log("⏰ [pollSignerUntilApproved] Timeout esperando aprobación");
  return null;
}

// ============================================
// FUNCIONES EXPORTADAS PARA COMPLETAR FLUJO
// ============================================

/**
 * Función para completar el follow en Farcaster después de que el usuario apruebe el signer
 * Se llama después de que el usuario apruebe en Warpcast
 */
export async function completeFollowFarcaster(
  signer_uuid: string,
  nickname: string // Obtiene el FID automáticamente desde el nickname
) {
  try {
    // Verificar que el signer esté aprobado
    const signerStatus = await getSignerStatus(signer_uuid);

    if (!signerStatus || signerStatus.status !== "approved") {
      return {
        success: false,
        error:
          "Signer no está aprobado. Estado actual: " +
          (signerStatus?.status || "desconocido"),
      };
    }

    // Obtener el FID del usuario objetivo
    const targetFid = await getUserFidByNickname(nickname);
    if (!targetFid) {
      return {
        success: false,
        error: `No se pudo obtener FID para el usuario: ${nickname}`,
      };
    }

    // Hacer el follow en Farcaster
    const result = await followUserFarcaster({
      signer_uuid,
      target_fids: [targetFid],
    });

    revalidatePath("/");

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("❌ [completeFollowFarcaster] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Función para verificar el estado de un signer (usar para polling desde el cliente)
 */
export async function checkSignerStatus(signer_uuid: string) {
  try {
    const status = await getSignerStatus(signer_uuid);
    return {
      success: true,
      data: status,
    };
  } catch (error) {
    console.error("❌ [checkSignerStatus] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Función para dejar de seguir usuario (simétrica a followUser)
 */
export async function unfollowUser({
  nickname,
  followerId,
  enableFarcaster = false,
  signer_uuid,
}: FollowUserInput) {
  try {
    // 1. FLUJO ORIGINAL: Unfollow en tu base de datos (siempre se ejecuta)
    console.log("🔄 [unfollowUser] Iniciando unfollow en base de datos...");
    const dbResponse = await fetch(
      `${process.env.API_ELEI}/api/users/unfollowUserByNickname?nickname=${nickname}`,
      {
        method: "DELETE", // o POST, dependiendo de tu API
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ followerId }),
      }
    );

    if (!dbResponse.ok) {
      throw new Error("Error al hacer unfollow en base de datos");
    }

    const dbResult = await dbResponse.json();
    console.log("✅ [unfollowUser] Unfollow completado en base de datos");

    // 2. FLUJO FARCASTER: Opcional, solo si enableFarcaster = true y tienes signer
    let farcasterResult = null;
    if (enableFarcaster && signer_uuid) {
      console.log("🔄 [unfollowUser] Iniciando unfollow en Farcaster...");

      // Obtener el FID del usuario objetivo
      const targetFid = await getUserFidByNickname(nickname);
      if (!targetFid) {
        console.warn(
          "⚠️ [unfollowUser] No se pudo obtener FID para:",
          nickname
        );
        return {
          database: dbResult,
          farcaster: {
            error: "Usuario no encontrado en Farcaster",
          },
        };
      }

      // Hacer unfollow en Farcaster
      farcasterResult = await unfollowUserFarcaster({
        signer_uuid,
        target_fids: [targetFid],
      });
    }

    // Revalidar rutas
    revalidatePath("/");

    return {
      database: dbResult,
      farcaster: farcasterResult,
    };
  } catch (error) {
    console.error("❌ [unfollowUser] Error:", error);
    return {
      database: null,
      farcaster: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
