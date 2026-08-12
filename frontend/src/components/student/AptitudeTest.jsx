import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, CheckCircle2, AlertTriangle, ChevronRight } from "lucide-react";
import theme from "../../theme/theme";
import { TEST_CONFIGS } from "./testData";
import Skeleton from "../ui/Skeleton";
import StudentLayout, { TopBar } from "../layouts/StudentLayout";

const AptitudeTest = () => {
  const navigate = useNavigate();
  const sections = TEST_CONFIGS.aptitude.sections;
  const [activeId, setActiveId] = useState(sections[0].id);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const activeIndex = sections.findIndex((s) => s.id === activeId);
  const activeSection = sections[activeIndex];
  // Support sections that define questions differently (questions array, groups, or totalQuestions)
  const questionCount =
    (activeSection && Array.isArray(activeSection.questions) && activeSection.questions.length) ||
    (activeSection && typeof activeSection.totalQuestions === "number" && activeSection.totalQuestions) ||
    (activeSection && Array.isArray(activeSection.groups)
      ? activeSection.groups.reduce((sum, g) => sum + (Array.isArray(g.items) ? g.items.length : 0), 0)
      : 0);

  const handleBegin = () => {
    navigate(`/test/aptitude/${activeSection.id}/start`);
  };

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
          {loading ? (
            <Skeleton className="h-7 w-40 mb-5 sm:mb-6 lg:mb-4 rounded-full" />
          ) : (
            <div className={`w-fit ${theme.badge.blue} mb-5 sm:mb-6 lg:mb-4 lg:px-4 lg:py-1.5 lg:text-sm`}>
              <BookOpen className="w-3.5 h-3.5 lg:w-3.5 lg:h-3.5" />
              Section {activeIndex + 1} of {sections.length}
            </div>
          )}

          {/* Sub-section tabs */}
          <div className="flex flex-wrap gap-2 sm:gap-2.5 lg:gap-2 mb-6 sm:mb-8 lg:mb-4">
            {loading
              ? sections.map((section) => <Skeleton key={section.id} className="h-10 w-28 rounded-md" />)
              : sections.map((section) => {
                  const isActive = section.id === activeId;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setActiveId(section.id)}
                      className={`flex items-center gap-2 px-4 sm:px-5 lg:px-4 py-2.5 sm:py-3 lg:py-2 text-sm sm:text-base lg:text-sm font-medium ${theme.radius.md} transition-colors whitespace-nowrap`}
                      style={{
                        backgroundColor: isActive ? theme.colors.primary : "#FFFFFF",
                        color: isActive ? theme.colors.text.white : theme.colors.text.body,
                        border: `1px solid ${isActive ? theme.colors.primary : theme.colors.border}`,
                      }}
                    >
                      <section.icon className="w-4 h-4" />
                      {section.title}
                    </button>
                  );
                })}
          </div>

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
                    className={`w-full sm:w-auto flex items-center justify-center gap-2 ${theme.radius.md} font-semibold px-6 lg:px-6 py-3 lg:py-2.5 lg:text-base transition-colors ${theme.button.primary} ${theme.shadow.button}`}
                  >
                    Begin Assessment
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

export default AptitudeTest;




// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   Compass,
//   BookOpen,
//   CheckCircle2,
//   AlertTriangle,
//   ChevronRight,
// } from "lucide-react";
// import theme from "../../theme/theme";
// import { TEST_CONFIGS } from "./testData";
// import Skeleton from "../ui/Skeleton";

// const AptitudeTest = () => {
//   const navigate = useNavigate();
//   const sections = TEST_CONFIGS.aptitude.sections;
//   const [activeId, setActiveId] = useState(sections[0].id);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const link = document.createElement("link");
//     link.rel = "stylesheet";
//     link.href =
//       "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
//     document.head.appendChild(link);
//     return () => document.head.removeChild(link);
//   }, []);

//   useEffect(() => {
//     const timer = setTimeout(() => setLoading(false), 1500);
//     return () => clearTimeout(timer);
//   }, []);

