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
} from "lucide-react";
import PlayerHome from "../playerHome";
import Link from "next/link";
import useAudioControls from "../../lib/hooks/useAudioControls";
import { LikeButton } from "../ui/LikeButton";
import { useCandyMachineMint } from "@Src/lib/hooks/solana/useCandyMachineMint";
import { useBlockchainOperations } from "@Src/lib/hooks/common/useBlockchainOperations";
import { toast } from "sonner";
import { useAppKitAccount } from "@Src/lib/privy";
import { motion } from "framer-motion";
import { MintModal } from "@Src/components/MintModal";

export default function CardMusicHome({ nftData, collectionData }: any) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrolling, setScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isMintModalOpen, setIsMintModalOpen] = useState(false);
  const [selectedSongForMint, setSelectedSongForMint] = useState<any>(null);

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
    setNftData,
    isInPlaylist,
    handleTogglePlaylist,
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
  // Nueva referencia para evitar operaciones duplicadas
  const operationInProgressRef = useRef(false);

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
    if (isFirstRender.current) {
      console.log(
        `[CardMusicHome:${effectId}] Ocultando FloatingPlayer inicialmente`
      );
      setShowFloatingPlayer(false);
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
          const currentPath = window.location.pathname;
          // Solo mostrar si no estamos en un álbum ni en foryou
          if (!currentPath.startsWith("/album/") && currentPath !== "/foryou") {
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
  }, [currentSong?._id, scrolling, enrichedNftData]);

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

  // Función simple para reproducir/pausar
  const handlePlayToggle = (song: any) => {
    if (song._id === activePlayerId) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentSong(song);
      setActivePlayerId(song._id);
      setIsPlaying(true);
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

  // Función para procesar el mint con la cantidad seleccionada
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
          // Si el precio es 0.000001, esto debe ser 1000000000000 wei
          const priceStr = song.price.toString();
          const priceNumber = parseFloat(priceStr);
          priceInWei = BigInt(Math.floor(priceNumber * 1e18));
        }

        console.log("Original price:", song?.price);
        console.log("Price in wei:", priceInWei.toString());
        console.log("Price in ETH:", Number(priceInWei) / 1e18);
        console.log("Amount to mint:", amount);

        // Mint NFT en Base usando ERC1155 con cantidad seleccionada
        const mintSuccess = await baseOperations.mintNFT({
          collectionAddress: collection?.address_collection || "",
          to: evmWalletAddress || address || "",
          tokenId: song?.id_item || 0, // Usar el tokenId del NFT
          amount: amount, // Cantidad seleccionada por el usuario
          tokenMetadata: song?.metadata_uri || "", // Los metadatos se establecen al crear el NFT por primera vez
          pricePerToken: Number(priceInWei), // Precio por token en wei como número
        });

        if (mintSuccess) {
          result = `${collection?.address_collection}:${song?.id_item}`;
          toast.success("Claimed successfully");
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
      setSelectedSongForMint(null);
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

  // Confirmar mint desde el modal
  const handleConfirmMint = (amount: number) => {
    if (selectedSongForMint) {
      processMint(selectedSongForMint, amount);
    }
  };

  return (
    <div className="h-full sm:h-[870px] md:w-[540px] md:h-[960px] lg:w-[540px] lg:h-[960px] overflow-hidden font-sans mx-auto">
      <div
        ref={containerRef}
        className="h-full snap-y snap-mandatory overflow-y-scroll scrollbar-hide"
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
          const isInUserPlaylist = isInPlaylist(song._id);

          return (
            <div
              key={song._id}
              className="snap-start h-full w-full flex items-center justify-center"
            >
              <Card className="w-full h-full bg-black overflow-hidden border-none relative">
                <div className="absolute inset-0">
                  <img
                    src={song.image}
                    alt={`${song.name} cover`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-70" />
                </div>

                <div className="absolute pt-4 left-0 w-full text-center z-20">
                  <Link href={`/album/${collection?.slug}`}>
                    <div className="flex flex-row items-center justify-center gap-2 p-2 bg-gradient-to-r from-transparent via-black/50 to-transparent w-full">
                      <span className="text-md text-white/80">Del álbum</span>
                      <span className="text-md text-white font-semibold hover:underline">
                        {collection?.name}
                      </span>
                    </div>
                  </Link>
                </div>

                {/* Layout principal con flexbox */}
                <div className="relative h-full flex flex-col">
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
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant="default"
                          size="icon"
                          onClick={() => handleTogglePlaylist(song)}
                          title={
                            isInUserPlaylist
                              ? "Remove from queue"
                              : "Add to queue"
                          }
                          className="bg-black/40 backdrop-blur-sm hover:bg-white/20 text-white rounded-full border border-white/20 relative h-12 w-12"
                        >
                          <ListMusicIcon className="h-5 w-5" />
                          {isInUserPlaylist ? (
                            <MinusIcon className="h-3 w-3 absolute -top-1 -right-1 text-white bg-red-500 rounded-full p-[1px]" />
                          ) : (
                            <PlusIcon className="h-3 w-3 absolute -top-1 -right-1 text-white bg-green-500 rounded-full p-[1px]" />
                          )}
                        </Button>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <LikeButton
                          nftId={song._id}
                          variant="default"
                          size="lg"
                          showCount={false}
                        />
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-white hover:bg-white/20 transition-all bg-black/40 backdrop-blur-sm rounded-full border border-white/20 h-12 w-12"
                        >
                          <ShareIcon className="h-5 w-5" />
                        </Button>
                      </motion.div>

                      {/* Botón Claim NFT */}
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant="secondary"
                          size="icon"
                          onClick={(e) => handleClaimClick(e, song)}
                          disabled={!hasWalletConnected || isMintingAny}
                          className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-600/90 to-blue-600/90 hover:from-purple-500 hover:to-blue-500 text-white transition-all duration-300 backdrop-blur-sm border border-white/20"
                          title={
                            !hasWalletConnected ? "Connect wallet" : "Claim NFT"
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
                      <h1 className="text-3xl font-bold text-white text-center">
                        {song.name}
                      </h1>
                      <Link href={`/u/${collection?.artist_name}`}>
                        <p className="text-xl text-white/80">
                          {collection?.artist_name}
                        </p>
                      </Link>

                      {/* Botón de reproducción principal */}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handlePlayToggle(song)}
                        className="bg-white text-black rounded-full h-16 w-16 hover:scale-105 hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-white/20 group"
                      >
                        {isPlaying && activePlayerId === song._id ? (
                          <PauseIcon className="h-8 w-8 group-hover:scale-110 transition-transform" />
                        ) : (
                          <PlayIcon className="h-8 w-8 group-hover:scale-110 transition-transform" />
                        )}
                      </Button>
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
