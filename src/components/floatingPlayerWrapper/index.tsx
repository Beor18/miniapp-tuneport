"use client";

import React, { Suspense, useLayoutEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useContext } from "react";
import { UserRegistrationContext } from "@Src/app/providers";
import WalletConnector from "@Src/components/walletConector";
import { useWallet } from "@solana/wallet-adapter-react";

const FloatingPlayer = dynamic(() => import("@Src/components/FloatingPlayer"), {
  ssr: true,
});

const FloatingPlayerWrapper = () => {
  const { isRegistered } = useContext(UserRegistrationContext);
  const [mounted, setMounted] = useState(false);
  const wallet = useWallet();

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // No mostrar nada si no sabemos el estado aún
  if (isRegistered === null) {
    return null;
  }

  if (!wallet.publicKey || !isRegistered) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-primary text-white p-4 flex items-center justify-between">
        <p className="text-lg font-semibold">Connect to start listening</p>
        <WalletConnector />
      </div>
    );
  }

  return (
    <Suspense fallback={<div>Loading Player...</div>}>
      <FloatingPlayer />
    </Suspense>
  );
};

export default function FloatingWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div id="floating-player-wrapper">
      {children}
      <FloatingPlayerWrapper />
    </div>
  );
}
