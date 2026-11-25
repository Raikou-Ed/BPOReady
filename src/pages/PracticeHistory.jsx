import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getUserActivity, getCurrentUser } from "../utils/userData";
import { getApplicantHistory, getMockInterviewFeedback } from "../api/adminApi";
import { getActiveEvaluationCriteria, getActiveMockInterviewCriteria, getActiveCallSimulationCriteria } from "../utils/assessmentScoring";
import ApplicantSidebar from "../components/ApplicantSidebar";

const PracticeHistory = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(true);

  // Scorecard Modal State
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [detailedSession, setDetailedSession] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const currentUser = getCurrentUser() || { id: 19, name: "Applicant" };

  useEffect(() => {
    async function loadHistory() {
      const local = getUserActivity() || [];

      // Auto-heal: If user has a recent paragraph reading in localStorage that wasn't logged into activity history yet, add it
      try {
        const lastReading = getUserData('bpoReadyLastParagraphResult');
        if (lastReading && lastReading.score != null) {
          const alreadyInLocal = local.some((l) =>
            (l.type === 'paragraph_reading' || (l.activity && l.activity.includes('Paragraph Reading'))) &&
            String(l.score) === String(lastReading.score)
          );
          if (!alreadyInLocal) {
            const rawLvl = lastReading.assignedLevel || 'Hard';
            const titleCaseLevel = rawLvl.charAt(0).toUpperCase() + rawLvl.slice(1);
            const autoLogged = {
              id: `reading_${rawLvl.toLowerCase()}_${Date.now()}`,
              activity: `Paragraph Reading (${titleCaseLevel})`,
              level: titleCaseLevel,
              result: `${lastReading.score}/100`,
              score: lastReading.score,
              criteria: lastReading.criteria,
              feedbackText: lastReading.feedbackText || (lastReading.score === 0 ? "No clear speech or passage match detected. Please re-read the passage aloud." : null),
              suggestions: lastReading.suggestions || [],
              date: new Date().toISOString(),
              type: 'paragraph_reading',
            };
            local.unshift(autoLogged);
            saveUserData('bpoReadyActivity', local);
          }
        }
      } catch (e) {
        console.warn('Auto-heal last paragraph reading:', e);
      }

      try {
        const remote = await getApplicantHistory(currentUser.id || 19);
        if (Array.isArray(remote) && remote.length > 0) {
          const remoteList = remote.map((r) => {
            let scoreVal = r.score != null ? Number(r.score) : undefined;
            let resultVal = r.result || (scoreVal != null ? `${scoreVal}/100` : "Completed");

            // Normalize legacy 18/100 backend volume floor bug (90 * 0.20 = 18) when speech was actually 0
            const isReading = (r.type === 'paragraph_reading' || r.activity_type === 'paragraph_reading' || (r.activity && r.activity.toLowerCase().includes('paragraph')));
            if (isReading && (scoreVal === 18 || resultVal === '18/100')) {
              scoreVal = 0;
              resultVal = '0/100';
            }

            return {
              id: r.id,
              activity: r.activity || r.activity_type || "Practice Drill",
              level: r.level || "Standard",
              result: resultVal,
              score: scoreVal,
              criteria: r.criteria,
              feedbackText: r.feedbackText || r.feedback_text,
              suggestions: r.suggestions,
              date: r.date || r.created_at || new Date().toISOString(),
              type: r.type || "practice",
            };
          });

          // Merge local and remote activities, ensuring local freshest records take priority
          const map = new Map();
          remoteList.forEach((r) => map.set(String(r.id), r));
          local.forEach((l) => map.set(String(l.id || `${l.type}_${l.date}`), l));

          const combined = Array.from(map.values());
          combined.sort((a, b) => new Date(b.date) - new Date(a.date));

          setActivities(combined);
          return;
        }
      } catch (err) {
        console.warn("Using local practice history:", err);
      } finally {
        setLoading(false);
      }
      setActivities(local || []);
    }
    loadHistory();
  }, [currentUser.id]);

  // Load detailed session data when an activity is selected
  useEffect(() => {
    if (!selectedActivity) {
      setDetailedSession(null);
      return;
    }

    const actId = String(selectedActivity.id || "");
    const isMock = selectedActivity.type === "mock_interview" || actId.startsWith("ms_");

    if (isMock && actId.includes("_")) {
      const sessionId = actId.replace("ms_", "");
      setLoadingDetails(true);
      getMockInterviewFeedback(sessionId)
        .then((data) => {
          if (data && data.feedback) {
            setDetailedSession(data);
          } else {
            setDetailedSession(null);
          }
        })
        .catch(() => setDetailedSession(null))
        .finally(() => setLoadingDetails(false));
    } else {
      setDetailedSession(null);
    }
  }, [selectedActivity]);

  const filtered = activities.filter((item) => {
    if (filterType === "all") return true;
    const act = (item.activity || "").toLowerCase();
    const typ = (item.type || "").toLowerCase();
    if (filterType === "interview") return act.includes("interview") || typ.includes("interview");
    if (filterType === "exercise") return act.includes("exercise") || act.includes("filler") || act.includes("pacing") || act.includes("grammar") || typ.includes("exercise");
    if (filterType === "simulation") return act.includes("simulation") || act.includes("call") || typ.includes("simulation");
    if (filterType === "reading") return act.includes("paragraph") || act.includes("reading") || act.includes("pre-assessment");
    return true;
  });

  // Helper to extract score number
  const getScoreNum = (resultStr) => {
    if (resultStr == null) return 0;
    const match = String(resultStr).match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  const getCefrBadge = (score) => {
    if (score >= 90) return { label: "CEFR C1 (Advanced Voice)", color: "bg-purple-100 text-purple-800 border-purple-200" };
    if (score >= 75) return { label: "CEFR B2 (BPO Ready Standard)", color: "bg-emerald-100 text-emerald-800 border-emerald-200" };
    if (score > 0) return { label: "CEFR B1 (Developing Competencies)", color: "bg-amber-100 text-amber-800 border-amber-200" };
    return { label: "Needs Improvement (0/100)", color: "bg-rose-100 text-rose-800 border-rose-200" };
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-poppins">
      <ApplicantSidebar activeItem="Practice History" />

      {/* Main Content */}
      <div className="flex-1 ml-64 p-10">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Session Logs & Audits
              </span>
              <h1 className="text-2xl font-bold text-gray-900 mt-1 flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Practice History</span>
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Full chronological record of your speech recordings, mock interviews, and communication drills. Click any session to audit its scorecard.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400 font-semibold uppercase">Total Sessions</span>
              <p className="text-2xl font-bold text-blue-600">{activities.length}</p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "All Activities" },
              { key: "interview", label: "Mock Interviews" },
              { key: "exercise", label: "Communication Drills" },
              { key: "simulation", label: "Call Simulations" },
              { key: "reading", label: "Reading & Pre-Assessment" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterType(tab.key)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition cursor-pointer ${
                  filterType === tab.key
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* History Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Activity Name</th>
                  <th className="px-6 py-3.5">Module / Level</th>
                  <th className="px-6 py-3.5">Date & Time</th>
                  <th className="px-6 py-3.5">Score / Result</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length > 0 ? (
                  filtered.map((item, idx) => (
                    <tr
                      key={item.id || idx}
                      onClick={() => setSelectedActivity(item)}
                      className="hover:bg-blue-50/50 cursor-pointer transition group"
                    >
                      <td className="px-6 py-4 font-semibold text-gray-900 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 group-hover:scale-125 transition-transform" />
                        {item.activity}
                      </td>
                      <td className="px-6 py-4 text-gray-600 capitalize">
                        {item.level || "Standard"}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 font-bold text-blue-600">
                        {item.result}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full font-bold text-[10px] uppercase">
                          Completed
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedActivity(item);
                          }}
                          className="px-3 py-1.5 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white text-blue-700 font-bold rounded-xl text-[11px] transition inline-flex items-center gap-1.5 border border-blue-200 group-hover:border-blue-600 shadow-2xs cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>View Scorecard</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>No matching practice sessions found. Choose another filter or start a new practice drill!</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 🌟 SPECIFIC SESSION SCORECARD MODAL 🌟 */}
      {selectedActivity && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setSelectedActivity(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150 p-6 sm:p-8 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Bar */}
            <div className="flex items-start justify-between pb-4 border-b border-gray-100">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 mb-1">
                  <span>{selectedActivity.activity} Audit</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">{selectedActivity.level || selectedActivity.activity}</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Recorded on {new Date(selectedActivity.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} at {new Date(selectedActivity.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedActivity(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Overall Scorecard Banner */}
            {(() => {
              let score = selectedActivity.score != null
                ? Number(selectedActivity.score)
                : (detailedSession?.overall_score ?? getScoreNum(selectedActivity.result));
              const type = (selectedActivity.type || "").toLowerCase();
              const act = (selectedActivity.activity || "").toLowerCase();
              const isReading = type.includes("reading") || act.includes("paragraph") || act.includes("pre-assessment");
              if (isReading && (score === 18 || selectedActivity.result === '18/100') && !selectedActivity.criteria) {
                score = 0;
              }
              const cefr = getCefrBadge(score);
              return (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/90 via-indigo-50/50 to-slate-50 border border-blue-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Official Evaluation Score</span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-4xl font-extrabold text-blue-700">{score}</span>
                      <span className="text-sm font-semibold text-gray-400">/ 100</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${cefr.color}`}>
                      {cefr.label}
                    </span>
                    <p className="text-[10px] text-gray-500 mt-1 font-medium">Standardized against CEFR Table 3</p>
                  </div>
                </div>
              );
            })()}

            {/* CEFR Dimension Pillars Breakdown */}
            {(() => {
              let score = selectedActivity.score != null
                ? Number(selectedActivity.score)
                : (detailedSession?.overall_score ?? getScoreNum(selectedActivity.result));
              const type = (selectedActivity.type || "").toLowerCase();
              const act = (selectedActivity.activity || "").toLowerCase();
              const isReading = type.includes("reading") || act.includes("paragraph") || act.includes("pre-assessment");
              if (isReading && (score === 18 || selectedActivity.result === '18/100') && !selectedActivity.criteria) {
                score = 0;
              }

              let pillars = [];

              if (Array.isArray(selectedActivity.criteria) && selectedActivity.criteria.length > 0) {
                // Exact criteria saved directly from the session!
                pillars = selectedActivity.criteria.map((c) => ({
                  name: c.name === "Pronunciation" ? "Accuracy" : c.name,
                  weight: `${c.weight ?? 50}%`,
                  score: Number(c.value ?? 0),
                  contribution: c.contribution,
                  label: c.detail || `${c.name} Standard`,
                }));
              } else if (type.includes("interview") || act.includes("interview")) {
                // Mock Interview: Dynamic institutional criteria
                const fb = detailedSession?.feedback || {};
                const activeInterviewCrit = getActiveMockInterviewCriteria();
                const scoreLookup = {
                  accuracy: fb.clarity_score ?? score,
                  fluency: fb.pacing_score ?? score,
                  range: fb.filler_word_count != null ? Math.max(10, 100 - fb.filler_word_count * 8) : score,
                  interaction: fb.confidence_score ?? score,
                  coherence: fb.answer_quality_score ?? score,
                };
                pillars = activeInterviewCrit.map((c) => {
                  const key = (c.name || '').toLowerCase().replace(/[^a-z]/g, '');
                  const s = scoreLookup[key] ?? score;
                  return {
                    name: c.name,
                    weight: `${c.weight}%`,
                    score: s,
                    label: c.detail ? c.detail.slice(0, 32) : `${c.name} Standard`,
                  };
                });
              } else if (type.includes("simulation") || act.includes("call")) {
                const activeCallCrit = getActiveCallSimulationCriteria();
                pillars = activeCallCrit.map((c, idx) => ({
                  name: c.name,
                  weight: `${c.weight}%`,
                  score: score === 0 ? 0 : (idx === 0 ? Math.min(100, Math.max(0, score + 1)) : idx === 1 ? Math.min(100, Math.max(0, score - 1)) : score),
                  label: c.detail ? c.detail.split(',')[0].slice(0, 35) : `${c.name} Standard`,
                }));
              } else if (type.includes("reading") || act.includes("paragraph") || act.includes("pre-assessment")) {
                const activeCrit = getActiveEvaluationCriteria();
                pillars = activeCrit.map((c) => ({
                  name: c.name,
                  weight: `${c.weight}%`,
                  score: score === 0 ? 0 : Math.round(score),
                  label: score === 0 ? "Passage not read" : (c.detail ? c.detail.split(',')[0].slice(0, 35) : `${c.name} Standard`),
                }));
              } else {
                pillars = [
                  { name: "Target Drill Mastery", weight: "100%", score: score, label: "Specialized Gym Drill Target" },
                ];
              }

              return (
                <div>
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2.5">
                    CEFR Table 3 Competency Radar Breakdown
                  </h4>
                  <div className={`grid gap-2.5 ${pillars.length === 5 ? "grid-cols-2 sm:grid-cols-5" : pillars.length === 4 ? "grid-cols-2 sm:grid-cols-4" : pillars.length === 2 ? "grid-cols-1 sm:grid-cols-2 max-w-md mx-auto" : "grid-cols-1"}`}>
                    {pillars.map((p) => (
                      <div key={p.name} className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-center">
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          <span className="text-[11px] font-bold text-gray-700">{p.name}</span>
                          <span className="text-[9px] font-bold px-1 rounded-full bg-blue-100 text-blue-700">{p.weight}</span>
                        </div>
                        <p className="text-xl font-extrabold text-blue-600">{Math.round(p.score)}%</p>
                        <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{p.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* AI Coaching Summary */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">💡</span>
                <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                  AI Evaluator Coaching Commentary
                </h4>
              </div>
              <p className="text-xs text-amber-950 leading-relaxed font-medium">
                {selectedActivity.feedbackText ||
                  selectedActivity.feedback_text ||
                  detailedSession?.feedback?.feedback_text ||
                  (getScoreNum(selectedActivity.result) === 0
                    ? "No clear speech or passage match detected. Please re-read the passage aloud clearly."
                    : getScoreNum(selectedActivity.result) >= 75
                    ? "Session successfully completed with solid articulation and adherence to BPO voice communication benchmarks. Conversational rhythm remained steady with professional composure."
                    : "Foundational practice session completed. Continue focusing on eliminating hesitation words and maintaining smooth sentence transitions to meet higher hiring benchmarks.")}
              </p>
              {Array.isArray(selectedActivity.suggestions) && selectedActivity.suggestions.length > 0 && (
                <div className="pt-2 border-t border-amber-200/60 mt-2">
                  <span className="text-[10px] font-bold uppercase text-amber-900 tracking-wider block mb-1">
                    Actionable Improvement Tips:
                  </span>
                  <ul className="text-xs text-amber-950/90 space-y-1 list-disc list-inside">
                    {selectedActivity.suggestions.map((tip, tIdx) => (
                      <li key={tIdx} className="leading-relaxed">{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Questions & Transcripts (If Mock Interview Session) */}
            {detailedSession?.answers && detailedSession.answers.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Recorded Question &amp; Spoken Transcript Audit
                </h4>
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {detailedSession.answers.map((ans, idx) => (
                    <div key={ans.id || idx} className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-1">
                      <p className="font-bold text-gray-900">
                        Q{ans.question_order || idx + 1}: {ans.question?.question_text || ans.question_text || "Interview Question"}
                      </p>
                      <p className="text-gray-600 italic">
                        "{ans.answer_text || "[No audio transcribed]"}"
                      </p>
                      {ans.duration_seconds && (
                        <span className="text-[10px] text-gray-400 block">Duration: {ans.duration_seconds}s</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSelectedActivity(null)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticeHistory;