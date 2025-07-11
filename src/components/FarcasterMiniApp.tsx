"use client";

import React from "react";
import { useFarcasterMiniApp } from "./FarcasterProvider";
import { useAccount, useWalletClient } from "wagmi";
import { Button } from "@Src/ui/components/ui/button";

export default function FarcasterMiniApp() {
  const { isSDKLoaded, context, authData } = useFarcasterMiniApp();
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const handleSignMessage = async () => {
    if (!walletClient || !address) {
      console.log("Wallet not connected");
      return;
    }

    try {
      const message = "¡Hola desde Tuneport!";
      const signature = await walletClient.signMessage({
        account: address,
        message,
      });
      console.log("Mensaje firmado:", signature);
    } catch (error) {
      console.error("Error al firmar mensaje:", error);
    }
  };

  if (!isSDKLoaded) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-sm text-gray-400">Cargando Mini App SDK...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
      <h3 className="text-lg font-semibold mb-3">Farcaster Mini App Status</h3>

      <div className="space-y-2 text-sm mb-4">
        <div>
          <span className="text-gray-400">SDK Cargado:</span>
          <span className="ml-2 text-green-400">✓ Activo</span>
        </div>

        {context && (
          <div>
            <span className="text-gray-400">Contexto:</span>
            <span className="ml-2">{JSON.stringify(context)}</span>
          </div>
        )}

        {authData && (
          <div>
            <span className="text-gray-400">Auth Data:</span>
            <span className="ml-2">{JSON.stringify(authData)}</span>
          </div>
        )}

        <div>
          <span className="text-gray-400">Wallet Conectada:</span>
          <span className="ml-2">{isConnected ? "✓ Sí" : "✗ No"}</span>
        </div>

        {address && (
          <div>
            <span className="text-gray-400">Dirección:</span>
            <span className="ml-2 font-mono text-xs">{address}</span>
          </div>
        )}
      </div>

      {isConnected && (
        <Button
          onClick={handleSignMessage}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          Firmar Mensaje de Prueba
        </Button>
      )}
    </div>
  );
}
