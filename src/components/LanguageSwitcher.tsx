"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { language, setLanguage } = useLanguage();

  const handleLanguageChange = (lang: "en" | "th") => {
    setLanguage(lang);
  };

  const languages = [
    { code: "en", label: "EN" },
    { code: "th", label: "TH" },
  ] as const;

  const currentLang = languages.find(l => l.code === language) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={cn("rounded-full h-9 px-3 gap-1.5 min-w-[4.5rem] justify-between border-muted-foreground/20 hover:border-primary/50 hover:text-primary transition-all", className)}>
          <span className="text-sm font-bold uppercase tracking-wider">{currentLang.label}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/70" />
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[120px] z-[100]">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className="flex items-center justify-between cursor-pointer py-2 rounded-md my-0.5"
          >
            <span className={cn("text-sm font-medium", language === lang.code ? "text-primary" : "text-muted-foreground")}>
              {lang.code === 'en' ? 'English' : 'ภาษาไทย'}
            </span>
            {language === lang.code && <Check className="h-3.5 w-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
