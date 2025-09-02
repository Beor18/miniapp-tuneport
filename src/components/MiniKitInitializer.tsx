"use client";

import { useEffect } from "react";
import { useMiniKit, useIsInMiniApp } from "@coinbase/onchainkit/minikit";

// 🆕 Declarar tipo global para TypeScript
declare global {
  interface Window {
    __MINIAPP_DETECTED__?: boolean;
  }
}

/**
 * MiniKitInitializer: Componente que inicializa MiniKit según la documentación oficial de Base
 * Debe ser usado en layout.tsx para asegurar inicialización temprana
 */
export default function MiniKitInitializer() {
  const { setFrameReady, isFrameReady } = useMiniKit();
  const { isInMiniApp } = useIsInMiniApp();

  // 🆕 DETECCIÓN Y INICIALIZACIÓN en layout (PASO 2 del flujo)
  useEffect(() => {
    // ✅ Solo ejecutar en el cliente
    if (typeof window === "undefined") return;

    // Detección simple y confiable
    const isInIframe = window.parent !== window;

    console.log("🔍 PASO 2 - Layout Detection:", {
      isInMiniApp,
      isFrameReady,
      isInIframe,
      userAgent: navigator?.userAgent?.substring(0, 100),
    });

    // Inicializar MiniKit si estamos en cualquier iframe
    if (isInIframe && !isFrameReady) {
      console.log("🎯 PASO 2 - Inicializando MiniKit en Layout...");
      setFrameReady();

      // Guardar detección en window para que otros componentes la usen
      window.__MINIAPP_DETECTED__ = true;
    }

    // También inicializar si MiniKit lo detecta oficialmente
    if (isInMiniApp && !isFrameReady) {
      console.log("🎯 PASO 2 - MiniKit oficial detectado, inicializando...");
      setFrameReady();
      window.__MINIAPP_DETECTED__ = true;
    }
  }, [isInMiniApp, isFrameReady, setFrameReady]);

  // Este componente no renderiza nada, solo inicializa MiniKit
  return null;
}
