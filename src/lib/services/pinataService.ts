import FormData from "form-data";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";

// Configura tus claves de API de Pinata
const PINATA_API_KEY = process.env.NEXT_PUBLIC_KEY_PINATA_API as string;
const PINATA_API_URL = "https://api.pinata.cloud/";

export const createDirectory = async (directoryName: string) => {
  const url = `${PINATA_API_URL}pinning/pinFileToIPFS`;
  const data = new FormData();

  // Simula un archivo vacío, ya que la API requiere un archivo pero queremos "crear un directorio"
  const buffer = Buffer.from("");
  data.append("file", buffer, { filename: "dummy.txt" });

  // Añade metadatos para simular la creación de un directorio
  data.append(
    "pinataMetadata",
    JSON.stringify({
      name: directoryName,
      keyvalues: {
        exampleKey: "exampleValue",
      },
    })
  );

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PINATA_API_KEY}`,
        ...data.getHeaders(),
      },
      body: data,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Error creating directory: ${response.statusText} - ${errorText}`
      );
    }

    const responseData = await response.json();
    return responseData.IpfsHash;
  } catch (error) {
    console.error("Error creating directory:", error);
    throw error;
  }
};

export const uploadFileToDirectory = async (directoryPath: string) => {
  const url = `${PINATA_API_URL}pinning/pinFileToIPFS`;
  const data = new FormData();

  // Añadir metadatos
  const directoryName = path.basename(directoryPath);
  data.append("pinataMetadata", JSON.stringify({ name: directoryName }));

  // Añadir archivos
  const files = fs
    .readdirSync(directoryPath)
    .filter((file) => fs.statSync(path.join(directoryPath, file)).isFile());
  //console.log("Files to upload:", files);

  for (const file of files) {
    const filePath = path.join(directoryPath, file);
    const fileKey = `${directoryName}/${file}`;
    data.append("file", fs.createReadStream(filePath), { filepath: fileKey });
    //console.log(`Adding file to FormData: ${filePath} as ${fileKey}`);
  }

  const headers = {
    Authorization: `Bearer ${PINATA_API_KEY}`,
    ...data.getHeaders(),
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: data,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Error uploading files: ${errorBody}`);
      throw new Error(
        `Error uploading files: ${response.statusText} - Details: ${errorBody}`
      );
    }

    const responseData = await response.json();
    //console.log(`Uploaded directory: ${responseData.IpfsHash}`);
    return responseData.IpfsHash; // Devuelve el hash del directorio
  } catch (error) {
    console.error(`Error uploading files:`, error);
    throw error;
  }
};

export const uploadFileIndividually = async (filePath: string) => {
  const url = `${PINATA_API_URL}pinning/pinFileToIPFS`;
  const data = new FormData();
  data.append("file", fs.createReadStream(filePath));
  data.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));
  data.append(
    "pinataMetadata",
    JSON.stringify({
      name: path.basename(filePath),
    })
  );

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PINATA_API_KEY}`,
        ...data.getHeaders(),
      },
      body: data,
    });

    if (!response.ok) {
      throw new Error(`Error uploading file: ${response.statusText}`);
    }

    const responseData = await response.json();
    return responseData.IpfsHash;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};
