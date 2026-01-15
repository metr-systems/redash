import React from "react";
import { mount } from "enzyme";
import FixedParametersList from "../FixedParametersList";
import location from "@/services/location";

// Mock the location service
jest.mock("@/services/location", () => ({
  search: {},
}));

// Mock formatFixedValue utility
jest.mock("../../pages/dashboards/helpers", () => ({
  formatFixedValue: jest.fn((value) => String(value || "")),
}));

describe("FixedParametersList - Dropdown Value Resolution", () => {
  const mockQueryParameter = {
    name: "status",
    title: "Status",
    type: "query",
    queryId: 123,
    normalizedValue: "active",
    loadDropdownValues: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    location.search = {};
    mockQueryParameter.loadDropdownValues.mockResolvedValue([
      { value: "active", name: "Active Status" },
      { value: "inactive", name: "Inactive Status" },
      { value: "pending", name: "Pending Approval" },
    ]);
  });

  test("shows empty value when URL param missing", async () => {
    location.search = {}; // No URL parameter

    const wrapper = mount(<FixedParametersList parameterNames={["status"]} parameters={[mockQueryParameter]} />);

    await new Promise((resolve) => setTimeout(resolve, 0));
    wrapper.update();

    const valueDisplay = wrapper.find('[data-test="FixedFromUrlValue-status"]');
    expect(valueDisplay.first().text()).toBe(""); // Should be empty when no URL param
  });

  test("falls back to raw value when dropdown option not found", async () => {
    location.search = { p_status: "unknown_status" };

    const wrapper = mount(<FixedParametersList parameterNames={["status"]} parameters={[mockQueryParameter]} />);

    await new Promise((resolve) => setTimeout(resolve, 0));
    wrapper.update();

    const valueDisplay = wrapper.find('[data-test="FixedFromUrlValue-status"]');
    expect(valueDisplay.first().text()).toBe("unknown_status");
  });

  test("handles numeric dropdown values correctly", async () => {
    mockQueryParameter.loadDropdownValues.mockResolvedValue([
      { value: 1, name: "First Option" },
      { value: 2, name: "Second Option" },
    ]);
    location.search = { p_status: "1" };

    const wrapper = mount(<FixedParametersList parameterNames={["status"]} parameters={[mockQueryParameter]} />);

    await new Promise((resolve) => setTimeout(resolve, 0));
    wrapper.update();

    const valueDisplay = wrapper.find('[data-test="FixedFromUrlValue-status"]');
    expect(valueDisplay.first().text()).toBe("First Option");
  });

  test("does not load dropdown options for non-query parameters", () => {
    const textParameter = {
      name: "user_id",
      title: "User ID",
      type: "text",
      normalizedValue: "default_user",
    };

    mount(<FixedParametersList parameterNames={["user_id"]} parameters={[textParameter]} />);

    expect(mockQueryParameter.loadDropdownValues).not.toHaveBeenCalled();
  });

  test("handles parameters without loadDropdownValues method", () => {
    const invalidQueryParam = {
      name: "status",
      title: "Status",
      type: "query",
      normalizedValue: "active",
      // missing loadDropdownValues
    };

    expect(() => {
      mount(<FixedParametersList parameterNames={["status"]} parameters={[invalidQueryParam]} />);
    }).not.toThrow();
  });

  test("handles empty dropdown options", async () => {
    mockQueryParameter.loadDropdownValues.mockResolvedValue([]);
    location.search = { p_status: "active" };

    const wrapper = mount(<FixedParametersList parameterNames={["status"]} parameters={[mockQueryParameter]} />);

    await new Promise((resolve) => setTimeout(resolve, 0));
    wrapper.update();

    const valueDisplay = wrapper.find('[data-test="FixedFromUrlValue-status"]');
    expect(valueDisplay.first().text()).toBe("active");
  });
});
