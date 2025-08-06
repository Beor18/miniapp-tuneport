"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

interface FarcasterContextType {
  isSDKLoaded: boolean;
  context: any;
  walletContext: any;
}

const FarcasterContext = createContext<FarcasterContextType>({
  isSDKLoaded: false,
  context: null,
  walletContext: null,
});

export function FarcasterProvider({ children }: { children: ReactNode }) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<any>(null);
  const [walletContext, setWalletContext] = useState<any>(null);

  useEffect(() => {
    // Cargar SDK de Farcaster Mini Apps
    const loadSDK = async () => {
      try {
        const { sdk } = await import("@farcaster/miniapp-sdk");

        // Inicializar SDK
        await sdk.actions.ready();

        // Obtener contexto de la mini app
        const appContext = await sdk.context;
        const appWalletContext = sdk.wallet.ethProvider;

        setWalletContext(appWalletContext);
        setContext(appContext);
        setIsSDKLoaded(true);

        console.log("Farcaster SDK loaded successfully:", appContext);
        console.log("Wallet context:", appWalletContext);
      } catch (error) {
        console.error("Error loading Farcaster SDK:", error);
        // Para desarrollo, marcar como listo de todas formas
        setIsSDKLoaded(true);
      }
    };

    loadSDK();
  }, []);

  return (
    <FarcasterContext.Provider value={{ isSDKLoaded, context, walletContext }}>
      {children}
    </FarcasterContext.Provider>
  );
}

export function useFarcasterMiniApp() {
  return useContext(FarcasterContext);
}
