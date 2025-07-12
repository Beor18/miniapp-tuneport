import { useAppKitAccount } from "@Src/lib/privy";
import { useState, useCallback } from "react";

interface FarcasterRefreshOptions {
  fid: number;
  privyAppId: string;
  privyAppSecret: string;
}

export function useFarcaster() {
  const { farcasterConnected, farcasterData, linkFarcaster } =
    useAppKitAccount();

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Función para refrescar datos de Farcaster
  const refreshFarcasterData = useCallback(
    async (options: FarcasterRefreshOptions) => {
      if (!farcasterData?.fid) {
        console.warn("No Farcaster FID available");
        return null;
      }

      setIsRefreshing(true);

      try {
        const response = await fetch("/api/farcaster/refresh", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fid: options.fid || farcasterData.fid,
            privyAppId: options.privyAppId,
            privyAppSecret: options.privyAppSecret,
          }),
        });

        if (!response.ok) {
          throw new Error(
            `Error refreshing Farcaster data: ${response.status}`
          );
        }

        const refreshedData = await response.json();
        return refreshedData;
      } catch (error) {
        console.error("Error refreshing Farcaster data:", error);
        throw error;
      } finally {
        setIsRefreshing(false);
      }
    },
    [farcasterData?.fid]
  );

  // Función para obtener la URL del perfil de Farcaster
  const getFarcasterProfileUrl = useCallback(() => {
    if (!farcasterData?.username) return null;
    return `https://warpcast.com/${farcasterData.username}`;
  }, [farcasterData?.username]);

  // Función para obtener la URL del perfil en Supercast
  const getSupercastProfileUrl = useCallback(() => {
    if (!farcasterData?.username) return null;
    return `https://supercast.xyz/${farcasterData.username}`;
  }, [farcasterData?.username]);

  return {
    // Estados
    isConnected: farcasterConnected,
    farcasterData,
    isRefreshing,

    // Funciones
    linkFarcaster,
    refreshFarcasterData,
    getFarcasterProfileUrl,
    getSupercastProfileUrl,

    // Datos específicos para fácil acceso
    fid: farcasterData?.fid,
    username: farcasterData?.username,
    displayName: farcasterData?.displayName,
    pfp: farcasterData?.pfp,
    bio: farcasterData?.bio,
  };
}
