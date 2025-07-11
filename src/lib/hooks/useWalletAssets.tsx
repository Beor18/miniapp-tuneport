import { useState, useEffect } from "react";
import { publicKey } from "@metaplex-foundation/umi";
import { fetchAssetsByOwner } from "@metaplex-foundation/mpl-core";
import { useAppKitAccount } from "@Src/lib/privy";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplCore } from "@metaplex-foundation/mpl-core";
import { base } from "viem/chains";

// Función auxiliar para crear una instancia de UMI
const createUmiInstance = () => {
  // Configurar UMI para la red que estás utilizando (mainnet-beta, devnet, etc.)
  // Aquí estamos usando devnet como ejemplo
  const umi = createUmi("https://api.devnet.solana.com").use(mplCore());

  return umi;
};

export interface AssetMetadata {
  name: string;
  description: string;
  image: string;
  animation_url?: string;
  external_url?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
  properties?: {
    files?: Array<{ uri: string; type: string }>;
  };
}

export interface Asset {
  id: string;
  name: string;
  symbol: string;
  uri: string;
  metadata?: AssetMetadata;
  network: "solana" | "evm"; // Añadido para identificar la red del asset
}

// Función auxiliar para determinar si un asset es de Tuneport
function isTuneportAsset(asset: Asset): boolean {
  if (!asset.metadata) return false;

  // Verificar el external_url (caso más común)
  if (asset.metadata.external_url) {
    const url = asset.metadata.external_url.toLowerCase();
    if (url.includes("tuneport")) return true;
  }

  // Verificar en attributes si existe alguna referencia a Tuneport
  if (asset.metadata.attributes && asset.metadata.attributes.length > 0) {
    const tuneportAttr = asset.metadata.attributes.some(
      (attr) =>
        attr.value &&
        typeof attr.value === "string" &&
        attr.value.toLowerCase().includes("tuneport")
    );
    if (tuneportAttr) return true;
  }

  // Verificar nombre para casos excepcionales
  if (
    asset.metadata.name &&
    asset.metadata.name.toLowerCase().includes("tuneport")
  ) {
    return true;
  }

  // Verificar descripción
  if (
    asset.metadata.description &&
    asset.metadata.description.toLowerCase().includes("tuneport")
  ) {
    return true;
  }

  return false;
}

// Función para obtener metadatos con manejo de CORS
async function fetchMetadata(uri: string, retryCount = 0): Promise<any | null> {
  if (!uri) return null;
  if (retryCount > 2) return null; // Máximo 3 intentos

  try {
    // Si la URI es de IPFS, intentamos diferentes gateways
    let fetchUri = uri;
    if (uri.includes("ipfs") && retryCount > 0) {
      // Intentar con diferentes gateways de IPFS en caso de error
      const ipfsGateways = [
        "https://ipfs.io/ipfs/",
        "https://cloudflare-ipfs.com/ipfs/",
        "https://gateway.pinata.cloud/ipfs/",
      ];

      // Extraer el CID (hash) de la IPFS URI
      let cid = uri.split("/ipfs/")[1];
      if (!cid && uri.startsWith("ipfs://")) {
        cid = uri.substring(7);
      }

      if (cid) {
        fetchUri = `${ipfsGateways[retryCount % ipfsGateways.length]}${cid}`;
      }
    }

    const response = await fetch(fetchUri);

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    // Intentar nuevamente con otro método
    if (retryCount < 2) {
      return fetchMetadata(uri, retryCount + 1);
    }

    return null;
  }
}

// Función para obtener NFTs de Solana
async function fetchSolanaAssets(address: string): Promise<Asset[]> {
  try {
    // Crear instancia de UMI
    const umi = createUmiInstance();

    // Obtener assets
    // @ts-ignore
    const owner = publicKey(address);
    // @ts-ignore
    const assetsByOwner = await fetchAssetsByOwner(umi, owner, {
      skipDerivePlugins: false,
    });

    // Extraer información básica de los assets
    const basicAssets: Asset[] = assetsByOwner.map((asset: any) => ({
      id: asset.id,
      name: asset.name || "Sin nombre",
      symbol: asset.content?.metadata?.symbol || "",
      uri: asset.uri || "",
      network: "solana",
    }));

    // Obtener metadatos completos para cada asset
    const assetsWithMetadata = await Promise.all(
      basicAssets.map(async (asset) => {
        try {
          const metadata = await fetchMetadata(asset.uri);
          if (metadata) {
            return { ...asset, metadata };
          } else {
            return asset;
          }
        } catch (error) {
          return asset;
        }
      })
    );

    // Filtrar assets que tienen metadatos
    return assetsWithMetadata.filter((asset) => !!asset.metadata);
  } catch (error) {
    console.error("Error fetching Solana assets:", error);
    return [];
  }
}

