"use client";

import React, { useState, useEffect } from "react";
import { useAppKitAccount } from "@Src/lib/privy";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@Src/ui/components/ui/dialog";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@Src/ui//components/ui/avatar";
import { Button } from "@Src/ui//components/ui/button";
import WalletConnector from "@Src/components/walletConector";
import Link from "next/link";
import { Music2Icon, VerifiedIcon } from "lucide-react";
import { Skeleton } from "@Src/ui/components/ui/skeleton";
import { Card } from "@Src/ui/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@Src/ui/components/ui/dropdown-menu";

interface User {
  id: string;
  name: string;
  picture?: string;
  nickname: string;
  verified?: boolean;
}

interface ExploreUsersProps {
  users: any[];
}

// Componente Skeleton para un usuario
const UserSkeleton = () => (
  <div className="bg-zinc-900/50 rounded-lg p-3 sm:p-4 h-full">
    <div className="flex flex-col items-center gap-2 sm:gap-3">
      <div className="relative">
        <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-full" />
        <Skeleton className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full" />
      </div>
      <div className="flex flex-col items-center gap-1 w-full">
        <Skeleton className="h-3 sm:h-4 w-16 sm:w-20" />
      </div>
    </div>
  </div>
);

export default function ExploreUsers({ users }: ExploreUsersProps) {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  // Usar nuestro hook de Privy para la detección de wallet
  const { address, isConnected, solanaWalletAddress, evmWalletAddress } =
    useAppKitAccount();

  // Verificar si hay alguna wallet conectada
  const hasWalletConnected =
    isConnected && (!!address || !!solanaWalletAddress || !!evmWalletAddress);

  // Log para depuración
  // console.log("Estado de ExploreUsers:", {
  //   address,
  //   isConnected,
  //   solanaWalletAddress,
  //   evmWalletAddress,
  //   hasWalletConnected,
  // });

  const [isLoading, setIsLoading] = useState(true);
  const [displayUsers, setDisplayUsers] = useState<User[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayUsers(users);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [users]);

  const openDialogOffline = () => {
    if (!hasWalletConnected) {
      setIsWalletModalOpen(true);
      return;
    }
    setIsWalletModalOpen(false);
  };

  // Generar array de skeletons basado en la cantidad esperada de usuarios
  const skeletonCount = users?.length || 12;
  const skeletons = Array(skeletonCount).fill(null);

  return (
    <section className="w-full max-w-8xl py-4">
      <h3 className="text-xl uppercase font-semibold mb-6 text-zinc-100/90">
        Featured Artists
      </h3>
      <div className="relative">
        <div
          className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 mb-8 sm:mb-14 scroll-smooth"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {isLoading
            ? skeletons.map((_, index) => (
                <div
                  key={index}
                  className="w-32 sm:w-40 flex-shrink-0 first:ml-0"
                >
                  <UserSkeleton />
                </div>
              ))
            : displayUsers.map((user: User) => (
                <div
                  key={user.id}
                  className="w-32 sm:w-40 flex-shrink-0 first:ml-0"
                >
                  <Link
                    href={`/u/${user.nickname}`}
                    className="group relative bg-zinc-900/50 rounded-lg p-3 sm:p-4 transition-all duration-300 hover:bg-zinc-900/80 hover:-translate-y-1 block h-full"
                  >
                    <div className="flex flex-col items-center gap-2 sm:gap-3">
                      <div className="relative">
                        <Avatar className="w-16 h-16 sm:w-20 sm:h-20 ring-2 ring-zinc-800/80 group-hover:ring-zinc-700 transition-all duration-300">
                          <AvatarImage
                            src={
                              user.picture ||
                              `https://avatar.iran.liara.run/username?username=${user.name}`
                            }
                            alt={user.name}
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-zinc-800 text-zinc-400 text-xs sm:text-sm">
                            {user.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {user.verified && (
                          <div className="absolute -bottom-1 -right-1 bg-zinc-800 rounded-full p-0.5 sm:p-1 ring-2 ring-zinc-900">
                            <VerifiedIcon className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-center gap-1 min-w-0 w-full">
                        <h4 className="font-medium text-zinc-100 text-xs sm:text-sm text-center truncate w-full group-hover:text-white transition-colors">
                          {user.name}
                        </h4>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
        </div>

        {/* Gradiente para indicar que se puede deslizar */}
        <div className="absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-neutral-800 to-transparent pointer-events-none opacity-60"></div>
      </div>

      <Dialog open={isWalletModalOpen} onOpenChange={setIsWalletModalOpen}>
        <DialogContent className="bg-zinc-900 border border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-zinc-100">
              Connect to Start
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              You need to connect your wallet to play music or claim rewards.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-zinc-900/50 p-4 rounded-lg">
            <WalletConnector />
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
