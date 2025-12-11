import React from "react";
import { shallow } from "enzyme";
import { DashboardComponent } from "./DashboardPage";
import * as auth from "@/services/auth";

// Mock dependencies
jest.mock("@/services/auth");
jest.mock("./hooks/useDashboard", () => jest.fn());

const mockUseDashboard = require("./hooks/useDashboard");

describe("DashboardPage Parameter Visibility", () => {
  const mockDashboard = { id: 1 };
  const mockParameters = [{ name: "region", title: "Region" }];

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock configuration
    mockUseDashboard.mockReturnValue({
      dashboard: mockDashboard,
      globalParameters: [],
      refreshDashboard: jest.fn(),
      editingLayout: false,
    });
  });

  it("shows parameters for admin users", () => {
    auth.currentUser = { isAdmin: true };
    mockUseDashboard.mockReturnValue({
      dashboard: mockDashboard,
      globalParameters: mockParameters,
      refreshDashboard: jest.fn(),
      editingLayout: false,
    });

    const wrapper = shallow(<DashboardComponent dashboard={mockDashboard} />);

    expect(wrapper.find('[data-test="DashboardParameters"]')).toHaveLength(1);
  });

  it("shows parameters for default group users", () => {
    auth.currentUser = { isAdmin: false, is_default: true };
    mockUseDashboard.mockReturnValue({
      dashboard: mockDashboard,
      globalParameters: mockParameters,
      refreshDashboard: jest.fn(),
      editingLayout: false,
    });

    const wrapper = shallow(<DashboardComponent dashboard={mockDashboard} />);

    expect(wrapper.find('[data-test="DashboardParameters"]')).toHaveLength(1);
  });

  it("hides parameters for custom group users", () => {
    auth.currentUser = { isAdmin: false, is_default: false };
    mockUseDashboard.mockReturnValue({
      dashboard: mockDashboard,
      globalParameters: mockParameters,
      refreshDashboard: jest.fn(),
      editingLayout: false,
    });

    const wrapper = shallow(<DashboardComponent dashboard={mockDashboard} />);

    expect(wrapper.find('[data-test="DashboardParameters"]')).toHaveLength(0);
  });

  it("does not show parameters when none exist", () => {
    auth.currentUser = { isAdmin: true };
    mockUseDashboard.mockReturnValue({
      dashboard: mockDashboard,
      globalParameters: [], // No parameters
      refreshDashboard: jest.fn(),
      editingLayout: false,
    });

    const wrapper = shallow(<DashboardComponent dashboard={mockDashboard} />);

    expect(wrapper.find('[data-test="DashboardParameters"]')).toHaveLength(0);
  });
});
