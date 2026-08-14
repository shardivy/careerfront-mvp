import React, { useState, useEffect, useRef } from "react";
import { Compass, Clock } from "lucide-react";
import theme from "../../theme/theme";
import Skeleton from "../ui/skeleton";

// ---------------------------------------------------------------------
// Brand
// ---------------------------------------------------------------------
export const BrandLogo = ({ size = "default" }) => {
    const dims =
        size === "compact"
            ? "w-8 h-8 sm:w-9 sm:h-9"
            : "w-8 h-8 sm:w-9 sm:h-9 lg:w-8 lg:h-8";

    return (
        <div className="flex items-center gap-2 sm:gap-1">
            <div
                className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center overflow-hidden"
            >
                <img
                    src="/logo.png"
                    alt="TheCareerFront"
                    className="w-full h-full object-contain"
                />
            </div>

            <span
                className="hidden sm:inline lg:inline text-base sm:text-lg font-bold tracking-tight"
                style={{ color: theme.colors.text.heading }}
            >
                TheCareerFront
            </span>
        </div>
    );
};

// ---------------------------------------------------------------------
// Timer — now driven by an absolute `endsAt` timestamp (epoch ms)
// instead of a relative `timeLimitSeconds`. The parent computes
// `endsAt` ONCE per section (Date.now() + duration) and persists it
// via autosave, so a refresh recomputes "time left" from the same
// fixed target instead of restarting the clock.
// ---------------------------------------------------------------------
const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const s = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
};

export const SectionTimer = ({
    endsAt,          // epoch ms — countdown hits zero when Date.now() reaches this
    onExpire,
    loading = false,
    tickMs = 1000,
    lowThreshold = 60,
}) => {
    const [secondsLeft, setSecondsLeft] = useState(null);
    const expiredRef = useRef(false);

    // Keep the latest onExpire in a ref so the tick effect below doesn't
    // need to restart every time the parent re-creates that callback.
    const onExpireRef = useRef(onExpire);
    useEffect(() => {
        onExpireRef.current = onExpire;
    }, [onExpire]);

    useEffect(() => {
        if (loading || !Number.isFinite(endsAt)) {
            setSecondsLeft(null);
            return undefined;
        }

        expiredRef.current = false;

        // Recompute from Date.now() every tick (instead of decrementing a
        // counter) so the displayed time is always correct even if the
        // tab was backgrounded/throttled — and so a fresh mount after a
        // refresh picks up exactly where it should.
        const tick = () => {
            const remaining = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
            setSecondsLeft(remaining);
            if (remaining <= 0 && !expiredRef.current) {
                expiredRef.current = true;
                onExpireRef.current?.();
            }
        };

        tick(); // set immediately, don't wait a full tick to show correct time
        const interval = setInterval(tick, tickMs);
        return () => clearInterval(interval);
    }, [endsAt, loading, tickMs]);

    if (loading || secondsLeft === null) return <Skeleton className="h-5 w-16" />;

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
// Section progress — unchanged
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
    getSectionState,
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
// TopBar — unchanged
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
// Page shell — unchanged
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