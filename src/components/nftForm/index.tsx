"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@Src/ui/components/ui/button";
import { Input } from "@Src/ui/components/ui/input";
import { Label } from "@Src/ui/components/ui/label";
import { Textarea } from "@Src/ui/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@Src/ui/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@Src/ui/components/ui/tabs";
import { ScrollArea } from "@Src/ui/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@Src/ui/components/ui/select";
import { Music, Upload, X, Play, Pause, Info } from "lucide-react";
import { useAddItemsToCandyMachine } from "@Src/lib/hooks/solana/useAddItemsToCandyMachine";
import { useBlockchainOperations } from "@Src/lib/hooks/common/useBlockchainOperations";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@Src/ui/components/ui/tooltip";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import Image from "next/image";

interface NftAttribute {
  trait_type: string;
  value: string;
}

interface NftFormProps {
  album: any;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function NftForm({
  album,
  open,
  onClose,
  onSuccess,
}: NftFormProps) {
  // Translation hooks
  const tNft = useTranslations("nft");
  const tCommon = useTranslations("common");
  const tForms = useTranslations("forms");

  const [trackName, setTrackName] = useState<string>(album?.name || "");
  const [description, setDescription] = useState<string>(
    album?.description || ""
  );
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [trackFile, setTrackFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [trackPreview, setTrackPreview] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [copies, setCopies] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const [attributes, setAttributes] = useState<NftAttribute[]>([
    { trait_type: "", value: "" },
  ]);

  const [mintPaymentAddress, setMintPaymentAddress] = useState<string>("");

  const audioRef = useRef<HTMLAudioElement>(null);

  const { addItemsToCandyMachine, loading } = useAddItemsToCandyMachine();
  const { createNFTItem, isCreatingNFTItem } = useBlockchainOperations({
    blockchain: (album?.network || "solana") as "solana" | "base" | "ethereum",
    useERC1155: true,
  });

  useEffect(() => {
    if (open) {
      setTrackName("");
      setDescription("");
      setCoverImage(null);
      setTrackFile(null);
      setCoverPreview("");
      setTrackPreview(null);
      setIsPlaying(false);
      setAttributes([{ trait_type: "", value: "" }]);
      setMintPaymentAddress("");
      setCopies(0);
      setPrice(0);
    }
  }, [open, album]);

  useEffect(() => {
    if (!open) {
      if (coverPreview && coverPreview.startsWith("blob:")) {
        URL.revokeObjectURL(coverPreview);
      }
      if (trackPreview && trackPreview.startsWith("blob:")) {
        URL.revokeObjectURL(trackPreview);
      }
    }
  }, [open, coverPreview, trackPreview]);

  const handleAddAttribute = () => {
    setAttributes((prev) => [...prev, { trait_type: "", value: "" }]);
  };

  const handleRemoveAttribute = (index: number) => {
    setAttributes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAttributeChange = (
    index: number,
    field: "trait_type" | "value",
    newValue: string
  ) => {
    setAttributes((prev) => {
      const updated = [...prev];
      updated[index][field] = newValue;
      return updated;
    });
  };

  const createAlbum = async () => {
    try {
      setIsCreatingAlbum(true);

      if (!trackName.trim()) {
        toast.error(tNft("nameRequired"), {
          description: tNft("pleaseEnterTrackName"),
        });
        return;
      }

      if (!album?.id) {
        toast.error(tCommon("configurationError"), {
          description: tCommon("invalidCollectionId"),
        });
        return;
      }

      // Usar la dirección seleccionada/ingresada por el usuario
      const paymentAddress = mintPaymentAddress.trim();

      if (!paymentAddress) {
        toast.error(tNft("addressRequired"), {
          description: tNft("pleaseSelectCollaboratorOrEnterAddress"),
        });
        return;
      }

      // if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(paymentAddress)) {
      //   toast.error(tNft("invalidAddress"), {
      //     description: tNft("pleaseEnterValidAddress"),
      //   });
      //   return;
      // }

      // Filtrar atributos vacíos antes de enviarlos
      const filteredAttributes = attributes.filter(
        (attr) => attr.trait_type.trim() !== "" && attr.value.trim() !== ""
      );

      if (album?.network === "solana") {
        await addItemsToCandyMachine({
          collectionId: album?.id,
          collectionAddress: album?.addressCollection,
          start_mint_date: album?.startMintDate,
          trackName,
          description,
          coverImage,
          trackFile,
          attributes: filteredAttributes,
          artist_address_mint: paymentAddress,
          currency: album?.currency,
          royaltyReceivers: [],
          copies: copies,
        });
      } else {
        await createNFTItem({
          collectionId: album?.id,
          name: trackName,
          description,
          image: coverImage,
          music: trackFile,
          copies: copies,
          price: price,
          currency: album?.mintCurrency,
          attributes: filteredAttributes,
          artist_address_mint: paymentAddress,
        });
      }
      toast.success(tNft("trackAdded"), {
        description: tNft("trackAddedSuccessfully"),
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Error creating album:", err);
      toast.error(tNft("errorCreatingTrack"), {
        description:
          err instanceof Error ? err.message : tCommon("unexpectedError"),
      });
    } finally {
      setIsCreatingAlbum(false);
    }
  };

  const handleImageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        setCoverImage(file);
        setCoverPreview(URL.createObjectURL(file));
      }
    },
    []
  );

  const handleTrackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setTrackFile(file);
      const objectUrl = URL.createObjectURL(file);
      setTrackPreview(objectUrl);
    }
  };

