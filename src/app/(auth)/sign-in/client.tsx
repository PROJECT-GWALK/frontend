"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import Image from "next/image";

type Props = {
  onSignIn: () => void;
};

export default function SignInClient({ onSignIn }: Props) {
  const { t } = useLanguage();

  return (
    <div className="flex items-center justify-center flex-1 py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
        {/* Left Side: Hero */}
        <div className="hidden md:flex flex-col gap-8">
          <div className="flex justify-start">
             <Image 
               src="/gwalk-icon.svg" 
               alt="GWalk Logo" 
               width={140} 
               height={140} 
               className="drop-shadow-xl hover:scale-105 transition-transform duration-300" 
             />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
              {t("auth.heroTitle")}
            </h1>
            <p className="text-xl text-muted-foreground font-light">
              {t("auth.heroSubtitle")}
            </p>
          </div>
        </div>

        {/* Right Side: Sign In Card */}
        <div className="w-full max-w-sm mx-auto">
          {/* Mobile Logo */}
          <div className="md:hidden flex flex-col items-center gap-4 mb-8">
             <Image 
               src="/gwalk-icon.svg" 
               alt="Logo" 
               width={140} 
               height={140} 
               className="drop-shadow-lg"
               priority
             />
             <h1 className="text-3xl font-bold tracking-tight">{t("auth.heroTitle")}</h1>
             <p className="text-muted-foreground text-center">{t("auth.heroSubtitle")}</p>
          </div>

          <Card className="border shadow-lg bg-card">
            <CardHeader className="text-center space-y-2 pb-6">
              <h2 className="text-2xl font-bold tracking-tight">{t("auth.signInTitle")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("auth.signInDesc")}
              </p>
            </CardHeader>
            <CardContent className="grid gap-4">
              <form action={onSignIn}>
                <Button variant="outline" className="w-full h-12 text-base font-medium gap-3 hover:bg-muted transition-all shadow-sm hover:shadow-md" size="lg">
                  <Image src="/google-icon.svg" alt="Google" width={20} height={20} />
                  {t("auth.continueWithGoogle")}
                </Button>
              </form>
            </CardContent>

          </Card>
        </div>
      </div>
    </div>
  );
}
