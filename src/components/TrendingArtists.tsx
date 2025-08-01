"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@Src/ui/components/ui/card";
import { Badge } from "@Src/ui/components/ui/badge";
import { Button } from "@Src/ui/components/ui/button";
import { 
  TrendingUp, 
  Heart, 
  MessageCircle, 
  Repeat2, 
  Star,
  Fire,
  ArrowUp,
  ArrowDown,
  Users,
  Music,
  ExternalLink,
  Crown
} from "lucide-react";
import Image from "next/image";

interface TrendingArtist {
  name: string;
  mentions: number;
  totalEngagement: number;
  sentiment: "positive" | "neutral" | "negative";
  topCasts: Array<{
    hash: string;
    text: string;
    author: {
      fid: number;
      username: string;
      displayName: string;
      pfp: string;
    };
    reactions: {
      likes: number;
      recasts: number;
      replies: number;
    };
    timestamp: string;
  }>;
  growthRate: number;
  categories: string[];
}

interface TrendingArtistsStats {
  totalArtistsAnalyzed: number;
  trendingArtistsFound: number;
  totalMentions: number;
  totalEngagement: number;
  timeWindow: string;
  topCategories: Array<{ category: string; mentions: number }>;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

interface TrendingArtistsProps {
  className?: string;
  limit?: number;
  timeWindow?: "1h" | "6h" | "12h" | "24h" | "7d";
  category?: string;
  showStats?: boolean;
  compact?: boolean;
}

export default function TrendingArtists({ 
  className = "",
  limit = 10,
  timeWindow = "24h",
  category = "all",
  showStats = true,
  compact = false
}: TrendingArtistsProps) {
  const [artists, setArtists] = useState<TrendingArtist[]>([]);
  const [stats, setStats] = useState<TrendingArtistsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeWindow, setSelectedTimeWindow] = useState(timeWindow);

