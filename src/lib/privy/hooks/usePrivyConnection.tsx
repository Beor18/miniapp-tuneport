import { useMemo } from "react";
import { Connection, clusterApiUrl } from "@solana/web3.js";
import { solanaClusters } from "@Src/lib/config";

// Este hook sirve como reemplazo de useAppKitConnection
export function useAppKitConnection(cluster?: string) {
  const connection = useMemo(() => {
    // Usar cluster específico o defaultear a devnet
    const targetCluster = cluster || "devnet";

    // Buscar en la configuración de Privy
    const configCluster = solanaClusters.find((c) => c.name === targetCluster);

    // Usar RPC URL de la configuración o fallback a los endpoints estándar
    const rpcUrl = configCluster?.rpcUrl || clusterApiUrl(targetCluster as any);

    // Crear la conexión
    return new Connection(rpcUrl, "confirmed");
  }, [cluster]);

  return { connection };
}
