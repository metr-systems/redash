import React from "react";
import PropTypes from "prop-types";
import Typography from "antd/lib/typography";
import location from "@/services/location";
import { formatFixedValue } from "../pages/dashboards/helpers";
import BackToOverviewButton from "./BackToOverviewButton";

const { Text } = Typography;

/**
 * Displays a single fixed parameter with its current value
 */
function FixedParameterDisplay({ parameterName, parameter }) {
  const label = (parameter && (parameter.title || parameter.name)) || parameterName;

  // Get the current value from URL or parameter
  const params = location.search || {};
  const key = `p_${parameterName}`;
  const rawValue = Object.prototype.hasOwnProperty.call(params, key)
    ? params[key]
    : parameter?.normalizedValue ?? null;

  const displayValue = formatFixedValue(rawValue);

  return (
    <div key={parameterName} className="parameter-block" data-test={`FixedFromUrlParam-${parameterName}`}>
      <div className="di-block">
        <div className="parameter-heading">
          <label>{label} (Fixed)</label>
        </div>
        <div className="parameter-input">
          <Text data-test={`FixedFromUrlValue-${parameterName}`}>{displayValue}</Text>
        </div>
      </div>
    </div>
  );
}

FixedParameterDisplay.propTypes = {
  parameterName: PropTypes.string.isRequired,
  parameter: PropTypes.object,
};

/**
 * Renders the list of fixed-from-url parameters with a back to overview button
 */
export default function FixedParametersList({ parameterNames, parameters = [] }) {
  if (!parameterNames || parameterNames.length === 0) {
    return null;
  }

  // Check if there's a back URL parameter in the current location
  const params = location.search || {};
  const hasBackUrl = params.back && typeof params.back === 'string';

  return (
    <>
      {parameterNames.map((parameterName) => {
        const parameter = parameters.find(p => p?.name === parameterName);
        return (
          <FixedParameterDisplay
            key={parameterName}
            parameterName={parameterName}
            parameter={parameter}
          />
        );
      })}
      {hasBackUrl && <BackToOverviewButton />}
    </>
  );
}

FixedParametersList.propTypes = {
  parameterNames: PropTypes.arrayOf(PropTypes.string).isRequired,
  parameters: PropTypes.arrayOf(PropTypes.object),
};
