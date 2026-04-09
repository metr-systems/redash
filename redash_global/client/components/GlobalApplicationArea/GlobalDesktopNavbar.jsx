import React from "react";
import Menu from "antd/lib/menu";

import Link from "@/components/Link";
import logoUrl from "@/assets/images/redash_icon_small.png";
import DesktopOutlinedIcon from "@ant-design/icons/DesktopOutlined";
import PoweroffOutlinedIcon from "@ant-design/icons/PoweroffOutlined";

import "@/components/ApplicationArea/ApplicationLayout/DesktopNavbar.less";

function NavbarSection({ children, ...props }) {
  return (
    <Menu selectable={false} mode="vertical" theme="dark" {...props}>
      {children}
    </Menu>
  );
}

export default function GlobalDesktopNavbar() {
  return (
    <nav className="desktop-navbar">
      <NavbarSection className="desktop-navbar-logo">
        <div role="menuitem">
          <Link href="/">
            <img src={logoUrl} alt="Redash" />
          </Link>
        </div>
      </NavbarSection>

      <NavbarSection>
        <Menu.Item key="dashboards">
          <Link href="/dashboards">
            <DesktopOutlinedIcon />
            <span className="desktop-navbar-label">Dashboards</span>
          </Link>
        </Menu.Item>
      </NavbarSection>

      <NavbarSection className="desktop-navbar-spacer" />

      <NavbarSection>
        <Menu.Item key="logout">
          <a href="/global-api/admin/logout">
            <PoweroffOutlinedIcon />
            <span className="desktop-navbar-label">Logout</span>
          </a>
        </Menu.Item>
      </NavbarSection>
    </nav>
  );
}
