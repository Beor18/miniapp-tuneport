import { usePrivy, useWallets, useFundWallet } from "@privy-io/react-auth";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@Src/ui/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@Src/ui/components/ui/dropdown-menu";
import { Coins, LogOut, Copy, User, Link as LinkIcon } from "lucide-react";
import { base, baseSepolia } from "viem/chains";
import { useState, useEffect } from "react";
import { usePlayer } from "@Src/contexts/PlayerContext";
import Link from "next/link";
import { useUnifiedAccount } from "@Src/lib/hooks/useUnifiedAccount";

interface CustomUserPillProps {
  handleLogout: () => void;
  profile?: any;
  locale?: string;
  userNickname?: string;
}

export function CustomUserPill({
  handleLogout,
  profile,
  locale = "en",
  userNickname,
}: CustomUserPillProps) {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const { fundWallet } = useFundWallet();

  // 🆕 FARCASTER: Obtener datos de Farcaster del usuario
  const { farcasterConnected, farcasterData } = useUnifiedAccount();

  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hostname, setHostname] = useState<string>("");

  // Player context para limpiar al hacer logout
  const {
    setIsPlaying,
    setCurrentSong,
    setShowFloatingPlayer,
    audioRef,
    clearPlaylist,
  } = usePlayer();

  // Effect para manejar el mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Determinar la cadena correcta según el entorno
  const getChain = () => {
    return isMainnet ? base : baseSepolia;
  };

  // Si no está mounted o no hay wallet, no mostrar nada
  if (!mounted || !ready || !authenticated || !wallets[0]) {
    return null;
  }

  const address =
    user?.wallet?.walletClientType === "metamask"
      ? user?.wallet?.address
      : wallets[0].address;
  const short = `${address.slice(0, 6)}...${address.slice(-4)}`;

  const handleFund = () => {
    fundWallet(address, {
      chain: base,
      amount: "0.01",
    });
  };

  const handleCopyAddress = async () => {
    try {
      if (typeof window !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error("Error copying address:", error);
    }
  };

  // 🆕 FARCASTER: Función para manejar la vinculación de Farcaster
  const handleLinkFarcaster = () => {
    console.log("Link Farcaster functionality - use Privy login flow");
  };

  const handleLogoutWithPlayerCleanup = async () => {
    try {
      // Parar completamente el audio antes del logout
      if (audioRef?.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      // Limpiar completamente el estado del player
      setIsPlaying(false);
      setCurrentSong(null);
      setShowFloatingPlayer(false);
      clearPlaylist();

      // Hacer logout
      await handleLogout();
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center bg-neutral-800/80 rounded-2xl sm:pr-3 sm:gap-2 border border-neutral-700 cursor-pointer hover:shadow-md transition-shadow">
          <Avatar className="h-8 w-8 ring-2 ring-[#ffffff]">
            <AvatarImage
              src={
                farcasterConnected && farcasterData?.pfp
                  ? farcasterData.pfp
                  : profile?.picture ||
                    `https://avatar.iran.liara.run/username?username=${
                      profile?.name || "User"
                    }`
              }
              alt="avatar"
            />
            <AvatarFallback>{address.slice(2, 4).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="text-neutral-200 font-medium text-xs tracking-wider hidden sm:block">
            {short}
          </span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-44 bg-neutral-900 border border-neutral-800"
      >
        {/* 🆕 FARCASTER: Mostrar estado de Farcaster */}
        {farcasterConnected && farcasterData ? (
          <>
            <div className="px-2 py-1.5 text-sm font-medium">
              <div className="flex items-center gap-2">
                <img
                  src={farcasterData.pfp || "/default-avatar.png"}
                  alt="Farcaster PFP"
                  className="w-6 h-6 rounded-full"
                />
                <div className="flex flex-col">
                  <span className="text-neutral-300 text-xs">✓ Farcaster</span>
                  <span className="text-neutral-400 text-xs">
                    @{farcasterData.username}
                  </span>
                </div>
              </div>
            </div>
            <DropdownMenuSeparator className="border-neutral-700" />
          </>
        ) : (
          <>
            <DropdownMenuItem
              onClick={handleLinkFarcaster}
              className="
                group flex items-center cursor-pointer
                text-neutral-300
                hover:!text-neutral-100
                hover:bg-neutral-800/80
                focus:bg-neutral-800/80
                 border-b border-neutral-700
                transition
              "
            >
              <LinkIcon className="mr-2 h-4 w-4 text-neutral-300 group-hover:!text-neutral-100 transition" />
              Connect Farcaster
            </DropdownMenuItem>
          </>
        )}

        {/* Perfil del usuario si tiene nickname */}
        {userNickname && (
          <>
            <DropdownMenuItem
              asChild
              className="
            group flex items-center cursor-pointer
            text-neutral-300
            hover:!text-neutral-100
            hover:bg-neutral-800/80
            focus:bg-neutral-800/80
            sm:hidden
            text-xs
            font-mono
            border-b border-neutral-700
            mb-1
           
          "
            >
              <Link href={`/${locale}/u/${userNickname}`}>
                <User className="mr-2 h-4 w-4 text-neutral-300 group-hover:!text-neutral-100 transition" />
                View Profile
              </Link>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuItem
          className="
            group flex items-center justify-between cursor-pointer
            text-neutral-300
            hover:!text-neutral-100
            hover:bg-neutral-800/80
            focus:bg-neutral-800/80
            sm:hidden
            text-xs
            font-mono
            border-b border-neutral-700
            mb-1
            px-3 py-2
          "
          onClick={handleCopyAddress}
        >
          <span className="truncate">{short}</span>
          <Copy
            className={`w-3 h-3 ml-2 flex-shrink-0 transition ${
              copied
                ? "text-green-400"
                : "text-neutral-300 group-hover:text-neutral-100"
            }`}
          />
        </DropdownMenuItem>
        <DropdownMenuItem
          className="
      group flex items-center gap-2 cursor-pointer
      text-neutral-300
      hover:!text-neutral-100
      hover:bg-neutral-800/80
      focus:bg-neutral-800/80
      transition
    "
          onClick={handleFund}
        >
          <Coins className="w-4 h-4 mr-2 text-neutral-300 group-hover:!text-neutral-100 transition" />
          Add funds
        </DropdownMenuItem>
        <DropdownMenuItem
          className="
      group flex items-center gap-2 cursor-pointer
      text-red-400
      hover:!text-red-300
      hover:bg-neutral-800/80
      focus:bg-neutral-800/80
      transition
    "
          onClick={handleLogoutWithPlayerCleanup}
        >
          <LogOut className="w-4 h-4 mr-2 text-red-400 group-hover:!text-red-300 transition" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
