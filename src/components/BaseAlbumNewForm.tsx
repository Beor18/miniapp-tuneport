"use client";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@Src/ui/components/ui/button";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@Src/ui/components/ui/dialog";
import { Input } from "@Src/ui/components/ui/input";
import { Label } from "@Src/ui/components/ui/label";
import { Textarea } from "@Src/ui/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@Src/ui/components/ui/select";

import { Switch } from "@Src/ui/components/ui/switch";
import { Badge } from "@Src/ui/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@Src/ui/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@Src/ui/components/ui/tabs";
import {
  Loader2,
  CheckCircle,
  Music2Icon,
  CalendarIcon,
  ImageIcon,
  CloudUploadIcon,
  MusicIcon,
  Zap,
  Users,
  DollarSign,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useWallets } from "@Src/lib/privy";
import { ethers } from "ethers";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  useBlockchainOperations,
  BlockchainType,
} from "@Src/lib/hooks/common/useBlockchainOperations";

interface BaseAlbumNewFormProps {
  nickname?: string;
  // Props para modo controlado externamente
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  showButton?: boolean;
}

interface Collaborator {
  address: string;
  mintPercentage: number;
  royaltyPercentage: number;
  name: string;
}

export default function BaseAlbumNewForm({
  nickname,
  isOpen: externalIsOpen,
  onOpenChange: externalOnOpenChange,
  showButton = true,
}: BaseAlbumNewFormProps) {
  const router = useRouter();
  const { wallets } = useWallets();

  const tMusic = useTranslations("music");
  const tAlbum = useTranslations("album");
  const tCommon = useTranslations("common");
  const tForms = useTranslations("forms");
  const tPlayer = useTranslations("player");

  // Estados básicos - usar estado externo si está disponible
  const [internalIsDialogOpen, setInternalIsDialogOpen] = useState(false);
  const isDialogOpen =
    externalIsOpen !== undefined ? externalIsOpen : internalIsDialogOpen;
  const setIsDialogOpen = useCallback(
    (open: boolean) => {
      if (externalOnOpenChange) {
        externalOnOpenChange(open);
      } else {
        setInternalIsDialogOpen(open);
      }
    },
    [externalOnOpenChange]
  );
  const [isCreating, setIsCreating] = useState(false);
  const [isCreated, setIsCreated] = useState(false);
  const [transactionPending, setTransactionPending] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState("collection");

  // PASO 1: Sistema de pagos
  const [createNewPaymentSystem, setCreateNewPaymentSystem] = useState(true);
  const [paymentSystemName, setPaymentSystemName] = useState("");
  const [paymentSystemDescription, setPaymentSystemDescription] = useState("");

  // PASO 2: Colaboradores - Nueva estructura
  const [totalRoyaltyPercentage, setTotalRoyaltyPercentage] = useState(5);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    {
      address: "",
      mintPercentage: 100,
      royaltyPercentage: 100,
      name: "Main Artist", // Se actualizará en useEffect
    },
  ]);

  // PASO 3: Estados para el formulario (sin royaltyFee y sin precio fijo)
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [maxSupply, setMaxSupply] = useState("1000");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [musicGenre, setMusicGenre] = useState("");
  const [collectionType, setCollectionType] = useState("SINGLE");

  // PASO 4: Configurar DAI
  const [enableDAI, setEnableDAI] = useState(false);
  const [paymentToken, setPaymentToken] = useState("ETH");

  // Obtener dirección EVM
  const [evmAddress, setEvmAddress] = useState("");

  // Usar useBlockchainOperations con blockchain "base" y useERC1155 true
  const { createCollection, isCreatingCollection } = useBlockchainOperations({
    blockchain: "base" as BlockchainType,
    useERC1155: true,
  });

  useEffect(() => {
    // Encontrar una wallet EVM
    const evmWallet = wallets.find(
      (wallet: any) =>
        wallet.walletClientType === "privy" ||
        wallet.walletClientType === "metamask" ||
        wallet.walletClientType === "coinbase_wallet" ||
        wallet.walletClientType === "walletconnect"
    );

    if (evmWallet) {
      setEvmAddress(evmWallet.address);
      // Configurar automáticamente el artista principal
      setCollaborators((prev) =>
        prev.map((collab, index) =>
          index === 0
            ? {
                ...collab,
                address: evmWallet.address,
                name: tAlbum("mainArtist"),
              }
            : collab
        )
      );
    }
  }, [wallets, tAlbum]);

  // Funciones para colaboradores - Actualizadas
  const getTotalMintPercentage = useCallback(() => {
    return collaborators.reduce(
      (sum, collab) => sum + collab.mintPercentage,
      0
    );
  }, [collaborators]);

  const getTotalRoyaltyPercentage = useCallback(() => {
    return collaborators.reduce(
      (sum, collab) => sum + collab.royaltyPercentage,
      0
    );
  }, [collaborators]);

  // Función para redistribuir porcentajes automáticamente
  const redistributePercentages = (newCollaborators: Collaborator[]) => {
    if (newCollaborators.length === 0) return newCollaborators;

    const equalPercentage = Math.floor(100 / newCollaborators.length);
    const remainder = 100 - equalPercentage * newCollaborators.length;

    return newCollaborators.map((collab, index) => ({
      ...collab,
      mintPercentage: equalPercentage + (index === 0 ? remainder : 0), // Main artist gets remainder
      royaltyPercentage: equalPercentage + (index === 0 ? remainder : 0),
    }));
  };

  const addCollaborator = () => {
    const newCollaborators = [
      ...collaborators,
      {
        address: "",
        mintPercentage: 0,
        royaltyPercentage: 0,
        name: `${tAlbum("collaborator")} ${collaborators.length}`,
      },
    ];

    // Redistribuir automáticamente
    setCollaborators(redistributePercentages(newCollaborators));
  };

  const removeCollaborator = (index: number) => {
    if (collaborators.length > 1) {
      const filteredCollaborators = collaborators.filter((_, i) => i !== index);
      // Redistribuir automáticamente después de eliminar
      setCollaborators(redistributePercentages(filteredCollaborators));
    }
  };

  const updateCollaborator = (
    index: number,
    field: keyof Collaborator,
    value: string | number
  ) => {
    const updated = [...collaborators];
    updated[index] = { ...updated[index], [field]: value };

    // Si se está cambiando un porcentaje, redistribuir automáticamente
    if (field === "mintPercentage" || field === "royaltyPercentage") {
      const newPercentage = Number(value);
      const remainingPercentage = 100 - newPercentage;
      const otherCollaborators = updated.filter((_, i) => i !== index);

      if (otherCollaborators.length > 0) {
        // Calcular la suma actual de los otros colaboradores
        const currentTotal = otherCollaborators.reduce(
          (sum, collab) => sum + collab[field],
          0
        );

        // Redistribuir proporcionalmente
        otherCollaborators.forEach((collab, i) => {
          const originalIndex = updated.findIndex((c) => c === collab);
          if (currentTotal > 0) {
            // Redistribuir proporcionalmente basado en sus porcentajes actuales
            const proportion = collab[field] / currentTotal;
            updated[originalIndex][field] = Math.round(
              remainingPercentage * proportion
            );
          } else {
            // Si todos tenían 0, distribuir equitativamente
            updated[originalIndex][field] = Math.round(
              remainingPercentage / otherCollaborators.length
            );
          }
        });

        // Ajustar cualquier diferencia por redondeo al primer colaborador (que no sea el editado)
        const finalTotal = updated.reduce(
          (sum, collab) => sum + collab[field],
          0
        );
        const difference = 100 - finalTotal;

        if (difference !== 0) {
          const firstOtherIndex = updated.findIndex((_, i) => i !== index);
          if (firstOtherIndex !== -1) {
            updated[firstOtherIndex][field] = Math.max(
              0,
              updated[firstOtherIndex][field] + difference
            );
          }
        }
      }
    }

    setCollaborators(updated);
  };

  // Función para sincronizar porcentajes cuando cambian los mint percentages
  const syncRoyaltyPercentages = () => {
    setCollaborators((prev) =>
      prev.map((collab) => ({
        ...collab,
        royaltyPercentage: collab.mintPercentage,
      }))
    );
  };

  // Manejar el cambio de imagen
  const handleImageChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        setCoverImage(file);
        setCoverUrl(URL.createObjectURL(file));
      }
    },
    []
  );

  // Resetear el formulario
  const resetForm = useCallback(() => {
    setName("");
    setSymbol("");
    setDescription("");
    setMaxSupply("1000");
    setCoverImage(null);
    setCoverUrl("");
    setStartDate("");
    setEndDate("");
    setMusicGenre("");
    setCollectionType("SINGLE");
    setIsCreated(false);
    setActiveTab("collection");

    // Reset payment system
    setCreateNewPaymentSystem(true);
    setPaymentSystemName(tForms("myMusicProject"));
    setPaymentSystemDescription(tForms("musicProjectDescription"));

    // Reset collaborators - Nueva estructura
    setTotalRoyaltyPercentage(5);
    setCollaborators([
      {
        address: evmAddress,
        mintPercentage: 100,
        royaltyPercentage: 100,
        name: tAlbum("mainArtist"),
      },
    ]);

    // Reset payment config
    setEnableDAI(false);
    setPaymentToken("ETH");
  }, [evmAddress, tForms, tAlbum]);

  // Cerrar el diálogo
  useEffect(() => {
    if (!isDialogOpen) {
      resetForm();
    }
  }, [isDialogOpen, resetForm]);

  // Efecto para cerrar después de crear
  useEffect(() => {
    if (isCreated) {
      const timer = setTimeout(() => {
        setIsDialogOpen(false);
        router.refresh();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isCreated, router, setIsDialogOpen]);

  // Crear colección
  const createCollectionFunc = useCallback(async () => {
    try {
      if (!evmAddress) {
        toast.error(tCommon("connectWalletRequired"));
        return;
      }

      if (!name || !symbol) {
        toast.error(tForms("nameSymbolRequired"));
        return;
      }

      if (getTotalMintPercentage() !== 100) {
        toast.error(tForms("mintPercentageError"));
        return;
      }

      if (getTotalRoyaltyPercentage() !== 100) {
        toast.error(tForms("royaltyPercentageError"));
        return;
      }

      setIsCreating(true);

      // Toast inicial
      toast.loading(tPlayer("preparingCollection"), {
        id: "base-creation",
      });

      // Calcular timestamps
      const startTimestamp = startDate
        ? Math.floor(new Date(startDate).getTime() / 1000)
        : Math.floor(Date.now() / 1000);

      const endTimestamp = endDate
        ? Math.floor(new Date(endDate).getTime() / 1000)
        : Math.floor(Date.now() / 1000) + 31536000; // +1 año por defecto

      // Generar un baseURI simulado de IPFS
      const baseURI = `ipfs://bafybei${Math.random()
        .toString(36)
        .substring(2, 15)}/${name.toLowerCase().replace(/\s+/g, "-")}/`;

      // Preparar parámetros con configuración de Revenue Share para Base (sin precio fijo)
      const params = {
        name,
        symbol: symbol || name.substring(0, 4).toUpperCase(),
        baseURI,
        mintStartDate: startTimestamp,
        mintEndDate: endTimestamp,
        paymentToken: paymentToken, // DAI o ETH nativo
        royaltyReceiver: evmAddress,
        royaltyFee: totalRoyaltyPercentage * 100, // Convertir porcentaje a basis points
        coverImage: coverImage || undefined,
        musicGenre,
        collectionType,
        // Configuración de Revenue Share
        createRevenueShare: createNewPaymentSystem,
        revenueShareName: paymentSystemName,
        revenueShareDescription: paymentSystemDescription,
        collaborators: collaborators.map((c) => ({
          address: c.address,
          mintPercentage: c.mintPercentage,
          royaltyPercentage: c.royaltyPercentage,
          name: c.name,
        })),
      };

      setTransactionPending(true);
      toast.loading(tPlayer("waitingWalletConfirmation"), {
        id: "base-creation",
      });

      // Llamar a la función de creación usando useBlockchainOperations para Base
      //console.log("params >>>>> ", nickname);
      const newCollectionAddress = await createCollection({
        ...params,
        nickname: nickname || undefined, // Pasar el nickname para revalidar
      });

      if (newCollectionAddress) {
        setIsCreating(false);
        setTransactionPending(false);
        setIsCreated(true);

        toast.success(tPlayer("albumCreatedSuccessfully"), {
          id: "base-creation",
          description: `${tCommon("address")}: ${newCollectionAddress}`,
        });
      } else {
        throw new Error(tCommon("couldNotCreateCollection"));
      }
    } catch (err) {
      console.error("Error al crear la colección:", err);
      toast.error(tCommon("errorCreatingCollection"), {
        id: "base-creation",
        description:
          err instanceof Error ? err.message : tCommon("pleaseTryAgain"),
      });

      setIsCreating(false);
      setTransactionPending(false);
    }
  }, [
    evmAddress,
    name,
    symbol,
    startDate,
    endDate,
    totalRoyaltyPercentage,
    createCollection,
    coverImage,
    musicGenre,
    collectionType,
    createNewPaymentSystem,
    paymentSystemName,
    paymentSystemDescription,
    collaborators,
    getTotalMintPercentage,
    getTotalRoyaltyPercentage,
    nickname,
    paymentToken,
    tCommon,
    tForms,
    tPlayer,
  ]);

  // Función para obtener el título dinámico
  const getDialogTitle = () => {
    return tAlbum("createSingleTrack");
  };

  // Función para obtener el texto del botón
  const getButtonText = () => {
    if (isCreating) return tCommon("creating");
    return tAlbum("createSingle");
  };

  return (
    <div>
      {showButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsDialogOpen(true)}
          className="bg-zinc-900 border-zinc-800 text-zinc-100 hover:text-zinc-100 hover:bg-zinc-900 hover:border-zinc-900 transition-colors flex items-center gap-2"
        >
          <Music2Icon className="h-4 w-4" />
          {tMusic("createMusic")}
        </Button>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] sm:w-[500px] md:w-[700px] lg:w-[800px] max-h-[90vh] flex flex-col p-0 bg-zinc-900 border border-zinc-700/30 shadow-xl shadow-zinc-900/10 rounded-xl">
          <DialogHeader className="px-6 py-4 border-b border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-900/90 relative">
            <DialogTitle className="text-xl font-semibold text-zinc-100 pr-10">
              {getDialogTitle()}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDialogOpen(false)}
              className="absolute right-4 top-4 h-8 w-8 p-0 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-zinc-900">
            {/* Loading overlays */}
            {isCreating && (
              <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-400" />
                  <p className="mt-2 text-sm text-zinc-400">
                    {tPlayer("preparingCollection")}
                  </p>
                </div>
              </div>
            )}

            {(transactionPending || isCreatingCollection) && (
              <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-400" />
                  <p className="mt-2 text-sm text-zinc-400">
                    {tPlayer("waitingWalletConfirmation")}
                  </p>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-center space-x-2 text-xs text-zinc-500">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span>{tPlayer("creatingNFTCollection")}</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2 text-xs text-zinc-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{tPlayer("creatingAlbumToken")}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isCreated && (
              <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto" />
                  <p className="mt-2 text-sm text-zinc-400">
                    {tPlayer("albumCreatedSuccessfully")}
                  </p>
                </div>
              </div>
            )}

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-grow flex flex-col min-h-0"
            >
              <TabsList className="px-4 pt-2 justify-start bg-zinc-900 w-full overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-zinc-900">
                <TabsTrigger
                  value="collection"
                  className="text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-xs sm:text-sm whitespace-nowrap px-3 py-2"
                >
                  <Music2Icon className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">
                    {tAlbum("collection")}
                  </span>
                  <span className="sm:hidden">{tAlbum("collection")}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="payments"
                  className="text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-xs sm:text-sm whitespace-nowrap px-3 py-2"
                >
                  <Zap className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">{tAlbum("payments")}</span>
                  <span className="sm:hidden">{tAlbum("payments")}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="collaborators"
                  className="text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-xs sm:text-sm whitespace-nowrap px-3 py-2"
                >
                  <Users className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">
                    {tAlbum("collaborators")}
                  </span>
                  <span className="sm:hidden">{tAlbum("collaborators")}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="payment"
                  className="text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-xs sm:text-sm whitespace-nowrap px-3 py-2"
                >
                  <DollarSign className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">{tAlbum("currency")}</span>
                  <span className="sm:hidden">{tAlbum("currency")}</span>
                </TabsTrigger>
              </TabsList>

              <div className="flex-grow overflow-y-auto p-4 sm:p-6">
                <form className="space-y-6 text-zinc-100">
                  {/* PASO 1: Configuración de Colección */}
                  <TabsContent
                    value="collection"
                    className="mt-0 focus-visible:outline-none space-y-4"
                  >
                    {/* Información sobre tokenización automática */}
                    <Card className="bg-gradient-to-r from-zinc-800 to-zinc-900 border-zinc-700/50">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-zinc-100 mb-1">
                              🪙 {tAlbum("automaticTokenization")}
                            </h4>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                              {tAlbum("automaticTokenizationDescription")}{" "}
                              <span className="text-blue-400 font-mono">
                                ${symbol || "SYMBOL"}
                              </span>
                              . {tAlbum("fansCanTrade")}
                            </p>
                            <div className="mt-2 flex items-center space-x-4 text-xs text-zinc-500">
                              <span className="flex items-center space-x-1">
                                <CheckCircle className="h-3 w-3 text-emerald-500" />
                                <span>{tCommon("noAdditionalCost")}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <CheckCircle className="h-3 w-3 text-emerald-500" />
                                <span>{tAlbum("instantLiquidity")}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 
                    REMOVED: Project Type Selection - Always SINGLE for hackathon simplicity 
                    <div className="space-y-6">
                      <div className="flex flex-col gap-2">
                        <Label
                          htmlFor="collectionType"
                          className="text-lg font-semibold text-zinc-100"
                        >
                          {tForms("selectProjectType")}
                        </Label>
                        <p className="text-sm text-zinc-400">
                          {tForms("chooseProjectType")}
                        </p>
                      </div>
                      <Card className="bg-gradient-to-br from-blue-800/80 to-blue-900/90 border-blue-600 shadow-md shadow-blue-900/20">
                        <CardHeader className="pb-2">
                          <div className="flex items-center space-x-2">
                            <div className="h-4 w-4 rounded-full bg-blue-600 flex items-center justify-center">
                              <div className="h-2 w-2 rounded-full bg-white"></div>
                            </div>
                            <CardTitle>
                              <div className="text-lg text-zinc-100 flex items-center">
                                <MusicIcon className="mr-2 h-5 w-5 text-blue-400" />
                                {tAlbum("single")}
                              </div>
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="text-zinc-300">
                            <p className="font-medium">
                              {tAlbum("singleDescription")}
                            </p>
                          </CardDescription>
                        </CardContent>
                      </Card>
                    </div>
                    */}

                    {/* Always show form since collectionType is always SINGLE */}
                    {true && (
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-zinc-200">
                            {tForms("singleName")}
                          </Label>
                          <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={tForms("musicProject")}
                            className="bg-zinc-800 border-zinc-700"
                          />
                        </div>

                        <div>
                          <Label htmlFor="symbol">
                            {tForms("symbol")} (4 characters)
                          </Label>
                          <Input
                            id="symbol"
                            value={symbol}
                            onChange={(e) =>
                              setSymbol(
                                e.target.value.toUpperCase().substring(0, 4)
                              )
                            }
                            placeholder={tForms("symbolPlaceholder")}
                            maxLength={4}
                            className="bg-zinc-800 border-zinc-700"
                          />
                        </div>

                        <div>
                          <Label htmlFor="description">
                            {tCommon("description")}
                          </Label>
                          <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={tForms("describeProject")}
                            className="bg-zinc-800 border-zinc-700 min-h-[80px]"
                          />
                        </div>

                        <div>
                          <Label htmlFor="maxSupply">
                            {tForms("maxSupply")}
                          </Label>
                          <Input
                            id="maxSupply"
                            type="number"
                            value={maxSupply}
                            onChange={(e) => setMaxSupply(e.target.value)}
                            min="1"
                            placeholder={tForms("maxSupplyPlaceholder")}
                            className="bg-zinc-800 border-zinc-700"
                          />
                          <p className="text-xs text-zinc-400 mt-1">
                            {tForms("maxSupplyDescription")}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="startDate">
                              {tForms("releaseDate")}
                            </Label>
                            <div className="relative">
                              <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                              <Input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-zinc-800 border-zinc-700 pl-10"
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="endDate">{tForms("endDate")}</Label>
                            <div className="relative">
                              <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                              <Input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-zinc-800 border-zinc-700 pl-10"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="musicGenre">
                            {tForms("musicGenre")}
                          </Label>
                          <Select
                            value={musicGenre}
                            onValueChange={(value) => setMusicGenre(value)}
                          >
                            <SelectTrigger className="bg-zinc-800 border-zinc-700">
                              <SelectValue
                                placeholder={tForms("selectGenre")}
                              />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-700">
                              <SelectItem
                                value="Rock"
                                className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100"
                              >
                                Rock
                              </SelectItem>
                              <SelectItem
                                value="Cumbia"
                                className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100"
                              >
                                Cumbia
                              </SelectItem>
                              <SelectItem
                                value="Cuarteto"
                                className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100"
                              >
                                Cuarteto
                              </SelectItem>
                              <SelectItem
                                value="Pop"
                                className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100"
                              >
                                Pop
                              </SelectItem>
                              <SelectItem
                                value="Jazz"
                                className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100"
                              >
                                Jazz
                              </SelectItem>
                              <SelectItem
                                value="Classical"
                                className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100"
                              >
                                Classical
                              </SelectItem>
                              <SelectItem
                                value="Hip Hop"
                                className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100"
                              >
                                Hip Hop
                              </SelectItem>
                              <SelectItem
                                value="Electronic"
                                className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100"
                              >
                                Electronic
                              </SelectItem>
                              <SelectItem
                                value="Heavy Metal"
                                className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100"
                              >
                                Heavy Metal
                              </SelectItem>
                              <SelectItem
                                value="Other"
                                className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100"
                              >
                                {tCommon("other")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="coverImage">
                            {tForms("coverArt")}
                          </Label>
                          <div className="mt-1">
                            <div className="flex items-center justify-center w-full">
                              <label
                                htmlFor="coverImage"
                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-zinc-800 border-zinc-700 hover:bg-zinc-700/50"
                              >
                                {coverUrl ? (
                                  <div className="relative w-full h-full">
                                    <Image
                                      src={coverUrl}
                                      alt="Preview"
                                      fill
                                      className="object-contain rounded-lg"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <ImageIcon className="w-8 h-8 mb-2 text-zinc-500" />
                                    <p className="text-sm text-zinc-500">
                                      {tForms("clickToUpload")}
                                    </p>
                                  </div>
                                )}
                                <input
                                  id="coverImage"
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={handleImageChange}
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* PASO 2: Sistema de Pagos */}
                  <TabsContent
                    value="payments"
                    className="mt-0 focus-visible:outline-none space-y-4"
                  >
                    <div className="space-y-4">
                      <div className="bg-blue-900/20 border border-blue-600 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-400">
                          💰 {tForms("smartPaymentSystem")}
                        </h4>
                        <p className="text-sm text-blue-300 mt-1">
                          {tForms("createPaymentSplitter")}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="paymentName">
                          {tForms("paymentSystemName")}
                        </Label>
                        <Input
                          id="paymentName"
                          value={paymentSystemName}
                          onChange={(e) => setPaymentSystemName(e.target.value)}
                          placeholder={tForms("collaborativeProject")}
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="paymentDescription">
                          {tCommon("description")}
                        </Label>
                        <Textarea
                          id="paymentDescription"
                          value={paymentSystemDescription}
                          onChange={(e) =>
                            setPaymentSystemDescription(e.target.value)
                          }
                          placeholder={tForms("collaborativeDescription")}
                          className="bg-zinc-800 border-zinc-700 min-h-[80px]"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* PASO 3: Colaboradores - REESTRUCTURADO */}
                  <TabsContent
                    value="collaborators"
                    className="mt-0 focus-visible:outline-none space-y-4"
                  >
                    <div className="space-y-6">
                      <div className="bg-green-900/20 border border-green-600 p-4 rounded-lg">
                        <h4 className="font-semibold text-green-400">
                          👥 {tAlbum("earningsSplit")}
                        </h4>
                        <p className="text-sm text-green-300 mt-1">
                          {tAlbum("earningsSplitDescription")}
                        </p>
                      </div>

                      {/* Configuración de Royalties Totales */}
                      <div className="bg-purple-900/20 border border-purple-600 p-4 rounded-lg space-y-3">
                        <h5 className="font-semibold text-purple-400">
                          📈 {tAlbum("resaleRoyalties")}
                        </h5>
                        <p className="text-sm text-purple-300">
                          {tAlbum("resaleRoyaltiesDescription")}
                        </p>
                        <div className="flex items-center space-x-4">
                          <div className="flex-1">
                            <Label htmlFor="totalRoyaltyPercentage">
                              {tAlbum("totalRoyaltyPercentage")}
                            </Label>
                            <Input
                              id="totalRoyaltyPercentage"
                              type="number"
                              value={totalRoyaltyPercentage}
                              onChange={(e) =>
                                setTotalRoyaltyPercentage(
                                  parseInt(e.target.value) || 0
                                )
                              }
                              min="0"
                              max="10"
                              placeholder="5"
                              className="bg-zinc-800 border-zinc-700"
                            />
                          </div>
                          <div className="text-sm text-zinc-400 mt-6">
                            {tAlbum("recommendedRange")}
                          </div>
                        </div>
                      </div>

                      {/* Status de distribución */}
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">
                          {tAlbum("splitByCollaborator")}
                        </h3>
                        <div className="flex space-x-2">
                          <Badge
                            variant={
                              getTotalMintPercentage() === 100
                                ? "default"
                                : "destructive"
                            }
                          >
                            {tAlbum("sales")}: {getTotalMintPercentage()}%
                          </Badge>
                          <Badge
                            variant={
                              getTotalRoyaltyPercentage() === 100
                                ? "default"
                                : "destructive"
                            }
                          >
                            {tAlbum("royalties")}: {getTotalRoyaltyPercentage()}
                            %
                          </Badge>
                        </div>
                      </div>

                      {/* Lista de colaboradores */}
                      {collaborators.map((collab, index) => (
                        <div
                          key={index}
                          className="p-4 border border-zinc-600 rounded-lg space-y-3"
                        >
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium">{collab.name}</h4>
                            {collaborators.length > 1 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeCollaborator(index)}
                                type="button"
                                className="bg-red-900/20 border-red-600 text-red-400 hover:bg-red-900/40 hover:text-red-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="md:col-span-2">
                              <Label>{tCommon("name")}</Label>
                              <Input
                                value={collab.name}
                                onChange={(e) =>
                                  updateCollaborator(
                                    index,
                                    "name",
                                    e.target.value
                                  )
                                }
                                placeholder={tForms("collaboratorName")}
                                className="bg-zinc-800 border-zinc-700"
                              />
                            </div>

                            <div>
                              <Label>{tAlbum("salesPercentage")}</Label>
                              <Input
                                type="number"
                                value={collab.mintPercentage}
                                onChange={(e) =>
                                  updateCollaborator(
                                    index,
                                    "mintPercentage",
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                min="0"
                                max="100"
                                className="bg-zinc-800 border-zinc-700"
                                placeholder="60"
                              />
                            </div>

                            <div>
                              <Label>{tAlbum("royaltiesPercentage")}</Label>
                              <Input
                                type="number"
                                value={collab.royaltyPercentage}
                                onChange={(e) =>
                                  updateCollaborator(
                                    index,
                                    "royaltyPercentage",
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                min="0"
                                max="100"
                                className="bg-zinc-800 border-zinc-700"
                                placeholder="60"
                              />
                            </div>
                          </div>

                          <div>
                            <Label>{tForms("walletAddress")}</Label>
                            <Input
                              value={collab.address}
                              onChange={(e) =>
                                updateCollaborator(
                                  index,
                                  "address",
                                  e.target.value
                                )
                              }
                              placeholder={tForms("walletAddressPlaceholder")}
                              className="bg-zinc-800 border-zinc-700"
                            />
                          </div>
                        </div>
                      ))}

                      <div className="space-y-3">
                        <Button
                          variant="outline"
                          onClick={addCollaborator}
                          className="w-full bg-blue-900/20 border-blue-600 text-blue-400 hover:bg-blue-900/40 hover:text-blue-300"
                          type="button"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {tAlbum("addCollaborator")}
                        </Button>

                        {/* Botón de redistribución automática */}
                        {collaborators.length > 1 && (
                          <div className="bg-orange-900/20 border border-orange-600 p-3 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-orange-400">
                                  {tAlbum("autoSplitTitle")}
                                </p>
                                <p className="text-xs text-orange-300">
                                  {tAlbum("autoSplitDescription")}
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setCollaborators(
                                    redistributePercentages(collaborators)
                                  )
                                }
                                type="button"
                                className="bg-orange-900/20 border-orange-600 text-orange-400 hover:bg-orange-900/40 hover:text-orange-300"
                              >
                                ⚡ {tAlbum("autoSplit")}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Preview de distribución */}
                      <div className="bg-zinc-700/50 p-4 rounded-lg space-y-3">
                        <h4 className="font-semibold">
                          📊 {tAlbum("earningsPreview")}:
                        </h4>

                        <div className="space-y-2">
                          <h5 className="text-sm font-medium text-blue-400">
                            💰 {tAlbum("initialSales")}:
                          </h5>
                          {collaborators.map((collab, index) => (
                            <div
                              key={`mint-${index}`}
                              className="flex justify-between text-sm"
                            >
                              <span>{collab.name}:</span>
                              <span>
                                {collab.mintPercentage}% (
                                {enableDAI ? "DAI" : "ETH"})
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-2">
                          <h5 className="text-sm font-medium text-purple-400">
                            🔄 {tAlbum("resaleRoyalties")}:
                          </h5>
                          <p className="text-xs text-zinc-400 mb-2">
                            {tAlbum("resaleDistributionInfo")}{" "}
                            {totalRoyaltyPercentage}%:
                          </p>
                          {collaborators.map((collab, index) => (
                            <div
                              key={`royalty-${index}`}
                              className="flex justify-between text-sm"
                            >
                              <span>{collab.name}:</span>
                              <span>
                                {(
                                  (totalRoyaltyPercentage *
                                    collab.royaltyPercentage) /
                                  100
                                ).toFixed(1)}
                                % {tAlbum("ofResalePrice")}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="mt-2 pt-2 border-t border-zinc-600 text-xs text-zinc-400">
                          {tAlbum("pricePerCopyNote")} (
                          {enableDAI ? "DAI" : "ETH"})
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* PASO 4: Configurar Moneda */}
                  <TabsContent
                    value="payment"
                    className="mt-0 focus-visible:outline-none space-y-4"
                  >
                    <div className="space-y-4">
                      <div className="bg-yellow-900/20 border border-yellow-600 p-4 rounded-lg">
                        <h4 className="font-semibold text-yellow-400">
                          💱 {tAlbum("paymentCurrency")}
                        </h4>
                        <p className="text-sm text-yellow-300 mt-1">
                          {tAlbum("paymentCurrencyDescription")}
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="paymentToken">
                          {tAlbum("paymentCurrency")}
                        </Label>
                        <Select
                          value={paymentToken}
                          onValueChange={(value) => {
                            setPaymentToken(value);
                            setEnableDAI(value === "DAI");
                          }}
                        >
                          <SelectTrigger className="bg-zinc-800 border-zinc-700">
                            <SelectValue
                              placeholder={tForms("selectCurrency")}
                            />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-800 border-zinc-700">
                            <SelectItem
                              value="ETH"
                              className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100"
                            >
                              {tAlbum("ethEthereum")}
                            </SelectItem>
                            <SelectItem
                              value={symbol || "ALBUM_COIN"}
                              className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100"
                            >
                              🪙 ${symbol} ({tAlbum("albumToken")})
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="bg-blue-900/20 border border-blue-600 p-4 rounded-lg">
                        <h5 className="font-semibold text-blue-400 mb-2">
                          💡 {tAlbum("flexiblePricing")}
                        </h5>
                        <p className="text-sm text-blue-300">
                          {tAlbum("flexiblePricingDescription")}
                        </p>
                      </div>

                      {enableDAI && (
                        <div className="bg-green-900/20 border border-green-600 p-4 rounded-lg">
                          <h5 className="font-semibold text-green-400 mb-2">
                            ✅ {tAlbum("daiActivated")}
                          </h5>
                          <p className="text-sm text-green-300">
                            {tAlbum("daiActivatedDescription")}
                          </p>
                        </div>
                      )}

                      {paymentToken === (symbol || "ALBUM_COIN") && (
                        <div className="bg-purple-900/20 border border-purple-600 p-4 rounded-lg">
                          <h5 className="font-semibold text-purple-400 mb-2">
                            🪙 {tAlbum("albumTokenPaymentActivated")}
                          </h5>
                          <p className="text-sm text-purple-300 mb-2">
                            {tAlbum("albumTokenPaymentDescription")}{" "}
                            <span className="font-mono text-purple-200">
                              ${symbol}
                            </span>{" "}
                            {tAlbum("albumTokenCircularEconomy")}
                          </p>
                          <ul className="text-xs text-purple-300 space-y-1">
                            <li>• {tAlbum("albumTokenBenefit1")}</li>
                            <li>• {tAlbum("albumTokenBenefit2")}</li>
                            <li>• {tAlbum("albumTokenBenefit3")}</li>
                            <li>• {tAlbum("albumTokenBenefit4")}</li>
                          </ul>
                        </div>
                      )}

                      <div className="bg-zinc-700/50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">
                          💰 {tAlbum("automaticSplit")}:
                        </h4>
                        {collaborators.map((collab, index) => (
                          <div
                            key={index}
                            className="flex justify-between text-sm"
                          >
                            <span>{collab.name}:</span>
                            <span>{collab.mintPercentage}%</span>
                          </div>
                        ))}
                        <div className="mt-2 pt-2 border-t border-zinc-600 text-xs text-zinc-400">
                          {tAlbum("automaticSplitNote")}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </form>
              </div>
            </Tabs>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-zinc-800 bg-zinc-900">
            <Button
              onClick={createCollectionFunc}
              disabled={
                isCreating ||
                isCreated ||
                !name ||
                !symbol ||
                !evmAddress ||
                isUploadingImage ||
                getTotalMintPercentage() !== 100 ||
                getTotalRoyaltyPercentage() !== 100 ||
                false // collectionType is always SINGLE
              }
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 hover:shadow-lg text-white disabled:opacity-50 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-500 transition-all font-medium"
            >
              {getButtonText()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
