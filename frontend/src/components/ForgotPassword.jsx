import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    Compass,
    Mail,
    ShieldCheck,
    Lock as LockIcon,
    Rocket,
    ArrowRight,
    ArrowLeft,
    Star,
    CheckCircle2,
    PartyPopper,
    ShieldCheck as VerifiedIcon,
} from "lucide-react";
import theme from "../theme/theme";
import ResetPassword from "./ResetPassword";
import { useDispatch, useSelector } from "react-redux";
import { forgotPassword, verifyResetOtp, } from "../slices/authSlice";


const avatarUrls = [
    "https://i.pravatar.cc/64?img=5",
    "https://i.pravatar.cc/64?img=9",
    "https://i.pravatar.cc/64?img=12",
    "https://i.pravatar.cc/64?img=32",
    "https://i.pravatar.cc/64?img=14",
];

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

const ForgotPassword = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { forgotPasswordLoading, verifyResetOtpLoading, } = useSelector((state) => state.auth);

    useEffect(() => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href =
            "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
        document.head.appendChild(link);
        return () => document.head.removeChild(link);
    }, []);

    // step: "email" -> "otp" -> "newPassword" -> "success"
    const [step, setStep] = useState("email");

    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
    const [resetToken, setResetToken] = useState(null); // returned once OTP is verified

    const [error, setError] = useState("");
    const [resendTimer, setResendTimer] = useState(0);

    const otpRefs = useRef([]);

    // Countdown for resend OTP
    useEffect(() => {
        if (resendTimer <= 0) return;
        const id = setInterval(() => setResendTimer((t) => t - 1), 1000);
        return () => clearInterval(id);
    }, [resendTimer]);

    /* ---------- Step 1: send OTP ---------- */

    const handleSendOtp = async (e) => {
        e.preventDefault();

        setError("");

        if (!email.trim()) {
            setError("Please enter your email address.");
            return;
        }

        try {
            await dispatch(
                forgotPassword({
                    email,
                })
            ).unwrap();

            setOtp(Array(OTP_LENGTH).fill(""));
            setResendTimer(RESEND_SECONDS);
            setStep("otp");
        } catch (err) {
            const backendErrors = err?.errors || {};

            const errorMessage =
                Object.values(backendErrors).flat().join("\n") ||
                err?.message ||
                "Failed to send OTP.";

            setError(errorMessage);
        }
    };

    const handleResendOtp = async () => {
        if (resendTimer > 0) return;

        setError("");

        try {
            await dispatch(
                forgotPassword({
                    email,
                })
            ).unwrap();

            setOtp(Array(OTP_LENGTH).fill(""));
            otpRefs.current[0]?.focus();
            setResendTimer(RESEND_SECONDS);
        } catch (err) {
            const backendErrors = err?.errors || {};

            const errorMessage =
                Object.values(backendErrors).flat().join("\n") ||
                err?.message ||
                "Failed to resend OTP.";

            setError(errorMessage);
        }
    };

    /* ---------- OTP input handling ---------- */

    const handleOtpChange = (index, value) => {
        const digit = value.replace(/\D/g, "").slice(-1);
        const next = [...otp];
        next[index] = digit;
        setOtp(next);

        if (digit && index < OTP_LENGTH - 1) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
        if (!pasted) return;
        e.preventDefault();
        const next = Array(OTP_LENGTH).fill("");
        pasted.split("").forEach((digit, i) => (next[i] = digit));
        setOtp(next);
        otpRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
    };

    /* ---------- Step 2: verify OTP only ---------- */

    const otpValue = otp.join("");

    const handleVerifyOtp = async (e) => {
        e.preventDefault();

        setError("");

        if (otpValue.length !== OTP_LENGTH) {
            setError("Please enter the full 6-digit code.");
            return;
        }

        try {
            const response = await dispatch(
                verifyResetOtp({
                    email,
                    otp: otpValue,
                })
            ).unwrap();

            setResetToken(null);
            setStep("newPassword");
        } catch (err) {
            const backendErrors = err?.errors || {};

            const errorMessage =
                Object.values(backendErrors).flat().join("\n") ||
                err?.message ||
                "Invalid or expired OTP.";

            setError(errorMessage);
        }
    };


    return (
        <div
            className={`min-h-screen w-full bg-gradient-to-br ${theme.colors.background.page} flex flex-col lg:flex-row`}
            style={{ fontFamily: theme.font.family }}
        >
            {/* LEFT PANEL — Brand / Marketing (hidden on mobile/tablet) */}
            <div className="relative hidden lg:flex w-full lg:w-1/2 overflow-hidden px-8 sm:px-12 lg:px-16 py-10 lg:py-14 flex-col">

                {/* Background bubbles */}
                <div className="absolute top-[-120px] right-[-120px] w-[380px] h-[380px] rounded-full bg-blue-200/20" />
                <div className="absolute bottom-20 right-[-70px] w-[220px] h-[220px] rounded-full bg-blue-200/20" />
                <div className="absolute bottom-[-120px] left-[-120px] w-[260px] h-[260px] rounded-full bg-blue-200/20" />
                <div className="absolute top-[45%] left-[-140px] w-[180px] h-[180px] rounded-full bg-blue-100/20" />
                <div
                    className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl"
                    style={{ backgroundColor: `${theme.colors.primary}26` }}
                />
                <div className="pointer-events-none absolute bottom-0 -right-10 w-80 h-80 rounded-full bg-blue-200/40 blur-3xl" />

                {/* Logo */}
                <div className="relative flex items-center gap-1 mb-10">
                    <img
                        src="/logoo.png"
                        alt="TheCareerFront Logo"
                        className="w-20 h-20 object-contain"
                    />

                    <span
                        className="text-2xl font-bold tracking-tight"
                        style={{ color: theme.colors.text.heading }}
                    >
                        TheCareerFront
                    </span>
                </div>

                {/* Eyebrow badge */}
                <div className={`relative w-fit ${theme.badge.white} text-slate-600 mb-6`}>
                    <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: theme.colors.primary }}
                    />
                    Career Intelligence Platform
                </div>

                {/* Heading */}
                <h1
                    className="relative text-5xl xl:text-6xl font-extrabold leading-[1.05] mb-6 tracking-tight"
                    style={{ color: theme.colors.text.heading }}
                >
                    Let's get you
                    <br />
                    back
                    <br />
                    <span style={{ color: theme.colors.primaryLight }}>on track.</span>
                </h1>

                <p
                    className="relative text-lg max-w-md mb-8 leading-relaxed"
                    style={{ color: theme.colors.text.light }}
                >
                    It happens to everyone. Enter the email tied to your account and
                    we'll send over a 6-digit code to reset your password.
                </p>

                {/* Social proof */}
                <div className="relative flex items-center gap-4 mb-10">
                    <div className="flex -space-x-3">
                        {avatarUrls.map((src, i) => (
                            <img
                                key={i}
                                src={src}
                                alt="Student"
                                className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm"
                            />
                        ))}
                    </div>
                    <div>
                        <div
                            className="flex items-center gap-1 font-semibold"
                            style={{ color: theme.colors.text.heading }}
                        >
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className="w-4 h-4"
                                    style={{ fill: theme.colors.primaryLight, color: theme.colors.primaryLight }}
                                />
                            ))}
                            <span className="ml-1">4.9</span>
                        </div>
                        <p className="text-sm" style={{ color: theme.colors.text.light }}>
                            from 3,200+ student reviews
                        </p>
                    </div>
                </div>

                {/* Feature highlights instead of an illustration */}
                <div className="relative flex-1 flex flex-col justify-center gap-5 max-w-md">
                    {[
                        "Personalized career roadmap that updates as you grow",
                        "1:1 sessions with certified counsellors",
                        "Science-backed aptitude & psychometric reports",
                    ].map((item) => (
                        <div key={item} className="flex items-start gap-3">
                            <CheckCircle2
                                className="w-5 h-5 mt-0.5 shrink-0"
                                style={{ color: theme.colors.primary }}
                            />
                            <span className="text-slate-600">{item}</span>
                        </div>
                    ))}
                </div>

                {/* Trust pills */}
                <div className="relative flex flex-wrap gap-3 mt-6">
                    {[
                        { icon: ShieldCheck, label: "Science-backed" },
                        { icon: LockIcon, label: "100% Private" },
                        { icon: Rocket, label: "Ready in 24 min" },
                    ].map(({ icon: Icon, label }) => (
                        <div key={label} className={`${theme.badge.white} text-slate-600`}>
                            <Icon className="w-4 h-4" style={{ color: theme.colors.primary }} />
                            {label}
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT PANEL — Form (full width on mobile/tablet, half on desktop) */}
            <div className="w-full lg:w-1/2 bg-white px-5 sm:px-10 md:px-16 lg:px-20 py-8 sm:py-10 lg:py-14 flex flex-col">
                <div className="max-w-md w-full mx-auto flex-1 flex flex-col justify-center">

                    {/* Mobile-only logo (since brand panel is hidden) */}
                    <div className="flex lg:hidden items-center gap-3 mb-8 justify-center">
                        <div
                            className={`w-10 h-10 ${theme.radius.md} flex items-center justify-center ${theme.shadow.button}`}
                            style={{ backgroundColor: theme.colors.primary }}
                        >
                            <Compass className="w-5 h-5" style={{ color: theme.colors.text.white }} strokeWidth={2} />
                        </div>
                        <span
                            className="text-xl font-bold tracking-tight"
                            style={{ color: theme.colors.text.heading }}
                        >
                            TrueMindPath
                        </span>
                    </div>

                    {/* ---------------- STEP 1: EMAIL ---------------- */}
                    {step === "email" && (
                        <>
                            <button
                                type="button"
                                onClick={() => navigate("/login")}
                                className="flex items-center gap-1.5 text-sm font-medium mb-6 mx-auto lg:mx-0 hover:opacity-80"
                                style={{ color: theme.colors.text.body }}
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to login
                            </button>

                            <div className={`w-fit ${theme.badge.blue} mb-6 mx-auto lg:mx-0`}>
                                <span
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ backgroundColor: theme.colors.primary }}
                                />
                                Reset password
                            </div>

                            <h2
                                className="text-3xl sm:text-4xl font-extrabold mb-2 tracking-tight text-center lg:text-left"
                                style={{ color: theme.colors.text.heading }}
                            >
                                Forgot your password?
                            </h2>
                            <p className="mb-7 text-center lg:text-left" style={{ color: theme.colors.text.light }}>
                                No worries — enter your email and we'll send you a 6-digit
                                code to reset it.
                            </p>

                            {error && (
                                <div
                                    className={`mb-5 text-sm px-4 py-3 ${theme.radius.md}`}
                                    style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}
                                >
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSendOtp} className="flex flex-col gap-5">
                                <Field
                                    label="Email Address"
                                    name="email"
                                    type="email"
                                    placeholder="anika@example.com"
                                    icon={Mail}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />

                                <button
                                    type="submit"
                                    disabled={forgotPasswordLoading}
                                    className={`mt-2 flex items-center justify-center gap-2 ${theme.radius.md} font-semibold py-3.5 transition-colors ${theme.button.primary} ${theme.shadow.button}`}
                                    style={{ opacity: forgotPasswordLoading ? 0.7 : 1, cursor: forgotPasswordLoading ? "not-allowed" : "pointer" }}
                                >
                                    <Rocket className="w-4 h-4" />
                                    {forgotPasswordLoading ? "Sending code..." : "Send OTP"}
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </form>
                        </>
                    )}

                    {/* ---------------- STEP 2: VERIFY OTP ---------------- */}
                    {step === "otp" && (
                        <>
                            <button
                                type="button"
                                onClick={() => {
                                    setError("");
                                    setStep("email");
                                }}
                                className="flex items-center gap-1.5 text-sm font-medium mb-6 mx-auto lg:mx-0 hover:opacity-80"
                                style={{ color: theme.colors.text.body }}
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Change email
                            </button>

                            <div className={`w-fit ${theme.badge.blue} mb-6 mx-auto lg:mx-0`}>
                                <span
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ backgroundColor: theme.colors.primary }}
                                />
                                Verify code
                            </div>

                            <h2
                                className="text-3xl sm:text-4xl font-extrabold mb-2 tracking-tight text-center lg:text-left"
                                style={{ color: theme.colors.text.heading }}
                            >
                                Enter the code
                            </h2>
                            <p className="mb-7 text-center lg:text-left" style={{ color: theme.colors.text.light }}>
                                We sent a 6-digit code to{" "}
                                <span className="font-semibold" style={{ color: theme.colors.text.heading }}>
                                    {email}
                                </span>
                                .
                            </p>

                            {error && (
                                <div
                                    className={`mb-5 text-sm px-4 py-3 ${theme.radius.md}`}
                                    style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}
                                >
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
                                {/* OTP boxes */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Verification Code
                                    </label>
                                    <div className="flex items-center justify-between gap-2 sm:gap-3">
                                        {otp.map((digit, i) => (
                                            <input
                                                key={i}
                                                ref={(el) => (otpRefs.current[i] = el)}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={1}
                                                value={digit}
                                                onChange={(e) => handleOtpChange(i, e.target.value)}
                                                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                                onPaste={handleOtpPaste}
                                                className={`w-full aspect-square text-center text-lg font-semibold border border-slate-200 ${theme.radius.md} text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#60A5FA] focus:border-transparent`}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-between mt-3">
                                        <span className="text-xs" style={{ color: theme.colors.text.light }}>
                                            Didn't get it? Check spam too.
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleResendOtp}
                                            disabled={resendTimer > 0 || forgotPasswordLoading}
                                            className="text-xs font-semibold hover:opacity-80 disabled:opacity-50"
                                            style={{ color: theme.colors.primary }}
                                        >
                                            {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend code"}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={verifyResetOtpLoading}
                                    className={`mt-2 flex items-center justify-center gap-2 ${theme.radius.md} font-semibold py-3.5 transition-colors ${theme.button.primary} ${theme.shadow.button}`}
                                    style={{ opacity: verifyResetOtpLoading ? 0.7 : 1, cursor: verifyResetOtpLoading ? "not-allowed" : "pointer" }}
                                >
                                    <VerifiedIcon className="w-4 h-4" />
                                    {verifyResetOtpLoading ? "Verifying..." : "Verify Code"}
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </form>
                        </>
                    )}

                    {/* ---------------- STEP 3: NEW PASSWORD (separate component, shown only after OTP verified) ---------------- */}
                    {step === "newPassword" && (
                        <ResetPassword
                            email={email}
                            resetToken={resetToken}
                            onSuccess={() => setStep("success")}
                        />
                    )}

                    {/* ---------------- STEP 4: SUCCESS ---------------- */}
                    {step === "success" && (
                        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                            <div
                                className={`w-16 h-16 ${theme.radius.full} flex items-center justify-center mb-6`}
                                style={{ backgroundColor: theme.colors.secondary }}
                            >
                                <PartyPopper className="w-8 h-8" style={{ color: theme.colors.primary }} />
                            </div>

                            <h2
                                className="text-3xl sm:text-4xl font-extrabold mb-3 tracking-tight"
                                style={{ color: theme.colors.text.heading }}
                            >
                                Password updated
                            </h2>
                            <p className="mb-7" style={{ color: theme.colors.text.light }}>
                                Your password has been reset successfully. You can now sign
                                in with your new password.
                            </p>

                            <button
                                type="button"
                                onClick={() => navigate("/login")}
                                className={`w-full flex items-center justify-center gap-2 ${theme.radius.md} font-semibold py-3.5 transition-colors ${theme.button.primary} ${theme.shadow.button}`}
                            >
                                Continue to Login
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    <br />
                    <hr />
                    {/* Trust row */}
                    <div className="flex items-center justify-center gap-4 sm:gap-6 mt-7 text-xs sm:text-sm text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4" style={{ color: theme.colors.primaryLight }} /> SSL Secured
                        </span>
                        <span className="w-px h-4 bg-slate-200 hidden sm:block" />
                        <span className="flex items-center gap-1.5">
                            <LockIcon className="w-4 h-4" style={{ color: theme.colors.primaryLight }} /> GDPR Compliant
                        </span>
                    </div>

                    <div className="w-full border-t border-slate-200 py-5 mt-6">
                        <p className="text-sm text-slate-400 text-center">
                            © 2026 TrueMindPath. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ---------- Reusable Field components ---------- */

const Field = ({ label, name, value, onChange, placeholder, icon: Icon, type = "text" }) => {
    return (
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {label}
            </label>
            <div className="relative">
                {Icon && (
                    <Icon className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                )}
                <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={Icon ? theme.input.withIcon : theme.input.base.replace("pr-4", "pl-4 pr-4")}
                />
            </div>
        </div>
    );
};

export default ForgotPassword;