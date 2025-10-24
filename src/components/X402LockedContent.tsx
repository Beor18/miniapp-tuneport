"use client";

import React, { useState, useEffect } from "react";
import { Lock, Unlock, Loader2, Check } from "lucide-react";
import { Button } from "@/ui/components/ui/button";
import { Card } from "@/ui/components/ui/card";
import { useX402Payment } from "@Src/lib/hooks/base/useX402Payment";
import { useAppKitAccount } from "@/lib/privy";
import type { X402ContentConfig } from "@/types/x402";
import { motion, AnimatePresence } from "framer-motion";

interface X402LockedContentProps {
  contentId: string;
  config: X402ContentConfig;
  children: React.ReactNode;
  previewContent?: React.ReactNode;
  onUnlocked?: () => void;
}

export function X402LockedContent({
  contentId,
  config,
  children,
  previewContent,
  onUnlocked,
}: X402LockedContentProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  
  const { address, isConnected } = useAppKitAccount();
  const { unlockContent, checkUnlockStatus, isProcessing, hasWallet } =
    useX402Payment({
      onSuccess: () => {
        setIsUnlocked(true);
        onUnlocked?.();
      },
    });

  // Verificar si el contenido ya está desbloqueado al montar
  useEffect(() => {
    async function checkStatus() {
      if (!config.isLocked) {
        setIsUnlocked(true);
        setIsChecking(false);
        return;
      }

      if (isConnected && address) {
        const status = await checkUnlockStatus(contentId);
        setIsUnlocked(status.isUnlocked);
      }
      
      setIsChecking(false);
    }

    checkStatus();
  }, [contentId, config.isLocked, isConnected, address, checkUnlockStatus]);

  const handleUnlock = async () => {
    const result = await unlockContent(contentId, config);
    if (result.success) {
      setIsUnlocked(true);
    }
  };

  // Si no está bloqueado, mostrar contenido directamente
  if (!config.isLocked || isUnlocked) {
    return <>{children}</>;
  }

  // Mostrar loading mientras verifica
  if (isChecking) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Contenido bloqueado
  return (
    <div className="relative">
      {/* Preview opcional */}
      {previewContent && (
        <div className="opacity-50 pointer-events-none blur-sm">
          {previewContent}
        </div>
      )}

      {/* Overlay de bloqueo */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-md z-10"
        >
          <Card className="p-6 max-w-md w-full mx-4 shadow-xl border-2">
            <div className="text-center space-y-4">
              {/* Ícono */}
              <div className="flex justify-center">
                <div className="p-4 bg-primary/10 rounded-full">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
              </div>

              {/* Título */}
              <div>
                <h3 className="text-xl font-bold mb-2">
                  Contenido Premium
                </h3>
                <p className="text-sm text-muted-foreground">
                  {config.description || "Desbloquea este contenido exclusivo"}
                </p>
              </div>

              {/* Precio */}
              {config.price && (
                <div className="py-3 px-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-primary">
                    {config.price}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pago único en {config.currency || "USDC"}
                  </p>
                </div>
              )}

              {/* Botón de desbloqueo */}
              <div className="pt-2">
                {!isConnected || !hasWallet ? (
                  <p className="text-sm text-muted-foreground">
                    Conecta tu wallet para desbloquear
                  </p>
                ) : (
                  <Button
                    onClick={handleUnlock}
                    disabled={isProcessing}
                    className="w-full"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando pago...
                      </>
                    ) : (
                      <>
                        <Unlock className="mr-2 h-4 w-4" />
                        Desbloquear ahora
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Info adicional */}
              <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                <p>✓ Pago seguro con x402</p>
                <p>✓ Acceso inmediato</p>
                <p>✓ Sin suscripción requerida</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

