import { useState, useCallback } from "react";
import { toast } from "sonner";

export const useIPFSUpload = () => {
  const [isUploading, setIsUploading] = useState(false);

  // Función para subir imagen a Pinata
  const uploadImageToPinata = useCallback(
    async (coverImage: File | null): Promise<string | null> => {
      if (!coverImage) {
        throw new Error("No image provided");
      }

      setIsUploading(true);
      try {
        // Crear FormData para la imagen
        const imageFormData = new FormData();
        imageFormData.append("cover", coverImage);

        // Subir imagen a Pinata
        const responseImagePinata = await fetch("/api/pinata", {
          method: "POST",
          body: imageFormData,
        });

        if (!responseImagePinata.ok) {
          throw new Error("Error uploading image to Pinata");
        }

        const imageData = await responseImagePinata.json();
        console.log("Image uploaded to Pinata:", imageData);

        // Construir la URL de la imagen
        return `https://turquoise-neighbouring-mule-736.mypinata.cloud/ipfs/${imageData.ipfsHash}/${coverImage.name}`;
      } catch (error) {
        console.error("Error uploading image:", error);
        toast.error("Error uploading image");
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  // Función para subir metadatos a Pinata
  const uploadMetadataToPinata = useCallback(
    async (metadata: any): Promise<string | null> => {
      setIsUploading(true);
      try {
        const metadataFormData = new FormData();
        const metadataBlob = new Blob([JSON.stringify(metadata)], {
          type: "application/json",
        });
        metadataFormData.append("metadata", metadataBlob, "metadata.json");

        // Subir el metadata a Pinata
        const responseMetadataPinata = await fetch("/api/pinata", {
          method: "POST",
          body: metadataFormData,
        });

        if (!responseMetadataPinata.ok) {
          throw new Error("Error uploading metadata to Pinata");
        }

        const metadataData = await responseMetadataPinata.json();
        console.log("Metadata uploaded to Pinata:", metadataData);

        // Construir la URL del metadata
        return `https://turquoise-neighbouring-mule-736.mypinata.cloud/ipfs/${metadataData.ipfsHash}/metadata.json`;
      } catch (error) {
        console.error("Error uploading metadata:", error);
        toast.error("Error uploading metadata");
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  return {
    uploadImageToPinata,
    uploadMetadataToPinata,
    isUploading,
  };
};
