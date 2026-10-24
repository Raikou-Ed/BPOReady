import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUserActivity, getCurrentUser } from "../utils/userData";
import { getApplicantHistory } from "../api/adminApi";
import { getAssignedLevel, formatScore, saveAssessmentResult } from "../utils/assessmentScoring";
import { getUserPreAssessment } from "../api/preAssessmentApi";
import ApplicantSidebar from "../components/ApplicantSidebar";

const Dashboard = () => {
  const [user, setUser] = useState({ id: 19, name: "Applicant" });
  const [activities, setActivities] = useState([]);
  const [assignedLevel, setAssignedLevel] = useState(() => getAssignedLevel());

  useEffect(() => {
    const cur = getCurrentUser() || { id: 19, name: "Applicant" };
    setUser(cur);
    setAssignedLevel(getAssignedLevel());

    async function loadData() {
      const local = getUserActivity();
      try {
        const preData = await getUserPreAssessment(cur.id || 19);
        if (preData && preData.hasAssessment) {
          const placed = String(preData.placedLevel || 'easy').toLowerCase();
          const synced = {
            score: preData.score,
            placedLevel: placed,
          };
          setAssignedLevel(synced);
          saveAssessmentResult({ ...synced, isPreAssessment: true });
        } else {
          setAssignedLevel(getAssignedLevel());
        }

        const remote = await getApplicantHistory(cur.id || 19);
        if (Array.isArray(remote) && remote.length > 0) {
          // Merge remote with local activities
          setActivities(remote.map(r => ({
            id: r.id,
            activity: r.activity_type || r.activity || "Practice Session",
            level: r.level || "Standard",
            result: r.result || (r.score ? `${r.score}/100` : "Completed"),
            date: r.date || r.created_at || new Date().toISOString()
          })));
          return;
        }
      } catch (err) {
        console.warn("Using local activity cache:", err);
      }
      setActivities(local);
    }

    loadData();
  }, []);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <div className="flex min-h-screen bg-gray-50 font-poppins">
      <ApplicantSidebar activeItem="Dashboard" />

      {/* Main Content */}
      <div className="flex-1 ml-64 p-10">
        <div className="max-w-5xl mx-auto space-y-8">
          {isAdmin && (
            <div className="bg-indigo-900 text-white rounded-2xl p-4 px-6 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🛡️</span>
                <div>
                  <p className="text-xs font-bold text-indigo-200 uppercase tracking-wider">
                    Administrative Account Detected ({user.role === 'super_admin' ? 'Super Admin' : 'Company Admin'})
                  </p>
                  <p className="text-xs text-white mt-0.5">
                    You are currently previewing the Applicant Dashboard. Access content management and metrics in the Admin Console.
                  </p>
                </div>
              </div>
              <Link
                to="/AdminDashboard"
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow transition"
              >
                Go to Admin Console →
              </Link>
            </div>
          )}

          {/* Welcome Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-lg">
            <span className="text-xs uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full font-semibold">
              {assignedLevel ? `✓ Pre-Assessment Completed • Level: ${(assignedLevel.placedLevel || 'easy').toUpperCase()} (${formatScore(assignedLevel.score)}/100)` : "BPO Readiness Platform"}
            </span>
            <h1 className="text-3xl font-extrabold mt-3">
              Welcome back, {user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : (user.name || "Applicant")}!
            </h1>
            <p className="text-sm text-blue-100 mt-2 max-w-2xl leading-relaxed">
              Master the core verbal competencies required by top BPO recruiters: accent clarity, optimal conversational pacing, grammatical precision, and structured interview responses.
            </p>
            <div className="flex gap-4 mt-6">
              {assignedLevel ? (
                <Link
                  to={`/${(user.assigned_level || assignedLevel.placedLevel || 'easy').toLowerCase()}-level-paragraph-reading`}
                  className="px-5 py-2.5 bg-white text-blue-700 font-bold text-xs rounded-xl shadow hover:bg-blue-50 transition"
                >
                  Continue {(user.assigned_level || assignedLevel.placedLevel || 'Assigned').toUpperCase()} Reading Practice →
                </Link>
              ) : (
                <Link
                  to="/PreAssessment"
                  className="px-5 py-2.5 bg-white text-blue-700 font-bold text-xs rounded-xl shadow hover:bg-blue-50 transition"
                >
                  Start Pre-Assessment →
                </Link>
              )}
              <Link
                to="/call-simulation"
                className="px-5 py-2.5 bg-blue-500/50 hover:bg-blue-500/70 border border-white/30 text-white font-bold text-xs rounded-xl transition"
              >
                Launch Call Simulator
              </Link>
            </div>
          </div>

          {/* Quick Access Modules */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Training Modules</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Pre-Assessment Card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-base mb-3">
                    01
                  </div>
                  <h3 className="font-bold text-sm text-gray-900 mb-1">Pre-Assessment</h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-4">
                    Initial speech evaluation to categorize your baseline proficiency into Easy, Medium, or Hard tiers.
                  </p>
                </div>
                {assignedLevel ? (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg capitalize">
                      ✓ Completed ({assignedLevel.placedLevel})
                    </span>
                    <Link
                      to="/PreAssessment"
                      className="text-xs font-bold text-blue-600 hover:text-blue-700"
                    >
                      View Placement →
                    </Link>
                  </div>
                ) : (
                  <Link
                    to="/PreAssessment"
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    Take Assessment →
                  </Link>
                )}
              </div>

              {/* Mock Interview Card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-base mb-3">
                    02
                  </div>
                  <h3 className="font-bold text-sm text-gray-900 mb-1">Mock Interview</h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-4">
                    Initial HR screening and situational Final Interview simulations with AI feedback.
                  </p>
                </div>
                <Link
                  to="/MockInterview"
                  className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                >
                  Enter Interview Hub →
                </Link>
              </div>

              {/* Call Simulation Card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-base mb-3">
                    03
                  </div>
                  <h3 className="font-bold text-sm text-gray-900 mb-1">Call Simulator</h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-4">
                    Dynamic speech-to-speech customer phone calls with live audio playback and QA scorecards.
                  </p>
                </div>
                <Link
                  to="/call-simulation"
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  Start Call Studio →
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Activity & Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Activity Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900">Recent Activity</h3>
                <Link to="/PracticeHistory" className="text-xs font-semibold text-blue-600 hover:underline">
                  View All
                </Link>
              </div>
              {activities.length > 0 ? (
                <div className="space-y-3">
                  {activities.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="text-xs font-semibold text-gray-800">{item.activity}</p>
                        <p className="text-[11px] text-gray-400 capitalize">{item.level || "Standard"}</p>
                      </div>
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                        {item.result}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 text-xs">
                  No practice records logged yet. Start by taking your pre-assessment!
                </div>
              )}
            </div>

            {/* Performance Snapshot Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">Performance Snapshot</h3>
                <p className="text-xs text-gray-500 mb-4">
                  {activities.length
                    ? `You have completed ${activities.length} practice session(s). Keep exercising daily to build confidence!`
                    : "Complete a mock interview or reading passage to generate your performance diagnostics."}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 p-3 rounded-xl text-center">
                    <p className="text-[10px] uppercase font-bold text-blue-600">Total Drills</p>
                    <p className="text-2xl font-extrabold text-blue-800 mt-1">{activities.length}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-xl text-center">
                    <p className="text-[10px] uppercase font-bold text-green-600">Evaluation Engine</p>
                    <p className="text-xs font-bold text-green-800 mt-2">Speech AI Active</p>
                  </div>
                </div>
              </div>

              <Link
                to="/PerformanceSummary"
                className="mt-6 w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs rounded-xl text-center transition"
              >
                View Detailed Performance Summary →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;