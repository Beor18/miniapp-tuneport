import { useState, useCallback } from "react";
import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { encodeFunctionData, createWalletClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { MusicCollectionABI } from "../../contracts/erc1155/MusicCollectionABI";
import { toast } from "sonner";
import { submitNftToServer } from "../../../app/actions/submitNftToServer.actions";
import { useIPFSUpload } from "../common/useIPFSUpload";
import { useBaseWallet } from "./useBaseWallet";
import { NFTItemParams } from "./types";

export const useERC1155Mint = () => {
  const { client } = useSmartWallets();
  const { wallets } = useWallets();
  const { user } = usePrivy();
  const {
    authenticated,
    getEvmWalletAddress,
    publicClient,
    getGasPayerWallet,
  } = useBaseWallet();
  const { uploadImageToPinata, uploadMetadataToPinata } = useIPFSUpload();
  const [isLoading, setIsLoading] = useState(false);
  const [nftTokenId, setNftTokenId] = useState<number | null>(null);

  // ✅ MOVER ESTA FUNCIÓN AQUÍ (antes de mintTokenDeveloperPaysGas)
  const getEmbeddedWalletClient = useCallback(async () => {
    const embeddedWallet = wallets.find(
      (wallet: any) => wallet.walletClientType === "privy"
    );

    if (!embeddedWallet) {
      console.error("No se encontró embedded wallet de Privy");
      return null;
    }

    const ethereumProvider = await embeddedWallet.getEthereumProvider();

    if (!ethereumProvider) {
      console.error("No se pudo obtener el provider de Ethereum");
      return null;
    }

    console.log("✅ Embedded wallet obtenido:", embeddedWallet);
    return ethereumProvider;
  }, [wallets]);

  const getEmbeddedWalletClientMetamask = useCallback(async () => {
    const embeddedWallet = wallets.find(
      (wallet: any) => wallet.walletClientType === "metamask"
    );

    if (!embeddedWallet) {
      console.error("No se encontró embedded wallet de Metamask");
      return null;
    }

    const ethereumProvider = await embeddedWallet.getEthereumProvider();

    if (!ethereumProvider) {
      console.error("No se pudo obtener el provider de Ethereum");
      return null;
    }

    try {
      // Solicitar permisos de cuenta primero (requerido para MetaMask)
      const accounts = await ethereumProvider.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        console.error("❌ No se obtuvieron cuentas autorizadas de MetaMask");
        return null;
      }

      // Retornar tanto el provider como la cuenta autorizada
      return {
        provider: ethereumProvider,
        authorizedAccount: accounts[0],
      };
    } catch (error) {
      console.error("❌ Error al solicitar permisos de MetaMask:", error);
      return null;
    }
  }, [wallets]);

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
        throw new Error("You must connect your wallet to create an NFT");
      }

      if (!params.collectionId || params.collectionId.trim() === "") {
        throw new Error("Collection ID required");
      }

      setIsLoading(true);

      try {
        // 1. Obtener el siguiente tokenId disponible
        const tokenId = await getNextTokenId(params.collectionId);
        console.log("TOKEN ID NFT: ", tokenId);
        setNftTokenId(tokenId);

        // 2. Subir imagen a IPFS si existe
        let imageUrl = "";
        if (params.image) {
          toast.info("Uploading image to IPFS...");

          imageUrl = (await uploadImageToPinata(params.image)) || "";

          if (!imageUrl) {
            throw new Error("Error uploading image to IPFS");
          }
          toast.success("Image uploaded successfully");
        }

        // 3. Subir música a IPFS si existe
        let musicUrl = "";
        if (params.music) {
          toast.info("Uploading music to IPFS...");

          // Crear FormData para la música
          const musicFormData = new FormData();
          musicFormData.append("cover", params.music);

          // Subir música a Pinata
          const responseMusicPinata = await fetch("/api/pinata", {
            method: "POST",
            body: musicFormData,
          });

          if (!responseMusicPinata.ok) {
            throw new Error("Error uploading music to Pinata");
          }

          const musicData = await responseMusicPinata.json();
          musicUrl = `https://ipfs.io/ipfs/${musicData.ipfsHash}/${params.music.name}`;
          toast.success("Music uploaded successfully");
        }

        // 4. Crear metadatos del NFT
        const nftMetadata = {
          name: params.name,
          description: params.description,
          image: imageUrl,
          external_url: `https://app.tuneport.xyz/track/${params.name
            .toLowerCase()
            .replace(/\s+/g, "-")}`,
          animation_url: musicUrl,
          attributes: [
            // Atributos del formulario/usuario
            ...(params.attributes || []),
            // Atributos predeterminados del sistema
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
          artist: evmAddress,
          price: params.price || 0,
          currency: params.currency || "ETH",
        };

        // 5. Subir metadatos a IPFS
        toast.info("Uploading metadata to IPFS...");
        const metadataUrl = await uploadMetadataToPinata(nftMetadata);

        if (!metadataUrl) {
          throw new Error("Error uploading metadata to IPFS");
        }

        toast.success("Metadata uploaded successfully");

        // 6. Guardar en la base de datos
        const nftData = {
          collectionId: params?.collectionId,
          candy_machine: "",
          id_item: tokenId,
          name: params.name,
          description: params.description,
          image: imageUrl,
          music: musicUrl,
          copies: params.copies || 1,
          price: params.price || 0,
          currency: params.currency || "ETH",
          owner: evmAddress,
          metadata_uri: metadataUrl,
          for_sale: 1,
          attributes: nftMetadata.attributes.map((attr) => ({
            trait_type: attr.trait_type,
            value: String(attr.value),
          })),
        };

        await submitNftToServer(nftData);
        toast.success("NFT saved to database");

        return {
          metadataUrl,
          tokenId,
        };
      } catch (error: any) {
        console.error("Error al crear el NFT:", error);

        // Detect specific errors
        if (error.message?.includes("Collection not found")) {
          toast.error("Collection not found", {
            description: `The collection with ID ${params.collectionId} does not exist in the database. Verify that the collection is created correctly.`,
          });
        } else {
          toast.error("Error creating NFT", {
            description: error.message || "Please try again",
          });
        }
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [
      authenticated,
      getEvmWalletAddress,
      getNextTokenId,
      uploadImageToPinata,
      uploadMetadataToPinata,
    ]
  );

  // Función para mint donde desarrollador paga gas y usuario paga precio
  const mintTokenDeveloperPaysGas = useCallback(
    async (
      collectionAddress: string,
      to: string,
      tokenId: number,
      amount: number,
      tokenMetadata: string,
      pricePerToken?: number
    ): Promise<boolean> => {
      const evmAddress = getEvmWalletAddress();
      if (!authenticated || !evmAddress) {
        toast.error("You must connect your wallet to mint tokens");
        return false;
      }

      if (!to) {
        toast.error("Recipient address is required");
        return false;
      }

      setIsLoading(true);

      try {
        const gasPayerWallet = getGasPayerWallet();

        if (!gasPayerWallet) {
          toast.error("Could not configure wallet to pay gas");
          return false;
        }

        // 1. CONFIGURAR PRECIO
        const price = BigInt(pricePerToken || 0);
        console.log("PRICE: ", price);
        console.log("PRICE PER TOKEN: ", pricePerToken);

        // 2. LEER CONFIGURACIÓN DEL CONTRATO Y DIAGNOSTICAR
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

        // Verificar maxSupply para el tokenId
        const maxSupply = (await publicClient.readContract({
          address: collectionAddress as `0x${string}`,
          abi: MusicCollectionABI,
          functionName: "maxSupply",
          args: [BigInt(tokenId)],
        })) as bigint;

        // Verificar totalSupply actual
        const totalSupply = (await publicClient.readContract({
          address: collectionAddress as `0x${string}`,
          abi: MusicCollectionABI,
          functionName: "totalSupply",
          args: [BigInt(tokenId)],
        })) as bigint;

        // Verificar owner del contrato
        const owner = (await publicClient.readContract({
          address: collectionAddress as `0x${string}`,
          abi: MusicCollectionABI,
          functionName: "owner",
        })) as string;

        // Verificar revenueShare
        const revenueShare = (await publicClient.readContract({
          address: collectionAddress as `0x${string}`,
          abi: MusicCollectionABI,
          functionName: "revenueShare",
        })) as string;

        console.log("=== DIAGNÓSTICO DEL CONTRATO ===");
        console.log("Mint Start Date:", new Date(Number(mintStartDate) * 1000));
        console.log("Mint End Date:", new Date(Number(mintEndDate) * 1000));
        console.log("Current Time:", new Date());
        console.log("Payment Token:", paymentToken);
        console.log(
          "Max Supply para tokenId",
          tokenId,
          ":",
          maxSupply.toString()
        );
        console.log(
          "Total Supply actual para tokenId",
          tokenId,
          ":",
          totalSupply.toString()
        );
        console.log("Owner:", owner);
        console.log("Revenue Share:", revenueShare);
        console.log("User Address:", evmAddress);
        console.log("===========================");

        // 2.1. VERIFICACIONES ADICIONALES PARA REVENUE SHARE
        if (revenueShare !== "0x0000000000000000000000000000000000000000") {
          try {
            console.log("🔍 Verificando configuración de Revenue Share...");

            // Intentar llamar a las funciones del Revenue Share para ver si están configuradas
            const revenueShareABI = [
              {
                inputs: [
                  {
                    internalType: "address",
                    name: "collection",
                    type: "address",
                  },
                  { internalType: "uint256", name: "tokenId", type: "uint256" },
                ],
                name: "getMintSplits",
                outputs: [
                  {
                    components: [
                      {
                        internalType: "address",
                        name: "account",
                        type: "address",
                      },
                      {
                        internalType: "uint96",
                        name: "percentage",
                        type: "uint96",
                      },
                    ],
                    internalType: "struct IRevenueShare.Share[]",
                    name: "",
                    type: "tuple[]",
                  },
                ],
                stateMutability: "view",
                type: "function",
              },
              {
                inputs: [
                  {
                    internalType: "address",
                    name: "collection",
                    type: "address",
                  },
                ],
                name: "getCollectionMintSplits",
                outputs: [
                  {
                    components: [
                      {
                        internalType: "address",
                        name: "account",
                        type: "address",
                      },
                      {
                        internalType: "uint96",
                        name: "percentage",
                        type: "uint96",
                      },
                    ],
                    internalType: "struct IRevenueShare.Share[]",
                    name: "",
                    type: "tuple[]",
                  },
                ],
                stateMutability: "view",
                type: "function",
              },
            ];

            const mintSplits = await publicClient.readContract({
              address: revenueShare as `0x${string}`,
              abi: revenueShareABI,
              functionName: "getMintSplits",
              args: [collectionAddress as `0x${string}`, BigInt(tokenId)],
            });

            const collectionMintSplits = await publicClient.readContract({
              address: revenueShare as `0x${string}`,
              abi: revenueShareABI,
              functionName: "getCollectionMintSplits",
              args: [collectionAddress as `0x${string}`],
            });

            console.log("Mint Splits para tokenId", tokenId, ":", mintSplits);
            console.log("Collection Mint Splits:", collectionMintSplits);
          } catch (revenueShareError: any) {
            console.error(
              "❌ Error verificando Revenue Share:",
              revenueShareError
            );
            console.error("Esto podría ser la causa del problema de mint");
          }
        }

        // 3. VALIDAR FECHAS
        const currentTime = Math.floor(Date.now() / 1000);
        if (currentTime < Number(mintStartDate)) {
          toast.error(
            `Mint has not started. Starts on ${new Date(
              Number(mintStartDate) * 1000
            ).toLocaleString()}`
          );
          return false;
        }
        if (currentTime > Number(mintEndDate)) {
          toast.error(
            `Mint has ended. Ended on ${new Date(
              Number(mintEndDate) * 1000
            ).toLocaleString()}`
          );
          return false;
        }

        // 4. DETERMINAR TIPO DE MINT Y PRECIO
        const isNativeToken =
          paymentToken === "0x0000000000000000000000000000000000000000";
        const totalCost = BigInt(price) * BigInt(amount);

        if (isNativeToken) {
          // ETH NATIVO: Usuario envía transacción con ETH
          toast.info("Minting with ETH");

          // Verificar balance del usuario
          const userBalance = await publicClient.getBalance({
            address: evmAddress as `0x${string}`,
          });

          if (userBalance < totalCost) {
            toast.error(
              `Insufficient balance. You need ${
                Number(totalCost) / 1e18
              } ETH but you have ${Number(userBalance) / 1e18} ETH`
            );
            return false;
          }

          // Usar embedded wallet directo en lugar de smart wallet
          let embeddedProvider = null;
          let fromAddress = evmAddress; // Dirección por defecto

          if (user?.wallet?.walletClientType === "metamask") {
            console.log("Metamask");
            const metamaskResult = await getEmbeddedWalletClientMetamask();
            if (
              metamaskResult &&
              typeof metamaskResult === "object" &&
              "provider" in metamaskResult
            ) {
              embeddedProvider = metamaskResult.provider;
              fromAddress = metamaskResult.authorizedAccount; // Usar cuenta autorizada
            }
          } else {
            console.log("Privy");
            embeddedProvider = await getEmbeddedWalletClient();
          }

          if (!embeddedProvider) {
            toast.error("Could not get embedded wallet");
            return false;
          }

          // Enviar transacción con embedded wallet (SIN PAYMASTER)
          const mintData = encodeFunctionData({
            abi: MusicCollectionABI,
            functionName: "mint",
            args: [
              to as `0x${string}`,
              BigInt(tokenId),
              BigInt(amount),
              price, // Usar price individual, no totalCost
              tokenMetadata,
            ],
          });

          console.log("totalCost", totalCost);
          console.log("pricePerToken", pricePerToken);
          console.log("price (individual)", price);
          console.log("amount", amount);
          console.log("tokenId", tokenId);
          console.log("tokenMetadata", tokenMetadata);
          console.log("to", to);
          console.log("fromAddress", fromAddress);

          // Simular la transacción antes de ejecutarla para obtener más detalles del error
          try {
            console.log("🧪 Simulando transacción...");
            const simulation = await publicClient.simulateContract({
              address: collectionAddress as `0x${string}`,
              abi: MusicCollectionABI,
              functionName: "mint",
              args: [
                to as `0x${string}`,
                BigInt(tokenId),
                BigInt(amount),
                price,
                tokenMetadata,
              ],
              account: fromAddress as `0x${string}`,
              value: totalCost,
            });
            console.log("✅ Simulación exitosa:", simulation);
          } catch (simulationError: any) {
            console.error("❌ Error en simulación:", simulationError);

            // Intentar obtener más información del error
            if (simulationError.message) {
              console.error("Detalles del error:", simulationError.message);
            }
            if (simulationError.data) {
              console.error("Data del error:", simulationError.data);
            }
            if (simulationError.cause) {
              console.error("Causa del error:", simulationError.cause);
            }

            // Continuar con la transacción real para ver si proporciona más información
            toast.error("Transaction simulation failed", {
              description: "Trying to send transaction anyway for more details",
            });
          }

          const mintTxHash = await embeddedProvider.request({
            method: "eth_sendTransaction",
            params: [
              {
                to: collectionAddress,
                data: mintData,
                value: `0x${totalCost.toString(16)}`,
                from: fromAddress, // Usar la dirección correcta
              },
            ],
          });

          console.log("Mint ETH completado:", mintTxHash);
          toast.success("ETH mint successful!");

          await publicClient.waitForTransactionReceipt({
            hash: mintTxHash as `0x${string}`,
          });
          return true;
        } else {
          // ERC20: Desarrollador maneja la transacción
          toast.info("ERC20 mint: User pays tokens, developer pays gas");

          // Verificar que el token esté aceptado
          const acceptedPrice = await publicClient.readContract({
            address: collectionAddress as `0x${string}`,
            abi: MusicCollectionABI,
            functionName: "acceptedTokens",
            args: [paymentToken as `0x${string}`],
          });

          if (acceptedPrice === BigInt(0)) {
            toast.error("ERC20 token is not configured as a payment method");
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

          // Transferir tokens del usuario y ejecutar mint
          toast.info("Transferring tokens and executing mint...");

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

          // Aprobar tokens al contrato y ejecutar mint
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
              price, // Usar price individual, no totalCost
              paymentToken as `0x${string}`,
              tokenMetadata,
            ],
          });

          // Usar embedded wallet directo en lugar de smart wallet
          let embeddedProvider = null;
          let fromAddressERC20 = evmAddress; // Dirección por defecto

          if (user?.wallet?.walletClientType === "metamask") {
            console.log("Metamask");
            const metamaskResult = await getEmbeddedWalletClientMetamask();
            if (
              metamaskResult &&
              typeof metamaskResult === "object" &&
              "provider" in metamaskResult
            ) {
              embeddedProvider = metamaskResult.provider;
              fromAddressERC20 = metamaskResult.authorizedAccount; // Usar cuenta autorizada
            }
          } else {
            console.log("Privy");
            embeddedProvider = await getEmbeddedWalletClient();
          }

          if (!embeddedProvider) {
            toast.error("Could not get embedded wallet");
            return false;
          }

          // Enviar transacción con embedded wallet (SIN PAYMASTER)
          const mintTxHash = await embeddedProvider.request({
            method: "eth_sendTransaction",
            params: [
              {
                to: collectionAddress,
                data: mintData,
                value: "0x0", // Para ERC20 no se envía ETH
                from: fromAddressERC20, // Usar la dirección correcta
              },
            ],
          });

          console.log("Mint ERC20 completado:", mintTxHash);
          toast.success("ERC20 mint successful!");

          await publicClient.waitForTransactionReceipt({ hash: mintTxHash });
          return true;
        }
      } catch (error: any) {
        console.error("Error al mintear tokens:", error);

        if (error.code === "ACTION_REJECTED") {
          toast.error("You have rejected the transaction");
        } else if (error.message?.includes("MintNotStarted")) {
          toast.error("The mint period has not started yet");
        } else if (error.message?.includes("MintEnded")) {
          toast.error("The mint period has ended");
        } else if (error.message?.includes("InsufficientPayment")) {
          toast.error("Insufficient payment for mint");
        } else if (error.message?.includes("UnsupportedToken")) {
          toast.error("Payment token not supported");
        } else if (error.message?.includes("ExceedsMaxSupply")) {
          toast.error("Exceeds maximum allowed supply");
        } else {
          toast.error("Error minting tokens", {
            description: error.message || "Please try again",
          });
        }

        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [
      authenticated,
      getEvmWalletAddress,
      publicClient,
      getGasPayerWallet,
      getEmbeddedWalletClient,
    ]
  );

  return {
    createNFTItem,
    mintTokenDeveloperPaysGas,
    isLoading,
    nftTokenId,
  };
};
