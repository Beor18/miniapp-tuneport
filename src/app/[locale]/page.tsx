import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tuneport",
  description:
    "The new meeting point between musicians, artists, community with history, value and ownership. Music streaming.",
  openGraph: {
    images: ["https://app.tuneport.xyz/preview.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tuneport",
    description:
      "The new meeting point between musicians, artists, community with history, value and ownership. Music streaming.",
    siteId: "1467726470533754880",
    creator: "Tuneport",
    creatorId: "1467726470533754880",
    images: ["https://app.tuneport.xyz/preview.png"],
  },
};

export default function Page({ params }: { params: { locale: string } }) {
  // Redirigir directamente a foryou
  redirect(`/${params.locale}/foryou`);
}
