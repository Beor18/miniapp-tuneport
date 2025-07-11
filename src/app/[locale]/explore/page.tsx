import { Metadata } from "next";
import ExploreMusic from "@Src/components/exploreMusic";
import ExploreCategories from "@Src/components/exploreCategories";
//import AllAlbum from "@Src/lib/mocks/allalbum.json";
// import songNft from "@Src/lib/mocks/nft.json";
// import users from "@Src/lib/mocks/users.json";

export const metadata: Metadata = {
  title: "Explore Music",
  description: "Discover and explore new music albums",
};

interface NFT {
  _id: string;
  collectionId: string;
  id_item: number;
  name: string;
  description: string;
  image: string;
  music: string;
  video: string;
  copies: number;
  price: number;
  currency: string;
  owner: string;
  candy_machine: string;
  artist_address_mint: string;
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
  nfts: string[];
  collaborators: Array<{
    name: string;
  }>;
  music_genre: string;
  artist_name: string;
  record_label: string;
  release_date: string;
  start_mint_date: any;
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
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch collections");
  }

  return res.json();
}

async function fetchUsers() {
  const res = await fetch(`${process.env.API_ELEI}/api/users/getUser`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch collections");
  }

  return res.json();
}

async function fetchSongNft() {
  const res = await fetch(`${process.env.API_ELEI}/api/nft`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch collections");
  }

  return res.json();
}

export default async function Page() {
  // Ejecutar todos los fetches en paralelo para eliminar el flash
  const [albums, users, songNft]: [Album[], User[], any] = await Promise.all([
    fetchAlbums(),
    fetchUsers(),
    fetchSongNft(),
  ]);

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
      owner: nft.owner,
      listedBy: nft.listed_by,
      forSale: nft.for_sale,
      attributes: nft.attributes,
      properties: nft.properties,
      slug: album.slug,
      albumId: album._id,
      albumName: album.name,
      artist: album.artist_name,
      is_premium: album.is_premium,
      creatorNickname: creator ? creator.nickname : null,
      addressCollection: album.address_collection,
      candyMachine: nft.candy_machine,
      addressCreatorCollection: album.address_creator_collection,
      artist_address_mint: nft.artist_address_mint,
      startDate: album.start_mint_date,
      coinAddress: album.coin_address,
    }));

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
      is_premium: album.is_premium,
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
      candyMachine: album.candy_machine,
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
      coinAddress: album.coin_address,
      // La lista de canciones (NFTs) combinadas con info del álbum
      songs,
    };
  });

  // Add mock albums to processedAlbums
  const finalProcessedAlbums = processedAlbums;

  return (
    <div className="px-4 sm:px-6 lg:px-8 mt-8">
      <ExploreCategories />
      <ExploreMusic albums={finalProcessedAlbums} songNft={songNft} />
    </div>
  );
}
