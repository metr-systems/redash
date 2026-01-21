import { useMemo } from "react";

/**
 * Optimized extraction of fixed-from-url parameter names from widgets
 * @param {Array} widgets - Dashboard widgets array
 * @returns {Array} - Array of unique parameter names that should be fixed from URL
 */
export function extractFixedParameterNames(widgets) {
  if (!widgets || widgets.length === 0) {
    return [];
  }

  const namesSet = new Set();

  for (let i = 0; i < widgets.length; i++) {
    const mappings = widgets[i]?.options?.parameterMappings;
    if (!mappings) continue;

    // Use for...in for better performance than Object.values()
    for (const key in mappings) {
      const mapping = mappings[key];
      if (mapping?.type === "fixed-from-url" && mapping.mapTo) {
        namesSet.add(mapping.mapTo);
      }
    }
  }

  return namesSet.size > 0 ? Array.from(namesSet) : [];
}

/**
 * Create parameter lookup map for O(1) access
 * @param {Array} globalParameters - Global dashboard parameters
 * @returns {Map} - Map of parameter name to parameter object
 */
function createParameterLookup(globalParameters) {
  if (!globalParameters || globalParameters.length === 0) {
    return new Map();
  }

  const lookup = new Map();
  for (let i = 0; i < globalParameters.length; i++) {
    const param = globalParameters[i];
    if (param?.name) {
      lookup.set(param.name, param);
    }
  }
  return lookup;
}

/**
 * Custom hook for managing fixed-from-url parameters in dashboard
 * @param {Array} widgets - Dashboard widgets array
 * @param {Array} globalParameters - Global dashboard parameters
 * @returns {Array} - Array of parameters that are fixed from URL
 */
export function useFixedFromUrlParameters(widgets, globalParameters) {
  // Single memoized computation that extracts and finds matching parameters
  const parameters = useMemo(() => {
    // Extract parameter names
    const parameterNames = extractFixedParameterNames(widgets);

    if (parameterNames.length === 0) {
      return [];
    }

    // Create lookup map for efficient parameter finding
    const paramLookup = createParameterLookup(globalParameters);

    // Find matching parameters efficiently
    const result = [];
    for (let i = 0; i < parameterNames.length; i++) {
      const param = paramLookup.get(parameterNames[i]);
      if (param) {
        result.push(param);
      }
    }

    return result;
  }, [widgets, globalParameters]);

  return parameters;
}
