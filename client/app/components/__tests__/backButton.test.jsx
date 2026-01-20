import React from "react";
import { mount } from "enzyme";
import BackButton from "../backButton";

// Mock the navigation service
jest.mock("@/services/navigation", () => ({
  createBackToOverviewHandler: jest.fn(() => jest.fn()),
  isValidBackText: jest.fn(),
}));

// Mock the location service
jest.mock("@/services/location", () => ({
  search: {},
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
    // Reset location mock
    const location = require("@/services/location");
    location.search = {};
  });

  test("renders with default text when no URL parameters", () => {
    const wrapper = mount(<BackButton />);

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

  test("extracts backText from URL parameters", () => {
    const { isValidBackText } = require("@/services/navigation");
    const location = require("@/services/location");

    // Mock URL parameters
    location.search = { backText: "Return to Overview" };
    isValidBackText.mockReturnValue(true);

    const wrapper = mount(<BackButton />);

    expect(wrapper.find("Button").text()).toBe("Return to Overview");
    expect(isValidBackText).toHaveBeenCalledWith("Return to Overview");
  });

  test("uses default text when URL backText is invalid", () => {
    const { isValidBackText } = require("@/services/navigation");
    const location = require("@/services/location");

    // Mock URL parameters with invalid backText
    location.search = { backText: "<script>alert('xss')</script>" };
    isValidBackText.mockReturnValue(false);

    const wrapper = mount(<BackButton />);

    expect(wrapper.find("Button").text()).toBe("Back");
    expect(isValidBackText).toHaveBeenCalledWith("<script>alert('xss')</script>");
  });

  test("uses default text when URL backText is not a string", () => {
    const location = require("@/services/location");

    // Mock URL parameters with non-string backText
    location.search = { backText: 123 };

    const wrapper = mount(<BackButton />);

    expect(wrapper.find("Button").text()).toBe("Back");
  });
});
