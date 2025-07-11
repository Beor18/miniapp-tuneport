import { useEffect, useState } from "react";
import { ApiPromise, WsProvider, HttpProvider } from "@polkadot/api";

// Configuración del proveedor de WebSocket
const wsProvider = new HttpProvider("https://harmonie-endpoint-02.allfeat.io");

const useArtistProfile = (address: string | undefined) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArtistProfile = async () => {
      if (!address) return;

      try {
        setLoading(true);
        setError(null);

        // Construir la instancia de la API de Polkadot
        const api = await ApiPromise.create({ provider: wsProvider });

        // Consultar los datos del artista
        const artistData = await api.query.artists.artistOf(address);

        // console.log("artistData: ", artistData.toHuman());

        // console.log("artistData crudo: ", artistData);
        // Convertir los datos a un formato legible
        const humanReadableData = artistData.toHuman();

        // Actualizar el estado con los datos del perfil del artista
        setProfile(humanReadableData);
      } catch (err) {
        setError("Failed to fetch artist profile");
      } finally {
        setLoading(false);
      }
    };

    fetchArtistProfile();
  }, [address]);

  return { profile, loading, error };
};

export default useArtistProfile;
