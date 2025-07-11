"use server";

export async function submitCollectionToServer(collectionData: {
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
  candy_machine: string;
  community: string;
  collaborators: any;
  music_genre?: any;
  collection_type?: any;
  artist_name?: any;
  record_label?: any;
  release_date?: any;
  start_mint_date?: any;
  is_premium?: any;
}) {
  try {
    const response = await fetch(
      `${process.env.API_ELEI}/api/collections/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(collectionData),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Error al crear la colección en el servidor. Status: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al enviar la colección al servidor:", error);
    throw new Error("Error al enviar la colección al servidor");
  }
}
