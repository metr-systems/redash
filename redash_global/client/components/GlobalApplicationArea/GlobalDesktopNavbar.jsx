import React, { useState, useEffect } from "react";
import { includes } from "lodash";
import Menu from "antd/lib/menu";

import Link from "@/components/Link";
import logoUrl from "@/assets/images/redash_icon_small.png";
import DesktopOutlinedIcon from "@ant-design/icons/DesktopOutlined";
import AppstoreOutlinedIcon from "@ant-design/icons/AppstoreOutlined";
import PoweroffOutlinedIcon from "@ant-design/icons/PoweroffOutlined";
import { useCurrentRoute } from "@/components/ApplicationArea/Router";
import { axios } from "@/services/axios";

import "@/components/ApplicationArea/ApplicationLayout/DesktopNavbar.less";

function NavbarSection({ children, ...props }) {
  return (
    <Menu selectable={false} mode="vertical" theme="dark" {...props}>
      {children}
    </Menu>
  );
}

export default function GlobalDesktopNavbar() {
  const currentRoute = useCurrentRoute();
  const isComposedActive = includes(["ComposedDashboards.List", "GlobalHome"], currentRoute && currentRoute.id);
  const [redashUrl, setRedashUrl] = useState("");

  useEffect(() => {
    axios.get("/global-api/config").then((data) => setRedashUrl(data.redash_url || ""));
  }, []);

  return (
    <nav className="desktop-navbar">
      <NavbarSection className="desktop-navbar-logo">
        <div role="menuitem">
          <Link href="./">
            <img src={logoUrl} alt="Redash" />
          </Link>
        </div>
      </NavbarSection>

      <NavbarSection>
        <Menu.Item key="composed-dashboards" className={isComposedActive ? "navbar-active-item" : null}>
          <Link href="composed-dashboards">
            <DesktopOutlinedIcon />
            <span className="desktop-navbar-label">Composed<br />Dashboards</span>
          </Link>
        </Menu.Item>
        {redashUrl && (
          <Menu.Item key="dashboards">
            <a href={`${redashUrl}/dashboards`} target="_blank" rel="noopener noreferrer" data-skip-router>
              <AppstoreOutlinedIcon />
              <span className="desktop-navbar-label">Dashboards</span>
            </a>
          </Menu.Item>
        )}
      </NavbarSection>

      <NavbarSection className="desktop-navbar-spacer" />

      <NavbarSection>
        <Menu.Item key="logout">
          <a href="/global-api/admin/logout" data-skip-router>
            <PoweroffOutlinedIcon />
            <span className="desktop-navbar-label">Logout</span>
          </a>
        </Menu.Item>
      </NavbarSection>
    </nav>
  );
}
