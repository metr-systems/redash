import location from "@/services/location";

/**
 * Validates if a back URL is safe to navigate to
 * @param {string} back - The back URL to validate
 * @returns {boolean} - Whether the URL is safe for navigation
 */
export function isValidBackUrl(back) {
  if (!back || typeof back !== "string") {
    return false;
  }

  // Only allow same-origin absolute URLs - no relative paths at all
  try {
    const parsed = new URL(back);
    return parsed.origin === window.location.origin;
  } catch (e) {
    return false;
  }
}

/**
 * Handles back navigation with support for URL parameter-based routing
 * @param {string} backUrl - Optional back URL from search params
 */
export function handleBackNavigation(backUrl = null) {
  // If no backUrl provided, try to get it from current location search params
  const back = backUrl || (location.search && location.search.back);

  if (isValidBackUrl(back)) {
    // Use app's `location.setPath` for same-origin absolute URLs only
    try {
      const parsed = new URL(back);
      const path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
      location.setPath(path);
      return;
    } catch (e) {
      // fallthrough to history.back()
    }
  }

  // If no valid `back` param, fall back to browser history
  window.history.back();
}

/**
 * Creates a back navigation handler for use in components
 * @returns {Function} - Handler function for back navigation
 */
export function createBackToOverviewHandler() {
  return () => handleBackNavigation();
}
