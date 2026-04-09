import React, { useEffect } from "react";

import { registerComponent } from "@/components/DynamicComponent";
import ApplicationLayout from "@/components/ApplicationArea/ApplicationLayout";
import Router from "@/components/ApplicationArea/Router";
import handleNavigationIntent from "@/components/ApplicationArea/handleNavigationIntent";

import GlobalDesktopNavbar from "./GlobalDesktopNavbar";
import GlobalDashboardList from "./GlobalDashboardList";

registerComponent("ApplicationDesktopNavbar", GlobalDesktopNavbar);

const routes = [
  {
    id: "GlobalDashboards.List",
    path: "/dashboards",
    title: "Dashboards",
    render: () => <GlobalDashboardList />,
  },
  {
    id: "GlobalHome",
    path: "/",
    title: "Global Admin",
    render: () => <GlobalDashboardList />,
  },
];

export default function GlobalApplicationArea() {
  useEffect(() => {
    document.body.addEventListener("click", handleNavigationIntent, false);
    return () => {
      document.body.removeEventListener("click", handleNavigationIntent, false);
    };
  }, []);

  return (
    <ApplicationLayout>
      <Router routes={routes} onRouteChange={() => {}} />
    </ApplicationLayout>
  );
}
