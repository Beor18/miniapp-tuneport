import { useState } from "react";
import { useAppKitAccount, useAppKitProvider } from "@Src/lib/privy";
import { toast } from "sonner";
import { contracts } from "@Src/lib/constants/contracts";
import { submitBaseCollectionToServer } from "@Src/app/actions/submitBaseCollectionToServer.actions";
import { slugify } from "../../slugify";
import { type Provider } from "@Src/lib/privy/hooks/usePrivyProvider";

type CreateBaseCollectionParams = {
  collectionType: string;
  collectionName: string;
  description: string;
  itemsAvailable: number;
  coverImage: File | null;
  symbol: string;
  currency: string;
  collaborators: any[];
  artistName: string;
  musicGenre: string;
  recordLabel: string;
  releaseDate: string;
  startDate: string;
  price: number | null;
  plan: string;
};

/**
 * @deprecated Este hook está deprecado. Usa useERC1155Factory en su lugar.
 * useCreateBaseCollection usa un patrón simple (solo backend), mientras que
 * useERC1155Factory usa factory contracts con revenue share y funcionalidades avanzadas.
 */
export function useCreateBaseCollection() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { evmWalletAddress } = useAppKitAccount();
  const { walletProvider: evmWalletProvider } =
    useAppKitProvider<Provider>("evm");

  // Método común para subir la imagen a Pinata
  const uploadImageToPinata = async (coverImage: File | null) => {
    if (!coverImage) {
      throw new Error("No image provided");
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
      throw new Error("Error uploading image to Pinata");
    }

    const imageData = await responseImagePinata.json();
    console.log("Image uploaded to Pinata:", imageData);

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
      throw new Error("Error uploading metadata to Pinata");
    }

    const metadataData = await responseMetadataPinata.json();
    console.log("Metadata uploaded to Pinata:", metadataData);

    // Construir la URL del metadata
    return `https://ipfs.io/ipfs/${metadataData.ipfsHash}/metadata.json`;
  };

  const createBaseCollection = async (params: CreateBaseCollectionParams) => {
    try {
      setLoading(true);
      setError(null);

      // Toast inicial de creación
      toast.loading("Preparing the album creation on Base...", {
        id: "base-album-creation",
      });

      // Verificar la wallet conectada
      if (!evmWalletAddress) {
        throw new Error("No EVM wallet connected for Base");
      }

      // 1. Subir imagen a Pinata
      const coverImageUrl = await uploadImageToPinata(params.coverImage);

      // 2. Crear metadata y subirlo a Pinata
      const metadata = {
        collection_type: params.collectionType,
        name: params.collectionName,
        symbol: params.symbol,
        description: params.description,
        image: coverImageUrl,
        external_url: `https://app.tuneport.xyz/album/${slugify(
          params.collectionName
        )}`,
        address_creator_collection: evmWalletAddress,
        max_items: params.itemsAvailable,
        image_cover: coverImageUrl,
        slug: slugify(params.collectionName),
        network: "base",
        mint_price: params.price || 0,
        mint_currency: "BASE", // En Base siempre usamos BASE como moneda
        community: "tuneport",
        collaborators: params.collaborators,
        music_genre: params.musicGenre,
        artist_name: params.artistName,
        record_label: params.recordLabel || "",
        start_mint_date: params.startDate || "",
        release_date: params.releaseDate || "",
      };

      const metadataUrl = await uploadMetadataToPinata(metadata);

      // En Base no creamos un contrato nuevo por colección, sino que usamos un contrato existente
      // El NFT_CONTRACT_ADDRESS es el contrato principal para Base
      const NFT_CONTRACT_ADDRESS = contracts.baseMainnetContracts.nft;

      // Para Base no hay una transacción on-chain para crear la colección
      // solo registramos en el backend
      const backendResponse = await submitBaseCollectionToServer({
        name: params.collectionName,
        symbol: params.symbol,
        address_creator_collection: evmWalletAddress,
        address_collection: NFT_CONTRACT_ADDRESS,
        description: params.description,
        max_items: params.itemsAvailable,
        image_cover: coverImageUrl,
        slug: slugify(params.collectionName),
        network: "base",
        mint_price: params.price || 0,
        mint_currency: "BASE",
        base_url_image: metadataUrl,
        community: "tuneport",
        collaborators: params.collaborators,
        music_genre: params.musicGenre,
        collection_type: params.collectionType,
        artist_name: params.artistName,
        record_label: params.recordLabel || "",
        release_date: params.releaseDate || "",
        start_mint_date: params.startDate || "",
        tokenURI: metadataUrl,
        is_premium: params.plan === "free" ? false : true,
      });

      // Cerrar cualquier toast de loading anterior
      toast.dismiss("base-album-creation");

      // Mostrar toast de éxito
      toast.success("Created successfully", {
        id: "base-album-success",
      });

      return {
        ...backendResponse,
        blockchain: "base",
      };
    } catch (err) {
      console.error("Error in the creation of the collection on Base:", err);

      // Cerrar cualquier toast de loading anterior
      toast.dismiss("base-album-creation");

      // Mostrar mensaje de error
      toast.error("Error in the creation", {
        description: err instanceof Error ? err.message : "Please try again",
      });

      // Propagar el error para manejo adicional
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createBaseCollection,
    loading,
    error,
  };
}
