/* eslint-disable @next/next/no-img-element */
import { useState, useCallback } from "react";
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
import { motion } from "framer-motion";
import { TradingInterface } from "@Src/components/TradingInterface";
import { MintModal } from "@Src/components/MintModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@Src/ui/components/ui/dialog";
import { Coins, X } from "lucide-react";

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
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

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
  } = usePlayer();

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

  if (!currentSong) {
    return (
      <div className="fixed bottom-16 left-0 right-0 z-50 bg-zinc-900 border-t border-zinc-800 p-2 animate-pulse sm:hidden">
        <div className="h-16 bg-zinc-800 rounded-lg"></div>
      </div>
    );
  }

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
        const priceInWei = fullNftData?.mint_price
          ? BigInt(Math.floor(fullNftData.mint_price * 1e18))
          : BigInt(0); // Convert price to wei

        console.log("Amount to mint:", amount);

        const mintSuccess = await baseOperations.mintNFT({
          collectionAddress: fullNftData?.addressCollection || "",
          to: evmWalletAddress || address || "",
          tokenId: fullNftData?.id_item || 0, // Use the NFT tokenId
          amount: amount, // Cantidad seleccionada por el usuario
          tokenMetadata: fullNftData?.metadata_uri || "", // Metadata is set when creating the NFT for the first time
          pricePerToken: Number(priceInWei), // Price per token in wei
        });

        if (mintSuccess) {
          result = `${fullNftData?.addressCollection}:${fullNftData?.id_item}`;
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

  return (
    <>
      {/* Player compacto (siempre visible en móvil) */}
      <div className="fixed bottom-16 left-0 right-0 z-50 bg-zinc-900 text-white sm:hidden">
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

          {/* Botón de play/pause */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
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
      {isExpanded && (
        <div className="fixed inset-0 z-[60] bg-zinc-900 text-white sm:hidden flex flex-col">
          {/* Header con botón de cerrar */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-800 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={closeExpanded}
              className="text-white hover:bg-zinc-800"
            >
              <ChevronDownIcon className="h-6 w-6" />
            </Button>

            <div className="text-center flex-1">
              <p className="text-sm text-zinc-400">Listening to</p>
              <p className="text-sm font-medium truncate px-2">
                {currentSong.collection_name || "My library"}
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={closeExpanded}
              className="text-white hover:bg-zinc-800"
            >
              <XIcon className="h-6 w-6" />
            </Button>
          </div>

          {/* Contenido del player expandido */}
          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            <div className="flex-1 flex flex-col justify-center px-6 py-4">
              {/* Imagen del álbum grande */}
              <div className="flex justify-center mb-6">
                <Link href={`/album/${currentSong.slug}`}>
                  <img
                    src={`${currentSong.image}`}
                    alt="Album cover"
                    className="w-30 h-30 max-w-30 max-h-30 rounded-lg object-cover shadow-2xl"
                  />
                </Link>
              </div>

              {/* Info de la canción */}
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-white mb-2 px-4 leading-tight">
                  {currentSong.name}
                </h1>
                <p className="text-base text-zinc-400 px-4">
                  {currentSong.artist_name ||
                    currentSong.artist ||
                    "Unknown artist"}
                </p>
              </div>
            </div>

            {/* Controles en la parte inferior */}
            <div className="px-6 pb-8 space-y-4 flex-shrink-0">
              {/* Barra de progreso con tiempos */}
              <div className="space-y-2">
                <Slider
                  value={[currentTime]}
                  max={duration}
                  step={1}
                  onValueChange={handleSeek}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controles principales */}
              <div className="flex items-center justify-center space-x-6 py-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevSong}
                  className="text-white hover:bg-zinc-800 h-12 w-12"
                >
                  <SkipBackIcon className="h-7 w-7" />
                </Button>

                <Button
                  onClick={handlePlayPause}
                  className="bg-white hover:bg-zinc-200 text-black rounded-full h-14 w-14 flex items-center justify-center"
                >
                  {isPlaying ? (
                    <PauseIcon className="h-7 w-7" />
                  ) : (
                    <PlayIcon className="h-7 w-7 ml-1" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNextSong}
                  className="text-white hover:bg-zinc-800 h-12 w-12"
                >
                  <SkipForwardIcon className="h-7 w-7" />
                </Button>
              </div>

              {/* Control de volumen */}
              <div className="flex items-center space-x-3 py-2">
                <Volume2Icon className="h-5 w-5 text-zinc-400 flex-shrink-0" />
                <Slider
                  value={[volume]}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                  className="flex-1"
                />
              </div>

              {/* Controles adicionales */}
              <div className="flex justify-center items-center gap-4 pt-2">
                {/* Like Button */}
                <LikeButton
                  nftId={currentSong?._id || ""}
                  variant="minimal"
                  size="sm"
                  showCount={true}
                />

                {/* Botón Claim NFT */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    onClick={handleClaimClick}
                    disabled={!hasWalletConnected || isMintingAny}
                    className={`${
                      !hasWalletConnected || isMintingAny
                        ? "bg-transparent text-zinc-500 border-zinc-700"
                        : "bg-transparent text-white border-zinc-600 hover:bg-zinc-800"
                    } rounded-full px-4 py-2 transition-all duration-300 flex items-center gap-2`}
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
                          className="h-4 w-4"
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
                    <span className="text-sm">Claim</span>
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
                    className="bg-transparent text-white border-zinc-600 hover:bg-zinc-800 hover:border-zinc-500 rounded-full px-4 py-2 transition-all duration-300 flex items-center gap-2"
                    title="Trade Tokens"
                  >
                    <Coins className="h-4 w-4" />
                    <span className="text-sm">Trade</span>
                  </Button>
                </motion.div>

                {/* Botón de playlist */}
                <Button
                  onClick={togglePlaylist}
                  variant="outline"
                  className={`${
                    showPlaylist
                      ? "bg-zinc-700 text-white border-zinc-600"
                      : "bg-transparent text-white border-zinc-600"
                  } rounded-full px-4 py-2 transition-all duration-300 flex items-center gap-2`}
                >
                  <ListMusicIcon className="h-4 w-4" />
                  <span className="text-sm">
                    In Queue
                    {userPlaylist.length > 0 && ` (${userPlaylist.length})`}
                  </span>
                </Button>
              </div>
            </div>
          </div>
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
