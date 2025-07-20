"use client";

import { useState } from "react";
import { Button } from "@Src/ui/components/ui/button";
import { Share, Music, Heart, Zap } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useFarcasterMiniApp } from "./FarcasterProvider";

interface ShareToFarcasterProps {
  nft: {
    id: string;
    name: string;
    artist: string;
    album?: string;
    genre?: string;
    collection_slug: string;
    image_cover?: string;
  };
  type?: "song" | "album" | "playlist";
}

export function ShareToFarcaster({
  nft,
  type = "song",
}: ShareToFarcasterProps) {
  const [isSharing, setIsSharing] = useState(false);
  const { isSDKLoaded, context } = useFarcasterMiniApp();
  const t = useTranslations("farcaster");

  const handleShare = async () => {
    // Verificar que el SDK esté listo
    if (!isSDKLoaded) {
      toast.error(t("farcasterNotAvailable"));
      return;
    }

    setIsSharing(true);

    try {
      // Importar el SDK dinámicamente para evitar problemas de SSR
      const { sdk } = await import("@farcaster/miniapp-sdk");

      // Crear texto personalizado según el tipo usando traducciones
      const getShareText = () => {
        const template = t(`shareTexts.${type}`);

        return template
          .replace("{name}", nft.name)
          .replace("{artist}", nft.artist)
          .replace(
            "{album}",
            nft.album ? `💿 ${t("music.album")}: ${nft.album}\n` : ""
          )
          .replace("{albumName}", nft.album || "")
          .replace(
            "{genre}",
            nft.genre ? `🎤 ${t("music.genre")}: ${nft.genre}\n` : ""
          )
          .replace("{genreName}", nft.genre || "");
      };

      // URL del contenido para el embed
      const contentUrl = `https://miniapp.tuneport.xyz/album/${nft.collection_slug}`;

      // Crear el cast usando Quick Auth del SDK oficial
      const castData = {
        text: getShareText(),
        embeds: [
          {
            url: contentUrl,
          },
        ],
      };

      // Usar Quick Auth para hacer request autenticado
      const response = await sdk.quickAuth.fetch("/api/farcaster/cast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(castData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || t("errorSharing"));
      }

      const result = await response.json();

      toast.success(t("sharedSuccessfully"), {
        description: t("shareSuccessDescription"),
        action: {
          label: t("viewCast"),
          onClick: () => {
            // Usar navigator.clipboard en lugar de window.open
            if (typeof window !== "undefined" && navigator.clipboard) {
              navigator.clipboard.writeText(result.castUrl).then(() => {
                toast.info("URL copiada al portapapeles");
              });
            }
          },
        },
      });
    } catch (error) {
      console.error("Error sharing to Farcaster:", error);

      // Intentar fallback con método directo si Quick Auth falla
      try {
        await handleShareFallback();
      } catch (fallbackError) {
        toast.error(t("errorSharing"), {
          description:
            error instanceof Error ? error.message : t("shareErrorDescription"),
        });
      }
    } finally {
      setIsSharing(false);
    }
  };

  // Método fallback usando API directa
  const handleShareFallback = async () => {
    const getShareText = () => {
      const template = t(`shareTexts.${type}`);
      return template
        .replace("{name}", nft.name)
        .replace("{artist}", nft.artist)
        .replace(
          "{album}",
          nft.album ? `�� ${t("music.album")}: ${nft.album}\n` : ""
        )
        .replace("{albumName}", nft.album || "")
        .replace(
          "{genre}",
          nft.genre ? `🎤 ${t("music.genre")}: ${nft.genre}\n` : ""
        )
        .replace("{genreName}", nft.genre || "");
    };

    const contentUrl = `https://miniapp.tuneport.xyz/album/${nft.collection_slug}`;

    const castData = {
      text: getShareText(),
      embeds: [{ url: contentUrl }],
    };

    const response = await fetch("/api/farcaster/cast", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(castData),
    });

    if (!response.ok) {
      throw new Error("Fallback method failed");
    }

    const result = await response.json();
    toast.success("Cast creado exitosamente (método alternativo)");
  };

  return (
    <Button
      onClick={handleShare}
      disabled={isSharing || !isSDKLoaded}
      variant="ghost"
      size="icon"
      className="text-white hover:bg-white/20 transition-all bg-black/40 backdrop-blur-sm rounded-full border border-white/20 h-12 w-12"
      title="Compartir en Farcaster"
    >
      {isSharing ? (
        <Zap className="h-4 w-4 animate-pulse" />
      ) : (
        <Share className="h-4 w-4" />
      )}
    </Button>
  );
}

// Componente para estadísticas de shares
export function ShareStats({ shares = 0 }: { shares?: number }) {
  return (
    <div className="flex items-center gap-1 text-sm text-muted-foreground">
      <Share className="h-3 w-3" />
      <span>{shares}</span>
    </div>
  );
}

// Hook para detectar si la mini app fue abierta desde un cast
export function useCastContext() {
  const { context } = useFarcasterMiniApp();

  return {
    isFromCast: !!context?.cast,
    cast: context?.cast,
    user: context?.user,
  };
}
