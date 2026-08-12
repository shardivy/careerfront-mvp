import { useState } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  BarChart3,
  HeartPulse,
  Database,
  Library,
  GitBranch,
  Network,
  Users,
  ShieldCheck,
  Building2,
  ClipboardList,
  Settings,
  Search,
  Bell,
  Command,
  ChevronRight,
  MoreVertical,
  Menu,
  X,
  User,
  LogOut,

} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { adminTheme } from "@/theme/adminTheme";


const NAV_GROUPS = [
   {
    label: "Dashboard",
    items: [
      { label: "Dashboard",to: "/s-admin/dashboard",icon: LayoutGrid,},
    ],
  },
  {
    label: "Repositories",
    items: [
      // { label: "Dashboard", to: "/s-admin/dashboard", icon: LayoutGrid },
            { label: "Dashboard", to: "/s-admin/question-bank-repository", icon: Database, },
      { label: "Assessment Overview", to: "/s-admin/assessment-overview", icon: BarChart3 },
      { label: "Question Library", to: "/s-admin/question-library", icon: ClipboardList, },
      //  { label: "Question Mapping", to: "/s-admin/question-mapping",icon: GitBranch,},
      { label: "Assessment Structure", to: "/s-admin/assessment-structure", icon: Network, },
    ],
  },
  // {
  //   label: "IAM",
  //   items: [
  //     { label: "Users", to: "/iam/users", icon: Users },
  //     { label: "Roles", to: "/iam/roles", icon: ShieldCheck },
  //   ],
  // },
  // {
  //   label: "Master Data",
  //   items: [
  //     { label: "Academic", to: "/master-data/academic", icon: Building2 },
  //     { label: "Assessment", to: "/master-data/assessment", icon: ClipboardList },
  //     { label: "System", to: "/master-data/system", icon: Settings },
  //   ],
  // },
];

// Optional: map route segments to readable breadcrumb labels.
const BREADCRUMB_LABELS = {
  dashboard: "Dashboard",
  "assessment-overview": "Assessment Overview",
  "question-bank-repository": "Question Bank Repository",
  "question-library": "Question Library",
  "question-mapping": "Question Mapping",
  "iam": "Identity & Access",
  users: "Users",
  roles: "Roles",
  "master-data": "Master Data",
  academic: "Academic",
  assessment: "Assessment",
  system: "System",


  health: "Health",
};

const useBreadcrumb = () => {
  const { pathname } = useLocation();

  const segments = pathname.split("/").filter(Boolean);

  const breadcrumbs = [adminTheme.brand.name];

  segments.forEach((segment) => {
    if (segment !== "s-admin") {
      breadcrumbs.push(BREADCRUMB_LABELS[segment] ?? segment);
    }
  });

  return breadcrumbs;
};

const SidebarNavItem = ({ to, label, icon: Icon, onNavigate }) => {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isActive ? adminTheme.nav.active : adminTheme.nav.inactive
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              "h-4 w-1 -ml-3 rounded-r-full transition-colors",
              isActive ? adminTheme.nav.indicatorActive : adminTheme.nav.indicatorInactive
            )}
          />
          <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
          <span className="truncate">{label}</span>
        </>
      )}
    </NavLink>
  );
};

const AccountMenu = ({ onViewProfile, onLogout, triggerClassName, contentClassName }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={triggerClassName} aria-label="Account menu">
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className={cn(adminTheme.dropdown.content, contentClassName)}>
        <div className={adminTheme.dropdown.header}>
          <p className="text-sm font-semibold">Alexander Ross</p>
          <p className={cn("mt-0.5 text-xs", adminTheme.text.onDarkMuted)}>
            Platform Admin · {adminTheme.brand.name}
          </p>
        </div>
        <DropdownMenuItem onClick={onViewProfile} className={adminTheme.dropdown.item}>
          <User className="mr-2 h-4 w-4" />
          View profile
        </DropdownMenuItem>
        <DropdownMenuSeparator className={adminTheme.dropdown.separator} />
        <DropdownMenuItem onClick={onLogout} className={adminTheme.dropdown.itemDanger}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const SidebarContent = ({ onNavigate, onClose, onViewProfile, onLogout }) => {
  return (
    <>
      {/* Brand */}
      <div
        className={cn(
          "flex items-center justify-between gap-2 border-b px-4 sm:px-6",
          adminTheme.layout.headerHeight,
          adminTheme.border.default
        )}
      >
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md",
              adminTheme.brand.logoBg,
              adminTheme.brand.logoText
            )}
          >
            <ShieldCheck className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <span className={cn("text-base font-semibold tracking-tight", adminTheme.text.primary)}>
            {adminTheme.brand.name}
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className={cn(adminTheme.button.iconGhost, "md:hidden")}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className={cn("mb-2 px-3", adminTheme.nav.groupLabel)}>{group.label}</p>
            <div className="space-y-1">
              {group.items.map((item) => (
                <SidebarNavItem key={item.to} {...item} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className={cn("border-t p-4", adminTheme.border.default)}>
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl border px-2.5 py-2.5 transition-colors",
            adminTheme.border.default,
            adminTheme.surface.subtle,
            adminTheme.surface.hoverStrong
          )}
        >
          <Avatar className={cn("h-9 w-9 shrink-0", adminTheme.avatar.ring)}>
            <AvatarImage src="/avatars/current-user.jpg" alt="" />
            <AvatarFallback>AR</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className={cn("truncate text-sm font-semibold", adminTheme.text.primary)}>
              Alexander Ross
            </p>
            <p className={cn("truncate text-xs", adminTheme.text.secondary)}>Platform Admin</p>
          </div>
          <AccountMenu
            onViewProfile={onViewProfile}
            onLogout={onLogout}
            triggerClassName={cn("shrink-0", adminTheme.button.iconBordered, adminTheme.shadow.sm)}
          />
        </div>
      </div>
    </>
  );
};

