/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@Src/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@Src/ui/components/ui/dialog";
import { Pencil, X, Camera, AtSign, Loader2 } from "lucide-react";
import { checkNicknameAvailability } from "@Src/app/actions/checkNickname.actions";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

interface ProfileEditModalProps {
  initialName: string;
  initialNickname: string;
  initialBiography: string;
  initialTwitter: string;
  initialInstagram: string;
  initialSpotify: string;
  initialFacebook: string;
  initialPictureUrl: string;
  onSubmit: (
    name: string,
    nickname: string,
    biography: string,
    twitter: string,
    instagram: string,
    spotify: string,
    facebook: string,
    pictureFile: File | null
  ) => Promise<void>;
}

export function ProfileEditModal({
  initialName,
  initialNickname,
  initialBiography,
  initialTwitter,
  initialInstagram,
  initialSpotify,
  initialFacebook,
  initialPictureUrl,
  onSubmit,
}: ProfileEditModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const tUser = useTranslations("user");
  const tForms = useTranslations("forms");
  const tCommon = useTranslations("common");
  const [name, setName] = useState(initialName);
  const [nickname, setNickname] = useState(initialNickname);
  const [biography, setBiography] = useState(initialBiography);
  const [twitter, setTwitter] = useState(initialTwitter);
  const [instagram, setInstagram] = useState(initialInstagram);
  const [spotify, setSpotify] = useState(initialSpotify);
  const [facebook, setFacebook] = useState(initialFacebook);
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(initialPictureUrl);

  // Estados para validación de nickname
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(
    null
  );
  const [checkingNickname, setCheckingNickname] = useState(false);
  const [originalNickname] = useState(initialNickname);

  // Hooks para navegación
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pictureFile) {
      const objectUrl = URL.createObjectURL(pictureFile);
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [pictureFile]);

  // Validación del formato de nickname
  const nicknameRegex = /^[A-Za-z][A-Za-z0-9]*$/;
  const isNicknameFormatValid = nicknameRegex.test(nickname);

  // Función para validar nickname
  const handleNicknameChange = async (value: string) => {
    setNickname(value);
    setNicknameAvailable(null);

    // Si el nickname es el mismo que el original, considerarlo válido
    if (value === originalNickname) {
      setNicknameAvailable(true);
      return;
    }

    // Si el nickname cumple con el formato, verificamos disponibilidad
    if (nicknameRegex.test(value) && value.trim() !== "") {
      setCheckingNickname(true);
      const available = await checkNicknameAvailability(value);
      setNicknameAvailable(available);
      setCheckingNickname(false);
    } else {
      setNicknameAvailable(null);
    }
  };

  // Función para mostrar mensaje de validación del nickname
  const nicknameMessage = () => {
    if (nickname.trim() === "") return null;

    if (!isNicknameFormatValid) {
      return (
        <p className="text-red-500 text-sm mt-1 flex items-center">
          <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2"></span>
          The nickname must start with a letter and contain no spaces.
        </p>
      );
    }

    if (checkingNickname) {
      return (
        <p className="text-blue-400 text-sm mt-1 flex items-center">
          <Loader2 className="h-3 w-3 animate-spin mr-2" />
          Checking availability...
        </p>
      );
    }

    if (nicknameAvailable === false) {
      return (
        <p className="text-red-500 text-sm mt-1 flex items-center">
          <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2"></span>
          Nickname not available
        </p>
      );
    }

    if (nicknameAvailable === true && nickname !== originalNickname) {
      return (
        <p className="text-green-500 text-sm mt-1 flex items-center">
          <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          Nickname available
        </p>
      );
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verificar si el nickname cambió
    const nicknameChanged = nickname !== originalNickname;

    try {
      await onSubmit(
        name,
        nickname,
        biography,
        twitter,
        instagram,
        spotify,
        facebook,
        pictureFile
      );

      // Si el nickname cambió y estamos en una página de perfil, actualizar la URL
      if (nicknameChanged && pathname.includes("/u/")) {
        const newPathname = pathname.replace(/\/u\/[^\/]+/, `/u/${nickname}`);
        router.replace(newPathname);
      }

      setIsOpen(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      // Aquí puedes manejar el error sin cerrar el modal
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPictureFile(e.target.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setPictureFile(null);
    setPreviewUrl(initialPictureUrl);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-zinc-900 border-zinc-800 text-zinc-100 hover:text-zinc-100 hover:bg-zinc-900 hover:border-zinc-900 transition-colors flex items-center gap-2"
        >
          <Pencil className="h-4 w-4" />
          {tUser("editProfile")}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-[90vw] sm:max-w-md md:max-w-lg lg:max-w-xl max-h-[90vh] bg-zinc-900 border border-zinc-800 mx-4 sm:mx-auto overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 relative">
          <DialogTitle className="text-xl font-semibold text-zinc-100 pr-8">
            {tUser("editProfile")}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="absolute top-0 right-0 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="mt-4 space-y-4 px-1">
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="text-sm font-medium text-zinc-200"
              >
                {tCommon("name")}
              </label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={tForms("updateName")}
                className="w-full bg-zinc-800/50 border border-zinc-700 focus:border-zinc-600 text-zinc-100 placeholder:text-zinc-500 rounded-md p-3 text-base"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="nickname"
                className="text-sm font-medium text-zinc-200 flex items-center"
              >
                <AtSign className="w-4 h-4 mr-2 text-zinc-500" />
                {tUser("nickname")}
              </label>
              <input
                id="nickname"
                value={nickname}
                onChange={(e) => handleNicknameChange(e.target.value)}
                placeholder={tForms("enterNickname")}
                className="w-full bg-zinc-800/50 border border-zinc-700 focus:border-zinc-600 text-zinc-100 placeholder:text-zinc-500 rounded-md p-3 text-base"
              />
              <div className="h-5">{nicknameMessage()}</div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="biography"
                className="text-sm font-medium text-zinc-200"
              >
                {tUser("biography")}
              </label>
              <textarea
                id="biography"
                value={biography}
                onChange={(e) => setBiography(e.target.value)}
                placeholder={tForms("updateBiography")}
                className="w-full min-h-[80px] bg-zinc-800/50 border border-zinc-700 focus:border-zinc-600 text-zinc-100 placeholder:text-zinc-500 rounded-md p-3 text-base resize-none"
                rows={3}
              />
            </div>

            <div className="space-y-4">
              {[
                {
                  id: "twitter",
                  label: "Twitter",
                  value: twitter,
                  onChange: setTwitter,
                  placeholder: tForms("usernameTwitter"),
                },
                {
                  id: "spotify",
                  label: "Spotify",
                  value: spotify,
                  onChange: setSpotify,
                  placeholder: tForms("urlSpotify"),
                },
                {
                  id: "instagram",
                  label: "Instagram",
                  value: instagram,
                  onChange: setInstagram,
                  placeholder: tForms("userInstagram"),
                },
                {
                  id: "facebook",
                  label: "Facebook",
                  value: facebook,
                  onChange: setFacebook,
                  placeholder: tForms("userFacebook"),
                },
              ].map(({ id, label, value, onChange, placeholder }) => (
                <div key={id} className="space-y-2">
                  <label
                    htmlFor={id}
                    className="text-sm font-medium text-zinc-200"
                  >
                    {label}
                  </label>
                  <input
                    id={id}
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-zinc-800/50 border border-zinc-700 focus:border-zinc-600 text-zinc-100 placeholder:text-zinc-500 rounded-md p-3 text-base"
                  />
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="picture"
                className="text-sm font-medium text-zinc-200"
              >
                {tUser("profilePicture")}
              </label>
              <div className="flex justify-center py-4">
                <div className="relative group">
                  <img
                    src={previewUrl}
                    alt={tUser("profilePicturePreview")}
                    className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-full border border-zinc-700"
                  />
                  <label
                    htmlFor="picture"
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Camera className="h-5 w-5 sm:h-6 sm:w-6 text-zinc-100" />
                  </label>
                  <input
                    id="picture"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                  {pictureFile && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-1 -right-1 h-6 w-6 rounded-full"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              {pictureFile && (
                <p className="text-xs text-center text-zinc-400 mt-2 break-all px-2">
                  {pictureFile.name}
                </p>
              )}
            </div>
          </form>
        </div>

        <div className="flex-shrink-0 pt-4 border-t border-zinc-800 mt-4">
          <Button
            onClick={handleSubmit}
            disabled={
              checkingNickname ||
              (nickname !== originalNickname && nicknameAvailable !== true)
            }
            className={`w-full h-12 text-base font-medium transition-all ${
              checkingNickname ||
              (nickname !== originalNickname && nicknameAvailable !== true)
                ? "bg-zinc-700 text-zinc-400 cursor-not-allowed hover:bg-zinc-700"
                : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900"
            }`}
          >
            {checkingNickname ? (
              <div className="flex items-center justify-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>{tCommon("checking")}</span>
              </div>
            ) : (
              tCommon("saveChanges")
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
