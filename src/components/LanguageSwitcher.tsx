"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "th" : "en");
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className={cn("h-9 px-3 gap-2 min-w-[4.5rem] border-muted-foreground/20 hover:border-primary/50 hover:text-primary transition-all", className)}
    >
      <Globe className="h-4 w-4" />
      <span className="text-sm font-bold uppercase tracking-wider">{language === 'en' ? 'EN' : 'TH'}</span>
      <span className="sr-only">Switch language</span>
    </Button>
  );
}
