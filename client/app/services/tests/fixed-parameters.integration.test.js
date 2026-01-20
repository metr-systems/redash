import React from "react";
import { mount } from "enzyme";
import FixedParameters from "../../components/FixedParameters";
import location from "../../services/location";
import { formatFixedValue } from "../../pages/dashboards/helpers";

// Mock the location service
jest.mock("../../services/location", () => ({
  search: {},
}));

// Mock formatFixedValue utility
jest.mock("../../pages/dashboards/helpers", () => ({
  formatFixedValue: jest.fn((value) => {
    if (value == null || value === "") return "(missing)";
    return String(value);
  }),
}));

describe("FixedParameters URL Integration", () => {
  const mockParameters = [
    { name: "user_id", title: "User ID", type: "text", normalizedValue: "default_user" },
    { name: "status", title: "Status", type: "select", normalizedValue: "default_status" },
    { name: "date_range", title: "Date Range", type: "date", normalizedValue: null },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    location.search = {};
  });

  test.each([
    {
      description: "should render fixed parameters with URL values",
      setup: () => {
        location.search = {
          p_user_id: "john_doe",
          p_status: "active",
        };
      },
      parameterNames: ["user_id", "status"],
      parameters: [
        { name: "user_id", title: "User ID", type: "text", normalizedValue: "default_user" },
        { name: "status", title: "Status", type: "select", normalizedValue: "default_status" },
        { name: "date_range", title: "Date Range", type: "date", normalizedValue: null },
      ],
      expectedParameterCount: 2,
      expectedValues: {
        user_id: "john_doe",
        status: "active",
      },
    },
    {
      description: "should render with missing URL values",
      setup: () => {
        location.search = {};
      },
      parameterNames: ["user_id", "status"],
      parameters: [
        { name: "user_id", title: "User ID", type: "text", normalizedValue: "default_user" },
        { name: "status", title: "Status", type: "select", normalizedValue: "default_status" },
      ],
      expectedParameterCount: 2,
      expectedValues: {
        user_id: "(missing)",
        status: "(missing)",
      },
    },
    {
      description: "should work with empty parameters",
      setup: () => {},
      parameterNames: [],
      parameters: [],
      expectedParameterCount: 0,
    },
    {
      description: "should work with null props",
      setup: () => {},
      parameterNames: null,
      parameters: null,
      expectedParameterCount: 0,
    },
  ])("$description", ({ setup, parameterNames, parameters, expectedParameterCount, expectedValues }) => {
    setup();
    const wrapper = mount(<FixedParameters parameterNames={parameterNames} parameters={parameters} />);

    expect(wrapper).toBeDefined();

    // Check that the correct number of parameter displays are rendered
    const parameterDisplays = wrapper.find(".parameter-block");
    expect(parameterDisplays).toHaveLength(expectedParameterCount);
  });
});
