import React from "react";
import Checkbox from "antd/lib/checkbox";
import Form from "antd/lib/form";
import Row from "antd/lib/row";
import Skeleton from "antd/lib/skeleton";
import { useTranslation } from "react-i18next";
import DynamicComponent from "@/components/DynamicComponent";
import { SettingsEditorPropTypes, SettingsEditorDefaultProps } from "../prop-types";

export default function FeatureFlagsSettings(props) {
  const { t } = useTranslation("Settings");
  const { values, onChange, loading } = props;

  return (
    <DynamicComponent name="OrganizationSettings.FeatureFlagsSettings" {...props}>
      <Form.Item label={t("Feature Flags")}>
        {loading ? (
          <>
            <Row>
              <Skeleton title={false} paragraph={{ width: [300, 300, 300], rows: 3 }} active />
            </Row>
          </>
        ) : (
          <>
            <DynamicComponent name="OrganizationSettings.FeatureFlagsSettings.PermissionsControl" {...props}>
              <Row>
                <Checkbox
                  name="feature_show_permissions_control"
                  checked={values.feature_show_permissions_control}
                  onChange={(e) => onChange({ feature_show_permissions_control: e.target.checked })}
                >
                  {t("Enable experimental multiple owners support")}
                </Checkbox>
              </Row>
            </DynamicComponent>
            <Row>
              <Checkbox
                name="send_email_on_failed_scheduled_queries"
                checked={values.send_email_on_failed_scheduled_queries}
                onChange={(e) => onChange({ send_email_on_failed_scheduled_queries: e.target.checked })}
              >
                {t("Email query owners when scheduled queries fail")}
              </Checkbox>
            </Row>
            <Row>
              <Checkbox
                name="multi_byte_search_enabled"
                checked={values.multi_byte_search_enabled}
                onChange={(e) => onChange({ multi_byte_search_enabled: e.target.checked })}
              >
                {t(
                  "Enable multi-byte (Chinese, Japanese, and Korean) search for query names and descriptions (slower)"
                )}
              </Checkbox>
            </Row>
            <Row>
              <Checkbox
                name="enable_auto_refresh_when_opening_dashboard"
                checked={values.enable_auto_refresh_when_opening_dashboard}
                onChange={(e) => onChange({ enable_auto_refresh_when_opening_dashboard: e.target.checked })}
              >
                {t("Enable auto-refresh when opening a dashboard page")}
              </Checkbox>
            </Row>
          </>
        )}
      </Form.Item>
    </DynamicComponent>
  );
}

FeatureFlagsSettings.propTypes = SettingsEditorPropTypes;

FeatureFlagsSettings.defaultProps = SettingsEditorDefaultProps;
