/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";
import { Metadata, ResolvingMetadata } from "next/types";
import ProfileUser from "@Src/components/ProfileUser";

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
  collaborators: { name: string }[];
  music_genre: string;
  artist_name: string;
  record_label: string;
  release_date: string;
  createdAt: string;
  updatedAt: string;
}

async function getUserByNickname(nickname: string): Promise<any> {
  try {
    const response = await fetch(
      `${process.env.API_ELEI}/api/users/getUserByNickname?nickname=${nickname}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(`Error fetching user data. Status: ${response.status}`);
    }

    const user = await response.json();

    if (!user || !user.nickname) {
      return false;
    }

    return user;
  } catch (error) {
    console.error("Error checking user:", error);
    return false;
  }
}

async function getAlbumsByArtist(address: string): Promise<any> {
  try {
    const response = await fetch(
      `${process.env.API_ELEI}/api/collections/getByCreatorAddress?addressCreator=${address}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        //next: { tags: ["user-albums"] },
      }
    );

    if (!response.ok) {
      throw new Error(`Error fetching user data. Status: ${response.status}`);
    }

    const albumArtist = await response.json();
    if (!albumArtist) {
      return false;
    }

    return albumArtist;
  } catch (error) {
    console.error("Error albums:", error);
    return false;
  }
}

// Nueva función para obtener albums por múltiples direcciones (Solana y EVM)
async function getAlbumsByMultipleAddresses(userData: any): Promise<any> {
  try {
    const addressesToCheck: string[] = [];

    // Agregar dirección Solana si existe
    if (userData.address_solana) {
      addressesToCheck.push(userData.address_solana);
    }

    // Agregar dirección EVM si existe (address contiene la dirección principal)
    if (userData.address && userData.address !== userData.address_solana) {
      addressesToCheck.push(userData.address);
    }

    // Si no hay direcciones para verificar, retornar array vacío
    if (addressesToCheck.length === 0) {
      return [];
    }

    // Realizar consultas para todas las direcciones en paralelo
    const albumPromises = addressesToCheck.map((address) =>
      getAlbumsByArtist(address).catch((error) => {
        console.warn(`Error getting albums for address ${address}:`, error);
        return [];
      })
    );

    const albumResults = await Promise.all(albumPromises);

    // Combinar resultados y eliminar duplicados basados en _id
    const allAlbums = albumResults.flat().filter(Boolean);
    const uniqueAlbums = allAlbums.filter(
      (album, index, self) =>
        index === self.findIndex((a) => a._id === album._id)
    );

    console.log(
      `Found ${uniqueAlbums.length} unique albums for user ${userData.nickname}`
    );
    return uniqueAlbums;
  } catch (error) {
    console.error("Error getting albums by multiple addresses:", error);
    return [];
  }
}

export async function generateMetadata(
  { params }: { params: { nickname: string } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const userData = await getUserByNickname(params.nickname);

  if (!userData) {
    return {
      title: "Usuario no encontrado",
      description: "Lo sentimos, no pudimos encontrar el perfil que buscas.",
    };
  }

  const title = `${userData.nickname} | Tuneport`;
  const description =
    userData.biography ||
    `Explore the profile and albums of ${userData.nickname}`;

  const ogImageUrl = new URL(`https://app.tuneport.xyz/api/og`);
  ogImageUrl.searchParams.set("nickname", userData.nickname);
  if (userData.biography)
    ogImageUrl.searchParams.set("bio", userData.biography);
  if (userData.picture)
    ogImageUrl.searchParams.set("picture", userData.picture);

  //console.log("ogImageUrl: ", ogImageUrl);
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: ogImageUrl.toString(),
          width: 1200,
          height: 630,
          alt: `${userData.nickname} profile on Tuneport`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl.toString()],
      creator: userData.twitter ? `@${userData.twitter}` : "",
    },
  };
}

export default async function Page({
  params,
}: {
  params: { nickname: string };
}) {
  try {
    const userData = await getUserByNickname(params.nickname);
    console.log("userData FER >>>>> ", userData);
    if (!userData) {
      notFound();
    }
    const albums = (await getAlbumsByMultipleAddresses(userData)) || [];
    return <ProfileUser userData={userData} albums={albums} />;
  } catch (error) {
    console.error("Error fetching data:", error);
    notFound();
  }
}
