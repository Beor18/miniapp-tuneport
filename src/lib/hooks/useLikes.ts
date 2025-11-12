"use client";

import { useCallback, useEffect } from "react";
import { useLikesContext } from "@Src/contexts/LikesContext";
import { useAuthUser } from "@Src/contexts/AuthUserContext"; // 🔥 Usar Context en lugar del hook directo

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nftId]); // Solo depender del nftId para evitar loops

  // 🔥 DESHABILITADO: Carga automática de likes causa loop infinito (30+ fetches simultáneos)
  // Los likes ahora solo se cargan cuando el usuario interactúa con el botón de like
  // o cuando se pasa initialLikesCount/initialIsLiked desde el servidor

  // useEffect(() => {
  //   if (!userId || !nftId || !isAuthenticated) return;
  //   const currentState = getLikeState(nftId);
  //   const shouldLoad =
  //     currentState.likesCount === 0 &&
  //     !currentState.isLiked &&
  //     !currentState.isLoading;
  //   if (shouldLoad) {
  //     loadLikeStatusGlobal(nftId, userId);
  //   }
  // }, [userId, nftId, isAuthenticated]);

  const handleToggleLike = useCallback(async () => {
    if (!isAuthenticated || !userId) {
      console.warn("Usuario no autenticado para dar like");
      return;
    }

    // 🔥 Cargar estado antes del toggle si no hay datos
    const currentState = getLikeState(nftId);
    const hasNoData =
      currentState.likesCount === 0 &&
      !currentState.isLiked &&
      !currentState.isLoading;

    if (hasNoData) {
      await loadLikeStatusGlobal(nftId, userId);
    }

    await toggleLikeGlobal(nftId, userId);
  }, [
    nftId,
    userId,
    isAuthenticated,
    toggleLikeGlobal,
    getLikeState,
    loadLikeStatusGlobal,
  ]);

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
