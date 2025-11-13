/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useRef, useEffect, useState } from "react";
import { Card } from "@Src/ui/components/ui/card";
import { Button } from "@Src/ui/components/ui/button";
import {
  PlayIcon,
  PauseIcon,
  VolumeIcon,
  ShareIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  GiftIcon,
  SkipBackIcon,
  SkipForwardIcon,
  ArrowLeft,
  ArrowRight,
  Pause,
  Play,
  ListMusicIcon,
  PlusIcon,
  MinusIcon,
  Music,
  Coins,
  Lock,
} from "lucide-react";
import { LikeButton } from "../ui/LikeButton";
import PlayerHome from "../playerHome";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import useAudioControls from "../../lib/hooks/useAudioControls";
import { useCandyMachineMint } from "@Src/lib/hooks/solana/useCandyMachineMint";
import { useBlockchainOperations } from "@Src/lib/hooks/common/useBlockchainOperations";
import { useX402Payment } from "@Src/lib/hooks/base/useX402Payment";
import { toast } from "sonner";
import { useAppKitAccount } from "@Src/lib/privy";
import { TradingInterface } from "@Src/components/TradingInterface";
import { MintModal } from "@Src/components/MintModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@Src/ui/components/ui/dialog";
import { useTranslations } from "next-intl";

// Componente de skeleton para el álbum con diseño mejorado
const AlbumSkeleton = () => (
  <div className="h-full snap-start w-full flex items-center justify-center">
    <Card className="w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-800 overflow-hidden border-none relative">
      {/* Efectos de fondo */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40"></div>
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-64 h-64 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
        </div>
      </div>

      {/* Header skeleton */}
      <div className="absolute top-6 left-0 right-0 z-20 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/10 rounded-lg animate-pulse"></div>
            <div className="w-24 h-4 bg-white/10 rounded animate-pulse"></div>
          </div>
          <div className="w-6 h-6 bg-white/10 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Central music icon skeleton */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <div className="w-48 h-48 bg-gradient-to-br from-white/5 to-white/20 rounded-full animate-pulse"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Music className="w-24 h-24 text-white/30 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Bottom controls skeleton */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="flex flex-col items-center space-y-6">
          <div className="w-48 h-8 bg-white/10 rounded-full animate-pulse"></div>
          <div className="w-32 h-6 bg-white/10 rounded animate-pulse"></div>
          <div className="flex items-center space-x-6">
            <div className="w-12 h-12 bg-white/10 rounded-full animate-pulse"></div>
            <div className="w-16 h-16 bg-white/20 rounded-full animate-pulse"></div>
            <div className="w-12 h-12 bg-white/10 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </Card>
  </div>
);

// Componente de skeleton para los colaboradores mejorado
const CollaboratorsSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-60 overflow-y-auto p-2">
    {Array(4)
      .fill(0)
      .map((_, index) => (
        <React.Fragment key={index}>
          <Card className="bg-gradient-to-br from-gray-800/60 to-gray-900/80 backdrop-blur-sm p-4 rounded-xl border border-gray-700/30 h-full">
            <div className="h-5 bg-gradient-to-r from-gray-600/50 to-gray-700/50 rounded animate-pulse w-3/4 mb-3"></div>
            <div className="h-4 bg-gradient-to-r from-gray-700/40 to-gray-800/40 rounded animate-pulse w-1/2 mb-2"></div>
            <div className="h-4 bg-gradient-to-r from-gray-800/30 to-gray-900/30 rounded animate-pulse w-1/3"></div>
          </Card>
        </React.Fragment>
      ))}
  </div>
);

interface Collaborator {
  name: string;
  address: string;
  royalties: number;
}

interface NFT {
  _id: string;
  name: string;
  image: string;
  music: string;
  collectionId: string;
  candy_machine: string;
  artist_address_mint: string;
  id_item: number;
  description: string;
  video: string;
  copies: number;
  price: number;
  currency: string;
  owner: string;
  listed_by: string;
  for_sale: number;
  metadata_uri?: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

interface Album {
  _id: string;
  name: string;
  image_cover: string;
  candy_machine: string;
  address_collection: string;
  start_mint_date: any;
  address_creator_collection: any;
  mint_price: any;
  mint_currency: any;
  description: string;
  artist_name: string;
  slug: string;
  nfts: string[];
  collaborators: Collaborator[];
  base_url_image: string;
  network: string;
  coin_address: string;
  // x402 Premium Configuration
  isPremiumAlbum?: boolean;
  x402Config?: {
    isLocked: boolean;
    price?: string;
    network?: "base" | "base-sepolia";
    description?: string;
    currency?: "USDC";
  };
}

interface CardAlbumMusicProps {
  albumData: Album;
  nftsData: NFT[];
}

export default function CardAlbumMusic({
  albumData,
  nftsData,
}: CardAlbumMusicProps) {
  // ✅ Traducciones
  const t = useTranslations();
  const router = useRouter();

  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isTrackListOpen, setIsTrackListOpen] = useState(false);
  const [scrolling, setScrolling] = useState(false);
  const [isClaimHovered, setIsClaimHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProgrammaticScroll, setIsProgrammaticScroll] = useState(false);
  const [isTradingModalOpen, setIsTradingModalOpen] = useState(false);
  const [isMintModalOpen, setIsMintModalOpen] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // x402 Premium States
  const [isContentUnlocked, setIsContentUnlocked] = useState(true); // ✅ Optimistic: asumimos desbloqueado hasta que se verifique lo contrario
  const [isCheckingUnlock, setIsCheckingUnlock] = useState(true);
  const [x402Config, setX402Config] = useState<any>(undefined); // undefined = no obtenida aún, null = no premium
  const containerRef = useRef<HTMLDivElement>(null);
  const claimButtonRef = useRef<HTMLButtonElement>(null);

