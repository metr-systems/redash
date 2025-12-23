import React from "react";
import location from "@/services/location";

/**
 * Creates a parameter key for URL search params
 * @param {string} paramName - The parameter name
 * @returns {string} - The URL parameter key with prefix
 */
function createParameterKey(paramName) {
  return `p_${paramName}`;
}

/**
 * Finds a parameter by name in the global parameters array
 * @param {Array} globalParameters - Array of global parameters
 * @param {string} paramName - Name of the parameter to find
 * @returns {Object|null} - The parameter object or null if not found
 */
function findParameterByName(globalParameters, paramName) {
  return globalParameters.find(param => param.name === paramName) || null;
}

/**
 * Hydrates a single parameter from URL search params
 * @param {Object} param - The parameter object to hydrate
 * @param {string} paramName - The parameter name
 * @param {Object} urlParams - The URL search parameters object
 * @returns {boolean} - Whether the parameter was successfully hydrated
 */
function hydrateParameterFromUrl(param, paramName, urlParams) {
  const key = createParameterKey(paramName);
  
  if (!Object.prototype.hasOwnProperty.call(urlParams, key)) {
    return false;
  }

  const value = urlParams[key];
  if (param && value !== undefined) {
    param.setValue(value);
    return true;
  }
  
  return false;
}

/**
 * Hydrates all fixed-from-url parameters with values from the current URL
 * @param {Array} globalParameters - Array of global parameters
 * @param {Array} fixedFromUrlParamNames - Array of parameter names that should be hydrated from URL
 */
export function hydrateFixedFromUrlParameters(globalParameters, fixedFromUrlParamNames) {
  if (!globalParameters || !fixedFromUrlParamNames || fixedFromUrlParamNames.length === 0) {
    return;
  }

  const urlParams = location.search || {};
  let hydratedCount = 0;

  fixedFromUrlParamNames.forEach(paramName => {
    const param = findParameterByName(globalParameters, paramName);
    const wasHydrated = hydrateParameterFromUrl(param, paramName, urlParams);
    
    if (wasHydrated) {
      hydratedCount++;
    }
  });

  return hydratedCount;
}

/**
 * Custom hook for managing fixed-from-url parameter hydration
 * @param {Array} globalParameters - Array of global parameters
 * @param {Array} fixedFromUrlParamNames - Array of parameter names that should be hydrated from URL
 * @returns {Function} - Manual hydration function for external use
 */
export function useFixedFromUrlParameterHydration(globalParameters, fixedFromUrlParamNames) {
  const hydrateParameters = React.useCallback(() => {
    return hydrateFixedFromUrlParameters(globalParameters, fixedFromUrlParamNames);
  }, [globalParameters, fixedFromUrlParamNames]);

  // Auto-hydrate on mount and URL changes
  React.useEffect(() => {
    if (!globalParameters || !fixedFromUrlParamNames || fixedFromUrlParamNames.length === 0) {
      return;
    }

    // Initial hydration
    hydrateParameters();

    // Listen for browser back/forward navigation
    const handlePopState = () => {
      hydrateParameters();
    };

    window.addEventListener("popstate", handlePopState);
    
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [hydrateParameters]);

  return hydrateParameters;
}
