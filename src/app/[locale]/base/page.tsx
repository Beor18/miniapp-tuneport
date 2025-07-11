"use client";

import { useState, useEffect, Suspense } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth";
import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";
import { ethers } from "ethers";
import { baseSepolia, baseMainnet } from "@Src/lib/privy/networks";
import BaseNFTAbi from "@Src/lib/abi/BaseNFT.json";
import { Button } from "@Src/ui/components/ui/button";
import { Input } from "@Src/ui/components/ui/input";
import { Label } from "@Src/ui/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@Src/ui/components/ui/card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@Src/ui/components/ui/alert";
import {
  AlertCircle,
  CheckCircle,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  GiftIcon,
  ExternalLink,
  Coins,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { contracts } from "@Src/lib/constants/contracts";
import { Slider } from "@Src/ui/components/ui/slider";
import { usePlayer } from "@Src/contexts/PlayerContext";
import { encodeFunctionData } from "viem";
import { usePayment } from "@Src/contexts/PaymentContext";
import { default as importDynamic } from "next/dynamic";
// Importar hooks de Zora Coins
import { useZoraCoinCreation } from "@Src/lib/hooks/base/useZoraCoinCreation";
import { useZoraCoinTrading } from "@Src/lib/hooks/base/useZoraCoinTrading";

// Importación dinámica optimizada según las reglas del proyecto
const PaymentDialog = importDynamic(
  () => import("@Src/components/paymentDialog"),
  {
    ssr: false,
    loading: () => null,
  }
);

// NFT Contract Address in Base Sepolia
const NFT_CONTRACT_ADDRESS = contracts.baseSepoliaContracts.nft;

// Exportar configuración para NextJS
export const dynamic = "force-dynamic";

// Sample data for a music NFT
const demoSong = {
  _id: "song-1",
  name: "Proof Of Tester",
  artist: "Tuneport",
  artist_name: "tuneport",
  album: "Tuneport",
  coverArt:
    "https://fuchsia-voiceless-dragonfly-362.mypinata.cloud/ipfs/bafybeiaj77kxiudzwlqxxsqnivz4y7cwumh3u3mqyixf32vpl2tjhla4za", // We use a placeholder, ideally it would be a real image
  duration: "3:10",
  price: "FREE",
  genre: "Reggaeton",
  year: "2025",
  music:
    "https://fuchsia-voiceless-dragonfly-362.mypinata.cloud/ipfs/bafybeiajfscw5pt35ieavzccqpwcqzcd7r4ch43ltib2ma3xrytdgi7jzy", // Example audio URL
  image:
    "https://fuchsia-voiceless-dragonfly-362.mypinata.cloud/ipfs/bafybeiaj77kxiudzwlqxxsqnivz4y7cwumh3u3mqyixf32vpl2tjhla4za", // For player compatibility
  tokenURI:
    "https://fuchsia-voiceless-dragonfly-362.mypinata.cloud/ipfs/bafkreiefsev5j3elfsvocq3adqmd2iiti4gswev6b3r2szkpsc7na53xaa",
  // Agregamos datos para el coin
  symbol: "PROOF",
};

export default function BasePage() {
  const { authenticated, logout, user, login } = usePrivy();
  const { wallets } = useWallets();
  const { client } = useSmartWallets();
  const [recipient, setRecipient] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [baseWallet, setBaseWallet] = useState<any>(null);
  const [smartWallet, setSmartWallet] = useState<any>(null);
  const [showPlayer, setShowPlayer] = useState(false);

  // Estados para Zora Coins
  const [coinAddress, setCoinAddress] = useState<string | null>(null);
  const [showCoinSection, setShowCoinSection] = useState(false);

  // Hooks de Zora Coins
  const { createAutomaticCoin, isCreatingCoin } = useZoraCoinCreation();
  const { coinData, isTrading, getCoinData, buyCoin, sellCoin } =
    useZoraCoinTrading();

  // Estados para trading
  const [buyAmount, setBuyAmount] = useState("0.01");
  const [sellAmount, setSellAmount] = useState("100");

  // Access the player context
  const {
    setCurrentSong,
    setIsPlaying,
    setActivePlayerId,
    setShowFloatingPlayer,
    isPlaying,
    currentSong,
    currentTime,
    duration,
  } = usePlayer();

  // Access payment context
  const {
    setIsModalOpen,
    setSelectedTrack,
    setIsProcessing,
    setIsCompleted,
    setIsError,
    setErrorMessage,
    setTransactionHash: setPaymentTransactionHash,
  } = usePayment();

  // Find the wallet connected to Base Sepolia
  useEffect(() => {
    if (authenticated && wallets.length > 0) {
      // We need to handle the "eip155:" prefix in the chainId
      const targetChainId = baseMainnet.id.toString(); // 84532
      const targetChainIdWithPrefix = `eip155:${targetChainId}`;

      // Try to find a wallet connected to Base Sepolia or any wallet we can use
      const baseWallet = wallets.find((wallet) => {
        // Check both with and without prefix for compatibility
        return (
          wallet.chainId === targetChainId ||
          wallet.chainId === targetChainIdWithPrefix ||
          // Also look for any embedded wallet we can use
          wallet.walletClientType === "privy"
        );
      });

      if (baseWallet) {
        setBaseWallet(baseWallet);
        // Only set the address if it's empty or first load
        if (!recipient) {
          setRecipient(baseWallet.address);
        }
      }
    }
  }, [authenticated, wallets, recipient]);

  // Find or create a smart wallet when user connects
  useEffect(() => {
    if (authenticated && user) {
      // Look for smart wallet in user's linked accounts
      const userSmartWallet = user.linkedAccounts.find(
        (account) => account.type === "smart_wallet"
      );

      if (userSmartWallet) {
        //console.log("Smart wallet found:", userSmartWallet.address);
        setSmartWallet(userSmartWallet);
      }
    }
  }, [authenticated, user]);

  // Cargar datos del coin si existe una dirección
  useEffect(() => {
    if (coinAddress) {
      getCoinData(coinAddress);
    }
  }, [coinAddress, getCoinData]);

  // Función para crear el coin de la canción
  const createSongCoin = async () => {
    if (!baseWallet?.address) {
      setError("Please connect your wallet first");
      return;
    }

    try {
      setError(null);

      const coinParams = {
        albumName: demoSong.name,
        albumSymbol: demoSong.symbol,
        albumImageUrl: demoSong.coverArt,
        artistAddress: baseWallet.address,
      };

      console.log("🪙 Creating coin for song:", coinParams);

      const newCoinAddress = await createAutomaticCoin(coinParams);

      if (newCoinAddress) {
        setCoinAddress(newCoinAddress);
        setShowCoinSection(true);
        console.log("✅ Coin created:", newCoinAddress);
      }
    } catch (error: any) {
      console.error("❌ Error creating coin:", error);
      setError(error.message || "Error creating coin");
    }
  };

  // Función para comprar tokens
  const handleBuyCoin = async () => {
    if (!coinAddress) return;

    const amount = parseFloat(buyAmount);
    if (amount > 0) {
      const result = await buyCoin(
        "0xe4d2a1f49ab87eebc53a3d9d706449e8fe066566",
        amount
      );
      if (result.status === "success") {
        setBuyAmount("0.01");
      }
    }
  };

  // Función para vender tokens
  const handleSellCoin = async () => {
    if (!coinAddress) return;

    const amount = parseFloat(sellAmount);
    if (amount > 0) {
      const result = await sellCoin(
        "0xe4d2a1f49ab87eebc53a3d9d706449e8fe066566",
        amount
      );
      if (result.status === "success") {
        setSellAmount("100");
      }
    }
  };

  const handlePlayClick = () => {
    // Play the song using the player context
    if (currentSong?._id === demoSong._id) {
      // If this song is already loaded, toggle playback
      setIsPlaying(!isPlaying);
    } else {
      // If it's another song, load this one
      setCurrentSong(demoSong);
      setActivePlayerId(demoSong._id);
      setIsPlaying(true);
    }
    setShowFloatingPlayer(true);
    setShowPlayer(true);
  };

  const handleClaimClick = () => {
    // Preparar los datos completos de la canción para el modal
    const completeTrackData = {
      ...demoSong,
      _id: demoSong._id,
      id: demoSong._id, // Formato alternativo
      name: demoSong.name,
      title: demoSong.name, // Formato alternativo
      artist: demoSong.artist,
      artist_name: demoSong.artist_name,
      artistName: demoSong.artist_name, // Formato alternativo
      image: demoSong.image,
      coverUrl: demoSong.coverArt, // Formato alternativo
      imageUrl: demoSong.coverArt,
      price: demoSong.price ? parseFloat(demoSong.price.split(" ")[0]) : 0,
      mint_price: demoSong.price ? parseFloat(demoSong.price.split(" ")[0]) : 0, // Formato alternativo
      currency: demoSong.price ? demoSong.price.split(" ")[1] : "BASE",
      mint_currency: demoSong.price ? demoSong.price.split(" ")[1] : "BASE", // Formato alternativo

      // Propiedades críticas que DEBEN existir para que PaymentDialog no falle
      addressCollection: NFT_CONTRACT_ADDRESS,
      address_collection: NFT_CONTRACT_ADDRESS, // Formato que espera el componente de Solana
      candyMachine: NFT_CONTRACT_ADDRESS,
      candy_machine: NFT_CONTRACT_ADDRESS, // Formato que espera el componente de Solana

      artist_address_mint:
        recipient ||
        smartWallet?.address ||
        "0x0000000000000000000000000000000000000000",
      startDate: new Date().toISOString(),
      start_mint_date: new Date().toISOString(), // Formato alternativo
      tokenURI: demoSong.tokenURI,
      music: demoSong.music, // Importante para reproducción en el diálogo
    };

    //console.log("Datos preparados para PaymentDialog:", completeTrackData);

    // Resetear los estados del contexto de pago antes de abrir el modal
    setIsProcessing(false);
    setIsCompleted(false);
    setIsError(false);
    setErrorMessage("");
    setTransactionHash(null);

    // Abrir el diálogo de pago con los datos de la canción
    setSelectedTrack(completeTrackData);
    setIsModalOpen(true);
  };

  const mintNFT = async () => {
    // Verify first that a smart wallet and client exist
    if (!client) {
      throw new Error("No smart wallet client available");
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      // console.log("Preparing NFT transaction with Smart Wallet:", {
      //   contract: NFT_CONTRACT_ADDRESS,
      //   recipient: recipient,
      //   tokenURI: demoSong.tokenURI,
      // });

      // Define simplified ABI for the mintNFT function
      const mintAbi = [
        {
          inputs: [
            { name: "recipient", type: "address" },
            { name: "tokenURI", type: "string" },
          ],
          name: "mintNFT",
          outputs: [{ name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function",
        },
      ];

      // UI options for the transaction
      const uiOptions = {
        title: "Mint Music NFT",
        description: "Minting an NFT of the song using your smart wallet",
        buttonText: "Confirm Minting",
      };

      // Send transaction using the smart wallet client and viem directly
      const txHash = await client.sendTransaction(
        {
          to: NFT_CONTRACT_ADDRESS as `0x${string}`,
          data: encodeFunctionData({
            abi: mintAbi,
            functionName: "mintNFT",
            args: [recipient as `0x${string}`, demoSong.tokenURI],
          }),
          value: BigInt(0),
        },
        { uiOptions }
      );

      //console.log("Transaction sent successfully!", txHash);
      if (typeof txHash === "string") {
        // Save the complete hash
        setSuccess(`NFT minted successfully!`);
        setTransactionHash(txHash);
        setPaymentTransactionHash(txHash);
      } else {
        setSuccess(`NFT minted successfully! Processing transaction...`);
      }

      return txHash; // Return hash for use in payment component
    } catch (err: any) {
      console.error("Error minting NFT with smart wallet:", err);

      // Improve error message
      let errorMessage = "Error minting the NFT";

      if (err.message) {
        if (err.message.includes("paymaster") || err.message.includes("pm_")) {
          errorMessage =
            "Error with paymaster service. Possible solutions: 1) Use normal mode if you have ETH, 2) Try again later when the paymaster is available.";
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      throw err; // Important: propagate error to handle in PaymentDialog
    } finally {
      setIsLoading(false);
    }
  };

  const mintNFTDirecto = async () => {
    try {
      // Show loading state
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      // Validate that we have the necessary data
      if (!recipient) {
        throw new Error("Recipient address is required");
      }

      if (!client) {
        throw new Error("No smart wallet client available");
      }

      // console.log("Preparing direct minting with Smart Wallet:", {
      //   contract: NFT_CONTRACT_ADDRESS,
      //   recipient: recipient,
      //   tokenURI: demoSong.tokenURI,
      // });

      // Define simplified ABI for the mintNFT function
      const mintAbi = [
        {
          inputs: [
            { name: "recipient", type: "address" },
            { name: "tokenURI", type: "string" },
          ],
          name: "mintNFT",
          outputs: [{ name: "", type: "uint256" }],
          stateMutability: "nonpayable",
          type: "function",
        },
      ];

      // UI options for the transaction
      const uiOptions = {
        title: "Direct NFT Minting",
        description: "Minting an NFT of the song directly",
        buttonText: "Confirm Minting",
      };

      // Send transaction using the smart wallet client and viem directly
      const txHash = await client.sendTransaction(
        {
          to: NFT_CONTRACT_ADDRESS as `0x${string}`,
          data: encodeFunctionData({
            abi: mintAbi,
            functionName: "mintNFT",
            args: [recipient as `0x${string}`, demoSong.tokenURI],
          }),
          value: BigInt(0),
        },
        { uiOptions }
      );

      //console.log("Transaction sent successfully!", txHash);
      if (typeof txHash === "string") {
        // Save the complete hash
        setSuccess(`NFT minted successfully!`);
        setTransactionHash(txHash);
        setPaymentTransactionHash(txHash);
      } else {
        setSuccess(`NFT minted successfully! Processing transaction...`);
      }

      return txHash;
    } catch (err: any) {
      console.error("Error in direct minting:", err);

      // Show a useful error message
      let errorMessage = "Error minting the NFT";
      if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to open transaction link in new tab
  const openTransactionLink = (hash: string) => {
    const url = `https://basescan.org/tx/${hash}`;
    window.open(url, "_blank");
  };

  // Function to handle direct minting (for compatibility with FloatingPlayer)
  const handleMintDirecto = () => {
    console.log("Minting NFT directly", recipient);
    mintNFTDirecto().catch((err) => {
      console.error("Error in handleMintDirecto:", err);
    });
  };

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        {/* Two-column layout container */}
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left column */}
          <div className="flex flex-col space-y-6">
            {/* Music card */}
            <Card className="w-full bg-zinc-800 border-zinc-700">
              <CardContent className="p-0">
                <div className="flex flex-col">
                  {/* Music thumbnail */}
                  <div className="relative bg-black aspect-square w-full flex justify-center items-center">
                    <img
                      src={demoSong.coverArt}
                      alt="Cover art"
                      className="h-full w-full object-contain"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute inset-0 m-auto bg-black hover:bg-black/80 rounded-full h-16 w-16 flex items-center justify-center opacity-60 cursor-not-allowed"
                      disabled={true}
                    >
                      <Play className="h-8 w-8 text-white/70" />
                    </Button>
                  </div>

                  {/* Song information */}
                  <div className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-lg font-bold text-white">
                          {demoSong.name}
                        </p>
                        <p className="text-sm text-gray-300">
                          {demoSong.artist}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">
                          {demoSong.price}
                        </p>
                        <p className="text-xs text-gray-300">Price</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features list card */}
            <Card className="w-full bg-zinc-800 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Features</CardTitle>
                <CardDescription className="text-zinc-400">
                  Complete music tokenization with NFTs and tradeable tokens
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-medium text-white">
                        Zora Token Creation
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Create tradeable tokens for songs with instant liquidity
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-medium text-white">
                        Integrated with Base
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Mint NFTs directly on Base Mainnet
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-medium text-white">
                        Integrated with Privy
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Smart wallet and embedded wallet support
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-purple-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-medium text-white">
                        Paymaster & Gas Sponsoring
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Gasless transactions for a better user experience
                      </p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="flex flex-col space-y-6">
            {/* Create Token card */}
            <Card className="w-full bg-zinc-800 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Coins className="h-5 w-5 text-yellow-500" />
                  Create Song Token
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Create a tradeable token for this song using Zora
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-zinc-300">
                    Token Symbol:{" "}
                    <span className="font-mono text-yellow-400">
                      ${demoSong.symbol}
                    </span>
                  </p>
                  <p className="text-sm text-zinc-300">
                    Token Name:{" "}
                    <span className="text-white">{demoSong.name} Coin</span>
                  </p>
                </div>

                <Alert className="bg-blue-950 border-blue-800 mt-4">
                  <AlertCircle className="h-4 w-4 text-blue-400" />
                  <AlertTitle className="text-blue-400">
                    Wallet not connected
                  </AlertTitle>
                  <AlertDescription className="text-blue-200">
                    Connect to create and trade tokens
                  </AlertDescription>
                </Alert>

                <Button
                  variant="default"
                  size="lg"
                  className="w-full bg-yellow-600/50 text-white/70 cursor-not-allowed"
                  disabled={true}
                >
                  <div className="flex gap-2 items-center justify-center">
                    <Coins className="h-5 w-5" />
                    <span className="font-medium">Connect your wallet</span>
                  </div>
                </Button>
              </CardContent>
            </Card>

            {/* Mint NFT card */}
            <Card className="w-full bg-zinc-800 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Mint NFT on Base</CardTitle>
                <CardDescription className="text-zinc-400">
                  Acquire this song as NFT on Base Mainnet
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="recipient" className="text-zinc-200">
                    Destination Address
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="recipient"
                      value={recipient}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setRecipient(e.target.value)
                      }
                      placeholder="0x..."
                      className="bg-zinc-700 border-zinc-600 text-white flex-grow"
                    />
                  </div>
                  <p className="text-xs text-zinc-400 italic mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 inline" />
                    You can modify this address to send the NFT to another
                    wallet
                  </p>
                </div>

                <Alert className="bg-blue-950 border-blue-800 mt-4">
                  <AlertCircle className="h-4 w-4 text-blue-400" />
                  <AlertTitle className="text-blue-400">
                    Wallet not connected
                  </AlertTitle>
                  <AlertDescription className="text-blue-200">
                    Connect to play and acquire NFTs
                  </AlertDescription>
                </Alert>

                <Button
                  variant="default"
                  size="lg"
                  className="w-full bg-green-600/50 text-white/70 cursor-not-allowed"
                  disabled={true}
                >
                  <div className="flex gap-2 items-center justify-center">
                    <GiftIcon className="h-5 w-5" />
                    <span className="font-medium">Connect your wallet</span>
                  </div>
                </Button>
              </CardContent>
            </Card>

            {/* How it works card */}
            <Card className="w-full bg-zinc-800 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">How it Works</CardTitle>
                <CardDescription className="text-zinc-400">
                  Understanding tokens, NFTs, and gasless transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm text-zinc-300">
                  <div>
                    <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                      <Coins className="h-4 w-4 text-yellow-500" />
                      Zora Tokens
                    </h4>
                    <p>
                      Create tradeable tokens for songs using Zora&apos;s
                      infrastructure. Each token represents ownership and can be
                      traded with instant liquidity. Perfect for fan engagement
                      and artist monetization.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                      <GiftIcon className="h-4 w-4 text-green-500" />
                      Gasless NFTs
                    </h4>
                    <p>
                      This demo uses Privy Smart Accounts to create an embedded
                      wallet that can mint NFTs on Base Mainnet without
                      requiring users to have ETH for gas fees.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-blue-500" />
                      Smart Wallets
                    </h4>
                    <p>
                      The gas fees are sponsored by a paymaster service,
                      allowing for a seamless Web2-like experience while
                      interacting with blockchain technology.
                    </p>
                  </div>

                  <div className="border-t border-zinc-700 pt-3 mt-3 space-y-2">
                    <p className="text-xs text-zinc-400">
                      NFT contract:{" "}
                      <code className="text-xs bg-zinc-700 px-1 py-0.5 rounded">
                        {NFT_CONTRACT_ADDRESS}
                      </code>
                    </p>
                    <p className="text-xs text-zinc-400">
                      Powered by: Privy Smart Accounts + Zora Protocol + Base
                      Network
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {/* Two-column layout container */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left column */}
        <div className="flex flex-col space-y-6">
          {/* Music card */}
          <Card className="w-full bg-zinc-800 border-zinc-700">
            <CardContent className="p-0">
              <div className="flex flex-col">
                {/* Music thumbnail */}
                <div className="relative bg-black aspect-square w-full flex justify-center items-center">
                  <img
                    src={demoSong.coverArt}
                    alt="Cover art"
                    className="h-full w-full object-contain"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute inset-0 m-auto bg-black hover:bg-black rounded-full h-16 w-16 flex items-center justify-center"
                    onClick={handlePlayClick}
                  >
                    <Play className="h-8 w-8 text-white" />
                  </Button>
                </div>

                {/* Song information */}
                <div className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-lg font-bold text-white">
                        {demoSong.name}
                      </p>
                      <p className="text-sm text-gray-300">{demoSong.artist}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">
                        {demoSong.price}
                      </p>
                      <p className="text-xs text-gray-300">Price</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features list card */}
          <Card className="w-full bg-zinc-800 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white">Features</CardTitle>
              <CardDescription className="text-zinc-400">
                NFT minting with Privy Smart Accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-white">
                      Integrated with Base
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Mint NFTs directly on Base Mainnet
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-white">
                      Integrated with Privy
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Smart wallet and embedded wallet support
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-white">
                      Paymaster & Gas Sponsoring
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Gasless transactions for a better user experience
                    </p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="flex flex-col space-y-6">
          {/* Create Coin card */}
          <Card className="w-full bg-zinc-800 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Coins className="h-5 w-5 text-yellow-500" />
                Create Song Token
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Create a tradeable token for this song using Zora
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!coinAddress ? (
                <>
                  <div className="space-y-2">
                    <p className="text-sm text-zinc-300">
                      Token Symbol:{" "}
                      <span className="font-mono text-yellow-400">
                        ${demoSong.symbol}
                      </span>
                    </p>
                    <p className="text-sm text-zinc-300">
                      Token Name:{" "}
                      <span className="text-white">{demoSong.name} Coin</span>
                    </p>
                  </div>

                  <Button
                    variant="default"
                    size="lg"
                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                    onClick={createSongCoin}
                    disabled={!smartWallet || isCreatingCoin}
                  >
                    <div className="flex gap-2 items-center justify-center">
                      <Coins className="h-5 w-5" />
                      <span className="font-medium">
                        {isCreatingCoin ? "Creating Token..." : "Create Token"}
                      </span>
                    </div>
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  {/* Token Info */}
                  <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-yellow-400">
                        Token Created!
                      </h4>
                      <span className="text-xs bg-yellow-700/30 text-yellow-300 px-2 py-1 rounded">
                        ${demoSong.symbol}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 font-mono break-all">
                      {coinAddress}
                    </p>
                  </div>

                  {/* Trading Section */}
                  <div className="space-y-3">
                    <h5 className="text-sm font-medium text-white">
                      Trade Token
                    </h5>

                    {/* Buy Section */}
                    <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-green-400" />
                        <span className="text-sm font-medium text-green-400">
                          Buy
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={buyAmount}
                          onChange={(e) => setBuyAmount(e.target.value)}
                          placeholder="0.01"
                          className="bg-zinc-700 border-zinc-600 text-white text-sm"
                        />
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={handleBuyCoin}
                          disabled={isTrading}
                        >
                          Buy ETH
                        </Button>
                      </div>
                    </div>

                    {/* Sell Section */}
                    {coinData && parseFloat(coinData.userBalance) > 0 && (
                      <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-red-400 rotate-180" />
                          <span className="text-sm font-medium text-red-400">
                            Sell
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            value={sellAmount}
                            onChange={(e) => setSellAmount(e.target.value)}
                            placeholder="100"
                            className="bg-zinc-700 border-zinc-600 text-white text-sm"
                          />
                          <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700"
                            onClick={handleSellCoin}
                            disabled={isTrading}
                          >
                            Sell
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Token Stats */}
                    {coinData && (
                      <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-3">
                        <h6 className="text-xs font-medium text-zinc-400 mb-2">
                          Your Balance
                        </h6>
                        <p className="text-sm text-white">
                          {parseFloat(coinData.userBalance).toFixed(2)} $
                          {demoSong.symbol}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mint NFT card */}
          <Card className="w-full bg-zinc-800 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white">Mint NFT on Base</CardTitle>
              <CardDescription className="text-zinc-400">
                Acquire this song as NFT on Base Mainnet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="recipient"
                  className="text-zinc-200 flex items-center justify-between"
                >
                  <span>Destination Address</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="recipient"
                    value={recipient}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setRecipient(e.target.value)
                    }
                    placeholder="0x..."
                    className="bg-zinc-700 border-zinc-600 text-white flex-grow"
                  />
                </div>
                <p className="text-xs text-zinc-400 italic mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 inline" />
                  You can modify this address to send the NFT to another wallet
                </p>
              </div>

              {error && (
                <Alert
                  variant="destructive"
                  className="bg-red-950 border-red-800 mt-4"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-950 border-green-800 mt-4 overflow-hidden animate-fadeIn">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0 animate-pulse" />
                    <div className="ml-3 w-full">
                      <AlertTitle className="text-green-400 font-semibold text-lg mb-2">
                        NFT Minted Successfully!
                      </AlertTitle>
                      <AlertDescription className="text-green-200">
                        <p className="mb-2">{success}</p>
                        {transactionHash && (
                          <div className="mt-3 pt-3 border-t border-green-800 animate-slideUp">
                            <div className="flex flex-col gap-2">
                              <p className="text-sm text-green-300 flex items-center">
                                <span className="mr-2">Transaction ID:</span>
                                <span className="bg-green-800/30 text-xs px-1 py-0.5 rounded">
                                  Base Mainnet
                                </span>
                              </p>
                              <div
                                className="flex items-center justify-between p-3 bg-green-900/50 rounded-md cursor-pointer hover:bg-green-800/50 transition-colors border border-green-700/30"
                                onClick={() =>
                                  openTransactionLink(transactionHash)
                                }
                              >
                                <code className="text-xs text-green-200 font-mono overflow-auto break-all">
                                  {transactionHash}
                                </code>
                                <ExternalLink className="h-4 w-4 text-green-400 ml-2 flex-shrink-0" />
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2 text-xs bg-green-800 hover:bg-green-700 text-white border-green-700 w-full flex items-center justify-center transition-transform hover:translate-y-[-2px]"
                                onClick={() =>
                                  openTransactionLink(transactionHash)
                                }
                              >
                                <ExternalLink className="h-3.5 w-3.5 mr-2" />
                                View in block explorer
                              </Button>
                            </div>
                          </div>
                        )}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              )}

              <Button
                variant="default"
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={mintNFT}
                disabled={!smartWallet || isLoading}
              >
                <div className="flex gap-2 items-center justify-center">
                  <GiftIcon className="h-5 w-5" />
                  <span className="font-medium">
                    {isLoading ? "Processing..." : "Mint NFT"}
                  </span>
                </div>
              </Button>
            </CardContent>
          </Card>

          {/* How it works card */}
          <Card className="w-full bg-zinc-800 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white">How it Works</CardTitle>
              <CardDescription className="text-zinc-400">
                Understanding tokens, NFTs, and gasless transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm text-zinc-300">
                <div>
                  <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                    <Coins className="h-4 w-4 text-yellow-500" />
                    Zora Tokens
                  </h4>
                  <p>
                    Create tradeable tokens for songs using Zora&apos;s
                    infrastructure. Each token represents ownership and can be
                    traded with instant liquidity. Perfect for fan engagement
                    and artist monetization.
                  </p>
                </div>

                <div>
                  <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                    <GiftIcon className="h-4 w-4 text-green-500" />
                    Gasless NFTs
                  </h4>
                  <p>
                    This demo uses Privy Smart Accounts to create an embedded
                    wallet that can mint NFTs on Base Mainnet without requiring
                    users to have ETH for gas fees.
                  </p>
                </div>

                <div>
                  <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-blue-500" />
                    Smart Wallets
                  </h4>
                  <p>
                    The gas fees are sponsored by a paymaster service, allowing
                    for a seamless Web2-like experience while interacting with
                    blockchain technology.
                  </p>
                </div>

                <div className="border-t border-zinc-700 pt-3 mt-3 space-y-2">
                  <p className="text-xs text-zinc-400">
                    NFT contract:{" "}
                    <code className="text-xs bg-zinc-700 px-1 py-0.5 rounded">
                      {NFT_CONTRACT_ADDRESS}
                    </code>
                  </p>
                  <p className="text-xs text-zinc-400">
                    Powered by: Privy Smart Accounts + Zora Protocol + Base
                    Network
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Player bar (shown only when activated) */}
      <Suspense fallback={null}>
        {showPlayer && (
          <div className="fixed bottom-0 left-0 right-0 bg-black p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={demoSong.image} alt="Cover" className="h-10 w-10" />
              <div>
                <p className="text-sm font-medium text-white">
                  {demoSong.name}
                </p>
                <p className="text-xs text-gray-400">{demoSong.artist}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <SkipBack className="h-5 w-5 text-white" />
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-white text-black h-8 w-8 p-0 flex items-center justify-center"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <SkipForward className="h-5 w-5 text-white" />
            </div>

            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700"
                onClick={handleMintDirecto}
                disabled={!smartWallet || isLoading}
              >
                <GiftIcon className="h-4 w-4 text-zinc-400 group-hover:text-white transition-colors" />
                <span className="text-sm font-medium">
                  {isLoading ? "Processing..." : "Claim NFT"}
                </span>
              </Button>
            </div>
          </div>
        )}

        {authenticated && (
          <PaymentDialog
            onConfirmClaim={async (track) => {
              try {
                setIsProcessing(true);
                if (!recipient && track.artist_address_mint) {
                  setRecipient(track.artist_address_mint);
                }
                await mintNFT();
                setIsProcessing(false);
                setIsCompleted(true);
                return Promise.resolve();
              } catch (error) {
                console.error("❌ Error executing mintNFT:", error);
                setIsProcessing(false);
                setIsError(true);
                setErrorMessage(
                  error instanceof Error
                    ? error.message
                    : "Unknown error while minting NFT"
                );
                throw error;
              }
            }}
          />
        )}
      </Suspense>
    </div>
  );
}