/** Static sidebar for md+ screens */
const Sidebar = ({ onViewProfile, onLogout }) => {
  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r md:flex",
        adminTheme.border.default,
        adminTheme.surface.card,
        adminTheme.layout.sidebarWidthTablet,
        adminTheme.layout.sidebarWidthDesktop
      )}
    >
      <div className="hidden h-full flex-col lg:flex">
        <SidebarContent onViewProfile={onViewProfile} onLogout={onLogout} />
      </div>
      {/* Compact icon-only rail for md (tablet) */}
      <div className="flex h-full flex-col lg:hidden">
        <div
          className={cn(
            "flex items-center justify-center border-b",
            adminTheme.layout.headerHeight,
            adminTheme.border.default
          )}
        >
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md",
              adminTheme.brand.logoBg,
              adminTheme.brand.logoText
            )}
          >
            <ShieldCheck className="h-4 w-4" strokeWidth={2.5} />
          </div>
        </div>
        <nav className="flex-1 space-y-6 overflow-y-auto px-2 py-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="space-y-1">
              {group.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  title={label}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center justify-center rounded-md p-2.5 transition-colors",
                      isActive ? adminTheme.nav.active : adminTheme.nav.inactive
                    )
                  }
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className={cn("border-t p-3", adminTheme.border.default)}>
          <div className="flex flex-col items-center gap-2">
            <Avatar className="h-9 w-9">
              <AvatarImage src="/avatars/current-user.jpg" alt="" />
              <AvatarFallback>AR</AvatarFallback>
            </Avatar>
            <AccountMenu
              onViewProfile={onViewProfile}
              onLogout={onLogout}
              triggerClassName={cn(adminTheme.button.iconBordered, adminTheme.shadow.sm)}
              contentClassName="w-52"
            />
          </div>
        </div>
      </div>
    </aside>
  );
};

/** Slide-in drawer sidebar for mobile screens */
const MobileSidebar = ({ open, onClose, onViewProfile, onLogout }) => {
  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 transition-opacity md:hidden",
          adminTheme.zIndex.backdrop,
          adminTheme.surface.overlay,
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 flex flex-col transition-transform duration-200 ease-out md:hidden",
          adminTheme.zIndex.drawer,
          adminTheme.layout.mobileDrawerWidth,
          adminTheme.surface.card,
          adminTheme.shadow.xl,
          open ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
      >
        <SidebarContent
          onNavigate={onClose}
          onClose={onClose}
          onViewProfile={onViewProfile}
          onLogout={onLogout}
        />
      </aside>
    </>
  );
};

const Header = ({ onMenuClick }) => {
  const crumbs = useBreadcrumb();

  return (
    <header
      className={cn(
        "flex shrink-0 items-center gap-2 border-b px-3 sm:gap-4 sm:px-6",
        adminTheme.layout.headerHeight,
        adminTheme.border.default,
        adminTheme.surface.card
      )}
    >
      {/* Mobile menu toggle */}
      <button
        type="button"
        onClick={onMenuClick}
        className={cn("shrink-0 md:hidden", adminTheme.button.icon)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Breadcrumb - hidden on smallest screens to make room for search */}
      <div className="hidden items-center gap-1.5 text-sm sm:flex">
        {crumbs.map((crumb, i) => (
          <div key={crumb + i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className={cn("h-3.5 w-3.5", adminTheme.text.muted)} />}
            <span
              className={cn(
                i === crumbs.length - 1
                  ? cn("font-semibold", adminTheme.text.primary)
                  : cn("hidden lg:inline", adminTheme.text.secondary)
              )}
            >
              {crumb}
            </span>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mx-auto w-full max-w-md flex-1 sm:flex-initial">
        <Search
          className={cn(
            "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2",
            adminTheme.text.muted
          )}
        />
        <Input
          type="search"
          placeholder="Search users by name, email, or org..."
          className={adminTheme.input.search}
        />
        <span
          className={cn(
            "pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 sm:flex",
            adminTheme.input.kbdHint
          )}
        >
          <Command className="h-3 w-3" />K
        </span>
      </div>

      {/* Right actions */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <button type="button" className={cn("relative", adminTheme.button.icon)} aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
};

const AdminLayout = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = useNavigate();

  const handleViewProfile = () => {
    navigate("/s-admin/admin-profile");
  };

  const handleLogout = () => {
    // TODO: hook this up to your actual auth/session logic
    // e.g. clear token, call logout API, then redirect
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className={cn("flex h-screen w-full overflow-hidden", adminTheme.surface.page)}>
      <Sidebar onViewProfile={handleViewProfile} onLogout={handleLogout} />
      <MobileSidebar
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        onViewProfile={handleViewProfile}
        onLogout={handleLogout}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenuClick={() => setMobileNavOpen(true)} />

        <main className={cn("flex-1 overflow-y-auto", adminTheme.layout.contentPadding)}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;