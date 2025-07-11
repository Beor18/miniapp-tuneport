"use client";

import { useState } from "react";
import { Button } from "@Src/ui/components/ui/button";
import { Card, CardContent, CardFooter } from "@Src/ui/components/ui/card";
import { Input } from "@Src/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@Src/ui/components/ui/select";
import { Badge } from "@Src/ui/components/ui/badge";
import {
  Search,
  Filter,
  TrendingUp,
  Music,
  Users,
  DollarSign,
  Eye,
  Heart,
  ShoppingCart,
  Disc3,
  Play,
  Clock,
  Flame,
  Star,
  Store,
} from "lucide-react";

// Mock data for marketplace items
const mockNFTs = [
  {
    id: 1,
    title: "Midnight Echoes",
    artist: "Luna Rodriguez",
    type: "Album",
    price: "2.5",
    currency: "ETH",
    image:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
    likes: 847,
    views: 12500,
    trending: true,
    rarity: "Legendary",
    timeLeft: "2d 14h",
  },
  {
    id: 2,
    title: "Electric Dreams",
    artist: "Neon Collective",
    type: "Single",
    price: "0.8",
    currency: "ETH",
    image:
      "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&h=300&fit=crop",
    likes: 523,
    views: 8300,
    trending: false,
    rarity: "Rare",
    timeLeft: "5d 8h",
  },
  {
    id: 3,
    title: "Jazz Fusion Vol. 3",
    artist: "Marcus Thompson",
    type: "EP",
    price: "1.2",
    currency: "ETH",
    image:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
    likes: 1240,
    views: 18700,
    trending: true,
    rarity: "Epic",
    timeLeft: "1d 3h",
  },
  {
    id: 4,
    title: "Urban Legends",
    artist: "MC Phoenix",
    type: "Album",
    price: "3.1",
    currency: "ETH",
    image:
      "https://images.unsplash.com/photo-1571974599782-87624638275e?w=300&h=300&fit=crop",
    likes: 692,
    views: 15200,
    trending: false,
    rarity: "Legendary",
    timeLeft: "6d 12h",
  },
  {
    id: 5,
    title: "Sunset Vibes",
    artist: "Costa Del Sol",
    type: "Single",
    price: "0.6",
    currency: "ETH",
    image:
      "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=300&fit=crop",
    likes: 328,
    views: 5800,
    trending: false,
    rarity: "Common",
    timeLeft: "3d 20h",
  },
  {
    id: 6,
    title: "Classical Reimagined",
    artist: "Vienna Symphony DAO",
    type: "Album",
    price: "4.7",
    currency: "ETH",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop",
    likes: 1850,
    views: 28900,
    trending: true,
    rarity: "Mythic",
    timeLeft: "8h 45m",
  },
  {
    id: 7,
    title: "Techno Genesis",
    artist: "Digital Pulse",
    type: "EP",
    price: "1.9",
    currency: "ETH",
    image:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop",
    likes: 967,
    views: 14100,
    trending: true,
    rarity: "Epic",
    timeLeft: "4d 16h",
  },
  {
    id: 8,
    title: "Acoustic Sessions",
    artist: "Emily Hart",
    type: "Single",
    price: "0.9",
    currency: "ETH",
    image:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
    likes: 445,
    views: 7200,
    trending: false,
    rarity: "Rare",
    timeLeft: "2d 7h",
  },
];

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case "Mythic":
      return "bg-purple-900/40 border-purple-700/50 text-purple-300";
    case "Legendary":
      return "bg-amber-900/40 border-amber-700/50 text-amber-300";
    case "Epic":
      return "bg-blue-900/40 border-blue-700/50 text-blue-300";
    case "Rare":
      return "bg-emerald-900/40 border-emerald-700/50 text-emerald-300";
    default:
      return "bg-zinc-800/50 border-zinc-600/50 text-zinc-300";
  }
};

const marketStats = [
  {
    label: "Total Volume",
    value: "42,847 ETH",
    icon: DollarSign,
    change: "+12.5%",
  },
  { label: "Floor Price", value: "0.3 ETH", icon: TrendingUp, change: "+8.2%" },
  { label: "Unique Holders", value: "18,593", icon: Users, change: "+15.7%" },
  { label: "Total Items", value: "156,429", icon: Music, change: "+4.1%" },
];

