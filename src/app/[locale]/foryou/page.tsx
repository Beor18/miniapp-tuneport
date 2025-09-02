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

async function fetchNFTData() {
  const res = await fetch(`${process.env.API_ELEI}/api/nft`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch NFT data");
  }
  return res.json();
}

async function fetchAlbumData() {
  const res = await fetch(`${process.env.API_ELEI}/api/collections`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch album data");
  }
  return res.json();
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
    }));
  });

  // Mezclar las canciones aleatoriamente
  const randomSongs = shuffleArray(allSongs);

  //console.log("randomSongs FER >>>>> ", randomSongs);

  return <CardMusicHome nftData={randomSongs} collectionData={albumData} />;
}
