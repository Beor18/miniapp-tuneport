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
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface NFTMintButtonProps {
  collectionAddress: string;
  tokenId: string;
  recipientAddress: string;
  metadataUrl: string;
  onMint: (
    collectionAddress: string,
    recipient: string,
    tokenId: number,
    amount: number,
    metadata: string
  ) => Promise<boolean>;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function NFTMintButton({
  collectionAddress,
  tokenId,
  recipientAddress,
  metadataUrl,
  onMint,
  isLoading = false,
  disabled = false,
}: NFTMintButtonProps) {
  // Translation hooks
  const tNft = useTranslations("nft");

  const [amount, setAmount] = useState("1");

  const handleMint = async () => {
    if (!collectionAddress) {
      toast.error("No hay dirección de colección");
      return;
    }

    if (!recipientAddress) {
      toast.error("No hay dirección de destinatario");
      return;
    }

    if (!tokenId) {
      toast.error(tNft("noTokenIdAvailable"));
      return;
    }

    const success = await onMint(
      collectionAddress,
      recipientAddress,
      parseInt(tokenId),
      parseInt(amount),
      metadataUrl || "{}"
    );

    if (success) {
      toast.success(`¡${amount} NFT(s) minteados exitosamente!`);
      setAmount("1"); // Reset amount
    }
  };

  const canMint = collectionAddress && tokenId && recipientAddress && !disabled;

  return (
    <Card className="bg-zinc-800/70 border-zinc-700 text-white">
      <CardHeader>
        <CardTitle>Mintear NFT</CardTitle>
        <CardDescription className="text-zinc-400">
          Mintea tu NFT creado (sin costo de gas para ti)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm text-zinc-400">Información del NFT:</Label>
          <div className="text-xs space-y-1 text-zinc-500">
            <p>
              {tNft("collectionLabel")}:{" "}
              {collectionAddress || tNft("notAvailable")}
            </p>
            <p>
              {tNft("tokenIdLabel")}: {tokenId || tNft("notAvailable")}
            </p>
            <p>
              {tNft("recipientLabel")}:{" "}
              {recipientAddress || tNft("notAvailable")}
            </p>
          </div>
        </div>

        <div>
          <Label htmlFor="mintAmount">{tNft("amountToMint")}</Label>
          <Input
            id="mintAmount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
            className="bg-zinc-900 border-zinc-700 text-zinc-300"
            //disabled={!canMint}
          />
        </div>
      </CardContent>
      <CardFooter className="flex-col space-y-3">
        <Button
          onClick={handleMint}
          //disabled={isLoading || !canMint}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
        >
          {isLoading ? tNft("minting") : tNft("mintNFTButton")}
        </Button>
        <p className="text-xs text-zinc-500 text-center">
          El gas de esta transacción será pagado por la wallet del desarrollador
        </p>
      </CardFooter>
    </Card>
  );
}
