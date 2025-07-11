import { useState, useCallback, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth";
import { toast } from "sonner";
import {
  parseEther,
  formatEther,
  Address,
  createWalletClient,
  http,
  custom,
} from "viem";
import { base } from "viem/chains";
import {
  tradeCoin,
  TradeParameters,
  getOnchainCoinDetails,
  getCoin,
} from "@zoralabs/coins-sdk";
import { useBaseWallet } from "./useBaseWallet";

export interface CoinTradingData {
  coinAddress: string;
  name: string;
  symbol: string;
  currentPrice: string | number;
  totalSupply: string;
  marketCap: string | number;
  liquidity: string;
  userBalance: string;
  holders: number;
  volume24h: number;
  isLoading: boolean;
  uniqueHolders: number;
}

export interface TradeResult {
  hash: `0x${string}` | null;
  status: "success" | "pending" | "failed";
  message?: string;
}

export const useZoraCoinTrading = () => {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { publicClientMainnet, getUserWalletClient } = useBaseWallet();

  // Obtener la dirección EVM del usuario
  const getEvmWalletAddress = useCallback((): string | null => {
    const evmWallet = wallets.find(
      (wallet: any) =>
        wallet.walletClientType === "privy" ||
        wallet.walletClientType === "metamask" ||
        wallet.walletClientType === "walletconnect"
    );
    return evmWallet?.address || null;
  }, [wallets]);

  const [isTrading, setIsTrading] = useState(false);
  const [coinData, setCoinData] = useState<CoinTradingData | null>(null);
  const [isMainnet, setIsMainnet] = useState(false);
  const [tradeError, setTradeError] = useState<Error | null>(null);
  const [lastTxHash, setLastTxHash] = useState<`0x${string}` | null>(null);

  // Configuración directa de mainnet
  useEffect(() => {
    // 🚀 CONFIGURADO PARA MAINNET DIRECTO
    setIsMainnet(true);

    console.log(
      "🌐 TRADING MODE: Base Mainnet (Real Trading) - FORCED ENABLED"
    );
    console.log("💰 All trades will use real ETH and tokens on Base Mainnet");
    console.log("⚠️  WARNING: Real money transactions activated");
  }, []);

  // Función para obtener datos del coin usando onchain queries
  const getCoinData = useCallback(
    async (coinAddress: string): Promise<CoinTradingData | null> => {
      if (!publicClientMainnet) {
        console.error("No public client available");
        return null;
      }

      try {
        setCoinData((prev) => (prev ? { ...prev, isLoading: true } : null));

        const onchainDetails = await getCoin({
          address: coinAddress,
          chain: base.id,
        });

        console.log("onchainDetails: ", onchainDetails);

        const coin: any = onchainDetails.data?.zora20Token;

        if (coin) {
          console.log("Coin Details:");
          console.log("- Name:", coin.name);
          console.log("- Symbol:", coin.symbol);
          console.log("- Description:", coin.description);
          console.log("- Total Supply:", coin.totalSupply);
          console.log("- Market Cap:", coin.marketCap);
          console.log("- 24h Volume:", coin.volume24h);
          console.log("- Creator:", coin.creatorAddress);
          console.log("- Created At:", coin.createdAt);
          console.log("- Unique Holders:", coin.uniqueHolders);

          // Access media if available
          if (coin.mediaContent?.previewImage) {
            console.log("- Preview Image:", coin.mediaContent.previewImage);
          }
        }

        setCoinData(coin);
        return coin;
      } catch (error) {
        console.error("Error fetching coin data:", error);
        setCoinData((prev) => (prev ? { ...prev, isLoading: false } : null));
        return null;
      }
    },
    [publicClientMainnet, getEvmWalletAddress]
  );

  // Función central para ejecutar trades
  const executeTrade = useCallback(
    async (tradeParameters: TradeParameters): Promise<TradeResult> => {
      const evmAddress = getEvmWalletAddress();

      if (!authenticated || !evmAddress) {
        throw new Error("Please connect your wallet first");
      }

      if (!publicClientMainnet) {
        throw new Error("Public client not available");
      }

      const walletClient = await getUserWalletClient();
      console.log("walletClient", walletClient);

      if (!walletClient) {
        throw new Error("No wallet available for signing transactions");
      }

      console.log("finalWalletClient", walletClient);
      console.log("finalWalletClient.account", walletClient?.account);

      setIsTrading(true);
      setTradeError(null);
      setLastTxHash(null);

      try {
        if (isMainnet) {
          // 🌐 MAINNET: Usar Smart Wallet del usuario con createTradeCall
          console.log(
            "💰 REAL MONEY TRANSACTION - Using Smart Wallet on Base Mainnet"
          );
          console.log("🛒 Trading parameters:", tradeParameters);
          console.log("⚠️  This will cost real ETH and ZORA tokens");

          console.log("⏳ Executing trade with external wallet...");

          // Mostrar qué wallet se está usando
          console.log("💰 Using user's wallet for transaction");

          // Usar tradeCoin con la wallet disponible
          const tradeReceipt = await tradeCoin({
            tradeParameters,
            walletClient: walletClient,
            account: walletClient.account!,
            publicClient: publicClientMainnet,
            validateTransaction: true,
          });

          console.log("✅ Trade successful:", tradeReceipt);

          if (tradeReceipt.status === "success") {
            setLastTxHash(tradeReceipt.transactionHash);
            console.log(`📄 Transaction hash: ${tradeReceipt.transactionHash}`);
            console.log(
              `🔗 View on Base Explorer: https://basescan.org/tx/${tradeReceipt.transactionHash}`
            );

            return {
              hash: tradeReceipt.transactionHash,
              status: "success",
              message: "trade executed successfully on Base Mainnet",
            };
          }

          throw new Error("Transaction failed");
        } else {
          // 🧪 TESTNET: Usar funciones simuladas
          console.log("🧪 Using simulated trading on Base Sepolia");
          console.log("🛒 Simulating trade with parameters:", tradeParameters);

          // Simular tiempo de transacción
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Simular hash de transacción
          const mockHash = `0x${"0".repeat(64)}` as `0x${string}`;
          setLastTxHash(mockHash);

          return {
            hash: mockHash,
            status: "success",
            message: "Simulated trade completed",
          };
        }
      } catch (error: any) {
        console.error("Error executing trade:", error);

        // Manejo específico para timeouts en mainnet
        if (
          error.name === "WaitForTransactionReceiptTimeoutError" &&
          isMainnet
        ) {
          console.warn(
            "⏰ Trade transaction timed out but may still be processing"
          );
          console.log("🔗 Check Base Explorer for transaction status");

          return {
            hash: null,
            status: "pending",
            message: "Transaction timeout - check Base Explorer for status",
          };
        }

        const errorObj =
          error instanceof Error
            ? error
            : new Error(error.message || "Trade failed");
        setTradeError(errorObj);

        return {
          hash: null,
          status: "failed",
          message: errorObj.message,
        };
      } finally {
        setIsTrading(false);
      }
    },
    [
      authenticated,
      getEvmWalletAddress,
      getUserWalletClient,
      publicClientMainnet,
      isMainnet,
    ]
  );

  // Función para comprar tokens
  const buyCoin = useCallback(
    async (
      coinAddress: string,
      ethAmount: number,
      slippage: number = 0.05
    ): Promise<TradeResult> => {
      const evmAddress = getEvmWalletAddress();

      if (!evmAddress) {
        throw new Error("Wallet not connected");
      }

      try {
        toast.loading("Buying music tokens...", { id: "buy-tokens" });

        const tradeParameters: TradeParameters = {
          sell: { type: "eth" },
          buy: {
            type: "erc20",
            address: coinAddress as Address,
          },
          amountIn: parseEther(ethAmount.toString()),
          slippage: slippage,
          sender: evmAddress as Address,
        };

        const result = await executeTrade(tradeParameters);

        if (result.status === "success") {
          toast.success(
            isMainnet
              ? "🎵 Real tokens purchased!"
              : "🎵 Music tokens purchased successfully!",
            {
              id: "buy-tokens",
              description: isMainnet
                ? `✅ Bought ${ethAmount} ETH worth of tokens on Base Mainnet`
                : `You bought ${ethAmount} ETH worth of music tokens`,
            }
          );

          // Actualizar datos del coin después de la compra
          await getCoinData(coinAddress);
        } else {
          toast.error("Failed to buy music tokens", {
            id: "buy-tokens",
            description: result.message || "Please try again",
          });
        }

        return result;
      } catch (error: any) {
        console.error("Error buying tokens:", error);
        toast.error("Failed to buy music tokens", {
          id: "buy-tokens",
          description: error.message || "Please try again",
        });

        return {
          hash: null,
          status: "failed",
          message: error.message || "Buy operation failed",
        };
      }
    },
    [executeTrade, getCoinData, getEvmWalletAddress]
  );

  // Función para vender tokens
  const sellCoin = useCallback(
    async (
      coinAddress: string,
      tokenAmount: number,
      slippage: number = 0.15
    ): Promise<TradeResult> => {
      const evmAddress = getEvmWalletAddress();

      if (!evmAddress) {
        throw new Error("Wallet not connected");
      }

      try {
        toast.loading("Selling music tokens...", { id: "sell-tokens" });

        const tradeParameters: TradeParameters = {
          sell: {
            type: "erc20",
            address: coinAddress as Address,
          },
          buy: { type: "eth" },
          amountIn: parseEther(tokenAmount.toString()),
          slippage: slippage,
          sender: evmAddress as Address,
        };

        const result = await executeTrade(tradeParameters);

        if (result.status === "success") {
          toast.success(
            isMainnet
              ? "💰 Real tokens sold!"
              : "💰 Music tokens sold successfully!",
            {
              id: "sell-tokens",
              description: isMainnet
                ? `✅ Sold ${tokenAmount} tokens on Base Mainnet`
                : `You sold ${tokenAmount} music tokens`,
            }
          );

          // Actualizar datos del coin después de la venta
          await getCoinData(coinAddress);
        } else {
          toast.error("Failed to sell music tokens", {
            id: "sell-tokens",
            description: result.message || "Please try again",
          });
        }

        return result;
      } catch (error: any) {
        console.error("Error selling tokens:", error);
        toast.error("Failed to sell music tokens", {
          id: "sell-tokens",
          description: error.message || "Please try again",
        });

        return {
          hash: null,
          status: "failed",
          message: error.message || "Sell operation failed",
        };
      }
    },
    [executeTrade, getCoinData, getEvmWalletAddress]
  );

  // Función para hacer trading entre diferentes ERC20 tokens
  const tradeTokens = useCallback(
    async (
      sellTokenAddress: string,
      buyTokenAddress: string,
      amount: number,
      slippage: number = 0.05
    ): Promise<TradeResult> => {
      const evmAddress = getEvmWalletAddress();

      if (!evmAddress) {
        throw new Error("Wallet not connected");
      }

      try {
        toast.loading("Swapping music tokens...", { id: "trade-tokens" });

        const tradeParameters: TradeParameters = {
          sell: {
            type: "erc20",
            address: sellTokenAddress as Address,
          },
          buy: {
            type: "erc20",
            address: buyTokenAddress as Address,
          },
          amountIn: parseEther(amount.toString()),
          slippage: slippage,
          sender: evmAddress as Address,
        };

        const result = await executeTrade(tradeParameters);

        if (result.status === "success") {
          toast.success("🔄 Music tokens swapped successfully!", {
            id: "trade-tokens",
            description: `You swapped ${amount} music tokens`,
          });
        } else {
          toast.error("Failed to swap music tokens", {
            id: "trade-tokens",
            description: result.message || "Please try again",
          });
        }

        return result;
      } catch (error: any) {
        console.error("Error trading tokens:", error);
        toast.error("Failed to swap music tokens", {
          id: "trade-tokens",
          description: error.message || "Please try again",
        });

        return {
          hash: null,
          status: "failed",
          message: error.message || "Trade operation failed",
        };
      }
    },
    [executeTrade, getEvmWalletAddress]
  );

  return {
    // Estados
    coinData,
    isTrading,
    isMainnet,
    tradeError,
    lastTxHash,

    // Funciones
    getCoinData,
    buyCoin,
    sellCoin,
    tradeTokens,
    executeTrade, // Exportar para uso directo si es necesario
  };
};
