/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@Src/ui/components/ui/button";
import { Card, CardContent, CardFooter } from "@Src/ui/components/ui/card";
import {
  Camera,
  Twitter,
  Play,
  Pencil,
  Lock,
  CheckCircle,
  HandHeartIcon,
  PackageX,
  Music,
  ListMusic,
  Trophy,
  Store,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  VerifiedIcon,
  Instagram,
  Music2,
} from "lucide-react";

import { updateProfile } from "@Src/app/actions/updateProfile.actions";
import { followUser, getUserByAddress } from "@Src/app/actions/follows.actions";
import { ProfileEditModal } from "@Src/components/ProfileEditModal";
import PlaylistCarousel from "./PlaylistCarousel";
import OptimizedWalletAssets from "./OptimizedWalletAssets";
import { useTranslations } from "next-intl";
import { useAppKitAccount } from "@Src/lib/privy";
import { useOptimizedUserNFTs } from "@Src/lib/hooks/useOptimizedUserNFTs";
import Link from "next/link";

interface NFT {
  id: string;
  name: string;
  artist: string;
  image: string;
  contractAddress?: string;
  balance?: number;
  metadata?: any;
  // Información adicional de tuneport
  description?: string;
  external_url?: string;
  collection_type?: string;
  music_genre?: string;
  record_label?: string;
  mint_currency?: string;
  slug?: string;
  network?: string;
  symbol?: string;
  collaborators?: Array<{
    name: string;
    address: string;
    mintPercentage: number;
    royaltyPercentage: number;
  }>;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
  start_mint_date?: string;
  release_date?: string;
  max_items?: number;
  address_creator_collection?: string;
}

interface ProfileFanUserProps {
  profileFans: {
    _id: string;
    name: string;
    picture?: string;
    nickname?: string;
    biography?: string;
    twitter?: string;
    instagram?: string;
    spotify?: string;
    facebook?: string;
    private_account: boolean;
    verified: boolean;
    followers?: string[];
    following?: string[];
    farcaster_username?: string;
    farcaster_pfp?: string;
    farcaster_bio?: string;
  };
  nfts: NFT[];
  isOwnProfile: boolean;
  publicKey?: string;
  isLoadingNFTs?: boolean;
}

// Componente de skeleton para NFT cards
const NFTCardSkeleton = () => (
  <Card className="group overflow-hidden border-none bg-zinc-900 backdrop-blur-sm h-full">
    <CardContent className="p-0 relative">
      <div className="relative w-full pt-[100%]">
        <div className="absolute inset-0 w-full h-full bg-zinc-800 animate-pulse"></div>
      </div>
    </CardContent>
    <CardFooter className="flex flex-col items-start p-4 bg-zinc-800/50 border-t border-zinc-700/30">
      <div className="w-full flex justify-between items-start space-x-3">
        <div className="flex-grow min-w-0 space-y-2">
          <div className="h-4 bg-zinc-700 rounded animate-pulse w-3/4"></div>
          <div className="h-3 bg-zinc-700/70 rounded animate-pulse w-1/2"></div>
        </div>
        <div className="text-right flex-shrink-0 space-y-1">
          <div className="h-3 bg-zinc-700 rounded animate-pulse w-12"></div>
          <div className="h-3 bg-zinc-700/70 rounded animate-pulse w-8"></div>
        </div>
      </div>
      <div className="w-full mt-3 space-y-1">
        <div className="h-3 bg-zinc-700/50 rounded animate-pulse w-full"></div>
        <div className="h-6 bg-zinc-700/30 rounded animate-pulse w-full"></div>
      </div>
    </CardFooter>
  </Card>
);

const FarcasterIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 256 256"
    fill="currentColor"
  >
    <path d="M183.296 71.68H211.968L207.872 94.208H200.704V180.224L201.02 180.232C204.266 180.396 206.848 183.081 206.848 186.368V191.488L207.164 191.496C210.41 191.66 212.992 194.345 212.992 197.632V202.752H155.648V197.632C155.648 194.345 158.229 191.66 161.476 191.496L161.792 191.488V186.368C161.792 183.081 164.373 180.396 167.62 180.232L167.936 180.224V138.24C167.936 116.184 150.056 98.304 128 98.304C105.944 98.304 88.0638 116.184 88.0638 138.24V180.224L88.3798 180.232C91.6262 180.396 94.2078 183.081 94.2078 186.368V191.488L94.5238 191.496C97.7702 191.66 100.352 194.345 100.352 197.632V202.752H43.0078V197.632C43.0078 194.345 45.5894 191.66 48.8358 191.496L49.1518 191.488V186.368C49.1518 183.081 51.7334 180.396 54.9798 180.232L55.2958 180.224V94.208H48.1278L44.0318 71.68H72.7038V54.272H183.296V71.68Z" />
  </svg>
);

