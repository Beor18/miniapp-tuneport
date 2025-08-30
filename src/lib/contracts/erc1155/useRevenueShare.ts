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
import { base } from "viem/chains";

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

// Función para verificar balance y estimar gas
const checkBalanceAndEstimateGas = async (
  publicClient: any,
  gasPayerAddress: string,
  transactionParams: {
    to: string;
    data: string;
    value?: bigint;
  }
): Promise<{
  hasEnoughFunds: boolean;
  currentBalance: bigint;
  estimatedGasCost: bigint;
  shortfall?: number;
  gasEstimate: bigint;
}> => {
  // Verificar balance actual
  const currentBalance = await publicClient.getBalance({
    address: gasPayerAddress as `0x${string}`,
  });

  console.log("💰 Balance actual:", Number(currentBalance) / 1e18, "ETH");

  // Estimar gas requerido
  const gasEstimate = await publicClient.estimateGas({
    account: gasPayerAddress as `0x${string}`,
    to: transactionParams.to as `0x${string}`,
    data: transactionParams.data,
    value: transactionParams.value || BigInt(0),
  });

  // Obtener precio del gas actual
  const gasPrice = await publicClient.getGasPrice();

  // Calcular costo total estimado (asegurar que todos sean bigint)
  const estimatedGasCost = BigInt(gasEstimate) * BigInt(gasPrice);
  const valueAmount = transactionParams.value
    ? BigInt(transactionParams.value)
    : BigInt(0);
  const totalRequired = estimatedGasCost + valueAmount;

  console.log("⛽ Gas estimado:", gasEstimate.toString());
  console.log("⛽ Precio del gas:", gasPrice.toString(), "wei");
  console.log(
    "💸 Costo estimado del gas:",
    Number(estimatedGasCost) / 1e18,
    "ETH"
  );
  console.log("💸 Total requerido:", Number(totalRequired) / 1e18, "ETH");

  const hasEnoughFunds = currentBalance >= totalRequired;
  const shortfall = hasEnoughFunds
    ? undefined
    : Number(totalRequired - currentBalance) / 1e18;

  return {
    hasEnoughFunds,
    currentBalance,
    estimatedGasCost,
    shortfall,
    gasEstimate,
  };
};

