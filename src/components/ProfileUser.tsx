"use client";

import { useParams } from "next/navigation";
import { useAppKitAccount } from "@Src/lib/privy";
import ProfileFanUser from "@Src/components/ProfileFanUser";
import ProfileArtistUser from "@Src/components/ProfileArtistUser";
import { useTranslations } from "next-intl";

interface User {
  name: string;
  email: string;
  address: string;
  address_solana?: string;
  key_solana?: string;
  phase?: string;
  key?: string;
  nickname?: string;
  biography?: string;
  twitter?: string;
  private_account: boolean;
  picture?: string;
  verified: boolean;
  type: "fan" | "artist";
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
  collection_type: string;
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
  start_mint_date: string;
  createdAt: string;
  updatedAt: string;
}

interface ProfileUserProps {
  userData: any;
  albums: Album[];
}

const ProfileUser: React.FC<ProfileUserProps> = ({ userData, albums }) => {
  const { nickname } = useParams<{ nickname: string }>();
  const { address, evmWalletAddress, farcasterConnected, farcasterData } =
    useAppKitAccount();
  const tUser = useTranslations("user");

  // Determinar si es perfil propio
  const isOwnProfile =
    userData.address_solana?.toLowerCase() ===
      address?.toString().toLowerCase() && userData.nickname === nickname;

  if (!userData) {
    return <div>{tUser("userNotFound")}</div>;
  }

  const isArtist = userData.type === "artist";
  const canViewPrivateProfile = isOwnProfile || !userData.private_account;

  if (!canViewPrivateProfile) {
    return <div>{tUser("privateProfile")}</div>;
  }

  if (!isArtist) {
    return (
      <ProfileFanUser
        profileFans={{
          ...userData,
          picture: farcasterData?.pfp ? farcasterData.pfp : userData.picture,
          _id: userData._id,
          name: userData.name,

          nickname: userData.nickname,
          biography: userData.biography,
          twitter: userData.twitter,
          instagram: userData.instagram,
          spotify: userData.spotify,
          facebook: userData.facebook,
          private_account: userData.private_account,
          verified: userData.verified,
          followers: userData.followers,
          following: userData.following,
        }}
        nfts={[]}
        isOwnProfile={isOwnProfile}
        publicKey={address?.toString()}
        isLoadingNFTs={false}
      />
    );
  }

  const formattedAlbums = albums.map((album) => ({
    id: album._id,
    name: album.name,
    artist: album.artist_name,
    tracks: album.nfts.length,
    coverUrl: album.image_cover,
    description: album.description,
    symbol: album.symbol,
    slug: album.slug,
    maxItems: album.max_items,
    addressCollection: album.address_collection,
    addressCreatorCollection: album.address_creator_collection,
    twitter: album.twitter,
    facebook: album.facebook,
    discord: album.discord,
    telegram: album.telegram,
    website: album.website,
    opensea: album.opensea,
    network: album.network,
    category: album.category,
    community: album.community,
    collection_type: album.collection_type,
    ercType: album.erc_type,
    candyMachine: album.candy_machine,
    contractVersion: album.contractVersion,
    mintButton: album.mint_button,
    mintPayway: album.mint_payway,
    mintPrice: album.mint_price,
    mintCurrency: album.mint_currency,
    baseUrlImage: album.base_url_image,
    isPremium: album.is_premium,
    nfts: album.nfts,
    collaborators: album.collaborators,
    musicGenre: album.music_genre,
    recordLabel: album.record_label,
    releaseDate: album.release_date,
    startMintDate: album.start_mint_date,
    createdAt: album.createdAt,
    updatedAt: album.updatedAt,
  }));

  return (
    <ProfileArtistUser
      profile={{
        ...userData,
        picture: userData.picture || userData?.farcaster_pfp,
      }}
      albums={formattedAlbums}
      nfts={[]} // Los artistas no necesitan NFTs de colección
      isOwnProfile={isOwnProfile}
    />
  );
};

export default ProfileUser;
