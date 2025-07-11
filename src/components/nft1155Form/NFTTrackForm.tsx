import { useState } from "react";
import { Button } from "@Src/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@Src/ui/components/ui/card";
import { Input } from "@Src/ui/components/ui/input";
import { Label } from "@Src/ui/components/ui/label";
import { Textarea } from "@Src/ui/components/ui/textarea";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface NFTTrackFormProps {
  collectionAddress?: string;
  onCreateNFT: (data: {
    collectionId: string;
    name: string;
    description: string;
    image?: File;
    music?: File;
    copies: number;
    price: number;
  }) => Promise<{ metadataUrl: string; tokenId: number }>;
  isLoading?: boolean;
  onNFTCreated?: (result: { metadataUrl: string; tokenId: number }) => void;
}

export default function NFTTrackForm({
  collectionAddress = "",
  onCreateNFT,
  isLoading = false,
  onNFTCreated,
}: NFTTrackFormProps) {
  // Translation hooks
  const tNft = useTranslations("nft");
  const tCommon = useTranslations("common");
  const tForms = useTranslations("forms");

  const [nftName, setNftName] = useState("");
  const [nftDescription, setNftDescription] = useState("");
  const [nftImage, setNftImage] = useState<File | null>(null);
  const [nftMusic, setNftMusic] = useState<File | null>(null);
  const [nftCopies, setNftCopies] = useState(1);
  const [nftPrice, setNftPrice] = useState(0);
  const [nftCollectionId, setNftCollectionId] = useState(collectionAddress);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNftImage(e.target.files[0]);
    }
  };

  const handleMusicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNftMusic(e.target.files[0]);
    }
  };

  const handleCreateNFT = async () => {
    if (!nftCollectionId) {
      toast.error("Selecciona una colección existente");
      return;
    }

    if (!nftName || !nftDescription) {
      toast.error("Nombre y descripción son obligatorios");
      return;
    }

    try {
      const result = await onCreateNFT({
        collectionId: nftCollectionId,
        name: nftName,
        description: nftDescription,
        image: nftImage || undefined,
        music: nftMusic || undefined,
        copies: nftCopies,
        price: nftPrice,
      });

      // Limpiar formulario
      setNftName("");
      setNftDescription("");
      setNftImage(null);
      setNftMusic(null);
      setNftCopies(1);
      setNftPrice(0);

      // Resetear inputs de archivos
      const imageInput = document.getElementById(
        "nftImage"
      ) as HTMLInputElement;
      const musicInput = document.getElementById(
        "nftMusic"
      ) as HTMLInputElement;
      if (imageInput) imageInput.value = "";
      if (musicInput) musicInput.value = "";

      toast.success(tNft("trackCreatedSuccessfully"));

      // Callback opcional para el componente padre
      if (onNFTCreated) {
        onNFTCreated(result);
      }
    } catch (error: any) {
      console.error("Error creating track:", error);
      // El toast de error se maneja en el hook
    }
  };

  return (
    <Card className="bg-zinc-800/70 border-zinc-700 text-white">
      <CardHeader>
        <CardTitle>Crear NFT Track</CardTitle>
        <CardDescription className="text-zinc-400">
          Create a new track in the selected collection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="nftCollectionId">{tNft("collectionAddress")}</Label>
          <Input
            id="nftCollectionId"
            value={nftCollectionId}
            onChange={(e) => setNftCollectionId(e.target.value)}
            placeholder={tForms("walletAddressPlaceholder")}
            className="bg-zinc-900 border-zinc-700 text-zinc-300"
          />
        </div>

        <div>
          <Label htmlFor="nftName">Nombre del Track</Label>
          <Input
            id="nftName"
            value={nftName}
            onChange={(e) => setNftName(e.target.value)}
            placeholder={tNft("yourAmazingSong")}
            className="bg-zinc-900 border-zinc-700 text-zinc-300"
          />
        </div>

        <div>
          <Label htmlFor="nftDescription">Descripción</Label>
          <Textarea
            id="nftDescription"
            value={nftDescription}
            onChange={(e) => setNftDescription(e.target.value)}
            placeholder={tNft("describeMusic")}
            className="bg-zinc-900 border-zinc-700 text-zinc-300"
          />
        </div>

        <div>
          <Label htmlFor="nftImage">Track image</Label>
          <Input
            id="nftImage"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="bg-zinc-900 border-zinc-700 text-zinc-300"
          />
        </div>

        <div>
          <Label htmlFor="nftMusic">Track music</Label>
          <Input
            id="nftMusic"
            type="file"
            accept="audio/*"
            onChange={handleMusicChange}
            className="bg-zinc-900 border-zinc-700 text-zinc-300"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="nftCopies">{tNft("copies")}</Label>
            <Input
              id="nftCopies"
              type="number"
              value={nftCopies}
              onChange={(e) => setNftCopies(Number(e.target.value))}
              min="1"
              className="bg-zinc-900 border-zinc-700 text-zinc-300"
            />
          </div>
          <div>
            <Label htmlFor="nftPrice">Price (ETH)</Label>
            <Input
              id="nftPrice"
              type="number"
              value={nftPrice}
              onChange={(e) => setNftPrice(Number(e.target.value))}
              min="0"
              step="0.01"
              className="bg-zinc-900 border-zinc-700 text-zinc-300"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleCreateNFT}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          {isLoading ? tNft("processing") : tNft("createNFT")}
        </Button>
      </CardFooter>
    </Card>
  );
}
