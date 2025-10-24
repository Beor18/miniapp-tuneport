// Tipos para el sistema de contenido bloqueado con x402
export interface X402ContentConfig {
  isLocked: boolean;
  price?: string; // e.g., "$0.01", "$1.00"
  network?: "base" | "base-sepolia";
  description?: string;
  currency?: "USDC";
  contentType?: "album" | "track" | "video" | "nft"; // Tipo de contenido
}

export interface X402Payment {
  transactionHash: string;
  amount: string;
  from: string;
  to: string;
  timestamp: number;
  contentId: string;
}

export interface X402UnlockStatus {
  isUnlocked: boolean;
  hasPaid: boolean;
  transactionHash?: string;
  expiresAt?: number;
}

export interface NFTWithX402Config {
  _id: string;
  name: string;
  description: string;
  // Campos existentes del NFT
  tokenId?: string;
  collectionId?: string;
  network?: string;

  // Configuración x402
  x402Config?: X402ContentConfig;
  isPremium?: boolean;
  premiumPrice?: string;
}

export interface AlbumWithX402Config {
  _id: string;
  name: string;
  slug: string;
  // Configuración x402 para el álbum completo
  x402Config?: X402ContentConfig;
  isPremiumAlbum?: boolean;

  // Los NFTs del álbum también pueden tener su propia config
  nfts: NFTWithX402Config[];
}
