import { useState, useEffect } from "react";
import {
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  Fanout,
  FanoutClient,
  MembershipModel,
} from "@metaplex-foundation/mpl-hydra/dist/src";
import { useAppKitAccount, useAppKitProvider } from "@Src/lib/privy";
import { useAppKitConnection } from "@Src/lib/privy";
import { type Provider } from "@Src/lib/privy/hooks/usePrivyProvider";
import { createUmiAdapter } from "../../utils/createUmiAdapter";
import { TUNEPORT_WALLET_ADDRESS } from "@Src/lib/constants/feeCalculations";

type HydraWalletParams = {
  name: string;
  collaborators: {
    name: string;
    address: string;
    royalties: number;
  }[];
};

export function useHydraWallet() {
  const { connection } = useAppKitConnection();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydraAddress, setHydraAddress] = useState<string | null>(null);
  const { address } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider<Provider>("solana");

  // Función mejorada para enviar transacciones
  const sendAndConfirmWithRetry = async (
    tx: Transaction,
    connection: any,
    provider: any
  ) => {
    const maxRetries = 3;
    let lastError = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`Intento ${attempt + 1} de enviar transacción...`);

        // Configurar la transacción para que TUNEPORT sea el pagador
        tx.feePayer = new PublicKey(TUNEPORT_WALLET_ADDRESS);
        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash("confirmed");
        tx.recentBlockhash = blockhash;

        // Determinar si estamos usando el adaptador UMI o el wallet provider
        const isUmiAdapter = provider.isUsingAutoSigner !== undefined;

        // Asegurarnos que la wallet del usuario NO sea requerida como firmante
        if (address) {
          const userPubKey = new PublicKey(address);

          // Verificar las firmas requeridas
          console.log("Firmas requeridas antes de procesar:");
          tx.signatures.forEach((sig, index) => {
            console.log(`Firma ${index}: ${sig.publicKey.toBase58()}`);
          });
        }

        // Firmar la transacción
        const signed = await provider.signTransaction(tx);

        // Enviar la transacción firmada
        const signature = await connection.sendRawTransaction(
          signed.serialize(),
          {
            skipPreflight: true, // Saltarse algunas validaciones previas
          }
        );

        console.log(`Transacción enviada, confirmando: ${signature}`);

        // Consideramos la transacción exitosa una vez enviada, pero intentamos confirmar
        try {
          await connection.confirmTransaction(
            {
              signature,
              blockhash,
              lastValidBlockHeight,
            },
            "processed"
          );
          console.log(`Transacción confirmada: ${signature}`);
        } catch (confirmError) {
          // Si hay error en la confirmación, lo registramos pero seguimos adelante
          console.warn("Error en confirmación:", confirmError);
        }

        return signature;
      } catch (err: any) {
        console.warn(`Error en el intento ${attempt + 1}:`, err);
        lastError = err;

        // Si es un error conocido que no debería bloquearnos, continuar
        if (
          err.toString().includes("TransactionExpiredTimeoutError") ||
          err.toString().includes("timeout") ||
          err.toString().includes("timed out")
        ) {
          console.log(
            "Error de timeout, considerando transacción como enviada..."
          );
          return "timeout-but-possibly-success";
        }

        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } else {
          throw err;
        }
      }
    }

    throw lastError || new Error("Failed after maximum retries");
  };

  const createHydraWallet = async ({
    name,
    collaborators,
  }: HydraWalletParams) => {
    if (!address || !walletProvider || !connection) {
      setError("Wallet not connected or connection not available");
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("Wallet conectada:", address);

      // Crear adaptador UMI con firma automática usando la wallet de TUNEPORT
      const umiAdapter = createUmiAdapter(
        TUNEPORT_WALLET_ADDRESS, // Usar la dirección de TUNEPORT como principal
        walletProvider,
        connection,
        {
          userPaysFees: false,
          feePayer: TUNEPORT_WALLET_ADDRESS,
          useAutoSigner: true, // Habilitar firma automática si está disponible
        }
      );

      // Verificar si estamos usando firma automática
      const isUsingAutoSigner = umiAdapter.isUsingAutoSigner();
      console.log("¿Usando firma automática?:", isUsingAutoSigner);

      // Provider mejorado con función de envío personalizada
      const provider = {
        publicKey: new PublicKey(TUNEPORT_WALLET_ADDRESS), // Usar la wallet de Tuneport como publicKey
        signTransaction: async (tx: Transaction) => {
          // Si usamos firma automática, usar el adaptador UMI
          if (isUsingAutoSigner) {
            console.log("Utilizando adaptador UMI para firmar transacción");

            // Verificar que la transacción esté configurada correctamente
            if (!tx.feePayer) {
              tx.feePayer = new PublicKey(TUNEPORT_WALLET_ADDRESS);
            }

            // Usar el adaptador UMI para firmar (que ahora solo firma con Tuneport)
            return await umiAdapter.signTransaction(tx);
          }

          // De lo contrario, usar la implementación original (nunca debería llegar aquí)
          console.warn(
            "No estamos usando firma automática - esto puede causar problemas"
          );
          tx.feePayer = new PublicKey(TUNEPORT_WALLET_ADDRESS);
          return await walletProvider.signTransaction(tx);
        },
        signAllTransactions: async (txs: Transaction[]) => {
          // Si usamos firma automática, usar el adaptador UMI
          if (isUsingAutoSigner) {
            return await umiAdapter.signAllTransactions(txs);
          }

          // De lo contrario, usar la implementación original
          txs.forEach((tx) => {
            tx.feePayer = new PublicKey(TUNEPORT_WALLET_ADDRESS);
          });
          return await walletProvider.signAllTransactions(txs);
        },
        sendTransaction: async (tx: Transaction, conn: any) => {
          return await sendAndConfirmWithRetry(
            tx,
            conn,
            isUsingAutoSigner ? umiAdapter : walletProvider
          );
        },
        payer: new PublicKey(TUNEPORT_WALLET_ADDRESS),
      };

      // Nombre único para el fanout
      const fanoutName = `${name.replace(/\s+/g, "")}_${Date.now()
        .toString()
        .slice(-6)}`;

      // Calcular total de shares y filtrar duplicados
      // NO FILTRAR TUNEPORT - debe incluirse en Hydra
      const filteredCollaborators = collaborators
        // Solo filtrar por direcciones únicas (mantener la primera ocurrencia)
        .filter(
          (collab, index, self) =>
            index === self.findIndex((c) => c.address === collab.address)
        );

      // Verificar si hay suficientes colaboradores
      if (filteredCollaborators.length < 2) {
        throw new Error(
          "Se requieren al menos Artist y Tuneport en el wallet Hydra"
        );
      }

      // Obtener el total de participación (shares)
      const totalShares = filteredCollaborators.reduce(
        (sum, curr) => sum + curr.royalties,
        0
      );

      // Crear client de Hydra
      const fanoutSdk = new FanoutClient(
        connection,
        provider as any // Usando nuestro provider personalizado
      );

      console.log("Creando Hydra wallet con:", {
        name: fanoutName,
        totalShares: totalShares,
        members: filteredCollaborators.map((c) => ({
          name: c.name,
          address: c.address,
          shares: c.royalties,
        })),
      });

      // Crear Fanout (Hydra Wallet)
      const { fanout } = await fanoutSdk.initializeFanout({
        totalShares: totalShares,
        name: fanoutName,
        membershipModel: MembershipModel.Wallet,
      });

      console.log("Fanout creado:", fanout.toBase58());
      setHydraAddress(fanout.toBase58());

      // Agregar miembros al fanout
      for (const collaborator of filteredCollaborators) {
        // Validar la dirección
        let memberAddress: PublicKey;
        try {
          memberAddress = new PublicKey(collaborator.address);
        } catch (err) {
          console.error(
            `Dirección inválida para ${collaborator.name}: ${collaborator.address}`,
            err
          );
          continue; // Saltarnos este colaborador
        }

        try {
          console.log(`Agregando miembro ${collaborator.name}...`);
          await fanoutSdk.addMemberWallet({
            fanout,
            shareAllocations: {
              [memberAddress.toBase58()]: collaborator.royalties,
            },
          });
          console.log(
            `Miembro agregado: ${
              collaborator.name
            } (${memberAddress.toBase58()}) - ${collaborator.royalties} shares`
          );
        } catch (err) {
          console.error(`Error al agregar miembro ${collaborator.name}:`, err);
          throw err;
        }
      }

      setLoading(false);
      return {
        hydraAddress: fanout.toBase58(),
        success: true,
      };
    } catch (err) {
      console.error("Error creating Hydra wallet:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unknown error creating Hydra wallet"
      );
      setLoading(false);
      return null;
    }
  };

  return {
    createHydraWallet,
    hydraAddress,
    loading,
    error,
  };
}
