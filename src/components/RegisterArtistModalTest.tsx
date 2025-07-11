import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@Src/ui/components/ui/dialog";
import { Button } from "@Src/ui/components/ui/button";
import { useState, useEffect } from "react";
import { useToast } from "@Src/ui/components/ui/use-toast";
import { useTranslations } from "next-intl";

const RegisterArtistModalTest = ({
  open,
  onClose,
  title,
  buttonText,
  onSuccess,
}: any) => {
  const [fanName, setFanName] = useState("");
  const [fanType, setFanType] = useState<string>("");
  const [genres, setGenres] = useState<Record<string, string>>({});
  const [description, setDescription] = useState<string>("");
  const [assets, setAssets] = useState<string[]>([]);

  const { toast } = useToast();
  const tForms = useTranslations("forms");
  const tCommon = useTranslations("common");

  // Reset state when the modal opens
  useEffect(() => {
    if (open) {
      setFanName("");
      setFanType("");
      setGenres({});
      setDescription("");
      setAssets([]);
    }
  }, [open]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    toast({
      title: "Registering artist...",
      description: "Please wait while we process your registration.",
      duration: 3000,
    });

    setTimeout(() => {
      toast({
        title: "Artist User Created in Allfeat",
        description: "Your profile has been successfully created.",
      });

      onSuccess({
        name: fanName,
        mainType: fanType,
        avatar:
          "https://cdn-ijfed.nitrocdn.com/DtYdoFkTGLHFYfuSCOprrunYCajuUVPb/assets/images/optimized/rev-9454958/mariskalrock.com/wp-content/uploads/2021/05/till-lindemann-beloved-town-2021.jpg",
      });
      onClose();
    }, 3000);
  };

  return (
    <Dialog open={open}>
      <div className="justify-center items-center w-[380px] z-50">
        <DialogContent
          onClick={(e) => e.stopPropagation()}
          className="sm:mx-auto sm:max-w-[380px] w-[380px] rounded-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <DialogTitle className="text-lg font-semibold">
                {title}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                Fill in the details to create your profile.
              </DialogDescription>
            </div>
            <Button onClick={onClose} className="text-white">
              ✖
            </Button>
          </div>
          <div className="mt-4">
            <div className="border border-gray-300 p-4 rounded-lg">
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    {tCommon("name")}
                  </label>
                  <input
                    type="text"
                    value={fanName}
                    onChange={(e) => setFanName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder={tForms("enterName")}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    {tForms("artistType")}
                  </label>
                  <input
                    type="text"
                    value={fanType}
                    onChange={(e) => setFanType(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder={tForms("enterDescription")}
                  />
                </div>

                <Button
                  type="submit"
                  className="mt-4 w-full text-white rounded-lg py-2 bg-blue-500 hover:bg-blue-700"
                >
                  {buttonText}
                </Button>
              </form>
            </div>
          </div>
        </DialogContent>
      </div>
    </Dialog>
  );
};

export default RegisterArtistModalTest;
