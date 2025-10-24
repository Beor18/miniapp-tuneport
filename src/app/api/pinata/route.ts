import { type NextRequest, NextResponse } from "next/server";
import { uploadFileToDirectory } from "@Src/lib/services/pinataService";
import formidable, { Fields, Files } from "formidable";
import { promises as fsPromises } from "fs";
import path from "path";
import { PassThrough } from "stream";
import { IncomingMessage } from "http";

// Configurar límites de tamaño para archivos grandes usando route segment config
export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutos para archivos grandes

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type");
    if (!contentType || !contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Invalid Content-Type. Expected multipart/form-data." },
        { status: 400 }
      );
    }

    const form = formidable({
      multiples: true,
      keepExtensions: true,
    });

    const pass = await transformToPassThrough(req);

    const nodeReq = Object.assign(pass, {
      headers: Object.fromEntries(req.headers),
      method: req.method,
      url: req.url,
    }) as unknown as IncomingMessage;

    const { fields, files } = await new Promise<{
      fields: Fields;
      files: Files;
    }>((resolve, reject) => {
      form.parse(nodeReq, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    // Caso para picture (ej: subir avatar de perfil)
    const pictureFiles = files.picture
      ? Array.isArray(files.picture)
        ? files.picture
        : [files.picture]
      : [];

    // Caso para cover y track (otros usos de la página)
    const coverFiles = files.cover
      ? Array.isArray(files.cover)
        ? files.cover
        : [files.cover]
      : [];
    const trackFiles = files.track
      ? Array.isArray(files.track)
        ? files.track
        : [files.track]
      : [];

    const metadataFile = files.metadata
      ? Array.isArray(files.metadata)
        ? files.metadata[0]
        : files.metadata
      : null;

    let uploadedFiles = [];

    // Si se recibe picture, se sube solo picture. Si no, se usan cover/track.
    if (pictureFiles.length > 0) {
      uploadedFiles = pictureFiles;
    } else {
      uploadedFiles = [...coverFiles, ...trackFiles];
    }

    if (metadataFile) {
      uploadedFiles.push(metadataFile);
    }

    if (uploadedFiles.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const directoryPath = path.join("/tmp", `upload_${Date.now()}`);
    await fsPromises.mkdir(directoryPath, { recursive: true });

    for (const file of uploadedFiles) {
      const originalFilename = file.originalFilename || file.newFilename;
      const filePath = path.join(directoryPath, originalFilename);
      await fsPromises.copyFile(file.filepath, filePath);
    }

    const ipfsHash = await uploadFileToDirectory(directoryPath);

    // Limpieza del directorio temporal
    await fsPromises.rm(directoryPath, { recursive: true, force: true });

    return NextResponse.json(
      {
        message: "Files uploaded successfully as directory",
        ipfsHash,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      {
        error: "Error processing request",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

async function transformToPassThrough(req: NextRequest): Promise<PassThrough> {
  const reader = req.body?.getReader();
  if (!reader) {
    throw new Error("No body found in the request");
  }

  const pass = new PassThrough();
  (async () => {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) pass.write(value);
    }
    pass.end();
  })();

  return pass;
}
