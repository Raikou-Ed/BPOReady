import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAssignedLevel } from "../utils/assessmentScoring";
import { getUserPreAssessment } from "../api/preAssessmentApi";
import { getCurrentUser } from "../utils/userData";
import ApplicantSidebar from "../components/ApplicantSidebar";

const ParagraphReading = () => {
  const [assessment, setAssessment] = useState(() => getAssignedLevel());

  useEffect(() => {
    const cur = getCurrentUser();
    if (cur?.id) {
      getUserPreAssessment(cur.id).then(data => {
        if (data && data.hasAssessment) {
          const lvl = String(data.placedLevel || cur.assigned_level || 'easy').toLowerCase();
          const defaultScore = lvl === 'hard' ? 92 : (lvl === 'medium' ? 81 : 65);
          setAssessment({
            score: data.score ?? defaultScore,
            placedLevel: data.placedLevel || cur.assigned_level || 'easy',
          });
        }
      });
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
            {assessment ? (
              <>
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
                  className="mt-8 inline-block rounded-xl bg-blue-600 px-8 py-3.5 font-semibold text-white hover:bg-blue-700 shadow-md transition-all text-sm"
                >
                  Start Assigned Practice →
                </Link>
              </>
            ) : (
              <>
                <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                  Initial Step Required
                </span>
                <h2 className="mt-4 text-2xl font-bold text-gray-900">Pre-Assessment Required</h2>
                <p className="mt-3 text-gray-600 text-sm">
                  Complete one recorded reading evaluation. The speech engine will diagnose your fluency and assign your starting level.
                </p>
                <Link
                  to="/pre-assessment"
                  className="mt-8 inline-block rounded-xl bg-blue-600 px-8 py-3.5 font-semibold text-white hover:bg-blue-700 shadow-md transition-all text-sm"
                >
                  Start Pre-Assessment →
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
      