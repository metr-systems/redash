import React from "react";
import { mount } from "enzyme";
import { useFixedFromUrlParameters } from "../useFixedFromUrlParameters";

// Mock the parameter hydration service
jest.mock("@/services/parameterHydration", () => ({
  useFixedFromUrlParameterHydration: jest.fn(() => jest.fn()),
}));

// Test component that uses the hook
function TestComponent({ widgets, globalParameters }) {
  const result = useFixedFromUrlParameters(widgets, globalParameters);
  return (
    <div>
      <div data-test="parameterNames">{JSON.stringify(result.parameterNames)}</div>
      <div data-test="hasFixedParameters">{result.hasFixedParameters.toString()}</div>
      <div data-test="count">{result.count}</div>
      <div data-test="parameters">{JSON.stringify(result.parameters.map(p => p?.name))}</div>
    </div>
  );
}

describe("useFixedFromUrlParameters", () => {
  const mockGlobalParameters = [
    { name: "user_id", title: "User ID" },
    { name: "status", title: "Status" },
    { name: "date_range", title: "Date Range" },
  ];

  const mockWidgets = [
    {
      options: {
        parameterMappings: {
          param1: { type: "fixed-from-url", mapTo: "user_id" },
          param2: { type: "fixed-from-url", mapTo: "status" },
          param3: { type: "dashboard", mapTo: "other_param" }, // not fixed-from-url
        },
      },
    },
    {
      options: {
        parameterMappings: {
          param4: { type: "fixed-from-url", mapTo: "date_range" },
          param5: { type: "static", value: "test" }, // not fixed-from-url
        },
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should extract fixed-from-url parameter names correctly", () => {
    const wrapper = mount(
      <TestComponent widgets={mockWidgets} globalParameters={mockGlobalParameters} />
    );

    const parameterNames = JSON.parse(wrapper.find('[data-test="parameterNames"]').text());
    const hasFixedParameters = wrapper.find('[data-test="hasFixedParameters"]').text() === "true";
    const count = parseInt(wrapper.find('[data-test="count"]').text());

    expect(parameterNames).toEqual(["user_id", "status", "date_range"]);
    expect(hasFixedParameters).toBe(true);
    expect(count).toBe(3);
  });

  it("should return matching parameter objects", () => {
    const wrapper = mount(
      <TestComponent widgets={mockWidgets} globalParameters={mockGlobalParameters} />
    );

    const parameters = JSON.parse(wrapper.find('[data-test="parameters"]').text());
    expect(parameters).toEqual(["user_id", "status", "date_range"]);
  });

  it("should handle empty widgets array", () => {
    const wrapper = mount(
      <TestComponent widgets={[]} globalParameters={mockGlobalParameters} />
    );

    const parameterNames = JSON.parse(wrapper.find('[data-test="parameterNames"]').text());
    const hasFixedParameters = wrapper.find('[data-test="hasFixedParameters"]').text() === "true";
    const count = parseInt(wrapper.find('[data-test="count"]').text());

    expect(parameterNames).toEqual([]);
    expect(hasFixedParameters).toBe(false);
    expect(count).toBe(0);
  });

  it("should handle null/undefined widgets", () => {
    const wrapper = mount(
      <TestComponent widgets={null} globalParameters={mockGlobalParameters} />
    );

    const parameterNames = JSON.parse(wrapper.find('[data-test="parameterNames"]').text());
    const hasFixedParameters = wrapper.find('[data-test="hasFixedParameters"]').text() === "true";

    expect(parameterNames).toEqual([]);
    expect(hasFixedParameters).toBe(false);
  });

  it("should handle widgets without parameter mappings", () => {
    const widgetsWithoutMappings = [
      { options: {} },
      { options: { parameterMappings: {} } },
      {},
    ];

    const wrapper = mount(
      <TestComponent widgets={widgetsWithoutMappings} globalParameters={mockGlobalParameters} />
    );

    const parameterNames = JSON.parse(wrapper.find('[data-test="parameterNames"]').text());
    const hasFixedParameters = wrapper.find('[data-test="hasFixedParameters"]').text() === "true";

    expect(parameterNames).toEqual([]);
    expect(hasFixedParameters).toBe(false);
  });

  it("should handle missing global parameters", () => {
    const wrapper = mount(
      <TestComponent widgets={mockWidgets} globalParameters={null} />
    );

    const parameterNames = JSON.parse(wrapper.find('[data-test="parameterNames"]').text());
    const parameters = JSON.parse(wrapper.find('[data-test="parameters"]').text());
    const hasFixedParameters = wrapper.find('[data-test="hasFixedParameters"]').text() === "true";

    expect(parameterNames).toEqual(["user_id", "status", "date_range"]);
    expect(parameters).toEqual([]);
    expect(hasFixedParameters).toBe(true);
  });

  it("should filter out parameters not found in global parameters", () => {
    const limitedGlobalParams = [{ name: "user_id", title: "User ID" }];

    const wrapper = mount(
      <TestComponent widgets={mockWidgets} globalParameters={limitedGlobalParams} />
    );

    const parameterNames = JSON.parse(wrapper.find('[data-test="parameterNames"]').text());
    const parameters = JSON.parse(wrapper.find('[data-test="parameters"]').text());

    expect(parameterNames).toEqual(["user_id", "status", "date_range"]);
    expect(parameters).toEqual(["user_id"]); // Only user_id found in global parameters
  });

  it("should avoid duplicate parameter names", () => {
    const widgetsWithDuplicates = [
      {
        options: {
          parameterMappings: {
            param1: { type: "fixed-from-url", mapTo: "user_id" },
            param2: { type: "fixed-from-url", mapTo: "user_id" }, // duplicate
          },
        },
      },
    ];

    const wrapper = mount(
      <TestComponent widgets={widgetsWithDuplicates} globalParameters={mockGlobalParameters} />
    );

    const parameterNames = JSON.parse(wrapper.find('[data-test="parameterNames"]').text());
    const count = parseInt(wrapper.find('[data-test="count"]').text());

    expect(parameterNames).toEqual(["user_id"]);
    expect(count).toBe(1);
  });

  it("should ignore mappings without mapTo property", () => {
    const widgetsWithInvalidMappings = [
      {
        options: {
          parameterMappings: {
            param1: { type: "fixed-from-url" }, // no mapTo
            param2: { type: "fixed-from-url", mapTo: "user_id" },
          },
        },
      },
    ];

    const wrapper = mount(
      <TestComponent widgets={widgetsWithInvalidMappings} globalParameters={mockGlobalParameters} />
    );

    const parameterNames = JSON.parse(wrapper.find('[data-test="parameterNames"]').text());
    expect(parameterNames).toEqual(["user_id"]);
  });
});
