"use client";

import { useState, useEffect, Suspense, useMemo, useContext } from "react";
import { default as importDynamic } from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@Src/ui/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@Src/ui/components/ui/collapsible";

import {
  Bell,
  History,
  Settings,
  Activity,
  LogOut,
  Home,
  HeartIcon,
  Music,
  Store,
  User,
  Search,
  Menu,
  Music2Icon,
  ChevronLeft,
  ChevronRight,
  Plus,
  ShareIcon,
  MedalIcon,
  Trophy,
} from "lucide-react";
import BaseAlbumNewForm from "@Src/components/BaseAlbumNewForm";
import { useAppKitAccount } from "@Src/lib/privy";
import WalletConnector from "@Src/components/walletConector";
import LanguageSelector from "@Src/components/LanguageSelector";
import { useTranslations, useLocale } from "next-intl";
import { usePlayer } from "@Src/contexts/PlayerContext";
import { UserRegistrationContext, MiniAppContext } from "@Src/app/providers";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

// 🎯 PASO 3: Declarar tipo global para leer detección del layout
declare global {
  interface Window {
    __MINIAPP_DETECTED__?: boolean;
  }
}

// Importación dinámica optimizada con loading: () => null
const FloatingPlayer = importDynamic(() => import("../FloatingPlayer"), {
  ssr: false,
  loading: () => null, // Sin loading state visible
});

interface MockUser {
  name: string;
  email: string;
  address: string;
  address_solana: string;
  key_solana: string;
  phase: string;
  key: string;
  nickname: string;
  biography: string;
  twitter: string;
  private_account: boolean;
  picture: string;
  verified: boolean;
  type: string;
}

interface HomeLayoutProps {
  children: React.ReactNode;
  mockUsers: MockUser[];
}

function BaseIcon(props: any) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 146 146"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="73" cy="73" r="73" fill="currentColor" />
      <path
        d="M73.323 123.729C101.617 123.729 124.553 100.832 124.553 72.5875C124.553 44.343 101.617 21.4463 73.323 21.4463C46.4795 21.4463 24.4581 42.0558 22.271 68.2887H89.9859V76.8864H22.271C24.4581 103.119 46.4795 123.729 73.323 123.729Z"
        fill="white"
        opacity="0.9"
      />
    </svg>
  );
}

const getNavItems = (
  publicKey: any,
  userNickname: string | null,
  userType: string | null,
  tNav: any,
  locale: string,
  tCommon: any
) => {
  // Siempre mostrar los elementos básicos de navegación
  const baseItems = [
    {
      href: `/${locale}/foryou`,
      icon: Music2Icon,
      label: tNav("forYou"),
      type: "link",
    },
    {
      href: `/${locale}/social-feed`,
      icon: Trophy,
      label: "Leaderboard",
      type: "link",
    },
  ];

  // Solo añadir Create si el usuario es artista Y está conectado
  if (publicKey?.toString() && userType === "artist") {
    baseItems.push({
      href: "#",
      icon: Plus,
      label: tCommon("create"),
      type: "create",
    });
  }

  // Siempre añadir el perfil al final
  baseItems.push({
    href: userNickname ? `/${locale}/u/${userNickname}` : `/${locale}/u`,
    icon: User,
    label: tNav("profile"),
    type: "link",
  });

  return baseItems;
};

