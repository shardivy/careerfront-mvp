import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import "./App.css";
import { Toaster } from "@/components/ui/toast";
import ServerError from "./ServerError";

// Auth Components
// import Register from "./components/Register";
// import Login from "./components/Login";
// import VerifyOtp from "./components/Verifyotp";
// import ForgotPassword from "./components/ForgotPassword";
// import ResetPassword from "./components/ResetPassword";

// Student Components
import TestSelection from "./components/student/TestSelection";
import AssessmentRunner from "./components/student/AssessmentRunner";
import SectionSummary from "./components/student/SectionSummary";
import ResultsReady from "./components/student/ResultsReady";
import TestInstructions from "./components/student/Testinstructions";

// 404
import NotFound from "./NotFound";
import Default from "./components/student/Default";

// Enterprise Components
// import EnterpriseLayout from "./components/layouts/EnterpriseLayout";
// import EnterpriseDashboard from "./components/enterprise/Dashboard";
// import Students from "./components/enterprise/Students";
// import ViewStudentJourney from "./components/enterprise/ViewStudentJourney";
// import Reports from "./components/enterprise/Reports";
// import Analytics from "./components/enterprise/Analytics";

// Admin Components
// import AdminLayout from "./components/layouts/AdminLayout";
// import AdminDashboard from "./components/admin/Dashboard";
// import AssessmentOverview from "./components/admin/AssessmentOverview";
// import CreateAssessment from "./components/admin/CreateAssessment";
// import QuestionBankRepository from "./components/admin/QuestionBankRepository";
// import QuestionLibrary from "./components/admin/QuestionLibrary";
// import CreateQuestion from "./components/admin/CreateQuestion";
// import QuestionMapping from "./components/admin/QuestionMapping";
// import AdminProfile from "./components/admin/AdminProfile";
// import AssessmentStructure from "./components/admin/AssessmentStructure";
// import ViewQuestion from "./components/admin/ViewQuestion";





const App = () => {
  const [showServerError, setShowServerError] = useState(false);

  return (
    <BrowserRouter>
      <Toaster position="bottom-left">
        {showServerError && (
          <ServerError
            onRetry={() => {
              setShowServerError(false);
              window.location.reload();
            }}
          />
        )}
        <Routes>

          {/* Authentication */}
          {/* <Route path="/" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} /> */}

          {/* --------- Student Routes ----------- */}
          <Route path="/" element={<Default />} />
          <Route path="/test-selection" element={<TestSelection />} />
          {/* <Route path="/test/aptitude" element={<AptitudeTest />} /> */}
          <Route path="/test/:testType/:sectionId/start" element={<AssessmentRunner />} />
          <Route
            path="/test/:testType/:sectionId/summary"
            element={<SectionSummary />}
          />
          <Route path="/test/reports" element={<ResultsReady />} />
          <Route path="/test/:testType" element={<TestInstructions />} />




          {/* Create assessment page without the shared admin layout */}
          {/* <Route path="/s-admin/create-assessment" element={<CreateAssessment />} />
        <Route path="/s-admin/create-question" element={<CreateQuestion />} />
        <Route path="/s-admin/edit-question/:id" element={<CreateQuestion />} />
        <Route path="/s-admin/question-library/:questionId" element={<ViewQuestion />} /> */}

          {/* ------------- Admin Routes --------------*/}
          {/* <Route path="/s-admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="assessment-overview" element={<AssessmentOverview />} />
          <Route path="question-bank-repository" element={<QuestionBankRepository />} />
          <Route path="question-library" element={<QuestionLibrary />} />
          <Route path="question-mapping" element={<QuestionMapping />} />
          <Route path="assessment-structure" element={<AssessmentStructure />} />
          <Route path="admin-profile" element={<AdminProfile />} />
     
     
        </Route> */}

          {/* ------------- Enterprise Routes --------------*/}
          {/* <Route path="/enterprise" element={<EnterpriseLayout />}>
          <Route index element={<EnterpriseDashboard />} />
          <Route path="dashboard" element={<EnterpriseDashboard />} />
          <Route path="students" element={<Students />} />
          <Route path="student-journey" element={<ViewStudentJourney />} />
          <Route path="reports" element={<Reports />} />
          <Route path="analytics" element={<Analytics />} />
        </Route> */}

          {/* 404 */}
          <Route path="*" element={<NotFound />} />

        </Routes>

      </Toaster>
    </BrowserRouter>
  );
};

export default App;