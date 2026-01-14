import React from "react";
import PropTypes from "prop-types";
import Button from "antd/lib/button";
import { useTranslation } from "react-i18next";
import { createBackToOverviewHandler } from "@/services/navigation";

export default function BackToOverviewButton({ 
  className = "m-t-10", 
  onClick = null, 
  dataTest = "BackToOverviewButton",
  backText = null,
  ...buttonProps 
}) {
  const { t } = useTranslation("Dashboards");
  const defaultHandler = createBackToOverviewHandler();
  
  const handleClick = onClick || defaultHandler;
  const displayText = backText || t("Back to overview");

  return (
    <div className={className}>
      <Button 
        type="link" 
        onClick={handleClick} 
        data-test={dataTest}
        {...buttonProps}
      >
        {displayText}
      </Button>
    </div>
  );
}

BackToOverviewButton.propTypes = {
  className: PropTypes.string,
  onClick: PropTypes.func,
  dataTest: PropTypes.string,
  backText: PropTypes.string,
};
