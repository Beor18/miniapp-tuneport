"use client";

import { Button } from "@Src/ui/components/ui/button";
import React, { useState } from "react";
import { useTranslations } from "next-intl";

interface FileUploadComponentProps {
  setIsOpen: (isOpen: boolean) => void;
}

const FileUpload = ({ setIsOpen }: FileUploadComponentProps) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const tForms = useTranslations("forms");
  const tMusic = useTranslations("music");
  const tCommon = useTranslations("common");
  const tUpload = useTranslations("upload");

  const handleFileChange = (event: any) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    if (!selectedFile) {
      alert(tUpload("selectFile"));
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      // Manejo según el resultado de tu API
      // console.log(result);
      alert(tUpload("uploadSuccess"));
    } catch (error) {
      console.error("Error al subir el archivo:", error);
      alert(tUpload("uploadError"));
    }
  };

  return (
    <>
      <div className="flex flex-wrap justify-end items-end justify-between">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder={tForms("nameSong")}
            className="p-1 rounded border"
          />
          <input type="file" onChange={handleFileChange} />
          <div className="flex items-start">
            <Button type="submit" className="mt-4">
              {tMusic("addTracks")}
            </Button>
          </div>
        </form>
        <div className="items-end">
          <Button onClick={() => setIsOpen(false)} className="self-center ml-4">
            {tCommon("close")}
          </Button>
        </div>
      </div>
    </>
  );
};

export default FileUpload;
