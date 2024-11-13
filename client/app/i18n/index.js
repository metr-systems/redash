import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import de from "./locales/de.json";

i18n.use(initReactI18next).use(LanguageDetector);
i18n
  .use(initReactI18next)
  //.use(LanguageDetector) to uncomment
  .init({
    resources: {
      en: { translation: en },
      de: { translation: de },
    },
    lng: "de", // to remove
    fallbackLng: "de",
    preload: ["en", "de"],
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
