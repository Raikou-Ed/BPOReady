import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAssignedLevel, clearAssessmentResult } from "../utils/assessmentScoring";
import { getUserPreAssessment } from "../api/preAssessmentApi";
import { getCurrentUser } from "../utils/userData";
import ApplicantSidebar from "../components/ApplicantSidebar";

const ParagraphReading = () => {
  const [assessment, setAssessment] = useState(() => getAssignedLevel());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cur = getCurrentUser();
    if (cur?.id) {
      getUserPreAssessment(cur.id)
        .then(data => {
          if (data && data.hasAssessment) {
            const lvl = String(data.placedLevel || 'easy').toLowerCase();
            setAssessment({
              score: data.score,
              placedLevel: lvl,
            });
          } else {
            const localAssigned = getAssignedLevel();
            if (localAssigned && Number(localAssigned.score) > 0) {
              setAssessment(localAssigned);
            } else {
              setAssessment(null);
            }
          }
        })
        .catch(err => {
          console.warn("Failed to fetch pre-assessment status:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const assignedPath = assessment ? `/${assessment.placedLevel}-level-paragraph-reading` : "/pre-assessment";

  return (
    <div className="flex min-h-screen bg-gray-50 font-poppins">
      <ApplicantSidebar activeItem="Paragraph Reading" />

      {/* Main Content */}
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-4xl mx-auto py-6">
          {/* Header */}
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Speech Training Module</span>
            <h1 className="text-3xl font-extrabold text-gray-800 mt-2">Paragraph Reading Practice</h1>
            <p className="text-gray-600 mt-2 max-w-2xl mx-auto text-sm leading-relaxed">
              Complete the pre-assessment first. Your result determines the specific reading difficulty level assigned to you.
            </p>
          </div>

          <div className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-md">
            {loading ? (
              <div className="py-8 text-gray-400 text-sm font-medium animate-pulse">
                Checking assessment status...
              </div>
            ) : assessment ? (
              <>
                <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-5 shadow-sm">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100">
                  Assigned Difficulty Tier
                </span>
                <h2 className="mt-4 text-3xl font-extrabold capitalize text-gray-900">{assessment.placedLevel} Level</h2>
                <p className="mt-3 text-gray-600 text-sm font-medium">
                  Pre-assessment composite score: <span className="font-bold text-blue-600">{assessment.score}/100</span>.
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  This track was assigned automatically based on your acoustic and verbal evaluation.
                </p>
                <Link
                  to={assignedPath}
                  className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 font-semibold text-white hover:bg-blue-700 shadow-md transition-all text-sm"
                >
                  <span>Start Assigned Practice</span>
                  <span>→</span>
                </Link>
              </>
            ) : (
              <>
                <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-5 shadow-sm">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
                  </svg>
                </div>
                <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                  Initial Step Required
                </span>
                <h2 className="mt-4 text-2xl font-bold text-gray-900">Pre-Assessment Required</h2>
                <p className="mt-3 text-gray-600 text-sm">
                  Complete one recorded reading evaluation. The speech engine will diagnose your fluency and assign your starting level.
                </p>
                <Link
                  to="/pre-assessment"
                  className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 font-semibold text-white hover:bg-blue-700 shadow-md transition-all text-sm"
                >
                  <span>Start Pre-Assessment</span>
                  <span>→</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParagraphReading;
      