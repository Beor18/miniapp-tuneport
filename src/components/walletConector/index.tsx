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

// Solana
// Eliminamos la importación de WalletMultiButton y useWallet
// import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
// import { useWallet } from "@solana/wallet-adapter-react";
import { usePrivy } from "@privy-io/react-auth";
import { CustomUserPill } from "../customUserPill";
import { useLocale } from "next-intl";

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
  } = useAppKitAccount();

  // Obtener específicamente las wallets de Solana para mejor detección
  const { wallets: solanaWallets, ready: solanaReady } = useSolanaWallets();

  // Privy original para funciones como login/logout
  const { login, logout, user } = usePrivy();

  // Usamos las direcciones específicas para cada cadena
  const userAddressEvm = evmWalletAddress;
  const userAddressSolana = solanaWalletAddress;
  const userEmail =
    user?.email?.address ||
    embeddedWalletInfo?.user?.email ||
    user?.google?.email ||
    null;

  // Direcciones memoizadas
  const walletAddresses = useMemo(
    () => ({
      evm: evmWalletAddress,
      solana: solanaWalletAddress,
      email: user?.email?.address || user?.google?.email || null,
    }),
    [
      evmWalletAddress,
      solanaWalletAddress,
      user?.email?.address,
      user?.google?.email,
    ]
  );

  // Estado de conexión memoizado
  const hasWalletConnected = useMemo(
    () =>
      isConnected &&
      (!!address || !!walletAddresses.solana || !!walletAddresses.evm),
    [isConnected, address, walletAddresses.solana, walletAddresses.evm]
  );

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
        address: walletAddresses.evm,
        address_solana: walletAddresses.solana,
      })
        .then((user: any) => {
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
    [walletAddresses.evm, walletAddresses.solana, setIsRegistered, setUserData]
  );

  // Effect para verificación - altamente optimizado
  useEffect(() => {
    if (!isReady) return;

    const currentAddressKey = `${walletAddresses.evm || ""}-${
      walletAddresses.solana || ""
    }`;

    if (hasWalletConnected) {
      // Solo verificar si realmente cambió la dirección
      if (
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
      // Reset solo si realmente había una wallet conectada antes
      if (addressKeyRef.current !== "") {
        setIsRegistered(false);
        setUserData(null);
        addressKeyRef.current = "";
      }
    }
  }, [
    isReady,
    hasWalletConnected,
    walletAddresses.evm,
    walletAddresses.solana,
    verifyUser,
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

  // Render logic - sin estados intermedios
  if (!isReady) {
    // Mostrar un botón placeholder mientras se inicializa para evitar que desaparezca
    return (
      <Button
        onClick={login}
        className="w-auto min-w-[70px] sm:min-w-[70px] h-9 border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-200 text-xs sm:text-sm focus:ring-zinc-600 transition-colors gap-2 flex-shrink-0 relative z-10 wallet-connector-mobile"
        style={{ display: "flex", visibility: "visible" }}
      >
        <Wallet className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="text-xs text-zinc-400 whitespace-nowrap">Sign In</span>
      </Button>
    );
  }

  if (!hasWalletConnected) {
    return (
      <Button
        onClick={login}
        className="w-auto min-w-[70px] sm:min-w-[70px] h-9 border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-200 text-xs sm:text-sm focus:ring-zinc-600 transition-colors gap-2 flex-shrink-0 relative z-10 wallet-connector-mobile"
        style={{ display: "flex", visibility: "visible" }}
      >
        <Wallet className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="text-xs text-zinc-400 whitespace-nowrap">Sign In</span>
      </Button>
    );
  }

  if (!isRegistered) {
    return (
      <RegistrationForm
        walletAddressEvm={walletAddresses.evm || ""}
        walletAddressSolana={walletAddresses.solana || ""}
        email={walletAddresses.email}
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
