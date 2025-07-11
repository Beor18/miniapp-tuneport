import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { useAppKitAccount } from "@Src/lib/privy";
import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";
import { toast } from "sonner";
import { contracts } from "@Src/lib/constants/contracts";
import { type Provider } from "@Src/lib/privy/hooks/usePrivyProvider";
import BaseNFTAbi from "@Src/lib/abi/BaseNFT.json";
import { encodeFunctionData } from "viem";

interface BaseMintOptions {
  recipient: string;
  tokenURI: string;
}

/**
 * @deprecated Este hook está deprecado. Usa useERC1155Mint en su lugar.
 * useBaseMint usa un contrato fijo simple, mientras que
 * useERC1155Mint funciona con factory contracts dinámicos y revenue share.
 */
export const useBaseMint = () => {
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMintedTokenId, setLastMintedTokenId] = useState<string | null>(
    null
  );

  const { evmWalletAddress } = useAppKitAccount();
  const { client } = useSmartWallets();

  // Función para mintear un NFT en Base
  const mint = useCallback(
    async ({ recipient, tokenURI }: BaseMintOptions) => {
      if (isMinting) return lastMintedTokenId;

      // Descartar toast anterior si existe
      toast.dismiss("mint-base-process");

      try {
        setIsMinting(true);
        setError(null);

        // Verificar que tenemos una wallet conectada
        if (!evmWalletAddress) {
          throw new Error(
            "No wallet connected. Please connect your wallet first."
          );
        }

        // Verificar que tenemos un smart wallet client
        if (!client) {
          throw new Error("No wallet client found for Base.");
        }

        // Validar datos de entrada
        if (!recipient) {
          throw new Error("Receiver address not provided");
        }

        if (!tokenURI) {
          throw new Error("Token URI not provided");
        }

        // Mostrar toast de inicio
        toast.loading("Starting mint process...", {
          description: "Preparing transaction",
          id: "mint-base-process",
        });

        // Definir ABI simplificado para la función mintNFT
        const mintAbi = [
          {
            inputs: [
              { name: "recipient", type: "address" },
              { name: "tokenURI", type: "string" },
            ],
            name: "mintNFT",
            outputs: [{ name: "", type: "uint256" }],
            stateMutability: "nonpayable",
            type: "function",
          },
        ];

        // Dirección del contrato de NFT en Base
        const NFT_CONTRACT_ADDRESS = contracts.baseMainnetContracts.nft;

        // UI options para la transacción
        const uiOptions = {
          title: "Mint Music NFT",
          description: "Minting a song NFT using your smart wallet",
          buttonText: "Confirm mint",
        };

        // Actualizar toast
        toast.loading("Processing transaction on Base...", {
          id: "mint-base-process",
          description: "This process may take up to 30 seconds",
        });

        // Enviar transacción usando el smart wallet client y viem
        const txHash = await client.sendTransaction(
          {
            to: NFT_CONTRACT_ADDRESS as `0x${string}`,
            data: encodeFunctionData({
              abi: mintAbi,
              functionName: "mintNFT",
              args: [recipient as `0x${string}`, tokenURI],
            }),
            value: BigInt(0),
          },
          { uiOptions }
        );

        if (typeof txHash === "string") {
          // Guardar el hash de la transacción como ID del token minteado
          setLastMintedTokenId(txHash);
        } else {
          throw new Error("No confirmation received for mint");
        }

        // Notificar éxito
        toast.dismiss("mint-base-process");
        toast.success("created successfully", {
          description: "Your NFT has been minted successfully on Base",
          duration: 4000,
        });

        return txHash;
      } catch (err: unknown) {
        console.error("Error minting on Base:", err);

        // Descartar toast de proceso
        toast.dismiss("mint-base-process");

        // Extraer mensaje de error más detallado
        let errorMessage = "An error occurred during the mint";

        if (err instanceof Error) {
          // Mejorar mensajes de errores comunes
          if (err.message.includes("rejected")) {
            errorMessage = "Transaction rejected by user";
          } else if (err.message.includes("insufficient")) {
            errorMessage = "Insufficient funds to complete the transaction";
          } else if (err.message.includes("paymaster")) {
            errorMessage =
              "Error with paymaster service. Please try again later.";
          } else {
            errorMessage = err.message;
          }
        }

        setError(errorMessage);

        // Notificar error
        toast.error("Error in mint process", {
          description: errorMessage,
          duration: 4000,
        });

        throw err;
      } finally {
        setIsMinting(false);
        // Asegurar que el toast se cierra
        setTimeout(() => {
          toast.dismiss("mint-base-process");
        }, 100);
      }
    },
    [isMinting, lastMintedTokenId, evmWalletAddress, client]
  );

  return {
    mint,
    isMinting,
    error,
    lastMintedTokenId,
  };
};
