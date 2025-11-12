"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Search, X, Music, User, ListMusic, Loader2 } from "lucide-react";
import { searchNFTs } from "@Src/lib/actions/nfts";
import { searchPlaylists } from "@Src/lib/actions/playlists";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { usePlayer } from "@Src/contexts/PlayerContext";

interface NFTResult {
  _id: string;
  name: string;
  description?: string;
  image: string;
  music: string;
  collectionId?: {
    _id: string;
    name: string;
    network: string;
    isPremiumAlbum: boolean;
    coin_address?: string;
    x402Config: {
      isLocked: boolean;
      price?: string;
      network?: "base" | "base-sepolia";
      description?: string;
      currency?: "USDC";
    };
    slug: string;
  };
  artist?: {
    name: string;
    nickname: string;
    picture?: string;
  };
}

interface PlaylistResult {
  _id: string;
  name: string;
  description?: string;
  userId: {
    nickname: string;
    picture?: string;
  };
  nfts: Array<{
    _id: string;
    name: string;
    image: string;
    music: string;
    artist_address_mint: string;
    collectionId?: {
      artist_name: string;
      network: string;
      name: string;
      isPremiumAlbum: boolean;
      x402Config: {
        isLocked: boolean;
        price?: string;
        network?: "base" | "base-sepolia";
        description?: string;
        currency?: "USDC";
      };
      slug: string;
    };
  }>;
  tags: string[];
}

interface ArtistResult {
  address: string;
  name: string;
  nickname: string;
  picture?: string;
  farcaster_pfp?: string;
  verified: boolean;
  farcaster_verified?: boolean;
  type: string;
}

interface SearchBarProps {
  artists?: ArtistResult[];
  onNavigate?: () => void; // Callback para cerrar modales padres cuando se navega
}

