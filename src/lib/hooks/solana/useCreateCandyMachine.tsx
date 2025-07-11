import { useState } from "react";
import {
  Connection,
  Keypair,
  Transaction,
  PublicKey,
  VersionedTransaction,
  SystemProgram,
} from "@solana/web3.js";
import {
  create,
  mplCandyMachine,
} from "@metaplex-foundation/mpl-core-candy-machine";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  addCollectionPlugin,
  createCollection,
  ruleSet,
} from "@metaplex-foundation/mpl-core";
import {
  generateSigner,
  publicKey,
  some,
  sol,
  transactionBuilder,
  percentAmount,
  dateTime,
  none,
} from "@metaplex-foundation/umi";
import {
  useAppKitAccount,
  useAppKitProvider,
  useAppKitConnection,
} from "@Src/lib/privy";
import { type Provider } from "@Src/lib/privy/hooks/usePrivyProvider";
import { submitCollectionToServer } from "@Src/app/actions/submitCollectionToServer.actions";
import {
  setComputeUnitLimit,
  setComputeUnitPrice,
} from "@metaplex-foundation/mpl-toolbox";
import { slugify } from "../../slugify";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import bs58 from "bs58";
import crypto from "crypto";
import { toast } from "sonner";
import { createUmiAdapter } from "../../utils/createUmiAdapter";
import { TUNEPORT_WALLET_ADDRESS } from "@Src/lib/constants/feeCalculations";

type CreateSolanaCandyMachineParams = {
  collectionType: string;
  collectionName: string;
  description: string;
  itemsAvailable: number;
  coverImage: File | null;
  symbol: string;
  currency: string;
  hydraWalletAddress: string | null;
  hydraRoyalties: any[];
  collaborators: any[];
  artistName: string;
  musicGenre: string;
  recordLabel: string;
  releaseDate: string;
  startDate: string;
  price: number | null;
  plan: string;
  configLineSettings?: {
    prefixName: string;
    nameLength: number;
    prefixUri: string;
    uriLength: number;
    isSequential: boolean;
  };
};

type Web3JsTransactionOrVersionedTransaction =
  | Transaction
  | VersionedTransaction;

