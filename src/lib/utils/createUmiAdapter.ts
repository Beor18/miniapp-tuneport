import {
  PublicKey,
  Transaction,
  VersionedTransaction,
  ComputeBudgetProgram,
  LAMPORTS_PER_SOL,
  TransactionMessage,
  VersionedMessage,
  Keypair,
} from "@solana/web3.js";
import bs58 from "bs58";
import { TUNEPORT_WALLET_ADDRESS } from "@Src/lib/constants/feeCalculations";
import { useSolanaWallets } from "@privy-io/react-auth/solana";

// Obtener la private key del .env si existe
const AUTO_SIGNER_PRIVATE_KEY = process.env.NEXT_PUBLIC_AUTO_SIGNER_PRIVATE_KEY;

// Crear el keypair si existe la private key
const autoSignerKeypair = AUTO_SIGNER_PRIVATE_KEY
  ? Keypair.fromSecretKey(bs58.decode(AUTO_SIGNER_PRIVATE_KEY))
  : null;

// Verificar si el autoSigner corresponde a la wallet de Tuneport
const isAutoSignerTuneport = autoSignerKeypair
  ? autoSignerKeypair.publicKey.toBase58() === TUNEPORT_WALLET_ADDRESS
  : false;

if (autoSignerKeypair && !isAutoSignerTuneport) {
  console.warn(
    "La clave privada en AUTO_SIGNER_PRIVATE_KEY no corresponde a TUNEPORT_WALLET_ADDRESS"
  );
}

type Web3JsTransactionOrVersionedTransaction =
  | Transaction
  | VersionedTransaction;

