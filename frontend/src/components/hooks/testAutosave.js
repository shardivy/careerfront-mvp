/**
 * Autosaves a test-taker's in-progress answers to localStorage so a
 * dropped connection, refresh, or closed tab doesn't lose progress.
 * Saved per (testType, sectionId), cleared once that section is submitted.
 */
const PREFIX = "truemindpath:autosave";
const keyFor = (testType, sectionId) => `${PREFIX}:${testType}:${sectionId}`;

export const saveAutosave = (testType, sectionId, data) => {
  try {
    window.localStorage.setItem(
      keyFor(testType, sectionId),
      JSON.stringify({ ...data, savedAt: Date.now() })
    );
  } catch {
    // Storage full / private mode — fail silently.
  }
};

export const loadAutosave = (testType, sectionId) => {
  try {
    const raw = window.localStorage.getItem(keyFor(testType, sectionId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearAutosave = (testType, sectionId) => {
  try {
    window.localStorage.removeItem(keyFor(testType, sectionId));
  } catch {
    // no-op
  }
};

