/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useState } from "react";
import { Card } from "@Src/ui/components/ui/card";
import { Button } from "@Src/ui/components/ui/button";
import { Slider } from "@Src/ui/components/ui/slider";
import {
  PlayIcon,
  VolumeIcon,
  HeartIcon,
  ShareIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "lucide-react";

const musicData = [
  {
    id: 1,
    title: "Zeit",
    artist: "Rammstein",
    coverUrl:
      "https://upload.wikimedia.org/wikipedia/en/thumb/a/ab/Rammstein_-_Zeit.png/220px-Rammstein_-_Zeit.png",
    likes: "1.2M",
    duration: 321,
  },
  {
    id: 2,
    title: "Fall In Line",
    artist: "Mushroomhead",
    coverUrl:
      "https://i.scdn.co/image/ab67616d00001e02796b8d54fefa1e49832ff7c6",
    likes: "856K",
    duration: 252,
  },
  {
    id: 3,
    title: "Mockup Song",
    artist: "The Innovators",
    coverUrl:
      "https://i.scdn.co/image/ab67616d00001e02796b8d54fefa1e49832ff7c6",
    likes: "2.5M",
    duration: 225,
  },
];

export default function CardMusicFullHome({ onClick, play }: any) {
  const [currentSong, setCurrentSong] = useState(0);

  const handleScroll = (direction: any) => {
    setCurrentSong(
      (prev) => (prev + direction + musicData.length) % musicData.length
    );
  };

  const formatTime = (seconds: any) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="text-primary-foreground h-screen overflow-hidden font-sans">
      <div className="relative h-full snap-y snap-mandatory overflow-y-scroll">
        {musicData.map((song, index) => (
          <div
            key={song.id}
            className="snap-start h-full w-full flex items-center justify-center relative"
          >
            <Card className="w-full h-full bg-black overflow-hidden">
              <div className="absolute inset-0">
                <img
                  src={song.coverUrl}
                  alt={`${song.title} cover`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-gray-950" />
              </div>
              <div className="absolute inset-0 flex flex-col justify-between p-6">
                <div className="flex justify-between items-start">
                  <h1 className="text-3xl font-bold bg-clip-text text-white">
                    {song.title}
                  </h1>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-primary-foreground hover:bg-primary/10 transition-colors"
                  >
                    <ShareIcon className="h-6 w-6" />
                  </Button>
                </div>

                <div className="flex justify-center items-center flex-grow">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      onClick();
                      play;
                    }}
                    className="bg-primary text-primary-foreground rounded-full h-16 w-16 hover:scale-105 transition-transform hover:bg-primary/90"
                  >
                    <PlayIcon className="h-8 w-8" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
