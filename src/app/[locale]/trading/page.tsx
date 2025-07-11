"use client";

import { TradingInterface } from "@Src/components/TradingInterface";
import { usePrivy } from "@privy-io/react-auth";

export default function TestTradingPage() {
  const { ready, authenticated, login } = usePrivy();

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">TunePort Coin Trading</h1>
          <p className="text-muted-foreground">
            Conecta tu wallet para empezar a hacer trading
          </p>
          <button
            onClick={login}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90"
          >
            Conectar Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">🎵 TunePort Coin Trading</h1>
          <p className="text-muted-foreground">
            Compra y vende tokens de tu coin con mínima fricción
          </p>
        </div>

        <TradingInterface
          allowAddressInput={true}
          title="🎵 TunePort Coin Trading"
          description="Compra y vende tokens de tu coin con mínima fricción"
        />

        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>
            ⚡ Implementación temporal mientras el SDK de Zora actualiza las
            funciones de trading
          </p>
          <p>
            🔄 Los trades reales se implementarán cuando estén disponibles en el
            SDK
          </p>
        </div>
      </div>
    </div>
  );
}
