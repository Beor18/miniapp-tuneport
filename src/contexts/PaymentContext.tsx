"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface Range {
  start: number;
  end: number;
}

interface Track {
  id?: string;
  name?: string;
  artist?: string;
  imageUrl?: string;
  price?: number;
  candyMachine?: string;
  addressCollection?: string;
  startDate?: string;
  artist_address_mint?: string;
  [key: string]: any; // Para permitir propiedades adicionales
}

interface PaymentContextType {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  isCompleted: boolean;
  setIsCompleted: (completed: boolean) => void;
  isError: boolean;
  setIsError: (error: boolean) => void;
  errorMessage: string;
  setErrorMessage: (message: string) => void;
  selectedTrack: Track | null;
  setSelectedTrack: (track: Track | null) => void;
  range: Range;
  setRange: (range: Range) => void;
  transactionHash: string | null;
  setTransactionHash: (hash: string | null) => void;
  resetPaymentState: () => void;
}

const defaultContext: PaymentContextType = {
  isModalOpen: false,
  setIsModalOpen: () => {},
  isProcessing: false,
  setIsProcessing: () => {},
  isCompleted: false,
  setIsCompleted: () => {},
  isError: false,
  setIsError: () => {},
  errorMessage: "",
  setErrorMessage: () => {},
  selectedTrack: null,
  setSelectedTrack: () => {},
  range: { start: 0, end: 100 },
  setRange: () => {},
  transactionHash: null,
  setTransactionHash: () => {},
  resetPaymentState: () => {},
};

const PaymentContext = createContext<PaymentContextType>(defaultContext);

export const usePayment = () => useContext(PaymentContext);

export const PaymentProvider = ({ children }: { children: ReactNode }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [range, setRange] = useState<Range>({ start: 0, end: 100 });
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  const resetPaymentState = () => {
    setIsProcessing(false);
    setIsCompleted(false);
    setIsError(false);
    setErrorMessage("");
    setTransactionHash(null);
  };

  // Resetear estados cuando se cierra el modal
  const handleSetIsModalOpen = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      resetPaymentState();
    }
  };

  const value = {
    isModalOpen,
    setIsModalOpen: handleSetIsModalOpen,
    isProcessing,
    setIsProcessing,
    isCompleted,
    setIsCompleted,
    isError,
    setIsError,
    errorMessage,
    setErrorMessage,
    selectedTrack,
    setSelectedTrack,
    range,
    setRange,
    transactionHash,
    setTransactionHash,
    resetPaymentState,
  };

  return (
    <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>
  );
};
