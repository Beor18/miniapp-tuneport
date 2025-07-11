import { Metadata } from "next";
import ExploreMusic from "@Src/components/exploreMusic";
import ExploreUsers from "@Src/components/exploreUsers";
import ExploreCategories from "@Src/components/exploreCategories";
//import AllAlbum from "@Src/lib/mocks/allalbum.json";
// import songNft from "@Src/lib/mocks/nft.json";
// import users from "@Src/lib/mocks/users.json";

export const metadata: Metadata = {
  title: "Tuneport",
  description:
    "The new meeting point between musicians, artists, community with history, value and ownership. Music streaming.",
  openGraph: {
    images: ["https://app.tuneport.xyz/preview.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tuneport",
    description:
      "The new meeting point between musicians, artists, community with history, value and ownership. Music streaming.",
    siteId: "1467726470533754880",
    creator: "Tuneport",
    creatorId: "1467726470533754880",
    images: ["https://app.tuneport.xyz/preview.png"],
  },
};

interface NFT {
  _id: string;
  collectionId: string;
  id_item: number;
  name: string;
  description: string;
  candy_machine: string;
  image: string;
  music: string;
  video: string;
  copies: number;
  price: number;
  currency: string;
  owner: string;
  listed_by: string;
  for_sale: number;
  metadata_uri?: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
  properties: {
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
  };
}

interface Album {
  _id: string;
  name: string;
  description: string;
  image_cover: string;
  symbol: string;
  slug: string;
  max_items: number;
  address_collection: string;
  address_creator_collection: string;
  twitter: string;
  facebook: string;
  discord: string;
  telegram: string;
  website: string;
  opensea: string;
  network: string;
  category: string;
  community: string;
  erc_type: string;
  candy_machine: string;
  contractVersion: string;
  mint_button: boolean;
  mint_payway: string;
  mint_price: number;
  mint_currency: string;
  base_url_image: string;
  is_premium: boolean;
  start_mint_date: any;
  nfts: string[];
  collaborators: Array<{
    name: string;
  }>;
  music_genre: string;
  artist_name: string;
  record_label: string;
  release_date: string;
  createdAt: string;
  updatedAt: string;
  coin_address: string;
}

interface User {
  name: string;
  email: string;
  address: string;
  address_solana: string;
  key_solana: string;
  phase: string;
  key: string;
  nickname: string;
  biography: string;
  twitter: string;
  private_account: boolean;
  picture: string;
  verified: boolean;
  type: string;
}

async function fetchAlbums() {
  const res = await fetch(`${process.env.API_ELEI}/api/collections`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch collections");
  }

  return res.json();
}

async function fetchUsers() {
  const res = await fetch(`${process.env.API_ELEI}/api/users/getUser`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch users");
  }

  return res.json();
}

async function fetchSongNft() {
  const res = await fetch(`${process.env.API_ELEI}/api/nft`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch nfts");
  }

  return res.json();
}

export default async function Page() {
  // Fallback data vacía para cuando API_ELEI falle
  let albums: Album[] = [];
  let users: User[] = [];
  let songNft: any[] = [];

  try {
    // Timeout más corto para evitar problemas en Vercel
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), 8000)
    );

    const dataPromise = Promise.all([
      fetchAlbums(),
      fetchUsers(),
      fetchSongNft(),
    ]);

    [albums, users, songNft] = (await Promise.race([
      dataPromise,
      timeoutPromise,
    ])) as [Album[], User[], any[]];

    console.log("Page debug - Albums count:", albums?.length || 0);
    console.log("Page debug - Users count:", users?.length || 0);
    console.log("Page debug - Songs count:", songNft?.length || 0);
  } catch (error) {
    console.error("Page debug - Error fetching data:", error);
    // Continúa con arrays vacíos como fallback
  }

  // console.log("Users: ", users);
  const nftMap = new Map<string, NFT>(
    songNft.map((nft: any) => [nft._id, nft])
  );
  const userMap = new Map<string, User>(
    users.map((user) => [user.address_solana.toLowerCase(), user])
  );

  const processedAlbums = albums.map((album) => {
    // Encuentra el creador en userMap (si existe)
    const creator = userMap.get(album.address_creator_collection.toLowerCase());
    console.log("Creator:", creator);
    // Tomamos TODOS los NFTs que aparecen en album.nfts
    // y los buscamos en nftMap. Eliminamos undefined con .filter(Boolean)
    const albumNfts = album.nfts
      .map((nftId) => nftMap.get(nftId))
      .filter(Boolean) as NFT[];

    // Ahora fusionamos la data del álbum (ej. artist_name) con la del NFT
    const songs = albumNfts.map((nft) => ({
      _id: nft._id,
      name: nft.name,
      description: nft.description,
      image: nft.image,
      music: nft.music,
      video: nft.video,
      copies: nft.copies,
      price: nft.price, // Puedes usar el precio de NFT si prefieres
      currency: album.mint_currency,
      candy_machine: nft.candy_machine,
      owner: nft.owner,
      listedBy: nft.listed_by,
      forSale: nft.for_sale,
      attributes: nft.attributes,
      properties: nft.properties,
      slug: album.slug,
      albumId: album._id,
      network: album.network,
      is_premium: album.is_premium,
      albumName: album.name,
      artist: album.artist_name,
      startMintDate: album.start_mint_date,
      coin_address: album.coin_address,
      creatorNickname: creator ? creator.nickname : null,
      name_album: album.name,
      collaborators: album.collaborators,
      address_collection: album.address_collection,
    }));

    console.log("songs: ", songs);

    return {
      // Información general del álbum
      id: album._id,
      name: album.name,
      description: album.description,
      artist: album.artist_name,
      image: album.image_cover,
      symbol: album.symbol,
      slug: album.slug,
      maxItems: album.max_items,
      addressCollection: album.address_collection,
      addressCreatorCollection: album.address_creator_collection,
      creatorNickname: creator ? creator.nickname : null,
      startMintDate: album.start_mint_date,
      twitter: album.twitter,
      facebook: album.facebook,
      discord: album.discord,
      telegram: album.telegram,
      website: album.website,
      opensea: album.opensea,
      network: album.network,
      category: album.category,
      community: album.community,
      ercType: album.erc_type,
      // candyMachine: album.candy_machine,
      contractVersion: album.contractVersion,
      mintButton: album.mint_button,
      mintPayway: album.mint_payway,
      mintPrice: album.mint_price,
      mintCurrency: album.mint_currency,
      baseUrlImage: album.base_url_image,
      isPremium: album.is_premium,
      collaborators: album.collaborators,
      musicGenre: album.music_genre,
      recordLabel: album.record_label,
      releaseDate: album.release_date,
      createdAt: album.createdAt,
      updatedAt: album.updatedAt,
      // La lista de canciones (NFTs) combinadas con info del álbum
      songs,
    };
  });

  // Add mock albums to processedAlbums
  const finalProcessedAlbums = processedAlbums;

  console.log(
    "Page debug - Processed albums count:",
    finalProcessedAlbums?.length || 0
  );

  // Filtrar usuarios verificados primero, y luego los no verificados
  // Dentro de cada grupo, mantener un orden aleatorio para variedad
  const verifiedUsers = users
    .filter((user) => user.verified === true)
    .sort(() => 0.5 - Math.random());

  const nonVerifiedUsers = users
    .filter((user) => user.verified !== true)
    .sort(() => 0.5 - Math.random());

  // Combinar ambos grupos: primero los verificados, luego los no verificados
  const sortedUsers = [...verifiedUsers, ...nonVerifiedUsers];

  // Tomar los primeros 8 usuarios (prioridad para verificados)
  const usersRandom = sortedUsers.slice(0, 8);

  console.log("Page debug - Random users count:", usersRandom?.length || 0);

  return (
    <div className="px-4 sm:px-6 lg:px-8 mt-8">
      <ExploreCategories />
      <ExploreUsers users={usersRandom} />
      <ExploreMusic albums={finalProcessedAlbums} />
    </div>
  );
}
