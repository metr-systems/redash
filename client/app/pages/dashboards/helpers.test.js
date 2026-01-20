// Mock the location service
jest.mock("@/services/location", () => ({
  search: {},
}));

import { formatFixedValue, shouldDisplayButton } from "./helpers";
import mockLocation from "@/services/location";

describe("formatFixedValue", () => {
  test("returns '(missing)' for null, undefined and empty string", () => {
    expect(formatFixedValue(null)).toBe("(missing)");
    expect(formatFixedValue(undefined)).toBe("(missing)");
    expect(formatFixedValue("")).toBe("(missing)");
  });

  test("converts primitive values to their string representations", () => {
    expect(formatFixedValue(0)).toBe("0");
    expect(formatFixedValue(42)).toBe("42");
    expect(formatFixedValue(true)).toBe("true");
    expect(formatFixedValue(false)).toBe("false");
  });
});

describe("shouldDisplayButton", () => {
  beforeEach(() => {
    mockLocation.search = {};
  });

  test.each([
    [false, false, undefined],
    [false, false, "some-url"],
    [false, true, undefined],
    [false, true, ""],
    [false, true, null],
    [true, true, "https://example.com"],
    [true, true, "/path"],
  ])("should return %s when hasFixedParameters=%s and back=%s", (expected, hasFixed, back) => {
    if (back !== undefined) {
      mockLocation.search = { back };
    }
    expect(shouldDisplayButton(hasFixed)).toBe(expected);
  });

  test("should handle null/undefined location.search", () => {
    mockLocation.search = null;
    expect(shouldDisplayButton(true)).toBe(false);
    
    mockLocation.search = undefined;
    expect(shouldDisplayButton(true)).toBe(false);
  });
});
