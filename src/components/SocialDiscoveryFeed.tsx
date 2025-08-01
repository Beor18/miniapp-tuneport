"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@Src/ui/components/ui/card";
import { Badge } from "@Src/ui/components/ui/badge";
import { Button } from "@Src/ui/components/ui/button";
import { 
  Heart, 
  MessageCircle, 
  Repeat2, 
  Music, 
  Clock, 
  TrendingUp,
  ExternalLink,
  Sparkles
} from "lucide-react";
// Función para formatear tiempo sin date-fns
const formatTimeAgo = (timestamp: string) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInMs = now.getTime() - time.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  
  if (diffInMinutes < 1) return "ahora";
  if (diffInMinutes < 60) return `hace ${diffInMinutes}m`;
  if (diffInHours < 24) return `hace ${diffInHours}h`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `hace ${diffInDays}d`;
};
import Image from "next/image";
import TrendingArtists from "./TrendingArtists";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@Src/ui/components/ui/tabs";

interface SocialMusicData {
  cast: {
    hash: string;
    text: string;
    timestamp: string;
    author: {
      fid: number;
      username: string;
      displayName: string;
      pfp: string;
      followerCount?: number;
    };
    reactions: {
      likes: number;
      recasts: number;
      replies: number;
    };
    embeds?: any[];
  };
  musicKeywords: string[];
  relevanceScore: number;
}

interface SocialDiscoveryStats {
  totalCastsFound: number;
  musicCasts: number;
  avgRelevanceScore: number;
  timeWindow: string;
  topKeywords: Array<{ keyword: string; count: number }>;
}

interface SocialDiscoveryFeedProps {
  className?: string;
  limit?: number;
  timeWindow?: "1h" | "6h" | "12h" | "24h";
  showStats?: boolean;
}