export default function MarketplacePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("trending");
  const [filterBy, setFilterBy] = useState("all");

  return (
    <div className="min-h-screen bg-neutral-800 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
              <Store className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Store</h1>
            <Badge className="bg-red-900/40 border-red-700/50 text-red-300 border">
              <Flame className="w-3 h-3 mr-1" />
              Beta
            </Badge>
          </div>
          <p className="text-zinc-400 text-lg">
            Discover, collect, and trade exclusive music from top artists
            worldwide
          </p>
        </div>

        {/* Market Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {marketStats.map((stat, index) => (
            <Card key={index} className="bg-zinc-900 border-zinc-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-400 text-sm">{stat.label}</p>
                    <p className="text-white text-xl font-bold">{stat.value}</p>
                    <p className="text-green-400 text-sm">{stat.change}</p>
                  </div>
                  <div className="p-2 bg-zinc-800 rounded-lg">
                    <stat.icon className="w-5 h-5 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" />
            <Input
              placeholder="Search artists, albums, or collections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-zinc-900 border-zinc-700 text-white"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-40 bg-zinc-900 border-zinc-700 text-white">
                <SelectValue placeholder="Filter by" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="album">Albums</SelectItem>
                <SelectItem value="single">Singles</SelectItem>
                <SelectItem value="ep">EPs</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40 bg-zinc-900 border-zinc-700 text-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="trending">Trending</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
              </SelectContent>
            </Select>
            <Button className="bg-zinc-800 border border-zinc-700 text-white hover:bg-zinc-700">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>

        {/* NFT Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {mockNFTs.map((nft) => (
            <Card
              key={nft.id}
              className="group bg-zinc-900 border-zinc-700 hover:border-zinc-600 transition-all duration-300 hover:-translate-y-1"
            >
              <CardContent className="p-0">
                <div className="relative">
                  {/* NFT Image */}
                  <div className="aspect-square relative overflow-hidden rounded-t-lg">
                    <img
                      src={nft.image}
                      alt={nft.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Trending Badge */}
                    {nft.trending && (
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-red-900/40 border-red-700/50 text-red-300 border">
                          <Flame className="w-3 h-3 mr-1" />
                          Trending
                        </Badge>
                      </div>
                    )}

                    {/* Rarity Badge */}
                    <div className="absolute top-3 right-3">
                      <Badge className={`${getRarityColor(nft.rarity)} border`}>
                        <Star className="w-3 h-3 mr-1" />
                        {nft.rarity}
                      </Badge>
                    </div>

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center">
                      <Button
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300 bg-white hover:bg-white/90 text-black"
                      >
                        <Play className="w-5 h-5" />
                      </Button>
                    </div>

                    {/* Time Left */}
                    <div className="absolute bottom-3 left-3">
                      <Badge
                        variant="outline"
                        className="bg-black/50 border-zinc-600 text-white"
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {nft.timeLeft}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-4">
                <div className="w-full">
                  {/* Title and Artist */}
                  <div className="mb-3">
                    <h3 className="font-semibold text-white text-lg line-clamp-1 group-hover:text-blue-400 transition-colors">
                      {nft.title}
                    </h3>
                    <p className="text-zinc-400 text-sm">by {nft.artist}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="outline"
                        className="text-xs border-zinc-700 text-zinc-400 bg-zinc-900/50"
                      >
                        <Disc3 className="w-3 h-3 mr-1" />
                        {nft.type}
                      </Badge>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-3 text-sm text-zinc-400">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {nft.views.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {nft.likes}
                    </div>
                  </div>

                  {/* Price and Buy Button */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-zinc-400 text-xs">Current Price</p>
                      <p className="font-bold text-white text-lg">
                        {nft.price} {nft.currency}
                      </p>
                    </div>
                    <Button className="bg-zinc-800 border border-zinc-700 text-white hover:bg-zinc-700">
                      Buy Now
                    </Button>
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
