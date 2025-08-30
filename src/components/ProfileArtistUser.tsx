/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Button } from "@Src/ui/components/ui/button";
import { Separator } from "@Src/ui/components/ui/separator";
import { Card, CardContent, CardFooter } from "@Src/ui/components/ui/card";
import {
  BarChart,
  Camera,
  DollarSign,
  Music,
  ChevronDown,
  Pencil,
  Twitter,
  Lock,
  CheckCircle,
  HandHeartIcon,
  Play,
  PackageX,
  Music2Icon,
  Instagram,
  Music2,
  VerifiedIcon,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@Src/ui/components/ui/dropdown-menu";
import { BaseAlbumNewForm } from "./";
import { ProfileEditModal } from "@Src/components/ProfileEditModal";

import { updateProfile } from "@Src/app/actions/updateProfile.actions";
import NftForm from "./nftForm";
import { followUser, getUserByAddress } from "@Src/app/actions/follows.actions";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import WalletAssets from "./WalletAssets";
import OptimizedWalletAssets from "./OptimizedWalletAssets";
import PlaylistCarousel from "./PlaylistCarousel";
import { useTranslations } from "next-intl";
import { useFarcaster } from "@Src/lib/hooks/useFarcaster";
import { useOptimizedUserNFTs } from "@Src/lib/hooks/useOptimizedUserNFTs";

interface Album {
  id: string;
  name: string;
  slug: string;
  description: string;
  candyMachine: string;
  startMintDate: string;
  artist: string;
  tracks: number;
  coverUrl: string;
}

interface NFT {
  id: string;
  name: string;
  artist: string;
  image: string;
}

interface ProfileArtistUserProps {
  profile: {
    _id: string;
    name: string;
    email: string;
    address: string;
    address_solana: string;
    key_solana?: string;
    phase?: string;
    key?: string;
    nickname?: string;
    biography?: string;
    twitter?: string;
    instagram?: string;
    spotify?: string;
    facebook?: string;
    private_account: boolean;
    picture?: string;
    verified: boolean;
    followers?: string[];
    following?: string[];
    farcaster_bio?: string;
    farcaster_pfp?: string;
    farcaster_username?: string;
  };
  albums: Album[];
  nfts: NFT[];
  isOwnProfile: boolean;
}

// Componente de skeleton para una tarjeta de álbum
const AlbumCardSkeleton = () => (
  <Card className="group overflow-hidden border-none bg-zinc-900/50 transition-all">
    <CardContent className="p-0 relative">
      <div className="relative aspect-square">
        <div className="w-full h-full bg-zinc-800 animate-pulse"></div>
      </div>
    </CardContent>
    <CardFooter className="flex flex-col items-start p-4 bg-zinc-900/95">
      <div className="h-5 bg-zinc-800 rounded animate-pulse w-3/4 mb-2"></div>
      <div className="h-4 bg-zinc-800/70 rounded animate-pulse w-1/2 mb-2"></div>
      <div className="h-3 bg-zinc-800/50 rounded animate-pulse w-1/3 mt-1"></div>
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

export default function ProfileArtistUser({
  profile,
  albums,
  nfts,
  isOwnProfile,
}: ProfileArtistUserProps) {
  //const [showAllStats, setShowAllStats] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const tUser = useTranslations("user");
  const tCommon = useTranslations("common");
  const tMusic = useTranslations("music");
  const tTabs = useTranslations("tabs");

  // 🆕 FARCASTER: Obtener datos de Farcaster
  const {
    isConnected: farcasterConnected,
    username: farcasterUsername,
    pfp: farcasterPfp,
    getFarcasterProfileUrl,
  } = useFarcaster();

  const initialFollowersCount = profile.followers
    ? profile.followers?.length
    : 0;

  const initialFollowingCount = profile.followers
    ? profile.following?.length
    : 0;

  // Remove this line
  //const [isEditing, setIsEditing] = useState(false);
  const [biography, setBiography] = useState(profile.biography || "");
  const [twitter, setTwitter] = useState(profile.twitter || "");
  const [nickname, setNickname] = useState(profile.nickname || "");
  const [profileName, setProfileName] = useState(profile.name || "");
  const [pictureFile, setPictureFile] = useState<File | null>(null);

  const [isOpenRegisterFan, setIsOpenRegisterFan] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  const [followerCount, setFollowerCount] = useState(initialFollowersCount);

  // Reemplazar useAppKitAccount con hooks de Privy
  const { authenticated, user } = usePrivy();
  const { wallets } = useWallets();

  // Obtener la dirección de wallet principal
  const [activeWallet, setActiveWallet] = useState<any>(null);
  const [address, setAddress] = useState<string | null>(null);

  // 🚀 NFTs optimizados con nuevas funciones v1.0.1 - SOPORTE MÚLTIPLES WALLETS PRIVY
  // Crear array de direcciones: primero profile.address, luego todas las wallets de Privy si es perfil propio
  const addressesToFetch = React.useMemo(() => {
    const addresses: string[] = [];

    // Siempre incluir la dirección del perfil si existe
    if (profile.address) {
      addresses.push(profile.address);
    }

    // Si es el perfil propio y hay wallets conectadas, agregar todas las direcciones de Privy
    if (isOwnProfile && authenticated && wallets.length > 0) {
      const privyAddresses = wallets
        .map((wallet) => wallet.address)
        .filter(Boolean);

      // Agregar solo las direcciones que no están ya incluidas
      for (const privyAddress of privyAddresses) {
        if (!addresses.includes(privyAddress)) {
          addresses.push(privyAddress);
        }
      }
    }

    return addresses.length > 0 ? addresses : undefined;
  }, [profile.address, isOwnProfile, authenticated, wallets]);

  const {
    nfts: optimizedNFTs,
    loading: nftsLoading,
    error: nftsError,
    totalCount: nftsTotalCount,
    usingNewFunctions,
    refetch: refetchNFTs,
  } = useOptimizedUserNFTs(addressesToFetch);

  // 🚨 DEBUG: Verificar qué addresses se están usando
  console.log(
    `🎨 ProfileArtistUser - fetching NFTs for addresses:`,
    addressesToFetch
  );

  // Agregar estado para el álbum seleccionado
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);

  const [shouldRefetch, setShouldRefetch] = useState(false);

  const router = useRouter();

  const [copied, setCopied] = useState(false);

  // Ref para el carrusel de álbumes
  const scrollRef = useRef<HTMLDivElement>(null);

  // Función para navegar en el carrusel
  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = direction === "left" ? -240 : 240;
      current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Efecto para obtener la dirección de wallet principal
  useEffect(() => {
    if (authenticated && wallets.length > 0) {
      const mainWallet = wallets[0];
      setActiveWallet(mainWallet);
      setAddress(mainWallet.address);
    }
  }, [authenticated, wallets]);

  useEffect(() => {
    // Simulamos un tiempo de carga para mostrar los skeletons
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
    }, 1200); // 1.2 segundos de carga simulada

    return () => clearTimeout(loadingTimer);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchUserId = async () => {
      if (!address) return;
      const userId = await getUserByAddress({
        address: address?.toString(),
        address_solana: "", // Ya no usamos address_solana con Privy
      });
      if (isMounted) {
        setCurrentUserId(userId);
      }
    };

    if (address) {
      fetchUserId();
    }

    return () => {
      isMounted = false;
    };
  }, [address]);

  useEffect(() => {
    if (currentUserId && profile.followers) {
      setIsFollowing(profile.followers.includes(currentUserId));
    }
  }, [currentUserId, profile.followers]);

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
    let pictureUrl = profile.picture;

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

    // Una vez que tenemos la URL de la imagen (nueva o existente), se actualiza el perfil
    await updateProfile({
      id: profile._id,
      name: newName,
      nickname: newNickname,
      picture: pictureUrl,
      biography: newBiography,
      twitter: newTwitter,
      instagram: newInstagram,
      spotify: newSpotify,
      facebook: newFacebook,
    });

    // Update local state
    setProfileName(newName);
    setNickname(newNickname);
    setBiography(newBiography);
    setTwitter(newTwitter);
    // Actualizar la imagen del perfil si se cambió
    if (newPictureFile) {
      // Aquí deberías actualizar el estado local de la imagen del perfil
      // Por ejemplo, si tienes un estado para la imagen del perfil:
      // setProfilePicture(pictureUrl);
    }
  };

  const handleFollow = async () => {
    if (!profile.nickname || !currentUserId) return;

    const result = await followUser({
      nickname: profile.nickname,
      followerId: currentUserId,
      enableFarcaster: true,
    });

    if (result) {
      setIsFollowing(true);
      setFollowerCount((prev) => prev + 1);
    }
  };

  // Función para manejar la apertura del modal
  const handleOpenAddTracks = (album: Album) => {
    setSelectedAlbum(album);
    //("album NFTForm", album);
    setIsOpenRegisterFan(true);
  };

  // Función para manejar el cierre del modal
  const handleCloseAddTracks = () => {
    setSelectedAlbum(null);
    setIsOpenRegisterFan(false);
  };

  // Función para refrescar los datos usando Next.js router
  const refreshData = async () => {
    try {
      // Usar router.refresh() para revalidar los datos del servidor sin recarga completa
      router.refresh();

      // Opcional: también actualizar el estado local si es necesario
      setShouldRefetch(true);
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  };

  // Determinamos cuántos skeletons mostrar
  const getSkeletonCount = () => {
    return 8; // Mostrar suficientes skeletons para llenar el carrusel
  };

  // Función para truncar direcciones de wallet
  const truncateAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Función para copiar la dirección al portapapeles
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
                src={
                  profile.picture ||
                  profile.farcaster_pfp ||
                  `https://avatar.iran.liara.run/username?username=${profile.name}`
                }
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            </div>
            {profile.verified && (
              <div className="absolute bottom-1 right-1 bg-zinc-900 rounded-full p-1.5">
                <VerifiedIcon className="w-5 h-5 text-blue-500" />
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-4">
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
                {biography ? (
                  <p className="text-sm text-zinc-300 leading-relaxed max-w-2xl">
                    {biography}
                  </p>
                ) : (
                  <p>{profile.farcaster_bio}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* {profile.verified && (
                  <CheckCircle className="h-5 w-5 text-blue-500" />
                )} */}
                {profile.private_account && (
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
                  initialInstagram={profile.instagram || ""}
                  initialSpotify={profile.spotify || ""}
                  initialFacebook={profile.facebook || ""}
                  initialPictureUrl={profile.picture || ""}
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
            {/* 🆕 FARCASTER: Mostrar enlace de Farcaster si está conectado */}

            <Link
              href={`https://warpcast.com/${profile.farcaster_username}`}
              className="text-gray-400 hover:text-white"
            >
              <FarcasterIcon className="h-5 w-5 text-white" />
            </Link>

            {profile.twitter && (
              <a
                href={profile.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-80"
              >
                <img src="/logo-white.png" className="h-5 w-5" alt="Twitter" />
              </a>
            )}

            {profile.instagram && (
              <a
                href={profile.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-80"
              >
                <Instagram className="h-5 w-5 text-white" />
              </a>
            )}

            {profile.spotify && (
              <a
                href={profile.spotify}
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

      {/* Optimized NFT Collection */}
      {/* {isOwnProfile && authenticated && ( */}
      <div className="px-4 sm:px-6 lg:px-8 mt-8">
        <OptimizedWalletAssets
          nfts={optimizedNFTs}
          loading={nftsLoading}
          error={nftsError}
          totalCount={nftsTotalCount}
          usingNewFunctions={usingNewFunctions}
          onRefresh={refetchNFTs}
        />
      </div>
      {/* )} */}

      {/* Albums Section - Convertido a Carrusel */}
      <div className="px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-zinc-100 uppercase">
            {/* {tMusic("music")} */}
            MY MUSIC
          </h3>
          <div className="flex items-center gap-4">
            {/* {isOwnProfile && (
              <BaseAlbumNewForm nickname={profile.nickname || ""} />
            )} */}
            {/* Botones de navegación del carrusel */}
            {!isLoading && albums.length > 0 && (
              <div className="flex gap-2">
                <button
                  type="button"
                  aria-label="Scroll left"
                  onClick={() => scroll("left")}
                  className="bg-zinc-900/80 border border-zinc-800 rounded-full p-1 w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all shadow-md"
                  style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.12)" }}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  aria-label="Scroll right"
                  onClick={() => scroll("right")}
                  className="bg-zinc-900/80 border border-zinc-800 rounded-full p-1 w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all shadow-md"
                  style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.12)" }}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {albums.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center p-8 bg-zinc-900/50 rounded-lg">
            <Music2Icon className="w-12 h-12 text-zinc-600 mb-3" />
            <p className="text-zinc-400 text-center">
              Oops! Don&apos;t worry you will soon see your music
            </p>
          </div>
        ) : (
          <div className="relative">
            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto pb-2 mb-2 scroll-smooth"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {isLoading
                ? // Mostrar skeletons mientras carga
                  Array(getSkeletonCount())
                    .fill(0)
                    .map((_, index) => (
                      <div
                        key={`skeleton-${index}`}
                        className="w-44 sm:w-48 flex-shrink-0 first:ml-0"
                      >
                        <AlbumCardSkeleton />
                      </div>
                    ))
                : // Mostrar álbumes reales
                  albums.map((album) => (
                    <div
                      key={album.id}
                      className="w-44 sm:w-48 flex-shrink-0 first:ml-0"
                    >
                      <AlbumCard
                        album={album}
                        isOwnProfile={isOwnProfile}
                        onAddTracks={() => handleOpenAddTracks(album)}
                        tMusic={tMusic}
                        tCommon={tCommon}
                      />
                    </div>
                  ))}
            </div>
          </div>
        )}
      </div>

      {/* Playlists Section */}
      <div className="px-4 sm:px-6 lg:px-8 mt-6">
        <PlaylistCarousel userId={profile._id} isOwnProfile={isOwnProfile} />
      </div>

      <NftForm
        album={selectedAlbum}
        open={isOpenRegisterFan}
        onClose={handleCloseAddTracks}
        onSuccess={refreshData}
      />
    </div>
  );
}

const AlbumCard = ({
  album,
  isOwnProfile,
  onAddTracks,
  tMusic,
  tCommon,
}: {
  album: Album;
  isOwnProfile: boolean;
  onAddTracks: () => void;
  tMusic: any;
  tCommon: any;
}) => (
  <Card className="group overflow-hidden border-none bg-zinc-900/50 transition-all duration-300 hover:-translate-y-1 w-full">
    <CardContent className="p-0 relative">
      <div className="relative aspect-square">
        <img
          src={album.coverUrl}
          alt={album.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    </CardContent>
    <CardFooter className="flex flex-col items-start p-4 bg-zinc-900/95">
      <Link href={`/album/${album.slug}`} className="group/link block w-full">
        <h4
          className="font-medium text-zinc-100 group-hover/link:text-white transition-colors truncate w-full"
          title={album.name}
        >
          {album.name}
        </h4>
      </Link>
      <p className="text-sm text-zinc-400 truncate w-full" title={album.artist}>
        {album.artist}
      </p>
      <div className="flex items-center gap-1.5 mt-1">
        <Music2Icon className="w-3.5 h-3.5 text-zinc-500" />
        <span className="text-xs text-zinc-500">{album.tracks} tracks</span>
      </div>

      {isOwnProfile && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 px-0 text-zinc-400 hover:text-zinc-100 hover:bg-transparent"
            >
              {tCommon("manage")} <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-zinc-900 border-zinc-800">
            <DropdownMenuItem className="text-zinc-100 focus:bg-zinc-800 focus:text-white">
              <Link href={`/album/${album.slug}`}>
                {tCommon("viewDetails")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onAddTracks}
              className="text-zinc-100 focus:bg-zinc-800 focus:text-white"
            >
              Add tracks
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </CardFooter>
  </Card>
);
