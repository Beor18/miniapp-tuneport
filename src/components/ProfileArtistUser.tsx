/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, useRef } from "react";
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
import PlaylistCarousel from "./PlaylistCarousel";
import { useTranslations } from "next-intl";
import { useFarcaster } from "@Src/lib/hooks/useFarcaster";

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
    displayName: farcasterDisplayName,
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

        <div className="mt-6 space-y-6">
          {/* Header con nombre y acciones */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold text-white uppercase">
                  {profileName}
                </h2>
                {nickname && (
                  <p className="text-sm font-medium text-zinc-400">
                    @{nickname}
                  </p>
                )}
                {biography && (
                  <p className="text-sm text-zinc-300 leading-relaxed max-w-2xl">
                    {biography}
                  </p>
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
            {farcasterConnected && farcasterUsername && (
              <a
                href={getFarcasterProfileUrl() || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-80"
                title={`@${farcasterUsername} on Farcaster`}
              >
                <img
                  src="/farcaster-icon.svg"
                  className="h-5 w-5"
                  alt="Farcaster"
                  onError={(e) => {
                    // Fallback si no existe el ícono
                    (e.target as HTMLImageElement).src =
                      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzljYTNhZiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptMCA4YzEuMSAwIDItLjkgMi0yaC4wMWMuNjMgMCAxLjA5LS43NSAxLjA5LTEuNXMtLjQ2LTEuNS0xLjA5LTEuNUgxM0MxMS45IDUgMTEgNS45IDExIDdWOWMwIDEuMS45IDIgMiAyeiIvPgo8L3N2Zz4K";
                  }}
                />
              </a>
            )}

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

      {/* Wallet Assets */}
      {isOwnProfile && authenticated && (
        <div className="px-4 sm:px-6 lg:px-8 mt-8">
          {/* Wallet Address - Solo visible para el propietario del perfil */}
          {/* {profile.address && (
            <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-800/60 backdrop-blur-sm rounded-md border border-zinc-700/50 hover:bg-zinc-800 transition-all">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-400">
                  Your address:
                </span>
                <span className="text-sm font-mono text-zinc-200">
                  {truncateAddress(profile.address)}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 rounded-full hover:bg-zinc-700"
                onClick={() => copyToClipboard(profile.address)}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-zinc-400" />
                )}
              </Button>
            </div>
          )} */}
          <WalletAssets />
        </div>
      )}

      {/* Albums Section - Convertido a Carrusel */}
      <div className="px-4 sm:px-6 lg:px-8 mt-12">
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
              className="flex gap-4 overflow-x-auto pb-2 mb-8 scroll-smooth"
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
      <div className="px-4 sm:px-6 lg:px-8 mt-12">
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
      <Link href={`/album/${album.slug}`} className="group/link block">
        <h4 className="font-medium text-zinc-100 group-hover/link:text-white transition-colors">
          {album.name}
        </h4>
      </Link>
      <p className="text-sm text-zinc-400">{album.artist}</p>
      <div className="flex items-center gap-1.5 mt-1">
        <Music2Icon className="w-3.5 h-3.5 text-zinc-500" />
        <span className="text-xs text-zinc-500">
          {album.tracks} {tMusic("addTracks")}
        </span>
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
