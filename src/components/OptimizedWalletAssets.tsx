"use client";

import { useRef } from "react";
import { Card, CardContent, CardFooter } from "@Src/ui/components/ui/card";
import { Badge } from "@Src/ui/components/ui/badge";
import {
  PackageX,
  Music,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Zap,
  Database,
} from "lucide-react";
import { EnhancedUserNFT } from "@Src/lib/contracts/erc1155";

interface OptimizedWalletAssetsProps {
  nfts: EnhancedUserNFT[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  usingNewFunctions: boolean;
  onRefresh?: () => void;
}

// Skeleton component para NFTs
const NFTSkeleton = () => (
  <div className="w-48 flex-shrink-0 h-80">
    <Card className="group overflow-hidden border-none bg-zinc-900/50 h-full flex flex-col">
      <CardContent className="p-0 relative flex-shrink-0">
        <div className="relative aspect-square">
          <div className="w-full h-full bg-zinc-800 animate-pulse"></div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start p-4 bg-zinc-900/95 flex-1 justify-between">
        <div className="w-full">
          <div className="h-5 bg-zinc-800 rounded animate-pulse w-3/4 mb-2"></div>
          <div className="h-4 bg-zinc-800/70 rounded animate-pulse w-1/2 mb-2"></div>
          <div className="h-3 bg-zinc-800/50 rounded animate-pulse w-1/3"></div>
        </div>
        {/* Área fija para descripción skeleton */}
        <div className="w-full mt-2 h-8 flex items-start">
          <div className="h-3 bg-zinc-800/50 rounded animate-pulse w-2/3"></div>
        </div>
      </CardFooter>
    </Card>
  </div>
);

// Component para una tarjeta de NFT
const NFTCard = ({ nft }: { nft: EnhancedUserNFT }) => {
  const handleOpenExternal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (nft.external_url) {
      // Usar las mejores prácticas para abrir enlaces
      const link = document.createElement("a");
      link.href = nft.external_url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Card className="group overflow-hidden border-none bg-zinc-900/50 transition-all duration-300 hover:-translate-y-1 w-full h-full flex flex-col">
      <CardContent className="p-0 relative flex-shrink-0">
        <div className="relative aspect-square">
          {nft.image ? (
            <img
              src={nft.image || "/logo-white.svg"}
              alt={nft.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-500">
              <PackageX size={48} />
            </div>
          )}

          {/* Badges superiores */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {/* Badge de tipo de colección */}
            {nft.collection_type && (
              <Badge
                variant="outline"
                className="text-[10px] py-0 px-2 bg-purple-900/80 text-purple-200 border-purple-700"
              >
                {nft.collection_type}
              </Badge>
            )}

            {/* Badge de red */}
            <Badge
              variant="outline"
              className="text-[10px] py-0 px-2 bg-blue-900/80 text-blue-200 border-blue-700"
            >
              Base
            </Badge>
          </div>

          {/* Badge de balance si es mayor a 1 */}
          {nft.balance > 1 && (
            <div className="absolute top-2 right-2">
              <Badge
                variant="outline"
                className="text-[10px] py-0 px-2 bg-emerald-900/80 text-emerald-200 border-emerald-700"
              >
                {nft.balance}x
              </Badge>
            </div>
          )}

          {/* Botones de acción */}
          <div className="absolute bottom-2 right-2 flex gap-2">
            {nft.music_genre && (
              <div className="bg-zinc-900/80 rounded-full p-2">
                <Music className="w-4 h-4 text-white" />
              </div>
            )}
            {nft.external_url && (
              <div
                className="bg-zinc-900/80 rounded-full p-2 cursor-pointer hover:bg-zinc-800/90 transition-colors"
                onClick={handleOpenExternal}
              >
                <ExternalLink className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start p-4 bg-zinc-900/95 flex-1 justify-between">
        <div className="w-full">
          <h4 className="font-medium text-zinc-100 group-hover:text-white transition-colors truncate w-full">
            {nft.name}
          </h4>
          <p className="text-sm text-zinc-400 truncate w-full">{nft.artist}</p>
          <div className="flex items-center justify-between w-full mt-2">
            <div className="flex items-center gap-2">
              {nft.music_genre && (
                <div className="flex items-center gap-1">
                  <Music className="w-3 h-3 text-purple-400" />
                  <span className="text-xs text-purple-400 truncate">
                    {nft.music_genre}
                  </span>
                </div>
              )}
            </div>
            {nft.symbol && (
              <span className="text-xs text-zinc-500 truncate">
                {nft.symbol}
              </span>
            )}
          </div>
        </div>
        {/* Área fija para descripción - siempre ocupa el mismo espacio */}
        <div className="w-full mt-2 h-8 flex items-start">
          {nft.description && (
            <p className="text-xs text-zinc-500 line-clamp-2 leading-tight">
              {nft.description}
            </p>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default function OptimizedWalletAssets({
  nfts,
  loading,
  error,
  totalCount,
  usingNewFunctions,
  onRefresh,
}: OptimizedWalletAssetsProps) {
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
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <h2 className="text-2xl font-bold text-white uppercase">Collected</h2>
        </div>
        <div className="text-center p-6 bg-red-900/20 rounded-lg border border-red-800/50 backdrop-blur-sm">
          <PackageX size={40} className="mx-auto mb-3 text-red-400" />
          <p className="text-red-300 text-base mb-2">Error loading NFTs</p>
          <p className="text-red-400 text-sm">{error}</p>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="mt-3 bg-red-900/80 border border-red-800 rounded-lg px-3 py-2 flex items-center gap-2 text-red-300 hover:text-red-200 hover:bg-red-900/60 transition-all shadow-md"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm font-medium">Retry</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-white uppercase">Collected</h2>
          {/* Badge indicando qué método se está usando */}
          {/* <Badge
            variant="outline"
            className={`text-xs py-1 px-2 ${
              usingNewFunctions
                ? "bg-emerald-900/80 text-emerald-200 border-emerald-700"
                : "bg-orange-900/80 text-orange-200 border-orange-700"
            }`}
          >
            {usingNewFunctions ? (
              <>
                <Zap className="w-3 h-3 mr-1" />
                v1.0.1 Optimized
              </>
            ) : (
              <>
                <Database className="w-3 h-3 mr-1" />
                Legacy Fallback
              </>
            )}
          </Badge> */}
          {totalCount > 0 && (
            <Badge
              variant="outline"
              className="text-xs py-1 px-2 bg-zinc-800 text-zinc-300 border-zinc-700 hidden sm:inline-flex"
            >
              {totalCount} items
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="bg-zinc-900/80 border border-zinc-800 rounded-lg px-3 py-2 flex items-center gap-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              <span className="text-sm font-medium hidden sm:inline">
                Refresh
              </span>
            </button>
          )}

          {/* Botones de navegación del carrusel */}
          {!loading && nfts.length > 0 && (
            <div className="flex gap-2">
              <button
                type="button"
                aria-label="Scroll left"
                onClick={() => scroll("left")}
                className="bg-zinc-900/80 border border-zinc-800 rounded-full p-1 w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all shadow-md"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                aria-label="Scroll right"
                onClick={() => scroll("right")}
                className="bg-zinc-900/80 border border-zinc-800 rounded-full p-1 w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all shadow-md"
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
                <NFTSkeleton key={index} />
              ))}
          </div>
        </div>
      ) : nfts.length > 0 ? (
        <div className="relative">
          <div
            className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            ref={carouselRef}
          >
            {nfts.map((nft) => (
              <div
                key={`${nft.contractAddress}-${nft.tokenId}`}
                className="w-48 flex-shrink-0 h-80"
              >
                <NFTCard nft={nft} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center p-6 bg-zinc-900/30 rounded-lg border border-zinc-800/50 backdrop-blur-sm">
          <PackageX size={40} className="mx-auto mb-3 text-zinc-500" />
          <p className="text-zinc-400 text-base mb-1">
            No NFTs found in this wallet
          </p>
          <p className="text-zinc-500 text-sm">
            Your collected music NFTs will appear here
          </p>
        </div>
      )}
    </div>
  );
}
