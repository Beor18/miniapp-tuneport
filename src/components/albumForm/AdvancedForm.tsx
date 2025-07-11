/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import { Label } from "@Src/ui/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@Src/ui/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@Src/ui/components/ui/select";
import { Input } from "@Src/ui/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@Src/ui/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@Src/ui/components/ui/card";
import {
  FREE_PLAN_PLATFORM_FEE_PERCENTAGE,
  FREE_PLAN_ARTIST_FEE_PERCENTAGE,
  PAID_PLAN_PLATFORM_FEE_PERCENTAGE,
  PAID_PLAN_ARTIST_FEE_PERCENTAGE,
} from "@Src/lib/constants/feeCalculations";

interface AdvancedFormProps {
  collectionType: any;
  plan: string;
  setPlan: (value: string) => void;
  blockchain: string;
  setBlockchain: (value: string) => void;
  currency: string;
  setCurrency: (value: string) => void;
  maxSupply: string;
  setMaxSupply: (value: string) => void;
  symbol: string;
  setSymbol: (value: string) => void;
  price: any;
  setPrice: (value: any) => void;
}

const blockchainOptions = [
  // {
  //   value: "ethereum",
  //   label: "Ethereum",
  //   image: "/placeholder.svg?height=20&width=20",
  // },
  // {
  //   value: "polygon",
  //   label: "Polygon",
  //   image: "/placeholder.svg?height=20&width=20",
  // },
  {
    value: "solana",
    label: "Solana",
    image: "/solana-logo.png",
  },
  // {
  //   value: "binance",
  //   label: "Binance",
  //   image: "/placeholder.svg?height=20&width=20",
  // },
];

const currencyOptions = [
  {
    value: "SOL",
    label: "SOL",
    image: "/solana-logo.png",
  },
  {
    value: "USDC",
    label: "USDC",
    image: "/usd-coin-usdc-logo.png",
  },
];

