/**
 * TrueMindPath - Test Progress Tracker
 * ------------------------------------------------------------------
 * Persists which subsections of each test the user has finished, so that:
 *   1. The final Results/Report page only shows once EVERY test the
 *      backend returns is fully complete.
 *   2. TestInstructions can put a tick on subsection tabs already done.
 *   3. TestSelection can put a tick / "Completed" state on a whole test card.
 *
 * Backed by localStorage so progress survives refreshes and navigating
 * back and forth between tests. Every read/write is wrapped in try/catch
 * so private-browsing or storage-disabled environments simply behave as
 * "nothing completed yet" instead of throwing.
 *
 * NOTE: this file used to import TEST_CONFIGS from testData.js to know,
 * at any time, every test type that exists and every section id inside
 * it. Now that both come from the backend (sections + subsections APIs)
 * instead of a static config, this file can no longer look that up on
 * its own — `areAllTestsComplete` / `getIncompleteTestTypes` below now
 * take that shape as a parameter instead. The caller (wherever you have
 * all sections + their subsections loaded — most likely a spot that
 * fetches subsections for every section, not just the one currently
 * open) is responsible for building it, e.g.:
 *
 *   const testsWithSubsectionIds = sections.map((section) => ({
 *     testType: section.section_code,
 *     subsectionIds: subsectionsBySectionId[section.section_id].map(
 *       (sub) => sub.subsection_code
 *     ),
 *   }));
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

/** All subsection ids completed so far for a given test type. */
export const getCompletedSections = (testType) => {
    const store = readStore();
    return store[testType] || [];
};

/** Marks one subsection as done. Safe to call more than once. */
export const markSectionComplete = (testType, sectionId) => {
    const store = readStore();
    const existing = store[testType] || [];
    if (!existing.includes(sectionId)) {
        writeStore({ ...store, [testType]: [...existing, sectionId] });
    }
};

export const isSectionComplete = (testType, sectionId) =>
    getCompletedSections(testType).includes(sectionId);

/** True once every subsection in the given order has been completed. */
export const isTestComplete = (testType, sectionOrder) => {
    if (!sectionOrder || sectionOrder.length === 0) return false;
    const done = getCompletedSections(testType);
    return sectionOrder.every((id) => done.includes(id));
};

/**
 * True once every test is fully complete.
 * @param {{ testType: string, subsectionIds: string[] }[]} testsWithSubsectionIds
 *   One entry per section (test type), each with the full list of its
 *   subsection ids — see the NOTE above for how to build this.
 */
export const areAllTestsComplete = (testsWithSubsectionIds) =>
    Array.isArray(testsWithSubsectionIds) &&
    testsWithSubsectionIds.length > 0 &&
    testsWithSubsectionIds.every(({ testType, subsectionIds }) =>
        isTestComplete(testType, subsectionIds)
    );

/**
 * Test types (e.g. section codes) that still have unfinished subsections.
 * @param {{ testType: string, subsectionIds: string[] }[]} testsWithSubsectionIds
 */
export const getIncompleteTestTypes = (testsWithSubsectionIds) =>
    (testsWithSubsectionIds || [])
        .filter(({ testType, subsectionIds }) => !isTestComplete(testType, subsectionIds))
        .map(({ testType }) => testType);

/** Clears all saved progress — handy for a "Retake everything" action. */
export const resetProgress = () => writeStore({});