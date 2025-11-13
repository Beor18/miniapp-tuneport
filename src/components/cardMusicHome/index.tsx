/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useRef, useState, useEffect, useContext } from "react";
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
  Lock,
} from "lucide-react";
import PlayerHome from "../playerHome";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import useAudioControls from "../../lib/hooks/useAudioControls";
import { LikeButton } from "../ui/LikeButton";
import { useCandyMachineMint } from "@Src/lib/hooks/solana/useCandyMachineMint";
import { useBlockchainOperations } from "@Src/lib/hooks/common/useBlockchainOperations";
import { useX402Payment } from "@Src/lib/hooks/base/useX402Payment";
import { toast } from "sonner";
import { useAppKitAccount } from "@Src/lib/privy";
import { motion, AnimatePresence } from "framer-motion";
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
import { UserRegistrationContext, MiniAppContext } from "@Src/app/providers";

export default function CardMusicHome({ nftData, collectionData }: any) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrolling, setScrolling] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isMintModalOpen, setIsMintModalOpen] = useState(false);
  const [selectedSongForMint, setSelectedSongForMint] = useState<any>(null);
  const [isTradingModalOpen, setIsTradingModalOpen] = useState(false);

  // 🆕 ACCESO AL CONTEXTO DE REGISTRO para Mini Apps
  const { isRegistered, userData } = useContext(UserRegistrationContext);

  // Hook para traducciones
  const tCommon = useTranslations("common");
  const tMusic = useTranslations("music");
  const tX402 = useTranslations("x402");

  // Hooks para minting
  const { mint, isMinting } = useCandyMachineMint();
  const [mintedNft, setMintedNft] = useState<string | null>(null);

  // Hook para operaciones blockchain con Base (ERC1155)
  const baseOperations = useBlockchainOperations({
    blockchain: "base",
    useERC1155: true,
  });

  // Usar hook unificado que maneja Privy + Mini Apps
  // 🎯 MINIKIT: Usar hooks simplificados
  const { address, isConnected, solanaWalletAddress, evmWalletAddress } =
    useAppKitAccount();
  const { isMiniApp } = useContext(MiniAppContext);

  // Verificar si hay alguna wallet conectada
  const hasWalletConnected = isMiniApp
    ? (isRegistered === true && userData) ||
      (isConnected &&
        (!!address || !!solanaWalletAddress || !!evmWalletAddress))
    : isConnected && (!!address || !!solanaWalletAddress || !!evmWalletAddress);

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
    setIsContentLocked, // ✅ Para controlar el bloqueo global
  } = useAudioControls();

  // x402 Premium States (para la canción actual)
  const [currentSongUnlockStatus, setCurrentSongUnlockStatus] = useState<
    Record<string, boolean>
  >({});
  const [isCheckingUnlock, setIsCheckingUnlock] = useState(false);

  // ✅ Hook x402 para desbloquear contenido
  const { unlockContent: x402UnlockContent, checkUnlockStatus } =
    useX402Payment({
      onSuccess: (contentId, txHash) => {
        console.log("✅ Content unlocked:", contentId, txHash);

        // Actualizar el estado de unlock localmente
        setCurrentSongUnlockStatus((prev) => ({
          ...prev,
          [contentId]: true,
        }));

        toast.success(tX402("success.unlocked"), {
          description: tX402("success.enjoyContent"),
        });

        // Refrescar datos del servidor sin perder estado del cliente
        router.refresh();
      },
      onError: (error) => {
        console.error("❌ Failed to unlock:", error);
      },
    });

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

  // ✅ Referencia para guardar el último estado de unlock verificado
  const lastUnlockStatusRef = useRef<Record<string, boolean>>({});

  // ✅ Efecto reactivo para manejar cambios en el unlock status
  useEffect(() => {
    if (!currentSong?.albumId) return;

    const unlockStatus = currentSongUnlockStatus[currentSong.albumId];
    const lastStatus = lastUnlockStatusRef.current[currentSong.albumId];

    // Solo actuar si el status cambió realmente
    if (unlockStatus !== lastStatus && unlockStatus !== undefined) {
      lastUnlockStatusRef.current[currentSong.albumId] = unlockStatus;

      if (unlockStatus === true) {
        setIsContentLocked(false);
        // Si se desbloquea, activar reproducción
        setIsPlaying(true);
      } else if (unlockStatus === false) {
        setIsContentLocked(true);
        // Si está bloqueado, pausar
        setIsPlaying(false);
      }
    }
  }, [
    currentSongUnlockStatus,
    currentSong?.albumId,
    setIsContentLocked,
    setIsPlaying,
  ]);

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

        // ✅ NO reproducir automáticamente - dejamos que el useEffect de verificación lo maneje
        setIsPlaying(false);
      }
    }, 1000);

    return () => {
      clearTimeout(loadTimer);
      // ✅ Resetear el estado de bloqueo al salir de /foryou
      setIsContentLocked(false);
    };
  }, [
    enrichedNftData,
    currentSong,
    setCurrentSong,
    setActivePlayerId,
    setIsPlaying,
    setNftData,
    setIsContentLocked,
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
          // Solo mostrar si no estamos en un álbum ni en foryou (compatible con idiomas)
          if (
            !pathname.startsWith("/album/") &&
            !pathname.match(/\/foryou(\/|$)/)
          ) {
            console.log(
              `[CardMusicHome:${effectId}] Mostrando FloatingPlayer al desmontar`
            );
            setShowFloatingPlayer(true);
          }
        }, 400); // Tiempo suficiente para que termine la navegación
      }
    };
  }, [setShowFloatingPlayer, currentSong, pathname]);

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

  // ✅ Efecto para verificar el unlock status cuando cambia la canción actual
  useEffect(() => {
    if (!currentSong || !currentSong.albumId) {
      // Si no hay canción o no tiene albumId, desbloquear
      setIsContentLocked(false);
      return;
    }

    const songConfig = currentSong.x402Config;

    // Si no tiene configuración x402 o no tiene precio, está desbloqueado
    if (!songConfig || !songConfig.price || !songConfig.recipientAddress) {
      setCurrentSongUnlockStatus((prev) => ({
        ...prev,
        [currentSong.albumId]: true,
      }));
      return;
    }

    // ✅ Si el usuario es el dueño (recipientAddress), desbloquear automáticamente
    if (
      hasWalletConnected &&
      evmWalletAddress &&
      songConfig.recipientAddress &&
      evmWalletAddress.toLowerCase() ===
        songConfig.recipientAddress.toLowerCase()
    ) {
      console.log("👑 CardMusicHome - Usuario es el dueño, desbloqueando");
      setCurrentSongUnlockStatus((prev) => ({
        ...prev,
        [currentSong.albumId]: true,
      }));
      setIsContentLocked(false);
      return;
    }

    // 🔒 INMEDIATAMENTE: Si no hay wallet, está bloqueado (sin async)
    if (!hasWalletConnected || !evmWalletAddress) {
      console.log("⚠️ CardMusicHome - Sin wallet, contenido bloqueado");
      setCurrentSongUnlockStatus((prev) => ({
        ...prev,
        [currentSong.albumId]: false,
      }));
      setIsCheckingUnlock(false);
      return;
    }

    // Función async solo para cuando SÍ hay wallet
    const checkCurrentSongUnlock = async () => {
      console.log("🏠 CardMusicHome - Verificando unlock:", {
        songName: currentSong.name,
        albumId: currentSong.albumId,
        previousStatus: currentSongUnlockStatus[currentSong.albumId],
        hasWallet: hasWalletConnected,
      });

      // Si ya sabemos que está desbloqueado, no verificar de nuevo
      if (currentSongUnlockStatus[currentSong.albumId] === true) {
        console.log("✅ CardMusicHome - Ya desbloqueado (cache)");
        return;
      }

      // Verificar en el backend solo si no hemos verificado antes
      if (currentSongUnlockStatus[currentSong.albumId] === undefined) {
        console.log("🔍 CardMusicHome - Verificando en backend:", {
          albumId: currentSong.albumId,
          wallet: evmWalletAddress,
        });
        setIsCheckingUnlock(true);
        try {
          const status = await checkUnlockStatus(currentSong.albumId);
          console.log("📥 CardMusicHome - Respuesta backend:", {
            isUnlocked: status.isUnlocked,
            hasPaid: status.hasPaid,
          });
          setCurrentSongUnlockStatus((prev) => ({
            ...prev,
            [currentSong.albumId]: status.isUnlocked,
          }));
        } catch (error) {
          console.error("❌ CardMusicHome - Error checking unlock:", error);
          setCurrentSongUnlockStatus((prev) => ({
            ...prev,
            [currentSong.albumId]: false,
          }));
        } finally {
          setIsCheckingUnlock(false);
        }
      } else {
        // Ya verificamos antes y está bloqueado
        console.log("🔒 CardMusicHome - Ya bloqueado (cache)");
      }
    };

    checkCurrentSongUnlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentSong?._id,
    currentSong?.albumId,
    hasWalletConnected,
    evmWalletAddress,
  ]);

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

            // ✅ Pausar temporalmente, el useEffect decidirá si reproducir
            setIsPlaying(false);
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

  // ✅ Handler para desbloquear contenido
  const handleUnlockContent = async () => {
    if (!currentSong || !currentSong.albumId) return;

    const songConfig = currentSong.x402Config;
    if (!songConfig || !songConfig.price || !songConfig.recipientAddress)
      return;

    if (!hasWalletConnected || !evmWalletAddress) {
      toast.error(tX402("errors.walletRequired"), {
        description: tX402("errors.connectWallet"),
      });
      return;
    }

    try {
      await x402UnlockContent(currentSong.albumId, songConfig);
    } catch (error) {
      console.error("Error unlocking content:", error);
    }
  };

  // Función simplificada para el botón play/pause
  const togglePlay = () => {
    if (!scrolling && currentSong) {
      // ✅ Verificar si la canción actual está bloqueada
      const songConfig = currentSong.x402Config;
      if (songConfig?.price && songConfig?.recipientAddress) {
        const isUnlocked = currentSongUnlockStatus[currentSong.albumId];
        if (!isUnlocked) {
          toast.error(tX402("errors.contentLocked"), {
            description: tX402("errors.unlockToPlay"),
          });
          return;
        }
      }
      // Usar handlePlayPause del hook directamente
      handlePlayPause();
    } else if (!currentSong && enrichedNftData.length > 0) {
      // Si no hay canción actual, seleccionar la primera
      const firstSong = enrichedNftData[0];
      setCurrentSong(firstSong);
      setActivePlayerId(firstSong._id);

      // Verificar si está bloqueada
      const firstSongConfig = firstSong.x402Config;
      if (firstSongConfig?.price && firstSongConfig?.recipientAddress) {
        setIsPlaying(false);
      } else {
        setIsPlaying(true);
      }
    }
  };

  // Funciones para navegación de tracks
  const handlePrevTrack = () => {
    // Encontrar la canción anterior
    const currentIndex = enrichedNftData.findIndex(
      (song: any) => song._id === currentSong?._id
    );
    const prevIndex =
      currentIndex > 0 ? currentIndex - 1 : enrichedNftData.length - 1;
    const prevSong = enrichedNftData[prevIndex];

    if (prevSong) {
      setCurrentSong(prevSong);
      setActivePlayerId(prevSong._id);

      // ✅ Solo reproducir si NO está bloqueada
      const prevSongConfig = prevSong.x402Config;
      const isPrevUnlocked = currentSongUnlockStatus[prevSong.albumId];

      if (
        !prevSongConfig?.price ||
        !prevSongConfig?.recipientAddress ||
        isPrevUnlocked === true
      ) {
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
    }
  };

  const handleNextTrack = () => {
    // Encontrar la canción siguiente
    const currentIndex = enrichedNftData.findIndex(
      (song: any) => song._id === currentSong?._id
    );
    const nextIndex =
      currentIndex < enrichedNftData.length - 1 ? currentIndex + 1 : 0;
    const nextSong = enrichedNftData[nextIndex];

    if (nextSong) {
      setCurrentSong(nextSong);
      setActivePlayerId(nextSong._id);

      // ✅ Solo reproducir si NO está bloqueada
      const nextSongConfig = nextSong.x402Config;
      const isNextUnlocked = currentSongUnlockStatus[nextSong.albumId];

      if (
        !nextSongConfig?.price ||
        !nextSongConfig?.recipientAddress ||
        isNextUnlocked === true
      ) {
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
    }
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

  // Si no hay datos, mostrar pantalla de estado vacío
  if (!enrichedNftData || enrichedNftData.length === 0) {
    return (
      <div className="h-full w-full sm:h-[870px] sm:w-full md:w-[540px] md:h-[960px] lg:w-[540px] lg:h-[960px] overflow-hidden font-sans mx-auto flex flex-col">
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-[#18181b] via-[#1a1a1d] to-[#18181b]">
          <Card className="w-full max-w-md border-none bg-gradient-to-br from-[#18181b] via-[#1a1a1d] to-[#18181b] p-8 shadow-2xl">
            <div className="flex flex-col items-center text-center space-y-6">
              {/* Icono principal con colores de la plataforma */}
              <div className="w-24 h-24 bg-gradient-to-br from-yellow-500/20 via-purple-500/20 to-cyan-400/20 rounded-full flex items-center justify-center border border-purple-500/30 shadow-lg shadow-purple-500/25 animate-pulse">
                <Music className="w-12 h-12 text-purple-400" />
              </div>

              {/* Título */}
              <div className="space-y-3">
                <h2 className="text-3xl font-black text-white bg-gradient-to-r from-yellow-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
                  {tCommon("noMusicAvailable")}
                </h2>
                <p className="text-zinc-300 text-base leading-relaxed max-w-sm">
                  {tCommon("noMusicDescription")}
                </p>
              </div>

              {/* Información adicional con gradiente viral */}
              <div className="mt-4 p-4 bg-gradient-to-r from-yellow-500/10 via-purple-500/10 to-cyan-400/10 rounded-xl border border-purple-500/30 backdrop-blur-sm">
                <p className="text-sm text-zinc-400 text-center">
                  {tCommon("createShareMonetize")} 🎵⚡
                </p>
              </div>

              {/* Partículas decorativas */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-10 left-1/4 w-2 h-2 bg-yellow-400 rounded-full opacity-70 animate-pulse"></div>
                <div className="absolute top-20 right-1/3 w-1 h-1 bg-purple-400 rounded-full opacity-80 animate-ping"></div>
                <div className="absolute bottom-20 right-1/4 w-1.5 h-1.5 bg-cyan-400 rounded-full opacity-60 animate-pulse"></div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

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

                {/* ✅ x402 Premium Overlay - Solo si es la canción actual Y confirmamos que está bloqueada */}
                <AnimatePresence>
                  {currentSong?._id === song._id &&
                    song.x402Config?.price &&
                    song.x402Config?.recipientAddress &&
                    // ✅ No mostrar overlay si el usuario es el dueño
                    evmWalletAddress?.toLowerCase() !==
                      song.x402Config.recipientAddress?.toLowerCase() &&
                    (currentSongUnlockStatus[song.albumId] === false ||
                      (!hasWalletConnected &&
                        currentSongUnlockStatus[song.albumId] !== true)) &&
                    !isCheckingUnlock && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
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
                              {song.name}
                            </h3>
                            <p className="text-sm text-zinc-400 mb-4">
                              {tX402("unlock_song_to_listen")}
                            </p>

                            <div className="flex flex-col items-center gap-4">
                              <div className="px-6 py-3 bg-zinc-900 rounded-xl border border-purple-500/30">
                                <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                                  {song.x402Config.price}
                                </p>
                                <p className="text-xs text-zinc-500 mt-1">
                                  {song.x402Config.currency || "USDC"}
                                </p>
                              </div>

                              <Button
                                onClick={async () => {
                                  if (!hasWalletConnected) {
                                    toast.error(tX402("connect_wallet_first"));
                                    return;
                                  }
                                  try {
                                    await x402UnlockContent(
                                      song.albumId,
                                      song.x402Config
                                    );
                                  } catch (error) {
                                    console.error("Error unlocking:", error);
                                  }
                                }}
                                disabled={!hasWalletConnected}
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                size="lg"
                              >
                                {!hasWalletConnected
                                  ? tCommon("connect_wallet")
                                  : tX402("unlock_now")}
                              </Button>

                              <div className="text-xs text-zinc-500 space-y-1">
                                <p>✓ {tX402("secure_payment")}</p>
                                <p>✓ {tX402("access_30_days")}</p>
                                <p>✓ {tX402("support_artist")}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                </AnimatePresence>

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
                  </div>

                  {/* Contenido central con botones laterales */}
                  <div className="flex-grow min-h-0 flex items-center md:items-end justify-end pr-4 z-40 sm:flex-1">
                    {/* Botones de acción laterales */}
                    <div className="flex flex-col space-y-2">
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