export default function HomeLayout({ children, mockUsers }: HomeLayoutProps) {
  const [loading, setLoading] = useState(false);
  const [userNickname, setUserNickname] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const { userData, isRegistered } = useContext(UserRegistrationContext);
  const { isMiniApp, setIsMiniApp } = useContext(MiniAppContext);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [hostname, setHostname] = useState<string>("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { address, isConnected, caipAddress, status, embeddedWalletInfo } =
    useAppKitAccount();

  // 🎯 INICIALIZACIÓN MINIKIT (siguiendo documentación oficial de Base)
  const { setFrameReady, isFrameReady } = useMiniKit();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 🎯 DETECCIÓN SEGÚN PATRÓN OFICIAL DE BASE
    const isInIframe = window.parent !== window;

    console.log("🔍 BASE OFFICIAL - MiniKit Detection:", {
      isInIframe,
      isFrameReady,
      userAgent: navigator?.userAgent?.substring(0, 50),
    });

    if (isInIframe) {
      console.log("✅ Mini App detectada! Inicializando MiniKit...");
      setIsMiniApp(true);

      // 🎯 INICIALIZAR MINIKIT según documentación oficial
      if (!isFrameReady) {
        console.log("🎯 Llamando setFrameReady()...");
        setFrameReady();
      }
    } else {
      console.log("❌ No es Mini App");
      setIsMiniApp(false);
    }
  }, [setFrameReady, isFrameReady, setIsMiniApp]);

  // Hook del reproductor para verificar el estado real
  const { currentSong, showFloatingPlayer } = usePlayer();

  // Memoizar las traducciones para evitar re-renders
  const tCommon = useTranslations("common");
  const tNav = useTranslations("navigation");
  const locale = useLocale();

  // Detectar hostname de manera SSR-safe
  useEffect(() => {
    setHostname(window.location.hostname);
  }, []);

  // 🆕 MINIKIT: Ya inicializado en layout.tsx siguiendo flujo oficial

  // Detectar entorno basado en hostname
  const isMainnet =
    hostname === "app.tuneport.xyz" ||
    hostname === "tuneport.xyz" ||
    hostname === "miniapp.tuneport.xyz" ||
    hostname === "localhost";
  const isTestnet = hostname === "testnet.tuneport.xyz";

  // Determinar el texto del entorno
  const getEnvironmentText = () => {
    if (isMainnet) return "BETA";
    if (isTestnet) return "TEST";
    return "LOCAL"; // Para localhost y otros entornos
  };

  // Determinar el color del badge según el entorno
  const getEnvironmentColor = () => {
    if (isMainnet) return "bg-red-500/90";
    if (isTestnet) return "bg-orange-500/90";
    return "bg-blue-500/90"; // Para localhost
  };

  // Memoizar mockUsers para evitar comparaciones innecesarias
  const stableMockUsers = useMemo(() => mockUsers, [mockUsers]);

  useEffect(() => {
    const checkUserAndSetNickname = async () => {
      // 🆕 Priorizar userData del contexto si está disponible y el usuario está registrado
      if (isRegistered && userData?.nickname) {
        console.log("🎯 HomeLayout - Usando userData del contexto:", {
          nickname: userData.nickname,
          type: userData.type,
          isRegistered,
        });
        setUserNickname(userData.nickname);
        setUserType(userData.type);
        return;
      }

      // Fallback al método original con mockUsers
      if (address?.toString()) {
        const user = stableMockUsers.find((user) => {
          const addressMatch =
            user.address?.toLowerCase() === address?.toString().toLowerCase();
          const solanaMatch =
            user.address_solana?.toLowerCase() ===
            address?.toString().toLowerCase();

          return addressMatch || solanaMatch;
        });

        if (user) {
          setUserNickname(user.nickname);
          setUserType(user.type);
        } else {
          setUserNickname(null);
          setUserType(null);
        }
      } else {
        setUserNickname(null);
        setUserType(null);
      }
    };

    checkUserAndSetNickname();
  }, [stableMockUsers, address, isRegistered, userData]);

  // Memoizar navItems para evitar re-cálculos innecesarios
  const navItems = useMemo(() => {
    // 🎯 EN MINI APPS: Si está registrado, usar userData.address como fallback
    const effectiveAddress =
      address?.toString() || (isMiniApp && userData?.address);

    console.log("🎯 HomeLayout - navItems calculation:", {
      isMiniApp,
      isRegistered,
      address: !!address,
      userDataAddress: !!userData?.address,
      effectiveAddress: !!effectiveAddress,
      userNickname,
      userType,
      willShowCreate: !!(effectiveAddress && userType === "artist"),
    });

    return getNavItems(
      effectiveAddress,
      userNickname,
      userType,
      tNav,
      locale,
      tCommon
    );
  }, [
    address,
    userNickname,
    userType,
    tNav,
    locale,
    tCommon,
    isMiniApp,
    userData?.address,
    isRegistered,
  ]);

  // normaliza locale si ya lo tenés, o usa directamente pathname
  const rawPath = usePathname();
  const path = useMemo(
    () => rawPath.replace(/^\/[a-z]{2}(?:-[A-Z]{2})?(?=\/|$)/i, "") || "/",
    [rawPath]
  );

  const isForYou = /^\/(?:foryou|album)(?:\/|$)/i.test(path);

  const layoutFlags = useMemo(
    () => ({
      showFooter: /\/u(\/|$)/.test(path) || path.includes("/explore"),
      showPlayerMobile: /\/u(\/|$)/.test(path) || isForYou || path === "/",
      hasActivePlayer: Boolean(currentSong && showFloatingPlayer && !isForYou),
      showNavigation:
        /\/u(\/|$)/.test(path) ||
        /\/social-feed(\/|$)/.test(path) ||
        /\/foryou(\/|$)/.test(path) ||
        /\/album(\/|$)/.test(path),
      isForYou,
    }),
    [path, currentSong, showFloatingPlayer, isForYou]
  );

  // const handleLogout = async () => {
  //   setLoading(true);
  //   disconnect();
  //   router.push("/explore");
  // };

  // constantes (ajustá a tu UI real)
  const MOBILE_NAV_H = 64; // h-16
  const PLAYER_H = 80;

  const bottomSpacer = layoutFlags.hasActivePlayer
    ? MOBILE_NAV_H + PLAYER_H
    : layoutFlags.showNavigation
    ? MOBILE_NAV_H
    : 0;

  // Eliminamos el check de mounting que causaba el flash
  // Según reglas de Next.js, usar states de mounting es anti-patrón

  return (
    <div className="flex h-screen flex-col bg-[#18181b]">
      <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-900/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/75">
        <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 min-h-[64px]">
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2 transition-opacity hover:opacity-90 flex-shrink-0"
          >
            <Image
              src="/logo-white.svg"
              alt="Tuneport"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <div className="flex items-center">
              <h1 className="text-lg font-bold text-white">TUNEPORT</h1>
              {/* <span
                className={`ml-2 rounded-md ${getEnvironmentColor()} px-1.5 py-0.5 text-[11px] font-medium text-white`}
              >
                {getEnvironmentText()}
              </span> */}
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <LanguageSelector />
            <WalletConnector />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Navegación de escritorio - solo mostrar en páginas de perfil */}
        {layoutFlags.showNavigation && (
          <nav
            className={`hidden flex-shrink-0 border-r border-zinc-800 bg-zinc-900 md:block transition-all duration-300 ${
              isCollapsed ? "w-16" : "w-48"
            }`}
          >
            <div className="flex h-full flex-col">
              {/* Toggle Button */}
              <div className="flex justify-center p-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full border border-zinc-800"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronLeft className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div
                className={`flex flex-1 flex-col gap-1 ${
                  isCollapsed ? "p-2" : "p-6"
                }`}
              >
                {navItems.map((item) => (
                  <NavLink
                    key={item.href}
                    {...item}
                    isCollapsed={isCollapsed}
                    onCreateClick={() => setIsCreateModalOpen(true)}
                  />
                ))}
              </div>
            </div>
          </nav>
        )}

        <main
          className={`
          flex-1 bg-neutral-800
          ${layoutFlags.showPlayerMobile ? "p-0" : "p-0 sm:p-0"}
          ${
            layoutFlags.hasActivePlayer
              ? "pb-36 md:pb-4" // Player activo: ~144px móvil (player + nav + margen), ~16px desktop (solo margen)
              : layoutFlags.showNavigation
              ? "pb-16 md:pb-4" // Solo navegación móvil: 64px móvil (altura del nav), ~16px desktop
              : pathname.includes("/foryou") ||
                pathname.includes("/social-feed")
              ? "pb-0" // For You: sin padding porque no hay nav ni player
              : "pb-4" // Otras páginas sin player ni navegación: margen básico
          }
          overflow-y-auto
          scrollbar-thin scrollbar-track-zinc-900 scrollbar-thumb-zinc-800 
          hover:scrollbar-thumb-zinc-700
        `}
        >
          {children}

          <div
            aria-hidden
            className="block md:hidden bg-gradient-to-br from-[#18181b] via-[#1a1a1d] to-[#18181b]"
            style={{
              height: layoutFlags.isForYou
                ? 0
                : `calc(${bottomSpacer}px + env(safe-area-inset-bottom))`,
            }}
          />
        </main>
      </div>

      {/* Barra de navegación inferior para móviles - solo mostrar en páginas de perfil */}
      {layoutFlags.showNavigation && (
        <nav className="fixed bottom-0 left-0 right-0 z-30 bg-zinc-900/95 backdrop-blur border-t border-zinc-800 md:hidden">
          <div className="flex items-center justify-around px-1 py-3 h-16 max-w-screen-sm mx-auto">
            {navItems.slice(0, 5).map((item) => (
              <MobileNavLink
                key={item.href}
                {...item}
                isConnected={
                  isConnected || (isMiniApp && isRegistered === true)
                }
                onCreateClick={() => setIsCreateModalOpen(true)}
              />
            ))}
          </div>
        </nav>
      )}

      {/* FloatingPlayer solo si hay usuario autenticado */}
      {(isConnected || (isMiniApp && isRegistered === true)) &&
        !layoutFlags.isForYou && (
          <Suspense fallback={null}>
            <FloatingPlayer />
          </Suspense>
        )}

      {/* Modal para crear álbum */}
      <BaseAlbumNewForm
        nickname={userNickname || ""}
        isOpen={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        showButton={false}
      />
    </div>
  );
}

