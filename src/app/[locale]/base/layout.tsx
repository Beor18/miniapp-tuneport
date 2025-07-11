import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Proof of Tester | Buildathon Base LatAM",
  description:
    "Mint NFTs on Base Mainnet with gasless transactions using Privy Smart Accounts",
  keywords: [
    "Base",
    "NFT",
    "blockchain",
    "mint",
    "music",
    "Privy",
    "gasless",
    "web3",
  ],
  openGraph: {
    title: "Proof of Tester | Buildathon Base LatAM",
    description:
      "Mint NFTs on Base Mainnet with gasless transactions using Privy Smart Accounts",
    images: [
      {
        url: "https://fuchsia-voiceless-dragonfly-362.mypinata.cloud/ipfs/bafybeiaj77kxiudzwlqxxsqnivz4y7cwumh3u3mqyixf32vpl2tjhla4za",
        width: 1200,
        height: 630,
        alt: "Proof of Tester Buildathon Base LatAM",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Proof of Tester | Buildathon Base LatAM",
    description: "Mint NFTs on Base Mainnet with gasless transactions",
    images: [
      "https://fuchsia-voiceless-dragonfly-362.mypinata.cloud/ipfs/bafybeiaj77kxiudzwlqxxsqnivz4y7cwumh3u3mqyixf32vpl2tjhla4za",
    ],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
