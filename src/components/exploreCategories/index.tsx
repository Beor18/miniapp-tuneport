"use client";
import { cn } from "@Src/ui/lib/utils";
import {
  Music2Icon,
  ChevronLeft,
  ChevronRight,
  X,
  Play,
  Globe,
  Lock,
} from "lucide-react";
import { useRef, useState } from "react";
import { searchPlaylists } from "@Src/lib/actions/playlists";
import { usePlayer } from "@Src/contexts/PlayerContext";
import { motion, AnimatePresence } from "framer-motion";

interface Category {
  id: string;
  name: string;
  color: string;
  image: string;
  tag: string; // Tag for filtering playlists
}

interface PlaylistData {
  _id: string;
  name: string;
  description?: string;
  userId: {
    _id: string;
    name: string;
    nickname: string;
    picture?: string;
    verified?: boolean;
  };
  nfts: Array<{
    _id: string;
    name: string;
    image: string;
    music: string;
    artist_address_mint: string;
    price?: number;
    description?: string;
    attributes?: any[];
    collectionId: {
      network: string;
      name: string;
      address_collection: string;
      candy_machine: string;
      mint_price: number;
      mint_currency: string;
      description: string;
    };
  }>;
  isPublic: boolean;
  coverImage?: string;
  totalDuration: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface AudioCategoriesProps {
  categories?: Category[];
}

export default function ExploreCategories({
  categories,
}: AudioCategoriesProps) {
  const defaultCategories: Category[] = [
    {
      id: "1",
      name: "Rock",
      color: "from-slate-600/90 via-zinc-700/90 to-stone-800/90",
      image:
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=80&h=80&fit=crop&crop=face",
      tag: "rock",
    },
    {
      id: "2",
      name: "Pop",
      color: "from-purple-600/80 via-violet-700/80 to-indigo-800/80",
      image:
        "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=80&h=80&fit=crop&crop=face",
      tag: "pop",
    },
    {
      id: "3",
      name: "Cumbia",
      color: "from-teal-600/85 via-emerald-700/85 to-green-800/85",
      image:
        "https://images.unsplash.com/photo-1571974599782-87624638275e?w=80&h=80&fit=crop&crop=face",
      tag: "cumbia",
    },
    {
      id: "4",
      name: "Chamamé",
      color: "from-blue-600/80 via-slate-700/80 to-gray-800/80",
      image:
        "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=80&h=80&fit=crop&crop=face",
      tag: "chamame",
    },
    {
      id: "5",
      name: "Jazz",
      color: "from-amber-700/85 via-orange-800/85 to-red-900/85",
      image:
        "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=80&h=80&fit=crop&crop=face",
      tag: "jazz",
    },
    {
      id: "6",
      name: "Hip Hop",
      color: "from-gray-700/90 via-zinc-800/90 to-black/90",
      image:
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=80&h=80&fit=crop&crop=face",
      tag: "hiphop",
    },
    {
      id: "7",
      name: "Reggaeton",
      color: "from-green-700/80 via-emerald-800/80 to-teal-900/80",
      image:
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=80&h=80&fit=crop&crop=face",
      tag: "reggaeton",
    },
    {
      id: "8",
      name: "Salsa",
      color: "from-red-700/85 via-rose-800/85 to-pink-900/85",
      image:
        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=80&h=80&fit=crop&crop=face",
      tag: "salsa",
    },
    {
      id: "9",
      name: "Tango",
      color: "from-rose-800/90 via-red-900/90 to-black/90",
      image:
        "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=80&h=80&fit=crop&crop=face",
      tag: "tango",
    },
    {
      id: "10",
      name: "Tropical",
      color: "from-cyan-700/80 via-blue-800/80 to-indigo-900/80",
      image:
        "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=80&h=80&fit=crop&crop=face",
      tag: "tropical",
    },
  ];

  const displayCategories = categories || defaultCategories;
  const scrollRef = useRef<HTMLDivElement>(null);

  // Playlist modal states
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [playlists, setPlaylists] = useState<PlaylistData[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [playlistsError, setPlaylistsError] = useState<string | null>(null);

  const {
    setNftData,
    setCurrentSong,
    setActivePlayerId,
    setIsPlaying,
    setShowFloatingPlayer,
  } = usePlayer();

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

  // Handle category click - fetch playlists by tag
  const handleCategoryClick = async (category: Category) => {
    setSelectedCategory(category);
    setLoadingPlaylists(true);
    setPlaylistsError(null);

    try {
      const result = await searchPlaylists("", {
        page: 1,
        limit: 20,
        tag: category.tag,
        sortBy: "updatedAt",
        sortOrder: "desc",
      });

      console.log("result: ", result);
      if (result.success) {
        // Filter only public playlists with at least 1 NFT
        const publicPlaylists = result.data.filter(
          (playlist: PlaylistData) =>
            playlist.isPublic && playlist.nfts.length > 0
        );
        setPlaylists(publicPlaylists);
      } else {
        setPlaylistsError("Error loading playlists");
      }
    } catch (err) {
      setPlaylistsError("Error loading playlists");
      console.error("Error fetching playlists:", err);
    } finally {
      setLoadingPlaylists(false);
    }
  };

  // Handle playlist play
  const handlePlayPlaylist = (playlist: PlaylistData) => {
    if (playlist.nfts.length === 0) return;

    console.log("playlist: ", playlist);
    // Convert NFTs to Track format
    const tracks = playlist.nfts.map((nft) => ({
      _id: nft._id,
      name: nft.name,
      artist_name: playlist.userId.nickname || "Unknown Artist",
      artist: nft.artist_address_mint,
      image: nft.image,
      music: nft.music,
      slug: nft._id,
      price: nft.price,
      network: nft.collectionId.network,
    }));

    // Load in context
    setNftData(tracks);

    // Play the first song
    if (tracks.length > 0) {
      setCurrentSong(tracks[0]);
      setActivePlayerId(tracks[0]._id);
      setIsPlaying(true);
      setShowFloatingPlayer(true);
    }

    // Close modal
    setSelectedCategory(null);
  };

  // Get random colors for playlist cards
  const getPlaylistColor = (index: number) => {
    const colors = [
      "from-purple-600/80 via-violet-700/80 to-indigo-800/80",
      "from-teal-600/85 via-emerald-700/85 to-green-800/85",
      "from-blue-600/80 via-slate-700/80 to-gray-800/80",
      "from-amber-700/85 via-orange-800/85 to-red-900/85",
      "from-green-700/80 via-emerald-800/80 to-teal-900/80",
      "from-red-700/85 via-rose-800/85 to-pink-900/85",
      "from-slate-600/90 via-zinc-700/90 to-stone-800/90",
      "from-cyan-700/80 via-blue-800/80 to-indigo-900/80",
    ];
    return colors[index % colors.length];
  };

  return (
    <>
      <div className="w-full max-w-8xl py-4">
        {/* Título y flechas alineados */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl uppercase font-semibold text-zinc-100/90">
            Explore Playlists
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
            className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 mb-8 sm:mb-14 scroll-smooth no-scrollbar"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {displayCategories.map((category) => (
              <div
                key={category.id}
                className="w-40 sm:w-64 flex-shrink-0 first:ml-0"
              >
                <div
                  className={cn(
                    "group relative overflow-hidden rounded-lg cursor-pointer",
                    "h-24 sm:h-28",
                    "transition-all duration-300 ease-out",
                    "hover:-translate-y-1 hover:shadow-xl"
                  )}
                  onClick={() => handleCategoryClick(category)}
                >
                  {/* Fondo con gradiente */}
                  <div
                    className={cn(
                      "absolute inset-0 bg-gradient-to-br",
                      category.color,
                      "transition-transform duration-300",
                      "group-hover:scale-110"
                    )}
                  />

                  {/* Overlay con efecto hover */}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />

                  {/* Contenido */}
                  <div className="relative h-full p-4 pb-2 flex flex-col justify-between">
                    <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:scale-105 transition-transform duration-300">
                      {category.name}
                    </h3>
                    {/* <div className="flex items-center gap-2 text-white/80">
                      <Music2Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">Playlists</span>
                    </div> */}
                  </div>

                  {/* Imagen integrada en la parte inferior */}
                  <div className="absolute -bottom-4 -right-1 w-18 h-18 rounded-lg overflow-hidden border-2 border-white/20 shadow-2xl transform rotate-12 group-hover:rotate-6 transition-all duration-300 group-hover:scale-110">
                    <img
                      src={category.image}
                      alt={`${category.name} artist`}
                      className="w-full h-full object-cover"
                    />
                    {/* Gradiente de integración */}
                    <div className="absolute inset-0 bg-gradient-to-tl from-transparent via-transparent to-black/30" />
                  </div>

                  {/* Sombra de la imagen en el fondo para mejor integración */}
                  <div className="absolute bottom-0 right-0 w-20 h-20 bg-black/30 rounded-full blur-xl transform translate-x-2 translate-y-2 group-hover:scale-110 transition-transform duration-300" />

                  {/* Efecto de brillo en hover */}
                  <div
                    className={cn(
                      "absolute inset-0 opacity-0 group-hover:opacity-100",
                      "transition-opacity duration-300",
                      "bg-gradient-to-tr from-white/5 via-transparent to-transparent"
                    )}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Gradiente para indicar que se puede deslizar */}
          <div className="absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-neutral-800 to-transparent pointer-events-none opacity-60"></div>
        </div>
      </div>

      {/* Playlist Modal */}
      <AnimatePresence>
        {selectedCategory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedCategory(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 rounded-lg border border-zinc-800 w-full max-w-4xl max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-lg bg-gradient-to-br",
                      selectedCategory.color,
                      "flex items-center justify-center"
                    )}
                  >
                    <Music2Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {selectedCategory.name} Playlists
                    </h2>
                    <p className="text-zinc-400">
                      Discover playlists in{" "}
                      {selectedCategory.name.toLowerCase()} genre
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {loadingPlaylists ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array(6)
                      .fill(0)
                      .map((_, index) => (
                        <div
                          key={index}
                          className="bg-zinc-800 animate-pulse rounded-lg h-24"
                        ></div>
                      ))}
                  </div>
                ) : playlistsError ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Music2Icon className="w-12 h-12 text-zinc-600 mb-3" />
                    <p className="text-zinc-400 text-center">
                      {playlistsError}
                    </p>
                  </div>
                ) : playlists.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Music2Icon className="w-12 h-12 text-zinc-600 mb-3" />
                    <p className="text-zinc-400 text-center">
                      No public playlists found for {selectedCategory.name}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {playlists.map((playlist, index) => (
                      <div
                        key={playlist._id}
                        className="group relative overflow-hidden rounded-lg cursor-pointer h-24 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                        onClick={() => handlePlayPlaylist(playlist)}
                      >
                        {/* Background with gradient */}
                        <div
                          className={cn(
                            "absolute inset-0 bg-gradient-to-br",
                            getPlaylistColor(index),
                            "transition-transform duration-300",
                            "group-hover:scale-110"
                          )}
                        />

                        {/* Overlay with hover effect */}
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />

                        {/* Content */}
                        <div className="relative h-full p-4 flex flex-col justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-white group-hover:scale-105 transition-transform duration-300 line-clamp-1">
                              {playlist.name}
                            </h3>
                            <p className="text-xs text-white/70 mt-1 line-clamp-1">
                              by @{playlist.userId.nickname}
                            </p>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-white/80">
                              <Music2Icon className="h-3 w-3" />
                              <span className="text-xs font-medium">
                                {playlist.nfts.length} tracks
                              </span>
                              <Globe className="h-3 w-3 text-green-400" />
                            </div>

                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <Play className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        </div>

                        {/* Image of first song if exists */}
                        {playlist.nfts.length > 0 && playlist.nfts[0].image && (
                          <div className="absolute -bottom-2 -right-1 w-12 h-12 rounded-md overflow-hidden border border-white/20 shadow-lg transform rotate-12 group-hover:rotate-6 transition-all duration-300 group-hover:scale-110">
                            <img
                              src={playlist.nfts[0].image}
                              alt={`${playlist.name} cover`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
