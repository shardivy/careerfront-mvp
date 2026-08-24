/**
 * The runner UI uses an option's array index, while the responses API expects
 * the identifier supplied by the questions API (for example "A", "B", ...).
 */
export const getBackendOptionId = (question, optionIndex) => {
  const option =
    question?.optionsWithIds?.[optionIndex] ?? question?.options?.[optionIndex];

  if (option && typeof option === "object" && option.id != null) {
    return option.id;
  }

  // Fallback for legacy/static questions that have no backend option IDs.
  return optionIndex;
};

/**
 * Converts a stored backend option ID back to the UI's array index. Numeric
 * values are left intact so responses saved before the ID mapping still work.
 */
export const getOptionIndexFromStoredResponse = (question, response) => {
  const options = question?.optionsWithIds ?? question?.options ?? [];
  const optionIndex = options.findIndex(
    (option) =>
      option &&
      typeof option === "object" &&
      String(option.id) === String(response),
  );

  return optionIndex === -1 ? response : optionIndex;
};
