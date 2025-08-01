/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useRef, useState, useEffect } from "react";
import { Card } from "@Src/ui/components/ui/card";
import { Button } from "@Src/ui/components/ui/button";
import {
  PlayIcon,
  PauseIcon,
  VolumeIcon,
  ShareIcon,
  ListMusicIcon,
  PlusIcon,
  MinusIcon,
  GiftIcon,
  SkipBackIcon,
  SkipForwardIcon,
  Music,
  Coins,
  X,
} from "lucide-react";
import PlayerHome from "../playerHome";
import Link from "next/link";
import { usePathname } from "next/navigation";
import useAudioControls from "../../lib/hooks/useAudioControls";
import { LikeButton } from "../ui/LikeButton";
import { useCandyMachineMint } from "@Src/lib/hooks/solana/useCandyMachineMint";
import { useBlockchainOperations } from "@Src/lib/hooks/common/useBlockchainOperations";
import { toast } from "sonner";
import { useAppKitAccount } from "@Src/lib/privy";
import { motion } from "framer-motion";
import { MintModal } from "@Src/components/MintModal";
import { TradingInterface } from "@Src/components/TradingInterface";
import { ShareToFarcaster } from "@Src/components/ShareToFarcaster";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@Src/ui/components/ui/dialog";
import SocialProofBadges from "@Src/components/SocialProofBadges";