export default function ProfileFanUser({
  profileFans,
  nfts = [],
  isOwnProfile,
  publicKey,
  isLoadingNFTs = false,
}: ProfileFanUserProps) {
  const tUser = useTranslations("user");
  const tCommon = useTranslations("common");

  // 🆕 FARCASTER: Obtener datos de Farcaster del usuario actual
  const { farcasterConnected, farcasterData, evmWalletAddress } =
    useAppKitAccount();

  // 🚀 NFTs optimizados con nuevas funciones v1.0.1
  const {
    nfts: optimizedNFTs,
    loading: nftsLoading,
    error: nftsError,
    totalCount: nftsTotalCount,
    usingNewFunctions,
    refetch: refetchNFTs,
  } = useOptimizedUserNFTs(evmWalletAddress || undefined);

  // 🚨 DEBUG: Verificar qué address se está usando
  console.log(
    `👤 ProfileFanUser - fetching NFTs for evmWalletAddress: ${evmWalletAddress}`
  );

  const initialFollowersCount = profileFans.followers
    ? profileFans.followers?.length
    : 0;

  const initialFollowingCount = profileFans.followers
    ? profileFans.following?.length
    : 0;

  const [biography, setBiography] = useState(profileFans.biography || "");
  const [twitter, setTwitter] = useState(profileFans.twitter || "");
  const [nickname, setNickname] = useState(profileFans.nickname || "");
  const [profileName, setProfileName] = useState(profileFans.name || "");
  const [followerCount, setFollowerCount] = useState(initialFollowersCount);
  const [profilePicture, setProfilePicture] = useState(
    profileFans.picture ||
      `https://avatar.iran.liara.run/username?username=${profileFans.name}`
  );
  const [instagram, setInstagram] = useState(profileFans.instagram || "");
  const [spotify, setSpotify] = useState(profileFans.spotify || "");
  const [facebook, setFacebook] = useState(profileFans.facebook || "");

  // Estado para el ID del usuario actual obtenido a partir de publicKey
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  // Refs para los carruseles
  const collectedScrollRef = useRef<HTMLDivElement>(null);

  // Función para navegar en los carruseles
  const scroll = (
    direction: "left" | "right",
    ref: React.RefObject<HTMLDivElement>
  ) => {
    if (ref.current) {
      const { current } = ref;
      const scrollAmount = direction === "left" ? -240 : 240;
      current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  //console.log("profileFans", profileFans);
  // Sincronizar estados locales cuando las props cambien
  useEffect(() => {
    setBiography(profileFans.biography || "");
    setTwitter(profileFans.twitter || "");
    setNickname(profileFans.nickname || "");
    setProfileName(profileFans.name || "");
    setInstagram(profileFans.instagram || "");
    setSpotify(profileFans.spotify || "");
    setFacebook(profileFans.facebook || "");

    // 🆕 FARCASTER: Priorizar foto de Farcaster si está disponible y es el perfil propio
    const finalPicture = profileFans?.farcaster_pfp
      ? profileFans?.farcaster_pfp
      : profileFans.picture ||
        `https://avatar.iran.liara.run/username?username=${profileFans.name}`;

    setProfilePicture(finalPicture);
  }, [profileFans, isOwnProfile, farcasterConnected, farcasterData]);

  // Obtener el userId del usuario actual a partir de publicKey
  useEffect(() => {
    let isMounted = true;
    const fetchUserId = async () => {
      if (!publicKey) return;
      const userId = await getUserByAddress({
        address: "",
        address_solana: publicKey,
      });
      if (isMounted) {
        setCurrentUserId(userId);
      }
    };

    fetchUserId();
    return () => {
      isMounted = false;
    };
  }, [publicKey]);

  // Una vez que tengamos el currentUserId, determinamos si ya está siguiendo
  useEffect(() => {
    if (currentUserId && profileFans.followers) {
      setIsFollowing(profileFans.followers.includes(currentUserId));
    }
  }, [currentUserId, profileFans.followers]);

  const handleEditProfile = async (
    newName: string,
    newNickname: string,
    newBiography: string,
    newTwitter: string,
    newInstagram: string,
    newSpotify: string,
    newFacebook: string,
    newPictureFile: File | null
  ) => {
    let pictureUrl: any = profileFans?.picture;

    // Si se seleccionó un archivo, se sube a Pinata
    if (newPictureFile) {
      const formData = new FormData();
      formData.append("picture", newPictureFile);

      const responsePinata = await fetch("/api/pinata", {
        method: "POST",
        body: formData,
      });

      if (!responsePinata.ok) {
        throw new Error("Failed to upload files");
      }

      const pinataData = await responsePinata.json();
      pictureUrl = `https://ipfs.io/ipfs/${pinataData.ipfsHash}/${newPictureFile.name}`;
    }

    // Una vez que tenemos la URL, se actualiza el perfil
    const updateResult = await updateProfile({
      id: profileFans._id,
      name: newName,
      nickname: newNickname,
      picture: pictureUrl,
      biography: newBiography,
      twitter: newTwitter,
      instagram: newInstagram,
      spotify: newSpotify,
      facebook: newFacebook,
    });

    console.log("Profile update result:", updateResult);

    // Update local state
    setProfileName(newName);
    setNickname(newNickname);
    setBiography(newBiography);
    setTwitter(newTwitter);
    setInstagram(newInstagram);
    setSpotify(newSpotify);
    setFacebook(newFacebook);
    if (newPictureFile) {
      setProfilePicture(pictureUrl);
    }
  };

  const handleFollow = async () => {
    if (!profileFans.nickname || !currentUserId) return;

    const result = await followUser({
      nickname: profileFans.nickname,
      followerId: currentUserId,
      enableFarcaster: true,
    });

    if (result) {
      setIsFollowing(true);
      setFollowerCount((prev) => prev + 1);
    }
  };

  const getSkeletonCount = () => {
    return 8; // Mostrar suficientes skeletons para llenar el carrusel
  };

  return (
    <div className="relative">
      {/* Banner */}
      <div className="h-48 w-full bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900">
        <img
          src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80"
          alt="Profile cover"
          className="opacity-50 object-cover w-full h-48"
        />
      </div>

      {/* Profile Section */}
      <div className="px-4 sm:px-6 lg:px-8 -mt-16 z-10">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 sm:w-32 sm:h-32 border-2 border-white rounded-full overflow-hidden">
              <img
                src={profilePicture}
                alt={profileFans.name}
                className="w-full h-full object-cover"
              />
            </div>
            {profileFans.verified && (
              <div className="absolute bottom-1 right-1 bg-zinc-900 rounded-full p-1.5">
                <VerifiedIcon className="w-5 h-5 text-blue-500" />
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-6">
          {/* Header con nombre y acciones */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-2">
                <h2 className="text-xl font-bold text-white uppercase">
                  {profileName}
                </h2>
                {nickname && (
                  <p className="text-sm font-medium text-zinc-400">
                    @{nickname}
                  </p>
                )}
                {(biography || profileFans.farcaster_bio) && (
                  <p className="text-sm text-zinc-300 leading-relaxed max-w-2xl">
                    {biography || profileFans.farcaster_bio}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {profileFans.private_account && (
                  <Lock className="h-5 w-5 text-zinc-400" />
                )}
              </div>
            </div>

            <div>
              {isOwnProfile ? (
                <ProfileEditModal
                  initialName={profileName}
                  initialNickname={nickname}
                  initialBiography={biography}
                  initialTwitter={twitter}
                  initialInstagram={instagram}
                  initialSpotify={spotify}
                  initialFacebook={facebook}
                  initialPictureUrl={profilePicture}
                  onSubmit={handleEditProfile}
                />
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  className={`transition-all duration-300 ${
                    isFollowing
                      ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-100"
                      : "bg-white hover:bg-zinc-100 text-zinc-900"
                  }`}
                  onClick={handleFollow}
                  disabled={isFollowing || !currentUserId}
                >
                  <HandHeartIcon className="h-4 w-4 mr-2" />
                  {isFollowing ? tUser("following") : tUser("followMe")}
                </Button>
              )}
            </div>
          </div>

          {/* Social links */}
          <div className="flex items-center gap-4">
            <Link
              href={`https://warpcast.com/${profileFans.farcaster_username}`}
              className="text-gray-400 hover:text-white"
            >
              <FarcasterIcon className="h-5 w-5 text-white" />
            </Link>

            {twitter && (
              <a
                href={`https://twitter.com/${twitter}`}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-80"
              >
                <img src="/logo-white.png" className="h-5 w-5" alt="Twitter" />
              </a>
            )}

            {instagram && (
              <a
                href={`https://instagram.com/${instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-80"
              >
                <Instagram className="h-5 w-5 text-white" />
              </a>
            )}

            {spotify && (
              <a
                href={spotify}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-80"
              >
                <Music2 className="h-5 w-5 text-white" />
              </a>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-semibold text-white">
                {initialFollowingCount}
              </span>
              <span className="text-sm text-zinc-400">
                {tUser("following")}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-semibold text-white">
                {followerCount}
              </span>
              <span className="text-sm text-zinc-400">
                {tUser("followers")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Optimized Collected NFTs Section */}
      <div className="px-4 sm:px-6 lg:px-8 mt-12">
        <OptimizedWalletAssets
          nfts={optimizedNFTs}
          loading={nftsLoading}
          error={nftsError}
          totalCount={nftsTotalCount}
          usingNewFunctions={usingNewFunctions}
          onRefresh={refetchNFTs}
        />
      </div>

      {/* Playlists Section */}
      <div className="px-4 pb-0 sm:px-6 lg:px-8 mt-4">
        <PlaylistCarousel
          userId={profileFans._id}
          isOwnProfile={isOwnProfile}
        />
      </div>

      {/* Coming Soon Sections */}
      <div className="px-4 sm:px-6 lg:px-8 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Leaderboard */}
          <div className="flex flex-col items-center justify-center p-8 bg-zinc-900/50 rounded-lg">
            <Trophy className="w-12 h-12 text-zinc-600 mb-3" />
            <p className="text-zinc-400 text-center font-medium">
              {tCommon("leaderboardComingSoon")}
            </p>
            <p className="text-zinc-500 text-center text-sm mt-1">
              {tCommon("trackYourPosition")}
            </p>
          </div>

          {/* Store */}
          <div className="flex flex-col items-center justify-center p-8 bg-zinc-900/50 rounded-lg">
            <Store className="w-12 h-12 text-zinc-600 mb-3" />
            <p className="text-zinc-400 text-center font-medium">
              {tCommon("myStoreComingSoon")}
            </p>
            <p className="text-zinc-500 text-center text-sm mt-1">
              {tCommon("createManageStore")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const NFTCard = ({ nft, tCommon }: { nft: NFT; tCommon: any }) => (
  <Card className="group overflow-hidden border-none bg-zinc-900 backdrop-blur-sm transition-all duration-300 hover:bg-zinc-900/80 hover:-translate-y-1 h-full">
    <CardContent className="p-0 relative">
      <div className="relative w-full pt-[100%]">
        <img
          src={nft.image}
          alt={nft.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 will-change-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
          <Button
            variant="secondary"
            size="icon"
            className="opacity-0 scale-90 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 bg-white hover:bg-white/90 text-zinc-900"
            onClick={() => {
              console.log("View NFT details:", nft);
            }}
            aria-label="View Details"
          >
            <Play className="h-5 w-5" />
          </Button>
        </div>

        {/* Badge de tipo de colección */}
        {nft.collection_type && (
          <div className="absolute top-2 left-2 z-10">
            <div className="bg-black/70 backdrop-blur-sm rounded-full px-2 py-1 border border-white/20">
              <span className="text-xs text-white font-medium">
                {nft.collection_type}
              </span>
            </div>
          </div>
        )}

        {/* Badge de balance si es mayor a 1 */}
        {nft.balance && nft.balance > 1 && (
          <div className="absolute top-2 right-2 z-10">
            <div className="bg-emerald-500/80 backdrop-blur-sm rounded-full px-2 py-1 border border-emerald-400/50">
              <span className="text-xs text-white font-medium">
                {nft.balance}x
              </span>
            </div>
          </div>
        )}
      </div>
    </CardContent>
    <CardFooter className="flex flex-col items-start p-4 bg-zinc-800/50 border-t border-zinc-700/30">
      <div className="w-full flex justify-between items-start space-x-3">
        <div className="flex-grow min-w-0">
          <h3 className="font-semibold text-base text-zinc-100 line-clamp-1 group-hover:text-white transition-colors">
            {nft.name}
          </h3>
          <p className="text-sm text-zinc-400 line-clamp-1 group-hover:text-zinc-300 transition-colors">
            {nft.artist}
          </p>
          {nft.music_genre && (
            <div className="flex items-center gap-1 mt-1">
              <Music className="w-3 h-3 text-purple-400" />
              <span className="text-purple-400 text-xs">{nft.music_genre}</span>
            </div>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          {nft.symbol && (
            <p className="text-[14px] font-medium text-zinc-100">
              {nft.symbol}
            </p>
          )}
          <p className="text-xs text-zinc-500">#{nft.id}</p>
        </div>
      </div>

      {/* Información adicional */}
      {/* <div className="w-full mt-3 space-y-1">
        {nft.external_url && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-7 text-xs text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all"
            onClick={() => {
              window.open(nft.external_url, "_blank");
            }}
          >
            <svg
              className="w-3 h-3 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            {tCommon("viewDetails")}
          </Button>
        )}
      </div> */}
    </CardFooter>
  </Card>
);
