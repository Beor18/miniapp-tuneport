"use client";

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { usePathname } from "next/navigation";

// Enum para tipos de reproductor
export enum PLAYER_TYPES {
  STANDARD = "standard",
  TIKTOK = "tiktok",
}

// Interfaces para mejorar el tipado
export interface Track {
  _id: string;
  name: string;
  artist_name?: string;
  artist?: string;
  image: string;
  music: string;
  slug?: string;
  coin_address?: string; // 🪙 Dirección del token asociado (Zora Coins)
  [key: string]: any; // Para propiedades adicionales
}

interface PlaybackState {
  currentTime: number;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
}

interface PlayerContextType {
  // Estado del reproductor
  currentSong: Track | null;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  duration: number;
  currentTime: number;
  activePlayerId: string | null;
  showFloatingPlayer: boolean;
  isInitialized: boolean;
  nftData: any[];
  userPlaylist: Track[]; // Nueva propiedad para la playlist del usuario
  isContentLocked: boolean; // ✅ Estado de bloqueo de contenido premium
  // Estado de transición
  isTransitioning: boolean;
  savedPlaybackState: PlaybackState | null;
  lastNavigationPath: string | null;
  isTikTokMode: boolean;
  // Referencias
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
  // Métodos para interactuar con el reproductor
  setCurrentSong: (song: Track | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setIsMuted: (isMuted: boolean) => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setShowFloatingPlayer: (show: boolean) => void;
  setActivePlayerId: (id: string | null) => void;
  setIsTransitioning: (isTransitioning: boolean) => void;
  setLastNavigationPath: (path: string | null) => void;
  setNftData: (data: any[]) => void;
  setIsContentLocked: (isLocked: boolean) => void; // ✅ Setter para el estado de bloqueo
  // Nuevos métodos para gestionar la playlist
  addToPlaylist: (track: Track) => void;
  removeFromPlaylist: (trackId: string) => void;
  isInPlaylist: (trackId: string) => boolean;
  clearPlaylist: () => void;
  playNextTrack: () => void;
  playPreviousTrack: () => void;
  // Nueva función para debug de instancias de audio
  countActiveAudioInstances: () => number;
}

// Crear el contexto con un valor inicial
const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Estado principal del reproductor
  const [currentSong, setCurrentSong] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);
  const [showFloatingPlayer, setShowFloatingPlayer] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [nftData, setNftData] = useState<any[]>([]);
  const [userPlaylist, setUserPlaylist] = useState<Track[]>([]); // Nueva variable de estado para la playlist
  const [isContentLocked, setIsContentLocked] = useState(false); // ✅ Estado de bloqueo de contenido premium

  // Estado para manejar transiciones entre rutas
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [savedPlaybackState, setSavedPlaybackState] =
    useState<PlaybackState | null>(null);
  const [lastNavigationPath, setLastNavigationPath] = useState<string | null>(
    null
  );

  // Referencia al elemento de audio principal - ÚNICO punto de reproducción
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Referencias para evitar ciclos de actualización
  const isHandlingRouteChange = useRef(false);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSetPathTimeRef = useRef<number>(0);
  const globalLockUntilRef = useRef<number>(0);
  const globalLockTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recentNavigationsRef = useRef<Set<string>>(new Set());
  const isRouteChangeInProgress = useRef(false);

  // Obtener la ruta actual
  const pathname = usePathname();

  // Determinar si estamos en modo TikTok basado en la ruta
  const isTikTokRoute = useCallback((path: string) => {
    return path?.startsWith("/u/");
  }, []);

  // Flag para indicar si estamos en modo TikTok
  const isTikTokMode = isTikTokRoute(pathname || "");

  // Debug: Contar instancias activas de audio
  const countActiveAudioInstances = useCallback(() => {
    const audioElements = document.querySelectorAll("audio, video");
    return audioElements.length;
  }, []);

  // Función segura para actualizar el lastNavigationPath con protección contra ciclos
  const safeSetLastNavigationPath = useCallback(
    (path: string | null) => {
      // Si es null, no hacemos nada
      if (!path) return;

      // Si es la misma ruta exacta, no hacemos nada
      if (path === lastNavigationPath) return;

      // Protección contra actualizaciones demasiado frecuentes
      const now = Date.now();
      if (now - lastSetPathTimeRef.current < 300) {
        return;
      }

      // Limpiamos los paths para comparaciones más precisas
      const cleanCurrentPath = lastNavigationPath?.replace(/\/+$/, "") || "";
      const cleanNewPath = path.replace(/\/+$/, "");

      // Si son equivalentes después de limpiar, no hacemos nada
      if (cleanCurrentPath === cleanNewPath) return;

      // Verificar si la navegación ya ocurrió recientemente
      const navKey = `${cleanCurrentPath}->${cleanNewPath}`;

      // Verificación para navegaciones críticas
      if (
        cleanCurrentPath.startsWith("/album/") &&
        cleanNewPath === "/foryou"
      ) {
        if (recentNavigationsRef.current.has(navKey)) {
          return;
        }
      }

      // Registrar esta navegación en el historial reciente
      recentNavigationsRef.current.add(navKey);

      // Limpiar historial después de un tiempo
      setTimeout(() => {
        recentNavigationsRef.current.delete(navKey);
      }, 5000);

      // Actualizar la ruta y registrar el timestamp
      lastSetPathTimeRef.current = now;
      setLastNavigationPath(path);
    },
    [lastNavigationPath]
  );

  // Función para activar el bloqueo global con duración mínima
  const activateGlobalLock = useCallback((durationMs: number = 200) => {
    const unlockTime = Date.now() + durationMs;
    globalLockUntilRef.current = unlockTime;

    // Limpiar cualquier timeout existente
    if (globalLockTimeoutRef.current) {
      clearTimeout(globalLockTimeoutRef.current);
    }

    // Establecer timeout para liberar el bloqueo
    globalLockTimeoutRef.current = setTimeout(() => {
      globalLockUntilRef.current = 0;
      globalLockTimeoutRef.current = null;
    }, durationMs);
  }, []);

  // Inicializar la ruta al montar el componente
  useEffect(() => {
    if (pathname && !lastNavigationPath && !isHandlingRouteChange.current) {
      safeSetLastNavigationPath(pathname);
    }
  }, [pathname, lastNavigationPath, safeSetLastNavigationPath]);

  // Manejar cambios de ruta con protección robusta contra bucles
  useEffect(() => {
    // Prevenciones para evitar problemas de bucles y ejecuciones múltiples
    if (
      !pathname ||
      isHandlingRouteChange.current ||
      isRouteChangeInProgress.current
    ) {
      return;
    }

    // Prevenir ejecuciones mientras el bloqueo global está activo
    const now = Date.now();
    if (now < globalLockUntilRef.current) {
      return;
    }

    // Limpiamos los paths para comparaciones más precisas
    const cleanCurrentPath = lastNavigationPath?.replace(/\/+$/, "") || "";
    const cleanNewPath = pathname.replace(/\/+$/, "");

    // Si son equivalentes después de limpiar, no hacemos nada
    if (cleanCurrentPath === cleanNewPath) {
      return;
    }

    // Verificar si esta navegación ya ocurrió recientemente
    const navKey = `${cleanCurrentPath}->${cleanNewPath}`;

    // Protección especial para la navegación de album a foryou (punto crítico)
    if (cleanCurrentPath.startsWith("/album/") && cleanNewPath === "/foryou") {
      if (recentNavigationsRef.current.has(navKey)) {
        return;
      }
    }

    // Si no hay lastNavigationPath, simplemente inicializamos
    if (!lastNavigationPath) {
      safeSetLastNavigationPath(pathname);
      return;
    }

    // Evitamos que se procese la misma navegación múltiples veces
    const currentTimestamp = Date.now();
    if (currentTimestamp - lastSetPathTimeRef.current < 300) {
      return;
    }

    // Marcar inicio de transición
    isRouteChangeInProgress.current = true;
    isHandlingRouteChange.current = true;

    // Registrar esta navegación en el historial para evitar repetición
    recentNavigationsRef.current.add(navKey);

    // Limpiar navegación del historial después de un tiempo
    setTimeout(() => {
      recentNavigationsRef.current.delete(navKey);
    }, 5000);

    // Activar bloqueo para evitar procesamiento durante la transición
    activateGlobalLock(300);

    // Iniciar transición
    setIsTransitioning(true);

    // Guardar el estado actual antes de la transición
    if (currentSong && audioRef.current) {
      const stateToSave: PlaybackState = {
        currentTime: audioRef.current.currentTime,
        isPlaying: !audioRef.current.paused,
        volume: audioRef.current.volume,
        isMuted: audioRef.current.muted,
      };
      setSavedPlaybackState(stateToSave);
    }

    // Limpiar cualquier timeout anterior
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }

    // Establecer un timeout para finalizar la transición
    transitionTimeoutRef.current = setTimeout(() => {
      try {
        // Actualizar la última ruta visitada sin provocar un nuevo renderizado
        lastSetPathTimeRef.current = currentTimestamp;

        // Actualizar estado que puede causar renderizados
        if (pathname !== lastNavigationPath) {
          setTimeout(() => {
            setLastNavigationPath(pathname);
          }, 0);
        }

        // Restaurar el estado solo si tenemos todos los elementos necesarios
        if (savedPlaybackState && audioRef.current && currentSong) {
          try {
            // Restaurar tiempo
            audioRef.current.currentTime = savedPlaybackState.currentTime;

            // Restaurar volumen
            audioRef.current.volume = savedPlaybackState.volume;
            audioRef.current.muted = savedPlaybackState.isMuted;

            // Restaurar reproducción si estaba reproduciendo
            if (savedPlaybackState.isPlaying) {
              audioRef.current.play().catch((e) => {
                console.error("Error al restaurar reproducción:", e);
              });
            }
          } catch (error) {
            console.error("Error al restaurar estado:", error);
          }
        }
      } finally {
        // Asegurar que siempre terminamos la transición y liberamos el bloqueo
        setTimeout(() => {
          setIsTransitioning(false);
          isHandlingRouteChange.current = false;
          isRouteChangeInProgress.current = false;
          transitionTimeoutRef.current = null;
        }, 100);
      }
    }, 300);

    // Limpieza si se desmonta durante la transición
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = null;
      }
      isHandlingRouteChange.current = false;
      isRouteChangeInProgress.current = false;
    };
  }, [
    pathname,
    lastNavigationPath,
    currentSong,
    savedPlaybackState,
    safeSetLastNavigationPath,
    activateGlobalLock,
  ]);

  // Inicializar y gestionar el elemento de audio - CONFIGURACIÓN INICIAL ÚNICAMENTE
  useEffect(() => {
    // Crear elemento de audio si no existe
    if (!audioRef.current) {
      audioRef.current = new Audio();

      // Configurar el volumen inicial
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;

      // Configurar listeners una sola vez para evitar fugas de memoria
      audioRef.current.addEventListener("loadedmetadata", () => {
        if (audioRef.current) {
          setDuration(audioRef.current.duration);
          setIsInitialized(true);
        }
      });

      audioRef.current.addEventListener("timeupdate", () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        }
      });

      audioRef.current.addEventListener("pause", () => {
        setIsPlaying(false);
      });

      audioRef.current.addEventListener("play", () => {
        setIsPlaying(true);
      });

      audioRef.current.addEventListener("error", (e) => {
        console.error("Error en el elemento de audio:", e);
        setIsPlaying(false);
      });
    }

    // Limpiar al desmontar para evitar fugas de memoria
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        setIsInitialized(false);
      }
    };
  }, []); // SIN dependencias para evitar reconfiguración

  // Manejo del evento 'ended' por separado para que tenga acceso a valores actuales
  useEffect(() => {
    const handleEnded = () => {
      setIsPlaying(false);

      // PRIORIDAD 1: Si hay canciones en la playlist del usuario, usar esa lógica
      if (userPlaylist.length > 0 && currentSong) {
        const currentIndex = userPlaylist.findIndex(
          (track: Track) => track._id === currentSong._id
        );

        if (currentIndex !== -1) {
          // La canción actual está en la playlist, pasar a la siguiente
          const nextIndex = (currentIndex + 1) % userPlaylist.length;
          const nextSong = userPlaylist[nextIndex];

          setTimeout(() => {
            setCurrentSong(nextSong);
            setActivePlayerId(nextSong._id);

            setTimeout(() => {
              setIsPlaying(true);
            }, 100);
          }, 200);
        } else {
          // La canción actual no está en la playlist, reproducir la primera de la playlist
          const firstPlaylistSong = userPlaylist[0];

          setTimeout(() => {
            setCurrentSong(firstPlaylistSong);
            setActivePlayerId(firstPlaylistSong._id);

            setTimeout(() => {
              setIsPlaying(true);
            }, 100);
          }, 200);
        }
        return; // Importante: salir aquí para no ejecutar la lógica de nftData
      }

      // PRIORIDAD 2: Si no hay playlist o está vacía, usar nftData (comportamiento del álbum)
      if (nftData.length > 0 && currentSong) {
        const currentIndex = nftData.findIndex(
          (song: any) => song._id === currentSong._id
        );

        if (currentIndex !== -1) {
          const nextIndex = (currentIndex + 1) % nftData.length;
          const nextSong = nftData[nextIndex];

          setTimeout(() => {
            setCurrentSong(nextSong);
            setActivePlayerId(nextSong._id);

            setTimeout(() => {
              setIsPlaying(true);
            }, 200);
          }, 200);
        } else {
          // Si no se encuentra en nftData, reproducir la primera
          const firstSong = nftData[0];

          setTimeout(() => {
            setCurrentSong(firstSong);
            setActivePlayerId(firstSong._id);

            setTimeout(() => {
              setIsPlaying(true);
            }, 200);
          }, 200);
        }
      }
    };

    // Agregar el event listener solo si existe el audioRef
    if (audioRef.current) {
      audioRef.current.addEventListener("ended", handleEnded);
    }

    // Cleanup que solo remueve el event listener específico
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("ended", handleEnded);
      }
    };
  }, [userPlaylist, nftData, currentSong]); // Dependencias críticas SOLO para el evento ended

  // Manejar cambios en la canción actual de forma optimizada
  useEffect(() => {
    if (!audioRef.current || !currentSong) return;

    // Guardar el volumen y mute actuales
    const currentVolume = audioRef.current.volume;
    const currentMuted = audioRef.current.muted;

    // Establecer la fuente del audio
    audioRef.current.src = currentSong.music;
    audioRef.current.load();

    // Restaurar volumen y mute exactamente como estaban
    audioRef.current.volume = currentVolume;
    audioRef.current.muted = currentMuted;
  }, [currentSong]);

  // Manejar cambios en el estado de reproducción con manejo mejorado de errores
  useEffect(() => {
    if (!audioRef.current || !currentSong) return;

    try {
      if (isPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            // Solo mostramos error si no es un error de abortado (común en interacciones rápidas)
            if (error.name !== "AbortError") {
              console.error("Error al reproducir audio:", error);
            }
            setIsPlaying(false);
          });
        }
      } else {
        audioRef.current.pause();
      }
    } catch (error) {
      console.error("Error en efecto de reproducción:", error);
      setIsPlaying(false);
    }
  }, [isPlaying, currentSong]);

  // Manejar cambios en el volumen y mute - COMPLETAMENTE INDEPENDIENTE
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Nuevos métodos para gestionar la playlist
  const addToPlaylist = useCallback((track: Track) => {
    setUserPlaylist((prevPlaylist) => {
      // Verificar si la canción ya está en la playlist
      if (prevPlaylist.some((item) => item._id === track._id)) {
        return prevPlaylist;
      }
      return [...prevPlaylist, track];
    });
  }, []);

  const removeFromPlaylist = useCallback((trackId: string) => {
    setUserPlaylist((prevPlaylist) =>
      prevPlaylist.filter((item) => item._id !== trackId)
    );
  }, []);

  const isInPlaylist = useCallback(
    (trackId: string) => {
      return userPlaylist.some((track) => track._id === trackId);
    },
    [userPlaylist]
  );

  const clearPlaylist = useCallback(() => {
    setUserPlaylist([]);
  }, []);

  // Función para reproducir la siguiente canción
  const playNextTrack = useCallback(() => {
    if (!currentSong || userPlaylist.length === 0) return;

    const currentIndex = userPlaylist.findIndex(
      (track) => track._id === currentSong._id
    );

    // Si la canción actual no está en la playlist o es la última, comenzar desde el principio
    if (currentIndex === -1 || currentIndex === userPlaylist.length - 1) {
      const nextSong = userPlaylist[0];

      // Pausar primero para evitar conflictos
      setIsPlaying(false);

      setTimeout(() => {
        setCurrentSong(nextSong);
        setActivePlayerId(nextSong._id);

        setTimeout(() => {
          setIsPlaying(true);
        }, 100);
      }, 50);
      return;
    }

    // Reproducir la siguiente canción en la playlist
    const nextSong = userPlaylist[currentIndex + 1];

    // Pausar primero para evitar conflictos
    setIsPlaying(false);

    setTimeout(() => {
      setCurrentSong(nextSong);
      setActivePlayerId(nextSong._id);

      setTimeout(() => {
        setIsPlaying(true);
      }, 100);
    }, 50);
  }, [
    currentSong,
    userPlaylist,
    setCurrentSong,
    setActivePlayerId,
    setIsPlaying,
  ]);

  // Función para reproducir la canción anterior
  const playPreviousTrack = useCallback(() => {
    if (!currentSong || userPlaylist.length === 0) return;

    const currentIndex = userPlaylist.findIndex(
      (track) => track._id === currentSong._id
    );

    // Si la canción actual no está en la playlist o es la primera, ir a la última
    if (currentIndex === -1 || currentIndex === 0) {
      const prevSong = userPlaylist[userPlaylist.length - 1];

      // Pausar primero para evitar conflictos
      setIsPlaying(false);

      setTimeout(() => {
        setCurrentSong(prevSong);
        setActivePlayerId(prevSong._id);

        setTimeout(() => {
          setIsPlaying(true);
        }, 100);
      }, 50);
      return;
    }

    // Reproducir la canción anterior en la playlist
    const prevSong = userPlaylist[currentIndex - 1];

    // Pausar primero para evitar conflictos
    setIsPlaying(false);

    setTimeout(() => {
      setCurrentSong(prevSong);
      setActivePlayerId(prevSong._id);

      setTimeout(() => {
        setIsPlaying(true);
      }, 100);
    }, 50);
  }, [
    currentSong,
    userPlaylist,
    setCurrentSong,
    setActivePlayerId,
    setIsPlaying,
  ]);

  // Crear el objeto de contexto
  const contextValue: PlayerContextType = {
    currentSong,
    isPlaying,
    isMuted,
    volume,
    duration,
    currentTime,
    activePlayerId,
    showFloatingPlayer,
    isInitialized,
    nftData,
    userPlaylist,
    isContentLocked, // ✅ Estado de bloqueo
    isTransitioning,
    savedPlaybackState,
    lastNavigationPath,
    isTikTokMode,
    audioRef,
    setCurrentSong,
    setIsPlaying,
    setIsMuted,
    setVolume,
    setCurrentTime,
    setDuration,
    setShowFloatingPlayer,
    setActivePlayerId,
    setIsTransitioning,
    setLastNavigationPath: safeSetLastNavigationPath,
    setNftData,
    setIsContentLocked, // ✅ Setter del estado de bloqueo
    addToPlaylist,
    removeFromPlaylist,
    isInPlaylist,
    clearPlaylist,
    playNextTrack,
    playPreviousTrack,
    countActiveAudioInstances,
  };

  return (
    <PlayerContext.Provider value={contextValue}>
      {children}
    </PlayerContext.Provider>
  );
};

// Hook para usar el contexto
export const usePlayer = (): PlayerContextType => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error("usePlayer debe ser usado dentro de un PlayerProvider");
  }
  return context;
};
