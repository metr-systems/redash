import React from "react";
import { mount } from "enzyme";
import BackButton from "../backButton";

// Mock the navigation service
jest.mock("@/services/navigation", () => ({
  createBackToOverviewHandler: jest.fn(() => jest.fn()),
}));

// Mock react-i18next
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

describe("BackButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders with custom backText when provided", () => {
    const wrapper = mount(<BackButton backText="Return to Main Dashboard" />);

    expect(wrapper.find("Button").text()).toBe("Return to Main Dashboard");
    expect(wrapper.find("Button")).toHaveLength(1);
  });

  test("renders with default text when backText not provided", () => {
    const wrapper = mount(<BackButton />);

    expect(wrapper.find("Button").text()).toBe("Back");
    expect(wrapper.find("Button")).toHaveLength(1);
  });

  test("renders with default text when backText is null", () => {
    const wrapper = mount(<BackButton backText={null} />);

    expect(wrapper.find("Button").text()).toBe("Back");
    expect(wrapper.find("Button")).toHaveLength(1);
  });

  test("uses default navigation handler", () => {
    const { createBackToOverviewHandler } = require("@/services/navigation");
    const mockHandler = jest.fn();
    createBackToOverviewHandler.mockReturnValue(mockHandler);

    const wrapper = mount(<BackButton />);
    wrapper.find("Button").simulate("click");
    
    expect(createBackToOverviewHandler).toHaveBeenCalled();
    expect(mockHandler).toHaveBeenCalledTimes(1);
  });

  test("uses custom className on container div", () => {
    const wrapper = mount(<BackButton className="custom-class" />);

    expect(wrapper.find("div.custom-class")).toHaveLength(1);
  });

  test("passes through additional button props", () => {
    const wrapper = mount(<BackButton disabled size="small" />);

    const button = wrapper.find("Button");
    expect(button.prop("disabled")).toBe(true);
    expect(button.prop("size")).toBe("small");
  });
});
