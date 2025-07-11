import { PublicKey, Transaction } from "@solana/web3.js";
import { createUmiAdapter } from "./createUmiAdapter";
import { TUNEPORT_WALLET_ADDRESS } from "@Src/lib/constants/feeCalculations";

/**
 * Crea un adaptador específico para trabajar con Hydra/Fanout
 * que maneja correctamente las firmas.
 */
export const createHydraAdapter = (
  address: string | undefined,
  walletProvider: any,
  connection: any
) => {
  // Usar el adaptador UMI base - Tuneport paga las tarifas para operaciones Hydra
  const baseAdapter = createUmiAdapter(address, walletProvider, connection, {
    userPaysFees: false,
    feePayer: TUNEPORT_WALLET_ADDRESS,
    useAutoSigner: true, // Habilitar firma automática para Hydra
  });

  // En lugar de usar un keypair aleatorio, vamos a usar solo el adaptador estándar
  // pero con configuraciones adicionales para Hydra
  return {
    ...baseAdapter,
    publicKey: address ? new PublicKey(address) : baseAdapter.publicKey,

    // Necesitamos proporcionar estos métodos explícitamente en el formato que Hydra espera
    sendTransaction: async (transaction: any, connection: any) => {
      // Asegurar que Tuneport sea el feePayer para las operaciones Hydra
      transaction.feePayer = new PublicKey(baseAdapter.getFeePayerAddress());

      // Obtener blockhash reciente
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;

      // Firmar la transacción usando el método del adaptador base
      const signedTx = await baseAdapter.signTransaction(transaction);

      // Enviar la transacción firmada
      return await connection.sendRawTransaction(signedTx.serialize());
    },

    // Método requerido por FanoutClient
    payer: address ? new PublicKey(address) : baseAdapter.publicKey,
  };
};
