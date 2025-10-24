/* eslint-disable @next/next/no-img-element */
"use client";
import Image from "next/image";
import {
  SkipBackIcon,
  SkipForwardIcon,
  PlayIcon,
  PauseIcon,
  Volume2Icon,
  GiftIcon,
  ListMusicIcon,
  Lock,
} from "lucide-react";
import { Button } from "@Src/ui/components/ui/button";
import { Slider } from "@Src/ui/components/ui/slider";
import PaymentDialog from "@Src/components/paymentDialog";
import { Playlist } from "../playList";
import Link from "next/link";
import { usePlayer } from "../../contexts/PlayerContext";
import { useCallback, useState, useEffect } from "react";
import { cn } from "@Src/ui/lib/utils";
import { LikeButton } from "../ui/LikeButton";
import { useCandyMachineMint } from "@Src/lib/hooks/solana/useCandyMachineMint";
import { useBlockchainOperations } from "@Src/lib/hooks/common/useBlockchainOperations";
import { toast } from "sonner";
import { useAppKitAccount } from "@Src/lib/privy";
import { motion, AnimatePresence } from "framer-motion";
import { TradingInterface } from "@Src/components/TradingInterface";
import { MintModal } from "@Src/components/MintModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@Src/ui/components/ui/dialog";
import { Coins, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useX402Payment } from "@Src/lib/hooks/base/useX402Payment";

interface PlayerBarProps {
  currentSong: any;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  showPlaylist: boolean;
  playlist: any[];
  videoRef: React.RefObject<HTMLVideoElement>;

  handlePlayPause: () => void;
  handlePrevSong: () => void;
  handleNextSong: () => void;
  handleMint: (song: any) => void;
  handlePayment: (track: any) => void;
  handleSongSelect: (song: any) => void;
  handleReorder: (startIndex: any, endIndex: any) => void;
  handleVolumeChange: (value: number[]) => void;
  setShowPlaylist: (val: boolean) => void;
  userId?: string; // Nuevo prop para el usuario
}

