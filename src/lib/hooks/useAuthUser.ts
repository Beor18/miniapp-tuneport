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

      // Evitar fetch si ya estamos cargando
      if (isLoading && lastFetchRef.current !== null) return;

      setIsLoading(true);
      setError(null);
      lastFetchRef.current = addressKey;

      try {
        const userData = await getUserData({
          address: evmWalletAddress || undefined,
          address_solana: solanaWalletAddress || undefined,
        });

        if (userData) {
          setUser({
            _id: userData._id,
            name: userData.name,
            email: userData.email,
            address: userData.address,
            address_solana: userData.address_solana,
            nickname: userData.nickname,
            verified: userData.verified,
            type: userData.type,
          });
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Error al obtener datos del usuario");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [addressKey, evmWalletAddress, solanaWalletAddress]);

  return {
    user,
    userId: user?._id || null,
    isLoading,
    error,
    isAuthenticated: !!user,
  };
}
