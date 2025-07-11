"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Button } from "@Src/ui/components/ui/button";
import { Input } from "@Src/ui/components/ui/input";
import { Label } from "@Src/ui/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@Src/ui/components/ui/dialog";
import { GiftIcon, MinusIcon, PlusIcon } from "lucide-react";

interface NFTData {
  _id: string;
  name: string;
  image: string;
  price?: number;
  [key: string]: any;
}

interface AlbumData {
  name: string;
  artist_name: string;
  network?: string;
  [key: string]: any;
}

interface MintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  nftData: NFTData | null;
  albumData: AlbumData;
  isLoading?: boolean;
  currency?: string;
  maxAmount?: number;
  minAmount?: number;
}

export function MintModal({
  isOpen,
  onClose,
  onConfirm,
  nftData,
  albumData,
  isLoading = false,
  currency = "ETH",
  maxAmount = 100,
  minAmount = 1,
}: MintModalProps) {
  const [mintAmount, setMintAmount] = useState(minAmount);

  // Traducciones
  const t = useTranslations("mint");
  const tCommon = useTranslations("common");

  // Reset amount when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setMintAmount(minAmount);
    }
  }, [isOpen, minAmount]);

  // Calcular precio total para el modal
  const calculateTotalPrice = () => {
    if (!nftData?.price) return "0";
    const totalPrice = nftData.price * mintAmount;
    return totalPrice.toFixed(6);
  };

  // Manejar cambio de cantidad en el modal
  const handleAmountChange = (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= minAmount && numValue <= maxAmount) {
      setMintAmount(numValue);
    }
  };

  // Confirmar mint desde el modal
  const handleConfirmMint = () => {
    onConfirm(mintAmount);
  };

  const handleClose = () => {
    setMintAmount(minAmount);
    onClose();
  };

  if (!nftData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-gradient-to-br from-gray-900 via-black to-gray-800 border-neutral-700 shadow-2xl">
        <DialogHeader className="border-b border-neutral-700 pb-4">
          <DialogTitle className="flex items-center gap-3 text-white text-xl font-semibold">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center border border-purple-500/30">
              <GiftIcon className="h-4 w-4 text-purple-400" />
            </div>
            {t("claimNft")}
          </DialogTitle>
          <p className="text-neutral-400 text-sm mt-2">{t("selectQuantity")}</p>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* NFT Info */}
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-neutral-800/50 to-neutral-900/50 rounded-xl border border-neutral-700/50">
            <img
              src={nftData.image}
              alt={nftData.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="flex-1">
              <h3 className="text-white font-semibold text-lg">
                {nftData.name}
              </h3>
              <p className="text-neutral-400 text-sm">
                {albumData.artist_name}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                  {albumData.network?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="space-y-3">
            <Label htmlFor="mintAmount" className="text-white font-medium">
              {t("quantityToMint")}
            </Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAmountChange((mintAmount - 1).toString())}
                disabled={mintAmount <= minAmount}
                className="h-10 w-10 p-0 bg-neutral-800 border-neutral-600 hover:bg-neutral-700 text-white"
              >
                <MinusIcon className="h-4 w-4" />
              </Button>

              <Input
                id="mintAmount"
                type="number"
                min={minAmount}
                max={maxAmount}
                value={mintAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="flex-1 text-center bg-neutral-800 border-neutral-600 text-white text-lg font-semibold"
              />

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAmountChange((mintAmount + 1).toString())}
                disabled={mintAmount >= maxAmount}
                className="h-10 w-10 p-0 bg-neutral-800 border-neutral-600 hover:bg-neutral-700 text-white"
              >
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-neutral-500 text-xs">
              {t("maximum", { max: maxAmount })}
            </p>
          </div>

          {/* Price Summary */}
          <div className="space-y-3 p-4 bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-xl border border-purple-500/20">
            <div className="flex justify-between items-center">
              <span className="text-neutral-300">{t("pricePerNft")}</span>
              <span className="text-white font-semibold">
                {nftData.price?.toFixed(6) || "0"} {currency}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-300">{t("quantity")}</span>
              <span className="text-white font-semibold">{mintAmount}</span>
            </div>
            <div className="border-t border-neutral-600 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-white font-semibold text-lg">
                  {t("total")}
                </span>
                <span className="text-purple-400 font-bold text-xl">
                  {calculateTotalPrice()} {currency}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 bg-neutral-800 border-neutral-600 hover:bg-neutral-700 text-white"
              disabled={isLoading}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleConfirmMint}
              disabled={isLoading || mintAmount < minAmount}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <svg
                      className="h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </motion.div>
                  {t("processing")}
                </div>
              ) : (
                t("claimButton", {
                  amount: mintAmount,
                  plural: mintAmount > 1 ? "s" : "",
                })
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
