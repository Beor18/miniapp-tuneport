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
  userAddress: string
): Promise<{ nfts: UserNFT[]; error?: string }> {
  try {
    if (!userAddress) {
      return { nfts: [] };
    }

    console.log(`🔍 Getting NFTs for user: ${userAddress}`);

    // Verificar cache primero - simplificado, solo por usuario
    const cacheKey = userAddress.toLowerCase();
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
    // ✅ HABILITADO PARA COLECCIONES LEGACY
    try {
      const alchemyApiKey = process.env.ALCHEMY_API_KEY;
      if (alchemyApiKey) {
        console.log(
          `🔍 Trying Alchemy API for wallet NFTs for user: ${userAddress}`
        );

        const alchemyUrl = `https://base-sepolia.g.alchemy.com/nft/v3/${alchemyApiKey}/getNFTsForOwner?owner=${userAddress}&withMetadata=true`;

        const alchemyResponse = await fetch(alchemyUrl, {
          next: { revalidate: 300 },
        });

        if (alchemyResponse.ok) {
          const data = await alchemyResponse.json();
          console.log(`✅ Alchemy API response for ${userAddress}:`, {
            totalNFTs: data.ownedNfts?.length || 0,
            firstFewNFTs: data.ownedNfts?.slice(0, 3)?.map((nft: any) => ({
              tokenId: nft.tokenId,
              contract: nft.contract?.address,
              name: nft.name || nft.metadata?.name,
            })),
          });

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
                      cache: "no-store", // 🚨 DESHABILITAR CACHE TEMPORALMENTE
                      headers: {
                        "Cache-Control": "no-cache",
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
                // if (!fullMetadata || fullMetadata.community !== "tuneport") {
                //   console.log(
                //     `⚠️ Skipping token ${nft.tokenId} - not tuneport community`
                //   );
                //   return null;
                // }

                // Construir el objeto NFT con los metadatos completos
                return {
                  id: nft.tokenId,
                  name:
                    fullMetadata?.name || nft.name || `Token #${nft.tokenId}`,
                  artist:
                    fullMetadata?.collaborators?.[0]?.name ||
                    fullMetadata?.artist_name ||
                    fullMetadata?.artist ||
                    "Artista Desconocido",
                  image:
                    fullMetadata?.image_cover ||
                    fullMetadata?.image ||
                    nft.image?.cachedUrl ||
                    nft.image?.originalUrl ||
                    `/logo-white.svg`,
                  contractAddress: nft.contract?.address || "unknown",
                  balance: parseInt(nft.balance || "1"),
                  metadata: fullMetadata,
                  // Información adicional de tuneport
                  description: fullMetadata?.description,
                  external_url: fullMetadata?.external_url,
                  collection_type: fullMetadata?.collection_type,
                  music_genre: fullMetadata?.music_genre,
                  record_label: fullMetadata?.record_label,
                  mint_currency: fullMetadata?.mint_currency,
                  slug: fullMetadata?.slug,
                  network: fullMetadata?.network,
                  symbol: fullMetadata?.symbol,
                  collaborators: fullMetadata?.collaborators,
                  attributes: fullMetadata?.attributes,
                  start_mint_date: fullMetadata?.start_mint_date,
                  release_date: fullMetadata?.release_date,
                  max_items: fullMetadata?.max_items,
                  address_creator_collection:
                    fullMetadata?.address_creator_collection,
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
            `✅ Alchemy found ${nfts.length} NFTs for user ${userAddress} - cached for 10 minutes`
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

    // 🔄 MÉTODO 2: Fallback - Si Alchemy falla, no hay NFTs
    console.log("📭 No NFTs found with Alchemy API");
    return { nfts: [] };
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
