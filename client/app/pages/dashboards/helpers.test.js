import { formatFixedValue } from "./helpers";

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
