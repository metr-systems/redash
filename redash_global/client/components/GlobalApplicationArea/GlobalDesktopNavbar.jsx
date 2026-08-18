import React from "react";
import Menu from "antd/lib/menu";

import Link from "@/components/Link";
import logoUrl from "@/assets/images/redash_icon_small.png";

import DesktopOutlinedIcon from "@ant-design/icons/DesktopOutlined";
import LogoutOutlinedIcon from "@ant-design/icons/LogoutOutlined";

import "@/components/ApplicationArea/ApplicationLayout/DesktopNavbar.less";
import "./GlobalDesktopNavbar.less";

function NavbarSection({ children, ...props }) {
  return (
    <Menu selectable={false} mode="vertical" theme="dark" {...props}>
      {children}
    </Menu>
  );
}

export default function GlobalDesktopNavbar() {
  return (
    <nav className="desktop-navbar global-desktop-navbar">
      <NavbarSection className="desktop-navbar-logo">
        <div role="menuitem">
          <Link href="./">
            <img src={logoUrl} alt="Redash" />
          </Link>
        </div>
      </NavbarSection>

      <NavbarSection>
        <Menu.Item key="composed-dashboards">
          <Link href="composed-dashboards">
            <DesktopOutlinedIcon aria-label="Composed Dashboards navigation button" />
            <span className="desktop-navbar-label">Composed Dashboards</span>
          </Link>
        </Menu.Item>
        <Menu.Item key="sub-dashboards">
          <Link href="sub-dashboards">
            <DesktopOutlinedIcon aria-label="Sub-Dashboards navigation button" />
            <span className="desktop-navbar-label">Sub-Dashboards</span>
          </Link>
        </Menu.Item>
      </NavbarSection>

      <NavbarSection className="desktop-navbar-spacer" />

      <NavbarSection>
        <Menu.Item key="logout">
          {/* Session logout is handled by the server, so bypass the client-side router. */}
          <a href="/logout" data-skip-router>
            <LogoutOutlinedIcon />
            <span className="desktop-navbar-label">Log out</span>
          </a>
        </Menu.Item>
      </NavbarSection>
    </nav>
  );
}
