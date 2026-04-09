import React, { useState, useEffect } from "react";

import { registerComponent } from "@/components/DynamicComponent";
import ApplicationLayout from "@/components/ApplicationArea/ApplicationLayout";
import Router from "@/components/ApplicationArea/Router";
import handleNavigationIntent from "@/components/ApplicationArea/handleNavigationIntent";
import ErrorMessage from "@/components/ApplicationArea/ErrorMessage";

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
  const [currentRoute, setCurrentRoute] = useState(null);
  const [unhandledError, setUnhandledError] = useState(null);

  useEffect(() => {
    if (currentRoute && currentRoute.title) {
      document.title = currentRoute.title;
    }
  }, [currentRoute]);

  useEffect(() => {
    function globalErrorHandler(event) {
      event.preventDefault();
      setUnhandledError(event.error);
    }

    document.body.addEventListener("click", handleNavigationIntent, false);
    window.addEventListener("error", globalErrorHandler, false);

    return () => {
      document.body.removeEventListener("click", handleNavigationIntent, false);
      window.removeEventListener("error", globalErrorHandler, false);
    };
  }, []);

  if (unhandledError) {
    return <ErrorMessage error={unhandledError} />;
  }

  return (
    <ApplicationLayout>
      <Router routes={routes} onRouteChange={setCurrentRoute} />
    </ApplicationLayout>
  );
}
