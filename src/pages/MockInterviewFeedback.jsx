import React from "react";
import { Link, useLocation } from "react-router-dom";
import ApplicantSidebar from "../components/ApplicantSidebar";

const MockInterviewFeedback = () => {
  const location = useLocation();
  const state = location.state || {};
  const interviewType = state.interviewType || "Mock Interview";
  const result = state.result || {};
  const feedback = result.feedback || {};
  const stats = result.stats || {};
  const answers = state.answers || [];

  const overallScore = Number(result.overall_score ?? feedback.clarity_score ?? 0);
  const fillerCount = Number(feedback.filler_word_count ?? stats.filler_count ?? 0);
  const fillerWords = feedback.filler_words || {};
  const clarity = Number(feedback.clarity_score ?? 0);
  const confidence = Number(feedback.confidence_score ?? 0);
  const pacing = Number(feedback.pacing_score ?? 0);
  const grammar = Number(feedback.grammar_score ?? 0);
  const answerQuality = Number(feedback.answer_quality_score ?? 0);

  const feedbackText = feedback.feedback_text ||
    (overallScore < 50
      ? "The responses provided in this mock interview were very brief, hesitant, or lacked sufficient substance. Multiple disfluencies or incomplete answers were detected. Practice delivering structured answers before retrying."
      : "Thank you for completing the mock interview session. Overall, you expressed your ideas clearly, maintained good responsiveness, and addressed the situational demands well.");

  const rawSuggestions = feedback.suggestions ||
    (overallScore < 50
      ? "• Provide complete explanations instead of single-phrase answers.\n• Use the STAR method to structure behavioral answers.\n• Pause silently for 2 seconds to formulate your thoughts instead of using filler sounds."
      : "• Practice pausing silently instead of using hesitation sounds like 'um' or 'ah'.\n• Structure behavioral answers with the STAR framework.\n• Keep your speaking pace steady around 130 words per minute.");

  const suggestionsList = typeof rawSuggestions === "string"
    ? rawSuggestions.split("\n").filter(s => s.trim().length > 0).map(s => s.replace(/^[•\-\*]\s*/, ""))
    : ["Reduce filler words by pausing", "Maintain even speaking tempo", "Structure answers clearly"];

  // Helper helpers for metric badges
  const getMetricTier = (val) => {
    if (val >= 75) return { color: "text-emerald-600 bg-emerald-50 border-emerald-200", label: "Proficient" };
    if (val >= 50) return { color: "text-amber-600 bg-amber-50 border-amber-200", label: "Developing" };
    return { color: "text-rose-600 bg-rose-50 border-rose-200", label: "Needs Work" };
  };

  const getFillerTier = (count) => {
    if (count === 0) return { color: "text-emerald-600 bg-emerald-50 border-emerald-200", label: "Zero Fillers" };
    if (count <= 3) return { color: "text-blue-600 bg-blue-50 border-blue-200", label: "Controlled" };
    if (count <= 6) return { color: "text-amber-600 bg-amber-50 border-amber-200", label: "Frequent" };
    return { color: "text-rose-600 bg-rose-50 border-rose-200", label: "Excessive" };
  };

  const clarityTier = clarity >= 75 ? { color: "text-emerald-600", label: "Articulate" } : (clarity >= 50 ? { color: "text-amber-600", label: "Fair Clarity" } : { color: "text-rose-600", label: "Needs Clarity" });
  const confidenceTier = confidence >= 75 ? { color: "text-blue-600", label: "Composed" } : (confidence >= 50 ? { color: "text-amber-600", label: "Hesitant" } : { color: "text-rose-600", label: "Low Confidence" });
  const pacingTier = pacing >= 75 ? { color: "text-purple-600", label: "Steady" } : (pacing >= 50 ? { color: "text-amber-600", label: "Uneven Pace" } : { color: "text-rose-600", label: "Erratic Pace" });
  const qualityTier = answerQuality >= 75 ? { color: "text-indigo-600", label: "BPO Aligned" } : (answerQuality >= 50 ? { color: "text-amber-600", label: "Basic Answers" } : { color: "text-rose-600", label: "Needs Substance" });
  const fillerTier = getFillerTier(fillerCount);

  const readinessTier = overallScore >= 75
    ? { box: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", label: "BPO Benchmark Met" }
    : (overallScore >= 50
      ? { box: "bg-amber-50 border-amber-200", text: "text-amber-700", label: "Developmental Needed" }
      : { box: "bg-rose-50 border-rose-200", text: "text-rose-700", label: "Remedial Coaching Required" });

  return (
    <div className="flex min-h-screen bg-gray-50 font-poppins">
      <ApplicantSidebar activeItem="Mock Interview" />

      {/* Main Content */}
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              {result.aiEvaluated !== false && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Interview Evaluation Complete
                </div>
              )}
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Evaluation Scorecard</span>
                <h1 className="text-2xl font-bold text-gray-800 mt-1">{interviewType} Feedback</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Automated speech and response evaluation across recorded interview questions.
                </p>
              </div>
            </div>

            <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl border flex-shrink-0 ${readinessTier.box}`}>
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-wider">{readinessTier.label}</p>
                <p className={`text-4xl font-extrabold ${readinessTier.text}`}>{Math.round(overallScore)}<span className="text-lg font-medium text-gray-400">/100</span></p>
              </div>
            </div>
          </div>

          {/* Speech Analysis Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm text-center">
              <p className="text-xs text-gray-500 font-semibold mb-1">Clarity</p>
              <p className="text-2xl font-bold text-gray-800">{Math.round(clarity)}%</p>
              <span className={`text-[11px] font-semibold ${clarityTier.color}`}>{clarityTier.label}</span>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm text-center">
              <p className="text-xs text-gray-500 font-semibold mb-1">Confidence</p>
              <p className="text-2xl font-bold text-gray-800">{Math.round(confidence)}%</p>
              <span className={`text-[11px] font-semibold ${confidenceTier.color}`}>{confidenceTier.label}</span>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm text-center">
              <p className="text-xs text-gray-500 font-semibold mb-1">Pacing</p>
              <p className="text-2xl font-bold text-gray-800">{Math.round(pacing)}%</p>
              <span className={`text-[11px] font-semibold ${pacingTier.color}`}>{pacingTier.label}</span>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm text-center">
              <p className="text-xs text-gray-500 font-semibold mb-1">Answer Quality</p>
              <p className="text-2xl font-bold text-gray-800">{Math.round(answerQuality)}%</p>
              <span className={`text-[11px] font-semibold ${qualityTier.color}`}>{qualityTier.label}</span>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm text-center col-span-2 md:col-span-1">
              <p className="text-xs text-gray-500 font-semibold mb-1">Filler Words</p>
              <p className="text-2xl font-bold text-gray-800">{fillerCount}</p>
              <span className={`text-[11px] font-semibold ${fillerTier.color}`}>
                {fillerTier.label}
              </span>
            </div>
          </div>

          {/* Filler Word Breakdown & AI Commentary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-slate-50 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-blue-950">
                      AI Interview Coaching Summary
                    </h3>
                    <p className="text-xs text-blue-800/70 font-medium">Evaluation based on professional BPO communication benchmarks</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">{feedbackText}</p>
              </div>

              {Object.keys(fillerWords).length > 0 && (
                <div className="pt-3 border-t border-blue-100/90 mt-2">
                  <p className="text-xs font-semibold text-blue-900 mb-2">Detected Hesitations:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(fillerWords).map(([word, count]) => (
                      <span key={word} className="px-2.5 py-1 bg-white border border-blue-200 text-blue-700 text-xs rounded-full font-medium shadow-2xs">
                        "{word}" ({count}x)
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-orange-50/70 to-yellow-50 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="mb-3">
                  <h3 className="text-base font-extrabold text-amber-950 mb-1">
                    Targeted Improvement Tips
                  </h3>
                  <p className="text-xs text-amber-800/80 font-medium">
                    Focus on these recommended action steps in your next practice session:
                  </p>
                </div>

                <div className="space-y-2.5">
                  {suggestionsList.map((tip, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3.5 bg-white rounded-xl border border-amber-200 shadow-2xs hover:border-amber-400 transition-colors"
                    >
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white font-bold text-xs flex items-center justify-center mt-0.5 shadow-2xs">
                        {idx + 1}
                      </span>
                      <p className="text-sm font-semibold text-gray-800 leading-relaxed">
                        {tip}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Answer Review Section */}
          {answers.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-base font-bold text-gray-800 mb-4">Question & Response Transcripts</h3>
              <div className="space-y-4">
                {answers.map((item, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                    <p className="font-semibold text-gray-800 mb-1">Q{idx + 1}: {item.question_text}</p>
                    <p className="text-gray-600 italic">"{item.answer_text}"</p>
                    <span className="text-xs text-gray-400 mt-2 block">Duration: {item.duration_seconds}s</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link to="/MockInterview" className="flex-1">
              <button className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-md transition-all">
                Practice Another Mock Interview
              </button>
            </Link>
            <Link to="/communication-exercises" className="flex-1">
              <button className="w-full py-3.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all">
                Go to Recommended Exercises →
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockInterviewFeedback;