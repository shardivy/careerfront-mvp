const enterpriseTheme = {
  colors: {
    // Primary Brand
    primary: "#4F7DF3",
    primaryHover: "#3B6AF0",
    primaryLight: "#EEF4FF",

    // Secondary
    secondary: "#64748B",
    secondaryLight: "#F8FAFC",

    // Status
    success: "#16A34A",
    successLight: "#ECFDF3",

    warning: "#F59E0B",
    warningLight: "#FFF7ED",

    danger: "#EF4444",
    dangerLight: "#FEF2F2",

    info: "#0EA5E9",
    infoLight: "#F0F9FF",

    // Backgrounds
    background: {
      page: "#F8FAFC",
      card: "#FFFFFF",
      sidebar: "#1E293B",
      sidebarHover: "#334155",
      sidebarActive: "#4F7DF3",
      navbar: "#FFFFFF",
    },

    // Text
    text: {
      heading: "#0F172A",
      body: "#64748B",
      light: "#94A3B8",
      white: "#FFFFFF",
    },

    border: "#E2E8F0",

    icon: "#64748B",

    chart: {
      blue: "#4F7DF3",
      green: "#16A34A",
      orange: "#F59E0B",
      red: "#EF4444",
      purple: "#8B5CF6",
    },
  },

  typography: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",

    h1: "text-4xl font-bold",
    h2: "text-3xl font-bold",
    h3: "text-2xl font-semibold",

    title: "text-xl font-semibold",

    body: "text-base",

    small: "text-sm",

    xs: "text-xs",
  },

  radius: {
    sm: "rounded-lg",
    md: "rounded-xl",
    lg: "rounded-2xl",
    xl: "rounded-3xl",
    full: "rounded-full",
  },

  shadow: {
    card: "shadow-sm",
    medium: "shadow-md",
    large: "shadow-lg",
    hover: "shadow-xl",
  },

  transition: {
    normal: "transition-all duration-300",
    fast: "transition-all duration-150",
  },

  button: {
    primary:
      "bg-[#4F7DF3] hover:bg-[#3B6AF0] text-white rounded-xl px-5 py-2.5 font-medium transition-all",

    secondary:
      "bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl px-5 py-2.5 font-medium transition-all",

    ghost:
      "hover:bg-slate-100 text-slate-600 rounded-xl px-5 py-2.5 transition-all",

    success:
      "bg-green-600 hover:bg-green-700 text-white rounded-xl px-5 py-2.5 transition-all",
  },

  card: {
    base:
      "bg-white rounded-3xl border border-slate-200 shadow-sm",

    hover:
      "bg-white rounded-3xl border border-slate-200 shadow-md transition-all hover:-translate-y-1",

    dashboard:
      "bg-white rounded-3xl border border-slate-200 p-6 shadow-sm",
  },

  input: {
    base:
      "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400",
  },

  badge: {
    success:
      "inline-flex items-center rounded-full bg-green-50 text-green-700 px-3 py-1 text-xs font-medium",

    warning:
      "inline-flex items-center rounded-full bg-orange-50 text-orange-700 px-3 py-1 text-xs font-medium",

    danger:
      "inline-flex items-center rounded-full bg-red-50 text-red-700 px-3 py-1 text-xs font-medium",

    primary:
      "inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-xs font-medium",
  },

  sidebar: {
    width: "80px",

    icon:
      "w-11 h-11 rounded-xl flex items-center justify-center transition-all",

    active:
      "bg-[#4F7DF3] text-white shadow-lg",

    inactive:
      "text-slate-400 hover:bg-slate-700 hover:text-white",
  },

  table: {
    header:
      "bg-slate-50 text-slate-500 uppercase text-xs font-semibold",

    row:
      "border-b border-slate-100 hover:bg-slate-50 transition-all",
  },

  statsCard: {
    icon:
      "w-12 h-12 rounded-xl flex items-center justify-center",

    value:
      "text-4xl font-bold",

    title:
      "text-sm font-medium uppercase tracking-wide text-slate-500",

    change:
      "text-sm font-medium",
  },
};

export default enterpriseTheme;