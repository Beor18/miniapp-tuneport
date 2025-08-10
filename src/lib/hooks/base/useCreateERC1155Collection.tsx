import { useState, useCallback } from "react";
import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";
import { decodeFunctionData, encodeFunctionData, decodeEventLog } from "viem";
import { MusicNFTFactoryABI } from "@Src/lib/contracts/erc1155/MusicNFTFactoryABI";
import {
  CONTRACT_ADDRESSES,
  DEFAULT_NETWORK,
} from "@Src/lib/contracts/erc1155/config";
import { toast } from "sonner";
import { submitBaseCollectionToServer } from "@Src/app/actions/submitBaseCollectionToServer.actions";
import { slugify } from "@Src/lib/slugify";
import { useRevenueShare } from "@Src/lib/contracts/erc1155/useRevenueShare";
import { useIPFSUpload } from "../common/useIPFSUpload";
import { useBaseWallet } from "./useBaseWallet";
import { useZoraCoinCreation } from "./useZoraCoinCreation";
import { CreateCollectionParams, NFTMetadata, Network } from "./types";

export const useCreateERC1155Collection = (
  network: Network = DEFAULT_NETWORK as Network
) => {
  const { client } = useSmartWallets();
  const { authenticated, getEvmWalletAddress, publicClient } = useBaseWallet();
  const { uploadImageToPinata, uploadMetadataToPinata } = useIPFSUpload();
  const [isLoading, setIsLoading] = useState(false);
  const [collectionAddress, setCollectionAddress] = useState<string | null>(
    null
  );

  // Usar el hook de RevenueShare
  const { createRevenueShare, configureCollectionSplits, revenueShareAddress } =
    useRevenueShare(network);

  // Hook para crear coins automáticamente con Zora SDK
  const { createAutomaticCoin, isCreatingCoin } = useZoraCoinCreation();

  // Obtener la dirección del contrato de factory para la red seleccionada
  const factoryAddress = CONTRACT_ADDRESSES[network]?.factory;

  // Función para crear y subir metadatos
  const createAndUploadMetadata = useCallback(
    async (
      params: CreateCollectionParams,
      imageUrl: string
    ): Promise<string | null> => {
      try {
        // Crear objeto de metadatos mejorado con campos adicionales
        const slug = slugify(params.name);
        const evmAddress = getEvmWalletAddress();
        const metadata: NFTMetadata = {
          name: params.name,
          description:
            params.description || `${params.name} (${params.symbol})`,
          image: imageUrl,
          external_url: `https://miniapp.tuneport.xyz/album/${slug}`,
          attributes: [
            {
              trait_type: "Collection",
              value: params.name,
            },
            {
              trait_type: "Symbol",
              value: params.symbol,
            },
            {
              trait_type: "Mint Start",
              value: new Date(params.mintStartDate * 1000).toISOString(),
            },
            {
              trait_type: "Mint End",
              value: new Date(params.mintEndDate * 1000).toISOString(),
            },
            {
              trait_type: "Price",
              value: params.price,
            },
            {
              trait_type: "Royalty Fee",
              value: `${params.royaltyFee / 100}%`,
            },
          ],
          collection_type: params.collectionType || "music",
          address_creator_collection: evmAddress || undefined,
          max_items: params.maxItems || 1000,
          mint_price: params.price || 0,
          mint_currency: params.symbol || params.currency || "ETH",
          community: "tuneport",
          collaborators:
            params.collaborators?.map((c) => ({
              name: c.name,
              address: c.address,
              mintPercentage: c.mintPercentage,
              royaltyPercentage: c.royaltyPercentage,
            })) || [],
          music_genre: params.musicGenre || "",
          artist_name: params.artistName || "",
          record_label: params.recordLabel || "",
          start_mint_date: new Date(params.mintStartDate * 1000).toISOString(),
          release_date: params.releaseDate || new Date().toISOString(),
          slug: slug,
          network: network,
          symbol: params.symbol,
          image_cover: imageUrl,
        };

        // Subir metadatos a IPFS usando el método mejorado
        const url = await uploadMetadataToPinata(metadata);
        if (url) {
          toast.success("Metadata uploaded successfully");
        }
        return url;
      } catch (error) {
        console.error("Error creating and uploading metadata:", error);
        toast.error("Error uploading metadata");
        return null;
      }
    },
    [getEvmWalletAddress, network, uploadMetadataToPinata]
  );

  // Función para crear una nueva colección
  const createCollection = useCallback(
    async (params: CreateCollectionParams & { nickname?: string }) => {
      console.log("Creating collection...", params);
      // Verificar que el usuario está autenticado y tiene una wallet
      const evmAddress = getEvmWalletAddress();
      if (!authenticated || !evmAddress) {
        toast.error("You must connect your wallet to create a collection");
        return null;
      }

      // Verificar que tenemos la dirección del contrato factory
      if (!factoryAddress) {
        toast.error("Contract not available on this network");
        return null;
      }

      // Verificar que tenemos el cliente de smart wallet
      if (!client) {
        toast.error("Smart Wallet client not found");
        return null;
      }

      setIsLoading(true);

      try {
        console.log("Starting ERC1155 collection creation...", params);

        // Validar address
        if (!evmAddress) {
          throw new Error("No EVM wallet connected");
        }

        // PASO 1: Subir imagen de portada a IPFS
        const imageUrl = await uploadImageToPinata(params.coverImage || null);
        if (!imageUrl) {
          throw new Error("Error uploading cover image");
        }

        // PASO 2: Crear metadata y subirlo a IPFS
        const metadataUrl = await createAndUploadMetadata(params, imageUrl);
        if (!metadataUrl) {
          throw new Error("Error creating metadata");
        }

        // Construir la URI final del contrato
        const finalBaseURI = metadataUrl;

        // Crear Revenue Share contract si es necesario
        let revenueShareContractAddress;
        if (params.createRevenueShare) {
          if (!params.collaborators || params.collaborators.length === 0) {
            throw new Error("Collaborators required for Revenue Share");
          }

          console.log(
            "Creating Revenue Share contract with collaborators:",
            params.collaborators
          );

          revenueShareContractAddress = await createRevenueShare({
            artist: evmAddress as string,
            name: params.revenueShareName || `${params.name} Revenue Sharing`,
            description:
              params.revenueShareDescription ||
              `Automatic revenue distribution system for ${params.name}`,
          });

          if (!revenueShareContractAddress) {
            throw new Error("Error creating Revenue Share contract");
          }

          console.log("Revenue Share created at:", revenueShareContractAddress);
        } else if (params.existingRevenueShareAddress) {
          revenueShareContractAddress = params.existingRevenueShareAddress;
        } else {
          // Si no hay Revenue Share, usar zero address
          revenueShareContractAddress =
            "0x0000000000000000000000000000000000000000";
        }

        // 🪙 CREAR TOKEN AUTOMÁTICAMENTE usando Zora SDK
        let coinAddress: string | null = null;
        try {
          console.log("🚀 Starting automatic coin creation for album...");

          coinAddress = await createAutomaticCoin({
            albumName: params.name,
            albumSymbol: params.symbol,
            albumImageUrl: imageUrl,
            artistAddress: evmAddress as `0x${string}`,
            collaborators: params.collaborators,
          });

          if (coinAddress) {
            console.log("✅ Album coin created successfully:", coinAddress);
            toast.success("🎵 Album tokenized!", {
              description: `$${params.symbol} coin is now live and tradeable`,
            });
          } else {
            console.log("⚠️ Coin creation skipped or failed");
          }
        } catch (coinError) {
          console.error("❌ Error creating album coin:", coinError);
          // Continuar con el flujo normal aunque falle la creación del coin
          toast.error("Album created but coin creation failed", {
            description: "Collection is ready, coin can be created later",
          });
        }

        // Validar dirección royalty receiver
        const royaltyReceiver = params.royaltyReceiver || evmAddress;

        // Determinar el token de pago para el constructor
        // Ahora incluimos la opción del token creado como medio de pago
        let constructorPaymentToken: string;

        if (params.paymentToken === "ETH") {
          constructorPaymentToken =
            "0x0000000000000000000000000000000000000000"; // ETH nativo
        } else if (params.paymentToken !== "ETH" && coinAddress) {
          constructorPaymentToken = coinAddress; // Usar el token creado como medio de pago
          console.log(
            "🪙 Collection will accept the album coin as payment:",
            coinAddress
          );
        } else {
          constructorPaymentToken =
            params.paymentToken || "0x0000000000000000000000000000000000000000";
        }

        // UI options para el diálogo de transacción
        const uiOptions = {
          title: "Create NFT Collection",
          description: "Creating a new music NFT collection",
          buttonText: "Confirm Creation",
        };

        // PASO 3: Crear la colección
        // Codificar los datos de la función con viem
        const data = encodeFunctionData({
          abi: MusicNFTFactoryABI,
          functionName: "createCollection",
          args: [
            params.name, // string
            params.symbol, // string
            finalBaseURI, // string
            finalBaseURI, // string (collectionMetadata)
            BigInt(params.mintStartDate), // uint256
            BigInt(params.mintEndDate), // uint256
            constructorPaymentToken as `0x${string}`, // address
            royaltyReceiver as `0x${string}`, // address
            BigInt(params.royaltyFee), // uint96
            evmAddress as `0x${string}`, // address (artist)
            revenueShareContractAddress as `0x${string}`, // address (revenueShare)
          ],
        });

        console.log("Sending transaction to create collection...");

        // Enviar la transacción usando el cliente smart wallet
        const txHash = await client.sendTransaction(
          {
            to: factoryAddress as `0x${string}`,
            data: data,
            value: BigInt(0),
          },
          { uiOptions }
        );

        console.log("Transaction sent:", txHash);
        toast.success(
          "Collection created successfully! The address will be available shortly."
        );

        // Esperar a que la transacción sea minada y obtener el recibo
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash as `0x${string}`,
        });

        console.log("Transaction receipt:", receipt);

        // Buscar el evento "CollectionCreated" en los logs
        let newCollectionAddress = "";

        // Intentar decodificar todos los logs para encontrar el evento CollectionCreated
        for (const log of receipt.logs) {
          try {
            const decodedLog = decodeEventLog({
              abi: MusicNFTFactoryABI,
              data: log.data,
              topics: log.topics,
            });

            // Verificar si es el evento CollectionCreated
            if (decodedLog.eventName === "CollectionCreated") {
              console.log("CollectionCreated event found:", decodedLog);

              // Obtener la dirección de la colección desde los args del evento
              const args = decodedLog.args as unknown as {
                artist: string;
                collection: string;
                name: string;
                symbol: string;
              };

              newCollectionAddress = args.collection;
              console.log(
                "New collection created at address:",
                newCollectionAddress
              );
              setCollectionAddress(newCollectionAddress);
              break;
            }
          } catch (decodeError) {
            // Continuar con el siguiente log si no se puede decodificar este
            continue;
          }
        }

        // Si no pudimos extraer la dirección del evento, mostrar error
        if (!newCollectionAddress) {
          console.error("Could not get collection address from event");
          toast.error("Could not get collection address");
          return null;
        }

        // PASO 4: Configurar splits en el RevenueShare si tenemos colaboradores
        if (
          revenueShareContractAddress !==
            "0x0000000000000000000000000000000000000000" &&
          params.collaborators &&
          params.collaborators.length > 0
        ) {
          try {
            await configureCollectionSplits({
              collectionAddress: newCollectionAddress,
              revenueShareAddress: revenueShareContractAddress,
              collaborators: params.collaborators,
            });
          } catch (error) {
            console.error("Error al configurar splits:", error);
            // No interrumpir el flujo, la colección ya fue creada
          }
        }

        // Guardar en la base de datos
        try {
          // Datos ampliados para almacenar en la base de datos
          const backendResponse = await submitBaseCollectionToServer({
            name: params.name,
            symbol: params.symbol,
            address_creator_collection: evmAddress as string,
            address_collection: newCollectionAddress as string,
            description:
              params.description || `${params.name} (${params.symbol})`,
            max_items: params.maxItems || 1000,
            image_cover: imageUrl,
            slug: slugify(params.name),
            network: network,
            mint_price: params.price || 0,
            mint_currency: params.paymentToken || "ETH",
            base_url_image: finalBaseURI,
            community: "tuneport",
            collaborators:
              params.collaborators?.map((c) => ({
                name: c.name,
                address: c.address,
                mintPercentage: c.mintPercentage,
                royaltyPercentage: c.royaltyPercentage,
              })) || [],
            music_genre: params.musicGenre || "",
            collection_type: params.collectionType || "ALBUM",
            artist_name: params.nickname || "",
            record_label: params.recordLabel || "",
            release_date: params.releaseDate || new Date().toISOString(),
            start_mint_date: new Date(
              params.mintStartDate * 1000
            ).toISOString(),
            tokenURI: finalBaseURI,
            is_premium: true,
            nickname: params.nickname, // Pasar el nickname para revalidar el perfil
            coin_address: coinAddress || undefined, // Dirección del token creado con Zora SDK
          });

          console.log("Collection saved to database:", backendResponse);
        } catch (dbError) {
          console.error("Error saving to database:", dbError);
          // No interrumpimos el flujo si falla el guardado en la BD
        }

        return newCollectionAddress as string;
      } catch (error: any) {
        console.error("Error creating collection:", error);

        if (error.code === "ACTION_REJECTED") {
          toast.error("You rejected the transaction");
        } else if (error.message && error.message.includes("paymaster")) {
          toast.error("Error with gas payment service. Try again later.");
        } else {
          toast.error("Error creating collection", {
            description: error.message || "Please try again",
          });
        }

        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [
      authenticated,
      getEvmWalletAddress,
      factoryAddress,
      client,
      createAndUploadMetadata,
      network,
      publicClient,
      createRevenueShare,
      configureCollectionSplits,
      uploadImageToPinata,
      createAutomaticCoin,
    ]
  );

  return {
    createCollection,
    isLoading: isLoading || isCreatingCoin,
    collectionAddress,
  };
};
