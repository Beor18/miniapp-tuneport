import { redirect } from "next/navigation";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useEffect } from "react";

export default function RootPage() {
  // Initialize MiniKit según documentación oficial
  const { setFrameReady, isFrameReady } = useMiniKit();

  useEffect(() => {
    if (!isFrameReady) setFrameReady();
  }, [isFrameReady, setFrameReady]);

  // Redirect to default locale
  redirect("/en");
}
