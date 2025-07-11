"use client";

import { useCallback, useEffect } from "react";
import { useLikesContext } from "@Src/contexts/LikesContext";
import { useAuthUser } from "./useAuthUser";

interface UseLikesProps {
  nftId: string;
  initialLikesCount?: number;
  initialIsLiked?: boolean;
}

export function useLikes({
  nftId,
  initialLikesCount = 0,
  initialIsLiked = false,
}: UseLikesProps) {
  const {
    getLikeState,
    setLikeState,
    toggleLikeGlobal,
    loadLikeStatus: loadLikeStatusGlobal,
  } = useLikesContext();

  const { userId, isAuthenticated } = useAuthUser();
  const likeState = getLikeState(nftId);

  // Inicializar con datos iniciales si no existen en el contexto
  useEffect(() => {
    const currentState = getLikeState(nftId);
    // Solo inicializar si realmente no hay datos y tenemos datos iniciales
    const hasNoData =
      currentState.likesCount === 0 &&
      !currentState.isLiked &&
      !currentState.isLoading;
    const hasInitialData = initialLikesCount > 0 || initialIsLiked;

    if (hasNoData && hasInitialData) {
      setLikeState(nftId, {
        likesCount: initialLikesCount,
        isLiked: initialIsLiked,
        isLoading: false,
      });
    }
  }, [nftId]); // Solo depender del nftId para evitar loops

  // Cargar estado desde el servidor si hay userId y no hay datos
  useEffect(() => {
    if (userId && nftId && !likeState.isLoading && isAuthenticated) {
      // Solo cargar si no tenemos datos o si son los datos iniciales por defecto
      const shouldLoad = likeState.likesCount === 0 && !likeState.isLiked;
      if (shouldLoad) {
        loadLikeStatusGlobal(nftId, userId);
      }
    }
  }, [userId, nftId, isAuthenticated]); // Simplificamos las dependencias

  const handleToggleLike = useCallback(async () => {
    if (!isAuthenticated || !userId) {
      console.warn("Usuario no autenticado para dar like");
      return;
    }
    await toggleLikeGlobal(nftId, userId);
  }, [nftId, userId, isAuthenticated, toggleLikeGlobal]);

  const loadLikeStatus = useCallback(async () => {
    if (!userId || !nftId || !isAuthenticated) return;
    await loadLikeStatusGlobal(nftId, userId);
  }, [nftId, userId, isAuthenticated, loadLikeStatusGlobal]);

  return {
    likesCount: likeState.likesCount,
    isLiked: likeState.isLiked,
    isLoading: likeState.isLoading || false,
    handleToggleLike,
    loadLikeStatus,
  };
}