//   const activeIndex = sections.findIndex((s) => s.id === activeId);
//   const activeSection = sections[activeIndex];
//   // Support sections that define questions differently (questions array, groups, or totalQuestions)
//   const questionCount =
//     (activeSection && Array.isArray(activeSection.questions) && activeSection.questions.length) ||
//     (activeSection && typeof activeSection.totalQuestions === "number" && activeSection.totalQuestions) ||
//     (activeSection && Array.isArray(activeSection.groups)
//       ? activeSection.groups.reduce((sum, g) => sum + (Array.isArray(g.items) ? g.items.length : 0), 0)
//       : 0);

//   const handleBegin = () => {
//     navigate(`/test/aptitude/${activeSection.id}/start`);
//   };

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
//                   return (
//                     <button
//                       key={section.id}
//                       type="button"
//                       onClick={() => setActiveId(section.id)}
//                       className={`flex items-center gap-2 px-4 sm:px-5 lg:px-4 py-2.5 sm:py-3 lg:py-2 text-sm sm:text-base lg:text-sm font-medium ${theme.radius.md} transition-colors whitespace-nowrap`}
//                       style={{
//                         backgroundColor: isActive ? theme.colors.primary : "#FFFFFF",
//                         color: isActive ? theme.colors.text.white : theme.colors.text.body,
//                         border: `1px solid ${isActive ? theme.colors.primary : theme.colors.border}`,
//                       }}
//                     >
//                       <section.icon className="w-4 h-4" />
//                       {section.title}
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
//                     className={`w-full sm:w-auto flex items-center justify-center gap-2 ${theme.radius.md} font-semibold px-6 lg:px-6 py-3 lg:py-2.5 lg:text-base transition-colors ${theme.button.primary} ${theme.shadow.button}`}
//                   >
//                     Begin Assessment
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

// export default AptitudeTest;


// // import React, { useState, useEffect } from "react";
// // import { useNavigate } from "react-router-dom";
// // import {
// //     Compass,
// //     BookOpen,
// //     CheckCircle2,
// //     AlertTriangle,
// //     ChevronRight,
// //     Calculator,
// //     MessageSquare,
// //     Puzzle,
// //     BarChart3,
// //     Boxes,
// //     BrainCircuit,
// // } from "lucide-react";
// // import theme from "../../theme/theme";
// // import { TEST_CONFIGS } from "./testData";

// // // const sections = [
// // //     {
// // //         id: "quantitative",
// // //         title: "Quantitative Reasoning",
// // //         subtitle: "Arithmetic, Number Sequences & Mathematics",
// // //         icon: Calculator,
// // //         questions: 10,
// // //         timeLimit: "15:00",
// // //         difficulty: "Adaptive",
// // //         instructions: [
// // //             "Covers basic arithmetic, number sequences, simple mathematics, and number grouping.",
// // //             "This is a speed test used to determine your basic numeracy.",
// // //             "Read each question carefully and solve as quickly as possible.",
// // //             "Each question carries equal weight; there is no negative marking.",
// // //             "The timer counts down continuously — it cannot be paused once started.",
// // //             "Your answers are auto-saved as you navigate between questions.",
// // //         ],
// // //     },
// // //     {
// // //         id: "verbal",
// // //         title: "Verbal Reasoning",
// // //         subtitle: "Vocabulary, Analogies, Comprehension & Language Skills",
// // //         icon: MessageSquare,
// // //         questions: 12,
// // //         timeLimit: "18:00",
// // //         difficulty: "Adaptive",
// // //         instructions: [
// // //             "Covers vocabulary, sentence correction, and reading comprehension.",
// // //             "Tests your command over language structure and word usage.",
// // //             "Read each passage or question carefully before selecting your answer.",
// // //             "Each question carries equal weight; there is no negative marking.",
// // //             "The timer counts down continuously — it cannot be paused once started.",
// // //             "Your answers are auto-saved as you navigate between questions.",
// // //         ],
// // //     },
// // //     {
// // //         id: "reasoning",
// // //         title: "Logical Reasoning",
// // //         subtitle: "Logical & Analytical Reasoning",
// // //         icon: Puzzle,
// // //         questions: 10,
// // //         timeLimit: "20:00",
// // //         difficulty: "Adaptive",
// // //         instructions: [
// // //             "Covers logical sequences, pattern recognition, and analytical puzzles.",
// // //             "Measures how well you draw conclusions from given information.",
// // //             "You may mark questions for review and return to them later.",
// // //             "Each question carries equal weight; there is no negative marking.",
// // //             "The timer counts down continuously — it cannot be paused once started.",
// // //             "Ensure a stable internet connection throughout the assessment.",
// // //         ],
// // //     },
// // //     {
// // //         id: "rapid",
// // //         title: "Rapid Assessment",
// // //         subtitle: "Letter, Number & Pattern Comparison",
// // //         icon: BarChart3,
// // //         questions: 8,
// // //         timeLimit: "15:00",
// // //         difficulty: "Adaptive",
// // //                      instructions: [
// // //   "Compare the two strings carefully and determine whether they are identical or different.",
// // //   "The strings may contain letters, numbers, or a combination of both.",
// // //   "Even a single character in a different position makes the strings different.",
// // //   "Work as quickly and accurately as possible.",
// // //   "Each question carries equal weight and there is no negative marking.",
// // //   "The timer runs continuously and cannot be paused once started.",
// // // ],
               
