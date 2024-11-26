import React from "react";

import i18next from "i18next";

import { clientConfig } from "@/services/auth";
import frontendVersion from "@/version.json";

export default function VersionInfo() {
  return (
    <React.Fragment>
      <div>
        {i18next.t("ApplicationArea:Version")}: {clientConfig.version}
        {frontendVersion !== clientConfig.version && ` (${frontendVersion.substring(0, 8)})`}
      </div>
    </React.Fragment>
  );
}
