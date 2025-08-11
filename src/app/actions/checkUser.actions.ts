"use server";

interface CheckUserInput {
  address?: string;
  address_solana?: string;
  farcaster_username?: string;
  nickname?: string;
}

export async function checkUser({
  address,
  address_solana,
  farcaster_username,
  nickname,
}: CheckUserInput) {
  try {
    // 🔧 VALIDACIÓN TEMPRANA: Verificar que al menos un parámetro válido esté presente
    const hasValidParam =
      (address && address.trim() !== "") ||
      (address_solana && address_solana.trim() !== "") ||
      (farcaster_username && farcaster_username.trim() !== "") ||
      (nickname && nickname.trim() !== "");

    if (!hasValidParam) {
      console.log(
        "⚠️ [checkUser] No valid parameters provided, skipping API call"
      );
      return false; // Retornar false sin hacer la llamada API
    }

    // Construir la query string con todos los parámetros disponibles
    const queryParams: string[] = [];
    if (address && address.trim() !== "") {
      queryParams.push(`address=${encodeURIComponent(address.trim())}`);
    }
    if (address_solana && address_solana.trim() !== "") {
      queryParams.push(
        `address_solana=${encodeURIComponent(address_solana.trim())}`
      );
    }
    if (farcaster_username && farcaster_username.trim() !== "") {
      queryParams.push(
        `farcaster_username=${encodeURIComponent(farcaster_username.trim())}`
      );
    }
    if (nickname && nickname.trim() !== "") {
      queryParams.push(`nickname=${encodeURIComponent(nickname.trim())}`);
    }

    const queryString = queryParams.join("&");

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
        console.log("ℹ️ [checkUser] User not found in database");
        return false;
      }

      throw new Error(`Error fetching user data. Status: ${response.status}`);
    }

    const user = await response.json();

    // Verificar si se encontró el usuario y comparar todos los campos proporcionados
    return (
      (address && user.address?.toLowerCase() === address.toLowerCase()) ||
      (address_solana &&
        user.address_solana?.toLowerCase() === address_solana.toLowerCase()) ||
      (farcaster_username &&
        user.farcaster_username?.toLowerCase() ===
          farcaster_username.toLowerCase()) ||
      (nickname && user.nickname?.toLowerCase() === nickname.toLowerCase())
    );
  } catch (error) {
    console.error("❌ [checkUser] Error checking user:", error);
    return false;
  }
}

// Nueva función que retorna los datos completos del usuario
export async function getUserData({
  address,
  address_solana,
  farcaster_username,
  nickname,
}: CheckUserInput) {
  try {
    // 🔧 VALIDACIÓN TEMPRANA: Verificar que al menos un parámetro válido esté presente
    const hasValidParam =
      (address && address.trim() !== "") ||
      (address_solana && address_solana.trim() !== "") ||
      (farcaster_username && farcaster_username.trim() !== "") ||
      (nickname && nickname.trim() !== "");

    if (!hasValidParam) {
      console.log(
        "⚠️ [getUserData] No valid parameters provided, skipping API call"
      );
      return null; // Retornar null sin hacer la llamada API
    }

    // Construir la query string con todos los parámetros disponibles
    const queryParams: string[] = [];
    if (address && address.trim() !== "") {
      queryParams.push(`address=${encodeURIComponent(address.trim())}`);
    }
    if (address_solana && address_solana.trim() !== "") {
      queryParams.push(
        `address_solana=${encodeURIComponent(address_solana.trim())}`
      );
    }
    if (farcaster_username && farcaster_username.trim() !== "") {
      queryParams.push(
        `farcaster_username=${encodeURIComponent(farcaster_username.trim())}`
      );
    }
    if (nickname && nickname.trim() !== "") {
      queryParams.push(`nickname=${encodeURIComponent(nickname.trim())}`);
    }

    const queryString = queryParams.join("&");

    console.log(
      `🔍 [getUserData] Fetching user data with query: ${queryString}`
    );

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
        console.log("ℹ️ [getUserData] User not found in database");
        return null;
      }

      throw new Error(`Error fetching user data. Status: ${response.status}`);
    }

    const user = await response.json();

    // Verificar si se encontró el usuario y comparar todos los campos proporcionados
    const isValidUser =
      (address && user.address?.toLowerCase() === address.toLowerCase()) ||
      (address_solana &&
        user.address_solana?.toLowerCase() === address_solana.toLowerCase()) ||
      (farcaster_username &&
        user.farcaster_username?.toLowerCase() ===
          farcaster_username.toLowerCase()) ||
      (nickname && user.nickname?.toLowerCase() === nickname.toLowerCase());

    if (isValidUser) {
      console.log(
        `✅ [getUserData] User found: ${
          user.nickname || user.name || "No name"
        }`
      );
      return user; // Retorna todos los datos del usuario
    }

    console.log("⚠️ [getUserData] User found but address mismatch");
    return null;
  } catch (error) {
    console.error("❌ [getUserData] Error getting user data:", error);
    return null;
  }
}
