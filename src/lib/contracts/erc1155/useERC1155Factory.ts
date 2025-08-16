"use client";

import { useState, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";
import { useAppKitAccount } from "@Src/lib/privy";
import { decodeFunctionData, encodeFunctionData, decodeEventLog } from "viem";
import { MusicNFTFactoryABI } from "./MusicNFTFactoryABI";
import { MusicCollectionABI } from "./MusicCollectionABI";
import { CONTRACT_ADDRESSES, DEFAULT_NETWORK } from "./config";
import { toast } from "sonner";
import { submitBaseCollectionToServer } from "@Src/app/actions/submitBaseCollectionToServer.actions";
import { submitNftToServer } from "@Src/app/actions/submitNftToServer.actions";
import { slugify } from "@Src/lib/slugify";
import { useRevenueShare } from "./useRevenueShare";
import { useWallets } from "@Src/lib/privy";

import { createPublicClient, http, createWalletClient, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { RevenueShareABI } from "./RevenueShareABI";

export type Network = "sepolia" | "mainnet";

export interface CreateCollectionParams {
  name: string;
  symbol: string;
  baseURI: string;
  mintStartDate: number;
  mintEndDate: number;
  price: number;
  paymentToken: string;
  royaltyReceiver: string;
  royaltyFee: number;
  coverImage?: File;
  description?: string;
  artistName?: string;
  musicGenre?: string;
  recordLabel?: string;
  releaseDate?: string;
  collaborators?: Array<{
    address: string;
    mintPercentage: number;
    royaltyPercentage: number;
    name: string;
  }>;
  collectionType?: string;
  maxItems?: number;
  revenueShareName?: string;
  revenueShareDescription?: string;
  createRevenueShare?: boolean;
  existingRevenueShareAddress?: string;
}

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  collection_type?: string;
  address_creator_collection?: string;
  max_items?: number;
  mint_price?: number;
  mint_currency?: string;
  community?: string;
  collaborators?: any[];
  music_genre?: string;
  artist_name?: string;
  record_label?: string;
  start_mint_date?: string;
  release_date?: string;
  slug?: string;
  network?: string;
  symbol?: string;
  image_cover?: string;
}

export interface NFTItemParams {
  collectionId: string;
  name: string;
  description: string;
  image?: File;
  music?: File;
  copies?: number;
  price?: number;
  tokenId?: number;
  metadata_uri?: string;
}

// Función para obtener el cliente wallet que pagará el gas
const getGasPayerWallet = () => {
  // Leer la clave privada desde las variables de entorno
  const privateKey = process.env.NEXT_PUBLIC_GAS_PAYER_PRIVATE_KEY;

  if (!privateKey) {
    console.error(
      "No se ha configurado NEXT_PUBLIC_GAS_PAYER_PRIVATE_KEY en el .env"
    );
    return null;
  }

  try {
    // Asegurarse que la clave privada tiene el formato correcto
    const formattedPrivateKey = privateKey.startsWith("0x")
      ? (privateKey as `0x${string}`)
      : (`0x${privateKey}` as `0x${string}`);

    // Crear una cuenta a partir de la clave privada
    const account = privateKeyToAccount(formattedPrivateKey);

    // Crear un cliente wallet con esa cuenta
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(
        "https://api.developer.coinbase.com/rpc/v1/base-sepolia/aNh4GkSHTvoOtsTHdpCxLJnuzfmqX8dj"
      ),
    });

    return walletClient;
  } catch (error) {
    console.error("Error al crear el wallet para pagar gas:", error);
    return null;
  }
};

