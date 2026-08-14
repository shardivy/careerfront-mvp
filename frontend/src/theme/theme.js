const theme = {
    colors: {
        primary: "#3B82F6",
        primaryDark: "#2563EB",
        primaryLight: "#60A5FA",

        secondary: "#EFF6FF",

        white: "#FFFFFF",

        background: {
            page: "from-slate-50 via-[#3B82F6]/5 to-blue-50",
            card: "#FFFFFF",
        },

        text: {
            heading: "#0F172A",
            body: "#64748B",
            light: "#94A3B8",
            white: "#FFFFFF",
        },

        border: "#E2E8F0",

        success: "#22C55E",

        shadow: "#BFDBFE",
    },

    font: {
        family: "'Plus Jakarta Sans', sans-serif",
    },

    radius: {
        sm: "rounded-lg",
        md: "rounded-xl",
        lg: "rounded-2xl",
        xl: "rounded-3xl",
        full: "rounded-full",
    },

    shadow: {
        button: "shadow-lg shadow-[#BFDBFE]",
        card: "shadow-xl shadow-slate-200/30",
    },

    button: {
        primary:
            "bg-[#3B82F6] hover:bg-[#2563EB] active:bg-[#1D4ED8] text-white",

        secondary:
            "bg-white border border-slate-200 hover:bg-slate-50 text-slate-700",
    },

    input: {
        base:
            "w-full rounded-xl border border-slate-200 bg-white py-3 pr-4 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#60A5FA] focus:border-transparent",

        withIcon:
            "w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 py-3 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#60A5FA] focus:border-transparent",
    },

    badge: {
        blue:
            "inline-flex items-center gap-2 rounded-full bg-[#EFF6FF] px-4 py-1.5 text-sm text-[#2563EB] font-medium",

        white:
            "inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur px-4 py-2 border border-white shadow-sm",
    },
};

export default theme;