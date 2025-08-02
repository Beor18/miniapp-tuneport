"use client";

import React, { useState, useContext, useEffect } from "react";
import { UserRegistrationContext } from "@Src/app/providers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogDescription,
} from "@Src/ui/components/ui/dialog";
import { Button } from "@Src/ui/components/ui/button";
import { Input } from "@Src/ui/components/ui/input";
import { Label } from "@Src/ui/components/ui/label";
import {
  Loader2,
  User,
  Mail,
  AtSign,
  UserCog,
  FastForward,
  ArrowRight,
  X,
} from "lucide-react";
import { createUser } from "@Src/app/actions/createUser.actions";
import { checkNicknameAvailability } from "@Src/app/actions/checkNickname.actions";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@Src/ui/components/ui/select";

// Función para generar nombres aleatorios
const generateRandomName = () => {
  const adjectives = [
    "Cool",
    "Amazing",
    "Awesome",
    "Creative",
    "Brilliant",
    "Funky",
    "Melodic",
    "Rhythmic",
  ];
  const nouns = [
    "Listener",
    "Fan",
    "Enthusiast",
    "Melody",
    "Rhythm",
    "Beat",
    "Music",
  ];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj} ${noun}`;
};

// Función para generar nicknames aleatorios basados en el nombre
const generateRandomNickname = () => {
  // Generar un nombre aleatorio
  const randomName = generateRandomName();

  // Extraer una parte del nombre (convertir a minúsculas y quitar espacios)
  const namePart = randomName.toLowerCase().replace(/\s+/g, "");

  // Generar un número aleatorio
  const randomNumber = Math.floor(Math.random() * 10000);

  // Combinar el prefijo "user-" con partes del nombre y un número
  return `user-${namePart}${randomNumber}`;
};

type RegistrationFormProps = {
  walletAddressEvm?: any;
  walletAddressSolana: any;
  type?: any;
  email: string | null;
  // 🆕 FARCASTER: Datos de Farcaster
  farcasterData?: {
    fid: number;
    username: string;
    displayName: string;
    pfp: string;
    bio: string;
  } | null;
};

export default function RegistrationForm({
  walletAddressEvm,
  walletAddressSolana,
  email,
  farcasterData,
}: RegistrationFormProps) {
  const { setIsRegistered, setUserData } = useContext(UserRegistrationContext);
  const [formData, setFormData] = useState({
    name: farcasterData?.displayName || "",
    nickname: farcasterData?.username || "",
    email: email || "",
    userType: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado para indicar si el nickname está disponible
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(
    null
  );
  // Estado para indicar si estamos verificando el nickname
  const [checkingNickname, setCheckingNickname] = useState(false);

  const router = useRouter();
  // console.log("email", email);

  // Actualizar el email en formData cuando cambia la prop email
  useEffect(() => {
    if (email) {
      setFormData((prev) => ({
        ...prev,
        email: email,
      }));
    }
  }, [email]);

  // 🆕 Verificar automáticamente la disponibilidad del nickname de Farcaster
  useEffect(() => {
    const checkFarcasterNickname = async () => {
      if (
        farcasterData?.username &&
        formData.nickname === farcasterData.username
      ) {
        const nicknameRegex = /^[A-Za-z][A-Za-z0-9]*$/;

        // Solo verificar si el nickname cumple con el formato
        if (nicknameRegex.test(farcasterData.username)) {
          setCheckingNickname(true);
          setNicknameAvailable(null);

          try {
            const available = await checkNicknameAvailability(
              farcasterData.username
            );
            setNicknameAvailable(available);
          } catch (error) {
            console.error(
              "Error checking Farcaster nickname availability:",
              error
            );
            setNicknameAvailable(false);
          } finally {
            setCheckingNickname(false);
          }
        } else {
          // Si no cumple el formato, marcar como no disponible
          setNicknameAvailable(false);
          setCheckingNickname(false);
        }
      }
    };

    // Solo ejecutar si tenemos datos de Farcaster y el nickname aún no ha sido verificado
    if (
      farcasterData?.username &&
      nicknameAvailable === null &&
      !checkingNickname
    ) {
      checkFarcasterNickname();
    }
  }, [farcasterData, formData.nickname, nicknameAvailable, checkingNickname]);

  // Validación del formato de nickname
  // Debe empezar con una letra y no contener espacios, sólo letras y números.
  const nicknameRegex = /^[A-Za-z][A-Za-z0-9]*$/;
  const isNicknameFormatValid = nicknameRegex.test(formData.nickname);

  const allFieldsFilled =
    formData.name.trim() !== "" &&
    formData.nickname.trim() !== "" &&
    formData.userType.trim() !== ""; // Email ya no es requerido

  const canSubmit =
    allFieldsFilled &&
    isNicknameFormatValid &&
    nicknameAvailable === true &&
    !checkingNickname &&
    !isSubmitting;

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "nickname") {
      // Primero reseteamos estados relacionados al nickname
      setNicknameAvailable(null);

      // Si el nickname cumple con el formato, verificamos disponibilidad
      if (nicknameRegex.test(value) && value.trim() !== "") {
        setCheckingNickname(true);
        const available = await checkNicknameAvailability(value);
        setNicknameAvailable(available);
        setCheckingNickname(false);
      } else {
        // Si no cumple el formato, no verificamos e indicamos que no está disponible aún.
        setNicknameAvailable(null);
      }
    }
  };

  const handleUserTypeChange = (value: any) => {
    setFormData((prev) => ({ ...prev, userType: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const newUser = await createUser({
        ...formData,
        address: walletAddressEvm || "",
        address_solana: walletAddressSolana || "",
        type: formData.userType,
        // 🆕 FARCASTER: Incluir datos de Farcaster si están disponibles
        ...(farcasterData && {
          farcaster_fid: farcasterData.fid,
          farcaster_username: farcasterData.username,
          farcaster_display_name: farcasterData.displayName,
          farcaster_pfp: farcasterData.pfp,
          farcaster_bio: farcasterData.bio,
          farcaster_verified: true, // Si tiene datos de Farcaster, asumimos que está verificado
        }),
      });

      if (newUser) {
        setUserData(newUser);
        setIsRegistered(true);
      }
      router.refresh();
    } catch (error: any) {
      console.error("Error al enviar la solicitud:", error);
      setError(error.message || "Error al registrar usuario");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    setError(null);

    // Generar nombre aleatorio
    const randomName = generateRandomName();

    // Intentar generar un nickname disponible
    let randomNickname = "";
    let isAvailable = false;
    let attempts = 0;

    while (!isAvailable && attempts < 10) {
      randomNickname = generateRandomNickname();
      isAvailable = await checkNicknameAvailability(randomNickname);
      attempts++;
    }

    if (!isAvailable) {
      setError("Could not generate a random nickname. Please try again.");
      setIsSubmitting(false);
      return;
    }

    // Establecer los datos del formulario con valores aleatorios
    const randomFormData = {
      name: randomName,
      nickname: randomNickname,
      email: email || "",
      userType: "fan",
    };

    try {
      const newUser = await createUser({
        ...randomFormData,
        address: walletAddressEvm || "",
        address_solana: walletAddressSolana || "",
        type: randomFormData.userType,
        // 🆕 FARCASTER: Incluir datos de Farcaster si están disponibles (incluso en skip)
        ...(farcasterData && {
          farcaster_fid: farcasterData.fid,
          farcaster_username: farcasterData.username,
          farcaster_display_name: farcasterData.displayName,
          farcaster_pfp: farcasterData.pfp,
          farcaster_bio: farcasterData.bio,
          farcaster_verified: true,
        }),
      });

      if (newUser) {
        setUserData(newUser);
        setIsRegistered(true);
      }
      router.refresh();
    } catch (error: any) {
      console.error("Error al enviar la solicitud:", error);
      setError(error.message || "Error al registrar usuario");
    } finally {
      setIsSubmitting(false);
    }
  };

  const nicknameMessage = () => {
    if (formData.nickname.trim() === "") return null;

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

    if (nicknameAvailable === true) {
      return (
        <p className="text-green-500 text-sm mt-1 flex items-center">
          <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          Nickname available
        </p>
      );
    }

    return null;
  };

  const [showModal, setShowModal] = useState(true); // Abrimos automáticamente

  return (
    <div className="flex items-center">
      <Button
        onClick={() => {
          // Pequeño delay para evitar parpadeo al abrir el modal
          setTimeout(() => {
            setShowModal(true);
          }, 50);
        }}
        className="bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 hover:border-zinc-600 transition-colors duration-200 flex items-center gap-1.5 px-3 py-1.5 rounded text-sm"
      >
        <UserCog className="h-3.5 w-3.5" />
        Complete Profile
      </Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogOverlay className="bg-black/80 backdrop-blur-sm z-50">
          <DialogContent className="w-[95vw] max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl mx-4 bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="mb-6 relative">
              <Button
                onClick={() => setShowModal(false)}
                className="absolute -top-2 -right-2 h-8 w-8 p-0 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 rounded-full transition-colors duration-200"
                aria-label="Cerrar modal"
              >
                <X className="h-4 w-4 text-zinc-400" />
              </Button>
              <DialogTitle className="text-lg sm:text-xl font-bold text-zinc-100 pr-8">
                Complete Your Profile
              </DialogTitle>
              <DialogDescription className="text-zinc-400 mt-1.5 text-sm sm:text-base">
                Set up your account to start using the music platform.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-md px-3 sm:px-4 py-2 sm:py-3 mb-4">
                  <p className="text-red-500 text-xs sm:text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-2 sm:space-y-3">
                <Label
                  htmlFor="name"
                  className="text-zinc-300 flex items-center text-sm sm:text-base"
                >
                  <User className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-zinc-500" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="bg-zinc-800 border-zinc-700 focus:border-zinc-600 text-zinc-100 placeholder:text-zinc-500 h-10 sm:h-11 text-sm sm:text-base"
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="nickname"
                  className="text-zinc-300 flex items-center text-sm sm:text-base"
                >
                  <AtSign className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-zinc-500" />
                  Nickname
                </Label>
                <Input
                  id="nickname"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleChange}
                  required
                  className="bg-zinc-800 border-zinc-700 focus:border-zinc-600 text-zinc-100 placeholder:text-zinc-500 h-10 sm:h-11 text-sm sm:text-base"
                  placeholder="Choose a unique nickname"
                />
                <div className="h-5">{nicknameMessage()}</div>
              </div>

              {/* Campo de email oculto pero activo */}
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!!email}
                className="hidden"
              />

              <div className="space-y-2 sm:space-y-3">
                <Label
                  htmlFor="userType"
                  className="text-zinc-300 flex items-center text-sm sm:text-base"
                >
                  <UserCog className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-zinc-500" />
                  Your Role
                </Label>
                <Select onValueChange={handleUserTypeChange} required>
                  <SelectTrigger className="w-full bg-zinc-800 border-zinc-700 focus:border-zinc-600 text-zinc-100 h-10 sm:h-11 text-sm sm:text-base">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-100">
                    <SelectItem
                      value="fan"
                      className="focus:bg-zinc-700 text-sm sm:text-base"
                    >
                      Fan
                    </SelectItem>
                    <SelectItem
                      value="artist"
                      className="focus:bg-zinc-700 text-sm sm:text-base"
                    >
                      Artist
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Botones de acción */}
              <div className="space-y-3 sm:space-y-4">
                {/* Información sobre Skip */}
                <div className="bg-blue-900/30 border border-blue-700/50 rounded-md p-2 sm:p-3 mb-2">
                  <p className="text-blue-300 text-xs sm:text-sm flex items-start">
                    <FastForward className="w-3 h-3 sm:w-4 sm:h-4 mr-2 mt-0.5 flex-shrink-0 text-blue-400" />
                    <span>
                      <strong>Skip registration?</strong> We&apos;ll create a
                      random profile for you so you can start exploring right
                      away.
                    </span>
                  </p>
                </div>

                <div className="flex flex-col space-y-2 sm:space-y-3">
                  {/* Botón principal */}
                  <Button
                    type="submit"
                    className={`transition-all duration-300 h-10 sm:h-12 text-sm sm:text-base ${
                      canSubmit
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                    }`}
                    disabled={!canSubmit}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                        <span>Registering...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <span className="font-medium">Create Account</span>
                        <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                      </div>
                    )}
                  </Button>

                  {/* Divisor con "OR" */}
                  <div className="relative flex items-center justify-center">
                    <div className="absolute w-full border-t border-zinc-700"></div>
                    <span className="relative px-3 sm:px-4 bg-zinc-900 text-zinc-400 text-xs sm:text-sm font-medium">
                      OR
                    </span>
                  </div>

                  {/* Botón de Skip */}
                  <Button
                    type="button"
                    onClick={handleSkip}
                    className="bg-zinc-800 hover:bg-blue-800 text-zinc-200 border border-zinc-700 hover:border-blue-600 h-10 sm:h-12 text-sm sm:text-base transition-all duration-300"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <FastForward className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
                        <span className="font-medium">Skip & Join</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-zinc-500 text-center mt-3 sm:mt-4 px-2">
                By registering, you agree to our Terms of Service and Privacy
                Policy
              </p>
            </form>
          </DialogContent>
        </DialogOverlay>
      </Dialog>
    </div>
  );
}
