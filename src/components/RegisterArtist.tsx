import { useTranslations } from "next-intl";

const RegisterArtist = ({
  artistName,
  setArtistName,
  artistType,
  setArtistType,
  genres,
  setGenres,
  description,
  setDescription,
  assets,
  setAssets,
}: any) => {
  const tForms = useTranslations("forms");

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={artistName}
        onChange={(e) => setArtistName(e.target.value)}
        placeholder={tForms("artistName")}
        //required
        className="w-full p-2 border border-gray-300 rounded"
      />
      <input
        type="text"
        value={artistType}
        onChange={(e) => setArtistType(e.target.value)}
        placeholder={tForms("artistType")}
        //required
        className="w-full p-2 border border-gray-300 rounded"
      />
      {/* <input
        type="text"
        value={genres}
        onChange={(e) => setGenres(e.target.value)}
        placeholder={tForms("genres")}
        //required
        className="w-full p-2 border border-gray-300 rounded"
      /> */}
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={tForms("description")}
        //required
        className="w-full p-2 border border-gray-300 rounded"
      />
      <input
        type="text"
        value={assets}
        onChange={(e) => setAssets(e.target.value)}
        placeholder={tForms("assets")}
        //required
        className="w-full p-2 border border-gray-300 rounded"
      />
    </div>
  );
};

export default RegisterArtist;
