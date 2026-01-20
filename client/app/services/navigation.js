import location from "@/services/location";

/**
 * Validates if a backText parameter is safe to display
 * @param {string} backText - The back text to validate
 * @returns {boolean} - Whether the text is safe for display
 */
export function isValidBackText(backText) {
  if (!backText || typeof backText !== "string") {
    return false;
  }

  // Check for overly long text (security measure)
  if (backText.length > 200) {
    return false;
  }

  // Basic XSS protection - no HTML tags allowed
  if (/<[^>]*>/.test(backText)) {
    return false;
  }

  return true;
}

/**
 * Validates if a back URL is safe to navigate to
 * @param {string} back - The back URL to validate
 * @returns {boolean} - Whether the URL is safe for navigation
 */
export function isValidBackUrl(back) {
  if (!back || typeof back !== "string") {
    return false;
  }

  // Check for overly long URLs (security measure against DoS attacks)
  if (back.length > 2000) {
    return false;
  }

  // Check for path traversal attacks in the original URL string before parsing
  if (back.includes("../")) {
    return false;
  }

  // Only allow same-origin absolute URLs - no relative paths at all
  try {
    const parsed = new URL(back);

    // Check origin
    if (parsed.origin !== window.location.origin) {
      return false;
    }

    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Handles back navigation with support for URL parameter-based routing
 * Note: backText parameter is handled separately in components for display
 */
export function handleBackNavigation() {
  // Get back URL from current location search params
  const back = location.search && location.search.back;

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
