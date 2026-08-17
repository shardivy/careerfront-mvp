// src/components/student/AssessmentRouter.jsx
import React from "react";
import { useParams } from "react-router-dom";
import { UseTestSubsection } from "../../hooks/UseTestSubsections";
import AssessmentRunner from "../AssessmentRunner";
import RapidAssessmentRunner from "../RapidAssessmentRunner";
import Skeleton from "../../ui/skeleton";

const AssessmentRouter = () => {
  const { testType = "aptitude", sectionId } = useParams();

  // `useTestSubsection` resolves `sectionId` (falling back to the first
  // subsection when the route doesn't specify one, same as the runners)
  // and fetches it from the API rather than a static testData lookup.
  const { section, loading, error } = UseTestSubsection(testType, sectionId);

  // Section hasn't resolved yet — we don't know its layout, so we can't
  // decide which runner to render. A brief blank/skeleton beat here is
  // preferable to guessing wrong and remounting a runner a moment later.
  if (loading || !section) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center px-4">
        {error ? (
          <p className="text-sm" style={{ color: "#B91C1C" }}>
            Couldn't load this section right now. Please refresh the page.
          </p>
        ) : (
          <Skeleton className="h-6 w-40" />
        )}
      </div>
    );
  }

  if (section.layout === "single-page") {
    return <RapidAssessmentRunner />;
  }

  return <AssessmentRunner />;
};

export default AssessmentRouter;