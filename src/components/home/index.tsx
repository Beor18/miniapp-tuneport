"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
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
} from "lucide-react";
import { useAppKitAccount } from "@Src/lib/privy";
import WalletConnector from "@Src/components/walletConector";
import LanguageSelector from "@Src/components/LanguageSelector";
import { useTranslations, useLocale } from "next-intl";

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
  tNav: any,
  locale: string
) => {
  // Si hay wallet conectado, mostrar For You y Profile
  if (publicKey?.toString()) {
    return [
      {
        href: `/${locale}/foryou`,
        icon: Music2Icon,
        label: tNav("forYou"),
      },
      {
        href: userNickname ? `/${locale}/u/${userNickname}` : `/${locale}/u`,
        icon: User,
        label: tNav("profile"),
      },
    ];
  }

  // Si no hay wallet conectado, no mostrar navegación
  return [];
};

export default function HomeLayout({ children, mockUsers }: HomeLayoutProps) {
  const [loading, setLoading] = useState(false);
  const [userNickname, setUserNickname] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [hostname, setHostname] = useState<string>("");
  const router = useRouter();
  const pathname = usePathname();
  const { address, isConnected, caipAddress, status, embeddedWalletInfo } =
    useAppKitAccount();

  // Memoizar las traducciones para evitar re-renders
  const tCommon = useTranslations("common");
  const tNav = useTranslations("navigation");
  const locale = useLocale();

  // Detectar hostname de manera SSR-safe
  useEffect(() => {
    setHostname(window.location.hostname);
  }, []);

  // Detectar entorno basado en hostname
  const isMainnet =
    hostname === "app.tuneport.xyz" || hostname === "tuneport.xyz";
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
        } else {
          setUserNickname(null);
        }
      } else {
        setUserNickname(null);
      }
    };

    checkUserAndSetNickname();
  }, [stableMockUsers, address]);

  // Memoizar navItems para evitar re-cálculos innecesarios
  const navItems = useMemo(() => {
    return getNavItems(address?.toString(), userNickname, tNav, locale);
  }, [address, userNickname, tNav, locale]);

  // Memoizar flags de layout
  const layoutFlags = useMemo(
    () => ({
      showFooter: pathname.startsWith("/u") || pathname.startsWith("/explore"),
      showPlayerMobile: pathname.startsWith("/u") || pathname.startsWith("/"),
      // Nuevo flag para detectar cuando el player está activo
      hasActivePlayer: isConnected && pathname !== "/foryou",
      // Mostrar navegación solo en páginas de perfil
      showNavigation: pathname.startsWith("/u"),
    }),
    [pathname, isConnected]
  );

  // const handleLogout = async () => {
  //   setLoading(true);
  //   disconnect();
  //   router.push("/explore");
  // };

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
              <span
                className={`ml-2 rounded-md ${getEnvironmentColor()} px-1.5 py-0.5 text-[11px] font-medium text-white`}
              >
                {getEnvironmentText()}
              </span>
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
                  />
                ))}
              </div>
            </div>
          </nav>
        )}

        <main
          className={`
          flex-1 bg-neutral-800
          ${layoutFlags.showPlayerMobile ? "p-0" : "p-4 sm:p-6"}
          ${
            layoutFlags.hasActivePlayer
              ? "pb-36 md:pb-28" // Player activo: ~144px móvil (player compacto + nav + margen), ~112px desktop (player completo + margen)
              : layoutFlags.showNavigation && layoutFlags.showFooter
              ? "pb-20 md:pb-8" // Solo navegación móvil: 80px móvil, 32px desktop
              : "pb-0 md:pb-0" // Sin player ni navegación: 16px móvil, 24px desktop
          }
          overflow-y-auto
          scrollbar-thin scrollbar-track-zinc-900 scrollbar-thumb-zinc-800 
          hover:scrollbar-thumb-zinc-700
        `}
        >
          {children}
        </main>
      </div>

      {/* Barra de navegación inferior para móviles - solo mostrar en páginas de perfil */}
      {layoutFlags.showNavigation && (
        <nav className="fixed bottom-0 left-0 right-0 z-30 bg-zinc-900/95 backdrop-blur border-t border-zinc-800 md:hidden">
          <div className="flex items-center justify-around px-1 py-3 h-16">
            {navItems.slice(0, 5).map((item) => (
              <MobileNavLink key={item.href} {...item} />
            ))}
          </div>
        </nav>
      )}

      {/* FloatingPlayer solo si hay usuario autenticado */}
      {isConnected && (
        <Suspense fallback={null}>
          <FloatingPlayer />
        </Suspense>
      )}
    </div>
  );
}

function NavLink({
  href,
  icon: Icon,
  label,
  isCollapsed = false,
}: {
  href: string;
  icon: any;
  label: string;
  isCollapsed?: boolean;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

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
}: {
  href: string;
  icon: any;
  label: string;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`
        flex flex-col items-center justify-center px-2 py-1 min-w-0 flex-1 transition-all duration-200
        ${isActive ? "text-white" : "text-zinc-400 hover:text-zinc-200"}
      `}
      prefetch={false}
    >
      <div
        className={`p-1 rounded-lg transition-all duration-200 ${
          isActive ? "bg-red-500/20" : ""
        }`}
      >
        <Icon
          className={`h-5 w-5 ${isActive ? "text-red-400" : "text-zinc-400"}`}
        />
      </div>
      <span
        className={`text-[10px] font-medium truncate max-w-full mt-1 ${
          isActive ? "text-white" : "text-zinc-400"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}
