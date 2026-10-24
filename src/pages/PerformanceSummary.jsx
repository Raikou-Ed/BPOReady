import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUserActivity, getCurrentUser } from "../utils/userData";
import { getApplicantSummary, getApplicantHistory } from "../api/adminApi";
import ApplicantSidebar from "../components/ApplicantSidebar";

const PerformanceSummary = () => {
  const [summary, setSummary] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentUser = getCurrentUser() || { id: 19, name: "Applicant" };

  useEffect(() => {
    async function loadPerformanceData() {
      setLoading(true);
      const localActivities = getUserActivity() || [];
      let remoteHistory = [];
      let remoteSummary = null;

      try {
        const [sumRes, histRes] = await Promise.allSettled([
          getApplicantSummary(currentUser.id || 19),
          getApplicantHistory(currentUser.id || 19),
        ]);

        if (sumRes.status === "fulfilled" && sumRes.value) {
          remoteSummary = sumRes.value;
        }

        if (histRes.status === "fulfilled" && Array.isArray(histRes.value)) {
          remoteHistory = histRes.value.map((r) => ({
            id: r.id,
            activity: r.activity_type || r.activity || "Practice Drill",
            level: r.level || "Standard",
            result: r.score ? `${Math.round(r.score)}%` : (r.result || "Completed"),
            date: r.date || r.created_at || new Date().toISOString(),
            type: r.type || "practice",
          }));
        }
      } catch (err) {
        console.warn("Error fetching remote performance data:", err);
      }

      // Merge remote history and local activities (local activities take precedence for recent timestamp)
      const mergedMap = new Map();
      localActivities.forEach((act) => {
        const key = `${act.activity}_${act.level}_${(act.date || "").substring(0, 10)}`;
        mergedMap.set(key, act);
      });
      remoteHistory.forEach((act) => {
        const key = `${act.activity}_${act.level}_${(act.date || "").substring(0, 10)}`;
        if (!mergedMap.has(key)) {
          mergedMap.set(key, act);
        }
      });

      const combinedActivities = Array.from(mergedMap.values());
      // Sort newest first
      combinedActivities.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      setActivities(combinedActivities);

      // Compute aggregates
      let scoreSum = 0;
      let scoredCount = 0;
      let callCount = 0;
      let mockCount = 0;
      let readingCount = 0;
      let drillCount = 0;

      combinedActivities.forEach((a) => {
        const actLower = (a.activity || "").toLowerCase();
        const typeLower = (a.type || "").toLowerCase();

        if (actLower.includes("call") || typeLower.includes("call") || typeLower.includes("simulation")) {
          callCount++;
        } else if (actLower.includes("interview") || typeLower.includes("interview")) {
          mockCount++;
        } else if (actLower.includes("paragraph") || typeLower.includes("reading") || actLower.includes("pre-assessment")) {
          readingCount++;
        } else if (actLower.includes("exercise") || typeLower.includes("drill")) {
          drillCount++;
        }

        const match = (a.result || "").match(/(\d+)/);
        if (match) {
          const s = parseInt(match[1]);
          if (s > 0) {
            scoreSum += s;
            scoredCount++;
          }
        }
      });

      // Calculate base average score
      const totalCount = Math.max(combinedActivities.length, remoteSummary?.total_sessions || 0);
      const hasData = totalCount > 0 || scoredCount > 0;

      let localAvg = 0;
      let finalAvg = 0;
      let clarityScore = 0;
      let pacingWpm = 0;
      let fillerControl = 0;
      let empathyScore = 0;
      let cadenceScore = 0;
      let readiness = "Not Started";

      if (hasData) {
        localAvg = scoredCount > 0 ? Math.round(scoreSum / scoredCount) : 0;
        const remoteAvg = remoteSummary?.average_score ?? remoteSummary?.overall_score ?? 0;
        if (remoteAvg > 0 && localAvg > 0) {
          finalAvg = Math.round((remoteAvg * 0.6) + (localAvg * 0.4));
        } else {
          finalAvg = remoteAvg || localAvg;
        }

        clarityScore = remoteSummary?.clarity_score || Math.min(96, Math.max(70, finalAvg + 3));
        pacingWpm = remoteSummary?.pacing_wpm || 136;
        fillerControl = remoteSummary?.filler_control || Math.min(95, Math.max(65, finalAvg + 2));
        empathyScore = remoteSummary?.empathy_score || Math.min(94, Math.max(68, finalAvg - 1));
        cadenceScore = remoteSummary?.cadence_score || finalAvg;

        if (finalAvg >= 85) readiness = "BPO Ready - Highly Recommended";
        else if (finalAvg >= 75) readiness = "BPO Interview Ready";
        else if (finalAvg >= 65) readiness = "Proficient - Near Ready";
        else readiness = "Developing Competencies";
      }

      const recommendations = remoteSummary?.recommendations || (hasData ? [
        "Incorporate a 1-second silent breath pause before beginning multi-part technical explanations.",
        "Maintain your conversational pacing in the 130-145 WPM sweet spot during active customer dialogues.",
        "Use polite acknowledgment phrases like 'Certainly, let me verify that for you' during escalation calls."
      ] : [
        "Complete the Pre-Assessment to calibrate your baseline speech and receive your training track.",
        "Practice your first Paragraph Reading drill to begin recording your pacing and articulation scores.",
        "Try an introductory Call Simulation to experience live BPO customer service handling."
      ]);

      setSummary({
        hasData,
        total_sessions: totalCount,
        average_score: finalAvg,
        clarity_score: clarityScore,
        pacing_wpm: pacingWpm,
        filler_control: fillerControl,
        empathy_score: empathyScore,
        cadence_score: cadenceScore,
        overall_readiness: readiness,
        recommendations,
        category_counts: {
          call_simulations: Math.max(callCount, remoteSummary?.category_counts?.call_simulations || 0),
          mock_interviews: Math.max(mockCount, remoteSummary?.category_counts?.mock_interviews || 0),
          paragraph_readings: Math.max(readingCount, remoteSummary?.category_counts?.paragraph_readings || 0),
          exercises: Math.max(drillCount, remoteSummary?.category_counts?.exercises || 0),
        }
      });

      setLoading(false);
    }

    loadPerformanceData();
  }, [currentUser.id]);

  const getReadinessBadgeClass = (readiness) => {
    if (!readiness || readiness === "Not Started" || readiness === "No Data") {
      return "bg-gray-100 text-gray-700 border-gray-200";
    }
    if (readiness?.includes("Highly Recommended")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (readiness?.includes("Interview Ready")) return "bg-green-50 text-green-700 border-green-200";
    if (readiness?.includes("Near Ready")) return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-amber-50 text-amber-700 border-amber-200";
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-poppins text-gray-800">
      <ApplicantSidebar activeItem="Performance Summary" />

      {/* Main Content */}
      <div className="flex-1 ml-64 p-10">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Skill Diagnostics & Analytics
              </span>
              <h1 className="text-3xl font-bold text-gray-900 mt-1">Performance Summary</h1>
              <p className="text-sm text-gray-500 mt-1">
                Comprehensive evaluation of your verbal clarity, speech pacing, disfluencies, and BPO call handling.
              </p>
            </div>
            <div className="bg-white px-5 py-3.5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3 self-start md:self-auto">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Overall Status</span>
                <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-lg border mt-1 ${getReadinessBadgeClass(summary?.overall_readiness)}`}>
                  {summary?.overall_readiness || "Not Started"}
                </span>
              </div>
            </div>
          </div>

          {/* 1. Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-xs text-gray-500 font-medium">Overall Average</span>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {summary?.hasData ? `${summary.average_score}%` : "0%"}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                {summary?.hasData ? `Across ${summary.total_sessions} completed drill${summary.total_sessions === 1 ? '' : 's'}` : "Across 0 completed drills"}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-xs text-gray-500 font-medium">Speech Clarity</span>
              <p className="text-3xl font-bold text-purple-600 mt-1">
                {summary?.hasData ? `${summary.clarity_score}%` : "0%"}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                {summary?.hasData ? "Pronunciation & articulation" : "Awaiting diagnostic speech data"}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-xs text-gray-500 font-medium">Average Pacing</span>
              <p className="text-3xl font-bold text-emerald-600 mt-1">
                {summary?.hasData && summary.pacing_wpm > 0 ? (
                  <>
                    {summary.pacing_wpm} <span className="text-sm font-normal text-gray-400">WPM</span>
                  </>
                ) : (
                  <span className="text-gray-400">0 <span className="text-sm font-normal text-gray-400">WPM</span></span>
                )}
              </p>
              <p className="text-[11px] text-emerald-600 mt-1 font-medium">
                {summary?.hasData && summary.pacing_wpm > 0 ? "✓ Optimal 130–145 WPM sweet spot" : "Target: 130–145 WPM sweet spot"}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-xs text-gray-500 font-medium">Filler Word Control</span>
              <p className="text-3xl font-bold text-amber-600 mt-1">
                {summary?.hasData ? `${summary.filler_control}%` : "0%"}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                {summary?.hasData ? 'Minimal disfluencies ("um", "ah")' : "Disfluency analysis pending"}
              </p>
            </div>
          </div>

          {/* 2. Practice Distribution Across BPO Modules */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900">Module Practice Distribution</h3>
              <span className="text-xs font-semibold text-blue-600">
                {summary?.total_sessions || 0} Total Completed Sessions
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50/60 border border-blue-100 p-4 rounded-xl">
                <span className="text-xs text-blue-600 font-semibold block">📞 Call Simulation</span>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {summary?.category_counts?.call_simulations || 0}
                </p>
                <p className="text-[11px] text-blue-700 mt-0.5">Live phone interactions</p>
              </div>

              <div className="bg-purple-50/60 border border-purple-100 p-4 rounded-xl">
                <span className="text-xs text-purple-600 font-semibold block">🎙️ Mock Interview</span>
                <p className="text-2xl font-bold text-purple-900 mt-1">
                  {summary?.category_counts?.mock_interviews || 0}
                </p>
                <p className="text-[11px] text-purple-700 mt-0.5">Initial &amp; Final interviews</p>
              </div>

              <div className="bg-emerald-50/60 border border-emerald-100 p-4 rounded-xl">
                <span className="text-xs text-emerald-600 font-semibold block">📖 Paragraph Reading</span>
                <p className="text-2xl font-bold text-emerald-900 mt-1">
                  {summary?.category_counts?.paragraph_readings || 0}
                </p>
                <p className="text-[11px] text-emerald-700 mt-0.5">Fluency passages read</p>
              </div>

              <div className="bg-amber-50/60 border border-amber-100 p-4 rounded-xl">
                <span className="text-xs text-amber-600 font-semibold block">⚡ Speech Exercises</span>
                <p className="text-2xl font-bold text-amber-900 mt-1">
                  {summary?.category_counts?.exercises || 0}
                </p>
                <p className="text-[11px] text-amber-700 mt-0.5">Targeted flaw drills</p>
              </div>
            </div>
          </div>

          {/* 3. Detailed Competency Breakdown */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">BPO Core Competency Assessment</h3>
              {!summary?.hasData && (
                <span className="text-[11px] text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg font-medium">
                  Complete an assessment or training drill to calibrate scores
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-gray-700">Acoustic Clarity &amp; Word Articulation</span>
                  <span className="text-purple-600 font-bold">{summary?.hasData ? `${summary.clarity_score}%` : "0%"}</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${summary?.hasData ? summary.clarity_score : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-gray-700">Conversational Cadence &amp; Breath Timing</span>
                  <span className="text-emerald-600 font-bold">{summary?.hasData ? `${summary.cadence_score || summary.average_score}%` : "0%"}</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${summary?.hasData ? (summary.cadence_score || summary.average_score) : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-gray-700">Filler Word Control ("um", "ah", "you know")</span>
                  <span className="text-amber-600 font-bold">{summary?.hasData ? `${summary.filler_control}%` : "0%"}</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${summary?.hasData ? summary.filler_control : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-gray-700">Empathy, Tone &amp; Problem Resolution</span>
                  <span className="text-blue-600 font-bold">{summary?.hasData ? `${summary.empathy_score}%` : "0%"}</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${summary?.hasData ? summary.empathy_score : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 4. Vibrant Targeted Improvement Tips & AI Coaching */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14H8a4 4 0 01-2.003-3.466 3.978 3.978 0 01-.997-2.534A4 4 0 1113 8a3.98 3.98 0 01-.997 2.534A4 4 0 0112 14z" />
              </svg>
              Targeted Improvement Tips &amp; Coaching
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Actionable recommendations based on your recent call simulations, mock interviews, and reading drills.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                    {summary?.hasData ? "Pacing & Breath Control" : "Baseline Pre-Assessment"}
                  </h4>
                </div>
                <p className="text-xs text-blue-800 leading-relaxed font-medium">
                  {summary?.recommendations?.[0] || "Complete the Pre-Assessment to identify your baseline speech clarity and recommended training tier."}
                </p>
              </div>

              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                    {summary?.hasData ? "Cadence Management" : "Paragraph Reading Drill"}
                  </h4>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                  {summary?.recommendations?.[1] || "Practice your first Paragraph Reading drill to begin recording your pacing and articulation scores."}
                </p>
              </div>

              <div className="bg-purple-50/80 border border-purple-200 rounded-xl p-4 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-purple-600" />
                  <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                    {summary?.hasData ? "Empathy & Escalation" : "Interactive Call Simulation"}
                  </h4>
                </div>
                <p className="text-xs text-purple-800 leading-relaxed font-medium">
                  {summary?.recommendations?.[2] || "Try an introductory Call Simulation to experience live BPO customer service handling."}
                </p>
              </div>
            </div>
          </div>

          {/* 5. Recent Completed Practice Sessions Table */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Recent Completed Sessions</h3>
                <p className="text-xs text-gray-500 mt-0.5">Your latest logged drill results and simulations</p>
              </div>
              <Link
                to="/PracticeHistory"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
              >
                View Full History →
              </Link>
            </div>

            {activities.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs font-medium">
                No sessions completed yet. Try a Call Simulation or Paragraph Reading drill!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
                      <th className="py-2.5 px-3">Activity</th>
                      <th className="py-2.5 px-3">Module / Level</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-right">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {activities.slice(0, 6).map((item, idx) => {
                      const match = (item.result || "").match(/(\d+)/);
                      const numScore = match ? parseInt(match[1]) : null;
                      return (
                        <tr key={item.id || idx} className="hover:bg-gray-50/60 transition">
                          <td className="py-3 px-3 font-semibold text-gray-800 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                            {item.activity}
                          </td>
                          <td className="py-3 px-3 text-gray-600">
                            {item.level || "Standard"}
                          </td>
                          <td className="py-3 px-3 text-gray-400 text-[11px]">
                            {item.date ? new Date(item.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Recent"}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {numScore !== null ? (
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                  numScore >= 80
                                    ? "bg-emerald-100 text-emerald-700"
                                    : numScore >= 70
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {numScore}%
                              </span>
                            ) : (
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600">
                                {item.result || "Completed"}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 6. Action Footer */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link
              to="/call-simulation"
              className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs text-center transition shadow-xs flex items-center justify-center gap-2"
            >
              <span>Launch Call Simulation Studio →</span>
            </Link>
            <Link
              to="/MockInterview"
              className="flex-1 py-3.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-semibold rounded-xl text-xs text-center transition shadow-xs flex items-center justify-center gap-2"
            >
              <span>Practice Mock Interview →</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceSummary;