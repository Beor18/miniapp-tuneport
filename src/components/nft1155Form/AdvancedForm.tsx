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
import { HelpCircle, Crown, Sparkles, Zap } from "lucide-react";
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
import { useTranslations } from "next-intl";

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
  {
    value: "solana",
    label: "Solana",
    image: "/solana-logo.png",
  },
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
  // Translation hooks
  const tForms = useTranslations("forms");

  return (
    <div className="flex flex-col gap-4 space-y-4">
      <div className="space-y-6">
        <Label htmlFor="plan" className="text-lg font-semibold text-zinc-100">
          Plan de Royalties
        </Label>
        <RadioGroup
          id="plan"
          value={plan}
          onValueChange={setPlan}
          className="space-y-4"
        >
          <Card className="overflow-hidden border-zinc-800 transition-all hover:shadow-md hover:shadow-indigo-900/10">
            <CardHeader className="pb-2 bg-gradient-to-r from-zinc-800/90 to-zinc-900 border-b border-zinc-800">
              <div className="flex items-center space-x-3">
                <RadioGroupItem
                  value="free"
                  id="free"
                  className="border-indigo-500 text-white data-[state=checked]:bg-indigo-600 data-[state=checked]:text-white"
                />
                <CardTitle>
                  <Label
                    htmlFor="free"
                    className="flex items-center text-lg cursor-pointer text-zinc-100 font-semibold"
                  >
                    <Zap className="mr-2 h-5 w-5 text-indigo-400" />
                    Plan Estándar
                  </Label>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="bg-gradient-to-br from-zinc-800/60 to-zinc-900/90 pt-3">
              <CardDescription className="text-zinc-400">
                <p className="font-medium">Distribución de royalties fija</p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                  <li>
                    <span className="text-indigo-400">
                      {FREE_PLAN_PLATFORM_FEE_PERCENTAGE * 100}%
                    </span>{" "}
                    para Tuneport
                  </li>
                  <li>
                    <span className="text-indigo-400">
                      {FREE_PLAN_ARTIST_FEE_PERCENTAGE * 100}%
                    </span>{" "}
                    para el artista
                  </li>
                  <li>
                    <span className="font-bold">Precio:</span> 2 USDC
                  </li>
                </ul>
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-zinc-800 transition-all hover:shadow-md hover:shadow-indigo-900/10">
            <CardHeader className="pb-2 bg-gradient-to-r from-zinc-800/90 to-zinc-900 border-b border-zinc-800">
              <div className="flex items-center space-x-3">
                <RadioGroupItem
                  value="premium"
                  id="premium"
                  className="border-indigo-500 text-white data-[state=checked]:bg-indigo-600 data-[state=checked]:text-white"
                />
                <CardTitle>
                  <Label
                    htmlFor="premium"
                    className="flex items-center text-lg cursor-pointer text-zinc-100 font-semibold"
                  >
                    <Sparkles className="mr-2 h-5 w-5 text-indigo-400" />
                    Plan Flexible
                  </Label>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="bg-gradient-to-br from-zinc-800/60 to-zinc-900/90 pt-3">
              <CardDescription className="text-zinc-400">
                <p className="font-medium">
                  Características y distribución personalizadas
                </p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                  <li>
                    <span className="text-indigo-400">
                      {PAID_PLAN_PLATFORM_FEE_PERCENTAGE * 100}%
                    </span>{" "}
                    para Tuneport
                  </li>
                  <li>
                    <span className="text-indigo-400">
                      {PAID_PLAN_ARTIST_FEE_PERCENTAGE * 100}%
                    </span>{" "}
                    para el artista
                  </li>
                  <li>Precio variable</li>
                </ul>
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-zinc-800 transition-all hover:shadow-md hover:shadow-indigo-900/10 opacity-80">
            <CardHeader className="pb-2 bg-gradient-to-r from-zinc-800/90 to-zinc-900 border-b border-zinc-800">
              <div className="flex items-center space-x-3">
                <RadioGroupItem
                  value="legendary"
                  id="legendary"
                  disabled
                  className="border-zinc-700 text-zinc-600"
                />
                <CardTitle>
                  <Label
                    htmlFor="legendary"
                    className="flex items-center text-lg cursor-pointer text-zinc-500 font-semibold"
                  >
                    <Crown className="mr-2 h-5 w-5 text-zinc-500" />
                    Plan Legendario (Próximamente)
                  </Label>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="bg-gradient-to-br from-zinc-800/60 to-zinc-900/90 pt-3">
              <CardDescription className="text-zinc-500">
                <p className="font-medium">
                  Características exclusivas y avanzadas
                </p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                  <li>Acceso a herramientas profesionales</li>
                  <li>Análisis avanzados</li>
                  <li>Funciones especiales exclusivas</li>
                </ul>
              </CardDescription>
            </CardContent>
          </Card>
        </RadioGroup>
      </div>
      {plan === "free" && (
        <div className="space-y-6 mt-4 rounded-xl p-4 bg-gradient-to-br from-zinc-900/90 to-zinc-900/80 border border-indigo-900/20">
          <div className="space-y-2">
            <Label
              htmlFor="symbol"
              className="text-sm font-medium text-zinc-200 flex items-center"
            >
              Símbolo NFT
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 ml-1.5 text-indigo-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-zinc-800 border-zinc-700 text-zinc-100">
                    <p>
                      El símbolo corto que identifica tu NFT (max 5 caracteres)
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input
              id="symbol"
              placeholder={tForms("symbolPlaceholder")}
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="bg-zinc-800/50 border-zinc-700 focus:border-indigo-600 text-zinc-100 placeholder:text-zinc-500"
              maxLength={5}
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="supply"
              className="text-sm font-medium text-zinc-200 flex items-center"
            >
              Cantidad de copias por item
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 ml-1.5 text-indigo-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-zinc-800 border-zinc-700 text-zinc-100">
                    <p>
                      Cantidad máxima de copias que se podrán crear (mint) de
                      cada track
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input
              id="supply"
              type="number"
              placeholder={tForms("maxSupplyPlaceholder")}
              value={maxSupply}
              onChange={(e) => setMaxSupply(e.target.value)}
              className="bg-zinc-800/50 border-zinc-700 focus:border-indigo-600 text-zinc-100 placeholder:text-zinc-500"
            />
          </div>
        </div>
      )}
      {plan === "premium" && (
        <div className="space-y-6 mt-4 rounded-xl p-4 bg-gradient-to-br from-zinc-900/90 to-zinc-900/80 border border-indigo-900/20">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Label
                htmlFor="blockchain"
                className="text-sm font-medium text-zinc-200 flex items-center"
              >
                Blockchain
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 ml-1.5 text-indigo-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-zinc-800 border-zinc-700 text-zinc-100">
                      <p>
                        Red blockchain donde se acuñarán los NFTs de música.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
            </div>
            <Select value={blockchain} onValueChange={setBlockchain}>
              <SelectTrigger
                className="bg-zinc-800/50 border-zinc-700 text-zinc-100 focus:ring-0 focus:ring-offset-0 focus:border-indigo-600"
                id="blockchain"
              >
                <SelectValue placeholder={tForms("selectBlockchain")}>
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
                    className="text-zinc-100 focus:bg-indigo-900/50 focus:text-zinc-100"
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
              <Label
                htmlFor="currency"
                className="text-sm font-medium text-zinc-200 flex items-center"
              >
                Moneda de Pago
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 ml-1.5 text-indigo-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-zinc-800 border-zinc-700 text-zinc-100">
                      <p>Moneda en la que se pagarán los NFTs</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
            </div>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger
                className="bg-zinc-800/50 border-zinc-700 text-zinc-100 focus:ring-0 focus:ring-offset-0 focus:border-indigo-600"
                id="currency"
              >
                <SelectValue placeholder={tForms("selectCurrency")}>
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
                    className="text-zinc-100 focus:bg-indigo-900/50 focus:text-zinc-100"
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
            <Label
              htmlFor="supply"
              className="text-sm font-medium text-zinc-200 flex items-center"
            >
              Cantidad de copias por item
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 ml-1.5 text-indigo-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-zinc-800 border-zinc-700 text-zinc-100">
                    <p>
                      Cantidad máxima de copias que se podrán crear (mint) de
                      cada track
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input
              id="maxSupply"
              type="number"
              placeholder={tForms("maxSupplyPlaceholder")}
              value={maxSupply}
              onChange={(e) => setMaxSupply(e.target.value)}
              className="bg-zinc-800/50 border-zinc-700 focus:border-indigo-600 text-zinc-100 placeholder:text-zinc-500"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="symbol"
              className="text-sm font-medium text-zinc-200 flex items-center"
            >
              Símbolo NFT
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 ml-1.5 text-indigo-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-zinc-800 border-zinc-700 text-zinc-100">
                    <p>
                      El símbolo corto que identifica tu NFT (max 5 caracteres)
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input
              id="symbol"
              placeholder={tForms("symbolPlaceholder")}
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="bg-zinc-800/50 border-zinc-700 focus:border-indigo-600 text-zinc-100 placeholder:text-zinc-500"
              maxLength={5}
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="price"
              className="text-sm font-medium text-zinc-200 flex items-center"
            >
              Precio por NFT
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 ml-1.5 text-indigo-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-zinc-800 border-zinc-700 text-zinc-100">
                    <p>Precio de cada copia en la moneda seleccionada</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <div className="relative">
              <Input
                id="price"
                type="number"
                step="0.000001"
                min="0"
                placeholder="0.5"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="bg-zinc-800/50 border-zinc-700 focus:border-indigo-600 text-zinc-100 placeholder:text-zinc-500 pr-12"
              />
              <div className="absolute right-2 top-2 text-zinc-400">
                {currency}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
