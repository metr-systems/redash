import React from "react";
import PropTypes from "prop-types";

import { useTranslation } from "react-i18next";

import { clientConfig, currentUser } from "@/services/auth";
import Tooltip from "@/components/Tooltip";
import Alert from "antd/lib/alert";
import HelpTrigger from "@/components/HelpTrigger";
import { useUniqueId } from "@/lib/hooks/useUniqueId";

export default function EmailSettingsWarning({ featureName, className, mode, adminOnly }) {
  const { t } = useTranslation();
  const messageDescriptionId = useUniqueId("sr-mail-description");

  if (!clientConfig.mailSettingsMissing) {
    return null;
  }

  if (adminOnly && !currentUser.isAdmin) {
    return null;
  }

  const message = (
    <span id={messageDescriptionId}>
      {t("EmailSettings:Your mail server isn&apos;t configured correctly, and is needed for {{featureName}} to work.",{featureName})}{" "}
      <HelpTrigger type="MAIL_CONFIG" className="f-inherit" />
    </span>
  );

  if (mode === "icon") {
    return (
      <Tooltip title={message} placement="topRight" arrowPointAtCenter>
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
        <span className={className} aria-label={t("EmailSettings:Mail alert")} aria-describedby={messageDescriptionId} tabIndex={0}>
          <i className={"fa fa-exclamation-triangle"} aria-hidden="true" />
        </span>
      </Tooltip>
    );
  }

  return <Alert message={message} type="error" className={className} />;
}

EmailSettingsWarning.propTypes = {
  featureName: PropTypes.string.isRequired,
  className: PropTypes.string,
  mode: PropTypes.oneOf(["alert", "icon"]),
  adminOnly: PropTypes.bool,
};

EmailSettingsWarning.defaultProps = {
  className: null,
  mode: "alert",
  adminOnly: false,
};