// // //     },
// // //     {
// // //         id: "spatial",
// // //      title: "Visual Reasoning",
// // //                 subtitle: "Visual & Spatial Reasoning",
// // //         icon: Boxes,
// // //         questions: 10,
// // //         timeLimit: "16:00",
// // //         difficulty: "Adaptive",
// // //         instructions: [
// // //             "Covers shape rotation, pattern folding, and spatial visualization.",
// // //             "Tests your ability to mentally manipulate 2D and 3D objects.",
// // //             "Take your time to visualize each shape before answering.",
// // //             "Each question carries equal weight; there is no negative marking.",
// // //             "The timer counts down continuously — it cannot be paused once started.",
// // //             "Ensure a stable internet connection throughout the assessment.",
// // //         ],
// // //     },
// // //     {
// // //         id: "mental-agility",
// // //        title: "Mental Agility",
// // //                 subtitle: "Verbal Reasoning & Analytical Thinking",
// // //         icon: BrainCircuit,
// // //         questions: 8,
// // //         timeLimit: "20:00",
// // //         difficulty: "Adaptive",
// // //         instructions: [
// // //             "Read each question carefully before selecting your answer.",
// // //             "You may mark questions for review and return to them later.",
// // //             "Each question carries equal weight; there is no negative marking.",
// // //             "The timer counts down continuously — it cannot be paused once started.",
// // //             "Your answers are auto-saved as you navigate between questions.",
// // //             "Ensure a stable internet connection throughout the assessment.",
// // //         ],
// // //     },
// // // ];

// // const AptitudeTest = () => {
// //     const navigate = useNavigate();
// //         const sections = TEST_CONFIGS.aptitude.sections;
// //     const [activeId, setActiveId] = useState(sections[0].id);


// //     useEffect(() => {
// //         const link = document.createElement("link");
// //         link.rel = "stylesheet";
// //         link.href =
// //             "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
// //         document.head.appendChild(link);
// //         return () => document.head.removeChild(link);
// //     }, []);

// //     const activeIndex = sections.findIndex((s) => s.id === activeId);
// //     const activeSection = sections[activeIndex];

// //     const handleBegin = () => {
// //         // Hook up navigation to the actual question runner here
// //         navigate(`/test/aptitude/${activeSection.id}/start`);
// //     };