function NavLink({
  href,
  icon: Icon,
  label,
  type = "link",
  isCollapsed = false,
  onCreateClick,
}: {
  href: string;
  icon: any;
  label: string;
  type?: string;
  isCollapsed?: boolean;
  onCreateClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === href && type === "link";

  if (type === "create") {
    return (
      <button
        onClick={onCreateClick}
        className={`
          flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors w-full
          ${isCollapsed ? "justify-center" : "gap-3"}
          text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100
        `}
        title={isCollapsed ? label : undefined}
      >
        <Icon
          className={`h-5 w-5 text-zinc-400 ${
            isCollapsed ? "flex-shrink-0" : ""
          }`}
        />
        {!isCollapsed && <span>{label}</span>}
      </button>
    );
  }

  return (
    <Link
      href={href}
      className={`
        flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors
        ${isCollapsed ? "justify-center" : "gap-3"}
        ${
          isActive
            ? "bg-zinc-800/90 text-white"
            : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100"
        }
      `}
      prefetch={false}
      title={isCollapsed ? label : undefined}
    >
      <Icon
        className={`h-5 w-5 ${isActive ? "text-white" : "text-zinc-400"} ${
          isCollapsed ? "flex-shrink-0" : ""
        }`}
      />
      {!isCollapsed && <span>{label}</span>}
    </Link>
  );
}

function MobileNavLink({
  href,
  icon: Icon,
  label,
  type = "link",
  isConnected = false,
  onCreateClick,
}: {
  href: string;
  icon: any;
  label: string;
  type?: string;
  isConnected?: boolean;
  onCreateClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === href && type === "link";
  const isDisabled = !isConnected;

  if (type === "create") {
    return (
      <button
        onClick={isDisabled ? undefined : onCreateClick}
        disabled={isDisabled}
        className={`
          flex flex-col items-center justify-center px-2 py-1 min-w-0 flex-1 transition-all duration-200
          ${
            isDisabled
              ? "text-zinc-600 cursor-not-allowed"
              : "text-zinc-400 hover:text-zinc-200 active:scale-95"
          }
          touch-manipulation
        `}
      >
        <div
          className={`p-2 rounded-lg transition-all duration-200 ${
            isDisabled ? "" : "hover:bg-zinc-800/50"
          }`}
        >
          <Icon
            className={`h-5 w-5 ${
              isDisabled ? "text-zinc-600" : "text-zinc-300"
            }`}
          />
        </div>
        <span
          className={`text-[10px] font-medium truncate max-w-full mt-1 leading-none ${
            isDisabled ? "text-zinc-600" : "text-zinc-400"
          }`}
        >
          {label}
        </span>
      </button>
    );
  }

  if (isDisabled) {
    return (
      <div
        className={`
          flex flex-col items-center justify-center px-2 py-1 min-w-0 flex-1 transition-all duration-200
          text-zinc-600 cursor-not-allowed
        `}
      >
        <div className="p-2 rounded-lg transition-all duration-200">
          <Icon className="h-5 w-5 text-zinc-600" />
        </div>
        <span className="text-[10px] font-medium truncate max-w-full mt-1 leading-none text-zinc-600">
          {label}
        </span>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={`
        flex flex-col items-center justify-center px-2 py-1 min-w-0 flex-1 transition-all duration-200
        ${isActive ? "text-white" : "text-zinc-400 hover:text-zinc-200"}
        active:scale-95 touch-manipulation
      `}
      prefetch={false}
    >
      <div
        className={`p-2 rounded-lg transition-all duration-200 ${
          isActive ? "bg-red-500/30 scale-110" : "hover:bg-zinc-800/50"
        }`}
      >
        <Icon
          className={`h-5 w-5 ${isActive ? "text-red-400" : "text-zinc-300"}`}
        />
      </div>
      <span
        className={`text-[10px] font-medium truncate max-w-full mt-1 leading-none ${
          isActive ? "text-white font-semibold" : "text-zinc-400"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}
