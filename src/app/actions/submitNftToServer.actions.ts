"use server";

interface NftAttributes {
  trait_type: string;
  value: string;
}

interface NftProperties {
  simple_property: string;
  rich_property: {
    name: string;
    value: string;
    display_value: string;
    class: string;
    css: {
      color: string;
      "font-weight": string;
      "text-decoration": string;
    };
  };
  array_property: {
    name: string;
    value: number[];
    class: string;
  };
}

interface NftData {
  collectionId: string;
  candy_machine: string;
  id_item: number;
  name: string;
  description: string;
  image?: string;
  music?: string;
  video?: string;
  copies?: number;
  price?: number;
  currency?: string;
  owner?: string;
  listed_by?: string;
  for_sale?: number;
  metadata_uri?: string;
  attributes?: NftAttributes[];
  properties?: NftProperties;
  artist_address_mint?: any;
}

export async function submitNftToServer(nftData: NftData) {
  try {
    console.log("Enviando NFT al servidor:", nftData);
    console.log(
      "URL del servidor:",
      `${process.env.NEXT_PUBLIC_API_URL}/api/nfts/create`
    );

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/nfts/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nftData),
      }
    );

    console.log(
      "Respuesta del servidor:",
      response.status,
      response.statusText
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Error del servidor:", errorData);
      throw new Error(
        `Error al crear el NFT en el servidor. Status: ${response.status}. ${
          errorData.error || errorData.message || "Sin detalles"
        }`
      );
    }

    const data = await response.json();
    console.log("NFT creado exitosamente:", data);
    return data;
  } catch (error) {
    console.error("Error detallado al enviar el NFT al servidor:", error);
    if (error instanceof Error) {
      throw new Error(`Error al enviar el NFT al servidor: ${error.message}`);
    } else {
      throw new Error("Error desconocido al enviar el NFT al servidor");
    }
  }
}
