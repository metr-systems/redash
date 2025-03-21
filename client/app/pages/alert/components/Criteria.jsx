import React from "react";
import PropTypes from "prop-types";
import { head, includes, toString, isEmpty } from "lodash";

import { useTranslation } from "react-i18next";

import Input from "antd/lib/input";
import WarningFilledIcon from "@ant-design/icons/WarningFilled";
import Select from "antd/lib/select";
import Divider from "antd/lib/divider";

import { AlertOptions as AlertOptionsType } from "@/components/proptypes";

import "./Criteria.less";

const CONDITIONS = {
  ">": "\u003e",
  ">=": "\u2265",
  "<": "\u003c",
  "<=": "\u2264",
  "==": "\u003d",
  "!=": "\u2260",
};

const VALID_STRING_CONDITIONS = ["==", "!="];

function DisabledInput({ children, minWidth }) {
  return (
    <div className="criteria-disabled-input" style={{ minWidth }}>
      {children}
    </div>
  );
}

DisabledInput.propTypes = {
  children: PropTypes.node.isRequired,
  minWidth: PropTypes.number.isRequired,
};

export default function Criteria({ columnNames, resultValues, alertOptions, onChange, editMode }) {
  const { t } = useTranslation("Alerts");
  const columnValue = !isEmpty(resultValues) ? head(resultValues)[alertOptions.column] : null;
  const invalidMessage = (() => {
    // bail if condition is valid for strings
    if (includes(VALID_STRING_CONDITIONS, alertOptions.op)) {
      return null;
    }

    if (isNaN(alertOptions.value)) {
      return t("Value column type doesn't match threshold type.");
    }

    if (isNaN(columnValue)) {
      return t("Value column isn't supported by condition type.");
    }

    return null;
  })();

  let columnHint;

  if (alertOptions.selector === "first") {
    columnHint = (
      <small className="alert-criteria-hint">
        {t("Top row value is")} <code className="p-0">{toString(columnValue) || "unknown"}</code>
      </small>
    );
  } else if (alertOptions.selector === "max") {
    columnHint = (
      <small className="alert-criteria-hint">
        {t("Max column value is")}{" "}
        <code className="p-0">
          {toString(
            Math.max(...resultValues.map(o => Number(o[alertOptions.column])).filter(value => !isNaN(value)))
          ) || "unknown"}
        </code>
      </small>
    );
  } else if (alertOptions.selector === "min") {
    columnHint = (
      <small className="alert-criteria-hint">
        {t("Min column value is")}{" "}
        <code className="p-0">
          {toString(
            Math.min(...resultValues.map(o => Number(o[alertOptions.column])).filter(value => !isNaN(value)))
          ) || "unknown"}
        </code>
      </small>
    );
  }

  return (
    <div data-test="Criteria">
      <div className="input-title">
        <span className="input-label">Selector</span>
        {editMode ? (
          <Select
            value={alertOptions.selector}
            onChange={selector => onChange({ selector })}
            optionLabelProp="label"
            dropdownMatchSelectWidth={false}
            style={{ width: 80 }}>
            <Select.Option value="first" label="first">
              {t("first")}
            </Select.Option>
            <Select.Option value="min" label="min">
              {t("min")}
            </Select.Option>
            <Select.Option value="max" label="max">
              {t("max")}
            </Select.Option>
          </Select>
        ) : (
          <DisabledInput minWidth={60}>{alertOptions.selector}</DisabledInput>
        )}
      </div>
      <div className="input-title">
        <span className="input-label">Value column</span>
        {editMode ? (
          <Select
            value={alertOptions.column}
            onChange={column => onChange({ column })}
            dropdownMatchSelectWidth={false}
            style={{ minWidth: 100 }}>
            {columnNames.map(name => (
              <Select.Option key={name}>{name}</Select.Option>
            ))}
          </Select>
        ) : (
          <DisabledInput minWidth={70}>{alertOptions.column}</DisabledInput>
        )}
      </div>
      <div className="input-title">
        <span className="input-label">{t("Condition")}</span>
        {editMode ? (
          <Select
            value={alertOptions.op}
            onChange={op => onChange({ op })}
            optionLabelProp="label"
            dropdownMatchSelectWidth={false}
            style={{ width: 55 }}>
            <Select.Option value=">" label={CONDITIONS[">"]}>
              {CONDITIONS[">"]} {t("greater than")}
            </Select.Option>
            <Select.Option value=">=" label={CONDITIONS[">="]}>
              {CONDITIONS[">="]} {t("greater than or equals")}
            </Select.Option>
            <Select.Option disabled key="dv1">
              <Divider className="select-option-divider m-t-10 m-b-5" />
            </Select.Option>
            <Select.Option value="<" label={CONDITIONS["<"]}>
              {CONDITIONS["<"]} {t("less than")}
            </Select.Option>
            <Select.Option value="<=" label={CONDITIONS["<="]}>
              {CONDITIONS["<="]} {t("less than or equals")}
            </Select.Option>
            <Select.Option disabled key="dv2">
              <Divider className="select-option-divider m-t-10 m-b-5" />
            </Select.Option>
            <Select.Option value="==" label={CONDITIONS["=="]}>
              {CONDITIONS["=="]} {t("equals")}
            </Select.Option>
            <Select.Option value="!=" label={CONDITIONS["!="]}>
              {CONDITIONS["!="]} {t("not equal to")}
            </Select.Option>
          </Select>
        ) : (
          <DisabledInput minWidth={50}>{CONDITIONS[alertOptions.op]}</DisabledInput>
        )}
      </div>
      <div className="input-title">
        <label className="input-label" htmlFor="threshold-criterion">
          {t("Threshold")}
        </label>
        {editMode ? (
          <Input
            id="threshold-criterion"
            style={{ width: 90 }}
            value={alertOptions.value}
            onChange={e => onChange({ value: e.target.value })}
          />
        ) : (
          <DisabledInput minWidth={50}>{alertOptions.value}</DisabledInput>
        )}
      </div>
      <div className="ant-form-item-explain">
        {columnHint}
        <br />
        {invalidMessage && (
          <small>
            <WarningFilledIcon className="warning-icon-danger" /> {invalidMessage}
          </small>
        )}
      </div>
    </div>
  );
}

Criteria.propTypes = {
  columnNames: PropTypes.arrayOf(PropTypes.string).isRequired,
  resultValues: PropTypes.arrayOf(PropTypes.object).isRequired,
  alertOptions: AlertOptionsType.isRequired,
  onChange: PropTypes.func,
  editMode: PropTypes.bool,
};

Criteria.defaultProps = {
  onChange: () => {},
  editMode: false,
};
