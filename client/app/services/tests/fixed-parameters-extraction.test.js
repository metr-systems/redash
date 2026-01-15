import { extractFixedParameterNames } from "../../hooks/useFixedFromUrlParameters";

describe("Fixed From URL Parameters Integration", () => {
  describe("extractFixedParameterNames", () => {
    test("should extract parameter names from simple widget mappings", () => {
      const widgets = [
        {
          options: {
            parameterMappings: {
              widget_param1: { type: "fixed-from-url", mapTo: "user_id" },
              widget_param2: { type: "dashboard", mapTo: "status" },
              widget_param3: { type: "fixed-from-url", mapTo: "date_range" },
            },
          },
        },
      ];

      const result = extractFixedParameterNames(widgets);
      expect(result).toEqual(expect.arrayContaining(["user_id", "date_range"]));
      expect(result).not.toContain("status");
      expect(result).toHaveLength(2);
    });

    test("should handle multiple widgets with overlapping parameter names", () => {
      const widgets = [
        {
          options: {
            parameterMappings: {
              widget1_param1: { type: "fixed-from-url", mapTo: "user_id" },
              widget1_param2: { type: "fixed-from-url", mapTo: "status" },
            },
          },
        },
        {
          options: {
            parameterMappings: {
              widget2_param1: { type: "fixed-from-url", mapTo: "user_id" }, // Duplicate
              widget2_param2: { type: "fixed-from-url", mapTo: "date_range" },
              widget2_param3: { type: "dashboard", mapTo: "normal_param" },
            },
          },
        },
      ];

      const result = extractFixedParameterNames(widgets);
      expect(result).toEqual(expect.arrayContaining(["user_id", "status", "date_range"]));
      expect(result).not.toContain("normal_param");
      expect(result).toHaveLength(3); // Should deduplicate user_id
    });

    test("should handle widgets with no parameter mappings", () => {
      const widgets = [
        { options: {} },
        { options: { parameterMappings: null } },
        { options: { parameterMappings: {} } },
        {
          options: {
            parameterMappings: {
              widget_param1: { type: "fixed-from-url", mapTo: "user_id" },
            },
          },
        },
      ];

      const result = extractFixedParameterNames(widgets);
      expect(result).toEqual(["user_id"]);
    });

    test("should handle empty or malformed dashboard", () => {
      expect(extractFixedParameterNames(null)).toEqual([]);
      expect(extractFixedParameterNames([])).toEqual([]);
    });

    test("should handle complex real-world scenario", () => {
      const widgets = [
        {
          id: 1,
          options: {
            parameterMappings: {
              user_filter: { type: "fixed-from-url", mapTo: "current_user_id" },
              status_filter: { type: "dashboard", mapTo: "status_selector" },
              date_filter: { type: "fixed-from-url", mapTo: "report_date" },
            },
          },
        },
        {
          id: 2,
          options: {
            parameterMappings: {
              user_param: { type: "fixed-from-url", mapTo: "current_user_id" }, // Duplicate
              region_param: { type: "fixed-from-url", mapTo: "user_region" },
              custom_param: { type: "static", value: "hardcoded_value" },
            },
          },
        },
        {
          id: 3,
          options: {
            parameterMappings: {
              overview_filter: { type: "dashboard", mapTo: "overview_mode" },
            },
          },
        },
        {
          id: 4,
          // Widget with no options
        },
        {
          id: 5,
          options: null,
        },
      ];

      const result = extractFixedParameterNames(widgets);
      expect(result).toEqual(expect.arrayContaining(["current_user_id", "report_date", "user_region"]));
      expect(result).not.toContain("status_selector");
      expect(result).not.toContain("overview_mode");
      expect(result).toHaveLength(3);
    });

    test("should ignore non-fixed-from-url parameter types", () => {
      const widgets = [
        {
          options: {
            parameterMappings: {
              param1: { type: "dashboard", mapTo: "dashboard_param" },
              param2: { type: "widget", mapTo: "widget_param" },
              param3: { type: "static", value: "static_value" },
              param4: { type: "fixed-from-url", mapTo: "url_param" },
              param5: { type: "query", mapTo: "query_param" },
              param6: { type: "unknown", mapTo: "unknown_param" },
            },
          },
        },
      ];

      const result = extractFixedParameterNames(widgets);
      expect(result).toEqual(["url_param"]);
    });

    test("should handle widgets with malformed parameter mappings", () => {
      const widgets = [
        {
          options: {
            parameterMappings: {
              valid_param: { type: "fixed-from-url", mapTo: "valid_target" },
              missing_type: { mapTo: "no_type_target" },
              missing_map_to: { type: "fixed-from-url" },
              null_mapping: null,
              string_mapping: "invalid",
              empty_mapping: {},
            },
          },
        },
      ];

      const result = extractFixedParameterNames(widgets);
      expect(result).toEqual(["valid_target"]);
    });

    test("should maintain parameter order and uniqueness", () => {
      const widgets = [
        {
          options: {
            parameterMappings: {
              a: { type: "fixed-from-url", mapTo: "param_z" },
              b: { type: "fixed-from-url", mapTo: "param_a" },
              c: { type: "fixed-from-url", mapTo: "param_m" },
            },
          },
        },
        {
          options: {
            parameterMappings: {
              d: { type: "fixed-from-url", mapTo: "param_a" }, // Duplicate
              e: { type: "fixed-from-url", mapTo: "param_b" },
            },
          },
        },
      ];

      const result = extractFixedParameterNames(widgets);
      expect(result).toEqual(expect.arrayContaining(["param_z", "param_a", "param_m", "param_b"]));
      expect(result).toHaveLength(4); // Should not have duplicates

      // Check that param_a only appears once despite being in two widgets
      const paramACount = result.filter((p) => p === "param_a").length;
      expect(paramACount).toBe(1);
    });
  });
});
