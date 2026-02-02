"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import en from "@/locales/en.json";
import th from "@/locales/th.json";

type Language = "en" | "th";

type TranslationValue = string | { [key: string]: TranslationValue };

// Define the shape of the translation object based on en.json
type TranslationObject = typeof en;

// Define the hybrid type: Callable function AND Translation Object properties
export type Translator = ((key: string) => string) & TranslationObject;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translator;
  timeFormat: string;
  dateFormat: string;
}

const translations: Record<Language, TranslationObject> = {
  en: en,
  th: th as unknown as TranslationObject,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load saved language from localStorage
    const savedLanguage = localStorage.getItem("language") as Language | null;
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "th")) {
      setLanguageState(savedLanguage);
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  const timeFormat = language === "th" ? "th-TH" : "en-US";
  const dateFormat = language === "th" ? "th-TH" : "en-US";

  const tFunc = (key: string): string => {
    const keys = key.split(".");
    let value: any = translations[language];

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k as keyof typeof value];
      } else {
        return key; // Return key if translation not found
      }
    }

    return typeof value === "string" ? value : key;
  };

  // Create a hybrid object that is both a function and contains translation properties
  const t = Object.assign(tFunc, translations[language]) as Translator;

  // if (!mounted) return <>{children}</>;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, timeFormat, dateFormat }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
