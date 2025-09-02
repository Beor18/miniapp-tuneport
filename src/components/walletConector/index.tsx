"use client";

import React, {
  useContext,
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { UserRegistrationContext } from "@Src/app/providers";
import RegistrationForm from "@Src/components/registrationForm";
import { Button } from "@Src/ui/components/ui/button";
import { Wallet } from "lucide-react";

// Importar desde nuestro adaptador de Privy
import { useAppKitAccount, useSolanaWallets } from "@Src/lib/privy";
import { checkUser, getUserData } from "@Src/app/actions/checkUser.actions";
import { createUser } from "@Src/app/actions/createUser.actions";
import { useFarcaster } from "@Src/lib/hooks/useFarcaster";

// Solana
// Eliminamos la importación de WalletMultiButton y useWallet
// import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
// import { useWallet } from "@solana/wallet-adapter-react";
import { usePrivy } from "@privy-io/react-auth";
import { useFarcasterMiniApp } from "../FarcasterProvider";
import { CustomUserPill } from "../customUserPill";
import { useLocale } from "next-intl";

// 🆕 MiniKit para Base App según documentación oficial
import { useMiniKit } from "@coinbase/onchainkit/minikit";

// Cache global para evitar re-verificaciones innecesarias
const userDataCache = new Map<string, any>();
const verificationPromises = new Map<string, Promise<any>>();

// Hook optimizado que previene re-renders durante navegación
function useStableAuth() {
  const { ready, authenticated } = usePrivy();
  const { ready: solanaReady } = useSolanaWallets();

  return {
    isReady: ready, // Simplificamos - solo dependemos de Privy ready
    isAuthenticated: authenticated && ready,
  };
}

export default function WalletConnector() {
  const { isRegistered, setIsRegistered, userData, setUserData } = useContext(
    UserRegistrationContext
  );

  const { isReady, isAuthenticated } = useStableAuth();
  const locale = useLocale();
  const verificationRef = useRef<boolean>(false);
  const addressKeyRef = useRef<string>("");

  // Usar nuestro adaptador de Privy para información general de la cuenta
  const {
    address,
    isConnected,
    caipAddress,
    status,
    embeddedWalletInfo,
    evmWalletAddress,
    solanaWalletAddress,
    wallets,
    // 🆕 FARCASTER: Datos de Farcaster
    farcasterConnected,
    farcasterData,
  } = useAppKitAccount();

  // Obtener específicamente las wallets de Solana para mejor detección
  const { wallets: solanaWallets, ready: solanaReady } = useSolanaWallets();

  // Privy original para funciones como login/logout
  const { login, logout, user } = usePrivy();

  // 🆕 FARCASTER: Hooks del proyecto para manejo completo de Farcaster
  const { isSDKLoaded, context, userInfo } = useFarcasterMiniApp();
  const {
    isConnected: farcasterHookConnected,
    farcasterData: farcasterHookData,
  } = useFarcaster();

  // 🆕 MINIKIT: Hooks para Base App
  const { context: minikitContext, isFrameReady, setFrameReady } = useMiniKit();

  // Usamos las direcciones específicas para cada cadena
  const userAddressEvm = evmWalletAddress;
  const userAddressSolana = solanaWalletAddress;
  const userEmail =
    user?.email?.address ||
    embeddedWalletInfo?.user?.email ||
    user?.google?.email ||
    null;

  // Datos de usuario memoizados (incluyendo campos opcionales)
  const userParams = useMemo(
    () => ({
      evm: evmWalletAddress,
      solana: solanaWalletAddress,
      email: user?.email?.address || user?.google?.email || null,
      farcaster_username: farcasterData?.username || null,
      nickname: userData?.nickname || null, // Si ya tenemos userData, usar ese nickname
    }),
    [
      evmWalletAddress,
      solanaWalletAddress,
      user?.email?.address,
      user?.google?.email,
      farcasterData?.username,
      userData?.nickname,
    ]
  );

  // Mantener walletAddresses para compatibilidad
  const walletAddresses = useMemo(
    () => ({
      evm: userParams.evm,
      solana: userParams.solana,
      email: userParams.email,
    }),
    [userParams.evm, userParams.solana, userParams.email]
  );

  // Estado de conexión memoizado
  const hasWalletConnected = useMemo(
    () =>
      isConnected &&
      (!!address || !!walletAddresses.solana || !!walletAddresses.evm),
    [isConnected, address, walletAddresses.solana, walletAddresses.evm]
  );

  // 🆕 MINIKIT: Inicializar frame cuando esté disponible
  useEffect(() => {
    const isInIframe =
      typeof window !== "undefined" && window.parent !== window;
    if (isInIframe && !isFrameReady) {
      console.log("🎯 Inicializando MiniKit frame...");
      setFrameReady();
    }
  }, [isFrameReady, setFrameReady]);

  // 🆕 DETECCIÓN COMPLETA: Base App (MiniKit) + Farcaster App (SDK)
  const isInFarcasterMiniApp = useMemo(() => {
    const isInIframe =
      typeof window !== "undefined" && window.parent !== window;
    const hasUserAgent =
      typeof navigator !== "undefined" && navigator.userAgent;

    // Detectar Base App con MiniKit (método oficial)
    const isBaseMiniApp = isInIframe && (minikitContext || isFrameReady);

    // Detectar Base App por user agent (fallback)
    const isBaseFallback =
      isInIframe &&
      hasUserAgent &&
      (navigator.userAgent.includes("BaseMiniApp") ||
        navigator.userAgent.includes("Base"));

    // Detectar Farcaster por SDK
    const isFarcasterMiniApp = isInIframe && isSDKLoaded;

    const result = isBaseMiniApp || isBaseFallback || isFarcasterMiniApp;

    console.log("🔍 Mini App Detection:", {
      isInIframe,
      isBaseMiniApp: !!isBaseMiniApp,
      isBaseFallback: !!isBaseFallback,
      isFarcasterMiniApp: !!isFarcasterMiniApp,
      isSDKLoaded,
      minikitContext: !!minikitContext,
      isFrameReady,
      userAgent: navigator?.userAgent?.substring(0, 100) + "...",
      result,
    });

    return result;
  }, [minikitContext, isFrameReady, isSDKLoaded]);

  // 🆕 FARCASTER AUTO-REGISTER: Función usando lógica existente del proyecto
  const autoRegisterFarcasterUser = useCallback(async () => {
    if (!farcasterConnected || !farcasterData) return null;

    try {
      console.log("🎨 Auto-registrando usuario de Farcaster como artist...");

      // Generar nickname único usando FID (siempre único)
      const nickname = farcasterData.username
        ? `${farcasterData.username}${farcasterData.fid}`
        : `user${farcasterData.fid}`;

      const userData = {
        name:
          farcasterData.displayName ||
          farcasterData.username ||
          `User ${farcasterData.fid}`,
        nickname,
        email: userParams.email || "",
        address: userParams.evm || "",
        address_solana: userParams.solana || "",
        type: "artist", // 🎯 SIEMPRE artist para usuarios de Farcaster
        farcaster_fid: farcasterData.fid || undefined,
        farcaster_username: farcasterData.username || undefined,
        farcaster_display_name: farcasterData.displayName || undefined,
        farcaster_pfp: farcasterData.pfp || undefined,
        farcaster_bio: farcasterData.bio || "",
        farcaster_verified: true,
      };

      const newUser = await createUser(userData);

      if (newUser) {
        console.log("✅ Usuario auto-registrado:", newUser);
        setUserData(newUser);
        setIsRegistered(true);
        return newUser;
      } else {
        setIsRegistered(false);
        setUserData(null);
        return null;
      }
    } catch (error) {
      console.error("❌ Error en auto-registro:", error);
      setIsRegistered(false);
      setUserData(null);
      return null;
    }
  }, [
    farcasterConnected,
    farcasterData,
    userParams,
    setUserData,
    setIsRegistered,
  ]);

  // Función de verificación memoizada y con cache
  const verifyUser = useCallback(
    async (addressKey: string) => {
      // Verificar cache primero
      if (userDataCache.has(addressKey)) {
        const cachedData = userDataCache.get(addressKey);
        if (cachedData) {
          setIsRegistered(true);
          setUserData(cachedData);
        } else {
          setIsRegistered(false);
          setUserData(null);
        }
        return;
      }

      // Verificar si ya hay una verificación en curso
      if (verificationPromises.has(addressKey)) {
        try {
          const result = await verificationPromises.get(addressKey);
          if (result) {
            setIsRegistered(true);
            setUserData(result);
          } else {
            setIsRegistered(false);
            setUserData(null);
          }
        } catch (error) {
          console.error("Error in pending verification:", error);
          setIsRegistered(false);
          setUserData(null);
        }
        return;
      }

      // Crear nueva verificación
      const verificationPromise = getUserData({
        address: userParams.evm || undefined,
        address_solana: userParams.solana || undefined,
        farcaster_username: userParams.farcaster_username || undefined,
        nickname: userParams.nickname || undefined,
      })
        .then(async (user: any) => {
          // 🆕 FARCASTER AUTO-REGISTER: Si no existe usuario pero estamos en Mini App, registrar automáticamente
          if (!user && isInFarcasterMiniApp) {
            console.log(
              "🎯 Usuario no encontrado en Mini App. Intentando auto-registro..."
            );

            // Esperar un poco para que los datos de Farcaster estén disponibles
            if (farcasterConnected && farcasterData) {
              console.log(
                "✅ Datos de Farcaster disponibles, auto-registrando..."
              );
              const newUser = await autoRegisterFarcasterUser();
              if (newUser) {
                userDataCache.set(addressKey, newUser);
                verificationPromises.delete(addressKey);
                return newUser;
              }
            } else {
              console.log("⏳ Esperando datos de Farcaster...", {
                farcasterConnected,
                farcasterData: !!farcasterData,
              });
            }
          }

          // Guardar en cache
          userDataCache.set(addressKey, user);
          verificationPromises.delete(addressKey);
          return user;
        })
        .catch((error: any) => {
          console.error("Error getting user data:", error);
          userDataCache.set(addressKey, null);
          verificationPromises.delete(addressKey);
          return null;
        });

      verificationPromises.set(addressKey, verificationPromise);

      try {
        const result = await verificationPromise;
        if (result) {
          setIsRegistered(true);
          setUserData(result);
        } else {
          setIsRegistered(false);
          setUserData(null);
        }
      } catch (error) {
        setIsRegistered(false);
        setUserData(null);
      }
    },
    [
      userParams.evm,
      userParams.solana,
      userParams.farcaster_username,
      userParams.nickname,
      setIsRegistered,
      setUserData,
      isInFarcasterMiniApp,
      farcasterConnected,
      farcasterData,
      autoRegisterFarcasterUser,
    ]
  );

  // 🆕 FARCASTER AUTO-LOGIN: Effect para auto-login automático cuando se detecta Mini App
  useEffect(() => {
    if (isReady && !isAuthenticated && isInFarcasterMiniApp) {
      const attemptFarcasterAutoLogin = async () => {
        try {
          console.log(
            "🎯 Mini App de Farcaster detectada. Iniciando auto-login..."
          );
          // Activar login automático sin mostrar UI
          await login();
          console.log("🎉 Auto-login completado");
        } catch (error) {
          console.log("ℹ️ Auto-login falló:", error);
          // Fallar silenciosamente - el usuario puede conectar manualmente
        }
      };

      // Delay mínimo para asegurar que el contexto esté cargado
      const timeoutId = setTimeout(attemptFarcasterAutoLogin, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [isReady, isAuthenticated, isInFarcasterMiniApp, login]);

  // Effect para verificación - altamente optimizado
  useEffect(() => {
    if (!isReady) return;

    const currentAddressKey = `${userParams.evm || ""}-${
      userParams.solana || ""
    }-${userParams.farcaster_username || ""}-${userParams.nickname || ""}`;

    if (hasWalletConnected) {
      // Solo verificar si cambió algún parámetro Y hay al menos un parámetro válido
      const hasValidParam =
        userParams.evm ||
        userParams.solana ||
        userParams.farcaster_username ||
        userParams.nickname;

      if (
        hasValidParam &&
        addressKeyRef.current !== currentAddressKey &&
        !verificationRef.current
      ) {
        verificationRef.current = true;
        addressKeyRef.current = currentAddressKey;

        verifyUser(currentAddressKey).finally(() => {
          verificationRef.current = false;
        });
      }
    } else {
      // Reset cuando no hay wallet
      if (addressKeyRef.current !== "") {
        setIsRegistered(null);
        setUserData(null);
        addressKeyRef.current = "";
      }
    }
  }, [
    isReady,
    hasWalletConnected,
    userParams.evm,
    userParams.solana,
    userParams.farcaster_username,
    userParams.nickname,
    verifyUser,
    setIsRegistered,
    setUserData,
  ]);

  // Función de logout simplificada SIN interfaz con el player
  const handleLogout = useCallback(() => {
    // Solo limpiar cache y referencias del wallet
    userDataCache.clear();
    verificationPromises.clear();
    verificationRef.current = false;
    addressKeyRef.current = "";

    // Logout
    logout();
  }, [logout]);

  // Render logic - optimizado para auto-login de Farcaster
  if (!isReady) {
    // En Mini Apps de Farcaster, no mostrar nada durante la inicialización
    if (isInFarcasterMiniApp) {
      return null;
    }

    // Para entornos normales, mostrar botón de carga
    return (
      <Button
        disabled
        className="w-auto min-w-[70px] sm:min-w-[70px] h-9 border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-200 text-xs sm:text-sm focus:ring-zinc-600 transition-colors gap-2 flex-shrink-0 relative z-10 wallet-connector-mobile"
        style={{ display: "flex", visibility: "visible" }}
      >
        <Wallet className="h-3.5 w-3.5 flex-shrink-0 animate-pulse" />
        <span className="text-xs text-zinc-400 whitespace-nowrap">
          Join Now
        </span>
      </Button>
    );
  }

  if (!hasWalletConnected) {
    // En Mini Apps de Farcaster, no mostrar botón Join Now - debe ser automático
    if (isInFarcasterMiniApp) {
      return null;
    }

    // Para entornos normales, mostrar botón Join Now
    return (
      <Button
        onClick={login}
        className="w-auto min-w-[70px] sm:min-w-[70px] h-9 border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-200 text-xs sm:text-sm focus:ring-zinc-600 transition-colors gap-2 flex-shrink-0 relative z-10 wallet-connector-mobile"
        style={{ display: "flex", visibility: "visible" }}
      >
        <Wallet className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="text-xs text-zinc-400 whitespace-nowrap">
          Join Now
        </span>
      </Button>
    );
  }

  // NO mostrar nada si no sabemos el estado aún
  if (isRegistered === null) {
    return null;
  }

  // Solo mostrar RegistrationForm cuando estamos 100% seguros de que NO está registrado
  // 🆕 FARCASTER AUTO-REGISTER: NUNCA mostrar RegistrationForm para usuarios de Mini App
  if (isRegistered === false) {
    // Si estamos en Mini App (Base/Farcaster), NO mostrar formulario - debe auto-registrarse silenciosamente
    if (isInFarcasterMiniApp) {
      return null; // ✅ UX directo sin formularios
    }

    // Para usuarios regulares (no Farcaster), mostrar formulario normal
    return (
      <RegistrationForm
        walletAddressEvm={userParams.evm || ""}
        walletAddressSolana={userParams.solana || ""}
        email={userParams.email}
        farcasterData={
          farcasterConnected && farcasterData?.fid
            ? {
                fid: farcasterData.fid,
                username: farcasterData.username || "",
                displayName: farcasterData.displayName || "",
                pfp: farcasterData.pfp || "",
                bio: farcasterData.bio || "",
              }
            : null
        }
      />
    );
  }

  return (
    <div className="flex items-center gap-3">
      <CustomUserPill
        handleLogout={handleLogout}
        profile={userData}
        locale={locale}
        userNickname={userData?.nickname || null}
      />
    </div>
  );
}
