import { useState, useCallback, useEffect } from "react";
import {
  createCoinCall,
  DeployCurrency,
  validateMetadataURIContent,
  type ValidMetadataURI,
} from "@zoralabs/coins-sdk";
import { createPublicClient, http, Address, encodeFunctionData } from "viem";
import { base, baseSepolia } from "viem/chains";
import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";
import { toast } from "sonner";
import { useBaseWallet } from "./useBaseWallet";
import { useIPFSUpload } from "../common/useIPFSUpload";
import { Network } from "./types";

export interface ZoraCoinParams {
  albumName: string;
  albumSymbol: string;
  albumImageUrl: string;
  artistAddress: Address;
  network?: Network;
  collaborators?: {
    address: string;
    mintPercentage: number;
    royaltyPercentage: number;
    name: string;
  }[];
}

export const useZoraCoinCreation = () => {
  const { client } = useSmartWallets();
  const { authenticated, getEvmWalletAddress } = useBaseWallet();
  const { uploadMetadataToPinata } = useIPFSUpload();
  const [isCreatingCoin, setIsCreatingCoin] = useState(false);
  const [coinAddress, setCoinAddress] = useState<string | null>(null);
  const [hostname, setHostname] = useState<string>("");

  // Detectar hostname de manera SSR-safe (igual que en providers.tsx)
  useEffect(() => {
    setHostname(window.location.hostname);
  }, []);

  // Detectar entorno basado en hostname (misma lógica que providers.tsx)
  const isMainnet =
    hostname === "app.tuneport.xyz" || hostname === "tuneport.xyz";
  const isTestnet = hostname === "testnet.tuneport.xyz";

  // Determinar la network basada en el hostname
  const getNetworkFromHostname = (): Network => {
    if (isMainnet) return "mainnet";
    // Por defecto usar testnet (incluye localhost y testnet.tuneport.xyz)
    return "sepolia";
  };

  // Determinar la chain según la network detectada
  const getChain = (targetNetwork: Network) => {
    return targetNetwork === "sepolia" ? baseSepolia : base;
  };

  // Obtener la configuración RPC correcta para cada red
  const getRpcConfig = (targetNetwork: Network) => {
    if (targetNetwork === "sepolia") {
      return {
        // Para Base Sepolia - usar RPC público
        publicRpc:
          "https://api.developer.coinbase.com/rpc/v1/base-sepolia/aNh4GkSHTvoOtsTHdpCxLJnuzfmqX8dj",
      };
    } else {
      return {
        // Para Base mainnet - usar múltiples RPCs como fallback
        publicRpc: "https://mainnet.base.org", // RPC oficial de Base
        fallbackRpcs: [
          "https://api.developer.coinbase.com/rpc/v1/base/aNh4GkSHTvoOtsTHdpCxLJnuzfmqX8dj",
          "https://base.blockpi.network/v1/rpc/public",
          "https://1rpc.io/base",
        ],
      };
    }
  };

  const createAutomaticCoin = useCallback(
    async (params: ZoraCoinParams): Promise<string | null> => {
      const evmAddress = getEvmWalletAddress();
      const targetNetwork = params.network || getNetworkFromHostname();
      console.log("targetNetwork", targetNetwork);
      const targetChain = getChain(targetNetwork);
      const rpcConfig = getRpcConfig(targetNetwork);

      if (!authenticated || !evmAddress || !client) {
        console.log("❌ Wallet not connected for coin creation");
        return null;
      }

      setIsCreatingCoin(true);

      try {
        console.log(
          "🪙 Creating automatic coin for album:",
          params.albumName,
          "on",
          targetChain.name,
          "| Network:",
          targetNetwork,
          "| Currency:",
          targetNetwork === "sepolia" ? "ETH" : "ZORA"
        );

        // Configurar cliente público para lectura (usar RPC público)
        const publicClient = createPublicClient({
          chain: targetChain,
          transport: http(rpcConfig.publicRpc),
        });

        // Preparar metadatos del coin
        const coinMetadata = {
          name: `${params.albumName}`,
          description: `Official coin for ${params.albumName} - Trade, collect, and support the artist directly!`,
          image: params.albumImageUrl,
          external_url: `https://app.tuneport.xyz/coin/${params.albumSymbol.toLowerCase()}`,
          attributes: [
            {
              trait_type: "Type",
              value: "Music Album",
            },
            {
              trait_type: "Album",
              value: params.albumName,
            },
            {
              trait_type: "Platform",
              value: "TUNEPORT",
            },
            {
              trait_type: "Network",
              value: targetChain.name,
            },
          ],
        };

        // Subir metadata a IPFS usando el hook existente
        console.log("📤 Uploading coin metadata to IPFS...");
        const metadataUri = await uploadMetadataToPinata(coinMetadata);

        if (!metadataUri) {
          throw new Error("Failed to upload coin metadata to IPFS");
        }

        console.log("✅ Coin metadata uploaded to IPFS:", metadataUri);

        // Determinar currency según la network
        const currency =
          targetNetwork === "sepolia"
            ? DeployCurrency.ETH
            : DeployCurrency.ZORA;

        // Parámetros para crear el coin
        const coinParams = {
          name: `${params.albumName} Coin`,
          symbol: `$${params.albumSymbol}`,
          uri: metadataUri as ValidMetadataURI,
          payoutRecipient: params.artistAddress,
          chainId: targetChain.id,
          currency: currency,
        };

        console.log("🚀 Creating coin with params:", coinParams);

        // Usar createCoinCall para obtener los datos de la transacción
        const contractCallParams = await createCoinCall(coinParams);

        console.log("📞 Contract call params:", contractCallParams);

        // Preparar datos de la transacción para Privy Smart Wallet
        // El createCoinCall debería retornar los datos necesarios para la transacción
        const txData = {
          to: contractCallParams.address as `0x${string}`,
          // Encodear los datos de la función usando los parámetros del contrato
          data: encodeFunctionData({
            abi: contractCallParams.abi,
            functionName: contractCallParams.functionName,
            args: contractCallParams.args,
          }),
          value: contractCallParams.value
            ? BigInt(contractCallParams.value.toString())
            : BigInt(0),
        };

        // UI options para el diálogo de transacción
        const uiOptions = {
          title: "Create Album Coin",
          description: `Creating $${params.albumSymbol} coin for ${params.albumName}`,
          buttonText: "Confirm Creation",
        };

        console.log("📤 Sending transaction via Privy Smart Wallet...");

        // Enviar la transacción usando el cliente smart wallet de Privy
        const txHash = await client.sendTransaction(txData, { uiOptions });

        console.log("✅ Transaction sent:", txHash);
        console.log(`🔗 View transaction: https://basescan.org/tx/${txHash}`);

        // Esperar a que la transacción se confirme
        console.log("⏳ Waiting for transaction confirmation...");

        const receipt = await publicClient.getTransactionReceipt({
          hash: txHash,
        });

        console.log("✅ Transaction confirmed:", receipt);

        // Extraer la dirección del coin desde los logs de la transacción
        let newCoinAddress: string | null = null;

        // Buscar en los logs el evento de creación del coin
        if (receipt.logs && receipt.logs.length > 1) {
          // Los logs contienen información sobre el coin creado
          // La dirección del coin está en el log de posición 1
          console.log("📄 Transaction logs:", receipt.logs);

          // Obtener la dirección del coin desde el log 1
          const coinCreationLog = receipt.logs[1];
          if (coinCreationLog && coinCreationLog.address) {
            newCoinAddress = coinCreationLog.address;
            console.log("🎯 Coin address found in logs[1]:", newCoinAddress);
          }
        }

        if (newCoinAddress) {
          setCoinAddress(newCoinAddress);

          toast.success("🪙 Album Coin Created!", {
            description: `$${params.albumSymbol} coin created successfully`,
          });

          console.log("✅ Coin created successfully:", {
            hash: txHash,
            address: newCoinAddress,
            receipt: receipt,
          });

          return newCoinAddress;
        } else {
          console.warn("⚠️ Coin created but address not found in logs");
          toast.success("🪙 Album Coin Created!", {
            description: `$${params.albumSymbol} coin created (check transaction)`,
          });

          return txHash; // Retornar el hash si no podemos obtener la dirección
        }
      } catch (error: any) {
        console.error("❌ Error creating coin:", error);

        if (error.code === "ACTION_REJECTED") {
          console.log("👤 User rejected coin creation transaction");
        } else {
          toast.error("Error creating album coin", {
            description: error.message || "Please try again",
          });
        }

        return null;
      } finally {
        setIsCreatingCoin(false);
      }
    },
    [
      authenticated,
      getEvmWalletAddress,
      client,
      uploadMetadataToPinata,
      getChain,
      getNetworkFromHostname,
      hostname,
    ]
  );

  return {
    createAutomaticCoin,
    isCreatingCoin,
    coinAddress,
  };
};
