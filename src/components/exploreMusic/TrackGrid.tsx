import React from "react";
import { TrackCard } from "./TrackCard";
import { useAppKitAccount } from "@Src/lib/privy";

interface TrackGridProps {
  tracks: any[];
  collections?: any[];
  isAlbumGrid?: boolean;
  gridClassName?: string;
}

export function TrackGrid({
  tracks,
  collections = [],
  isAlbumGrid = false,
  gridClassName = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4",
}: TrackGridProps) {
  // Obtener estado de la wallet
  const { isConnected, address, solanaWalletAddress, evmWalletAddress } =
    useAppKitAccount();

  // Verificar si hay alguna wallet conectada
  const hasWalletConnected =
    isConnected && (!!address || !!solanaWalletAddress || !!evmWalletAddress);

  // Si tenemos información de colecciones, enriquecemos los tracks con esa información
  const enrichedTracks = tracks.map((track) => {
    const collection = collections.find(
      (col) => col._id === track.collectionId || col.id === track.albumId
    );
    return { track, collection };
  });

  return (
    <div className={gridClassName}>
      {enrichedTracks.map(({ track, collection }) => (
        <TrackCard
          key={track._id}
          track={track}
          collection={collection}
          isAlbum={isAlbumGrid}
          hasWalletConnected={hasWalletConnected}
        />
      ))}
    </div>
  );
}
