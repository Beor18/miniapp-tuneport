"use client";

import { useContext } from "react";
import { useAppKitAccount } from "@Src/lib/privy";
import { UserRegistrationContext, MiniAppContext } from "@Src/app/providers";

/**
 * Hook unificado que combina Privy + Mini Apps
 * - En entornos normales: usa Privy directamente
 * - En Mini Apps: usa datos del auto-registro como fallback
 */
export function useUnifiedAccount() {
  // Datos de Privy (funciona en entornos normales)
  const privyAccount = useAppKitAccount();

  // Datos de Mini Apps (auto-registro)
  const { isMiniApp } = useContext(MiniAppContext);
  const { isRegistered, userData } = useContext(UserRegistrationContext);

  console.log("🔧 useUnifiedAccount inputs:", {
    isMiniApp,
    isRegistered,
    userData: !!userData,
    privyAddress: !!privyAccount.address,
    privyIsConnected: privyAccount.isConnected,
  });

  // En Mini Apps registrados, usar datos del contexto como fallback
  if (isMiniApp && isRegistered === true && userData) {
    console.log("🎯 useUnifiedAccount: Mini App registrada detectada", {
      isMiniApp,
      isRegistered,
      userData: !!userData,
      userDataNickname: userData?.nickname,
      userDataAddress: userData?.address,
    });

    return {
      // Privy data (puede estar disponible o no)
      ...privyAccount,

      // 🎯 FALLBACKS para Mini Apps:
      address: privyAccount.address || userData.address,
      evmWalletAddress: privyAccount.evmWalletAddress || userData.address,
      isConnected: privyAccount.isConnected || true, // En Mini Apps registrados = conectado

      // 🎯 DATOS ADICIONALES de Mini Apps:
      isMiniApp: true,
      isAutoRegistered: true,
      userData: userData,

      // Mantener el resto de datos de Privy
      solanaWalletAddress: privyAccount.solanaWalletAddress,
      farcasterConnected: privyAccount.farcasterConnected,
      farcasterData: privyAccount.farcasterData,
      wallets: privyAccount.wallets,
      status: privyAccount.status,
      embeddedWalletInfo: privyAccount.embeddedWalletInfo,
      caipAddress: privyAccount.caipAddress,
    };
  }

  // En entornos normales o Mini Apps no registrados, usar Privy directamente
  console.log("📋 useUnifiedAccount: Usando Privy directamente", {
    isMiniApp,
    isRegistered,
    userData: !!userData,
    privyAddress: !!privyAccount.address,
    privyIsConnected: privyAccount.isConnected,
  });

  return {
    ...privyAccount,
    isMiniApp: isMiniApp, // Mantener el valor real de isMiniApp
    isAutoRegistered: false,
    userData: null,
  };
}
