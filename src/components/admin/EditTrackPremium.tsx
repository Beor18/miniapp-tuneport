"use client";

import { useState } from "react";
import { Button } from "@/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/components/ui/dialog";
import { Lock, Settings } from "lucide-react";
import { PremiumContentManager } from "./PremiumContentManager";

interface EditTrackPremiumProps {
  trackId: string;
  trackName: string;
  currentConfig?: {
    isPremium?: boolean;
    premiumPrice?: string;
    x402Config?: {
      isLocked: boolean;
      price?: string;
      network?: "base" | "base-sepolia";
      description?: string;
    };
  };
}

export function EditTrackPremium({
  trackId,
  trackName,
  currentConfig,
}: EditTrackPremiumProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Lock className="mr-2 h-4 w-4" />
          Configurar Premium
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configuración Premium: {trackName}</DialogTitle>
        </DialogHeader>

        <PremiumContentManager
          contentId={trackId}
          contentType="nft"
          currentConfig={currentConfig}
          onSave={() => {
            setIsOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
