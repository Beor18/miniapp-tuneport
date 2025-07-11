"use client";

import { useState, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";
import { useAppKitAccount, useWallets } from "@Src/lib/privy";
import { encodeFunctionData, decodeEventLog } from "viem";
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
  const { authenticated } = usePrivy();
  const { client } = useSmartWallets();
  const { address: userWalletAddress } = useAppKitAccount();
  const { wallets } = useWallets();
  const [isLoading, setIsLoading] = useState(false);
  const [revenueShareAddress, setRevenueShareAddress] = useState<string | null>(
    null
  );

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
  };
};
