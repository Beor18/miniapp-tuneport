import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

// Contrato de Neynar User Quality Scores en Base Mainnet
const QUALITY_CONTRACT_ADDRESS = "0xd3C43A38D1D3E47E9c420a733e439B03FAAdebA8";
const BASE_RPC_URL = "https://mainnet.base.org";

// Interface del contrato según documentación de Neynar
const QUALITY_CONTRACT_ABI = [
  "function getScore(address verifier) external view returns (uint24 score)",
  "function getScoreWithEvent(address verifier) external returns (uint24 score)",
  "function getScores(address[] calldata verifiers) external view returns (uint24[] memory scores)"
];

// Umbrales de calidad según documentación de Neynar
export const QUALITY_THRESHOLDS = {
  TOP_5_PERCENT: 950000,    // Top 5% - usuarios premium
  TOP_20_PERCENT: 800000,   // Top 20% - usuarios alta calidad  
  TOP_50_PERCENT: 500000,   // Top 50% - usuarios promedio
  MINIMUM: 100000           // Mínimo para filtrar bots
};

export interface UserQualityResult {
  score: number;
  tier: 'premium' | 'high' | 'medium' | 'low' | 'bot';
  isHighQuality: boolean;
  loading: boolean;
  error: string | null;
}

export function useUserQuality() {
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  // Inicializar provider y contrato
  useEffect(() => {
    try {
      const rpcProvider = new ethers.JsonRpcProvider(BASE_RPC_URL);
      const qualityContract = new ethers.Contract(
        QUALITY_CONTRACT_ADDRESS,
        QUALITY_CONTRACT_ABI,
        rpcProvider
      );
      
      setProvider(rpcProvider);
      setContract(qualityContract);
    } catch (error) {
      console.error('Error initializing quality contract:', error);
    }
  }, []);

  // Función para obtener score de un usuario
  const getUserQualityScore = useCallback(async (address: string): Promise<UserQualityResult> => {
    const defaultResult: UserQualityResult = {
      score: 0,
      tier: 'bot',
      isHighQuality: false,
      loading: false,
      error: null
    };

    if (!contract || !address) {
      return defaultResult;
    }

    try {
      defaultResult.loading = true;
      
      // Llamar al contrato para obtener el score
      const score = await contract.getScore(address);
      const numericScore = Number(score);

      // Determinar tier basado en el score
      let tier: UserQualityResult['tier'] = 'bot';
      if (numericScore >= QUALITY_THRESHOLDS.TOP_5_PERCENT) {
        tier = 'premium';
      } else if (numericScore >= QUALITY_THRESHOLDS.TOP_20_PERCENT) {
        tier = 'high';
      } else if (numericScore >= QUALITY_THRESHOLDS.TOP_50_PERCENT) {
        tier = 'medium';
      } else if (numericScore >= QUALITY_THRESHOLDS.MINIMUM) {
        tier = 'low';
      }

      return {
        score: numericScore,
        tier,
        isHighQuality: numericScore >= QUALITY_THRESHOLDS.TOP_20_PERCENT,
        loading: false,
        error: null
      };

    } catch (error) {
      console.error('Error fetching user quality score:', error);
      return {
        ...defaultResult,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, [contract]);

  // Función para obtener scores de múltiples usuarios (batch)
  const getBatchUserQualityScores = useCallback(async (
    addresses: string[]
  ): Promise<Map<string, UserQualityResult>> => {
    const results = new Map<string, UserQualityResult>();

    if (!contract || addresses.length === 0) {
      return results;
    }

    try {
      // Usar la función batch del contrato
      const scores = await contract.getScores(addresses);
      
      addresses.forEach((address, index) => {
        const numericScore = Number(scores[index]);
        
        let tier: UserQualityResult['tier'] = 'bot';
        if (numericScore >= QUALITY_THRESHOLDS.TOP_5_PERCENT) {
          tier = 'premium';
        } else if (numericScore >= QUALITY_THRESHOLDS.TOP_20_PERCENT) {
          tier = 'high';
        } else if (numericScore >= QUALITY_THRESHOLDS.TOP_50_PERCENT) {
          tier = 'medium';
        } else if (numericScore >= QUALITY_THRESHOLDS.MINIMUM) {
          tier = 'low';
        }

        results.set(address, {
          score: numericScore,
          tier,
          isHighQuality: numericScore >= QUALITY_THRESHOLDS.TOP_20_PERCENT,
          loading: false,
          error: null
        });
      });

    } catch (error) {
      console.error('Error fetching batch user quality scores:', error);
      // En caso de error, crear resultados por defecto
      addresses.forEach(address => {
        results.set(address, {
          score: 0,
          tier: 'bot',
          isHighQuality: false,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      });
    }

    return results;
  }, [contract]);

  // Función helper para filtrar usuarios por calidad
  const filterByQuality = useCallback((
    users: any[], 
    minThreshold: number = QUALITY_THRESHOLDS.TOP_50_PERCENT
  ) => {
    return users.filter(user => {
      if (!user.qualityScore) return false;
      return user.qualityScore >= minThreshold;
    });
  }, []);

  // Función para verificar si un usuario es de alta calidad
  const isHighQualityUser = useCallback((score: number): boolean => {
    return score >= QUALITY_THRESHOLDS.TOP_20_PERCENT;
  }, []);

  return {
    getUserQualityScore,
    getBatchUserQualityScores,
    filterByQuality,
    isHighQualityUser,
    QUALITY_THRESHOLDS,
    contractReady: !!contract
  };
}

// Hook específico para filtrar feeds con calidad
export function useQualityFilter() {
  const { getBatchUserQualityScores, isHighQualityUser } = useUserQuality();

  const filterFeedByQuality = useCallback(async (
    posts: any[],
    minQuality: number = QUALITY_THRESHOLDS.TOP_50_PERCENT
  ) => {
    // Extraer addresses únicos de los posts
    const addresses = [...new Set(
      posts
        .map(post => post.artist_wallet || post.creator_address || post.address || post.address_creator_collection)
        .filter(Boolean)
    )];

    if (addresses.length === 0) return posts;

    // Obtener scores en batch
    const qualityScores = await getBatchUserQualityScores(addresses);

    // Filtrar posts basado en calidad de usuarios
    return posts.filter(post => {
      const userAddress = post.artist_wallet || post.creator_address || post.address || post.address_creator_collection;
      if (!userAddress) return true; // Mantener posts sin address conocido
      
      const qualityResult = qualityScores.get(userAddress);
      return qualityResult ? qualityResult.score >= minQuality : true;
    });
  }, [getBatchUserQualityScores]);

  return {
    filterFeedByQuality,
    isHighQualityUser
  };
}