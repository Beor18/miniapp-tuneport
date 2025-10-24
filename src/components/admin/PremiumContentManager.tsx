"use client";

import { useState } from "react";
import { Card } from "@/ui/components/ui/card";
import { Button } from "@/ui/components/ui/button";
import { Input } from "@/ui/components/ui/input";
import { Label } from "@/ui/components/ui/label";
import { Switch } from "@/ui/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/ui/select";
import { toast } from "sonner";
import { Lock, DollarSign, Network } from "lucide-react";

interface PremiumContentManagerProps {
  contentId: string;
  contentType: "nft" | "album";
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
  onSave?: () => void;
}

export function PremiumContentManager({
  contentId,
  contentType,
  currentConfig,
  onSave,
}: PremiumContentManagerProps) {
  const [isPremium, setIsPremium] = useState(currentConfig?.isPremium || false);
  const [price, setPrice] = useState(
    currentConfig?.x402Config?.price || "$0.01"
  );
  const [network, setNetwork] = useState<"base" | "base-sepolia">(
    currentConfig?.x402Config?.network || "base-sepolia"
  );
  const [description, setDescription] = useState(
    currentConfig?.x402Config?.description || "Contenido premium exclusivo"
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const API_ELEI =
        process.env.NEXT_PUBLIC_API_ELEI || "http://localhost:3001";

      const endpoint =
        contentType === "nft"
          ? `/api/nft/${contentId}`
          : `/api/collections/${contentId}`;

      const response = await fetch(`${API_ELEI}${endpoint}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isPremium: isPremium,
          ...(contentType === "album" ? { isPremiumAlbum: isPremium } : {}),
          premiumPrice: isPremium ? price : undefined,
          x402Config: isPremium
            ? {
                isLocked: true,
                price,
                network,
                description,
                currency: "USDC",
              }
            : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar configuración");
      }

      toast.success("Configuración de contenido premium guardada");
      onSave?.();
    } catch (error) {
      console.error("Error saving premium config:", error);
      toast.error("Error al guardar configuración");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Configuración de Contenido Premium
        </h3>
        <p className="text-sm text-muted-foreground">
          Marca este {contentType === "nft" ? "track" : "álbum"} como premium y
          configura el precio en USDC
        </p>
      </div>

      {/* Toggle Premium */}
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="space-y-0.5">
          <Label htmlFor="premium-toggle" className="text-base font-medium">
            Contenido Premium
          </Label>
          <p className="text-sm text-muted-foreground">
            Requiere pago para desbloquear
          </p>
        </div>
        <Switch
          id="premium-toggle"
          checked={isPremium}
          onCheckedChange={setIsPremium}
        />
      </div>

      {/* Configuración (solo visible si isPremium) */}
      {isPremium && (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
          {/* Precio */}
          <div className="space-y-2">
            <Label htmlFor="price" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Precio en USDC
            </Label>
            <div className="flex gap-2">
              <span className="flex items-center px-3 bg-muted rounded-l-md border">
                $
              </span>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0.01"
                value={price.replace("$", "")}
                onChange={(e) => setPrice(`$${e.target.value}`)}
                placeholder="0.01"
                className="flex-1 rounded-l-none"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Precio sugerido: $0.01 - $1.00 para música
            </p>
          </div>

          {/* Red */}
          <div className="space-y-2">
            <Label htmlFor="network" className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              Red de Blockchain
            </Label>
            <Select value={network} onValueChange={(v: any) => setNetwork(v)}>
              <SelectTrigger id="network">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="base-sepolia">
                  Base Sepolia (Testnet)
                </SelectItem>
                <SelectItem value="base">Base (Mainnet)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Usa Sepolia para testing, Base para producción
            </p>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Contenido exclusivo para fans"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              Se muestra al usuario antes de pagar
            </p>
          </div>

          {/* Preview del precio */}
          <div className="p-3 bg-background border rounded-md">
            <p className="text-sm font-medium">Vista previa:</p>
            <div className="mt-2 p-3 bg-primary/10 rounded-md">
              <p className="text-2xl font-bold text-primary">{price}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Pago único en USDC
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Botón Guardar */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="min-w-[120px]"
        >
          {isSaving ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>

      {/* Información adicional */}
      {isPremium && (
        <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/20 rounded-md">
          <p>ℹ️ Los usuarios pagarán con USDC en Base</p>
          <p>ℹ️ El pago se procesa automáticamente con x402</p>
          <p>ℹ️ Una vez pagado, el acceso es permanente</p>
        </div>
      )}
    </Card>
  );
}
