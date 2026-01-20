import React from "react";
import PropTypes from "prop-types";
import Button from "antd/lib/button";
import { useTranslation } from "react-i18next";
import { createBackToOverviewHandler, isValidBackText } from "@/services/navigation";
import location from "@/services/location";

export default function BackButton(buttonProps) {
  const { t } = useTranslation("Dashboards");
  const handleClick = createBackToOverviewHandler();

  // Extract backText from URL parameters
  let displayText = null;
  const params = location.search || {};
  if (params.backText && isValidBackText(params.backText)) {
    displayText = params.backText;
  }

  // Fallback to default text
  displayText = displayText || t("Back");

  return (
    <div className="dashboard-back-button">
      <Button type="link" onClick={handleClick} {...buttonProps}>
        {displayText}
      </Button>
    </div>
  );
}

BackButton.propTypes = {};
