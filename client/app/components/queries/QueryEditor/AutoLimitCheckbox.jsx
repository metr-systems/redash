import React, { useCallback } from "react";
import PropTypes from "prop-types";

import { useTranslation } from "react-i18next";

import recordEvent from "@/services/recordEvent";
import Checkbox from "antd/lib/checkbox";
import Tooltip from "@/components/Tooltip";

export default function AutoLimitCheckbox({ available, checked, onChange }) {
  const { t } = useTranslation();
  const handleClick = useCallback(() => {
    recordEvent("checkbox_auto_limit", "screen", "query_editor", { state: !checked });
    onChange(!checked);
  }, [checked, onChange]);

  let tooltipMessage = null;
  if (!available) {
    tooltipMessage = t("Queries:Auto limiting is not available for this Data Source type.");
  } else {
    tooltipMessage = t("Queries:Auto limit results to first 1000 rows.");
  }

  return (
    <Tooltip placement="top" title={tooltipMessage}>
      <Checkbox
        className="query-editor-controls-checkbox"
        disabled={!available}
        onClick={handleClick}
        checked={available && checked}>
        {t("LIMIT 1000")}
      </Checkbox>
    </Tooltip>
  );
}

AutoLimitCheckbox.propTypes = {
  available: PropTypes.bool,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
};
