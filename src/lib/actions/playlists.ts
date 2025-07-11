"use server";

interface CreatePlaylistData {
  name: string;
  description?: string;
  userId: string;
  nfts?: string[];
  isPublic?: boolean;
  coverImage?: string;
  tags?: string[];
  // 🪙 NUEVAS PROPIEDADES PARA TOKENIZACIÓN
  coin_address?: string; // Dirección del contrato de colección ERC1155
  coinSymbol?: string; // Símbolo del token creado ($SYMBOL)
  isTokenized?: boolean; // Indica si la playlist fue tokenizada
}

interface UpdatePlaylistData {
  name?: string;
  description?: string;
  isPublic?: boolean;
  coverImage?: string;
  tags?: string[];
  nfts?: string[];
}

// Crear nueva playlist
export async function createPlaylist(data: CreatePlaylistData) {
  try {
    const response = await fetch(
      `${process.env.API_ELEI}/api/playlists/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error("Error al crear la playlist");
    }

    const result = await response.json();
    return { success: true, data: result.data, message: result.message };
  } catch (error) {
    console.error("Error creating playlist:", error);
    return { success: false, error: "Error al crear la playlist" };
  }
}

// Obtener playlists de un usuario
export async function getUserPlaylists(
  userId: string,
  includePrivate: boolean = true
) {
  try {
    const response = await fetch(
      `${process.env.API_ELEI}/api/playlists/getUserPlaylists/${userId}?includePrivate=${includePrivate}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Error al obtener las playlists");
    }

    const result = await response.json();
    return { success: true, data: result.data, count: result.count };
  } catch (error) {
    console.error("Error fetching user playlists:", error);
    return { success: false, error: "Error al obtener las playlists" };
  }
}

// Obtener una playlist específica
export async function getPlaylist(playlistId: string) {
  try {
    const response = await fetch(
      `${process.env.API_ELEI}/api/playlists/${playlistId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Error al obtener la playlist");
    }

    const result = await response.json();
    return { success: true, data: result.data };
  } catch (error) {
    console.error("Error fetching playlist:", error);
    return { success: false, error: "Error al obtener la playlist" };
  }
}

// Actualizar playlist
export async function updatePlaylist(
  playlistId: string,
  data: UpdatePlaylistData,
  userId: string
) {
  try {
    const response = await fetch(
      `${process.env.API_ELEI}/api/playlists/update/${playlistId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...data, userId }),
      }
    );

    if (!response.ok) {
      throw new Error("Error al actualizar la playlist");
    }

    const result = await response.json();
    return { success: true, data: result.data, message: result.message };
  } catch (error) {
    console.error("Error updating playlist:", error);
    return { success: false, error: "Error al actualizar la playlist" };
  }
}

// Eliminar playlist
export async function deletePlaylist(playlistId: string, userId: string) {
  try {
    const response = await fetch(
      `${process.env.API_ELEI}/api/playlists/delete/${playlistId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      }
    );

    if (!response.ok) {
      throw new Error("Error al eliminar la playlist");
    }

    const result = await response.json();
    return { success: true, message: result.message };
  } catch (error) {
    console.error("Error deleting playlist:", error);
    return { success: false, error: "Error al eliminar la playlist" };
  }
}

// Agregar NFT a playlist
export async function addNftToPlaylist(
  playlistId: string,
  nftId: string,
  userId: string
) {
  try {
    const response = await fetch(
      `${process.env.API_ELEI}/api/playlists/manage-nfts/${playlistId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "add",
          nftId,
          userId,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Error al agregar NFT a la playlist");
    }

    const result = await response.json();
    return { success: true, data: result.data, message: result.message };
  } catch (error) {
    console.error("Error adding NFT to playlist:", error);
    return { success: false, error: "Error al agregar NFT a la playlist" };
  }
}

// Quitar NFT de playlist
export async function removeNftFromPlaylist(
  playlistId: string,
  nftId: string,
  userId: string
) {
  try {
    const response = await fetch(
      `${process.env.API_ELEI}/api/playlists/manage-nfts/${playlistId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "remove",
          nftId,
          userId,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Error al quitar NFT de la playlist");
    }

    const result = await response.json();
    return { success: true, data: result.data, message: result.message };
  } catch (error) {
    console.error("Error removing NFT from playlist:", error);
    return { success: false, error: "Error al quitar NFT de la playlist" };
  }
}

// Buscar playlists públicas
export async function searchPlaylists(
  query: string,
  filters?: {
    page?: number;
    limit?: number;
    tag?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }
) {
  try {
    const params = new URLSearchParams({
      q: query,
      page: (filters?.page || 1).toString(),
      limit: (filters?.limit || 10).toString(),
      ...(filters?.tag && { tag: filters.tag }),
      ...(filters?.sortBy && { sortBy: filters.sortBy }),
      ...(filters?.sortOrder && { sortOrder: filters.sortOrder }),
    });

    const response = await fetch(
      `${process.env.API_ELEI}/api/playlists/search?${params}`,
      {
        method: "GET",
        next: {
          revalidate: 60,
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Error al buscar playlists");
    }

    const result = await response.json();
    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
    };
  } catch (error) {
    console.error("Error searching playlists:", error);
    return { success: false, error: "Error al buscar playlists" };
  }
}
