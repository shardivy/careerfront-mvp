import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Compass, Mail, ArrowRight, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import theme from "../theme/theme";
import { useDispatch, useSelector } from "react-redux";
import { verifyOtp, resendOtp } from "../slices/authSlice";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 8;

const VerifyOtp = ({ step = 2, totalSteps = 3 }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();

    const { loading } = useSelector((state) => state.auth);
    const email = location.state?.email || "";
    const mobile = location.state?.mobile || "";

    useEffect(() => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href =
            "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
        document.head.appendChild(link);
        return () => document.head.removeChild(link);
    }, []);

    const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
    const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
    const [status, setStatus] = useState("idle"); // idle | verifying | error | success
    const [errorMsg, setErrorMsg] = useState("");
    const inputRefs = useRef([]);

    useEffect(() => {
        if (secondsLeft <= 0) return;
        const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
        return () => clearTimeout(t);
    }, [secondsLeft]);

    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    const runVerify = async (code) => {

        setStatus("verifying");
        setErrorMsg("");

        const payload = {
            email: email,
            mobile: mobile,
            otp: code,
        };

        const result = await dispatch(verifyOtp(payload));

        if (verifyOtp.fulfilled.match(result)) {

            const { access_token, refresh_token } = result.payload.data;

            localStorage.setItem("accessToken", access_token);
            localStorage.setItem("refreshToken", refresh_token);

            setStatus("success");

            setTimeout(() => {
                navigate("/test-selection");
            }, 900);
        } else {

            setStatus("error");

            setErrorMsg(
                result.payload?.message ||
                result.payload?.detail ||
                "Invalid OTP"
            );
        }
    };

    const handleChange = (index, value) => {
        if (status === "verifying" || status === "success") return;

        const digit = value.replace(/[^0-9]/g, "").slice(-1);
        const next = [...otp];
        next[index] = digit;
        setOtp(next);

        // Clear a previous error as soon as the user starts editing again
        if (status === "error") {
            setStatus("idle");
            setErrorMsg("");
        }

        if (digit && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        if (digit && index === OTP_LENGTH - 1) {
            const code = next.join("");
            if (code.length === OTP_LENGTH) {
                runVerify(code);
            }
        }
    };

    const handleKeyDown = (index, e) => {
        if (loading || status === "success") return;
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        if (loading || status === "success") return;

        const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, OTP_LENGTH);
        if (!pasted) return;

        const next = Array(OTP_LENGTH).fill("");
        pasted.split("").forEach((char, i) => (next[i] = char));
        setOtp(next);

        if (status === "error") {
            setStatus("idle");
            setErrorMsg("");
        }

        const lastIndex = Math.min(pasted.length, OTP_LENGTH) - 1;
        inputRefs.current[lastIndex]?.focus();

        if (pasted.length === OTP_LENGTH) {
            runVerify(pasted);
        }
    };

    const handleResend = async () => {
        if (secondsLeft > 0) return;

        const payload = {
            email: email,
            mobile: mobile,
        };

        const result = await dispatch(resendOtp(payload));

        if (resendOtp.fulfilled.match(result)) {

            setSecondsLeft(RESEND_SECONDS);
            setOtp(Array(OTP_LENGTH).fill(""));
            setStatus("idle");
            setErrorMsg("");

            inputRefs.current[0]?.focus();

        } else {

            setErrorMsg(
                result.payload?.message ||
                result.payload?.detail ||
                "Failed to resend OTP."
            );

            setStatus("error");
        }
    };

    // Manual submit fallback (e.g. if autosubmit somehow didn't fire)
    const handleSubmit = (e) => {
        e.preventDefault();
        const code = otp.join("");
        if (code.length !== OTP_LENGTH || loading || status === "success") return;
        runVerify(code);
    };

    const isComplete = otp.every((d) => d !== "");
    const boxBorderColor = (digit) => {
        if (status === "error") return "#DC2626";
        if (status === "success") return theme.colors.success;
        if (digit) return theme.colors.primary;
        return theme.colors.border;
    };

    return (
        <div
            className="min-h-screen w-full flex flex-col"
            style={{ fontFamily: theme.font.family, backgroundColor: "#F8FAFC" }}
        >
            {/* Top navbar */}
            <header className="w-full border-b border-slate-200 bg-white">
                <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-10 py-3 sm:py-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div
                            className={`w-8 h-8 sm:w-9 sm:h-9 ${theme.radius.full} flex items-center justify-center`}
                            style={{ backgroundColor: theme.colors.primary }}
                        >
                            <Compass className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: theme.colors.text.white }} strokeWidth={2.2} />
                        </div>
                        <span
                            className="text-base sm:text-lg font-bold tracking-tight"
                            style={{ color: theme.colors.text.heading }}
                        >
                            TrueMindPath
                        </span>
                    </div>

                    {/* Step progress */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-1.5">
                            {Array.from({ length: totalSteps }).map((_, i) => (
                                <span
                                    key={i}
                                    className="h-1.5 sm:h-2 w-7 sm:w-9 rounded-full transition-colors"
                                    style={{
                                        backgroundColor:
                                            i < step ? theme.colors.primary : "#E2E8F0",
                                    }}
                                />
                            ))}
                        </div>
                        <span className="text-xs sm:text-sm text-slate-500 whitespace-nowrap">
                            Step {step} of {totalSteps}
                        </span>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 sm:py-16">
                <div className="w-full max-w-md flex flex-col items-center">
                    {/* Card */}
                    <div
                        className={`w-full ${theme.radius.xl} ${theme.shadow.card} bg-white border border-slate-100 px-6 sm:px-10 py-8 sm:py-10 flex flex-col items-center`}
                    >
                        {/* Icon */}
                        <div
                            className={`w-14 h-14 sm:w-16 sm:h-16 ${theme.radius.lg} flex items-center justify-center mb-5 sm:mb-6 transition-colors`}
                            style={{
                                backgroundColor:
                                    status === "success"
                                        ? "#DCFCE7"
                                        : status === "error"
                                            ? "#FEE2E2"
                                            : theme.colors.secondary,
                            }}
                        >
                            {status === "success" ? (
                                <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: theme.colors.success }} />
                            ) : status === "error" ? (
                                <XCircle className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: "#DC2626" }} />
                            ) : (
                                <Mail className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: theme.colors.primary }} />
                            )}
                        </div>

                        <h1
                            className="text-2xl sm:text-3xl font-extrabold tracking-tight text-center mb-2"
                            style={{ color: theme.colors.text.heading }}
                        >
                            {status === "success" ? "Verified!" : "Check your inbox"}
                        </h1>

                        {status === "success" ? (
                            <p className="text-sm sm:text-base text-center mb-7 sm:mb-8" style={{ color: theme.colors.text.body }}>
                                Your email has been verified. Redirecting you now...
                            </p>
                        ) : (
                            <>
                                <p className="text-sm sm:text-base text-center mb-1" style={{ color: theme.colors.text.body }}>
                                    We sent a {OTP_LENGTH}-digit verification code to
                                </p>
                                <p
                                    className="text-sm sm:text-base font-semibold text-center mb-7 sm:mb-8 break-all"
                                    style={{ color: theme.colors.text.heading }}
                                >
                                    {email}
                                </p>
                            </>
                        )}

                        {/* OTP inputs */}
                        <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
                            <div
                                className="grid grid-cols-6 gap-2 sm:gap-3 w-full max-w-sm mb-3"
                                onPaste={handlePaste}
                            >
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => (inputRefs.current[index] = el)}
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        maxLength={1}
                                        value={digit}
                                        disabled={loading || status === "success"}
                                        onChange={(e) => handleChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        className={`aspect-square w-full text-center text-lg sm:text-xl font-semibold ${theme.radius.md} border bg-white focus:outline-none focus:ring-2 transition-colors`}
                                        style={{
                                            borderColor: boxBorderColor(digit),
                                            color: theme.colors.text.heading,
                                            boxShadow:
                                                status === "error"
                                                    ? "0 0 0 2px rgba(220,38,38,0.15)"
                                                    : status === "success"
                                                        ? `0 0 0 2px ${theme.colors.success}26`
                                                        : digit
                                                            ? `0 0 0 2px ${theme.colors.primaryLight}33`
                                                            : "none",
                                            opacity: loading || status === "success" ? 0.7 : 1,
                                        }}
                                    />
                                ))}
                            </div>

                            {/* Inline status row */}
                            <div className="w-full max-w-sm min-h-[1.5rem] mb-5 sm:mb-6 flex items-center justify-center">
                                {loading && (
                                    <span
                                        className="flex items-center gap-2 text-sm font-medium"
                                        style={{ color: theme.colors.primary }}
                                    >
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Verifying code...
                                    </span>
                                )}
                                {status === "error" && (
                                    <span className="text-sm font-medium" style={{ color: "#DC2626" }}>
                                        {errorMsg}
                                    </span>
                                )}
                                {status === "success" && (
                                    <span
                                        className="flex items-center gap-2 text-sm font-medium"
                                        style={{ color: theme.colors.success }}
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        Code verified
                                    </span>
                                )}
                            </div>

                            {/* Manual fallback button — only shown before auto-verify resolves */}
                            {status !== "success" && (
                                <button
                                    type="submit"
                                    disabled={!isComplete || loading}
                                    className={`w-full flex items-center justify-center gap-2 ${theme.radius.md} font-semibold py-3 sm:py-3.5 transition-colors ${theme.shadow.button}`}
                                    style={{
                                        backgroundColor:
                                            isComplete && !loading
                                                ? theme.colors.primaryLight
                                                : "#BFDBFE",
                                        color: theme.colors.text.white,
                                        cursor:
                                            isComplete && status !== "verifying" ? "pointer" : "not-allowed",
                                        opacity: isComplete && status !== "verifying" ? 1 : 0.8,
                                    }}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Verifying...
                                        </>
                                    ) : (
                                        <>
                                            Verify and continue
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            )}
                        </form>

                        {status !== "success" && (
                            <p className="text-sm mt-6 text-center" style={{ color: theme.colors.text.body }}>
                                Didn't receive the code?{" "}
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={secondsLeft > 0 || loading}
                                    className="font-medium"
                                    style={{
                                        color:
                                            secondsLeft > 0 || loading
                                                ? theme.colors.text.light
                                                : theme.colors.primary,
                                        cursor:
                                            secondsLeft > 0 || loading
                                                ? "default"
                                                : "pointer",
                                    }}
                                >
                                    {loading
                                        ? "Sending..."
                                        : secondsLeft > 0
                                            ? `Resend in ${secondsLeft}s`
                                            : "Resend code"}
                                </button>
                            </p>
                        )}
                    </div>

                    {/* Footnote */}
                    {status !== "success" && (
                        <p className="text-xs sm:text-sm text-center mt-6 px-4" style={{ color: theme.colors.text.light }}>
                            Check spam/junk folder · Code expires in 10 minutes
                        </p>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full py-5 sm:py-6">
                <p className="text-xs sm:text-sm text-center" style={{ color: theme.colors.text.light }}>
                    © 2026 TrueMindPath. All rights reserved.
                </p>
            </footer>
        </div>
    );
};

export default VerifyOtp;