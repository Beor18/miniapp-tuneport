// DEPRECATED - usar ERC1155 en su lugar
/** @deprecated Usa useERC1155Factory en su lugar */
export { useCreateBaseCollection } from "./useCreateBaseCollection";
/** @deprecated Usa useERC1155Mint en su lugar */
export { useBaseMint } from "./useBaseMint";

// Hooks ERC1155 (RECOMENDADOS)
export { useERC1155Factory } from "./useERC1155Factory";
export { useCreateERC1155Collection } from "./useCreateERC1155Collection";
export { useERC1155Mint } from "./useERC1155Mint";

// Utilidades
export { useBaseWallet } from "./useBaseWallet";

// Tipos
export type {
  Network,
  CreateCollectionParams,
  NFTMetadata,
  NFTItemParams,
} from "./types";
