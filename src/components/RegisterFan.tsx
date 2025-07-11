import { useTranslations } from "next-intl";

const RegisterFan = ({
  fanName,
  setFanName,
  fanDescription,
  setFanDescription,
}: any) => {
  const tForms = useTranslations("forms");

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={fanName}
        onChange={(e) => setFanName(e.target.value)}
        placeholder={tForms("enterName")}
        //required
        className="w-full p-2 border border-gray-300 rounded"
      />
      <textarea
        value={fanDescription}
        onChange={(e) => setFanDescription(e.target.value)}
        placeholder={tForms("musicLover")}
        //required
        className="w-full p-2 border border-gray-300 rounded"
      />
    </div>
  );
};

export default RegisterFan;
