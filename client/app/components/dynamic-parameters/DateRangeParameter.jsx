import React from "react";
import PropTypes from "prop-types";
import { includes } from "lodash";

import i18next from "i18next";

import { getDynamicDateRangeFromString } from "@/services/parameters/DateRangeParameter";
import DynamicDateRangePicker from "@/components/dynamic-parameters/DynamicDateRangePicker";

const DYNAMIC_DATE_OPTIONS = [
  {
    name: i18next.t("DynamicParams:This week"),
    value: getDynamicDateRangeFromString("d_this_week"),
    label: () =>
      getDynamicDateRangeFromString("d_this_week").value()[0].format("MMM D") +
      " - " +
      getDynamicDateRangeFromString("d_this_week").value()[1].format("MMM D"),
  },
  {
    name: i18next.t("DynamicParams:This month"),
    value: getDynamicDateRangeFromString("d_this_month"),
    label: () => getDynamicDateRangeFromString("d_this_month").value()[0].format("MMMM"),
  },
  {
    name: i18next.t("DynamicParams:This year"),
    value: getDynamicDateRangeFromString("d_this_year"),
    label: () => getDynamicDateRangeFromString("d_this_year").value()[0].format("YYYY"),
  },
  {
    name: i18next.t("DynamicParams:Last week"),
    value: getDynamicDateRangeFromString("d_last_week"),
    label: () =>
      getDynamicDateRangeFromString("d_last_week").value()[0].format("MMM D") +
      " - " +
      getDynamicDateRangeFromString("d_last_week").value()[1].format("MMM D"),
  },
  {
    name: i18next.t("DynamicParams:Last month"),
    value: getDynamicDateRangeFromString("d_last_month"),
    label: () => getDynamicDateRangeFromString("d_last_month").value()[0].format("MMMM"),
  },
  {
    name: i18next.t("DynamicParams:Last year"),
    value: getDynamicDateRangeFromString("d_last_year"),
    label: () => getDynamicDateRangeFromString("d_last_year").value()[0].format("YYYY"),
  },
  {
    name: i18next.t("DynamicParams:Last 7 days"),
    value: getDynamicDateRangeFromString("d_last_7_days"),
    label: () =>
      getDynamicDateRangeFromString("d_last_7_days").value()[0].format("MMM D") +
      " - " +
      i18next.t("DynamicParams:Today"),
  },
  {
    name: i18next.t("DynamicParams:Last 14 days"),
    value: getDynamicDateRangeFromString("d_last_14_days"),
    label: () =>
      getDynamicDateRangeFromString("d_last_14_days").value()[0].format("MMM D") +
      " - " +
      i18next.t("DynamicParams:Today"),
  },
  {
    name: i18next.t("DynamicParams:Last 30 days"),
    value: getDynamicDateRangeFromString("d_last_30_days"),
    label: () =>
      getDynamicDateRangeFromString("d_last_30_days").value()[0].format("MMM D") +
      " - " +
      i18next.t("DynamicParams:Today"),
  },
  {
    name: i18next.t("DynamicParams:Last 60 days"),
    value: getDynamicDateRangeFromString("d_last_60_days"),
    label: () =>
      getDynamicDateRangeFromString("d_last_60_days").value()[0].format("MMM D") +
      " - " +
      i18next.t("DynamicParams:Today"),
  },
  {
    name: i18next.t("DynamicParams:Last 90 days"),
    value: getDynamicDateRangeFromString("d_last_90_days"),
    label: () =>
      getDynamicDateRangeFromString("d_last_90_days").value()[0].format("MMM D") +
      " - " +
      i18next.t("DynamicParams:Today"),
  },
  {
    name: i18next.t("DynamicParams:Last 12 months"),
    value: getDynamicDateRangeFromString("d_last_12_months"),
    label: null,
  },
];

const DYNAMIC_DATETIME_OPTIONS = [
  {
    name: i18next.t("DynamicParams:Today"),
    value: getDynamicDateRangeFromString("d_today"),
    label: () => getDynamicDateRangeFromString("d_today").value()[0].format("MMM D"),
  },
  {
    name: i18next.t("DynamicParams:Yesterday"),
    value: getDynamicDateRangeFromString("d_yesterday"),
    label: () => getDynamicDateRangeFromString("d_yesterday").value()[0].format("MMM D"),
  },
  ...DYNAMIC_DATE_OPTIONS,
];

function DateRangeParameter(props) {
  const options = includes(props.type, "datetime-range") ? DYNAMIC_DATETIME_OPTIONS : DYNAMIC_DATE_OPTIONS;
  return <DynamicDateRangePicker {...props} dynamicButtonOptions={{ options }} />;
}

DateRangeParameter.propTypes = {
  type: PropTypes.string,
  className: PropTypes.string,
  value: PropTypes.any, // eslint-disable-line react/forbid-prop-types
  parameter: PropTypes.any, // eslint-disable-line react/forbid-prop-types
  onSelect: PropTypes.func,
};

DateRangeParameter.defaultProps = {
  type: "",
  className: "",
  value: null,
  parameter: null,
  onSelect: () => {},
};

export default DateRangeParameter;
