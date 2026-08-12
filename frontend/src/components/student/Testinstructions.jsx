import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BookOpen, CheckCircle2, AlertTriangle, ChevronRight, Check } from "lucide-react";
import theme from "../../theme/theme";
import { getTestConfig } from "./testData";
import { isSectionComplete, isTestComplete } from "./testProgress";
import Skeleton from "../ui/Skeleton";
import StudentLayout, { TopBar } from "../layouts/StudentLayout";

const TestInstructions = () => {
  const navigate = useNavigate();
  const { testType = "aptitude" } = useParams();
  const config = getTestConfig(testType);
  const { sections } = config;

  const [activeId, setActiveId] = useState(sections[0].id);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setActiveId(sections[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testType]);

  useEffect(() => {
    if (isTestComplete(testType, sections.map((s) => s.id))) {
      navigate("/test", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testType]);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  const activeIndex = sections.findIndex((s) => s.id === activeId);
  const activeSection = sections[activeIndex] || sections[0];
  const questionCount =
    (activeSection && Array.isArray(activeSection.questions) && activeSection.questions.length) ||
    (activeSection && typeof activeSection.totalQuestions === "number" && activeSection.totalQuestions) ||
    (activeSection && Array.isArray(activeSection.groups)
      ? activeSection.groups.reduce((sum, g) => sum + (Array.isArray(g.items) ? g.items.length : 0), 0)
      : 0);

  const handleBegin = () => {
    navigate(`/test/${testType}/${activeSection.id}/start`);
  };

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <StudentLayout
      className="lg:h-screen lg:overflow-hidden"
      topBar={
        <TopBar
          maxWidth="max-w-5xl"
          right={
            loading ? (
              <Skeleton className="h-4 w-40 hidden sm:block" />
            ) : (
              <span className="hidden sm:block text-sm" style={{ color: theme.colors.text.light }}>
                {activeSection.subtitle}
              </span>
            )
          }
        />
      }
      footer={
        <footer className="w-full py-5 sm:py-6 lg:hidden">
          <p className="text-xs sm:text-sm text-center" style={{ color: theme.colors.text.light }}>
            © 2026 TrueMindPath. All rights reserved.
          </p>
        </footer>
      }
    >
      <main className="flex-1 px-4 sm:px-6 py-8 sm:py-12 lg:py-4 lg:flex lg:items-center lg:overflow-hidden">
        <div className="max-w-5xl mx-auto w-full">

          {/* Section badge */}
          {sections.length > 1 && (
            loading ? (
              <Skeleton className="h-7 w-40 mb-5 sm:mb-6 lg:mb-4 rounded-full" />
            ) : (
              <div className={`w-fit ${theme.badge.blue} mb-5 sm:mb-6 lg:mb-4 lg:px-4 lg:py-1.5 lg:text-sm`}>
                <BookOpen className="w-3.5 h-3.5 lg:w-3.5 lg:h-3.5" />
                Section {activeIndex + 1} of {sections.length}
              </div>
            )
          )}


          {/* Sub-section tabs */}
          {(loading || sections.length > 1) && (
            <div className="flex flex-wrap gap-2 sm:gap-2.5 lg:gap-2 mb-6 sm:mb-8 lg:mb-4">
              {loading
                ? sections.map((section) => <Skeleton key={section.id} className="h-10 w-28 rounded-md" />)
                : sections.map((section) => {
                  const isActive = section.id === activeId;
                  const isDone = isSectionComplete(testType, section.id);
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setActiveId(section.id)}
                      className={`relative flex items-center gap-2 px-4 sm:px-5 lg:px-4 py-2.5 sm:py-3 lg:py-2 text-sm sm:text-base lg:text-sm font-medium ${theme.radius.md} transition-colors whitespace-nowrap`}
                      style={{
                        backgroundColor: isActive ? theme.colors.primary : "#FFFFFF",
                        color: isActive ? theme.colors.text.white : theme.colors.text.body,
                        border: `1px solid ${isActive ? theme.colors.primary : theme.colors.border}`,
                      }}
                    >
                      <section.icon className="w-4 h-4" />
                      {section.title}
                      {isDone && (
                        <span
                          className={`absolute -top-1.5 -right-1.5 w-4 h-4 ${theme.radius.full} flex items-center justify-center border-2 border-white`}
                          style={{ backgroundColor: "#16A34A" }}
                        >
                          <Check className="w-2.5 h-2.5" style={{ color: "#FFFFFF" }} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          )}

          {/* Instructions card */}
          <div className={`w-full ${theme.radius.xl} ${theme.shadow.card} bg-white border border-slate-100 overflow-hidden`}>
            <div className="px-5 sm:px-8 lg:px-7 pt-6 sm:pt-8 lg:pt-5 pb-5 sm:pb-6 lg:pb-4 border-b border-slate-100">
              {loading ? (
                <>
                  <Skeleton className="h-8 w-2/3 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </>
              ) : (
                <>
                  <h1 className="text-2xl sm:text-3xl lg:text-2xl font-extrabold tracking-tight mb-1.5" style={{ color: theme.colors.text.heading }}>
                    {activeSection.title}
                  </h1>
                  <p className="text-sm sm:text-base lg:text-sm" style={{ color: theme.colors.text.body }}>
                    {activeSection.subtitle}
                  </p>
                </>
              )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 border-b border-slate-100">
              {loading
                ? [1, 2, 3].map((i) => (
                  <div key={i} className="text-center py-4 sm:py-6 lg:py-3.5 px-2" style={{ borderLeft: i !== 1 ? `1px solid ${theme.colors.border}` : "none" }}>
                    <Skeleton className="h-6 w-10 mx-auto mb-2" />
                    <Skeleton className="h-3 w-14 mx-auto" />
                  </div>
                ))
                : [
                  { label: "Questions", value: questionCount },
                  { label: "Time Limit", value: activeSection.timeLimit },
                  { label: "Difficulty", value: activeSection.difficulty },
                ].map(({ label, value }, i) => (
                  <div
                    key={label}
                    className="text-center py-4 sm:py-6 lg:py-3.5 px-2"
                    style={{ borderLeft: i !== 0 ? `1px solid ${theme.colors.border}` : "none" }}
                  >
                    <div className="text-xl sm:text-2xl lg:text-xl font-extrabold" style={{ color: theme.colors.text.heading }}>
                      {value}
                    </div>
                    <div className="text-[10px] sm:text-xs lg:text-[11px] font-medium tracking-wide uppercase mt-1" style={{ color: theme.colors.text.light }}>
                      {label}
                    </div>
                  </div>
                ))}
            </div>

            {/* Instructions list */}
            <div className="px-5 sm:px-8 lg:px-7 py-6 sm:py-8 lg:py-5">
              {loading ? (
                <Skeleton className="h-3 w-24 mb-4 sm:mb-5 lg:mb-3" />
              ) : (
                <h2 className="text-xs sm:text-sm lg:text-xs font-semibold tracking-wide uppercase mb-4 sm:mb-5 lg:mb-3" style={{ color: theme.colors.text.light }}>
                  Instructions
                </h2>
              )}

              <ul className="flex flex-col gap-3 sm:gap-4 lg:gap-2.5">
                {loading
                  ? [1, 2, 3, 4].map((i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Skeleton className="w-4 h-4 sm:w-5 sm:h-5 lg:w-4 lg:h-4 mt-0.5 rounded-full shrink-0" />
                      <Skeleton className="h-4 flex-1" />
                    </li>
                  ))
                  : activeSection.instructions.map((line, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-4 lg:h-4 mt-0.5 shrink-0" style={{ color: theme.colors.primary }} />
                      <span className="text-sm sm:text-base lg:text-sm" style={{ color: theme.colors.text.body }}>
                        {line}
                      </span>
                    </li>
                  ))}
              </ul>

              {/* Warning box */}
              {loading ? (
                <Skeleton className="mt-6 sm:mt-7 lg:mt-4 h-14 w-full rounded-md" />
              ) : (
                <div
                  className={`mt-6 sm:mt-7 lg:mt-4 flex items-start gap-3 ${theme.radius.md} px-4 sm:px-5 lg:px-4 py-4 lg:py-3`}
                  style={{ backgroundColor: "#FEFCE8", border: "1px solid #FDE68A" }}
                >
                  <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "#CA8A04" }} />
                  <p className="text-sm lg:text-sm leading-relaxed" style={{ color: "#92400E" }}>
                    Once you begin, the timer starts and cannot be paused. Ensure you
                    are in a quiet environment with a stable connection.
                  </p>
                </div>
              )}

              {/* Footer row */}
              <div className="mt-6 sm:mt-8 lg:mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {loading ? (
                  <Skeleton className="h-4 w-52" />
                ) : (
                  <span className="text-xs sm:text-sm lg:text-sm text-center sm:text-left" style={{ color: theme.colors.text.light }}>
                    Your progress will be saved automatically.
                  </span>
                )}
                {loading ? (
                  <Skeleton className="h-11 w-full sm:w-40 rounded-md" />
                ) : (
                  <button
                    type="button"
                    onClick={handleBegin}
                    disabled={isSectionComplete(testType, activeSection.id)}
                    className={`w-full sm:w-auto flex items-center justify-center gap-2 ${theme.radius.md} font-semibold px-6 lg:px-6 py-3 lg:py-2.5 lg:text-base transition-colors ${theme.button.primary} ${theme.shadow.button}`}
                    style={
                      isSectionComplete(testType, activeSection.id)
                        ? { opacity: 0.5, cursor: "not-allowed" }
                        : undefined
                    }
                  >
                    {isSectionComplete(testType, activeSection.id) ? "Already Completed" : "Begin Assessment"}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </StudentLayout>
  );
};

export default TestInstructions;



// import React, { useState, useEffect } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import { Compass, BookOpen, CheckCircle2, AlertTriangle, ChevronRight, Check } from "lucide-react";
// import theme from "../../theme/theme";
// import { getTestConfig } from "./testData";
// import { isSectionComplete, isTestComplete } from "./testProgress";
// import Skeleton from "../ui/Skeleton";

// const TestInstructions = () => {
//   const navigate = useNavigate();
//   const { testType = "aptitude" } = useParams();
//   const config = getTestConfig(testType);
//   const { sections } = config;

//   const [activeId, setActiveId] = useState(sections[0].id);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     setActiveId(sections[0].id);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [testType]);

//   useEffect(() => {
//     if (isTestComplete(testType, sections.map((s) => s.id))) {
//       navigate("/test", { replace: true });
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [testType]);

//   useEffect(() => {
//     const link = document.createElement("link");
//     link.rel = "stylesheet";
//     link.href =
//       "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
//     document.head.appendChild(link);
//     return () => document.head.removeChild(link);
//   }, []);

//   const activeIndex = sections.findIndex((s) => s.id === activeId);
//   const activeSection = sections[activeIndex] || sections[0];
//   const questionCount =
//     (activeSection && Array.isArray(activeSection.questions) && activeSection.questions.length) ||
//     (activeSection && typeof activeSection.totalQuestions === "number" && activeSection.totalQuestions) ||
//     (activeSection && Array.isArray(activeSection.groups)
//       ? activeSection.groups.reduce((sum, g) => sum + (Array.isArray(g.items) ? g.items.length : 0), 0)
//       : 0);

//   const handleBegin = () => {
//     navigate(`/test/${testType}/${activeSection.id}/start`);
//   };

//   useEffect(() => {
//     const timer = setTimeout(() => setLoading(false), 300);
//     return () => clearTimeout(timer);
//   }, []);

//   return (
//     <div
//       className="min-h-screen w-full flex flex-col lg:h-screen lg:overflow-hidden"
//       style={{ fontFamily: theme.font.family, backgroundColor: "#F8FAFC" }}
//     >
//       {/* Minimal top bar */}
//       <header className="w-full border-b border-slate-200 bg-white">
//         <div className="max-w-5xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 lg:py-2.5">
//           <div className="flex items-center gap-2 sm:gap-3">
//             <div
//               className={`w-8 h-8 sm:w-9 sm:h-9 lg:w-8 lg:h-8 ${theme.radius.full} flex items-center justify-center`}
//               style={{ backgroundColor: theme.colors.primary }}
//             >
//               <Compass className="w-4 h-4 sm:w-5 sm:h-5 lg:w-4 lg:h-4" style={{ color: theme.colors.text.white }} strokeWidth={2.2} />
//             </div>
//             <span className="text-base sm:text-lg lg:text-lg font-bold tracking-tight" style={{ color: theme.colors.text.heading }}>
//               TrueMindPath
//             </span>
//           </div>
//           {loading ? (
//             <Skeleton className="h-4 w-40 hidden sm:block" />
//           ) : (
//             <span className="hidden sm:block text-sm lg:text-sm" style={{ color: theme.colors.text.light }}>
//               {activeSection.subtitle}
//             </span>
//           )}
//         </div>
//       </header>

//       <main className="flex-1 px-4 sm:px-6 py-8 sm:py-12 lg:py-4 lg:flex lg:items-center lg:overflow-hidden">
//         <div className="max-w-5xl mx-auto w-full">

//           {/* Section badge */}
//           {loading ? (
//             <Skeleton className="h-7 w-40 mb-5 sm:mb-6 lg:mb-4 rounded-full" />
//           ) : (
//             <div className={`w-fit ${theme.badge.blue} mb-5 sm:mb-6 lg:mb-4 lg:px-4 lg:py-1.5 lg:text-sm`}>
//               <BookOpen className="w-3.5 h-3.5 lg:w-3.5 lg:h-3.5" />
//               Section {activeIndex + 1} of {sections.length}
//             </div>
//           )}

//           {/* Sub-section tabs */}
//           <div className="flex flex-wrap gap-2 sm:gap-2.5 lg:gap-2 mb-6 sm:mb-8 lg:mb-4">
//             {loading
//               ? sections.map((section) => <Skeleton key={section.id} className="h-10 w-28 rounded-md" />)
//               : sections.map((section) => {
//                   const isActive = section.id === activeId;
//                   const isDone = isSectionComplete(testType, section.id);
//                   return (
//                     <button
//                       key={section.id}
//                       type="button"
//                       onClick={() => setActiveId(section.id)}
//                       className={`relative flex items-center gap-2 px-4 sm:px-5 lg:px-4 py-2.5 sm:py-3 lg:py-2 text-sm sm:text-base lg:text-sm font-medium ${theme.radius.md} transition-colors whitespace-nowrap`}
//                       style={{
//                         backgroundColor: isActive ? theme.colors.primary : "#FFFFFF",
//                         color: isActive ? theme.colors.text.white : theme.colors.text.body,
//                         border: `1px solid ${isActive ? theme.colors.primary : theme.colors.border}`,
//                       }}
//                     >
//                       <section.icon className="w-4 h-4" />
//                       {section.title}
//                       {isDone && (
//                         <span
//                           className={`absolute -top-1.5 -right-1.5 w-4 h-4 ${theme.radius.full} flex items-center justify-center border-2 border-white`}
//                           style={{ backgroundColor: "#16A34A" }}
//                         >
//                           <Check className="w-2.5 h-2.5" style={{ color: "#FFFFFF" }} strokeWidth={3} />
//                         </span>
//                       )}
//                     </button>
//                   );
//                 })}
//           </div>

//           {/* Instructions card */}
//           <div className={`w-full ${theme.radius.xl} ${theme.shadow.card} bg-white border border-slate-100 overflow-hidden`}>
//             <div className="px-5 sm:px-8 lg:px-7 pt-6 sm:pt-8 lg:pt-5 pb-5 sm:pb-6 lg:pb-4 border-b border-slate-100">
//               {loading ? (
//                 <>
//                   <Skeleton className="h-8 w-2/3 mb-2" />
//                   <Skeleton className="h-4 w-1/2" />
//                 </>
//               ) : (
//                 <>
//                   <h1 className="text-2xl sm:text-3xl lg:text-2xl font-extrabold tracking-tight mb-1.5" style={{ color: theme.colors.text.heading }}>
//                     {activeSection.title}
//                   </h1>
//                   <p className="text-sm sm:text-base lg:text-sm" style={{ color: theme.colors.text.body }}>
//                     {activeSection.subtitle}
//                   </p>
//                 </>
//               )}
//             </div>

//             {/* Stats row */}
//             <div className="grid grid-cols-3 border-b border-slate-100">
//               {loading
//                 ? [1, 2, 3].map((i) => (
//                     <div key={i} className="text-center py-4 sm:py-6 lg:py-3.5 px-2" style={{ borderLeft: i !== 1 ? `1px solid ${theme.colors.border}` : "none" }}>
//                       <Skeleton className="h-6 w-10 mx-auto mb-2" />
//                       <Skeleton className="h-3 w-14 mx-auto" />
//                     </div>
//                   ))
//                 : [
//                     { label: "Questions", value: questionCount },
//                     { label: "Time Limit", value: activeSection.timeLimit },
//                     { label: "Difficulty", value: activeSection.difficulty },
//                   ].map(({ label, value }, i) => (
//                     <div
//                       key={label}
//                       className="text-center py-4 sm:py-6 lg:py-3.5 px-2"
//                       style={{ borderLeft: i !== 0 ? `1px solid ${theme.colors.border}` : "none" }}
//                     >
//                       <div className="text-xl sm:text-2xl lg:text-xl font-extrabold" style={{ color: theme.colors.text.heading }}>
//                         {value}
//                       </div>
//                       <div className="text-[10px] sm:text-xs lg:text-[11px] font-medium tracking-wide uppercase mt-1" style={{ color: theme.colors.text.light }}>
//                         {label}
//                       </div>
//                     </div>
//                   ))}
//             </div>

//             {/* Instructions list */}
//             <div className="px-5 sm:px-8 lg:px-7 py-6 sm:py-8 lg:py-5">
//               {loading ? (
//                 <Skeleton className="h-3 w-24 mb-4 sm:mb-5 lg:mb-3" />
//               ) : (
//                 <h2 className="text-xs sm:text-sm lg:text-xs font-semibold tracking-wide uppercase mb-4 sm:mb-5 lg:mb-3" style={{ color: theme.colors.text.light }}>
//                   Instructions
//                 </h2>
//               )}

//               <ul className="flex flex-col gap-3 sm:gap-4 lg:gap-2.5">
//                 {loading
//                   ? [1, 2, 3, 4].map((i) => (
//                       <li key={i} className="flex items-start gap-3">
//                         <Skeleton className="w-4 h-4 sm:w-5 sm:h-5 lg:w-4 lg:h-4 mt-0.5 rounded-full shrink-0" />
//                         <Skeleton className="h-4 flex-1" />
//                       </li>
//                     ))
//                   : activeSection.instructions.map((line, i) => (
//                       <li key={i} className="flex items-start gap-3">
//                         <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-4 lg:h-4 mt-0.5 shrink-0" style={{ color: theme.colors.primary }} />
//                         <span className="text-sm sm:text-base lg:text-sm" style={{ color: theme.colors.text.body }}>
//                           {line}
//                         </span>
//                       </li>
//                     ))}
//               </ul>

//               {/* Warning box */}
//               {loading ? (
//                 <Skeleton className="mt-6 sm:mt-7 lg:mt-4 h-14 w-full rounded-md" />
//               ) : (
//                 <div
//                   className={`mt-6 sm:mt-7 lg:mt-4 flex items-start gap-3 ${theme.radius.md} px-4 sm:px-5 lg:px-4 py-4 lg:py-3`}
//                   style={{ backgroundColor: "#FEFCE8", border: "1px solid #FDE68A" }}
//                 >
//                   <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "#CA8A04" }} />
//                   <p className="text-sm lg:text-sm leading-relaxed" style={{ color: "#92400E" }}>
//                     Once you begin, the timer starts and cannot be paused. Ensure you
//                     are in a quiet environment with a stable connection.
//                   </p>
//                 </div>
//               )}

//               {/* Footer row */}
//               <div className="mt-6 sm:mt-8 lg:mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//                 {loading ? (
//                   <Skeleton className="h-4 w-52" />
//                 ) : (
//                   <span className="text-xs sm:text-sm lg:text-sm text-center sm:text-left" style={{ color: theme.colors.text.light }}>
//                     Your progress will be saved automatically.
//                   </span>
//                 )}
//                 {loading ? (
//                   <Skeleton className="h-11 w-full sm:w-40 rounded-md" />
//                 ) : (
//                   <button
//                     type="button"
//                     onClick={handleBegin}
//                     disabled={isSectionComplete(testType, activeSection.id)}
//                     className={`w-full sm:w-auto flex items-center justify-center gap-2 ${theme.radius.md} font-semibold px-6 lg:px-6 py-3 lg:py-2.5 lg:text-base transition-colors ${theme.button.primary} ${theme.shadow.button}`}
//                     style={
//                       isSectionComplete(testType, activeSection.id)
//                         ? { opacity: 0.5, cursor: "not-allowed" }
//                         : undefined
//                     }
//                   >
//                     {isSectionComplete(testType, activeSection.id) ? "Already Completed" : "Begin Assessment"}
//                     <ChevronRight className="w-4 h-4" />
//                   </button>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </main>

//       <footer className="w-full py-5 sm:py-6 lg:hidden">
//         <p className="text-xs sm:text-sm text-center" style={{ color: theme.colors.text.light }}>
//           © 2026 TrueMindPath. All rights reserved.
//         </p>
//       </footer>
//     </div>
//   );
// };

// export default TestInstructions;