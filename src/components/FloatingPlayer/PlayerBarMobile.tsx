/* eslint-disable @next/next/no-img-element */
import { useState, useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  SkipBackIcon,
  SkipForwardIcon,
  PlayIcon,
  PauseIcon,
  Volume2Icon,
  ListMusicIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  XIcon,
  GiftIcon,
  PlusIcon,
  MinusIcon,
  Lock,
} from "lucide-react";
import { Button } from "@Src/ui/components/ui/button";
import { Slider } from "@Src/ui/components/ui/slider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@Src/ui/components/ui/accordion";
import PaymentDialog from "@Src/components/paymentDialog";
import Link from "next/link";
import { Playlist } from "@Src/components/playList";
import { usePlayer } from "../../contexts/PlayerContext";
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

interface PlayerBarMobileProps {
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
  handlePayment: (song: any) => void;
  handleSongSelect: (song: any) => void;
  handleReorder: (startIndex: any, endIndex: any) => void;
  handleVolumeChange: (value: number[]) => void;
  setShowPlaylist: (val: boolean) => void;
  userId?: string; // Nuevo prop para el usuario
}

export function PlayerBarMobile({
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
}: PlayerBarMobileProps) {
  // Traducciones
  const tX402 = useTranslations("x402");

  // ✅ Hook x402 para desbloquear contenido
  const { unlockContent: x402UnlockContent, checkUnlockStatus } =
    useX402Payment({
      onSuccess: (contentId, txHash) => {
        console.log(
          "✅ Content unlocked from PlayerBarMobile:",
          contentId,
          txHash
        );
        toast.success(tX402("success.unlocked"), {
          description: tX402("success.enjoyContent"),
        });
        // Recargar la página para actualizar el estado
        window.location.reload();
      },
      onError: (error) => {
        console.error("❌ Failed to unlock from PlayerBarMobile:", error);
      },
    });

  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [showVolumeControl, setShowVolumeControl] = useState<boolean>(false);

  // Detectar la ruta actual para ajustar posicionamiento
  const pathname = usePathname();

  // Determinar si la navegación móvil está visible (compatible con locales)
  const showMobileNavigation =
    pathname.match(/\/u(\/|$)/) || pathname.match(/\/social-feed(\/|$)/);

  // Ajustar posición dinámicamente según si hay navegación móvil
  const bottomPosition = showMobileNavigation ? "bottom-16" : "bottom-0";
  const bottomPositionExpanded = showMobileNavigation
    ? "bottom-16"
    : "bottom-0";

  // Hooks para minting
  const { mint, isMinting } = useCandyMachineMint();
  const [mintedNft, setMintedNft] = useState<string | null>(null);
  const [isTradingModalOpen, setIsTradingModalOpen] = useState(false);
  const [isMintModalOpen, setIsMintModalOpen] = useState(false);
  const [selectedSongForMint, setSelectedSongForMint] = useState<any>(null);

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

  // Estados para el formulario de crear playlist

  // Accedemos al contexto para obtener el estado de transición y el audioRef (a nivel superior)
  const {
    audioRef,
    isTransitioning,
    isTikTokMode,
    userPlaylist,
    removeFromPlaylist,
    nftData,
    isInPlaylist,
    addToPlaylist,
    isContentLocked, // ✅ Estado de bloqueo de contenido premium
    currentSong: contextCurrentSong, // ✅ Obtener currentSong del contexto que tiene x402Config
    setIsContentLocked, // ✅ Setter para actualizar el estado de bloqueo
  } = usePlayer();

  // ✅ Usar currentSong del contexto en lugar del prop (tiene más datos)
  const enrichedCurrentSong = contextCurrentSong || currentSong;

  // ✅ Efecto para verificar el unlock status cuando cambia la canción en PlayerBarMobile
  useEffect(() => {
    if (!enrichedCurrentSong || !enrichedCurrentSong.albumId) {
      setIsContentLocked(false);
      return;
    }

    const checkCurrentSongUnlock = async () => {
      const songConfig = enrichedCurrentSong.x402Config;

      console.log("📱 PlayerBarMobile - Verificando unlock:", {
        songName: enrichedCurrentSong.name,
        albumId: enrichedCurrentSong.albumId,
        hasSongConfig: !!songConfig,
        hasPrice: !!songConfig?.price,
      });

      // Si no tiene configuración x402 o no tiene precio, está desbloqueado
      if (!songConfig || !songConfig.price || !songConfig.recipientAddress) {
        console.log("✅ PlayerBarMobile - Contenido libre (no premium)");
        setIsContentLocked(false);
        return;
      }

      // Si no hay wallet, está bloqueado
      if (!hasWalletConnected || !evmWalletAddress) {
        console.log("⚠️ PlayerBarMobile - Sin wallet, contenido bloqueado");
        setIsContentLocked(true);
        return;
      }

      console.log("🔍 PlayerBarMobile - Verificando en backend:", {
        albumId: enrichedCurrentSong.albumId,
        wallet: evmWalletAddress,
      });

      // Verificar en el backend
      try {
        const status = await checkUnlockStatus(enrichedCurrentSong.albumId);
        console.log("📥 PlayerBarMobile - Respuesta backend:", {
          isUnlocked: status.isUnlocked,
          hasPaid: status.hasPaid,
        });
        setIsContentLocked(!status.isUnlocked);
      } catch (error) {
        console.error("❌ PlayerBarMobile - Error checking unlock:", error);
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

  // Adaptador para la función handleReorder que convierte el nuevo formato al antiguo
  const handleReorderAdapter = useCallback(
    (newOrder: any[]) => {
      // Pasamos el nuevo orden directamente
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

  // Manejo seguro del seek
  const handleSeek = useCallback(
    (newTime: number[]) => {
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

  // Manejador para crear playlist desde In Queue - ya no se usa, la lógica está en el componente Playlist
  const handleCreatePlaylistFromQueue = useCallback(() => {
    // Esta función ya no es necesaria, la creación de playlist se maneja en el componente Playlist
  }, []);

  // Función para expandir/contraer el player
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Función para cerrar el player expandido
  const closeExpanded = () => {
    setIsExpanded(false);
  };

  // Verificar si la canción actual está en la playlist
  const isCurrentSongInPlaylist = currentSong
    ? isInPlaylist(currentSong._id)
    : false;

  // Función para manejar agregar/quitar de playlist (implementación local)
  const handleTogglePlaylist = useCallback(
    (track: any) => {
      if (isInPlaylist(track._id)) {
        removeFromPlaylist(track._id);
      } else {
        addToPlaylist(track);
      }
    },
    [isInPlaylist, removeFromPlaylist, addToPlaylist]
  );

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Manejador para mostrar/ocultar la playlist
  const togglePlaylist = () => {
    setShowPlaylist(!showPlaylist);
  };

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
    console.log("🔍 Full NFT data:", nftData);

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
        const priceInWei =
          fullNftData?.mint_price || fullNftData?.price
            ? BigInt(
                Math.floor((fullNftData.mint_price || fullNftData.price) * 1e18)
              )
            : BigInt(0); // Convert price to wei

        console.log("Amount to mint:", amount);
        console.log("fullNftData:", fullNftData);

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

  // ✅ Handler para desbloquear contenido desde PlayerBarMobile
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
    <>
      {/* Player compacto (siempre visible en móvil) */}
      <div
        className={`fixed ${bottomPosition} left-0 right-0 z-[40] bg-zinc-900 text-white md:hidden shadow-2xl relative`}
      >
        {/* ✅ x402 Premium Overlay - Vista Compacta Mobile */}
        <AnimatePresence>
          {enrichedCurrentSong?.x402Config &&
            enrichedCurrentSong.x402Config.price &&
            enrichedCurrentSong.x402Config.recipientAddress &&
            isContentLocked && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 z-50 flex items-center justify-between px-4 bg-gradient-to-r from-purple-900/95 via-blue-900/95 to-purple-900/95 backdrop-blur-xl border-t border-purple-500/30"
              >
                {/* Lock Icon + Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="relative flex-shrink-0"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center shadow-xl">
                      <Lock className="w-6 h-6 text-white" />
                    </div>
                  </motion.div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">
                      {tX402("premiumContent")}
                    </h4>
                    <p className="text-xs text-gray-300 truncate">
                      {enrichedCurrentSong.x402Config.price}{" "}
                      {enrichedCurrentSong.x402Config.currency || "USDC"}
                    </p>
                  </div>
                </div>

                {/* Unlock Button */}
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={handleUnlockContent}
                    disabled={!hasWalletConnected || !evmWalletAddress}
                    className="bg-white hover:bg-gray-100 text-purple-900 font-semibold px-4 py-2 rounded-lg shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {tX402("unlockWithUsdc")}
                  </Button>
                </motion.div>
              </motion.div>
            )}
        </AnimatePresence>

        {/* Barra compacta */}
        <div
          className="flex items-center px-4 py-3 border-t border-zinc-800 cursor-pointer"
          onClick={toggleExpanded}
        >
          {/* Imagen del álbum */}
          <Link
            href={`/album/${currentSong.slug}`}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={`${currentSong.image}`}
              alt="Album cover"
              width={48}
              height={48}
              className="w-12 h-12 rounded-md object-cover"
            />
          </Link>

          {/* Info de la canción */}
          <div className="flex-1 ml-3 min-w-0">
            <h3 className="font-medium text-white truncate text-sm">
              {currentSong.name}
            </h3>
            <p className="text-xs text-zinc-400 truncate">
              {currentSong.artist_name ||
                currentSong.artist ||
                "Unknown artist"}
            </p>
          </div>

          {/* Like Button compacto */}
          <LikeButton
            nftId={currentSong?._id || ""}
            variant="minimal"
            size="sm"
            showCount={false}
            className="mr-2"
          />

          {/* Trading Button compacto */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setIsTradingModalOpen(true);
            }}
            className="mr-2 text-zinc-400 hover:text-white hover:bg-zinc-800 h-8 w-8"
            title="Trade Tokens"
          >
            <Coins className="h-4 w-4" />
          </Button>

          {/* Add/Remove Playlist Button compacto */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              if (currentSong) {
                handleTogglePlaylist(currentSong);
              }
            }}
            className="mr-2 text-zinc-400 hover:text-white hover:bg-zinc-800 h-8 w-8 relative"
            title={
              isCurrentSongInPlaylist ? "Remove from queue" : "Add to queue"
            }
          >
            <ListMusicIcon className="h-4 w-4" />
            {isCurrentSongInPlaylist ? (
              <MinusIcon className="h-2 w-2 absolute -top-1 -right-1 text-white bg-red-500 rounded-full p-[1px]" />
            ) : (
              <PlusIcon className="h-2 w-2 absolute -top-1 -right-1 text-white bg-green-500 rounded-full p-[1px]" />
            )}
          </Button>

          {/* Botón de play/pause */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              // ✅ Bloquear si el contenido está bloqueado
              if (isContentLocked) {
                toast.error(tX402("errors.contentLocked"), {
                  description: tX402("errors.unlockToPlay"),
                });
                return;
              }
              handlePlayPause();
            }}
            className="mr-2 text-white hover:bg-zinc-800"
          >
            {isPlaying ? (
              <PauseIcon className="h-5 w-5" />
            ) : (
              <PlayIcon className="h-5 w-5" />
            )}
          </Button>

          {/* Icono para expandir */}
          <ChevronUpIcon className="h-5 w-5 text-zinc-400" />
        </div>

        {/* Barra de progreso muy fina */}
        <div className="pb-1">
          <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-800 transition-all duration-300"
              style={{
                width:
                  duration > 0 ? `${(currentTime / duration) * 100}%` : "0%",
              }}
            />
          </div>
        </div>
      </div>

      {/* Player expandido (pantalla completa) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
              duration: 0.4,
            }}
            className="fixed inset-0 z-[200] bg-gradient-to-b from-zinc-900 via-zinc-900 to-black text-white md:hidden flex flex-col relative"
          >
            {/* ✅ x402 Premium Overlay - Vista Expandida Mobile */}
            <AnimatePresence>
              {enrichedCurrentSong?.x402Config &&
                enrichedCurrentSong.x402Config.price &&
                enrichedCurrentSong.x402Config.recipientAddress &&
                isContentLocked && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl"
                  >
                    <div className="flex flex-col items-center space-y-6 p-8 max-w-md">
                      {/* Lock Icon */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 200,
                          damping: 15,
                        }}
                        className="relative"
                      >
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center shadow-2xl">
                          <Lock className="w-10 h-10 text-white" />
                        </div>
                        <motion.div
                          className="absolute inset-0 rounded-full bg-purple-500/30"
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 0, 0.5],
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </motion.div>

                      {/* Text Content */}
                      <div className="text-center space-y-3">
                        <h2 className="text-2xl font-bold text-white">
                          {tX402("premiumContent")}
                        </h2>
                        <p className="text-gray-300 text-sm">
                          {enrichedCurrentSong.x402Config.description ||
                            tX402("unlockDescription", {
                              albumName:
                                enrichedCurrentSong.albumName ||
                                enrichedCurrentSong.name_album ||
                                "this content",
                            })}
                        </p>

                        {/* Price Display */}
                        <div className="flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-xl border border-purple-500/30">
                          <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                            {enrichedCurrentSong.x402Config.price}
                          </span>
                          <span className="text-gray-400 text-sm">
                            {enrichedCurrentSong.x402Config.currency || "USDC"}
                          </span>
                        </div>

                        <p className="text-gray-400 text-xs">
                          {tX402("oneTimePayment", {
                            network:
                              enrichedCurrentSong.x402Config.network === "base"
                                ? tX402("baseMainnet")
                                : tX402("baseSepolia"),
                          })}
                        </p>
                      </div>

                      {/* Unlock Button */}
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full"
                      >
                        <Button
                          onClick={handleUnlockContent}
                          disabled={!hasWalletConnected || !evmWalletAddress}
                          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold py-4 px-8 rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {tX402("unlockWithUsdc")}
                        </Button>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
            </AnimatePresence>

            {/* Header con botón de cerrar */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800/50 flex-shrink-0 backdrop-blur-sm">
              <Button
                variant="ghost"
                size="icon"
                onClick={closeExpanded}
                className="text-white hover:bg-zinc-800/50 rounded-full"
              >
                <ChevronDownIcon className="h-6 w-6" />
              </Button>

              <div className="text-center flex-1">
                <p className="text-xs text-zinc-500 uppercase tracking-wide">
                  Listening to
                </p>
                <p className="text-sm font-medium truncate px-2 text-zinc-300">
                  {currentSong?.name || "My library"}
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={closeExpanded}
                className="text-white hover:bg-zinc-800/50 rounded-full"
              >
                <XIcon className="h-6 w-6" />
              </Button>
            </div>

            {/* Contenido principal del player - Responsive layout */}
            <div className="flex-1 flex flex-col justify-between p-6 min-h-0">
              {/* Top section: Album art + Info */}
              <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full">
                {/* Imagen del álbum - Responsive */}
                <div className="mb-6 w-full max-w-60">
                  {/* <Link href={`/album/${currentSong.slug}`}> */}
                  <img
                    src={`${currentSong.image}`}
                    alt="Album cover"
                    className="w-full aspect-square rounded-3xl object-cover shadow-2xl shadow-black/50"
                  />
                  {/* </Link> */}
                </div>

                {/* Info de la canción */}
                <div className="text-center mb-6 w-full">
                  <h1 className="text-xl font-bold text-white mb-2 leading-tight line-clamp-2">
                    {currentSong.name}
                  </h1>
                  <p className="text-base text-zinc-400">
                    {currentSong.artist_name ||
                      currentSong.artist ||
                      "Unknown artist"}
                  </p>
                </div>
              </div>

              {/* Bottom section: Controls */}
              <div className="space-y-2">
                {/* Action buttons */}
                <div className="grid grid-cols-4 gap-2">
                  {/* Botón Claim NFT */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="outline"
                      onClick={handleClaimClick}
                      disabled={!hasWalletConnected || isMintingAny}
                      className={`w-full h-12 ${
                        !hasWalletConnected || isMintingAny
                          ? "bg-zinc-800/30 text-zinc-600 border-zinc-700/50"
                          : "bg-zinc-800/20 text-white border-zinc-600/50 hover:bg-zinc-700/30 hover:border-zinc-500/50"
                      } rounded-2xl transition-all duration-300 flex items-center justify-center backdrop-blur-sm`}
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
                            className="h-6 w-6"
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
                        <GiftIcon className="h-6 w-6" />
                      )}
                    </Button>
                  </motion.div>

                  {/* Trading Button */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={() => setIsTradingModalOpen(true)}
                      variant="outline"
                      className="w-full h-12 bg-zinc-800/20 text-white border-zinc-600/50 hover:bg-zinc-700/30 hover:border-zinc-500/50 rounded-2xl transition-all duration-300 flex items-center justify-center backdrop-blur-sm"
                      title="Trade Tokens"
                    >
                      <Coins className="h-6 w-6" />
                    </Button>
                  </motion.div>

                  {/* Botón de playlist */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={togglePlaylist}
                      variant="outline"
                      className={`w-full h-12 relative ${
                        showPlaylist
                          ? "bg-zinc-700/40 text-white border-zinc-600/70"
                          : "bg-zinc-800/20 text-white border-zinc-600/50 hover:bg-zinc-700/30"
                      } rounded-2xl transition-all duration-300 flex items-center justify-center backdrop-blur-sm`}
                      title={`Queue ${
                        userPlaylist.length > 0
                          ? `(${userPlaylist.length})`
                          : ""
                      }`}
                    >
                      <ListMusicIcon className="h-6 w-6" />
                      {userPlaylist.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold text-[10px] shadow-lg">
                          {userPlaylist.length > 9 ? "9+" : userPlaylist.length}
                        </span>
                      )}
                    </Button>
                  </motion.div>

                  {/* Botón Add/Remove Playlist */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={() => {
                        if (currentSong) {
                          handleTogglePlaylist(currentSong);
                        }
                      }}
                      variant="outline"
                      className={`w-full h-12 relative ${
                        isCurrentSongInPlaylist
                          ? "bg-green-800/30 text-white border-green-600/50 hover:bg-green-700/40"
                          : "bg-zinc-800/20 text-white border-zinc-600/50 hover:bg-zinc-700/30"
                      } rounded-2xl transition-all duration-300 flex items-center justify-center backdrop-blur-sm`}
                      title={
                        isCurrentSongInPlaylist
                          ? "Remove from queue"
                          : "Add to queue"
                      }
                    >
                      <ListMusicIcon className="h-6 w-6" />
                      {isCurrentSongInPlaylist ? (
                        <MinusIcon className="h-3 w-3 absolute -top-1 -right-1 text-white bg-red-500 rounded-full p-[1px]" />
                      ) : (
                        <PlusIcon className="h-3 w-3 absolute -top-1 -right-1 text-white bg-green-500 rounded-full p-[1px]" />
                      )}
                    </Button>
                  </motion.div>
                </div>

                {/* Like and Volume controls */}
                <div className="flex items-center justify-between px-2">
                  <LikeButton
                    nftId={currentSong?._id || ""}
                    variant="minimal"
                    size="lg"
                    showCount={true}
                    className="text-white"
                  />

                  <div className="flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowVolumeControl(!showVolumeControl)}
                      className="text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-full"
                    >
                      <Volume2Icon className="h-5 w-5" />
                    </Button>

                    {showVolumeControl && (
                      <motion.div
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "120px" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <Slider
                          value={[volume]}
                          max={1}
                          step={0.01}
                          onValueChange={handleVolumeChange}
                          className="w-full"
                        />
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <Slider
                    value={[currentTime]}
                    max={duration}
                    step={1}
                    onValueChange={handleSeek}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-zinc-500 px-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Main playback controls */}
                <div className="flex items-center justify-center space-x-6">
                  <Button
                    variant="ghost"
                    size="icon"
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
                    className="text-white hover:bg-zinc-800/50 h-12 w-12 rounded-full"
                  >
                    <SkipBackIcon className="h-7 w-7" />
                  </Button>

                  <Button
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
                    className="bg-white hover:bg-zinc-200 text-black rounded-full h-16 w-16 flex items-center justify-center shadow-xl transition-transform hover:scale-105"
                  >
                    {isPlaying ? (
                      <PauseIcon className="h-8 w-8" />
                    ) : (
                      <PlayIcon className="h-8 w-8 ml-1" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
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
                    className="text-white hover:bg-zinc-800/50 h-12 w-12 rounded-full"
                  >
                    <SkipForwardIcon className="h-7 w-7" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Trading Modal */}
      <Dialog open={isTradingModalOpen} onOpenChange={setIsTradingModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border-neutral-800 shadow-2xl z-[300] data-[state=open]:z-[300]">
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
              Trade {currentSong?.name || "Song"} Tokens
            </DialogTitle>
            <p className="text-neutral-400 text-sm mt-2">
              Buy tokens for {currentSong?.name || "this song"} and use them to
              claim NFTs
            </p>
          </DialogHeader>
          <TradingInterface
            coinAddress={currentSong?.coin_address}
            title={`Trade ${currentSong?.name || "Song"} Tokens`}
            description={`Buy tokens for ${
              currentSong?.name || "this song"
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
        currency="ETH"
        maxAmount={100}
        minAmount={1}
      />
    </>
  );
}
