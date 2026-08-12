import React, { useState } from "react";
import { Lock, Eye, EyeOff, Rocket, ArrowRight, CheckCircle2 } from "lucide-react";
import theme from "../theme/theme";
import { useDispatch, useSelector } from "react-redux";
import { resetPassword } from "../slices/authSlice";


const passwordRules = [
    { id: "length", label: "At least 8 characters", test: (v) => v.length >= 8 },
    { id: "upper", label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
    { id: "number", label: "One number", test: (v) => /[0-9]/.test(v) },
];

const ResetPassword = ({ email, onSuccess }) => {
    const dispatch = useDispatch();

    const [form, setForm] = useState({ password: "", confirmPassword: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState({});


    const { loading } = useSelector((state) => state.auth);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const failedRules = passwordRules.filter((rule) => !rule.test(form.password));


    const validate = () => {
        const errors = {};

        if (!form.password.trim()) {
            errors.password = "Password is required.";
        } else if (form.password.length < 8) {
            errors.password = "Password must be at least 8 characters.";
        } else if (
            !/(?=.*[a-z])/.test(form.password) ||
            !/(?=.*[A-Z])/.test(form.password) ||
            !/(?=.*\d)/.test(form.password) ||
            !/(?=.*[@$!%*?&])/.test(form.password)
        ) {
            errors.password =
                "Password must contain uppercase, lowercase, number and special character.";
        }

        if (!form.confirmPassword.trim()) {
            errors.confirmPassword = "Confirm Password is required.";
        } else if (form.password !== form.confirmPassword) {
            errors.confirmPassword = "Passwords do not match.";
        }

        setError(errors);

        return Object.keys(errors).length === 0;
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) return;

        setIsSubmitting(true);
        setError({});

        try {
            await dispatch(
                resetPassword({
                    email,
                    new_password: form.password,
                    confirm_password: form.confirmPassword,
                })
            ).unwrap();

            onSuccess?.();

        } catch (err) {
            const backendErrors = err?.errors || {};

            const errorMessage =
                Object.values(backendErrors)
                    .flat()
                    .join("\n") ||
                err?.message ||
                "Failed to reset password.";

            setError({
                api: errorMessage,
            });
        } finally {
            setIsSubmitting(false);
        }
    };



    return (
        <>
            <div className={`w-fit ${theme.badge.blue} mb-6 mx-auto lg:mx-0`}>
                <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: theme.colors.primary }}
                />
                Code verified
            </div>

            <h2
                className="text-3xl sm:text-4xl font-extrabold mb-2 tracking-tight text-center lg:text-left"
                style={{ color: theme.colors.text.heading }}
            >
                Set a new password
            </h2>
            <p className="mb-7 text-center lg:text-left" style={{ color: theme.colors.text.light }}>
                Your code was verified. Create a new password for your account
                below.
            </p>

            {error.api && (
                <div
                    className={`mb-5 text-sm px-4 py-3 ${theme.radius.md}`}
                    style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}
                >
                    {error.api}
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <PasswordField
                    label="New Password"
                    name="password"
                    placeholder="Enter new password"
                    value={form.password}
                    onChange={handleChange}
                    show={showPassword}
                    toggleShow={() => setShowPassword((s) => !s)}
                />
                {error.password && (
                    <p className="text-red-500 text-sm mt-1">
                        {error.password}
                    </p>
                )}

                <PasswordField
                    label="Confirm Password"
                    name="confirmPassword"
                    placeholder="Re-enter new password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    show={showConfirm}
                    toggleShow={() => setShowConfirm((s) => !s)}
                />
                {error.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">
                        {error.confirmPassword}
                    </p>
                )}

                {/* Password requirements */}
                <div className="flex flex-col gap-1.5 -mt-1">
                    {passwordRules.map((rule) => {
                        const passed = rule.test(form.password);
                        return (
                            <div key={rule.id} className="flex items-center gap-2 text-xs">
                                <CheckCircle2
                                    className="w-3.5 h-3.5 shrink-0"
                                    style={{ color: passed ? theme.colors.success : "#CBD5E1" }}
                                />
                                <span style={{ color: passed ? theme.colors.text.body : theme.colors.text.light }}>
                                    {rule.label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting || loading}
                    className={`mt-2 flex items-center justify-center gap-2 ${theme.radius.md} font-semibold py-3.5 transition-colors ${theme.button.primary} ${theme.shadow.button}`}
                    style={{ opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? "not-allowed" : "pointer" }}
                >
                    <Rocket className="w-4 h-4" />
                    {loading ? "Updating..." : "Reset Password"}
                    <ArrowRight className="w-4 h-4" />
                </button>
            </form>
        </>
    );
};

/* ---------- Reusable Password field component ---------- */

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

export default ResetPassword;