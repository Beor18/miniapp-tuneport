/* eslint-disable @next/next/no-img-element */
"use client";

import React, { memo, useMemo } from "react";
import { usePlayer } from "../../contexts/PlayerContext";

interface PlayerProps {
  url: string;
  autoplay: boolean;
  muted: boolean;
  isPlaying: boolean;
  onEnded: () => void;
  trackId: string;
}

// Usar memo para prevenir re-renders innecesarios
const PlayerHome: React.FC<PlayerProps> = memo(
  ({ trackId }) => {
    // Usamos directamente el tiempo del contexto en lugar de mantener estado local
    const { currentTime, duration, activePlayerId } = usePlayer();

    // Este componente ahora solo mostrará una barra de progreso visual
    // sin reproducir audio directamente
    const isActive = activePlayerId === trackId;

    // Calculamos el porcentaje de progreso usando useMemo para evitar cálculos innecesarios
    const progressPercentage = useMemo(() => {
      return duration > 0 ? (currentTime / duration) * 100 : 0;
    }, [currentTime, duration]);

    // Usar clases condicionales con useMemo
    const progressBarClass = useMemo(() => {
      return `absolute top-0 left-0 h-full rounded-full ${
        isActive ? "bg-red-600" : "bg-gray-500"
      }`;
    }, [isActive]);

    return (
      <div className="flex flex-col">
        <div className="flex items-center justify-between rounded-t-lg">
          <div className="flex items-center">
            {/* Ya no necesitamos un elemento de video aquí */}
          </div>
        </div>

        <div className="relative h-1 bg-gray-700 rounded-full w-full">
          <div
            className={progressBarClass}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Función de comparación personalizada para memo
    // Solo re-renderiza si el trackId o el estado activo cambia
    return prevProps.trackId === nextProps.trackId;
  }
);

// Asignar un nombre para React DevTools
PlayerHome.displayName = "PlayerHome";

export default PlayerHome;
