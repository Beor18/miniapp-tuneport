"use client";

import { useEffect } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

export function MiniKitInitializer() {
  const { setFrameReady, isFrameReady } = useMiniKit();

  useEffect(() => {
    // 🎯 INICIALIZACIÓN OFICIAL según documentación de Base
    if (!isFrameReady) {
      console.log(
        "🎯 BASE OFFICIAL - Inicializando MiniKit con setFrameReady()"
      );
      setFrameReady();
    }
  }, [isFrameReady, setFrameReady]);

  // Este componente no renderiza nada visible
  return null;
}
