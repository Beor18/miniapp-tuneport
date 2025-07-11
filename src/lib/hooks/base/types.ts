export type Network = "sepolia" | "mainnet";

export interface CreateCollectionParams {
  name: string;
  symbol: string;
  baseURI: string;
  mintStartDate: number;
  mintEndDate: number;
  price: number;
  paymentToken: "ETH" | "DAI" | "ALBUM_COIN" | string;
  royaltyReceiver: string;
  royaltyFee: number;
  coverImage?: File;
  description?: string;
  artistName?: string;
  musicGenre?: string;
  recordLabel?: string;
  releaseDate?: string;
  collaborators?: Array<{
    address: string;
    mintPercentage: number;
    royaltyPercentage: number;
    name: string;
  }>;
  collectionType?: string;
  maxItems?: number;
  revenueShareName?: string;
  revenueShareDescription?: string;
  createRevenueShare?: boolean;
  existingRevenueShareAddress?: string;
  currency?: string;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  collection_type?: string;
  address_creator_collection?: string;
  max_items?: number;
  mint_price?: number;
  mint_currency?: string;
  community?: string;
  collaborators?: any[];
  music_genre?: string;
  artist_name?: string;
  record_label?: string;
  start_mint_date?: string;
  release_date?: string;
  slug?: string;
  network?: string;
  symbol?: string;
  image_cover?: string;
}

export interface NFTItemParams {
  collectionId: string;
  name: string;
  description: string;
  image?: File;
  music?: File;
  copies?: number;
  price?: number;
  currency?: string;
  tokenId?: number;
  metadata_uri?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}
