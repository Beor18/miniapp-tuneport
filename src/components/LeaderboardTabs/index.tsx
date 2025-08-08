"use client";

import { useState } from "react";
import { Crown, Music } from "lucide-react";
import { useTranslations } from "next-intl";
import ArtistsLeaderboard from "./ArtistsLeaderboard";
import PlaylistsLeaderboard from "./PlaylistsLeaderboard";

interface LeaderboardTabsProps {
  farcasterData: any;
  playlistsData: any;
}

export default function LeaderboardTabs({
  farcasterData,
  playlistsData,
}: LeaderboardTabsProps) {
  const [activeTab, setActiveTab] = useState<"artists" | "playlists">(
    "artists"
  );
  const tLeaderboard = useTranslations("farcaster.leaderboard");

  return (
    <>
      {/* Navegación de tabs */}
      <div className="mb-6">
        <div className="flex justify-center">
          <div className="flex bg-zinc-900/60 backdrop-blur-sm border border-zinc-800/60 rounded-xl p-1">
            <button
              onClick={() => setActiveTab("artists")}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300
                ${
                  activeTab === "artists"
                    ? "bg-gradient-to-r from-purple-500/80 to-blue-500/80 text-white shadow-lg"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                }
              `}
            >
              <Crown className="w-4 h-4" />
              {tLeaderboard("artists")}
            </button>
            <button
              onClick={() => setActiveTab("playlists")}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300
                ${
                  activeTab === "playlists"
                    ? "bg-gradient-to-r from-purple-500/80 to-blue-500/80 text-white shadow-lg"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                }
              `}
            >
              <Music className="w-4 h-4" />
              {tLeaderboard("playlists")}
            </button>
          </div>
        </div>
      </div>

      {/* Contenido según tab activo */}
      {activeTab === "artists" ? (
        <ArtistsLeaderboard farcasterData={farcasterData} />
      ) : (
        <PlaylistsLeaderboard playlistsData={playlistsData} />
      )}
    </>
  );
}
