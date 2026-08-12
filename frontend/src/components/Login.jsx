import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Compass,
    Mail,
    Lock,
    Eye,
    EyeOff,
    ShieldCheck,
    Lock as LockIcon,
    Rocket,
    ArrowRight,
    Star,
    CheckCircle2,
    CheckCircle,
    XCircle,
    X,
} from "lucide-react";
import theme from "../theme/theme";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../slices/authSlice";


const avatarUrls = [
    "https://i.pravatar.cc/64?img=5",
    "https://i.pravatar.cc/64?img=9",
    "https://i.pravatar.cc/64?img=12",
    "https://i.pravatar.cc/64?img=32",
    "https://i.pravatar.cc/64?img=14",
];

const Login = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [errors, setErrors] = useState({
        email: "",
        password: "",
    });

    const { loading } = useSelector((state) => state.auth);

    useEffect(() => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href =
            "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
        document.head.appendChild(link);
        return () => document.head.removeChild(link);
    }, []);

    const [form, setForm] = useState({
        email: "",
        password: "",
        rememberMe: true,
    });

    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({
        type: "", // success | error
        text: "",
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));

        if (name === "email") {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            setErrors((prev) => ({
                ...prev,
                email:
                    value === ""
                        ? "Email is required"
                        : !emailRegex.test(value)
                            ? "Invalid email address"
                            : "",
            }));
        }

        if (name === "password") {
            const passwordRegex =
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

            setErrors((prev) => ({
                ...prev,
                password:
                    value === ""
                        ? "Password is required"
                        : !passwordRegex.test(value)
                            ? "Password must contain uppercase, lowercase, number, special character and be at least 8 characters."
                            : "",
            }));
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationError = validateForm();

        if (validationError) {
            setMessage({
                type: "error",
                text: validationError,
            });
            return;
        }

        // ==========================
        // TEMPORARY LOGIN (NO API)
        // ==========================

        // Fake token
        localStorage.setItem("accessToken", "dummy-access-token");
        localStorage.setItem("refreshToken", "dummy-refresh-token");

        // Add any user data your dashboard expects
        localStorage.setItem(
            "user",
            JSON.stringify({
                id: 1,
                name: "Test User",
                email: form.email,
                role: "student",
            })
        );

        setMessage({
            type: "success",
            text: "Login Successful",
        });

        setTimeout(() => {
            navigate("/test-selection"); 
            // navigate("/s-admin/dashboard");     
        }, 500);

        /*
        ==========================
        ORIGINAL API CODE
        ==========================
    
        try {
            const response = await dispatch(
                loginUser({
                    email: form.email,
                    password: form.password,
                })
            ).unwrap();
    
            localStorage.setItem(
                "accessToken",
                response.data.access_token
            );
    
            localStorage.setItem(
                "refreshToken",
                response.data.refresh_token
            );
    
            setMessage({
                type: "success",
                text: response.message || "Login Successful",
            });
    
            setTimeout(() => {
                navigate("/test-selection");
            }, 1000);
    
        } catch (error) {
    
            const backendErrors = error.errors || {};
    
            const errorMessage =
                backendErrors.detail?.[0] ||
                error.message ||
                "Invalid Email or Password";
    
            setMessage({
                type: "error",
                text: errorMessage,
            });
        }
        */
    };

    // const handleSubmit = async (e) => {
    //     e.preventDefault();

    //     if (!form.email || !form.password) {
    //         setMessage({
    //             type: "error",
    //             text: "Please enter both email and password.",
    //         });
    //         return;
    //     }

    //     try {
    //         const response = await dispatch(
    //             loginUser({
    //                 email: form.email,
    //                 password: form.password,
    //             })
    //         ).unwrap();

    //         localStorage.setItem(
    //             "accessToken",
    //             response.data.access_token
    //         );

    //         localStorage.setItem(
    //             "refreshToken",
    //             response.data.refresh_token
    //         );

    //         setMessage({
    //             type: "success",
    //             text: response.message || "Login Successful",
    //         });

    //         setTimeout(() => {
    //             navigate("/test-selection");
    //         }, 1000);

    //     } catch (error) {

    //         const backendErrors = error.errors || {};

    //         const errorMessage =
    //             backendErrors.detail?.[0] ||
    //             error.message ||
    //             "Invalid Email or Password";

    //         setMessage({
    //             type: "error",
    //             text: errorMessage,
    //         });
    //     }
    // };

    useEffect(() => {
        if (!message.text) return;

        const timer = setTimeout(() => {
            setMessage({
                type: "",
                text: "",
            });
        }, 3000);

        return () => clearTimeout(timer);
    }, [message]);

    const validateForm = () => {
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!form.email.trim()) {
            return "Email is required.";
        }

        if (!emailRegex.test(form.email)) {
            return "Please enter a valid email address.";
        }

        // Password validation
        if (!form.password) {
            return "Password is required.";
        }

        // Minimum 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
        const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

        if (!passwordRegex.test(form.password)) {
            return "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";
        }

        return null;
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
                <div className="relative flex items-center gap-3 mb-10">
                    <div
                        className={`w-11 h-11 ${theme.radius.md} flex items-center justify-center ${theme.shadow.button}`}
                        style={{ backgroundColor: theme.colors.primary }}
                    >
                        <Compass className="w-6 h-6" style={{ color: theme.colors.text.white }} strokeWidth={2} />
                    </div>
                    <span
                        className="text-2xl font-bold tracking-tight"
                        style={{ color: theme.colors.text.heading }}
                    >
                        TrueMindPath
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
                    Welcome
                    <br />
                    back to your
                    <br />
                    <span style={{ color: theme.colors.primaryLight }}>journey.</span>
                </h1>

                <p
                    className="relative text-lg max-w-md mb-8 leading-relaxed"
                    style={{ color: theme.colors.text.light }}
                >
                    Sign back in to pick up where you left off — your reports, mentor
                    sessions, and career roadmap are all right where you left them.
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

                    {/* Step badge */}
                    <div className={`w-fit ${theme.badge.blue} mb-6 mx-auto lg:mx-0`}>
                        <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: theme.colors.primary }}
                        />
                        Welcome back
                    </div>

                    <h2
                        className="text-3xl sm:text-4xl font-extrabold mb-2 tracking-tight text-center lg:text-left"
                        style={{ color: theme.colors.text.heading }}
                    >
                        Sign in to your account
                    </h2>
                    <p className="mb-7 text-center lg:text-left" style={{ color: theme.colors.text.light }}>
                        New to TrueMindPath?{" "}
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                navigate("/");
                            }}
                            className="font-medium hover:opacity-80"
                            style={{ color: theme.colors.primary }}
                        >
                            Create a free account
                        </a>
                    </p>

                    {/* OAuth buttons */}
                    {/* <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
                        <button
                            type="button"
                            className={`flex items-center justify-center gap-2 ${theme.radius.md} py-3 font-medium transition-colors ${theme.button.secondary}`}
                        >
                            <GoogleIcon className="w-5 h-5" />
                            <span className="hidden sm:inline">Google</span>
                        </button>
                        <button
                            type="button"
                            className={`flex items-center justify-center gap-2 ${theme.radius.md} py-3 font-medium transition-colors ${theme.button.secondary}`}
                        >
                            <AppleIcon className="w-5 h-5" />
                            <span className="hidden sm:inline">Apple</span>
                        </button>
                    </div> */}

                    {/* Divider */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1 h-px bg-slate-200" />
                        <span className="text-sm text-slate-400 whitespace-nowrap">
                            sign in with email
                        </span>
                        <div className="flex-1 h-px bg-slate-200" />
                    </div>


                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <Field
                            label="Email Address"
                            name="email"
                            type="email"
                            placeholder="anika@example.com"
                            icon={Mail}
                            value={form.email}
                            onChange={handleChange}
                        />

                        {errors.email && (
                            <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                        )}

                        <PasswordField
                            label="Password"
                            name="password"
                            placeholder="Enter your password"
                            value={form.password}
                            onChange={handleChange}
                            show={showPassword}
                            toggleShow={() => setShowPassword((s) => !s)}
                        />

                        {errors.password && (
                            <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                        )}

                        {/* Remember me + forgot password */}
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="rememberMe"
                                    checked={form.rememberMe}
                                    onChange={handleChange}
                                    className="w-4 h-4 rounded border-slate-300 text-[#3B82F6] focus:ring-[#60A5FA]"
                                />
                                Remember me
                            </label>
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    navigate("/forgot-password");
                                }}
                                className="text-sm font-medium hover:opacity-80"
                                style={{ color: theme.colors.primary }}
                            >
                                Forgot password?
                            </a>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`mt-2 flex items-center justify-center gap-2 ${theme.radius.md} font-semibold py-3.5 transition-colors ${theme.button.primary} ${theme.shadow.button}`}
                            style={{ opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
                        >
                            <Rocket className="w-4 h-4" />
                            {loading ? "Signing in..." : "Sign In"}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>

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

                    <p className="text-center text-sm text-slate-400 mt-6">
                        By signing in you agree to our{" "}
                        <a href="#" className="font-medium" style={{ color: theme.colors.primary }}>
                            Terms
                        </a>{" "}
                        &{" "}
                        <a href="#" className="font-medium" style={{ color: theme.colors.primary }}>
                            Privacy Policy
                        </a>
                    </p>

                    <br />
                    <div className="w-full border-t border-slate-200 py-5">
                        <p className="text-sm text-slate-400 text-center">
                            © 2026 TrueMindPath. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>

            {message.text && (
                <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] animate-in fade-in slide-in-from-top-2 duration-300">
                    <div
                        className={`flex items-center gap-3 rounded-xl border bg-white px-5 py-3 shadow-2xl min-w-[340px]
            ${message.type === "success"
                                ? "border-green-200"
                                : "border-red-200"
                            }`}
                    >
                        {message.type === "success" ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                        )}

                        <span
                            className={`flex-1 text-sm font-medium ${message.type === "success"
                                ? "text-green-700"
                                : "text-red-700"
                                }`}
                        >
                            {message.text}
                        </span>

                        <button
                            onClick={() =>
                                setMessage({
                                    type: "",
                                    text: "",
                                })
                            }
                        >
                            <X className="w-4 h-4 text-slate-400 hover:text-slate-700" />
                        </button>
                    </div>
                </div>
            )}
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

