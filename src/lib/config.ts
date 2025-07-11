"use client";

import { http, createStorage, cookieStorage, createConfig } from "wagmi";
import {
  mainnet,
  arbitrum,
  baseMainnet,
  baseSepolia,
  sepolia,
  solana,
  solanaTestnet,
  solanaDevnet,
} from "./privy/networks";

// Importaciones de Privy
// import { SolanaChainConfig } from "@privy-io/react-auth";

// Eliminamos las importaciones de Reown
// import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
// import { SolanaAdapter } from "@reown/appkit-adapter-solana/react";

import {
  SolflareWalletAdapter,
  PhantomWalletAdapter,
} from "@solana/wallet-adapter-wallets";

export const projectId = "cm5vm7kgp005pc5fj9f5i7jjq";

if (!projectId) {
  throw new Error("Project ID is not defined");
}

export const metadata = {
  name: "Tuneport",
  description: "The new era of Streaming",
  url: "https://app.tuneport.xyz",
  icons: [
    "https://pbs.twimg.com/profile_images/1942391632520695808/2XvLiCf2_400x400.png",
  ],
};

const EvmNetworks = [baseMainnet, baseSepolia];
const SolanaNetworks = [solana, solanaDevnet];

const AllNetworks = [...EvmNetworks, ...SolanaNetworks];

export const networks: any = AllNetworks;

// Configuración de Privy
export const privyAppId = projectId;

// Configuración de Solana para Privy
export interface SolanaClusterConfig {
  name: string;
  rpcUrl: string;
}

export const solanaClusters: SolanaClusterConfig[] = [
  {
    name: "mainnet-beta",
    rpcUrl: "https://api.mainnet-beta.solana.com",
  },
  {
    name: "devnet",
    rpcUrl: "https://api.devnet.solana.com",
  },
];

// Adaptador para Solana con compatibilidad con Privy
export const solanaWeb3JsAdapter = {
  wallets: [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
};

// Configuración de Base y otros EVM chains
const baseChain = {
  id: 8453,
  name: "Base",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [
        "https://api.developer.coinbase.com/rpc/v1/base/aNh4GkSHTvoOtsTHdpCxLJnuzfmqX8dj",
      ],
    },
  },
};

const baseSepoliaChain = {
  id: 84532,
  name: "Base Sepolia",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://sepolia.base.org"] },
  },
};

// Crear configuración de Wagmi
const wagmiConfig = createConfig({
  chains: [baseChain, baseSepoliaChain] as const,
  transports: {
    [baseChain.id]: http(),
    [baseSepoliaChain.id]: http(),
  },
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
});

// Adaptador de Wagmi para integración con Privy
export const wagmiAdapter = {
  ssr: true,
  networks,
  projectId,
  wagmiConfig,
};

// const harmonie = {
//   id: 441,
//   name: "Harmonie",
//   iconUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/5805.png",
//   iconBackground: "#fff",
//   nativeCurrency: { name: "Harmonie", symbol: "HMY", decimals: 18 },
//   rpcUrls: {
//     default: { http: ["https://harmonie-endpoint-02.allfeat.io"] },
//   },
//   blockExplorers: {
//     default: { name: "EVM Allfeat", url: "https://evm.allfeat.com/" },
//   },
// } as const satisfies Chain;

//const supportedChains: Chain[] = [harmonie];

// export const config = getDefaultConfig({
//   appName: "WalletConnection",
//   projectId,
//   chains: supportedChains as any,
//   ssr: true,
//   storage: createStorage({
//     storage: cookieStorage,
//   }),
//   transports: supportedChains.reduce(
//     (obj, chain) => ({ ...obj, [chain.id]: http() }),
//     {}
//   ),
// });
