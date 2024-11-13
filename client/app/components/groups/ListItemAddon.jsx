import React from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import Tooltip from "@/components/Tooltip";

export default function ListItemAddon({ isSelected, isStaged, alreadyInGroup, deselectedIcon }) {
  const { t } = useTranslation();
  if (isStaged) {
    return (
      <>
        <i className="fa fa-remove" aria-hidden="true" />
        <span className="sr-only">{t("Remove")}</span>
      </>
    );
  }
  if (alreadyInGroup) {
    return (
      <Tooltip title={t("Groups:Already selected")}>
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
        <span tabIndex={0}>
          <i className="fa fa-check" aria-hidden="true" />
          <span className="sr-only">{t("Groups:Already selected")}</span>
        </span>
      </Tooltip>
    );
  }
  return isSelected ? (
    <>
      <i className="fa fa-check" aria-hidden="true" />
      <span className="sr-only">{t("Groups:Selected")}</span>
    </>
  ) : (
    <>
      <i className={`fa ${deselectedIcon}`} aria-hidden="true" />
      <span className="sr-only">{t("Groups:Select")}</span>
    </>
  );
}

ListItemAddon.propTypes = {
  isSelected: PropTypes.bool,
  isStaged: PropTypes.bool,
  alreadyInGroup: PropTypes.bool,
  deselectedIcon: PropTypes.string,
};

ListItemAddon.defaultProps = {
  isSelected: false,
  isStaged: false,
  alreadyInGroup: false,
  deselectedIcon: "fa-angle-double-right",
};
