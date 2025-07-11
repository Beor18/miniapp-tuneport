import { useCreateERC1155Collection } from "./useCreateERC1155Collection";
import { useERC1155Mint } from "./useERC1155Mint";
import { useIPFSUpload } from "../common/useIPFSUpload";
import { useBaseWallet } from "./useBaseWallet";
import { Network } from "./types";
import { DEFAULT_NETWORK } from "@Src/lib/contracts/erc1155/config";

export const useERC1155Factory = (
  network: Network = DEFAULT_NETWORK as Network
) => {
  // Hooks para operaciones específicas
  const collectionOps = useCreateERC1155Collection(network);
  const mintOps = useERC1155Mint();
  const ipfsOps = useIPFSUpload();
  const walletOps = useBaseWallet();

  return {
    // Operaciones de colección
    createCollection: collectionOps.createCollection,
    collectionAddress: collectionOps.collectionAddress,

    // Operaciones de minting
    createNFTItem: mintOps.createNFTItem,
    mintTokenDeveloperPaysGas: mintOps.mintTokenDeveloperPaysGas,
    nftTokenId: mintOps.nftTokenId,

    // Operaciones IPFS
    uploadCoverImage: ipfsOps.uploadImageToPinata,
    uploadMetadata: ipfsOps.uploadMetadataToPinata,

    // Operaciones de wallet
    getEvmWalletAddress: walletOps.getEvmWalletAddress,

    // Estados de carga
    isLoading:
      collectionOps.isLoading || mintOps.isLoading || ipfsOps.isUploading,
  };
};
