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
  // x402 Premium Album Configuration
  isPremiumAlbum?: boolean;
  x402Config?: {
    isLocked: boolean;
    price?: string;
    network?: "base" | "base-sepolia";
    description?: string;
    currency?: "USDC";
  };
}

export interface NFTMetadata {
  // ✅ CAMPOS BÁSICOS REQUERIDOS
  name: string;
  description: string;
  image: string;

  // ✅ CAMPOS MULTIMEDIA
  animation_url?: string;
  youtube_url?: string;
  music?: string;
  audio?: string;

  // ✅ CAMPOS DE ENLACE EXTERNOS
  external_url?: string;
  home_url?: string;
  website?: string;

  // ✅ ATRIBUTOS ESTÁNDAR
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;

  // ✅ CAMPOS DE TIPO Y CATEGORIZACIÓN
  collection_type?: string;
  content_type?: string;
  category?: string;
  media_type?: string;

  // ✅ INFORMACIÓN DEL CREADOR
  address_creator_collection?: string;
  artist?: string;
  creator?: string;
  artist_name?: string;
  record_label?: string;

  // ✅ CONFIGURACIÓN DE MINT Y ECONÓMICA
  max_items?: number;
  mint_price?: number;
  mint_currency?: string;
  mint_start_timestamp?: number;
  mint_end_timestamp?: number;
  price?: number;
  currency?: string;

  // ✅ INFORMACIÓN DE LA COMUNIDAD Y PLATAFORMA
  community?: string;
  platform?: string;
  blockchain?: string;

  // ✅ COLABORADORES
  collaborators?: any[];

  // ✅ METADATOS DE MÚSICA
  music_genre?: string;
  genre?: string;

  // ✅ FECHAS IMPORTANTES
  start_mint_date?: string;
  release_date?: string;
  created_at?: string;

  // ✅ IDENTIFICADORES Y NAVEGACIÓN
  slug?: string;
  collection_slug?: string;
  network?: string;
  symbol?: string;

  // ✅ IMÁGENES Y MEDIOS
  image_cover?: string;
  cover_image?: string;
  banner_image?: string;

  // ✅ METADATOS TÉCNICOS
  version?: string;
  schema_version?: string;
  contract_type?: string;
  decimals?: number;

  // ✅ CAMPOS PARA INDEXACIÓN
  tags?: string[];
  keywords?: string[];

  // ✅ PROPIEDADES ADICIONALES
  properties?: {
    [key: string]: any;
  };

  // ✅ CAMPOS PARA MARKETPLACES
  seller_fee_basis_points?: number;
  fee_recipient?: string;
  background_color?: string;

  // ✅ CAMPOS DE LICENCIA Y DERECHOS
  license?: string;
  rights?: string;

  // ✅ CAMPOS PARA BASE BLOCKCHAIN EXPLORER
  base_uri?: string;
  contract_uri?: string;
  metadata_uri?: string;
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
  // x402 Premium Content Configuration
  isPremium?: boolean;
  premiumPrice?: string;
  x402Config?: {
    isLocked: boolean;
    price?: string;
    network?: "base" | "base-sepolia";
    description?: string;
    currency?: "USDC";
  };
}
