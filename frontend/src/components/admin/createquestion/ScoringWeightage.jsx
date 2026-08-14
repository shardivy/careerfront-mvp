import { cn } from "@/lib/utils";
import { adminTheme } from "@/theme/adminTheme";
import { NumberStepperCard } from "../CreateQuestion";

// ---- Step 3: Scoring & Weightage ------------------------------------------

// Standalone Scoring & Weightage step — previously folded into the Review
// screen, now its own step between Configuration and Review so scoring gets
// dedicated space and isn't buried under the publish checklist.
const ScoringWeightage = ({ form, onFieldChange }) => {
    return (
        <div className={cn(adminTheme.card.base, adminTheme.card.padding)}>
            <h2 className="text-lg font-semibold text-slate-900">Scoring & Weightage</h2>
            <p className={cn(adminTheme.card.subtitle, "mt-1")}>Set the marks and scoring rules for this question.</p>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <NumberStepperCard label="Correct Mark(s)" value={form.points} onChange={(v) => onFieldChange("points", Math.max(0, v))} helper="Standard Weightage" />
                <NumberStepperCard label="Negative Mark(s)" value={form.negativeMarks} onChange={(v) => onFieldChange("negativeMarks", Math.min(0, v))} helper="Penalty for Incorrect" />
            </div>
        </div>
    );
};

export default ScoringWeightage;