// Función mejorada para subir imagen a Pinata (usando método de useCreateBaseCollection)
const uploadImageToPinata = async (
  coverImage: File | null
): Promise<string | null> => {
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

// Función mejorada para subir metadatos a Pinata (usando método de useCreateBaseCollection)
const uploadMetadataToPinata = async (
  metadata: any
): Promise<string | null> => {
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

export const useERC1155Factory = (
  network: Network = DEFAULT_NETWORK as Network
) => {
  const { authenticated } = usePrivy();
  const { client } = useSmartWallets();
  const { address: userWalletAddress } = useAppKitAccount();
  const { wallets } = useWallets();
  const [isLoading, setIsLoading] = useState(false);
  const [collectionAddress, setCollectionAddress] = useState<string | null>(
    null
  );
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [metadataUrl, setMetadataUrl] = useState<string | null>(null);
  const [nftTokenId, setNftTokenId] = useState<number | null>(null);

  // Obtener la dirección EVM válida
  const getEvmWalletAddress = useCallback((): string | null => {
    const evmWallet = wallets.find(
      (wallet: any) =>
        wallet.walletClientType === "privy" ||
        wallet.walletClientType === "metamask" ||
        wallet.walletClientType === "coinbase_wallet" ||
        wallet.walletClientType === "walletconnect"
    );
    const evmAddress = evmWallet?.address || userWalletAddress || null;
    console.log("getEvmWalletAddress result:", evmAddress);
    return evmAddress;
  }, [wallets, userWalletAddress]);

  // Usar el hook de RevenueShare
  const {
    createRevenueShare,
    getArtistManagers,
    getArtistManagerCount,
    getTotalManagersCreated,
    isManagerCreatedByFactory,
    revenueShareAddress,
  } = useRevenueShare(network);

  // Obtener la dirección del contrato de factory para la red seleccionada
  const factoryAddress = CONTRACT_ADDRESSES[network]?.factory;

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(
      "https://api.developer.coinbase.com/rpc/v1/base-sepolia/aNh4GkSHTvoOtsTHdpCxLJnuzfmqX8dj"
    ), // Reemplaza con tu RPC URL
  });

  // Función para subir la imagen de portada
  const uploadCoverImage = useCallback(
    async (file: File): Promise<string | null> => {
      setIsLoading(true);
      try {
        // Usar la función mejorada de subida a Pinata
        const imageUrl = await uploadImageToPinata(file);
        if (imageUrl) {
          setCoverImageUrl(imageUrl);
          toast.success("Imagen de portada subida correctamente");
        }
        return imageUrl;
      } catch (error) {
        console.error("Error al subir la imagen de portada:", error);
        toast.error("Error al subir la imagen de portada");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

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
            params.description ||
            `Colección NFT ${params.name} (${params.symbol})`,
          image: imageUrl,
          external_url: `https://app.tuneport.xyz/album/${slug}`,
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
          mint_price: params.price,
          mint_currency: "ETH",
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
          setMetadataUrl(url);
          toast.success("Metadatos subidos correctamente");
        }
        return url;
      } catch (error) {
        console.error("Error al crear y subir metadatos:", error);
        toast.error("Error al subir los metadatos");
        return null;
      }
    },
    [getEvmWalletAddress, network]
  );

  // Función para crear una nueva colección
  const createCollection = useCallback(
    async (params: CreateCollectionParams): Promise<string | null> => {
      /*
       * PATRÓN DE PAGO DE GAS:
       * - Factory contracts (Music NFT Factory, Revenue Share Factory): Usa paymaster de Coinbase
       * - Contratos recién creados (Collection instances, RevenueShare instances): Usa gasPayerWallet
       *
       * Esto es porque solo los factory contracts están en la allowlist del paymaster.
       * Los contratos individuales creados dinámicamente no están allowlisted.
       */

      // Verificar que el usuario está autenticado y tiene una wallet
      const evmAddress = getEvmWalletAddress();
      if (!authenticated || !evmAddress) {
        toast.error("Debes conectar tu wallet para crear una colección");
        return null;
      }

      // Verificar que tenemos la dirección del contrato factory
      if (!factoryAddress) {
        toast.error("Contrato no disponible en esta red");
        return null;
      }

      // Verificar que tenemos el cliente de smart wallet
      if (!client) {
        toast.error("No se encontró el cliente de Smart Wallet");
        return null;
      }

      setIsLoading(true);

      try {
        // Proceso de dos pasos para IPFS:
        // 1. Subir imagen (si existe)
        // 2. Crear y subir metadatos JSON con la URL de la imagen

        let finalBaseURI = params.baseURI;
        let imageUrl = "";

        // Paso 1: Subir la imagen (si se proporciona)
        if (params.coverImage) {
          toast.info("Subiendo imagen de portada a IPFS...");
          imageUrl = (await uploadImageToPinata(params.coverImage)) || "";

          if (!imageUrl) {
            toast.error("No se pudo subir la imagen de portada");
            // Continuar con la URI predeterminada
          } else {
            setCoverImageUrl(imageUrl);
            toast.success("Imagen subida correctamente");

            // Paso 2: Crear y subir los metadatos JSON
            toast.info("Creando y subiendo metadatos...");
            const metadataUri = await createAndUploadMetadata(params, imageUrl);

            if (metadataUri) {
              // Usar la URL de los metadatos como URI base para la colección
              finalBaseURI = metadataUri;
              toast.success("Metadatos subidos correctamente");
            } else {
              toast.error(
                "No se pudieron subir los metadatos, usando URI predeterminada"
              );
            }
          }
        }

        // Determinar la dirección del contrato RevenueShare
        let revenueShareContractAddress =
          params.existingRevenueShareAddress ||
          "0x0000000000000000000000000000000000000000";

        // Si se requiere crear un nuevo contrato RevenueShare, crearlo primero
        if (params.createRevenueShare && !params.existingRevenueShareAddress) {
          toast.info("Creando contrato de distribución de ingresos...");

          const newRevenueShareAddress = await createRevenueShare({
            artist: evmAddress,
            name: params.revenueShareName || `${params.name} - Revenue Share`,
            description:
              params.revenueShareDescription ||
              `Contrato de distribución de ingresos para la colección ${params.name}`,
          });

          if (newRevenueShareAddress) {
            revenueShareContractAddress = newRevenueShareAddress;
            toast.success("Contrato de distribución creado correctamente");
          } else {
            toast.error(
              "No se pudo crear el contrato de distribución, continuando sin él"
            );
          }
        }

        // PASO NUEVO: gasPayerWallet ya es MANAGER desde el constructor
        // No necesitamos agregarlo como manager, ya que el constructor del RevenueShare
        // asigna MANAGER_ROLE a msg.sender (que es gasPayerWallet)
        console.log("LLEGA 00 ????");
        if (
          revenueShareContractAddress !==
          "0x0000000000000000000000000000000000000000"
        ) {
          const gasPayerWallet = getGasPayerWallet();
          if (gasPayerWallet) {
            console.log(
              "gasPayerWallet ya es manager desde el constructor del RevenueShare"
            );
            toast.success(
              "gasPayerWallet configurado como manager automáticamente"
            );
          } else {
            console.error("No se pudo obtener gasPayerWallet");
            toast.error("No se pudo configurar gasPayerWallet");
          }
        }

        // Convertir el precio a unidades wei como string hexadecimal para viem
        const priceInWei = BigInt(Math.floor(params.price * 10 ** 18));

        // Validar dirección royalty receiver
        const royaltyReceiver = params.royaltyReceiver || evmAddress;

        // Determinar el token de pago para el constructor
        // Si es DAI, pasar address(0) en el constructor y configurar después con addPaymentToken
        const constructorPaymentToken =
          params.paymentToken === "DAI"
            ? "0x0000000000000000000000000000000000000000" // ETH nativo en constructor
            : params.paymentToken ||
              "0x0000000000000000000000000000000000000000";

        // UI options para el diálogo de transacción
        const uiOptions = {
          title: "Crear Colección NFT",
          description: "Creando una nueva colección de NFTs musicales",
          buttonText: "Confirmar Creación",
        };

        // PASO 3: Crear la colección
        // Codificar los datos de la función con viem
        const data = encodeFunctionData({
          abi: MusicNFTFactoryABI,
          functionName: "createCollection",
          args: [
            params.name,
            params.symbol,
            finalBaseURI,
            finalBaseURI, // Usar la misma URI como collectionMetadata
            BigInt(params.mintStartDate),
            BigInt(params.mintEndDate),
            priceInWei,
            constructorPaymentToken as `0x${string}`,
            royaltyReceiver as `0x${string}`,
            params.royaltyFee,
            evmAddress as `0x${string}`, // artist address
            revenueShareContractAddress as `0x${string}`, // revenue share address
          ],
        });

        console.log("Enviando transacción para crear colección...");

        // Enviar la transacción usando el cliente smart wallet
        const txHash = await client.sendTransaction(
          {
            to: factoryAddress as `0x${string}`,
            data: data,
            value: BigInt(0),
          },
          { uiOptions }
        );

        console.log("Transacción enviada:", txHash);
        toast.success(
          "¡Colección creada con éxito! La dirección estará disponible en breve."
        );

        // Esperar a que la transacción sea minada y obtener el recibo
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash as `0x${string}`,
        });

        console.log("Recibo de la transacción:", receipt);
        toast.success(
          "¡Colección creada con éxito! La dirección estará disponible en breve."
        );

        // Buscar el evento "CollectionCreated" en los logs
        // Filtrar logs por el evento CollectionCreated usando el topic hash
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
              console.log("Evento CollectionCreated encontrado:", decodedLog);

              // Obtener la dirección de la colección desde los args del evento
              const args = decodedLog.args as unknown as {
                artist: string;
                collection: string;
                name: string;
                symbol: string;
              };

              newCollectionAddress = args.collection;
              console.log(
                "Nueva colección creada en dirección:",
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
          console.error(
            "No se pudo obtener la dirección de la colección del evento"
          );
          toast.error("No se pudo obtener la dirección de la colección");
          return null;
        }

        // PASO 4: Configurar splits en el RevenueShare (ahora que tenemos la dirección de la colección)
        if (
          revenueShareContractAddress !==
            "0x0000000000000000000000000000000000000000" &&
          params.collaborators &&
          params.collaborators.length > 0
        ) {
          try {
            toast.info("Configurando distribución de colaboradores...");

            // Obtener el wallet que pagará el gas para operaciones en contratos no allowlisted
            const gasPayerWallet = getGasPayerWallet();

            if (!gasPayerWallet) {
              toast.error(
                "No se pudo configurar la wallet para pagar el gas de splits"
              );
              console.error("No se puede configurar splits sin gasPayerWallet");
              // Continuar sin configurar splits, la colección ya fue creada
            } else {
              // VERIFICAR PERMISOS ANTES DE CONTINUAR
              console.log(
                "gasPayerWallet address:",
                gasPayerWallet.account.address
              );
              console.log(
                "RevenueShare contract:",
                revenueShareContractAddress
              );

              // Verificar el owner del contrato RevenueShare
              try {
                const owner = await publicClient.readContract({
                  address: revenueShareContractAddress as `0x${string}`,
                  abi: RevenueShareABI,
                  functionName: "owner",
                  args: [],
                });
                console.log("RevenueShare owner (artista):", owner);
                console.log("Artista es:", evmAddress);
                console.log(
                  "¿Owner coincide con artista?",
                  owner.toLowerCase() === evmAddress.toLowerCase()
                );
              } catch (ownerError) {
                console.error("Error verificando owner:", ownerError);
              }

              // Verificar si gasPayerWallet es manager
              try {
                const isManager = await publicClient.readContract({
                  address: revenueShareContractAddress as `0x${string}`,
                  abi: RevenueShareABI,
                  functionName: "isManager",
                  args: [gasPayerWallet.account.address],
                });
                console.log("gasPayerWallet es manager:", isManager);

                // Verificar si el artista es manager (no debería serlo, pero veamos)
                const artistIsManager = await publicClient.readContract({
                  address: revenueShareContractAddress as `0x${string}`,
                  abi: RevenueShareABI,
                  functionName: "isManager",
                  args: [evmAddress as `0x${string}`],
                });
                console.log("Artista es manager:", artistIsManager);

                if (!isManager) {
                  console.error("gasPayerWallet NO tiene rol MANAGER_ROLE");

                  // SOLUCIÓN TEMPORAL: Que el artista agregue gasPayerWallet como manager
                  // usando el client (smart wallet con paymaster) si el contrato está allowlisted
                  console.log(
                    "Intentando que el artista agregue gasPayerWallet como manager..."
                  );

                  try {
                    const addManagerData = encodeFunctionData({
                      abi: RevenueShareABI,
                      functionName: "addManager",
                      args: [gasPayerWallet.account.address],
                    });

                    // UI options para el diálogo de transacción
                    const uiOptions = {
                      title: "Agregar Manager",
                      description:
                        "Agregando gasPayerWallet como manager para configurar splits",
                      buttonText: "Confirmar",
                    };

                    // El artista (owner) agrega gasPayerWallet como manager
                    const addManagerTx = await client.sendTransaction(
                      {
                        to: revenueShareContractAddress as `0x${string}`,
                        data: addManagerData,
                        value: BigInt(0),
                      },
                      { uiOptions }
                    );

                    await publicClient.waitForTransactionReceipt({
                      hash: addManagerTx,
                    });

                    console.log(
                      "gasPayerWallet agregado como manager exitosamente"
                    );
                    toast.success(
                      "Permisos de manager configurados correctamente"
                    );
                  } catch (addManagerError) {
                    console.error(
                      "Error agregando gasPayerWallet como manager:",
                      addManagerError
                    );
                    toast.error("Error configurando permisos de manager");
                    throw new Error("No se pudo configurar permisos");
                  }
                }
              } catch (permissionError) {
                console.error("Error verificando permisos:", permissionError);
                toast.error("Error verificando permisos de manager");
                throw permissionError;
              }

              // Preparar shares de MINT (ventas primarias) para el contrato (porcentajes en base 10000 = 100%)
              const mintShares = params.collaborators.map((collab) => ({
                account: collab.address as `0x${string}`,
                percentage: Math.floor(collab.mintPercentage * 100), // Convertir de % a basis points
              }));

              // Verificar que los porcentajes sumen exactamente 10000
              const totalMintPercentage = mintShares.reduce(
                (sum, share) => sum + share.percentage,
                0
              );
              console.log("Mint shares:", mintShares);
              console.log("Total mint percentage:", totalMintPercentage);

              if (totalMintPercentage !== 10000) {
                console.error(
                  `Error: Total mint percentage es ${totalMintPercentage}, debe ser 10000`
                );
                toast.error(
                  `Error: Porcentajes de mint suman ${
                    totalMintPercentage / 100
                  }%, debe ser 100%`
                );
                throw new Error(
                  `Porcentajes incorrectos: ${totalMintPercentage}`
                );
              }

              // Codificar la función setCollectionMintSplits
              const mintSplitsData = encodeFunctionData({
                abi: [
                  {
                    name: "setCollectionMintSplits",
                    type: "function",
                    inputs: [
                      { name: "collection", type: "address" },
                      {
                        name: "shares",
                        type: "tuple[]",
                        components: [
                          { name: "account", type: "address" },
                          { name: "percentage", type: "uint96" },
                        ],
                      },
                    ],
                    outputs: [],
                  },
                ],
                functionName: "setCollectionMintSplits",
                args: [newCollectionAddress as `0x${string}`, mintShares],
              });

              console.log("Enviando transacción setCollectionMintSplits...");
              // Enviar transacción para configurar splits de mint usando gasPayerWallet
              const splitsTxHash = await gasPayerWallet.sendTransaction({
                to: revenueShareContractAddress as `0x${string}`,
                data: mintSplitsData,
                value: BigInt(0),
              });

              // Esperar confirmación de la transacción de splits
              await publicClient.waitForTransactionReceipt({
                hash: splitsTxHash,
              });

              toast.success(
                "Distribución de ventas configurada correctamente (gas pagado por desarrollador)"
              );
            }
          } catch (error) {
            console.error("Error al configurar splits de mint:", error);
            toast.error("Error al configurar la distribución de ventas");
            // No interrumpir el flujo, la colección ya fue creada
          }

          // También configurar royalties de reventa con distribución específica
          try {
            toast.info("Configurando royalties de reventa...");

            // Obtener el wallet que pagará el gas
            const gasPayerWallet = getGasPayerWallet();

            if (!gasPayerWallet) {
              toast.error(
                "No se pudo configurar la wallet para pagar el gas de royalties"
              );
              console.error(
                "No se puede configurar royalties sin gasPayerWallet"
              );
              // Continuar sin configurar royalties, la colección ya fue creada
            } else {
              // Preparar shares de ROYALTIES (ventas secundarias) para el contrato
              const royaltiesShares = params.collaborators.map((collab) => ({
                account: collab.address as `0x${string}`,
                percentage: Math.floor(collab.royaltyPercentage * 100), // Convertir de % a basis points
              }));

              // Verificar que los porcentajes sumen exactamente 10000
              const totalRoyaltiesPercentage = royaltiesShares.reduce(
                (sum, share) => sum + share.percentage,
                0
              );
              console.log("Royalties shares:", royaltiesShares);
              console.log(
                "Total royalties percentage:",
                totalRoyaltiesPercentage
              );

              if (totalRoyaltiesPercentage !== 10000) {
                console.error(
                  `Error: Total royalties percentage es ${totalRoyaltiesPercentage}, debe ser 10000`
                );
                toast.error(
                  `Error: Porcentajes de royalties suman ${
                    totalRoyaltiesPercentage / 100
                  }%, debe ser 100%`
                );
                throw new Error(
                  `Porcentajes incorrectos: ${totalRoyaltiesPercentage}`
                );
              }

              // Codificar la función setCollectionResaleRoyalties
              const royaltiesData = encodeFunctionData({
                abi: [
                  {
                    name: "setCollectionResaleRoyalties",
                    type: "function",
                    inputs: [
                      { name: "collection", type: "address" },
                      {
                        name: "shares",
                        type: "tuple[]",
                        components: [
                          { name: "account", type: "address" },
                          { name: "percentage", type: "uint96" },
                        ],
                      },
                    ],
                    outputs: [],
                  },
                ],
                functionName: "setCollectionResaleRoyalties",
                args: [newCollectionAddress as `0x${string}`, royaltiesShares],
              });

              console.log(
                "Enviando transacción setCollectionResaleRoyalties..."
              );
              // Enviar transacción para configurar royalties usando gasPayerWallet
              const royaltiesTxHash = await gasPayerWallet.sendTransaction({
                to: revenueShareContractAddress as `0x${string}`,
                data: royaltiesData,
                value: BigInt(0),
              });

              // Esperar confirmación de la transacción de royalties
              await publicClient.waitForTransactionReceipt({
                hash: royaltiesTxHash,
              });

              toast.success(
                "Royalties de reventa configurados correctamente (gas pagado por desarrollador)"
              );
            }
          } catch (error) {
            console.error("Error al configurar royalties:", error);
            toast.error("Error al configurar royalties de reventa");
            // No interrumpir el flujo, la colección ya fue creada
          }
        }

        // PASO 5: Configurar token DAI si fue seleccionado
        if (params.paymentToken === "DAI") {
          try {
            toast.info("Configurando DAI como método de pago...");

            // Obtener el wallet que pagará el gas
            const gasPayerWallet = getGasPayerWallet();

            if (!gasPayerWallet) {
              toast.error(
                "No se pudo configurar la wallet para pagar el gas de DAI"
              );
              console.error(
                "No se pudo obtener gasPayerWallet para configurar DAI"
              );
              // Continuar sin configurar DAI, la colección ya fue creada
            } else {
              // Dirección del contrato DAI en Base Sepolia (ajustar según la red)
              const DAI_ADDRESS = "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb"; // Ejemplo, verificar dirección real

              // Convertir precio DAI a unidades wei (18 decimales)
              const daiPriceInWei = BigInt(Math.floor(params.price * 10 ** 18));

              // Codificar la función addPaymentToken
              const addPaymentTokenData = encodeFunctionData({
                abi: [
                  {
                    name: "addPaymentToken",
                    type: "function",
                    inputs: [
                      { name: "_token", type: "address" },
                      { name: "_price", type: "uint256" },
                    ],
                    outputs: [],
                  },
                ],
                functionName: "addPaymentToken",
                args: [DAI_ADDRESS as `0x${string}`, daiPriceInWei],
              });

              // Enviar transacción para agregar DAI como token de pago usando la wallet del desarrollador
              const daiTxHash = await gasPayerWallet.sendTransaction({
                to: newCollectionAddress as `0x${string}`,
                data: addPaymentTokenData,
                value: BigInt(0),
              });

              // Esperar confirmación de la transacción DAI
              await publicClient.waitForTransactionReceipt({
                hash: daiTxHash,
              });

              toast.success(
                "DAI configurado como método de pago (gas pagado por desarrollador)"
              );
            }
          } catch (error) {
            console.error("Error al configurar DAI:", error);
            toast.error("Error al configurar DAI como método de pago");
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
              params.description ||
              `Colección NFT ${params.name} (${params.symbol})`,
            max_items: params.maxItems || 1000,
            image_cover: imageUrl,
            slug: slugify(params.name),
            network: network,
            mint_price: params.price,
            mint_currency: "ETH",
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
            artist_name: params.artistName || "",
            record_label: params.recordLabel || "",
            release_date: params.releaseDate || new Date().toISOString(),
            start_mint_date: new Date(
              params.mintStartDate * 1000
            ).toISOString(),
            tokenURI: finalBaseURI,
            is_premium: true,
          });

          console.log(
            "Colección guardada en la base de datos:",
            backendResponse
          );
        } catch (dbError) {
          console.error("Error al guardar en la base de datos:", dbError);
          // No interrumpimos el flujo si falla el guardado en la BD
        }

        return newCollectionAddress as string;
      } catch (error: any) {
        console.error("Error al crear la colección:", error);

        if (error.code === "ACTION_REJECTED") {
          toast.error("Has rechazado la transacción");
        } else if (error.message && error.message.includes("paymaster")) {
          toast.error(
            "Error con el servicio de pago de gas. Intenta de nuevo más tarde."
          );
        } else {
          toast.error("Error al crear la colección", {
            description: error.message || "Por favor, intenta de nuevo",
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
    ]
  );

  // Función para mint donde usuario paga precio y desarrollador paga solo gas (SIN PAYMASTER)
  const mintTokenDeveloperPaysGas = useCallback(
    async (
      collectionAddress: string,
      to: string,
      tokenId: number,
      amount: number,
      tokenMetadata: string
    ): Promise<boolean> => {
      const evmAddress = getEvmWalletAddress();
      if (!authenticated || !evmAddress) {
        toast.error("Debes conectar tu wallet para mintear tokens");
        return false;
      }

      if (!client) {
        toast.error("No se encontró el cliente de Smart Wallet");
        return false;
      }

      if (!to) {
        toast.error("La dirección del destinatario es necesaria");
        return false;
      }

      setIsLoading(true);

      try {
        const gasPayerWallet = getGasPayerWallet();

        const userWalletClient = createWalletClient({
          account: evmAddress as `0x${string}`,
          chain: baseSepolia,
          transport: http(
            "https://api.developer.coinbase.com/rpc/v1/base-sepolia/aNh4GkSHTvoOtsTHdpCxLJnuzfmqX8dj"
          ),
        });

        if (!gasPayerWallet) {
          toast.error("No se pudo configurar la wallet para pagar el gas");
          return false;
        }

        console.log("Usuario que pagará el precio:", evmAddress);

        // 1. LEER CONFIGURACIÓN DEL CONTRATO
        const price = (await publicClient.readContract({
          address: collectionAddress as `0x${string}`,
          abi: MusicCollectionABI,
          functionName: "price",
        })) as bigint;

        const mintStartDate = (await publicClient.readContract({
          address: collectionAddress as `0x${string}`,
          abi: MusicCollectionABI,
          functionName: "mintStartDate",
        })) as bigint;

        const mintEndDate = (await publicClient.readContract({
          address: collectionAddress as `0x${string}`,
          abi: MusicCollectionABI,
          functionName: "mintEndDate",
        })) as bigint;

        const paymentToken = (await publicClient.readContract({
          address: collectionAddress as `0x${string}`,
          abi: MusicCollectionABI,
          functionName: "paymentToken",
        })) as string;

        console.log("Configuración del contrato:", {
          price: price.toString(),
          mintStartDate: Number(mintStartDate),
          mintEndDate: Number(mintEndDate),
          paymentToken,
        });

        // 2. VALIDAR FECHAS
        const currentTime = Math.floor(Date.now() / 1000);
        if (currentTime < Number(mintStartDate)) {
          toast.error(
            `Mint no ha comenzado. Inicia el ${new Date(
              Number(mintStartDate) * 1000
            ).toLocaleString()}`
          );
          return false;
        }
        if (currentTime > Number(mintEndDate)) {
          toast.error(
            `Mint ha terminado. Terminó el ${new Date(
              Number(mintEndDate) * 1000
            ).toLocaleString()}`
          );
          return false;
        }

        // 3. DETERMINAR TIPO DE MINT Y PRECIO
        const isNativeToken =
          paymentToken === "0x0000000000000000000000000000000000000000";
        const totalCost = BigInt(price) * BigInt(amount);

        if (isNativeToken) {
          // =====================================
          // ETH NATIVO: DESARROLLADOR PAGA GAS, USUARIO TRANSFIERE ETH
          // =====================================

          toast.info(
            "Mint con ETH: Desarrollador paga gas, usuario transfiere ETH"
          );

          // Verificar balance del usuario
          const userBalance = await publicClient.getBalance({
            address: evmAddress as `0x${string}`,
          });

          if (userBalance < totalCost) {
            toast.error(
              `Balance insuficiente. Necesitas ${
                Number(totalCost) / 1e18
              } ETH pero tienes ${Number(userBalance) / 1e18} ETH`
            );
            return false;
          }

          // PASO 1: Usuario transfiere ETH a gasPayerWallet
          toast.info("Paso 1/2: Transfiriendo ETH para el mint...");

          console.log("LLEGA AQUI 00?????: ");

          const mintData = encodeFunctionData({
            abi: MusicCollectionABI,
            functionName: "mint",
            args: [
              to as `0x${string}`,
              BigInt(tokenId),
              BigInt(amount),
              tokenMetadata,
            ],
          });

          console.log("LLEGA AQUI 01?????: ");

          // const authorization = await userWalletClient.signTransaction({
          //   to: collectionAddress as `0x${string}`,
          //   data: mintData,
          //   value: totalCost,
          // });

          // console.log("authorization:", authorization);

          const mintTxHash = await userWalletClient.sendTransaction({
            to: collectionAddress as `0x${string}`,
            data: mintData,
            value: totalCost,
          });

          console.log("Mint ETH completado:", mintTxHash);
          toast.success(
            "¡ETH mint exitoso! Desarrollador pagó gas, usuario pagó precio"
          );

          await publicClient.waitForTransactionReceipt({ hash: mintTxHash });
          return true;
        } else {
          // =====================================
          // ERC20: USUARIO PAGA TOKENS, DESARROLLADOR PAGA GAS
          // =====================================

          // Verificar que el token esté aceptado
          const acceptedPrice = await publicClient.readContract({
            address: collectionAddress as `0x${string}`,
            abi: MusicCollectionABI,
            functionName: "acceptedTokens",
            args: [paymentToken as `0x${string}`],
          });

          if (acceptedPrice === BigInt(0)) {
            toast.error("Token ERC20 no está configurado como método de pago");
            return false;
          }

          // Verificar balance del usuario
          const tokenBalance = (await publicClient.readContract({
            address: paymentToken as `0x${string}`,
            abi: [
              {
                name: "balanceOf",
                type: "function",
                inputs: [{ name: "account", type: "address" }],
                outputs: [{ name: "", type: "uint256" }],
              },
            ],
            functionName: "balanceOf",
            args: [evmAddress as `0x${string}`],
          })) as bigint;

          if (tokenBalance < totalCost) {
            toast.error(
              `Balance insuficiente. Necesitas ${
                Number(totalCost) / 1e18
              } tokens pero tienes ${Number(tokenBalance) / 1e18} tokens`
            );
            return false;
          }

          // Verificar allowance del usuario hacia la wallet del desarrollador
          const allowance = (await publicClient.readContract({
            address: paymentToken as `0x${string}`,
            abi: [
              {
                name: "allowance",
                type: "function",
                inputs: [
                  { name: "owner", type: "address" },
                  { name: "spender", type: "address" },
                ],
                outputs: [{ name: "", type: "uint256" }],
              },
            ],
            functionName: "allowance",
            args: [evmAddress as `0x${string}`, gasPayerWallet.account.address],
          })) as bigint;

          if (allowance < totalCost) {
            toast.error(
              `Debes aprobar ${
                Number(totalCost) / 1e18
              } tokens para la wallet del desarrollador primero`
            );
            return false;
          }

          toast.info(
            "Mint con ERC20: Usuario paga tokens, desarrollador paga gas"
          );

          // PASO 1: Desarrollador transfiere tokens del usuario usando allowance
          toast.info("Paso 1/2: Transfiriendo tokens del usuario...");

          const transferData = encodeFunctionData({
            abi: [
              {
                name: "transferFrom",
                type: "function",
                inputs: [
                  { name: "from", type: "address" },
                  { name: "to", type: "address" },
                  { name: "amount", type: "uint256" },
                ],
                outputs: [{ name: "", type: "bool" }],
              },
            ],
            functionName: "transferFrom",
            args: [
              evmAddress as `0x${string}`,
              gasPayerWallet.account.address,
              totalCost,
            ],
          });

          const transferTxHash = await gasPayerWallet.sendTransaction({
            to: paymentToken as `0x${string}`,
            data: transferData,
            value: BigInt(0),
          });

          await publicClient.waitForTransactionReceipt({
            hash: transferTxHash,
          });

          console.log("Tokens transferidos:", transferTxHash);

          // PASO 2: Desarrollador aprueba tokens al contrato y ejecuta mint
          toast.info("Paso 2/2: Ejecutando mint...");

          const approveData = encodeFunctionData({
            abi: [
              {
                name: "approve",
                type: "function",
                inputs: [
                  { name: "spender", type: "address" },
                  { name: "amount", type: "uint256" },
                ],
                outputs: [{ name: "", type: "bool" }],
              },
            ],
            functionName: "approve",
            args: [collectionAddress as `0x${string}`, totalCost],
          });

          const approveTxHash = await gasPayerWallet.sendTransaction({
            to: paymentToken as `0x${string}`,
            data: approveData,
            value: BigInt(0),
          });

          await publicClient.waitForTransactionReceipt({
            hash: approveTxHash,
          });

          // Ejecutar mint
          const mintData = encodeFunctionData({
            abi: MusicCollectionABI,
            functionName: "mintWithERC20",
            args: [
              to as `0x${string}`,
              BigInt(tokenId),
              BigInt(amount),
              paymentToken as `0x${string}`,
              tokenMetadata,
            ],
          });

          const mintTxHash = await gasPayerWallet.sendTransaction({
            to: collectionAddress as `0x${string}`,
            data: mintData,
            value: BigInt(0),
          });

          console.log("Mint ERC20 completado:", mintTxHash);
          toast.success(
            "¡ERC20 mint exitoso! Usuario pagó tokens, desarrollador pagó gas"
          );

          await publicClient.waitForTransactionReceipt({ hash: mintTxHash });
          return true;
        }
      } catch (error: any) {
        console.error("Error al mintear tokens:", error);

        if (error.code === "ACTION_REJECTED") {
          toast.error("Has rechazado la transacción");
        } else if (error.message?.includes("MintNotStarted")) {
          toast.error("El periodo de mint aún no ha comenzado");
        } else if (error.message?.includes("MintEnded")) {
          toast.error("El periodo de mint ha terminado");
        } else if (error.message?.includes("InsufficientPayment")) {
          toast.error("Pago insuficiente para el mint");
        } else if (error.message?.includes("UnsupportedToken")) {
          toast.error("Token de pago no soportado");
        } else if (error.message?.includes("ExceedsMaxSupply")) {
          toast.error("Excede el suministro máximo permitido");
        } else {
          toast.error("Error al mintear tokens", {
            description: error.message || "Por favor, intenta de nuevo",
          });
        }

        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [authenticated, getEvmWalletAddress, client, publicClient]
  );

  // Función para mint tokens desde una colección
  const mintToken = useCallback(
    async (
      collectionAddress: string,
      to: string,
      tokenId: number,
      amount: number,
      tokenMetadata: string,
      useNativeToken: boolean = true,
      paymentTokenAddress?: string
    ): Promise<boolean> => {
      const evmAddress = getEvmWalletAddress();
      if (!authenticated || !evmAddress) {
        toast.error("Debes conectar tu wallet para mintear tokens");
        return false;
      }

      if (!client) {
        toast.error("No se encontró el cliente de Smart Wallet");
        return false;
      }

      setIsLoading(true);

      try {
        // UI options para el diálogo de transacción
        const uiOptions = {
          title: "Mint NFT",
          description: useNativeToken
            ? "Minteando NFT con token nativo"
            : "Minteando NFT con token ERC20",
          buttonText: "Confirmar Mint",
        };

        let data;
        let value = BigInt(0);

        if (useNativeToken) {
          // Mint con token nativo (ETH)
          // Ya que no podemos consultar el precio desde el contrato de manera simple con viem,
          // debemos asumir que el frontend ya conoce el precio o pasarlo como parámetro adicional
          // Por simplicidad, asumimos que el frontend maneja esto

          data = encodeFunctionData({
            abi: MusicCollectionABI,
            functionName: "mint",
            args: [
              to as `0x${string}`,
              BigInt(tokenId),
              BigInt(amount),
              tokenMetadata,
            ],
          });

          // Aquí normalmente estableceríamos el valor en ETH a enviar
          // Idealmente debería venir de un parámetro o consulta previa
          // value = precio * amount (como BigInt)
        } else if (paymentTokenAddress) {
          // Mint con token ERC20
          data = encodeFunctionData({
            abi: MusicCollectionABI,
            functionName: "mintWithERC20",
            args: [
              to as `0x${string}`,
              BigInt(tokenId),
              BigInt(amount),
              paymentTokenAddress as `0x${string}`,
              tokenMetadata,
            ],
          });
        } else {
          throw new Error(
            "Se requiere una dirección de token para mint con ERC20"
          );
        }

        console.log("Enviando transacción para mintear...");

        // Enviar la transacción
        const txHash = await client.sendTransaction(
          {
            to: collectionAddress as `0x${string}`,
            data: data,
            value: value,
          },
          { uiOptions }
        );

        console.log("Transacción de mint enviada:", txHash);
        toast.success("¡Tokens minteados con éxito!");

        return true;
      } catch (error: any) {
        console.error("Error al mintear tokens:", error);

        if (error.code === "ACTION_REJECTED") {
          toast.error("Has rechazado la transacción");
        } else if (error.message && error.message.includes("paymaster")) {
          toast.error(
            "Error con el servicio de pago de gas. Intenta de nuevo más tarde."
          );
        } else {
          toast.error("Error al mintear tokens", {
            description: error.message || "Por favor, intenta de nuevo",
          });
        }

        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [authenticated, getEvmWalletAddress, client]
  );

  // Función para obtener el siguiente tokenId disponible para una colección
  const getNextTokenId = useCallback(
    async (collectionId: string): Promise<number> => {
      try {
        // Consultar la API local para obtener el último tokenId de la colección
        const response = await fetch(
          `/api/nfts/last-token-id?collectionId=${collectionId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          // Si hay NFTs en la colección, retornar el siguiente ID
          // Si lastTokenId es -1 (no hay NFTs), el próximo será 0
          return data.lastTokenId + 1;
        } else {
          // Si la API falla o no encuentra datos, empezar desde 0
          console.warn(
            "No se pudo obtener el último tokenId, comenzando desde 0"
          );
          return 0;
        }
      } catch (error) {
        console.error("Error al obtener el último tokenId:", error);
        // En caso de error, empezar desde 0
        return 0;
      }
    },
    []
  );

  // Función para crear un NFT individual y guardarlo en la base de datos
  const createNFTItem = useCallback(
    async (
      params: NFTItemParams
    ): Promise<{ metadataUrl: string; tokenId: number }> => {
      const evmAddress = getEvmWalletAddress();
      if (!authenticated || !evmAddress) {
        throw new Error("Debes conectar tu wallet para crear un NFT");
      }

      setIsLoading(true);

      try {
        // 1. Obtener el siguiente tokenId disponible
        const tokenId =
          params.tokenId || (await getNextTokenId(params.collectionId));
        setNftTokenId(tokenId);

        // 2. Subir imagen a IPFS si existe
        let imageUrl = "";
        if (params.image) {
          toast.info("Subiendo imagen a IPFS...");

          imageUrl = (await uploadImageToPinata(params.image)) || "";

          if (!imageUrl) {
            throw new Error("Error al subir la imagen a IPFS");
          }
          setCoverImageUrl(imageUrl);
          toast.success("Imagen subida correctamente");
        }

        // 3. Subir música a IPFS si existe
        let musicUrl = "";
        if (params.music) {
          toast.info("Subiendo música a IPFS...");

          // Crear FormData para la música
          const musicFormData = new FormData();
          musicFormData.append("cover", params.music);

          // Subir música a Pinata
          const responseMusicPinata = await fetch("/api/pinata", {
            method: "POST",
            body: musicFormData,
          });

          if (!responseMusicPinata.ok) {
            throw new Error("Error al subir la música a Pinata");
          }

          const musicData = await responseMusicPinata.json();
          musicUrl = `https://ipfs.io/ipfs/${musicData.ipfsHash}/${params.music.name}`;
          toast.success("Música subida correctamente");
        }

        // 4. Crear metadatos del NFT
        const nftMetadata = {
          name: params.name,
          description: params.description,
          image: imageUrl,
          external_url: `https://app.tuneport.xyz/track/${params.name
            .toLowerCase()
            .replace(/\s+/g, "-")}`,
          attributes: [
            {
              trait_type: "Collection",
              value: params.collectionId,
            },
            {
              trait_type: "Copies",
              value: params.copies || 1,
            },
            {
              trait_type: "Token ID",
              value: tokenId,
            },
          ],
          music: musicUrl,
        };

        // 5. Subir metadatos a IPFS
        toast.info("Subiendo metadatos a IPFS...");
        const metadataUrl = await uploadMetadataToPinata(nftMetadata);

        if (!metadataUrl) {
          throw new Error("Error al subir los metadatos a IPFS");
        }

        setMetadataUrl(metadataUrl);
        toast.success("Metadatos subidos correctamente");

        // 6. Guardar en la base de datos
        const nftData = {
          collectionId: params.collectionId,
          candy_machine: "",
          id_item: tokenId,
          name: params.name,
          description: params.description,
          image: imageUrl,
          music: musicUrl,
          copies: params.copies || 1,
          price: params.price || 0,
          currency: "ETH",
          owner: evmAddress,
          for_sale: 1,
          attributes: [
            {
              trait_type: "Collection",
              value: params.collectionId,
            },
          ],
        };

        await submitNftToServer(nftData);
        toast.success("NFT guardado en la base de datos");

        return {
          metadataUrl,
          tokenId,
        };
      } catch (error: any) {
        console.error("Error al crear el NFT:", error);
        toast.error("Error al crear el NFT", {
          description: error.message || "Por favor, intenta de nuevo",
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [authenticated, getEvmWalletAddress, getNextTokenId]
  );

  return {
    createCollection,
    createNFTItem,
    mintTokenDeveloperPaysGas,
    uploadCoverImage,
    isLoading,
    collectionAddress,
    coverImageUrl,
    metadataUrl,
    nftTokenId,
    getEvmWalletAddress,
  };
};
