import { useState } from "react";
import {
  updateCandyGuard,
  fetchCandyMachine,
  mplCandyMachine,
  setCandyMachineAuthority,
} from "@metaplex-foundation/mpl-core-candy-machine";
import { publicKey } from "@metaplex-foundation/umi";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";

// Actualizar importaciones para usar Privy
import {
  useAppKitAccount,
  useAppKitProvider,
  useAppKitConnection,
} from "@Src/lib/privy";
import { type Provider } from "@Src/lib/privy/hooks/usePrivyProvider";
import { createUmiAdapter } from "../../utils/createUmiAdapter";

import { TUNEPORT_WALLET_ADDRESS } from "@Src/lib/constants/feeCalculations";

// Hook para transferir la propiedad de un Candy Machine de Tuneport al artista
export function useTransferCandyMachineAuthority() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { address, solanaWalletAddress } = useAppKitAccount();
  const { connection } = useAppKitConnection();
  const { walletProvider } = useAppKitProvider<Provider>("solana");

  // Usar la dirección de Solana si está disponible, o la dirección general como respaldo
  const actualWalletAddress = solanaWalletAddress || address;

  const transferCandyMachineAuthority = async ({
    candyMachineAddress,
    newAuthority,
  }: {
    candyMachineAddress: string;
    newAuthority: string;
  }) => {
    try {
      if (!actualWalletAddress) throw new Error("Wallet not connected");

      setLoading(true);
      setError(null);

      console.log("Transfiriendo propiedad del Candy Machine:", {
        candyMachineAddress,
        fromAddress: TUNEPORT_WALLET_ADDRESS,
        toAddress: newAuthority,
      });

      // Adaptador UMI para la plataforma (Tuneport) que actualmente es la autoridad
      const umiAdapter = createUmiAdapter(
        TUNEPORT_WALLET_ADDRESS,
        walletProvider,
        connection,
        {
          userPaysFees: false,
          feePayer: TUNEPORT_WALLET_ADDRESS,
          useAutoSigner: true,
        }
      );

      // Configurar UMI para la plataforma
      const umi = createUmi("https://api.devnet.solana.com")
        .use(mplCandyMachine())
        .use(walletAdapterIdentity(umiAdapter));

      // Obtener información del Candy Machine
      const candyMachine = await fetchCandyMachine(
        umi,
        publicKey(candyMachineAddress)
      );

      if (!candyMachine) {
        throw new Error(
          `No se encontró el Candy Machine con ID: ${candyMachineAddress}`
        );
      }

      // Transferir la autoridad del Candy Machine
      const setAuthorityIx = await setCandyMachineAuthority(umi, {
        candyMachine: publicKey(candyMachineAddress),
        authority: umi.identity,
        newAuthority: publicKey(newAuthority),
      });

      // Enviar y confirmar la transacción
      console.log("Enviando transacción para transferir autoridad...");
      await setAuthorityIx.sendAndConfirm(umi, {
        confirm: { commitment: "confirmed" },
      });

      console.log(
        "Autoridad del Candy Machine transferida exitosamente al artista:",
        newAuthority
      );

      return {
        success: true,
        newAuthority: newAuthority,
      };
    } catch (err) {
      console.error("Error transfiriendo autoridad del Candy Machine:", err);
      setError("Fallo al transferir autoridad del Candy Machine");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    transferCandyMachineAuthority,
    loading,
    error,
  };
}