export default function CardMusicHome({ nftData, collectionData }: any) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrolling, setScrolling] = useState(false);
  const pathname = usePathname();
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isMintModalOpen, setIsMintModalOpen] = useState(false);
  const [selectedSongForMint, setSelectedSongForMint] = useState<any>(null);
  const [isTradingModalOpen, setIsTradingModalOpen] = useState(false);

  // Hook para traducciones
  const t = useTranslations("farcaster");

  // Hooks para minting
  const { mint, isMinting } = useCandyMachineMint();
  const [mintedNft, setMintedNft] = useState<string | null>(null);

  // Hook para operaciones blockchain con Base (ERC1155)
  const baseOperations = useBlockchainOperations({
    blockchain: "base",
    useERC1155: true,
  });

  // Usar nuestro hook actualizado de Privy para la detección de wallet
  const {
    address,
    isConnected,
    status,
    embeddedWalletInfo,
    solanaWalletAddress,
    evmWalletAddress,
  } = useAppKitAccount();

  // Verificar si hay alguna wallet conectada (especialmente importante para Solana)
  const hasWalletConnected =
    isConnected && (!!address || !!solanaWalletAddress || !!evmWalletAddress);

  // Estado de minting combinado para ambas redes
  const isMintingAny = isMinting || baseOperations.isMinting;

  // Obtenemos los valores y métodos del contexto global
  const {
    currentSong,
    isPlaying,
    isMuted,
    activePlayerId,
    setCurrentSong,
    setIsPlaying,
    setActivePlayerId,
    setIsMuted,
    setShowFloatingPlayer,
    handleNextSong,
    handlePrevSong,
    setNftData,
    isInPlaylist,
    handleTogglePlaylist,
    handlePlayPause,
  } = useAudioControls();

  // Preparamos los datos una sola vez sin useEffect
  const enrichedNftData = React.useMemo(() => {
    return nftData.map((nft: any) => {
      const collection = collectionData.find(
        (col: any) => col._id === nft.collectionId
      );
      return {
        ...nft,
        artist_name: collection?.artist_name || "",
        slug: collection?.slug || "",
        network: collection?.network || "",
        // Agregamos también los campos necesarios para minting
        address_collection: collection?.address_collection || "",
        mint_price: collection?.mint_price || 0,
        mint_currency: collection?.mint_currency || "",
        start_mint_date: collection?.start_mint_date || null,
        coin_address: collection?.coin_address || "",
      };
    });
  }, [nftData, collectionData]);

  // Efecto para cargar la primera canción automáticamente al entrar en la página
  // y actualizar la lista global de canciones (nftData)
  useEffect(() => {
    // IMPORTANTE: Actualizar el contexto global con la lista completa de canciones
    setNftData(enrichedNftData);

    // Cargar la primera canción después de un breve retardo para permitir la inicialización
    const loadTimer = setTimeout(() => {
      if (enrichedNftData.length > 0 && !currentSong) {
        console.log(
          "Cargando automáticamente la primera canción en ForYou:",
          enrichedNftData[0].name
        );
        setCurrentSong(enrichedNftData[0]);
        setActivePlayerId(enrichedNftData[0]._id);
        setIsPlaying(true);
      }
    }, 1000);

    return () => clearTimeout(loadTimer);
  }, [
    enrichedNftData,
    currentSong,
    setCurrentSong,
    setActivePlayerId,
    setIsPlaying,
    setNftData,
  ]);

  // Referencia para controlar si es la primera renderización
  const isFirstRender = useRef(true);

  // Efecto para ocultar el FloatingPlayer mientras estamos en esta página
  useEffect(() => {
    // Crear ID único para seguimiento de este efecto específico
    const effectId = Date.now();
    console.log(
      `[CardMusicHome:${effectId}] Inicializando efecto de visibilidad`
    );

    // Variable para almacenar el timeout
    let unmountTimeoutId: NodeJS.Timeout | null = null;

    // Solo ocultar en el primer renderizado para evitar interferencias con otros efectos
    // PERO: no ocultar si hay una canción activa (viene de álbum) y estamos en home/root
    if (isFirstRender.current) {
      const isRootPath = pathname === "/" || pathname.match(/^\/[a-z]{2}$/); // "/" o "/es", "/en", etc.

      // Verificar si hay música reproduciéndose
      const audio = document.querySelector("audio");
      const hasActiveAudio = audio && (audio.currentTime > 0 || !audio.paused);

      // Solo ocultar FloatingPlayer si NO hay canción activa Y NO hay audio reproduciéndose
      if ((!currentSong && !hasActiveAudio) || !isRootPath) {
        console.log(
          `[CardMusicHome:${effectId}] Ocultando FloatingPlayer inicialmente`
        );
        setShowFloatingPlayer(false);
      } else {
        console.log(
          `[CardMusicHome:${effectId}] Manteniendo FloatingPlayer visible (audio activo en home)`
        );
        // Usar un pequeño delay para asegurar coordinación con CardAlbumMusic cleanup
        setTimeout(() => {
          setShowFloatingPlayer(true);
        }, 150);
      }
      isFirstRender.current = false;
    }

    // Función de limpieza al desmontar el componente
    return () => {
      // Limpiar cualquier timeout anterior
      if (unmountTimeoutId) {
        clearTimeout(unmountTimeoutId);
      }

      // Solo si hay una canción activa
      if (currentSong) {
        console.log(
          `[CardMusicHome:${effectId}] Preparando restauración al desmontar`
        );

        // Mostrar el FloatingPlayer después de un delay para permitir completar la navegación
        unmountTimeoutId = setTimeout(() => {
          // Solo mostrar si no estamos en un álbum ni en foryou
          if (!pathname.startsWith("/album/") && pathname !== "/foryou") {
            console.log(
              `[CardMusicHome:${effectId}] Mostrando FloatingPlayer al desmontar`
            );
            setShowFloatingPlayer(true);
          }
        }, 400); // Tiempo suficiente para que termine la navegación
      }
    };
  }, [setShowFloatingPlayer, currentSong]);

  // Efecto para sincronizar el scroll con la canción actual sin bucles
  useEffect(() => {
    if (!scrolling && currentSong && containerRef.current) {
      const songIndex = enrichedNftData.findIndex(
        (song: any) => song._id === currentSong._id
      );
      if (songIndex >= 0) {
        containerRef.current.scrollTo({
          top: songIndex * containerRef.current.clientHeight,
          behavior: "smooth",
        });
      }
    }
  }, [currentSong, scrolling, enrichedNftData]);

  // Efecto para detectar scroll y actualizar la canción actual
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      setScrolling(true);

      scrollTimeoutRef.current = setTimeout(() => {
        setScrolling(false);

        const scrollPosition = container.scrollTop;
        const cardHeight = container.clientHeight;
        const newIndex = Math.round(scrollPosition / cardHeight);

        if (newIndex >= 0 && newIndex < enrichedNftData.length) {
          const newSong = enrichedNftData[newIndex];
          const currentId = currentSong?._id;

          if (newSong && newSong._id !== currentId) {
            setCurrentSong(newSong);
            setActivePlayerId(newSong._id);
            setIsPlaying(true);
          }
        }
      }, 200);
    };

    container.addEventListener("scroll", handleScroll);
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      container.removeEventListener("scroll", handleScroll);
    };
  }, [
    enrichedNftData,
    currentSong?._id,
    setCurrentSong,
    setActivePlayerId,
    setIsPlaying,
  ]);

  // Función simplificada para el botón play/pause
  const togglePlay = () => {
    if (!scrolling && currentSong) {
      // Usar handlePlayPause del hook directamente
      handlePlayPause();
    } else if (!currentSong && enrichedNftData.length > 0) {
      // Si no hay canción actual, seleccionar la primera
      const firstSong = enrichedNftData[0];
      setCurrentSong(firstSong);
      setActivePlayerId(firstSong._id);
      setIsPlaying(true);
    }
  };

  // Funciones para navegación de tracks
  const handlePrevTrack = () => {
    handlePrevSong();
  };

  const handleNextTrack = () => {
    handleNextSong();
  };

  // Función para manejar el procesamiento de minting
  const processMint = async (song: any, amount: number) => {
    try {
      // Mostrar toast de loading
      const toastId = toast.loading("Processing mint...");

      // Encontrar la colección correspondiente al NFT
      const collection = collectionData.find(
        (col: any) => col._id === song.collectionId
      );

      if (!collection) {
        throw new Error("Collection not found");
      }

      let result: any;
      if (collection?.network === "solana") {
        result = await mint({
          candyMachineId: song?.candy_machine || "",
          collectionId: collection?.address_collection || "",
          price: collection?.mint_price,
          startDate: collection?.start_mint_date,
          artist_address_mint: song?.artist_address_mint || "",
          currency: collection?.mint_currency,
        });
      } else if (collection?.network === "base") {
        console.log("Minting on Base", collection?.network);

        // Convertir precio a wei correctamente
        let priceInWei = BigInt(0);
        if (song?.price && song.price > 0) {
          // Convertir el precio decimal a wei
          const priceStr = song.price.toString();
          const priceNumber = parseFloat(priceStr);
          priceInWei = BigInt(Math.floor(priceNumber * 1e18));
        }

        // Mint NFT en Base usando ERC1155 con cantidad seleccionada
        const mintSuccess = await baseOperations.mintNFT({
          collectionAddress: collection?.address_collection || "",
          to: evmWalletAddress || address || "",
          tokenId: song?.id_item || 0,
          amount: amount,
          tokenMetadata: song?.metadata_uri || "",
          pricePerToken: Number(priceInWei),
        });

        if (mintSuccess) {
          result = `${collection?.address_collection}:${song?.id_item}`;
        } else {
          throw new Error("Error claiming NFT");
        }
      } else {
        throw new Error(`Unsupported network: ${collection?.network}`);
      }

      // Asegurarnos de cerrar el toast de loading
      toast.dismiss(toastId);

      if (result) {
        setMintedNft(result.toString());
        // Mostrar toast de éxito con enlaces específicos por red
        toast.success("Claimed successfully", {
          description: (
            <div className="flex flex-col gap-2">
              <p>
                Your {amount > 1 ? `${amount} NFTs have` : "NFT has"} been
                created successfully
              </p>
              {collection?.network === "solana" ? (
                <button
                  onClick={() => {
                    const url = `https://solscan.io/account/${result.toString()}?cluster=devnet`;
                    if (
                      typeof window !== "undefined" &&
                      window.navigator?.clipboard
                    ) {
                      navigator.clipboard.writeText(url).then(() => {
                        toast.success("Copied to clipboard", {
                          description: "Solscan link copied to clipboard",
                        });
                      });
                    }
                  }}
                  className="text-left text-blue-500 hover:text-blue-600 underline cursor-pointer"
                >
                  📋 Copy Solscan link
                </button>
              ) : collection?.network === "base" ? (
                <button
                  onClick={() => {
                    const url = `https://sepolia.basescan.org/address/${collection?.address_collection}`;
                    if (
                      typeof window !== "undefined" &&
                      window.navigator?.clipboard
                    ) {
                      navigator.clipboard.writeText(url).then(() => {
                        toast.success("Copied to clipboard", {
                          description: "BaseScan link copied to clipboard",
                        });
                      });
                    }
                  }}
                  className="text-left text-blue-500 hover:text-blue-600 underline cursor-pointer"
                >
                  📋 Copy BaseScan link
                </button>
              ) : null}
            </div>
          ),
          duration: 4000,
        });
      } else {
        throw new Error("No confirmation received from mint");
      }

      // Cerrar modal si estaba abierto
      setIsMintModalOpen(false);
    } catch (error) {
      // Cerrar el toast de loading en caso de error también
      toast.dismiss();

      // Mostrar toast de error
      toast.error("Error claiming NFT", {
        description:
          error instanceof Error ? error.message : "Please try again later",
        duration: 4000,
      });
    }
  };

  // Función para manejar el click del botón claim (abre el modal o mint directo)
  const handleClaimClick = async (e: React.MouseEvent, song: any) => {
    e.preventDefault();
    e.stopPropagation();

    // Verificar si hay alguna wallet conectada antes de continuar
    if (!hasWalletConnected) {
      toast.error("Wallet not connected", {
        description: "You need to connect your wallet before minting an NFT",
        duration: 4000,
      });
      return;
    }

    // Encontrar la colección correspondiente al NFT
    const collection = collectionData.find(
      (col: any) => col._id === song.collectionId
    );

    if (!collection) {
      toast.error("Collection not found");
      return;
    }

    // Para Solana, mint directo como antes
    if (collection?.network === "solana") {
      await processMint(song, 1);
    } else if (collection?.network === "base") {
      // Para Base, abrir modal para seleccionar cantidad
      setSelectedSongForMint(song);
      setIsMintModalOpen(true);
    } else {
      toast.error(`Unsupported network: ${collection?.network}`);
    }
  };

  // Confirmar mint desde el modal
  const handleConfirmMint = (amount: number) => {
    if (selectedSongForMint) {
      processMint(selectedSongForMint, amount);
    }
  };

  return (
    <div className="h-full w-full sm:h-[870px] sm:w-full md:w-[540px] md:h-[960px] lg:w-[540px] lg:h-[960px] overflow-hidden font-sans mx-auto flex flex-col">
      <div
        ref={containerRef}
        className="flex-1 snap-y snap-mandatory overflow-y-scroll scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style jsx global>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {enrichedNftData.map((song: any) => {
          const collection = collectionData.find(
            (col: any) => col._id === song.collectionId
          );

          // console.log("collection >>>>> ", collection);
          const isInUserPlaylist = isInPlaylist(song._id);

          return (
            <div
              key={song._id}
              className="snap-start h-full w-full flex items-center justify-center"
            >
              <Card className="w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-800 overflow-hidden border-none relative">
                {/* Imagen de fondo */}
                <div className="absolute inset-0">
                  <img
                    src={song.image}
                    alt={`${song.name} cover`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60" />
                </div>

                {/* Layout principal con flexbox */}
                <div className="relative h-full flex flex-col">
                  {/* Header mejorado */}
                  <div className="flex-shrink-0 p-4 pb-2 z-20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                          <Music className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex flex-col">
                          {/* <Link href={`/album/${collection?.slug}`}> */}
                          <span className="text-white font-bold text-sm tracking-wide truncate max-w-[200px]">
                            {collection?.name}
                          </span>
                          {/* </Link> */}
                          <Link href={`/u/${collection?.artist_name}`}>
                            <span className="text-gray-300 font-light text-xs truncate max-w-[200px] hover:underline">
                              {collection?.artist_name}
                            </span>
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Social Proof Badges */}
                    <div className="mt-2">
                      <SocialProofBadges
                        songTitle={song.name}
                        artistName={collection?.artist_name}
                        compact={true}
                        className="justify-start"
                      />
                    </div>
                  </div>

                  {/* Contenido central con botones laterales */}
                  <div className="flex-grow min-h-0 flex items-center md:items-end justify-end pr-4 z-20 sm:flex-1">
                    {/* Botones de acción laterales */}
                    <div className="flex flex-col space-y-3">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setIsMuted(!isMuted)}
                          className="text-white hover:bg-white/20 transition-all bg-black/40 backdrop-blur-sm rounded-full border border-white/20 h-12 w-12"
                        >
                          <VolumeIcon
                            className={`h-5 w-5 ${
                              isMuted ? "text-gray-400" : "text-white"
                            }`}
                          />
                        </Button>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: hasWalletConnected ? 1.1 : 1 }}
                        whileTap={{ scale: hasWalletConnected ? 0.95 : 1 }}
                      >
                        <Button
                          variant="default"
                          size="icon"
                          onClick={() =>
                            hasWalletConnected && handleTogglePlaylist(song)
                          }
                          disabled={!hasWalletConnected}
                          title={
                            !hasWalletConnected
                              ? "Connect wallet to use playlist"
                              : isInUserPlaylist
                              ? "Remove from queue"
                              : "Add to queue"
                          }
                          className={`bg-black/40 backdrop-blur-sm hover:bg-white/20 text-white rounded-full border border-white/20 relative h-12 w-12 ${
                            !hasWalletConnected
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          <ListMusicIcon className="h-5 w-5" />
                          {hasWalletConnected && isInUserPlaylist ? (
                            <MinusIcon className="h-3 w-3 absolute -top-1 -right-1 text-white bg-red-500 rounded-full p-[1px]" />
                          ) : hasWalletConnected ? (
                            <PlusIcon className="h-3 w-3 absolute -top-1 -right-1 text-white bg-green-500 rounded-full p-[1px]" />
                          ) : null}
                        </Button>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: hasWalletConnected ? 1.1 : 1 }}
                        whileTap={{ scale: hasWalletConnected ? 0.95 : 1 }}
                      >
                        <div
                          className={
                            !hasWalletConnected
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }
                        >
                          <LikeButton
                            nftId={song._id}
                            variant="default"
                            size="lg"
                            showCount={false}
                            disabled={!hasWalletConnected}
                          />
                        </div>
                      </motion.div>

                      {/* Trading Button */}
                      <motion.div
                        whileHover={{ scale: hasWalletConnected ? 1.1 : 1 }}
                        whileTap={{ scale: hasWalletConnected ? 0.95 : 1 }}
                      >
                        <Button
                          variant="default"
                          size="icon"
                          onClick={() =>
                            hasWalletConnected && setIsTradingModalOpen(true)
                          }
                          disabled={!hasWalletConnected}
                          title={
                            !hasWalletConnected
                              ? "Connect wallet to trade tokens"
                              : "Trade Tokens"
                          }
                          className={`bg-gradient-to-r from-yellow-500/80 to-orange-500/80 backdrop-blur-sm hover:from-yellow-400/90 hover:to-orange-400/90 text-white rounded-full border border-yellow-400/30 relative h-12 w-12 ${
                            !hasWalletConnected
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          <Coins className="h-5 w-5" />
                        </Button>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <ShareToFarcaster
                          nft={{
                            id: song._id,
                            name: song.name,
                            artist: collection?.artist_name || "",
                            album: collection?.name,
                            genre: song.genre || "",
                            collection_slug: collection?.slug || "",
                            image_cover: song.image,
                          }}
                          type="song"
                        />
                      </motion.div>

                      {/* Botón Claim NFT */}
                      <motion.div
                        whileHover={{
                          scale: hasWalletConnected && !isMintingAny ? 1.1 : 1,
                        }}
                        whileTap={{
                          scale: hasWalletConnected && !isMintingAny ? 0.95 : 1,
                        }}
                      >
                        <Button
                          variant="secondary"
                          size="icon"
                          onClick={(e) => handleClaimClick(e, song)}
                          disabled={!hasWalletConnected || isMintingAny}
                          className={`h-12 w-12 rounded-full bg-gradient-to-r from-purple-600/90 to-blue-600/90 hover:from-purple-500 hover:to-blue-500 text-white transition-all duration-300 backdrop-blur-sm border border-white/20 ${
                            !hasWalletConnected || isMintingAny
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                          title={
                            !hasWalletConnected
                              ? "Connect wallet to claim NFT"
                              : "Claim NFT"
                          }
                        >
                          {isMintingAny ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                            >
                              <svg
                                className="h-5 w-5 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                            </motion.div>
                          ) : (
                            <GiftIcon className="h-5 w-5" />
                          )}
                        </Button>
                      </motion.div>
                    </div>
                  </div>

                  {/* Contenido inferior */}
                  <div className="flex-shrink-0 relative z-20 min-h-[200px] sm:min-h-[320px] flex flex-col justify-center items-center">
                    <div className="flex flex-col items-center space-y-2 sm:space-y-4 p-4 sm:p-6 pt-2">
                      {/* Título de la canción */}
                      <motion.h1
                        className="text-xl sm:text-2xl md:text-3xl font-bold text-white text-center leading-tight max-w-[280px] truncate"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        {song.name}
                      </motion.h1>

                      {/* Controles de reproducción mejorados */}
                      <motion.div
                        className="flex items-center space-y-0 space-x-3 sm:space-x-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handlePrevTrack}
                            className="text-white hover:bg-white/20 transition-all bg-black/20 backdrop-blur-sm rounded-full h-10 w-10 border border-white/20"
                          >
                            <SkipBackIcon className="h-5 w-5" />
                          </Button>
                        </motion.div>

                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="relative"
                        >
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={togglePlay}
                            className="bg-gradient-to-r from-white to-gray-100 text-black rounded-full h-14 w-14 sm:h-16 sm:w-16 hover:from-gray-100 hover:to-white transition-all duration-300 shadow-2xl border-4 border-white/20"
                          >
                            {isPlaying && currentSong?._id === song._id ? (
                              <PauseIcon className="h-7 w-7 sm:h-8 sm:w-8" />
                            ) : (
                              <PlayIcon className="h-7 w-7 sm:h-8 sm:w-8 ml-1" />
                            )}
                          </Button>
                        </motion.div>

                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleNextTrack}
                            className="text-white hover:bg-white/20 transition-all bg-black/20 backdrop-blur-sm rounded-full h-10 w-10 border border-white/20"
                          >
                            <SkipForwardIcon className="h-5 w-5" />
                          </Button>
                        </motion.div>
                      </motion.div>
                    </div>
                  </div>

                  {/* Player component */}
                  <PlayerHome
                    url={song.music}
                    autoplay={
                      isPlaying && activePlayerId === song._id && !scrolling
                    }
                    isPlaying={
                      isPlaying && activePlayerId === song._id && !scrolling
                    }
                    muted={isMuted}
                    onEnded={handleNextSong}
                    trackId={song._id}
                  />
                </div>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Trading Modal */}
      <Dialog open={isTradingModalOpen} onOpenChange={setIsTradingModalOpen}>
        <DialogContent className="max-w-[100vw] sm:max-w-2xl max-h-[95vh] overflow-y-auto overflow-x-hidden bg-[#0a0a0a] border-neutral-800 shadow-2xl p-0 m-0 w-full">
          {/* Custom Close Button - Mobile Optimized */}
          <div className="sticky top-0 z-50 bg-[#0a0a0a] border-b border-neutral-800 w-full">
            <div className="flex items-center justify-between p-3 w-full">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center border border-blue-500/30 flex-shrink-0">
                  <Coins className="h-3 w-3 text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-white text-base font-semibold truncate">
                    Trade Tokens
                  </h2>
                  <p className="text-neutral-400 text-xs truncate">
                    Buy tokens and use them to claim NFTs
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsTradingModalOpen(false)}
                className="h-10 w-10 rounded-full bg-neutral-800/50 hover:bg-neutral-700/50 text-neutral-400 hover:text-white transition-all flex-shrink-0 ml-2"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="w-full overflow-x-hidden">
            <TradingInterface
              coinAddress={
                currentSong?.coin_address ||
                collectionData.find(
                  (col: any) => col._id === currentSong?.collectionId
                )?.coin_address
              }
              title="Trade Tokens"
              description="Buy tokens and use them to claim NFTs"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Mint Modal */}
      {selectedSongForMint &&
        (() => {
          const selectedCollection = collectionData.find(
            (col: any) => col._id === selectedSongForMint?.collectionId
          );

          return (
            <MintModal
              isOpen={isMintModalOpen}
              onClose={() => {
                setIsMintModalOpen(false);
                setSelectedSongForMint(null);
              }}
              onConfirm={handleConfirmMint}
              nftData={selectedSongForMint}
              albumData={{
                name: selectedCollection?.name || "",
                artist_name: selectedCollection?.artist_name || "",
                network: selectedCollection?.network || "",
              }}
              isLoading={isMintingAny}
              currency="ETH"
              maxAmount={100}
              minAmount={1}
            />
          );
        })()}
    </div>
  );
}
