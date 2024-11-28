import React from "react";

import { useTranslation } from "react-i18next";

import { clientConfig } from "@/services/auth";
import frontendVersion from "@/version.json";

export default function VersionInfo() {
  const { t } = useTranslation("ApplicationArea");

  return (
    <React.Fragment>
      <div>
        {t("Version")}: {clientConfig.version}
        {frontendVersion !== clientConfig.version && ` (${frontendVersion.substring(0, 8)})`}
      </div>
    </React.Fragment>
  );
}
