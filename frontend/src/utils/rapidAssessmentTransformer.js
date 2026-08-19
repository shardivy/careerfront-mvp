// Turns the flat API question list for Rapid Assessment back into the
// grouped shape RapidAssessmentRunner already knows how to render.
//
// API shape (per question):
// {
//   id: 73,
//   question_code: "Q-0067",
//   subsection_id: 4,
//   question_type: "MULTIPLE_CHOICE",
//   question_text: "Find the Larger Number 487 385 ",
//   question_image: null,
//   options: [{ id: "A", text: "487" }, { id: "B", text: "385" }],
//   marks: 1.0,
//   negative_marks: 0.0,
//   display_order: 1
// }
//
// NOTE ON WHERE item.options IS ACTUALLY USED:
// RapidAssessmentRunner only reads the normalized `options` array
// produced below for the compare-larger / compare-smaller group
// types (it does `item.options.map(opt => ...)` and
// `setAnswer(item.id, opt.id)` there). For string-match and parity
// groups, the runner hardcodes its own ["Similar","Different"] /
// ["Odd","Even"] arrays directly in JSX and passes those raw strings
// straight to setAnswer — it never reads item.options for those two
// types. So normalizeOption's fallback firing on "Odd"/"Even"/
// "Similar"/"Different" text is expected and harmless; it doesn't
// feed into what actually gets stored or submitted for those groups.
const NUMBER_REGEX = /-?\d+(\.\d+)?/g;

// Pull plain display text out of each option, regardless of whether the
// API sends options as raw strings or as { id, text } objects.
const getOptionText = (opt) => {
  if (opt == null) return "";
  if (typeof opt === "object") return String(opt.text ?? "").trim();
  return String(opt).trim();
};

// A, B, C, D... from a 0-based index. Used as a fallback option id
// when the real backend id isn't available on the option itself —
// compare-larger/compare-smaller always come from the API in a fixed
// two-option order (first = A, second = B), so position is a safe
// stand-in for the real letter id.
const indexToLetter = (idx) => String.fromCharCode(65 + Number(idx));

// Normalize each option to { id, text }. RapidAssessmentRunner renders
// compare-larger/compare-smaller items as `item.options.map(opt => ...)`
// and calls `setAnswer(item.id, opt.id)` — it needs the real backend
// option id ("A"/"B"), never raw display text/number.
//
// IMPORTANT: if `opt` ever arrives as a bare string/number instead of
// an { id, text } object (e.g. if an upstream hook strips the id before
// this runs), do NOT use the option's own value as its id — that just
// makes id === text (e.g. id: "487"), which is not a valid option_id
// the backend accepts. Fall back to the positional letter instead.
//
// Also deliberately NOT `opt.id ?? indexToLetter(idx)` — `??` only
// falls back on null/undefined, so an empty-string id ("") would slip
// through as-is and produce a blank option_id. Treat "" the same as
// missing.
const normalizeOption = (opt, idx) => {
  if (opt != null && typeof opt === "object") {
    const hasRealId = opt.id !== null && opt.id !== undefined && String(opt.id).trim() !== "";
    return { id: hasRealId ? String(opt.id) : indexToLetter(idx), text: getOptionText(opt) };
  }
  return { id: indexToLetter(idx), text: String(opt) };
};

const classifyQuestion = (q) => {
  const prompt = q.question_text || q.prompt || "";
  const optionTexts = (q.options || []).map((opt) => getOptionText(opt).toLowerCase());

  if (/find the larger number/i.test(prompt)) return "compare-larger";
  if (/find the smaller number/i.test(prompt)) return "compare-smaller";
  if (optionTexts.includes("similar") && optionTexts.includes("different")) return "string-match";
  if (optionTexts.includes("odd") && optionTexts.includes("even")) return "parity";
  return "unknown";
};

export const transformRapidAssessmentQuestions = (apiQuestions = []) => {
  const larger = [];
  const smaller = [];
  const stringMatch = [];
  const parity = [];
  const unclassified = [];

  apiQuestions.forEach((q) => {
    const type = classifyQuestion(q);
    // IMPORTANT: keep this as the raw API question id. It flows straight
    // through as `questionId` into saveQuestionResponse and then the
    // submit payload — the backend needs the bare numeric id (e.g. 73),
    // never a prefixed string like "q-73".
    const id = q.id;
    const prompt = q.question_text || q.prompt || "";
    const options = (q.options || []).map(normalizeOption);

    switch (type) {
      case "compare-larger":
        // RapidAssessmentRunner reads item.options (array of {id, text})
        // for this group type — NOT item.values.
        larger.push({ id, options });
        break;
      case "compare-smaller":
        smaller.push({ id, options });
        break;
      case "string-match": {
        // NEEDS CONFIRMATION — see note below.
        const cleaned = prompt.replace(/find the same strings?/i, "").trim();
        const parts = cleaned.split(/\s+/);
        const mid = Math.ceil(parts.length / 2);
        const pair = parts.length >= 2
          ? [parts.slice(0, mid).join(" "), parts.slice(mid).join(" ")]
          : [cleaned, cleaned];
        stringMatch.push({ id, pair });
        break;
      }
      case "parity": {
        const match = prompt.match(NUMBER_REGEX);
        parity.push({ id, value: match ? match[0] : prompt });
        break;
      }
      default:
        unclassified.push(q);
    }
  });

  const groups = [
    { id: "find-larger", heading: "Find the Larger Number", type: "compare-larger", items: larger },
    { id: "find-smaller", heading: "Find the Smaller Number", type: "compare-smaller", items: smaller },
    { id: "string-match", heading: "Find the Same Strings", type: "string-match", items: stringMatch },
    { id: "odd-even", heading: "Identify Odd / Even Number", type: "parity", items: parity },
  ].filter((g) => g.items.length > 0);

  if (unclassified.length && process.env.NODE_ENV !== "production") {
    console.warn("Rapid Assessment: could not classify", unclassified.length, "questions:", unclassified);
  }

  return { groups, unclassified };
};