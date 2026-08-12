// src/components/student/AssessmentRouter.jsx
import React from "react";
import { useParams } from "react-router-dom";
import { getTestConfig, getSectionOrder, getSection } from "../Testdata";
import AssessmentRunner from "../AssessmentRunner";
import RapidAssessmentRunner from "../RapidAssessmentRunner";

const AssessmentRouter = () => {
  const { testType = "aptitude", sectionId } = useParams();
  const sectionOrder = getSectionOrder(testType);
  const section = getSection(testType, sectionId || sectionOrder[0]);

  if (section.layout === "single-page") {
    return <RapidAssessmentRunner />;
  }

  return <AssessmentRunner />;
};

export default AssessmentRouter;