import {
  PublicKey,
  Transaction,
  VersionedTransaction,
  Connection,
} from "@solana/web3.js";

type Web3JsTransactionOrVersionedTransaction =
  | Transaction
  | VersionedTransaction;

export const createMintUmiAdapter = (
  address: string | undefined,
  walletProvider: any,
  connection: any,
  options?: {
    userPaysFees?: boolean;
  }
) => {
  // Verificar los parámetros esenciales para crear el adaptador
  if (!address) {
    console.error(
      "createMintUmiAdapter: No se proporcionó dirección de wallet"
    );
    throw new Error("Missing address parameter");
  }

  if (!connection) {
    console.error("createMintUmiAdapter: No se proporcionó conexión");
    throw new Error("Missing connection parameter");
  }

  if (!walletProvider) {
    console.error("createMintUmiAdapter: No se proporcionó walletProvider");
    throw new Error("Missing walletProvider parameter");
  }

  // Configuramos la dirección del pagador de fees (siempre será el usuario)
  const feePayerAddress = address;

  // Log diagnóstico simple
  console.log("createMintUmiAdapter iniciando con:", {
    address: address.slice(0, 8) + "...",
    userPaysFees: options?.userPaysFees ?? true,
  });

  // Detectar si estamos usando Privy - simplificado
  const isPrivyWallet =
    walletProvider &&
    (typeof walletProvider.sendTransaction === "function" ||
      typeof walletProvider.signTransaction === "function");

  // Log diagnóstico sobre el proveedor
  console.log("Diagnóstico de wallet provider:", {
    isPrivyWallet,
    hasSendTransaction: typeof walletProvider?.sendTransaction === "function",
    hasSignTransaction: typeof walletProvider?.signTransaction === "function",
    hasSignMessage: typeof walletProvider?.signMessage === "function",
    provider: walletProvider ? Object.keys(walletProvider).join(", ") : "none",
    address,
  });

  // Función simple para preparar transacciones
  const prepareTransaction = async (transaction: Transaction) => {
    try {
      console.log("LLEGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA 03");
      const { blockhash } = await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new PublicKey(feePayerAddress);
      return true;
    } catch (error) {
      console.error("Error preparando transacción:", error);
      return false;
    }
  };

  // Función de firma para usar internamente
  const signTransactionInternal = async <
    T extends Web3JsTransactionOrVersionedTransaction
  >(
    transaction: T
  ): Promise<T> => {
    console.log("LLEGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA 06");
    try {
      // Si es una transacción estándar, prepararla
      if (transaction instanceof Transaction) {
        console.log("LLEGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA 07");
        await prepareTransaction(transaction);
      }

      // Usar directamente el método de firma de la wallet
      if (walletProvider.signTransaction) {
        console.log("LLEGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA 08");
        console.log(
          "LLEGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA 09 : ",
          walletProvider
        );
        return await walletProvider.signTransaction(transaction);
      }

      // Si no hay método de firma, devolver sin firmar (error)
      console.error("Wallet no soporta signTransaction");
      return transaction;
    } catch (error) {
      console.error("Error en signTransaction:", error);
      throw error;
    }
  };

  return {
    publicKey: new PublicKey(address),

    signMessage: async (message: Uint8Array): Promise<Uint8Array> => {
      console.log("LLEGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA 01");
      try {
        if (walletProvider.signMessage) {
          return await walletProvider.signMessage(message);
        }
        throw new Error("Wallet no soporta signMessage");
      } catch (error) {
        console.error("Error en signMessage:", error);
        throw error;
      }
    },

    signTransaction: signTransactionInternal,

    sendTransaction: async <T extends Web3JsTransactionOrVersionedTransaction>(
      transaction: T
    ): Promise<any> => {
      console.log("LLEGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA 05");
      try {
        console.log("LLEGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA 02");
        // Si es una transacción estándar, prepararla
        if (transaction instanceof Transaction) {
          await prepareTransaction(transaction);
        }

        // Usar el método sendTransaction directamente de la wallet
        if (walletProvider.sendTransaction) {
          console.log(
            "Enviando transacción directamente con wallet.sendTransaction"
          );
          const result = await walletProvider.sendTransaction(
            transaction,
            connection
          );
          return result;
        }

        // Si no hay sendTransaction, firmar y luego enviar
        console.log("Usando flujo alternativo: firmar y luego enviar");
        const signedTx = await signTransactionInternal(transaction);
        const signature = await connection.sendRawTransaction(
          signedTx.serialize()
        );
        return { signature, signedTransaction: signedTx };
      } catch (error) {
        console.error("Error en sendTransaction:", error);
        throw error;
      }
    },

    signAllTransactions: async <
      T extends Web3JsTransactionOrVersionedTransaction
    >(
      transactions: T[]
    ): Promise<T[]> => {
      console.log("LLEGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA 04");
      try {
        // Preparar transacciones estándar
        for (const tx of transactions) {
          if (tx instanceof Transaction) {
            await prepareTransaction(tx);
          }
        }

        // Usar el método directo
        if (walletProvider.signAllTransactions) {
          return await walletProvider.signAllTransactions(transactions);
        }

        // Alternativa: firmar una por una
        if (walletProvider.signTransaction) {
          const signedTxs = [];
          for (const tx of transactions) {
            const signedTx = await walletProvider.signTransaction(tx);
            signedTxs.push(signedTx);
          }
          return signedTxs as T[];
        }

        console.error("Wallet no soporta signAllTransactions");
        return transactions;
      } catch (error) {
        console.error("Error en signAllTransactions:", error);
        throw error;
      }
    },

    // Devolvemos la dirección del pagador de fees para referencia
    getFeePayerAddress: () => feePayerAddress,
  };
};
