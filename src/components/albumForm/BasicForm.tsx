/* eslint-disable @next/next/no-img-element */
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@Src/ui/components/ui/alert";
import { Input } from "@Src/ui/components/ui/input";
import { Label } from "@Src/ui/components/ui/label";
import { Textarea } from "@Src/ui/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@Src/ui/components/ui/select";
import { Link, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { RadioGroup, RadioGroupItem } from "@Src/ui/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@Src/ui/components/ui/card";

interface BasicFormProps {
  collectionType: string;
  setCollectionType: (value: string) => void;
  albumName: string;
  setAlbumName: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  coverImage: File | null | string;
  coverFile: string;
  artistName: string;
  setArtistName: (value: string) => void;
  musicGenre: string;
  setMusicGenre: (value: string) => void;
  recordLabel: string;
  setRecordLabel: (value: string) => void;
  releaseDate: string;
  setReleaseDate: (value: string) => void;
  startDate: string;
  setStartDate: (value: string) => void;
}

export function BasicForm({
  collectionType,
  setCollectionType,
  albumName,
  setAlbumName,
  description,
  setDescription,
  handleImageChange,
  coverImage,
  coverFile,
  artistName,
  setArtistName,
  musicGenre,
  setMusicGenre,
  recordLabel,
  setRecordLabel,
  releaseDate,
  setReleaseDate,
  startDate,
  setStartDate,
}: BasicFormProps) {
  const tAlbum = useTranslations("album");
  const tForms = useTranslations("forms");
  const tCommon = useTranslations("common");
  return (
    <div className="space-y-4">
      <Alert className="max-w-md mx-auto bg-amber-900/20 border border-amber-900/30">
        <AlertTitle className="text-lg font-semibold text-amber-200 mb-2">
          Solana Devnet Environment
        </AlertTitle>
        <AlertDescription className="text-amber-100/80">
          <p className="mb-3">
            Remember to obtain test SOL or any token to interact with the
            network.
          </p>
          <a
            href="https://faucet.solana.com/"
            className="inline-flex items-center text-amber-200 hover:text-amber-100 underline transition-colors font-medium"
            target="_blank"
          >
            Get SOL from Faucet
          </a>
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        <Label
          htmlFor="collectionType"
          className="text-lg font-semibold text-zinc-100"
        >
          Type Collection
        </Label>
        <RadioGroup
          id="collectionType"
          value={collectionType}
          onValueChange={setCollectionType}
          className="space-y-4"
        >
          <Card className="bg-zinc-800/50 border-zinc-800 hover:bg-zinc-800/70 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ALBUM" id="ALBUM" />
                <CardTitle>
                  <Label
                    htmlFor="ALBUM"
                    className="text-lg cursor-pointer text-zinc-100"
                  >
                    ALBÚM
                  </Label>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-zinc-400">
                <p className="font-medium">
                  A cohesive collection that brings together several related
                  items, perfect for complete projects.
                </p>
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-zinc-800/50 border-zinc-800 hover:bg-zinc-800/70 transition-colors">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="DROP" id="DROP" />
                <CardTitle>
                  <Label
                    htmlFor="DROP"
                    className="text-lg cursor-pointer text-zinc-100"
                  >
                    COLLECTIVE DROP
                  </Label>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-zinc-400">
                <p className="font-medium">
                  A collaborative collection with contributions from multiple
                  creators, ideal for joint releases.
                </p>
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-zinc-800/50 border-zinc-800 hover:bg-zinc-800/70 transition-colors">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="SINGLE" id="SINGLE" />
                <CardTitle>
                  <Label
                    htmlFor="SINGLE"
                    className="text-lg cursor-pointer text-zinc-100"
                  >
                    SINGLE
                  </Label>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-zinc-400">
                <p className="font-medium">
                  A single standout item, perfect for exclusive and direct
                  releases.
                </p>
              </CardDescription>
            </CardContent>
          </Card>
        </RadioGroup>
      </div>
      <div>
        {collectionType !== "" && (
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-zinc-200">
                {collectionType === "ALBUM" && (
                  <Label htmlFor="albumName">Album Name</Label>
                )}
                {collectionType === "SINGLE" && (
                  <Label htmlFor="albumName">Single Name</Label>
                )}
                {collectionType === "DROP" && (
                  <Label htmlFor="albumName">Drop Name</Label>
                )}
              </Label>
              <Input
                className="bg-zinc-800/50 border-zinc-800 focus:border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                id="albumName"
                placeholder={tForms("enterName")}
                value={albumName}
                onChange={(e) => setAlbumName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-zinc-200">
                <Label htmlFor="artistName">Artist Name</Label>
              </Label>
              <Input
                className="bg-zinc-800/50 border-zinc-800 focus:border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                id="artistName"
                placeholder={tForms("enterArtistName")}
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-zinc-200">
                <Label htmlFor="description">Description</Label>
              </Label>
              <Textarea
                className="bg-zinc-800/50 border-zinc-800 focus:border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                id="description"
                placeholder={tForms("brieflyDescribe")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-zinc-200">
                <Label htmlFor="musicGenre">Music Genre</Label>
              </Label>
              <Select value={musicGenre} onValueChange={setMusicGenre}>
                <SelectTrigger
                  className="bg-zinc-800/50 border-zinc-800 text-zinc-100 focus:ring-0 focus:ring-offset-0 focus:border-zinc-700"
                  id="musicGenre"
                >
                  <SelectValue placeholder={tForms("selectAGenre")} />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem
                    value="rock"
                    className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100"
                  >
                    Rock
                  </SelectItem>
                  <SelectItem value="cumbia">Cumbia</SelectItem>
                  <SelectItem value="chamame">Chamamé</SelectItem>
                  <SelectItem value="cuarteto">Cuarteto</SelectItem>
                  <SelectItem value="pop">Pop</SelectItem>
                  <SelectItem value="jazz">Jazz</SelectItem>
                  <SelectItem value="classical">Classical</SelectItem>
                  <SelectItem value="hiphop">Hip Hop</SelectItem>
                  <SelectItem value="electronic">Electronic</SelectItem>
                  <SelectItem value="heavy">Heavy Metal</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-zinc-200">
                <Label htmlFor="startDate">Start Mint Date</Label>
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-zinc-800/50 border-zinc-800 focus:border-zinc-700 text-zinc-100 placeholder:text-zinc-500 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50"
              />
            </div>
            {collectionType === "ALBUM" && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-zinc-200">
                  <Label htmlFor="recordLabel">Record Label</Label>
                </Label>
                <Input
                  className="bg-zinc-800/50 border-zinc-800 focus:border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                  id="recordLabel"
                  placeholder={tForms("recordLabel")}
                  value={recordLabel}
                  onChange={(e) => setRecordLabel(e.target.value)}
                />
              </div>
            )}

            {collectionType === "ALBUM" && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-zinc-200">
                  <Label htmlFor="releaseDate">Release Album Date</Label>
                </Label>
                <Input
                  className="bg-zinc-800/50 border-zinc-800 focus:border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                  id="releaseDate"
                  type="date"
                  value={releaseDate}
                  onChange={(e) => setReleaseDate(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-medium text-zinc-200">
                <Label htmlFor="cover" className="text-lg font-semibold">
                  Cover Image
                </Label>
              </Label>
              <div className="flex w-full">
                <label
                  htmlFor="cover"
                  className="relative flex items-center justify-center w-full h-[480px] max-w-[270px] border-2 border-dashed rounded-lg cursor-pointer bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800/70 transition-all overflow-hidden"
                >
                  {/* Si no hay imagen, muestra los textos y el icono */}
                  {!coverImage && (
                    <div className="flex flex-col items-center justify-center w-full h-full pt-5 pb-6 z-0">
                      <Upload className="w-8 h-8 mb-4 text-zinc-400" />
                      <p className="mb-2 text-sm text-zinc-400">
                        <span className="font-semibold">Click to upload</span>
                      </p>
                      <p className="text-xs text-zinc-500">
                        PNG or JPG (MAX. 1080 x 1920px)
                      </p>
                    </div>
                  )}

                  {/* Si hay imagen, muestra el preview */}
                  {coverImage && (
                    <img
                      src={coverFile}
                      alt="Cover preview"
                      className="absolute inset-0 w-full h-full object-contain z-10"
                    />
                  )}

                  {/* Input permanece funcional e invisible */}
                  <Input
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    id="cover"
                    type="file"
                    accept="image/*"
                    name="cover"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
