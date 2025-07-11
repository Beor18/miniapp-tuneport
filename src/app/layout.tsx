import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import "../styles/privy-overrides.css";
import { Inter } from "next/font/google";
import { PaymentProvider } from "@Src/contexts/PaymentContext";
import { PlayerProvider } from "@Src/contexts/PlayerContext";
import Providers from "@Src/app/providers";
import { BlockchainProvider } from "@Src/contexts/BlockchainContext";
import { LikesProvider } from "@Src/contexts/LikesContext";
import { Analytics } from "@vercel/analytics/next";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

const inter = Inter({ subsets: ["latin"] });

const embedMetadata = {
  version: "next",
  imageUrl: "https://testnet.tuneport.xyz/preview.png",
  button: {
    title: "Ingresar",
    action: {
      type: "launch_frame",
      name: "Tuneport - Where every second of music becomes value.",
      url: "https://testnet.tuneport.xyz",
      splashImageUrl:
        "https://pbs.twimg.com/profile_images/1942391632520695808/2XvLiCf2_400x400.png",
      splashBackgroundColor: "#18181b",
    },
  },
};

export const metadata: Metadata = {
  other: {
    "fc:frame": JSON.stringify(embedMetadata),
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <body
        className={`${inter.className} bg-[#18181b] text-white min-h-screen`}
        suppressHydrationWarning
      >
        <Providers>
          <LikesProvider>
            <PlayerProvider>
              <PaymentProvider>
                <BlockchainProvider>{children}</BlockchainProvider>
              </PaymentProvider>
            </PlayerProvider>
          </LikesProvider>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