export function PlayerBar({
  currentSong,
  isPlaying,
  currentTime,
  duration,
  volume,
  showPlaylist,
  playlist,
  videoRef,
  handlePlayPause,
  handlePrevSong,
  handleNextSong,
  handleMint,
  handlePayment,
  handleSongSelect,
  handleReorder,
  handleVolumeChange,
  setShowPlaylist,
  userId,
}: PlayerBarProps) {
  // Traducciones
  const tX402 = useTranslations("x402");

  // ✅ Hook x402 para desbloquear contenido
  const { unlockContent: x402UnlockContent, checkUnlockStatus } =
    useX402Payment({
      onSuccess: (contentId, txHash) => {
        console.log("✅ Content unlocked from PlayerBar:", contentId, txHash);
        toast.success(tX402("success.unlocked"), {
          description: tX402("success.enjoyContent"),
        });
        // Recargar la página para actualizar el estado
        window.location.reload();
      },
      onError: (error) => {
        console.error("❌ Failed to unlock from PlayerBar:", error);
      },
    });

  // Hooks para minting
  const { mint, isMinting } = useCandyMachineMint();
  const [mintedNft, setMintedNft] = useState<string | null>(null);
  const [isTradingModalOpen, setIsTradingModalOpen] = useState(false);
  const [isMintModalOpen, setIsMintModalOpen] = useState(false);
  const [selectedSongForMint, setSelectedSongForMint] = useState<any>(null);

  //console.log("currentSong FFF ", currentSong);
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

  // Acceder al contexto para obtener el audioRef (a nivel superior del componente)
  const {
    audioRef,
    isTransitioning,
    isTikTokMode,
    userPlaylist,
    removeFromPlaylist,
    nftData,
    isContentLocked, // ✅ Estado de bloqueo de contenido premium
    currentSong: contextCurrentSong, // ✅ Obtener currentSong del contexto que tiene x402Config
    setIsContentLocked, // ✅ Setter para actualizar el estado de bloqueo
  } = usePlayer();

  // ✅ Usar currentSong del contexto en lugar del prop (tiene más datos)
  const enrichedCurrentSong = contextCurrentSong || currentSong;

  // ✅ Efecto para verificar el unlock status cuando cambia la canción en PlayerBar
  useEffect(() => {
    if (!enrichedCurrentSong || !enrichedCurrentSong.albumId) {
      setIsContentLocked(false);
      return;
    }

    const checkCurrentSongUnlock = async () => {
      const songConfig = enrichedCurrentSong.x402Config;

      console.log("🎵 PlayerBar - Verificando unlock:", {
        songName: enrichedCurrentSong.name,
        albumId: enrichedCurrentSong.albumId,
        hasSongConfig: !!songConfig,
        hasPrice: !!songConfig?.price,
      });

      // Si no tiene configuración x402 o no tiene precio, está desbloqueado
      if (!songConfig || !songConfig.price || !songConfig.recipientAddress) {
        console.log("✅ PlayerBar - Contenido libre (no premium)");
        setIsContentLocked(false);
        return;
      }

      // Si no hay wallet, está bloqueado
      if (!hasWalletConnected || !evmWalletAddress) {
        console.log("⚠️ PlayerBar - Sin wallet, contenido bloqueado");
        setIsContentLocked(true);
        return;
      }

      console.log("🔍 PlayerBar - Verificando en backend:", {
        albumId: enrichedCurrentSong.albumId,
        wallet: evmWalletAddress,
      });

      // Verificar en el backend
      try {
        const status = await checkUnlockStatus(enrichedCurrentSong.albumId);
        console.log("📥 PlayerBar - Respuesta backend:", {
          isUnlocked: status.isUnlocked,
          hasPaid: status.hasPaid,
        });
        setIsContentLocked(!status.isUnlocked);
      } catch (error) {
        console.error("❌ PlayerBar - Error checking unlock:", error);
        setIsContentLocked(true);
      }
    };

    checkCurrentSongUnlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    enrichedCurrentSong?._id,
    enrichedCurrentSong?.albumId,
    hasWalletConnected,
    evmWalletAddress,
  ]);

  // Estados para el formulario de crear playlist
  //console.log("currentSong: ", currentSong);

  // Adaptador para la función handleReorder que convierte el nuevo formato al antiguo
  const handleReorderAdapter = useCallback(
    (newOrder: any[]) => {
      // En este caso, simplemente pasamos el nuevo orden directamente
      // ya que la función en useAudioControls ha sido actualizada para aceptar
      // un arreglo completo de canciones
      handleReorder(newOrder, 0);
    },
    [handleReorder]
  );

  // Función para eliminar una canción de la playlist
  const handleRemoveFromPlaylist = useCallback(
    (song: any) => {
      removeFromPlaylist(song.id || song._id);
    },
    [removeFromPlaylist]
  );

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Manejo seguro de la búsqueda en el tiempo
  const handleSeek = useCallback(
    (newTime: number[]) => {
      // Ya no necesitamos acceder a usePlayer() aquí, usamos el audioRef del nivel superior
      // const { audioRef } = usePlayer(); <-- ELIMINAMOS ESTA LÍNEA

      // Guardar el estado de reproducción actual
      const wasPlaying = isPlaying;

      // Obtener el tiempo deseado
      const seekTime = newTime[0];

      // Actualizar en ambas referencias para mantener sincronía
      if (videoRef.current) {
        videoRef.current.currentTime = seekTime;
      }

      // La referencia principal de audio (la que realmente se reproduce)
      if (audioRef.current) {
        // Verificar que el audio esté en un estado donde se pueda buscar
        if (audioRef.current.readyState >= 2) {
          audioRef.current.currentTime = seekTime;

          // Reanudar la reproducción solo si es necesario y después de un pequeño retraso
          if (wasPlaying && audioRef.current.paused) {
            // Usar setTimeout para separar la operación de seek de la reproducción
            setTimeout(() => {
              if (
                audioRef.current &&
                audioRef.current.paused &&
                audioRef.current.readyState >= 2
              ) {
                audioRef.current.play().catch((e) => {
                  // Ignore AbortError which is expected in some situations
                  if (e.name !== "AbortError") {
                    console.error("Error resuming playback after seeking:", e);
                  }
                });
              }
            }, 50);
          }
        }
      }
    },
    [videoRef, isPlaying, audioRef] // Agregamos audioRef a las dependencias
  );

  // Clases CSS condicionales
  const playerBarClass = `fixed bottom-0 left-0 right-0 z-40 hidden md:block border-t border-zinc-800 bg-zinc-900/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/75 ${
    isTikTokMode ? "bg-black/50 backdrop-blur-md" : ""
  }`;

  // Manejador para mostrar/ocultar la playlist
  const togglePlaylist = useCallback(() => {
    setShowPlaylist(!showPlaylist);
  }, [showPlaylist, setShowPlaylist]);

  // Manejador para crear playlist desde In Queue - ya no se usa, la lógica está en el componente Playlist
  const handleCreatePlaylistFromQueue = useCallback(() => {
    // Esta función ya no es necesaria, la creación de playlist se maneja en el componente Playlist
  }, []);

  // Función para manejar el click del botón claim (abre el modal o mint directo)
  const handleClaimClick = async (e: React.MouseEvent) => {
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

    if (!currentSong) {
      toast.error("No song selected", {
        description: "Please select a song to mint",
        duration: 4000,
      });
      return;
    }

    // Find the complete NFT data to get collection information
    const fullNftData = nftData.find((nft: any) => nft._id === currentSong._id);
    console.log("NFT DATA: ", nftData);

    if (!fullNftData) {
      toast.error("NFT data not found", {
        description: "Unable to find complete NFT information",
        duration: 4000,
      });
      return;
    }

    // Detect the network from the complete NFT data
    const network = fullNftData.network;

    if (!network) {
      toast.error("Network not detected", {
        description: "Unable to determine blockchain network for this NFT",
        duration: 4000,
      });
      return;
    }

    // Para Solana, mint directo como antes
    if (network === "solana") {
      await processMint(fullNftData, 1);
    } else if (network === "base") {
      // Para Base, abrir modal para seleccionar cantidad
      console.log("fullNftData: ", fullNftData);
      setSelectedSongForMint(fullNftData);
      setIsMintModalOpen(true);
    } else {
      toast.error(`Unsupported network: ${network}`);
    }
  };

  // Función para procesar el mint con la cantidad seleccionada
  const processMint = async (fullNftData: any, amount: number) => {
    try {
      // Mostrar toast de loading
      const toastId = toast.loading("Processing mint...");

      const network = fullNftData.network;

      let result: any;
      if (network === "solana") {
        result = await mint({
          candyMachineId: fullNftData?.candy_machine || "",
          collectionId: fullNftData?.addressCollection || "",
          price: fullNftData?.mint_price,
          startDate: fullNftData?.start_mint_date,
          artist_address_mint: fullNftData?.artist_address_mint || "",
          currency: fullNftData?.mint_currency,
        });
      } else if (network === "base") {
        // Mint NFT on Base using ERC1155 con cantidad seleccionada
        // Convertir precio a wei correctamente
        let priceInWei = BigInt(0);
        if (fullNftData?.mint_price && fullNftData.mint_price > 0) {
          // Convertir el precio decimal a wei
          // Si el precio es 0.000001, esto debe ser 1000000000000 wei
          const priceStr = fullNftData.mint_price.toString();
          const priceNumber = parseFloat(priceStr);
          priceInWei = BigInt(Math.floor(priceNumber * 1e18));
        }

        console.log("Original price:", fullNftData);
        console.log("Price in wei:", priceInWei.toString());
        console.log("Price in ETH:", Number(priceInWei) / 1e18);
        console.log("Amount to mint:", amount);

        const mintSuccess = await baseOperations.mintNFT({
          collectionAddress: fullNftData?.address_collection || "",
          to: evmWalletAddress || address || "",
          tokenId: fullNftData?.id_item || 0, // Use the NFT tokenId
          amount: amount, // Cantidad seleccionada por el usuario
          tokenMetadata: fullNftData?.metadata_uri || "", // Metadata is set when creating the NFT for the first time
          pricePerToken: Number(priceInWei), // Price per token in wei
        });

        if (mintSuccess) {
          result = `${fullNftData?.address_collection}:${fullNftData?.id_item}`;
          toast.success("NFT successfully minted on Base!");
        } else {
          throw new Error("Error minting NFT on Base");
        }
      } else {
        throw new Error(`Unsupported network: ${network}`);
      }

      // Asegurarnos de cerrar el toast de loading
      toast.dismiss(toastId);

      if (result) {
        setMintedNft(result.toString());
        // Show success toast with network-specific links
        toast.success("NFT minted successfully!", {
          description: (
            <div className="flex flex-col gap-2">
              <p>
                Your {amount > 1 ? `${amount} NFTs have` : "NFT has"} been
                created successfully
              </p>
              {network === "solana" ? (
                <button
                  onClick={() => {
                    const url = `https://solscan.io/account/${result.toString()}?cluster=devnet`;
                    if (
                      typeof window !== "undefined" &&
                      window.navigator?.clipboard
                    ) {
                      navigator.clipboard.writeText(url).then(() => {
                        toast.success("Link copied!", {
                          description:
                            "The Solscan link has been copied to clipboard",
                        });
                      });
                    }
                  }}
                  className="text-left text-blue-500 hover:text-blue-600 underline cursor-pointer"
                >
                  📋 Copy Solscan link
                </button>
              ) : network === "base" ? (
                <button
                  onClick={() => {
                    const url = `https://sepolia.basescan.org/address/${fullNftData?.address_collection}`;
                    if (
                      typeof window !== "undefined" &&
                      window.navigator?.clipboard
                    ) {
                      navigator.clipboard.writeText(url).then(() => {
                        toast.success("Link copied!", {
                          description:
                            "The BaseScan link has been copied to clipboard",
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
      toast.error("Error minting NFT", {
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

  // ✅ Handler para desbloquear contenido desde PlayerBar
  const handleUnlockContent = async () => {
    if (!enrichedCurrentSong || !enrichedCurrentSong.albumId) return;

    const songConfig = enrichedCurrentSong.x402Config;
    if (!songConfig || !songConfig.price || !songConfig.recipientAddress)
      return;

    if (!hasWalletConnected || !evmWalletAddress) {
      toast.error(tX402("errors.walletRequired"), {
        description: tX402("errors.connectWallet"),
      });
      return;
    }

    try {
      await x402UnlockContent(enrichedCurrentSong.albumId, songConfig);
    } catch (error) {
      console.error("Error unlocking content:", error);
    }
  };

  return (
    <div className={playerBarClass}>
      {/* ✅ x402 Premium Overlay - Adaptado al PlayerBar */}
      <AnimatePresence>
        {enrichedCurrentSong?.x402Config &&
          enrichedCurrentSong.x402Config.price &&
          enrichedCurrentSong.x402Config.recipientAddress &&
          isContentLocked && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950/95 backdrop-blur-xl border-t border-purple-500/30"
            >
              <div className="flex items-center gap-6 px-6">
                {/* Lock Icon - Más pequeño */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="relative flex-shrink-0"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center shadow-xl">
                    <Lock className="w-8 h-8 text-white" />
                  </div>
                  <motion.div
                    className="absolute inset-0 rounded-full bg-purple-500/30"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>

                {/* Content - Horizontal layout */}
                <div className="flex items-center gap-6 flex-1">
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-white mb-1">
                      {tX402("premiumContent")}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {enrichedCurrentSong.x402Config.description ||
                        tX402("unlockDescription", {
                          albumName:
                            enrichedCurrentSong.albumName ||
                            enrichedCurrentSong.name_album ||
                            "this content",
                        })}
                    </p>
                  </div>

                  {/* Price Display - Compacto */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg border border-purple-500/30">
                    <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                      {enrichedCurrentSong.x402Config.price}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {enrichedCurrentSong.x402Config.currency || "USDC"}
                    </span>
                  </div>

                  {/* Unlock Button - Compacto */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={handleUnlockContent}
                      disabled={!hasWalletConnected || !evmWalletAddress}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {tX402("unlockWithUsdc")}
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
      </AnimatePresence>

      <div className="w-full bg-zinc-950 border-t border-zinc-900 text-white py-3 px-4">
        {currentSong ? (
          <div className="flex items-center justify-between gap-4">
            {/* Sección de información de la canción */}
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md">
                <Link href={`/album/${currentSong.slug}`}>
                  <img
                    src={
                      currentSong.image?.startsWith("http")
                        ? currentSong.image
                        : `/${currentSong.image}`
                    }
                    alt="Album cover"
                    width={64}
                    height={64}
                    className="object-cover"
                  />
                </Link>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-medium text-zinc-100">
                  {currentSong.name}
                </h3>
                <Link
                  href={`/u/${
                    currentSong.artist_name || currentSong.artist || ""
                  }`}
                >
                  <p className="truncate text-xs text-zinc-400">
                    {currentSong.artist_name || currentSong.artist || ""}
                  </p>
                </Link>
              </div>
            </div>

            {/* Controles principales */}
            <div className="flex flex-col items-center gap-2 flex-1 max-w-2xl">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-zinc-400 hover:text-white hover:bg-zinc-800"
                  onClick={() => {
                    // ✅ Bloquear si el contenido está bloqueado
                    if (isContentLocked) {
                      toast.error(tX402("errors.contentLocked"), {
                        description: tX402("errors.unlockToPlay"),
                      });
                      return;
                    }
                    handlePrevSong();
                  }}
                >
                  <SkipBackIcon className="h-5 w-5" />
                </Button>
                <Button
                  className="bg-white hover:bg-white text-black rounded-full w-10 h-10 p-2 flex items-center justify-center"
                  onClick={() => {
                    // ✅ Bloquear si el contenido está bloqueado
                    if (isContentLocked) {
                      toast.error(tX402("errors.contentLocked"), {
                        description: tX402("errors.unlockToPlay"),
                      });
                      return;
                    }
                    handlePlayPause();
                  }}
                >
                  {isPlaying ? (
                    <PauseIcon className="h-10 w-10" />
                  ) : (
                    <PlayIcon className="h-10 w-10" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-zinc-400 hover:text-white hover:bg-zinc-800"
                  onClick={() => {
                    // ✅ Bloquear si el contenido está bloqueado
                    if (isContentLocked) {
                      toast.error(tX402("errors.contentLocked"), {
                        description: tX402("errors.unlockToPlay"),
                      });
                      return;
                    }
                    handleNextSong();
                  }}
                >
                  <SkipForwardIcon className="h-5 w-5" />
                </Button>
              </div>

              {/* Progress bar */}
              <div className="w-full flex items-center space-x-2">
                <span className="text-xs text-gray-400 mr-2">
                  {formatTime(currentTime)}
                </span>
                <Slider
                  defaultValue={[0]}
                  max={duration}
                  step={1}
                  value={[currentTime]}
                  onValueChange={handleSeek}
                  className="flex-grow"
                />
                <span className="text-xs text-gray-400">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Controles secundarios */}
            <div className="flex items-center gap-2">
              {/* Like Button */}
              <LikeButton
                nftId={currentSong?._id || ""}
                variant="minimal"
                size="sm"
                showCount={true}
                className="flex items-center gap-2"
              />

              {/* Botón Claim NFT */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClaimClick}
                  disabled={!hasWalletConnected || isMintingAny}
                  className="h-9 w-9 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all duration-200"
                  title={!hasWalletConnected ? "Connect wallet" : "Claim NFT"}
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
                        className="h-4 w-4 text-zinc-400"
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
                    <GiftIcon className="h-4 w-4" />
                  )}
                </Button>
              </motion.div>

              {/* Trading Button */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsTradingModalOpen(true)}
                  className="h-9 w-9 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all duration-200"
                  title="Trade Tokens"
                >
                  <Coins className="h-4 w-4" />
                </Button>
              </motion.div>

              {/* Botón de Cola Actual */}
              <Button
                className={`${
                  showPlaylist
                    ? "bg-zinc-700 text-white"
                    : "bg-zinc-900 text-zinc-400"
                } border border-zinc-700/50 hover:text-white hover:bg-zinc-800 hover:border-zinc-600 transition-all duration-300 rounded-full px-4 py-2 flex items-center gap-2 group`}
                onClick={togglePlaylist}
                title="Show your queue"
              >
                <ListMusicIcon className="h-4 w-4 group-hover:text-white transition-colors" />
                <span className="text-sm font-medium">
                  In Queue
                  {userPlaylist.length > 0 && `(${userPlaylist.length})`}
                </span>
              </Button>

              <div className="flex items-center space-x-2">
                <Volume2Icon className="h-5 w-5 text-zinc-400" />
                <Slider
                  defaultValue={[volume]}
                  max={1}
                  step={0.01}
                  value={[volume]}
                  onValueChange={handleVolumeChange}
                  className="w-24"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div className="animate-pulse bg-zinc-800 h-12 w-full rounded-lg"></div>
          </div>
        )}

        <PaymentDialog
          onConfirmClaim={(track) => Promise.resolve(handlePayment(track))}
        />

        {showPlaylist && (
          <Playlist
            isVisible={showPlaylist}
            onClose={() => setShowPlaylist(false)}
            songs={userPlaylist}
            currentSong={currentSong}
            onSongSelect={handleSongSelect}
            onReorder={handleReorderAdapter}
            onRemove={handleRemoveFromPlaylist}
            onCreatePlaylist={handleCreatePlaylistFromQueue}
          />
        )}

        <video
          ref={videoRef}
          preload="metadata"
          width="0"
          height="0"
          style={{ opacity: 0, position: "absolute", left: 0, top: 0 }}
          playsInline
        />

        {/* Trading Modal */}
        <Dialog open={isTradingModalOpen} onOpenChange={setIsTradingModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border-neutral-800 shadow-2xl">
            <DialogHeader className="border-b border-neutral-800 pb-4 relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsTradingModalOpen(false)}
                className="absolute right-0 top-0 h-8 w-8 text-neutral-400 hover:text-white hover:bg-neutral-800"
              >
                <X className="h-4 w-4" />
              </Button>
              <DialogTitle className="flex items-center gap-3 text-white text-xl font-semibold pr-8">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                  <Coins className="h-4 w-4 text-blue-400" />
                </div>
                Trade {currentSong?.name_album || "Song"} Tokens
              </DialogTitle>
              <p className="text-neutral-400 text-sm mt-2">
                Buy tokens for {currentSong?.name_album || "this song"} and use
                them to claim NFTs
              </p>
            </DialogHeader>
            <TradingInterface
              coinAddress={currentSong?.coin_address}
              title={`Trade ${currentSong?.name_album || "Song"} Tokens`}
              description={`Buy tokens for ${
                currentSong?.name_album || "this collection"
              } and use them to claim NFTs`}
            />
          </DialogContent>
        </Dialog>

        {/* Mint Modal */}
        <MintModal
          isOpen={isMintModalOpen}
          onClose={() => {
            setIsMintModalOpen(false);
            setSelectedSongForMint(null);
          }}
          onConfirm={handleConfirmMint}
          nftData={selectedSongForMint}
          albumData={{
            name:
              selectedSongForMint?.name_album ||
              selectedSongForMint?.name ||
              "Song",
            artist_name:
              selectedSongForMint?.artist_name ||
              selectedSongForMint?.artist ||
              "Unknown",
            image_cover: selectedSongForMint?.image || "/default-cover.jpg",
            network: selectedSongForMint?.network,
            address_collection: selectedSongForMint?.addressCollection || "",
            slug: selectedSongForMint?.slug || "",
          }}
          isLoading={isMintingAny}
          currency={selectedSongForMint?.currency || "ETH"}
          maxAmount={100}
          minAmount={1}
        />
      </div>
    </div>
  );
}
