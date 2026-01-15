import { isValidBackUrl, isValidBackText, handleBackNavigation } from "../navigation";
import location from "../location";

// Mock the location service
jest.mock("../location", () => ({
  setPath: jest.fn(),
  search: {},
}));

// Mock window.history.back
Object.defineProperty(window, "history", {
  value: {
    back: jest.fn(),
  },
  writable: true,
});

// Mock window.location
Object.defineProperty(window, "location", {
  value: {
    origin: "https://dashboard.staging.metr.systems",
  },
  writable: true,
});

describe("navigation service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("isValidBackUrl", () => {
    it("should return false for null or undefined", () => {
      expect(isValidBackUrl(null)).toBe(false);
      expect(isValidBackUrl(undefined)).toBe(false);
    });

    it("should return false for non-string values", () => {
      expect(isValidBackUrl(123)).toBe(false);
      expect(isValidBackUrl({})).toBe(false);
    });

    it("should return false for root-relative paths", () => {
      expect(isValidBackUrl("/dashboard")).toBe(false);
      expect(isValidBackUrl("/queries/123")).toBe(false);
    });

    it("should return true for same-origin absolute URLs", () => {
      expect(
        isValidBackUrl("https://dashboard.staging.metr.systems/staging/dashboards/61-overview-test-dashboard")
      ).toBe(true);
    });

    it("should support the required metr.systems dashboard URL format", () => {
      const backUrl = "https://dashboard.staging.metr.systems/staging/dashboards/61-overview-test-dashboard";
      expect(isValidBackUrl(backUrl)).toBe(true);
    });

    it("should return false for different-origin URLs", () => {
      expect(isValidBackUrl("https://malicious.com/dashboard")).toBe(false);
      expect(isValidBackUrl("https://example.com/dashboard")).toBe(false);
    });

    it("should return false for invalid URLs", () => {
      expect(isValidBackUrl("not-a-url")).toBe(false);
    });

    it("should return false for path traversal attacks", () => {
      expect(isValidBackUrl("https://dashboard.staging.metr.systems/../../../etc/passwd")).toBe(false);
    });

    it("should return false for double slash redirect attacks", () => {
      expect(isValidBackUrl("//malicious.com/dashboard")).toBe(false);
    });

    it("should return false for data URLs and other schemes", () => {
      expect(isValidBackUrl("javascript:alert(1)")).toBe(false);
      expect(isValidBackUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
    });

    it("should return false for overly long URLs", () => {
      const longUrl = "https://dashboard.staging.metr.systems/" + "a".repeat(2001);
      expect(isValidBackUrl(longUrl)).toBe(false);
    });

    it("should return true for valid absolute URLs with query strings and hash fragments", () => {
      expect(
        isValidBackUrl(
          "https://dashboard.staging.metr.systems/staging/dashboards/61-overview-test-dashboard?tab=overview"
        )
      ).toBe(true);
      expect(
        isValidBackUrl("https://dashboard.staging.metr.systems/staging/dashboards/61-overview-test-dashboard#dashboard")
      ).toBe(true);
    });
  });

  describe("isValidBackText", () => {
    it("should return false for null or undefined", () => {
      expect(isValidBackText(null)).toBe(false);
      expect(isValidBackText(undefined)).toBe(false);
    });

    it("should return false for non-string values", () => {
      expect(isValidBackText(123)).toBe(false);
      expect(isValidBackText({})).toBe(false);
    });

    it("should return true for valid text", () => {
      expect(isValidBackText("Back to Main Dashboard")).toBe(true);
      expect(isValidBackText("Return to Overview")).toBe(true);
      expect(isValidBackText("← Go Back")).toBe(true);
    });

    it("should return false for overly long text", () => {
      const longText = "a".repeat(201);
      expect(isValidBackText(longText)).toBe(false);
    });

    it("should return false for text containing HTML tags", () => {
      expect(isValidBackText("<script>alert('xss')</script>")).toBe(false);
      expect(isValidBackText("Click <a href=''>here</a>")).toBe(false);
      expect(isValidBackText("<b>Bold text</b>")).toBe(false);
    });

    it("should return true for text with special characters (non-HTML)", () => {
      expect(isValidBackText("← Back to Dashboard")).toBe(true);
      expect(isValidBackText("Back → Main")).toBe(true);
      expect(isValidBackText("Return & Continue")).toBe(true);
    });

    it("should return true for empty string", () => {
      expect(isValidBackText("")).toBe(false);
    });
  });

  describe("handleBackNavigation", () => {
    it("should use location.setPath for valid same-origin absolute URLs", () => {
      handleBackNavigation("https://dashboard.staging.metr.systems/staging/dashboards/61-overview-test-dashboard");
      expect(location.setPath).toHaveBeenCalledWith("/staging/dashboards/61-overview-test-dashboard");
      expect(window.history.back).not.toHaveBeenCalled();
    });

    it("should use location.setPath for valid same-origin absolute URLs with query params", () => {
      handleBackNavigation(
        "https://dashboard.staging.metr.systems/staging/dashboards/61-overview-test-dashboard?tab=overview"
      );
      expect(location.setPath).toHaveBeenCalledWith("/staging/dashboards/61-overview-test-dashboard?tab=overview");
      expect(window.history.back).not.toHaveBeenCalled();
    });

    it("should fallback to history.back() for relative paths (not supported)", () => {
      handleBackNavigation("/dashboard");
      expect(location.setPath).not.toHaveBeenCalled();
      expect(window.history.back).toHaveBeenCalled();
    });

    it("should fallback to history.back() for invalid URLs", () => {
      handleBackNavigation("https://malicious.com/dashboard");
      expect(location.setPath).not.toHaveBeenCalled();
      expect(window.history.back).toHaveBeenCalled();
    });

    it("should fallback to history.back() when no URL provided", () => {
      handleBackNavigation();
      expect(window.history.back).toHaveBeenCalled();
    });

    it("should get back URL from location.search when no parameter provided", () => {
      location.search = {
        back: "https://dashboard.staging.metr.systems/staging/dashboards/61-overview-test-dashboard",
      };
      handleBackNavigation();
      expect(location.setPath).toHaveBeenCalledWith("/staging/dashboards/61-overview-test-dashboard");
    });
  });
});
