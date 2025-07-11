/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import { Card } from "@Src/ui/components/ui/card";
import { Button } from "@Src/ui/components/ui/button";
import {
  PlayIcon,
  PauseIcon,
  ListMusicIcon,
  PlusIcon,
  MinusIcon,
} from "lucide-react";
import Link from "next/link";
import useAudioControls from "@Src/lib/hooks/useAudioControls";

interface TrackCardProps {
  track: {
    _id: string;
    name: string;
    image: string;
    music: string;
    artist_name?: string;
    slug?: string;
    price?: number;
    mint_price?: number;
    mint_currency?: string;
    [key: string]: any;
  };
  collection?: {
    name?: string;
    artist_name?: string;
    slug?: string;
    [key: string]: any;
  };
  // Nuevo: estilo alternativo para mostrar como álbum
  isAlbum?: boolean;
  // Nuevo: permitir desactivar botones según estado wallet
  hasWalletConnected?: boolean;
}

export function TrackCard({
  track,
  collection,
  isAlbum = false,
  hasWalletConnected = true,
}: TrackCardProps) {
  const {
    currentSong,
    isPlaying,
    activePlayerId,
    setCurrentSong,
    setActivePlayerId,
    setIsPlaying,
    isInPlaylist,
    handleTogglePlaylist,
    setShowFloatingPlayer,
  } = useAudioControls();

  // Función simple para reproducir/pausar
  const handlePlayToggle = () => {
    if (!hasWalletConnected) return;

    if (track._id === activePlayerId) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentSong({
        ...track,
        artist_name: track.artist_name || collection?.artist_name || "",
        slug: track.slug || collection?.slug || "",
      });
      setActivePlayerId(track._id);
      setIsPlaying(true);
      setShowFloatingPlayer(true);
    }
  };

  // Determinar si la canción está en la playlist
  const isInUserPlaylist = isInPlaylist(track._id || "");

  // Obtener el precio formateado
  const price = track.price || track.mint_price || 0;
  const currency = track.mint_currency || "SOL";

  // Determinar si la canción actual está reproduciéndose
  const isCurrentSongPlaying = isPlaying && activePlayerId === track._id;

  // Clases de tarjeta basadas en el tipo (álbum o track)
  const cardClasses = isAlbum
    ? "relative bg-zinc-900 border-none backdrop-blur-sm overflow-hidden group transition-all duration-300 hover:bg-zinc-900/80 hover:-translate-y-1"
    : "relative bg-zinc-900 border-zinc-800 overflow-hidden group";

  return (
    <Card className={cardClasses}>
      <div className="relative w-full aspect-square overflow-hidden">
        <img
          src={track.image}
          alt={track.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 opacity-70" />

        {/* Botón de reproducción sobre la imagen - se muestra diferente según si es álbum o track */}
        {hasWalletConnected && (
          <Button
            size="icon"
            variant={isAlbum ? "secondary" : "ghost"}
            onClick={handlePlayToggle}
            className={
              isAlbum
                ? "absolute inset-0 m-auto opacity-0 scale-90 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 bg-white hover:bg-white/90 text-zinc-900"
                : "absolute bottom-2 right-2 bg-white text-black rounded-full h-10 w-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg"
            }
          >
            {isCurrentSongPlaying ? (
              <PauseIcon className="h-5 w-5" />
            ) : (
              <PlayIcon className="h-5 w-5" />
            )}
          </Button>
        )}

        {/* Indicador de precio */}
        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-md">
          <span className="text-xs font-medium text-white">
            {price} {currency}
          </span>
        </div>
      </div>

      <div
        className={
          isAlbum
            ? "flex flex-col items-start p-4 bg-zinc-800/50 border-t border-zinc-700/30"
            : "p-3"
        }
      >
        <div
          className={
            isAlbum ? "w-full flex justify-between items-start space-x-3" : ""
          }
        >
          <div className={isAlbum ? "flex-grow min-w-0" : ""}>
            <Link href={`/album/${track.slug || collection?.slug || ""}`}>
              <h3
                className={
                  isAlbum
                    ? "font-semibold text-base text-zinc-100 line-clamp-1 group-hover/link:text-white transition-colors"
                    : "text-sm font-medium text-white truncate hover:underline"
                }
              >
                {track.name}
              </h3>
            </Link>
            <Link
              href={`/u/${track.artist_name || collection?.artist_name || ""}`}
            >
              <p
                className={
                  isAlbum
                    ? "text-sm text-zinc-400 line-clamp-1 group-hover/artist:text-zinc-300 transition-colors"
                    : "text-xs text-zinc-400 truncate hover:text-zinc-300"
                }
              >
                {track.artist_name || collection?.artist_name || ""}
              </p>
            </Link>
          </div>

          {isAlbum && (
            <div className="text-right flex-shrink-0">
              <div className="text-sm font-bold text-white/90">
                {price} {currency}
              </div>
              <div className="text-xs text-zinc-400">
                {track.copies ? `${track.copies} copias` : "NFT"}
              </div>
            </div>
          )}
        </div>

        {!isAlbum && (
          <div className="flex justify-between items-center mt-2">
            {/* Botón para agregar/quitar de la playlist */}
            {hasWalletConnected && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleTogglePlaylist(track)}
                className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
                title={
                  isInUserPlaylist
                    ? "Quitar de la playlist"
                    : "Agregar a la playlist"
                }
              >
                <div className="relative">
                  <ListMusicIcon className="h-4 w-4" />
                  {isInUserPlaylist ? (
                    <MinusIcon className="h-2 w-2 absolute -top-1 -right-1 text-white bg-red-500 rounded-full p-[1px]" />
                  ) : (
                    <PlusIcon className="h-2 w-2 absolute -top-1 -right-1 text-white bg-green-500 rounded-full p-[1px]" />
                  )}
                </div>
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
