"use client";

import { useCallback, useEffect, useState } from "react";
import { useUserQuality } from "@Src/lib/hooks/useUserQuality";
import { useTranslations, useLocale } from "next-intl";
import { Users } from "lucide-react";
import Link from "next/link";
import { useFarcasterMiniApp } from "@Src/components/FarcasterProvider";
import { toast } from "sonner";
import { Button } from "@/ui/components/ui/button";

interface UserData {
  address: string;
  score: number;
  tier: string;
  nicknameVerified?: string;
  nickname?: string;
  displayName?: string;
  fid?: number;
  pfp?: string;
  verified?: boolean;
  powerBadge?: boolean;
  followerCount?: number;
  neynarScore?: number;
}

interface ArtistsLeaderboardProps {
  farcasterData: any;
}

export default function ArtistsLeaderboard({
  farcasterData,
}: ArtistsLeaderboardProps) {
  const { getBatchUserQualityScores, contractReady } = useUserQuality();
  const { tipContext } = useFarcasterMiniApp();
  const t = useTranslations("farcaster");
  const tLeaderboard = useTranslations("farcaster.leaderboard");
  const locale = useLocale();

  const [leaderboard, setLeaderboard] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supportingArtists, setSupportingArtists] = useState<Set<string>>(
    new Set()
  );
  const [loaded, setLoaded] = useState(false);

  // Función para apoyar a un artista usando Farcaster Mini App SDK
  const handleSupportArtist = useCallback(
    async (artistAddress: string, artistFid?: number) => {
      if (!tipContext?.sendToken) {
        console.error("No Farcaster sendToken action available");
        toast.error("Mini App no disponible");
        return;
      }

      setSupportingArtists((prev) => new Set(prev).add(artistAddress));

      try {
        const sendTokenParams: {
          token?: string;
          amount?: string;
          recipientAddress?: string;
          recipientFid?: number;
        } = {
          token: "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
          amount: "1000000", // 1 USDC
          recipientAddress: artistAddress,
        };

        if (artistFid) {
          sendTokenParams.recipientFid = artistFid;
        }

        const result = await tipContext.sendToken(sendTokenParams);

        if (result.success) {
          toast.success(tLeaderboard("tipsSentSuccessfully"));
        } else {
          switch (result.reason) {
            case "rejected_by_user":
              toast.error(tLeaderboard("tipsCancelledByUser"));
              break;
            case "send_failed":
              toast.error(tLeaderboard("errorSendingTips"));
              break;
            default:
              toast.error(tLeaderboard("unknownErrorSendingTips"));
          }
        }
      } catch (error) {
        console.error("SendToken failed:", error);
        toast.error(tLeaderboard("errorConnectingFarcaster"));
      } finally {
        setSupportingArtists((prev) => {
          const newSet = new Set(prev);
          newSet.delete(artistAddress);
          return newSet;
        });
      }
    },
    [tipContext, tLeaderboard]
  );

  // Función para procesar datos de Farcaster con quality scores
  const processFarcasterData = useCallback(async () => {
    if (loaded || isLoading || !farcasterData) return;

    setIsLoading(true);
    setError(null);

    try {
      if (!farcasterData.users || !farcasterData.addresses) {
        throw new Error("Invalid farcaster data");
      }

      // Obtener scores de calidad del contrato
      const [scores] = await Promise.all([
        getBatchUserQualityScores(farcasterData.addresses),
      ]);

      const leaderboardData = Array.from(scores.entries())
        .map(([address, result]) => {
          const user = farcasterData.users.find(
            (u: any) => u.address === address
          );

          // Usar nickname de la BD si existe, sino fallback a Farcaster

          // console.log("farcasterData ANTES DE USER: ", farcasterData.users);
          // console.log("user: ", user);
          return {
            address,
            score: result.score,
            tier: result.tier,
            nickname: user?.nickname,
            nicknameVerified: user?.nicknameVerified,
            displayName: user?.displayName,
            fid: user?.fid,
            pfp: user?.pfp,
            verified: user?.verified || true,
            powerBadge: user?.powerBadge || false,
            followerCount: user?.followerCount || 0,
            neynarScore: user?.neynarScore || 0,
          };
        })
        .sort((a, b) => b.neynarScore - a.neynarScore);

      setLeaderboard(leaderboardData);
      setLoaded(true);
    } catch (error) {
      console.error("Error processing Farcaster data:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [getBatchUserQualityScores, loaded, isLoading, farcasterData]);

  // Procesar datos cuando el contrato esté listo
  useEffect(() => {
    if (contractReady && !loaded && farcasterData) {
      processFarcasterData();
    }
  }, [contractReady, loaded, farcasterData, processFarcasterData]);

  // Función para obtener colores del tier
  const getTierConfig = (tier: string) => {
    const tierConfigs = {
      LEGENDARY: {
        bg: "from-yellow-500/20 via-amber-500/20 to-orange-500/20",
        border: "border-yellow-500/40",
        text: "text-yellow-400",
        glow: "shadow-yellow-500/25",
        badge: "bg-gradient-to-r from-yellow-500 to-amber-500",
        icon: "👑",
        animation: "animate-pulse",
      },
      EPIC: {
        bg: "from-purple-500/20 via-violet-500/20 to-indigo-500/20",
        border: "border-purple-500/40",
        text: "text-purple-400",
        glow: "shadow-purple-500/25",
        badge: "bg-gradient-to-r from-purple-500 to-violet-500",
        icon: "💎",
        animation: "",
      },
      RARE: {
        bg: "from-blue-500/20 via-cyan-500/20 to-teal-500/20",
        border: "border-blue-500/40",
        text: "text-blue-400",
        glow: "shadow-blue-500/25",
        badge: "bg-gradient-to-r from-blue-500 to-cyan-500",
        icon: "⭐",
        animation: "",
      },
      COMMON: {
        bg: "from-zinc-500/20 via-gray-500/20 to-slate-500/20",
        border: "border-zinc-500/40",
        text: "text-zinc-400",
        glow: "shadow-zinc-500/25",
        badge: "bg-gradient-to-r from-zinc-500 to-gray-500",
        icon: "🔸",
        animation: "",
      },
    };
    return tierConfigs[tier as keyof typeof tierConfigs] || tierConfigs.COMMON;
  };

  // Función para obtener estilo del ranking position
  const getRankingStyle = (position: number) => {
    if (position === 1)
      return {
        bg: "bg-gradient-to-r from-yellow-600/30 to-amber-600/30",
        text: "text-yellow-300",
        icon: "1",
        glow: "shadow-lg shadow-yellow-500/30",
      };
    if (position === 2)
      return {
        bg: "bg-gradient-to-r from-gray-400/30 to-zinc-400/30",
        text: "text-gray-300",
        icon: "2",
        glow: "shadow-lg shadow-gray-400/30",
      };
    if (position === 3)
      return {
        bg: "bg-gradient-to-r from-amber-700/30 to-orange-700/30",
        text: "text-amber-300",
        icon: "3",
        glow: "shadow-lg shadow-amber-600/30",
      };
    return {
      bg: "",
      text: "text-zinc-400",
      icon: "",
      glow: "",
    };
  };

  // Skeleton component
  const LeaderboardSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="relative bg-zinc-900/60 backdrop-blur-sm border border-zinc-800/60 rounded-xl p-4 animate-pulse"
        >
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-zinc-700/50 rounded-full flex items-center justify-center">
              <div className="w-6 h-6 bg-zinc-600 rounded"></div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-24 h-4 bg-zinc-600 rounded"></div>
                <div className="w-4 h-4 bg-zinc-600 rounded"></div>
                <div className="w-4 h-4 bg-zinc-600 rounded"></div>
              </div>
              <div className="w-32 h-3 bg-zinc-700 rounded mb-1"></div>
              <div className="w-40 h-2 bg-zinc-700 rounded"></div>
            </div>
            <div className="flex-shrink-0 text-right">
              <div className="w-16 h-6 bg-zinc-600 rounded mb-1"></div>
              <div className="w-12 h-4 bg-zinc-700 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (isLoading) {
    return <LeaderboardSkeleton />;
  }

  if (error) {
    return (
      <div className="relative bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-8 text-center backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent rounded-xl"></div>
        <div className="relative">
          <span className="text-blue-400 text-6xl mb-4 block animate-pulse">
            🎭
          </span>
          <h3 className="text-blue-400 font-bold text-xl mb-3">
            {tLeaderboard("beFirstInLeaderboard")}
          </h3>
          <p className="text-zinc-300 mb-4">
            {tLeaderboard("noFarcasterUsersRegistered")}
            <br />
            {tLeaderboard("connectFarcasterToAppear")}
          </p>
          <button
            onClick={processFarcasterData}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300"
          >
            🔄 {tLeaderboard("reload")}
          </button>
        </div>
      </div>
    );
  }

  if (leaderboard.length === 0 && contractReady) {
    return (
      <div className="relative bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10 border border-purple-500/30 rounded-xl p-12 text-center backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent rounded-xl"></div>
        <div className="relative">
          <span className="text-6xl mb-6 block animate-pulse">🚀</span>
          <h3 className="text-white font-bold text-2xl mb-3">
            {tLeaderboard("preparingRanking")}
          </h3>
          <p className="text-zinc-300 mb-6">
            {tLeaderboard("calculatingQualityScores")}
          </p>
          <div className="flex justify-center">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {leaderboard.map((user, index) => {
        const position = index + 1;
        const tierConfig = getTierConfig(user.tier);
        const rankingStyle = getRankingStyle(position);
        return (
          <div
            key={user.address}
            className={`relative group transition-all duration-300 hover:scale-[1.02] rounded-xl ${
              position <= 3 ? rankingStyle.glow : ""
            }`}
          >
            <div
              className={`
                relative bg-gradient-to-r ${tierConfig.bg} 
                backdrop-blur-sm border ${tierConfig.border} 
                rounded-xl p-4 overflow-hidden
                ${tierConfig.animation}
                hover:border-opacity-60 transition-all duration-300
              `}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative flex items-center gap-3 md:gap-4">
                <div
                  className={`
                    flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full border-2 
                    flex items-center justify-center font-bold text-xs md:text-sm
                    ${
                      position <= 3
                        ? rankingStyle.bg + " " + rankingStyle.text
                        : "bg-zinc-800/60 border-zinc-700 text-zinc-400"
                    }
                  `}
                >
                  {position <= 3 ? (
                    <span className="p-0 text-lg md:text-xl">
                      {rankingStyle.icon}
                    </span>
                  ) : (
                    `#${position}`
                  )}
                </div>

                <Link href={`/${locale}/u/${user.nickname}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 md:gap-2 mb-1">
                      <div className="flex items-center gap-1">
                        <img
                          src={user.pfp}
                          alt={user.nickname}
                          className="w-6 h-6 rounded-full"
                        />
                      </div>
                      <h3 className="text-white font-semibold text-sm md:text-base truncate">
                        {user.displayName}
                      </h3>

                      {user.powerBadge && (
                        <span
                          className="inline-flex items-center px-1 md:px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                          title={t("powerBadge")}
                        >
                          ⚡
                        </span>
                      )}
                    </div>

                    {user.displayName && user.displayName !== user.nickname && (
                      <p className="text-zinc-300 text-xs md:text-sm mb-1 truncate">
                        {user.displayName}
                      </p>
                    )}
                  </div>
                </Link>

                <div className="flex-shrink-0 text-right ml-auto pr-1">
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-1 justify-end">
                        <Users className="w-4 h-4 text-zinc-400" />
                        <span className="text-zinc-400 text-sm">
                          {user.followerCount?.toLocaleString() || 0}
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={() =>
                        handleSupportArtist(user.address, user.fid)
                      }
                      disabled={
                        supportingArtists.has(user.address) ||
                        !tipContext?.sendToken
                      }
                      size="sm"
                      variant="outline"
                      className="text-xs border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 hover:border-purple-400/50 transition-all duration-300 disabled:opacity-50"
                    >
                      {supportingArtists.has(user.address) ? (
                        <>⏳ {tLeaderboard("sending")}</>
                      ) : (
                        <>💎 {tLeaderboard("tips")}</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
