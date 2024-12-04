import { isString } from "lodash";
import React from "react";
import PropTypes from "prop-types";
import Alert from "antd/lib/alert";

import { useTranslation } from "react-i18next";

import DynamicComponent from "@/components/DynamicComponent";
import InputWithCopy from "@/components/InputWithCopy";
import { UserProfile } from "@/components/proptypes";
import { absoluteUrl } from "@/services/utils";

export default function PasswordLinkAlert(props) {
  const { t } = useTranslation("Users");
  const { user, passwordLink, ...restProps } = props;

  if (!isString(passwordLink)) {
    return null;
  }

  return (
    <DynamicComponent name="UserProfile.PasswordLinkAlert" {...props}>
      <Alert
        message={t("Email not sent!")}
        description={
          <React.Fragment>
            <p>
              {t("The mail server is not configured, please send the following link to")} <b>{user.name}</b>:
            </p>
            <InputWithCopy value={absoluteUrl(passwordLink)} aria-label={t("Password link")} readOnly />
          </React.Fragment>
        }
        type="warning"
        className="m-t-20"
        closable
        {...restProps}
      />
    </DynamicComponent>
  );
}

PasswordLinkAlert.propTypes = {
  user: UserProfile.isRequired,
  passwordLink: PropTypes.string,
};

PasswordLinkAlert.defaultProps = {
  passwordLink: null,
};
