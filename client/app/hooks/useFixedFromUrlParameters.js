import { useMemo } from "react";
import { useFixedFromUrlParameterHydration } from "@/services/parameterHydration";

/**
 * Extracts parameter names that are configured as "fixed-from-url" from widget parameter mappings
 * @param {Array} widgets - Array of dashboard widgets
 * @returns {Array} - Array of parameter names that should be fixed from URL
 */
function extractFixedFromUrlParameterNames(widgets) {
  const names = new Set();
  const widgetsToScan = widgets || [];
  
  widgetsToScan.forEach((widget) => {
    const mappings = (widget.options && widget.options.parameterMappings) || {};
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
 * @returns {Object} - Object containing parameter names, hydration function, and utility properties
 */
export function useFixedFromUrlParameters(widgets, globalParameters) {
  // Extract parameter names that should be fixed from URL
  const parameterNames = useMemo(() => {
    return extractFixedFromUrlParameterNames(widgets);
  }, [widgets]);

  // Set up automatic hydration
  const manualHydrate = useFixedFromUrlParameterHydration(globalParameters, parameterNames);

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
    // Manual hydration function
    manualHydrate,
    // Helper properties
    hasFixedParameters: parameterNames.length > 0,
    count: parameterNames.length,
  };
}