  const { mint, isMinting } = useCandyMachineMint();
  const [mintedNft, setMintedNft] = useState<string | null>(null);

  // Traducciones
  const tX402 = useTranslations("x402");

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

  // ✅ Hook x402 debe llamarse en el nivel superior del componente
  const { unlockContent: x402UnlockContent } = useX402Payment({
    onSuccess: (contentId, txHash) => {
      console.log(
        "✅ Content unlocked from CardAlbumMusic:",
        contentId,
        txHash
      );

      // Actualizar el estado de unlock localmente
      setIsContentUnlocked(true);
      setIsContentLocked(false); // ✅ Actualizar contexto global

      toast.success(t("x402.content_unlocked"), {
        description: t("x402.enjoy_premium_content"),
      });

      // Refrescar datos del servidor sin perder estado del cliente
      router.refresh();
    },
    onError: (error) => {
      console.error("❌ Failed to unlock from CardAlbumMusic:", error);
    },
  });

  // Verificar si hay alguna wallet conectada (especialmente importante para Solana)
  const hasWalletConnected =
    isConnected && (!!address || !!solanaWalletAddress || !!evmWalletAddress);

  // Estado de minting combinado para ambas redes
  const isMintingAny = isMinting || baseOperations.isMinting;

  // Obtener los valores y métodos del contexto global
  const {
    currentSong,
    isPlaying,
    isMuted,
    activePlayerId,
    setCurrentSong,
    setIsPlaying,
    setIsMuted,
    setActivePlayerId,
    setShowFloatingPlayer,
    setNftData,
    setIsContentLocked, // ✅ Setter para estado de bloqueo
    handlePlayPause,
    isInPlaylist,
    handleTogglePlaylist,
    handleNextSong,
    handlePrevSong,
  } = useAudioControls();

  // Preparar los datos una única vez, fuera de efectos secundarios
  const albumNFTs = React.useMemo(() => {
    return nftsData
      .filter((nft) => albumData.nfts.includes(nft._id))
      .map((nft) => ({
        ...nft,
        artist_name: albumData.artist_name,
        slug: albumData.slug,
        network: albumData.network,
      }));
  }, [nftsData, albumData]);

  console.log("albumNFTs: ", albumNFTs);

  // Efecto para configurar la carga inicial (se ejecuta cada vez que se monta el componente)
  useEffect(() => {
    console.log("🎵 Componente montado - Álbum:", albumData._id);

    // Ocultar el reproductor flotante
    setShowFloatingPlayer(false);

    // IMPORTANTE: Actualizar el contexto global con la lista de canciones del álbum
    setNftData(albumNFTs);

    // Simulamos un tiempo de carga para mostrar skeletons
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => {
      clearTimeout(loadingTimer);

      // ✅ Al salir del álbum, RESETEAR el estado de bloqueo
      // Esto permite que canciones/álbumes fuera de este contexto funcionen normalmente
      setIsContentLocked(false);
      console.log("🔓 Saliendo del álbum - Estado de bloqueo reseteado");

      // Mostrar el reproductor flotante al salir
      setTimeout(() => {
        // Verificar si hay música reproduciéndose
        const audio = document.querySelector("audio");
        const hasActiveSong = audio && (audio.currentTime > 0 || !audio.paused);

        if (currentSong || hasActiveSong) {
          setShowFloatingPlayer(true);
        }
      }, 100);
    };
  }, [
    albumData._id, // Dependencia clave para forzar re-ejecución cuando cambia el álbum
    setShowFloatingPlayer,
    setNftData,
    setIsContentLocked,
    albumNFTs,
  ]);

  // ✅ Efecto para manejar reproducción automática SOLO si está desbloqueado
  useEffect(() => {
    // Esperar a que termine de cargar y se verifique el unlock status
    if (isLoading || isCheckingUnlock) return;

    // Solo reproducir si hay tracks Y el contenido está desbloqueado
    if (albumNFTs.length > 0 && isContentUnlocked) {
      console.log(
        "▶️ Reproduciendo automáticamente (contenido desbloqueado):",
        albumNFTs[0].name
      );
      setCurrentSong(albumNFTs[0]);
      setActivePlayerId(albumNFTs[0]._id);
      setCurrentTrackIndex(0);
      setIsPlaying(true);
    } else if (!isContentUnlocked && albumNFTs.length > 0) {
      console.log("🔒 Reproducción bloqueada - contenido premium");
      // Asegurar que no se reproduzca nada
      setIsPlaying(false);
    }
  }, [
    isLoading,
    isCheckingUnlock,
    isContentUnlocked,
    albumNFTs,
    setCurrentSong,
    setActivePlayerId,
    setIsPlaying,
  ]);

  // Efecto para actualizar el índice de la canción actual sin crear ciclos
  useEffect(() => {
    if (!isLoading && currentSong) {
      const index = albumNFTs.findIndex((nft) => nft._id === currentSong._id);
      if (index >= 0 && index !== currentTrackIndex) {
        setCurrentTrackIndex(index);

        // Si el cambio de canción no viene de scroll manual, hacer scroll automático
        if (!scrolling && !isProgrammaticScroll) {
          scrollToTrack(index);
        } else {
          console.log(
            `❌ No scroll - scrolling=${scrolling}, isProgrammaticScroll=${isProgrammaticScroll}`
          );
        }
      } else if (index === currentTrackIndex) {
        console.log(`ℹ️ no changes`);
      }
    }
  }, [
    currentSong?._id,
    albumNFTs,
    isLoading,
    currentTrackIndex,
    scrolling,
    isProgrammaticScroll,
  ]);

  // Efecto para detectar scroll con dependencias mínimas
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Ignorar scroll events si es un scroll programático
      if (isProgrammaticScroll) {
        return;
      }

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      setScrolling(true);