export default function SearchBar({
  artists = [],
  onNavigate,
}: SearchBarProps) {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const {
    setNftData,
    setCurrentSong,
    setActivePlayerId,
    setIsPlaying,
    setShowFloatingPlayer,
  } = usePlayer();

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [nftResults, setNftResults] = useState<NFTResult[]>([]);
  const [playlistResults, setPlaylistResults] = useState<PlaylistResult[]>([]);
  const [artistResults, setArtistResults] = useState<ArtistResult[]>([]);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Función de búsqueda
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (searchQuery.trim().length < 2) {
        setNftResults([]);
        setPlaylistResults([]);
        setArtistResults([]);
        return;
      }

      setIsSearching(true);

      try {
        // Búsquedas en paralelo
        const [nftResult, playlistResult] = await Promise.all([
          searchNFTs(searchQuery),
          searchPlaylists(searchQuery, { limit: 5 }),
        ]);

        // Procesar NFTs
        if (nftResult.success) {
          setNftResults(nftResult.data.slice(0, 5));
        }

        // Procesar Playlists
        if (playlistResult.success) {
          setPlaylistResults(playlistResult.data.slice(0, 5));
        }

        // Buscar artistas localmente
        const filteredArtists = artists.filter(
          (artist) =>
            artist.type === "artist" &&
            (artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              artist.nickname.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        setArtistResults(filteredArtists.slice(0, 5));
      } catch (error) {
        console.error("Error searching:", error);
      } finally {
        setIsSearching(false);
      }
    },
    [artists]
  );

  // Debounce search - FIX: Usar ref para evitar memory leaks
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedSearch = useCallback(
    (query: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => performSearch(query), 300);
    },
    [performSearch]
  );

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Manejar cambio en input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);
    debouncedSearch(value);
  };

  // Limpiar búsqueda
  const handleClear = () => {
    setQuery("");
    setNftResults([]);
    setPlaylistResults([]);
    setArtistResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Navegar a artista
  const handleArtistClick = (nickname: string) => {
    router.push(`/${locale}/u/${nickname}`);
    setIsOpen(false);
    setQuery("");
    onNavigate?.(); // Notificar al padre que estamos navegando
  };

  // 🎵 Manejar clic en canción: reproducir si es libre, navegar si es premium
  const handleSongClick = (nft: NFTResult) => {
    // Cerrar búsqueda
    setIsOpen(false);
    setQuery("");

    // ✅ Si el contenido NO es premium, reproducir directamente
    if (
      !nft.collectionId?.isPremiumAlbum &&
      !nft.collectionId?.x402Config?.isLocked
    ) {
      // Convertir NFT al formato Track esperado por el player
      const track = {
        _id: nft._id,
        name: nft.name,
        artist_name:
          nft.artist?.nickname || nft.collectionId?.name || "Unknown",
        artist: nft.artist?.name || "",
        coin_address: nft.collectionId?.coin_address || "",
        image: nft.image,
        music: nft.music,
        slug: nft.collectionId?.slug || nft._id,
        network: nft.collectionId?.network || "base",
      };

      // Cargar en contexto y reproducir
      setNftData([track]);
      setCurrentSong(track);
      setActivePlayerId(track._id);
      setIsPlaying(true);
      setShowFloatingPlayer(true);
      return;
    }

    // 🔒 Si es contenido premium, navegar al perfil del artista
    // donde están las verificaciones de acceso x402

    if (nft.artist?.nickname) {
      router.push(`/${locale}/u/${nft.artist.nickname}`);
      onNavigate?.(); // Notificar al padre que estamos navegando
    } else {
      console.warn("⚠️ No se puede navegar: canción sin artista");
    }
  };

  // 🎵 Manejar clic en playlist: reproducir si es libre, navegar si tiene premium
  const handlePlaylistClick = (playlist: PlaylistResult) => {
    // Cerrar búsqueda
    setIsOpen(false);
    setQuery("");

    if (playlist.nfts.length === 0) {
      console.warn("⚠️ Playlist vacía");
      return;
    }

    // ✅ Verificar si TODAS las canciones de la playlist son libres (no premium)
    const hasAnyPremiumSong = playlist.nfts.some(
      (nft) =>
        nft.collectionId?.isPremiumAlbum ||
        nft.collectionId?.x402Config?.isLocked
    );

    // Si TODAS las canciones son libres, reproducir directamente
    if (!hasAnyPremiumSong) {
      // Convertir NFTs de la playlist al formato Track
      const tracks = playlist.nfts.map((nft) => ({
        _id: nft._id,
        name: nft.name,
        artist_name: nft.collectionId?.artist_name || "Unknown Artist",
        artist: nft.artist_address_mint || "",
        image: nft.image,
        music: nft.music,
        slug: nft.collectionId?.slug || nft._id,
        network: nft.collectionId?.network || "base",
      }));

      // Cargar playlist en contexto
      setNftData(tracks);

      // Reproducir primera canción
      if (tracks.length > 0) {
        setCurrentSong(tracks[0]);
        setActivePlayerId(tracks[0]._id);
        setIsPlaying(true);
        setShowFloatingPlayer(true);
      }
      return;
    }

    // 🔒 Si la playlist contiene contenido premium, navegar al perfil del creador
    console.log(
      "🔒 Playlist con contenido premium - navegando al perfil del creador"
    );
    if (playlist.userId?.nickname) {
      router.push(`/${locale}/u/${playlist.userId.nickname}`);
      onNavigate?.(); // Notificar al padre que estamos navegando
    } else {
      console.warn("⚠️ No se puede navegar: playlist sin creador");
    }
  };

  // Total de resultados
  const totalResults =
    nftResults.length + playlistResults.length + artistResults.length;
  const hasResults = totalResults > 0;

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl mx-auto">
      {/* Input de búsqueda */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder={`${t("search")} ${t("searchPlaceholder")}`}
          className="w-full bg-zinc-900/90 border border-zinc-800 rounded-full pl-12 pr-12 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Resultados */}
      <AnimatePresence>
        {isOpen && query.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 w-full bg-zinc-900/95 backdrop-blur-lg border border-zinc-800 rounded-lg shadow-2xl overflow-hidden z-50 max-h-[70vh] overflow-y-auto"
          >
            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                <span className="ml-2 text-zinc-400">{t("loading")}</span>
              </div>
            ) : hasResults ? (
              <div className="py-2">
                {/* Artistas */}
                {artistResults.length > 0 && (
                  <div className="px-3 py-2">
                    <h3 className="text-xs font-semibold text-zinc-400 uppercase mb-2 flex items-center gap-2">
                      <User className="h-3 w-3" />
                      {t("artists")}
                    </h3>
                    {artistResults.map((artist) => (
                      <button
                        key={artist.address}
                        onClick={() => handleArtistClick(artist.nickname)}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-zinc-800/50 rounded-lg transition-colors text-left"
                      >
                        {(artist.picture || artist.farcaster_pfp) && (
                          <Image
                            src={artist.picture || artist.farcaster_pfp || ""}
                            alt={artist.name}
                            width={40}
                            height={40}
                            className="rounded-full object-cover"
                          />
                        )}
                        {!artist.picture && !artist.farcaster_pfp && (
                          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                            <User className="h-5 w-5 text-zinc-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {artist.name}
                          </p>
                          <p className="text-xs text-zinc-400 truncate">
                            @{artist.nickname}
                            {(artist.verified || artist.farcaster_verified) && (
                              <span className="ml-1 text-blue-400">✓</span>
                            )}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Canciones */}
                {nftResults.length > 0 && (
                  <div className="px-3 py-2">
                    <h3 className="text-xs font-semibold text-zinc-400 uppercase mb-2 flex items-center gap-2">
                      <Music className="h-3 w-3" />
                      {t("songs")}
                    </h3>
                    {nftResults.map((nft) => (
                      <button
                        key={nft._id}
                        onClick={() => handleSongClick(nft)}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-zinc-800/50 rounded-lg transition-colors text-left"
                      >
                        <Image
                          src={nft.image}
                          alt={nft.name}
                          width={40}
                          height={40}
                          className="rounded-md object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {nft.name}
                          </p>
                          <p className="text-xs text-zinc-400 truncate">
                            {nft.artist?.nickname ||
                              nft.collectionId?.name ||
                              t("unknownArtist")}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Playlists */}
                {playlistResults.length > 0 && (
                  <div className="px-3 py-2">
                    <h3 className="text-xs font-semibold text-zinc-400 uppercase mb-2 flex items-center gap-2">
                      <ListMusic className="h-3 w-3" />
                      {t("playlists")}
                    </h3>
                    {playlistResults.map((playlist) => (
                      <button
                        key={playlist._id}
                        onClick={() => handlePlaylistClick(playlist)}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-zinc-800/50 rounded-lg transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-md bg-gradient-to-br from-purple-600/80 to-indigo-800/80 flex items-center justify-center">
                          <ListMusic className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {playlist.name}
                          </p>
                          <p className="text-xs text-zinc-400 truncate">
                            {t("by")} @{playlist.userId.nickname} •{" "}
                            {playlist.nfts.length} {t("songs").toLowerCase()}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <Search className="h-8 w-8 text-zinc-600 mb-2" />
                <p className="text-sm text-zinc-400">
                  {t("noResultsFor")} &quot;{query}&quot;
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
