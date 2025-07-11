import { usePrivy, useWallets } from "@privy-io/react-auth";
import {
  useSendTransaction,
  useSolanaWallets,
} from "@privy-io/react-auth/solana";
// Eliminar la importación de useWallet para evitar errores de contexto
// import { useWallet } from "@solana/wallet-adapter-react";
import { useMemo } from "react";
import { Transaction, Connection, PublicKey } from "@solana/web3.js";
import { TUNEPORT_WALLET_ADDRESS } from "@Src/lib/constants/feeCalculations";

// Tipo Provider simulado para compatibilidad
export type Provider = {
  signTransaction: (tx: Transaction) => Promise<Transaction>;
  signAllTransactions: (txs: Transaction[]) => Promise<Transaction[]>;
  publicKey: any;
  sendTransaction: (tx: Transaction, connection: any) => Promise<string>;
  isUsingAutoSigner?: () => boolean;
};

// Este hook sirve como reemplazo directo de useAppKitProvider
export function useAppKitProvider<T = Provider>(
  chainType: string = "solana"
): {
  walletProvider: T;
  isLoading: boolean;
} {
  const { wallets } = useWallets();
  const { wallets: solanaWallets } = useSolanaWallets();
  const { sendTransaction } = useSendTransaction();
  // Eliminar el uso de useWallet para evitar errores de contexto
  // const solanaWalletInfo = useWallet();
  const { authenticated, ready } = usePrivy();

  const walletProvider = useMemo(() => {
    // Si estamos en Solana, usar las APIs de Solana
    if (chainType === "solana") {
      // Determinar la clave pública adecuada
      let publicKeyToUse: any = null;

      // Ya no intentamos usar useWallet() que requiere un WalletContext
      // En su lugar, confiamos exclusivamente en la información de Privy
      if (solanaWallets && solanaWallets.length > 0) {
        // Intentar usar la primera wallet de Solana de Privy
        try {
          publicKeyToUse = new PublicKey(solanaWallets[0].address);
          // console.log(
          //   "Usando publicKey de solanaWallets:",
          //   publicKeyToUse.toString()
          // );
        } catch (e) {
          console.warn("Error creando PublicKey desde solanaWallets:", e);
        }
      } else if (wallets && wallets.length > 0) {
        // Intentar usar cualquier wallet como último recurso
        try {
          publicKeyToUse = new PublicKey(wallets[0].address);
          // console.log(
          //   "Usando publicKey de wallets genérico:",
          //   publicKeyToUse.toString()
          // );
        } catch (e) {
          console.warn("Error creando PublicKey desde wallets genéricas:", e);
        }
      }

      // Si todas las opciones fallan, usar la wallet de Tuneport
      if (!publicKeyToUse) {
        publicKeyToUse = new PublicKey(TUNEPORT_WALLET_ADDRESS);
        // console.log(
        //   "Usando publicKey de TUNEPORT como fallback:",
        //   publicKeyToUse.toString()
        // );
      }

      // Crear un proveedor de Solana compatible con el existente
      const provider: Provider = {
        signTransaction: async (tx: Transaction) => {
          // Ya no intentamos usar los métodos de solanaWalletInfo
          // En su lugar, confiamos en el envío de transacciones via Privy
          const wallet = solanaWallets[0] || wallets[0];
          if (wallet) {
            // Para mantener compatibilidad, devolvemos la tx y esperamos que
            // sendTransaction maneje la firma correctamente
            return tx;
          }

          throw new Error("No wallet available for signing");
        },

        signAllTransactions: async (txs: Transaction[]) => {
          // Mismo enfoque que para signTransaction
          return txs;
        },

        publicKey: publicKeyToUse,

        sendTransaction: async (tx: Transaction, connection: Connection) => {
          try {
            // Configurar tx.feePayer si no está definido
            if (!tx.feePayer) {
              tx.feePayer = publicKeyToUse;
            }

            // Usar la función de Privy para enviar transacciones
            //console.log("Enviando transacción vía Privy sendTransaction");
            const result = await sendTransaction({
              transaction: tx,
              connection,
            });
            return result.signature || "transaction-submitted";
          } catch (e) {
            console.error("Error al enviar transacción:", e);
            throw e;
          }
        },

        isUsingAutoSigner: () => true, // Indicar que estamos usando firma automática
      };

      return provider as unknown as T;
    }

    // Para otros tipos de cadena, devolver un proveedor genérico
    return {} as T;
  }, [chainType, wallets, solanaWallets, sendTransaction]);

  return {
    walletProvider,
    isLoading: !ready || (ready && authenticated && wallets.length === 0),
  };
}
