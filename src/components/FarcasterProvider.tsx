"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useLoginToMiniApp } from "@privy-io/react-auth/farcaster";

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
  isAutoLoggingIn: boolean;
}

const FarcasterContext = createContext<FarcasterContextType>({
  isSDKLoaded: false,
  context: null,
  walletContext: null,
  tipContext: null,
  userInfo: null,
  isAutoLoggingIn: false,
});

export function FarcasterProvider({ children }: { children: ReactNode }) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<any>(null);
  const [walletContext, setWalletContext] = useState<any>(null);
  const [tipContext, setTipContext] = useState<any>(null);
  const [userInfo, setUserInfo] =
    useState<FarcasterContextType["userInfo"]>(null);
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);

  // 🎯 MINIKIT: Autenticación automática según documentación oficial de Privy
  const { ready, authenticated } = usePrivy();
  const { initLoginToMiniApp, loginToMiniApp } = useLoginToMiniApp();

  useEffect(() => {
    // Detectar si estamos en una Mini App
    const isMiniApp = typeof window !== "undefined" && window.parent !== window;

    if (!isMiniApp) {
      console.log("🎯 FarcasterProvider: No es Mini App, modo normal");
      setIsSDKLoaded(true);
      return;
    }

    // 🎯 AUTO-LOGIN según documentación oficial de Privy
    const login = async () => {
      if (ready && !authenticated && !isAutoLoggingIn) {
        try {
          console.log(
            "🎯 FarcasterProvider: Iniciando auto-login según docs oficiales"
          );
          setIsAutoLoggingIn(true);

          // Importar dinámicamente el SDK de Farcaster
          const miniappSdk = await import("@farcaster/miniapp-sdk");

          // Llamar ready() primero para indicar que la UI está lista
          await miniappSdk.default.actions.ready();
          console.log(
            "🎯 FarcasterProvider: miniappSdk.actions.ready() llamado"
          );

          // Initialize a new login attempt to get a nonce for the Farcaster wallet to sign
          const { nonce } = await initLoginToMiniApp();
          console.log("🎯 FarcasterProvider: Nonce obtenido:", nonce);

          // Request a signature from Farcaster
          const result = await miniappSdk.default.actions.signIn({ nonce });
          console.log("🎯 FarcasterProvider: Signature obtenida:", result);

          // Send the received signature from Farcaster to Privy for authentication
          await loginToMiniApp({
            message: result.message,
            signature: result.signature,
          });

          console.log(
            "✅ FarcasterProvider: Auto-login exitoso según docs oficiales"
          );
        } catch (error) {
          console.error("❌ FarcasterProvider: Error en auto-login:", error);
        } finally {
          setIsAutoLoggingIn(false);
        }
      }
    };

    if (ready) {
      if (!authenticated) {
        login();
      } else {
        console.log("✅ FarcasterProvider: Usuario ya autenticado");
      }
      setIsSDKLoaded(true);
    }
  }, [
    ready,
    authenticated,
    isAutoLoggingIn,
    initLoginToMiniApp,
    loginToMiniApp,
  ]);

  return (
    <FarcasterContext.Provider
      value={{
        isSDKLoaded,
        context,
        walletContext,
        tipContext,
        userInfo,
        isAutoLoggingIn,
      }}
    >
      {children}
    </FarcasterContext.Provider>
  );
}

export function useFarcasterMiniApp() {
  return useContext(FarcasterContext);
}
