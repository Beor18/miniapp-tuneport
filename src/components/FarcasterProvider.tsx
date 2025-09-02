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
  tipContext: any;
  userInfo: {
    fid?: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
  } | null;
}

const FarcasterContext = createContext<FarcasterContextType>({
  isSDKLoaded: false,
  context: null,
  walletContext: null,
  tipContext: null,
  userInfo: null,
});

export function FarcasterProvider({ children }: { children: ReactNode }) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<any>(null);
  const [walletContext, setWalletContext] = useState<any>(null);
  const [tipContext, setTipContext] = useState<any>(null);
  const [userInfo, setUserInfo] =
    useState<FarcasterContextType["userInfo"]>(null);

  useEffect(() => {
    // Cargar SDK de Farcaster Mini Apps
    const loadSDK = async () => {
      try {
        const { sdk } = await import("@farcaster/miniapp-sdk");

        // Inicializar SDK
        await sdk.actions.ready();

        // Obtener contexto de la mini app
        const appContext = await sdk.context;
        const actionContext = await sdk.actions;
        const appWalletContext = await sdk.wallet.getEthereumProvider();

        setWalletContext(appWalletContext);
        setContext(appContext);
        setTipContext(actionContext);

        // Extraer información del usuario del contexto
        if (appContext?.user) {
          const userInfoData = {
            fid: appContext.user.fid,
            username: appContext.user.username,
            displayName: appContext.user.displayName,
            pfpUrl: appContext.user.pfpUrl,
          };
          setUserInfo(userInfoData);

          console.log(
            "🎯 FarcasterProvider: User info extracted",
            userInfoData
          );
        } else {
          console.log("⚠️ FarcasterProvider: No user info in context");
        }

        setIsSDKLoaded(true);

        console.log("✅ Farcaster SDK loaded successfully:", appContext);
        console.log("✅ Wallet context:", appWalletContext);
        console.log("✅ User info:", appContext?.user);
      } catch (error) {
        console.error("Error loading Farcaster SDK:", error);
        // Para desarrollo, marcar como listo de todas formas
        setIsSDKLoaded(true);
      }
    };

    loadSDK();
  }, []);

  return (
    <FarcasterContext.Provider
      value={{ isSDKLoaded, context, walletContext, tipContext, userInfo }}
    >
      {children}
    </FarcasterContext.Provider>
  );
}

export function useFarcasterMiniApp() {
  return useContext(FarcasterContext);
}
