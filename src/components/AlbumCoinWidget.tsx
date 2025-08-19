"use client";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@Src/ui/components/ui/card";
import { Button } from "@Src/ui/components/ui/button";
import { Input } from "@Src/ui/components/ui/input";
import { Badge } from "@Src/ui/components/ui/badge";
import { useFarcasterMiniApp } from "./FarcasterProvider";
import {
  useZoraCoinTrading,
  type CoinTradingData,
} from "@Src/lib/hooks/base/useZoraCoinTrading";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface AlbumCoinWidgetProps {
  albumName: string;
  albumSymbol: string;
  coinAddress?: string;
  albumCover: string;
}

export default function AlbumCoinWidget({
  albumName,
  albumSymbol,
  coinAddress,
  albumCover,
}: AlbumCoinWidgetProps) {
  const { coinData, isTrading, getCoinData, buyCoin, sellCoin } =
    useZoraCoinTrading();
  const { userInfo } = useFarcasterMiniApp();

  const [buyAmount, setBuyAmount] = useState("0.001"); // Valor más realista por defecto
  const [sellAmount, setSellAmount] = useState("1");
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");

  useEffect(() => {
    if (coinAddress) {
      getCoinData(coinAddress);
    }
  }, [coinAddress, getCoinData]);

  if (!coinAddress) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-6 text-center">
          <div className="text-zinc-400 text-sm">
            💰 This album hasn&apos;t been tokenized yet
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleBuy = async () => {
    const amount = parseFloat(buyAmount);
    if (amount > 0) {
      const result = await buyCoin(coinAddress, amount);
      if (result.status === "success") {
        setBuyAmount("0.001");
        // Refresh data
        getCoinData(coinAddress);
      }
    }
  };

  const handleSell = async () => {
    const amount = parseFloat(sellAmount);
    if (amount > 0) {
      const result = await sellCoin(coinAddress, amount);
      if (result.status === "success") {
        setSellAmount("1");
        // Refresh data
        getCoinData(coinAddress);
      }
    }
  };

  const formatPrice = (price: number) => {
    return price < 0.0001 ? price.toExponential(2) : price.toFixed(6);
  };

  return (
    <Card className="bg-gradient-to-br from-zinc-900 to-zinc-800 border-zinc-700/50 overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img
              src={albumCover}
              alt={albumName}
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Coins className="h-3 w-3 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg text-zinc-100 truncate">
              ${albumSymbol}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge
                variant="secondary"
                className="bg-blue-500/20 text-blue-300 text-xs"
              >
                Album Coin
              </Badge>
              {/* Mostrar usuario de Farcaster si está disponible */}
              {userInfo && (
                <Badge
                  variant="secondary"
                  className="bg-purple-500/20 text-purple-300 text-xs"
                >
                  @{userInfo.username}
                </Badge>
              )}
              <a
                href={`https://zora.co/collect/base:${coinAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-zinc-300 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats */}
        {coinData && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <div className="text-xs text-zinc-400 mb-1">Price</div>
              <div className="flex items-center space-x-1">
                <span className="text-sm font-medium text-zinc-100">
                  Ξ
                  {formatPrice(
                    typeof coinData.currentPrice === "number"
                      ? coinData.currentPrice
                      : parseFloat(coinData.currentPrice) || 0
                  )}
                </span>
                <TrendingUp className="h-3 w-3 text-emerald-500" />
              </div>
            </div>

            <div className="bg-zinc-800/50 rounded-lg p-3">
              <div className="text-xs text-zinc-400 mb-1">Market Cap</div>
              <div className="text-sm font-medium text-zinc-100">
                Ξ
                {(typeof coinData.marketCap === "number"
                  ? coinData.marketCap
                  : parseFloat(coinData.marketCap) || 0
                ).toFixed(2)}
              </div>
            </div>

            <div className="bg-zinc-800/50 rounded-lg p-3">
              <div className="text-xs text-zinc-400 mb-1">Holders</div>
              <div className="flex items-center space-x-1">
                <Users className="h-3 w-3 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-100">
                  {coinData.holders}
                </span>
              </div>
            </div>

            <div className="bg-zinc-800/50 rounded-lg p-3">
              <div className="text-xs text-zinc-400 mb-1">24h Volume</div>
              <div className="text-sm font-medium text-zinc-100">
                Ξ{coinData.volume24h.toFixed(3)}
              </div>
            </div>
          </div>
        )}

        {/* Trading Interface */}
        <div className="space-y-3">
          <div className="flex bg-zinc-800/30 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("buy")}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === "buy"
                  ? "bg-emerald-600 text-white"
                  : "text-zinc-400 hover:text-zinc-300"
              }`}
            >
              <ArrowUpRight className="h-4 w-4 inline mr-1" />
              Buy
            </button>
            <button
              onClick={() => setActiveTab("sell")}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === "sell"
                  ? "bg-red-600 text-white"
                  : "text-zinc-400 hover:text-zinc-300"
              }`}
            >
              <ArrowDownRight className="h-4 w-4 inline mr-1" />
              Sell
            </button>
          </div>

          {activeTab === "buy" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">
                  Amount to buy
                </label>
                <Input
                  type="number"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  placeholder="0.001"
                  step="0.001"
                  min="0.0001"
                  className="bg-zinc-800 border-zinc-700 text-zinc-100"
                />
              </div>
              <Button
                onClick={handleBuy}
                disabled={isTrading || !buyAmount || parseFloat(buyAmount) <= 0}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isTrading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Buying...
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Buy ${albumSymbol}
                  </>
                )}
              </Button>
            </div>
          )}

          {activeTab === "sell" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">
                  Amount to sell
                </label>
                <Input
                  type="number"
                  value={sellAmount}
                  onChange={(e) => setSellAmount(e.target.value)}
                  placeholder="1"
                  className="bg-zinc-800 border-zinc-700 text-zinc-100"
                />
              </div>
              <Button
                onClick={handleSell}
                disabled={
                  isTrading || !sellAmount || parseFloat(sellAmount) <= 0
                }
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                variant="destructive"
              >
                {isTrading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Selling...
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="h-4 w-4 mr-2" />
                    Sell ${albumSymbol}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-3">
          <p className="text-xs text-blue-300 leading-relaxed">
            💡 <strong>Album Tokens</strong> let you directly support and invest
            in this music. Token holders get exclusive perks and participate in
            the album&apos;s success.
            {userInfo && (
              <span className="block mt-1">
                Hello {userInfo.displayName || userInfo.username}! 👋
              </span>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
