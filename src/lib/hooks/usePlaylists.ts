"use client";

import { useState, useEffect, useCallback } from "react";
import {
  createPlaylist,
  getUserPlaylists,
  getPlaylist,
  updatePlaylist,
  deletePlaylist,
  addNftToPlaylist,
  removeNftFromPlaylist,
  searchPlaylists,
} from "../actions/playlists";

export interface PlaylistData {
  _id: string;
  name: string;
  description?: string;
  userId: {
    _id: string;
    name: string;
    nickname: string;
    picture?: string;
    verified?: boolean;
  };
  nfts: Array<{
    _id: string;
    name: string;
    image: string;
    music: string;
    artist_address_mint: string;
    price?: number;
    description?: string;
    attributes?: any[];
  }>;
  isPublic: boolean;
  coverImage?: string;
  totalDuration: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface CreatePlaylistParams {
  name: string;
  description?: string;
  userId: string;
  nfts?: string[];
  isPublic?: boolean;
  coverImage?: string;
  tags?: string[];
}

interface UpdatePlaylistParams {
  playlistId: string;
  userId: string;
  data: {
    name?: string;
    description?: string;
    isPublic?: boolean;
    coverImage?: string;
    tags?: string[];
    nfts?: string[];
  };
}

export const usePlaylists = (userId?: string) => {
  const [playlists, setPlaylists] = useState<PlaylistData[]>([]);
  const [currentPlaylist, setCurrentPlaylist] = useState<PlaylistData | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener playlists del usuario
  const fetchUserPlaylists = useCallback(
    async (includePrivate: boolean = true) => {
      if (!userId) return;

      setLoading(true);
      setError(null);

      try {
        const result = await getUserPlaylists(userId, includePrivate);
        if (result.success) {
          setPlaylists(result.data || []);
        } else {
          setError(result.error || "Error al cargar playlists");
        }
      } catch (err) {
        setError("Error al cargar playlists");
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  // Crear nueva playlist
  const createNewPlaylist = useCallback(
    async (params: CreatePlaylistParams) => {
      setLoading(true);
      setError(null);

      try {
        const result = await createPlaylist(params);
        if (result.success) {
          // Actualizar la lista local
          setPlaylists((prev) => [result.data, ...prev]);
          return { success: true, data: result.data };
        } else {
          setError(result.error || "Error al crear playlist");
          return { success: false, error: result.error };
        }
      } catch (err) {
        const errorMsg = "Error al crear playlist";
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Obtener una playlist específica
  const fetchPlaylist = useCallback(async (playlistId: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await getPlaylist(playlistId);
      if (result.success) {
        setCurrentPlaylist(result.data);
        return { success: true, data: result.data };
      } else {
        setError(result.error || "Error al cargar playlist");
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMsg = "Error al cargar playlist";
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualizar playlist
  const updateExistingPlaylist = useCallback(
    async (params: UpdatePlaylistParams) => {
      setLoading(true);
      setError(null);

      try {
        const result = await updatePlaylist(
          params.playlistId,
          params.data,
          params.userId
        );
        if (result.success) {
          // Actualizar en la lista local
          setPlaylists((prev) =>
            prev.map((p) => (p._id === params.playlistId ? result.data : p))
          );

          // Actualizar playlist actual si es la misma
          if (currentPlaylist?._id === params.playlistId) {
            setCurrentPlaylist(result.data);
          }

          return { success: true, data: result.data };
        } else {
          setError(result.error || "Error al actualizar playlist");
          return { success: false, error: result.error };
        }
      } catch (err) {
        const errorMsg = "Error al actualizar playlist";
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setLoading(false);
      }
    },
    [currentPlaylist]
  );

  // Eliminar playlist
  const removePlaylist = useCallback(
    async (playlistId: string, userId: string) => {
      setLoading(true);
      setError(null);

      try {
        const result = await deletePlaylist(playlistId, userId);
        if (result.success) {
          // Remover de la lista local
          setPlaylists((prev) => prev.filter((p) => p._id !== playlistId));

          // Limpiar playlist actual si es la misma
          if (currentPlaylist?._id === playlistId) {
            setCurrentPlaylist(null);
          }

          return { success: true };
        } else {
          setError(result.error || "Error al eliminar playlist");
          return { success: false, error: result.error };
        }
      } catch (err) {
        const errorMsg = "Error al eliminar playlist";
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setLoading(false);
      }
    },
    [currentPlaylist]
  );

  // Agregar NFT a playlist
  const addNftToPlaylistLocal = useCallback(
    async (playlistId: string, nftId: string, userId: string) => {
      try {
        const result = await addNftToPlaylist(playlistId, nftId, userId);
        if (result.success) {
          // Actualizar playlist en la lista local
          setPlaylists((prev) =>
            prev.map((p) => (p._id === playlistId ? result.data : p))
          );

          // Actualizar playlist actual si es la misma
          if (currentPlaylist?._id === playlistId) {
            setCurrentPlaylist(result.data);
          }

          return { success: true, data: result.data };
        } else {
          return { success: false, error: result.error };
        }
      } catch (err) {
        return { success: false, error: "Error al agregar NFT a playlist" };
      }
    },
    [currentPlaylist]
  );

  // Quitar NFT de playlist
  const removeNftFromPlaylistLocal = useCallback(
    async (playlistId: string, nftId: string, userId: string) => {
      try {
        const result = await removeNftFromPlaylist(playlistId, nftId, userId);
        if (result.success) {
          // Actualizar playlist en la lista local
          setPlaylists((prev) =>
            prev.map((p) => (p._id === playlistId ? result.data : p))
          );

          // Actualizar playlist actual si es la misma
          if (currentPlaylist?._id === playlistId) {
            setCurrentPlaylist(result.data);
          }

          return { success: true, data: result.data };
        } else {
          return { success: false, error: result.error };
        }
      } catch (err) {
        return { success: false, error: "Error al quitar NFT de playlist" };
      }
    },
    [currentPlaylist]
  );

  // Buscar playlists públicas
  const searchPublicPlaylists = useCallback(
    async (
      query: string,
      filters?: {
        page?: number;
        limit?: number;
        tag?: string;
        sortBy?: string;
        sortOrder?: "asc" | "desc";
      }
    ) => {
      setLoading(true);
      setError(null);

      try {
        const result = await searchPlaylists(query, filters);
        if (result.success) {
          return {
            success: true,
            data: result.data,
            pagination: result.pagination,
          };
        } else {
          setError(result.error || "Error al buscar playlists");
          return { success: false, error: result.error };
        }
      } catch (err) {
        const errorMsg = "Error al buscar playlists";
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Cargar playlists automáticamente cuando cambia el userId
  useEffect(() => {
    if (userId) {
      fetchUserPlaylists();
    }
  }, [userId, fetchUserPlaylists]);

  // Limpiar estado cuando cambia el usuario
  useEffect(() => {
    if (!userId) {
      setPlaylists([]);
      setCurrentPlaylist(null);
      setError(null);
    }
  }, [userId]);

  return {
    // Estado
    playlists,
    currentPlaylist,
    loading,
    error,

    // Métodos
    fetchUserPlaylists,
    createNewPlaylist,
    fetchPlaylist,
    updateExistingPlaylist,
    removePlaylist,
    addNftToPlaylistLocal,
    removeNftFromPlaylistLocal,
    searchPublicPlaylists,

    // Helpers
    setCurrentPlaylist,
    setError,
  };
};
