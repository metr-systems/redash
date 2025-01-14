import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import common_en from "/client/app/i18n/locales/en/common.json";
import common_de from "/client/app/i18n/locales/de/common.json";

import EmptyState_en from "/client/app/i18n/locales/en/EmptyState.json";
import EmptyState_de from "/client/app/i18n/locales/de/EmptyState.json";

import ApplicationArea_en from "/client/app/i18n/locales/en/ApplicationArea.json";
import ApplicationArea_de from "/client/app/i18n/locales/de/ApplicationArea.json";

import Home_en from "/client/app/i18n/locales/en/Home.json";
import Home_de from "/client/app/i18n/locales/de/Home.json";

import Dashboards_en from "/client/app/i18n/locales/en/Dashboards.json";
import Dashboards_de from "/client/app/i18n/locales/de/Dashboards.json";

import Tags_en from "/client/app/i18n/locales/en/Tags.json";
import Tags_de from "/client/app/i18n/locales/de/Tags.json";

import Queries_en from "/client/app/i18n/locales/en/Queries.json";
import Queries_de from "/client/app/i18n/locales/de/Queries.json";

import Users_en from "/client/app/i18n/locales/en/Users.json";
import Users_de from "/client/app/i18n/locales/de/Users.json";

import ItemsList_en from "/client/app/i18n/locales/en/ItemsList.json";
import ItemsList_de from "/client/app/i18n/locales/de/ItemsList.json";

import Visualizations_en from "/client/app/i18n/locales/en/Visualizations.json";
import Visualizations_de from "/client/app/i18n/locales/de/Visualizations.json";

import DynamicForm_en from "/client/app/i18n/locales/en/DynamicForm.json";
import DynamicForm_de from "/client/app/i18n/locales/de/DynamicForm.json";

import viz_lib_en from "/client/app/i18n/locales/en/viz-lib.json";
import viz_lib_de from "/client/app/i18n/locales/de/viz-lib.json";

import reserved_en from "/client/app/i18n/locales/en/reserved.json";
import reserved_de from "/client/app/i18n/locales/de/reserved.json";

i18n.use(initReactI18next).init({
  debug: true,
  resources: {
    en: {
      common: common_en,
      EmptyState: EmptyState_en,
      ApplicationArea: ApplicationArea_en,
      Home: Home_en,
      Dashboards: Dashboards_en,
      Tags: Tags_en,
      Queries: Queries_en,
      Users: Users_en,
      ItemsList: ItemsList_en,
      Visualizations: Visualizations_en,
      reserved: reserved_en,
      DynamicForm: DynamicForm_en,
      viz_lib: viz_lib_en,
    },
    de: {
      common: common_de,
      EmptyState: EmptyState_de,
      ApplicationArea: ApplicationArea_de,
      Home: Home_de,
      Dashboards: Dashboards_de,
      Tags: Tags_de,
      Queries: Queries_de,
      Users: Users_de,
      ItemsList: ItemsList_de,
      Visualizations: Visualizations_de,
      reserved: reserved_de,
      DynamicForm: DynamicForm_de,
      viz_lib: viz_lib_de,
    },
  },
  lng: "de",
  fallbackLng: "de",
  preload: ["en", "de"],
  keySeparator: ":",
  ns: [
    "common",
    "EmptyState",
    "ApplicationArea",
    "Home",
    "Dashboards",
    "Tags",
    "Queries",
    "Users",
    "ItemsList",
    "Visualizations",
    "DynamicForm",
    "viz-lib",
    "reserved",
  ],
  defaultNS: "common",
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
  returnEmptyString: false, // Return key instead of an empty string
  keyFallback: true,
});
export default i18n;