// Función para obtener el cliente wallet que pagará el gas
const getGasPayerWallet = (): any => {
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
      chain: base,
      transport: http(
        "https://api.developer.coinbase.com/rpc/v1/base/aNh4GkSHTvoOtsTHdpCxLJnuzfmqX8dj"
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
      (wallet: any) =>
        wallet.walletClientType === "metamask" ||
        wallet.walletClientType === "coinbase_wallet"
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
        wallet.walletClientType === "coinbase_wallet" ||
        wallet.walletClientType === "walletconnect"
    );
    return evmWallet?.address || userWalletAddress || null;
  }, [wallets, userWalletAddress]);

  // Obtener la dirección del contrato RevenueShareFactory para la red seleccionada
  const factoryAddress = CONTRACT_ADDRESSES[network]?.revenueShareFactory;

  const publicClient = createPublicClient({
    chain: base,
    transport: http(
      "https://api.developer.coinbase.com/rpc/v1/base/aNh4GkSHTvoOtsTHdpCxLJnuzfmqX8dj"
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
            params.artist as `0x${string}`, // artista como owner (correcto)
            params.name,
            params.description,
          ],
        });

        // 💰 VERIFICAR BALANCE Y ESTIMAR COSTOS ANTES DE LA TRANSACCIÓN
        console.log("🔍 Verificando balance y estimando costos...");

        try {
          const balanceCheck = await checkBalanceAndEstimateGas(
            publicClient,
            gasPayerAddress,
            {
              to: factoryAddress,
              data,
              value: BigInt(0),
            }
          );

          if (!balanceCheck.hasEnoughFunds) {
            const errorMessage = `Fondos insuficientes para crear RevenueShare. 
              Balance actual: ${(
                Number(balanceCheck.currentBalance) / 1e18
              ).toFixed(6)} ETH
              Gas estimado necesario: ${(
                Number(balanceCheck.estimatedGasCost) / 1e18
              ).toFixed(6)} ETH
              Faltan: ${balanceCheck.shortfall!.toFixed(6)} ETH
              
              Por favor, transfiere al menos ${balanceCheck.shortfall!.toFixed(
                6
              )} ETH a la cuenta: ${gasPayerAddress}`;

            console.error("❌", errorMessage);
            toast.error("Fondos insuficientes", {
              description: `Necesitas ${balanceCheck.shortfall!.toFixed(
                6
              )} ETH adicionales para crear el contrato. Cuenta: ${gasPayerAddress}`,
            });

            throw new Error(errorMessage);
          }

          toast.info(
            `Estimado del gas: ${(
              Number(balanceCheck.estimatedGasCost) / 1e18
            ).toFixed(6)} ETH`
          );
        } catch (estimationError: any) {
          console.error("❌ Error estimando costos:", estimationError);

          // Si el error es de fondos insuficientes, no continuar
          if (
            estimationError.message?.includes("insufficient funds") ||
            estimationError.message?.includes("Fondos insuficientes")
          ) {
            throw estimationError;
          }

          // Para otros errores de estimación, continuar con advertencia
          console.warn("⚠️ No se pudo estimar gas exacto, continuando...");
          toast.warning(
            "No se pudo estimar gas exacto, procediendo con precaución"
          );
        }

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

        // 🔍 DEBUGGEAR: El contrato debería haber dado MANAGER_ROLE a gasPayerWallet automáticamente
        try {
          const MANAGER_ROLE =
            "0x241ecf16d79d0f8dbfb92cbc07fe17840425976cf0667f022fe9877caa831b08";

          const hasManagerRole = await publicClient.readContract({
            address: newRevenueShareAddress as `0x${string}`,
            abi: RevenueShareABI,
            functionName: "hasRole",
            args: [MANAGER_ROLE, gasPayerWallet.account.address],
          });

          console.log(
            "🔍 DEBUG: gasPayerWallet tiene MANAGER_ROLE automático:",
            hasManagerRole
          );

          if (!hasManagerRole) {
            console.log(
              "❌ ERROR: gasPayerWallet debería tener MANAGER_ROLE automáticamente!"
            );
            console.log(
              "   Factory msg.sender:",
              gasPayerWallet.account.address
            );
            console.log("   Contrato creado:", newRevenueShareAddress);
          } else {
            console.log(
              "✅ PERFECTO: gasPayerWallet tiene MANAGER_ROLE automático"
            );
          }
        } catch (debugError) {
          console.error("❌ Error debuggeando MANAGER_ROLE:", debugError);
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
      curatorPercentage: number,
      platformPercentage?: number // Nuevo parámetro opcional para la plataforma
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

        // 🔍 DIAGNÓSTICO: Verificar permisos y estado antes de la transacción
        try {
          console.log("🔍 Verificando permisos y configuración...");
          console.log("   📍 RevenueShare:", revenueShareAddress);
          console.log("   📍 Collection:", collectionAddress);
          console.log("   📍 TokenId:", tokenId);
          console.log("   📍 Curator:", curatorAddress);
          console.log("   📍 User (gas payer):", evmAddress);

          // Verificar si el usuario es manager o owner del contrato
          try {
            const isManagerResult = await publicClient.readContract({
              address: revenueShareAddress as `0x${string}`,
              abi: RevenueShareABI,
              functionName: "isManager",
              args: [evmAddress as `0x${string}`],
            });
            console.log("   👤 Usuario es manager:", isManagerResult);

            // Verificar si es owner
            try {
              const ownerAddress = await publicClient.readContract({
                address: revenueShareAddress as `0x${string}`,
                abi: RevenueShareABI,
                functionName: "owner",
              });
              console.log("   👑 Owner del contrato:", ownerAddress);
              console.log(
                "   👤 Usuario es owner:",
                ownerAddress.toLowerCase() === evmAddress.toLowerCase()
              );
            } catch (ownerError) {
              console.log("   ⚠️ No se pudo verificar owner");
            }
          } catch (managerError) {
            console.log("   ⚠️ No se pudo verificar si es manager");
          }

          // Verificar splits existentes para este token
          try {
            const existingSplits = await publicClient.readContract({
              address: revenueShareAddress as `0x${string}`,
              abi: RevenueShareABI,
              functionName: "getMintSplits",
              args: [collectionAddress as `0x${string}`, BigInt(tokenId)],
            });
            console.log("   📊 Splits existentes:", existingSplits);
          } catch (splitsError) {
            console.log("   📊 No hay splits configurados (primera vez)");
          }
        } catch (diagError) {
          console.error("⚠️ Error en diagnóstico (continuando):", diagError);
        }

        // Obtener el wallet que pagará el gas
        const gasPayerWallet = getGasPayerWallet();

        if (!gasPayerWallet) {
          toast.error("No se pudo configurar la wallet para pagar el gas");
          return false;
        }

        // 🔍 VERIFICAR QUE GASPAYERWALLET TENGA PERMISOS
        const gasPayerAddress = gasPayerWallet.account.address;
        console.log("   🔑 GasPayerWallet address:", gasPayerAddress);

        try {
          const ownerAddress = await publicClient.readContract({
            address: revenueShareAddress as `0x${string}`,
            abi: RevenueShareABI,
            functionName: "owner",
          });
          console.log("   👑 Contract owner:", ownerAddress);
          console.log(
            "   🔍 GasPayer es owner:",
            ownerAddress.toLowerCase() === gasPayerAddress.toLowerCase()
          );

          if (ownerAddress.toLowerCase() !== gasPayerAddress.toLowerCase()) {
            // Verificar si gasPayerWallet tiene MANAGER_ROLE
            const MANAGER_ROLE =
              "0x241ecf16d79d0f8dbfb92cbc07fe17840425976cf0667f022fe9877caa831b08";

            const hasManagerRole = await publicClient.readContract({
              address: revenueShareAddress as `0x${string}`,
              abi: RevenueShareABI,
              functionName: "hasRole",
              args: [MANAGER_ROLE, gasPayerAddress],
            });

            console.log(
              "   🔍 GasPayerWallet tiene MANAGER_ROLE:",
              hasManagerRole
            );

            if (!hasManagerRole) {
              console.log(
                "❌ GasPayerWallet NO tiene MANAGER_ROLE - saltando configuración de splits"
              );
              toast.error(
                "No se pudieron configurar los splits - usar el owner para configurar manualmente"
              );
              return false;
            }

            console.log(
              "✅ GasPayerWallet tiene MANAGER_ROLE - usando gasPayerWallet"
            );
          }
        } catch (ownerError) {
          console.error("❌ No se pudo verificar owner del contrato");
          return false;
        }

        // 🔧 SPLITS DE MINT: Debe totalizar 100% (10000) - representa la distribución de la parte NO-cascade
        // La cascada (70%) se maneja automáticamente en distributeCascadePayment
        // Los splits (100%) se aplicarán solo al 30% restante después del cascade

        const mintShares = [];

        // Obtener dirección de la plataforma (ya tenemos gasPayerWallet)
        const platformAddress: string | undefined =
          "0xea049eF29ef59ce889Dfedffbb655BaDc734bD42";

        if (platformPercentage && platformPercentage > 0 && platformAddress) {
          // Si se especifica porcentaje de plataforma, crear splits para ambos
          const totalRemanentPercentage =
            curatorPercentage + platformPercentage;

          if (totalRemanentPercentage > 30) {
            throw new Error(
              `Error: La suma de curator (${curatorPercentage}%) y plataforma (${platformPercentage}%) no puede exceder el 30% del total`
            );
          }

          // Convertir porcentajes relativos al remanente (30%) a basis points del 100%
          const curatorBasisPoints = Math.floor(
            (curatorPercentage / 30) * 10000
          );
          const platformBasisPoints = Math.floor(
            (platformPercentage / 30) * 10000
          );

          // Ajustar para que sume exactamente 10000
          const totalCalculated = curatorBasisPoints + platformBasisPoints;
          const adjustment = 10000 - totalCalculated;
          const adjustedCuratorBasisPoints = curatorBasisPoints + adjustment;

          console.log(
            `💰 Configurando splits: ${curatorPercentage}% curator + ${platformPercentage}% plataforma del 30% remanente`
          );
          console.log(
            `📊 Basis points: ${adjustedCuratorBasisPoints} curator + ${platformBasisPoints} plataforma = ${
              adjustedCuratorBasisPoints + platformBasisPoints
            }`
          );

          mintShares.push(
            {
              account: curatorAddress as `0x${string}`,
              percentage: BigInt(adjustedCuratorBasisPoints),
            },
            {
              account: platformAddress as `0x${string}`,
              percentage: BigInt(platformBasisPoints),
            }
          );
        } else {
          // Flujo original: todo el remanente (30%) va al curator
          console.log(
            `💰 Configurando splits: ${curatorPercentage}% solo para curator (sin plataforma)`
          );
          mintShares.push({
            account: curatorAddress as `0x${string}`,
            percentage: BigInt(10000), // 100% del remanente después del cascade
          });
        }

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

        if (platformPercentage && platformPercentage > 0) {
          toast.success(
            `Splits configurados: ${curatorPercentage}% curator + ${platformPercentage}% plataforma`
          );
        } else {
          toast.success(
            `Splits de curator configurados: ${curatorPercentage}%`
          );
        }
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

        // 💰 VERIFICAR BALANCE ANTES DE CONFIGURAR SPLITS
        try {
          const balanceCheck = await checkBalanceAndEstimateGas(
            publicClient,
            gasPayerWallet.account.address,
            {
              to: params.revenueShareAddress,
              data: mintSplitsData,
              value: BigInt(0),
            }
          );

          if (!balanceCheck.hasEnoughFunds) {
            toast.error("Fondos insuficientes para configurar splits", {
              description: `Necesitas ${balanceCheck.shortfall!.toFixed(
                6
              )} ETH adicionales`,
            });
            throw new Error(
              `Fondos insuficientes: faltan ${balanceCheck.shortfall} ETH`
            );
          }
        } catch (balanceError: any) {
          if (balanceError.message?.includes("Fondos insuficientes")) {
            throw balanceError;
          }
          console.warn("⚠️ No se pudo verificar balance, continuando...");
        }

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

        // 💰 VERIFICAR BALANCE ANTES DE CONFIGURAR ROYALTIES
        try {
          const balanceCheck = await checkBalanceAndEstimateGas(
            publicClient,
            gasPayerWallet.account.address,
            {
              to: params.revenueShareAddress,
              data: royaltiesData,
              value: BigInt(0),
            }
          );

          if (!balanceCheck.hasEnoughFunds) {
            toast.error("Fondos insuficientes para configurar royalties", {
              description: `Necesitas ${balanceCheck.shortfall!.toFixed(
                6
              )} ETH adicionales`,
            });
            throw new Error(
              `Fondos insuficientes: faltan ${balanceCheck.shortfall} ETH`
            );
          }
        } catch (balanceError: any) {
          if (balanceError.message?.includes("Fondos insuficientes")) {
            throw balanceError;
          }
          console.warn(
            "⚠️ No se pudo verificar balance para royalties, continuando..."
          );
        }

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

  // 💰 Función para TIP con economía en cascada mejorada
  // ✅ El contrato upgradeable resuelve automáticamente owners de colecciones
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

        // PREPARAR datos de la transacción
        const distributeCascadeData = encodeFunctionData({
          abi: RevenueShareABI,
          functionName: "distributeCascadePayment",
          args: [
            collectionAddress as `0x${string}`, // collection address (dirección de la colección NFT)
            BigInt(tokenId),
          ],
        });

        // 💰 VERIFICAR BALANCE ANTES DE LA TRANSACCIÓN
        let gasEstimate: bigint;
        try {
          const balance = await publicClient.getBalance({
            address: fromAddress as `0x${string}`,
          });

          console.log("💰 Balance actual:", balance.toString(), "wei");
          console.log("💰 Balance en ETH:", Number(balance) / 1e18);
          console.log("💰 Monto requerido:", amountInWei.toString(), "wei");
          console.log("💰 Monto en ETH:", amountInEth);

          // 🔍 DIAGNÓSTICO DETALLADO ANTES DE ESTIMAR GAS
          console.log(
            "🔍 Verificando configuraciones del contrato antes de gas estimate..."
          );

          // 1. Verificar mint splits
          try {
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

            console.log("💰 Mint splits:", mintSplits);
            if (!mintSplits || mintSplits.length === 0) {
              console.error(
                "❌ No hay mint splits configurados para este token"
              );
              throw new Error("No mint splits configured");
            }

            // Verificar que los porcentajes sumen 10000 o que al menos haya un split válido
            const totalPercentage = mintSplits.reduce(
              (sum: number, split: any) => {
                return sum + Number(split.percentage);
              },
              0
            );
            console.log("📊 Total de porcentajes de splits:", totalPercentage);

            if (totalPercentage === 0) {
              console.error("❌ Los porcentajes de splits suman 0");
              throw new Error("Invalid split percentages");
            }
          } catch (splitsError) {
            console.error("❌ Error verificando mint splits:", splitsError);
            throw new Error(`Mint splits verification failed: ${splitsError}`);
          }

          // 2. Verificar herencia/cascada
          try {
            const inheritanceABI = [
              {
                name: "getInheritedSources",
                type: "function",
                inputs: [{ name: "tokenId", type: "uint256" }],
                outputs: [{ name: "", type: "address[]" }],
                stateMutability: "view",
              },
              {
                name: "getCascadePercentage",
                type: "function",
                inputs: [{ name: "tokenId", type: "uint256" }],
                outputs: [{ name: "", type: "uint96" }],
                stateMutability: "view",
              },
            ];

            const inheritedSources = await publicClient.readContract({
              address: revenueShareAddress as `0x${string}`,
              abi: inheritanceABI,
              functionName: "getInheritedSources",
              args: [BigInt(tokenId)],
            });

            const cascadePercentage = await publicClient.readContract({
              address: revenueShareAddress as `0x${string}`,
              abi: inheritanceABI,
              functionName: "getCascadePercentage",
              args: [BigInt(tokenId)],
            });

            console.log("🔗 Fuentes heredadas:", inheritedSources);
            console.log("⚖️ Porcentaje de cascada:", cascadePercentage);

            // ✅ El contrato upgradeable ahora resuelve automáticamente los owners
            // Ya no necesitamos verificar si las direcciones pueden recibir ETH
            console.log(
              "✅ El contrato resolverá automáticamente los owners de las colecciones"
            );

            // 🧪 PROBAR DIRECTAMENTE SI PODEMOS ENVIAR ETH AL ARTISTA
            // const artistAddress = "0x8AdB648bB68c1Ea15Ec5d510Da8D374A6Cb9b447";
            // console.log(
            //   "🧪 Probando envío directo de ETH al artista:",
            //   artistAddress
            // );

            // try {
            //   await publicClient.call({
            //     to: artistAddress as `0x${string}`,
            //     value: BigInt(1), // 1 wei para probar
            //     data: "0x",
            //     account: fromAddress as `0x${string}`,
            //   });
            //   console.log("✅ El artista PUEDE recibir ETH directamente");
            // } catch (directError) {
            //   console.error(
            //     "❌ El artista NO puede recibir ETH directamente:",
            //     directError
            //   );
            //   toast.error("Problema detectado", {
            //     description: `La dirección del artista ${artistAddress} no puede recibir ETH. Podría ser un Smart Contract Wallet sin función receive().`,
            //   });
            // }

            // 🧪 PROBAR TAMBIÉN EL CURADOR (aquí podría estar el problema real)
            console.log("📊 Verificando mint splits del curador...");
            const mintSplits = await publicClient.readContract({
              address: revenueShareAddress as `0x${string}`,
              abi: RevenueShareABI,
              functionName: "getMintSplits",
              args: [collectionAddress as `0x${string}`, BigInt(tokenId)],
            });

            if (
              mintSplits &&
              Array.isArray(mintSplits) &&
              mintSplits.length > 0
            ) {
              const curadorAddress = mintSplits[0].account;
              console.log(
                "🧪 Probando envío directo de ETH al curador:",
                curadorAddress
              );

              try {
                await publicClient.call({
                  to: curadorAddress as `0x${string}`,
                  value: BigInt(1),
                  data: "0x",
                  account: fromAddress as `0x${string}`,
                });
                console.log("✅ El curador PUEDE recibir ETH directamente");
              } catch (curadorError) {
                console.error(
                  "❌ 🚨 CURADOR NO puede recibir ETH:",
                  curadorError
                );
                toast.error("🚨 PROBLEMA ENCONTRADO", {
                  description: `El curador ${curadorAddress} NO puede recibir ETH. Este es el problema real.`,
                });
              }
            }

            if (inheritedSources && Array.isArray(inheritedSources)) {
              console.log(
                `🎨 ${inheritedSources.length} fuentes heredadas configuradas`
              );

              // 🧪 PROBAR LA RESOLUCIÓN DE OWNERS MANUALMENTE
              for (let i = 0; i < inheritedSources.length; i++) {
                const source = inheritedSources[i];
                console.log(`   ${i + 1}. ${source}`);

                try {
                  // Intentar obtener owner() del contrato de colección
                  const ownerResult = await publicClient.readContract({
                    address: source as `0x${string}`,
                    abi: [
                      {
                        name: "owner",
                        type: "function",
                        inputs: [],
                        outputs: [{ name: "", type: "address" }],
                        stateMutability: "view",
                      },
                    ],
                    functionName: "owner",
                  });
                  console.log(`      ✅ owner(): ${ownerResult}`);

                  // 🔍 VERIFICAR SI EL OWNER PUEDE RECIBIR ETH
                  try {
                    const ownerCode = await publicClient.getBytecode({
                      address: ownerResult as `0x${string}`,
                    });

                    if (!ownerCode || ownerCode === "0x") {
                      console.log(`      ✅ Owner es EOA (puede recibir ETH)`);
                    } else {
                      console.log(
                        `      ⚠️ Owner es un contrato - verificando si puede recibir ETH...`
                      );

                      // Probar si el contrato owner puede recibir ETH
                      try {
                        await publicClient.call({
                          to: ownerResult as `0x${string}`,
                          value: BigInt(1), // 1 wei para probar
                          data: "0x",
                          account: fromAddress as `0x${string}`,
                        });
                        console.log(
                          `      ✅ Owner (contrato) puede recibir ETH`
                        );
                      } catch (receiveError) {
                        console.error(
                          `      ❌ Owner (contrato) NO puede recibir ETH:`,
                          receiveError
                        );
                        console.error(
                          `      🚨 PROBLEMA: El owner resuelto ${ownerResult} no puede recibir ETH`
                        );
                      }
                    }
                  } catch (ownerCheckError) {
                    console.error(
                      `      ❌ Error verificando owner:`,
                      ownerCheckError
                    );
                  }
                } catch (ownerError) {
                  console.log(`      ❌ owner() no disponible`);

                  // Intentar getArtist()
                  try {
                    const artistResult = await publicClient.readContract({
                      address: source as `0x${string}`,
                      abi: [
                        {
                          name: "getArtist",
                          type: "function",
                          inputs: [],
                          outputs: [{ name: "", type: "address" }],
                          stateMutability: "view",
                        },
                      ],
                      functionName: "getArtist",
                    });
                    console.log(`      ✅ getArtist(): ${artistResult}`);
                  } catch (artistError) {
                    console.log(`      ❌ getArtist() no disponible`);
                    console.log(
                      `      ⚠️ No se puede resolver owner de ${source}`
                    );
                  }
                }
              }
            }
          } catch (inheritanceError) {
            console.error(
              "⚠️ Error verificando herencia (no crítico):",
              inheritanceError
            );
          }

          // Estimar gas para la transacción
          gasEstimate = await publicClient.estimateGas({
            account: fromAddress as `0x${string}`,
            to: revenueShareAddress as `0x${string}`,
            data: distributeCascadeData,
            value: amountInWei,
          });

          const gasPrice = await publicClient.getGasPrice();
          const estimatedGasCost = gasEstimate * gasPrice;
          const totalRequired = amountInWei + estimatedGasCost;

          console.log("⛽ Gas estimado:", gasEstimate.toString());
          console.log("⛽ Precio del gas:", gasPrice.toString());
          console.log(
            "⛽ Costo estimado del gas:",
            Number(estimatedGasCost) / 1e18,
            "ETH"
          );
          console.log(
            "💸 Total requerido:",
            Number(totalRequired) / 1e18,
            "ETH"
          );

          if (balance < totalRequired) {
            const shortfall = Number(totalRequired - balance) / 1e18;
            toast.error("Fondos insuficientes", {
              description: `Necesitas ${shortfall.toFixed(
                6
              )} ETH adicionales para esta transacción (incluyendo gas)`,
            });
            return false;
          }
        } catch (balanceError) {
          console.error("Error verificando balance:", balanceError);

          // Si falla el gas estimate, intentemos diagnosticar el problema
          console.log("🔍 Diagnosticando problema con la transacción...");

          // Verificar que el contrato existe y es la versión correcta
          try {
            const code = await publicClient.getBytecode({
              address: revenueShareAddress as `0x${string}`,
            });
            if (!code || code === "0x") {
              toast.error(
                "El contrato RevenueShare no existe en esta dirección"
              );
              return false;
            }
            console.log("✅ Contrato RevenueShare existe");

            // 🔍 Verificar si es la versión upgradeable
            try {
              const version = await publicClient.readContract({
                address: revenueShareAddress as `0x${string}`,
                abi: [
                  {
                    name: "version",
                    type: "function",
                    inputs: [],
                    outputs: [{ name: "", type: "string" }],
                    stateMutability: "pure",
                  },
                ],
                functionName: "version",
              });
              console.log("✅ Versión del contrato:", version);
              console.log("✅ Contrato upgradeable confirmado");

              // 🧪 VERIFICAR SI EL CONTRATO TIENE LA NUEVA LÓGICA DE FALLBACK
              // Intentemos hacer una transacción con menos ETH para ver si da más información
              console.log(
                "🧪 Probando distributeCascadePayment con 1 wei para diagnosticar..."
              );

              try {
                const diagnosisSimulation = await publicClient.simulateContract(
                  {
                    address: revenueShareAddress as `0x${string}`,
                    abi: RevenueShareABI,
                    functionName: "distributeCascadePayment",
                    args: [collectionAddress as `0x${string}`, BigInt(tokenId)],
                    account: fromAddress as `0x${string}`,
                    value: BigInt(1), // Solo 1 wei para diagnóstico
                  }
                );
                console.log(
                  "✅ Simulación con 1 wei exitosa - el problema podría ser el monto"
                );

                // 🧮 CALCULAR EXACTAMENTE LO QUE HARÁ EL CONTRATO
                const totalAmount = BigInt("1000000000000000"); // 0.001 ETH
                const cascadePercent = BigInt(7000); // 70%
                const sourcesLength = BigInt(2);

                const cascadeAmount =
                  (totalAmount * cascadePercent) / BigInt(10000);
                const perSource = cascadeAmount / sourcesLength;
                const remainingAmount = totalAmount - cascadeAmount;

                console.log("🧮 CÁLCULOS DEL CONTRATO:");
                console.log(
                  "   📊 Total amount:",
                  totalAmount.toString(),
                  "wei"
                );
                console.log(
                  "   📊 Cascade (70%):",
                  cascadeAmount.toString(),
                  "wei"
                );
                console.log("   📊 Per source:", perSource.toString(), "wei");
                console.log(
                  "   📊 Remaining:",
                  remainingAmount.toString(),
                  "wei"
                );
                console.log(
                  "   📊 Para curador (100%):",
                  remainingAmount.toString(),
                  "wei"
                );
              } catch (diagError: any) {
                console.error(
                  "❌ Simulación con 1 wei también falla:",
                  diagError
                );

                // Verificar si el error da más detalles
                if (diagError.message?.includes("TransferFailed")) {
                  console.error(
                    "🚨 TransferFailed confirmado - el problema está en las transferencias ETH"
                  );
                } else {
                  console.error("🔍 Error diferente:", diagError.message);
                }
              }
            } catch (versionError) {
              console.error(
                "❌ No se pudo obtener versión - posiblemente versión antigua del contrato"
              );
              toast.warning(
                "Advertencia: Parece ser una versión antigua del contrato"
              );
            }
          } catch (codeError) {
            console.error(
              "Error verificando bytecode del contrato:",
              codeError
            );
          }

          // Continuar con un gas límite por defecto en lugar de fallar
          gasEstimate = BigInt(200000); // Gas por defecto razonable
          console.log(
            "⚠️ Usando gas estimado por defecto:",
            gasEstimate.toString()
          );

          toast.warning(
            "No se pudo estimar gas exacto, usando valor por defecto"
          );
          // No retornamos false, continuamos con la transacción
        }

        console.log(
          "Enviando ETH y ejecutando distributeCascadePayment con resolución automática de owners..."
        );

        // ✅ Con el contrato mejorado, la simulación debería ser más confiable
        try {
          console.log("🧪 Simulando transacción...");
          const simulation = await publicClient.simulateContract({
            address: revenueShareAddress as `0x${string}`,
            abi: RevenueShareABI,
            functionName: "distributeCascadePayment",
            args: [collectionAddress as `0x${string}`, BigInt(tokenId)],
            account: fromAddress as `0x${string}`,
            value: amountInWei,
          });
          console.log(
            "✅ Simulación exitosa - contrato resolverá owners automáticamente"
          );
        } catch (simulationError: any) {
          console.error("❌ Error en simulación:", simulationError);

          // Con el contrato mejorado, los errores de simulación son más significativos
          toast.error("Error en la simulación de la transacción", {
            description: "Verifica la configuración de splits y herencia",
          });
          throw simulationError; // No continuar si la simulación falla
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
              gas: `0x${gasEstimate.toString(16)}`, // Usar el gas estimado
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
            "ETH distribuido automáticamente - owners de colecciones resueltos automáticamente",
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
      user?.wallet?.walletClientType,
    ]
  );

  // 💰 Función para verificar balance de la wallet de gas de forma independiente
  const checkGasPayerBalance = useCallback(async (): Promise<{
    balance: number;
    address: string;
  } | null> => {
    try {
      const gasPayerWallet = getGasPayerWallet();
      if (!gasPayerWallet) {
        return null;
      }

      const balance = await publicClient.getBalance({
        address: gasPayerWallet.account.address as `0x${string}`,
      });

      return {
        balance: Number(balance) / 1e18,
        address: gasPayerWallet.account.address,
      };
    } catch (error) {
      console.error("Error verificando balance del gas payer:", error);
      return null;
    }
  }, [publicClient]);

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
    // 💰 NUEVA FUNCIÓN PARA VERIFICAR BALANCE
    checkGasPayerBalance,
  };
};
