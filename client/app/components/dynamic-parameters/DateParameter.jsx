import React from "react";
import PropTypes from "prop-types";

import i18next from "i18next";

import { getDynamicDateFromString } from "@/services/parameters/DateParameter";
import DynamicDatePicker from "@/components/dynamic-parameters/DynamicDatePicker";
import { useTranslation } from "react-i18next";

const DYNAMIC_DATE_OPTIONS = [
  {
    name: i18next.t("DynamicParams:Today/Now"), 
    value: getDynamicDateFromString("d_now"),
    label: () =>
      getDynamicDateFromString("d_now")
        .value()
        .format("MMM D"),
  },
  {
    name: i18next.t("DynamicParams:Yesterday"), 
    value: getDynamicDateFromString("d_yesterday"),
    label: () =>
      getDynamicDateFromString("d_yesterday")
        .value()
        .format("MMM D"),
  },
];

function DateParameter(props) {
  const { t } = useTranslation();
  return (
    <DynamicDatePicker
      dynamicButtonOptions={{ options: DYNAMIC_DATE_OPTIONS }}
      {...props}
      dateOptions={{ "aria-label": i18next.t("DynamicParams:Parameter date value") }}
    />
  );
}

DateParameter.propTypes = {
  type: PropTypes.string,
  className: PropTypes.string,
  value: PropTypes.any, // eslint-disable-line react/forbid-prop-types
  parameter: PropTypes.any, // eslint-disable-line react/forbid-prop-types
  onSelect: PropTypes.func,
};

DateParameter.defaultProps = {
  type: "",
  className: "",
  value: null,
  parameter: null,
  onSelect: () => {},
};

export default DateParameter;
