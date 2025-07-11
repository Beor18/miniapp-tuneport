import Link from "next/link";
import { Button } from "@Src/ui/components/ui/button";
import { HomeIcon } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col content-center items-center justify-center mx-auto h-full text-white p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <h2 className="text-3xl font-semibold mb-4">Page Not Found</h2>
        <p className="text-xl mb-8">
          Oops! The page youre looking for doesnt exist.
        </p>
        <Link href="/explore" passHref>
          <Button className="bg-primary hover:bg-primary/90 text-white font-bold py-2 px-4 rounded-full transition duration-300 ease-in-out transform hover:scale-105">
            <HomeIcon className="w-5 h-5 mr-2" />
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
