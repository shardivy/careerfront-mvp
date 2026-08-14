import { TEST_CONFIGS } from "./testData";

/**
 * TrueMindPath - Test Progress Tracker
 * ------------------------------------------------------------------
 * Persists which sections of each test the user has finished, so that:
 *   1. The final Results/Report page only shows once EVERY test in
 *      TEST_CONFIGS (currently Aptitude + Personality) is fully complete.
 *   2. TestInstructions can put a tick on section tabs already done.
 *   3. TestSelection can put a tick / "Completed" state on a whole test card.
 *
 * Backed by localStorage so progress survives refreshes and navigating
 * back and forth between the two tests. Every read/write is wrapped in
 * try/catch so private-browsing or storage-disabled environments simply
 * behave as "nothing completed yet" instead of throwing.
 * ------------------------------------------------------------------
 */

const STORAGE_KEY = "truemindpath:test-progress";

const readStore = () => {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
};

const writeStore = (data) => {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
        // Ignore write failures (quota exceeded, private mode, etc.) —
        // progress just won't persist, the flow still works this session.
    }
};

/** All section ids completed so far for a given test type. */
export const getCompletedSections = (testType) => {
    const store = readStore();
    return store[testType] || [];
};

/** Marks one section as done. Safe to call more than once. */
export const markSectionComplete = (testType, sectionId) => {
    const store = readStore();
    const existing = store[testType] || [];
    if (!existing.includes(sectionId)) {
        writeStore({ ...store, [testType]: [...existing, sectionId] });
    }
};

export const isSectionComplete = (testType, sectionId) =>
    getCompletedSections(testType).includes(sectionId);

/** True once every section in the given order has been completed. */
export const isTestComplete = (testType, sectionOrder) => {
    if (!sectionOrder || sectionOrder.length === 0) return false;
    const done = getCompletedSections(testType);
    return sectionOrder.every((id) => done.includes(id));
};

/** True once every test defined in testData.js is fully complete. */
export const areAllTestsComplete = () =>
    Object.keys(TEST_CONFIGS).every((testType) =>
        isTestComplete(
            testType,
            TEST_CONFIGS[testType].sections.map((s) => s.id)
        )
    );

/** Test types (e.g. ["personality"]) that still have unfinished sections. */
export const getIncompleteTestTypes = () =>
    Object.keys(TEST_CONFIGS).filter(
        (testType) =>
            !isTestComplete(
                testType,
                TEST_CONFIGS[testType].sections.map((s) => s.id)
            )
    );

/** Clears all saved progress — handy for a "Retake everything" action. */
export const resetProgress = () => writeStore({});