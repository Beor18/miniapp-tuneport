"use client";

import { ChangeEvent, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@Src/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@Src/ui/components/ui/dialog";
import { useTranslations, useLocale } from "next-intl";
// import FileUpload from "@Src/app/components/FileUpload";
// import AlbumForm from "@Src/app/components/AlbumForm";

const AsideNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const tNav = useTranslations("navigation");
  const locale = useLocale();

  return (
    <aside className="w-64 flex-shrink-0 bg-gray-100 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.3)] p-4 h-full">
      <div className="flex items-center justify-between mb-6">
        <Link href={`/${locale}`}>
          <Image width={50} height={50} src="/logo.svg" alt="" />
        </Link>
      </div>
      <nav className="flex flex-col gap-4 mt-12">
        <Link
          className="flex items-center space-x-2 text-gray-700 text-xl font-bold"
          href={`/${locale}`}
        >
          <HomeIcon className="h-6 w-6" />
          <span>{tNav("home")}</span>
        </Link>
        <Link
          className="flex items-center space-x-2 text-gray-700  text-xl font-bold"
          href={`/${locale}/albums`}
        >
          <TrendingUpIcon className="h-6 w-6" />
          <span>{tNav("albums")}</span>
        </Link>
        <Link
          className="flex items-center space-x-2 text-gray-700  text-xl font-bold"
          href={`/${locale}/u`}
        >
          <UserIcon className="h-6 w-6" />
          <span>{tNav("profile")}</span>
        </Link>
      </nav>
    </aside>
  );
};

function HomeIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function UserIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function SearchIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function TrendingUpIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

export default AsideNavbar;
