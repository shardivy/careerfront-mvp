import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    User,
    Mail,
    Phone,
    GraduationCap,
    MapPin,
    Lock,
    Eye,
    EyeOff,
    ShieldCheck,
    Lock as LockIcon,
    UserCheck,
    Rocket,
    ArrowRight,
    Star,
} from "lucide-react";
import theme from "../theme/theme";
import { useDispatch, useSelector } from "react-redux";
import { registerUser } from "../slices/authSlice";

const avatarUrls = [
    "https://i.pravatar.cc/64?img=5",
    "https://i.pravatar.cc/64?img=9",
    "https://i.pravatar.cc/64?img=12",
    "https://i.pravatar.cc/64?img=32",
    "https://i.pravatar.cc/64?img=14",
];

const Register = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

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
        firstName: "",
        lastName: "",
        email: "",
        mobile: "",
        grade: "",
        // city: "",
        password: "",
        confirmPassword: "",
        agreeTerms: false,
        sendUpdates: true,
    });

    const [errors, setErrors] = useState({
        firstName: "",
        lastName: "",
        email: "",
        mobile: "",
        password: "",
        confirmPassword: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [message, setMessage] = useState({
        type: "", // success | error
        text: "",
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        let newValue = value;
        let error = "";

        switch (name) {
            case "firstName":
            case "lastName":
                // Only alphabets and spaces
                newValue = value.replace(/[^A-Za-z ]/g, "");

                if (!newValue.trim()) {
                    error = "This field is required";
                } else if (newValue.length < 2) {
                    error = "Minimum 2 characters";
                }
                break;

            case "mobile":
                // Only digits
                newValue = value.replace(/\D/g, "").slice(0, 10);

                if (!/^\d{10}$/.test(newValue) && newValue.length > 0) {
                    error = "Mobile number must be 10 digits";
                }
                break;

            case "email":
                newValue = value;

                if (value && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
                    error = "Enter a valid email";
                }
                break;

            case "password":
                newValue = value;

                if (value.length < 8) {
                    error = "Password must be at least 8 characters";
                } else if (!/(?=.*[A-Z])/.test(value)) {
                    error = "Must contain one uppercase letter";
                } else if (!/(?=.*[a-z])/.test(value)) {
                    error = "Must contain one lowercase letter";
                } else if (!/(?=.*\d)/.test(value)) {
                    error = "Must contain one number";
                } else if (!/(?=.*[@$!%*?&])/.test(value)) {
                    error = "Must contain one special character";
                }
                break;

            case "confirmPassword":
                newValue = value;

                if (value !== form.password) {
                    error = "Passwords do not match";
                }
                break;

            default:
                break;
        }

        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : newValue,
        }));

        setErrors((prev) => ({
            ...prev,
            [name]: error,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage({ type: "", text: "" });

        // Validate required fields
        const requiredCheck = {
            firstName: !form.firstName.trim() ? "This field is required" : errors.firstName,
            lastName: !form.lastName.trim() ? "This field is required" : errors.lastName,
            email: !form.email.trim() ? "This field is required" : errors.email,
            mobile: !form.mobile.trim() ? "This field is required" : errors.mobile,
            password: !form.password ? "Password is required" : errors.password,
            confirmPassword: !form.confirmPassword
                ? "Please confirm your password"
                : errors.confirmPassword,
        };

        const hasErrors = Object.values(requiredCheck).some(Boolean);

        if (hasErrors) {
            setErrors(requiredCheck);
            setMessage({
                type: "error",
                text: "Please fix all validation errors.",
            });
            return;
        }

        if (!form.agreeTerms) {
            setMessage({
                type: "error",
                text: "Please agree to the Terms of Service and Privacy Policy.",
            });
            return;
        }

        if (form.password !== form.confirmPassword) {
            setMessage({
                type: "error",
                text: "Passwords do not match.",
            });
            return;
        }

        const payload = {
            full_name: `${form.firstName} ${form.lastName}`.trim(),
            email: form.email,
            mobile: form.mobile,
            grade: form.grade,
            // city: form.city,
            password: form.password,
            confirm_password: form.confirmPassword,
        };

        try {
            const response = await dispatch(registerUser(payload)).unwrap();

            setMessage({
                type: "success",
                text: response.message || "Registration Successful",
            });

            setTimeout(() => {
                navigate("/verify-otp", {
                    state: {
                        email: form.email,
                        mobile: form.mobile,
                    },
                });
            }, 1000);

        } catch (err) {

            const backendErrors = err?.errors || {};

            setErrors((prev) => ({
                ...prev,
                email: backendErrors.email?.[0] || "",
                mobile: backendErrors.mobile?.[0] || "",
                password: backendErrors.password?.[0] || "",
                confirmPassword: backendErrors.confirm_password?.[0] || "",
            }));

            const errorMessage =
                Object.values(backendErrors).flat().join("\n") ||
                err?.message ||
                "Registration Failed";

            setMessage({
                type: "error",
                text: errorMessage,
            });
        }
    };


    useEffect(() => {
        if (!message.text) return;

        const timer = setTimeout(() => {
            setMessage({ type: "", text: "" });
        }, 3000);

        return () => clearTimeout(timer);
    }, [message]);

    return (
        <div
            className={`min-h-screen w-full bg-gradient-to-br ${theme.colors.background.page} flex flex-col lg:flex-row`}
            style={{ fontFamily: theme.font.family }}
        >
            {/* LEFT PANEL — Brand / Marketing */}
            <div className="relative w-full lg:w-1/2 overflow-hidden px-8 sm:px-12 lg:px-16 py-10 lg:py-14 flex flex-col">
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
                        src="./logoo.png"
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
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.colors.primary }} />
                    Career Intelligence Platform
                </div>

                {/* Heading */}
                <h1
                    className="relative text-5xl sm:text-6xl font-extrabold leading-[1.05] mb-6 tracking-tight"
                    style={{ color: theme.colors.text.heading }}
                >
                    Your career
                    <br />
                    journey
                    <br />
                    <span style={{ color: theme.colors.primaryLight }}>starts here.</span>
                </h1>

                <p className="relative text-lg max-w-md mb-8 leading-relaxed" style={{ color: theme.colors.text.light }}>
                    Join 12,400+ students who discovered their true calling through
                    science-backed assessment and personalized mentorship.
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
                        <div className="flex items-center gap-1 font-semibold" style={{ color: theme.colors.text.heading }}>
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

                {/* Hero illustration card */}
                <div className="relative flex-1 min-h-[420px] rounded-3xl flex items-center justify-start pl-1">
                    <img
                        src="/regi1.png"
                        alt="Students discovering their career path"
                        className="w-[420px] h-auto object-contain animate-float"
                    />
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

            {/* RIGHT PANEL — Form */}
            <div className="w-full lg:w-1/2 bg-white px-6 sm:px-12 lg:px-20 py-10 lg:py-14 flex flex-col">
                <div className="max-w-md w-full mx-auto flex-1 flex flex-col">
                    {/* Step badge */}
                    <div className={`w-fit ${theme.badge.blue} mb-6`}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.colors.primary }} />
                        Step 1 of 1 — Create Account
                    </div>

                    <h2 className="text-4xl font-extrabold mb-2 tracking-tight" style={{ color: theme.colors.text.heading }}>
                        Create your free account
                    </h2>
                    <p className="mb-7" style={{ color: theme.colors.text.light }}>
                        Already have an account?{" "}
                        <button
                            type="button"
                            onClick={() => navigate("/login")}
                            className="font-medium hover:opacity-80 bg-transparent border-none cursor-pointer p-0"
                            style={{ color: theme.colors.primary }}
                        >
                            Sign in instead
                        </button>
                    </p>

                    {/* Divider */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1 h-px bg-slate-200" />
                        <span className="text-sm text-slate-400 whitespace-nowrap">register with email</span>
                        <div className="flex-1 h-px bg-slate-200" />
                    </div>

                    {/* Server / submit-level message */}
                    {message.text && (
                        <div
                            className={`mb-5 text-sm rounded-lg px-4 py-2.5 border ${message.type === "success"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-red-50 text-red-600 border-red-200"
                                }`}
                        >
                            {message.text}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
                        <div className="grid grid-cols-2 gap-4">
                            <Field
                                label="First Name"
                                name="firstName"
                                placeholder="Anika"
                                icon={User}
                                value={form.firstName}
                                onChange={handleChange}
                                error={errors.firstName}
                            />
                            <Field
                                label="Last Name"
                                name="lastName"
                                placeholder="Sharma"
                                icon={User}
                                value={form.lastName}
                                onChange={handleChange}
                                error={errors.lastName}
                            />
                        </div>

                        <Field
                            label="Email Address"
                            name="email"
                            type="email"
                            placeholder="anika@example.com"
                            icon={Mail}
                            value={form.email}
                            onChange={handleChange}
                            error={errors.email}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Field
                                label="Phone Number"
                                name="mobile"
                                type="tel"
                                placeholder="+91 98765 43210"
                                icon={Phone}
                                value={form.mobile}
                                onChange={handleChange}
                                error={errors.mobile}
                            />
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Current Grade
                                </label>
                                <div className="relative">
                                    <GraduationCap className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                    <select
                                        name="grade"
                                        value={form.grade}
                                        onChange={handleChange}
                                        className={`${theme.input.withIcon} appearance-none`}
                                    >
                                        <option value="">Select grade</option>
                                        <option value="9">Grade 9</option>
                                        <option value="10">Grade 10</option>
                                        <option value="11">Grade 11</option>
                                        <option value="12">Grade 12</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        {/* <Field
    label="City"
    name="city"
    placeholder="Mumbai"
    icon={MapPin}
    value={form.city}
    onChange={handleChange}
/> */}
                        <PasswordField
                            label="Password"
                            name="password"
                            placeholder="Create a strong password"
                            value={form.password}
                            onChange={handleChange}
                            show={showPassword}
                            toggleShow={() => setShowPassword((s) => !s)}
                            error={errors.password}
                        />

                        <PasswordField
                            label="Confirm Password"
                            name="confirmPassword"
                            placeholder="Repeat your password"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            show={showConfirmPassword}
                            toggleShow={() => setShowConfirmPassword((s) => !s)}
                            error={errors.confirmPassword}
                        />

                        {/* Checkboxes */}
                        <label className="flex items-start gap-3 text-sm text-slate-500 cursor-pointer">
                            <input
                                type="checkbox"
                                name="agreeTerms"
                                checked={form.agreeTerms}
                                onChange={handleChange}
                                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#3B82F6] focus:ring-[#60A5FA]"
                            />
                            <span>
                                I agree to TheCareerFront's{" "}
                                <a href="#" className="font-medium" style={{ color: theme.colors.primary }}>
                                    Terms of Service
                                </a>{" "}
                                and{" "}
                                <a href="#" className="font-medium" style={{ color: theme.colors.primary }}>
                                    Privacy Policy
                                </a>
                                . Your data is never sold or shared.
                            </span>
                        </label>

                        <label className="flex items-start gap-3 text-sm text-slate-500 cursor-pointer">
                            <input
                                type="checkbox"
                                name="sendUpdates"
                                checked={form.sendUpdates}
                                onChange={handleChange}
                                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#3B82F6] focus:ring-[#60A5FA]"
                            />
                            <span>
                                Send me career insights, new feature updates, and assessment tips.
                            </span>
                        </label>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`mt-2 flex items-center justify-center gap-2 ${theme.radius.md} font-semibold py-3.5 transition-colors ${theme.button.primary} ${theme.shadow.button}`}
                            style={{ opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
                        >
                            <Rocket className="w-4 h-4" />
                            {loading ? "Creating account..." : "Begin My Journey — It's Free"}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>

                    <br />
                    <hr />
                    {/* Trust row */}
                    <div className="flex items-center justify-center gap-6 mt-7 text-sm text-slate-500">
                        <span className="flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4" style={{ color: theme.colors.primaryLight }} /> SSL Secured
                        </span>
                        <span className="w-px h-4 bg-slate-200" />
                        <span className="flex items-center gap-1.5">
                            <LockIcon className="w-4 h-4" style={{ color: theme.colors.primaryLight }} /> GDPR Compliant
                        </span>
                        <span className="w-px h-4 bg-slate-200" />
                        <span className="flex items-center gap-1.5">
                            <UserCheck className="w-4 h-4" style={{ color: theme.colors.primaryLight }} /> Never Sold
                        </span>
                    </div>

                    <p className="text-center text-sm text-slate-400 mt-6">
                        By creating an account you agree to our{" "}
                        <a href="#" className="font-medium" style={{ color: theme.colors.primary }}>
                            Terms
                        </a>{" "}
                        &{" "}
                        <a href="#" className="font-medium" style={{ color: theme.colors.primary }}>
                            Privacy Policy
                        </a>
                    </p>
                    <br />
                    <div className="w-full border-t border-slate-200 px-6 sm:px-12 lg:px-20 py-5">
                        <p className="text-sm text-slate-400 text-center lg:text-left">
                            © 2026 TheCareerFront. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ---------- Reusable Field components ---------- */

const Field = ({ label, name, value, onChange, placeholder, icon: Icon, type = "text", error }) => {
    return (
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
            <div className="relative">
                {Icon && <Icon className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />}
                <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={`${Icon ? theme.input.withIcon : theme.input.base.replace("pr-4", "pl-4 pr-4")} ${error ? "border-red-400 focus:border-red-400 focus:ring-red-200" : ""
                        }`}
                />
            </div>
            {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
        </div>
    );
};

const PasswordField = ({ label, name, value, onChange, placeholder, show, toggleShow, error }) => {
    return (
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
            <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                    type={show ? "text" : "password"}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={`${theme.input.withIcon} pr-11 ${error ? "border-red-400 focus:border-red-400 focus:ring-red-200" : ""
                        }`}
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
            {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
        </div>
    );
};

export default Register;