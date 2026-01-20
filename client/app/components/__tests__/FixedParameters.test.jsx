import React from "react";
import { act } from "react-dom/test-utils";
import { mount } from "enzyme";
import FixedParameters from "../FixedParameters";
import location from "@/services/location";

// Mock the location service
jest.mock("@/services/location", () => ({
  search: {},
}));

// Mock formatFixedValue utility
jest.mock("../../pages/dashboards/helpers", () => ({
  formatFixedValue: jest.fn((value) => String(value || "")),
}));

describe("FixedParameters - Dropdown Value Resolution", () => {
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

  test.each([
    {
      description: "shows empty value when URL param missing",
      urlSearch: {},
      dropdownValues: [
        { value: "active", name: "Active Status" },
        { value: "inactive", name: "Inactive Status" },
        { value: "pending", name: "Pending Approval" },
      ],
      expectedText: "",
    },
    {
      description: "falls back to raw value when dropdown option not found",
      urlSearch: { p_status: "unknown_status" },
      dropdownValues: [
        { value: "active", name: "Active Status" },
        { value: "inactive", name: "Inactive Status" },
        { value: "pending", name: "Pending Approval" },
      ],
      expectedText: "unknown_status",
    },
    {
      description: "handles numeric dropdown values correctly",
      urlSearch: { p_status: "1" },
      dropdownValues: [
        { value: 1, name: "First Option" },
        { value: 2, name: "Second Option" },
      ],
      expectedText: "First Option",
    },
  ])("$description", async ({ urlSearch, dropdownValues, expectedText }) => {
    mockQueryParameter.loadDropdownValues.mockResolvedValue(dropdownValues);
    location.search = urlSearch;

    const wrapper = mount(<FixedParameters parameterNames={["status"]} parameters={[mockQueryParameter]} />);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    wrapper.update();

    const valueDisplay = wrapper.find('[data-test="FixedFromUrlValue-status"]');
    expect(valueDisplay.first().text()).toBe(expectedText);
  });

  test("does not load dropdown options for non-query parameters", () => {
    const textParameter = {
      name: "user_id",
      title: "User ID",
      type: "text",
      normalizedValue: "default_user",
    };

    mount(<FixedParameters parameterNames={["user_id"]} parameters={[textParameter]} />);

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
      mount(<FixedParameters parameterNames={["status"]} parameters={[invalidQueryParam]} />);
    }).not.toThrow();
  });

  test("handles empty dropdown options", async () => {
    mockQueryParameter.loadDropdownValues.mockResolvedValue([]);
    location.search = { p_status: "active" };

    const wrapper = mount(<FixedParameters parameterNames={["status"]} parameters={[mockQueryParameter]} />);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    wrapper.update();

    const valueDisplay = wrapper.find('[data-test="FixedFromUrlValue-status"]');
    expect(valueDisplay.first().text()).toBe("active");
  });
});
