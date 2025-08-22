"use client";

import { useState, useEffect, useCallback } from "react";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import {
  CONTRACT_ADDRESSES,
  DEFAULT_NETWORK,
} from "@Src/lib/contracts/erc1155/config";

// ABI mínimo del factory para las funciones que necesitamos
const FACTORY_ABI = [
  {
    inputs: [],
    name: "getCollectionsCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "collections",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "artist", type: "address" }],
    name: "getArtistCollections",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Cliente público para llamadas al blockchain
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(
    "https://api.developer.coinbase.com/rpc/v1/base-sepolia/aNh4GkSHTvoOtsTHdpCxLJnuzfmqX8dj"
  ),
});

interface FactoryCollectionsData {
  allCollections: string[];
  loading: boolean;
  error: string | null;
  totalCount: number;
}

export function useFactoryCollections() {
  const [data, setData] = useState<FactoryCollectionsData>({
    allCollections: [],
    loading: true,
    error: null,
    totalCount: 0,
  });

  const fetchAllCollections = useCallback(async () => {
    setData((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const factoryAddress = CONTRACT_ADDRESSES[DEFAULT_NETWORK]?.factory;
      if (!factoryAddress) {
        throw new Error("Factory address not found");
      }

      console.log("🏭 Fetching collections from factory:", factoryAddress);

      // 1. Obtener el número total de colecciones
      const totalCount = await publicClient.readContract({
        address: factoryAddress as `0x${string}`,
        abi: FACTORY_ABI,
        functionName: "getCollectionsCount",
      });

      console.log(`📊 Total collections found: ${totalCount}`);

      if (Number(totalCount) === 0) {
        setData({
          allCollections: [],
          loading: false,
          error: null,
          totalCount: 0,
        });
        return;
      }

      // 2. Obtener todas las direcciones de colecciones
      const collectionPromises = [];
      for (let i = 0; i < Number(totalCount); i++) {
        collectionPromises.push(
          publicClient.readContract({
            address: factoryAddress as `0x${string}`,
            abi: FACTORY_ABI,
            functionName: "collections",
            args: [BigInt(i)],
          })
        );
      }

      const collectionsResults = await Promise.all(collectionPromises);
      const allCollections = collectionsResults.map((addr) => addr as string);

      console.log("✅ Collections retrieved:", allCollections);

      setData({
        allCollections,
        loading: false,
        error: null,
        totalCount: Number(totalCount),
      });
    } catch (error) {
      console.error("❌ Error fetching factory collections:", error);
      setData((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      }));
    }
  }, []);

  const getArtistCollections = useCallback(
    async (artistAddress: string): Promise<string[]> => {
      try {
        const factoryAddress = CONTRACT_ADDRESSES[DEFAULT_NETWORK]?.factory;
        if (!factoryAddress) {
          throw new Error("Factory address not found");
        }

        console.log(`🎨 Fetching collections for artist: ${artistAddress}`);

        const artistCollections = await publicClient.readContract({
          address: factoryAddress as `0x${string}`,
          abi: FACTORY_ABI,
          functionName: "getArtistCollections",
          args: [artistAddress as `0x${string}`],
        });

        const collections = artistCollections as string[];
        console.log(
          `✅ Artist ${artistAddress} has ${collections.length} collections:`,
          collections
        );

        return collections;
      } catch (error) {
        console.error(
          `❌ Error fetching artist collections for ${artistAddress}:`,
          error
        );
        return [];
      }
    },
    []
  );

  useEffect(() => {
    fetchAllCollections();
  }, [fetchAllCollections]);

  return {
    ...data,
    refetch: fetchAllCollections,
    getArtistCollections,
  };
}

