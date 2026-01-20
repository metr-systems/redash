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

  test("should render without crashing", () => {
    // Setup URL parameters
    location.search = {
      p_user_id: "john_doe",
      p_status: "active",
    };

    const wrapper = mount(<FixedParameters parameterNames={["user_id", "status"]} parameters={mockParameters} />);

    // Just check that it renders
    expect(wrapper).toBeDefined();
    expect(wrapper.length).toBe(1);
  });

  test("should work with empty parameters", () => {
    const wrapper = mount(<FixedParameters parameterNames={[]} parameters={[]} />);

    expect(wrapper).toBeDefined();
  });

  test("should work with null props", () => {
    const wrapper = mount(<FixedParameters parameterNames={null} parameters={null} />);

    expect(wrapper).toBeDefined();
  });
});
