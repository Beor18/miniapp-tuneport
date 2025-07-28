/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useRef, useEffect } from "react";
import dashjs from "dashjs";
import { Button } from "@Src/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@Src/ui/components/ui/dialog";
import { Separator } from "@Src/ui/components/ui/separator";
import { Slider } from "@Src/ui/components/ui/slider";
import { Label } from "@Src/ui/components/ui/label";
import {
  CheckCircle,
  Pause,
  Play,
  AlertCircle,
  ArrowRight,
  Music,
  ExternalLink,
  Loader2,
  X,
} from "lucide-react";
import { usePayment } from "@Src/contexts/PaymentContext";
import { Spinner } from "@Src/components/spinners/spinner";
import { formatPrice } from "@Src/lib/utils/formats";
import { usePlayer } from "@Src/contexts/PlayerContext";
import { toast } from "sonner";
import { TUNEPORT_WALLET_ADDRESS } from "@Src/lib/constants/feeCalculations";
import { contracts } from "@Src/lib/constants/contracts";
import { useBlockchain } from "@Src/contexts/BlockchainContext";
import type {
  SolanaMintOptions,
  BaseMintOptions,
} from "@Src/contexts/BlockchainContext";

interface PaymentDialogProps {
  onConfirmClaim?: (trackData?: any) => void;
}

const NFT_CONTRACT_ADDRESS =
  contracts.baseMainnetContracts?.nft ||
  "0x0000000000000000000000000000000000000001";

