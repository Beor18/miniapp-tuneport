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
      <div className="w-full max-w-full overflow-hidden">
        <div className="space-y-4 p-4">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-neutral-800/50 rounded-full flex items-center justify-center mx-auto">
              <Coins className="h-6 w-6 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-sm text-neutral-400 px-2">{description}</p>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">
                Music Token Address
              </label>
              <Input
                type="text"
                value={coinAddress}
                onChange={(e) => setCoinAddress(e.target.value)}
                placeholder="Enter token address..."
                className="h-12 w-full bg-neutral-800/50 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
              />
              <p className="text-xs text-neutral-500 px-1">
                Paste the music token address
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si no hay dirección válida y no se permite input, mostrar error
  if (!coinAddress) {
    return (
      <div className="w-full max-w-full overflow-hidden">
        <div className="space-y-4 p-4">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">
              No Music Token Available
            </h3>
            <p className="text-sm text-neutral-400 px-2">
              This content doesn&apos;t have an associated music token for
              trading yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="space-y-4 p-3">
        {/* Network Indicator - Mobile Optimized */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isMainnet ? "bg-green-500" : "bg-yellow-500"
              } animate-pulse`}
            />
            <div className="flex items-center gap-1">
              {isMainnet ? (
                <>
                  <Globe className="h-3 w-3 text-green-400" />
                  <span className="text-xs font-medium text-green-400">
                    Live
                  </span>
                </>
              ) : (
                <>
                  <TestTube className="h-3 w-3 text-yellow-400" />
                  <span className="text-xs font-medium text-yellow-400">
                    Test
                  </span>
                </>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-neutral-400 hover:text-white h-8 px-2"
          >
            <Settings className="h-3 w-3 mr-1" />
            <span className="text-xs">Advanced</span>
          </Button>
        </div>

        {/* Stats Overview - Mobile Grid */}
        {coinData && (
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <BarChart3 className="h-3 w-3 text-blue-400" />
                <span className="text-xs text-neutral-400">Market Cap</span>
              </div>
              <p className="text-xs font-bold text-white truncate">
                {coinData.marketCap}
              </p>
            </div>
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Users className="h-3 w-3 text-blue-400" />
                <span className="text-xs text-neutral-400">Volume</span>
              </div>
              <p className="text-xs font-bold text-white truncate">
                {coinData?.volume24h}
              </p>
            </div>
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Coins className="h-3 w-3 text-blue-400" />
                <span className="text-xs text-neutral-400">Supply</span>
              </div>
              <p className="text-xs font-bold text-white truncate">
                {parseFloat(coinData?.totalSupply as string)}
              </p>
            </div>
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="h-3 w-3 text-blue-400" />
                <span className="text-xs text-neutral-400">Holders</span>
              </div>
              <p className="text-xs font-bold text-white truncate">
                {coinData.uniqueHolders}
              </p>
            </div>
          </div>
        )}

        {/* Trading Section - Mobile Stack */}
        <div className="space-y-3">
          {/* Buy Tokens */}
          <Card className="bg-neutral-900/30 border-neutral-800 overflow-hidden">
            <CardHeader className="border-b border-neutral-800 bg-neutral-900/20 p-3">
              <CardTitle className="flex items-center gap-2 text-white text-sm">
                <div className="w-5 h-5 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center">
                  <ArrowUpRight className="h-3 w-3 text-blue-400" />
                </div>
                <span className="truncate">Buy {coinData?.symbol}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">
                  Amount (ETH)
                </label>
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  placeholder="0.01"
                  className="h-11 w-full bg-neutral-800/50 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
                />
              </div>

              {/* Advanced Settings for Buy */}
              {showAdvanced && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">
                    Slippage (%)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="50"
                    value={buySlippage}
                    onChange={(e) => setBuySlippage(e.target.value)}
                    placeholder="5"
                    className="h-11 w-full bg-neutral-800/50 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
                  />
                </div>
              )}

              <Button
                onClick={handleBuy}
                disabled={isTrading || !buyAmount}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium border-0 shadow-lg transition-all touch-manipulation"
              >
                {isTrading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="text-sm">Processing...</span>
                  </div>
                ) : (
                  <span className="text-sm">Buy with {buyAmount} ETH</span>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Sell Tokens */}
          <Card className="bg-neutral-900/30 border-neutral-800 overflow-hidden">
            <CardHeader className="border-b border-neutral-800 bg-neutral-900/20 p-3">
              <CardTitle className="flex items-center gap-2 text-white text-sm">
                <div className="w-5 h-5 bg-neutral-600/10 border border-neutral-600/20 rounded-lg flex items-center justify-center">
                  <ArrowDownLeft className="h-3 w-3 text-neutral-400" />
                </div>
                <span className="truncate">Sell {coinData?.symbol}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">
                  Amount
                </label>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  value={sellAmount}
                  onChange={(e) => setSellAmount(e.target.value)}
                  placeholder="100"
                  className="h-11 w-full bg-neutral-800/50 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500/30"
                />
              </div>

              {/* Advanced Settings for Sell */}
              {showAdvanced && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">
                    Slippage (%)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="50"
                    value={sellSlippage}
                    onChange={(e) => setSellSlippage(e.target.value)}
                    placeholder="15"
                    className="h-11 w-full bg-neutral-800/50 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500/30"
                  />
                </div>
              )}

              <Button
                onClick={handleSell}
                disabled={isTrading || !sellAmount}
                className="w-full h-11 bg-neutral-700 hover:bg-neutral-600 text-white font-medium border-0 shadow-lg transition-all touch-manipulation"
              >
                {isTrading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="text-sm">Processing...</span>
                  </div>
                ) : (
                  <span className="text-sm">
                    Sell {sellAmount} {coinData?.symbol}
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Contract Info - Mobile Optimized */}
        <div className="bg-neutral-900/20 border border-neutral-800 rounded-lg p-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center">
                <Coins className="h-3 w-3 text-blue-400" />
              </div>
              <p className="text-sm font-medium text-white">Token Address</p>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-neutral-500 font-mono truncate flex-1 min-w-0">
                0xe4d2a1f49ab87eebc53a3d9d706449e8fe066566
              </p>
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
                className="text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 h-7 px-2 flex-shrink-0"
              >
                <span className="text-xs">Copy</span>
              </Button>
            </div>
          </div>
        </div>

        {/* SDK Info - Mobile Optimized */}
        <div className="bg-neutral-900/10 border border-neutral-800/50 rounded-lg p-2">
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <Coins className="h-3 w-3" />
            <span>Powered by ZoraCoins SDK</span>
          </div>
        </div>
      </div>
    </div>
  );
}
