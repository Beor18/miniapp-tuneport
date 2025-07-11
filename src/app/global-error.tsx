"use client";

import Link from "next/link";
import { Button } from "@Src/ui/components/ui/button";
import { HomeIcon } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col content-center items-center justify-center mx-auto h-full text-white p-4">
      <h2>Something went wrong! - {error.message}</h2>
      <Link href="/" passHref>
        <Button className="bg-primary hover:bg-primary/90 text-white font-bold py-2 px-4 rounded-full transition duration-300 ease-in-out transform hover:scale-105">
          <HomeIcon className="w-5 h-5 mr-2" />
          Return Home
        </Button>
      </Link>
    </div>
  );
}
