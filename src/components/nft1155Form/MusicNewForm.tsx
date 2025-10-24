"use client";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@Src/ui/components/ui/button";
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
import { RadioGroup, RadioGroupItem } from "@Src/ui/components/ui/radio-group";
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
  Disc3,
  Users2,
  MusicIcon,
  Zap,
  Users,
  DollarSign,
  Plus,
  Trash2,
  Lock,
} from "lucide-react";
import { useWallets } from "@Src/lib/privy";
import { ethers } from "ethers";
import { toast } from "sonner";
import type { CreateCollectionParams } from "@Src/lib/contracts/erc1155";
import { useRouter } from "next/navigation";
import { useERC1155Factory } from "@Src/lib/contracts/erc1155";
import { useTranslations } from "next-intl";
import { Switch } from "@Src/ui/components/ui/switch";

interface MusicNewFormProps {
  nickname: string;
  useFactoryContract: (
    params: CreateCollectionParams
  ) => Promise<string | null>;
  isLoadingTransaction?: boolean;
}

interface Collaborator {
  address: string;
  mintPercentage: number;
  royaltyPercentage: number;
  name: string;
}

export default function MusicNewForm({
  nickname,
  useFactoryContract,
  isLoadingTransaction = false,
}: MusicNewFormProps) {
  const router = useRouter();
  const { wallets } = useWallets();
  const { uploadCoverImage, coverImageUrl: ipfsImageUrl } = useERC1155Factory();

  // Translation hooks
  const tNft = useTranslations("nft");
  const tCommon = useTranslations("common");
  const tForms = useTranslations("forms");
  const tAlbum = useTranslations("album");

  // Estados básicos
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreated, setIsCreated] = useState(false);
  const [transactionPending, setTransactionPending] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState("collection");

  // PASO 1: Sistema de pagos
  const [createNewPaymentSystem, setCreateNewPaymentSystem] = useState(true);

  // 🔒 x402: Configuración de contenido premium
  const [isPremiumAlbum, setIsPremiumAlbum] = useState(false);
  const [premiumPrice, setPremiumPrice] = useState("0.01");
  const [premiumNetwork, setPremiumNetwork] = useState<"base" | "base-sepolia">(
    "base-sepolia"
  );
  const [premiumDescription, setPremiumDescription] = useState(
    "Álbum premium exclusivo"
  );
  const [paymentSystemName, setPaymentSystemName] = useState("");
  const [paymentSystemDescription, setPaymentSystemDescription] = useState("");

  // PASO 2: Colaboradores - Nueva estructura
  const [totalRoyaltyPercentage, setTotalRoyaltyPercentage] = useState(5);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);

  // PASO 3: Estados para el formulario (sin royaltyFee)
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [maxSupply, setMaxSupply] = useState("1000");
  const [price, setPrice] = useState("0");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [musicGenre, setMusicGenre] = useState("");
  const [collectionType, setCollectionType] = useState("");

  // PASO 4: Configurar DAI
  const [enableDAI, setEnableDAI] = useState(true);
  const [paymentToken, setPaymentToken] = useState("ETH");

  // Obtener dirección EVM
  const [evmAddress, setEvmAddress] = useState("");

  // Initialize default values with translations
  useEffect(() => {
    setPaymentSystemName(tNft("collaborativeDrop"));
    setPaymentSystemDescription(tNft("dropDescription"));
  }, [tNft]);

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
      setCollaborators([
        {
          address: evmWallet.address,
          mintPercentage: 60,
          royaltyPercentage: 60,
          name: tNft("mainArtist"),
        },
        {
          address: "",
          mintPercentage: 25,
          royaltyPercentage: 25,
          name: `${tNft("collaborator")} 1`,
        },
        {
          address: "",
          mintPercentage: 15,
          royaltyPercentage: 15,
          name: `${tNft("collaborator")} 2`,
        },
      ]);
    }
  }, [wallets, tNft]);

  // Funciones para colaboradores - Actualizadas
  const getTotalMintPercentage = () => {
    return collaborators.reduce(
      (sum, collab) => sum + collab.mintPercentage,
      0
    );
  };

  const getTotalRoyaltyPercentage = () => {
    return collaborators.reduce(
      (sum, collab) => sum + collab.royaltyPercentage,
      0
    );
  };

  const addCollaborator = () => {
    setCollaborators([
      ...collaborators,
      {
        address: "",
        mintPercentage: 0,
        royaltyPercentage: 0,
        name: `${tNft("collaborator")} ${collaborators.length}`,
      },
    ]);
  };

  const removeCollaborator = (index: number) => {
    if (collaborators.length > 1) {
      setCollaborators(collaborators.filter((_, i) => i !== index));
    }
  };

  const updateCollaborator = (
    index: number,
    field: keyof Collaborator,
    value: string | number
  ) => {
    const updated = [...collaborators];
    updated[index] = { ...updated[index], [field]: value };
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
    setPrice("0");
    setCoverImage(null);
    setCoverUrl("");
    setStartDate("");
    setEndDate("");
    setMusicGenre("");
    setCollectionType("");
    setIsCreated(false);
    setActiveTab("collection");

    // Reset payment system
    setCreateNewPaymentSystem(true);
    setPaymentSystemName(tNft("collaborativeDrop"));
    setPaymentSystemDescription(tNft("dropDescription"));

    // Reset collaborators - Nueva estructura
    setTotalRoyaltyPercentage(5);
    setCollaborators([
      {
        address: evmAddress,
        mintPercentage: 60,
        royaltyPercentage: 60,
        name: tNft("mainArtist"),
      },
      {
        address: "",
        mintPercentage: 25,
        royaltyPercentage: 25,
        name: `${tNft("collaborator")} 1`,
      },
      {
        address: "",
        mintPercentage: 15,
        royaltyPercentage: 15,
        name: `${tNft("collaborator")} 2`,
      },
    ]);

    // Reset payment config
    setEnableDAI(true);
    setPaymentToken("ETH");
  }, [evmAddress, tNft]);

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
  }, [isCreated, router]);

  // Crear colección
  const createCollection = useCallback(async () => {
    try {
      if (!evmAddress) {
        toast.error(tNft("needEvmWalletError"));
        return;
      }

      if (!name || !symbol) {
        toast.error(tNft("nameSymbolRequired"));
        return;
      }

      if (getTotalMintPercentage() !== 100) {
        toast.error(tNft("mintPercentageSum"));
        return;
      }

      if (getTotalRoyaltyPercentage() !== 100) {
        toast.error(tNft("royaltiesPercentageSum"));
        return;
      }

      setIsCreating(true);

      // Toast inicial
      toast.loading("Preparando la colección ERC1155...", {
        id: "erc1155-creation",
      });

      // Subir imagen a IPFS si existe
      if (coverImage && uploadCoverImage) {
        try {
          toast.loading("Subiendo imagen a IPFS...", {
            id: "ipfs-upload",
          });
          setIsUploadingImage(true);

          await uploadCoverImage(coverImage);

          toast.success(tNft("imageUploadedSuccessfully"), {
            id: "ipfs-upload",
          });
        } catch (error) {
          console.error("Error uploading image to IPFS:", error);
          toast.error(tNft("errorUploadingImage"));
        } finally {
          setIsUploadingImage(false);
        }
      }

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

      // Preparar parámetros con configuración de Revenue Share
      const params: CreateCollectionParams = {
        name,
        symbol: symbol || name.substring(0, 4).toUpperCase(),
        baseURI,
        mintStartDate: startTimestamp,
        mintEndDate: endTimestamp,
        price: parseFloat(price),
        paymentToken: enableDAI ? "DAI" : ethers.ZeroAddress, // DAI o ETH nativo
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
      toast.loading("Esperando confirmación de la wallet...", {
        id: "erc1155-creation",
      });

      // Llamar a la función de creación
      const createFunc = useFactoryContract;
      const newCollectionAddress = await createFunc(params);

      if (newCollectionAddress) {
        setIsCreating(false);
        setTransactionPending(false);
        setIsCreated(true);

        toast.success(tNft("erc1155CollectionCreated"), {
          id: "erc1155-creation",
          description: `Dirección: ${newCollectionAddress}`,
        });
      } else {
        throw new Error("No se pudo crear la colección");
      }
    } catch (err) {
      console.error("Error creating collection:", err);
      toast.error(tNft("errorCreatingCollection"), {
        id: "erc1155-creation",
        description:
          err instanceof Error
            ? err.message
            : tNft("errorCreatingCollectionMessage"),
      });

      setIsCreating(false);
      setTransactionPending(false);
    }
  }, [
    evmAddress,
    name,
    symbol,
    price,
    startDate,
    endDate,
    totalRoyaltyPercentage,
    useFactoryContract,
    coverImage,
    uploadCoverImage,
    musicGenre,
    collectionType,
    createNewPaymentSystem,
    paymentSystemName,
    paymentSystemDescription,
    collaborators,
    enableDAI,
    getTotalMintPercentage,
    getTotalRoyaltyPercentage,
  ]);

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsDialogOpen(true)}
        className="bg-gradient-to-r from-purple-700 to-indigo-600 border-none text-zinc-100 hover:text-zinc-100 hover:from-purple-800 hover:to-indigo-700 hover:shadow-lg transition-all flex items-center gap-2"
      >
        <Music2Icon className="h-4 w-4" />
        {tNft("createCollection")}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[380px] sm:w-[500px] md:w-[650px] max-h-[90vh] flex flex-col p-0 bg-zinc-900 border border-indigo-800/30 shadow-xl shadow-purple-900/10 rounded-xl">
          <DialogHeader className="px-6 py-4 border-b border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-900/90">
            <DialogTitle className="text-xl font-semibold text-zinc-100">
              🎵 Create collection with automatic payment
            </DialogTitle>
          </DialogHeader>

          <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-zinc-900">
            {/* Loading overlays */}
            {isCreating && (
              <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-400" />
                  <p className="mt-2 text-sm text-zinc-400">
                    Preparing the ERC1155 collection...
                  </p>
                </div>
              </div>
            )}

            {(transactionPending || isLoadingTransaction) && (
              <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-400" />
                  <p className="mt-2 text-sm text-zinc-400">
                    Waiting for wallet confirmation...
                  </p>
                </div>
              </div>
            )}

            {isUploadingImage && (
              <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="text-center">
                  <CloudUploadIcon className="h-8 w-8 animate-pulse mx-auto text-cyan-400" />
                  <p className="mt-2 text-sm text-zinc-400">
                    Uploading image to IPFS...
                  </p>
                </div>
              </div>
            )}

            {isCreated && (
              <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto" />
                  <p className="mt-2 text-sm text-zinc-400">
                    ERC1155 collection created successfully!
                  </p>
                </div>
              </div>
            )}

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-grow flex flex-col min-h-0"
            >
              <TabsList className="px-6 pt-2 justify-start bg-zinc-900">
                <TabsTrigger
                  value="collection"
                  className="text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
                >
                  <Music2Icon className="w-4 h-4 mr-2" />
                  Collection
                </TabsTrigger>
                <TabsTrigger
                  value="payments"
                  className="text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Sistema de Pagos
                </TabsTrigger>
                <TabsTrigger
                  value="collaborators"
                  className="text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Colaboradores
                </TabsTrigger>
                <TabsTrigger
                  value="payment"
                  className="text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Moneda
                </TabsTrigger>
                <TabsTrigger
                  value="premium"
                  className="text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Premium
                </TabsTrigger>
              </TabsList>

              <div className="flex-grow overflow-y-auto p-6">
                <form className="space-y-6 text-zinc-100">
                  {/* PASO 1: Configuración de Colección (ahora va primero) */}
                  <TabsContent
                    value="collection"
                    className="mt-0 focus-visible:outline-none space-y-4"
                  >
                    <div className="space-y-6">
                      <div className="bg-purple-900/20 border border-purple-600 p-4 rounded-lg">
                        <h4 className="font-semibold text-purple-400">
                          🎵 Tipo de Colección
                        </h4>
                        <p className="text-sm text-purple-300 mt-1">
                          Define qué tipo de proyecto musical vas a crear
                        </p>
                      </div>

                      <Label
                        htmlFor="collectionType"
                        className="text-lg font-semibold text-zinc-100"
                      >
                        Selecciona el Tipo de Colección
                      </Label>
                      <RadioGroup
                        value={collectionType}
                        onValueChange={(value) => setCollectionType(value)}
                        className="space-y-3"
                      >
                        <Card className="bg-gradient-to-br from-zinc-800/80 to-zinc-900/90 border-zinc-700 hover:bg-zinc-800/70 hover:shadow-md hover:shadow-purple-900/5 transition-all">
                          <CardHeader className="pb-2">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value="ALBUM"
                                id="collectionType-album"
                                className="border-indigo-500 text-white data-[state=checked]:bg-indigo-600 data-[state=checked]:text-white"
                              />
                              <CardTitle>
                                <Label
                                  htmlFor="collectionType-album"
                                  className="text-lg cursor-pointer text-zinc-100 flex items-center"
                                >
                                  <Disc3 className="mr-2 h-5 w-5 text-indigo-400" />
                                  ÁLBUM
                                </Label>
                              </CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <CardDescription className="text-zinc-400">
                              <p className="font-medium">
                                Una colección cohesiva que reúne varias pistas
                                relacionadas, perfecta para proyectos completos
                                con múltiples tracks.
                              </p>
                            </CardDescription>
                          </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-zinc-800/80 to-zinc-900/90 border-zinc-700 hover:bg-zinc-800/70 hover:shadow-md hover:shadow-purple-900/5 transition-all">
                          <CardHeader className="pb-2">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value="DROP"
                                id="collectionType-drop"
                                className="border-indigo-500 text-white data-[state=checked]:bg-indigo-600 data-[state=checked]:text-white"
                              />
                              <CardTitle>
                                <Label
                                  htmlFor="collectionType-drop"
                                  className="text-lg cursor-pointer text-zinc-100 flex items-center"
                                >
                                  <Users2 className="mr-2 h-5 w-5 text-indigo-400" />
                                  DROP COLECTIVO
                                </Label>
                              </CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <CardDescription className="text-zinc-400">
                              <p className="font-medium">
                                Una colección colaborativa con contribuciones de
                                múltiples creadores, ideal para lanzamientos
                                conjuntos.
                              </p>
                            </CardDescription>
                          </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-zinc-800/80 to-zinc-900/90 border-zinc-700 hover:bg-zinc-800/70 hover:shadow-md hover:shadow-purple-900/5 transition-all">
                          <CardHeader className="pb-2">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value="SINGLE"
                                id="collectionType-single"
                                className="border-indigo-500 text-white data-[state=checked]:bg-indigo-600 data-[state=checked]:text-white"
                              />
                              <CardTitle>
                                <Label
                                  htmlFor="collectionType-single"
                                  className="text-lg cursor-pointer text-zinc-100 flex items-center"
                                >
                                  <MusicIcon className="mr-2 h-5 w-5 text-indigo-400" />
                                  SINGLE
                                </Label>
                              </CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <CardDescription className="text-zinc-400">
                              <p className="font-medium">
                                Un elemento único destacado, perfecto para
                                lanzamientos exclusivos y directos.
                              </p>
                            </CardDescription>
                          </CardContent>
                        </Card>
                      </RadioGroup>
                    </div>

                    {collectionType !== "" && (
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-zinc-200">
                            {collectionType === "ALBUM" && (
                              <Label htmlFor="name">Nombre del Álbum</Label>
                            )}
                            {collectionType === "SINGLE" && (
                              <Label htmlFor="name">Nombre del Single</Label>
                            )}
                            {collectionType === "DROP" && (
                              <Label htmlFor="name">
                                Nombre del Drop Colectivo
                              </Label>
                            )}
                          </Label>
                          <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={tNft("nftCollection")}
                            className="bg-zinc-800 border-zinc-700"
                          />
                        </div>

                        <div>
                          <Label htmlFor="symbol">Símbolo (4 caracteres)</Label>
                          <Input
                            id="symbol"
                            value={symbol}
                            onChange={(e) =>
                              setSymbol(
                                e.target.value.toUpperCase().substring(0, 4)
                              )
                            }
                            placeholder="NFT"
                            maxLength={4}
                            className="bg-zinc-800 border-zinc-700"
                          />
                        </div>

                        <div>
                          <Label htmlFor="description">Descripción</Label>
                          <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={tNft("collectionDescription")}
                            className="bg-zinc-800 border-zinc-700 min-h-[80px]"
                          />
                        </div>

                        <div>
                          <Label htmlFor="maxSupply">Suministro Máximo</Label>
                          <Input
                            id="maxSupply"
                            type="number"
                            value={maxSupply}
                            onChange={(e) => setMaxSupply(e.target.value)}
                            min="1"
                            placeholder="1000"
                            className="bg-zinc-800 border-zinc-700"
                          />
                          <p className="text-xs text-zinc-400 mt-1">
                            Número máximo de NFTs que se pueden crear en esta
                            colección
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="startDate">Fecha de Inicio</Label>
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
                            <Label htmlFor="endDate">
                              Fecha de Finalización
                            </Label>
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
                          <Label htmlFor="musicGenre">Género Musical</Label>
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
                                Other
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="coverImage">Imagen de Portada</Label>
                          <div className="mt-1">
                            <div className="flex items-center justify-center w-full">
                              <label
                                htmlFor="coverImage"
                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-zinc-800 border-zinc-700 hover:bg-zinc-700/50"
                              >
                                {coverUrl ? (
                                  <div className="relative w-full h-full">
                                    <img
                                      src={coverUrl}
                                      alt="Preview"
                                      className="h-full w-full object-contain rounded-lg"
                                    />
                                    {ipfsImageUrl && (
                                      <div className="absolute bottom-1 right-1 bg-emerald-900/80 text-white text-xs px-2 py-1 rounded-md flex items-center">
                                        <CloudUploadIcon className="h-3 w-3 mr-1" />
                                        En IPFS
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <ImageIcon className="w-8 h-8 mb-2 text-zinc-500" />
                                    <p className="text-sm text-zinc-500">
                                      Haz clic para subir una imagen
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
                          💰 Sistema de Pagos Automático
                        </h4>
                        <p className="text-sm text-blue-300 mt-1">
                          Se crea tu &quot;caja registradora inteligente&quot;
                          que dividirá automáticamente los pagos
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={createNewPaymentSystem}
                          onCheckedChange={setCreateNewPaymentSystem}
                        />
                        <Label>Crear nuevo sistema de pagos</Label>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="paymentName">
                          Nombre del sistema de pagos
                        </Label>
                        <Input
                          id="paymentName"
                          value={paymentSystemName}
                          onChange={(e) => setPaymentSystemName(e.target.value)}
                          placeholder={tNft("collaborativeDrop")}
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="paymentDescription">Descripción</Label>
                        <Textarea
                          id="paymentDescription"
                          value={paymentSystemDescription}
                          onChange={(e) =>
                            setPaymentSystemDescription(e.target.value)
                          }
                          placeholder={tNft("dropDescription")}
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
                          👥 Distribución de Ingresos
                        </h4>
                        <p className="text-sm text-green-300 mt-1">
                          Configura cómo se reparten automáticamente los
                          ingresos de ventas y royalties
                        </p>
                      </div>

                      {/* Configuración de Royalties Totales */}
                      <div className="bg-purple-900/20 border border-purple-600 p-4 rounded-lg space-y-3">
                        <h5 className="font-semibold text-purple-400">
                          📈 Royalties de Reventa
                        </h5>
                        <p className="text-sm text-purple-300">
                          Porcentaje que se cobra sobre las ventas secundarias
                          (cuando alguien revende el NFT)
                        </p>
                        <div className="flex items-center space-x-4">
                          <div className="flex-1">
                            <Label htmlFor="totalRoyaltyPercentage">
                              Royalty Total (%)
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
                            Recomendado: 2.5% - 10%
                          </div>
                        </div>
                      </div>

                      {/* Status de distribución */}
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">
                          Distribución por Colaborador
                        </h3>
                        <div className="flex space-x-2">
                          <Badge
                            variant={
                              getTotalMintPercentage() === 100
                                ? "default"
                                : "destructive"
                            }
                          >
                            Ventas: {getTotalMintPercentage()}%
                          </Badge>
                          <Badge
                            variant={
                              getTotalRoyaltyPercentage() === 100
                                ? "default"
                                : "destructive"
                            }
                          >
                            Royalties: {getTotalRoyaltyPercentage()}%
                          </Badge>
                        </div>
                      </div>

                      {/* Botón para sincronizar porcentajes */}
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={syncRoyaltyPercentages}
                          type="button"
                          className="text-xs"
                        >
                          🔄 Igualar royalties a distribución de ventas
                        </Button>
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
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="md:col-span-2">
                              <Label>Nombre</Label>
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
                              <Label>Ventas (%)</Label>
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
                              <Label>Royalties (%)</Label>
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
                            <Label>Dirección Wallet</Label>
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

                      <Button
                        variant="outline"
                        onClick={addCollaborator}
                        className="w-full"
                        type="button"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Colaborador
                      </Button>

                      {/* Preview de distribución */}
                      <div className="bg-zinc-700/50 p-4 rounded-lg space-y-3">
                        <h4 className="font-semibold">
                          📊 Vista Previa de Distribución:
                        </h4>

                        <div className="space-y-2">
                          <h5 className="text-sm font-medium text-blue-400">
                            💰 Ventas Primarias (Mint):
                          </h5>
                          {collaborators.map((collab, index) => (
                            <div
                              key={`mint-${index}`}
                              className="flex justify-between text-sm"
                            >
                              <span>{collab.name}:</span>
                              <span>
                                {price && parseFloat(price) > 0
                                  ? `${(
                                      (parseFloat(price) *
                                        collab.mintPercentage) /
                                      100
                                    ).toFixed(enableDAI ? 1 : 4)} ${
                                      enableDAI ? "DAI" : "ETH"
                                    } (${collab.mintPercentage}%)`
                                  : `${collab.mintPercentage}% (${
                                      enableDAI ? "DAI" : "ETH"
                                    })`}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-2">
                          <h5 className="text-sm font-medium text-purple-400">
                            🔄 Royalties de Reventa:
                          </h5>
                          <p className="text-xs text-zinc-400 mb-2">
                            {totalRoyaltyPercentage}% del precio de reventa se
                            distribuye así:
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
                                % del precio de reventa
                              </span>
                            </div>
                          ))}
                        </div>

                        {price && parseFloat(price) > 0 && (
                          <div className="mt-2 pt-2 border-t border-zinc-600 text-xs text-zinc-400">
                            Precio por NFT: {price} {enableDAI ? "DAI" : "ETH"}
                          </div>
                        )}
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
                          💱 Configurar Moneda de Pago
                        </h4>
                        <p className="text-sm text-yellow-300 mt-1">
                          Los fans podrán comprar con la moneda que elijas
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="paymentToken">Moneda de Pago</Label>
                        <Select
                          value={paymentToken}
                          onValueChange={(value) => {
                            setPaymentToken(value);
                            setEnableDAI(value === "DAI");
                          }}
                        >
                          <SelectTrigger className="bg-zinc-800 border-zinc-700">
                            <SelectValue placeholder={tNft("selectCurrency")} />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-800 border-zinc-700">
                            <SelectItem
                              value="ETH"
                              className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100"
                            >
                              ETH (Ethereum)
                            </SelectItem>
                            <SelectItem
                              value="DAI"
                              className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100"
                            >
                              DAI (Moneda Estable)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="price">
                          Precio ({enableDAI ? "DAI" : "ETH"})
                        </Label>
                        <Input
                          id="price"
                          type="number"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          min="0"
                          step="0.001"
                          placeholder={enableDAI ? "50" : "0.01"}
                          className="bg-zinc-800 border-zinc-700"
                        />
                        <p className="text-xs text-zinc-400 mt-1">
                          Los fans pagarán {price} {enableDAI ? "DAI" : "ETH"}{" "}
                          por cada NFT
                        </p>
                      </div>

                      {enableDAI && (
                        <div className="bg-green-900/20 border border-green-600 p-4 rounded-lg">
                          <h5 className="font-semibold text-green-400 mb-2">
                            ✅ DAI Activado
                          </h5>
                          <p className="text-sm text-green-300">
                            Los fans pagarán en DAI (moneda estable vinculada al
                            dólar) en lugar de ETH volátil.
                          </p>
                        </div>
                      )}

                      <div className="bg-zinc-700/50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">
                          💰 Distribución Automática:
                        </h4>
                        {collaborators.map((collab, index) => (
                          <div
                            key={index}
                            className="flex justify-between text-sm"
                          >
                            <span>{collab.name}:</span>
                            <span>
                              {price && parseFloat(price) > 0
                                ? `${(
                                    (parseFloat(price) *
                                      collab.mintPercentage) /
                                    100
                                  ).toFixed(enableDAI ? 1 : 4)} ${
                                    enableDAI ? "DAI" : "ETH"
                                  } (${collab.mintPercentage}%)`
                                : `${collab.mintPercentage}% (${
                                    enableDAI ? "DAI" : "ETH"
                                  })`}
                            </span>
                          </div>
                        ))}
                        {price && parseFloat(price) > 0 && (
                          <div className="mt-2 pt-2 border-t border-zinc-600 text-xs text-zinc-400">
                            Precio total por NFT: {price}{" "}
                            {enableDAI ? "DAI" : "ETH"}
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  {/* PASO 5: Configuración Premium x402 */}
                  <TabsContent
                    value="premium"
                    className="mt-0 focus-visible:outline-none space-y-4"
                  >
                    <div className="space-y-4">
                      <div className="bg-purple-900/20 border border-purple-600 p-4 rounded-lg">
                        <h4 className="font-semibold text-purple-400 flex items-center gap-2">
                          <Lock className="h-5 w-5" />
                          🔒 Contenido Premium con x402
                        </h4>
                        <p className="text-sm text-purple-300 mt-1">
                          Marca este álbum como premium. Los fans pagarán en
                          USDC (Base) para desbloquearlo.
                        </p>
                      </div>

                      {/* Toggle Premium */}
                      <div className="flex items-center justify-between p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                        <div className="space-y-0.5">
                          <Label
                            htmlFor="premium-toggle"
                            className="text-base font-medium text-zinc-100"
                          >
                            Álbum Premium
                          </Label>
                          <p className="text-sm text-zinc-400">
                            Requiere pago en USDC para acceder
                          </p>
                        </div>
                        <Switch
                          id="premium-toggle"
                          checked={isPremiumAlbum}
                          onCheckedChange={setIsPremiumAlbum}
                        />
                      </div>

                      {/* Configuración (solo visible si isPremiumAlbum) */}
                      {isPremiumAlbum && (
                        <div className="space-y-4 p-4 border border-zinc-700 rounded-lg bg-zinc-800/30">
                          {/* Precio */}
                          <div className="space-y-2">
                            <Label
                              htmlFor="premium-price"
                              className="text-zinc-100"
                            >
                              💰 Precio en USDC
                            </Label>
                            <div className="flex gap-2">
                              <span className="flex items-center px-3 bg-zinc-700 rounded-l-md border border-zinc-600 text-zinc-100">
                                $
                              </span>
                              <Input
                                id="premium-price"
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={premiumPrice}
                                onChange={(e) =>
                                  setPremiumPrice(e.target.value)
                                }
                                placeholder="0.01"
                                className="flex-1 rounded-l-none bg-zinc-800 border-zinc-700 text-zinc-100"
                              />
                            </div>
                            <p className="text-xs text-zinc-400">
                              Precio sugerido: $0.01 - $1.00 para álbumes
                            </p>
                          </div>

                          {/* Red */}
                          <div className="space-y-2">
                            <Label
                              htmlFor="premium-network"
                              className="text-zinc-100"
                            >
                              🌐 Red de Blockchain
                            </Label>
                            <Select
                              value={premiumNetwork}
                              onValueChange={(v: any) => setPremiumNetwork(v)}
                            >
                              <SelectTrigger
                                id="premium-network"
                                className="bg-zinc-800 border-zinc-700 text-zinc-100"
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-800 border-zinc-700">
                                <SelectItem
                                  value="base-sepolia"
                                  className="text-zinc-100 focus:bg-zinc-700"
                                >
                                  Base Sepolia (Testnet)
                                </SelectItem>
                                <SelectItem
                                  value="base"
                                  className="text-zinc-100 focus:bg-zinc-700"
                                >
                                  Base (Mainnet)
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-zinc-400">
                              ⚠️ Usa Sepolia para testing, Base para producción
                            </p>
                          </div>

                          {/* Descripción */}
                          <div className="space-y-2">
                            <Label
                              htmlFor="premium-description"
                              className="text-zinc-100"
                            >
                              📝 Descripción
                            </Label>
                            <Textarea
                              id="premium-description"
                              value={premiumDescription}
                              onChange={(e) =>
                                setPremiumDescription(e.target.value)
                              }
                              placeholder="Ej: Álbum exclusivo para mis fans"
                              maxLength={100}
                              className="bg-zinc-800 border-zinc-700 text-zinc-100"
                            />
                            <p className="text-xs text-zinc-400">
                              Se muestra al usuario antes de pagar
                            </p>
                          </div>

                          {/* Preview */}
                          <div className="p-3 bg-zinc-900 border border-zinc-700 rounded-md">
                            <p className="text-sm font-medium text-zinc-300 mb-2">
                              Vista previa:
                            </p>
                            <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-md">
                              <p className="text-2xl font-bold text-purple-400">
                                ${premiumPrice}
                              </p>
                              <p className="text-xs text-zinc-400 mt-1">
                                Pago único en USDC
                              </p>
                            </div>
                          </div>

                          {/* Info adicional */}
                          <div className="text-xs text-zinc-400 space-y-1 p-3 bg-zinc-900/50 rounded-md border border-zinc-700">
                            <p>ℹ️ Los usuarios pagarán con USDC en Base</p>
                            <p>
                              ℹ️ El pago se procesa automáticamente con x402
                            </p>
                            <p>ℹ️ Una vez pagado, el acceso es permanente</p>
                            <p>
                              ℹ️ Recibes 100% del pago (sin comisiones de
                              plataforma)
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </form>
              </div>

              <DialogFooter className="px-6 py-4 border-t border-zinc-800 bg-zinc-900">
                <Button
                  onClick={createCollection}
                  disabled={
                    isCreating ||
                    isCreated ||
                    !name ||
                    !symbol ||
                    !evmAddress ||
                    isUploadingImage ||
                    getTotalMintPercentage() !== 100 ||
                    getTotalRoyaltyPercentage() !== 100 ||
                    !collectionType
                  }
                  className="w-full bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 hover:shadow-lg text-white disabled:opacity-50 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-500 transition-all"
                >
                  {isCreating
                    ? tNft("processing")
                    : tNft("createCollectionButton")}
                </Button>
              </DialogFooter>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
