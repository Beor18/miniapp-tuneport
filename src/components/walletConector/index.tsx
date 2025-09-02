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

// 🎯 MINIKIT: Solo hooks necesarios
import { useSolanaWallets } from "@Src/lib/privy";
import { checkUser, getUserData } from "@Src/app/actions/checkUser.actions";
import { createUser } from "@Src/app/actions/createUser.actions";
import { useFarcaster } from "@Src/lib/hooks/useFarcaster";
import { useAppKitAccount } from "@Src/lib/privy";

// Solana
// Eliminamos la importación de WalletMultiButton y useWallet
// import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
// import { useWallet } from "@solana/wallet-adapter-react";
import { usePrivy } from "@privy-io/react-auth";
import { useFarcasterMiniApp } from "../FarcasterProvider";
import { CustomUserPill } from "../customUserPill";
import { useLocale } from "next-intl";

// Tipos globales removidos - no se usan en el nuevo flujo oficial

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
  // Privy original para funciones como login/logout
  const { login, logout, user } = usePrivy();

  // 🎯 MINIKIT: Usar hooks simplificados
  const {
    address,
    isConnected,
    evmWalletAddress,
    solanaWalletAddress,
    wallets,
    embeddedWalletInfo,
  } = useAppKitAccount();
  const { isMiniApp } = useContext(MiniAppContext);
  const farcasterConnected = !!user?.farcaster;
  const farcasterData = user?.farcaster;

  const { isReady, isAuthenticated } = useStableAuth();
  const locale = useLocale();
  const verificationRef = useRef<boolean>(false);
  const addressKeyRef = useRef<string>("");

  // Obtener específicamente las wallets de Solana para mejor detección
  const { wallets: solanaWallets, ready: solanaReady } = useSolanaWallets();

  // 🎯 MINIKIT: Solo usar datos de Privy (farcasterData viene de Privy automáticamente)
  // Remover hooks innecesarios que causan conflictos

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

  // Estado de conexión simplificado - useUnifiedAccount ya maneja Mini Apps
  const hasWalletConnected = useMemo(
    () =>
      isConnected && (!!address || !!solanaWalletAddress || !!evmWalletAddress),
    [isConnected, address, solanaWalletAddress, evmWalletAddress]
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

  // 🎯 AUTO-REGISTRO: Solo cuando Privy ya está autenticado (no interferir con Privy login)
  useEffect(() => {
    if (!isMiniApp || !isAuthenticated || verificationRef.current) {
      return;
    }

    // Solo usar datos de Privy (simplificado)
    const fid = farcasterData?.fid;

    if (fid && isAuthenticated) {
      console.log(
        "✅ MiniKit: Privy autenticado, ejecutando auto-registro:",
        fid
      );
      verificationRef.current = true;
      setIsProcessingMiniApp(true);

      const registerAfterPrivyAuth = async () => {
        try {
          const verifiedAddress = await getAddressFromFID(fid);
          const nickname = farcasterData.username
            ? `${farcasterData.username}${fid}`
            : `user${fid}`;

          const userData = {
            name:
              farcasterData.displayName ||
              farcasterData.username ||
              `User ${fid}`,
            nickname,
            email: userParams.email || "",
            address: verifiedAddress || "",
            address_solana: "",
            type: "artist",
            farcaster_fid: fid,
            farcaster_username: farcasterData.username || "",
            farcaster_display_name: farcasterData.displayName || "",
            farcaster_pfp: farcasterData.pfp || "",
            farcaster_bio: farcasterData.bio || "",
            farcaster_verified: true,
          };

          const newUser = await createUser(userData);
          if (newUser) {
            setUserData(newUser);
            setIsRegistered(true);
            console.log("✅ MiniKit: Auto-registro exitoso");
          }
        } catch (error) {
          console.error("❌ MiniKit: Error en auto-registro:", error);
        } finally {
          verificationRef.current = false;
          setIsProcessingMiniApp(false);
        }
      };

      registerAfterPrivyAuth();
    }
  }, [isMiniApp, isAuthenticated, farcasterData]);

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
    // Usar detección centralizada del contexto, no duplicar
    const hasUserAgent =
      typeof navigator !== "undefined" && navigator.userAgent;
    const isBaseMiniApp =
      isMiniApp &&
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
  }, [isMiniApp]);

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

  // 🎯 MINIKIT: Obtener estado de auto-login
  const { isAutoLoggingIn } = useFarcasterMiniApp();

  // 🎯 MINIKIT: Render simplificado para Mini Apps
  if (isMiniApp) {
    // Si está en proceso de auto-login, mostrar estado de carga
    if (isAutoLoggingIn) {
      console.log("🔄 MiniKit: Auto-login en progreso...");
      return null;
    }

    // Si Privy está autenticado y tenemos datos de usuario registrado
    if (isAuthenticated && isRegistered === true && userData) {
      console.log("✅ MiniKit: Mostrando CustomUserPill");
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

    // Si Privy está autenticado pero no registrado, mostrar estado de carga
    if (isAuthenticated && isRegistered !== true) {
      console.log("⏳ MiniKit: Privy autenticado, registrando usuario...");
      return null; // Loading state
    }

    // Si Privy no está listo o no autenticado, no mostrar nada
    console.log("⏳ MiniKit: Esperando autenticación de Privy...");
    return null;
  }

  // RESTO DEL RENDER LOGIC PARA ENTORNOS NORMALES (no Mini Apps)
  console.log("🚨 RENDER - Checks:", {
    isReady,
    isMiniApp,
    hasWalletConnected,
    isRegistered,
  });

  if (isRegistered === null) {
    return null;
  }

  // 🆕 OCULTAR RegistrationForm solo en Mini Apps, mostrar en entornos normales
  if (isRegistered === false) {
    // En Mini Apps: NO mostrar formulario (auto-registro en curso o ya hecho)
    if (isMiniApp) {
      console.log(
        "🎯 Mini App con isRegistered=false, continuando al CustomUserPill..."
      );
      // NO return null aquí, continuar al render final
    } else {
      // En entornos normales: mostrar formulario
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
  }

  console.log("🎯 RENDER FINAL - CustomUserPill:", {
    isRegistered,
    userData: !!userData,
    isMiniApp,
    isConnected,
    address: !!address,
    hasWalletConnected,
  });

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
