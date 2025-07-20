"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@Src/ui/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@Src/ui/components/ui/avatar";
import { Badge } from "@Src/ui/components/ui/badge";
import { MessageCircle, Repeat2, Heart, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCastContext } from "./ShareToFarcaster";

interface CastContextProps {
  onTrackRecommendation?: (keywords: string[]) => void;
}

export function CastContext({ onTrackRecommendation }: CastContextProps) {
  const { isFromCast, cast, user } = useCastContext();
  const [keywords, setKeywords] = useState<string[]>([]);
  const t = useTranslations("farcaster");

  useEffect(() => {
    if (cast?.text) {
      // Extraer palabras clave musicales del cast
      const musicKeywords = extractMusicKeywords(cast.text);
      setKeywords(musicKeywords);

      // Notificar al componente padre para recomendar música relacionada
      if (onTrackRecommendation && musicKeywords.length > 0) {
        onTrackRecommendation(musicKeywords);
      }
    }
  }, [cast?.text, onTrackRecommendation]);

  // Función para extraer palabras clave musicales
  const extractMusicKeywords = (text: string): string[] => {
    const musicTerms = [
      // Géneros musicales
      "rock",
      "pop",
      "jazz",
      "blues",
      "classical",
      "electronic",
      "house",
      "techno",
      "hip hop",
      "rap",
      "reggae",
      "country",
      "folk",
      "indie",
      "alternative",
      "metal",
      "punk",
      "funk",
      "soul",
      "r&b",
      "latin",
      "salsa",
      "bachata",
      "reggaeton",
      "cumbia",
      "tango",
      "flamenco",
      "bossa nova",

      // Instrumentos
      "guitar",
      "piano",
      "drums",
      "bass",
      "violin",
      "saxophone",
      "trumpet",
      "guitarra",
      "piano",
      "batería",
      "bajo",
      "violín",
      "saxofón",
      "trompeta",

      // Términos musicales
      "song",
      "track",
      "album",
      "ep",
      "single",
      "remix",
      "acoustic",
      "canción",
      "tema",
      "álbum",
      "sencillo",
      "acústico",

      // Emociones/estado de ánimo
      "chill",
      "upbeat",
      "sad",
      "happy",
      "energetic",
      "relaxing",
      "relajante",
      "enérgico",
      "alegre",
      "triste",
      "emotional",
    ];

    const words = text.toLowerCase().split(/\s+/);
    return musicTerms.filter((term) =>
      words.some((word) => word.includes(term) || term.includes(word))
    );
  };

  if (!isFromCast || !cast) {
    return null;
  }

  return (
    <Card className="mb-4 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={cast.author?.pfp}
              alt={cast.author?.displayName}
            />
            <AvatarFallback>
              {cast.author?.displayName?.slice(0, 2) ||
                cast.author?.username?.slice(0, 2) ||
                "FC"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-sm">
                {cast.author?.displayName || cast.author?.username}
              </span>
              <span className="text-muted-foreground text-xs">
                @{cast.author?.username}
              </span>
              <Badge variant="secondary" className="text-xs">
                <MessageCircle className="h-3 w-3 mr-1" />
                {t("castOriginal")}
              </Badge>
            </div>

            <p className="text-sm text-gray-700 mb-3 break-words">
              {cast.text}
            </p>

            {keywords.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-2">
                  {t("musicRelatedDetected")}
                </p>
                <div className="flex flex-wrap gap-1">
                  {keywords.slice(0, 5).map((keyword, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="text-xs bg-purple-100 text-purple-700"
                    >
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 text-muted-foreground text-xs">
              <div className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                <span>{cast.replies || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Repeat2 className="h-3 w-3" />
                <span>{cast.recasts || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                <span>{cast.likes || 0}</span>
              </div>
              <a
                href={`https://warpcast.com/~/conversations/${cast.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-purple-600 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                <span>{t("viewInWarpcast")}</span>
              </a>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente para mostrar mensaje cuando no hay contexto de cast
export function NoCastContext() {
  const t = useTranslations("farcaster");

  return (
    <Card className="mb-4 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
      <CardContent className="p-4 text-center">
        <div className="flex items-center justify-center gap-2 text-blue-700">
          <MessageCircle className="h-5 w-5" />
          <span className="font-medium">{t("welcomeToTuneport")}</span>
        </div>
        <p className="text-sm text-blue-600 mt-2">
          {t("discoverIncredibleMusic")}
        </p>
      </CardContent>
    </Card>
  );
}
