"use client";
import { useState, useEffect } from "react";
import { useZoraCoinTrading } from "@/lib/hooks/base/useZoraCoinTrading";
import { Button } from "@Src/ui/components/ui/button";
import { Input } from "@Src/ui/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@Src/ui/components/ui/card";
import {
  Coins,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Users,
  ArrowUpRight,
  ArrowDownLeft,
  Settings,
  Globe,
  TestTube,
  AlertTriangle,
} from "lucide-react";

interface TradingInterfaceProps {
  coinAddress?: string;
  title?: string;
  description?: string;
  allowAddressInput?: boolean;
}

export function TradingInterface({
  coinAddress: initialCoinAddress,
  title = "Token Trading",
  description = "Buy and sell tokens with minimal friction",
  allowAddressInput = false,
}: TradingInterfaceProps) {
  const {
    coinData,
    isTrading,
    isMainnet,
    getCoinData,
    buyCoin,
    sellCoin,
    tradeTokens,
  } = useZoraCoinTrading();

  const [coinAddress, setCoinAddress] = useState(
    "0xe4d2a1f49ab87eebc53a3d9d706449e8fe066566"
  );
  const [buyAmount, setBuyAmount] = useState("0.01");
  const [sellAmount, setSellAmount] = useState("100");
  const [buySlippage, setBuySlippage] = useState("5");
  const [sellSlippage, setSellSlippage] = useState("15");
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    // Load coin data when coinAddress changes
    if (coinAddress) {
      getCoinData(coinAddress);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coinAddress]); // Solo cuando cambia coinAddress

  const handleBuy = async () => {
    if (!coinAddress) {
      return;
    }
    const amount = parseFloat(buyAmount);
    const slippage = parseFloat(buySlippage) / 100; // Convert percentage to decimal
    if (amount > 0) {
      await buyCoin(
        "0xe4d2a1f49ab87eebc53a3d9d706449e8fe066566",
        amount,
        slippage
      );
    }
  };

  const handleSell = async () => {
    if (!coinAddress) {
      return;
    }
    const amount = parseFloat(sellAmount);
    const slippage = parseFloat(sellSlippage) / 100; // Convert percentage to decimal
    if (amount > 0) {
      await sellCoin(
        "0xe4d2a1f49ab87eebc53a3d9d706449e8fe066566",
        amount,
        slippage
      );
    }
  };

  // Si no hay dirección y se permite input, mostrar campo de entrada
  if (!coinAddress && allowAddressInput) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-neutral-800/50 rounded-full flex items-center justify-center mx-auto">
            <Coins className="h-8 w-8 text-neutral-400" />
          </div>
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <p className="text-neutral-400">{description}</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">
              Music Token Address
            </label>
            <Input
              type="text"
              value={coinAddress}
              onChange={(e) => setCoinAddress(e.target.value)}
              placeholder="Enter the token address you want to trade..."
              className="bg-neutral-800/50 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
            />
            <p className="text-xs text-neutral-500">
              Paste the music token address from your favorite artist or album
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Si no hay dirección válida y no se permite input, mostrar error
  if (!coinAddress) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-white">
            No Music Token Available
          </h3>
          <p className="text-neutral-400">
            This content doesn&apos;t have an associated music token for trading
            yet.
          </p>
          <p className="text-xs text-neutral-500">
            Music tokens let you support artists directly and get exclusive
            access to their content.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-2">
      {/* Network Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              isMainnet ? "bg-green-500" : "bg-yellow-500"
            } animate-pulse`}
          />
          <div className="flex items-center gap-2">
            {isMainnet ? (
              <>
                <Globe className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium text-green-400">
                  Live Trading
                </span>
                <span className="text-xs text-neutral-500">
                  Real money transactions
                </span>
              </>
            ) : (
              <>
                <TestTube className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-medium text-yellow-400">
                  Practice Mode
                </span>
                <span className="text-xs text-neutral-500">
                  Safe testing environment
                </span>
              </>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-neutral-400 hover:text-white"
        >
          <Settings className="h-4 w-4 mr-2" />
          Advanced Options
        </Button>
      </div>

      {/* Stats Overview */}
      {coinData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 text-center backdrop-blur-sm">
            <div className="flex items-center justify-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-neutral-400 font-medium">
                Market Cap
              </span>
            </div>
            <p className="text-lg font-bold text-white">{coinData.marketCap}</p>
            <p className="text-xs text-neutral-500">USD</p>
          </div>
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 text-center backdrop-blur-sm">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-neutral-400 font-medium">
                Volume 24h
              </span>
            </div>
            <p className="text-lg font-bold text-white">
              {coinData?.volume24h}
            </p>
            <p className="text-xs text-neutral-500">USD</p>
          </div>
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 text-center backdrop-blur-sm">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Coins className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-neutral-400 font-medium">
                Total Supply
              </span>
            </div>
            <p className="text-lg font-bold text-white">
              {parseFloat(coinData?.totalSupply as string)}
            </p>
            <p className="text-xs text-neutral-500">Tokens</p>
          </div>
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 text-center backdrop-blur-sm">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-neutral-400 font-medium">
                Unique Holders
              </span>
            </div>
            <p className="text-lg font-bold text-white">
              {coinData.uniqueHolders}
            </p>
            <p className="text-xs text-neutral-500">Holders</p>
          </div>
        </div>
      )}

      {/* Trading Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Buy Tokens */}
        <Card className="bg-neutral-900/30 border-neutral-800 overflow-hidden backdrop-blur-sm">
          <CardHeader className="border-b border-neutral-800 bg-neutral-900/20">
            <CardTitle className="flex items-center gap-3 text-white text-lg">
              <div className="w-8 h-8 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center">
                <ArrowUpRight className="h-4 w-4 text-blue-400" />
              </div>
              Buy Music {coinData?.symbol}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">
                Amount to Spend (ETH)
              </label>
              <Input
                type="number"
                step="0.001"
                min="0"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                placeholder="0.01"
                className="bg-neutral-800/50 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
              />
              <p className="text-xs text-neutral-500">
                Enter how much ETH you want to spend to buy {coinData?.symbol}
              </p>
            </div>

            {/* Advanced Settings for Buy */}
            {showAdvanced && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">
                  Price Protection (%)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="50"
                  value={buySlippage}
                  onChange={(e) => setBuySlippage(e.target.value)}
                  placeholder="5"
                  className="bg-neutral-800/50 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
                />
                <p className="text-xs text-neutral-500">
                  Your purchase will be cancelled if the price moves against you
                  by more than this percentage
                </p>
              </div>
            )}

            <Button
              onClick={handleBuy}
              disabled={isTrading || !buyAmount}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 border-0 shadow-lg transition-all"
            >
              {isTrading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing Purchase...
                </div>
              ) : (
                `Buy with ${buyAmount} ETH`
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Sell Tokens */}
        <Card className="bg-neutral-900/30 border-neutral-800 overflow-hidden backdrop-blur-sm">
          <CardHeader className="border-b border-neutral-800 bg-neutral-900/20">
            <CardTitle className="flex items-center gap-3 text-white text-lg">
              <div className="w-8 h-8 bg-neutral-600/10 border border-neutral-600/20 rounded-lg flex items-center justify-center">
                <ArrowDownLeft className="h-4 w-4 text-neutral-400" />
              </div>
              Sell Music {coinData?.symbol}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">
                Amount to Sell
              </label>
              <Input
                type="number"
                step="1"
                min="0"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                placeholder="100"
                className="bg-neutral-800/50 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500/30"
              />
              <p className="text-xs text-neutral-500">
                Enter how many {coinData?.symbol} tokens you want to sell for
                ETH
              </p>
            </div>

            {/* Advanced Settings for Sell */}
            {showAdvanced && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">
                  Price Protection (%)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="50"
                  value={sellSlippage}
                  onChange={(e) => setSellSlippage(e.target.value)}
                  placeholder="15"
                  className="bg-neutral-800/50 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500/30"
                />
                <p className="text-xs text-neutral-500">
                  Higher protection recommended for selling to ensure you get a
                  fair price
                </p>
              </div>
            )}

            <Button
              onClick={handleSell}
              disabled={isTrading || !sellAmount}
              className="w-full bg-neutral-700 hover:bg-neutral-600 text-white font-medium py-3 border-0 shadow-lg transition-all"
            >
              {isTrading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing Sale...
                </div>
              ) : (
                `Sell ${sellAmount} ${coinData?.symbol}`
              )}
            </Button>
            {/* <p className="text-xs text-neutral-500 text-center">
              {isMainnet
                ? "Convert your music tokens back to ETH instantly"
                : "Practice selling - no real tokens will be sold"}
            </p> */}
          </CardContent>
        </Card>
      </div>

      {/* Contract Info */}
      <div className="bg-neutral-900/20 border border-neutral-800 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center">
              <Coins className="h-3 w-3 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                Music Token Address EXAMPLE:
              </p>
              <p className="text-xs text-neutral-500 font-mono">
                {/* {coinAddress} */}
                0xe4d2a1f49ab87eebc53a3d9d706449e8fe066566
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (typeof window !== "undefined" && navigator.clipboard) {
                navigator.clipboard.writeText(
                  "0xe4d2a1f49ab87eebc53a3d9d706449e8fe066566"
                );
              }
            }}
            className="text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
          >
            Copy
          </Button>
        </div>
      </div>

      {/* SDK Info */}
      <div className="bg-neutral-900/10 border border-neutral-800/50 rounded-xl p-3">
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <Coins className="h-3 w-3" />
          <span>Powered by ZoraCoins SDK</span>
          <span>•</span>
          <span>{isMainnet ? "Live trading on Base network" : ""}</span>
        </div>
      </div>
    </div>
  );
}