// //     return (
// //         <div
// //             className="min-h-screen w-full flex flex-col lg:h-screen lg:overflow-hidden"
// //             style={{ fontFamily: theme.font.family, backgroundColor: "#F8FAFC" }}
// //         >
// //             {/* Minimal top bar */}
// //             <header className="w-full border-b border-slate-200 bg-white">
// //                 <div className="max-w-5xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 lg:py-2.5">
// //                     <div className="flex items-center gap-2 sm:gap-3">
// //                         <div
// //                             className={`w-8 h-8 sm:w-9 sm:h-9 lg:w-8 lg:h-8 ${theme.radius.full} flex items-center justify-center`}
// //                             style={{ backgroundColor: theme.colors.primary }}
// //                         >
// //                             <Compass className="w-4 h-4 sm:w-5 sm:h-5 lg:w-4 lg:h-4" style={{ color: theme.colors.text.white }} strokeWidth={2.2} />
// //                         </div>
// //                         <span
// //                             className="text-base sm:text-lg lg:text-lg font-bold tracking-tight"
// //                             style={{ color: theme.colors.text.heading }}
// //                         >
// //                             TrueMindPath
// //                         </span>
// //                     </div>
// //                     <span
// //                         className="hidden sm:block text-sm lg:text-sm"
// //                         style={{ color: theme.colors.text.light }}
// //                     >
// //                         {activeSection.subtitle}
// //                     </span>
// //                 </div>
// //             </header>

// //             <main className="flex-1 px-4 sm:px-6 py-8 sm:py-12 lg:py-4 lg:flex lg:items-center lg:overflow-hidden">
// //                 <div className="max-w-5xl mx-auto w-full">

// //                     {/* Section badge */}
// //                     <div className={`w-fit ${theme.badge.blue} mb-5 sm:mb-6 lg:mb-4 lg:px-4 lg:py-1.5 lg:text-sm`}>
// //                         <BookOpen className="w-3.5 h-3.5 lg:w-3.5 lg:h-3.5" />
// //                         Section {activeIndex + 1} of {sections.length}
// //                     </div>

// //                     {/* Sub-section tabs */}
// //                     <div
// //                         className="flex flex-wrap gap-2 sm:gap-2.5 lg:gap-2 mb-6 sm:mb-8 lg:mb-4"
// //                     >
// //                         {sections.map((section) => {
// //                             const isActive = section.id === activeId;
// //                             return (
// //                                 <button
// //                                     key={section.id}
// //                                     type="button"
// //                                     onClick={() => setActiveId(section.id)}
// //                                     className={`flex items-center gap-2 px-4 sm:px-5 lg:px-4 py-2.5 sm:py-3 lg:py-2 text-sm sm:text-base lg:text-sm font-medium ${theme.radius.md} transition-colors whitespace-nowrap`}
// //                                     style={{
// //                                         backgroundColor: isActive ? theme.colors.primary : "#FFFFFF",
// //                                         color: isActive ? theme.colors.text.white : theme.colors.text.body,
// //                                         border: `1px solid ${isActive ? theme.colors.primary : theme.colors.border}`,
// //                                     }}
// //                                 >
// //                                     <section.icon className="w-4 h-4" />
// //                                     {section.title}
// //                                 </button>
// //                             );
// //                         })}
// //                     </div>

// //                     {/* Instructions card */}
// //                     <div
// //                         className={`w-full ${theme.radius.xl} ${theme.shadow.card} bg-white border border-slate-100 overflow-hidden`}
// //                     >
// //                         <div className="px-5 sm:px-8 lg:px-7 pt-6 sm:pt-8 lg:pt-5 pb-5 sm:pb-6 lg:pb-4 border-b border-slate-100">
// //                             <h1
// //                                 className="text-2xl sm:text-3xl lg:text-2xl font-extrabold tracking-tight mb-1.5"
// //                                 style={{ color: theme.colors.text.heading }}
// //                             >
// //                                 {activeSection.title}
// //                             </h1>
// //                             <p className="text-sm sm:text-base lg:text-sm" style={{ color: theme.colors.text.body }}>
// //                                 {activeSection.subtitle}
// //                             </p>
// //                         </div>

