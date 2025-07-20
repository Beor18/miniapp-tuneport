import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tuneport",
  description:
    "Where every second of music becomes value. Platform music in web3",
  openGraph: {
    images: ["https://miniapp.tuneport.xyz/preview.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tuneport",
    description:
      "Where every second of music becomes value. Platform music in web3",
    siteId: "1467726470533754880",
    creator: "Tuneport",
    creatorId: "1467726470533754880",
    images: ["https://miniapp.tuneport.xyz/preview.png"],
  },
};

export default function Page({ params }: { params: { locale: string } }) {
  // Redirigir directamente a foryou
  redirect(`/${params.locale}/foryou`);
}
