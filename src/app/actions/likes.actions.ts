"use server";

import { revalidatePath } from "next/cache";

interface ToggleLikeInput {
  userId: string;
  nftId: string;
}

interface GetLikeStatusInput {
  userId: string;
  nftId: string;
}

export async function toggleLike({ userId, nftId }: ToggleLikeInput) {
  try {
    const response = await fetch(`${process.env.API_ELEI}/api/nft/like`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, nftId }),
      cache: "no-cache",
    });

    if (!response.ok) {
      throw new Error(`Error toggling like. Status: ${response.status}`);
    }

    const result = await response.json();

    // Revalidar rutas relevantes después del like
    revalidatePath("/");
    revalidatePath("/foryou");
    revalidatePath("/album/[slug]", "page");

    return result;
  } catch (error) {
    console.error("Error toggling like:", error);
    return {
      success: false,
      message: "Error al procesar el like",
    };
  }
}

export async function getLikeStatus({ userId, nftId }: GetLikeStatusInput) {
  try {
    const response = await fetch(
      `${process.env.API_ELEI}/api/nft/${nftId}/likes?userId=${userId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-cache",
      }
    );

    if (!response.ok) {
      throw new Error(`Error getting like status. Status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error getting like status:", error);
    return {
      success: false,
      likesCount: 0,
      isLiked: false,
    };
  }
}