      scrollTimeoutRef.current = setTimeout(() => {
        setScrolling(false);
        const scrollPosition = container.scrollTop;
        const cardHeight = container.clientHeight;
        const newIndex = Math.round(scrollPosition / cardHeight);

        if (
          newIndex >= 0 &&
          newIndex < albumNFTs.length &&
          albumNFTs[newIndex] &&
          (!currentSong || albumNFTs[newIndex]._id !== currentSong._id)
        ) {
          setCurrentSong(albumNFTs[newIndex]);
          setActivePlayerId(albumNFTs[newIndex]._id);
          setCurrentTrackIndex(newIndex);
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
    albumNFTs,
    currentSong?._id,
    setCurrentSong,
    setActivePlayerId,
    isProgrammaticScroll,
  ]);

  // x402 Premium - Obtener configuración desde el backend
  useEffect(() => {
    const fetchX402Config = async () => {
      try {
        console.log("📡 Fetching x402 config para álbum:", albumData._id);
        // Usar ruta proxy de Next.js (evita CORS)
        const response = await fetch(`/api/x402/config/${albumData._id}`);

        if (response.ok) {
          const config = await response.json();
          console.log("🔍 x402 Config recibida del backend:", config);

          // Si el backend devuelve config: null, significa que no es premium
          if (config.config === null || !config.recipientAddress) {
            // Fallback a la config del álbum si existe
            setX402Config(albumData?.x402Config || null);
          } else {
            setX402Config(config);
          }
        } else {
          // Si no hay config en el backend, usar la del álbum si existe
          setX402Config(albumData?.x402Config || null);
        }
      } catch (error) {
        console.error("Error fetching x402 config:", error);
        // Fallback a la config del álbum
        setX402Config(albumData?.x402Config || null);
      }
    };

    fetchX402Config();
  }, [albumData._id, albumData?.x402Config]);

  // x402 Premium - Verificar si el contenido está desbloqueado
  useEffect(() => {
    // NO ejecutar mientras x402Config sea undefined (todavía no se obtuvo del backend)
    if (x402Config === undefined) {
      console.log("⏳ Esperando config del backend...");
      return;
    }

    const checkUnlockStatus = async () => {
      console.log("🔍 Verificando unlock status:", {
        x402Config,
        hasPrice: !!x402Config?.price,
        hasRecipient: !!x402Config?.recipientAddress,
      });

      // Si x402Config es null o no tiene precio/recipient, NO es premium
      if (!x402Config || !x402Config.price || !x402Config.recipientAddress) {
        console.log("✅ Contenido desbloqueado (no premium o sin config)");
        setIsContentUnlocked(true);
        setIsContentLocked(false); // ✅ Actualizar contexto global
        setIsCheckingUnlock(false);
        return;
      }

      // Si no hay wallet EVM conectada, el contenido está bloqueado
      if (!hasWalletConnected || !evmWalletAddress) {
        console.log("⚠️ Sin wallet conectada - contenido bloqueado", {
          hasWalletConnected,
          evmWalletAddress,
        });
        setIsContentUnlocked(false);
        setIsContentLocked(true); // ✅ Actualizar contexto global
        setIsCheckingUnlock(false); // ✅ Terminar verificación
        return;
      }

      console.log("✅ Wallet conectada - verificando unlock en backend", {
        albumId: albumData._id,
        walletAddress: evmWalletAddress,
        walletAddressLowercase: evmWalletAddress.toLowerCase(),
      });

      // ✅ Mantener isCheckingUnlock=true durante la verificación (muestra skeleton loader)
      try {
        const checkUrl = `/api/x402/check-unlock/${albumData._id}?address=${evmWalletAddress}`;
        console.log("🌐 Fetching:", checkUrl);

        // Verificar en segundo plano si el usuario ya pagó por este contenido
        const response = await fetch(checkUrl);

        console.log("📡 Response status:", response.status);

        const data = await response.json();

        console.log("📥 Respuesta del backend:", {
          isUnlocked: data.isUnlocked,
          hasPaid: data.hasPaid,
          transactionHash: data.transactionHash,
          fullResponse: data,
        });

        console.log(
          `🔍 Checking: data.isUnlocked = ${
            data.isUnlocked
          } (type: ${typeof data.isUnlocked})`
        );

        if (data.isUnlocked) {
          console.log(
            "🎉 ✅✅✅ Contenido DESBLOQUEADO para este usuario ✅✅✅"
          );
          // Si está desbloqueado, remover overlay con animación
          setIsContentUnlocked(true);
          setIsContentLocked(false); // ✅ Actualizar contexto global
          setIsCheckingUnlock(false); // ✅ Terminar verificación
          console.log(
            "🎉 Estados actualizados: isContentUnlocked=true, isContentLocked=false"
          );
        } else {
          console.log("🔒 Contenido BLOQUEADO - usuario no ha pagado");
          setIsContentUnlocked(false);
          setIsContentLocked(true); // ✅ Actualizar contexto global
          setIsCheckingUnlock(false); // ✅ Terminar verificación - ahora sí mostrar overlay
        }
      } catch (error) {
        console.error("❌ Error checking unlock status:", error);
        setIsContentUnlocked(false);
        setIsContentLocked(true); // ✅ Actualizar contexto global
        setIsCheckingUnlock(false); // ✅ Terminar verificación
      }
    };

    checkUnlockStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [albumData?._id, x402Config, hasWalletConnected, evmWalletAddress]);

  // x402 Premium - Manejar el pago para desbloquear contenido
  const handleUnlockContent = async () => {
    if (!hasWalletConnected) {
      toast.error(tX402("errors.connectWallet"), {
        description: tX402("errors.connectWalletDescription"),
      });
      return;
    }

    // Verificar que tenemos una dirección EVM (no Solana)
    if (!evmWalletAddress) {
      toast.error(tX402("errors.evmWalletRequired"), {
        description: tX402("errors.evmWalletRequiredDescription"),
      });
      return;
    }

    if (!x402Config || !x402Config.price) {
      toast.error(tX402("errors.invalidConfiguration"), {
        description: tX402("errors.priceNotConfigured"),
      });
      return;
    }

    try {
      console.log("🔐 x402: Unlocking content", {
        contentId: albumData._id,
        price: x402Config.price,
        network: x402Config.network || "base",
      });

      // Convertir config del backend al formato esperado por useX402Payment
      const configForHook = {
        isLocked: true,
        price: x402Config.price,
        network: x402Config.network,
        description: x402Config.description,
        currency: "USDC" as const,
      };

      // ✅ Usar la función del hook x402 (ya inicializado en el nivel superior)
      await x402UnlockContent(albumData._id, configForHook);
    } catch (error) {
      console.error("Error unlocking content:", error);
      toast.error(tX402("errors.unlockError"), {
        description:
          error instanceof Error ? error.message : "Intenta nuevamente",
      });
    }
  };

  // Función simplificada para el botón play/pause - CORREGIDA + BLOQUEADA si premium
  const togglePlay = () => {
    // ✅ Bloquear si el contenido no está desbloqueado
    if (!isContentUnlocked) {
      toast.error(tX402("errors.contentLocked"), {
        description: tX402("errors.unlockToPlay"),
      });
      return;
    }

    if (!scrolling && currentSong) {
      // Usar handlePlayPause del hook directamente
      handlePlayPause();
    } else if (!currentSong && albumNFTs.length > 0) {
      // Si no hay canción actual, seleccionar la primera
      const firstSong = albumNFTs[0];
      setCurrentSong(firstSong);
      setActivePlayerId(firstSong._id);
      setIsPlaying(true);
      setCurrentTrackIndex(0);
    }
  };

  // Funciones simplificadas para navegación de tracks - ahora usan el contexto global
  const handlePrevTrack = () => {
    // ✅ Bloquear si el contenido no está desbloqueado
    if (!isContentUnlocked) {
      toast.error(tX402("errors.contentLocked"), {
        description: tX402("errors.unlockToPlay"),
      });
      return;
    }
    handlePrevSong();
  };

  const handleNextTrack = () => {
    // ✅ Bloquear si el contenido no está desbloqueado
    if (!isContentUnlocked) {
      toast.error(tX402("errors.contentLocked"), {
        description: tX402("errors.unlockToPlay"),
      });
      return;
    }
    handleNextSong();
  };

  const scrollToTrack = (index: number) => {
    const container = containerRef.current;
    if (container) {
      // Marcar como scroll programático
      setIsProgrammaticScroll(true);

      const cardHeight = container.clientHeight;
      container.scrollTo({ top: index * cardHeight, behavior: "smooth" });

      // Resetear la bandera después del scroll
      setTimeout(() => {
        setIsProgrammaticScroll(false);
      }, 800); // Tiempo suficiente para que termine la animación smooth
    }
  };

  const toggleTrackList = () => {
    setIsTrackListOpen(!isTrackListOpen);
  };

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

    // Para Solana, mint directo como antes
    if (albumData?.network === "solana") {
      await processMint(1);
    } else if (albumData?.network === "base") {
      // Para Base, abrir modal para seleccionar cantidad
      setIsMintModalOpen(true);
    } else {
      toast.error(`Unsupported network: ${albumData?.network}`);
    }
  };

  const processMint = async (amount: number) => {
    try {
      // Mostrar toast de loading
      const toastId = toast.loading("Processing mint...");

      const nft = nftsData.find((nft: any) => nft._id === currentSong?._id);

      let result: any;
      if (albumData?.network === "solana") {
        result = await mint({
          candyMachineId: nft?.candy_machine || "",
          collectionId: albumData?.address_collection || "",
          price: albumData?.mint_price,
          startDate: albumData?.start_mint_date,
          artist_address_mint: nft?.artist_address_mint || "",
          currency: albumData?.mint_currency,
        });
      } else if (albumData?.network === "base") {
        console.log("Minting on Base", albumData?.network);

        // Convertir precio a wei correctamente
        let priceInWei = BigInt(0);
        if (nft?.price && nft.price > 0) {
          // Convertir el precio decimal a wei
          // Si el precio es 0.000001, esto debe ser 1000000000000 wei
          const priceStr = nft.price.toString();
          const priceNumber = parseFloat(priceStr);
          priceInWei = BigInt(Math.floor(priceNumber * 1e18));
        }

        console.log("Original price:", nft?.price);
        console.log("Price in wei:", priceInWei.toString());
        console.log("Price in ETH:", Number(priceInWei) / 1e18);
        console.log("Amount to mint:", amount);

        // Mint NFT en Base usando ERC1155 con cantidad seleccionada
        const mintSuccess = await baseOperations.mintNFT({
          collectionAddress: albumData?.address_collection || "",
          to: evmWalletAddress || address || "",
          tokenId: nft?.id_item || 0, // Usar el tokenId del NFT
          amount: amount, // Cantidad seleccionada por el usuario
          tokenMetadata: nft?.metadata_uri || "", // Los metadatos se establecen al crear el NFT por primera vez
          pricePerToken: Number(priceInWei), // Precio por token en wei como número
        });

        if (mintSuccess) {
          result = `${albumData?.address_collection}:${nft?.id_item}`;
          toast.success("Claimed successfully");
        } else {
          throw new Error("Error claiming NFT");
        }
      } else {
        throw new Error(`Unsupported network: ${albumData?.network}`);
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
              {albumData?.network === "solana" ? (
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
              ) : albumData?.network === "base" ? (
                <button
                  onClick={() => {
                    const url = `https://sepolia.basescan.org/address/${albumData?.address_collection}`;
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

  const handleClaimHover = (isHovered: boolean) => {
    setIsClaimHovered(isHovered);
  };

  // Función simplificada para seleccionar una canción
  const handleSongSelect = (track: NFT, index: number) => {
    // ✅ Bloquear si el contenido no está desbloqueado
    if (!isContentUnlocked) {
      toast.error(tX402("errors.contentLocked"), {
        description: tX402("errors.unlockToPlay"),
      });
      return;
    }

    setCurrentSong(track);
    setActivePlayerId(track._id);
    setIsPlaying(true);
    // El scroll se maneja automáticamente en el efecto
  };

  // Confirmar mint desde el modal
  const handleConfirmMint = (amount: number) => {
    processMint(amount);
  };

  return (
    <div className="h-full w-full sm:h-[870px] sm:w-full md:w-[540px] md:h-[960px] lg:w-[540px] lg:h-[960px] overflow-hidden font-sans mx-auto relative">
      {/* x402 Premium Overlay */}
      <AnimatePresence>
        {x402Config &&
          x402Config.price &&
          x402Config.recipientAddress &&
          // ✅ No mostrar overlay si el usuario es el dueño
          evmWalletAddress?.toLowerCase() !==
            x402Config.recipientAddress?.toLowerCase() &&
          !isContentUnlocked &&
          !isCheckingUnlock && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl"
            >
              <div className="flex flex-col items-center gap-6 px-6 text-center max-w-md">
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
                  <div className="p-6 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full shadow-2xl">
                    <Lock className="h-12 w-12 text-white" />
                  </div>
                </motion.div>

                {/* Content */}
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {isCheckingUnlock
                      ? t("x402.verifying_access")
                      : t("x402.locked_content")}
                  </h3>
                  <p className="text-sm text-zinc-400 mb-4">
                    {isCheckingUnlock
                      ? t("x402.checking_access_description")
                      : t("x402.unlock_to_listen")}
                  </p>

                  <div className="flex flex-col items-center gap-4">
                    <div className="px-6 py-3 bg-zinc-900 rounded-xl border border-purple-500/30">
                      <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                        {x402Config.price}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {x402Config.currency || "USDC"}
                      </p>
                    </div>

                    <Button
                      onClick={handleUnlockContent}
                      disabled={!hasWalletConnected || !evmWalletAddress || isCheckingUnlock}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      size="lg"
                    >
                      {!hasWalletConnected
                        ? t("wallet.connect")
                        : isCheckingUnlock
                        ? t("common.checking")
                        : t("x402.unlock_now")}
                    </Button>

                    <div className="text-xs text-zinc-500 space-y-1">
                      <p>✓ {t("x402.secure_payment")}</p>
                      <p>✓ {t("x402.access_30_days")}</p>
                      <p>✓ {t("x402.support_artist")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
      </AnimatePresence>

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

        {isLoading ? (
          // Skeleton mejorado
          <AlbumSkeleton />
        ) : albumNFTs.length === 0 ? (
          // Vista del álbum sin NFTs con diseño mejorado
          <div className="snap-start h-full w-full flex items-center justify-center">
            <Card className="w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-800 overflow-hidden border-none relative">
              {/* Efectos de fondo mejorados */}
              <div className="absolute inset-0">
                <img
                  src={`${albumData.image_cover}`}
                  alt={`${albumData.name} cover`}
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/40" />
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20" />
              </div>

              {/* Header mejorado con título del álbum */}
              <div className="absolute top-6 left-0 right-0 z-20 px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <Music className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white font-bold text-sm tracking-wide truncate max-w-[200px]">
                        {albumData.name}
                      </span>
                      <span className="text-gray-300 font-light text-xs truncate max-w-[200px]">
                        {albumData.artist_name}
                      </span>
                    </div>
                  </div>
                  <div className="w-6 h-6 flex items-center justify-center">
                    <div className="w-1 h-1 bg-white rounded-full"></div>
                    <div className="w-1 h-1 bg-white rounded-full mx-1"></div>
                    <div className="w-1 h-1 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Título del álbum centrado */}
              <div className="absolute top-1/4 left-0 right-0 z-20 text-center px-6">
                <Link href={`/album/${albumData.slug}`}>
                  <motion.h1
                    className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {albumData.name}
                  </motion.h1>
                </Link>
                <motion.p
                  className="text-xl text-gray-300 font-light"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {albumData.artist_name}
                </motion.p>
              </div>

                {/* Benefits List */}
                {/* <div className="text-left space-y-2 w-full bg-black/40 p-4 rounded-xl border border-gray-700/50">
                  <p className="text-gray-300 text-xs font-semibold mb-2">
                    {tX402("includes")}
                  </p>
                  <ul className="text-gray-400 text-xs space-y-1">
                    <li>{tX402("unlimitedAccess")}</li>
                    <li>{tX402("highQualityStreaming")}</li>
                    <li>{tX402("directArtistSupport")}</li>
                    <li>{tX402("noSubscription")}</li>
                  </ul>
                </div> */}
              </div>
            </motion.div>
          )}
      </AnimatePresence>

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

        {isLoading ? (
          // Skeleton mejorado
          <AlbumSkeleton />
        ) : albumNFTs.length === 0 ? (
          // Vista del álbum sin NFTs con diseño mejorado
          <div className="snap-start h-full w-full flex items-center justify-center">
            <Card className="w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-800 overflow-hidden border-none relative">
              {/* Efectos de fondo mejorados */}
              <div className="absolute inset-0">
                <img
                  src={`${albumData.image_cover}`}
                  alt={`${albumData.name} cover`}
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/40" />
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20" />
              </div>

              {/* Header mejorado con título del álbum */}
              <div className="absolute top-6 left-0 right-0 z-20 px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <Music className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white font-bold text-sm tracking-wide truncate max-w-[200px]">
                        {albumData.name}
                      </span>
                      <span className="text-gray-300 font-light text-xs truncate max-w-[200px]">
                        {albumData.artist_name}
                      </span>
                    </div>
                  </div>
                  <div className="w-6 h-6 flex items-center justify-center">
                    <div className="w-1 h-1 bg-white rounded-full"></div>
                    <div className="w-1 h-1 bg-white rounded-full mx-1"></div>
                    <div className="w-1 h-1 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Título del álbum centrado */}
              <div className="absolute top-1/4 left-0 right-0 z-20 text-center px-6">
                <Link href={`/album/${albumData.slug}`}>
                  <motion.h1
                    className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {albumData.name}
                  </motion.h1>
                </Link>
                <motion.p
                  className="text-xl text-gray-300 font-light"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {albumData.artist_name}
                </motion.p>
              </div>

              {/* Resto del contenido... */}
              <div className="absolute inset-0 flex flex-col justify-end">
                <div className="flex flex-col items-center space-y-6 p-6 pb-8">
                  <motion.div
                    className="text-center space-y-4"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <p className="text-lg text-gray-300 leading-relaxed max-w-md">
                      {albumData.description}
                    </p>

                    <div className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl px-6 py-4 border border-gray-700/30">
                      <p className="text-white font-semibold">
                        Mint Price:{" "}
                        <span className="text-purple-400 font-bold">
                          {albumData.mint_price} {albumData.mint_currency}
                        </span>
                      </p>
                    </div>

                    {/* Trading Button para vista de álbum */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full max-w-xs"
                    >
                      <Button
                        onClick={() => setIsTradingModalOpen(true)}
                        className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white font-semibold py-3 px-6 rounded-xl shadow-lg border border-yellow-400/30 flex items-center justify-center gap-2 transition-all duration-300"
                      >
                        <Coins className="h-5 w-5" />
                        Trade {albumData.name} Tokens
                      </Button>
                    </motion.div>
                  </motion.div>

                  {/* Colaboradores mejorados */}
                  {albumData.collaborators &&
                    albumData.collaborators.length > 0 && (
                      <motion.div
                        className="w-full max-w-2xl"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                      >
                        <h3 className="text-white font-semibold mb-4 text-center">
                          Collaborators
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {albumData.collaborators.map(
                            (collaborator, index) => (
                              <React.Fragment key={index}>
                                <Card className="bg-gradient-to-br from-gray-800/60 to-gray-900/80 backdrop-blur-sm p-4 rounded-xl border border-gray-700/30">
                                  <div className="space-y-2">
                                    <p className="text-white font-semibold text-sm">
                                      Address Distributor
                                    </p>
                                    <p className="text-gray-400 text-xs font-mono">
                                      {collaborator.address.slice(0, 8)}...
                                      {collaborator.address.slice(-6)}
                                    </p>
                                    <div className="flex items-center justify-between">
                                      <span className="text-purple-400 text-sm font-medium">
                                        100% royalties
                                      </span>
                                    </div>
                                  </div>
                                </Card>

                                <Card className="bg-gradient-to-br from-gray-800/60 to-gray-900/80 backdrop-blur-sm p-4 rounded-xl border border-gray-700/30">
                                  <div className="space-y-2">
                                    <p className="text-white font-semibold text-sm">
                                      Metadata
                                    </p>
                                    <button
                                      onClick={() =>
                                        window.open(
                                          albumData.base_url_image,
                                          "_blank"
                                        )
                                      }
                                      className="text-blue-400 hover:text-blue-300 transition-colors text-xs underline decoration-dotted flex items-center group"
                                    >
                                      <span className="truncate max-w-[120px]">
                                        View metadata
                                      </span>
                                      <svg
                                        className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                        <polyline points="15 3 21 3 21 9"></polyline>
                                        <line
                                          x1="10"
                                          y1="14"
                                          x2="21"
                                          y2="3"
                                        ></line>
                                      </svg>
                                    </button>
                                  </div>
                                </Card>
                              </React.Fragment>
                            )
                          )}
                        </div>
                      </motion.div>
                    )}
                </div>
              </div>

              {/* ✅ x402 Premium Overlay para vista sin NFTs */}
              <AnimatePresence>
                {(albumData as any).x402Config?.price &&
                  (albumData as any).x402Config?.recipientAddress &&
                  // ✅ No mostrar overlay si el usuario es el dueño
                  evmWalletAddress?.toLowerCase() !==
                    (
                      albumData as any
                    ).x402Config?.recipientAddress?.toLowerCase() &&
                  isContentUnlocked !== true && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl"
                    >
                      <div className="flex flex-col items-center gap-6 px-6 text-center max-w-md">
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
                          <div className="p-6 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full shadow-2xl">
                            <Lock className="h-12 w-12 text-white" />
                          </div>
                        </motion.div>

                        {/* Content */}
                        <div>
                          <h3 className="text-2xl font-bold text-white mb-2">
                            {isCheckingUnlock
                              ? t("x402.verifying_access")
                              : t("x402.locked_content")}
                          </h3>
                          <p className="text-sm text-zinc-400 mb-4">
                            {isCheckingUnlock
                              ? t("x402.checking_access_description")
                              : t("x402.unlock_to_listen")}
                          </p>

                          <div className="flex flex-col items-center gap-4">
                            <div className="px-6 py-3 bg-zinc-900 rounded-xl border border-purple-500/30">
                              <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                                {(albumData as any).x402Config.price}
                              </p>
                              <p className="text-xs text-zinc-500 mt-1">
                                {(albumData as any).x402Config.currency ||
                                  "USDC"}
                              </p>
                            </div>

                            <Button
                              onClick={async () => {
                                if (!hasWalletConnected) {
                                  toast.error(t("x402.connect_wallet_first"));
                                  return;
                                }
                                try {
                                  await x402UnlockContent(
                                    albumData._id,
                                    (albumData as any).x402Config
                                  );
                                } catch (error) {
                                  console.error("Error unlocking:", error);
                                }
                              }}
                              disabled={!hasWalletConnected || isCheckingUnlock}
                              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                              size="lg"
                            >
                              {!hasWalletConnected
                                ? t("wallet.connect")
                                : isCheckingUnlock
                                ? t("common.checking")
                                : t("x402.unlock_now")}
                            </Button>

                            <div className="text-xs text-zinc-500 space-y-1">
                              <p>✓ {t("x402.secure_payment")}</p>
                              <p>✓ {t("x402.access_30_days")}</p>
                              <p>✓ {t("x402.support_artist")}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
              </AnimatePresence>
            </Card>
          </div>
        ) : (
          // Vista de NFTs individuales con diseño mejorado
          albumNFTs.map((nft: any, index: number) => (
            <div
              key={nft._id}
              className="snap-start h-full w-full flex items-center justify-center"
            >
              <Card className="w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-800 overflow-hidden border-none relative">
                {/* Imagen de fondo */}
                <div className="absolute inset-0">
                  <img
                    src={
                      nft.image?.startsWith("http")
                        ? nft.image
                        : `/${nft.image}`
                    }
                    alt={`${nft.name || "NFT"} cover`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60" />
                </div>

                {/* Layout principal con flexbox */}
                <div className="relative h-full flex flex-col">
                  {/* Header */}
                  <div className="flex-shrink-0 p-4 pb-2 z-20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                          <Music className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-white font-bold text-sm tracking-wide truncate max-w-[200px]">
                            {albumData.name}
                          </span>
                          <Link href={`/u/${albumData.artist_name}`}>
                            <span className="text-gray-300 font-light text-xs truncate max-w-[200px]">
                              {albumData.artist_name}
                            </span>
                          </Link>
                        </div>
                      </div>
                      {/* <div className="w-6 h-6 flex items-center justify-center">
                        <div className="w-1 h-1 bg-white rounded-full"></div>
                        <div className="w-1 h-1 bg-white rounded-full mx-1"></div>
                        <div className="w-1 h-1 bg-white rounded-full"></div>
                      </div> */}
                    </div>
                  </div>

                  {/* Contenido central con botones laterales - ALTURA REALMENTE CONTROLADA */}
                  <div className="flex-grow min-h-0 flex items-center md:items-end justify-end pr-4 z-20 sm:flex-1">
                    {/* Botones de acción laterales - CENTRADO CORREGIDO */}
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
                          onClick={() => handleTogglePlaylist(nft)}
                          title={
                            isInPlaylist(nft._id)
                              ? "Remove from queue"
                              : "Add to queue"
                          }
                          className="bg-black/40 backdrop-blur-sm hover:bg-white/20 text-white rounded-full border border-white/20 relative h-12 w-12"
                        >
                          <ListMusicIcon className="h-5 w-5" />
                          {isInPlaylist(nft._id || "") ? (
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
                          nftId={nft._id}
                          variant="default"
                          size="lg"
                          showCount={false}
                        />
                      </motion.div>

                      {/* Trading Button */}
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant="default"
                          size="icon"
                          onClick={() => setIsTradingModalOpen(true)}
                          title="Trade Tokens"
                          className="bg-gradient-to-r from-yellow-500/80 to-orange-500/80 backdrop-blur-sm hover:from-yellow-400/90 hover:to-orange-400/90 text-white rounded-full border border-yellow-400/30 relative h-12 w-12"
                        >
                          <Coins className="h-5 w-5" />
                        </Button>
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
                          ref={claimButtonRef}
                          variant="secondary"
                          size="icon"
                          onClick={handleClaimClick}
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

                  {/* Contenido inferior - GARANTIZADO SIN RECORTE */}
                  <div className="flex-shrink-0 relative z-20 min-h-[200px] sm:min-h-[320px] flex flex-col justify-center items-center">
                    <div className="flex flex-col items-center space-y-2 sm:space-y-4 p-4 sm:p-6 pt-2">
                      {/* Título de la canción */}
                      <motion.h1
                        className="text-xl sm:text-2xl md:text-3xl font-bold text-white text-center leading-tight max-w-[280px] truncate"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        {nft.name}
                      </motion.h1>

                      {/* Show songs button redesigned */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <Button
                          variant="ghost"
                          onClick={toggleTrackList}
                          className="text-white hover:bg-white/10 hover:text-white transition-all bg-black/20 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20 text-sm"
                        >
                          <span className="mr-2">
                            {!isTrackListOpen ? "Show songs" : "Hide list"}
                          </span>
                          {!isTrackListOpen ? (
                            <ChevronUpIcon className="h-3 w-3" />
                          ) : (
                            <ChevronDownIcon className="h-3 w-3" />
                          )}
                        </Button>
                      </motion.div>

                      {/* Playback controls redesigned */}
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
                            {isPlaying && currentSong?._id === nft._id ? (
                              <PauseIcon className="h-7 w-7 sm:h-8 sm:w-8" />
                            ) : (
                              <PlayIcon className="h-7 w-7 sm:h-8 sm:w-8 ml-1" />
                            )}
                          </Button>

                          {/* Animation circle when playing */}
                          {/* {isPlaying && currentSong?._id === nft._id && (
                            <motion.div
                              className="absolute inset-0 rounded-full border-2 border-white/50"
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                            />
                          )} */}
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

                    {/* Improved song list - CORRECTED POSITIONING */}
                    <AnimatePresence>
                      {isTrackListOpen && (
                        <motion.div
                          initial={{ y: "100%", opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: "100%", opacity: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                          }}
                          className="absolute bottom-0 z-50 left-0 right-0 bg-gradient-to-t from-black via-black/95 to-black/80 backdrop-blur-lg rounded-t-3xl border-t border-white/20"
                        >
                          <div className="flex justify-center items-center py-4">
                            <Button
                              variant="ghost"
                              onClick={toggleTrackList}
                              className="text-white hover:bg-white/10 hover:text-white transition-colors"
                            >
                              <ChevronDownIcon className="mr-2 h-4 w-4" />
                              Close list
                            </Button>
                          </div>
                          <div className="w-full max-h-[40vh] overflow-y-auto scrollbar-hide p-4 pb-6">
                            {albumNFTs.map((track: NFT, trackIndex: number) => (
                              <motion.div
                                key={track._id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: trackIndex * 0.1 }}
                                className={`flex items-center justify-between p-4 ${
                                  currentSong?._id === track._id
                                    ? "bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30"
                                    : "hover:bg-white/10"
                                } cursor-pointer rounded-xl mb-3 transition-all duration-200`}
                                onClick={() =>
                                  handleSongSelect(track, trackIndex)
                                }
                              >
                                <div className="flex items-center">
                                  <div className="relative mr-4">
                                    <img
                                      src={track.image}
                                      alt={track.name}
                                      className="w-12 h-12 rounded-lg object-cover"
                                    />
                                    {currentSong?._id === track._id && (
                                      <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                                        {isPlaying ? (
                                          <motion.div
                                            className="w-3 h-3 rounded-full bg-white"
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{
                                              repeat: Infinity,
                                              duration: 1,
                                            }}
                                          />
                                        ) : (
                                          <PlayIcon className="w-4 h-4 text-white" />
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <span className="text-white font-medium">
                                      {track.name}
                                    </span>
                                    <p className="text-gray-400 text-sm">
                                      {albumData.artist_name}
                                    </p>
                                  </div>
                                </div>
                                {currentSong?._id === track._id && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="flex items-center space-x-2"
                                  >
                                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                                    <span className="text-purple-400 text-sm font-medium">
                                      Playing
                                    </span>
                                  </motion.div>
                                )}
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Player component - POSICIONADO COMO EN CardMusicHome */}
                  <PlayerHome
                    url={nft.music}
                    autoplay={
                      isPlaying && activePlayerId === nft._id && !scrolling
                    }
                    isPlaying={
                      isPlaying && activePlayerId === nft._id && !scrolling
                    }
                    muted={isMuted}
                    onEnded={handleNextSong}
                    trackId={nft._id}
                  />
                </div>

                {/* ✅ x402 Premium Overlay */}
                <AnimatePresence>
                  {(albumData as any).x402Config?.price &&
                    (albumData as any).x402Config?.recipientAddress &&
                    // ✅ No mostrar overlay si el usuario es el dueño
                    evmWalletAddress?.toLowerCase() !==
                      (
                        albumData as any
                      ).x402Config?.recipientAddress?.toLowerCase() &&
                    isContentUnlocked !== true && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl"
                      >
                        <div className="flex flex-col items-center gap-6 px-6 text-center max-w-md">
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
                            <div className="p-6 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full shadow-2xl">
                              <Lock className="h-12 w-12 text-white" />
                            </div>
                          </motion.div>

                          {/* Content */}
                          <div>
                            <h3 className="text-2xl font-bold text-white mb-2">
                              {isCheckingUnlock
                                ? t("x402.verifying_access")
                                : t("x402.locked_content")}
                            </h3>
                            <p className="text-sm text-zinc-400 mb-4">
                              {isCheckingUnlock
                                ? t("x402.checking_access_description")
                                : t("x402.unlock_to_listen")}
                            </p>

                            <div className="flex flex-col items-center gap-4">
                              <div className="px-6 py-3 bg-zinc-900 rounded-xl border border-purple-500/30">
                                <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                                  {(albumData as any).x402Config.price}
                                </p>
                                <p className="text-xs text-zinc-500 mt-1">
                                  {(albumData as any).x402Config.currency ||
                                    "USDC"}
                                </p>
                              </div>

                              <Button
                                onClick={async () => {
                                  if (!hasWalletConnected) {
                                    toast.error(t("x402.connect_wallet_first"));
                                    return;
                                  }
                                  try {
                                    await x402UnlockContent(
                                      albumData._id,
                                      (albumData as any).x402Config
                                    );
                                  } catch (error) {
                                    console.error("Error unlocking:", error);
                                  }
                                }}
                                disabled={
                                  !hasWalletConnected || isCheckingUnlock
                                }
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                size="lg"
                              >
                                {!hasWalletConnected
                                  ? t("wallet.connect")
                                  : isCheckingUnlock
                                  ? t("common.checking")
                                  : t("x402.unlock_now")}
                              </Button>

                              <div className="text-xs text-zinc-500 space-y-1">
                                <p>✓ {t("x402.secure_payment")}</p>
                                <p>✓ {t("x402.access_30_days")}</p>
                                <p>✓ {t("x402.support_artist")}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                </AnimatePresence>
              </Card>
            </div>
          ))
        )}
      </div>

      {/* Trading Modal */}
      <Dialog open={isTradingModalOpen} onOpenChange={setIsTradingModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border-neutral-800 shadow-2xl">
          <DialogHeader className="border-b border-neutral-800 pb-4">
            <DialogTitle className="flex items-center gap-3 text-white text-xl font-semibold">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                <Coins className="h-4 w-4 text-blue-400" />
              </div>
              Trade {albumData.name} Tokens
            </DialogTitle>
            <p className="text-neutral-400 text-sm mt-2">
              Buy tokens for {albumData.name} and use them to claim NFTs
            </p>
          </DialogHeader>
          <TradingInterface
            coinAddress={albumData.coin_address}
            title={`Trade ${albumData.name} Tokens`}
            description={`Buy tokens for ${albumData.name} and use them to claim NFTs`}
          />
        </DialogContent>
      </Dialog>

      {/* Mint Modal */}
      <MintModal
        isOpen={isMintModalOpen}
        onClose={() => setIsMintModalOpen(false)}
        onConfirm={handleConfirmMint}
        nftData={currentSong}
        albumData={albumData}
        isLoading={isMintingAny}
        currency="ETH"
        maxAmount={100}
        minAmount={1}
      />
    </div>
  );
}
