import React from "react";
import PropTypes from "prop-types";
import Button from "antd/lib/button";
import { useTranslation } from "react-i18next";
import { createBackToOverviewHandler } from "@/services/navigation";

export default function BackButton({
  className = "m-t-10",
  backText = null,
  ...buttonProps
}) {
  const { t } = useTranslation("Dashboards");
  const handleClick = createBackToOverviewHandler();
  const displayText = backText || t("Back");

  return (
    <div className={className}>
      <Button type="link" onClick={handleClick} {...buttonProps}>
        {displayText}
      </Button>
    </div>
  );
}

BackButton.propTypes = {
  className: PropTypes.string,
  backText: PropTypes.string,
};
