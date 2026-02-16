"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Navbar } from "@/components/user/navbar";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
        <div className="mb-8 p-6 bg-muted/30 rounded-full">
          <FileQuestion className="h-24 w-24 text-muted-foreground/50" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">
          404
        </h1>
        <h2 className="text-2xl font-semibold text-foreground mb-4">
          {t("notFound.title")}
        </h2>
        <p className="text-muted-foreground max-w-125 mb-8 text-lg">
          {t("notFound.description")}
        </p>
        <Link href="/">
          <Button size="lg" className="gap-2">
            <Home className="h-4 w-4" />
            {t("notFound.backHome")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
