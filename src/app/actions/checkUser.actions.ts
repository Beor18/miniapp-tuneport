"use server";

interface CheckUserInput {
  address?: string;
  address_solana?: string;
}

export async function checkUser({ address, address_solana }: CheckUserInput) {
  try {
    // Construir la query string con ambas direcciones si están presentes
    let queryString = "";
    if (address) {
      queryString += `address=${address}`;
    }
    if (address_solana) {
      queryString += queryString
        ? `&address_solana=${address_solana}`
        : `address_solana=${address_solana}`;
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
      throw new Error(`Error fetching user data. Status: ${response.status}`);
    }

    const user = await response.json();

    // Verificar si se encontró el usuario y comparar las direcciones
    return (
      user.address?.toLowerCase() === address?.toLowerCase() ||
      user.address_solana?.toLowerCase() === address_solana?.toLowerCase()
    );
  } catch (error) {
    console.error("Error checking user:", error);
    return false;
  }
}

// Nueva función que retorna los datos completos del usuario
export async function getUserData({ address, address_solana }: CheckUserInput) {
  try {
    // Construir la query string con ambas direcciones si están presentes
    let queryString = "";
    if (address) {
      queryString += `address=${address}`;
    }
    if (address_solana) {
      queryString += queryString
        ? `&address_solana=${address_solana}`
        : `address_solana=${address_solana}`;
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
      throw new Error(`Error fetching user data. Status: ${response.status}`);
    }

    const user = await response.json();

    // Verificar si se encontró el usuario y comparar las direcciones
    const isValidUser =
      user.address?.toLowerCase() === address?.toLowerCase() ||
      user.address_solana?.toLowerCase() === address_solana?.toLowerCase();

    if (isValidUser) {
      return user; // Retorna todos los datos del usuario
    }

    return null;
  } catch (error) {
    console.error("Error getting user data:", error);
    return null;
  }
}