const PasswordField = ({ label, name, value, onChange, placeholder, show, toggleShow }) => {
    return (
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {label}
            </label>
            <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                    type={show ? "text" : "password"}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={`${theme.input.withIcon} pr-11`}
                />
                <button
                    type="button"
                    onClick={toggleShow}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                >
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
};

/* ---------- Brand icons ---------- */

const GoogleIcon = (props) => {
    return (
        <svg viewBox="0 0 24 24" {...props}>
            <path
                fill="#4285F4"
                d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.89c2.28-2.1 3.53-5.19 3.53-8.87z"
            />
            <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.89-3a7.4 7.4 0 0 1-11-3.89H1.04v3.09A12 12 0 0 0 12 24z"
            />
            <path
                fill="#FBBC05"
                d="M5.04 14.2a7.2 7.2 0 0 1 0-4.6V6.51H1.04a12 12 0 0 0 0 10.78z"
            />
            <path
                fill="#EA4335"
                d="M12 4.77c1.76 0 3.34.6 4.59 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.04 6.51l4 3.09A7.18 7.18 0 0 1 12 4.77z"
            />
        </svg>
    );
};

const AppleIcon = (props) => {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
            <path d="M16.36 1.43c0 1.14-.46 2.2-1.21 2.97-.81.84-2.13 1.49-3.25 1.4-.14-1.1.4-2.25 1.17-3.01.83-.83 2.18-1.43 3.29-1.36zM20.3 17.18c-.55 1.27-.81 1.84-1.52 2.96-.99 1.56-2.39 3.5-4.12 3.52-1.54.02-1.93-1-4.02-.99-2.09.01-2.52 1.01-4.06.99-1.73-.02-3.05-1.77-4.04-3.33-2.78-4.35-3.07-9.45-1.36-12.17 1.21-1.94 3.13-3.07 4.92-3.07 1.83 0 2.98 1 4.49 1 1.46 0 2.36-1 4.49-1 1.6 0 3.3.87 4.5 2.38-3.96 2.17-3.32 7.83.72 9.71z" />
        </svg>
    );
};

export default Login;