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

  // En Mini Apps registrados, usar datos del contexto como fallback
  if (isMiniApp && isRegistered === true && userData) {
    return {
      ...privyAccount,
      address: privyAccount.address || userData.address,
      evmWalletAddress: privyAccount.evmWalletAddress || userData.address,
      isConnected: privyAccount.isConnected || true,
      isMiniApp: true,
      isAutoRegistered: true,
      userData: userData,
    };
  }

  return {
    ...privyAccount,
    isMiniApp: isMiniApp, // Mantener el valor real de isMiniApp
    isAutoRegistered: false,
    userData: null,
  };
}
