"use client";

import {
  // wagmiAdapter,
  // projectId,
  // solanaWeb3JsAdapter,
  metadata,
  networks,
  privyAppId,
  solanaClusters,
} from "@Src/lib/config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, {
  createContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { solanaDevnet } from "@Src/lib/privy/networks";
import AppWalletProvider from "./AppWalletProvider";
import { FarcasterProvider } from "@Src/components/FarcasterProvider";

// Importaciones de Privy
import { PrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import { SmartWalletsProvider } from "@privy-io/react-auth/smart-wallets";

// 🆕 MiniKit para Base App
import { MiniKitProvider } from "@coinbase/onchainkit/minikit";
import { base } from "viem/chains";

const queryClient = new QueryClient();

// Eliminar configuración de Reown AppKit
// createAppKit({
//   adapters: [solanaWeb3JsAdapter], //wagmiAdapter,
//   networks,
//   metadata: metadata,
//   defaultNetwork: solanaDevnet,
//   projectId,
//   features: {
//     email: false,
//     socials: [
//       "google",
//       "x",
//       // "github",
//       // "discord",
//       // "apple",
//       // "facebook",
//       // "farcaster",
//     ],
//     emailShowWallets: false,
//   },
//   enableWalletConnect: false,
//   allWallets: "HIDE",
//   featuredWalletIds: [
//     //"c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96",
//     "a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393",
//   ],
// });

export const UserRegistrationContext = createContext<{
  isRegistered: boolean | null;
  setIsRegistered: React.Dispatch<React.SetStateAction<boolean | null>>;
  userData: any;
  setUserData: React.Dispatch<React.SetStateAction<any>>;
}>({
  isRegistered: null,
  setIsRegistered: () => {},
  userData: null,
  setUserData: () => {},
});

export default function Providers({ children }: { children: ReactNode }) {
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [hostname, setHostname] = useState<string>("");

  // Detectar hostname de manera SSR-safe
  useEffect(() => {
    setHostname(window.location.hostname);
  }, []);

  // Detectar entorno basado en hostname
  const isMainnet =
    hostname === "app.tuneport.xyz" ||
    hostname === "tuneport.xyz" ||
    hostname === "miniapp.tuneport.xyz" ||
    hostname === "localhost";
  const isTestnet = hostname === "testnet.tuneport.xyz";

  // Configurar cadenas según el entorno
  const getDefaultChain = () => {
    if (isMainnet) {
      return {
        id: 8453, // Base mainnet
        name: "Base",
        rpcUrls: {
          default: {
            http: [
              "https://api.developer.coinbase.com/rpc/v1/base/aNh4GkSHTvoOtsTHdpCxLJnuzfmqX8dj",
            ],
          },
        },
        nativeCurrency: {
          name: "Ether",
          symbol: "ETH",
          decimals: 18,
        },
      };
    } else {
      // Por defecto usar testnet (Base Sepolia) - incluye localhost y testnet.tuneport.xyz
      return {
        id: 84532, // Base Sepolia
        name: "Base Sepolia",
        rpcUrls: {
          default: {
            http: [
              "https://api.developer.coinbase.com/rpc/v1/base-sepolia/aNh4GkSHTvoOtsTHdpCxLJnuzfmqX8dj",
            ],
          },
        },
        nativeCurrency: {
          name: "Ether",
          symbol: "ETH",
          decimals: 18,
        },
      };
    }
  };

  const getSupportedChains = () => {
    if (isMainnet) {
      return [
        {
          id: 8453,
          name: "Base",
          rpcUrls: {
            default: {
              http: [
                "https://api.developer.coinbase.com/rpc/v1/base/aNh4GkSHTvoOtsTHdpCxLJnuzfmqX8dj",
              ],
            },
          },
          nativeCurrency: {
            name: "Ether",
            symbol: "ETH",
            decimals: 18,
          },
        },
      ];
    } else {
      // Por defecto usar testnet (Base Sepolia)
      return [
        {
          id: 84532,
          name: "Base Sepolia",
          rpcUrls: {
            default: {
              http: [
                "https://api.developer.coinbase.com/rpc/v1/base-sepolia/aNh4GkSHTvoOtsTHdpCxLJnuzfmqX8dj",
              ],
            },
          },
          nativeCurrency: {
            name: "Ether",
            symbol: "ETH",
            decimals: 18,
          },
        },
      ];
    }
  };

  return (
    <MiniKitProvider
      apiKey={process.env.NEXT_PUBLIC_CDP_CLIENT_API_KEY}
      chain={base}
    >
      <FarcasterProvider>
        <UserRegistrationContext.Provider
          value={{ isRegistered, setIsRegistered, userData, setUserData }}
        >
          {/* Configuración de Privy */}
          <PrivyProvider
            appId={privyAppId}
            config={{
              appearance: {
                theme: "dark",
                accentColor: "#6701e6",
                logo: metadata.icons[0],
                walletChainType: "ethereum-and-solana", // Explícitamente configurar para soportar ambas cadenas
                // Configuración para personalizar la UI de conexión de wallet
                showWalletLoginFirst: false, // Mostrar opciones de wallet primero
                walletList: ["coinbase_wallet"], // Solo mostrar Phantom y MetaMask
              },
              loginMethods: ["farcaster", "wallet"],
              embeddedWallets: {
                createOnLogin: "all-users",
              },
              // Configurar cadena por defecto dinámicamente
              defaultChain: getDefaultChain(),
              // Configurar cadenas soportadas dinámicamente
              supportedChains: getSupportedChains(),
              // Configuración de clústeres de Solana
              solanaClusters: solanaClusters.map((cluster) => ({
                name:
                  cluster.name === "mainnet-beta"
                    ? "mainnet-beta"
                    : cluster.name === "devnet"
                    ? "devnet"
                    : cluster.name === "testnet"
                    ? "testnet"
                    : "devnet",
                rpcUrl: cluster.rpcUrl,
              })),
              // Desactivar WalletConnect explícitamente y configurar wallets externas
              externalWallets: {
                walletConnect: { enabled: false }, // Desactivar WalletConnect para evitar el QR con "UX by reown"
                // Configuración para wallets de Solana
                solana: {
                  connectors: toSolanaWalletConnectors(), // Incluir conectores específicos de Solana
                },
              },
            }}
          >
            <SmartWalletsProvider
              config={{
                paymasterContext: {
                  mode: "SPONSORED",
                  AppWalletProvider: AppWalletProvider,
                  PrivyProvider: PrivyProvider,
                  calculateGasLimits: true,
                  expiryDuration: 300,
                  sponsorshipInfo: {
                    webhookData: {},
                    smartAccountInfo: {
                      name: "Coinbase",
                      version: "2.0.0",
                    },
                  },
                },
              }}
            >
              <QueryClientProvider client={queryClient}>
                {children}
              </QueryClientProvider>
            </SmartWalletsProvider>
          </PrivyProvider>
        </UserRegistrationContext.Provider>
      </FarcasterProvider>
    </MiniKitProvider>
  );
}
