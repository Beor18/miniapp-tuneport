"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Music, Play, Gem } from "lucide-react";
import { Button } from "@/ui/components/ui/button";
import { usePlayer } from "@Src/contexts/PlayerContext";
import { useFarcasterMiniApp } from "@Src/components/FarcasterProvider";
import { toast } from "sonner";

interface PlaylistData {
  _id: string;
  name: string;
  description?: string;
  userId: {
    _id: string;
    nickname: string;
    picture?: string;
    verified?: boolean;
    address?: string; // Dirección de wallet del creador
    fid?: number; // FID de Farcaster del creador
  };
  nfts: Array<any>;
  totalDuration: number;
  tags: string[];
  coverImage?: string;
  createdAt: string;
  score?: number;
}

interface PlaylistsLeaderboardProps {
  playlistsData: PlaylistData[] | null;
}

export default function PlaylistsLeaderboard({
  playlistsData,
}: PlaylistsLeaderboardProps) {
  const { tipContext } = useFarcasterMiniApp();
  const tLeaderboard = useTranslations("farcaster.leaderboard");
  const {
    setCurrentSong,
    addToPlaylist,
    clearPlaylist,
    setShowFloatingPlayer,
    setNftData,
  } = usePlayer();

  const [playlists, setPlaylists] = useState<PlaylistData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [supportingPlaylists, setSupportingPlaylists] = useState<Set<string>>(
    new Set()
  );

  // Cargar datos pre-fetched al montar el componente
  useEffect(() => {
    if (playlistsData) {
      setPlaylists(playlistsData);
      setError(null);
    } else {
      setError("No se pudieron cargar las playlists");
    }
  }, [playlistsData]);

  // Función para reproducir una playlist
  const handlePlayPlaylist = useCallback(
    (playlist: PlaylistData) => {
      if (!playlist.nfts || playlist.nfts.length === 0) {
        console.warn("Playlist vacía:", playlist.name);
        return;
      }

      // Transformar los NFTs de la playlist al formato Track con TODOS los datos necesarios
      const tracks = playlist.nfts.map((nft: any) => ({
        _id: nft._id,
        name: nft.name,
        artist_name:
          playlist.userId.nickname ||
          nft.artist?.name ||
          nft.artist_address_mint ||
          "Unknown Artist",
        artist:
          playlist.userId.nickname ||
          nft.artist?.nickname ||
          nft.artist?.name ||
          "Unknown",
        image: nft.image,
        music: nft.music,
        slug: nft.collectionId?.slug || `nft-${nft._id}`,
        coin_address: nft.coin_address || nft.collectionId?.coin_address,
        // Incluir datos adicionales del NFT para el player
        description: nft.description,
        collectionId: nft.collectionId,
        attributes: nft.attributes,
        properties: nft.properties,
        network: nft.collectionId?.network || nft.network,
        price: nft.collectionId?.price || nft.price,
        // CAMPOS CRÍTICOS PARA MINTING - agregados desde la información de la colección/nft
        address_collection:
          nft.collectionId?.address_collection || nft.address_collection,
        addressCollection:
          nft.collectionId?.address_collection || nft.address_collection, // Alias por compatibilidad
        mint_price: nft.collectionId?.mint_price || nft.mint_price || nft.price,
        mint_currency: nft.collectionId?.mint_currency || nft.mint_currency,
        start_mint_date:
          nft.collectionId?.start_mint_date || nft.start_mint_date,
        candy_machine: nft.candy_machine,
        artist_address_mint: nft.artist_address_mint,
        id_item: nft.id_item || nft.tokenId,
        metadata_uri: nft.metadata_uri || nft.tokenURI,
      }));

      // IMPORTANTE: Actualizar el nftData global para que PlayerBarMobile pueda encontrar los datos completos
      setNftData(tracks);

      // Limpiar playlist anterior y cargar la nueva
      clearPlaylist();

      // Agregar todas las canciones a la playlist
      tracks.forEach((track) => addToPlaylist(track));

      // Empezar reproduciendo la primera canción
      setCurrentSong(tracks[0]);

      // Mostrar el player flotante
      setShowFloatingPlayer(true);

      console.log(
        `🎵 Reproduciendo playlist: ${playlist.name} con ${tracks.length} tracks`
      );
      console.log("🔍 Datos NFT actualizados para minting:", tracks);
    },
    [
      setCurrentSong,
      addToPlaylist,
      clearPlaylist,
      setShowFloatingPlayer,
      setNftData,
    ]
  );

  // Función para apoyar a un creador de playlist usando Farcaster Mini App SDK
  const handleSupportPlaylist = useCallback(
    async (playlist: PlaylistData) => {
      //console.log("🔍 Datos NFT actualizados para minting:", playlist);
      if (!tipContext?.sendToken) {
        console.error("No Farcaster sendToken action available");
        toast.error("Mini App no disponible");
        return;
      }

      setSupportingPlaylists((prev) => new Set(prev).add(playlist._id));

      try {
        const sendTokenParams: {
          token?: string;
          amount?: string;
          recipientAddress?: string;
          recipientFid?: number;
        } = {
          token: "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
          amount: "1000000", // 1 USDC
          // Usar la dirección si está disponible, sino Farcaster puede resolverlo por username
          recipientAddress: playlist.userId.address,
        };

        // Si tenemos el FID del usuario, agregarlo (más confiable que address)
        if (playlist.userId.fid) {
          sendTokenParams.recipientFid = playlist.userId.fid;
        }

        console.log(
          `💎 Enviando tip a la playlist: ${playlist.name} por ${playlist.userId.nickname}`
        );

        // Enviar tip usando Farcaster SDK - puede resolverlo por FID o username
        const result = await tipContext.sendToken(sendTokenParams);

        if (result.success) {
          toast.success(tLeaderboard("tipsSentSuccessfully"));
        } else {
          switch (result.reason) {
            case "rejected_by_user":
              toast.error(tLeaderboard("tipsCancelledByUser"));
              break;
            case "send_failed":
              toast.error(tLeaderboard("errorSendingTips"));
              break;
            default:
              toast.error(tLeaderboard("unknownErrorSendingTips"));
          }
        }
      } catch (error) {
        console.error("SendToken failed:", error);
        toast.error(tLeaderboard("errorConnectingFarcaster"));
      } finally {
        setSupportingPlaylists((prev) => {
          const newSet = new Set(prev);
          newSet.delete(playlist._id);
          return newSet;
        });
      }
    },
    [tipContext, tLeaderboard]
  );

  // Función para obtener estilo del ranking position
  const getRankingStyle = (position: number) => {
    if (position === 1)
      return {
        bg: "bg-gradient-to-r from-yellow-600/30 to-amber-600/30",
        text: "text-yellow-300",
        icon: "🥇",
        glow: "shadow-lg shadow-yellow-500/30",
      };
    if (position === 2)
      return {
        bg: "bg-gradient-to-r from-gray-400/30 to-zinc-400/30",
        text: "text-gray-300",
        icon: "🥈",
        glow: "shadow-lg shadow-gray-400/30",
      };
    if (position === 3)
      return {
        bg: "bg-gradient-to-r from-amber-700/30 to-orange-700/30",
        text: "text-amber-300",
        icon: "🥉",
        glow: "shadow-lg shadow-amber-600/30",
      };
    return {
      bg: "",
      text: "text-zinc-400",
      icon: "",
      glow: "",
    };
  };

  // Ya no necesitamos loading porque los datos vienen pre-fetched

  if (error) {
    return (
      <div className="relative bg-gradient-to-r from-green-500/10 via-blue-500/10 to-purple-500/10 border border-green-500/30 rounded-xl p-8 text-center backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent rounded-xl"></div>
        <div className="relative">
          <span className="text-green-400 text-6xl mb-4 block animate-pulse">
            🎵
          </span>
          <h3 className="text-green-400 font-bold text-xl mb-3">
            {tLeaderboard("beFirstToCreatePlaylists")}
          </h3>
          <p className="text-zinc-300 mb-4">
            {tLeaderboard("noPublicPlaylistsAvailable")}
            <br />
            {tLeaderboard("createPlaylistAppearRanking")}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-300"
          >
            🔄 {tLeaderboard("reload")}
          </button>
        </div>
      </div>
    );
  }

  if (playlists.length === 0) {
    return (
      <div className="relative bg-gradient-to-r from-green-500/10 via-purple-500/10 to-blue-500/10 border border-green-500/30 rounded-xl p-12 text-center backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent rounded-xl"></div>
        <div className="relative">
          <span className="text-6xl mb-6 block animate-pulse">🎶</span>
          <h3 className="text-white font-bold text-2xl mb-3">
            {tLeaderboard("preparingPlaylistRanking")}
          </h3>
          <p className="text-zinc-300 mb-6">
            {tLeaderboard("calculatingPopularPlaylists")}
          </p>
          <div className="flex justify-center">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {playlists.map((playlist, index) => {
        const position = index + 1;
        const rankingStyle = getRankingStyle(position);
        return (
          <div
            key={playlist._id}
            className={`relative group transition-all duration-300 hover:scale-[1.02] rounded-xl ${
              position <= 3 ? rankingStyle.glow : ""
            }`}
          >
            <div
              className={`
                relative bg-gradient-to-r from-zinc-900/80 via-zinc-800/80 to-zinc-900/80
                backdrop-blur-sm border border-zinc-700/60 
                rounded-xl p-4 overflow-hidden
                hover:border-opacity-60 transition-all duration-300
              `}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative flex items-center gap-3 md:gap-4">
                <div
                  className={`
                    flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full border-2 
                    flex items-center justify-center font-bold text-xs md:text-sm
                    ${
                      position <= 3
                        ? rankingStyle.bg + " " + rankingStyle.text
                        : "bg-zinc-800/60 border-zinc-700 text-zinc-400"
                    }
                  `}
                >
                  {position <= 3 ? (
                    <span className="p-0 text-lg md:text-xl">
                      {rankingStyle.icon}
                    </span>
                  ) : (
                    `#${position}`
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 md:gap-2 mb-1">
                    <h3 className="text-white font-semibold text-sm md:text-base truncate">
                      {playlist.name}
                    </h3>

                    {playlist.tags.length > 0 && (
                      <span className="inline-flex items-center px-1 md:px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        {playlist.tags[0]}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-zinc-300 text-xs md:text-sm truncate">
                      {tLeaderboard("by")} @{playlist.userId.nickname}
                    </p>
                    {playlist.userId.verified && (
                      <span
                        className="inline-flex items-center px-1 md:px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        title={tLeaderboard("verified")}
                      >
                        ✓
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Music className="w-3 h-3" />
                      {playlist.nfts.length} {tLeaderboard("tracks")}
                    </span>
                  </div>
                </div>

                <div className="flex-shrink-0 text-right ml-auto pr-1">
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <div className="text-white font-bold text-sm md:text-base">
                        {Math.round(playlist.score || 0)}
                      </div>
                      <div className="text-zinc-400 text-xs">
                        {tLeaderboard("score")}
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePlayPlaylist(playlist)}
                        title={tLeaderboard("play")}
                        className="text-xs border-green-500/30 bg-green-500/10 text-green-300 hover:bg-green-500/20 hover:border-green-400/50 transition-all duration-300 px-2"
                      >
                        <Play className="w-3 h-3" />
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSupportPlaylist(playlist)}
                        disabled={
                          supportingPlaylists.has(playlist._id) ||
                          !tipContext?.sendToken
                        }
                        title={tLeaderboard("tip")}
                        className="text-xs border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 hover:border-purple-400/50 transition-all duration-300 px-2 disabled:opacity-50"
                      >
                        {supportingPlaylists.has(playlist._id) ? (
                          <>⏳</>
                        ) : (
                          <Gem className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