  const fetchTrendingArtists = async (showRefreshState = false) => {
    try {
      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const response = await fetch(
        `/api/farcaster/trending-artists?limit=${limit}&timeWindow=${selectedTimeWindow}&category=${category}`
      );
      
      if (!response.ok) {
        throw new Error("Error fetching trending artists");
      }
      
      const result = await response.json();
      
      if (result.success) {
        setArtists(result.data);
        setStats(result.stats);
        setError(null);
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (err) {
      console.error("Error fetching trending artists:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTrendingArtists();
    
    // Auto-refresh cada 10 minutos
    const interval = setInterval(() => {
      fetchTrendingArtists(true);
    }, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [limit, selectedTimeWindow, category]);

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return <Heart className="h-4 w-4 text-green-500" />;
      case "negative": return <ArrowDown className="h-4 w-4 text-red-500" />;
      default: return <Star className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return "text-green-400 bg-green-500/10 border-green-500/20";
      case "negative": return "text-red-400 bg-red-500/10 border-red-500/20";
      default: return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      "reggaeton": "bg-orange-500/20 text-orange-400 border-orange-500/30",
      "pop": "bg-pink-500/20 text-pink-400 border-pink-500/30",
      "electronic": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      "hip-hop": "bg-purple-500/20 text-purple-400 border-purple-500/30",
      "rock": "bg-red-500/20 text-red-400 border-red-500/30",
      "r&b": "bg-amber-500/20 text-amber-400 border-amber-500/30",
      "web3": "bg-green-500/20 text-green-400 border-green-500/30",
      "indie": "bg-blue-500/20 text-blue-400 border-blue-500/30",
      "general": "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
    };
    return colors[category as keyof typeof colors] || colors.general;
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMs = now.getTime() - time.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    
    if (diffInMinutes < 1) return "ahora";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d`;
  };

  const openCastInWarpcast = (hash: string) => {
    window.open(`https://warpcast.com/~/conversations/${hash}`, '_blank');
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <Fire className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-white">Artistas Trending</h3>
        </div>
        
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-zinc-900 border-zinc-800 animate-pulse">
            <CardContent className="p-4">
              <div className="h-6 bg-zinc-800 rounded mb-2"></div>
              <div className="h-4 bg-zinc-800 rounded w-2/3 mb-4"></div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-zinc-800 rounded-full"></div>
                <div className="h-3 bg-zinc-800 rounded w-32"></div>
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
        <Button onClick={() => fetchTrendingArtists()} variant="outline">
          Reintentar
        </Button>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Fire className="h-4 w-4 text-orange-500" />
            <h4 className="text-sm font-semibold text-white">Trending</h4>
          </div>
          <Button
            onClick={() => fetchTrendingArtists(true)}
            size="sm"
            variant="ghost"
            disabled={refreshing}
            className="h-6 w-6 p-0"
          >
            <TrendingUp className="h-3 w-3" />
          </Button>
        </div>
        
        <div className="space-y-2">
          {artists.slice(0, 5).map((artist, index) => (
            <div key={artist.name} className="flex items-center gap-2 text-sm">
              <Badge className={`h-5 w-6 text-xs ${index < 3 ? "bg-orange-500" : "bg-zinc-600"}`}>
                {index + 1}
              </Badge>
              <span className="text-white truncate flex-1">{artist.name}</span>
              <div className="flex items-center gap-1 text-xs text-zinc-400">
                <Users className="h-3 w-3" />
                {artist.mentions}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Fire className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-white">Artistas Trending</h3>
          {refreshing && (
            <div className="h-4 w-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={selectedTimeWindow}
            onChange={(e) => setSelectedTimeWindow(e.target.value as any)}
            className="bg-zinc-800 border border-zinc-700 text-white text-xs rounded px-2 py-1"
          >
            <option value="1h">1h</option>
            <option value="6h">6h</option>
            <option value="12h">12h</option>
            <option value="24h">24h</option>
            <option value="7d">7d</option>
          </select>
          <Button
            onClick={() => fetchTrendingArtists(true)}
            size="sm"
            variant="outline"
            disabled={refreshing}
            className="h-8"
          >
            <TrendingUp className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      {showStats && stats && (
        <Card className="bg-gradient-to-r from-orange-900/20 to-red-900/20 border-orange-700/30">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-orange-500">{stats.trendingArtistsFound}</div>
                <div className="text-xs text-zinc-400">Artistas trending</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-500">{stats.totalMentions}</div>
                <div className="text-xs text-zinc-400">Menciones totales</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-500">{stats.sentimentDistribution.positive}</div>
                <div className="text-xs text-zinc-400">Sentiment positivo</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-500">{stats.topCategories[0]?.category || "N/A"}</div>
                <div className="text-xs text-zinc-400">Categoría #1</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Artists List */}
      <div className="space-y-3">
        {artists.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-8 text-center">
              <Music className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400">No se encontraron artistas trending</p>
            </CardContent>
          </Card>
        ) : (
          artists.map((artist, index) => (
            <Card 
              key={artist.name} 
              className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <CardContent className="p-4">
                {/* Artist Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Badge className={`h-8 w-8 flex items-center justify-center text-sm ${
                      index === 0 ? "bg-yellow-500 text-black" :
                      index === 1 ? "bg-gray-400 text-black" :
                      index === 2 ? "bg-amber-600 text-black" :
                      "bg-zinc-600 text-white"
                    }`}>
                      {index < 3 ? <Crown className="h-4 w-4" /> : index + 1}
                    </Badge>
                    <div>
                      <h4 className="text-lg font-bold text-white capitalize">{artist.name}</h4>
                      <div className="flex items-center gap-2 text-sm">
                        <Badge className={getSentimentColor(artist.sentiment)}>
                          {getSentimentIcon(artist.sentiment)}
                          <span className="ml-1 capitalize">{artist.sentiment}</span>
                        </Badge>
                        {artist.categories.slice(0, 2).map((cat, i) => (
                          <Badge key={i} variant="outline" className={`text-xs ${getCategoryColor(cat)}`}>
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-auto text-right">
                    <div className="text-xl font-bold text-orange-500">{artist.mentions}</div>
                    <div className="text-xs text-zinc-500">menciones</div>
                    {artist.growthRate > 0 && (
                      <div className="flex items-center gap-1 text-xs text-green-400">
                        <ArrowUp className="h-3 w-3" />
                        +{Math.round(artist.growthRate)}%
                      </div>
                    )}
                  </div>
                </div>

                {/* Top Cast */}
                {artist.topCasts[0] && (
                  <div className="bg-zinc-800/50 rounded-lg p-3 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Image
                        src={artist.topCasts[0].author.pfp || "/default-avatar.png"}
                        alt={artist.topCasts[0].author.displayName}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                      <span className="text-sm text-zinc-300">
                        {artist.topCasts[0].author.displayName}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {formatTimeAgo(artist.topCasts[0].timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-300 mb-2 line-clamp-2">
                      {artist.topCasts[0].text}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-zinc-500">
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {artist.topCasts[0].reactions.likes}
                        </div>
                        <div className="flex items-center gap-1">
                          <Repeat2 className="h-3 w-3" />
                          {artist.topCasts[0].reactions.recasts}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {artist.topCasts[0].reactions.replies}
                        </div>
                      </div>
                      <Button
                        onClick={() => openCastInWarpcast(artist.topCasts[0].hash)}
                        size="sm"
                        variant="ghost"
                        className="text-zinc-400 hover:text-white h-6 w-6 p-0"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Engagement Stats */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4 text-zinc-500">
                    <div>
                      <span className="text-white font-medium">{artist.totalEngagement}</span>
                      <span className="ml-1">engagement total</span>
                    </div>
                  </div>
                  <div className="text-xs text-zinc-500">
                    {artist.topCasts.length} cast{artist.topCasts.length !== 1 ? 's' : ''} top
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}