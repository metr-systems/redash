import React from "react";
import { includes } from "lodash";
import Menu from "antd/lib/menu";

import Link from "@/components/Link";
import logoUrl from "@/assets/images/redash_icon_small.png";
import DesktopOutlinedIcon from "@ant-design/icons/DesktopOutlined";
import PoweroffOutlinedIcon from "@ant-design/icons/PoweroffOutlined";
import { useCurrentRoute } from "@/components/ApplicationArea/Router";

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
  const isDashboardsActive = includes(["ComposedDashboards.List", "GlobalHome"], currentRoute && currentRoute.id);

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
        <Menu.Item key="dashboards" className={isDashboardsActive ? "navbar-active-item" : null}>
          <Link href="composed-dashboards">
            <DesktopOutlinedIcon />
            <span className="desktop-navbar-label">Composed<br />Dashboards</span>
          </Link>
        </Menu.Item>
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
