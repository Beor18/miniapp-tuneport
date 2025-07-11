import { useState, useEffect } from "react";
import { ApiPromise, WsProvider, HttpProvider } from "@polkadot/api";
import { blake2AsHex } from "@polkadot/util-crypto";
import { stringToU8a } from "@polkadot/util";
import { useAccount } from "wagmi";
import { web3Enable, web3FromAddress } from "@polkadot/extension-dapp";

// Configuración del proveedor de WebSocket
// const wsProvider = new WsProvider("wss://harmonie-endpoint-02.allfeat.io");

// // Define los tipos personalizados
// const types = {
//   ArtistType: {
//     _enum: [
//       "Singer",
//       "Instrumentalist",
//       "Composer",
//       "Lyricist",
//       "Producer",
//       "DiscJokey",
//       "Conductor",
//       "Arranger",
//       "Engineer",
//       "Director",
//     ],
//   },
//   GenresRegistryMusicGenre: {
//     _enum: [
//       "Classical",
//       "Jazz",
//       "Rock",
//       "Electronic",
//       "Rap",
//       "Pop",
//       "Country",
//       "Blues",
//       "Soul",
//       "Reggae",
//       "Folk",
//       "RnB",
//       "Metal",
//       "Punk",
//       "Indie",
//       "EDM",
//       "Latin",
//       "World",
//     ],
//   },
//   GenresRegistryRockSubtype: {
//     _enum: [
//       "ClassicRock",
//       "HardRock",
//       "AlternativeRock",
//       "ProgressiveRock",
//       "PunkRock",
//       "Psychedelic",
//     ],
//   },
//   Option: "Option<Bytes>",
// };

const useRegisterArtist = () => {
  //   const { address } = useAccount();
  //   const [loading, setLoading] = useState<boolean>(false);
  //   const [error, setError] = useState<string | null>(null);
  //   const [api, setApi] = useState<ApiPromise | null>(null);

  //   useEffect(() => {
  //     const enableWeb3 = async () => {
  //       try {
  //         // Habilitar las extensiones
  //         const extensions = await web3Enable("YourAppName");
  //         if (extensions.length === 0) {
  //           setError("No wallet extension found");
  //           return;
  //         }

  //         // Inicializar la API de Polkadot
  //         const apiInstance = await ApiPromise.create({
  //           provider: wsProvider,
  //           types,
  //         });

  //         setApi(apiInstance);
  //       } catch (err) {
  //         setError("Failed to enable wallet extension");
  //         console.error(err);
  //       }
  //     };

  //     enableWeb3();
  //   }, []);

  //   const registerArtist = async (
  //     mainName: string,
  //     mainType: string,
  //     genres: Record<string, string>,
  //     description: string,
  //     assets: string[]
  //   ) => {
  //     if (!address || !api) return;

  //     try {
  //       setLoading(true);
  //       setError(null);

  //       // Obtener el signer desde Talisman Wallet
  //       const injector = await web3FromAddress(address);

  //       // Asignar el signer a la API
  //       api.setSigner(injector.signer);

  //       // Generar los hashes utilizando la API de Polkadot
  //       const descriptionHash = description
  //         ? blake2AsHex(stringToU8a(description), 256)
  //         : null;
  //       const assetsHashes = assets.map((asset) =>
  //         blake2AsHex(stringToU8a(asset), 256)
  //       );

  //       // Convertir los datos a tipos Polkadot adecuados
  //       const mainTypeEnum = api.registry.createType("ArtistType", mainType);

  //       const descriptionOption = api.registry.createType(
  //         "Option<Hash>",
  //         descriptionHash
  //       );
  //       const assetsVec = assetsHashes.map((assetHash) =>
  //         api.registry.createType("Hash", assetHash)
  //       );

  //       // Verificaciones de depuración
  //       console.log("Main Name: ", mainName);
  //       console.log("Main Type Enum: ", mainTypeEnum);
  //       console.log("Description Option: ", descriptionOption);
  //       console.log("Assets Vec: ", assetsVec);

  //       const tx = api.tx.artists.register(
  //         mainName,
  //         mainTypeEnum,
  //         null, // Extra types, si es necesario, puedes agregar este campo.
  //         null, // Genres, si es necesario, puedes agregar este campo.
  //         descriptionOption,
  //         assetsVec
  //       );

  //       console.log("TX: ", tx);

  //       // Firma y envío de la transacción usando la cuenta de Talisman Wallet
  //       const unsub = await tx.signAndSend(address, ({ status, events }) => {
  //         if (status.isInBlock || status.isFinalized) {
  //           console.log("Transaction successful:", status.toHuman());
  //           events.forEach(({ event: { data, method, section } }) => {
  //             console.log(`\t${section}.${method}:: ${data}`);
  //           });
  //           unsub();
  //         }
  //       });
  //     } catch (err) {
  //       setError("Failed to register artist");
  //       console.error(err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //console.log("Hook");

  const registerArtist = "";
  const loading = false;
  const error = {};

  return { registerArtist, loading, error };
};

export default useRegisterArtist;
