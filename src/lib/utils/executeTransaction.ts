import { Connection, Transaction } from "@solana/web3.js";
import { Wallet } from "@saberhq/solana-contrib";

export const executeTransaction = async (
  connection: Connection,
  wallet: Wallet,
  transaction: Transaction,
  config: any = {}
): Promise<string> => {
  try {
    // Obtener el último blockhash
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash("confirmed");

    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;

    // Firmar la transacción
    const signedTransaction = await wallet.signTransaction(transaction);

    // Enviar la transacción
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize(),
      { skipPreflight: config.skipPreflight || false }
    );

    // Confirmar la transacción (opcional)
    if (config.awaitConfirmation !== false) {
      await connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature,
      });
    }

    return signature;
  } catch (error) {
    console.error("Error executing transaction:", error);
    throw error;
  }
};
