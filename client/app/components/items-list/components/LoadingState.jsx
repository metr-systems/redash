import React from "react";

import { useTranslation } from "react-i18next";

import BigMessage from "@/components/BigMessage";

// Default "loading" message for list pages
export default function LoadingState(props) {
  const { t } = useTranslation();
  return (
    <div className="text-center">
      <BigMessage icon="fa-spinner fa-2x fa-pulse" message={t("Loading...")} {...props} />
    </div>
  );
}
