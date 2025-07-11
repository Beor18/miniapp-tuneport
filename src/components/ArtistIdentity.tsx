/* eslint-disable @next/next/no-img-element */
"use client";

import { Button } from "@Src/ui/components/ui/button";
import { Card, CardContent, CardFooter } from "@Src/ui/components/ui/card";
import Link from "next/link";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useToast } from "@Src/ui/components/ui/use-toast";
import RegisterFanModal from "./RegisterFanModal";
import RegisterArtistModalTest from "./RegisterArtistModalTest";
import WrapPlayer from "./WrapPlayer";

import { BarChart, DollarSign, Music, PlayIcon, Store } from "lucide-react";
import CarrouselHome from "./CarrouselHome";
import CardMusicFullHome from "./cardMusicFullHome";

const ArtistIdentity = () => {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState({
    name: "",
    mainType: "",
    avatar: "",
  });

  const [profileFans, setProfileFan] = useState({
    name: "",
    mainType: "",
    avatar: "",
  });

  const [isOpenRegister, setIsOpenRegister] = useState(false);
  const [isOpenRegisterFan, setIsOpenRegisterFan] = useState(false);
  const [openPlayer, setOpenPlayer] = useState(false);
  const [playMusic, setPlayMusic] = useState(false);

  const [activeTab, setActiveTab] = useState("overview");

  const { toast } = useToast();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-gray-800 via-gray-900 to-black text-white">
        <span className="text-2xl font-semibold">Loading...</span>
      </div>
    );
  }

  const RegisterButtons = () => {
    if (profile.name && !profileFans.name)
      return (
        <div className="flex flex-col items-center space-y-2">
          <div className="flex flex-col items-center space-y-6 bg-gray-700 text-white w-full p-12 m-0">
            <h2 className="text-2xl font-semibold text-white text-center">
              Welcome <br /> Are you an artist or a fan?
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
          </div>

          {/* <CarrouselHome /> */}

          <div className="container mx-auto px-4 py-8">
            <h2 className="text-2xl font-bold mb-4">Listen Free</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Card className="bg-white overflow-hidden">
                <Link href="/artid/album/reise">
                  <div className="aspect-square">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/en/thumb/a/ab/Rammstein_-_Zeit.png/220px-Rammstein_-_Zeit.png"
                      alt="Album cover"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </Link>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Zeit</h3>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="bg-black text-white rounded-full h-8 w-8"
                    >
                      <PlayIcon
                        className="h-4 w-4"
                        onClick={() => setOpenPlayer((prevState) => !prevState)}
                      />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">Rammstein</p>
                </CardContent>
              </Card>

              <Card className="bg-white overflow-hidden">
                <Link href="/artid/album/reise">
                  <div className="aspect-square">
                    <img
                      src="https://i.scdn.co/image/ab67616d00001e02796b8d54fefa1e49832ff7c6"
                      alt="Album cover"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </Link>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Fall In Line</h3>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="bg-black text-white rounded-full h-8 w-8"
                    >
                      <PlayIcon
                        className="h-4 w-4"
                        onClick={() => setOpenPlayer((prevState) => !prevState)}
                      />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">Mushroomhead</p>
                </CardContent>
              </Card>
            </div>
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
              router.push("/artid/profile");
            }}
          />

          <RegisterArtistModalTest
            open={isOpenRegister}
            onClose={() => setIsOpenRegister(false)}
            title="Register Artist with Allfeat"
            buttonText="Register"
            onSuccess={(ArtistData: any) => {
              toast({
                title: "Registration Artist Successful",
                description: "Your profile has been created successfully.",
              });
              setProfile(ArtistData);
              setIsOpenRegister(false);
              router.push("/artid/profile");
            }}
          />
        </div>
      );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <RegisterButtons />

        <div className="w-full">
          <CardMusicFullHome
            onClick={() => {
              setOpenPlayer((prevState) => !prevState);
              setPlayMusic(true);
            }}
          />
        </div>
      </main>

      <div className="w-full sticky bottom-16 left-0 right-0 mx-auto">
        <WrapPlayer
          mockShowPlayer={openPlayer}
          play={playMusic}
          url={
            "https://bafybeiddgtkbf3gs5vk3nwvdozqtyupw3rm6eve3rggumoie55x3ltuzny.ipfs.nftstorage.link/39f0dfd5-2c5d-45ee-ae8d-15eb3b55f6c7.mpd"
          }
        />
      </div>
    </div>
  );
};

export default ArtistIdentity;
