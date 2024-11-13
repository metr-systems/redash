import React from "react";

import { useTranslation } from "react-i18next";

import BigMessage from "@/components/BigMessage";

// Default "list empty" message for list pages
export default function EmptyState(props) {
  const { t } = useTranslation();
  return (
    <div className="text-center">
      <BigMessage icon="fa-search" message={t("ItemsList:Sorry, we couldn't find anything.")} {...props} />
    </div>
  );
}
