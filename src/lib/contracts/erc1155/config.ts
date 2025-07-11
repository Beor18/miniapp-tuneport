// Direcciones de contratos para diferentes redes
export const CONTRACT_ADDRESSES = {
  // Base Sepolia (Testnet) - Contratos Upgradeables
  sepolia: {
    factory: "0xAD6474aB644B97A4B82C2128921c32aF69392B15", // MusicNFTFactoryUpgradeable
    revenueShareFactory: "0x60CD9B009799636f59367E4C06b5Ad95Ce1E218F", // RevenueShareFactoryUpgradeable
  },
  // Base Mainnet (Producción) - Pendiente
  mainnet: {
    factory: "", // Pendiente de despliegue
    revenueShareFactory: "", // Pendiente de despliegue
  },
  // Legacy: Ethereum Sepolia (Deprecated - Solo para referencia)
  sepolialegacy: {
    factory: "0x36FFc4d5bF255DE6B44d8F4BAE1f6C69cD37fE7E", // DEPRECATED - Contratos no upgradeables
    revenueShareFactory: "0x17f105daaD85a618226215295502772d8b90b55B", // DEPRECATED - Contratos no upgradeables
  },
};

// Configuración de redes
export const NETWORKS = {
  sepolia: {
    id: 11155111,
    name: "Sepolia",
    rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/demo",
    currency: "ETH",
    blockExplorer: "https://sepolia.etherscan.io",
  },
  mainnet: {
    id: 1,
    name: "Ethereum",
    rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/demo",
    currency: "ETH",
    blockExplorer: "https://etherscan.io",
  },
};

// Red por defecto
export const DEFAULT_NETWORK = "sepolia";
