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
const NUMBER_REGEX = /-?\d+(\.\d+)?/g;

// Pull plain display text out of each option, regardless of whether the
// API sends options as raw strings or as { id, text } objects.
const getOptionText = (opt) => {
  if (opt == null) return "";
  if (typeof opt === "object") return String(opt.text ?? "").trim();
  return String(opt).trim();
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
    const optionTexts = (q.options || []).map(getOptionText);

    switch (type) {
      case "compare-larger":
        larger.push({ id, values: optionTexts });
        break;
      case "compare-smaller":
        smaller.push({ id, values: optionTexts });
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