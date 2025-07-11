/**
 * @deprecated Este componente está deprecado.
 * Use BaseAlbumNewForm para colecciones Base con ERC1155Factory.
 * Este archivo se mantiene solo por compatibilidad y no debe modificarse.
 */
"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@Src/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@Src/ui/components/ui/dialog";
import { ScrollArea } from "@Src/ui/components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@Src/ui/components/ui/tabs";
import {
  Loader2,
  CheckCircle,
  Music,
  Users,
  Sparkles,
  Music2Icon,
} from "lucide-react";
import {
  useBlockchainOperations,
  BlockchainType,
} from "@Src/lib/hooks/common/useBlockchainOperations";
import { BasicForm } from "@Src/components/albumForm/BasicForm";
import { AdvancedForm } from "@Src/components/albumForm/AdvancedForm";
import { CollaboratorsForm } from "@Src/components/albumForm/CollaboratorsForm";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { revalidateUserAlbums } from "@Src/app/actions/revalidate";
import { useHydraWallet } from "@Src/lib/hooks/solana/useHydraWallet";
import { configureCreators } from "@Src/lib/utils/configureCreators";
import { useAppKitAccount } from "@Src/lib/privy";
import {
  TUNEPORT_WALLET_ADDRESS,
  FREE_PLAN_PLATFORM_FEE_PERCENTAGE,
  FREE_PLAN_ARTIST_FEE_PERCENTAGE,
  PAID_PLAN_PLATFORM_FEE_PERCENTAGE,
  PAID_PLAN_ARTIST_FEE_PERCENTAGE,
} from "@Src/lib/constants/feeCalculations";

interface Collaborator {
  name: string;
  address: string;
  royalties: number;
}

