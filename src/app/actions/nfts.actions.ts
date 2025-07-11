"use server";

import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { MusicCollectionABI } from "@Src/lib/contracts/erc1155/MusicCollectionABI";

interface UserNFT {
  id: string;
  name: string;
  artist: string;
  image: string;
  contractAddress: string;
  balance?: number;
  metadata?: any;
  // Información adicional de tuneport
  description?: string;
  external_url?: string;
  collection_type?: string;
  music_genre?: string;
  record_label?: string;
  mint_currency?: string;
  slug?: string;
  network?: string;
  symbol?: string;
  collaborators?: Array<{
    name: string;
    address: string;
    mintPercentage: number;
    royaltyPercentage: number;
  }>;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
  start_mint_date?: string;
  release_date?: string;
  max_items?: number;
  address_creator_collection?: string;
}

// Cache global para NFTs de usuarios
const userNFTsCache = new Map<string, { nfts: UserNFT[]; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos en ms

// Cliente público para blockchain calls (fallback)
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(
    "https://api.developer.coinbase.com/rpc/v1/base-sepolia/aNh4GkSHTvoOtsTHdpCxLJnuzfmqX8dj"
  ),
});

export async function getUserNFTs(
  userAddress: string,
  contractAddress: string
): Promise<{ nfts: UserNFT[]; error?: string }> {
  try {
    if (!userAddress || !contractAddress) {
      return { nfts: [] };
    }

    // Verificar cache primero
    const cacheKey = `${userAddress.toLowerCase()}_${contractAddress.toLowerCase()}`;
    const cached = userNFTsCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(
        `🚀 Cache hit for ${userAddress} - returning cached NFTs:`,
        cached.nfts.length
      );
      return { nfts: cached.nfts };
    }

    console.log(`🔍 Cache miss for ${userAddress} - fetching fresh data...`);

    // 🚀 MÉTODO 1: Alchemy API (más eficiente - obtiene todos los NFTs de una vez)
    try {
      const alchemyApiKey = process.env.ALCHEMY_API_KEY;
      if (alchemyApiKey) {
        console.log("🔍 Trying Alchemy API for wallet NFTs...");

        const alchemyUrl = `https://base-sepolia.g.alchemy.com/nft/v3/${alchemyApiKey}/getNFTsForOwner?owner=${userAddress}&withMetadata=true`;

        const alchemyResponse = await fetch(alchemyUrl, {
          next: { revalidate: 300 }, // Cache 5 minutos (más agresivo)
          headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          },
        });

        if (alchemyResponse.ok) {
          const data = await alchemyResponse.json();
          console.log("✅ Alchemy API response:", data);

          // Proceso de los NFTs con fetch al tokenUri (con cache mejorado)
          const nftPromises =
            data.ownedNfts?.map(async (nft: any) => {
              try {
                // Hacer fetch al tokenUri para obtener metadatos completos
                let fullMetadata = null;
                if (nft.tokenUri) {
                  try {
                    // Convertir IPFS URI si es necesario
                    const metadataUrl = nft.tokenUri.startsWith("ipfs://")
                      ? nft.tokenUri.replace("ipfs://", "https://ipfs.io/ipfs/")
                      : nft.tokenUri;

                    console.log(`🔍 Fetching metadata from: ${metadataUrl}`);

                    const metadataResponse = await fetch(metadataUrl, {
                      next: { revalidate: 1800 }, // Cache metadatos 30 minutos (más agresivo)
                      headers: {
                        "Cache-Control":
                          "public, s-maxage=1800, stale-while-revalidate=3600",
                      },
                    });

                    if (metadataResponse.ok) {
                      fullMetadata = await metadataResponse.json();
                      console.log(
                        `✅ Full metadata for token ${nft.tokenId}:`,
                        fullMetadata
                      );
                    } else {
                      console.warn(
                        `Failed to fetch metadata for token ${nft.tokenId}, status:`,
                        metadataResponse.status
                      );
                    }
                  } catch (metaError) {
                    console.warn(
                      `Error fetching metadata for token ${nft.tokenId}:`,
                      metaError
                    );
                  }
                }

                // Filtrar solo NFTs de community "tuneport"
                if (!fullMetadata || fullMetadata.community !== "tuneport") {
                  console.log(
                    `⚠️ Skipping token ${nft.tokenId} - not tuneport community`
                  );
                  return null;
                }

                // Construir el objeto NFT con los metadatos completos
                return {
                  id: nft.tokenId,
                  name: fullMetadata.name || `Token #${nft.tokenId}`,
                  artist:
                    fullMetadata.collaborators?.[0]?.name ||
                    fullMetadata.artist_name ||
                    "Artista Desconocido",
                  image:
                    fullMetadata.image_cover ||
                    fullMetadata.image ||
                    `https://via.placeholder.com/300x300?text=Token+${nft.tokenId}`,
                  contractAddress,
                  balance: parseInt(nft.balance || "1"),
                  metadata: fullMetadata,
                  // Información adicional de tuneport
                  description: fullMetadata.description,
                  external_url: fullMetadata.external_url,
                  collection_type: fullMetadata.collection_type,
                  music_genre: fullMetadata.music_genre,
                  record_label: fullMetadata.record_label,
                  mint_currency: fullMetadata.mint_currency,
                  slug: fullMetadata.slug,
                  network: fullMetadata.network,
                  symbol: fullMetadata.symbol,
                  collaborators: fullMetadata.collaborators,
                  attributes: fullMetadata.attributes,
                  start_mint_date: fullMetadata.start_mint_date,
                  release_date: fullMetadata.release_date,
                  max_items: fullMetadata.max_items,
                  address_creator_collection:
                    fullMetadata.address_creator_collection,
                };
              } catch (error) {
                console.warn(`Error processing NFT ${nft.tokenId}:`, error);
                return null;
              }
            }) || [];

          // Ejecutar todas las promesas en paralelo
          const nftResults = await Promise.all(nftPromises);

          // Filtrar resultados válidos (no null)
          const nfts: UserNFT[] = nftResults.filter(
            (nft): nft is UserNFT => nft !== null
          );

          // Guardar en cache
          userNFTsCache.set(cacheKey, {
            nfts,
            timestamp: Date.now(),
          });

          console.log(
            `✅ Alchemy found ${nfts.length} tuneport NFTs for user ${userAddress} - cached for 10 minutes`
          );
          return { nfts };
        } else {
          console.warn("Alchemy API failed, status:", alchemyResponse.status);
        }
      } else {
        console.log("⚠️ ALCHEMY_API_KEY not found, using contract fallback");
      }
    } catch (alchemyError) {
      console.warn(
        "Alchemy API error, falling back to contract calls:",
        alchemyError
      );
    }

    // 🔄 MÉTODO 2: Fallback - Llamadas directas al contrato (método actual)
    console.log("🔄 Using contract calls fallback...");

    const knownTokenIds = [0, 1, 2, 3]; // IDs conocidos
    const nfts: UserNFT[] = [];

    const tokenPromises = knownTokenIds.map(async (tokenId) => {
      try {
        // 1. Verificar balance via contrato
        const balance = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: MusicCollectionABI,
          functionName: "balanceOf",
          args: [userAddress as `0x${string}`, BigInt(tokenId)],
        });

        console.log(`Token ${tokenId} balance:`, balance);

        if (Number(balance) === 0) return null;

        // 2. Obtener URI
        const uri = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: MusicCollectionABI,
          functionName: "uri",
          args: [BigInt(tokenId)],
        });

        console.log(`Token ${tokenId} URI:`, uri);

        // 3. Fetch metadatos desde URI
        let metadata: any = {};
        if (uri) {
          try {
            let metadataUrl = uri.startsWith("ipfs://")
              ? uri.replace("ipfs://", "https://ipfs.io/ipfs/")
              : uri;

            // Limpiar URI si viene con caracteres extra
            if (metadataUrl.match(/\d+$/)) {
              metadataUrl = metadataUrl.replace(/\d+$/, "");
            }

            console.log(`Token ${tokenId} metadata URL fixed:`, metadataUrl);

            const response = await fetch(metadataUrl, {
              next: { revalidate: 1800 }, // Cache metadatos 30 minutos
              headers: {
                "Cache-Control":
                  "public, s-maxage=1800, stale-while-revalidate=3600",
              },
            });

            if (response.ok) {
              metadata = await response.json();
              console.log(`Token ${tokenId} metadata:`, metadata);

              // Filtrar solo NFTs de community "tuneport" también en fallback
              if (metadata.community !== "tuneport") {
                console.log(
                  `⚠️ Skipping token ${tokenId} - not tuneport community (fallback)`
                );
                return null;
              }
            } else {
              console.warn(
                `Failed to fetch metadata for token ${tokenId}, status:`,
                response.status
              );
            }
          } catch (metaError) {
            console.warn(
              `Error fetching metadata for token ${tokenId}:`,
              metaError
            );
          }
        }

        // 4. Construir NFT object con información completa
        const nft: UserNFT = {
          id: tokenId.toString(),
          name: metadata.name || `Token #${tokenId}`,
          artist:
            metadata?.collaborators?.[0]?.name ||
            metadata?.artist_name ||
            metadata?.artist ||
            "Artista Desconocido",
          image:
            metadata.image_cover || metadata.image
              ? (metadata.image_cover || metadata.image).startsWith("ipfs://")
                ? (metadata.image_cover || metadata.image).replace(
                    "ipfs://",
                    "https://ipfs.io/ipfs/"
                  )
                : metadata.image_cover || metadata.image
              : `https://via.placeholder.com/300x300?text=Token+${tokenId}`,
          contractAddress,
          balance: Number(balance),
          metadata,
          // Información adicional de tuneport
          description: metadata.description,
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

        return nft;
      } catch (error) {
        console.warn(`Error processing token ${tokenId}:`, error);
        return null;
      }
    });

    // Ejecutar todas las promesas en paralelo
    const results = await Promise.all(tokenPromises);

    // Filtrar resultados válidos
    results.forEach((nft) => {
      if (nft) nfts.push(nft);
    });

    // Guardar en cache también para el fallback
    userNFTsCache.set(cacheKey, {
      nfts,
      timestamp: Date.now(),
    });

    console.log(
      `✅ Contract fallback found ${nfts.length} tuneport NFTs for user ${userAddress} - cached for 10 minutes`
    );
    return { nfts };
  } catch (error) {
    console.error("Error in getUserNFTs server action:", error);
    return {
      nfts: [],
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Función para limpiar cache viejo (prevenir memory leaks)
function cleanOldCache() {
  const now = Date.now();
  for (const [key, value] of userNFTsCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      userNFTsCache.delete(key);
      console.log(`🧹 Cleaned old cache entry for: ${key}`);
    }
  }
}

// Limpiar cache cada 15 minutos
setInterval(cleanOldCache, 15 * 60 * 1000);
