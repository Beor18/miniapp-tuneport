"use client";

import React, {
  useContext,
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { UserRegistrationContext, MiniAppContext } from "@Src/app/providers";
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
import {
  useMiniKit,
  useIsInMiniApp,
  useAuthenticate,
} from "@coinbase/onchainkit/minikit";

// 🆕 Declarar tipo global para TypeScript
declare global {
  interface Window {
    __MINIAPP_DETECTED__?: boolean;
  }
}

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

  // 🎯 DETECCIÓN CON useEffect para evitar SSR
  const [isMiniApp, setIsMiniApp] = useState(false);

  useEffect(() => {
    // Detectar iframe después de que se monte el componente
    const isInIframe = window.parent !== window;
    setIsMiniApp(isInIframe);
    console.log("🔍 IFRAME DETECTION:", {
      isInIframe,
      userAgent: navigator.userAgent.substring(0, 50),
    });
  }, []);

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

  // 🆕 MINIKIT: Hooks para Base App según documentación oficial
  const { context: minikitContext, isFrameReady, setFrameReady } = useMiniKit();
  const { isInMiniApp } = useIsInMiniApp();
  const { signIn: minikitSignIn } = useAuthenticate();

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

  // 🚫 MINIKIT: Ya inicializado en layout.tsx (PASO 2), no duplicar aquí

  // 🎯 AUTO-REGISTRO: Estado para manejar el procesamiento
  const [isProcessingMiniApp, setIsProcessingMiniApp] = useState(false);

  // 🎯 LOG para debugging
  useEffect(() => {
    console.log("🚨 SIMPLE DETECTION:", isMiniApp);
  }, [isMiniApp]);

  // 🆕 NEYNAR API: Obtener address desde FID
  const getAddressFromFID = useCallback(
    async (fid: number): Promise<string | null> => {
      try {
        console.log("🔍 Obteniendo address desde FID:", fid);

        const response = await fetch(
          `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`,
          {
            headers: {
              Accept: "application/json",
              api_key: process.env.NEXT_PUBLIC_NEYNAR_API_KEY || "",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Neynar API error: ${response.status}`);
        }

        const data = await response.json();
        const user = data.users?.[0];

        if (user?.verified_addresses?.eth_addresses?.[0]) {
          const ethAddress = user.verified_addresses.eth_addresses[0];
          console.log("✅ Address obtenida desde Neynar:", ethAddress);
          return ethAddress;
        }

        console.log("⚠️ No se encontró address verificada para FID:", fid);
        return null;
      } catch (error) {
        console.error("❌ Error obteniendo address desde Neynar:", error);
        return null;
      }
    },
    []
  );

  // 🎯 AUTO-REGISTRO INMEDIATO: Detectar cualquier fuente de Farcaster y registrar
  useEffect(() => {
    if (!isMiniApp || verificationRef.current) return;

    // Obtener FID de cualquier fuente disponible
    const fid = userInfo?.fid || farcasterHookData?.fid || farcasterData?.fid;

    if (fid) {
      console.log(
        "🎯 FID encontrado, ejecutando auto-registro INMEDIATO:",
        fid
      );
      verificationRef.current = true;
      setIsProcessingMiniApp(true); // 🎯 Indicar que está procesando

      const immediateAutoRegister = async () => {
        try {
          // 🎯 OBTENER TODOS LOS DATOS de Farcaster (cualquier fuente)
          const farcasterInfo =
            userInfo || farcasterHookData || farcasterData || {};

          console.log("📝 Datos de Farcaster disponibles:", farcasterInfo);

          // 🎯 PASO 1: Obtener address verificada desde Neynar
          const verifiedAddress = await getAddressFromFID(fid);

          // 🎯 PASO 2: Generar nickname único
          const nickname = farcasterInfo.username
            ? `${farcasterInfo.username}${fid}`
            : `user${fid}`;

          // 🎯 PASO 3: Crear usuario con TODOS los datos (incluyendo bio)
          const userData = {
            name:
              farcasterInfo.displayName ||
              farcasterInfo.username ||
              `User ${fid}`,
            nickname,
            email: userParams.email || "",
            address: verifiedAddress || "", // Address desde Neynar
            address_solana: "", // Vacío por ahora
            type: "artist", // 🎯 SIEMPRE artist para Mini Apps
            farcaster_fid: fid,
            farcaster_username: farcasterInfo.username || "",
            farcaster_display_name: farcasterInfo.displayName || "",
            farcaster_pfp:
              (farcasterInfo as any).pfp || (farcasterInfo as any).pfpUrl || "",
            farcaster_bio: (farcasterInfo as any).bio || "", // ✅ INCLUIR BIO
            farcaster_verified: true,
          };

          console.log("📝 Auto-registrando con datos completos:", userData);

          const newUser = await createUser(userData);

          if (newUser) {
            console.log("✅ Auto-registro INMEDIATO exitoso:", newUser);
            // 🎯 FORZAR actualización del estado en Mini Apps
            setTimeout(() => {
              setUserData(newUser);
              setIsRegistered(true);
              setIsProcessingMiniApp(false); // 🎯 Completado
              console.log("🎯 Estado actualizado FORZADAMENTE:", {
                isRegistered: true,
                userData: !!newUser,
              });
            }, 100);
          } else {
            console.log("❌ Falló createUser");
            setIsRegistered(false);
            setUserData(null);
          }
        } catch (error) {
          console.error("❌ Error en auto-registro inmediato:", error);
          setIsRegistered(false);
          setUserData(null);
        } finally {
          verificationRef.current = false;
          setIsProcessingMiniApp(false); // 🎯 Asegurar que se resetee
        }
      };

      immediateAutoRegister();
    } else {
      console.log("⏳ Esperando datos de Farcaster...");
    }
  }, [
    isMiniApp,
    userInfo,
    farcasterHookData,
    farcasterData,
    getAddressFromFID,
    userParams.email,
    setUserData,
    setIsRegistered,
  ]);

  // 🚫 FUNCIÓN DUPLICADA ELIMINADA: getAddressFromFID ya está definida arriba

  // 🆕 FARCASTER AUTO-REGISTER: Función simplificada usando Neynar (BACKUP)
  const autoRegisterFarcasterUser = useCallback(async () => {
    if (!farcasterData?.fid) {
      console.log("❌ No hay FID disponible en backup function");
      return null;
    }

    try {
      console.log(
        "🎨 Auto-registrando usuario de Farcaster con FID:",
        farcasterData.fid
      );

      // 🎯 PASO 1: Obtener address verificada desde Neynar
      const verifiedAddress = await getAddressFromFID(farcasterData.fid);

      if (!verifiedAddress) {
        console.log(
          "⚠️ No se pudo obtener address verificada, usando address vacía"
        );
      }

      // 🎯 PASO 2: Generar nickname único usando FID
      const nickname = farcasterData.username
        ? `${farcasterData.username}${farcasterData.fid}`
        : `user${farcasterData.fid}`;

      // 🎯 PASO 3: Crear usuario con todos los datos
      const userData = {
        name:
          farcasterData.displayName ||
          farcasterData.username ||
          `User ${farcasterData.fid}`,
        nickname,
        email: userParams.email || "",
        address: verifiedAddress || "", // Address desde Neynar
        address_solana: "", // Vacío por ahora
        type: "artist", // 🎯 SIEMPRE artist para usuarios de Farcaster
        farcaster_fid: farcasterData.fid,
        farcaster_username: farcasterData.username || "",
        farcaster_display_name: farcasterData.displayName || "",
        farcaster_pfp: farcasterData.pfp || "",
        farcaster_bio: farcasterData.bio || "",
        farcaster_verified: true,
      };

      console.log("📝 Datos para registrar:", userData);

      const newUser = await createUser(userData);

      if (newUser) {
        console.log("✅ Usuario auto-registrado exitosamente:", newUser);
        setUserData(newUser);
        setIsRegistered(true);
        return newUser;
      } else {
        console.log("❌ Falló createUser");
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
    farcasterData,
    userParams.email,
    getAddressFromFID,
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
          // 🆕 AUTO-REGISTER: Si no existe usuario y estamos en Mini App, auto-registrar
          if (!user && isMiniApp && farcasterData?.fid) {
            const newUser = await autoRegisterFarcasterUser();
            if (newUser) {
              userDataCache.set(addressKey, newUser);
              verificationPromises.delete(addressKey);
              return newUser;
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
      isMiniApp,
      farcasterData,
      autoRegisterFarcasterUser,
    ]
  );

  // 🚫 AUTO-LOGIN ELIMINADO: Ya no necesitamos login, vamos directo al registro con FID

  // 🆕 OCULTAR MODAL PRIVY: Effect para ocultar modals solo en Base App
  useEffect(() => {
    // Solo aplicar en Base App (detectar por user agent)
    const isInIframe =
      typeof window !== "undefined" && window.parent !== window;
    const hasUserAgent =
      typeof navigator !== "undefined" && navigator.userAgent;
    const isBaseMiniApp =
      isInIframe &&
      hasUserAgent &&
      (navigator.userAgent.includes("BaseMiniApp") ||
        navigator.userAgent.includes("Base"));

    if (isBaseMiniApp) {
      // Interceptar y ocultar cualquier modal de Privy que aparezca solo en Base App
      const hidePrivyModals = () => {
        const privyModal = document.querySelector("[data-privy-modal]");
        const privyOverlay = document.querySelector(".privy-modal");
        const privyDialog = document.querySelector('[role="dialog"]');

        if (privyModal) {
          (privyModal as HTMLElement).style.display = "none";
          console.log("🚫 Modal Privy ocultado en Base App");
        }
        if (privyOverlay) {
          (privyOverlay as HTMLElement).style.display = "none";
        }
        if (
          privyDialog &&
          privyDialog.textContent?.includes("Log in or sign up")
        ) {
          (privyDialog as HTMLElement).style.display = "none";
          console.log(
            "🚫 Dialog Privy 'Log in or sign up' ocultado en Base App"
          );
        }
      };

      // Observar cambios en el DOM para detectar modals
      const observer = new MutationObserver(hidePrivyModals);
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      // Ejecutar inmediatamente por si ya existe
      hidePrivyModals();

      // Cleanup
      return () => {
        observer.disconnect();
      };
    }
  }, []);

  // 🚫 AUTO-REGISTRO COMPLEJO ELIMINADO: Ya tenemos auto-registro inmediato con FID

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

  // 🆕 RENDER LOGIC SIMPLIFICADO: Mini Apps = UX directo sin UI
  if (isMiniApp) {
    console.log("🎯 Mini App render:", {
      isRegistered,
      userData: !!userData,
      isProcessingMiniApp,
      isMiniApp,
    });

    // En Mini Apps, SOLO mostrar el user pill cuando esté registrado
    if (isRegistered === true && userData) {
      console.log("✅ Mostrando CustomUserPill en Mini App");
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

    // Mientras procesa el auto-registro, no mostrar nada
    console.log("⏳ Mini App procesando o sin datos, no mostrar UI");
    return null;
  }

  // RESTO DEL RENDER LOGIC PARA ENTORNOS NORMALES (no Mini Apps)
  console.log("🚨 RENDER - Checks:", {
    isReady,
    isMiniApp,
    hasWalletConnected,
    isRegistered,
  });

  // if (!isReady) {
  //   console.log("🚨 isReady=false, isMiniApp:", isMiniApp);
  //   // En Mini Apps: ocultar "Join Now" - conexión automática
  //   if (isMiniApp) {
  //     console.log("🚨 RETORNANDO NULL por !isReady + isMiniApp");
  //     return null; // ✅ Sin fricción
  //   }

  //   // En entornos normales: mostrar botón loading
  //   return (
  //     <Button
  //       disabled
  //       className="w-auto min-w-[70px] sm:min-w-[70px] h-9 border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-200 text-xs sm:text-sm focus:ring-zinc-600 transition-colors gap-2 flex-shrink-0 relative z-10 wallet-connector-mobile"
  //       style={{ display: "flex", visibility: "visible" }}
  //     >
  //       <Wallet className="h-3.5 w-3.5 flex-shrink-0 animate-pulse" />
  //       <span className="text-xs text-zinc-400 whitespace-nowrap">
  //         Join Now
  //       </span>
  //     </Button>
  //   );
  // }

  // if (!hasWalletConnected) {
  //   console.log("🚨 hasWalletConnected=false, isMiniApp:", isMiniApp);
  //   // En Mini Apps: ocultar "Join Now" - conexión automática
  //   if (isMiniApp) {
  //     console.log("🚨 RETORNANDO NULL por !hasWalletConnected + isMiniApp");
  //     return null; // ✅ Sin fricción
  //   }

  //   // En entornos normales: mostrar botón Join Now
  //   return (
  //     <Button
  //       onClick={login}
  //       className="w-auto min-w-[70px] sm:min-w-[70px] h-9 border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-200 text-xs sm:text-sm focus:ring-zinc-600 transition-colors gap-2 flex-shrink-0 relative z-10 wallet-connector-mobile"
  //       style={{ display: "flex", visibility: "visible" }}
  //     >
  //       <Wallet className="h-3.5 w-3.5 flex-shrink-0" />
  //       <span className="text-xs text-zinc-400 whitespace-nowrap">
  //         Join Now
  //       </span>
  //     </Button>
  //   );
  // }

  // if (isRegistered === null) {
  //   return null;
  // }

  // 🆕 OCULTAR RegistrationForm solo en Mini Apps, mostrar en entornos normales
  // if (isRegistered === false) {
  //   // En Mini Apps: ocultar formulario (auto-registro en curso)
  //   if (isMiniApp) {
  //     return null; // ✅ UX sin fricción en Mini Apps
  //   }

  //   // En entornos normales: mostrar formulario
  //   return (
  //     <RegistrationForm
  //       walletAddressEvm={userParams.evm || ""}
  //       walletAddressSolana={userParams.solana || ""}
  //       email={userParams.email}
  //       farcasterData={
  //         farcasterConnected && farcasterData?.fid
  //           ? {
  //               fid: farcasterData.fid,
  //               username: farcasterData.username || "",
  //               displayName: farcasterData.displayName || "",
  //               pfp: farcasterData.pfp || "",
  //               bio: farcasterData.bio || "",
  //             }
  //           : null
  //       }
  //     />
  //   );
  // }

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
