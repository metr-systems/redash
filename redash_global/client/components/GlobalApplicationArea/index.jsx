import React from "react";

import { registerComponent } from "@/components/DynamicComponent";
import ApplicationLayout from "@/components/ApplicationArea/ApplicationLayout";

import GlobalDesktopNavbar from "./GlobalDesktopNavbar";

registerComponent("ApplicationDesktopNavbar", GlobalDesktopNavbar);

export default function GlobalApplicationArea() {
  return (
    <ApplicationLayout>
      <div style={{ padding: "30px 15px" }}>
        <div className="bg-white tiled p-15">
          <h4>Global Admin</h4>
        </div>
      </div>
    </ApplicationLayout>
  );
}
