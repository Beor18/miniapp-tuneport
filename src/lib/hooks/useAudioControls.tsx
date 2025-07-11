import { useEffect, useRef, useState, useCallback } from "react";
import { usePlayer } from "../../contexts/PlayerContext";
import { Track } from "@Src/contexts/PlayerContext";
import { Song } from "@Src/components/playList";

export default function useAudioControls() {
  // Creamos un videoRef para compatibilidad con el código existente
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [playlist, setPlaylist] = useState<any[]>([]);

  // Obtenemos todos los valores y funciones del PlayerContext
  const {
    currentSong,
    setCurrentSong,
    isPlaying,
    setIsPlaying,
    isMuted,
    setIsMuted,
    showFloatingPlayer,
    setShowFloatingPlayer,
    currentTime,
    duration,
    volume,
    setVolume,
    nftData,
    setActivePlayerId,
    isInitialized,
    setNftData,
    activePlayerId,
    isTransitioning,
    audioRef, // Usamos la referencia del contexto
    countActiveAudioInstances,
    lastNavigationPath,
    // Nuevos métodos para playlist
    userPlaylist,
    addToPlaylist,
    removeFromPlaylist,
    isInPlaylist,
    clearPlaylist,
    playNextTrack,
    playPreviousTrack,
  } = usePlayer();

  // Mantenemos referencias actualizadas para usar en callbacks
  const isTransitioningRef = useRef(isTransitioning);
  const volumeRef = useRef(volume);
  const isMutedRef = useRef(isMuted);
  const currentTimeRef = useRef(currentTime);
  const isPlayingRef = useRef(isPlaying);
  const lastPlayedSongRef = useRef<string | null>(null);
  const lastNavigationPathRef = useRef(lastNavigationPath);

  // Flag para prevenir ciclos de actualización
  const isUpdatingState = useRef(false);
  // Timestamp para controlar la frecuencia de operaciones - no usado activamente
  const lastOperationTimeRef = useRef<number>(0);

  // Detector de cambios de ruta más ligero
  useEffect(() => {
    // Actualizar la referencia al cambiar la ruta
    lastNavigationPathRef.current = lastNavigationPath;
  }, [lastNavigationPath]);

  // Actualizar referencias cuando cambian los valores
  useEffect(() => {
    isTransitioningRef.current = isTransitioning;
  }, [isTransitioning]);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    if (currentSong) {
      lastPlayedSongRef.current = currentSong._id;
    }
  }, [currentSong]);

  // Log para debug en desarrollo
  useEffect(() => {
    // console.log(
    //   `useAudioControls - Instancias de audio activas: ${countActiveAudioInstances()}`
    // );
    return () => {
      console.log(
        `useAudioControls desmontado - Instancias de audio: ${countActiveAudioInstances()}`
      );
    };
  }, [countActiveAudioInstances]);

  // Manejo del siguiente track - usando el método del contexto para playlist
  const handleNextSong = useCallback(() => {
    // Si hay canciones en la playlist del usuario, usamos ese método
    if (userPlaylist.length > 0) {
      playNextTrack();
      return;
    }

    // Si no hay playlist o la canción actual no está en la playlist, usamos el comportamiento original
    if (!currentSong || nftData.length === 0) return;

    try {
      const currentIndex = nftData.findIndex(
        (song: any) => song._id === currentSong._id
      );

      let nextIndex: number;
      let nextSong: any;

      if (currentIndex === -1) {
        // Si no se encuentra la canción actual, usar la primera
        nextIndex = 0;
        nextSong = nftData[0];
      } else {
        // Pasar a la siguiente canción
        nextIndex = (currentIndex + 1) % nftData.length;
        nextSong = nftData[nextIndex];
      }

      // Pausar primero para evitar problemas
      setIsPlaying(false);

      // Cambiar canción con retraso
      setTimeout(() => {
        setCurrentSong(nextSong);
        setActivePlayerId(nextSong._id);

        // Retraso para iniciar reproducción
        setTimeout(() => {
          setIsPlaying(true);
        }, 100);
      }, 50);
    } catch (error) {
      console.error("Error al cambiar a la siguiente canción:", error);
    }
  }, [
    currentSong,
    nftData,
    setActivePlayerId,
    setCurrentSong,
    setIsPlaying,
    userPlaylist,
    playNextTrack,
  ]);

  // Manejo del track anterior - usando el método del contexto para playlist
  const handlePrevSong = useCallback(() => {
    // Si hay canciones en la playlist del usuario, usamos ese método
    if (userPlaylist.length > 0) {
      playPreviousTrack();
      return;
    }

    // Si no hay playlist o la canción actual no está en la playlist, usamos el comportamiento original
    if (!currentSong || nftData.length === 0) return;

    try {
      const currentIndex = nftData.findIndex(
        (song: any) => song._id === currentSong._id
      );

      let prevIndex: number;
      let prevSong: any;

      if (currentIndex === -1) {
        // Si no se encuentra la canción actual, usar la primera
        prevIndex = 0;
        prevSong = nftData[0];
      } else {
        // Pasar a la canción anterior
        prevIndex = (currentIndex - 1 + nftData.length) % nftData.length;
        prevSong = nftData[prevIndex];
      }

      // Pausar primero para evitar problemas
      setIsPlaying(false);

      // Cambiar canción con retraso
      setTimeout(() => {
        setCurrentSong(prevSong);
        setActivePlayerId(prevSong._id);

        // Retraso para iniciar reproducción
        setTimeout(() => {
          setIsPlaying(true);
        }, 100);
      }, 50);
    } catch (error) {
      console.error("Error al cambiar a la canción anterior:", error);
    }
  }, [
    currentSong,
    nftData,
    setActivePlayerId,
    setCurrentSong,
    setIsPlaying,
    userPlaylist,
    playPreviousTrack,
  ]);

  // Control de reproducción (play/pause) - sin bloqueos
  const handlePlayPause = useCallback(() => {
    try {
      if (audioRef.current) {
        if (!isPlayingRef.current) {
          // Si está pausado, reproducir
          audioRef.current.play().catch((error) => {
            console.error("Error al reproducir:", error);
          });
        } else {
          // Si está reproduciendo, pausar
          audioRef.current.pause();
        }
      }
      // Actualizar el estado después de la operación directa
      setIsPlaying(!isPlayingRef.current);
    } catch (error) {
      console.error("Error en handlePlayPause:", error);
    }
  }, [setIsPlaying, audioRef]);

  // Controles de volumen - SOLUCIÓN RADICAL
  const handleVolumeChange = useCallback(
    (value: number[]) => {
      // Implementación 100% directa, sin efectos secundarios
      // Esto NO debe afectar a la reproducción de ninguna manera
      const newVolume = value[0];

      // Actualizar el audio directamente
      if (audioRef.current) {
        // SOLO cambiamos el volumen, nada más
        audioRef.current.volume = newVolume;
      }

      // Actualizar estado
      setVolume(newVolume);

      // Manejar mute si es necesario
      if (isMutedRef.current && newVolume > 0) {
        if (audioRef.current) {
          audioRef.current.muted = false;
        }
        setIsMuted(false);
      }
    },
    [audioRef, setIsMuted, setVolume]
  );

  // Función para cambiar la posición de reproducción - VERSIÓN DIRECTA
  const handleSeek = useCallback(
    (newTime: number[]) => {
      if (!audioRef.current) return;

      // Obtener el tiempo deseado
      const time = newTime[0];

      // Simplemente establecer la posición sin afectar al estado de reproducción
      audioRef.current.currentTime = time;
    },
    [audioRef]
  );

  // Función para manejar la selección de una canción - sin bloqueos
  const handleSongSelect = useCallback(
    (song: any) => {
      try {
        setCurrentSong(song);
        setActivePlayerId(song._id);
        setIsPlaying(true);
      } catch (error) {
        console.error("Error al seleccionar canción:", error);
      }
    },
    [setActivePlayerId, setCurrentSong, setIsPlaying]
  );

  // Función para manejar la reordenación de la lista - adaptada para Playlist
  const handleReorder = useCallback(
    (newOrder: (Song | Track)[]) => {
      try {
        // Si estamos usando la playlist persistente del contexto, actualizarla
        if (userPlaylist && userPlaylist.length > 0) {
          // Convertir newOrder a Track[] antes de pasarlo al contexto
          const tracksOrder = newOrder.map((item) => {
            return {
              _id: item._id,
              name: item.name,
              artist_name: item.artist_name || item.artist || "",
              artist: item.artist || item.artist_name || "",
              image: item.image || item.albumArt || "",
              music: (item as Track).music || "",
              slug: (item as Track).slug || "",
              price: (item as Track).price || 0,
            } as Track;
          });

          // Actualizar el contexto con el nuevo orden
          setNftData(tracksOrder);
        }
      } catch (error) {
        console.error("Error al reordenar lista:", error);
      }
    },
    [userPlaylist, setNftData]
  );

  // Función para acciones no implementadas
  const handleNotImplemented = useCallback(() => {
    console.log("Función no implementada");
  }, []);

  // Manejador para añadir/quitar canciones de la playlist
  const handleTogglePlaylist = useCallback(
    (track: any) => {
      if (isInPlaylist(track._id)) {
        removeFromPlaylist(track._id);
      } else {
        addToPlaylist(track);
      }
    },
    [isInPlaylist, removeFromPlaylist, addToPlaylist]
  );

  return {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    showFloatingPlayer,
    videoRef, // Retornamos nuestro videoRef compatible
    nftData,
    isMuted,
    activePlayerId,
    showPlaylist,
    userPlaylist, // Ahora usamos la playlist del contexto
    isTransitioning,

    handlePlayPause,
    handleNextSong,
    handlePrevSong,
    handleVolumeChange,
    handleSeek,
    handleSongSelect,
    handleReorder,
    handleNotImplemented,
    handleTogglePlaylist, // Nuevo método para gestionar la playlist
    setShowPlaylist,
    setCurrentSong,
    setActivePlayerId,
    setIsPlaying,
    setIsMuted,
    setShowFloatingPlayer,
    setNftData,

    // Exponer métodos del contexto directamente
    addToPlaylist,
    removeFromPlaylist,
    isInPlaylist,
    clearPlaylist,
  };
}
