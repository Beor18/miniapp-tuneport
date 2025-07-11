/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useRef, useState } from "react";
import dashjs from "dashjs";
import { Button } from "@Src/ui/components/ui/button";
import { useTranslations } from "next-intl";

interface PlayerProps {
  url: string;
  play: boolean;
}

const Player: React.FC<PlayerProps> = ({ url, play }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const tMusic = useTranslations("music");

  useEffect(() => {
    let player: dashjs.MediaPlayerClass | null = null;

    if (typeof window !== "undefined" && videoRef.current) {
      const videoElement = videoRef.current;
      player = dashjs.MediaPlayer().create();
      player.initialize(videoElement, url, play);

      videoElement.addEventListener("loadedmetadata", () => {
        setDuration(videoElement.duration);
      });

      videoElement.addEventListener("timeupdate", () => {
        setCurrentTime(videoElement.currentTime);
      });

      videoElement.addEventListener("play", () => setIsPlaying(true));
      videoElement.addEventListener("pause", () => setIsPlaying(false));
      videoElement.addEventListener("ended", () => setIsPlaying(false));
    }

    return () => {
      player?.reset();
    };
  }, [url, play]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  return (
    <div className="flex flex-col bg-neutral-800">
      <div className="flex items-center justify-between bg-[#550A1C] px-2 py-2 rounded-t-lg">
        <img
          src="https://upload.wikimedia.org/wikipedia/en/thumb/a/ab/Rammstein_-_Zeit.png/220px-Rammstein_-_Zeit.png"
          alt={tMusic("playingSongCover")}
          className="w-12 h-12 rounded"
          style={{ aspectRatio: "1", objectFit: "cover" }}
        />
        <div className="flex flex-col flex-1 mx-4">
          <span className="text-sm text-white font-semibold">
            Zeit / Remastered
          </span>
          <span className="text-sm text-gray-300 font-bold">Rammstein</span>
        </div>

        <div className="flex items-center space-x-4">
          <video ref={videoRef} className="hidden" onClick={handlePlayPause} />

          <Button
            className="bg-black rounded-full w-10 h-10 p-2"
            onClick={handlePlayPause}
            aria-label={isPlaying ? tMusic("pause") : tMusic("play")}
          >
            {isPlaying ? (
              <PauseIcon className="h-6 w-6" />
            ) : (
              <PlayIcon className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      <div className="relative h-1 bg-gray-700 rounded-full w-full">
        <div
          className="absolute top-0 left-0 h-full bg-red-600 rounded-full"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        />
      </div>
    </div>
  );
};

function PlayIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function PauseIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="4" height="16" x="6" y="4" />
      <rect width="4" height="16" x="14" y="4" />
    </svg>
  );
}

export default Player;
