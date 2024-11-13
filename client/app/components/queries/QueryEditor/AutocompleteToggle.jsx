import React, { useCallback } from "react";

import { useTranslation } from "react-i18next";

import Tooltip from "@/components/Tooltip";
import Button from "antd/lib/button";
import PropTypes from "prop-types";
import "@/redash-font/style.less";
import recordEvent from "@/services/recordEvent";

export default function AutocompleteToggle({ available, enabled, onToggle }) {
  const { t } = useTranslation();
  let tooltipMessage = t("Queries:Live Autocomplete Enabled");
  let icon = "icon-flash";
  if (!enabled) {
    tooltipMessage = t("Queries:Live Autocomplete Disabled");
    icon = "icon-flash-off";
  }

  if (!available) {
    tooltipMessage = t("Queries:Live Autocomplete Not Available (Use Ctrl+Space to Trigger)");
    icon = "icon-flash-off";
  }

  const handleClick = useCallback(() => {
    recordEvent("toggle_autocomplete", "screen", "query_editor", { state: !enabled });
    onToggle(!enabled);
  }, [enabled, onToggle]);

  return (
    <Tooltip placement="top" title={tooltipMessage}>
      <Button
        className="query-editor-controls-button m-r-5"
        disabled={!available}
        onClick={handleClick}
        aria-label={enabled ? t("Queries:Disable live autocomplete") : t("Queries:Enable live autocomplete")}>
        <i className={"icon " + icon} aria-hidden="true" />
      </Button>
    </Tooltip>
  );
}

AutocompleteToggle.propTypes = {
  available: PropTypes.bool.isRequired,
  enabled: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};
