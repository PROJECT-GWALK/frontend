"use client";

import { AlertCircle, Home, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Navbar } from "@/components/user/navbar";

export default function ErrorPage() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
        <div className="mb-8 p-6 bg-destructive/10 rounded-full">
          <AlertCircle className="h-24 w-24 text-destructive" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">
          {t("auth.errorTitle")}
        </h1>
        <h2 className="text-2xl font-semibold text-foreground mb-4">
           {t("auth.authFailed")}
        </h2>
        <p className="text-muted-foreground max-w-[500px] mb-8 text-lg">
          {t("auth.errorMessage")}
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button size="lg" onClick={() => router.back()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {t("auth.tryAgain")}
          </Button>
          <Link href="/">
            <Button size="lg" variant="outline" className="gap-2">
              <Home className="h-4 w-4" />
              {t("auth.backHome")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
