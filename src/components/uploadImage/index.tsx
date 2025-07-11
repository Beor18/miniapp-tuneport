/* eslint-disable @next/next/no-img-element */
import React, { useRef, useState, useEffect } from "react";

const InputImage = ({
  handleImageChange,
  showPreview = true,
  id,
}: {
  handleImageChange: any;
  showPreview?: boolean;
  id: string;
}) => {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const inputId = id; // Usa el id pasado como prop

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setErrorMessage("");
      if (files[0] && showPreview) {
        setPreviewUrl(URL.createObjectURL(files[0]));
      }
      handleImageChange(event);
    }
  };

  return (
    <div className="w-full">
      <div className="min-w-full h-56 bg-[#252425] border-[1px] border-dashed border-[#4b4b4b] cursor-pointer rounded-[10px] flex items-center justify-center text-[12px] mb-[15px] relative">
        {previewUrl && showPreview && (
          <img
            src={previewUrl}
            alt="Preview"
            className="absolute w-full h-56 aspect-square object-cover rounded-[10px]"
          />
        )}
        <input
          id={inputId}
          type="file"
          accept="image/*"
          multiple
          className="w-full h-full opacity-0 cursor-pointer"
          ref={inputFileRef}
          onChange={handleChange}
        />
        {!previewUrl && (
          <label
            htmlFor={inputId}
            className="flex flex-col justify-center items-center text-center absolute"
          >
            <div className="flex justify-center items-center mb-4">
              <svg
                width="45"
                height="45"
                viewBox="0 0 45 45"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M39.7083 5.29167V39.7083H5.29167V5.29167H39.7083ZM39.7083 0.375H5.29167C2.5875 0.375 0.375 2.5875 0.375 5.29167V39.7083C0.375 42.4125 2.5875 44.625 5.29167 44.625H39.7083C42.4125 44.625 44.625 42.4125 44.625 39.7083V5.29167C44.625 2.5875 42.4125 0.375 39.7083 0.375ZM27.7608 22.1558L20.3858 31.6696L15.125 25.3025L7.75 34.7917H37.25L27.7608 22.1558Z"
                  fill="white"
                  fillOpacity="0.39"
                />
              </svg>
            </div>
            <p className="text-[12px] font-medium text-white">
              Drop your image here or <b className="text-[#ffb658]">Browse</b>
            </p>
          </label>
        )}
      </div>
      {errorMessage && (
        <div className="text-red-500 text-[12px]">{errorMessage}</div>
      )}
    </div>
  );
};

export default InputImage;
