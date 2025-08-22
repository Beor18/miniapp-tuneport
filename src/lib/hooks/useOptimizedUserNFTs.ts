"use client";

import { useState, useEffect, useCallback } from "react";
import { getUserNFTs } from "@Src/app/actions/nfts.actions";
import { useNFTQueries, EnhancedUserNFT } from "@Src/lib/contracts/erc1155";
import {
  CONTRACT_ADDRESSES,
  DEFAULT_NETWORK,
} from "@Src/lib/contracts/erc1155/config";
import { useFactoryCollections } from "./useFactoryCollections";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";

// Cliente público para verificaciones directas
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(
    "https://api.developer.coinbase.com/rpc/v1/base-sepolia/aNh4GkSHTvoOtsTHdpCxLJnuzfmqX8dj"
  ),
});

interface OptimizedNFTData {
  nfts: EnhancedUserNFT[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  usingNewFunctions: boolean;
}

/**
 * Hook para obtener TODOS los NFTs que posee un usuario en TODAS las colecciones
 *
 * @param userAddress - Dirección del usuario a consultar (puede ser cualquier dirección)
 *
 * Funcionalidad:
 * - Obtiene dinámicamente TODAS las colecciones del factory v1.0.1
 * - Para cada colección, consulta si el usuario tiene NFTs usando getUserNFTsInfo()
 * - Detecta automáticamente colecciones v1.0.1 vs legacy
 * - Combina resultados de todas las colecciones donde el usuario tiene NFTs
 *
 * Casos de uso:
 * - Fan consulta sus NFTs comprados
 * - Artista ve NFTs que minteó en sus colecciones
 * - Cualquier usuario puede ver NFTs públicos de cualquier dirección
 * - Admins pueden auditar tenencia de NFTs
 *
 * @example
 * // Consultar NFTs de cualquier usuario
 * const { nfts, loading, usingNewFunctions } = useOptimizedUserNFTs("0x123...");
 *
 * // Resultado: Todos los NFTs que posee esa dirección en todas las colecciones
 * // - Collection A: 3 NFTs
 * // - Collection B: 0 NFTs (no aparece)
 * // - Collection C: 2 NFTs
 * // Total: 5 NFTs combinados
 */
export function useOptimizedUserNFTs(userAddress?: string) {
  const [data, setData] = useState<OptimizedNFTData>({
    nfts: [],
    loading: true,
    error: null,
    totalCount: 0,
    usingNewFunctions: false,
  });

  const {
    getEnhancedUserNFTs,
    tokenExists,
    getContractVersion,
    isLoading: nftQueriesLoading,
  } = useNFTQueries();

  // 🏭 Obtener colecciones del factory
  const {
    allCollections,
    loading: factoryLoading,
    error: factoryError,
    totalCount: factoryTotalCount,
  } = useFactoryCollections();

  const fetchUserNFTs = useCallback(async () => {
    if (!userAddress) {
      setData({
        nfts: [],
        loading: false,
        error: null,
        totalCount: 0,
        usingNewFunctions: false,
      });
      return;
    }

    console.log(`🔍 fetchUserNFTs called for user: ${userAddress}`);
    setData((prev) => ({ ...prev, loading: true, error: null }));

    try {
      console.log("🔍 Fetching NFTs for user:", userAddress);

      // ⏳ Esperar a que se carguen las colecciones del factory
      if (factoryLoading) {
        console.log("⏳ Waiting for factory collections to load...");
        return;
      }

      if (factoryError) {
        console.warn("⚠️ Factory error:", factoryError);
      }

      // 🚀 MÉTODO 1: Intentar usar las nuevas funciones v1.0.1 (más eficiente)
      const factoryAddress = CONTRACT_ADDRESSES[DEFAULT_NETWORK]?.factory;
      if (factoryAddress) {
        try {
          console.log("🚀 Trying new NFT functions v1.0.1...");

          // 🧪 TEST DIRECTO: Verificar getCollectionsCount en el factory
          try {
            const directCount = await publicClient.readContract({
              address: factoryAddress as `0x${string}`,
              abi: [
                {
                  inputs: [],
                  name: "getCollectionsCount",
                  outputs: [
                    { internalType: "uint256", name: "", type: "uint256" },
                  ],
                  stateMutability: "view",
                  type: "function",
                },
              ],
              functionName: "getCollectionsCount",
            });
            console.log(
              `🧪 DIRECT factory call - collections count: ${directCount}`
            );
          } catch (directError) {
            console.warn("🧪 DIRECT factory call failed:", directError);
          }

          // 🚀 TODAS las colecciones v1.0.1 del factory (para consultar NFTs de cualquier usuario)
          console.log(
            `🏭 Factory has ${factoryTotalCount} collections:`,
            allCollections
          );
          console.log(
            `🔍 Factory loading: ${factoryLoading}, error: ${factoryError}`
          );

          // Usar TODAS las colecciones del factory - cada usuario puede tener NFTs en cualquier colección
          const v1CollectionsToTest: string[] = allCollections.filter(Boolean);

          // 🧪 TESTING: Agregar colección conocida pre-upgrade para verificación
          // const knownCollection = "0x01A4348B8f0bA8a55C3534153E4FB47331E93895";
          // if (!v1CollectionsToTest.includes(knownCollection)) {
          //   v1CollectionsToTest.push(knownCollection);
          //   console.log(
          //     `🧪 Added known pre-upgrade collection for testing: ${knownCollection}`
          //   );
          // }

          console.log(
            `🔍 Will check ${v1CollectionsToTest.length} collections for user ${userAddress}:`,
            v1CollectionsToTest
          );

          // 📚 Contratos legacy conocidos - mantener solo para testing/debugging si es necesario
          const legacyCollections: string[] = [
            // Eliminar hardcodeos legacy - usar solo server actions como fallback universal
          ];

          let allNFTs: EnhancedUserNFT[] = [];

          // Si hay colecciones v1.0.1, verificar NFTs del usuario en TODAS las colecciones
          if (v1CollectionsToTest.length > 0) {
            console.log(
              `🔍 Checking user ${userAddress} NFTs in ${v1CollectionsToTest.length} collections...`
            );
            for (const contractAddress of v1CollectionsToTest) {
              try {
                // 🔍 Primero verificar si el contrato tiene las nuevas funciones
                console.log(
                  `🔍 Checking v1.0.1 compatibility for ${contractAddress}...`
                );

                // Test rápido: verificar versión del contrato para determinar compatibilidad
                try {
                  const contractVersion = await publicClient.readContract({
                    address: contractAddress as `0x${string}`,
                    abi: [
                      {
                        inputs: [],
                        name: "version",
                        outputs: [
                          { internalType: "string", name: "", type: "string" },
                        ],
                        stateMutability: "pure",
                        type: "function",
                      },
                    ],
                    functionName: "version",
                  });

                  console.log(
                    `📝 Contract ${contractAddress} version: ${contractVersion}`
                  );

                  // Solo usar nuevas funciones si es versión 1.0.1
                  if (contractVersion === "1.0.1") {
                    console.log(
                      `✅ Contract ${contractAddress} is v1.0.1, using new functions`
                    );

                    // getUserNFTsInfo busca TODOS los NFTs que este usuario posee en esta colección
                    const userNFTs = await getEnhancedUserNFTs(
                      contractAddress,
                      userAddress
                    );
                    allNFTs = [...allNFTs, ...userNFTs];
                    console.log(
                      `✅ User ${userAddress} has ${userNFTs.length} NFTs in collection ${contractAddress}`
                    );
                  } else {
                    console.log(
                      `📦 Contract ${contractAddress} is legacy (${contractVersion}), will use fallback method`
                    );
                    // Agregar a legacy para el fallback
                    throw new Error(`Legacy version ${contractVersion}`);
                  }
                } catch (compatibilityError) {
                  console.log(
                    `⚠️ Contract ${contractAddress} is legacy (pre-v1.0.1) or error, skipping new functions:`,
                    compatibilityError
                  );
                  console.log(
                    `   Compatibility error:`,
                    compatibilityError instanceof Error
                      ? compatibilityError.message
                      : compatibilityError
                  );
                  // No agregar a allNFTs, se manejará en el fallback
                }
              } catch (error) {
                console.warn(
                  `⚠️ Error checking contract ${contractAddress}:`,
                  error
                );
              }
            }

            if (allNFTs.length > 0) {
              console.log(`✅ New functions found ${allNFTs.length} NFTs`);
              setData({
                nfts: allNFTs,
                loading: false,
                error: null,
                totalCount: allNFTs.length,
                usingNewFunctions: true,
              });
              return;
            }
          }
        } catch (error) {
          console.log(
            "⚠️ New NFT functions failed, falling back to server actions:",
            error
          );
        }
      }

      // 🔄 MÉTODO 2: Fallback - Usar server actions con múltiples estrategias (Alchemy + contract calls)
      console.log("🔄 Using server actions fallback...");

      // 🚀 MÉTODO 2: Server actions como fallback universal
      // Usa Alchemy API + detección automática - no requiere hardcodear direcciones
      console.log(
        "📡 Using server actions with Alchemy API + automatic detection..."
      );

      // Los server actions manejan automáticamente:
      // 1. Alchemy API para obtener todos los NFTs del usuario
      // 2. Detección automática de nuevas funciones v1.0.1 vs legacy
      // 3. Filtrado por community "tuneport"
      // 4. Fallback a contract calls directos si Alchemy falla

      console.log(
        `🔄 Using fallback for user ${userAddress} with factory ${factoryAddress}`
      );
      // - Alchemy API para detectar todos los NFTs del usuario
      // - Múltiples direcciones de contratos
      // - Fallback a contract calls directos
      // - Filtrado por community "tuneport"

      try {
        // Simplificado: solo pasar userAddress, Alchemy API maneja todo automáticamente
        const { nfts: serverNFTs, error: serverError } = await getUserNFTs(
          userAddress
        );

        if (serverError) {
          console.warn("⚠️ Server actions error:", serverError);
          throw new Error(serverError);
        }

        if (serverNFTs && serverNFTs.length > 0) {
          console.log(
            `✅ Server actions found ${serverNFTs.length} total NFTs via automatic detection`
          );

          // Convertir a formato EnhancedUserNFT
          const enhancedNFTs: EnhancedUserNFT[] = serverNFTs.map((nft) => ({
            tokenId: nft.id,
            balance: nft.balance || 1,
            totalSupply: 0, // No disponible en server actions legacy
            contractAddress: nft.contractAddress || "",

            // Metadatos parseados
            name: nft.name,
            artist: nft.artist,
            image: nft.image,
            description: nft.description,

            // Metadatos completos
            metadata: nft.metadata,

            // Información adicional de tuneport
            external_url: nft.external_url,
            collection_type: nft.collection_type,
            music_genre: nft.music_genre,
            record_label: nft.record_label,
            mint_currency: nft.mint_currency,
            slug: nft.slug,
            network: nft.network,
            symbol: nft.symbol,
            collaborators: nft.collaborators,
            attributes: nft.attributes,
            start_mint_date: nft.start_mint_date,
            release_date: nft.release_date,
            max_items: nft.max_items,
            address_creator_collection: nft.address_creator_collection,
          }));

          setData({
            nfts: enhancedNFTs,
            loading: false,
            error: null,
            totalCount: enhancedNFTs.length,
            usingNewFunctions: false, // Server actions = legacy fallback
          });
          return;
        } else {
          console.log("📭 No NFTs found via server actions");
        }
      } catch (serverActionError) {
        console.warn("❌ Server actions failed:", serverActionError);
        throw serverActionError;
      }

      // Si llegamos aquí, no se encontraron NFTs
      setData({
        nfts: [],
        loading: false,
        error: null,
        totalCount: 0,
        usingNewFunctions: false,
      });
    } catch (error) {
      console.error("❌ Error fetching user NFTs:", error);
      setData((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      }));
    }
  }, [
    userAddress,
    getEnhancedUserNFTs,
    factoryLoading,
    factoryError,
    allCollections,
    factoryTotalCount,
  ]);

  useEffect(() => {
    fetchUserNFTs();
  }, [fetchUserNFTs]);

  return {
    ...data,
    refetch: fetchUserNFTs,
    isLoading: data.loading || nftQueriesLoading || factoryLoading,
  };
}
