import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Typography from "antd/lib/typography";
import { find } from "lodash";
import { SortableContainer, SortableElement, DragHandle } from "@redash/viz/lib/components/sortable";
import location from "@/services/location";
import { formatFixedValue } from "../pages/dashboards/helpers";

const { Text } = Typography;

/**
 * Displays a single fixed parameter with its current value
 */
function FixedParameterDisplay({ parameterName, parameter, isEditing }) {
  const label = (parameter && (parameter.title || parameter.name)) || parameterName;
  const [dropdownOptions, setDropdownOptions] = useState([]);

  // Get the current value from URL parameters
  const params = location.search || {};
  const key = `p_${parameterName}`;
  const rawValue = Object.prototype.hasOwnProperty.call(params, key) ? params[key] : null;

  // Load dropdown options for query-based parameters
  useEffect(() => {
    if (parameter?.type === "query" && parameter?.loadDropdownValues) {
      parameter
        .loadDropdownValues()
        .then((options) => {
          setDropdownOptions(options || []);
        })
        .catch(() => {
          setDropdownOptions([]);
        });
    }
  }, [parameter?.type, parameter?.queryId]);

  // Resolve display value
  let displayValue = formatFixedValue(rawValue);
  if (parameter?.type === "query" && dropdownOptions.length > 0 && rawValue != null) {
    const matchingOption = find(dropdownOptions, (option) => String(option.value) === String(rawValue));
    if (matchingOption) {
      displayValue = matchingOption.name;
    }
  }

  return (
    <div className="di-block">
      <div className="parameter-heading">
        <label>{label}</label>
      </div>
      <div className="parameter-input">
        <Text data-test={`FixedFromUrlValue-${parameterName}`}>{displayValue}</Text>
      </div>
    </div>
  );
}

FixedParameterDisplay.propTypes = {
  parameterName: PropTypes.string.isRequired,
  parameter: PropTypes.object,
  isEditing: PropTypes.bool,
};

/**
 * Renders the list of fixed-from-url parameters
 */
export default function FixedParameters({ parameterNames, parameters = [], isEditing = false, sortable = false }) {
  if (!parameterNames || parameterNames.length === 0) {
    return null;
  }

  return (
    <SortableContainer
      disabled={!sortable}
      axis="xy"
      useDragHandle
      lockToContainerEdges
      helperClass="parameter-dragged"
      containerProps={{
        className: "parameter-container",
      }}
    >
      {parameterNames.map((parameterName, index) => {
        const parameter = parameters.find((p) => p?.name === parameterName);
        return (
          <SortableElement key={parameterName} index={index}>
            <div
              className="parameter-block"
              data-editable={isEditing || null}
              data-test={`FixedFromUrlParam-${parameterName}`}
            >
              {sortable && <DragHandle data-test={`DragHandle-${parameterName}`} />}
              <FixedParameterDisplay parameterName={parameterName} parameter={parameter} isEditing={isEditing} />
            </div>
          </SortableElement>
        );
      })}
    </SortableContainer>
  );
}

FixedParameters.propTypes = {
  parameterNames: PropTypes.arrayOf(PropTypes.string).isRequired,
  parameters: PropTypes.arrayOf(PropTypes.object),
  isEditing: PropTypes.bool,
  sortable: PropTypes.bool,
};