const PaymentDialog: React.FC<PaymentDialogProps> = ({ onConfirmClaim }) => {
  const {
    isModalOpen,
    setIsModalOpen,
    selectedTrack,
    isProcessing,
    setIsProcessing,
    isCompleted,
    setIsCompleted,
    isError,
    setIsError,
    errorMessage,
    setErrorMessage,
    range,
    setRange,
    transactionHash,
    setTransactionHash,
  } = usePayment();

  // Obtener datos actuales del contexto del reproductor
  const { currentSong, nftData } = usePlayer();

  // Obtener funciones del contexto de blockchain
  const { mintNFT, isMinting, selectedBlockchain, setSelectedBlockchain } =
    useBlockchain();

  // Mantenemos una copia local de los datos combinados
  const [completeTrackData, setCompleteTrackData] = useState<any>(null);
  // Estado para identificar la blockchain
  const [blockchainNetwork, setBlockchainNetwork] = useState<string>("solana");

  // Extracción y combinación mejorada de datos para asegurar que tenemos un objeto completo
  useEffect(() => {
    if (isModalOpen && selectedTrack) {
      // Determinar qué blockchain debemos usar
      const isBaseMint =
        selectedTrack.blockchain === "base" ||
        selectedTrack.currency === "BASE" ||
        selectedTrack.mint_currency === "BASE";

      setBlockchainNetwork(isBaseMint ? "base" : "solana");

      // Buscar datos adicionales en nftData si es necesario
      let additionalData = {};
      if (currentSong?._id && nftData?.length > 0) {
        const foundInNftData = nftData.find(
          (nft: any) => nft._id === currentSong._id
        );
        if (foundInNftData) {
          additionalData = foundInNftData;
        }
      }

      // Normalización de datos críticos
      const normalizedAddressCollection = isBaseMint
        ? NFT_CONTRACT_ADDRESS
        : selectedTrack?.addressCollection ||
          selectedTrack?.address_collection ||
          currentSong?.addressCollection ||
          currentSong?.address_collection;

      const normalizedCandyMachine = isBaseMint
        ? NFT_CONTRACT_ADDRESS
        : selectedTrack?.candyMachine ||
          selectedTrack?.candy_machine ||
          currentSong?.candyMachine ||
          currentSong?.candy_machine;

      const normalizedArtistAddress =
        selectedTrack?.artist_address_mint ||
        currentSong?.artist_address_mint ||
        TUNEPORT_WALLET_ADDRESS;

      // Primero datos del contexto global, luego datos adicionales de nftData, finalmente los datos específicos proporcionados
      const fullData = {
        ...currentSong, // Base desde el contexto global
        ...additionalData, // Datos adicionales encontrados en nftData
        ...selectedTrack, // Los datos específicos para el mint tienen prioridad

        // Asegurar campos críticos con un orden de prioridad claro
        _id:
          selectedTrack?._id ||
          selectedTrack?.id ||
          currentSong?._id ||
          currentSong?.id,

        // Información de visualización
        name:
          selectedTrack?.name ||
          selectedTrack?.title ||
          currentSong?.name ||
          "Unnamed Track",
        artist:
          selectedTrack?.artist ||
          selectedTrack?.artist_name ||
          currentSong?.artist ||
          "Unknown Artist",

        // Imágenes con prioridad en orden
        imageUrl:
          selectedTrack?.imageUrl ||
          selectedTrack?.image ||
          currentSong?.imageUrl ||
          currentSong?.image,

        // Datos para el mint con los valores normalizados
        price:
          selectedTrack?.price ||
          selectedTrack?.mint_price ||
          currentSong?.price ||
          currentSong?.mint_price ||
          0.1,
        candyMachine: normalizedCandyMachine,
        addressCollection: normalizedAddressCollection,
        artist_address_mint: normalizedArtistAddress,

        // Blockchain específica
        blockchain: isBaseMint ? "base" : "solana",
        currency: isBaseMint ? "BASE" : "SOL",
        mint_currency: isBaseMint ? "BASE" : "SOL",

        // Datos específicos para Base
        tokenURI: selectedTrack?.tokenURI,
      };

      setCompleteTrackData(fullData);
    }
  }, [isModalOpen, selectedTrack, currentSong, nftData]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Estados para manejo de tarifas
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [artistFee, setArtistFee] = useState<number>(0);
  const [tuneportFee, setTuneportFee] = useState<number>(0);

  const audioRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<dashjs.MediaPlayerClass | null>(null);

  const [progressValue, setProgressValue] = useState(0);

  // Inicializar DASH
  useEffect(() => {
    if (!audioRef.current || !selectedTrack?.music) return;

    if (playerRef.current) {
      playerRef.current.reset();
    }

    const audioElement = audioRef.current;
    const player = dashjs.MediaPlayer().create();
    playerRef.current = player;

    // Usar la URL de música del track seleccionado
    const musicUrl = selectedTrack.music;

    player.initialize(audioElement, musicUrl, false);
    player.updateSettings({
      streaming: {
        // Configuraciones de streaming
      },
    });

    const handleLoadedMetadata = () => {
      setDuration(audioElement.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audioElement.currentTime);
      const progress = (audioElement.currentTime / audioElement.duration) * 100;
      setProgressValue(isNaN(progress) ? 0 : progress);
    };

    audioElement.addEventListener("loadedmetadata", handleLoadedMetadata);
    audioElement.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      if (player) {
        player.reset();
      }
      if (audioElement) {
        audioElement.removeEventListener(
          "loadedmetadata",
          handleLoadedMetadata
        );
        audioElement.removeEventListener("timeupdate", handleTimeUpdate);
      }
    };
  }, [selectedTrack]);

  // Para formatear el precio según la blockchain
  const displayPrice =
    completeTrackData?.price && !isNaN(parseFloat(completeTrackData.price))
      ? parseFloat(completeTrackData.price)
      : "N/A";

  const displayCurrency =
    completeTrackData?.currency ||
    completeTrackData?.mint_currency ||
    blockchainNetwork === "base"
      ? "BASE"
      : "SOL";

  // Para manejar la reproducción
  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((error) => {
        console.error("Error al reproducir:", error);
      });
    }
    setIsPlaying(!isPlaying);
  };

  // Formato de tiempo para la duración
  const formatTime = (seconds: number) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Para abrir la transacción en el explorador correspondiente
  const openTransaction = () => {
    if (!transactionHash) return;

    let url;
    if (blockchainNetwork === "solana") {
      url = `https://solscan.io/tx/${transactionHash}?cluster=devnet`;
    } else if (blockchainNetwork === "base") {
      url = `https://basescan.org/tx/${transactionHash}`;
    } else {
      return;
    }

    window.open(url, "_blank");
  };

  // Verificar y establecer el blockchain correcto según los datos disponibles
  useEffect(() => {
    if (blockchainNetwork) {
      setSelectedBlockchain(blockchainNetwork as any);
    }
  }, [blockchainNetwork, setSelectedBlockchain]);

  // Manejar el cierre del diálogo
  const handleClose = () => {
    if (!isProcessing && !isMinting) {
      setIsModalOpen(false);
      if (playerRef.current) {
        playerRef.current.reset();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    }
  };

  // Normalizar datos según la blockchain seleccionada
  const prepareMintData = () => {
    if (selectedBlockchain === "solana") {
      const mintOptions: SolanaMintOptions = {
        candyMachineId:
          completeTrackData.candyMachine || completeTrackData.candy_machine,
        collectionId:
          completeTrackData.addressCollection ||
          completeTrackData.address_collection,
        price: completeTrackData.price || 0,
        startDate:
          completeTrackData.start_mint_date || new Date().toISOString(),
        artist_address_mint: completeTrackData.artist_address_mint,
        currency: completeTrackData.currency || "SOL",
      };
      return mintOptions;
    } else if (selectedBlockchain === "base") {
      const mintOptions: BaseMintOptions = {
        recipient:
          completeTrackData.artist_address_mint || TUNEPORT_WALLET_ADDRESS,
        tokenURI: completeTrackData.tokenURI,
      };
      return mintOptions;
    }
    throw new Error(`Blockchain no soportada: ${selectedBlockchain}`);
  };

  // Manejar el proceso de minteo
  const handleClaim = async () => {
    if (!completeTrackData) {
      toast.error("Error al preparar los datos", {
        description: "No se pudieron obtener los datos completos del track",
      });
      return;
    }

    try {
      setIsProcessing(true);
      setIsError(false);
      setErrorMessage("");
      setTransactionHash(null);

      // Preparar los datos según la blockchain
      const mintOptions = prepareMintData();

      // Ejecutar el minteo
      const result = await mintNFT(mintOptions);

      if (result) {
        setTransactionHash(result);
        setIsCompleted(true);
        toast.success("¡NFT minteado con éxito!", {
          description: `Tu NFT para "${completeTrackData.name}" ha sido creado correctamente`,
        });

        // Llamar al callback si está definido
        if (onConfirmClaim) {
          onConfirmClaim(completeTrackData);
        }
      } else {
        throw new Error("No se recibió confirmación del minteo");
      }
    } catch (error: any) {
      console.error("Error en el proceso de mint:", error);
      setIsError(true);
      setErrorMessage(
        error.message || "Ha ocurrido un error durante el proceso de minteo"
      );
      toast.error("Error al mintear NFT", {
        description:
          error.message || "Ha ocurrido un error durante el proceso de minteo",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 px-0 py-0 max-w-lg overflow-hidden text-zinc-100 z-[100] data-[state=open]:z-[100]">
        {/* Sección superior con imagen y controles de audio */}
        <div className="relative">
          {/* Imagen de portada */}
          <div className="relative w-full aspect-square bg-black">
            {completeTrackData?.imageUrl ? (
              <img
                src={completeTrackData.imageUrl}
                alt="Cover"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music className="w-16 h-16 text-zinc-700" />
              </div>
            )}
            {/* Botón de play/pause superpuesto */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute inset-0 m-auto bg-black/50 hover:bg-black/70 rounded-full h-16 w-16 flex items-center justify-center"
              onClick={handlePlayPause}
            >
              {isPlaying ? (
                <Pause className="h-8 w-8 text-white" />
              ) : (
                <Play className="h-8 w-8 text-white" />
              )}
            </Button>
            {/* Video/audio elemento oculto para reproducción */}
            <video
              ref={audioRef}
              className="hidden"
              playsInline
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            />
          </div>

          {/* Barra de progreso y controles */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/70 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 w-10 text-right">
                {formatTime(currentTime)}
              </span>
              <div className="flex-1">
                <Slider
                  value={[progressValue]}
                  max={100}
                  step={0.1}
                  className="cursor-pointer"
                  onValueChange={(value) => {
                    if (!audioRef.current || !playerRef.current) return;
                    const newTime =
                      (value[0] / 100) * audioRef.current.duration;
                    audioRef.current.currentTime = newTime;
                  }}
                />
              </div>
              <span className="text-xs text-zinc-400 w-10">
                {formatTime(duration)}
              </span>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="p-4">
          <DialogHeader className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              disabled={isProcessing || isMinting}
              className="absolute right-0 top-0 h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <X className="h-4 w-4" />
            </Button>
            <DialogTitle className="text-white text-xl pr-8">
              {completeTrackData?.name || "Track"}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {completeTrackData?.artist || "Artist"}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-400">Blockchain</p>
              <div className="flex items-center gap-1.5">
                {blockchainNetwork === "solana" ? (
                  <img
                    src="/solana-logo.png"
                    alt="Solana"
                    className="w-4 h-4 rounded-full"
                  />
                ) : (
                  <img
                    src="https://sepolia.basescan.org/assets/basesepolia/images/svg/logos/chain-light.svg?v=25.5.2.0"
                    alt="Base"
                    className="w-4 h-4 rounded-full"
                  />
                )}
                <p className="text-sm font-medium text-zinc-100 capitalize">
                  {blockchainNetwork}
                </p>
              </div>
            </div>
            <Separator className="my-3 bg-zinc-800" />
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-400">Precio</p>
              <p className="text-sm font-medium text-zinc-100">
                {displayPrice === "N/A" || displayPrice === 0
                  ? "Free"
                  : `${formatPrice(displayPrice)} ${displayCurrency}`}
              </p>
            </div>
          </div>

          {/* Estado del proceso */}
          <div className="mt-6 space-y-4">
            {isProcessing && (
              <div className="flex flex-col items-center space-y-2">
                <Spinner />
                <p className="text-zinc-400 text-sm">
                  {blockchainNetwork === "base"
                    ? "Procesando en Base blockchain..."
                    : "Procesando en Solana blockchain..."}
                </p>
              </div>
            )}

            {isCompleted && (
              <div className="flex flex-col items-center space-y-2 text-center">
                <CheckCircle className="w-12 h-12 text-green-500" />
                <p className="text-zinc-200">¡NFT minteado exitosamente!</p>
                <p className="text-zinc-400 text-sm max-w-xs">
                  El NFT ha sido transferido a tu wallet en{" "}
                  {blockchainNetwork === "base" ? "Base" : "Solana"}. Puede
                  tomar unos momentos en aparecer en tu colección.
                </p>

                {transactionHash && (
                  <Button
                    variant="outline"
                    onClick={openTransaction}
                    className="mt-2 border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                  >
                    Ver transacción <ExternalLink className="ml-2 w-4 h-4" />
                  </Button>
                )}
              </div>
            )}

            {isError && (
              <div className="flex flex-col items-center space-y-2 text-center">
                <AlertCircle className="w-12 h-12 text-red-500" />
                <p className="text-zinc-200">Error al mintear NFT</p>
                <p className="text-zinc-400 text-sm max-w-xs">
                  {errorMessage ||
                    "Ocurrió un error inesperado al procesar tu solicitud."}
                </p>
              </div>
            )}

            {!isProcessing && !isCompleted && !isError && (
              <div className="text-center text-zinc-400 text-sm">
                <p>
                  Estás a punto de mintear el NFT para esta pista en{" "}
                  {blockchainNetwork === "base" ? "Base" : "Solana"}.
                  {displayPrice &&
                  displayPrice !== "N/A" &&
                  displayPrice !== 0 ? (
                    <div>
                      {" "}
                      <br />
                      Este NFT cuesta {formatPrice(displayPrice)}{" "}
                      {displayCurrency}.
                    </div>
                  ) : (
                    " Este NFT es gratuito."
                  )}
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2 p-4 bg-zinc-950 border-t border-zinc-800">
          {!isProcessing && !isCompleted && !isError && (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                className="w-full sm:w-auto border-zinc-700 bg-black hover:bg-black text-white hover:text-white"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleClaim}
                disabled={isMinting}
                type="button"
                className={`w-full sm:w-auto ${
                  blockchainNetwork === "base" ? "bg-blue-600" : "bg-green-600"
                } text-white`}
              >
                {isMinting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Confirmar Mint
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </>
          )}

          {(isProcessing || isCompleted || isError) && (
            <Button
              onClick={handleClose}
              type="button"
              className="w-full sm:w-auto bg-zinc-800 text-white"
            >
              Cerrar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;
