/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@Src/ui/components/ui/button";
import { Card, CardContent, CardFooter } from "@Src/ui/components/ui/card";
import {
  Play,
  Pause,
  PlusCircle,
  ListMusic,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@Src/ui/components/ui/dialog";
import WalletConnector from "@Src/components/walletConector";
import Link from "next/link";
import ExploreCategories from "../exploreCategories";

// Importa tu hook personalizado, que ya maneja todo el estado de reproducción
import useAudioControls from "@Src/lib/hooks/useAudioControls";
import { useAppKitAccount } from "@Src/lib/privy";

// Componente de skeleton para una sola tarjeta
const CardSkeleton = () => (
  <Card className="group overflow-hidden border-none bg-zinc-900 backdrop-blur-sm">
    <CardContent className="p-0 relative">
      <div className="relative w-full pt-[100%]">
        <div className="absolute inset-0 bg-zinc-800 animate-pulse"></div>
      </div>
    </CardContent>
    <CardFooter className="flex flex-col items-start p-4 bg-zinc-800/50 border-t border-zinc-700/30">
      <div className="w-full flex justify-between items-start space-x-3">
        <div className="flex-grow min-w-0">
          <div className="h-5 bg-zinc-700 rounded animate-pulse w-3/4 mb-2"></div>
          <div className="h-4 bg-zinc-700/70 rounded animate-pulse w-1/2"></div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="h-4 bg-zinc-700 rounded animate-pulse w-12 mb-1"></div>
          <div className="h-3 bg-zinc-700/70 rounded animate-pulse w-8"></div>
        </div>
      </div>
    </CardFooter>
  </Card>
);

export default function ExploreMusic({ albums, songNft }: any) {
  // Ya no usamos playingId:
  // const [playingId, setPlayingId] = useState<string | null>(null);

  // Obtenemos las funciones y estados del hook:
  const {
    currentSong,
    isPlaying,
    setCurrentSong,
    setIsPlaying,
    setNftData,
    setShowFloatingPlayer,
    isInPlaylist,
    addToPlaylist,
    removeFromPlaylist,
    handleTogglePlaylist,
  } = useAudioControls();

  // Usar el hook actualizado de Privy para obtener el estado de la wallet
  const {
    address,
    isConnected,
    status,
    embeddedWalletInfo,
    solanaWalletAddress,
    evmWalletAddress,
  } = useAppKitAccount();

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Depuración para ver el estado de la conexión
  // console.log("Estado de conexión en ExploreMusic:", {
  //   address,
  //   isConnected,
  //   status,
  //   solanaWalletAddress,
  //   evmWalletAddress,
  // });

  // Verificar si hay alguna wallet conectada
  const hasWalletConnected =
    isConnected && (!!address || !!solanaWalletAddress || !!evmWalletAddress);

  // Scroll helpers
  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = 220; // Aproximadamente el ancho de una card
    el.scrollBy({
      left: dir === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const openDialogOffline = () => {
    if (!hasWalletConnected) {
      setIsWalletModalOpen(true);
      return;
    }
    setIsWalletModalOpen(false);
  };

  const handleClaim = (album: any) => {
    if (!hasWalletConnected) {
      setIsWalletModalOpen(true);
    } else {
      // lógica para "claim"
    }
  };

  useEffect(() => {
    setIsLoading(true);

    // Simulamos un tiempo de carga mínimo para mostrar los skeletons
    // Esto asegura que siempre se vea la animación, incluso si los datos cargan rápidamente
    const minLoadingTime = setTimeout(() => {
      setIsLoading(false);
    }, 1200);

    // 1) Recorrer los álbums y, si hace falta, fusionar campos del álbum con sus canciones.
    // console.log("albums 00 >>>>> ", albums);
    const processedAlbums = albums.map((album: any) => {
      //console.log("album 01 >>>>> ", album);
      const songs = album?.songs.map((song: any) => ({
        ...song,
        artist_name: album?.creatorNickname || album?.artist,
        price: song?.price,
        currency: album?.mintCurrency,
        addressCollection: album?.addressCollection,
        slug: album?.slug,
        start_mint_date: album?.startMintDate,
        candyMachine: song?.candy_machine,
      }));

      //console.log("processedAlbums 02 >>>>> ", songs);
      return {
        ...album,
        songs,
      };
    });

    // 2) Unificamos TODAS las canciones para el PlayerContext:
    const allSongs = processedAlbums.flatMap((alb: any) => alb.songs || []);

    // 3) Guardamos en el contexto
    setNftData(allSongs);

    return () => clearTimeout(minLoadingTime);
  }, [albums, setNftData]);

  const togglePlay = (album: any) => {
    // Si el usuario no está conectado, mostramos el modal
    if (!hasWalletConnected) {
      setIsWalletModalOpen(true);
      return;
    }

    // Si el álbum no tiene canciones, no hacemos nada
    if (!album.songs || album.songs.length === 0) {
      return;
    }

    // Tomamos la primera canción (o la que prefieras)
    const firstSong = album.songs[0];

    // Obtenemos los IDs
    const firstSongId = firstSong._id || firstSong.id;
    const currentSongId = currentSong?._id || currentSong?.id;

    // Si la canción actual ES la misma => solo togglear el play/pause
    if (firstSongId === currentSongId) {
      setIsPlaying(!isPlaying);
    } else {
      // Si es una canción distinta => reproducir la nueva
      setCurrentSong(firstSong);
      setShowFloatingPlayer(true);
      setIsPlaying(true);
    }
  };

  // Determinamos cuántos skeletons mostrar según el tamaño de la pantalla
  const getSkeletonCount = () => {
    // Para carrusel, mostramos suficientes items para llenar la vista + algunos más
    return 8; // Esto asegura que haya suficientes skeletons visibles en el carrusel
  };

  return (
    <>
      {/* Título y flechas alineados */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl uppercase font-semibold text-zinc-100/90">
          Trading Releases
        </h3>
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
      </div>
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto pb-6 mb-28 scroll-smooth"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {isLoading ? (
            // Mostrar skeletons mientras carga
            Array(getSkeletonCount())
              .fill(0)
              .map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className="w-44 sm:w-48 flex-shrink-0 first:ml-0"
                >
                  <CardSkeleton />
                </div>
              ))
          ) : albums && albums.length > 0 ? (
            // Mostrar álbumes reales cuando termina de cargar
            albums.map((album: any) => {
              const firstSong = album.songs?.[0];
              const firstSongId = firstSong?._id || firstSong?.id;
              const currentSongId = currentSong?._id || currentSong?.id;
              const isAlbumPlaying =
                firstSongId && firstSongId === currentSongId && isPlaying;
              const isFirstSongInPlaylist =
                firstSong && isInPlaylist(firstSongId);

              return (
                <div
                  key={album.id}
                  className="w-40 sm:w-48 flex-shrink-0 first:ml-0"
                >
                  <Card className="group overflow-hidden border-none bg-zinc-900 backdrop-blur-sm transition-all duration-300 hover:bg-zinc-900/80 hover:-translate-y-1 h-full">
                    <CardContent className="p-0 relative">
                      <div className="relative w-full pt-[100%]">
                        <img
                          src={album.image}
                          alt={album.name}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 will-change-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                          {hasWalletConnected && (
                            <Button
                              variant="secondary"
                              size="icon"
                              className="opacity-0 scale-90 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 bg-white hover:bg-white/90 text-zinc-900"
                              onClick={() => togglePlay(album)}
                              disabled={!album.songs}
                              aria-label={isAlbumPlaying ? "Pause" : "Play"}
                            >
                              {isAlbumPlaying ? (
                                <Pause className="h-5 w-5" />
                              ) : (
                                <Play className="h-5 w-5" />
                              )}
                            </Button>
                          )}
                        </div>

                        {/* Botón de biblioteca en esquina superior derecha con animación mejorada */}
                        {hasWalletConnected && firstSong && (
                          <div className="absolute top-2 right-2 z-10">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`w-7 h-7 p-0 rounded-full backdrop-blur-sm opacity-100
                                  transition-all duration-300 shadow-lg hover:shadow-xl
                                  active:scale-90 active:duration-100 ${
                                    isFirstSongInPlaylist
                                      ? "bg-green-500/40 hover:bg-green-500/60 border border-green-400/50"
                                      : "bg-black/60 hover:bg-black/80 border border-white/20"
                                  }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTogglePlaylist(firstSong);
                              }}
                              disabled={!album.songs}
                              aria-label={
                                isFirstSongInPlaylist
                                  ? "Remove from queue"
                                  : "Add to queue"
                              }
                              title={
                                isFirstSongInPlaylist
                                  ? "Remove from queue"
                                  : "Add to queue"
                              }
                            >
                              {isFirstSongInPlaylist ? (
                                <CheckCircle className="h-3.5 w-3.5 text-white animate-pulse" />
                              ) : (
                                <ListMusic className="h-3.5 w-3.5 text-white" />
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col items-start p-4 bg-zinc-800/50 border-t border-zinc-700/30">
                      <div className="w-full flex justify-between items-start space-x-3">
                        {hasWalletConnected ? (
                          <div className="flex-grow min-w-0">
                            <Link
                              href={`album/${album.slug}`}
                              className="group/link block"
                            >
                              <h3 className="font-semibold text-base text-zinc-100 line-clamp-1 group-hover/link:text-white transition-colors">
                                {album.name}
                              </h3>
                            </Link>
                            <Link
                              href={`u/${
                                album.creatorNickname || album.artist
                              }`}
                              className="group/artist block"
                            >
                              <p className="text-sm text-zinc-400 line-clamp-1 group-hover/artist:text-zinc-300 transition-colors">
                                {album.creatorNickname || album.artist}
                              </p>
                            </Link>
                          </div>
                        ) : (
                          <div className="flex-grow min-w-0">
                            <Link
                              href=""
                              onClick={openDialogOffline}
                              className="group/link block"
                            >
                              <h3 className="font-semibold text-base text-zinc-100 line-clamp-1 group-hover/link:text-white transition-colors">
                                {album.name}
                              </h3>
                            </Link>
                            <Link
                              href=""
                              onClick={openDialogOffline}
                              className="group/artist block"
                            >
                              <p className="text-sm text-zinc-400 line-clamp-1 group-hover/artist:text-zinc-300 transition-colors">
                                {album.creatorNickname || album.artist}
                              </p>
                            </Link>
                          </div>
                        )}
                        <div className="text-right flex-shrink-0">
                          <p className="text-[14px] font-medium text-zinc-100">
                            {album.mintPrice} BASE
                          </p>
                          <p className="text-xs text-zinc-500">Price</p>
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                </div>
              );
            })
          ) : (
            // Mostrar mensaje cuando no hay álbumes disponibles
            <div className="w-full flex flex-col items-center justify-center bg-zinc-900/50 rounded-lg py-16 px-4">
              <div className="text-center max-w-md">
                <div className="mb-4">
                  <ListMusic className="w-16 h-16 text-zinc-600 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-zinc-300 mb-2">
                  No Music Available
                </h3>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  There are no albums available at the moment. Check back later
                  for new releases.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Gradiente para indicar que se puede deslizar */}
        <div className="absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-neutral-800 to-transparent pointer-events-none opacity-60"></div>
      </div>

      <Dialog open={isWalletModalOpen} onOpenChange={setIsWalletModalOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-700">
          <DialogHeader>
            <DialogTitle>Connect To Start</DialogTitle>
            <DialogDescription>
              You need to connect to play music or claim.
            </DialogDescription>
          </DialogHeader>
          <WalletConnector />
        </DialogContent>
      </Dialog>
    </>
  );
}
