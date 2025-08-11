import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useSolanaWallets } from "@privy-io/react-auth/solana";
import { useMemo, useEffect, useState } from "react";

// Este hook sirve como reemplazo directo de useAppKitAccount
export function useAppKitAccount() {
  const {
    ready,
    authenticated,
    user,
    login,
    logout,
    connectWallet,
    linkWallet,
    unlinkWallet,
    createWallet,
    linkFarcaster,
  } = usePrivy();

  // Estado para controlar si ya ha pasado tiempo suficiente para considerar la carga completa
  const [hasLoadedWallets, setHasLoadedWallets] = useState(false);

  // Obtener wallets EVM vinculadas
  const { wallets, ready: evmReady } = useWallets();

  // Obtener wallets Solana vinculadas usando el hook específico
  const { wallets: solanaWallets, ready: solanaReady } = useSolanaWallets();

  // Detectar cuando las wallets están listas para usar
  useEffect(() => {
    if (ready && evmReady && solanaReady && !hasLoadedWallets) {
      const timer = setTimeout(() => {
        setHasLoadedWallets(true);
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [ready, evmReady, solanaReady, hasLoadedWallets]);

  // Para mantener compatibilidad con la API antigua
  // construimos un objeto que exponga las mismas propiedades que useAppKitAccount
  const accountInfo = useMemo(() => {
    // Buscar wallets vinculadas y categorizarlas por tipo
    let evmAddress;
    let evmAddresses: string[] = [];
    let solanaAddress;
    let solanaAddresses: string[] = [];

    // Buscar y categorizar wallets EVM
    if (wallets.length > 0) {
      // Encontrar todas las wallets EVM
      const evmWallets = wallets.filter(
        (wallet) =>
          wallet.chainId?.toString().startsWith("eip155:") ||
          wallet.walletClientType === "privy"
      );

      // Guardar todas las direcciones EVM
      evmAddresses = evmWallets.map((wallet) => wallet.address);
      // Usar la primera como principal
      evmAddress = evmAddresses[0];

      // Si hay wallet embedded pero también hay wallet externa, preferir la externa
      const externalEvmWallet = evmWallets.find(
        (wallet) => wallet.walletClientType !== "privy"
      );
      if (externalEvmWallet) {
        evmAddress = externalEvmWallet.address;
      }
    }

    // Buscar y categorizar wallets Solana
    if (solanaWallets.length > 0) {
      // Guardar todas las direcciones Solana
      solanaAddresses = solanaWallets.map((wallet) => wallet.address);
      // Usar la primera como principal
      solanaAddress = solanaAddresses[0];

      // Preferir wallets externas sobre embedded
      const externalSolanaWallet = solanaWallets.find(
        (wallet) => wallet.walletClientType !== "privy"
      );
      if (externalSolanaWallet) {
        solanaAddress = externalSolanaWallet.address;
      }
    }

    // Para la dirección principal (address), prioridad:
    // 1. Wallet de Solana si estamos en una ruta relacionada con Solana
    // 2. Wallet EVM si estamos en una ruta relacionada con EVM
    // 3. Cualquier wallet disponible
    // 4. La wallet del usuario de Privy
    const address = solanaAddress || evmAddress || user?.wallet?.address;

    // Formato CAIP para la dirección principal
    let caipAddress;
    if (address) {
      if (solanaAddress && solanaAddress === address) {
        caipAddress = `solana:${address}`;
      } else if (evmAddress && evmAddress === address) {
        caipAddress = `eip155:${address}`;
      } else {
        // Si no se pudo determinar el tipo, usar un formato genérico
        caipAddress = address;
      }
    }

    // 🆕 FARCASTER: Obtener datos de Farcaster del usuario
    const farcasterAccount = user?.linkedAccounts?.find(
      (account) => account.type === "farcaster"
    );

    // Combinamos las wallets EVM y Solana para tener una lista completa
    const allWallets = [...wallets, ...solanaWallets];

    // Estado de conexión
    const isConnected = !!authenticated && !!address;
    let status = "disconnected";

    if (!ready || (!evmReady && !solanaReady)) {
      status = "loading";
    } else if (authenticated && address) {
      status = "connected";
    }

    return {
      address,
      evmWalletAddress: evmAddress,
      solanaWalletAddress: solanaAddress,
      caipAddress,
      // Múltiples direcciones por tipo de blockchain
      evmAddresses,
      solanaAddresses,
      isConnected,
      status,
      embeddedWalletInfo: {
        user: {
          email: user?.email?.address,
          userId: user?.id,
        },
      },
      // 🆕 FARCASTER: Información de Farcaster
      farcasterAccount,
      farcasterConnected: !!farcasterAccount,
      farcasterData: farcasterAccount
        ? {
            fid: farcasterAccount.fid,
            username: farcasterAccount.username,
            displayName: farcasterAccount.displayName,
            pfp: farcasterAccount.pfp,
            bio: farcasterAccount.bio,
            ownerAddress: farcasterAccount.ownerAddress,
          }
        : null,
      // Mantener compatible con la API de AppKit pero ahora incluye ambos tipos de wallets
      wallets: allWallets,
      // Incluir las wallets específicas de cada cadena
      evmWallets: wallets,
      solanaWallets,
      // Funciones de Privy
      login,
      logout,
      connect: connectWallet,
      linkWallet,
      unlinkWallet,
      createWallet,
      // 🆕 FARCASTER: Función para vincular Farcaster
      linkFarcaster,
      // Flag para saber si las wallets han terminado de cargar
      walletsLoaded: hasLoadedWallets,
    };
  }, [
    authenticated,
    user,
    ready,
    evmReady,
    solanaReady,
    wallets,
    solanaWallets,
    login,
    logout,
    connectWallet,
    linkWallet,
    unlinkWallet,
    createWallet,
    linkFarcaster,
    hasLoadedWallets,
  ]);

  return accountInfo;
}
