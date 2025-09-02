"use client";

import { useEffect } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

export function MiniKitInitializer() {
  const { setFrameReady, isFrameReady } = useMiniKit();

  useEffect(() => {
    if (!isFrameReady) {
      console.log("🎯 BASE OFFICIAL - Inicializando MiniKit con setFrameReady()");
      setFrameReady();
    }
  }, [isFrameReady, setFrameReady]);

  return null;
}
