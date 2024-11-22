import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import common_en from "/client/app/i18n/locales/en/common.json";
import common_de from "/client/app/i18n/locales/de/common.json";

import EmptyState_en from "/client/app/i18n/locales/en/EmptyState.json";
import EmptyState_de from "/client/app/i18n/locales/de/EmptyState.json";

i18n.use(initReactI18next).init({
  resources: {
    en: { common: common_en, EmptyState: EmptyState_en },
    de: { common: common_de, EmptyState: EmptyState_de },
  },
  lng: "de",
  fallbackLng: "de",
  preload: ["en", "de"],
  ns: ["common", "EmptyState"],
  defaultNS: "common",
  interpolation: {
    escapeValue: false,
  },
});
export default i18n;
