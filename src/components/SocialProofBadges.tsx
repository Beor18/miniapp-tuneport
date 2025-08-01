"use client";

import { useState, useEffect } from "react";
import { Badge } from "@Src/ui/components/ui/badge";
import { 
  TrendingUp, 
  Flame, 
  Heart, 
  MessageCircle, 
  Users,
  Zap,
  Star,
  ArrowUp,
  Activity,
  Target
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@Src/ui/components/ui/tooltip";

interface SocialProofData {
  totalMentions: number;
  recentMentions: number;
  totalEngagement: number;
  avgEngagementPerMention: number;
  sentiment: "positive" | "neutral" | "negative";
  trendingScore: number;
  viralStatus: "viral" | "trending" | "rising" | "stable" | "declining";
}

interface SocialProofBadgesProps {
  songTitle?: string;
  artistName?: string;
  className?: string;
  compact?: boolean;
  showTooltips?: boolean;
}

export default function SocialProofBadges({ 
  songTitle, 
  artistName, 
  className = "",
  compact = false,
  showTooltips = true
}: SocialProofBadgesProps) {
  const [socialData, setSocialData] = useState<SocialProofData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSocialMetrics = async () => {
      if (!songTitle && !artistName) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams();
        if (songTitle) params.append("title", songTitle);
        if (artistName) params.append("artist", artistName);
        params.append("timeWindow", "7d");
        
        const response = await fetch(`/api/farcaster/song-metrics?${params}`);
        
        if (!response.ok) {
          throw new Error("Error fetching social metrics");
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
          setSocialData(result.data.socialData);
        }
      } catch (err) {
        console.error("Error fetching social metrics:", err);
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchSocialMetrics();
  }, [songTitle, artistName]);

  const getViralStatusConfig = (status: string) => {
    switch (status) {
      case "viral":
        return {
          icon: Flame,
          color: "bg-red-500 text-white",
          label: "VIRAL",
          description: "Esta canción está viral en Farcaster"
        };
      case "trending":
        return {
          icon: TrendingUp,
          color: "bg-orange-500 text-white",
          label: "TRENDING",
          description: "Tendencia al alza en menciones"
        };
      case "rising":
        return {
          icon: ArrowUp,
          color: "bg-yellow-500 text-black",
          label: "RISING",
          description: "Ganando tracción social"
        };
      case "stable":
        return {
          icon: Activity,
          color: "bg-blue-500 text-white",
          label: "STABLE",
          description: "Menciones consistentes"
        };
      default:
        return null;
    }
  };

  const getSentimentConfig = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return {
          icon: Heart,
          color: "bg-green-500/20 text-green-400 border-green-500/30",
          label: "❤️",
          description: "Sentiment positivo en Farcaster"
        };
      case "negative":
        return {
          icon: Target,
          color: "bg-red-500/20 text-red-400 border-red-500/30",
          label: "👎",
          description: "Críticas en Farcaster"
        };
      default:
        return {
          icon: Star,
          color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
          label: "😐",
          description: "Sentiment neutral"
        };
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <div className="h-5 w-12 bg-zinc-800 rounded animate-pulse"></div>
        <div className="h-5 w-8 bg-zinc-800 rounded animate-pulse"></div>
      </div>
    );
  }

  if (error || !socialData) {
    return null; // No mostrar nada si hay error o no hay datos
  }

  // No mostrar nada si no hay actividad social relevante
  if (socialData.totalMentions === 0 && socialData.trendingScore < 10) {
    return null;
  }

  const viralConfig = getViralStatusConfig(socialData.viralStatus);
  const sentimentConfig = getSentimentConfig(socialData.sentiment);

  const BadgeWrapper = ({ children, tooltip }: { children: React.ReactNode; tooltip?: string }) => {
    if (!showTooltips || !tooltip) return <>{children}</>;
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {children}
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {/* Solo mostrar el badge más importante en modo compacto */}
        {viralConfig && socialData.trendingScore >= 50 && (
          <BadgeWrapper tooltip={viralConfig.description}>
            <Badge className={`h-5 text-xs px-1 ${viralConfig.color}`}>
              <viralConfig.icon className="h-3 w-3 mr-1" />
              {viralConfig.label}
            </Badge>
          </BadgeWrapper>
        )}
        
        {socialData.totalMentions > 0 && (
          <BadgeWrapper tooltip={`${socialData.totalMentions} menciones en Farcaster`}>
            <Badge variant="secondary" className="h-5 text-xs px-1 bg-purple-500/20 text-purple-400 border-purple-500/30">
              <MessageCircle className="h-3 w-3 mr-1" />
              {socialData.totalMentions}
            </Badge>
          </BadgeWrapper>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 flex-wrap ${className}`}>
      {/* Badge de status viral */}
      {viralConfig && socialData.trendingScore >= 30 && (
        <BadgeWrapper tooltip={viralConfig.description}>
          <Badge className={`text-xs ${viralConfig.color}`}>
            <viralConfig.icon className="h-3 w-3 mr-1" />
            {viralConfig.label}
          </Badge>
        </BadgeWrapper>
      )}

      {/* Badge de menciones */}
      {socialData.totalMentions > 0 && (
        <BadgeWrapper tooltip={`${socialData.totalMentions} menciones totales en Farcaster`}>
          <Badge variant="outline" className="text-xs bg-purple-500/20 text-purple-400 border-purple-500/30">
            <MessageCircle className="h-3 w-3 mr-1" />
            {socialData.totalMentions}
          </Badge>
        </BadgeWrapper>
      )}

      {/* Badge de engagement */}
      {socialData.totalEngagement > 0 && (
        <BadgeWrapper tooltip={`${socialData.totalEngagement} interacciones totales`}>
          <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">
            <Users className="h-3 w-3 mr-1" />
            {socialData.totalEngagement}
          </Badge>
        </BadgeWrapper>
      )}

      {/* Badge de sentiment */}
      {socialData.totalMentions >= 2 && (
        <BadgeWrapper tooltip={sentimentConfig.description}>
          <Badge variant="outline" className={`text-xs ${sentimentConfig.color}`}>
            {sentimentConfig.label}
          </Badge>
        </BadgeWrapper>
      )}

      {/* Badge de trending score */}
      {socialData.trendingScore >= 40 && (
        <BadgeWrapper tooltip={`Score trending: ${socialData.trendingScore}/100`}>
          <Badge variant="outline" className="text-xs bg-orange-500/20 text-orange-400 border-orange-500/30">
            <Zap className="h-3 w-3 mr-1" />
            {socialData.trendingScore}
          </Badge>
        </BadgeWrapper>
      )}

      {/* Badge de actividad reciente */}
      {socialData.recentMentions > 0 && (
        <BadgeWrapper tooltip={`${socialData.recentMentions} menciones en las últimas 24h`}>
          <Badge variant="outline" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
            <Activity className="h-3 w-3 mr-1" />
            {socialData.recentMentions}
          </Badge>
        </BadgeWrapper>
      )}
    </div>
  );
}