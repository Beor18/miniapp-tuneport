// Este archivo define las redes para Privy
// Recreamos las mismas redes que teníamos en Reown pero con la estructura que necesita Privy

// Redes EVM
export const mainnet = {
  id: 1,
  name: "Ethereum Mainnet",
  chainType: "evm" as const,
};

export const arbitrum = {
  id: 42161,
  name: "Arbitrum One",
  chainType: "evm" as const,
};

export const baseMainnet = {
  id: 8453,
  name: "Base",
  chainType: "evm" as const,
};

export const baseSepolia = {
  id: 84532,
  name: "Base Sepolia",
  chainType: "evm" as const,
};

export const sepolia = {
  id: 11155111,
  name: "Sepolia",
  chainType: "evm" as const,
};

// Redes Solana
export const solana = {
  id: "mainnet-beta",
  name: "Solana Mainnet",
  chainType: "solana" as const,
};

export const solanaTestnet = {
  id: "testnet",
  name: "Solana Testnet",
  chainType: "solana" as const,
};

export const solanaDevnet = {
  id: "devnet",
  name: "Solana Devnet",
  chainType: "solana" as const,
};
