/* eslint-disable @next/next/no-img-element */
"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useContext,
  useCallback,
} from "react";
import {
  X,
  Search,
  PlusIcon,
  MinusIcon,
  Trash2,
  Plus,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { Track } from "@Src/contexts/PlayerContext";
import { Button } from "@Src/ui/components/ui/button";
import { Input } from "@Src/ui/components/ui/input";
import { Textarea } from "@Src/ui/components/ui/textarea";
import { Switch } from "@Src/ui/components/ui/switch";
import { createPlaylist } from "@Src/lib/actions/playlists";
import { UserRegistrationContext } from "@Src/app/providers";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
// 🎯 HOOKS NATIVOS DE TUNEPORT PARA ECONOMÍA EN CASCADA
import { useERC1155Factory } from "@Src/lib/hooks/base/useERC1155Factory";
import { useRevenueShare } from "@Src/lib/contracts/erc1155/useRevenueShare";
import { DEFAULT_NETWORK } from "@Src/lib/contracts/erc1155/config";

// Categories for tag selection
const MUSIC_CATEGORIES = [
  { id: "rock", name: "Rock", color: "bg-slate-600" },
  { id: "pop", name: "Pop", color: "bg-purple-600" },
  { id: "cumbia", name: "Cumbia", color: "bg-teal-600" },
  { id: "chamame", name: "Chamamé", color: "bg-blue-600" },
  { id: "jazz", name: "Jazz", color: "bg-amber-700" },
  { id: "hiphop", name: "Hip Hop", color: "bg-gray-700" },
  { id: "reggaeton", name: "Reggaeton", color: "bg-green-700" },
  { id: "salsa", name: "Salsa", color: "bg-red-700" },
  { id: "tango", name: "Tango", color: "bg-rose-800" },
  { id: "tropical", name: "Tropical", color: "bg-cyan-700" },
  { id: "electronic", name: "Electronic", color: "bg-indigo-600" },
  { id: "folk", name: "Folk", color: "bg-emerald-700" },
];

export interface Song {
  id?: string;
  _id: string;
  name: string;
  artist?: string;
  artist_name?: string;
  albumArt?: string;
  image?: string;
  coin_address?: string; // ✅ Dirección de la colección original del artista (para herencia)
}

interface PlaylistProps {
  isVisible: boolean;
  onClose: () => void;
  songs: (Song | Track)[];
  currentSong?: Song | Track;
  onSongSelect?: (song: Song | Track) => void;
  onReorder?: (newOrder: (Song | Track)[]) => void;
  onRemove?: (song: Song | Track) => void;
  onCreatePlaylist?: () => void;
}

const PlaylistItem: React.FC<{
  song: Song | Track;
  index: number;
  isPlaying: boolean;
  onSelect?: (song: Song | Track) => void;
  onRemove?: (song: Song | Track) => void;
}> = ({ song, index, isPlaying, onSelect, onRemove }) => {
  const id = song.id || song._id;
  const artist = song.artist || song.artist_name || "";
  const albumArt = song.albumArt || song.image || "/logo.svg";

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(song);
    } else {
      console.log(
        "Función onRemove no proporcionada para eliminar:",
        song.name
      );
    }
  };

  return (
    <Draggable draggableId={id} index={index}>
      {(provided) => (
        <li
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`flex items-center p-2 rounded-lg mb-2 ${
            isPlaying ? "bg-zinc-700" : "hover:bg-zinc-700"
          } transition-all duration-200 cursor-pointer group`}
          onClick={() => onSelect && onSelect(song)}
        >
          <img
            src={albumArt}
            alt={`${song.name} album art`}
            className="w-10 h-10 rounded mr-3 bg-white object-cover"
          />
          <div className="flex-grow">
            <p className="font-medium text-[12px] text-white group-hover:text-primary-500 transition-colors">
              {song.name}
            </p>
            <p className="text-sm text-zinc-400">{artist}</p>
          </div>
          <div className="flex items-center">
            {isPlaying && (
              <div className="flex space-x-1 mr-2">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 h-4 bg-primary-500 rounded-full"
                    animate={{
                      scaleY: [1, 1.5, 1],
                      transition: {
                        repeat: Infinity,
                        repeatType: "reverse",
                        duration: 0.5,
                        delay: i * 0.2,
                      },
                    }}
                  />
                ))}
              </div>
            )}
            <button
              onClick={handleRemove}
              className="text-zinc-400 hover:text-red-500 transition-colors p-1.5 opacity-100 bg-zinc-700 rounded-full ml-2 border border-zinc-600"
              aria-label="Delete song"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </li>
      )}
    </Draggable>
  );
};

