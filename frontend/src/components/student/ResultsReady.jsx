import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Compass,
  Clock,
  Check,
  LayoutGrid,
  Download,
  ChevronRight,
  Brain,
  Award,
  Globe2,
} from "lucide-react";
import theme from "../../theme/theme";
import Skeleton from "../ui/skeleton";

const ResultsReady = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  const {
    reportId = "TMP-2024-8741",
    studentName = "Alex M.",
    score = 94,
    trajectoriesAnalyzed = 248,
    domainsAnalyzed = 12,
    generatedAt = new Date(),
  } = location.state || {};

  const formattedDate = new Date(generatedAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

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

  const REPORT_PDF_URL = "/sample-report.pdf";

  const handleViewReport = () => {
    window.open(REPORT_PDF_URL, "_blank", "noopener,noreferrer");
  };

  const handleDownloadPdf = () => {
    const link = document.createElement("a");
    link.href = REPORT_PDF_URL;
    link.download = `TrueMindPath-Report-${reportId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const badges = [
    { icon: Brain, label: "AI-Powered Analysis" },
    { icon: Award, label: "Psychometric Validated" },
    { icon: Globe2, label: "Global Benchmarked" },
  ];

  return (
    <div
      className="min-h-screen w-full flex flex-col relative overflow-hidden"
      style={{
        fontFamily: theme.font.family,
        backgroundColor: "#0B1220",
        backgroundImage:
          "radial-gradient(ellipse 900px 500px at 50% 38%, rgba(59,130,246,0.16), transparent 65%), linear-gradient(180deg, #0B1220 0%, #101B34 55%, #0B1220 100%)",
      }}
    >
      {/* Top bar */}
      <header className="w-full px-4 sm:px-8 py-4 sm:py-6 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* <div className="flex items-center gap-2.5 sm:gap-3">
            <div
              className={`w-8 h-8 sm:w-9 sm:h-9 ${theme.radius.md} flex items-center justify-center`}
              style={{ backgroundColor: theme.colors.primary }}
            >
            <img
            src="/logo.png"
            alt="TheCareerFront"
            className="w-full h-full object-contain"
        />
            </div>
            <span className="text-base sm:text-lg font-bold tracking-tight text-white">
           TheCareerFront
            </span>
          </div> */}

          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center overflow-hidden"
            >
              <img
                src="/logo.png"
                alt="TheCareerFront"
                className="w-full h-full object-contain"
              />
            </div>

            <span className="text-base sm:text-lg font-bold tracking-tight text-white">
              TheCareerFront
            </span>
          </div>


          {loading ? (
            <Skeleton dark className="h-4 w-32" />
          ) : (
            <span className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm" style={{ color: theme.colors.text.light }}>
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Report ID: {reportId}
            </span>
          )}
        </div>
      </header>

      {/* Center content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 sm:py-14 relative z-10">
        <div className="w-full max-w-xl flex flex-col items-center text-center">

          {/* Concentric checkmark badge */}
          {loading ? (
            <Skeleton dark className="w-32 h-32 sm:w-40 sm:h-40 rounded-full mb-8 sm:mb-10" />
          ) : (
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 mb-8 sm:mb-10 flex items-center justify-center">
              <div
                className="absolute inset-0 rounded-full border border-dashed animate-[spin_18s_linear_infinite]"
                style={{ borderColor: "rgba(96,165,250,0.35)" }}
              >
                {[0, 90, 180, 270].map((deg) => (
                  <span
                    key={deg}
                    className="absolute w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor: theme.colors.primaryLight,
                      top: "50%",
                      left: "50%",
                      transform: `rotate(${deg}deg) translate(0, -63px) translate(-50%, -50%)`,
                    }}
                  />
                ))}
              </div>
              <div
                className="absolute rounded-full"
                style={{
                  inset: "14px",
                  backgroundColor: "rgba(59,130,246,0.10)",
                  border: "1px solid rgba(96,165,250,0.25)",
                }}
              />
              <div
                className={`relative w-16 h-16 sm:w-20 sm:h-20 ${theme.radius.full} flex items-center justify-center`}
                style={{
                  backgroundColor: "rgba(59,130,246,0.18)",
                  border: `1px solid ${theme.colors.primaryLight}`,
                  boxShadow: "0 0 40px rgba(59,130,246,0.35)",
                }}
              >
                <Check className="w-7 h-7 sm:w-9 sm:h-9" style={{ color: theme.colors.primaryLight }} strokeWidth={2.5} />
              </div>
            </div>
          )}

          {loading ? (
            <Skeleton dark className="h-3 w-40 mb-3 sm:mb-4" />
          ) : (
            <span className="text-[11px] sm:text-xs font-bold tracking-[0.2em] uppercase mb-3 sm:mb-4" style={{ color: theme.colors.primaryLight }}>
              Career Intelligence Report
            </span>
          )}

          {loading ? (
            <Skeleton dark className="h-10 sm:h-12 w-3/4 mb-4 sm:mb-5" />
          ) : (
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 sm:mb-5 leading-tight text-white">
              Your Report is{" "}
              <span style={{ color: theme.colors.primaryLight }}>Ready.</span>
            </h1>
          )}

          {loading ? (
            <>
              <Skeleton dark className="h-4 w-full max-w-md mb-2" />
              <Skeleton dark className="h-4 w-2/3 max-w-md mb-5 sm:mb-6" />
            </>
          ) : (
            <p className="text-sm sm:text-base leading-relaxed mb-5 sm:mb-6 max-w-md" style={{ color: "#94A3B8" }}>
              {trajectoriesAnalyzed} career trajectories analyzed across {domainsAnalyzed} domains
              using your psychometric and aptitude profile.
            </p>
          )}

          {loading ? (
            <Skeleton dark className="h-4 w-56 mb-8 sm:mb-10" />
          ) : (
            <p className="text-xs sm:text-sm mb-8 sm:mb-10" style={{ color: "#64748B" }}>
              Completed for <span className="font-semibold text-white">{studentName}</span>
              {" · "}
              Assessment Score:{" "}
              <span className="font-bold" style={{ color: theme.colors.primaryLight }}>
                {score}/100
              </span>
            </p>
          )}

          {/* Actions */}
          <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-10">
            {loading ? (
              <>
                <Skeleton dark className="h-12 w-full sm:w-56 rounded-md" />
                <Skeleton dark className="h-12 w-full sm:w-44 rounded-md" />
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleViewReport}
                  className={`w-full sm:w-auto flex items-center justify-center gap-2 ${theme.radius.md} font-semibold px-6 sm:px-7 py-3 sm:py-3.5 transition-colors ${theme.button.primary} ${theme.shadow.button}`}
                >
                  <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5" />
                  View Interactive Report
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className={`w-full sm:w-auto flex items-center justify-center gap-2 ${theme.radius.md} font-semibold px-6 sm:px-7 py-3 sm:py-3.5 transition-colors border`}
                  style={{
                    borderColor: "rgba(255,255,255,0.18)",
                    backgroundColor: "rgba(255,255,255,0.03)",
                    color: theme.colors.white,
                  }}
                >
                  <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                  Download PDF
                </button>
              </>
            )}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
            {loading
              ? [1, 2, 3].map((i) => <Skeleton key={i} dark className="h-8 w-40 rounded-full" />)
              : badges.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className={`inline-flex items-center gap-1.5 sm:gap-2 ${theme.radius.full} px-3.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-medium border`}
                  style={{
                    borderColor: "rgba(255,255,255,0.12)",
                    backgroundColor: "rgba(255,255,255,0.04)",
                    color: "#CBD5E1",
                  }}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: theme.colors.primaryLight }} />
                  {label}
                </span>
              ))}
          </div>
        </div>
      </main>

      {/* Footer timestamp */}
      <footer className="w-full px-4 sm:px-8 pb-5 sm:pb-6 relative z-10">
        {loading ? (
          <Skeleton dark className="h-3 w-40 mx-auto" />
        ) : (
          <p className="text-center text-[11px] sm:text-xs" style={{ color: "#475569" }}>
            Generated {formattedDate}
          </p>
        )}
      </footer>
    </div>
  );
};

export default ResultsReady;


// import React, { useEffect } from "react";
// import { useLocation } from "react-router-dom";
// import {
//     Compass,
//     Clock,
//     Check,
//     LayoutGrid,
//     Download,
//     ChevronRight,
//     Brain,
//     Award,
//     Globe2,
// } from "lucide-react";
// import theme from "../../theme/theme";

// /**
//  * TrueMindPath - Results Ready
//  * Final "handoff" screen shown after all sections are complete and the
//  * report has finished generating. Reads report data passed via
//  * navigate(..., { state }) from the last SectionSummary, with sensible
//  * fallbacks so the page still renders in isolation.
//  *
//  * Visual language is intentionally darker than the rest of the flow (this
//  * is the "reveal" moment) but every color still traces back to theme.js —
//  * theme.colors.primary / primaryLight are the same blue used throughout
//  * the app. The navy background + translucent whites are one-off,
//  * dark-surface values the way other pages already hardcode one-off
//  * backgrounds (e.g. "#F8FAFC") that aren't in theme.js.
//  */

// const ResultsReady = () => {
//     const location = useLocation();

//     const {
//         reportId = "TMP-2024-8741",
//         studentName = "Alex M.",
//         score = 94,
//         trajectoriesAnalyzed = 248,
//         domainsAnalyzed = 12,
//         generatedAt = new Date(),
//     } = location.state || {};

//     const formattedDate = new Date(generatedAt).toLocaleString(undefined, {
//         month: "short",
//         day: "numeric",
//         year: "numeric",
//         hour: "numeric",
//         minute: "2-digit",
//     });

//     useEffect(() => {
//         const link = document.createElement("link");
//         link.rel = "stylesheet";
//         link.href =
//             "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
//         document.head.appendChild(link);
//         return () => document.head.removeChild(link);
//     }, []);

//     const REPORT_PDF_URL = "/sample-report.pdf";

//     const handleViewReport = () => {
//         window.open(REPORT_PDF_URL, "_blank", "noopener,noreferrer");
//     };

//     const handleDownloadPdf = () => {
//         // Forces a save-to-disk instead of opening in a new tab.
//         const link = document.createElement("a");
//         link.href = REPORT_PDF_URL;
//         link.download = `TrueMindPath-Report-${reportId}.pdf`;
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//     };

//     const badges = [
//         { icon: Brain, label: "AI-Powered Analysis" },
//         { icon: Award, label: "Psychometric Validated" },
//         { icon: Globe2, label: "Global Benchmarked" },
//     ];

//     return (
//         <div
//             className="min-h-screen w-full flex flex-col relative overflow-hidden"
//             style={{
//                 fontFamily: theme.font.family,
//                 backgroundColor: "#0B1220",
//                 backgroundImage:
//                     "radial-gradient(ellipse 900px 500px at 50% 38%, rgba(59,130,246,0.16), transparent 65%), linear-gradient(180deg, #0B1220 0%, #101B34 55%, #0B1220 100%)",
//             }}
//         >
//             {/* Top bar */}
//             <header className="w-full px-4 sm:px-8 py-4 sm:py-6 relative z-10">
//                 <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
//                     <div className="flex items-center gap-2.5 sm:gap-3">
//                         <div
//                             className={`w-8 h-8 sm:w-9 sm:h-9 ${theme.radius.md} flex items-center justify-center`}
//                             style={{ backgroundColor: theme.colors.primary }}
//                         >
//                             <Compass className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: theme.colors.white }} strokeWidth={2.2} />
//                         </div>
//                         <span className="text-base sm:text-lg font-bold tracking-tight text-white">
//                             TrueMindPath
//                         </span>
//                     </div>

//                     <span
//                         className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
//                         style={{ color: theme.colors.text.light }}
//                     >
//                         <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
//                         Report ID: {reportId}
//                     </span>
//                 </div>
//             </header>

//             {/* Center content */}
//             <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 sm:py-14 relative z-10">
//                 <div className="w-full max-w-xl flex flex-col items-center text-center">

//                     {/* Concentric checkmark badge */}
//                     <div className="relative w-32 h-32 sm:w-40 sm:h-40 mb-8 sm:mb-10 flex items-center justify-center">
//                         <div
//                             className="absolute inset-0 rounded-full border border-dashed animate-[spin_18s_linear_infinite]"
//                             style={{ borderColor: "rgba(96,165,250,0.35)" }}
//                         >
//                             {[0, 90, 180, 270].map((deg) => (
//                                 <span
//                                     key={deg}
//                                     className="absolute w-1.5 h-1.5 rounded-full"
//                                     style={{
//                                         backgroundColor: theme.colors.primaryLight,
//                                         top: "50%",
//                                         left: "50%",
//                                         transform: `rotate(${deg}deg) translate(0, -63px) translate(-50%, -50%)`,
//                                     }}
//                                 />
//                             ))}
//                         </div>
//                         <div
//                             className="absolute rounded-full"
//                             style={{
//                                 inset: "14px",
//                                 backgroundColor: "rgba(59,130,246,0.10)",
//                                 border: "1px solid rgba(96,165,250,0.25)",
//                             }}
//                         />
//                         <div
//                             className={`relative w-16 h-16 sm:w-20 sm:h-20 ${theme.radius.full} flex items-center justify-center`}
//                             style={{
//                                 backgroundColor: "rgba(59,130,246,0.18)",
//                                 border: `1px solid ${theme.colors.primaryLight}`,
//                                 boxShadow: "0 0 40px rgba(59,130,246,0.35)",
//                             }}
//                         >
//                             <Check className="w-7 h-7 sm:w-9 sm:h-9" style={{ color: theme.colors.primaryLight }} strokeWidth={2.5} />
//                         </div>
//                     </div>

//                     <span
//                         className="text-[11px] sm:text-xs font-bold tracking-[0.2em] uppercase mb-3 sm:mb-4"
//                         style={{ color: theme.colors.primaryLight }}
//                     >
//                         Career Intelligence Report
//                     </span>

//                     <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 sm:mb-5 leading-tight text-white">
//                         Your Report is{" "}
//                         <span style={{ color: theme.colors.primaryLight }}>Ready.</span>
//                     </h1>

//                     <p
//                         className="text-sm sm:text-base leading-relaxed mb-5 sm:mb-6 max-w-md"
//                         style={{ color: "#94A3B8" }}
//                     >
//                         {trajectoriesAnalyzed} career trajectories analyzed across {domainsAnalyzed} domains
//                         using your psychometric and aptitude profile.
//                     </p>

//                     <p className="text-xs sm:text-sm mb-8 sm:mb-10" style={{ color: "#64748B" }}>
//                         Completed for <span className="font-semibold text-white">{studentName}</span>
//                         {" · "}
//                         Assessment Score:{" "}
//                         <span className="font-bold" style={{ color: theme.colors.primaryLight }}>
//                             {score}/100
//                         </span>
//                     </p>

//                     {/* Actions */}
//                     <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-10">
//                         <button
//                             type="button"
//                             onClick={handleViewReport}
//                             className={`w-full sm:w-auto flex items-center justify-center gap-2 ${theme.radius.md} font-semibold px-6 sm:px-7 py-3 sm:py-3.5 transition-colors ${theme.button.primary} ${theme.shadow.button}`}
//                         >
//                             <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5" />
//                             View Interactive Report
//                             <ChevronRight className="w-4 h-4" />
//                         </button>

//                         <button
//                             type="button"
//                             onClick={handleDownloadPdf}
//                             className={`w-full sm:w-auto flex items-center justify-center gap-2 ${theme.radius.md} font-semibold px-6 sm:px-7 py-3 sm:py-3.5 transition-colors border`}
//                             style={{
//                                 borderColor: "rgba(255,255,255,0.18)",
//                                 backgroundColor: "rgba(255,255,255,0.03)",
//                                 color: theme.colors.white,
//                             }}
//                         >
//                             <Download className="w-4 h-4 sm:w-5 sm:h-5" />
//                             Download PDF
//                         </button>
//                     </div>

//                     {/* Badges */}
//                     <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
//                         {badges.map(({ icon: Icon, label }) => (
//                             <span
//                                 key={label}
//                                 className={`inline-flex items-center gap-1.5 sm:gap-2 ${theme.radius.full} px-3.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-medium border`}
//                                 style={{
//                                     borderColor: "rgba(255,255,255,0.12)",
//                                     backgroundColor: "rgba(255,255,255,0.04)",
//                                     color: "#CBD5E1",
//                                 }}
//                             >
//                                 <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: theme.colors.primaryLight }} />
//                                 {label}
//                             </span>
//                         ))}
//                     </div>
//                 </div>
//             </main>

//             {/* Footer timestamp */}
//             <footer className="w-full px-4 sm:px-8 pb-5 sm:pb-6 relative z-10">
//                 <p className="text-center text-[11px] sm:text-xs" style={{ color: "#475569" }}>
//                     Generated {formattedDate}
//                 </p>
//             </footer>
//         </div>
//     );
// };

// export default ResultsReady;