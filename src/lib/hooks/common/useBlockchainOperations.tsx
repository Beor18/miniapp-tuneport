import { useMemo } from "react";
import { useCreateCandyMachine } from "../solana/useCreateCandyMachine";
import { useCandyMachineMint } from "../solana/useCandyMachineMint";
import { useCreateBaseCollection } from "../base/useCreateBaseCollection";
import { useBaseMint } from "../base/useBaseMint";
import { useERC1155Factory } from "../base/useERC1155Factory";
import { toast } from "sonner";
import { useAddItemsToCandyMachine } from "../solana/useAddItemsToCandyMachine";

export type BlockchainType = "solana" | "base" | "ethereum";

export interface BlockchainOperationsOptions {
  blockchain: BlockchainType;
  useERC1155?: boolean; // Por defecto true para Base. false usa el patrón legacy deprecado
}

export const useBlockchainOperations = ({
  blockchain,
  useERC1155 = true, // Por defecto usar ERC1155 para Base
}: BlockchainOperationsOptions) => {
  // Obtenemos hooks específicos de cada blockchain
  const solanaCandyMachine = useCreateCandyMachine();
  const solanaMint = useCandyMachineMint();
  const baseCollection = useCreateBaseCollection();
  const baseMint = useBaseMint();
  const erc1155Factory = useERC1155Factory();
  const solanaAddItems = useAddItemsToCandyMachine();

  // Hook memorizado que devuelve las operaciones correctas según la blockchain seleccionada
  const operations = useMemo(() => {
    // Operaciones para crear colecciones
    const createCollection = async (params: any) => {
      try {
        switch (blockchain) {
          case "solana":
            return await solanaCandyMachine.createCandyMachineAndCollection(
              params
            );
          case "base":
            if (useERC1155) {
              return await erc1155Factory.createCollection(params);
            }
            // DEPRECATED: useCreateBaseCollection - usar useERC1155: true en su lugar
            console.warn(
              "⚠️  useCreateBaseCollection está deprecado. Cambia a useERC1155: true para usar factory contracts"
            );
            return await baseCollection.createBaseCollection(params);
          default:
            toast.error("Blockchain no soportada", {
              description: `La blockchain ${blockchain} no está implementada aún`,
            });
            throw new Error(
              `Blockchain ${blockchain} no soportada para creación de colecciones`
            );
        }
      } catch (error) {
        console.error(`Error en createCollection para ${blockchain}:`, error);
        throw error;
      }
    };

    // Operaciones para mint de NFTs
    const mintNFT = async (params: any) => {
      console.log("PARAMS MINT: ", params);
      try {
        switch (blockchain) {
          case "solana":
            return await solanaMint.mint(params);
          case "base":
            if (useERC1155) {
              return await erc1155Factory.mintTokenDeveloperPaysGas(
                params.collectionAddress,
                params.to,
                params.tokenId,
                params.amount,
                params.tokenMetadata,
                params.pricePerToken
              );
            }
            // DEPRECATED: useBaseMint - usar useERC1155: true en su lugar
            console.warn(
              "⚠️  useBaseMint está deprecado. Cambia a useERC1155: true para usar factory contracts dinámicos"
            );
            return await baseMint.mint(params);
          default:
            toast.error("Blockchain no soportada", {
              description: `La blockchain ${blockchain} no está implementada aún`,
            });
            throw new Error(
              `Blockchain ${blockchain} no soportada para mint de NFTs`
            );
        }
      } catch (error) {
        console.error(`Error en mintNFT para ${blockchain}:`, error);
        throw error;
      }
    };

    // Operaciones para crear NFTs individuales (tracks)
    const createNFTItem = async (params: any) => {
      try {
        switch (blockchain) {
          case "solana":
            return await solanaAddItems.addItemsToCandyMachine(params);
          case "base":
            if (useERC1155) {
              return await erc1155Factory.createNFTItem(params);
            }
            toast.error("Legacy base no soporta createNFTItem", {
              description: "Usa useERC1155: true para crear NFTs individuales",
            });
            throw new Error(
              "Legacy base no soporta createNFTItem, usar useERC1155: true"
            );
          default:
            toast.error("Blockchain no soportada", {
              description: `La blockchain ${blockchain} no está implementada aún`,
            });
            throw new Error(
              `Blockchain ${blockchain} no soportada para crear NFT items`
            );
        }
      } catch (error) {
        console.error(`Error en createNFTItem para ${blockchain}:`, error);
        throw error;
      }
    };

    // Devolvemos un objeto con todas las operaciones disponibles
    return {
      createCollection,
      mintNFT,
      createNFTItem,
      // Estado de carga para las diferentes operaciones
      isCreatingCollection:
        blockchain === "solana"
          ? solanaCandyMachine.loading
          : blockchain === "base"
          ? useERC1155
            ? erc1155Factory.isLoading
            : baseCollection.loading
          : false,
      isMinting:
        blockchain === "solana"
          ? solanaMint.isMinting
          : blockchain === "base"
          ? useERC1155
            ? erc1155Factory.isLoading
            : baseMint.isMinting
          : false,
      isCreatingNFTItem:
        blockchain === "solana"
          ? solanaAddItems.loading
          : blockchain === "base"
          ? useERC1155
            ? erc1155Factory.isLoading
            : false
          : false,
      // Datos específicos de cada blockchain
      blockchainData: {
        solana: {
          candyMachine: solanaCandyMachine,
          mint: solanaMint,
        },
        base: {
          collection: baseCollection,
          mint: baseMint,
        },
        erc1155: {
          factory: erc1155Factory,
        },
      },
    };
  }, [
    blockchain,
    useERC1155,
    solanaCandyMachine,
    solanaMint,
    baseCollection,
    baseMint,
    erc1155Factory,
    solanaAddItems,
  ]);

  return operations;
};
