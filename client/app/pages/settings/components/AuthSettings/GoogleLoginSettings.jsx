import { isEmpty, join } from "lodash";
import React from "react";
import Form from "antd/lib/form";
import Select from "antd/lib/select";
import Alert from "antd/lib/alert";

import i18next from 'i18next';
import { Trans } from 'react-i18next';

import DynamicComponent from "@/components/DynamicComponent";
import { clientConfig } from "@/services/auth";
import { SettingsEditorPropTypes, SettingsEditorDefaultProps } from "../prop-types";

export default function GoogleLoginSettings(props) {
  const { values, onChange } = props;

  if (!clientConfig.googleLoginEnabled) {
    return null;
  }

  return (
    <DynamicComponent name="OrganizationSettings.GoogleLoginSettings" {...props}>
      <h4>{i18next.t("Settings:Google Login")}</h4>
      <Form.Item label={i18next.t("Settings:Allowed Google Apps Domains")}>
        <Select
          mode="tags"
          value={values.auth_google_apps_domains}
          onChange={value => onChange({ auth_google_apps_domains: value })}
        />
        {!isEmpty(values.auth_google_apps_domains) && (
          <Alert
            message={
              <p>
                <Trans i18nKey="Settings:google_login" >
                Any user registered with a <strong>{join(values.auth_google_apps_domains, ", ")}</strong> Google Apps
                account will be able to login. If they don't have an existing user, a new user will be created and join
                the <strong>Default</strong> group.
                </Trans>
              </p>
            }
            className="m-t-15"
          />
        )}
      </Form.Item>
    </DynamicComponent>
  );
}

GoogleLoginSettings.propTypes = SettingsEditorPropTypes;

GoogleLoginSettings.defaultProps = SettingsEditorDefaultProps;
