import { useState } from "react";
import {
  addConfigLines,
  create,
  fetchCandyMachine,
  mplCandyMachine,
  setMintAuthority,
  updateCandyMachine,
} from "@metaplex-foundation/mpl-core-candy-machine";
import { updateCollection } from "@metaplex-foundation/mpl-core";
import { findAssociatedTokenPda } from "@metaplex-foundation/mpl-toolbox";
import {
  publicKey,
  generateSigner,
  some,
  sol,
  transactionBuilder,
  percentAmount,
  dateTime,
  none,
} from "@metaplex-foundation/umi";
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

import { submitNftToServer } from "@Src/app/actions/submitNftToServer.actions";
import {
  FREE_PLAN_PLATFORM_FEE_PERCENTAGE,
  FREE_PLAN_ARTIST_FEE_PERCENTAGE,
  PAID_PLAN_PLATFORM_FEE_PERCENTAGE,
  PAID_PLAN_ARTIST_FEE_PERCENTAGE,
  TUNEPORT_WALLET_ADDRESS,
} from "@Src/lib/constants/feeCalculations";

// Importar el hook de transferencia de autoridad
import { useTransferCandyMachineAuthority } from "./useTransferCandyMachineAuthority";

// Hook para subir archivos + metadatos a Pinata y agregar un item al Candy Machine
export function useAddItemsToCandyMachine() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transferStatus, setTransferStatus] = useState<
    "pending" | "success" | "error" | null
  >(null);

  const { address, solanaWalletAddress } = useAppKitAccount();
  const { connection } = useAppKitConnection();
  const { walletProvider } = useAppKitProvider<Provider>("solana");

  // Obtener la función para transferir autoridad
  const { transferCandyMachineAuthority } = useTransferCandyMachineAuthority();

  // Usar la dirección de Solana si está disponible, o la dirección general como respaldo
  const actualWalletAddress = solanaWalletAddress || address;

  const addItemsToCandyMachine = async ({
    collectionId,
    collectionAddress,
    start_mint_date,
    trackName,
    description,
    coverImage,
    trackFile,
    attributes,
    plan,
    price,
    artist_address_mint,
    currency,
    royaltyReceivers,
    copies,
  }: {
    collectionId: string;
    collectionAddress: string;
    start_mint_date: any;
    trackName: string;
    description: string;
    coverImage: File | null;
    trackFile: File | null;
    attributes?: { trait_type: string; value: string }[];
    plan?: string;
    price?: number;
    artist_address_mint?: string;
    royaltyReceivers?: string[];
    copies?: number;
    currency?: string;
  }) => {
    try {
      if (!actualWalletAddress) throw new Error("Wallet not connected");

      setLoading(true);
      setError(null);

      // Log de wallet disponible
      console.log("Wallet para AddItems:", {
        address: actualWalletAddress,
      });

      // Adaptador UMI para la plataforma (siempre paga las tarifas)
      // IMPORTANTE: Usamos autoSigner para la plataforma
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

      // const umiUserWalletAdapter = createUmiAdapter(
      //   actualWalletAddress.toString(),
      //   walletProvider,
      //   connection,
      //   {
      //     // Para la creación de items en CandyMachine, la plataforma paga las tarifas
      //     userPaysFees: false,
      //     feePayer: TUNEPORT_WALLET_ADDRESS,
      //     useAutoSigner: true,
      //   }
      // );
      // const umiUser = createUmi("https://api.devnet.solana.com")
      //   .use(mplCandyMachine())
      //   .use(walletAdapterIdentity(umiUserWalletAdapter));

      // 3. Subir archivos (cover y track) a Pinata
      // const formData = new FormData();
      // if (coverImage) formData.append("cover", coverImage);
      // if (trackFile) formData.append("track", trackFile);

      // const uploadFilesRes = await fetch("/api/pinata", {
      //   method: "POST",
      //   body: formData,
      // });
      // if (!uploadFilesRes.ok) throw new Error("Error al subir archivos");
      // const pinataDataFiles = await uploadFilesRes.json();

      // // 4. Construir JSON de metadatos
      // const metadata = {
      //   name: `${trackName}`,
      //   description,
      //   image: `https://ipfs.io/ipfs/${pinataDataFiles.ipfsHash}/${coverImage?.name}`,
      //   animation_url: "",
      //   external_url: "https://app.tuneport.xyz",
      //   copies: copies,
      //   attributes: attributes || [],
      //   properties: {
      //     files: [
      //       {
      //         uri: `https://ipfs.io/ipfs/${pinataDataFiles.ipfsHash}/${coverImage?.name}`,
      //         type: "image/png",
      //       },
      //       {
      //         uri: `https://ipfs.io/ipfs/${pinataDataFiles.ipfsHash}/${trackFile?.name}`,
      //         type: "audio/mpeg",
      //       },
      //     ],
      //   },
      // };

      // // 5. Subir el JSON de metadatos a Pinata
      // const jsonFormData = new FormData();
      // jsonFormData.append(
      //   "metadata",
      //   new Blob([JSON.stringify(metadata)], { type: "application/json" }),
      //   "metadata.json"
      // );

      // const uploadJsonRes = await fetch("/api/pinata", {
      //   method: "POST",
      //   body: jsonFormData,
      // });
      // if (!uploadJsonRes.ok)
      //   throw new Error("Error al subir JSON de metadatos");
      // const pinataDataJson = await uploadJsonRes.json();

      // Crear una nueva Candy Machine para esta canción
      const candyMachine = generateSigner(umi);

      // Calcular precio basado en plan y moneda
      let numericPrice: any;

      if (plan === "free" && currency === "USDC") {
        numericPrice = 2;
      } else if (plan !== "free" && currency === "SOL") {
        numericPrice = price;
      } else {
        numericPrice = price || 0.011;
      }

      // Generar hash para hidden settings
      const hiddenMetadata = {
        name: trackName,
        uri: "", //`https://ipfs.io/ipfs/${pinataDataJson.ipfsHash}/metadata.json`,
      };

      // Crear hash para hidden settings
      const hashBuffer = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(JSON.stringify(hiddenMetadata)) as BufferSource
      );
      const hash = new Uint8Array(hashBuffer);

      console.log("start_mint_date", start_mint_date);
      console.log("collectionAddress", collectionAddress);

      // Determinar la dirección del token según la moneda
      let mintAddress: string = "";
      switch (currency) {
        case "USDC":
          mintAddress = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"; // Dirección para USDC Devnet
          break;
        default:
          mintAddress = "So11111111111111111111111111111111111111112";
          break;
      }

      // Encontrar Associated Token Account para el token
      const ataAddress = findAssociatedTokenPda(umi, {
        mint: publicKey(mintAddress),
        owner: publicKey(actualWalletAddress.toString()),
      });

      // SIMPLIFICACIÓN: Usamos la plataforma (Tuneport) como autoridad y pagadora de tarifas
      // Esto resuelve los problemas de firma, pero requiere una transferencia posterior
      const createIx = await create(umi, {
        candyMachine,
        collection: publicKey(collectionAddress),
        // La plataforma (Tuneport) es la autoridad de la colección
        collectionUpdateAuthority: umi.identity,
        itemsAvailable: copies || 100,
        maxEditionSupply: copies || 100,
        authority: umi.identity.publicKey,
        payer: umi.identity,
        hiddenSettings: {
          name: hiddenMetadata.name,
          uri: hiddenMetadata.uri,
          hash,
        },
        guards: {
          startDate: some({ date: dateTime(start_mint_date) }),
          edition: some({
            editionStartOffset: 0,
          }),
          ...(currency === "SOL"
            ? {
                solPayment: some({
                  lamports: sol(numericPrice),
                  destination: publicKey(actualWalletAddress.toString()),
                }),
                botTax: some({
                  lamports: sol(0.000001),
                  lastInstruction: true,
                }),
              }
            : {
                tokenPayment: {
                  mint: publicKey(mintAddress),
                  destinationAta: publicKey(ataAddress),
                  amount: numericPrice * 1_000_000,
                },
              }),
        },
      });

      // Enviar y confirmar la transacción
      console.log("Enviando transacción para crear Candy Machine...");
      try {
        await createIx.sendAndConfirm(umi, {
          confirm: { commitment: "confirmed" },
        });
        console.log(
          "Candy Machine creado exitosamente:",
          candyMachine.publicKey.toString()
        );
      } catch (txError: any) {
        console.error("Error al enviar la transacción:", txError);

        // Intentar obtener más detalles del error
        if (txError.name === "SendTransactionError") {
          console.error("Detalles del error de transacción:");
          if (txError.logs) {
            console.error("Logs de transacción:", txError.logs);
          }
          if (typeof txError.message === "string") {
            console.error("Mensaje de error:", txError.message);
          }
          if (txError.getLogs && typeof txError.getLogs === "function") {
            try {
              const logs = txError.getLogs();
              console.error("Logs adicionales:", logs);
            } catch (logError) {
              console.error(
                "No se pudieron obtener logs adicionales:",
                logError
              );
            }
          }
        }

        throw new Error(
          `Error al crear Candy Machine: ${
            txError.message || "Error desconocido"
          }`
        );
      }

      // Registrar en la base de datos
      const nftData = {
        collectionId,
        name: trackName,
        description,
        music: "", //`https://ipfs.io/ipfs/${pinataDataFiles.ipfsHash}/${trackFile?.name}`,
        image: "", //`https://ipfs.io/ipfs/${pinataDataFiles.ipfsHash}/${coverImage?.name}`,
        id_item: 0,
        candy_machine: candyMachine.publicKey.toString(),
        artist_address_mint:
          artist_address_mint || actualWalletAddress.toString(),
        copies,
        attributes,
        price: numericPrice,
        currency,
        owner: actualWalletAddress.toString(),
      };

      // Registrar en el backend
      console.log("Registrando NFT en el backend...");
      await submitNftToServer(nftData);

      return {
        success: true,
        candyMachineId: candyMachine.publicKey.toString(),
        //transferStatus,
      };
    } catch (err) {
      console.error("Error agregando items a Candy Machine:", err);
      setError("Fallo al agregar items a Candy Machine");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    addItemsToCandyMachine,
    loading,
    error,
    transferStatus,
  };
}
