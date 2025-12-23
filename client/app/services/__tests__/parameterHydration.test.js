import { hydrateFixedFromUrlParameters } from "../parameterHydration";
import location from "../location";

// Mock the location service
jest.mock("../location", () => ({
  search: {},
}));

describe("parameterHydration service", () => {
  let mockParameters;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset location.search
    location.search = {};
    
    // Setup mock parameters
    mockParameters = [
      {
        name: "user_id",
        setValue: jest.fn(),
      },
      {
        name: "status",
        setValue: jest.fn(),
      },
      {
        name: "date_range",
        setValue: jest.fn(),
      },
    ];
  });

  describe("hydrateFixedFromUrlParameters", () => {
    it("should return early if no globalParameters provided", () => {
      const result = hydrateFixedFromUrlParameters(null, ["user_id"]);
      expect(result).toBeUndefined();
    });

    it("should return early if no fixedFromUrlParamNames provided", () => {
      const result = hydrateFixedFromUrlParameters(mockParameters, null);
      expect(result).toBeUndefined();
    });

    it("should return early if fixedFromUrlParamNames is empty", () => {
      const result = hydrateFixedFromUrlParameters(mockParameters, []);
      expect(result).toBeUndefined();
    });

    it("should hydrate parameters from URL search params", () => {
      location.search = {
        p_user_id: "123",
        p_status: "active",
      };

      const result = hydrateFixedFromUrlParameters(mockParameters, ["user_id", "status"]);

      expect(mockParameters[0].setValue).toHaveBeenCalledWith("123");
      expect(mockParameters[1].setValue).toHaveBeenCalledWith("active");
      expect(result).toBe(2);
    });

    it("should handle missing parameters in URL gracefully", () => {
      location.search = {
        p_user_id: "123",
        // p_status is missing
      };

      const result = hydrateFixedFromUrlParameters(mockParameters, ["user_id", "status"]);

      expect(mockParameters[0].setValue).toHaveBeenCalledWith("123");
      expect(mockParameters[1].setValue).not.toHaveBeenCalled();
      expect(result).toBe(1);
    });

    it("should handle parameters not found in globalParameters", () => {
      location.search = {
        p_user_id: "123",
        p_nonexistent: "value",
      };

      const result = hydrateFixedFromUrlParameters(mockParameters, ["user_id", "nonexistent"]);

      expect(mockParameters[0].setValue).toHaveBeenCalledWith("123");
      expect(result).toBe(1);
    });

    it("should handle empty URL search params", () => {
      location.search = {};

      const result = hydrateFixedFromUrlParameters(mockParameters, ["user_id", "status"]);

      expect(mockParameters[0].setValue).not.toHaveBeenCalled();
      expect(mockParameters[1].setValue).not.toHaveBeenCalled();
      expect(result).toBe(0);
    });

    it("should handle undefined values in URL params", () => {
      location.search = {
        p_user_id: undefined,
        p_status: "active",
      };

      const result = hydrateFixedFromUrlParameters(mockParameters, ["user_id", "status"]);

      expect(mockParameters[0].setValue).not.toHaveBeenCalled();
      expect(mockParameters[1].setValue).toHaveBeenCalledWith("active");
      expect(result).toBe(1);
    });

    it("should handle special characters in parameter values", () => {
      location.search = {
        p_user_id: "user@example.com",
        p_status: "active with spaces",
      };

      const result = hydrateFixedFromUrlParameters(mockParameters, ["user_id", "status"]);

      expect(mockParameters[0].setValue).toHaveBeenCalledWith("user@example.com");
      expect(mockParameters[1].setValue).toHaveBeenCalledWith("active with spaces");
      expect(result).toBe(2);
    });

    it("should use correct parameter key format", () => {
      location.search = {
        user_id: "123", // without p_ prefix
        p_user_id: "456", // with p_ prefix
      };

      const result = hydrateFixedFromUrlParameters(mockParameters, ["user_id"]);

      // Should only use the p_ prefixed version
      expect(mockParameters[0].setValue).toHaveBeenCalledWith("456");
      expect(mockParameters[0].setValue).not.toHaveBeenCalledWith("123");
      expect(result).toBe(1);
    });
  });
});
