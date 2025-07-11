"use client";

import { useState, useCallback } from "react";
import { Button } from "@Src/ui/components/ui/button";
import { Progress } from "@Src/ui/components/ui/progress";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@Src/ui/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@Src/ui/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@Src/ui/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@Src/ui/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@Src/ui/components/ui/accordion";
import {
  Music,
  FileSpreadsheet,
  Upload,
  AlertTriangle,
  Disc,
  User,
} from "lucide-react";
import { Input } from "@Src/ui/components/ui/input";
import { Label } from "@Src/ui/components/ui/label";
import { useToast } from "@Src/ui/components/ui/use-toast";

interface Track {
  id: string;
  title: string;
  duration: string;
  fileName: string;
}

interface Album {
  id: string;
  title: string;
  artist: string;
  tracks: Track[];
}

interface Label {
  id: string;
  name: string;
  albums: Album[];
}

export default function ImportCatalog() {
  const [isOpen, setIsOpen] = useState(false);
  const [importMode, setImportMode] = useState<"single" | "bulk">("single");
  const [tracks, setTracks] = useState<File[]>([]);
  const [albumName, setAlbumName] = useState<string>("");
  const [artist, setArtist] = useState<string>("");
  const [metadataFile, setMetadataFile] = useState<File | null>(null);
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [importProgress, setImportProgress] = useState<number>(0);
  const [importStatus, setImportStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errors, setErrors] = useState<string[]>([]);
  const [importedData, setImportedData] = useState<Label[]>([]);
  const { toast } = useToast();

  const handleSingleAlbumFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (files) {
      const mp3Files = Array.from(files).filter((file) =>
        file.name.endsWith(".mp3")
      );
      setTracks(mp3Files);

      if (mp3Files.length > 0) {
        const fileName = mp3Files[0].name;
        const match = fileName.match(/^(.+) - (.+) - \d+/);
        if (match) {
          setArtist(match[1]);
          setAlbumName(match[2]);
        }
      }
    }
  };

  const handleMetadataFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file && (file.name.endsWith(".csv") || file.name.endsWith(".xlsx"))) {
      setMetadataFile(file);
    } else {
      toast({
        title: "Invalid file format",
        description: "Please select a CSV or Excel file.",
        variant: "destructive",
      });
    }
  };

  const handleAudioFilesSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (files) {
      const audioFiles = Array.from(files).filter(
        (file) => file.type.startsWith("audio/") || file.name.endsWith(".mp3")
      );
      setAudioFiles(audioFiles);
    }
  };

  const handleImport = useCallback(() => {
    setImportStatus("loading");
    setImportProgress(0);

    const intervalId = setInterval(() => {
      setImportProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(intervalId);
          setImportStatus("success");
          // Simulate imported data
          const mockImportedData: Label[] = [
            {
              id: "1",
              name: "Cool Records",
              albums: [
                {
                  id: "1",
                  title: "Awesome Album",
                  artist: "Great Artist",
                  tracks: [
                    {
                      id: "1",
                      title: "Track 1",
                      duration: "3:45",
                      fileName: "track1.mp3",
                    },
                    {
                      id: "2",
                      title: "Track 2",
                      duration: "4:20",
                      fileName: "track2.mp3",
                    },
                  ],
                },
                {
                  id: "2",
                  title: "Another Album",
                  artist: "Another Artist",
                  tracks: [
                    {
                      id: "3",
                      title: "Track 3",
                      duration: "3:30",
                      fileName: "track3.mp3",
                    },
                    {
                      id: "4",
                      title: "Track 4",
                      duration: "5:15",
                      fileName: "track4.mp3",
                    },
                  ],
                },
              ],
            },
            {
              id: "2",
              name: "Indie Label",
              albums: [
                {
                  id: "3",
                  title: "Debut Album",
                  artist: "New Artist",
                  tracks: [
                    {
                      id: "5",
                      title: "First Song",
                      duration: "3:00",
                      fileName: "first.mp3",
                    },
                    {
                      id: "6",
                      title: "Second Song",
                      duration: "3:45",
                      fileName: "second.mp3",
                    },
                  ],
                },
              ],
            },
          ];
          setImportedData(mockImportedData);
          setIsOpen(false);
          toast({
            title: "Import Successful",
            description: "Your catalog has been imported successfully.",
            duration: 5000,
          });
          return 100;
        }
        return prevProgress + 10;
      });
    }, 500);
  }, [toast]);

  const renderImportButton = () => {
    if (importMode === "single") {
      return (
        <Button
          onClick={handleImport}
          disabled={
            importStatus === "loading" ||
            importStatus === "success" ||
            !albumName ||
            !artist ||
            tracks.length === 0
          }
        >
          Import Album
        </Button>
      );
    } else {
      return (
        <Button
          onClick={handleImport}
          disabled={
            importStatus === "loading" ||
            importStatus === "success" ||
            !metadataFile ||
            audioFiles.length === 0
          }
        >
          Import Catalog
        </Button>
      );
    }
  };

  return (
    <div>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="sm:flex">
            Import Music
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[700px] w-[400px] rounded">
          <DialogHeader>
            <DialogTitle>Music Import</DialogTitle>
          </DialogHeader>
          <Tabs
            defaultValue="single"
            onValueChange={(value) => setImportMode(value as "single" | "bulk")}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single">Single Album</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Import</TabsTrigger>
            </TabsList>
            <TabsContent value="single">
              <div className="space-y-4 mt-4">
                <div className="flex items-center space-x-4">
                  <Button variant="outline" className="w-full sm:w-auto">
                    <label
                      htmlFor="single-file-upload"
                      className="cursor-pointer flex items-center"
                    >
                      <Music className="mr-2 h-4 w-4" />
                      Select MP3 Files
                    </label>
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {tracks.length > 0
                      ? `${tracks.length} files selected`
                      : "No files selected"}
                  </span>
                  <input
                    id="single-file-upload"
                    type="file"
                    multiple
                    accept=".mp3"
                    className="hidden"
                    onChange={handleSingleAlbumFileSelect}
                  />
                </div>

                {tracks.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Album Details</h2>
                    <div className="space-y-2">
                      <Label htmlFor="album-name">Album Name</Label>
                      <Input
                        id="album-name"
                        value={albumName}
                        onChange={(e) => setAlbumName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="artist-name">Artist</Label>
                      <Input
                        id="artist-name"
                        value={artist}
                        onChange={(e) => setArtist(e.target.value)}
                      />
                    </div>
                    <div className="max-h-[200px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Track</TableHead>
                            <TableHead>File Name</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tracks.map((track, index) => (
                            <TableRow key={index}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell className="flex items-center">
                                <Music className="mr-2 h-4 w-4" />
                                {track.name}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="bulk">
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="metadata-file">
                    Metadata File (CSV/Excel)
                  </Label>
                  <div className="flex items-center space-x-4">
                    <Button variant="outline" className="w-full sm:w-auto">
                      <label
                        htmlFor="metadata-file-upload"
                        className="cursor-pointer flex items-center"
                      >
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Select File
                      </label>
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {metadataFile ? metadataFile.name : "No file selected"}
                    </span>
                    <input
                      id="metadata-file-upload"
                      type="file"
                      accept=".csv,.xlsx"
                      className="hidden"
                      onChange={handleMetadataFileSelect}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="audio-files">Audio Files</Label>
                  <div className="flex items-center space-x-4">
                    <Button variant="outline" className="w-full sm:w-auto">
                      <label
                        htmlFor="audio-files-upload"
                        className="cursor-pointer flex items-center"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Select Files
                      </label>
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {audioFiles.length > 0
                        ? `${audioFiles.length} files selected`
                        : "No files selected"}
                    </span>
                    <input
                      id="audio-files-upload"
                      type="file"
                      multiple
                      accept="audio/*,.mp3"
                      className="hidden"
                      onChange={handleAudioFilesSelect}
                    />
                  </div>
                </div>
                {audioFiles.length > 0 && (
                  <div className="max-h-[200px] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Audio File</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {audioFiles.map((file, index) => (
                          <TableRow key={index}>
                            <TableCell className="flex items-center">
                              <Music className="mr-2 h-4 w-4" />
                              {file.name}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {errors.length > 0 && (
            <Alert variant="default">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warnings</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-4">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {renderImportButton()}

          {importStatus === "loading" && (
            <div className="space-y-2">
              <Progress value={importProgress} className="w-full" />
              <p className="text-sm text-center">{importProgress}% completed</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {importedData.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Imported Catalog</h2>
          <Accordion type="single" collapsible className="w-full">
            {importedData.map((label) => (
              <AccordionItem value={label.id} key={label.id}>
                <AccordionTrigger>
                  <div className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    {label.name} ({label.albums.length} albums)
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Accordion type="single" collapsible className="w-full">
                    {label.albums.map((album) => (
                      <AccordionItem value={album.id} key={album.id}>
                        <AccordionTrigger>
                          <div className="flex items-center">
                            <Disc className="mr-2 h-4 w-4" />
                            {album.title} by {album.artist} (
                            {album.tracks.length} tracks)
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>File Name</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {album.tracks.map((track) => (
                                <TableRow key={track.id}>
                                  <TableCell>{track.title}</TableCell>
                                  <TableCell>{track.duration}</TableCell>
                                  <TableCell>{track.fileName}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}
    </div>
  );
}
