// Reexportamos todos los hooks de Privy para compatibilidad con Reown
export { useAppKitAccount } from "./hooks/usePrivyAccount";
export { useAppKitProvider } from "./hooks/usePrivyProvider";
export { useAppKitConnection } from "./hooks/usePrivyConnection";

// Reexportamos hooks originales de Privy
export { usePrivy, useWallets } from "@privy-io/react-auth";
export {
  useSendTransaction as useSendSolanaTransaction,
  useSolanaWallets, // Exportar explícitamente el hook para wallets de Solana
} from "@privy-io/react-auth/solana";

// Reexportamos redes
export * from "./networks";
