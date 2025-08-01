import React, { useState } from "react";
import { Button } from "@/ui/components/ui/button";
import { motion } from "framer-motion";
import { DollarSign, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface TipButtonProps {
  artistFid?: number;
  artistUsername?: string;
  artistAddress?: string;
  songName?: string;
  disabled?: boolean;
  className?: string;
}

// Cantidades predefinidas de tips en USDC
const TIP_AMOUNTS = [1, 5, 10, 25];

export function TipButton({
  artistFid,
  artistUsername,
  artistAddress,
  songName,
  disabled = false,
  className = "",
}: TipButtonProps) {
  const [isSending, setIsSending] = useState(false);
  const [showAmounts, setShowAmounts] = useState(false);

  // Función para enviar tip usando API de Neynar
  const sendTip = async (amount: number) => {
    if (!artistFid) {
      toast.error("Artist information not available");
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch("/api/neynar/tips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipients: [
            {
              fid: artistFid,
              amount: amount,
              token: "USDC",
            },
          ],
          message: `🎵 Thanks for the amazing music${
            songName ? ` "${songName}"` : ""
          }! @${artistUsername || "artist"}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send tip");
      }

      const result = await response.json();

      toast.success(`💰 Tip sent!`, {
        description: `Successfully sent ${amount} USDC to @${
          artistUsername || "artist"
        }`,
        duration: 4000,
      });

      // Cerrar el menú de cantidades
      setShowAmounts(false);
    } catch (error) {
      console.error("Error sending tip:", error);
      toast.error("Failed to send tip", {
        description:
          error instanceof Error ? error.message : "Please try again later",
        duration: 4000,
      });
    } finally {
      setIsSending(false);
    }
  };

  // Función para manejar click del botón principal
  const handleTipClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) {
      toast.error("Connect wallet to send tips");
      return;
    }

    if (!artistFid) {
      toast.error("Artist not found on Farcaster");
      return;
    }

    // Toggle del menú de cantidades
    setShowAmounts(!showAmounts);
  };

  return (
    <div className="relative">
      {/* Botón principal */}
      <motion.div
        whileHover={{ scale: disabled ? 1 : 1.1 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={handleTipClick}
          disabled={disabled || isSending}
          title={
            disabled
              ? "Connect wallet to send tips"
              : `Send tip to @${artistUsername || "artist"}`
          }
          className={`bg-black/40 backdrop-blur-sm hover:bg-white/20 text-white rounded-full border border-white/20 h-12 w-12 ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          } ${className}`}
        >
          {isSending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <DollarSign className="h-5 w-5" />
          )}
        </Button>
      </motion.div>

      {/* Menú de cantidades */}
      {showAmounts && !disabled && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          className="absolute right-0 bottom-full mb-2 bg-black/90 backdrop-blur-sm rounded-lg border border-white/20 p-2 min-w-[120px] z-50"
        >
          <div className="text-xs text-white/70 mb-2 px-2">
            Tip @{artistUsername || "artist"}
          </div>

          <div className="grid grid-cols-2 gap-1">
            {TIP_AMOUNTS.map((amount) => (
              <motion.button
                key={amount}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  sendTip(amount);
                }}
                disabled={isSending}
                className="bg-white/10 hover:bg-white/20 text-white text-xs rounded px-2 py-1 border border-white/20 transition-colors disabled:opacity-50"
              >
                ${amount}
              </motion.button>
            ))}
          </div>

          <div className="text-xs text-white/50 mt-2 px-2 text-center">
            USDC on Base
          </div>
        </motion.div>
      )}

      {/* Overlay para cerrar el menú */}
      {showAmounts && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowAmounts(false)}
        />
      )}
    </div>
  );
}

export default TipButton;
