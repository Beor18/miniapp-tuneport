import { useState, useCallback } from "react";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { MusicCollectionABI } from "./MusicCollectionABI";
import {
  TokenInfo,
  UserTokenBalance,
  UserNFTInfo,
  CollectionInfo,
  EnhancedUserNFT,
  NFTMetadata,
} from "./types";

// Cliente público para consultas blockchain
const publicClient = createPublicClient({
  chain: base,
  transport: http(
    "https://api.developer.coinbase.com/rpc/v1/base/aNh4GkSHTvoOtsTHdpCxLJnuzfmqX8dj"
  ),
});

export const useNFTQueries = () => {
  const [isLoading, setIsLoading] = useState(false);

  // ===============================
  // FUNCIONES BÁSICAS DEL CONTRATO
  // ===============================

  const getExistingTokenIds = useCallback(
    async (contractAddress: string): Promise<bigint[]> => {
      try {
        const result = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: MusicCollectionABI,
          functionName: "getExistingTokenIds",
        });
        return result as bigint[];
      } catch (error) {
        console.error("Error getting existing token IDs:", error);
        return [];
      }
    },
    []
  );

  const getTokenInfo = useCallback(
    async (
      contractAddress: string,
      tokenId: number
    ): Promise<TokenInfo | null> => {
      try {
        const result = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: MusicCollectionABI,
          functionName: "getTokenInfo",
          args: [BigInt(tokenId)],
        });
        return result as TokenInfo;
      } catch (error) {
        console.error("Error getting token info:", error);
        return null;
      }
    },
    []
  );

  const getTokensInfo = useCallback(
    async (
      contractAddress: string,
      tokenIds: number[]
    ): Promise<TokenInfo[]> => {
      try {
        const result = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: MusicCollectionABI,
          functionName: "getTokensInfo",
          args: [tokenIds.map((id) => BigInt(id))],
        });
        return result as TokenInfo[];
      } catch (error) {
        console.error("Error getting tokens info:", error);
        return [];
      }
    },
    []
  );

  const getUserTokenIds = useCallback(
    async (contractAddress: string, userAddress: string): Promise<bigint[]> => {
      try {
        const result = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: MusicCollectionABI,
          functionName: "getUserTokenIds",
          args: [userAddress as `0x${string}`],
        });
        return result as bigint[];
      } catch (error) {
        console.error("Error getting user token IDs:", error);
        return [];
      }
    },
    []
  );

  const getUserTokenBalances = useCallback(
    async (
      contractAddress: string,
      userAddress: string
    ): Promise<UserTokenBalance[]> => {
      try {
        const result = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: MusicCollectionABI,
          functionName: "getUserTokenBalances",
          args: [userAddress as `0x${string}`],
        });
        return result as UserTokenBalance[];
      } catch (error) {
        console.error("Error getting user token balances:", error);
        return [];
      }
    },
    []
  );

  const getUserNFTsInfo = useCallback(
    async (
      contractAddress: string,
      userAddress: string
    ): Promise<UserNFTInfo[]> => {
      try {
        const result = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: MusicCollectionABI,
          functionName: "getUserNFTsInfo",
          args: [userAddress as `0x${string}`],
        });
        return result as UserNFTInfo[];
      } catch (error) {
        console.error("Error getting user NFTs info:", error);
        return [];
      }
    },
    []
  );

  const getCollectionInfo = useCallback(
    async (contractAddress: string): Promise<CollectionInfo | null> => {
      try {
        const result = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: MusicCollectionABI,
          functionName: "getCollectionInfo",
        });
        return result as CollectionInfo;
      } catch (error) {
        console.error("Error getting collection info:", error);
        return null;
      }
    },
    []
  );

  const tokenExists = useCallback(
    async (contractAddress: string, tokenId: number): Promise<boolean> => {
      try {
        const result = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: MusicCollectionABI,
          functionName: "tokenExists",
          args: [BigInt(tokenId)],
        });
        return result as boolean;
      } catch (error) {
        console.error("Error checking if token exists:", error);
        return false;
      }
    },
    []
  );

  const getContractVersion = useCallback(
    async (contractAddress: string): Promise<string> => {
      try {
        const result = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: MusicCollectionABI,
          functionName: "version",
        });
        return result as string;
      } catch (error) {
        console.error("Error getting contract version:", error);
        return "unknown";
      }
    },
    []
  );

  // ===============================
  // FUNCIONES AVANZADAS CON METADATOS
  // ===============================

  const fetchMetadataFromURI = useCallback(
    async (tokenURI: string): Promise<NFTMetadata | null> => {
      try {
        if (!tokenURI) return null;

        // Convertir IPFS URI si es necesario
        const metadataUrl = tokenURI.startsWith("ipfs://")
          ? tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/")
          : tokenURI;

        const response = await fetch(metadataUrl, {
          next: { revalidate: 1800 }, // Cache 30 minutos
          headers: {
            "Cache-Control":
              "public, s-maxage=1800, stale-while-revalidate=3600",
          },
        });

        if (response.ok) {
          const metadata = await response.json();
          return metadata as NFTMetadata;
        }

        return null;
      } catch (error) {
        console.error("Error fetching metadata:", error);
        return null;
      }
    },
    []
  );

  const getEnhancedUserNFTs = useCallback(
    async (
      contractAddress: string,
      userAddress: string
    ): Promise<EnhancedUserNFT[]> => {
      setIsLoading(true);
      try {
        console.log("🔍 Fetching enhanced user NFTs...");

        // 1. Obtener NFTs básicos del contrato
        const userNFTsInfo = await getUserNFTsInfo(
          contractAddress,
          userAddress
        );

        if (userNFTsInfo.length === 0) {
          console.log("No NFTs found for user");
          return [];
        }

        console.log(`Found ${userNFTsInfo.length} NFTs for user`);

        // 2. Obtener metadatos para cada NFT
        const enhancedNFTs = await Promise.all(
          userNFTsInfo.map(async (nftInfo) => {
            try {
              // Fetch metadatos desde tokenURI
              const metadata = await fetchMetadataFromURI(nftInfo.tokenURI);

              // Filtrar solo NFTs de community "tuneport"
              if (!metadata || metadata.community !== "tuneport") {
                console.log(
                  `⚠️ Skipping token ${nftInfo.tokenId} - not tuneport community`
                );
                return null;
              }

              // Construir NFT enhanceado
              const enhancedNFT: EnhancedUserNFT = {
                tokenId: nftInfo.tokenId.toString(),
                balance: Number(nftInfo.balance),
                totalSupply: Number(nftInfo.totalSupply),
                contractAddress,

                // Metadatos parseados
                name: metadata.name || `Token #${nftInfo.tokenId}`,
                artist:
                  metadata.collaborators?.[0]?.name ||
                  metadata.artist_name ||
                  metadata.artist ||
                  "Artista Desconocido",
                image:
                  metadata.image_cover || metadata.image
                    ? (metadata.image_cover || metadata.image).startsWith(
                        "ipfs://"
                      )
                      ? (metadata.image_cover || metadata.image).replace(
                          "ipfs://",
                          "https://ipfs.io/ipfs/"
                        )
                      : metadata.image_cover || metadata.image
                    : `/logo-white.png`,
                description: metadata.description,

                // Metadatos completos
                metadata,

                // Información adicional de tuneport
                external_url: metadata.external_url,
                collection_type: metadata.collection_type,
                music_genre: metadata.music_genre,
                record_label: metadata.record_label,
                mint_currency: metadata.mint_currency,
                slug: metadata.slug,
                network: metadata.network,
                symbol: metadata.symbol,
                collaborators: metadata.collaborators,
                attributes: metadata.attributes,
                start_mint_date: metadata.start_mint_date,
                release_date: metadata.release_date,
                max_items: metadata.max_items,
                address_creator_collection: metadata.address_creator_collection,
              };

              return enhancedNFT;
            } catch (error) {
              console.warn(`Error processing NFT ${nftInfo.tokenId}:`, error);
              return null;
            }
          })
        );

        // Filtrar resultados válidos
        const validNFTs = enhancedNFTs.filter(
          (nft): nft is EnhancedUserNFT => nft !== null
        );

        console.log(
          `✅ Enhanced ${validNFTs.length} tuneport NFTs for user ${userAddress}`
        );
        return validNFTs;
      } catch (error) {
        console.error("Error getting enhanced user NFTs:", error);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [getUserNFTsInfo, fetchMetadataFromURI]
  );

  const getEnhancedCollectionTokens = useCallback(
    async (contractAddress: string): Promise<EnhancedUserNFT[]> => {
      setIsLoading(true);
      try {
        console.log("🔍 Fetching enhanced collection tokens...");

        // 1. Obtener todos los tokenIds existentes
        const tokenIds = await getExistingTokenIds(contractAddress);

        if (tokenIds.length === 0) {
          console.log("No tokens found in collection");
          return [];
        }

        console.log(`Found ${tokenIds.length} tokens in collection`);

        // 2. Obtener información detallada de cada token
        const tokensInfo = await getTokensInfo(
          contractAddress,
          tokenIds.map((id) => Number(id))
        );

        // 3. Obtener metadatos para cada token
        const enhancedTokens = await Promise.all(
          tokensInfo.map(async (tokenInfo) => {
            try {
              // Fetch metadatos desde tokenURI
              const metadata = await fetchMetadataFromURI(tokenInfo.tokenURI);

              // Filtrar solo NFTs de community "tuneport"
              if (!metadata || metadata.community !== "tuneport") {
                console.log(
                  `⚠️ Skipping token ${tokenInfo.tokenId} - not tuneport community`
                );
                return null;
              }

              // Construir token enhanceado
              const enhancedToken: EnhancedUserNFT = {
                tokenId: tokenInfo.tokenId.toString(),
                balance: 0, // No aplicable para vista de colección
                totalSupply: Number(tokenInfo.totalSupply),
                contractAddress,

                // Metadatos parseados
                name: metadata.name || `Token #${tokenInfo.tokenId}`,
                artist:
                  metadata.collaborators?.[0]?.name ||
                  metadata.artist_name ||
                  metadata.artist ||
                  "Artista Desconocido",
                image:
                  metadata.image_cover || metadata.image
                    ? (metadata.image_cover || metadata.image).startsWith(
                        "ipfs://"
                      )
                      ? (metadata.image_cover || metadata.image).replace(
                          "ipfs://",
                          "https://ipfs.io/ipfs/"
                        )
                      : metadata.image_cover || metadata.image
                    : `/logo-white.svg`,
                description: metadata.description,

                // Metadatos completos
                metadata,

                // Información adicional de tuneport
                external_url: metadata.external_url,
                collection_type: metadata.collection_type,
                music_genre: metadata.music_genre,
                record_label: metadata.record_label,
                mint_currency: metadata.mint_currency,
                slug: metadata.slug,
                network: metadata.network,
                symbol: metadata.symbol,
                collaborators: metadata.collaborators,
                attributes: metadata.attributes,
                start_mint_date: metadata.start_mint_date,
                release_date: metadata.release_date,
                max_items: metadata.max_items,
                address_creator_collection: metadata.address_creator_collection,
              };

              return enhancedToken;
            } catch (error) {
              console.warn(
                `Error processing token ${tokenInfo.tokenId}:`,
                error
              );
              return null;
            }
          })
        );

        // Filtrar resultados válidos
        const validTokens = enhancedTokens.filter(
          (token): token is EnhancedUserNFT => token !== null
        );

        console.log(
          `✅ Enhanced ${validTokens.length} tuneport tokens in collection`
        );
        return validTokens;
      } catch (error) {
        console.error("Error getting enhanced collection tokens:", error);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [getExistingTokenIds, getTokensInfo, fetchMetadataFromURI]
  );

  return {
    // Estados
    isLoading,

    // Funciones básicas del contrato
    getExistingTokenIds,
    getTokenInfo,
    getTokensInfo,
    getUserTokenIds,
    getUserTokenBalances,
    getUserNFTsInfo,
    getCollectionInfo,
    tokenExists,
    getContractVersion,

    // Funciones avanzadas con metadatos
    fetchMetadataFromURI,
    getEnhancedUserNFTs,
    getEnhancedCollectionTokens,
  };
};
