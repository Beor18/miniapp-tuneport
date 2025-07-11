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
import { Upload, Music, MusicIcon, Disc3, Users2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@Src/ui/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@Src/ui/components/ui/card";
import { useTranslations } from "next-intl";

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
  // Translation hooks
  const tNft = useTranslations("nft");
  const tCommon = useTranslations("common");
  const tForms = useTranslations("forms");

  return (
    <div className="space-y-4">
      <Alert className="max-w-md mx-auto bg-indigo-900/20 border border-indigo-900/30">
        <AlertTitle className="text-lg font-semibold text-indigo-200 mb-2">
          NFT Multi-Token (ERC-1155)
        </AlertTitle>
        <AlertDescription className="text-indigo-100/80">
          <p className="mb-3">
            Crea una colección de música donde puedes emitir múltiples copias de
            cada track y controlar su disponibilidad.
          </p>
          <a
            href="https://faucet.solana.com/"
            className="inline-flex items-center text-indigo-200 hover:text-indigo-100 underline transition-colors font-medium"
            target="_blank"
          >
            Obtener SOL para pruebas
          </a>
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        <Label
          htmlFor="collectionType"
          className="text-lg font-semibold text-zinc-100"
        >
          {tNft("typeCollection")}
        </Label>
        <RadioGroup
          id="collectionType"
          value={collectionType}
          onValueChange={setCollectionType}
          className="space-y-4"
        >
          <Card className="bg-gradient-to-br from-zinc-800/80 to-zinc-900/90 border-zinc-800 hover:bg-zinc-800/70 hover:shadow-md hover:shadow-purple-900/5 transition-all">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="ALBUM"
                  id="ALBUM"
                  className="border-indigo-500 text-white data-[state=checked]:bg-indigo-600 data-[state=checked]:text-white"
                />
                <CardTitle>
                  <Label
                    htmlFor="ALBUM"
                    className="text-lg cursor-pointer text-zinc-100 flex items-center"
                  >
                    <Disc3 className="mr-2 h-5 w-5 text-indigo-400" />
                    ÁLBUM
                  </Label>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-zinc-400">
                <p className="font-medium">{tNft("cohesiveCollection")}</p>
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-zinc-800/80 to-zinc-900/90 border-zinc-800 hover:bg-zinc-800/70 hover:shadow-md hover:shadow-purple-900/5 transition-all">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="DROP"
                  id="DROP"
                  className="border-indigo-500 text-white data-[state=checked]:bg-indigo-600 data-[state=checked]:text-white"
                />
                <CardTitle>
                  <Label
                    htmlFor="DROP"
                    className="text-lg cursor-pointer text-zinc-100 flex items-center"
                  >
                    <Users2 className="mr-2 h-5 w-5 text-indigo-400" />
                    {tNft("collectiveDrop")}
                  </Label>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-zinc-400">
                <p className="font-medium">{tNft("collaborativeCollection")}</p>
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-zinc-800/80 to-zinc-900/90 border-zinc-800 hover:bg-zinc-800/70 hover:shadow-md hover:shadow-purple-900/5 transition-all">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="SINGLE"
                  id="SINGLE"
                  className="border-indigo-500 text-white data-[state=checked]:bg-indigo-600 data-[state=checked]:text-white"
                />
                <CardTitle>
                  <Label
                    htmlFor="SINGLE"
                    className="text-lg cursor-pointer text-zinc-100 flex items-center"
                  >
                    <MusicIcon className="mr-2 h-5 w-5 text-indigo-400" />
                    SINGLE
                  </Label>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-zinc-400">
                <p className="font-medium">{tNft("singleStandout")}</p>
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
                  <Label htmlFor="albumName">{tNft("albumName")}</Label>
                )}
                {collectionType === "SINGLE" && (
                  <Label htmlFor="albumName">{tNft("singleName")}</Label>
                )}
                {collectionType === "DROP" && (
                  <Label htmlFor="albumName">{tNft("releaseName")}</Label>
                )}
              </Label>
              <Input
                className="bg-zinc-800/50 border-zinc-700 focus:border-indigo-600 text-zinc-100 placeholder:text-zinc-500"
                id="albumName"
                placeholder={tForms("enterName")}
                value={albumName}
                onChange={(e) => setAlbumName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-zinc-200">
                <Label htmlFor="artistName">{tNft("artistName")}</Label>
              </Label>
              <Input
                className="bg-zinc-800/50 border-zinc-700 focus:border-indigo-600 text-zinc-100 placeholder:text-zinc-500"
                id="artistName"
                placeholder={tForms("enterArtistName")}
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-zinc-200">
                <Label htmlFor="description">Descripción</Label>
              </Label>
              <Textarea
                className="bg-zinc-800/50 border-zinc-700 focus:border-indigo-600 text-zinc-100 placeholder:text-zinc-500 min-h-[100px]"
                id="description"
                placeholder={tForms("brieflyDescribe")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-zinc-200">
                <Label htmlFor="musicGenre">{tForms("musicGenre")}</Label>
              </Label>
              <Select value={musicGenre} onValueChange={setMusicGenre}>
                <SelectTrigger
                  className="bg-zinc-800/50 border-zinc-700 text-zinc-100 focus:ring-0 focus:ring-offset-0 focus:border-indigo-600"
                  id="musicGenre"
                >
                  <SelectValue placeholder={tForms("selectGenre")} />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem
                    value="rock"
                    className="text-zinc-100 focus:bg-indigo-900/50 focus:text-zinc-100"
                  >
                    Rock
                  </SelectItem>
                  <SelectItem
                    value="cumbia"
                    className="text-zinc-100 focus:bg-indigo-900/50 focus:text-zinc-100"
                  >
                    Cumbia
                  </SelectItem>
                  <SelectItem
                    value="chamame"
                    className="text-zinc-100 focus:bg-indigo-900/50 focus:text-zinc-100"
                  >
                    Chamamé
                  </SelectItem>
                  <SelectItem
                    value="cuarteto"
                    className="text-zinc-100 focus:bg-indigo-900/50 focus:text-zinc-100"
                  >
                    Cuarteto
                  </SelectItem>
                  <SelectItem
                    value="pop"
                    className="text-zinc-100 focus:bg-indigo-900/50 focus:text-zinc-100"
                  >
                    Pop
                  </SelectItem>
                  <SelectItem
                    value="jazz"
                    className="text-zinc-100 focus:bg-indigo-900/50 focus:text-zinc-100"
                  >
                    Jazz
                  </SelectItem>
                  <SelectItem
                    value="classical"
                    className="text-zinc-100 focus:bg-indigo-900/50 focus:text-zinc-100"
                  >
                    Clásica
                  </SelectItem>
                  <SelectItem
                    value="hiphop"
                    className="text-zinc-100 focus:bg-indigo-900/50 focus:text-zinc-100"
                  >
                    Hip Hop
                  </SelectItem>
                  <SelectItem
                    value="electronic"
                    className="text-zinc-100 focus:bg-indigo-900/50 focus:text-zinc-100"
                  >
                    Electrónica
                  </SelectItem>
                  <SelectItem
                    value="heavy"
                    className="text-zinc-100 focus:bg-indigo-900/50 focus:text-zinc-100"
                  >
                    Heavy Metal
                  </SelectItem>
                  <SelectItem
                    value="other"
                    className="text-zinc-100 focus:bg-indigo-900/50 focus:text-zinc-100"
                  >
                    Otro
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-zinc-200">
                <Label htmlFor="startDate">{tNft("startSaleDate")}</Label>
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-zinc-800/50 border-zinc-700 focus:border-indigo-600 text-zinc-100 placeholder:text-zinc-500 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50"
              />
            </div>
            {collectionType === "ALBUM" && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-zinc-200">
                  <Label htmlFor="recordLabel">{tNft("recordLabel")}</Label>
                </Label>
                <Input
                  className="bg-zinc-800/50 border-zinc-700 focus:border-indigo-600 text-zinc-100 placeholder:text-zinc-500"
                  id="recordLabel"
                  placeholder={tForms("enterRecordLabel")}
                  value={recordLabel}
                  onChange={(e) => setRecordLabel(e.target.value)}
                />
              </div>
            )}

            {collectionType === "ALBUM" && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-zinc-200">
                  <Label htmlFor="releaseDate">
                    {tNft("releaseAlbumDate")}
                  </Label>
                </Label>
                <Input
                  className="bg-zinc-800/50 border-zinc-700 focus:border-indigo-600 text-zinc-100 placeholder:text-zinc-500 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50"
                  id="releaseDate"
                  type="date"
                  value={releaseDate}
                  onChange={(e) => setReleaseDate(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2 pt-2">
              <Label className="text-sm font-medium text-zinc-200">
                <Label htmlFor="cover">{tNft("coverImage")}</Label>
              </Label>
              <div className="flex w-full">
                <label
                  htmlFor="cover"
                  className="relative flex items-center justify-center w-full h-[320px] max-w-[270px] mx-auto border-2 border-dashed rounded-lg cursor-pointer bg-zinc-800/50 border-indigo-800/50 hover:bg-zinc-800/70 hover:border-indigo-600/50 transition-all overflow-hidden group"
                >
                  {/* Si no hay imagen, muestra los textos y el icono */}
                  {!coverImage && (
                    <div className="flex flex-col items-center justify-center w-full h-full pt-5 pb-6 z-0">
                      <Upload className="w-12 h-12 mb-4 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                      <p className="mb-2 text-sm text-indigo-400 group-hover:text-indigo-300 transition-colors">
                        <span className="font-semibold">
                          Haz clic para subir
                        </span>
                      </p>
                      <p className="text-xs text-zinc-500">
                        PNG o JPG (MAX. 1080 x 1920px)
                      </p>
                    </div>
                  )}

                  {/* Si hay imagen, muestra el preview */}
                  {coverImage && (
                    <div className="absolute inset-0 w-full h-full overflow-hidden">
                      <img
                        src={coverFile}
                        alt="Cover preview"
                        className="w-full h-full object-cover z-10"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/70 to-transparent"></div>
                      <div className="absolute bottom-0 left-0 right-0 p-3 text-sm font-medium text-zinc-100 flex justify-center">
                        Cambiar imagen
                      </div>
                    </div>
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
