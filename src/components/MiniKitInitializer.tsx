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

  // 🆕 MINIKIT: Inicializar CLIENT-SIDE según documentación oficial
  useEffect(() => {
    // ✅ Solo ejecutar en el cliente
    if (typeof window === "undefined") return;

    // Debug de los valores de MiniKit CLIENT-SIDE
    const isInIframe = window.parent !== window;

    console.log("🔍 MiniKit Debug en Layout (CLIENT-SIDE):", {
      isInMiniApp,
      isFrameReady,
      isInIframe,
      windowParent: window.parent,
      windowSelf: window,
      userAgent: navigator?.userAgent?.substring(0, 100),
    });

    if (isInMiniApp && !isFrameReady) {
      console.log(
        "🎯 Inicializando MiniKit en Layout (siguiendo flujo oficial)..."
      );
      setFrameReady();
    } else if (isInIframe && !isFrameReady) {
      // Fallback: si detectamos iframe pero MiniKit hook no funciona
      console.log("🔄 Fallback: Detectado iframe, forzando setFrameReady...");
      setFrameReady();
    }
  }, [isInMiniApp, isFrameReady, setFrameReady]);

  // Este componente no renderiza nada, solo inicializa MiniKit
  return null;
}
