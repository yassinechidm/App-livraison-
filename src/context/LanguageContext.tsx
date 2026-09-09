import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { SupportedLanguage, translations } from "@/src/i18n/translations";

export type LanguageName = "English" | "Français" | "العربية" | "Español" | "Català";

export const LANGUAGE_OPTIONS: { id: LanguageName; code: SupportedLanguage; label: string; sub: string }[] = [
  { id: "English", code: "en", label: "English", sub: "English" },
  { id: "Français", code: "fr", label: "Français", sub: "French" },
  { id: "العربية", code: "ar", label: "العربية", sub: "Arabic" },
  { id: "Español", code: "es", label: "Español", sub: "Spanish" },
  { id: "Català", code: "es", label: "Català", sub: "Catalan" },
];

interface LanguageContextType {
  language: SupportedLanguage;
  selectedLanguageName: LanguageName;
  setLanguage: (lang: LanguageName | SupportedLanguage) => Promise<void>;
  t: (key: string, fallback?: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "fr",
  selectedLanguageName: "Français",
  setLanguage: async () => {},
  t: (k, f) => f || k,
  isRTL: false,
});

const STORAGE_KEY = "app_preferred_language_v1";

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>("fr");
  const [selectedLanguageName, setSelectedLanguageName] = useState<LanguageName>("Français");

  useEffect(() => {
    async function loadSavedLanguage() {
      try {
        let saved: string | null = null;
        if (Platform.OS === "web") {
          if (typeof localStorage !== "undefined") {
            saved = localStorage.getItem(STORAGE_KEY);
          }
        } else {
          saved = await SecureStore.getItemAsync(STORAGE_KEY);
        }

        if (saved) {
          const match = LANGUAGE_OPTIONS.find((opt) => opt.code === saved || opt.id === saved);
          if (match) {
            setLanguageState(match.code);
            setSelectedLanguageName(match.id);
          }
        }
      } catch (err) {
        console.warn("[LanguageProvider] loadSavedLanguage failed:", err);
      }
    }
    loadSavedLanguage();
  }, []);

  const setLanguage = async (val: LanguageName | SupportedLanguage) => {
    const match = LANGUAGE_OPTIONS.find((opt) => opt.id === val || opt.code === val);
    const targetCode: SupportedLanguage = match ? match.code : "fr";
    const targetName: LanguageName = match ? match.id : "Français";

    setLanguageState(targetCode);
    setSelectedLanguageName(targetName);

    try {
      if (Platform.OS === "web") {
        if (typeof localStorage !== "undefined") {
          localStorage.setItem(STORAGE_KEY, targetCode);
        }
      } else {
        await SecureStore.setItemAsync(STORAGE_KEY, targetCode);
      }
    } catch (err) {
      console.warn("[LanguageProvider] saveLanguage failed:", err);
    }
  };

  const t = (key: string, fallback?: string): string => {
    const langDict = translations[language] || translations.fr;
    if (langDict[key]) return langDict[key];
    if (translations.en[key]) return translations.en[key];
    return fallback || key;
  };

  const isRTL = language === "ar";

  return (
    <LanguageContext.Provider
      value={{
        language,
        selectedLanguageName,
        setLanguage,
        t,
        isRTL,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  return useContext(LanguageContext);
}
