import React, { useState } from "react";
import {
  LayoutGrid,
  Users,
  FileText,
  BarChart3,
  Settings,
  Bell,
  User,
  ShieldCheck,
  X,
  Menu, 
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import theme from "../../theme/enterpriseTheme";
import EnterpriseBreadcrumbs from "../EnterpriseBreadcrumbs";

const navItems = [
  {
    icon: LayoutGrid,
    label: "Dashboard",
    path: "/enterprise/dashboard",
  },
  {
    icon: Users,
    label: "Students",
    path: "/enterprise/students",
  },
  {
    icon: FileText,
    label: "Reports",
    path: "/enterprise/reports",
  },
  {
    icon: BarChart3,
    label: "Analytics",
    path: "/enterprise/analytics",
  },
  {
    icon: Settings,
    label: "Settings",
    path: "/enterprise/settings",
  },
];

const IconTooltip = ({ label, children }) => (
  <div className="group relative flex justify-center">
    {children}

    <div
      className="absolute left-12 top-1/2 -translate-y-1/2
      opacity-0 group-hover:opacity-100
      pointer-events-none transition-all duration-200
      whitespace-nowrap px-3 py-1 rounded-md text-xs z-50"
      style={{
        background: theme.colors.background.sidebarHover,
        color: theme.colors.text.white,
      }}
    >
      {label}
    </div>
  </div>
);

const SidebarNav = ({ closeSidebar }) => (
  <>
    {navItems.map((item) => {
      const Icon = item.icon;

      return (
        <IconTooltip key={item.path} label={item.label}>
          <NavLink
            to={item.path}
            onClick={closeSidebar}
            className={({ isActive }) =>
              `${theme.sidebar.icon} ${isActive
                ? theme.sidebar.active
                : theme.sidebar.inactive
              }`
            }
          >
            <Icon className="h-5 w-5" />
          </NavLink>
        </IconTooltip>
      );
    })}
  </>
);

const SidebarFooter = () => (
  <>
    {/* Notification */}
    <IconTooltip label="Notifications">
      <button
        className={`${theme.sidebar.icon} ${theme.sidebar.inactive} relative`}
      >
        <Bell className="h-5 w-5" />

        {/* Notification Badge */}
        <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 border border-slate-800"></span>
      </button>
    </IconTooltip>

    {/* Profile */}
    <IconTooltip label="Admin Profile">
      <button className="relative">
        <img
          src="https://randomuser.me/api/portraits/women/44.jpg"
          alt="Admin"
          className="h-10 w-10 rounded-full object-cover border-2 border-slate-600"
        />

        <span
          className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center border-2"
          style={{
            backgroundColor: theme.colors.primary,
            borderColor: theme.colors.background.sidebar,
          }}
        >
          <ShieldCheck
            className="h-3 w-3"
            style={{ color: theme.colors.text.white }}
          />
        </span>
      </button>
    </IconTooltip>
  </>
);

const EnterpriseLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = () => {
    setSidebarOpen(true);
  };

  return (
    // h-screen + overflow-hidden makes this the ONE place that owns the
    // viewport height. Every route rendered through <Outlet /> gets a
    // bounded box to fill (via main's flex-1 min-h-0) instead of each
    // page having to re-declare h-screen itself.
    <div
      className="h-screen flex overflow-hidden"
      style={{
        background: theme.colors.background.page,
        fontFamily: theme.typography.fontFamily,
      }}
    >
      {/* Desktop Sidebar */}

      <aside
        className="hidden lg:flex flex-col items-center py-6 flex-shrink-0"
        style={{
          width: theme.sidebar.width,
          background: theme.colors.background.sidebar,
        }}
      >
        <div
          className={`h-11 w-11 ${theme.radius.md} flex items-center justify-center mb-8`}
          style={{
            background: theme.colors.background.sidebarActive,
          }}
        >
          <span
            className="font-bold"
            style={{ color: theme.colors.text.white }}
          >
            TM
          </span>
        </div>

        <div className="flex flex-col gap-3 flex-1">
          <SidebarNav />
        </div>

        <div className="flex flex-col gap-4 pb-7">
          <SidebarFooter />
        </div>
      </aside>

      {/* Mobile Sidebar */}

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />

          <aside
            className="relative flex flex-col items-center py-6 z-50"
            style={{
              width: theme.sidebar.width,
              background: theme.colors.background.sidebar,
            }}
          >
            <button
              onClick={() => setSidebarOpen(false)}
              className="mb-6"
            >
              <X
                className="h-6 w-6"
                style={{
                  color: theme.colors.text.white,
                }}
              />
            </button>

            <div className="flex flex-col gap-3 flex-1">
              <SidebarNav closeSidebar={() => setSidebarOpen(false)} />
            </div>

            <SidebarFooter />
          </aside>
        </div>
      )}


      {/* Page content */}
      <main className="flex-1 min-h-0 overflow-hidden flex flex-col px-4 sm:px-6 lg:px-10 py-6 lg:py-8">

        <button
          className="lg:hidden mb-4 h-9 w-9 rounded-lg border border-slate-200 bg-white shadow-sm flex items-center justify-center self-start"
          onClick={openSidebar}
        >
          <Menu className="h-4 w-4" />
        </button>

        <EnterpriseBreadcrumbs />

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <Outlet />
        </div>

      </main>
    </div>
  );
};

export default EnterpriseLayout;