// Función para obtener NFTs de EVM (Base u otras cadenas soportadas)
async function fetchEvmAssets(address: string): Promise<Asset[]> {
  try {
    // API de OpenSea o Alchemy para obtener NFTs
    // Ejemplo con Alchemy: https://eth-mainnet.g.alchemy.com/nft/v2/YOUR_API_KEY/getNFTs?owner=WALLET_ADDRESS
    // API gratuita de Base EVM
    const response = await fetch(
      `https://api.basescan.org/api?module=account&action=tokennfttx&address=${address}&startblock=0&endblock=999999999&sort=asc`
    );

    if (!response.ok) {
      throw new Error("Error fetching EVM assets");
    }

    const data = await response.json();

    if (data.status !== "1" || !data.result) {
      return [];
    }

    // Procesamiento de los datos de la API
    const nftTxs = data.result;
    const uniqueTokens = new Map();

    // Agrupar por contratos únicos y último token ID
    nftTxs.forEach((tx: any) => {
      const key = `${tx.contractAddress}-${tx.tokenID}`;
      // Solo guardamos si esta wallet es el dueño actual (último en recibir)
      if (tx.to.toLowerCase() === address.toLowerCase()) {
        uniqueTokens.set(key, {
          id: tx.tokenID,
          name: tx.tokenName || "Unknown NFT",
          symbol: tx.tokenSymbol || "",
          uri: "", // Necesitaríamos obtener esto de una API adicional
          contractAddress: tx.contractAddress,
          network: "evm",
        });
      } else if (tx.from.toLowerCase() === address.toLowerCase()) {
        // Si fue enviado desde esta dirección, quitarlo de nuestros tokens
        uniqueTokens.delete(key);
      }
    });

    // Convertir el mapa a un array de assets
    const basicAssets: Asset[] = Array.from(uniqueTokens.values());

    // Necesitaríamos obtener metadata para cada NFT usando otra llamada API
    // Para simplificar, por ahora retornamos los datos básicos
    return basicAssets;
  } catch (error) {
    console.error("Error fetching EVM assets:", error);
    return [];
  }
}

export function useWalletAssets() {
  const { solanaWalletAddress, evmWalletAddress } = useAppKitAccount();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [activeNetwork, setActiveNetwork] = useState<"all" | "solana" | "evm">(
    "all"
  );

  useEffect(() => {
    async function fetchAssets() {
      // Si no hay dirección de wallet, no hacemos nada
      if (!solanaWalletAddress && !evmWalletAddress) {
        setAssets([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        let fetchedAssets: Asset[] = [];

        // Obtener assets de Solana si tenemos una dirección y si el filtro lo permite
        if (
          solanaWalletAddress &&
          (activeNetwork === "all" || activeNetwork === "solana")
        ) {
          const solanaAssets = await fetchSolanaAssets(solanaWalletAddress);
          fetchedAssets = [...fetchedAssets, ...solanaAssets];
        }

        // Obtener assets de EVM si tenemos una dirección y si el filtro lo permite
        if (
          evmWalletAddress &&
          (activeNetwork === "all" || activeNetwork === "evm")
        ) {
          const evmAssets = await fetchEvmAssets(evmWalletAddress);
          fetchedAssets = [...fetchedAssets, ...evmAssets];
        }

        // Filtrar para mostrar solo los NFTs de Tuneport
        const tuneportAssets = fetchedAssets.filter(isTuneportAsset);

        // Si no encontramos NFTs de Tuneport, usamos todos los NFTs como fallback
        if (tuneportAssets.length === 0) {
          setAssets(fetchedAssets);
        } else {
          setAssets(tuneportAssets);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error("Error desconocido al obtener assets")
        );
      } finally {
        setLoading(false);
      }
    }

    fetchAssets();
  }, [solanaWalletAddress, evmWalletAddress, activeNetwork]);

  return {
    assets,
    loading,
    error,
    activeNetwork,
    setActiveNetwork, // Exportamos esta función para poder cambiar entre redes
  };
}
