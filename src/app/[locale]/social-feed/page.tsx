"use client";

import { useCallback, useEffect, useState } from "react";
import { useUserQuality } from "@Src/lib/hooks/useUserQuality";
import { useTranslations } from "next-intl";
import { Users } from "lucide-react";
import Link from "next/link";
import { useFarcasterMiniApp } from "@Src/components/FarcasterProvider";
import { toast } from "sonner";
import { Button } from "@/ui/components/ui/button";

export default function SocialFeedPage() {
  const { getBatchUserQualityScores, contractReady } = useUserQuality();

  const { context, tipContext } = useFarcasterMiniApp();

  console.log("Context Farcaster Mini App: ", context);

  const t = useTranslations("farcaster");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("navigation");
  const tLeaderboard = useTranslations("farcaster.leaderboard");

  const [leaderboard, setLeaderboard] = useState<
    Array<{
      address: string;
      score: number;
      tier: string;
      nickname?: string;
      displayName?: string;
      fid?: number;
      pfp?: string;
      verified?: boolean;
      powerBadge?: boolean;
      followerCount?: number;
      neynarScore?: number;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isSupporting, setIsSupporting] = useState(false);

  // Función para apoyar a un artista usando Farcaster Mini App SDK
  const handleSupportArtist = useCallback(
    async (artistAddress: string, artistFid?: number) => {
      if (!tipContext?.sendToken) {
        console.error("No Farcaster sendToken action available");
        toast.error("Mini App no disponible");
        return;
      }

      setIsSupporting(true);

      try {
        console.log("Sending tip to artist:", artistAddress);
        console.log("Artist FID:", artistFid);

        // Configuración para envío de tokens usando sendToken
        const sendTokenParams: {
          token?: string;
          amount?: string;
          recipientAddress?: string;
          recipientFid?: number;
        } = {
          // Usar USDC en Base Network (formato CAIP-19 correcto según docs)
          token: "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
          // 1 USDC (6 decimales) = 1000000
          amount: "1000000", // 1 USDC
          recipientAddress: artistAddress,
        };

        // Si tenemos FID del artista, lo incluimos para mejor UX
        if (artistFid) {
          sendTokenParams.recipientFid = artistFid;
        }

        console.log("SendToken params:", sendTokenParams);

        // Usar sendToken del SDK de Farcaster Mini App
        const result = await tipContext.sendToken(sendTokenParams);

        console.log("SendToken result:", result);

        if (result.success) {
          toast.success(tLeaderboard("tipsSentSuccessfully"));
          console.log("Transaction hash:", result.send.transaction);
        } else {
          // Manejo de errores específicos de sendToken
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

          if (result.error) {
            console.error("SendToken error details:", result.error);
          }
        }
      } catch (error) {
        console.error("SendToken failed:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));

        // Manejo de errores de red o del SDK
        if (error && typeof error === "object") {
          const errorObj = error as any;
          if (errorObj.message) {
            toast.error(`Error: ${errorObj.message}`);
          } else {
            toast.error(tLeaderboard("errorConnectingFarcaster"));
          }
        } else {
          toast.error(tLeaderboard("unknownErrorInTransaction"));
        }
      } finally {
        setIsSupporting(false);
      }
    },
    [tipContext, tLeaderboard]
  );

  // Función para crear leaderboard con usuarios de Farcaster reales
  const createFarcasterQualityLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Obtener usuarios de Farcaster de nuestra API
      // onlyReal=true para mostrar solo usuarios reales (opcional)
      const response = await fetch(
        "/api/farcaster/user-quality-leaderboard?limit=15"
      );

      if (!response.ok) {
        throw new Error(`Error fetching users: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.users || !data.addresses) {
        throw new Error("Invalid response data");
      }

      // Obtener scores de calidad para las direcciones de Farcaster
      const scores = await getBatchUserQualityScores(data.addresses);
      // Crear leaderboard con información completa del usuario de Farcaster
      const leaderboardData = Array.from(scores.entries())
        .map(([address, result]) => {
          const user = data.users.find((u: any) => u.address === address);
          return {
            address,
            score: result.score,
            tier: result.tier,
            nickname: user?.nickname || "Unknown",
            displayName: user?.displayName || user?.nickname,
            fid: user?.fid,
            pfp: user?.pfp,
            verified: user?.verified || true,
            powerBadge: user?.powerBadge || false,
            followerCount: user?.followerCount || 0,
            neynarScore: user?.neynarScore || 0,
          };
        })
        .sort((a, b) => b.score - a.score); // Ordenar por score descendente

      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error("Error creating Farcaster quality leaderboard:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [getBatchUserQualityScores]);

  // Cargar leaderboard automáticamente cuando el contrato esté listo
  useEffect(() => {
    if (contractReady && !isLoading && leaderboard.length === 0) {
      createFarcasterQualityLeaderboard();
    }
  }, [
    contractReady,
    isLoading,
    leaderboard.length,
    createFarcasterQualityLeaderboard,
  ]);

  // Función para obtener colores del tier según brand del proyecto
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
        icon: "🥇",
        glow: "shadow-lg shadow-yellow-500/30",
      };
    if (position === 2)
      return {
        bg: "bg-gradient-to-r from-gray-400/30 to-zinc-400/30",
        text: "text-gray-300",
        icon: "🥈",
        glow: "shadow-lg shadow-gray-400/30",
      };
    if (position === 3)
      return {
        bg: "bg-gradient-to-r from-amber-700/30 to-orange-700/30",
        text: "text-amber-300",
        icon: "🥉",
        glow: "shadow-lg shadow-amber-600/30",
      };
    return {
      bg: "",
      text: "text-zinc-400",
      icon: "",
      glow: "",
    };
  };

  // Componente Skeleton mejorado con brand del proyecto
  const LeaderboardSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="relative bg-zinc-900/60 backdrop-blur-sm border border-zinc-800/60 rounded-xl p-4 animate-pulse"
        >
          <div className="flex items-center gap-4">
            {/* Ranking badge skeleton */}
            <div className="flex-shrink-0 w-12 h-12 bg-zinc-700/50 rounded-full flex items-center justify-center">
              <div className="w-6 h-6 bg-zinc-600 rounded"></div>
            </div>

            {/* Main content skeleton */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-24 h-4 bg-zinc-600 rounded"></div>
                <div className="w-4 h-4 bg-zinc-600 rounded"></div>
                <div className="w-4 h-4 bg-zinc-600 rounded"></div>
              </div>
              <div className="w-32 h-3 bg-zinc-700 rounded mb-1"></div>
              <div className="w-40 h-2 bg-zinc-700 rounded"></div>
            </div>

            {/* Score skeleton */}
            <div className="flex-shrink-0 text-right">
              <div className="w-16 h-6 bg-zinc-600 rounded mb-1"></div>
              <div className="w-12 h-4 bg-zinc-700 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#18181b] via-[#1a1a1d] to-[#18181b]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header Premium con elementos virales */}
        <div className="text-center mb-12 relative">
          {/* Efecto de partículas de fondo */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-10 left-1/4 w-2 h-2 bg-yellow-400 rounded-full opacity-70 animate-pulse"></div>
            <div className="absolute top-20 right-1/3 w-1 h-1 bg-purple-400 rounded-full opacity-80 animate-ping"></div>
            <div className="absolute top-5 right-1/4 w-1.5 h-1.5 bg-blue-400 rounded-full opacity-60 animate-pulse"></div>
          </div>

          {/* Título principal viral */}
          <div className="relative">
            <h1 className="text-3xl md:text-6xl font-black mb-4 bg-gradient-to-r from-yellow-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent leading-tight">
              🏆 {tLeaderboard("title")}
            </h1>
            {/* Subtítulo con call-to-action viral */}
            <p className="text-md text-zinc-300 mb-6 max-w-2xl mx-auto">
              {tLeaderboard("subtitle")}
            </p>
          </div>
        </div>

        {/* Sección principal del leaderboard */}
        <div className="mt-4">
          {/* Mostrar skeletons mientras carga */}
          {isLoading && <LeaderboardSkeleton />}

          {/* Mostrar leaderboard con diseño viral y premium */}
          {!isLoading && leaderboard.length > 0 && (
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
                    {/* Card principal con diseño premium */}
                    <div
                      className={`
                        relative bg-gradient-to-r ${tierConfig.bg} 
                        backdrop-blur-sm border ${tierConfig.border} 
                        rounded-xl p-4 overflow-hidden
                        ${tierConfig.animation}
                        hover:border-opacity-60 transition-all duration-300
                      `}
                    >
                      {/* Efecto de brillo sutil */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                      <div className="relative flex items-center gap-3 md:gap-4">
                        {/* Ranking Badge con estilo premium - Responsive */}
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

                        {/* Información principal del usuario - Responsive */}
                        <Link href={`/u/${user.nickname}`}>
                          <div className="flex-1 min-w-0">
                            {/* Fila superior: nickname y badges */}
                            <div className="flex items-center gap-1 md:gap-2 mb-1">
                              <h3 className="text-white font-semibold text-sm md:text-base truncate">
                                @{user.nickname}
                              </h3>

                              {/* Badges premium - Responsive */}
                              {user.powerBadge && (
                                <span
                                  className="inline-flex items-center px-1 md:px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                  title={t("powerBadge")}
                                >
                                  ⚡
                                </span>
                              )}
                              {user.verified && (
                                <span
                                  className="inline-flex items-center px-1 md:px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                  title={t("verified")}
                                >
                                  ✓
                                </span>
                              )}
                            </div>

                            {/* Display name - Responsive */}
                            {user.displayName &&
                              user.displayName !== user.nickname && (
                                <p className="text-zinc-300 text-xs md:text-sm mb-1 truncate">
                                  {user.displayName}
                                </p>
                              )}
                          </div>
                        </Link>

                        {/* Stats y botón de apoyo - Responsive */}
                        <div className="flex-shrink-0 text-right ml-auto pr-1">
                          <div className="flex flex-col items-end gap-2">
                            {/* Estadísticas del usuario */}
                            <div className="text-right space-y-1">
                              <div className="flex items-center gap-1 justify-end">
                                <Users className="w-4 h-4 text-zinc-400" />
                                <span className="text-zinc-400 text-sm">
                                  {user.followerCount?.toLocaleString() || 0}
                                </span>
                              </div>
                            </div>

                            {/* Botón de tips con SDK de Farcaster */}
                            <Button
                              onClick={() =>
                                handleSupportArtist(user.address, user.fid)
                              }
                              disabled={isSupporting || !tipContext?.sendToken}
                              size="sm"
                              variant="outline"
                              className="text-xs border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 hover:border-purple-400/50 transition-all duration-300"
                            >
                              💎 {tLeaderboard("tips")}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Estado de error mejorado */}
          {!isLoading && error && (
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
                  onClick={createFarcasterQualityLeaderboard}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300"
                >
                  🔄 {tLeaderboard("reload")}
                </button>
              </div>
            </div>
          )}

          {/* Estado vacío mejorado */}
          {!isLoading &&
            !error &&
            leaderboard.length === 0 &&
            contractReady && (
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
            )}
        </div>
      </div>
    </div>
  );
}
