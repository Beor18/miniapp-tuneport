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
    // 🎯 MINIKIT: No cargar Farcaster SDK, solo marcar como listo
    // MiniKit + Privy manejan toda la autenticación automáticamente
    console.log("🎯 FarcasterProvider: Modo MiniKit - No cargar SDK");
    setIsSDKLoaded(true);
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
