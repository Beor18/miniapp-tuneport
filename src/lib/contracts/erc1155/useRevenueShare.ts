"use client";

import { useState, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";
import { useAppKitAccount, useWallets } from "@Src/lib/privy";
import { encodeFunctionData, decodeEventLog, parseEther } from "viem";
import { RevenueShareFactoryABI } from "./RevenueShareFactoryABI";
import { RevenueShareABI } from "./RevenueShareABI";
import { CONTRACT_ADDRESSES, DEFAULT_NETWORK } from "./config";
import { toast } from "sonner";

import { createPublicClient, http, createWalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

export type Network = "sepolia" | "mainnet";

// Interfaces para RevenueShare
export interface Share {
  account: string;
  percentage: number; // base 10000 = 100%
}

export interface CreateRevenueShareParams {
  artist: string;
  name: string;
  description: string;
}

export interface ManagerInfo {
  managerAddress: string;
  name: string;
  description: string;
  createdAt: number;
}

// Función para obtener el cliente wallet que pagará el gas
const getGasPayerWallet = () => {
  const privateKey = process.env.NEXT_PUBLIC_GAS_PAYER_PRIVATE_KEY;

  if (!privateKey) {
    console.error(
      "No se ha configurado NEXT_PUBLIC_GAS_PAYER_PRIVATE_KEY en el .env"
    );
    return null;
  }

  try {
    const formattedPrivateKey = privateKey.startsWith("0x")
      ? (privateKey as `0x${string}`)
      : (`0x${privateKey}` as `0x${string}`);

    const account = privateKeyToAccount(formattedPrivateKey);

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

export const useRevenueShare = (
  network: Network = DEFAULT_NETWORK as Network
) => {
  const { authenticated, user } = usePrivy();
  const { client } = useSmartWallets();
  const { address: userWalletAddress } = useAppKitAccount();
  const { wallets } = useWallets();
  const [isLoading, setIsLoading] = useState(false);
  const [revenueShareAddress, setRevenueShareAddress] = useState<string | null>(
    null
  );

  // ✅ Funciones para obtener embedded wallets (copiadas de useERC1155Mint)
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

  // Obtener la dirección EVM válida (igual que en MusicNewForm)
  const getEvmWalletAddress = useCallback((): string | null => {
    const evmWallet = wallets.find(
      (wallet: any) =>
        wallet.walletClientType === "privy" ||
        wallet.walletClientType === "metamask" ||
        wallet.walletClientType === "walletconnect"
    );
    return evmWallet?.address || userWalletAddress || null;
  }, [wallets, userWalletAddress]);

  // Obtener la dirección del contrato RevenueShareFactory para la red seleccionada
  const factoryAddress = CONTRACT_ADDRESSES[network]?.revenueShareFactory;

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(
      "https://api.developer.coinbase.com/rpc/v1/base-sepolia/aNh4GkSHTvoOtsTHdpCxLJnuzfmqX8dj"
    ),
  });

  // Función para crear un contrato RevenueShare con la wallet del desarrollador pagando gas
  const createRevenueShare = useCallback(
    async (params: CreateRevenueShareParams): Promise<string | null> => {
      const evmAddress = getEvmWalletAddress();
      if (!authenticated || !evmAddress) {
        toast.error(
          "Debes conectar tu wallet para crear un contrato de distribución de ingresos"
        );
        return null;
      }

      if (!factoryAddress) {
        toast.error("Contrato RevenueShareFactory no disponible en esta red");
        return null;
      }

      setIsLoading(true);

      try {
        // Obtener el wallet que pagará el gas
        const gasPayerWallet = getGasPayerWallet();

        if (!gasPayerWallet) {
          toast.error("No se pudo configurar la wallet para pagar el gas");
          return null;
        }

        // Obtener dirección de la cuenta que pagará el gas
        const gasPayerAddress = gasPayerWallet.account.address;
        console.log("Cuenta que pagará el gas:", gasPayerAddress);

        // Codificar los datos de la función con viem
        const data = encodeFunctionData({
          abi: RevenueShareFactoryABI,
          functionName: "createRevenueShare",
          args: [
            params.artist as `0x${string}`,
            params.name,
            params.description,
          ],
        });

        console.log("Sending transaction to create RevenueShare");

        // Enviar la transacción usando la wallet del desarrollador
        const txHash = await gasPayerWallet.sendTransaction({
          to: factoryAddress as `0x${string}`,
          data,
          value: BigInt(0),
        });

        console.log("Transacción de RevenueShare enviada:", txHash);
        toast.success("RevenueShare contract created successfully!");

        // Esperar a que la transacción sea minada y obtener el recibo
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });

        console.log("Recibo de la transacción:", receipt);

        // Buscar el evento "RevenueShareCreated" en los logs
        let newRevenueShareAddress = "";

        for (const log of receipt.logs) {
          try {
            const decodedLog = decodeEventLog({
              abi: RevenueShareFactoryABI,
              data: log.data,
              topics: log.topics,
            });

            if (decodedLog.eventName === "RevenueShareCreated") {
              console.log("Evento RevenueShareCreated encontrado:", decodedLog);

              const args = decodedLog.args as unknown as {
                artist: string;
                manager: string;
                name: string;
                managerId: bigint;
              };

              newRevenueShareAddress = args.manager;
              console.log(
                "Nuevo contrato RevenueShare creado en dirección:",
                newRevenueShareAddress
              );
              setRevenueShareAddress(newRevenueShareAddress);
              break;
            }
          } catch (decodeError) {
            continue;
          }
        }

        if (!newRevenueShareAddress) {
          console.error(
            "No se pudo obtener la dirección del contrato RevenueShare del evento"
          );
          toast.error("No se pudo obtener la dirección del contrato");
          return null;
        }

        return newRevenueShareAddress as string;
      } catch (error: any) {
        console.error("Error al crear el contrato RevenueShare:", error);

        toast.error("Error al crear el contrato", {
          description: error.message || "Por favor, intenta de nuevo",
        });

        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [authenticated, getEvmWalletAddress, factoryAddress, publicClient]
  );

  // Función para obtener todos los contratos RevenueShare de un artista
  const getArtistManagers = useCallback(
    async (artistAddress: string): Promise<ManagerInfo[]> => {
      if (!factoryAddress) {
        console.error("Contrato RevenueShareFactory no disponible");
        return [];
      }

      try {
        const managers = await publicClient.readContract({
          address: factoryAddress as `0x${string}`,
          abi: RevenueShareFactoryABI,
          functionName: "getArtistManagers",
          args: [artistAddress as `0x${string}`],
        });

        // Mapear y convertir tipos
        return managers.map((manager) => ({
          managerAddress: manager.managerAddress,
          name: manager.name,
          description: manager.description,
          createdAt: Number(manager.createdAt),
        }));
      } catch (error) {
        console.error("Error al obtener los contratos del artista:", error);
        return [];
      }
    },
    [factoryAddress, publicClient]
  );

  // Función para obtener la cantidad de contratos de un artista
  const getArtistManagerCount = useCallback(
    async (artistAddress: string): Promise<number> => {
      if (!factoryAddress) {
        console.error("Contrato RevenueShareFactory no disponible");
        return 0;
      }

      try {
        const count = await publicClient.readContract({
          address: factoryAddress as `0x${string}`,
          abi: RevenueShareFactoryABI,
          functionName: "getArtistManagerCount",
          args: [artistAddress as `0x${string}`],
        });

        return Number(count);
      } catch (error) {
        console.error("Error al obtener la cantidad de contratos:", error);
        return 0;
      }
    },
    [factoryAddress, publicClient]
  );

  // Función para obtener el total de contratos creados
  const getTotalManagersCreated = useCallback(async (): Promise<number> => {
    if (!factoryAddress) {
      console.error("Contrato RevenueShareFactory no disponible");
      return 0;
    }

    try {
      const total = await publicClient.readContract({
        address: factoryAddress as `0x${string}`,
        abi: RevenueShareFactoryABI,
        functionName: "getTotalManagersCreated",
      });

      return Number(total);
    } catch (error) {
      console.error("Error al obtener el total de contratos:", error);
      return 0;
    }
  }, [factoryAddress, publicClient]);

  // Función para verificar si una dirección es un contrato creado por el factory
  const isManagerCreatedByFactory = useCallback(
    async (managerAddress: string): Promise<boolean> => {
      if (!factoryAddress) {
        console.error("Contrato RevenueShareFactory no disponible");
        return false;
      }

      try {
        const isCreated = await publicClient.readContract({
          address: factoryAddress as `0x${string}`,
          abi: RevenueShareFactoryABI,
          functionName: "isManagerCreatedByFactory",
          args: [managerAddress as `0x${string}`],
        });

        return Boolean(isCreated);
      } catch (error) {
        console.error("Error al verificar el contrato:", error);
        return false;
      }
    },
    [factoryAddress, publicClient]
  );

  // Función para agregar un manager a un contrato RevenueShare
  const addManager = useCallback(
    async (
      revenueShareAddress: string,
      managerAddress: string
    ): Promise<boolean> => {
      const evmAddress = getEvmWalletAddress();
      if (!authenticated || !evmAddress) {
        toast.error("Debes conectar tu wallet");
        return false;
      }

      if (!client) {
        toast.error("No se encontró el cliente de Smart Wallet");
        return false;
      }

      setIsLoading(true);

      try {
        // Codificar la función addManager
        const data = encodeFunctionData({
          abi: [
            {
              name: "addManager",
              type: "function",
              inputs: [{ name: "manager", type: "address" }],
              outputs: [],
            },
          ],
          functionName: "addManager",
          args: [managerAddress as `0x${string}`],
        });

        // UI options para el diálogo de transacción
        const uiOptions = {
          title: "Agregar Manager",
          description: "Agregando un nuevo manager al contrato RevenueShare",
          buttonText: "Confirmar",
        };

        // Enviar la transacción usando el smart wallet (solo el owner puede hacerlo)
        const txHash = await client.sendTransaction(
          {
            to: revenueShareAddress as `0x${string}`,
            data,
            value: BigInt(0),
          },
          { uiOptions }
        );

        // Esperar confirmación
        await publicClient.waitForTransactionReceipt({
          hash: txHash as `0x${string}`,
        });

        toast.success("Manager added successfully");
        return true;
      } catch (error: any) {
        console.error("Error adding manager:", error);
        toast.error("Error adding manager", {
          description: error.message || "Please try again",
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [authenticated, getEvmWalletAddress, client, publicClient]
  );

  // Función para remover un manager de un contrato RevenueShare
  const removeManager = useCallback(
    async (
      revenueShareAddress: string,
      managerAddress: string
    ): Promise<boolean> => {
      const evmAddress = getEvmWalletAddress();
      if (!authenticated || !evmAddress) {
        toast.error("You need to connect your wallet");
        return false;
      }

      if (!client) {
        toast.error("Smart Wallet client not found");
        return false;
      }

      setIsLoading(true);

      try {
        // Codificar la función removeManager
        const data = encodeFunctionData({
          abi: [
            {
              name: "removeManager",
              type: "function",
              inputs: [{ name: "manager", type: "address" }],
              outputs: [],
            },
          ],
          functionName: "removeManager",
          args: [managerAddress as `0x${string}`],
        });

        // UI options para el diálogo de transacción
        const uiOptions = {
          title: "Remover Manager",
          description: "Removing manager from RevenueShare contract",
          buttonText: "Confirm",
        };

        // Enviar la transacción usando el smart wallet (solo el owner puede hacerlo)
        const txHash = await client.sendTransaction(
          {
            to: revenueShareAddress as `0x${string}`,
            data,
            value: BigInt(0),
          },
          { uiOptions }
        );

        // Esperar confirmación
        await publicClient.waitForTransactionReceipt({
          hash: txHash as `0x${string}`,
        });

        toast.success("Manager removed successfully");
        return true;
      } catch (error: any) {
        console.error("Error removing manager:", error);
        toast.error("Error removing manager", {
          description: error.message || "Please try again",
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [authenticated, getEvmWalletAddress, client, publicClient]
  );

  // Función para verificar si una dirección es manager
  const isManager = useCallback(
    async (
      revenueShareAddress: string,
      managerAddress: string
    ): Promise<boolean> => {
      try {
        // Leer del contrato usando publicClient
        const result = await publicClient.readContract({
          address: revenueShareAddress as `0x${string}`,
          abi: [
            {
              name: "isManager",
              type: "function",
              inputs: [{ name: "account", type: "address" }],
              outputs: [{ type: "bool" }],
              stateMutability: "view",
            },
          ],
          functionName: "isManager",
          args: [managerAddress as `0x${string}`],
        });

        return result as boolean;
      } catch (error) {
        console.error("Error checking if is manager:", error);
        return false;
      }
    },
    [publicClient]
  );

  // 🎯 FUNCIÓN PARA CONFIGURAR HERENCIA DE PLAYLISTS/REMIXES
  const setInheritance = useCallback(
    async (
      revenueShareAddress: string,
      tokenId: number,
      sourceCollections: string[]
    ): Promise<boolean> => {
      const evmAddress = getEvmWalletAddress();
      if (!authenticated || !evmAddress) {
        toast.error("Debes conectar tu wallet");
        return false;
      }

      setIsLoading(true);

      try {
        console.log("🏗️ Configurando herencia para tokenId:", tokenId);
        console.log("📦 Colecciones fuente:", sourceCollections);

        // Obtener el wallet que pagará el gas
        const gasPayerWallet = getGasPayerWallet();

        if (!gasPayerWallet) {
          toast.error("No se pudo configurar la wallet para pagar el gas");
          return false;
        }

        // Codificar la función setInheritance
        const data = encodeFunctionData({
          abi: RevenueShareABI,
          functionName: "setInheritance",
          args: [
            BigInt(tokenId),
            sourceCollections.map((addr) => addr as `0x${string}`),
          ],
        });

        console.log("Enviando transacción setInheritance...");
        const txHash = await gasPayerWallet.sendTransaction({
          to: revenueShareAddress as `0x${string}`,
          data,
          value: BigInt(0),
        });

        // Esperar confirmación
        await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });

        toast.success(
          `Herencia configurada: ${sourceCollections.length} colecciones originales`
        );
        return true;
      } catch (error: any) {
        console.error("Error configurando herencia:", error);
        toast.error("Error al configurar herencia", {
          description: error.message || "Por favor intenta de nuevo",
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [authenticated, getEvmWalletAddress, publicClient]
  );

  // 🎯 FUNCIÓN PARA CONFIGURAR PORCENTAJE DE CASCADA
  const setCascadePercentage = useCallback(
    async (
      revenueShareAddress: string,
      tokenId: number,
      percentage: number
    ): Promise<boolean> => {
      const evmAddress = getEvmWalletAddress();
      if (!authenticated || !evmAddress) {
        toast.error("Debes conectar tu wallet");
        return false;
      }

      setIsLoading(true);

      try {
        console.log("⚙️ Configurando porcentaje de cascada:", percentage, "%");

        // Obtener el wallet que pagará el gas
        const gasPayerWallet = getGasPayerWallet();

        if (!gasPayerWallet) {
          toast.error("No se pudo configurar la wallet para pagar el gas");
          return false;
        }

        // Convertir porcentaje a basis points (70% = 7000)
        const basisPoints = BigInt(percentage * 100);

        // Codificar la función setCascadePercentage
        const data = encodeFunctionData({
          abi: RevenueShareABI,
          functionName: "setCascadePercentage",
          args: [BigInt(tokenId), basisPoints],
        });

        console.log("Enviando transacción setCascadePercentage...");
        const txHash = await gasPayerWallet.sendTransaction({
          to: revenueShareAddress as `0x${string}`,
          data,
          value: BigInt(0),
        });

        // Esperar confirmación
        await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });

        toast.success(
          `Cascada configurada: ${percentage}% a artistas originales`
        );
        return true;
      } catch (error: any) {
        console.error("Error configurando cascada:", error);
        toast.error("Error al configurar porcentaje de cascada", {
          description: error.message || "Por favor intenta de nuevo",
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [authenticated, getEvmWalletAddress, publicClient]
  );

  // 🎯 FUNCIÓN PARA CONFIGURAR SPLITS DE MINT PARA CURATOR
  const setMintSplitsForCurator = useCallback(
    async (
      revenueShareAddress: string,
      collectionAddress: string,
      tokenId: number,
      curatorAddress: string,
      curatorPercentage: number
    ): Promise<boolean> => {
      const evmAddress = getEvmWalletAddress();
      if (!authenticated || !evmAddress) {
        toast.error("Debes conectar tu wallet");
        return false;
      }

      setIsLoading(true);

      try {
        console.log(
          "💰 Configurando splits para curator:",
          curatorPercentage,
          "%"
        );

        // Obtener el wallet que pagará el gas
        const gasPayerWallet = getGasPayerWallet();

        if (!gasPayerWallet) {
          toast.error("No se pudo configurar la wallet para pagar el gas");
          return false;
        }

        // Crear splits: 100% para el curator del token específico
        // (La cascada se maneja automáticamente en distributeCascadePayment)
        const mintShares = [
          {
            account: curatorAddress as `0x${string}`,
            percentage: BigInt(10000), // 100% para el curator en el split específico
          },
        ];

        // Codificar la función setMintSplits para token específico
        const data = encodeFunctionData({
          abi: RevenueShareABI,
          functionName: "setMintSplits",
          args: [
            collectionAddress as `0x${string}`,
            BigInt(tokenId),
            mintShares,
          ],
        });

        console.log("Enviando transacción setMintSplits para curator...");
        const txHash = await gasPayerWallet.sendTransaction({
          to: revenueShareAddress as `0x${string}`,
          data,
          value: BigInt(0),
        });

        // Esperar confirmación
        await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });

        toast.success(`Splits de curator configurados: ${curatorPercentage}%`);
        return true;
      } catch (error: any) {
        console.error("Error configurando splits de curator:", error);
        toast.error("Error al configurar splits del curator", {
          description: error.message || "Por favor intenta de nuevo",
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [authenticated, getEvmWalletAddress, publicClient]
  );

  // Función para configurar splits de una colección usando la wallet del desarrollador
  const configureCollectionSplits = useCallback(
    async (params: {
      collectionAddress: string;
      revenueShareAddress: string;
      collaborators: Array<{
        address: string;
        mintPercentage: number;
        royaltyPercentage: number;
        name: string;
      }>;
    }): Promise<boolean> => {
      const evmAddress = getEvmWalletAddress();
      if (!authenticated || !evmAddress) {
        toast.error("Debes conectar tu wallet");
        return false;
      }

      setIsLoading(true);

      try {
        toast.info("Configurando distribución de colaboradores...");

        // Obtener el wallet que pagará el gas
        const gasPayerWallet = getGasPayerWallet();

        if (!gasPayerWallet) {
          toast.error("No se pudo configurar la wallet para pagar el gas");
          return false;
        }

        // Preparar shares de MINT (ventas primarias) para el contrato
        const mintShares = params.collaborators.map((collab) => ({
          account: collab.address as `0x${string}`,
          percentage: BigInt(Math.floor(collab.mintPercentage * 100)), // Convertir de % a basis points
        }));

        // Verificar que los porcentajes sumen exactamente 10000
        const totalMintPercentage = mintShares.reduce(
          (sum, share) => sum + Number(share.percentage),
          0
        );

        if (totalMintPercentage !== 10000) {
          console.error(
            `Error: Total mint percentage es ${totalMintPercentage}, debe ser 10000`
          );
          toast.error(
            `Error: Porcentajes de mint suman ${
              totalMintPercentage / 100
            }%, debe ser 100%`
          );
          throw new Error(`Porcentajes incorrectos: ${totalMintPercentage}`);
        }

        // Configurar splits de mint usando gasPayerWallet
        const mintSplitsData = encodeFunctionData({
          abi: RevenueShareABI,
          functionName: "setCollectionMintSplits",
          args: [params.collectionAddress as `0x${string}`, mintShares],
        });

        console.log("Enviando transacción setCollectionMintSplits...");
        const splitsTxHash = await gasPayerWallet.sendTransaction({
          to: params.revenueShareAddress as `0x${string}`,
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

        // También configurar royalties de reventa
        const royaltiesShares = params.collaborators.map((collab) => ({
          account: collab.address as `0x${string}`,
          percentage: BigInt(Math.floor(collab.royaltyPercentage * 100)), // Convertir de % a basis points
        }));

        // Verificar que los porcentajes sumen exactamente 10000
        const totalRoyaltiesPercentage = royaltiesShares.reduce(
          (sum, share) => sum + Number(share.percentage),
          0
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

        // Configurar royalties de reventa usando gasPayerWallet
        const royaltiesData = encodeFunctionData({
          abi: RevenueShareABI,
          functionName: "setCollectionResaleRoyalties",
          args: [params.collectionAddress as `0x${string}`, royaltiesShares],
        });

        console.log("Enviando transacción setCollectionResaleRoyalties...");
        const royaltiesTxHash = await gasPayerWallet.sendTransaction({
          to: params.revenueShareAddress as `0x${string}`,
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
        return true;
      } catch (error: any) {
        console.error("Error al configurar splits:", error);
        toast.error("Error al configurar la distribución de ventas", {
          description: error.message || "Por favor intenta de nuevo",
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [authenticated, getEvmWalletAddress, publicClient]
  );

  // 💰 Función para TIP en 2 pasos: 1) Usuario transfiere ETH, 2) Desarrollador ejecuta distribución
  const distributeCascadePayment = useCallback(
    async (
      revenueShareAddress: string,
      collectionAddress: string,
      tokenId: number,
      amountInEth: number
    ): Promise<boolean> => {
      const evmAddress = getEvmWalletAddress();
      if (!authenticated || !evmAddress) {
        toast.error("Debes conectar tu wallet");
        return false;
      }

      setIsLoading(true);

      try {
        // Usuario envía ETH y ejecuta distribución en una sola transacción
        const amountInWei = parseEther(amountInEth.toString());

        console.log("🪙 Procesando tip con economía en cascada...");
        console.log("  - Revenue Share:", revenueShareAddress);
        console.log("  - Collection Address:", collectionAddress);
        console.log("  - Cantidad ETH:", amountInEth);
        console.log("  - Token ID:", tokenId);
        console.log("  - User Wallet:", evmAddress);

        // 🔍 DIAGNÓSTICO: Verificar configuraciones del contrato antes de enviar ETH
        try {
          console.log("🔍 Verificando configuraciones del contrato...");

          // Verificar si hay mint splits configurados para este token
          const mintSplitsABI = [
            {
              name: "getMintSplits",
              type: "function",
              inputs: [
                { name: "collection", type: "address" },
                { name: "tokenId", type: "uint256" },
              ],
              outputs: [
                {
                  components: [
                    { name: "account", type: "address" },
                    { name: "percentage", type: "uint96" },
                  ],
                  internalType: "struct IRevenueShare.Share[]",
                  name: "",
                  type: "tuple[]",
                },
              ],
              stateMutability: "view",
            },
          ];

          const mintSplits: any = await publicClient.readContract({
            address: revenueShareAddress as `0x${string}`,
            abi: mintSplitsABI,
            functionName: "getMintSplits",
            args: [collectionAddress as `0x${string}`, BigInt(tokenId)],
          });

          console.log("💰 Mint splits configurados:", mintSplits);
          console.log("💰 Número de splits:", mintSplits?.length);

          // Mostrar cada split detalladamente
          if (mintSplits && Array.isArray(mintSplits)) {
            mintSplits.forEach((split, index) => {
              console.log(`   Split ${index + 1}:`, {
                account: split.account,
                percentage: split.percentage?.toString(),
                percentageDecimal: Number(split.percentage) / 100, // basis points a %
              });
            });
          }

          if (!mintSplits || mintSplits?.length === 0) {
            toast.error("❌ No hay splits configurados para este token");
            return false;
          }

          // Verificar que los porcentajes sumen 10000 (100%)
          const totalPercentage = mintSplits.reduce((sum: any, split: any) => {
            return sum + Number(split.percentage);
          }, 0);

          console.log("📊 Total percentage (basis points):", totalPercentage);
          console.log("📊 Total percentage (%):", totalPercentage / 100);

          if (totalPercentage !== 10000) {
            console.warn(
              "⚠️ Los porcentajes no suman 100%:",
              totalPercentage / 100,
              "%"
            );
          }

          // Verificar inheritance (opcional, pero informativo)
          try {
            const inheritanceABI = [
              {
                name: "getInheritedCollections",
                type: "function",
                inputs: [
                  { name: "collection", type: "address" },
                  { name: "tokenId", type: "uint256" },
                ],
                outputs: [{ name: "", type: "address[]" }],
                stateMutability: "view",
              },
            ];

            const inheritedCollections = await publicClient.readContract({
              address: revenueShareAddress as `0x${string}`,
              abi: inheritanceABI,
              functionName: "getInheritedCollections",
              args: [collectionAddress as `0x${string}`, BigInt(tokenId)],
            });

            console.log("🔗 Colecciones heredadas:", inheritedCollections);
          } catch (inheritanceError) {
            console.warn(
              "⚠️ No se pudo verificar inheritance:",
              inheritanceError
            );
          }
        } catch (diagError) {
          console.error("❌ Error en diagnóstico:", diagError);
          toast.error("Error verificando configuración del contrato");
          return false;
        }

        // Obtener embedded wallet según tipo (igual que en mintTokenDeveloperPaysGas)
        let embeddedProvider = null;
        let fromAddress = evmAddress; // Dirección por defecto

        if (user?.wallet?.walletClientType === "metamask") {
          console.log("Usando MetaMask");
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
          console.log("Usando Privy");
          embeddedProvider = await getEmbeddedWalletClient();
        }

        if (!embeddedProvider) {
          toast.error("No se pudo obtener embedded wallet");
          return false;
        }

        // USAR distributeMintPayment en lugar de distributeCascadePayment
        // Esta función es más simple y maneja mejor las transferencias
        const distributeCascadeData = encodeFunctionData({
          abi: RevenueShareABI,
          functionName: "distributeMintPayment",
          args: [
            collectionAddress as `0x${string}`, // collection address (dirección de la colección NFT)
            BigInt(tokenId),
          ],
        });

        console.log(
          "Enviando ETH y ejecutando distributeMintPayment en una sola transacción..."
        );

        // 🧪 SIMULAR LA TRANSACCIÓN ANTES DE ENVIARLA
        try {
          console.log("🧪 Simulando transacción...");
          const simulation = await publicClient.simulateContract({
            address: revenueShareAddress as `0x${string}`,
            abi: RevenueShareABI,
            functionName: "distributeMintPayment",
            args: [collectionAddress as `0x${string}`, BigInt(tokenId)],
            account: fromAddress as `0x${string}`,
            value: amountInWei,
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
          toast.error("Simulación falló, pero intentando transacción real");
        }

        // Transferir ETH y ejecutar distribución en una sola transacción
        const transferTxHash = await embeddedProvider.request({
          method: "eth_sendTransaction",
          params: [
            {
              to: revenueShareAddress,
              data: distributeCascadeData,
              value: `0x${amountInWei.toString(16)}`,
              from: fromAddress,
            },
          ],
        });

        console.log("⏳ Esperando confirmación de transacción...");
        await publicClient.waitForTransactionReceipt({
          hash: transferTxHash,
        });

        console.log("✅ Tip con economía en cascada completado exitosamente");
        toast.success("🎉 Tip procesado exitosamente", {
          description:
            "ETH distribuido automáticamente a todos los beneficiarios",
        });

        return true;
      } catch (error: any) {
        console.error("Error en proceso de tip:", error);

        if (error.code === "ACTION_REJECTED") {
          toast.error("Transacción rechazada por el usuario");
        } else {
          toast.error("Error procesando el tip", {
            description: error.message || "Por favor, intenta de nuevo",
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
      getEmbeddedWalletClient,
      getEmbeddedWalletClientMetamask,
      publicClient,
    ]
  );

  return {
    createRevenueShare,
    configureCollectionSplits,
    getArtistManagers,
    getArtistManagerCount,
    getTotalManagersCreated,
    isManagerCreatedByFactory,
    isLoading,
    revenueShareAddress,
    getEvmWalletAddress,
    addManager,
    removeManager,
    isManager,
    // 🎯 NUEVAS FUNCIONES PARA ECONOMÍA EN CASCADA
    setInheritance,
    setCascadePercentage,
    setMintSplitsForCurator,
    distributeCascadePayment,
  };
};
