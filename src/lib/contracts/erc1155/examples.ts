// ===============================
// EJEMPLOS DE USO DE LAS NUEVAS FUNCIONES NFT v1.0.1
// ===============================

import { useNFTQueries } from "./useNFTQueries";

// ===============================
// EJEMPLO 1: Hook en un componente React
// ===============================

/*
import { useEffect, useState } from 'react';
import { useNFTQueries, EnhancedUserNFT } from '@/lib/contracts/erc1155';

export function UserNFTsComponent({ userAddress, contractAddress }: {
  userAddress: string;
  contractAddress: string;
}) {
  const { getEnhancedUserNFTs, isLoading } = useNFTQueries();
  const [userNFTs, setUserNFTs] = useState<EnhancedUserNFT[]>([]);

  useEffect(() => {
    const fetchUserNFTs = async () => {
      if (userAddress && contractAddress) {
        const nfts = await getEnhancedUserNFTs(contractAddress, userAddress);
        setUserNFTs(nfts);
      }
    };

    fetchUserNFTs();
  }, [userAddress, contractAddress, getEnhancedUserNFTs]);

  if (isLoading) return <div>Cargando NFTs...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {userNFTs.map((nft) => (
        <div key={nft.tokenId} className="border rounded-lg p-4">
          <img src={nft.image} alt={nft.name} className="w-full h-48 object-cover rounded" />
          <h3 className="font-bold mt-2">{nft.name}</h3>
          <p className="text-gray-600">{nft.artist}</p>
          <p className="text-sm">Balance: {nft.balance}</p>
          <p className="text-sm">Total Supply: {nft.totalSupply}</p>
        </div>
      ))}
    </div>
  );
}
*/

// ===============================
// EJEMPLO 2: Server Action
// ===============================

/*
"use server";

import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { MusicCollectionABI } from '@/lib/contracts/erc1155';

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http("https://api.developer.coinbase.com/rpc/v1/base-sepolia/YOUR_API_KEY"),
});

export async function getCollectionStats(contractAddress: string) {
  try {
    // Obtener información general de la colección
    const collectionInfo = await publicClient.readContract({
      address: contractAddress as `0x$-{string}`,
      abi: MusicCollectionABI,
      functionName: 'getCollectionInfo',
    });

    // Obtener todos los tokens existentes
    const tokenIds = await publicClient.readContract({
      address: contractAddress as `0x$-{string}`,
      abi: MusicCollectionABI,
      functionName: 'getExistingTokenIds',
    });

    // Obtener información detallada de cada token
    const tokensInfo = await publicClient.readContract({
      address: contractAddress as `0x$-{string}`,
      abi: MusicCollectionABI,
      functionName: 'getTokensInfo',
      args: [tokenIds],
    });

    return {
      collection: {
        name: collectionInfo[0],
        symbol: collectionInfo[1],
        artist: collectionInfo[3],
        totalTokenTypes: Number(collectionInfo[4]),
      },
      tokens: tokensInfo.map((token: any) => ({
        tokenId: Number(token.tokenId),
        totalSupply: Number(token.totalSupply),
        maxSupply: Number(token.maxSupply),
        exists: token.exists,
      })),
    };
  } catch (error) {
    console.error('Error getting collection stats:', error);
    return null;
  }
}
*/

// ===============================
// EJEMPLO 3: Migración desde método legacy
// ===============================

/*
// ANTES - Método legacy
export async function getUserNFTsLegacy(userAddress: string, contractAddress: string) {
  const knownTokenIds = [0, 1, 2, 3];
  const nfts = [];

  for (const tokenId of knownTokenIds) {
    const balance = await publicClient.readContract({
      address: contractAddress as `0x$-{string}`,
      abi: MusicCollectionABI,
      functionName: 'balanceOf',
      args: [userAddress, BigInt(tokenId)],
    });

    if (Number(balance) > 0) {
      const uri = await publicClient.readContract({
        address: contractAddress as `0x$-{string}`,
        abi: MusicCollectionABI,
        functionName: 'uri',
        args: [BigInt(tokenId)],
      });

      // Fetch metadata manualmente...
      nfts.push({ tokenId, balance, uri });
    }
  }

  return nfts;
}

// DESPUÉS - Método optimizado v1.0.1
export async function getUserNFTsOptimized(userAddress: string, contractAddress: string) {
  // Una sola llamada que devuelve toda la información necesaria
  const userNFTsInfo = await publicClient.readContract({
    address: contractAddress as `0x$-{string}`,
    abi: MusicCollectionABI,
    functionName: 'getUserNFTsInfo',
    args: [userAddress],
  });

  return userNFTsInfo.map((nft: any) => ({
    tokenId: Number(nft.tokenId),
    balance: Number(nft.balance),
    totalSupply: Number(nft.totalSupply),
    tokenURI: nft.tokenURI,
  }));
}
*/

// ===============================
// EJEMPLO 4: Componente de administración de colección
// ===============================

/*
import { useNFTQueries } from '@/lib/contracts/erc1155';

export function CollectionAdminComponent({ contractAddress }: { contractAddress: string }) {
  const { 
    getCollectionInfo, 
    getExistingTokenIds, 
    getContractVersion,
    isLoading 
  } = useNFTQueries();

  const [collectionData, setCollectionData] = useState(null);

  useEffect(() => {
    const fetchCollectionData = async () => {
      const [info, tokenIds, version] = await Promise.all([
        getCollectionInfo(contractAddress),
        getExistingTokenIds(contractAddress),
        getContractVersion(contractAddress),
      ]);

      setCollectionData({ info, tokenIds, version });
    };

    fetchCollectionData();
  }, [contractAddress]);

  if (isLoading) return <div>Cargando...</div>;

  return (
    <div className="space-y-4">
      <h2>Administración de Colección</h2>
      {collectionData && (
        <>
          <div>
            <p><strong>Nombre:</strong> {collectionData.info.collectionName}</p>
            <p><strong>Artista:</strong> {collectionData.info.artist}</p>
            <p><strong>Tokens:</strong> {collectionData.tokenIds.length}</p>
            <p><strong>Versión:</strong> {collectionData.version}</p>
          </div>
          
          {collectionData.version === '1.0.1' && (
            <div className="bg-green-100 p-4 rounded">
              ✅ Contrato actualizado - Nuevas funciones NFT disponibles
            </div>
          )}
        </>
      )}
    </div>
  );
}
*/

export default {};