export const Playlist: React.FC<PlaylistProps> = ({
  isVisible,
  onClose,
  songs,
  currentSong,
  onSongSelect,
  onReorder,
  onRemove,
  onCreatePlaylist,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [playlistDescription, setPlaylistDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const { userData } = useContext(UserRegistrationContext);

  // Add translation hooks
  const tPlaylist = useTranslations("playlist");
  const tCommon = useTranslations("common");

  // 🎯 HOOKS NATIVOS DE TUNEPORT PARA ECONOMÍA EN CASCADA
  const {
    createCollection,
    isLoading: isTokenizing,
    getEvmWalletAddress,
  } = useERC1155Factory(DEFAULT_NETWORK);

  // 🔗 HOOK PARA REVENUE SHARE Y ECONOMÍA EN CASCADA
  const {
    createRevenueShare,
    isLoading: isCreatingRevenueShare,
    configureCollectionSplits,
    setInheritance,
    setCascadePercentage,
    setMintSplitsForCurator,
  } = useRevenueShare(DEFAULT_NETWORK);

  // 🎯 FUNCIÓN PARA OBTENER EL SIGUIENTE TOKEN ID DINÁMICAMENTE
  const getNextPlaylistTokenId = useCallback(
    async (collectionAddress: string): Promise<number> => {
      try {
        // Consultar la API local para obtener el último tokenId de la colección
        const response = await fetch(
          `/api/nfts/last-token-id?collectionId=${collectionAddress}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          // Si hay NFTs en la colección, retornar el siguiente ID
          // Si lastTokenId es -1 (no hay NFTs), el próximo será 0
          const nextTokenId = data.lastTokenId + 1;
          console.log("🎯 Próximo tokenId para playlist:", nextTokenId);
          return nextTokenId;
        } else {
          // Si la API falla o no encuentra datos, empezar desde 0
          console.warn(
            "No se pudo obtener el último tokenId, comenzando desde 0"
          );
          return 0;
        }
      } catch (error) {
        console.error("Error al obtener el último tokenId:", error);
        // En caso de error, empezar desde 0
        return 0;
      }
    },
    []
  );

  useEffect(() => {
    if (isVisible && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isVisible]);

  // Manejar tecla Escape para cerrar el formulario
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showCreateForm) {
        setShowCreateForm(false);
      }
    };

    if (showCreateForm) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [showCreateForm]);

  const filteredSongs = songs.filter(
    (song) =>
      song.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (
        song.artist?.toLowerCase() ||
        song.artist_name?.toLowerCase() ||
        ""
      ).includes(searchTerm.toLowerCase())
  );

  const onDragEnd = (result: DropResult) => {
    if (!result.destination || !onReorder) return;

    const items = Array.from(songs);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onReorder(items);
  };

  const compareIds = (song1: Song | Track, song2: Song | Track) => {
    const id1 = song1.id || song1._id;
    const id2 = song2.id || song2._id;
    return id1 === id2;
  };

  // Manejador para mostrar/ocultar el formulario
  const handleCreatePlaylist = () => {
    setShowCreateForm(!showCreateForm);
    if (!showCreateForm) {
      setPlaylistName(`My Queue - ${new Date().toLocaleDateString()}`);
      setSelectedTags([]);
    }
  };

  // Toggle tag selection
  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  // 🎯 Función para extraer direcciones de colecciones originales para cascading
  const processPlaylistCollaboratorsForCascading = (
    playlistSongs: (Song | Track)[]
  ) => {
    console.log("🎵 Procesando canciones para economía en cascada...");

    const originalCollections: string[] = [];
    const collaboratorsMap = new Map<
      string,
      { name: string; address: string; count: number }
    >();

    playlistSongs.forEach((song, index) => {
      console.log(`🔍 Canción ${index + 1}: ${song.name}`);
      console.log(`🔍 Estructura completa de la canción:`, song);

      // ✅ OBTENER DIRECCIÓN DE COLECCIÓN ORIGINAL (múltiples opciones)
      const collectionAddress = (song as any).address_collection;
      // (song as any).artist_address_mint ||
      // (song as any).collection_address ||
      // (song as any).collectionId;

      if (collectionAddress && typeof collectionAddress === "string") {
        originalCollections.push(collectionAddress);
        console.log(`✅ Colección encontrada: ${collectionAddress}`);
      } else {
        console.warn(
          `⚠️ No se encontró dirección de colección para: ${song.name}`
        );
        console.warn(`📋 Campos disponibles:`, Object.keys(song));
      }

      // Procesar artista para referencia (no para splits, sino para logs)
      const artistName = song.artist_name || song.artist || "Unknown Artist";
      const artistKey = artistName.toLowerCase();

      if (collaboratorsMap.has(artistKey)) {
        const existing = collaboratorsMap.get(artistKey)!;
        collaboratorsMap.set(artistKey, {
          ...existing,
          count: existing.count + 1,
        });
      } else {
        collaboratorsMap.set(artistKey, {
          name: artistName,
          address: collectionAddress || "", // Solo para referencia
          count: 1,
        });
      }
    });

    console.log(
      "🏦 Direcciones de colecciones originales para herencia:",
      originalCollections
    );
    console.log(
      "👥 Artistas únicos en la playlist:",
      Array.from(collaboratorsMap.keys())
    );

    return {
      originalCollections: originalCollections.filter((addr) => addr), // Filtrar vacíos
      artists: Array.from(collaboratorsMap.values()),
      totalSongs: playlistSongs.length,
    };
  };

  // Función para crear imagen de cover combinada de la playlist
  const createPlaylistCoverImage = async (
    playlistSongs: (Song | Track)[]
  ): Promise<File | null> => {
    try {
      // Crear un canvas para combinar las imágenes de álbum
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      const size = 400; // Tamaño final de la imagen
      canvas.width = size;
      canvas.height = size;

      // Fondo gradient
      const gradient = ctx.createLinearGradient(0, 0, size, size);
      gradient.addColorStop(0, "#1f2937");
      gradient.addColorStop(1, "#4338ca");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);

      // Título de la playlist en el centro
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 24px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(playlistName || "My Playlist", size / 2, size / 2);

      // Subtítulo con número de canciones
      ctx.font = "16px Inter, sans-serif";
      ctx.fillStyle = "#d1d5db";
      ctx.fillText(`${playlistSongs.length} tracks`, size / 2, size / 2 + 40);

      // Convertir canvas a blob y luego a File
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "playlist-cover.png", {
              type: "image/png",
            });
            resolve(file);
          } else {
            resolve(null);
          }
        }, "image/png");
      });
    } catch (error) {
      console.error("Error creating playlist cover:", error);
      return null;
    }
  };

  // 🎯 Crear playlist con economía en cascada completa
  const handleSubmitPlaylist = async () => {
    if (!userData?._id || songs.length === 0 || !playlistName.trim()) return;

    setIsCreating(true);
    const MAIN_TOAST_ID = "playlist-creation-process";

    try {
      const nftIds = songs.map((track) => track._id);
      console.log(
        "🎵 Iniciando tokenización de playlist con economía en cascada..."
      );

      // 🏦 1. PROCESAR DIRECCIONES DE COLECCIONES ORIGINALES
      const { originalCollections, artists, totalSongs } =
        processPlaylistCollaboratorsForCascading(songs);

      if (originalCollections.length === 0) {
        toast.error(tPlaylist("noCollectionsFound"), {
          id: MAIN_TOAST_ID,
        });
        return;
      }

      console.log(
        `📊 ${originalCollections.length} colecciones originales encontradas para herencia`
      );

      // 💰 2. OBTENER DIRECCIÓN DE WALLET DEL CURATOR
      const userWalletAddress = getEvmWalletAddress();
      if (!userWalletAddress) {
        throw new Error(
          "No se pudo obtener la dirección de wallet del usuario"
        );
      }
      console.log("👤 Curator wallet:", userWalletAddress);

      // 🎨 3. CREAR IMAGEN DE COVER PARA LA PLAYLIST
      const playlistCoverImage = await createPlaylistCoverImage(songs);
      console.log("🖼️ Cover de playlist:", playlistCoverImage ? "✅" : "❌");

      // 📝 4. GENERAR METADATOS DE LA PLAYLIST
      const playlistSymbol =
        playlistName
          .substring(0, 8)
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "") + "PL";

      // 🏗️ 5. CREAR REVENUE SHARE CONTRACT PARA LA PLAYLIST
      console.log("🏗️ Creando RevenueShare contract para la playlist...");
      toast.loading(tPlaylist("creatingRevenueShare"), {
        id: MAIN_TOAST_ID,
      });

      const revenueShareAddress = await createRevenueShare({
        artist: userWalletAddress, // El curator es el owner
        name: `${playlistName} - Revenue Sharing`,
        description: `Distribución automática: 70% artistas originales, 30% curator`,
      });

      if (!revenueShareAddress) {
        throw new Error("Falló la creación del contrato RevenueShare");
      }

      console.log("✅ RevenueShare creado:", revenueShareAddress);

      // ⚙️ 6. CONFIGURAR ECONOMÍA EN CASCADA (DESPUÉS DE CREAR COLECCIÓN)
      // 🏭 7. CREAR COLECCIÓN ERC1155 PARA LA PLAYLIST
      console.log("🏭 Creando colección ERC1155 para la playlist...");
      toast.loading(tPlaylist("tokenizing"), {
        id: MAIN_TOAST_ID,
      });

      const collectionResult = await createCollection({
        name: `🎵 ${playlistName}`,
        symbol: playlistSymbol,
        baseURI: "", // Se generará automáticamente por el hook
        description:
          playlistDescription ||
          `Curated playlist: ${playlistName} with ${songs.length} amazing tracks`,
        mintStartDate: Math.floor(Date.now() / 1000), // Ahora
        mintEndDate: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60, // 1 año
        price: 0.001, // Precio accesible para playlists
        paymentToken: "ETH", // ETH nativo
        royaltyReceiver: userWalletAddress,
        royaltyFee: 1000, // 10% de royalties
        coverImage: playlistCoverImage || undefined,
        artistName: userData.username || "Curator",
        musicGenre: selectedTags.join(", ") || "Mixed",
        recordLabel: "TUNEPORT Playlists",
        releaseDate: new Date().toISOString(),
        collectionType: "ALBUM",
        maxItems: 1000,
        // 🔗 CONECTAR CON REVENUE SHARE CREADO
        createRevenueShare: false, // Ya lo creamos antes
        existingRevenueShareAddress: revenueShareAddress,
        revenueShareName: `${playlistName} - Revenue Sharing`,
        revenueShareDescription: `Distribución automática: 70% artistas originales, 30% curator`,
      });

      // ✅ EXTRAER DIRECCIONES DEL RESULTADO
      const collectionAddress = collectionResult?.collectionAddress;
      const coinAddress = collectionResult?.coinAddress;

      console.log("✅ Collection address:", collectionAddress);
      console.log("🪙 Coin address:", coinAddress);

      // 🎯 8. OBTENER TOKEN ID DINÁMICO Y CONFIGURAR ECONOMÍA EN CASCADA
      let playlistTokenId = 0; // Default value
      if (collectionAddress) {
        console.log("🎯 Obteniendo tokenId dinámico para la playlist...");
        playlistTokenId = await getNextPlaylistTokenId(collectionAddress);
        console.log("✅ TokenId obtenido:", playlistTokenId);

        // 🏗️ CONFIGURAR HERENCIA DE COLECCIONES ORIGINALES
        console.log("🔗 Configurando herencia de colecciones originales...");
        const inheritanceSuccess = await setInheritance(
          revenueShareAddress,
          playlistTokenId,
          originalCollections
        );

        if (!inheritanceSuccess) {
          throw new Error("Falló la configuración de herencia de colecciones");
        }

        // ⚖️ CONFIGURAR PORCENTAJE DE CASCADA (70% a artistas originales)
        console.log("⚖️ Configurando porcentaje de cascada: 70% a artistas...");
        const cascadeSuccess = await setCascadePercentage(
          revenueShareAddress,
          playlistTokenId,
          70 // 70% a artistas originales
        );

        if (!cascadeSuccess) {
          throw new Error("Falló la configuración del porcentaje de cascada");
        }

        // 💰 CONFIGURAR SPLITS PARA EL CURATOR (30% restante)
        console.log("💰 Configurando splits finales para curator...");
        const finalSplitsSuccess = await setMintSplitsForCurator(
          revenueShareAddress,
          collectionAddress,
          playlistTokenId,
          userWalletAddress,
          30 // 30% para el curator
        );

        if (finalSplitsSuccess) {
          console.log("✅ Splits del curator configurados correctamente");
        } else {
          console.warn(
            "⚠️ Advertencia: No se pudieron configurar splits finales del curator"
          );
        }

        console.log("🎉 ¡Economía en cascada completamente configurada!");
        console.log(`📋 TokenId de la playlist: ${playlistTokenId}`);
        console.log(
          `🏦 ${originalCollections.length} colecciones originales heredadas`
        );
        console.log("⚖️ 70% → Artistas originales | 30% → Curator");
      } else {
        console.warn("⚠️ No se pudo obtener la dirección de la colección");
      }

      // 💾 9. GUARDAR EN BASE DE DATOS CON INFORMACIÓN DE CASCADING
      console.log("💾 Guardando playlist en base de datos...");
      console.log("🔍 DATOS A GUARDAR:");
      console.log("   - address_collection_playlist:", collectionAddress);
      console.log("   - revenueShareAddress:", revenueShareAddress);
      console.log("   - original_collections:", originalCollections);
      console.log("   - playlistTokenId:", playlistTokenId);

      toast.loading(tPlaylist("savingPlaylist"), {
        id: MAIN_TOAST_ID,
      });

      const result = await createPlaylist({
        name: playlistName,
        description: playlistDescription,
        userId: userData._id,
        nfts: nftIds,
        isPublic,
        tags: selectedTags,
        // 🪙 NUEVAS PROPIEDADES DE TOKENIZACIÓN Y CASCADING
        address_collection_playlist: collectionAddress || undefined, // ✅ Dirección de colección de playlist
        revenueShareAddress: revenueShareAddress || undefined, // ✅ Para sistema de TIP
        coin_address: coinAddress, // ✅ Dirección del coin creado con Zora SDK
        coinSymbol: collectionAddress ? playlistSymbol : undefined,
        isTokenized: !!collectionAddress,
        playlistTokenId: collectionAddress ? playlistTokenId : undefined, // ✅ Para sistema de TIP
        // 🏦 INFORMACIÓN ADICIONAL DE ECONOMÍA EN CASCADA
        original_collections: originalCollections,
        cascade_percentage: 70, // 70% a artistas originales
        curator_percentage: 30, // 30% al curator
        total_original_songs: originalCollections.length,
      });

      if (result.success) {
        // Cerrar el toast de loading y mostrar éxito
        toast.dismiss(MAIN_TOAST_ID);

        if (collectionAddress) {
          console.log(
            "✅ Playlist tokenizada exitosamente:",
            collectionAddress
          );
          toast.success(tPlaylist("playlistTokenizedSuccess"), {
            description: `$${playlistSymbol} ${tPlaylist(
              "tokenCreatedSuccessfully"
            )}`,
            duration: 4000,
          });
          console.log("🎉 Economía en cascada implementada exitosamente:");
          console.log(
            "✅ Herencia configurada:",
            originalCollections.length,
            "colecciones originales"
          );
          console.log(
            "✅ Cascada configurada: 70% → Artistas originales automáticamente"
          );
          console.log("✅ Splits configurados: 30% → Curator de la playlist");
          console.log("✅ RevenueShare address:", revenueShareAddress);
          console.log("✅ Collection address:", collectionAddress);
          console.log("🚀 ¡PLAYLIST TOKENIZADA CON DISTRIBUCIÓN AUTOMÁTICA!");
        } else {
          console.warn("⚠️ Tokenización falló, continuando con web2...");
          toast.success(
            `${tPlaylist("playlistCreatedSuccess")} "${playlistName}"`,
            {
              description: tPlaylist("web2PlaylistDescription"),
              duration: 4000,
            }
          );
        }

        // Limpiar formulario
        setPlaylistName("");
        setPlaylistDescription("");
        setIsPublic(false);
        setSelectedTags([]);
        setShowCreateForm(false);
      } else {
        // Cerrar loading y mostrar error
        toast.dismiss(MAIN_TOAST_ID);
        toast.error(tPlaylist("playlistCreationError"), {
          description: tPlaylist("tryAgainLater"),
          duration: 4000,
        });
      }
    } catch (error) {
      // Cerrar cualquier toast de loading y mostrar error
      toast.dismiss(MAIN_TOAST_ID);
      toast.error(tPlaylist("cascadeEconomyError"), {
        description:
          error instanceof Error ? error.message : tCommon("unexpectedError"),
        duration: 4000,
      });
      console.error("Error creating playlist:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-0 right-0 w-80 h-full bg-zinc-900 shadow-2xl z-[300] flex flex-col"
        >
          <div className="flex justify-between items-center p-4 border-b border-zinc-700">
            <h4 className="text-lg font-semibold text-white">
              {tPlaylist("inQueue")}
            </h4>
            <div className="flex items-center gap-2">
              {songs.length > 0 && (
                <Button
                  onClick={handleCreatePlaylist}
                  size="sm"
                  className={`h-7 px-2 transition-all duration-200 ${
                    showCreateForm
                      ? "bg-zinc-600 hover:bg-zinc-500 text-white border border-zinc-500/30"
                      : "bg-zinc-700 hover:bg-zinc-600 text-white border border-zinc-600/50"
                  }`}
                  title={
                    showCreateForm
                      ? tPlaylist("closeForm")
                      : tPlaylist("createFromQueue")
                  }
                >
                  <Plus
                    className={`h-3 w-3 transition-transform duration-200 ${
                      showCreateForm ? "rotate-45" : ""
                    }`}
                  />
                </Button>
              )}
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full p-1"
              >
                <X className="h-5 w-5" />
                <span className="sr-only">{tCommon("close")}</span>
              </button>
            </div>
          </div>

          {/* Contenedor con scroll general */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* Formulario de creación inline */}
            {showCreateForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-zinc-800/50 mx-4 mt-4 rounded-lg p-4 border border-zinc-600/30 backdrop-blur-sm"
              >
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-200 mb-2 block">
                      {tPlaylist("playlistName")}
                    </label>
                    <Input
                      value={playlistName}
                      onChange={(e) => setPlaylistName(e.target.value)}
                      className="bg-zinc-700/50 border-zinc-500/30 text-white focus:border-zinc-400/50 focus:ring-zinc-400/20 transition-all duration-200"
                      placeholder={tPlaylist("enterPlaylistName")}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-200 mb-2 block">
                      {tPlaylist("descriptionOptional")}
                    </label>
                    <Textarea
                      value={playlistDescription}
                      onChange={(e) => setPlaylistDescription(e.target.value)}
                      className="bg-zinc-700/50 border-zinc-500/30 text-white focus:border-zinc-400/50 focus:ring-zinc-400/20 transition-all duration-200 resize-none"
                      placeholder={tPlaylist("enterDescription")}
                      rows={3}
                    />
                  </div>

                  {/* Tags Selection */}
                  <div>
                    <label className="text-sm font-medium text-zinc-200 mb-3 block">
                      {tPlaylist("categoriesOptional")}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {MUSIC_CATEGORIES.map((category) => {
                        const isSelected = selectedTags.includes(category.id);
                        return (
                          <button
                            key={category.id}
                            onClick={() => toggleTag(category.id)}
                            className={`
                              flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
                              transition-all duration-200 border
                              ${
                                isSelected
                                  ? `${category.color} text-white border-white/20 shadow-sm scale-105`
                                  : "bg-zinc-700/50 text-zinc-300 border-zinc-600/50 hover:bg-zinc-600/50 hover:border-zinc-500/50"
                              }
                            `}
                            type="button"
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                            {category.name}
                          </button>
                        );
                      })}
                    </div>
                    {selectedTags.length > 0 && (
                      <p className="text-xs text-zinc-400 mt-2">
                        {selectedTags.length}{" "}
                        {selectedTags.length === 1
                          ? tPlaylist("category")
                          : tPlaylist("categories")}{" "}
                        {tPlaylist("selected")}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-zinc-200 font-medium">
                      {tPlaylist("makePublic")}
                    </span>
                    <Switch
                      checked={isPublic}
                      onCheckedChange={setIsPublic}
                      className="data-[state=checked]:bg-zinc-600"
                    />
                  </div>
                  <div className="pt-2">
                    <Button
                      onClick={handleSubmitPlaylist}
                      disabled={
                        !playlistName.trim() ||
                        isCreating ||
                        isTokenizing ||
                        isCreatingRevenueShare
                      }
                      className="w-full h-10 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-lg transition-all duration-200 border border-zinc-600/50 hover:border-zinc-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreating || isTokenizing || isCreatingRevenueShare ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          {isCreatingRevenueShare
                            ? "Creando Revenue Share..."
                            : isTokenizing
                            ? tPlaylist("tokenizing")
                            : tPlaylist("creating")}
                        </div>
                      ) : (
                        tPlaylist("createPlaylist")
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="p-4">
              {/* <div className="relative mb-4">
                <input
                  ref={searchRef}
                  type="text"
                  placeholder={tPlaylist("searchTracks")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-700 bg-opacity-50 text-white placeholder-zinc-400 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
              </div> */}
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="playlist">
                  {(provided) => (
                    <ul
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-2"
                    >
                      {filteredSongs.length === 0 ? (
                        <li className="text-center text-zinc-400 py-4">
                          {tPlaylist("yourQueueEmpty")}
                        </li>
                      ) : (
                        filteredSongs.map((song, index) => (
                          <PlaylistItem
                            key={song.id || song._id}
                            song={song}
                            index={index}
                            isPlaying={
                              currentSong
                                ? compareIds(currentSong, song)
                                : false
                            }
                            onSelect={onSongSelect}
                            onRemove={onRemove}
                          />
                        ))
                      )}
                      {provided.placeholder}
                    </ul>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          </div>
          <style jsx global>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 8px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: rgba(255, 255, 255, 0.1);
              border-radius: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: rgba(255, 255, 255, 0.2);
              border-radius: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: rgba(255, 255, 255, 0.3);
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
