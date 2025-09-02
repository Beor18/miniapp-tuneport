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
    console.log(
      "🔥 FarcasterProvider: ALWAYS TRYING AUTO-LOGIN - Testing mode"
    );

    // 🔥 FORCE MODE: Siempre intentar auto-login para testing
    const isMiniApp = true; // Forzamos true para testing
    console.log("🎯 FarcasterProvider - FORCED MODE:", { isMiniApp });

    // 🎯 AUTO-LOGIN según documentación oficial de Privy
    const login = async () => {
      console.log("🔍 FarcasterProvider - LOGIN CHECK:", {
        ready,
        authenticated,
        isAutoLoggingIn,
        shouldTryLogin: ready && !authenticated && !isAutoLoggingIn,
      });

      if (ready && !authenticated && !isAutoLoggingIn) {
        try {
          console.log("🚀 FarcasterProvider: INICIANDO AUTO-LOGIN");
          setIsAutoLoggingIn(true);

          // Importar dinámicamente el SDK de Farcaster
          const miniappSdk = await import("@farcaster/miniapp-sdk");
          console.log("📦 FarcasterProvider: SDK importado", miniappSdk);

          // Llamar ready() primero para indicar que la UI está lista
          await miniappSdk.default.actions.ready();
          console.log(
            "✅ FarcasterProvider: miniappSdk.actions.ready() llamado"
          );

          // Initialize a new login attempt to get a nonce for the Farcaster wallet to sign
          console.log("🔑 FarcasterProvider: Obteniendo nonce...");
          const { nonce } = await initLoginToMiniApp();
          console.log("✅ FarcasterProvider: Nonce obtenido:", nonce);

          // Request a signature from Farcaster
          console.log("✍️ FarcasterProvider: Solicitando signature...");
          const result = await miniappSdk.default.actions.signIn({ nonce });
          console.log("✅ FarcasterProvider: Signature obtenida:", result);

          // Send the received signature from Farcaster to Privy for authentication
          console.log("🔐 FarcasterProvider: Enviando a Privy...");
          await loginToMiniApp({
            message: result.message,
            signature: result.signature,
          });

          console.log("🎉 FarcasterProvider: AUTO-LOGIN EXITOSO");
        } catch (error) {
          console.error("💥 FarcasterProvider: ERROR EN AUTO-LOGIN:", error);
        } finally {
          setIsAutoLoggingIn(false);
        }
      } else {
        console.log("⏭️ FarcasterProvider: Saltando auto-login");
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
