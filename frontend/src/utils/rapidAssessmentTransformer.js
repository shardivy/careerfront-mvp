// Turns the flat API question list for Rapid Assessment back into the
// grouped shape RapidAssessmentRunner already knows how to render.
const NUMBER_REGEX = /-?\d+(\.\d+)?/g;

const classifyQuestion = (q) => {
  const prompt = q.prompt || "";
  const optionTexts = (q.options || []).map((t) => String(t).trim().toLowerCase());

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
    const id = `q-${q.id}`;

    switch (type) {
      case "compare-larger":
        larger.push({ id, values: q.options }); // options already ["487","385"]
        break;
      case "compare-smaller":
        smaller.push({ id, values: q.options });
        break;
      case "string-match": {
        // NEEDS CONFIRMATION — see note below.
        const cleaned = q.prompt.replace(/find the same strings?/i, "").trim();
        const parts = cleaned.split(/\s+/);
        const mid = Math.ceil(parts.length / 2);
        const pair = parts.length >= 2
          ? [parts.slice(0, mid).join(" "), parts.slice(mid).join(" ")]
          : [cleaned, cleaned];
        stringMatch.push({ id, pair });
        break;
      }
      case "parity": {
        const match = q.prompt.match(NUMBER_REGEX);
        parity.push({ id, value: match ? match[0] : q.prompt });
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