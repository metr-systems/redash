import React from "react";
import Checkbox from "antd/lib/checkbox";
import Form from "antd/lib/form";
import Skeleton from "antd/lib/skeleton";
import i18next from 'i18next';
import DynamicComponent from "@/components/DynamicComponent";
import { SettingsEditorPropTypes, SettingsEditorDefaultProps } from "../prop-types";

export default function PlotlySettings(props) {
  const { values, onChange, loading } = props;

  return (
    <DynamicComponent name="OrganizationSettings.PlotlySettings" {...props}>
      <Form.Item label={i18next.t("Settings:Chart Visualization")}>
        {loading ? (
          <Skeleton title={{ width: 300 }} paragraph={false} active />
        ) : (
          <Checkbox
            name="hide_plotly_mode_bar"
            checked={values.hide_plotly_mode_bar}
            onChange={e => onChange({ hide_plotly_mode_bar: e.target.checked })}>
            {i18next.t("Settings:Hide Plotly mode bar")}
          </Checkbox>
        )}
      </Form.Item>
    </DynamicComponent>
  );
}

PlotlySettings.propTypes = SettingsEditorPropTypes;

PlotlySettings.defaultProps = SettingsEditorDefaultProps;
