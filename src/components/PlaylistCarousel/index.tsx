"use client";

import { cn } from "@Src/ui/lib/utils";
import {
  Music,
  ChevronLeft,
  ChevronRight,
  Globe,
  Lock,
  Play,
  Music2Icon,
  Trash2,
} from "lucide-react";
import { useRef, useContext } from "react";
import { usePlaylists, PlaylistData } from "@Src/lib/hooks/usePlaylists";
import { usePlayer } from "@Src/contexts/PlayerContext";
import { UserRegistrationContext } from "@Src/app/providers";
import { toast } from "sonner";

interface PlaylistCarouselProps {
  userId: string;
  isOwnProfile: boolean;
}

export default function PlaylistCarousel({
  userId,
  isOwnProfile,
}: PlaylistCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { playlists, loading, removePlaylist } = usePlaylists(userId);
  const { userData } = useContext(UserRegistrationContext);

  const {
    setNftData,
    setCurrentSong,
    setActivePlayerId,
    setIsPlaying,
    setShowFloatingPlayer,
  } = usePlayer();

  // Filter playlists based on profile ownership
  const displayPlaylists = isOwnProfile
    ? playlists
    : playlists.filter((playlist) => playlist.isPublic);

  // Scroll helpers
  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = 220;
    el.scrollBy({
      left: dir === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  // Load playlist in the player
  const handlePlayPlaylist = (playlist: PlaylistData) => {
    if (playlist.nfts.length === 0) return;

    console.log("playlist: ", playlist);
    // Convert NFTs to Track format
    const tracks = playlist.nfts.map((nft) => ({
      _id: nft._id,
      name: nft.name,
      artist_name: (nft as any).artist?.nickname || "Unknown Artist",
      artist: nft.artist_address_mint,
      image: nft.image,
      music: nft.music,
      slug: nft._id,
      price: nft.price,
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
  };

  // Delete playlist
  const handleDeletePlaylist = async (
    playlist: PlaylistData,
    event: React.MouseEvent
  ) => {
    event.stopPropagation(); // Prevent handlePlayPlaylist from executing

    if (!userData?._id) {
      toast.error("You must be logged in to delete playlists");
      return;
    }

    try {
      const result = await removePlaylist(playlist._id, userData._id);
      if (result.success) {
        toast.success(`Playlist "${playlist.name}" deleted successfully`);
      } else {
        toast.error("Error deleting playlist");
      }
    } catch (error) {
      toast.error("Error deleting playlist");
      console.error("Error deleting playlist:", error);
    }
  };

  // Get random colors for cards
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

  if (loading) {
    return (
      <div className="w-full max-w-8xl py-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl uppercase font-semibold text-zinc-100/90">
            Playlists
          </h3>
        </div>
        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 mb-8 sm:mb-14">
          {Array(4)
            .fill(0)
            .map((_, index) => (
              <div key={index} className="w-40 sm:w-64 flex-shrink-0">
                <div className="h-24 sm:h-28 bg-zinc-800 animate-pulse rounded-lg"></div>
              </div>
            ))}
        </div>
      </div>
    );
  }

  if (displayPlaylists.length === 0) {
    return (
      <div className="w-full max-w-8xl py-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl uppercase font-semibold text-zinc-100/90">
            My Playlists
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center p-8 bg-zinc-900/50 rounded-lg">
          <Music className="w-12 h-12 text-zinc-600 mb-3" />
          <p className="text-zinc-400 text-center">
            {isOwnProfile
              ? "You haven't created any playlists yet"
              : "This user has no public playlists"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-8xl py-4">
      {/* Title and arrows aligned */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl uppercase font-semibold text-zinc-100/90">
          My Playlists
        </h3>
        {displayPlaylists.length > 3 && (
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
        )}
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
          {displayPlaylists.map((playlist, index) => (
            <div
              key={playlist._id}
              className="w-40 sm:w-64 flex-shrink-0 first:ml-0"
            >
              <div
                className={cn(
                  "group relative overflow-hidden rounded-lg cursor-pointer",
                  "h-24 sm:h-28",
                  "transition-all duration-300 ease-out",
                  "hover:-translate-y-1 hover:shadow-xl"
                )}
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
                <div className="relative h-full p-4 pb-2 flex flex-col justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm sm:text-base font-bold text-white group-hover:scale-105 transition-transform duration-300 line-clamp-2">
                      {playlist.name}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white/80">
                      <Music2Icon className="h-3 w-3" />
                      <span className="text-xs font-medium">
                        {playlist.nfts.length}{" "}
                        {playlist.nfts.length === 1 ? "track" : "tracks"}
                      </span>
                      {playlist.isPublic ? (
                        <Globe className="h-3 w-3 text-green-400" />
                      ) : (
                        <Lock className="h-3 w-3 text-zinc-400" />
                      )}
                      {/* Delete button - only visible for owner and if logged in */}
                      {isOwnProfile && userData?._id && (
                        <button
                          onClick={(e) => handleDeletePlaylist(playlist, e)}
                          className="hover:bg-red-600/20 rounded-full p-1 ml-1 transition-colors duration-300"
                          title="Delete playlist"
                        >
                          <Trash2 className="h-3 w-3 text-red-400 hover:text-red-300" />
                        </button>
                      )}
                    </div>

                    {playlist.nfts.length > 0 && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Play className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Image of first song if exists */}
                {playlist.nfts.length > 0 && playlist.nfts[0].image && (
                  <div className="absolute -bottom-4 -right-1 w-16 h-16 rounded-lg overflow-hidden border-2 border-white/20 shadow-2xl transform rotate-12 group-hover:rotate-6 transition-all duration-300 group-hover:scale-110">
                    <img
                      src={playlist.nfts[0].image}
                      alt={`${playlist.name} cover`}
                      className="w-full h-full object-cover"
                    />
                    {/* Integration gradient */}
                    <div className="absolute inset-0 bg-gradient-to-tl from-transparent via-transparent to-black/30" />
                  </div>
                )}

                {/* Image shadow in background */}
                <div className="absolute bottom-0 right-0 w-20 h-20 bg-black/30 rounded-full blur-xl transform translate-x-2 translate-y-2 group-hover:scale-110 transition-transform duration-300" />

                {/* Shine effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 translate-x-full group-hover:translate-x-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
