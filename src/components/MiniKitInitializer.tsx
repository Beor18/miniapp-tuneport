"use client";

import { useEffect } from "react";
import { useMiniKit, useIsInMiniApp } from "@coinbase/onchainkit/minikit";

/**
 * MiniKitInitializer: Componente que inicializa MiniKit según la documentación oficial de Base
 * Debe ser usado en layout.tsx para asegurar inicialización temprana
 */
export default function MiniKitInitializer() {
  const { setFrameReady, isFrameReady } = useMiniKit();
  const { isInMiniApp } = useIsInMiniApp();

  // 🆕 MINIKIT: Inicializar según documentación oficial de Base en layout
  useEffect(() => {
    if (isInMiniApp && !isFrameReady) {
      console.log(
        "🎯 Inicializando MiniKit en Layout (siguiendo flujo oficial)..."
      );
      setFrameReady();
    }
  }, [isInMiniApp, isFrameReady, setFrameReady]);

  // Este componente no renderiza nada, solo inicializa MiniKit
  return null;
}
