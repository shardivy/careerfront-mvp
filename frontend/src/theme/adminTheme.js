/**
 * adminTheme.js
 * Central design-token file for the Admin panel (sidebar + header shell,
 * and any admin-scoped pages/components built on top of it).
 *
 * Pattern: group Tailwind utility strings under semantic keys so components
 * reference `adminTheme.text.primary` instead of hardcoded `text-slate-900`.
 * Change a value here and it updates everywhere it's used.
 *
 * Usage:
 *   import { adminTheme } from "@/theme/adminTheme";
 *   <div className={cn(adminTheme.surface.card, adminTheme.border.default)} />
 */

export const adminTheme = {
  // Brand identity
  brand: {
    name: "TrueMindPath",
    logoBg: "bg-slate-900",
    logoText: "text-white",
    mark: "bg-gradient-to-r from-slate-900 to-slate-700",
  },

  // Surfaces (backgrounds)
  surface: {
    page: "bg-slate-50",
    card: "bg-white",
    subtle: "bg-slate-50/80",
    hover: "hover:bg-slate-50",
    hoverStrong: "hover:bg-slate-100",
    overlay: "bg-slate-900/40",
  },

  // Borders
  border: {
    default: "border-slate-200",
    strong: "border-slate-300",
    hoverStrong: "hover:border-slate-300",
  },

  // Text
  text: {
    primary: "text-slate-900",
    secondary: "text-slate-500",
    muted: "text-slate-400",
    onDark: "text-white",
    onDarkMuted: "text-slate-300",
    danger: "text-red-600",
    dangerHover: "hover:text-red-700",
    link: "text-slate-700",
  },

  // Sidebar nav item states
  nav: {
    active: "bg-slate-100 text-slate-900",
    inactive: "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
    indicatorActive: "bg-slate-900",
    indicatorInactive: "bg-transparent",
    groupLabel: "text-xs font-semibold uppercase tracking-wider text-slate-400",
  },

  // Buttons / icon buttons
  button: {
    icon: "rounded-md p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900",
    iconGhost: "rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600",
    iconBordered:
      "rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-700",
  },

  // Dropdown menu (account menu, etc.)
  dropdown: {
    content: "w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl",
    header: "mb-2 rounded-lg bg-gradient-to-r from-slate-900 to-slate-700 p-3 text-white",
    item: "rounded-lg px-2.5 py-2 text-slate-700 focus:bg-slate-100 focus:text-slate-900",
    itemDanger: "rounded-lg px-2.5 py-2 text-red-600 focus:bg-red-50 focus:text-red-700",
    separator: "my-1",
  },

  // Avatar
  avatar: {
    ring: "ring-2 ring-white",
  },

  // Inputs
  input: {
    search:
      "h-9 w-full rounded-md border-slate-200 bg-slate-50 pl-9 pr-14 text-sm focus-visible:bg-white",
    kbdHint:
      "rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400",
  },

  // Layout dimensions
  layout: {
    headerHeight: "h-16",
    sidebarWidthTablet: "md:w-20",
    sidebarWidthDesktop: "lg:w-64",
    mobileDrawerWidth: "w-72 max-w-[80vw]",
    contentPadding: "p-3 sm:p-4 lg:p-6",
  },

  // Radius / elevation shortcuts
  radius: {
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
  },
  shadow: {
    sm: "shadow-sm",
    xl: "shadow-xl",
  },

  // z-index scale for layered UI (backdrop, drawer, dropdown)
  zIndex: {
    backdrop: "z-40",
    drawer: "z-50",
  },

  // Buttons used across dashboard pages (toolbars, card actions)
  actionButton: {
    primary:
      "inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800",
    secondary:
      "inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50",
    pillActive: "rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white",
    pillInactive:
      "rounded-md px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100",
    tabActive: "text-sm font-semibold text-slate-900",
    tabInactive: "text-sm font-medium text-slate-400 hover:text-slate-600",
  },

  // Generic content cards (metric tiles, chart panels, list panels)
  card: {
    base: "rounded-xl border border-slate-200 bg-white",
    padding: "p-5 sm:p-6",
    title: "text-sm font-semibold text-slate-900",
    subtitle: "text-xs text-slate-400",
  },

  // Small status/delta badges (growth %, counts)
  badge: {
    positive:
      "inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-600",
    negative:
      "inline-flex items-center gap-0.5 rounded-md bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-600",
    neutral: "inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-500",
  },

  // Chart tokens (recharts)
  chart: {
    stroke: "#0f172a", // slate-900
    gridStroke: "#e2e8f0", // slate-200
    axisText: "#94a3b8", // slate-400
    areaFrom: "#94a3b8", // slate-400 (gradient top)
    areaTo: "#ffffff",
    donut: ["#0f172a", "#475569", "#cbd5e1"], // slate-900 / slate-600 / slate-300
  },

  // Dark promo / credential banner
  banner: {
    base: "flex flex-col gap-4 rounded-xl bg-slate-900 px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between",
    iconWrap: "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10",
    mono: "font-mono text-xs text-slate-400",
    buttonGhost:
      "inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10",
    buttonSolid:
      "inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-2 text-xs font-medium text-slate-900 transition hover:bg-slate-100",
  },

  callout: {
    base: "rounded-xl bg-slate-900 p-5 text-white",
    title: "flex items-center gap-2 text-sm font-semibold",
    body: "mt-2 text-xs leading-relaxed text-slate-300",
    button:
      "mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100",
    buttonDisabled: "cursor-not-allowed opacity-60",
  },

  // Tables (audit log, etc.)
  table: {
    headerCell: "px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-slate-400",
    row: "border-t border-slate-100 hover:bg-slate-50/60",
    cell: "px-4 py-3 text-sm text-slate-700",
    cellMuted: "px-4 py-3 text-sm text-slate-400",
  },

  // Activity / timeline list rows
  timeline: {
    dotActive: "h-1.5 w-1.5 rounded-full bg-slate-900",
    dotMuted: "h-1.5 w-1.5 rounded-full bg-slate-300",
    title: "text-sm text-slate-700",
    emphasis: "font-semibold text-slate-900",
    time: "text-xs text-slate-400",
  },
};

export default adminTheme;