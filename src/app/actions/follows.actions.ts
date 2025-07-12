"use server";

import { revalidatePath } from "next/cache";

interface FollowUserInput {
  nickname: string;
  followerId: string;
}

interface GetUserInput {
  address?: string;
  address_solana?: string;
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

export async function followUser({ nickname, followerId }: FollowUserInput) {
  try {
    // console.log("followerId: ", followerId);
    // console.log("nickname: ", nickname);
    const response = await fetch(
      `${process.env.API_ELEI}/api/users/getUserByNickname?nickname=${nickname}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ followerId }),
      }
    );

    if (!response.ok) {
      throw new Error("Error al hacer follow");
    }

    const result = await response.json();

    // Opcional: Si necesitas revalidar alguna ruta tras el follow
    revalidatePath("/");

    return result;
  } catch (error) {
    console.error("Error al hacer follow:", error);
    return null;
  }
}
