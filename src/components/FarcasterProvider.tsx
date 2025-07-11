"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { sdk } from "@farcaster/miniapp-sdk";

interface FarcasterContextType {
  isSDKLoaded: boolean;
  context: any;
  authData: any;
}

const FarcasterContext = createContext<FarcasterContextType>({
  isSDKLoaded: false,
  context: null,
  authData: null,
});

export function useFarcasterMiniApp() {
  return useContext(FarcasterContext);
}

interface FarcasterProviderProps {
  children: ReactNode;
}

export function FarcasterProvider({ children }: FarcasterProviderProps) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<any>(null);
  const [authData, setAuthData] = useState<any>(null);

  useEffect(() => {
    const initializeSDK = async () => {
      try {
        // Verificar si estamos en un entorno de Farcaster
        if (!sdk || typeof sdk.actions?.ready !== "function") {
          console.log(
            "Not in Farcaster environment - SDK ready function not available"
          );
          setIsSDKLoaded(true);
          return;
        }

        // Llamar a ready() cuando la interfaz esté cargada
        await sdk.actions.ready();

        // Obtener contexto de forma segura
        try {
          const contextData = await sdk.context;
          setContext(contextData);
        } catch (err) {
          console.log("Context not available:", err);
        }

        // Obtener datos de wallet de forma segura
        try {
          if (sdk.wallet) {
            setAuthData({ walletAvailable: true });
          }
        } catch (err) {
          console.log("Wallet not available:", err);
        }

        setIsSDKLoaded(true);
        console.log("Farcaster SDK initialized successfully");
      } catch (error) {
        console.error("Error initializing Farcaster SDK:", error);
        // Marcar como cargado incluso si falla para no bloquear la app
        setIsSDKLoaded(true);
      }
    };

    if (typeof window !== "undefined") {
      initializeSDK();
    }
  }, []);

  const value: FarcasterContextType = {
    isSDKLoaded,
    context,
    authData,
  };

  return (
    <FarcasterContext.Provider value={value}>
      {children}
    </FarcasterContext.Provider>
  );
}
