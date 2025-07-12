"use server";

interface CheckUserInput {
  address?: string;
  address_solana?: string;
}

export async function checkUser({ address, address_solana }: CheckUserInput) {
  try {
    // 🔧 VALIDACIÓN TEMPRANA: Verificar que al menos una dirección válida esté presente
    const hasValidAddress =
      (address && address.trim() !== "") ||
      (address_solana && address_solana.trim() !== "");

    if (!hasValidAddress) {
      console.log(
        "⚠️ [checkUser] No valid addresses provided, skipping API call"
      );
      return false; // Retornar false sin hacer la llamada API
    }

    // Construir la query string con ambas direcciones si están presentes
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
        console.log("ℹ️ [checkUser] User not found in database");
        return false;
      }

      throw new Error(`Error fetching user data. Status: ${response.status}`);
    }

    const user = await response.json();

    // Verificar si se encontró el usuario y comparar las direcciones
    return (
      (address && user.address?.toLowerCase() === address.toLowerCase()) ||
      (address_solana &&
        user.address_solana?.toLowerCase() === address_solana.toLowerCase())
    );
  } catch (error) {
    console.error("❌ [checkUser] Error checking user:", error);
    return false;
  }
}

// Nueva función que retorna los datos completos del usuario
export async function getUserData({ address, address_solana }: CheckUserInput) {
  try {
    // 🔧 VALIDACIÓN TEMPRANA: Verificar que al menos una dirección válida esté presente
    const hasValidAddress =
      (address && address.trim() !== "") ||
      (address_solana && address_solana.trim() !== "");

    if (!hasValidAddress) {
      console.log(
        "⚠️ [getUserData] No valid addresses provided, skipping API call"
      );
      return null; // Retornar null sin hacer la llamada API
    }

    // Construir la query string con ambas direcciones si están presentes
    let queryString = "";
    if (address && address.trim() !== "") {
      queryString += `address=${encodeURIComponent(address.trim())}`;
    }
    if (address_solana && address_solana.trim() !== "") {
      queryString += queryString
        ? `&address_solana=${encodeURIComponent(address_solana.trim())}`
        : `address_solana=${encodeURIComponent(address_solana.trim())}`;
    }

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

    // Verificar si se encontró el usuario y comparar las direcciones
    const isValidUser =
      (address && user.address?.toLowerCase() === address.toLowerCase()) ||
      (address_solana &&
        user.address_solana?.toLowerCase() === address_solana.toLowerCase());

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
