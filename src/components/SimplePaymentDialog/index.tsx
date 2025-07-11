import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@Src/ui/components/ui/dialog";
import { Button } from "@Src/ui/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useBlockchain } from "@Src/contexts/BlockchainContext";
import type {
  SolanaMintOptions,
  BaseMintOptions,
} from "@Src/contexts/BlockchainContext";

// Interfaz para las props del componente
interface SimplePaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  // Datos para Solana
  candyMachineId?: string;
  collectionId?: string;
  price?: number;
  startDate?: Date | string;
  artist_address_mint?: string;
  currency?: string;
  // Datos para Base
  tokenURI?: string;
  recipient?: string;
  // Datos comunes
  blockchain?: "solana" | "base";
  albumTitle?: string;
}

/**
 * Componente de diálogo simplificado para procesar pagos y mintear NFTs
 */
const SimplePaymentDialog: React.FC<SimplePaymentDialogProps> = ({
  isOpen,
  onClose,
  candyMachineId = "",
  collectionId = "",
  price = 0,
  startDate = new Date(),
  artist_address_mint = "",
  currency = "SOL",
  tokenURI = "",
  recipient = "",
  blockchain = "solana",
  albumTitle = "Unknown Album",
}) => {
  // Estado para controlar el proceso de la transacción
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  // Obtener las funciones del BlockchainContext
  const { mintNFT, isMinting, setSelectedBlockchain } = useBlockchain();

  // Verificar y establecer el blockchain correcto según los datos disponibles
  useEffect(() => {
    setSelectedBlockchain(blockchain);
  }, [blockchain, setSelectedBlockchain]);

  // Manejar el cierre del diálogo
  const handleClose = () => {
    if (!isProcessing && !isMinting) {
      onClose();
    }
  };

  // Normalizar datos según la blockchain seleccionada
  const prepareMintData = () => {
    if (blockchain === "solana") {
      const mintOptions: SolanaMintOptions = {
        candyMachineId,
        collectionId,
        price,
        startDate:
          typeof startDate === "string" ? new Date(startDate) : startDate,
        artist_address_mint,
        currency,
      };
      return mintOptions;
    } else if (blockchain === "base") {
      const mintOptions: BaseMintOptions = {
        recipient,
        tokenURI,
      };
      return mintOptions;
    }
    throw new Error(`Blockchain no soportada: ${blockchain}`);
  };

  // Manejar el proceso de minteo
  const handleClaim = async () => {
    try {
      setIsProcessing(true);
      setIsError(false);
      setErrorMessage("");
      setTransactionHash(null);

      // Preparar los datos según la blockchain
      const mintOptions = prepareMintData();

      // Ejecutar el minteo
      const result = await mintNFT(mintOptions);

      if (result) {
        setTransactionHash(result);
        setIsCompleted(true);
        toast.success("¡NFT minteado con éxito!", {
          description: `Tu NFT para "${albumTitle}" ha sido creado correctamente`,
        });
      } else {
        throw new Error("No se recibió confirmación del minteo");
      }
    } catch (error: any) {
      console.error("Error en el proceso de mint:", error);
      setIsError(true);
      setErrorMessage(
        error.message || "Ha ocurrido un error durante el proceso de minteo"
      );
      toast.error("Error al mintear NFT", {
        description:
          error.message || "Ha ocurrido un error durante el proceso de minteo",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] text-center">
        <h2 className="text-xl font-bold mb-4">
          {isCompleted
            ? "¡NFT Minteado con éxito!"
            : isError
            ? "Error en el proceso"
            : "Confirmar Minteo de NFT"}
        </h2>

        <div className="py-4">
          {isCompleted ? (
            <div>
              <p className="text-green-500 mb-2">
                ¡Tu NFT ha sido creado correctamente!
              </p>
              {transactionHash && (
                <p className="text-sm text-gray-500 break-all mb-4">
                  ID de transacción: {transactionHash}
                </p>
              )}
              <p>Puedes cerrar esta ventana.</p>
            </div>
          ) : isError ? (
            <div>
              <p className="text-red-500 mb-2">
                Ha ocurrido un error durante el proceso:
              </p>
              <p className="text-sm text-gray-800 mb-4">{errorMessage}</p>
              <p>Por favor, inténtalo de nuevo más tarde.</p>
            </div>
          ) : (
            <div>
              <p className="mb-4">
                Estás a punto de mintear un NFT para el álbum:
                <br />
                <span className="font-semibold">{albumTitle}</span>
              </p>
              <p className="mb-4">
                Red:{" "}
                <span className="font-semibold capitalize">{blockchain}</span>
              </p>
              {blockchain === "solana" && (
                <p className="mb-2">
                  Precio:{" "}
                  <span className="font-semibold">
                    {price} {currency}
                  </span>
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-center gap-4 mt-2">
          {isCompleted ? (
            <Button onClick={handleClose}>Cerrar</Button>
          ) : isError ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handleClaim}>Reintentar</Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isProcessing || isMinting}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleClaim}
                disabled={isProcessing || isMinting}
              >
                {isProcessing || isMinting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  "Confirmar"
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SimplePaymentDialog;
