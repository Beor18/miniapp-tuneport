"use client";

import { useEffect } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

export function MiniKitInitializer() {
  const { setFrameReady, isFrameReady } = useMiniKit();

  // 🎯 MINIKIT: Inicializar según documentación oficial
  useEffect(() => {
    if (!isFrameReady) {
      console.log("🎯 MINIKIT - Inicializando con setFrameReady()");
      setFrameReady();
    }
  }, [isFrameReady, setFrameReady]);

  return null;
}
