"use server";

import { revalidatePath } from "next/cache";

type BaseCollectionData = {
  name: string;
  symbol: string;
  address_creator_collection: string;
  address_collection: string;
  description: string;
  max_items: number;
  image_cover: string;
  slug: string;
  network: string;
  mint_price: number;
  mint_currency: string;
  base_url_image: string;
  community: string;
  collaborators: any[];
  music_genre: string;
  collection_type: string;
  artist_name: string;
  record_label?: string;
  release_date?: string;
  start_mint_date?: string;
  tokenURI?: string;
  is_premium?: boolean;
  nickname?: string;
  coin_address?: string; // Dirección del token creado con Zora SDK
};

export async function submitBaseCollectionToServer(
  collectionData: BaseCollectionData
) {
  try {
    console.log("Enviando colección Base al servidor:", collectionData);

    // Llamar a la API para crear la colección en la base de datos
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/collections/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...collectionData,
          // Campos específicos para Base
          network: "base",
          blockchain: "base",
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Error al crear la colección: ${error.message || "Error desconocido"}`
      );
    }

    const data = await response.json();
    console.log("Colección Base creada exitosamente:", data);

    // Revalidar las rutas para actualizar los datos en la UI
    revalidatePath("/dashboard");
    revalidatePath(`/albums/${collectionData.slug}`);

    // Revalidar el perfil del usuario si tenemos el nickname
    if (collectionData.nickname) {
      revalidatePath(`/u/${collectionData.nickname}`);
    }

    // También revalidar la página de explorar para que aparezcan las nuevas colecciones
    revalidatePath("/explore");
    revalidatePath("/");

    return {
      success: true,
      data: data,
      message: "Colección Base creada exitosamente",
    };
  } catch (err) {
    console.error("Error al crear la colección Base:", err);
    return {
      success: false,
      message:
        err instanceof Error
          ? err.message
          : "Error desconocido al crear la colección",
    };
  }
}
