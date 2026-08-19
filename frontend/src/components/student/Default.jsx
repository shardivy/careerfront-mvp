import React from "react";
import { Lock, Mail, ShieldCheck } from "lucide-react";
import theme from "../../theme/theme";

const Default = () => {
    return (
        <div
            className={`min-h-screen w-full flex items-center justify-center bg-gradient-to-br ${theme.colors.background.page} px-4 py-16`}
            style={{ fontFamily: theme.font.family }}
        >
            <div className="w-full max-w-md">
                {/* Status badge */}
                <div className="flex justify-center mb-6">
                    <span className={theme.badge.blue}>
                        <ShieldCheck className="h-4 w-4" />
                        TheCareerFront Portal
                    </span>
                </div>

                {/* Card */}
                <div
                    className={`bg-white ${theme.radius.xl} ${theme.shadow.card} border border-slate-100 px-8 py-10 text-center`}
                >
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div
                            className={`h-16 w-16 flex items-center justify-center ${theme.radius.full} bg-[#EFF6FF] ${theme.shadow.button}`}
                        >
                            <Lock className="h-7 w-7 text-[#2563EB]" strokeWidth={2} />
                        </div>
                    </div>

                    {/* Heading */}
                    <h1 className="text-2xl font-bold text-[#0F172A] mb-2">
                        Career access is restricted
                    </h1>

                    <p className="text-[#64748B] text-sm leading-relaxed mb-8">
                        You don't have permission to access this page yet. Please contact admin to request access to the TheCareerFront Platform.
                    </p>
                    {/* Divider */}
                    <div className="h-px bg-[#E2E8F0] mb-8" />

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        <a
                            href="mailto:support@ramsolutions.in"
                            className={`w-full inline-flex items-center justify-center gap-2 ${theme.radius.md} px-5 py-3 text-sm font-semibold ${theme.button.primary} ${theme.shadow.button} transition-colors`}
                        >
                            <Mail className="h-4 w-4" />
                            Contact admin
                        </a>
                    </div>
                </div>


            </div>
        </div>
    );
};

export default Default;