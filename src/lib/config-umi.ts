// Configuración UMI para Solana
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplCandyMachine } from "@metaplex-foundation/mpl-core-candy-machine";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { createUmiAdapter } from "./utils/createUmiAdapter";
import { solanaClusters } from "./config";

// Crear una instancia de UMI para devnet (por defecto)
export const umi = createUmi("https://api.devnet.solana.com").use(
  mplCandyMachine()
);

// Crear un adaptador de wallet para UMI
export const umiAdapter = {
  connect: async (address: string, walletProvider: any, connection: any) => {
    return createUmiAdapter(address, walletProvider, connection, {
      userPaysFees: true,
    });
  },
};
