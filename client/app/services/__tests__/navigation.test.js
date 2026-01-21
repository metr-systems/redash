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
    location.search = {}; // Reset location.search between tests
  });

  describe("isValidBackUrl", () => {
    it.each([
      { description: "null or undefined", input: null, expected: false },
      { description: "undefined", input: undefined, expected: false },
      { description: "non-string number", input: 123, expected: false },
      { description: "non-string object", input: {}, expected: false },
      { description: "root-relative path /dashboard", input: "/dashboard", expected: false },
      { description: "root-relative path /queries/123", input: "/queries/123", expected: false },
    ])("should return false for $description", ({ input, expected }) => {
      expect(isValidBackUrl(input)).toBe(expected);
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

    it.each([
      {
        description: "different-origin URLs",
        inputs: ["https://malicious.com/dashboard", "https://example.com/dashboard"],
      },
      { description: "invalid URLs", inputs: ["not-a-url"] },
      { description: "path traversal attacks", inputs: ["https://dashboard.staging.metr.systems/../../../etc/passwd"] },
      { description: "double slash redirect attacks", inputs: ["//malicious.com/dashboard"] },
      {
        description: "data URLs and other schemes",
        inputs: ["javascript:alert(1)", "data:text/html,<script>alert(1)</script>"],
      },
    ])("should return false for $description", ({ inputs }) => {
      inputs.forEach((input) => {
        expect(isValidBackUrl(input)).toBe(false);
      });
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
    it.each([
      { description: "null", input: null, expected: false },
      { description: "undefined", input: undefined, expected: false },
      { description: "non-string number", input: 123, expected: false },
      { description: "non-string object", input: {}, expected: false },
      { description: "valid text 'Back to Main Dashboard'", input: "Back to Main Dashboard", expected: true },
      { description: "valid text 'Return to Overview'", input: "Return to Overview", expected: true },
      { description: "valid text '← Go Back'", input: "← Go Back", expected: true },
    ])("should return $expected for $description", ({ input, expected }) => {
      expect(isValidBackText(input)).toBe(expected);
    });

    it.each([
      { description: "overly long text", input: () => "a".repeat(201), expected: false },
      { description: "text containing HTML script tags", input: "<script>alert('xss')</script>", expected: false },
      { description: "text containing HTML anchor tags", input: "Click <a href=''>here</a>", expected: false },
      { description: "text containing HTML bold tags", input: "<b>Bold text</b>", expected: false },
      { description: "text with special characters (non-HTML) ← Back", input: "← Back to Dashboard", expected: true },
      { description: "text with special characters (non-HTML) Back →", input: "Back → Main", expected: true },
      { description: "text with ampersand", input: "Return & Continue", expected: true },
      { description: "empty string", input: "", expected: false },
    ])("should return $expected for $description", ({ input, expected }) => {
      const testInput = typeof input === "function" ? input() : input;
      expect(isValidBackText(testInput)).toBe(expected);
    });
  });

  describe("handleBackNavigation", () => {
    it("should use location.setPath for valid same-origin absolute URLs", () => {
      location.search = {
        back: "https://dashboard.staging.metr.systems/staging/dashboards/61-overview-test-dashboard",
      };
      handleBackNavigation();
      expect(location.setPath).toHaveBeenCalledWith("/staging/dashboards/61-overview-test-dashboard");
      expect(window.history.back).not.toHaveBeenCalled();
    });

    it("should use location.setPath for valid same-origin absolute URLs with query params", () => {
      location.search = {
        back: "https://dashboard.staging.metr.systems/staging/dashboards/61-overview-test-dashboard?tab=overview",
      };
      handleBackNavigation();
      expect(location.setPath).toHaveBeenCalledWith("/staging/dashboards/61-overview-test-dashboard?tab=overview");
      expect(window.history.back).not.toHaveBeenCalled();
    });

    it("should fallback to history.back() for relative paths (not supported)", () => {
      location.search = {
        back: "/dashboard",
      };
      handleBackNavigation();
      expect(location.setPath).not.toHaveBeenCalled();
      expect(window.history.back).toHaveBeenCalled();
    });

    it("should fallback to history.back() for invalid URLs", () => {
      location.search = {
        back: "https://malicious.com/dashboard",
      };
      handleBackNavigation();
      expect(location.setPath).not.toHaveBeenCalled();
      expect(window.history.back).toHaveBeenCalled();
    });

    it("should fallback to history.back() when no URL provided", () => {
      location.search = {};
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
