/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useRef, useEffect } from "react";
import { Bell, History, Play, Settings } from "lucide-react";
import { Card, CardContent } from "@Src/ui/components/ui/card";
import { Button } from "@Src/ui/components/ui/button";
import { useTranslations } from "next-intl";

export default function CarrouselHome() {
  const tHome = useTranslations("home");
  const tMusic = useTranslations("music");

  const recentlyPlayed = [
    {
      title: tHome("likedSongs"),
      gradient: "from-indigo-600 to-violet-600",
      icon: "❤️",
    },
    {
      title: "Dangerous",
      gradient: "from-amber-500 to-orange-500",
      artist: "Michael Jackson",
    },
    {
      title: "For You",
      gradient: "from-pink-500 to-rose-500",
      artist: "Selena Gomez",
    },
    {
      title: tHome("topHits"),
      gradient: "from-green-500 to-emerald-500",
      icon: "🎵",
    },
    {
      title: tHome("chillMix"),
      gradient: "from-blue-500 to-cyan-500",
      icon: "🌊",
    },
  ];

  const dailyMixes = [
    {
      title: `${tHome("dailyMix")} 1`,
      gradient: "from-green-600 to-emerald-600",
      artists: "Drake, Michael Jackson, Eminem",
    },
    {
      title: `${tHome("dailyMix")} 2`,
      gradient: "from-yellow-500 to-amber-500",
      artists: "Justin Bieber, Dua Lipa, The Weeknd",
    },
    {
      title: `${tHome("dailyMix")} 3`,
      gradient: "from-red-500 to-rose-600",
      artists: "Post Malone, Doja Cat, Ariana Grande",
    },
    {
      title: `${tHome("dailyMix")} 4`,
      gradient: "from-purple-600 to-indigo-600",
      artists: "Billie Eilish, Lorde, Lana Del Rey",
    },
    {
      title: `${tHome("dailyMix")} 5`,
      gradient: "from-blue-600 to-cyan-600",
      artists: "Ed Sheeran, Shawn Mendes, Taylor Swift",
    },
  ];

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      const handleWheel = (e: WheelEvent) => {
        if (e.deltaY !== 0) {
          e.preventDefault();
          scrollContainer.scrollLeft += e.deltaY;
        }
      };
      scrollContainer.addEventListener("wheel", handleWheel, {
        passive: false,
      });
      return () => scrollContainer.removeEventListener("wheel", handleWheel);
    }
  }, []);

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-800 text-white w-full space-y-6 overflow-hidden pb-8">
      {/* <header className="flex justify-between items-center mb-2 p-4 md:p-6">
        <h1 className="text-2xl md:text-3xl font-bold">{tHome("goodMorning")}</h1>
      </header> */}

      <section className="overflow-hidden">
        <h2 className="text-xl md:text-2xl font-bold mb-4 p-4 md:p-6">
          {tHome("recentlyPlayed")}
        </h2>
        <div className="relative ml-2">
          <div
            ref={scrollContainerRef}
            className="flex space-x-4 overflow-x-auto pb-4 -mr-4 md:-mr-6"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {recentlyPlayed.map((item, index) => (
              <div key={index} className="flex-shrink-0 relative group">
                <Card className="w-40 md:w-48 h-40 md:h-48 overflow-hidden rounded-none">
                  <CardContent className="p-0 h-full">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/en/thumb/a/ab/Rammstein_-_Zeit.png/220px-Rammstein_-_Zeit.png"
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-30 transition-opacity group-hover:bg-opacity-60" />
                    <div className="absolute inset-0 flex flex-col justify-between p-3">
                      <div className="flex justify-end">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="rounded-full bg-white/10 hover:bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Play className="w-5 h-5" fill="currentColor" />
                          <span className="sr-only">
                            {tMusic("play")} {item.title}
                          </span>
                        </Button>
                      </div>
                      <div>
                        <h3 className="font-bold text-white md:text-lg leading-tight">
                          {item.title}
                        </h3>
                        {/* <p className="text-sm md:text-base text-zinc-300 mt-1">
                          {item.artist}
                        </p> */}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden">
        <h2 className="text-xl md:text-2xl font-bold mb-4 p-4 md:p-6">
          {tHome("toGetYouStarted")}
        </h2>
        <div className="relative ml-2">
          <div
            ref={scrollContainerRef}
            className="flex space-x-4 overflow-x-auto pb-4 -mr-4 md:-mr-6"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {dailyMixes.map((mix, index) => (
              <div key={index} className="flex-shrink-0 relative group">
                <Card className="w-40 md:w-48 h-48 md:h-56 overflow-hidden rounded-md">
                  <CardContent className="p-0 h-full">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/en/thumb/a/ab/Rammstein_-_Zeit.png/220px-Rammstein_-_Zeit.png"
                      alt={mix.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-30 transition-opacity group-hover:bg-opacity-60" />
                    <div className="absolute inset-0 flex flex-col justify-between p-3">
                      <div className="flex justify-end">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="rounded-full bg-white/10 hover:bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Play className="w-5 h-5" fill="currentColor" />
                          <span className="sr-only">
                            {tMusic("play")} {mix.title}
                          </span>
                        </Button>
                      </div>
                      <div>
                        <h3 className="font-bold text-white md:text-lg leading-tight">
                          {mix.title}
                        </h3>
                        {/* <p className="text-sm md:text-white text-zinc-100 mt-1">
                          {mix.artists}
                        </p> */}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
