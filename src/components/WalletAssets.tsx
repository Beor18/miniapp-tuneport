/* eslint-disable @next/next/no-img-element */
import React, { useRef } from "react";
import { Card, CardContent, CardFooter } from "@Src/ui/components/ui/card";
import { useWalletAssets, Asset } from "@Src/lib/hooks/useWalletAssets";
import {
  PackageX,
  MusicIcon,
  ExternalLinkIcon,
  ChevronLeft,
  ChevronRight,
  Globe,
} from "lucide-react";
import { Button } from "@Src/ui/components/ui/button";
import { Badge } from "@Src/ui/components/ui/badge";

// Componente de skeleton para una tarjeta de asset
const AssetCardSkeleton = () => (
  <Card className="group overflow-hidden border-none bg-zinc-900/50 transition-all w-[220px] flex-shrink-0">
    <CardContent className="p-0 relative">
      <div className="relative aspect-square">
        <div className="w-full h-full bg-zinc-800 animate-pulse"></div>
      </div>
    </CardContent>
    <CardFooter className="flex flex-col items-start p-4 bg-zinc-900/95">
      <div className="h-5 bg-zinc-800 rounded animate-pulse w-3/4 mb-2"></div>
      <div className="h-4 bg-zinc-800/70 rounded animate-pulse w-1/2"></div>
    </CardFooter>
  </Card>
);

// Función para determinar si un asset tiene audio
const hasAudioFile = (asset: Asset): boolean => {
  return !!asset.metadata?.properties?.files?.some(
    (file) => file.type && file.type.startsWith("audio/")
  );
};

// Componente personalizado para los iconos de Solana y EVM
const SolanaIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 128 128"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M93.96 42.03H34.08c-1.75 0-2.59 2.16-1.3 3.32l17.57 15.76a2.7 2.7 0 0 0 1.82.71h60.29c1.75 0 2.59-2.16 1.3-3.32l-17.57-15.76a2.7 2.7 0 0 0-1.82-.71z"
      fill="currentColor"
    />
    <path
      d="M93.96 79.23H34.08c-1.75 0-2.59-2.16-1.3-3.32l17.57-15.76a2.7 2.7 0 0 1 1.82-.71h60.29c1.75 0 2.59 2.16 1.3 3.32l-17.57 15.76a2.7 2.7 0 0 1-1.82.71z"
      fill="currentColor"
    />
    <path
      d="M34.07 60.47h59.88c1.75 0 2.59-2.16 1.3-3.32L77.68 41.39a2.7 2.7 0 0 0-1.82-.71H15.57c-1.75 0-2.59 2.16-1.3 3.32l17.57 15.76c.48.43 1.1.67 1.82.71z"
      fill="currentColor"
    />
  </svg>
);

const BaseIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-3-9h3V8h2v3h3v2h-3v3h-2v-3H9v-2z"
      fill="currentColor"
    />
  </svg>
);

// Componente para mostrar un único asset
const AssetCard = ({ asset }: { asset: Asset }) => {
  // Usar los metadatos para mostrar la información correcta
  const name = asset.metadata?.name || asset.name;
  const imageUrl = asset.metadata?.image || "";
  const description = asset.metadata?.description || "";
  const hasAudio = hasAudioFile(asset);
  const externalUrl = asset.metadata?.external_url;

  // Manejador para abrir el enlace externo si existe
  const handleOpenExternal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (externalUrl) {
      window.open(externalUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Card className="group overflow-hidden border-none bg-zinc-900/50 hover:bg-zinc-900/70 transition-all w-[220px] flex-shrink-0">
      <CardContent className="p-0 relative">
        <div className="relative aspect-square">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-500">
              <PackageX size={48} />
            </div>
          )}
          <div className="absolute bottom-2 right-2 flex gap-2">
            {hasAudio && (
              <div className="bg-zinc-900/80 rounded-full p-2">
                <MusicIcon className="w-5 h-5 text-white" />
              </div>
            )}
            {externalUrl && (
              <div
                className="bg-zinc-900/80 rounded-full p-2 cursor-pointer hover:bg-zinc-800/90"
                onClick={handleOpenExternal}
              >
                <ExternalLinkIcon className="w-5 h-5 text-white" />
              </div>
            )}
          </div>

          {/* Mostrar una etiqueta indicando la red del NFT */}
          <div className="absolute top-2 left-2">
            <Badge
              variant="outline"
              className={`text-[10px] py-0 px-2 ${
                asset.network === "solana"
                  ? "bg-purple-900/80 text-purple-200 border-purple-700"
                  : "bg-blue-900/80 text-blue-200 border-blue-700"
              }`}
            >
              {asset.network === "solana" ? "Solana" : "EVM"}
            </Badge>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start p-4 bg-zinc-900/95">
        <h3 className="text-base font-medium truncate w-full text-white">
          {name}
        </h3>
        {description && (
          <p className="text-sm text-zinc-400 truncate w-full line-clamp-1">
            {description}
          </p>
        )}
        {asset.metadata?.attributes && asset.metadata.attributes.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {asset.metadata.attributes.slice(0, 1).map((attr, i) => (
              <span
                key={i}
                className="text-sm bg-zinc-800 text-zinc-300 px-2 py-1 rounded-full"
              >
                {attr.value}
              </span>
            ))}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

// Componente principal para mostrar todos los assets
const WalletAssets = () => {
  const { assets, loading, error, activeNetwork, setActiveNetwork } =
    useWalletAssets();
  const carouselRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const { current } = carouselRef;
      const scrollAmount = direction === "left" ? -240 : 240;
      current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (error) {
    return (
      <div className="text-red-500 p-4 text-center">
        Error loading NFTs: {error.message}
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-white uppercase">Collected</h2>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {(loading || assets.length > 0) && (
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
      </div>

      {loading ? (
        <div className="relative">
          <div
            className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            ref={carouselRef}
          >
            {Array(6)
              .fill(0)
              .map((_, index) => (
                <AssetCardSkeleton key={index} />
              ))}
          </div>
        </div>
      ) : assets.length > 0 ? (
        <div className="relative">
          <div
            className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            ref={carouselRef}
          >
            {assets.map((asset) => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center p-6 bg-zinc-900/30 rounded-lg border border-zinc-800/50 backdrop-blur-sm">
          <PackageX size={40} className="mx-auto mb-3 text-zinc-500" />
          <p className="text-zinc-400 text-base">
            Not NFTs found in this wallet
          </p>
        </div>
      )}
    </div>
  );
};

export default WalletAssets;