  const togglePlayPause = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-[500px] h-[90vh] max-h-[800px] flex flex-col p-0 overflow-hidden bg-zinc-900 border border-zinc-800">
        <DialogHeader className="px-6 py-4 border-b border-zinc-800 relative">
          <DialogTitle className="text-xl font-semibold text-zinc-100 pr-8">
            {album?.collection_type === "SINGLE"
              ? `${tNft("single")}: ${album.name}`
              : album?.collection_type === "ALBUM"
              ? `${tNft("album")}: ${album.name}`
              : album?.collection_type === "DROP"
              ? `${tNft("collectiveDrop")}: ${album.name}`
              : tNft("addTracks")}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-6 h-6 w-6 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-sm"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <Tabs
          defaultValue="basic"
          className="flex-grow flex flex-col overflow-hidden"
        >
          <TabsList className="px-6 pt-2 justify-start border-zinc-800 bg-zinc-900">
            <TabsTrigger
              value="basic"
              className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
            >
              <Music className="w-4 h-4 mr-2" />
              {tNft("basicInfo")}
            </TabsTrigger>
          </TabsList>
          <ScrollArea className="flex-grow px-6 py-4">
            <form className="space-y-6">
              <TabsContent value="basic" className="mt-0">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="trackName"
                      className="text-sm font-medium text-zinc-200"
                    >
                      {tNft("trackName")}
                    </Label>
                    <Input
                      id="trackName"
                      placeholder={tNft("enterTrackName")}
                      value={trackName}
                      onChange={(e) => setTrackName(e.target.value)}
                      className="bg-zinc-800/50 border-zinc-700 focus:border-zinc-600 text-zinc-100 placeholder:text-zinc-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="description"
                      className="text-sm font-medium text-zinc-200"
                    >
                      {tNft("description")}
                    </Label>
                    <Textarea
                      id="description"
                      placeholder={tNft("enterDescription")}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="bg-zinc-800/50 border-zinc-700 focus:border-zinc-600 text-zinc-100 placeholder:text-zinc-400 min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="copies"
                      className="text-sm font-medium text-zinc-200"
                    >
                      {tNft("numberOfCopies")}
                    </Label>
                    <Input
                      id="copies"
                      type="number"
                      value={copies}
                      onChange={(e) => setCopies(Number(e.target.value))}
                      className="bg-zinc-800/50 border-zinc-700 focus:border-zinc-600 text-zinc-100 placeholder:text-zinc-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="price"
                      className="text-sm font-medium text-zinc-200"
                    >
                      {tNft("price")} ({album?.mintCurrency || "ETH"})
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.001"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      placeholder={tNft("priceExample")}
                      className="bg-zinc-800/50 border-zinc-700 focus:border-zinc-600 text-zinc-100 placeholder:text-zinc-400"
                    />
                    <p className="text-xs text-zinc-500">
                      {tNft("pricePerNft")} {album?.mintCurrency || "ETH"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label
                        htmlFor="mintPaymentAddress"
                        className="text-sm font-medium text-zinc-200"
                      >
                        {tNft("mintPaymentRecipient")}
                      </Label>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-zinc-400" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-zinc-800 border-zinc-700 text-zinc-200 text-xs max-w-xs">
                            {tNft("mintPaymentTooltip")}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    {/* Si hay colaboradores - Select */}
                    {album?.collaborators &&
                      Array.isArray(album.collaborators) &&
                      album.collaborators.length > 0 && (
                        <Select
                          value={mintPaymentAddress}
                          onValueChange={setMintPaymentAddress}
                        >
                          <SelectTrigger className="bg-zinc-800/50 border-zinc-700 focus:border-zinc-600 text-zinc-100">
                            <SelectValue
                              placeholder={tNft("selectCollaborator")}
                            />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-800 border-zinc-700">
                            {album.collaborators.map(
                              (collaborator: any, index: number) => (
                                <SelectItem
                                  key={index}
                                  value={collaborator.address}
                                  className="text-zinc-100 focus:bg-zinc-700 focus:text-white"
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {collaborator.name ||
                                        `${tNft("collaborator")} ${index + 1}`}
                                    </span>
                                    <span className="text-xs text-zinc-400">
                                      {collaborator.address.slice(0, 8)}...
                                      {collaborator.address.slice(-8)}
                                    </span>
                                  </div>
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      )}

                    {/* Si NO hay colaboradores - Input manual */}
                    {(!album?.collaborators ||
                      !Array.isArray(album.collaborators) ||
                      album.collaborators.length === 0) && (
                      <Input
                        id="mintPaymentAddress"
                        value={mintPaymentAddress}
                        onChange={(e) => setMintPaymentAddress(e.target.value)}
                        placeholder={tNft("walletAddressSolana")}
                        className="bg-zinc-800/50 border-zinc-700 focus:border-zinc-600 text-zinc-100 placeholder:text-zinc-500"
                      />
                    )}

                    <p className="text-xs text-zinc-500">
                      {album?.collaborators &&
                      Array.isArray(album.collaborators) &&
                      album.collaborators.length > 0
                        ? tNft("selectCollaboratorForPayment")
                        : tNft("enterWalletAddressForPayment")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="cover"
                      className="text-sm font-medium text-zinc-200"
                    >
                      {tNft("coverImage")}
                    </Label>
                    <div className="flex items-center justify-center w-full">
                      <label
                        htmlFor="cover"
                        className="relative flex items-center justify-center w-full h-48 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer bg-zinc-800/50 hover:bg-zinc-800 transition-colors duration-200"
                      >
                        {!coverImage && (
                          <div className="flex flex-col items-center justify-center w-full h-full pt-5 pb-6 z-0">
                            <Upload className="w-8 h-8 mb-4 text-zinc-400" />
                            <p className="mb-2 text-sm text-zinc-400">
                              <span className="font-semibold">
                                {tNft("clickToUpload")}
                              </span>
                            </p>
                            <p className="text-xs text-zinc-500">
                              {tNft("imageFormats")}
                            </p>
                          </div>
                        )}

                        {coverImage && (
                          <Image
                            src={coverPreview}
                            alt="Cover preview"
                            fill
                            className="object-cover rounded-lg z-10"
                          />
                        )}

                        <Input
                          id="cover"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="track"
                      className="text-sm font-medium text-zinc-200"
                    >
                      {tNft("uploadTrack")}
                    </Label>
                    <div className="flex items-center justify-center w-full">
                      <label
                        htmlFor="track"
                        className="relative flex items-center justify-center w-full h-32 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer bg-zinc-800/50 hover:bg-zinc-800 transition-colors duration-200"
                      >
                        {!trackPreview && (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6 z-0">
                            <Upload className="w-8 h-8 mb-4 text-zinc-400" />
                            <p className="mb-2 text-sm text-zinc-400">
                              <span className="font-semibold">
                                {tNft("clickToUpload")}
                              </span>
                            </p>
                            <p className="text-xs text-zinc-500">
                              {tNft("audioFormats")}
                            </p>
                          </div>
                        )}

                        {trackPreview && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center z-50">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={togglePlayPause}
                              className="text-zinc-100 hover:text-white hover:bg-zinc-700/50"
                            >
                              {isPlaying ? (
                                <Pause className="h-6 w-6" />
                              ) : (
                                <Play className="h-6 w-6" />
                              )}
                            </Button>
                            <p className="mt-2 text-sm text-zinc-400">
                              {trackFile?.name}
                            </p>
                          </div>
                        )}

                        <Input
                          id="track"
                          type="file"
                          accept=".mp3,.wav,.flac"
                          onChange={handleTrackChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-zinc-200">
                      {tNft("attributes")}
                    </Label>
                    {attributes.map((attr, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          placeholder={tNft("traitType")}
                          value={attr.trait_type}
                          onChange={(e) =>
                            handleAttributeChange(
                              index,
                              "trait_type",
                              e.target.value
                            )
                          }
                          className="flex-1 bg-zinc-800/50 border-zinc-800 focus:ring-0 focus:border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                        />
                        <Input
                          placeholder={tNft("value")}
                          value={attr.value}
                          onChange={(e) =>
                            handleAttributeChange(
                              index,
                              "value",
                              e.target.value
                            )
                          }
                          className="flex-1 bg-zinc-800/50 border-zinc-800 focus:ring-0 focus:border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                        />
                        <Button
                          variant="destructive"
                          onClick={() => handleRemoveAttribute(index)}
                          type="button"
                          size="icon"
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={handleAddAttribute}
                      type="button"
                      className="w-full mt-2 bg-zinc-800/50 border-zinc-800 text-zinc-100 hover:bg-zinc-800 hover:border-zinc-700 transition-colors"
                    >
                      + {tNft("addAttribute")}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </form>
          </ScrollArea>
        </Tabs>
        <DialogFooter className="px-6 py-4 border-t border-zinc-800">
          <Button
            onClick={createAlbum}
            disabled={isCreatingAlbum || loading}
            className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-900 disabled:bg-zinc-800/50 disabled:text-zinc-500 transition-colors"
          >
            {loading ? tNft("uploading") : tNft("addTrack")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
