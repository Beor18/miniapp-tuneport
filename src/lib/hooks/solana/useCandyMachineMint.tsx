import { useCallback, useState, useEffect } from "react";
import {
  generateSigner,
  transactionBuilder,
  sol,
} from "@metaplex-foundation/umi";
import {
  findAssociatedTokenPda,
  setComputeUnitLimit,
} from "@metaplex-foundation/mpl-toolbox";
import {
  mintV1,
  fetchCandyMachine,
  mplCandyMachine,
} from "@metaplex-foundation/mpl-core-candy-machine";
import { publicKey, some } from "@metaplex-foundation/umi";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  useAppKitAccount,
  useAppKitProvider,
  useAppKitConnection,
} from "@Src/lib/privy";
import { type Provider } from "@Src/lib/privy/hooks/usePrivyProvider";
import { toast } from "sonner";
import { createMintUmiAdapter } from "../../utils/createMintUmiAdapter";

interface MintOptions {
  candyMachineId: string;
  collectionId: string;
  group?: string;
  guardArgs?: any;
  startDate: any;
  price: number;
  artist_address_mint: string;
  currency?: string;
}

export const useCandyMachineMint = () => {
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMintedAsset, setLastMintedAsset] = useState<string | null>(null);

  // Obtener información de cuenta y conexión de Privy
  const { address, solanaWalletAddress, walletsLoaded } = useAppKitAccount();
  const { connection } = useAppKitConnection();
  const { walletProvider } = useAppKitProvider<Provider>("solana");

  // Limpiar errores cuando la wallet cambie
  useEffect(() => {
    if (solanaWalletAddress) {
      setError(null);
    }
  }, [solanaWalletAddress]);

  const mint = useCallback(
    async ({
      candyMachineId,
      collectionId,
      price,
      startDate,
      artist_address_mint,
      currency,
    }: MintOptions) => {
      // Asegurar que no haya mint en progreso
      if (isMinting) {
        return lastMintedAsset;
      }

      // Descartar toast anterior si existe
      toast.dismiss("mint-process");

      try {
        setIsMinting(true);
        setError(null);

        // Validar que tenemos una wallet conectada
        const walletAddress = solanaWalletAddress || address;
        if (!walletAddress) {
          throw new Error(
            "No hay una wallet conectada. Por favor conecta tu wallet primero."
          );
        }

        // Validar datos de entrada
        if (!candyMachineId) {
          throw new Error("ID de Candy Machine no proporcionado");
        }

        if (!collectionId) {
          throw new Error("ID de Colección no proporcionado");
        }

        // Mostrar toast de inicio
        toast.loading("Iniciando proceso de mint...", {
          description: "Preparando la transacción en Solana",
          id: "mint-process",
        });

        // Crear adaptador UMI usando Privy
        const umiWalletAdapter = createMintUmiAdapter(
          walletAddress.toString(),
          walletProvider,
          connection,
          {
            userPaysFees: true,
          }
        );

        // Crear cliente UMI para Solana
        const umi = createUmi("https://api.devnet.solana.com")
          .use(mplCandyMachine())
          .use(walletAdapterIdentity(umiWalletAdapter));

        // Generar un nuevo asset
        const asset = generateSigner(umi);

        // Obtener datos del Candy Machine
        const candyMachine = await fetchCandyMachine(
          umi,
          publicKey(candyMachineId)
        );

        // Determinar la moneda a utilizar
        let mintAddress: string = "";
        switch (currency?.toUpperCase()) {
          case "USDC":
            mintAddress = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
            break;
          default:
            mintAddress = "So11111111111111111111111111111111111111112"; // SOL
            break;
        }

        // Actualizar toast
        toast.loading("Procesando transacción en Solana...", {
          id: "mint-process",
          description: "Este proceso puede tardar hasta 30 segundos",
        });

        // Construir transacción de mint
        const tx = transactionBuilder()
          .add(setComputeUnitLimit(umi, { units: 800_000 }))
          .add(
            mintV1(umi, {
              candyMachine: publicKey(candyMachine.publicKey),
              asset,
              collection: publicKey(collectionId),
              owner: publicKey(walletAddress.toString()),
              mintArgs: {
                startDate: some({ date: startDate }),
                solPayment: some({
                  lamports: sol(price),
                  destination: publicKey(artist_address_mint),
                }),
              },
            })
          );

        // Enviar y confirmar transacción
        await tx
          .sendAndConfirm(umi, { confirm: { commitment: "confirmed" } })
          .catch((error: unknown) => {
            toast.dismiss("mint-process");
            throw error;
          });

        // Guardar referencia del último asset minteado
        const mintedAssetKey = asset.publicKey.toString();
        setLastMintedAsset(mintedAssetKey);

        // Notificar éxito
        toast.dismiss("mint-process");
        toast.success("¡NFT creado exitosamente!", {
          description: "Tu NFT ha sido minteado correctamente en Solana",
          duration: 4000,
        });

        return mintedAssetKey;
      } catch (err: unknown) {
        console.error("Error en mint de Solana:", err);

        // Descartar toast de proceso
        toast.dismiss("mint-process");

        // Extraer mensaje de error más detallado
        let errorMessage = "Ha ocurrido un error durante el mint";

        if (err instanceof Error) {
          // Mejorar mensajes de errores comunes
          if (err.message.includes("insufficient funds")) {
            errorMessage = "Fondos insuficientes para completar la transacción";
          } else if (err.message.includes("User rejected")) {
            errorMessage = "Transacción rechazada por el usuario";
          } else if (err.message.includes("timeout")) {
            errorMessage =
              "La transacción ha expirado. Por favor intenta de nuevo";
          } else {
            errorMessage = err.message;
          }
        }

        setError(errorMessage);

        // Notificar error
        toast.error("Error en el proceso de mint", {
          description: errorMessage,
          duration: 4000,
        });

        return null;
      } finally {
        setIsMinting(false);
        // Asegurar que el toast se cierra
        setTimeout(() => {
          toast.dismiss("mint-process");
        }, 100);
      }
    },
    [
      isMinting,
      lastMintedAsset,
      address,
      solanaWalletAddress,
      connection,
      walletProvider,
    ]
  );

  return {
    mint,
    isMinting,
    error,
    lastMintedAsset,
  };
};
