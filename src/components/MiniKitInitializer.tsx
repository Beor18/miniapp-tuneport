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

  // 🎯 PASO 2: DETECCIÓN Y INICIALIZACIÓN definitiva en layout
  useEffect(() => {
    if (typeof window === "undefined") return;

    const isInIframe = window.parent !== window;

    console.log("🔍 PASO 2 - Layout Detection (siguiendo flujo):", {
      isInMiniApp,
      isFrameReady,
      isInIframe,
      userAgent: navigator?.userAgent?.substring(0, 50),
    });

    // 🎯 DETECCIÓN PRINCIPAL: iframe = Mini App
    if (isInIframe) {
      console.log("✅ PASO 2 - Mini App detectada en Layout! Guardando...");
      window.__MINIAPP_DETECTED__ = true;

      // Inicializar MiniKit para Base App
      if (!isFrameReady) {
        console.log("🎯 PASO 2 - Inicializando MiniKit...");
        setFrameReady();
      }
    } else {
      console.log("❌ PASO 2 - No es Mini App");
      window.__MINIAPP_DETECTED__ = false;
    }

    // Backup: MiniKit oficial también detecta
    if (isInMiniApp && !window.__MINIAPP_DETECTED__) {
      console.log("🔄 PASO 2 - MiniKit oficial detectó, backup activation...");
      window.__MINIAPP_DETECTED__ = true;
      if (!isFrameReady) setFrameReady();
    }
  }, [isInMiniApp, isFrameReady, setFrameReady]);

  // Este componente no renderiza nada, solo inicializa MiniKit
  return null;
}
