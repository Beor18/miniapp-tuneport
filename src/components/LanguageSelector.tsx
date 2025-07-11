"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { locales } from "../i18n/config";
import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@Src/ui/components/ui/select";
import { Globe } from "lucide-react";

export default function LanguageSelector() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = (newLocale: string) => {
    if (newLocale === locale) return;

    startTransition(() => {
      const pathWithoutLocale = pathname.replace(/^\/(en|es|pt)/, "");
      const newPath = `/${newLocale}${pathWithoutLocale}`;
      const searchString = searchParams.toString();
      const finalPath = searchString ? `${newPath}?${searchString}` : newPath;

      // Use shallow routing to avoid full page reload
      router.push(finalPath, { scroll: false });
    });
  };

  const languageNames = {
    en: "EN",
    es: "ES",
    //pt: "PT",
  };

  const languageNamesLong = {
    en: "English",
    es: "Español",
    //pt: "Português",
  };

  return (
    <Select
      value={locale}
      onValueChange={handleLocaleChange}
      disabled={isPending}
    >
      <SelectTrigger className="w-auto min-w-[70px] sm:min-w-[80px] h-9 border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-200 text-xs sm:text-sm focus:ring-zinc-600 transition-colors">
        <div className="flex items-center gap-1.5">
          <Globe className="h-3 w-3 sm:h-4 sm:w-4 text-zinc-400" />
          <span className="hidden sm:inline">
            {languageNames[locale as keyof typeof languageNames]}
          </span>
          <span className="sm:hidden text-[10px]">
            {languageNames[locale as keyof typeof languageNames]}
          </span>
        </div>
      </SelectTrigger>
      <SelectContent className="bg-zinc-800 border-zinc-700 min-w-[120px]">
        {locales.map((loc) => (
          <SelectItem
            key={loc}
            value={loc}
            className="text-zinc-200 focus:bg-zinc-700 focus:text-white cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">
                {languageNames[loc as keyof typeof languageNames]}
              </span>
              <span className="text-xs text-zinc-400">
                {languageNamesLong[loc as keyof typeof languageNamesLong]}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
