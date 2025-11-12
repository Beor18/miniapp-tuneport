import { useState, useEffect, useRef, useMemo } from "react";
import { useAppKitAccount } from "@Src/lib/privy";
import { getUserData } from "@Src/app/actions/checkUser.actions";

interface AuthUser {
  _id: string;
  name: string;
  email?: string;
  address?: string;
  address_solana?: string;
  nickname?: string;
  verified: boolean;
  type: "fan" | "artist";
}

// 🔥 CACHE GLOBAL: Evitar que múltiples instancias del hook hagan fetches duplicados
const globalUserCache = new Map<string, AuthUser | null>();
const globalFetchPromises = new Map<string, Promise<AuthUser | null>>();
const CACHE_DURATION = 30000; // 30 segundos
const cacheTimestamps = new Map<string, number>();

export function useAuthUser() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchRef = useRef<string | null>(null);

  const { address, isConnected, evmWalletAddress, solanaWalletAddress } =
    useAppKitAccount();

  // Crear un identificador estable para las direcciones
  const addressKey = useMemo(() => {
    if (!isConnected) return null;
    const evm = evmWalletAddress || "";
    const solana = solanaWalletAddress || "";
    return evm || solana ? `${evm}_${solana}` : null;
  }, [isConnected, evmWalletAddress, solanaWalletAddress]);

  useEffect(() => {
    const fetchUserData = async () => {
      // Si no hay addressKey o es el mismo que la última vez, no hacer fetch
      if (!addressKey || addressKey === lastFetchRef.current) {
        if (!addressKey) {
          setIsLoading(false);
          setUser(null);
          setError(null);
        }
        return;
      }

      // 🔥 CACHE: Verificar si tenemos datos en cache y son recientes
      const now = Date.now();
      const cachedTime = cacheTimestamps.get(addressKey);
      if (
        cachedTime &&
        now - cachedTime < CACHE_DURATION &&
        globalUserCache.has(addressKey)
      ) {
        const cachedUser = globalUserCache.get(addressKey);
        setUser(cachedUser || null);
        setIsLoading(false);
        lastFetchRef.current = addressKey;
        return;
      }

      // 🔥 DEDUPLICACIÓN: Si ya hay un fetch en progreso para esta key, esperarlo
      if (globalFetchPromises.has(addressKey)) {
        try {
          const userData = await globalFetchPromises.get(addressKey);
          setUser(userData || null);
          setIsLoading(false);
          lastFetchRef.current = addressKey;
          return;
        } catch (err) {
          console.error("Error waiting for ongoing fetch:", err);
        }
      }

      // Evitar fetch si ya estamos cargando
      if (isLoading && lastFetchRef.current !== null) {
        return;
      }

      setIsLoading(true);
      setError(null);
      lastFetchRef.current = addressKey;

      // 🔥 CREAR PROMESA COMPARTIDA: Múltiples instancias esperarán esta misma promesa
      const fetchPromise = getUserData({
        address: evmWalletAddress || undefined,
        address_solana: solanaWalletAddress || undefined,
      })
        .then((userData) => {
          let normalizedUser: AuthUser | null = null;

          if (userData) {
            normalizedUser = {
              _id: userData._id,
              name: userData.name,
              email: userData.email,
              address: userData.address,
              address_solana: userData.address_solana,
              nickname: userData.nickname,
              verified: userData.verified,
              type: userData.type,
            };
          }

          // Guardar en cache global
          globalUserCache.set(addressKey, normalizedUser);
          cacheTimestamps.set(addressKey, Date.now());
          globalFetchPromises.delete(addressKey);

          return normalizedUser;
        })
        .catch((err) => {
          console.error("Error fetching user data:", err);
          globalFetchPromises.delete(addressKey);
          throw err;
        });

      globalFetchPromises.set(addressKey, fetchPromise);

      try {
        const userData = await fetchPromise;
        setUser(userData);
      } catch (err) {
        setError("Error al obtener datos del usuario");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
    // 🔥 FIX: Solo depender de addressKey (que ya incluye evm y solana en su memo)
    // Incluir evmWalletAddress y solanaWalletAddress causaba re-fetches innecesarios
  }, [addressKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    user,
    userId: user?._id || null,
    isLoading,
    error,
    isAuthenticated: !!user,
  };
}