// //                         {/* Stats row */}
// //                         <div className="grid grid-cols-3 border-b border-slate-100">
// //                             {[
// //                                 { label: "Questions", value: activeSection.questions.length },
// //                                 { label: "Time Limit", value: activeSection.timeLimit },
// //                                 { label: "Difficulty", value: activeSection.difficulty },
// //                             ].map(({ label, value }, i) => (
// //                                 <div
// //                                     key={label}
// //                                     className="text-center py-4 sm:py-6 lg:py-3.5 px-2"
// //                                     style={{
// //                                         borderLeft: i !== 0 ? `1px solid ${theme.colors.border}` : "none",
// //                                     }}
// //                                 >
// //                                     <div
// //                                         className="text-xl sm:text-2xl lg:text-xl font-extrabold"
// //                                         style={{ color: theme.colors.text.heading }}
// //                                     >
// //                                         {value}
// //                                     </div>
// //                                     <div
// //                                         className="text-[10px] sm:text-xs lg:text-[11px] font-medium tracking-wide uppercase mt-1"
// //                                         style={{ color: theme.colors.text.light }}
// //                                     >
// //                                         {label}
// //                                     </div>
// //                                 </div>
// //                             ))}
// //                         </div>

// //                         {/* Instructions list */}
// //                         <div className="px-5 sm:px-8 lg:px-7 py-6 sm:py-8 lg:py-5">
// //                             <h2
// //                                 className="text-xs sm:text-sm lg:text-xs font-semibold tracking-wide uppercase mb-4 sm:mb-5 lg:mb-3"
// //                                 style={{ color: theme.colors.text.light }}
// //                             >
// //                                 Instructions
// //                             </h2>
// //                             <ul className="flex flex-col gap-3 sm:gap-4 lg:gap-2.5">
// //                                 {activeSection.instructions.map((line, i) => (
// //                                     <li key={i} className="flex items-start gap-3">
// //                                         <CheckCircle2
// //                                             className="w-4 h-4 sm:w-5 sm:h-5 lg:w-4 lg:h-4 mt-0.5 shrink-0"
// //                                             style={{ color: theme.colors.primary }}
// //                                         />
// //                                         <span className="text-sm sm:text-base lg:text-sm" style={{ color: theme.colors.text.body }}>
// //                                             {line}
// //                                         </span>
// //                                     </li>
// //                                 ))}
// //                             </ul>

// //                             {/* Warning box */}
// //                             <div
// //                                 className={`mt-6 sm:mt-7 lg:mt-4 flex items-start gap-3 ${theme.radius.md} px-4 sm:px-5 lg:px-4 py-4 lg:py-3`}
// //                                 style={{ backgroundColor: "#FEFCE8", border: "1px solid #FDE68A" }}
// //                             >
// //                                 <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "#CA8A04" }} />
// //                                 <p className="text-sm lg:text-sm leading-relaxed" style={{ color: "#92400E" }}>
// //                                     Once you begin, the timer starts and cannot be paused. Ensure you
// //                                     are in a quiet environment with a stable connection.
// //                                 </p>
// //                             </div>

// //                             {/* Footer row */}
// //                             <div className="mt-6 sm:mt-8 lg:mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
// //                                 <span className="text-xs sm:text-sm lg:text-sm text-center sm:text-left" style={{ color: theme.colors.text.light }}>
// //                                     Your progress will be saved automatically.
// //                                 </span>
// //                                 <button
// //                                     type="button"
// //                                     onClick={handleBegin}
// //                                     className={`w-full sm:w-auto flex items-center justify-center gap-2 ${theme.radius.md} font-semibold px-6 lg:px-6 py-3 lg:py-2.5 lg:text-base transition-colors ${theme.button.primary} ${theme.shadow.button}`}
// //                                 >
// //                                     Begin Assessment
// //                                     <ChevronRight className="w-4 h-4" />
// //                                 </button>
// //                             </div>
// //                         </div>
// //                     </div>
// //                 </div>
// //             </main>

// //             <footer className="w-full py-5 sm:py-6 lg:hidden">
// //                 <p className="text-xs sm:text-sm text-center" style={{ color: theme.colors.text.light }}>
// //                     © 2026 TrueMindPath. All rights reserved.
// //                 </p>
// //             </footer>
// //         </div>
// //     );
// // };

// // export default AptitudeTest;