export default function AlbumNewForm({ nickname }: any) {
  const router = useRouter();
  const [plan, setPlan] = useState("free");
  const [collectionType, setCollectionType] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState("");
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [albumCreated, setAlbumCreated] = useState(false);
  const [isAlbumDialogOpen, setIsAlbumDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [blockchain, setBlockchain] = useState("");
  const [currency, setCurrency] = useState("");
  const [albumName, setAlbumName] = useState("");
  const [description, setDescription] = useState("");
  const [maxSupply, setMaxSupply] = useState("");
  const [symbol, setSymbol] = useState("");
  const [artistName, setArtistName] = useState("");
  const [musicGenre, setMusicGenre] = useState("");
  const [recordLabel, setRecordLabel] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [price, setPrice] = useState<number | null>(null);
  const [transactionPending, setTransactionPending] = useState(false);
  const [useHydra, setUseHydra] = useState(false);

  const { address: userWalletAddress, solanaWalletAddress } =
    useAppKitAccount();

  // Usar la dirección de Solana si está disponible, o la dirección general como respaldo
  const actualWalletAddress = solanaWalletAddress || userWalletAddress;

  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    {
      name: "Artist",
      address: actualWalletAddress || "",
      royalties:
        plan === "free"
          ? FREE_PLAN_ARTIST_FEE_PERCENTAGE * 100
          : PAID_PLAN_ARTIST_FEE_PERCENTAGE * 100,
    },
    {
      name: "Tuneport",
      address: TUNEPORT_WALLET_ADDRESS,
      royalties:
        plan === "free"
          ? FREE_PLAN_PLATFORM_FEE_PERCENTAGE * 100
          : PAID_PLAN_PLATFORM_FEE_PERCENTAGE * 100,
    },
  ]);

  const { createCollection, isCreatingCollection } = useBlockchainOperations({
    blockchain: (blockchain as BlockchainType) || "solana",
  });

  const {
    createHydraWallet,
    hydraAddress,
    loading: hydraLoading,
  } = useHydraWallet();

  const handleImageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        setCoverImage(e.target.files[0]);
        setCoverFile(URL.createObjectURL(e.target.files[0]));
      }
    },
    []
  );

  const updateCollaborators = useCallback(
    (newCollaborators: Collaborator[]) => {
      // Compara contenido, no solo referencia
      if (JSON.stringify(newCollaborators) !== JSON.stringify(collaborators)) {
        setCollaborators(newCollaborators);
      }
    },
    [collaborators]
  );

  const addCollaborator = useCallback(() => {
    setCollaborators((prev) => {
      // Crear una copia de la lista actual
      const updated = [...prev];

      // Añadir el nuevo colaborador con 0% de royalties
      updated.push({ name: "", address: "", royalties: 0 });

      // No es necesario ajustar los royalties del artista principal aquí
      // ya que CollaboratorsForm manejará la distribución cuando cambie los valores

      return updated;
    });
  }, []);

  const removeCollaborator = useCallback((index: number) => {
    setCollaborators((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const openAlbumDialog = useCallback(() => {
    setIsAlbumDialogOpen(true);
  }, []);

  useEffect(() => {
    if (!isAlbumDialogOpen) {
      setCoverImage(null);
      setCoverFile("");
      setAlbumName("");
      setDescription("");
      setMaxSupply("");
      setSymbol("");
      setArtistName("");
      setMusicGenre("");
      setRecordLabel("");
      setReleaseDate("");
      setStartDate("");
      setPrice(null);
      setBlockchain("");
      setCurrency("");
      setCollaborators([
        {
          name: "Artist",
          address: actualWalletAddress || "",
          royalties:
            plan === "free"
              ? FREE_PLAN_ARTIST_FEE_PERCENTAGE * 100
              : PAID_PLAN_ARTIST_FEE_PERCENTAGE * 100,
        },
        {
          name: "Tuneport",
          address: TUNEPORT_WALLET_ADDRESS,
          royalties:
            plan === "free"
              ? FREE_PLAN_PLATFORM_FEE_PERCENTAGE * 100
              : PAID_PLAN_PLATFORM_FEE_PERCENTAGE * 100,
        },
      ]);
      setActiveTab("basic");
      setAlbumCreated(false);
    }
  }, [isAlbumDialogOpen, plan, actualWalletAddress]);

  // Ajusta automáticamente Artist y Platform al cambiar plan
  useEffect(() => {
    setCollaborators((prev) => {
      // Asegurarnos de que existan al menos 2 colaboradores
      if (prev.length < 2) return prev;

      const updated = [...prev];
      // updated[0] = Artist (Main)
      updated[0].royalties =
        plan === "free"
          ? FREE_PLAN_ARTIST_FEE_PERCENTAGE * 100
          : PAID_PLAN_ARTIST_FEE_PERCENTAGE * 100;
      // updated[1] = Platform
      updated[1].royalties =
        plan === "free"
          ? FREE_PLAN_PLATFORM_FEE_PERCENTAGE * 100
          : PAID_PLAN_PLATFORM_FEE_PERCENTAGE * 100;

      return updated;
    });
  }, [plan]);

  // Actualizar la dirección del artista cuando cambia userWalletAddress
  useEffect(() => {
    if (actualWalletAddress) {
      setCollaborators((prev) => {
        const updated = [...prev];
        if (updated[0]) {
          updated[0].address = actualWalletAddress;
        }
        return updated;
      });
    }
  }, [actualWalletAddress]);

  useEffect(() => {
    if (albumCreated) {
      const timer = setTimeout(async () => {
        // 1. Cerrar el modal
        setIsAlbumDialogOpen(false);

        // 2. Revalidar la ruta completa del perfil
        await revalidateUserAlbums(nickname);

        // 3. Refrescar la UI
        router.refresh();

        // 4. Resetear el estado
        setAlbumCreated(false);

        // 5. Notificar al usuario
        toast.success("Álbum creado exitosamente", {
          description: "Tu álbum ha sido creado y está listo para usar",
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [albumCreated, router, nickname]);

  const createAlbum = useCallback(async () => {
    try {
      setIsCreatingAlbum(true);

      // Toast inicial de creación
      toast.loading("Preparando la creación del álbum...", {
        id: "album-creation",
      });

      // Verificar que el usuario tenga wallet
      if (!actualWalletAddress) {
        throw new Error("No se detectó una wallet conectada");
      }

      // Verificar que se ha seleccionado una blockchain
      if (!blockchain) {
        throw new Error("Debes seleccionar una blockchain");
      }

      // Validar que siempre estén el artista y Tuneport
      const validatedCollaborators = [...collaborators];

      // Asegurar que el artista principal tenga la dirección correcta
      if (validatedCollaborators[0]) {
        validatedCollaborators[0].address = actualWalletAddress;
      } else {
        // Si no existe, añadirlo
        validatedCollaborators.unshift({
          name: "Artist",
          address: actualWalletAddress,
          royalties:
            plan === "free"
              ? FREE_PLAN_ARTIST_FEE_PERCENTAGE * 100
              : PAID_PLAN_ARTIST_FEE_PERCENTAGE * 100,
        });
      }

      // Verificar si Tuneport está en el índice 1
      if (
        !validatedCollaborators[1] ||
        validatedCollaborators[1].name !== "Tuneport"
      ) {
        // Insertar Tuneport en la posición 1
        validatedCollaborators.splice(1, 0, {
          name: "Tuneport",
          address: TUNEPORT_WALLET_ADDRESS,
          royalties:
            plan === "free"
              ? FREE_PLAN_PLATFORM_FEE_PERCENTAGE * 100
              : PAID_PLAN_PLATFORM_FEE_PERCENTAGE * 100,
        });
      } else {
        // Asegurar que tiene la dirección correcta
        validatedCollaborators[1].address = TUNEPORT_WALLET_ADDRESS;
        validatedCollaborators[1].royalties =
          plan === "free"
            ? FREE_PLAN_PLATFORM_FEE_PERCENTAGE * 100
            : PAID_PLAN_PLATFORM_FEE_PERCENTAGE * 100;
      }

      // Si hay más de un colaborador, crear Hydra wallet
      let hydraWalletAddress = null;
      if (validatedCollaborators.length > 1) {
        try {
          const result = await createHydraWallet({
            name: albumName,
            collaborators: validatedCollaborators,
          });

          if (result) {
            hydraWalletAddress = result.hydraAddress;
          }
        } catch (err) {
          console.error("Error al crear Hydra wallet:", err);
          // Continuar sin Hydra si falla
        }
      }

      // Crear el formato correcto para creators que necesita CandyMachine
      const creatorsForCandyMachine = [
        {
          address: hydraWalletAddress,
          royalties: 100, // 100% va a Hydra para distribución posterior
        },
      ];

      // Pasar creators en el formato correcto
      try {
        console.log("Iniciando creación de álbum...");

        const albumCreationResult = await createCollection({
          collectionType: collectionType,
          collectionName: albumName,
          description: description,
          itemsAvailable: parseInt(maxSupply, 10),
          coverImage: coverImage,
          symbol: symbol,
          currency: currency,
          hydraWalletAddress: hydraWalletAddress,
          hydraRoyalties: creatorsForCandyMachine,
          collaborators: collaborators,
          artistName: nickname,
          musicGenre: musicGenre,
          recordLabel,
          releaseDate,
          startDate,
          price,
          plan,
        });

        console.log("Álbum creado:", albumCreationResult);

        // El éxito se manejará en el hook useCreateCandyMachine
        setIsCreatingAlbum(false);
        setTransactionPending(false);
        setAlbumCreated(true);
      } catch (err) {
        console.error("Error en creación de álbum:", err);

        // Manejar el error
        setIsCreatingAlbum(false);
        setTransactionPending(false);

        toast.error("Error al crear el álbum", {
          description:
            err instanceof Error ? err.message : "Por favor, intenta de nuevo",
        });
      }
    } catch (err) {
      console.error("Error in album creation:", err);
      toast.error("Error al crear el álbum", {
        description:
          err instanceof Error ? err.message : "Por favor, intenta de nuevo",
      });
    }
  }, [
    actualWalletAddress,
    collaborators,
    createCollection,
    collectionType,
    albumName,
    description,
    maxSupply,
    coverImage,
    symbol,
    currency,
    nickname,
    musicGenre,
    recordLabel,
    releaseDate,
    startDate,
    price,
    plan,
    createHydraWallet,
    blockchain,
  ]);

  const memoizedBasicForm = useMemo(
    () => (
      <BasicForm
        collectionType={collectionType}
        setCollectionType={setCollectionType}
        albumName={albumName}
        setAlbumName={setAlbumName}
        description={description}
        setDescription={setDescription}
        handleImageChange={handleImageChange}
        coverImage={coverImage}
        coverFile={coverFile}
        artistName={nickname}
        setArtistName={setArtistName}
        musicGenre={musicGenre}
        setMusicGenre={setMusicGenre}
        recordLabel={recordLabel}
        setRecordLabel={setRecordLabel}
        releaseDate={releaseDate}
        setReleaseDate={setReleaseDate}
        startDate={startDate}
        setStartDate={setStartDate}
      />
    ),
    [
      collectionType,
      albumName,
      description,
      handleImageChange,
      coverImage,
      coverFile,
      nickname,
      musicGenre,
      recordLabel,
      releaseDate,
      startDate,
    ]
  );

  const memoizedAdvancedForm = useMemo(
    () => (
      <AdvancedForm
        collectionType={collectionType}
        plan={plan}
        setPlan={setPlan}
        blockchain={blockchain}
        setBlockchain={setBlockchain}
        currency={currency}
        setCurrency={setCurrency}
        maxSupply={maxSupply}
        setMaxSupply={setMaxSupply}
        symbol={symbol}
        setSymbol={setSymbol}
        price={price}
        setPrice={setPrice}
      />
    ),
    [collectionType, plan, blockchain, currency, maxSupply, symbol, price]
  );

  const memoizedCollaboratorsForm = useMemo(
    () => (
      <CollaboratorsForm
        collectionType={collectionType}
        plan={plan}
        collaborators={collaborators}
        updateCollaborators={updateCollaborators}
        removeCollaborator={removeCollaborator}
        addCollaborator={addCollaborator}
        useHydra={useHydra}
        setUseHydra={setUseHydra}
      />
    ),
    [
      collectionType,
      plan,
      collaborators,
      updateCollaborators,
      removeCollaborator,
      addCollaborator,
      useHydra,
    ]
  );

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        onClick={openAlbumDialog}
        className="bg-zinc-900 border-zinc-800 text-zinc-100 hover:text-zinc-100 hover:bg-zinc-900 hover:border-zinc-900 transition-colors flex items-center gap-2"
      >
        <Music2Icon className="h-4 w-4" />
        Create Music
      </Button>

      <Dialog open={isAlbumDialogOpen} onOpenChange={setIsAlbumDialogOpen}>
        <DialogContent className="w-[380px] sm:w-[380px] md:w-[650px] h-[90vh] max-h-[800px] flex flex-col p-0 bg-zinc-900 border border-zinc-800">
          <DialogHeader className="px-6 py-4 border-b border-zinc-800">
            <DialogTitle className="text-xl font-semibold text-zinc-100">
              Create New Music
            </DialogTitle>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-grow flex flex-col min-h-0"
          >
            <TabsList className="px-6 pt-2 justify-start bg-zinc-900">
              <TabsTrigger
                value="basic"
                className="text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
              >
                <Music className="w-4 h-4 mr-2" />
                Basic
              </TabsTrigger>
              {collectionType && (
                <>
                  <TabsTrigger
                    value="advanced"
                    className="text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Advanced
                  </TabsTrigger>
                  <TabsTrigger
                    value="collaborators"
                    className="text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    {collectionType === "DROP" ? "Collaborators" : "Royalties"}
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            <div className="flex-grow overflow-y-auto px-6 py-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-zinc-900">
              {/* Loading overlay */}
              {isCreatingAlbum && (
                <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-sm flex items-center justify-center z-50">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-zinc-400" />
                    <p className="mt-2 text-sm text-zinc-400">
                      Preparando la creación del álbum...
                    </p>
                  </div>
                </div>
              )}

              {/* Transaction pending overlay */}
              {transactionPending && (
                <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-sm flex items-center justify-center z-50">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-zinc-400" />
                    <p className="mt-2 text-sm text-zinc-400">
                      Esperando confirmación de la wallet...
                    </p>
                  </div>
                </div>
              )}

              {/* Success overlay */}
              {albumCreated && (
                <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-sm flex items-center justify-center z-50">
                  <div className="text-center">
                    <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto" />
                    <p className="mt-2 text-sm text-zinc-400">
                      Album created successfully
                    </p>
                  </div>
                </div>
              )}

              <form className="space-y-6 text-zinc-100">
                <TabsContent
                  value="basic"
                  className="mt-0 focus-visible:outline-none"
                >
                  {memoizedBasicForm}
                </TabsContent>
                <TabsContent
                  value="advanced"
                  className="mt-0 focus-visible:outline-none"
                >
                  {memoizedAdvancedForm}
                </TabsContent>
                <TabsContent
                  value="collaborators"
                  className="mt-0 focus-visible:outline-none"
                >
                  {memoizedCollaboratorsForm}
                </TabsContent>
              </form>
            </div>
          </Tabs>

          <DialogFooter className="px-6 py-4 border-t border-zinc-800 bg-zinc-900">
            <Button
              onClick={createAlbum}
              disabled={
                isCreatingAlbum || albumCreated || collectionType === ""
              }
              className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-900 disabled:bg-zinc-800/50 disabled:text-zinc-500 transition-colors"
            >
              Create Music
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
