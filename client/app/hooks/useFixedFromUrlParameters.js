import { useMemo } from "react";

/**
 * Extracts parameter names that are configured as "fixed-from-url" from widget parameter mappings
 * @param {Object} dashboard - Dashboard object with widgets array
 * @returns {Array} - Array of parameter names that should be fixed from URL
 */
export function extractFixedFromUrlParameterNames(dashboard) {
  const names = new Set();
  const widgets = dashboard?.widgets || [];
  
  widgets.forEach((widget) => {
    const mappings = (widget?.options && widget.options.parameterMappings) || {};
    Object.values(mappings).forEach((mapping) => {
      if (mapping && mapping.type === "fixed-from-url" && mapping.mapTo) {
        names.add(mapping.mapTo);
      }
    });
  });
  
  return Array.from(names);
}

/**
 * Custom hook for managing fixed-from-url parameters in dashboard
 * @param {Array} widgets - Dashboard widgets array
 * @param {Array} globalParameters - Global dashboard parameters
 * @returns {Object} - Object containing parameter names and utility properties
 */
export function useFixedFromUrlParameters(widgets, globalParameters) {
  // Extract parameter names that should be fixed from URL
  const parameterNames = useMemo(() => {
    return extractFixedFromUrlParameterNames({ widgets });
  }, [widgets]);

  // Get actual parameter objects for the fixed parameters
  const parameters = useMemo(() => {
    if (!globalParameters || parameterNames.length === 0) {
      return [];
    }
    
    return parameterNames
      .map(name => globalParameters.find(param => param.name === name))
      .filter(Boolean);
  }, [globalParameters, parameterNames]);

  return {
    // Array of parameter names that are fixed from URL
    parameterNames,
    // Array of actual parameter objects
    parameters,
    // Helper properties
    hasFixedParameters: parameterNames.length > 0,
    count: parameterNames.length,
  };
}