export function AdvancedForm({
  collectionType,
  plan,
  setPlan,
  blockchain,
  setBlockchain,
  currency,
  setCurrency,
  maxSupply,
  setMaxSupply,
  symbol,
  setSymbol,
  price,
  setPrice,
}: AdvancedFormProps) {
  return (
    <div className="flex flex-col gap-4 space-y-4">
      <div className="space-y-6">
        <Label htmlFor="plan" className="text-lg font-semibold text-zinc-100">
          Plan Royalties
        </Label>
        <RadioGroup
          id="plan"
          value={plan}
          onValueChange={setPlan}
          className="space-y-4"
        >
          <Card className="bg-zinc-800/50 border-zinc-800 hover:bg-zinc-800/70 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-3">
                <RadioGroupItem
                  value="free"
                  id="free"
                  className="border-zinc-600 text-white data-[state=checked]:bg-zinc-100 data-[state=checked]:text-zinc-900"
                />
                <CardTitle>
                  <Label
                    htmlFor="free"
                    className="text-lg cursor-pointer text-zinc-100 font-semibold"
                  >
                    Base
                  </Label>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-zinc-400">
                <p className="font-medium">Fixed royalties distribution</p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                  <li>
                    {FREE_PLAN_PLATFORM_FEE_PERCENTAGE * 100}% for Tuneport
                  </li>
                  <li>
                    {FREE_PLAN_ARTIST_FEE_PERCENTAGE * 100}% for the artist
                  </li>
                  <li>
                    <span className="font-bold">Price:</span> 2 USDC
                  </li>
                </ul>
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-zinc-800/50 border-zinc-800 hover:bg-zinc-800/70 transition-colors">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <RadioGroupItem
                  value="premium"
                  id="premium"
                  className="border-zinc-600 text-white data-[state=checked]:bg-zinc-100 data-[state=checked]:text-zinc-900"
                />
                <CardTitle>
                  <Label
                    htmlFor="premium"
                    className="text-lg cursor-pointer text-zinc-100 font-semibold"
                  >
                    Flex
                  </Label>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-zinc-400">
                <p className="font-medium">Custom features and distribution</p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                  <li>
                    {PAID_PLAN_PLATFORM_FEE_PERCENTAGE * 100}% for Tuneport
                  </li>
                  <li>
                    {PAID_PLAN_ARTIST_FEE_PERCENTAGE * 100}% for the artist
                  </li>
                  <li>Variable Price</li>
                </ul>
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-zinc-800/50 border-zinc-800 hover:bg-zinc-800/70 transition-colors">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <RadioGroupItem
                  value="legendary"
                  id="legendary"
                  disabled
                  className="border-zinc-700 text-zinc-600 data-[state=checked]:bg-zinc-100 data-[state=checked]:text-zinc-900"
                />
                <CardTitle>
                  <Label
                    htmlFor="legendary"
                    className="text-lg cursor-pointer text-zinc-500 font-semibold"
                  >
                    Soon Legendary Flex
                  </Label>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-zinc-500">
                <p className="font-medium">Surprise...</p>
              </CardDescription>
            </CardContent>
          </Card>
        </RadioGroup>
      </div>
      {plan === "free" && (
        <>
          <div className="space-y-2">
            <Label
              htmlFor="symbol"
              className="text-sm font-medium text-zinc-200"
            >
              Symbol
            </Label>
            <Input
              id="symbol"
              placeholder="Enter symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="bg-zinc-800/50 border-zinc-800 focus:border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supply">Maximum Tracks</Label>
            <Input
              id="supply"
              type="number"
              placeholder="Enter maximum tracks"
              value={maxSupply}
              onChange={(e) => setMaxSupply(e.target.value)}
              className="bg-zinc-800/50 border-zinc-800 focus:border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
            />
          </div>
        </>
      )}
      {plan === "premium" && (
        <div className="flex flex-col gap-8">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Label htmlFor="blockchain">Blockchain</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Select the blockchain network where your album NFTs will
                      be minted.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select value={blockchain} onValueChange={setBlockchain}>
              <SelectTrigger
                className="bg-zinc-800/50 border-zinc-800 text-zinc-100 focus:ring-0 focus:ring-offset-0 focus:border-zinc-700"
                id="blockchain"
              >
                <SelectValue placeholder="Select blockchain">
                  {blockchain && (
                    <div className="flex items-center">
                      <img
                        src={
                          blockchainOptions.find(
                            (opt) => opt.value === blockchain
                          )?.image || ""
                        }
                        alt={blockchain}
                        width={20}
                        height={20}
                        className="mr-2 opacity-90"
                      />
                      {blockchain}
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {blockchainOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100"
                  >
                    <div className="flex items-center">
                      <img
                        src={option.image}
                        alt={option.label}
                        width={20}
                        height={20}
                        className="mr-2 opacity-90"
                      />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Label htmlFor="currency">Select Currency</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Select the currency</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger
                className="bg-zinc-800/50 border-zinc-800 text-zinc-100 focus:ring-0 focus:ring-offset-0 focus:border-zinc-700"
                id="currency"
              >
                <SelectValue placeholder="Select a currency">
                  {currency && (
                    <div className="flex items-center">
                      <img
                        src={
                          currencyOptions.find((opt) => opt.value === currency)
                            ?.image || ""
                        }
                        alt={currency}
                        width={20}
                        height={20}
                        className="mr-2 opacity-90"
                      />
                      {currency}
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {currencyOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100"
                  >
                    <div className="flex items-center">
                      <img
                        src={option.image}
                        alt={option.label}
                        width={20}
                        height={20}
                        className="mr-2 opacity-90"
                      />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="supply">Maximum Tracks</Label>
            <Input
              id="maxSupply"
              type="number"
              placeholder="Enter maximum tracks"
              value={maxSupply}
              onChange={(e) => setMaxSupply(e.target.value)}
              className="bg-zinc-800/50 border-zinc-800 focus:border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="symbol"
              className="text-sm font-medium text-zinc-200"
            >
              Symbol
            </Label>
            <Input
              id="symbol"
              placeholder="Enter symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="bg-zinc-800/50 border-zinc-800 focus:border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="price"
              className="text-sm font-medium text-zinc-200"
            >
              Price
            </Label>
            <Input
              id="price"
              type="number"
              step="0.000001"
              min="0"
              placeholder="Enter price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="bg-zinc-800/50 border-zinc-800 focus:border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}
