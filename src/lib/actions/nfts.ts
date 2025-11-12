"use server";

/**
 * Server action para buscar NFTs
 * Llama al API de elei-marketplace
 */
export async function searchNFTs(query: string) {
  try {
    const response = await fetch(
      `${process.env.API_ELEI}/api/nft/search?query=${encodeURIComponent(
        query
      )}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error("Error searching NFTs");
    }

    const result = await response.json();

    return {
      success: result.success || true,
      data: result.nfts || [],
      error: null,
    };
  } catch (error) {
    console.error("Error in searchNFTs action:", error);
    return {
      success: false,
      data: [],
      error: "Error al buscar NFTs",
    };
  }
}
