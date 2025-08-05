/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useContext } from "react";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import { PlayerBar } from "./PlayerBar";
import { PlayerBarMobile } from "./PlayerBarMobile";
import useAudioControls from "@Src/lib/hooks/useAudioControls";
import { UserRegistrationContext } from "@Src/app/providers";
import { useTranslations } from "next-intl";

export default function FloatingPlayer() {
  const { userData } = useContext(UserRegistrationContext);
  const pathname = usePathname();
  const userId = userData?._id || null;
  const tPlayer = useTranslations("player");

  // Controles de audio
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    showFloatingPlayer,
    videoRef,
    handlePlayPause,
    handlePrevSong,
    handleNextSong,
    handleVolumeChange,
    handleNotImplemented,
    handleSongSelect,
    handleReorder,
    showPlaylist,
    userPlaylist,
    setShowPlaylist,
  } = useAudioControls();

  // Si no hay canción activa, el reproductor está oculto, o estamos en /foryou, no mostrar nada  
  if (!currentSong || !showFloatingPlayer || pathname.match(/\/foryou(\/|$)/)) {
    return null;
  }

  // Función simplificada para el manejo de mint y payment
  const handleMint = () => {
    toast.info(tPlayer("mintFunction"));
  };

  const handlePayment = () => {
    toast.info(tPlayer("paymentFunction"));
  };

  return (
    <>
      <PlayerBar
        currentSong={currentSong}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        showPlaylist={showPlaylist}
        playlist={userPlaylist}
        videoRef={videoRef}
        handlePlayPause={handlePlayPause}
        handlePrevSong={handlePrevSong}
        handleNextSong={handleNextSong}
        handleMint={handleMint}
        handlePayment={handlePayment}
        handleSongSelect={handleSongSelect}
        handleReorder={handleReorder}
        handleVolumeChange={handleVolumeChange}
        setShowPlaylist={setShowPlaylist}
        userId={userId}
      />
      <PlayerBarMobile
        currentSong={currentSong}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        showPlaylist={showPlaylist}
        playlist={userPlaylist}
        videoRef={videoRef}
        handlePlayPause={handlePlayPause}
        handlePrevSong={handlePrevSong}
        handleNextSong={handleNextSong}
        handleMint={handleMint}
        handlePayment={handlePayment}
        handleSongSelect={handleSongSelect}
        handleReorder={handleReorder}
        handleVolumeChange={handleVolumeChange}
        setShowPlaylist={setShowPlaylist}
        userId={userId}
      />
    </>
  );
}
