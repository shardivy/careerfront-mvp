import React, { useState, useEffect, useRef } from "react";
import { Compass, Clock } from "lucide-react";
import theme from "../../theme/theme";
import Skeleton from "../ui/Skeleton";

/**
 * StudentLayout
 * ------------------------------------------------------------------
 * Global shell + reusable pieces for every student-facing test page.
 *
 * Exports:
 *   - BrandLogo             logo + "TrueMindPath" wordmark
 *   - SectionTimer          self-contained countdown (state, interval,
 *                           formatting, red-under-60s, fires onExpire)
 *   - SectionProgressLabel  "Section N of M: Title" (desktop + mobile)
 *   - SectionProgressDots   "Sections: N/M Active" + the dot/bar row
 *   - TopBar                slot-based header (center/right/below/progressBar)
 *   - StudentLayout (default) page shell: font, bg, topBar + children
 *
 * Any assessment runner composes these instead of re-writing timer
 * state or progress markup itself.
 */

// ---------------------------------------------------------------------
// Brand
// ---------------------------------------------------------------------
export const BrandLogo = ({ size = "default" }) => {
    const dims =
        size === "compact"
            ? "w-8 h-8 sm:w-9 sm:h-9"
            : "w-8 h-8 sm:w-9 sm:h-9 lg:w-8 lg:h-8";

    return (
        <div className="flex items-center gap-2 sm:gap-3">
            <div
                className={`${dims} ${theme.radius.full} flex items-center justify-center`}
                style={{ backgroundColor: theme.colors.primary }}
            >
                <Compass
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    style={{ color: theme.colors.text.white }}
                    strokeWidth={2.2}
                />
            </div>
            <span
                className="hidden sm:inline lg:inline text-base sm:text-lg font-bold tracking-tight"
                style={{ color: theme.colors.text.heading }}
            >
                TrueMindPath
            </span>
        </div>
    );
};

// ---------------------------------------------------------------------
// Timer — owns its own countdown. Parent never touches secondsLeft;
// it just gets notified once, via onExpire, when time runs out.
// ---------------------------------------------------------------------
const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const s = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
};

export const SectionTimer = ({
    timeLimitSeconds,
    resetKey, // pass section.id — guards against two sections sharing the same duration
    onExpire,
    loading = false,
    tickMs = 1000,
    lowThreshold = 60,
}) => {
    const [secondsLeft, setSecondsLeft] = useState(timeLimitSeconds);
    const expiredRef = useRef(false);

    // Reset the clock whenever we move to a different section.
    useEffect(() => {
        setSecondsLeft(timeLimitSeconds);
        expiredRef.current = false;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resetKey]);

    useEffect(() => {
        if (loading) return;
        if (secondsLeft <= 0) {
            if (!expiredRef.current) {
                expiredRef.current = true;
                onExpire?.();
            }
            return;
        }
        const t = setTimeout(() => setSecondsLeft((s) => s - 1), tickMs);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [secondsLeft, loading, tickMs]);

    if (loading) return <Skeleton className="h-5 w-16" />;

    return (
        <span
            className="flex items-center gap-1.5 text-sm sm:text-base font-semibold tabular-nums"
            style={{ color: secondsLeft <= lowThreshold ? "#DC2626" : theme.colors.text.heading }}
        >
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            {formatTime(secondsLeft)}
        </span>
    );
};

// ---------------------------------------------------------------------
// Section progress — label (center/mobile) + the dots/active-count row.
// Pure display, driven entirely by props.
// ---------------------------------------------------------------------
export const SectionProgressLabel = ({
    sectionNumber,
    sectionsTotal,
    sectionTitle,
    loading = false,
    mobile = false,
}) => {
    if (loading) {
        return mobile ? (
            <Skeleton className="h-4 w-40 mx-auto" />
        ) : (
            <Skeleton className="h-4 w-56 hidden md:block" />
        );
    }

    const text = `Section ${sectionNumber} of ${sectionsTotal}: ${sectionTitle}`;

    return mobile ? (
        <div className="md:hidden text-center pb-2 text-sm" style={{ color: theme.colors.text.body }}>
            {text}
        </div>
    ) : (
        <span
            className="text-sm sm:text-base font-medium absolute left-1/2 -translate-x-1/2 hidden md:block"
            style={{ color: theme.colors.text.body }}
        >
            {text}
        </span>
    );
};

export const SectionProgressDots = ({
    sectionOrder,
    getSectionState, // (id) => "current" | "completed" | "upcoming"
    sectionNumber,
    sectionsTotal,
    loading = false,
    maxWidth = "max-w-6xl",
}) => {
    const colorFor = (state) =>
        state === "completed" ? "#16A34A" : state === "current" ? theme.colors.primary : "#E2E8F0";

    return (
        <div className={`${maxWidth} mx-auto pl-1 pr-6 pb-3 sm:pb-4`}>
            {loading ? (
                <Skeleton className="h-3 w-24 mb-2" />
            ) : (
                <span className="text-xs sm:text-sm" style={{ color: theme.colors.text.light }}>
                    Sections:{" "}
                    <span className="font-semibold" style={{ color: theme.colors.text.heading }}>
                        {sectionNumber} / {sectionsTotal}
                    </span>{" "}
                    Active
                </span>
            )}
            <div className="flex gap-1.5 sm:gap-2 mt-2">
                {loading
                    ? sectionOrder.map((id) => <Skeleton key={id} className="flex-1 h-1.5 sm:h-2 rounded-full" />)
                    : sectionOrder.map((id) => (
                        <div
                            key={id}
                            className="flex-1 h-1.5 sm:h-2 rounded-full transition-colors"
                            style={{ backgroundColor: colorFor(getSectionState(id)) }}
                        />
                    ))}
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------
// TopBar — generic slot-based header. Stays agnostic of timers/sections
// so plain pages (like AptitudeTest) can use it with just `right`.
// ---------------------------------------------------------------------
export const TopBar = ({
    maxWidth = "max-w-6xl",
    center = null,
    right = null,
    below = null,
    sticky = false,
    progressBar = null,
}) => {
    return (
        <>
            {progressBar}
            <header
                className={`w-full border-b border-slate-200 bg-white ${sticky ? "sticky top-0 z-20" : ""}`}
            >
                <div
                    className={`${maxWidth} mx-auto flex items-center justify-between gap-3 px-4 sm:px-1 py-3 sm:py-4 relative`}
                >
                    <BrandLogo />
                    {center}
                    {right}
                </div>
                {below}
            </header>
        </>
    );
};

// ---------------------------------------------------------------------
// Page shell
// ---------------------------------------------------------------------
const StudentLayout = ({ children, topBar, className = "", footer = null }) => {
    return (
        <div
            className={`min-h-screen w-full flex flex-col ${className}`}
            style={{ fontFamily: theme.font.family, backgroundColor: "#F8FAFC" }}
        >
            {topBar}
            {children}
            {footer}
        </div>
    );
};

export default StudentLayout;