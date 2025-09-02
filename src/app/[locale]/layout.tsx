import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales, type Locale } from "../../i18n/config";
import { Inter } from "next/font/google";
import HomeLayout from "@Src/components/home";
import { Toaster } from "sonner";
import MiniKitInitializer from "@Src/components/MiniKitInitializer";

const inter = Inter({ subsets: ["latin"] });

export function generateStaticParams() {
  return locales.map((locale: Locale) => ({ locale }));
}

async function getUser(): Promise<any> {
  try {
    if (
      process.env.NODE_ENV === "production" &&
      process.env.NEXT_PHASE === "build"
    ) {
      return { mock: true };
    }

    const response = await fetch(`${process.env.API_ELEI}/api/users/getUser`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "force-cache",
      // next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error(`Error fetching user data. Status: ${response.status}`);
    }

    const user = await response.json();
    if (!user) {
      return [];
    }

    return user;
  } catch (error) {
    console.error("Error checking user:", error);
    return [];
  }
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  const messages = await getMessages();

  // Obtenemos los datos de usuarios (sin bloquear el render)
  const userData = await getUser();

  return (
    <NextIntlClientProvider messages={messages}>
      <MiniKitInitializer />
      <HomeLayout mockUsers={userData}>{children}</HomeLayout>
      <Toaster richColors position="top-right" expand={false} closeButton />
    </NextIntlClientProvider>
  );
}
