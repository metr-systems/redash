import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "/client/app/i18n/locales/en/common.json";
import de from "/client/app/i18n/locales/de/common.json";

i18n.use(initReactI18next).init({
  resources: {
    en: { common: en },
    de: { common: de },
  },
  lng: "de",
  fallbackLng: "de",
  preload: ["en", "de"],
  ns: ["common"],
  defaultNS: "common",
  interpolation: {
    escapeValue: false,
  },
});
export default i18n;
