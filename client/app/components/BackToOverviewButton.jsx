import React from "react";
import PropTypes from "prop-types";
import Button from "antd/lib/button";
import { useTranslation } from "react-i18next";
import { createBackToOverviewHandler } from "@/services/navigation";

export default function BackToOverviewButton({
  className = "m-t-10",
  dataTest = "BackToOverviewButton",
  backText = null,
  ...buttonProps
}) {
  const { t } = useTranslation("Dashboards");
  const handleClick = createBackToOverviewHandler();
  const displayText = backText || t("Back to overview");

  return (
    <div className={className}>
      <Button type="link" onClick={handleClick} data-test={dataTest} {...buttonProps}>
        {displayText}
      </Button>
    </div>
  );
}

BackToOverviewButton.propTypes = {
  className: PropTypes.string,
  dataTest: PropTypes.string,
  backText: PropTypes.string,
};
