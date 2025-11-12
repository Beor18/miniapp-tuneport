import CardMusicHome from "@Src/components/cardMusicHome";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "For you | Tuneport",
  description:
    "Where every second of music becomes value. Platform music in web3",
  openGraph: {
    images: ["https://miniapp.tuneport.xyz/preview.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tuneport",
    description:
      "Where every second of music becomes value. Platform music in web3",
    siteId: "1467726470533754880",
    creator: "Tuneport",
    creatorId: "1467726470533754880",
    images: ["https://miniapp.tuneport.xyz/preview.png"],
  },
};

// 🚀 OPTIMIZACIÓN: Revalidar cada 30 segundos en lugar de no cachear
// Esto reduce drásticamente los fetches repetidos durante la conexión de wallet
export const revalidate = 30; // Revalidación ISR cada 30 segundos

async function fetchNFTData() {
  const res = await fetch(`${process.env.API_ELEI}/api/nft`, {
    next: { revalidate: 30 }, // 🔥 Cache con revalidación cada 30 segundos
  });
  if (!res.ok) {
    throw new Error("Failed to fetch NFT data");
  }
  return res.json();
}

async function fetchAlbumData() {
  const res = await fetch(`${process.env.API_ELEI}/api/collections`, {
    next: { revalidate: 30 }, // 🔥 Cache con revalidación cada 30 segundos
  });
  if (!res.ok) {
    throw new Error("Failed to fetch album data");
  }
  return res.json();
}

// ✅ Función para obtener configuración x402 de un álbum
async function fetchX402Config(albumId: string) {
  try {
    const res = await fetch(
      `${process.env.API_ELEI}/api/x402/config/${albumId}`,
      { next: { revalidate: 30 } } // 🔥 Cache con revalidación cada 30 segundos
    );
    if (res.ok) {
      const config = await res.json();
      return config;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching x402 config for ${albumId}:`, error);
    return null;
  }
}

function shuffleArray(array: any[]) {
  return array.sort(() => Math.random() - 0.5);
}

export default async function Page() {
  // Ejecutar todos los fetches en paralelo para eliminar el flash
  const [nftData, albumData] = await Promise.all([
    fetchNFTData(),
    fetchAlbumData(),
  ]);
  //console.log("nftData FER >>>>> ", nftData);

  // ✅ Obtener configuraciones x402 para todos los álbumes en paralelo
  const x402Configs = await Promise.all(
    albumData.map((album: any) => fetchX402Config(album._id))
  );

  // ✅ Crear mapa de configuraciones x402
  const x402ConfigMap = new Map(
    albumData.map((album: any, index: number) => [
      album._id,
      x402Configs[index],
    ])
  );

  // Crear mapas para búsqueda eficiente
  const nftMap = new Map(nftData.map((nft: any) => [nft._id, nft]));
  const userMap = new Map(
    albumData.map((album: any) => [
      album.address_creator_collection.toLowerCase(),
      album.creator,
    ])
  );

  // Procesar álbumes y NFTs
  const allSongs = albumData.flatMap((album: any) => {
    const creator: any = userMap.get(
      album.address_creator_collection.toLowerCase()
    );
    const albumNfts = album.nfts
      .map((nftId: string) => nftMap.get(nftId))
      .filter(Boolean);

    // ✅ Obtener configuración x402 del álbum
    const x402Config = x402ConfigMap.get(album._id);

    return albumNfts.map((nft: any) => ({
      ...nft,
      slug: album.slug,
      albumId: album._id,
      albumName: album.name,
      address_collection: album.address_collection,
      artist: album.artist_name,
      mint_price: album.mint_price,
      network: album.network,
      mint_currency: album.mint_currency,
      start_mint_date: album.start_mint_date,
      creatorNickname: creator ? creator.nickname : null,
      coin_address: album.coin_address,
      // Agregar dirección para quality filter
      artist_wallet: album.address_creator_collection,
      // ✅ Agregar configuración x402 a cada canción
      x402Config: x402Config,
    }));
  });

  // Mezclar las canciones aleatoriamente
  const randomSongs = shuffleArray(allSongs);

  //console.log("randomSongs FER >>>>> ", randomSongs);

  return <CardMusicHome nftData={randomSongs} collectionData={albumData} />;
}