export default function SocialDiscoveryFeed({ 
  className = "",
  limit = 20,
  timeWindow = "24h",
  showStats = true
}: SocialDiscoveryFeedProps) {
  const [feedData, setFeedData] = useState<SocialMusicData[]>([]);
  const [stats, setStats] = useState<SocialDiscoveryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("feed");

  const fetchSocialFeed = async (showRefreshState = false) => {
    try {
      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const response = await fetch(
        `/api/farcaster/social-discovery?limit=${limit}&timeWindow=${timeWindow}`
      );
      
      if (!response.ok) {
        throw new Error("Error fetching social discovery feed");
      }
      
      const result = await response.json();
      
      if (result.success) {
        setFeedData(result.data);
        setStats(result.stats);
        setError(null);
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (err) {
      console.error("Error fetching social feed:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSocialFeed();
    
    // Auto-refresh cada 5 minutos
    const interval = setInterval(() => {
      fetchSocialFeed(true);
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [limit, timeWindow]);

  const handleRefresh = () => {
    fetchSocialFeed(true);
  };

  const openCastInWarpcast = (hash: string) => {
    window.open(`https://warpcast.com/~/conversations/${hash}`, '_blank');
  };

  const getRelevanceBadgeColor = (score: number) => {
    if (score >= 100) return "bg-red-500";
    if (score >= 50) return "bg-orange-500";
    if (score >= 25) return "bg-yellow-500";
    return "bg-blue-500";
  };

  const formatFollowerCount = (count?: number) => {
    if (!count) return "";
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          <h3 className="text-lg font-semibold text-white">Descubrimiento Social</h3>
        </div>
        
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-zinc-900 border-zinc-800 animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-zinc-800 rounded mb-2"></div>
              <div className="h-3 bg-zinc-800 rounded w-3/4 mb-4"></div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-zinc-800 rounded-full"></div>
                <div className="h-3 bg-zinc-800 rounded w-24"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-red-400 mb-4">Error: {error}</div>
        <Button onClick={() => fetchSocialFeed()} variant="outline">
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          <h3 className="text-lg font-semibold text-white">
            Descubrimiento Social
          </h3>
          {refreshing && (
            <div className="h-4 w-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {timeWindow === "1h" ? "Última hora" : 
             timeWindow === "6h" ? "Últimas 6h" :
             timeWindow === "12h" ? "Últimas 12h" : "Últimas 24h"}
          </Badge>
          <Button
            onClick={handleRefresh}
            size="sm"
            variant="outline"
            disabled={refreshing}
            className="h-8"
          >
            <TrendingUp className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Sub-tabs para alternar entre feed y artistas trending */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-zinc-800 border-zinc-700 mb-6">
          <TabsTrigger value="feed" className="text-white data-[state=active]:bg-zinc-700">
            <MessageCircle className="h-4 w-4 mr-2" />
            Feed Social
          </TabsTrigger>
          <TabsTrigger value="artists" className="text-white data-[state=active]:bg-zinc-700">
            <Sparkles className="h-4 w-4 mr-2" />
            Artistas Trending
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="space-y-4 mt-0">

      {/* Stats */}
      {showStats && stats && (
        <Card className="bg-gradient-to-r from-zinc-900 to-zinc-800 border-zinc-700">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-yellow-500">{stats.musicCasts}</div>
                <div className="text-xs text-zinc-400">Casts musicales</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-500">{Math.round(stats.avgRelevanceScore)}</div>
                <div className="text-xs text-zinc-400">Score promedio</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-500">{stats.topKeywords[0]?.keyword || "N/A"}</div>
                <div className="text-xs text-zinc-400">Trend #1</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-500">{stats.totalCastsFound}</div>
                <div className="text-xs text-zinc-400">Total encontrados</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feed */}
      <div className="space-y-3">
        {feedData.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-8 text-center">
              <Music className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400">No se encontraron discusiones musicales recientes</p>
            </CardContent>
          </Card>
        ) : (
          feedData.map((item) => (
            <Card 
              key={item.cast.hash} 
              className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <CardContent className="p-4">
                {/* Author */}
                <div className="flex items-center gap-3 mb-3">
                  <Image
                    src={item.cast.author.pfp || "/default-avatar.png"}
                    alt={item.cast.author.displayName}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white truncate">
                        {item.cast.author.displayName}
                      </span>
                      <span className="text-zinc-500 text-sm">
                        @{item.cast.author.username}
                      </span>
                      {item.cast.author.followerCount && (
                        <Badge variant="secondary" className="text-xs h-5">
                          {formatFollowerCount(item.cast.author.followerCount)}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(item.cast.timestamp)}
                    </div>
                  </div>
                  
                  {/* Relevance Score */}
                  <Badge 
                    className={`${getRelevanceBadgeColor(item.relevanceScore)} text-white`}
                  >
                    {Math.round(item.relevanceScore)}
                  </Badge>
                </div>

                {/* Cast Text */}
                <div className="mb-3">
                  <p className="text-zinc-300 leading-relaxed">
                    {item.cast.text}
                  </p>
                </div>

                {/* Music Keywords */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {item.musicKeywords.slice(0, 5).map((keyword, index) => (
                    <Badge 
                      key={index}
                      variant="outline" 
                      className="text-xs border-yellow-500/30 text-yellow-400"
                    >
                      <Music className="h-3 w-3 mr-1" />
                      {keyword}
                    </Badge>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-zinc-500">
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      <span className="text-sm">{item.cast.reactions.likes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Repeat2 className="h-4 w-4" />
                      <span className="text-sm">{item.cast.reactions.recasts}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      <span className="text-sm">{item.cast.reactions.replies}</span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => openCastInWarpcast(item.cast.hash)}
                    size="sm"
                    variant="ghost"
                    className="text-zinc-400 hover:text-white"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
        </div>
        </TabsContent>

        <TabsContent value="artists" className="mt-0">
          <TrendingArtists 
            timeWindow={timeWindow}
            limit={10}
            showStats={showStats}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}