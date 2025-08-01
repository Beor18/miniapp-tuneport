import { Metadata } from "next";
import SocialDiscoveryFeed from "@Src/components/SocialDiscoveryFeed";

export const metadata: Metadata = {
  title: "Social Feed - Tuneport",
  description: "Descubre música trending en Farcaster",
};

export default function SocialFeedPage() {
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">
          Trending en Farcaster
        </h1>
        <p className="text-gray-400">
          Descubre música que está siendo compartida y discutida en Farcaster
        </p>
      </div>
      
      <SocialDiscoveryFeed 
        className="w-full"
        showStats={true}
      />
    </div>
  );
}