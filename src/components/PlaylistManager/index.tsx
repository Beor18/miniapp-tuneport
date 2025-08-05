"use client";

import React, { useState, useCallback } from "react";
import {
  Music,
  Plus,
  Save,
  List,
  X,
  Settings,
  Globe,
  Lock,
  Edit3,
  Trash2,
  Play,
} from "lucide-react";
import { Button } from "@Src/ui/components/ui/button";
import { Input } from "@Src/ui/components/ui/input";
import { Textarea } from "@Src/ui/components/ui/textarea";
import { Switch } from "@Src/ui/components/ui/switch";
import { usePlaylists, PlaylistData } from "@Src/lib/hooks/usePlaylists";
import { usePlayer } from "@Src/contexts/PlayerContext";
import { motion, AnimatePresence } from "framer-motion";

interface PlaylistManagerProps {
  isVisible: boolean;
  onClose: () => void;
  userId?: string;
  openWithCreateForm?: boolean;
  onBackToQueue?: () => void;
}

export const PlaylistManager: React.FC<PlaylistManagerProps> = ({
  isVisible,
  onClose,
  userId,
  openWithCreateForm,
  onBackToQueue,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<PlaylistData | null>(
    null
  );
  const [playlistName, setPlaylistName] = useState("");
  const [playlistDescription, setPlaylistDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const {
    userPlaylist,
    setNftData,
    setCurrentSong,
    setActivePlayerId,
    setIsPlaying,
  } = usePlayer();

  const {
    playlists,
    loading,
    error,
    createNewPlaylist,
    updateExistingPlaylist,
    removePlaylist,
    addNftToPlaylistLocal,
    fetchUserPlaylists,
  } = usePlaylists(userId);

  // Efecto para abrir automáticamente el formulario cuando se pase la prop
  React.useEffect(() => {
    if (openWithCreateForm && isVisible) {
      setShowCreateForm(true);
      setPlaylistName(`Mi Cola - ${new Date().toLocaleDateString()}`);
    }
  }, [openWithCreateForm, isVisible]);

  // Crear playlist desde la cola actual
  const handleCreateFromQueue = useCallback(async () => {
    if (!userId || userPlaylist.length === 0 || !playlistName.trim()) return;

    const nftIds = userPlaylist.map((track) => track._id);

    const result = await createNewPlaylist({
      name: playlistName,
      description: playlistDescription,
      userId,
      nfts: nftIds,
      isPublic,
    });

    if (result.success) {
      setPlaylistName("");
      setPlaylistDescription("");
      setIsPublic(false);
      setShowCreateForm(false);
    }
  }, [
    userId,
    userPlaylist,
    playlistName,
    playlistDescription,
    isPublic,
    createNewPlaylist,
  ]);

  // Crear playlist vacía
  const handleCreateEmpty = useCallback(async () => {
    if (!userId || !playlistName.trim()) return;

    const result = await createNewPlaylist({
      name: playlistName,
      description: playlistDescription,
      userId,
      nfts: [],
      isPublic,
    });

    if (result.success) {
      setPlaylistName("");
      setPlaylistDescription("");
      setIsPublic(false);
      setShowCreateForm(false);
    }
  }, [userId, playlistName, playlistDescription, isPublic, createNewPlaylist]);

  // Cargar playlist en la cola
  const handleLoadPlaylist = useCallback(
    async (playlist: PlaylistData) => {
      if (playlist.nfts.length === 0) return;
      console.log("playlist", playlist);
      // Convertir NFTs a formato Track
      const tracks = playlist.nfts.map((nft) => ({
        _id: nft._id,
        name: nft.name,
        artist_name: playlist.userId.nickname,
        artist: nft.artist_address_mint,
        image: nft.image,
        music: nft.music,
        slug: nft._id, // Usar ID como slug por defecto
        price: nft.price,
      }));

      // Cargar en el contexto
      setNftData(tracks);

      // Reproducir la primera canción
      if (tracks.length > 0) {
        setCurrentSong(tracks[0]);
        setActivePlayerId(tracks[0]._id);
        setIsPlaying(true);
      }
    },
    [setNftData, setCurrentSong, setActivePlayerId, setIsPlaying]
  );

  // Eliminar playlist
  const handleDeletePlaylist = useCallback(
    async (playlistId: string) => {
      if (!userId) return;
      await removePlaylist(playlistId, userId);
    },
    [userId, removePlaylist]
  );

  // Agregar cola actual a playlist existente
  const handleAddQueueToPlaylist = useCallback(
    async (playlistId: string) => {
      if (!userId || userPlaylist.length === 0) return;

      // Agregar cada NFT de la cola a la playlist
      for (const track of userPlaylist) {
        await addNftToPlaylistLocal(playlistId, track._id, userId);
      }

      // Refrescar playlists
      fetchUserPlaylists();
    },
    [userId, userPlaylist, addNftToPlaylistLocal, fetchUserPlaylists]
  );

  const resetForm = () => {
    setPlaylistName("");
    setPlaylistDescription("");
    setIsPublic(false);
    setShowCreateForm(false);
    setEditingPlaylist(null);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-24 right-4 w-80 bg-zinc-800 bg-opacity-70 backdrop-filter backdrop-blur-lg rounded-lg shadow-lg overflow-hidden border border-zinc-700 z-[300]"
        >
          {/* Header - estilo similar a In Queue */}
          <div className="flex justify-between items-center p-4 border-b border-zinc-700">
            <h4 className="text-lg font-semibold text-white">Playlists</h4>
            <button
              onClick={() => {
                if (openWithCreateForm && onBackToQueue) {
                  onBackToQueue();
                } else {
                  onClose();
                }
              }}
              className="text-zinc-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full p-1"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </button>
          </div>

          <div className="p-4 max-h-80 overflow-y-auto custom-scrollbar">
            {/* Contenido con scroll limitado */}

            {/* Formulario de creación */}
            {showCreateForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-zinc-800 rounded-lg p-4 mb-6"
              >
                <div className="space-y-4">
                  <Input
                    placeholder="Nombre de la playlist"
                    value={playlistName}
                    onChange={(e) => setPlaylistName(e.target.value)}
                    className="bg-zinc-700 border-zinc-600 text-white"
                  />

                  <Textarea
                    placeholder="Descripción (opcional)"
                    value={playlistDescription}
                    onChange={(e) => setPlaylistDescription(e.target.value)}
                    className="bg-zinc-700 border-zinc-600 text-white min-h-20"
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-300">
                      Playlist pública
                    </span>
                    <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={
                        userPlaylist.length > 0
                          ? handleCreateFromQueue
                          : handleCreateEmpty
                      }
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={!playlistName.trim() || loading}
                    >
                      {loading ? "Creando..." : "Crear"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Error y Lista de playlists - Solo mostrar cuando no esté el formulario activo */}
            {!showCreateForm && (
              <>
                {/* Error */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {/* Lista de playlists */}
                <div className="space-y-3">
                  {loading && playlists.length === 0 ? (
                    <div className="text-center py-4">
                      <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                      <p className="text-zinc-400 text-sm">Cargando...</p>
                    </div>
                  ) : playlists.length === 0 ? (
                    <div className="text-center py-4">
                      <Music className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                      <p className="text-zinc-400 text-sm mb-1">
                        No tienes playlists
                      </p>
                      <p className="text-zinc-500 text-xs">
                        Crea tu primera playlist
                      </p>
                    </div>
                  ) : (
                    playlists.map((playlist) => (
                      <div
                        key={playlist._id}
                        className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50 hover:bg-zinc-800/70 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-white truncate text-sm">
                              {playlist.name}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                              <span>{playlist.nfts.length} canciones</span>
                              {playlist.isPublic ? (
                                <Globe className="h-3 w-3 text-green-400" />
                              ) : (
                                <Lock className="h-3 w-3 text-zinc-400" />
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={() => handleLoadPlaylist(playlist)}
                            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white text-xs py-1 h-7"
                            disabled={playlist.nfts.length === 0}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Play
                          </Button>

                          {userPlaylist.length > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleAddQueueToPlaylist(playlist._id)
                              }
                              className="border-zinc-600 text-zinc-300 hover:bg-zinc-700 h-7 w-7 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeletePlaylist(playlist._id)}
                            className="border-red-600 text-red-400 hover:bg-red-600/10 h-7 w-7 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