export const createUmiAdapter = (
  address: string | undefined,
  walletProvider: any,
  connection: any,
  options?: {
    userPaysFees?: boolean; // Si es true, el usuario paga las fees; si es false, la plataforma paga
    feePayer?: string; // Dirección opcional de la wallet que pagará las fees
    useAutoSigner?: boolean; // Si es true, se usará el autoSigner, si está disponible
  }
) => {
  // Primero verificar los parámetros esenciales para crear el adaptador
  if (!address) {
    console.error("createUmiAdapter: No se proporcionó dirección de wallet");
    throw new Error("Missing address parameter");
  }

  if (!connection) {
    console.error("createUmiAdapter: No se proporcionó conexión");
    throw new Error("Missing connection parameter");
  }

  // Verificar que el proveedor de wallet sea válido, pero ser tolerante si es Privy
  if (!walletProvider) {
    console.warn(
      "createUmiAdapter: Se usará autoSigner debido a que no hay walletProvider"
    );
    if (!autoSignerKeypair) {
      throw new Error("Missing walletProvider and no autoSigner available");
    }
  }

  // Mostrar información inicial
  console.log("createUmiAdapter iniciando con:", {
    address: address.slice(0, 8) + "...",
    autoSignerAvailable: !!autoSignerKeypair,
    useAutoSigner: options?.useAutoSigner,
    feePayerAddress:
      options?.feePayer ||
      (options?.userPaysFees ? address : TUNEPORT_WALLET_ADDRESS),
  });

  // Configuramos la dirección del pagador de fees
  const feePayerAddress =
    options?.userPaysFees === true
      ? address
      : options?.feePayer || TUNEPORT_WALLET_ADDRESS;

  // Determinar si usamos el firmante automático
  const shouldUseAutoSigner =
    options?.useAutoSigner === true && autoSignerKeypair !== null;

  // Para modo normal, validar que tengamos los métodos necesarios según el tipo de wallet
  if (!shouldUseAutoSigner && walletProvider) {
    const isPrivyWallet =
      walletProvider.request &&
      typeof walletProvider.request === "function" &&
      walletProvider.request.name !== "bound request";

    const hasPhantomInterface =
      walletProvider.name === "Phantom" &&
      walletProvider.signTransaction &&
      walletProvider.signAllTransactions;

    const hasStandardInterface =
      walletProvider.request && typeof walletProvider.request === "function";

    // Verificar si tenemos una interfaz de wallet compatible
    if (!hasPhantomInterface && !hasStandardInterface && !isPrivyWallet) {
      console.warn(
        "createUmiAdapter: Wallet provider no compatible, se intentará con autoSigner",
        { walletProvider }
      );
    } else {
      console.log("createUmiAdapter: Wallet provider compatible detectado", {
        isPrivyWallet,
        hasPhantomInterface,
        hasStandardInterface,
      });
    }
  }

  const preparePhantomTransaction = async (transaction: Transaction) => {
    try {
      // 1. Compilar el mensaje de la transacción
      const message = transaction.compileMessage();

      // 2. Simular la transacción para obtener los valores reales
      const simulation = await connection.simulateTransaction(transaction, {
        sigVerify: false,
        replaceRecentBlockhash: true,
        commitment: "confirmed",
      });

      if (simulation.value.err) {
        console.error("Simulation error:", simulation.value.err);
        return false;
      }

      // 3. Usar los valores de la simulación - reducir el valor que restamos para dar más tiempo
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");

      // 4. Reconstruir la transacción con los valores de la simulación
      transaction.recentBlockhash = blockhash;
      // Usar lastValidBlockHeight sin modificar para dar más tiempo a la transacción
      transaction.lastValidBlockHeight = lastValidBlockHeight;

      // 5. Asegurarse que el feePayer esté configurado correctamente
      transaction.feePayer = new PublicKey(feePayerAddress);

      return true;
    } catch (error) {
      console.error("Error preparando transacción:", error);
      return false;
    }
  };

  // Función para preparar y firmar con el autoSigner
  const signWithAutoSigner = async (transaction: Transaction) => {
    try {
      // Obtener el último blockhash con commitment confirmed para mayor confiabilidad
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");

      // Configurar la transacción
      transaction.recentBlockhash = blockhash;
      // Usar lastValidBlockHeight sin modificar para dar más tiempo a la transacción
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = new PublicKey(feePayerAddress);

      // Verificar si tenemos el autoSigner y si corresponde a la wallet de Tuneport
      if (autoSignerKeypair) {
        // Simplemente firmamos con el autoSigner sin verificar si el usuario es necesario
        console.log(
          `Firmando transacción con wallet de plataforma: ${autoSignerKeypair.publicKey.toBase58()}`
        );
        transaction.sign(autoSignerKeypair);
      }

      return transaction;
    } catch (error) {
      console.error("Error en signWithAutoSigner:", error);
      throw error;
    }
  };

  // Detectar si estamos usando una wallet de Privy o cualquier otro proveedor con interfaz compatible
  const isPrivyWallet =
    walletProvider &&
    // Verificar por atributos específicos de Privy
    ((typeof walletProvider === "object" &&
      ("walletClientType" in walletProvider ||
        "providerType" in walletProvider)) ||
      // O verificar por métodos standard
      (walletProvider.signTransaction &&
        typeof walletProvider.signTransaction === "function") ||
      (walletProvider.signMessage &&
        typeof walletProvider.signMessage === "function"));

  // Log de diagnóstico
  console.log("Diagnóstico de wallet provider:", {
    isPrivyWallet,
    hasSignTransaction: !!(walletProvider && walletProvider.signTransaction),
    hasSignMessage: !!(walletProvider && walletProvider.signMessage),
    hasRequest: !!(walletProvider && walletProvider.request),
    walletAddress: address,
  });

  return {
    publicKey: new PublicKey(address),

    signMessage: async (message: Uint8Array): Promise<Uint8Array> => {
      try {
        if (shouldUseAutoSigner && autoSignerKeypair) {
          // Firma del mensaje con el autoSigner (simulada)
          console.log("Firmando mensaje con autoSigner");
          return new Uint8Array(message);
        }

        // Si es una wallet Privy, usar método correcto según documentación
        if (isPrivyWallet) {
          try {
            console.log("Firmando mensaje con Privy wallet");
            // Para Privy usamos el método con el formato correcto según la documentación
            const result = await walletProvider.signMessage(message);
            return result;
          } catch (error) {
            console.error("Error firmando mensaje con Privy:", error);
            throw error;
          }
        }

        // Para Phantom wallet
        if (walletProvider.name === "Phantom") {
          console.log("Firmando mensaje con Phantom wallet");
          return await walletProvider.signMessage(message);
        }

        // Para otros proveedores de wallet
        console.log("Firmando mensaje con wallet genérica");
        const result = await walletProvider.request({
          method: "solana_signMessage",
          params: {
            message: Array.from(message),
            pubkey: address,
          },
        });
        return new Uint8Array(result as any);
      } catch (error) {
        console.error("Error en signMessage:", error);
        throw error;
      }
    },

    signTransaction: async <T extends Web3JsTransactionOrVersionedTransaction>(
      transaction: T
    ): Promise<T> => {
      try {
        // Si debemos usar el autoSigner y está disponible
        if (shouldUseAutoSigner && autoSignerKeypair) {
          console.log("Usando firma automática con autoSigner");

          if (transaction instanceof Transaction) {
            // Obtener el último blockhash antes de la firma con commitment confirmed
            const { blockhash, lastValidBlockHeight } =
              await connection.getLatestBlockhash("confirmed");

            // Configurar la transacción con el feePayer adecuado (siempre TUNEPORT)
            transaction.recentBlockhash = blockhash;
            transaction.lastValidBlockHeight = lastValidBlockHeight;
            transaction.feePayer = new PublicKey(TUNEPORT_WALLET_ADDRESS);

            // En lugar de verificar si el usuario es firmante requerido,
            // simplemente ajustamos la transacción para que sólo Tuneport sea requerido

            // Remover cualquier requerimiento de firma del usuario
            const userPubkey = new PublicKey(address);
            const tuneportPubkey = new PublicKey(TUNEPORT_WALLET_ADDRESS);

            // Verificar el estado actual de firmantes
            console.log("Ajustando firmantes de transacción...");
            transaction.signatures.forEach((sig) => {
              if (sig.publicKey.equals(userPubkey)) {
                console.log(
                  "Usuario estaba marcado como firmante requerido - esto no es necesario"
                );
              }
            });

            // Simplemente firmar con el autoSigner (que debe corresponder a Tuneport)
            transaction.sign(autoSignerKeypair);

            return transaction as T;
          } else if (transaction instanceof VersionedTransaction) {
            // Para VersionedTransaction
            console.log("Firmando VersionedTransaction con autoSigner");

            // Verificar que tengamos el keypair correcto
            if (!autoSignerKeypair) {
              console.error("No se encontró el keypair para firma automática");
              throw new Error("No autoSigner keypair available");
            }

            try {
              // Imprimir información sobre el firmante
              console.log(
                `Usando autoSigner con clave pública: ${autoSignerKeypair.publicKey.toBase58()}`
              );
              console.log(
                `La clave esperada de Tuneport es: ${TUNEPORT_WALLET_ADDRESS}`
              );

              // Recrear la transacción con blockhash actual para evitar expiración
              const { blockhash } = await connection.getLatestBlockhash(
                "confirmed"
              );

              // Obtener mensaje y recrear la transacción con blockhash fresco
              const messageV0 = transaction.message;

              // Solo firmar si tenemos el keypair adecuado
              if (isAutoSignerTuneport) {
                console.log(
                  "El autoSigner coincide con TUNEPORT_WALLET_ADDRESS, firmando..."
                );
                // Firmar la transacción con el blockhash actualizado
                transaction.sign([autoSignerKeypair]);
              } else {
                console.error(
                  "El autoSigner NO corresponde a la wallet de Tuneport"
                );
                // Intentar usar la implementación del wallet provider en su lugar
                if (walletProvider && walletProvider.signTransaction) {
                  console.log("Intentando firmar con wallet provider...");
                  return await walletProvider.signTransaction(transaction);
                } else {
                  throw new Error(
                    "No autoSigner available matching Tuneport wallet address"
                  );
                }
              }
            } catch (err) {
              console.error("Error al firmar VersionedTransaction:", err);
              throw err;
            }

            return transaction as T;
          }
        }

        // Para Privy wallets
        if (isPrivyWallet) {
          try {
            console.log("Firmando transacción con Privy wallet");
            console.log("Wallet Provider:", walletProvider);
            console.log("Métodos disponibles:", {
              signTransaction: !!walletProvider.signTransaction,
              signAllTransactions: !!walletProvider.signAllTransactions,
              signMessage: !!walletProvider.signMessage,
              request: !!walletProvider.request,
            });

            // Obtener el último blockhash
            const latestBlockhash = await connection.getLatestBlockhash();

            if (transaction instanceof Transaction) {
              transaction.recentBlockhash = latestBlockhash.blockhash;
              transaction.feePayer = new PublicKey(feePayerAddress);
            }

            // Verificar si tenemos el método signTransaction disponible
            if (
              walletProvider.signTransaction &&
              typeof walletProvider.signTransaction === "function"
            ) {
              console.log("Usando walletProvider.signTransaction directamente");
              return await walletProvider.signTransaction(transaction);
            }
            // Alternativa: verificar si tenemos acceso a request
            else if (
              walletProvider.request &&
              typeof walletProvider.request === "function"
            ) {
              console.log("Usando walletProvider.request para firma");
              const txBase58 = bs58.encode(transaction.serialize());
              const result = (await walletProvider.request({
                method: "solana_signTransaction",
                params: { transaction: txBase58 },
              })) as { transaction: string };

              const signedTxBuffer = Buffer.from(
                bs58.decode(result.transaction)
              );
              return transaction instanceof VersionedTransaction
                ? (VersionedTransaction.deserialize(signedTxBuffer) as T)
                : (Transaction.from(signedTxBuffer) as T);
            }
            // Si no hay método disponible, intentar usar autoSigner como fallback
            else if (autoSignerKeypair) {
              console.log(
                "No se encontraron métodos de firma en walletProvider, intentando con autoSigner como fallback"
              );
              if (transaction instanceof Transaction) {
                transaction.sign(autoSignerKeypair);
                return transaction as T;
              } else if (transaction instanceof VersionedTransaction) {
                transaction.sign([autoSignerKeypair]);
                return transaction as T;
              }
            }

            // Si llegamos aquí, no pudimos firmar
            throw new Error(
              "No se encontró ningún método de firma compatible con este proveedor"
            );
          } catch (error) {
            console.error("Error firmando transacción con Privy:", error);
            throw error;
          }
        }

        // Flujo normal
        if (walletProvider.name === "Phantom") {
          if (transaction instanceof Transaction) {
            await preparePhantomTransaction(transaction);
          }
          return await walletProvider.signTransaction(transaction);
        }

        // Para otros wallets, mantener la lógica existente
        const latestBlockhash = await connection.getLatestBlockhash();
        if (transaction instanceof Transaction) {
          transaction.recentBlockhash = latestBlockhash.blockhash;
          // Aplicamos el mismo feePayer para cualquier wallet
          transaction.feePayer = new PublicKey(feePayerAddress);
        }

        const txBase58 = bs58.encode(transaction.serialize());
        const result = (await walletProvider.request({
          method: "solana_signTransaction",
          params: { transaction: txBase58 },
        })) as { transaction: string };

        const signedTxBuffer = Buffer.from(bs58.decode(result.transaction));
        return transaction instanceof VersionedTransaction
          ? (VersionedTransaction.deserialize(signedTxBuffer) as T)
          : (Transaction.from(signedTxBuffer) as T);
      } catch (error) {
        console.error("Error en signTransaction:", error);
        throw error;
      }
    },

    signAllTransactions: async <
      T extends Web3JsTransactionOrVersionedTransaction
    >(
      transactions: T[]
    ): Promise<T[]> => {
      try {
        // Si debemos usar el autoSigner y está disponible
        if (shouldUseAutoSigner && autoSignerKeypair) {
          console.log("Firmando múltiples transacciones con autoSigner");
          for (const tx of transactions) {
            if (tx instanceof Transaction) {
              await signWithAutoSigner(tx);
            } else if (tx instanceof VersionedTransaction) {
              // Para VersionedTransaction
              tx.sign([autoSignerKeypair]);
            }
          }
          return transactions;
        }

        // Para wallets Privy
        if (isPrivyWallet) {
          try {
            console.log("Firmando múltiples transacciones con Privy wallet");
            console.log("Métodos disponibles para firma masiva:", {
              signAllTransactions: !!(
                walletProvider && walletProvider.signAllTransactions
              ),
              signTransaction: !!(
                walletProvider && walletProvider.signTransaction
              ),
            });

            // Obtener el último blockhash
            const latestBlockhash = await connection.getLatestBlockhash();

            // Preparar cada transacción
            transactions.forEach((tx) => {
              if (tx instanceof Transaction) {
                tx.recentBlockhash = latestBlockhash.blockhash;
                tx.feePayer = new PublicKey(feePayerAddress);
              }
            });

            // Verificar el método disponible para firmar todas
            if (
              walletProvider.signAllTransactions &&
              typeof walletProvider.signAllTransactions === "function"
            ) {
              console.log("Usando signAllTransactions directo");
              return await walletProvider.signAllTransactions(transactions);
            }
            // Si no está disponible signAllTransactions, pero sí signTransaction
            else if (
              walletProvider.signTransaction &&
              typeof walletProvider.signTransaction === "function"
            ) {
              console.log(
                "Firmando transacciones una por una con signTransaction"
              );
              const signedTxs = [];
              for (const tx of transactions) {
                signedTxs.push(await walletProvider.signTransaction(tx));
              }
              return signedTxs as T[];
            }
            // Si sólo tenemos request, intentar con él
            else if (
              walletProvider.request &&
              typeof walletProvider.request === "function"
            ) {
              console.log("Usando request para firmar todas las transacciones");
              const txBase58s = transactions.map((tx) =>
                bs58.encode(tx.serialize())
              );
              const result = (await walletProvider.request({
                method: "solana_signAllTransactions",
                params: { transactions: txBase58s },
              })) as { transactions: string[] };

              return result.transactions.map((txBase58, idx) => {
                const signedTxBuffer = Buffer.from(bs58.decode(txBase58));
                return transactions[idx] instanceof VersionedTransaction
                  ? (VersionedTransaction.deserialize(signedTxBuffer) as T)
                  : (Transaction.from(signedTxBuffer) as T);
              });
            }
            // Fallback a autoSigner si está disponible
            else if (autoSignerKeypair) {
              console.log(
                "Fallback a autoSigner para firmar todas las transacciones"
              );
              for (const tx of transactions) {
                if (tx instanceof Transaction) {
                  tx.sign(autoSignerKeypair);
                } else if (tx instanceof VersionedTransaction) {
                  tx.sign([autoSignerKeypair]);
                }
              }
              return transactions;
            }

            // Si no hay forma de firmar
            throw new Error(
              "No se encontró método compatible para firmar múltiples transacciones"
            );
          } catch (error) {
            console.error("Error firmando transacciones con Privy:", error);
            throw error;
          }
        }

        // Flujo normal
        if (walletProvider.name === "Phantom") {
          for (const tx of transactions) {
            if (tx instanceof Transaction) {
              await preparePhantomTransaction(tx);
            }
          }
          return await walletProvider.signAllTransactions(transactions);
        }

        // Para otros wallets, mantener la lógica existente
        const latestBlockhash = await connection.getLatestBlockhash();
        transactions.forEach((tx) => {
          if (tx instanceof Transaction) {
            tx.recentBlockhash = latestBlockhash.blockhash;
            // Aplicamos el mismo feePayer para todas las transacciones
            tx.feePayer = new PublicKey(feePayerAddress);
          }
        });

        const txBase58s = transactions.map((tx) => bs58.encode(tx.serialize()));
        const result = (await walletProvider.request({
          method: "solana_signAllTransactions",
          params: { transactions: txBase58s },
        })) as { transactions: string[] };

        return result.transactions.map((txBase58, idx) => {
          const signedTxBuffer = Buffer.from(bs58.decode(txBase58));
          return transactions[idx] instanceof VersionedTransaction
            ? (VersionedTransaction.deserialize(signedTxBuffer) as T)
            : (Transaction.from(signedTxBuffer) as T);
        });
      } catch (error) {
        console.error("Error en signAllTransactions:", error);
        throw error;
      }
    },

    // Devolvemos la dirección del pagador de fees para referencia
    getFeePayerAddress: () => feePayerAddress,

    // Indicamos si estamos usando el autoSigner
    isUsingAutoSigner: () => shouldUseAutoSigner,
  };
};
