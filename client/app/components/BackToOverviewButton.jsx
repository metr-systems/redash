import React from "react";
import PropTypes from "prop-types";
import Button from "antd/lib/button";
import { useTranslation } from "react-i18next";
import { createBackToOverviewHandler } from "@/services/navigation";

export default function BackToOverviewButton({ 
  className = "m-t-10", 
  onClick = null, 
  dataTest = "BackToOverviewButton",
  ...buttonProps 
}) {
  const { t } = useTranslation("Dashboards");
  const defaultHandler = createBackToOverviewHandler();
  
  const handleClick = onClick || defaultHandler;

  return (
    <div className={className}>
      <Button 
        type="link" 
        onClick={handleClick} 
        data-test={dataTest}
        {...buttonProps}
      >
        {t("Back to overview")}
      </Button>
    </div>
  );
}

BackToOverviewButton.propTypes = {
  className: PropTypes.string,
  onClick: PropTypes.func,
  dataTest: PropTypes.string,
};
