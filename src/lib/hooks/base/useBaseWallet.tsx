import { useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useAppKitAccount } from "@Src/lib/privy";
import { useWallets } from "@Src/lib/privy";
import { createWalletClient, http, createPublicClient, custom } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia } from "viem/chains";

export const useBaseWallet = () => {
  const { authenticated } = usePrivy();
  const { address: userWalletAddress } = useAppKitAccount();
  const { wallets } = useWallets();

  // Obtener la dirección EVM válida
  const getEvmWalletAddress = useCallback((): string | null => {
    const evmWallet = wallets.find(
      (wallet: any) =>
        wallet.walletClientType === "privy" ||
        wallet.walletClientType === "coinbase_wallet" ||
        wallet.walletClientType === "metamask" ||
        wallet.walletClientType === "walletconnect"
    );
    const evmAddress = evmWallet?.address || userWalletAddress || null;
    console.log("getEvmWalletAddress result:", evmAddress);
    return evmAddress;
  }, [wallets, userWalletAddress]);

  // Obtener la wallet externa del usuario (Privy, MetaMask, WalletConnect) para que pague su propio gas
  const getExternalWallet = useCallback(() => {
    const externalWallet = wallets.find(
      (wallet: any) =>
        wallet.walletClientType === "privy" ||
        wallet.walletClientType === "metamask" ||
        wallet.walletClientType === "coinbase_wallet" ||
        wallet.walletClientType === "walletconnect"
    );

    if (!externalWallet) {
      console.error("No external wallet (Privy/MetaMask/WalletConnect) found");
      return null;
    }

    console.log("External wallet found:", externalWallet.walletClientType);
    return externalWallet;
  }, [wallets]);

  // Crear wallet client del usuario para firmar transacciones
  const getUserWalletClient = useCallback(async () => {
    const evmWallet = wallets.find(
      (wallet: any) =>
        wallet.walletClientType === "privy" ||
        wallet.walletClientType === "metamask" ||
        wallet.walletClientType === "coinbase_wallet" ||
        wallet.walletClientType === "walletconnect"
    );

    if (!evmWallet) {
      console.error("No wallet found for signing transactions");
      return null;
    }

    console.log(
      "🔗 Found wallet:",
      evmWallet.walletClientType,
      evmWallet.address
    );
    console.log("🔧 Wallet object:", evmWallet);

    // Para wallets de Privy, usar su provider nativo
    if (evmWallet.walletClientType === "privy") {
      console.log("🔗 Using Privy wallet provider");
      try {
        const provider = await evmWallet.getEthereumProvider();
        return createWalletClient({
          chain: base,
          transport: custom(provider),
          account: evmWallet.address as `0x${string}`,
        });
      } catch (error) {
        console.error("Error getting Privy provider:", error);
        return null;
      }
    }

    // Para wallets externas (MetaMask, WalletConnect)
    if (typeof window !== "undefined" && window.ethereum) {
      return createWalletClient({
        chain: base,
        transport: http(
          "https://api.developer.coinbase.com/rpc/v1/base/aNh4GkSHTvoOtsTHdpCxLJnuzfmqX8dj"
        ),
        account: evmWallet.address as `0x${string}`,
      });
    }

    return null;
  }, [wallets]);

  // Función para obtener el cliente wallet que pagará el gas
  const getGasPayerWallet = useCallback(() => {
    // Leer la clave privada desde las variables de entorno
    const privateKey = process.env.NEXT_PUBLIC_GAS_PAYER_PRIVATE_KEY;

    if (!privateKey) {
      console.error(
        "No se ha configurado NEXT_PUBLIC_GAS_PAYER_PRIVATE_KEY en el .env"
      );
      return null;
    }

    try {
      // Asegurarse que la clave privada tiene el formato correcto
      const formattedPrivateKey = privateKey.startsWith("0x")
        ? (privateKey as `0x${string}`)
        : (`0x${privateKey}` as `0x${string}`);

      // Crear una cuenta a partir de la clave privada
      const account = privateKeyToAccount(formattedPrivateKey);

      // Crear un cliente wallet con esa cuenta
      const walletClient = createWalletClient({
        account,
        chain: baseSepolia,
        transport: http(
          "https://api.developer.coinbase.com/rpc/v1/base-sepolia/aNh4GkSHTvoOtsTHdpCxLJnuzfmqX8dj"
        ),
      });

      return walletClient;
    } catch (error) {
      console.error("Error al crear el wallet para pagar gas:", error);
      return null;
    }
  }, []);

  // Cliente público para lecturas
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(
      "https://api.developer.coinbase.com/rpc/v1/base-sepolia/aNh4GkSHTvoOtsTHdpCxLJnuzfmqX8dj"
    ),
  });

  const publicClientMainnet = createPublicClient({
    chain: base,
    transport: http(
      "https://api.developer.coinbase.com/rpc/v1/base/aNh4GkSHTvoOtsTHdpCxLJnuzfmqX8dj"
    ),
  });

  return {
    authenticated,
    getEvmWalletAddress,
    getGasPayerWallet,
    getExternalWallet,
    getUserWalletClient,
    publicClient,
    publicClientMainnet,
  };
};
