import React from "react";
import { Link, useLocation } from "react-router-dom";
import { formatScore, getAssignedLevel, getScoreTieredFeedback } from "../utils/assessmentScoring";
import { getUserData } from "../utils/userData";
import ApplicantSidebar from "../components/ApplicantSidebar";

const EasyLevelResult = () => {
  const location = useLocation();
  const result = location.state?.result || getUserData('bpoReadyLastParagraphResult') || getAssignedLevel();
  const canProceedToMedium = Number(result?.score ?? 0) >= 76;
  const numScore = Number(result?.score ?? 0);
  const tiered = getScoreTieredFeedback(numScore);

  return (
    <div className="flex min-h-screen bg-gray-50 font-poppins">
      <ApplicantSidebar activeItem="Paragraph Reading" />

      {/* Main Content */}
      <div className="flex-1 ml-64">
        {/* Header */}
        <div className="bg-white shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">Easy Level - Paragraph Reading</h1>
            <button className="text-gray-600 hover:text-gray-800">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Page Content */}
        <div className="container mx-auto px-4 py-12">
          {/* Speech Analysis Result Card */}
          <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-8">Speech Analysis Result</h2>

            {result?.aiEvaluated && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Speech Analysis Complete
              </div>
            )}

            {result ? (
              <>
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Reading Result</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <span className="text-gray-600">Score:</span>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-xl ${numScore >= 76 ? 'text-emerald-700' : numScore >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                          {formatScore(result.score)}/100
                        </span>
                        {numScore >= 76 ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Passed
                          </span>
                        ) : numScore >= 50 ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            In Progress
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            Needs Improvement
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <span className="text-gray-600">Assigned level:</span>
                      <span className="font-semibold text-gray-800 capitalize">{result.placedLevel}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Level rule:</span>
                      <span className="font-semibold text-gray-800">1–75 Easy · 76–89 Medium · 90–100 Hard</span>
                    </div>
                  </div>
                </div>

                <div className="mb-8 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                  <div className="grid grid-cols-4 border-b border-gray-200 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                    <span>Factor</span>
                    <span>Result</span>
                    <span>Weight</span>
                    <span>Contribution</span>
                  </div>
                  {result.criteria?.map((criterion) => (
                    <div key={criterion.name} className="grid grid-cols-4 border-t border-gray-200 px-4 py-3 text-sm text-gray-700">
                      <span>{criterion.name}</span>
                      <span className="font-medium">
                        {criterion.value == null ? 'Not measured' : `${criterion.value}/100`}
                        {criterion.detail ? <span className="text-xs text-gray-400 font-normal"> ({criterion.detail})</span> : null}
                      </span>
                      <span>{criterion.weight ? `${criterion.weight}%` : '-'}</span>
                      <span className={`font-semibold ${numScore >= 76 ? 'text-emerald-700' : numScore >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                        {criterion.weight ? Number(criterion.contribution || 0).toFixed(2) : '-'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Speech Evaluation Feedback */}
                <div className="bg-blue-50 border-l-4 border-blue-600 p-5 mb-6 rounded-r-xl shadow-xs">
                  <h4 className="text-sm font-bold text-blue-900 mb-1">Speech Coach Feedback</h4>
                  <p className="text-gray-800 text-sm leading-relaxed">
                    {result.feedbackText || tiered.feedbackText}
                  </p>
                </div>

                {/* Suggestions for Improvement - Call To Action Card */}
                <div className="mb-8 rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-orange-50/60 to-yellow-50 p-6 shadow-sm">
                  <h3 className="text-base font-extrabold text-amber-950 mb-1">
                    Suggestions for Improvement:
                  </h3>
                  <p className="text-xs text-amber-800/80 mb-4 font-medium">
                    Focus on these recommended action steps in your next practice session:
                  </p>

                  <div className="space-y-2.5">
                    {(Array.isArray(result.suggestions) && result.suggestions.length > 0
                      ? result.suggestions
                      : tiered.suggestions
                    ).map((suggestion, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3.5 bg-white rounded-xl border border-amber-200 shadow-2xs hover:border-amber-400 transition-colors"
                      >
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white font-bold text-xs flex items-center justify-center mt-0.5 shadow-2xs">
                          {idx + 1}
                        </span>
                        <p className="text-sm font-semibold text-gray-800 leading-relaxed">
                          {suggestion}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="mb-10">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Speech Analysis Summary:</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <span className="text-gray-600">Filler Words:</span>
                      <span className="font-semibold text-gray-800">"uhm" (3), "you know" (1)</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <span className="text-gray-600">Total Words:</span>
                      <span className="font-semibold text-gray-800">87</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <span className="text-gray-600">Confidence:</span>
                      <span className="font-semibold text-gray-800">Moderate</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Pacing:</span>
                      <span className="font-semibold text-gray-800">Slightly Fast</span>
                    </div>
                  </div>
                </div>

                <hr className="my-8" />

                <div className="mb-8 rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-orange-50/60 to-yellow-50 p-6 shadow-sm">
                  <h3 className="text-base font-extrabold text-amber-950 mb-1">
                    Suggestions for Improvement:
                  </h3>
                  <p className="text-xs text-amber-800/80 mb-4 font-medium">
                    Focus on these recommended action steps in your next practice session:
                  </p>

                  <div className="space-y-2.5">
                    {[
                      "Minimize the use of filler words to improve fluency",
                      "Maintain a steady and controlled speaking pace",
                      "Focus on clear pronunciation of each word",
                      "Practice regularly to build confidence in reading aloud"
                    ].map((suggestion, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3.5 bg-white rounded-xl border border-amber-200 shadow-2xs hover:border-amber-400 transition-colors"
                      >
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white font-bold text-xs flex items-center justify-center mt-0.5 shadow-2xs">
                          {idx + 1}
                        </span>
                        <p className="text-sm font-semibold text-gray-800 leading-relaxed">
                          {suggestion}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-10">
                  <p className="text-gray-800">
                    Thank you for completing the paragraph reading activity. Overall, your delivery is clear and understandable, and you were able to read the passage with a reasonable level of confidence. Your pronunciation is generally accurate, which helps maintain clarity. However, there are instances where filler words such as "uhm" and "um" were used, which slightly affect the smoothness of your delivery. Your pacing is also slightly fast in some parts, which may make it harder for listeners to fully understand you speech.
                  </p>
                </div>
              </>
            )}

            <div className="flex gap-4 justify-center">
              <Link to="/easy-level-paragraph-reading">
                <button className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md">
                  Retry Easy Level
                </button>
              </Link>
              {canProceedToMedium ? (
                <Link to="/medium-level-paragraph-reading">
                  <button className="px-8 py-3 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition-colors shadow-md">
                    Proceed to Medium Level
                  </button>
                </Link>
              ) : (
                <button disabled className="cursor-not-allowed px-8 py-3 bg-gray-300 text-gray-600 font-semibold rounded-lg shadow-md" title="Minimum score to unlock medium is 76/100">
                  Proceed to Medium Level
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EasyLevelResult;
