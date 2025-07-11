"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { toast } from "sonner";
import {
  useBlockchainOperations,
  BlockchainType,
} from "@Src/lib/hooks/common/useBlockchainOperations";

// Tipos para las opciones de mint específicas a cada blockchain
export interface SolanaMintOptions {
  candyMachineId: string;
  collectionId: string;
  price: number;
  startDate: Date;
  artist_address_mint: string;
  currency?: string;
}

export interface BaseMintOptions {
  recipient: string;
  tokenURI: string;
}

// Tipos para las opciones de creación de colecciones
export interface SolanaCreateCollectionOptions {
  collectionName: string;
  collectionType: string;
  coverImage: File;
  description: string;
  itemsAvailable: number;
  price: number;
  royaltiesValue: number;
  startDate: Date;
  symbol: string;
  blockchain: "solana";
  startLoading: () => void;
  currency?: string;
  // ... otras opciones específicas de Solana
}

export interface BaseCreateCollectionOptions {
  collectionName: string;
  collectionType: string;
  coverImage: File;
  description: string;
  itemsAvailable: number;
  price: number;
  royaltiesValue: number;
  startDate: Date;
  symbol: string;
  blockchain: "base";
  // ... otras opciones específicas de Base
}

// Tipo para las opciones de mint generales (union type)
export type MintOptions = SolanaMintOptions | BaseMintOptions;

// Tipo para las opciones de creación generales (union type)
export type CreateCollectionOptions =
  | SolanaCreateCollectionOptions
  | BaseCreateCollectionOptions;

// Interface para nuestro contexto
interface BlockchainContextType {
  mintNFT: (options: MintOptions) => Promise<string | null>;
  createCollection: (options: CreateCollectionOptions) => Promise<any>;
  isMinting: boolean;
  isCreatingCollection: boolean;
  setSelectedBlockchain: (blockchain: BlockchainType) => void;
  selectedBlockchain: BlockchainType;
}

// Crear el contexto
const BlockchainContext = createContext<BlockchainContextType | undefined>(
  undefined
);

// Provider component
export const BlockchainProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [selectedBlockchain, setSelectedBlockchain] =
    useState<BlockchainType>("solana");

  // Usar el hook común para todas las operaciones blockchain
  const operations = useBlockchainOperations({
    blockchain: selectedBlockchain,
  });

  // Función unificada para mintear NFTs
  const mintNFT = async (options: MintOptions): Promise<string | null> => {
    try {
      // Validar si las opciones corresponden al blockchain seleccionado
      if (
        (selectedBlockchain === "solana" && !("candyMachineId" in options)) ||
        (selectedBlockchain === "base" && !("recipient" in options))
      ) {
        throw new Error(
          `Opciones proporcionadas no corresponden a blockchain ${selectedBlockchain}`
        );
      }

      return await operations.mintNFT(options);
    } catch (error: any) {
      console.error("Error mintNFT:", error);
      toast.error(`Error al mintear NFT: ${error.message}`);
      return null;
    }
  };

  // Función unificada para crear colecciones
  const createCollection = async (options: CreateCollectionOptions) => {
    try {
      // Validar si las opciones corresponden al blockchain seleccionado
      if (options.blockchain !== selectedBlockchain) {
        throw new Error(
          `Blockchain en opciones (${options.blockchain}) no coincide con blockchain seleccionado (${selectedBlockchain})`
        );
      }

      return await operations.createCollection(options);
    } catch (error: any) {
      console.error("Error createCollection:", error);
      toast.error(`Error al crear colección: ${error.message}`);
      throw error;
    }
  };

  return (
    <BlockchainContext.Provider
      value={{
        mintNFT,
        createCollection,
        isMinting: operations.isMinting,
        isCreatingCollection: operations.isCreatingCollection,
        setSelectedBlockchain,
        selectedBlockchain,
      }}
    >
      {children}
    </BlockchainContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useBlockchain = (): BlockchainContextType => {
  const context = useContext(BlockchainContext);
  if (context === undefined) {
    throw new Error(
      "useBlockchain debe ser usado dentro de un BlockchainProvider"
    );
  }
  return context;
};
