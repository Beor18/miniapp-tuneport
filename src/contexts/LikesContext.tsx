"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { toggleLike, getLikeStatus } from "@Src/app/actions/likes.actions";
import { toast } from "sonner";

interface LikeState {
  likesCount: number;
  isLiked: boolean;
  isLoading?: boolean;
}

interface LikesContextType {
  likes: Record<string, LikeState>;
  toggleLikeGlobal: (nftId: string, userId: string) => Promise<void>;
  setLikeState: (nftId: string, state: LikeState) => void;
  loadLikeStatus: (nftId: string, userId: string) => Promise<void>;
  getLikeState: (nftId: string) => LikeState;
}

const LikesContext = createContext<LikesContextType | undefined>(undefined);

export function LikesProvider({ children }: { children: React.ReactNode }) {
  const [likes, setLikes] = useState<Record<string, LikeState>>({});
  const processingLikesRef = useRef<Set<string>>(new Set());

  const setLikeState = useCallback((nftId: string, state: LikeState) => {
    setLikes((prev) => ({
      ...prev,
      [nftId]: state,
    }));
  }, []);

  const getLikeState = useCallback(
    (nftId: string): LikeState => {
      return (
        likes[nftId] || { likesCount: 0, isLiked: false, isLoading: false }
      );
    },
    [likes]
  );

  const loadLikeStatus = useCallback(
    async (nftId: string, userId: string) => {
      if (!userId || !nftId) return;

      const currentState = getLikeState(nftId);
      if (currentState.isLoading) return;

      try {
        // Marcar como loading
        setLikeState(nftId, { ...currentState, isLoading: true });

        const status = await getLikeStatus({ userId, nftId });
        if (status.success) {
          setLikeState(nftId, {
            likesCount: status.likesCount,
            isLiked: status.isLiked,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error("Error loading like status:", error);
        setLikeState(nftId, { ...currentState, isLoading: false });
      }
    },
    [setLikeState, getLikeState]
  );

  const toggleLikeGlobal = useCallback(
    async (nftId: string, userId: string) => {
      if (!userId) {
        toast.error("Login to like", {
          description: "You need to be logged in to like songs",
        });
        return;
      }

      if (!nftId) {
        toast.error("Error", {
          description: "Could not process like",
        });
        return;
      }

      const currentState = getLikeState(nftId);

      // Prevenir múltiples requests simultáneos
      if (processingLikesRef.current.has(nftId)) return;

      // Marcar como procesando
      processingLikesRef.current.add(nftId);

      try {
        // Actualización optimista del UI (SIN loading para mejor UX)
        const newIsLiked = !currentState.isLiked;
        const newLikesCount = newIsLiked
          ? currentState.likesCount + 1
          : Math.max(0, currentState.likesCount - 1);

        setLikeState(nftId, {
          likesCount: newLikesCount,
          isLiked: newIsLiked,
          isLoading: false, // Mantener false para evitar parpadeo
        });

        // Llamada a la API en background
        const result = await toggleLike({ userId, nftId });

        if (result.success) {
          // Solo actualizar si los datos del servidor son diferentes
          if (
            result.likesCount !== newLikesCount ||
            result.isLiked !== newIsLiked
          ) {
            setLikeState(nftId, {
              likesCount: result.likesCount || 0,
              isLiked: result.isLiked || false,
              isLoading: false,
            });
          }

          toast.success(result.isLiked ? "Liked!" : "Unliked", {
            duration: 2000,
          });

          // Emitir evento personalizado para sincronización adicional
          window.dispatchEvent(
            new CustomEvent("likeToggled", {
              detail: {
                nftId,
                isLiked: result.isLiked,
                likesCount: result.likesCount,
              },
            })
          );
        } else {
          // Revertir cambios optimistas si falla
          setLikeState(nftId, {
            likesCount: currentState.likesCount,
            isLiked: currentState.isLiked,
            isLoading: false,
          });

          toast.error("Error processing like", {
            description: result.message || "Try again",
          });
        }
      } catch (error) {
        // Revertir cambios optimistas en caso de error
        setLikeState(nftId, {
          likesCount: currentState.likesCount,
          isLiked: currentState.isLiked,
          isLoading: false,
        });

        console.error("Error toggling like:", error);
        toast.error("Connection error", {
          description: "Could not process like",
        });
      } finally {
        // Quitar del set de procesando
        processingLikesRef.current.delete(nftId);
      }
    },
    [getLikeState, setLikeState]
  );

  // Listener para eventos de sincronización entre pestañas/ventanas
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "likes_sync" && e.newValue) {
        try {
          const { nftId, isLiked, likesCount } = JSON.parse(e.newValue);
          setLikeState(nftId, { likesCount, isLiked, isLoading: false });
        } catch (error) {
          console.error("Error parsing likes sync:", error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [setLikeState]);

  // Sincronización con localStorage para persistencia entre recargas
  useEffect(() => {
    const handleLikeToggled = (e: CustomEvent) => {
      const { nftId, isLiked, likesCount } = e.detail;
      // Guardar en localStorage para sincronización entre pestañas
      localStorage.setItem(
        "likes_sync",
        JSON.stringify({ nftId, isLiked, likesCount })
      );
    };

    window.addEventListener("likeToggled", handleLikeToggled as EventListener);
    return () =>
      window.removeEventListener(
        "likeToggled",
        handleLikeToggled as EventListener
      );
  }, []);

  const value = {
    likes,
    toggleLikeGlobal,
    setLikeState,
    loadLikeStatus,
    getLikeState,
  };

  return (
    <LikesContext.Provider value={value}>{children}</LikesContext.Provider>
  );
}

export function useLikesContext() {
  const context = useContext(LikesContext);
  if (context === undefined) {
    throw new Error("useLikesContext must be used within a LikesProvider");
  }
  return context;
}
