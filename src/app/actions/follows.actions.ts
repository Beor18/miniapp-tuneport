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
    console.error("Error checking user:", error);
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
