import ConfigProvider from "antd/lib/config-provider";
import enUS from "antd/lib/locale/en_US";
import deDE from "antd/lib/locale/de_DE";

import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";

import React from "react";
import ReactDOM from "react-dom";

import "@/config";

import ApplicationArea from "@/components/ApplicationArea";
import offlineListener from "@/services/offline-listener";

const currentLanguage = i18n.language;
const locale = currentLanguage === "de" ? deDE : enUS;

ReactDOM.render(
  <ConfigProvider locale={locale}>
    <I18nextProvider i18n={i18n}>
      <ApplicationArea />
    </I18nextProvider>
  </ConfigProvider>,
  document.getElementById("application-root"),
  () => {
    offlineListener.init();
  }
);
