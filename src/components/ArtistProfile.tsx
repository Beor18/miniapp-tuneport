/* eslint-disable @next/next/no-img-element */
import { useAccount } from "wagmi";
import useArtistProfile from "@Src/lib/hooks/useArtistProfile";
import { TruncatedAddress } from "@Src/lib/truncatedAddress";
import { Button } from "@Src/ui/components/ui/button";
import { PlusIcon } from "lucide-react";
import { Separator } from "@Src/ui/components/ui/separator";
import { Card, CardContent, CardFooter } from "@Src/ui/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@Src/ui/components/ui/avatar";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@Src/ui/components/ui/dialog";
// import RegisterModal from "@Src/components/RegisterModal";
import { useToast } from "@Src/ui/components/ui/use-toast";
import RegisterFanModal from "./RegisterFanModal";

const ArtistProfile = () => {
  const { address } = useAccount();

  const [isOpen, setIsOpen] = useState(false);
  const [isOpenRegister, setIsOpenRegister] = useState(false);
  const [isOpenRegisterFan, setIsOpenRegisterFan] = useState(false);

  const { profile, loading, error } = useArtistProfile(address);

  const [profileFans, setProfileFan] = useState({
    name: "",
    mainType: "",
    avatar: "",
  });

  const { toast } = useToast();

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  if (!profile && !profileFans.name)
    return (
      <div className="flex flex-col items-center mt-12 space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Are you an artist or a fan?
        </h2>
        <div className="flex space-x-4">
          <Button
            className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-all duration-200"
            onClick={() => setIsOpenRegister(true)}
          >
            + Register Artist
          </Button>
          <Button
            className="bg-gray-300 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-400 transition-all duration-200"
            onClick={() => setIsOpenRegisterFan(true)}
          >
            + Create Fan User
          </Button>
        </div>

        <RegisterFanModal
          open={isOpenRegisterFan}
          onClose={() => setIsOpenRegisterFan(false)}
          title="Register Fan"
          buttonText="Register Fan"
          onSuccess={(fanData: any) => {
            toast({
              title: "Registration Fan Successful",
              description: "Your fan profile has been created successfully.",
            });
            setProfileFan(fanData);
            setIsOpenRegisterFan(false);
          }}
        />

        {/* <RegisterModal
          open={isOpenRegister}
          onClose={() => setIsOpenRegister(false)}
          buttonText="Register"
          title="Register Artist with Allfeat"
          onSuccess={() => {
            toast({
              title: "Registration Successful",
              description: "You have been registered as an artist.",
            });
            setIsOpenRegister(false);
          }}
        /> */}
      </div>
    );

  const decodeBytes32String = (bytes32: string) => {
    try {
      const buffer = Buffer.from(bytes32.slice(2), "hex");
      return buffer.toString("utf8").replace(/\0/g, "");
    } catch (err) {
      console.error("Failed to decode bytes32 string:", err);
      return "N/A";
    }
  };

  // const mainType = profile.mainType || "N/A";
  // const extraTypes = Array.isArray(profile.extraTypes)
  //   ? profile.extraTypes.join(", ")
  //   : "N/A";

  // const genres = Array.isArray(profile.genres)
  //   ? profile.genres
  //       .map((g: any) => {
  //         const genreKey = Object.keys(g)[0];
  //         const genreValue = g[genreKey];
  //         return `${genreValue}`;
  //       })
  //       .join(", ")
  //   : "N/A";

  // const description = profile.description
  //   ? decodeBytes32String(profile.description)
  //   : "N/A";

  // const assets = Array.isArray(profile.assets)
  //   ? profile.assets.map((a: any) => decodeBytes32String(a)).join(", ")
  //   : "N/A";

  // Mock data of albums
  const albums = [
    {
      id: 1,
      title: "Zeit",
      artist: "Rammstein",
      release_year: 2021,
      genre: "Metal Industrial",
      tracks: 14,
      cover_url:
        "https://upload.wikimedia.org/wikipedia/en/thumb/a/ab/Rammstein_-_Zeit.png/220px-Rammstein_-_Zeit.png",
    },
    {
      id: 2,
      title: "Zunge",
      artist: "Till Lindemann",
      release_year: 1991,
      genre: "Grunge",
      tracks: 12,
      cover_url:
        "https://upload.wikimedia.org/wikipedia/en/c/c8/Till_Lindemann_-_Zunge.png",
    },
    {
      id: 3,
      title: "Reise, Reise",
      artist: "Rammstein",
      release_year: 2006,
      genre: "Soul",
      tracks: 11,
      cover_url:
        "https://upload.wikimedia.org/wikipedia/de/thumb/3/35/Reise%2C_Reise_Cover.jpg/600px-Reise%2C_Reise_Cover.jpg?20101226013919",
    },
    {
      id: 4,
      title: "The Wall",
      artist: "Pink Floyd",
      release_year: 1979,
      genre: "Rock",
      tracks: 26,
      cover_url:
        "https://fastly.picsum.photos/id/109/300/300.jpg?hmac=7ntctVizqmRPyNYayjOky-xhCVvY6Kl_Zm2s1W7MkvM",
    },
    {
      id: 5,
      title: "Thriller",
      artist: "Michael Jackson",
      release_year: 1982,
      genre: "Pop",
      tracks: 9,
      cover_url:
        "https://fastly.picsum.photos/id/567/300/300.jpg?hmac=tncgsBBzbksgVxAhnf2FWR2pRUAzebQ3XQT0dUmrctQ",
    },
  ];

  if (profileFans.name) {
    // console.log("profileFans: ", profileFans);
    return (
      <div className="flex flex-col items-center mt-12 space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="w-[100px] h-[100px]">
            <AvatarImage
              src={profileFans?.avatar || "https://via.placeholder.com/100"}
              alt="Avatar"
              className="rounded-full w-full h-auto object-cover"
            />
            <AvatarFallback>FU</AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-semibold text-gray-800">
            Welcome, {profileFans?.name || "User"}!
          </h2>
          <p className="text-lg text-gray-700">{profileFans.mainType}</p>
        </div>
      </div>
    );
  }

  return (
    <section className="flex-1 overflow-y-auto max-h-[86vh]">
      <div className="bg-card p-4 md:p-6 lg:p-8">
        {/* <div className="flex items-center justify-between">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">Total Balance</p>
          <p className="text-3xl font-bold">$12,345.67</p>
        </div>
        <Button variant="outline" size="sm" className="hidden sm:flex">
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Funds
        </Button>
      </div> */}
        <div
          className="relative rounded flex items-center justify-center text-white"
          style={{
            background: `linear-gradient(180deg, #20131368 0%, #20131368 100%), url('/dua.jpg') no-repeat top center / cover`,
            width: "100%",
            height: "400px",
          }}
        >
          <div className="flex flex-col items-center justify-center gap-4">
            <Avatar className="w-[100px] h-[100px]">
              <AvatarImage
                src="https://cdn-ijfed.nitrocdn.com/DtYdoFkTGLHFYfuSCOprrunYCajuUVPb/assets/images/optimized/rev-9454958/mariskalrock.com/wp-content/uploads/2021/05/till-lindemann-beloved-town-2021.jpg"
                alt="Avatar"
                className="rounded-full w-full h-auto object-cover"
              />
              <AvatarFallback>TL</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex flex-row gap-1 items-center">
                <p className="text-md font-medium">Till Lindemann</p>
                <CheckVerificationIcon width="32" height="32" />
              </div>
              <p className="text-xs text-center text-white">Singer</p>
            </div>
          </div>
        </div>

        {/* <Separator className="my-4" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Recent Albums</p>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img
                    className="w-12 h-12 rounded"
                    src="https://www.brixtonrecords.com/denda/img/p/4/9/5/0/4950.jpg"
                    alt="Avatar"
                  />
                  <div>
                    <p className="text-sm font-medium">Rosenrot</p>
                    <p className="text-xs text-muted-foreground">Rammstein</p>
                  </div>
                </div>
                <p className="text-sm font-medium">+$500.00</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img
                    className="w-12 h-12 rounded"
                    src="https://m.media-amazon.com/images/I/71amuR3FYiL._UF350,350_QL50_.jpg"
                    alt="Avatar"
                  />
                  <div>
                    <p className="text-sm font-medium">F & M</p>
                    <p className="text-xs text-muted-foreground">Lindemann</p>
                  </div>
                </div>
                <p className="text-sm font-medium">-$200.00</p>
              </div>
            </div>
          </div>
        </div> */}
      </div>
      <div className="bg-card p-4 mt-6 md:p-6 lg:p-8">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Manage Albums</p>
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:flex"
            onClick={() => setIsOpen(true)}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Albúm
          </Button>
        </div>
        <Separator className="my-4" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
          {albums.map((album) => (
            <Card key={album.id}>
              <CardContent className="flex items-center justify-between">
                <div className="flex items-center gap-2 mt-4">
                  <img
                    className="w-12 h-12 rounded"
                    src={album.cover_url}
                    alt="Avatar"
                  />

                  <div>
                    <p className="text-sm font-medium">{album.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {album.artist}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-medium">Tracks: {album.tracks}</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full">
                  Manage
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={isOpen}>
        <DialogContent className="h-[650px] overflow-y-scroll">
          <DialogHeader>
            <DialogTitle className="mb-4">Create Albúm</DialogTitle>
            <div>
              <div className="flex flex-wrap justify-end items-end justify-between">
                {/* <AlbumForm setIsOpen={() => setIsOpen(false)} /> */}
              </div>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </section>
  );
};

function CheckVerificationIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" fill="#0000FF" /> {/* Círculo azul */}
      <path d="M9 12l2 2l4-4" stroke="white" /> {/* Check blanco */}
    </svg>
  );
}

export default ArtistProfile;
