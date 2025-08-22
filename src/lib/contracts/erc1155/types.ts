// ===============================
// TIPOS PARA NUEVAS FUNCIONES NFT v1.0.1
// ===============================

export interface TokenInfo {
  tokenId: bigint;
  totalSupply: bigint;
  maxSupply: bigint;
  tokenURI: string;
  exists: boolean;
}

export interface UserTokenBalance {
  tokenId: bigint;
  balance: bigint;
}

export interface UserNFTInfo {
  tokenId: bigint;
  balance: bigint;
  totalSupply: bigint;
  tokenURI: string;
}

export interface CollectionInfo {
  collectionName: string;
  collectionSymbol: string;
  metadata: string;
  artist: string;
  totalTokenTypes: bigint;
}

// ===============================
// INTERFACES PARA FRONTEND
// ===============================

export interface NFTMetadata {
  name?: string;
  artist?: string;
  artist_name?: string;
  image?: string;
  image_cover?: string;
  description?: string;
  external_url?: string;
  collection_type?: string;
  music_genre?: string;
  record_label?: string;
  mint_currency?: string;
  slug?: string;
  network?: string;
  symbol?: string;
  community?: string;
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

export interface EnhancedUserNFT {
  // Información básica del contrato
  tokenId: string;
  balance: number;
  totalSupply: number;
  contractAddress: string;

  // Metadatos parseados
  name: string;
  artist: string;
  image: string;
  description?: string;

  // Metadatos completos
  metadata?: NFTMetadata;

  // Información adicional de tuneport
  external_url?: string;
  collection_type?: string;
  music_genre?: string;
  record_label?: string;
  mint_currency?: string;
  slug?: string;
  network?: string;
  symbol?: string;
  collaborators?: NFTMetadata["collaborators"];
  attributes?: NFTMetadata["attributes"];
  start_mint_date?: string;
  release_date?: string;
  max_items?: number;
  address_creator_collection?: string;
}
