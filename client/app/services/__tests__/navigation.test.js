import { isValidBackUrl, handleBackNavigation } from "../navigation";
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
    origin: "https://example.com",
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

    it("should return true for root-relative paths", () => {
      expect(isValidBackUrl("/dashboard")).toBe(true);
      expect(isValidBackUrl("/queries/123")).toBe(true);
    });

    it("should return true for same-origin absolute URLs", () => {
      expect(isValidBackUrl("https://example.com/dashboard")).toBe(true);
    });

    it("should return false for different-origin URLs", () => {
      expect(isValidBackUrl("https://malicious.com/dashboard")).toBe(false);
    });

    it("should return false for invalid URLs", () => {
      expect(isValidBackUrl("not-a-url")).toBe(false);
    });

    it("should return false for path traversal attacks", () => {
      expect(isValidBackUrl("/dashboard/../../../etc/passwd")).toBe(false);
      expect(isValidBackUrl("/dashboard/..")).toBe(false);
      expect(isValidBackUrl("/../admin")).toBe(false);
    });

    it("should return false for double slash attacks", () => {
      expect(isValidBackUrl("//malicious.com/dashboard")).toBe(false);
      expect(isValidBackUrl("/dashboard//redirect")).toBe(false);
    });

    it("should return false for backslash attacks", () => {
      expect(isValidBackUrl("/dashboard\\..\\admin")).toBe(false);
    });

    it("should return false for data URLs and other schemes", () => {
      expect(isValidBackUrl("/javascript:alert(1)")).toBe(false);
      expect(isValidBackUrl("/data:text/html,<script>alert(1)</script>")).toBe(false);
    });

    it("should return false for overly long URLs", () => {
      const longUrl = "/" + "a".repeat(2001);
      expect(isValidBackUrl(longUrl)).toBe(false);
    });

    it("should return true for valid query strings and hash fragments", () => {
      expect(isValidBackUrl("/?tab=overview")).toBe(true);
      expect(isValidBackUrl("/#dashboard")).toBe(true);
    });
  });

  describe("handleBackNavigation", () => {
    it("should use location.setPath for valid relative URLs", () => {
      handleBackNavigation("/dashboard");
      expect(location.setPath).toHaveBeenCalledWith("/dashboard");
      expect(window.history.back).not.toHaveBeenCalled();
    });

    it("should use location.setPath for valid same-origin absolute URLs", () => {
      handleBackNavigation("https://example.com/dashboard?tab=overview");
      expect(location.setPath).toHaveBeenCalledWith("/dashboard?tab=overview");
      expect(window.history.back).not.toHaveBeenCalled();
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
      location.search = { back: "/dashboard" };
      handleBackNavigation();
      expect(location.setPath).toHaveBeenCalledWith("/dashboard");
    });
  });
});
