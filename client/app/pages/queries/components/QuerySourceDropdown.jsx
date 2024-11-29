import Select from "antd/lib/select";
import { map } from "lodash";
import { useTranslation } from "react-i18next";

import DynamicComponent, { registerComponent } from "@/components/DynamicComponent";
import PropTypes from "prop-types";
import React from "react";

import "./QuerySourceDropdownItem"; // register QuerySourceDropdownItem

export function QuerySourceDropdown(props) {
  const { t } = useTranslation("Queries");
  return (
    <Select
      className="w-100"
      data-test="SelectDataSource"
      placeholder={t("Choose data source...")}
      value={props.value}
      disabled={props.disabled}
      loading={props.loading}
      optionFilterProp="data-name"
      showSearch
      onChange={props.onChange}>
      {map(props.dataSources, ds => (
        <Select.Option key={`ds-${ds.id}`} value={ds.id} data-name={ds.name} data-test={`SelectDataSource${ds.id}`}>
          <DynamicComponent name={"QuerySourceDropdownItem"} dataSource={ds} />
        </Select.Option>
      ))}
    </Select>
  );
}

QuerySourceDropdown.propTypes = {
  dataSources: PropTypes.any,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  onChange: PropTypes.func,
};

registerComponent("QuerySourceDropdown", QuerySourceDropdown);
