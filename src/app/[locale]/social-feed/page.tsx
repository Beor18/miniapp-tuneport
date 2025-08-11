import { getTranslations } from "next-intl/server";
import LeaderboardTabs from "@Src/components/LeaderboardTabs";

// Función para obtener usuarios de Farcaster
async function getFarcasterUsers() {
  try {
    const baseUrl = "https://miniapp.tuneport.xyz";

    const fullUrl = `${baseUrl}/api/farcaster/user-quality-leaderboard`;

    const response = await fetch(fullUrl, {
      cache: "no-cache",
    });

    if (!response.ok) {
      throw new Error(`Error fetching users: ${response.status}`);
    }

    const data = await response.json();
    // Forzar serialización correcta para evitar pérdida de campos
    return data.success ? JSON.parse(JSON.stringify(data)) : null;
  } catch (error) {
    console.error("Error fetching Farcaster users:", error);
    return null;
  }
}

// Función para obtener playlists populares
async function getPopularPlaylists() {
  try {
    const params = new URLSearchParams({
      q: "",
      page: "1",
      limit: "15",
      sortBy: "updatedAt",
      sortOrder: "desc",
    });

    const response = await fetch(
      `${process.env.API_ELEI}/api/playlists/search?${params}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        next: { revalidate: 300 }, // Revalidar cada 5 minutos
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success || !result.data) {
      return null;
    }

    // Filtrar solo playlists públicas con NFTs y calcular score de popularidad
    const publicPlaylists = result.data
      .filter((playlist: any) => playlist.isPublic && playlist.nfts.length > 0)
      .map((playlist: any) => ({
        ...playlist,
        score:
          playlist.nfts.length * 10 +
          (playlist.totalDuration || 0) / 60 +
          (new Date().getTime() - new Date(playlist.createdAt).getTime()) /
            (1000 * 60 * 60 * 24 * -1),
      }))
      .sort((a: any, b: any) => b.score - a.score);

    return publicPlaylists;
  } catch (error) {
    console.error("Error fetching playlists:", error);
    return null;
  }
}

export default async function SocialFeedPage() {
  const tLeaderboard = await getTranslations("farcaster.leaderboard");

  // Fetch paralelo de datos en el servidor
  const [farcasterData, playlistsData] = await Promise.all([
    getFarcasterUsers(),
    getPopularPlaylists(),
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#18181b] via-[#1a1a1d] to-[#18181b]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header Premium con elementos virales */}
        <div className="text-center mb-6 relative">
          {/* Efecto de partículas de fondo */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-10 left-1/4 w-2 h-2 bg-yellow-400 rounded-full opacity-70 animate-pulse"></div>
            <div className="absolute top-20 right-1/3 w-1 h-1 bg-purple-400 rounded-full opacity-80 animate-ping"></div>
            <div className="absolute top-5 right-1/4 w-1.5 h-1.5 bg-blue-400 rounded-full opacity-60 animate-pulse"></div>
          </div>

          {/* Título principal viral */}
          <div className="relative">
            <h1 className="text-3xl md:text-6xl font-black mb-4 bg-gradient-to-r from-yellow-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent leading-tight">
              🏆 {tLeaderboard("title")}
            </h1>
            {/* Subtítulo con call-to-action viral */}
            <p className="text-md text-zinc-300 mb-6 max-w-2xl mx-auto">
              {tLeaderboard("subtitle")}
            </p>
          </div>
        </div>

        {/* Componente de tabs con datos pre-fetched */}
        <LeaderboardTabs
          farcasterData={farcasterData}
          playlistsData={playlistsData}
        />
      </div>
    </div>
  );
}