export function useCreateCandyMachine() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { address, solanaWalletAddress } = useAppKitAccount();
  const { connection } = useAppKitConnection();
  const { walletProvider } = useAppKitProvider<Provider>("solana");

  // Método común para subir la imagen a Pinata
  const uploadImageToPinata = async (coverImage: File | null) => {
    if (!coverImage) {
      throw new Error("No se proporcionó una imagen");
    }

    // Crear FormData para la imagen
    const imageFormData = new FormData();
    imageFormData.append("cover", coverImage);

    // Subir imagen a Pinata
    const responseImagePinata = await fetch("/api/pinata", {
      method: "POST",
      body: imageFormData,
    });

    if (!responseImagePinata.ok) {
      throw new Error("Error al subir la imagen a Pinata");
    }

    const imageData = await responseImagePinata.json();
    console.log("Imagen subida a Pinata:", imageData);

    // Construir la URL de la imagen
    return `https://ipfs.io/ipfs/${imageData.ipfsHash}/${coverImage.name}`;
  };

  // Método común para subir metadatos a Pinata
  const uploadMetadataToPinata = async (metadata: any) => {
    const metadataFormData = new FormData();
    const metadataBlob = new Blob([JSON.stringify(metadata)], {
      type: "application/json",
    });
    metadataFormData.append("metadata", metadataBlob, "metadata.json");

    // Subir el metadata a Pinata
    const responseMetadataPinata = await fetch("/api/pinata", {
      method: "POST",
      body: metadataFormData,
    });

    if (!responseMetadataPinata.ok) {
      throw new Error("Error al subir los metadatos a Pinata");
    }

    const metadataData = await responseMetadataPinata.json();
    console.log("Metadatos subidos a Pinata:", metadataData);

    // Construir la URL del metadata
    return `https://ipfs.io/ipfs/${metadataData.ipfsHash}/metadata.json`;
  };

  const createCandyMachineAndCollection = async (
    params: CreateSolanaCandyMachineParams
  ) => {
    try {
      setLoading(true);
      setError(null);

      // Toast inicial de creación
      toast.loading("Preparando la creación del álbum en Solana...", {
        id: "album-creation",
      });

      // Verificar la wallet adecuada según blockchain
      if (!solanaWalletAddress) {
        throw new Error("No se detectó una wallet de Solana conectada");
      }

      // 1. Subir imagen a Pinata (común para cualquier blockchain)
      const coverImageUrl = await uploadImageToPinata(params.coverImage);

      // 2. Crear metadata y subirlo a Pinata (común para cualquier blockchain)
      const metadata = {
        collection_type: params.collectionType,
        name: params.collectionName,
        symbol: params.symbol,
        description: params.description,
        image: coverImageUrl,
        external_url: `https://app.tuneport.xyz/album/${slugify(
          params.collectionName
        )}`,
        address_creator_collection: solanaWalletAddress,
        max_items: params.itemsAvailable,
        image_cover: coverImageUrl,
        slug: slugify(params.collectionName),
        network: "solana",
        mint_price: params.plan === "premium" ? params.price || 0 : 2,
        mint_currency: params.plan === "free" ? "USDC" : params.currency,
        community: "tuneport",
        collaborators: params.collaborators,
        hydra_wallet_address: params.hydraWalletAddress,
        music_genre: params.musicGenre,
        artist_name: params.artistName,
        record_label: params.recordLabel || "",
        start_mint_date: params.startDate || "",
        release_date: params.releaseDate || "",
      };

      const metadataUrl = await uploadMetadataToPinata(metadata);

      // Intentamos usar el adaptador UMI con la wallet de Tuneport
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

      // Verificar si el adaptador está usando firma automática
      const isUsingAutoSigner = umiAdapter.isUsingAutoSigner();
      console.log(
        `Adaptador UMI usando firma automática: ${isUsingAutoSigner}`
      );

      // Inicializar Umi con el adaptador
      const umi = createUmi("https://api.devnet.solana.com")
        .use(mplCandyMachine())
        .use(walletAdapterIdentity(umiAdapter));

      // Para la colección
      const collectionSigner = generateSigner(umi);
      const creators = [
        {
          address: publicKey(params.hydraWalletAddress || ""),
          percentage: params.hydraRoyalties[0]?.royalties || 100,
        },
      ];

      const creatorsDb = [
        {
          address: params.hydraWalletAddress || "",
          percentage: params.hydraRoyalties[0]?.royalties || 100,
        },
      ];

      if (!params.hydraWalletAddress) {
        throw new Error("No se encontró dirección de Hydra wallet");
      }

      // Solo crear la colección principal
      const collectionTxBuilder = await createCollection(umi, {
        collection: collectionSigner,
        updateAuthority: publicKey(umi.identity.publicKey.toString()),
        payer: umi.identity,
        name: params.collectionName,
        uri: metadataUrl,
        plugins: [
          {
            type: "MasterEdition",
            maxSupply: 0, // Sin límite para la colección principal
            name: params.collectionName,
            uri: metadataUrl,
          },
          {
            type: "Royalties",
            basisPoints: 2000,
            creators: creators,
            ruleSet: ruleSet("None"),
          },
        ],
      }).sendAndConfirm(umi, {
        confirm: { commitment: "confirmed" },
      });

      console.log("Colección creada en Solana:", collectionTxBuilder);

      // Enviar la colección al backend usando la Server Action
      const backendResponse = await submitCollectionToServer({
        name: params.collectionName,
        symbol: params.symbol,
        address_creator_collection: solanaWalletAddress,
        address_collection: collectionSigner?.publicKey?.toString() || "",
        description: params.description,
        max_items: params.itemsAvailable,
        image_cover: coverImageUrl,
        slug: slugify(params.collectionName),
        network: "solana",
        mint_price: params.plan === "premium" ? params.price || 0 : 2,
        mint_currency: params.plan === "free" ? "USDC" : params.currency,
        base_url_image: metadataUrl,
        candy_machine: "",
        community: "tuneport",
        collaborators: creatorsDb,
        music_genre: params.musicGenre,
        collection_type: params.collectionType,
        artist_name: params.artistName,
        record_label: params.recordLabel || "",
        release_date: params.releaseDate || "",
        start_mint_date: params.startDate || "",
        is_premium: params.plan === "free" ? false : true,
      });

      // Cerrar cualquier toast de loading anterior
      toast.dismiss("album-creation");

      // Mostrar toast de éxito
      toast.success("¡Álbum creado exitosamente en Solana!", {
        id: "album-success",
      });

      return {
        ...backendResponse,
        blockchain: "solana",
      };
    } catch (err) {
      console.error("Error en la creación del álbum en Solana:", err);

      // Cerrar cualquier toast de loading anterior
      toast.dismiss("album-creation");

      // Mostrar mensaje de error
      toast.error("Error en la creación del álbum", {
        description:
          err instanceof Error ? err.message : "Por favor, intenta de nuevo",
      });

      // Propagar el error para manejo adicional
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createCandyMachineAndCollection,
    loading,
    error,
  };
}
