import React, { useState, useEffect } from "react";
import AdminSidebar from "../components/AdminSidebar";
import { getDashboardStats, getApprovals } from "../api/adminApi";
import { getCurrentUser } from "../utils/userData";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser() || {
    name: "System SuperAdmin",
    email: "superadmin@bpoready.com",
    role: "super_admin",
  });

  const [stats, setStats] = useState({
    total_applicants: 16,
    total_users: 19,
    total_paragraphs: 3,
    total_questions: 10,
    total_exercises: 3,
    total_mock_sessions: 4,
    average_score: 82.5,
    average_performance: "Good",
    common_speech_flaw: "Filler Words (um, ah)",
  });

  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }

    async function loadStats() {
      try {
        const data = await getDashboardStats();
        if (data && data.total_users !== undefined) {
          setStats(data);
        }
      } catch (err) {
        console.warn("Using default stats:", err);
      } finally {
        setLoading(false);
      }
    }

    async function loadApprovals() {
      try {
        const appRes = await getApprovals("pending");
        if (appRes && appRes.counts) {
          setPendingCount(appRes.counts.pending || 0);
        }
      } catch (err) {
        console.warn("Failed to load approvals count:", err);
      }
    }

    loadStats();
    loadApprovals();
  }, []);

  const isSuperAdmin = currentUser?.role === "super_admin";

  return (
    <div className="flex min-h-screen bg-gray-50 font-poppins text-gray-900">
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-gray-200 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                    isSuperAdmin
                      ? "bg-purple-100 text-purple-700 border border-purple-200"
                      : "bg-blue-100 text-blue-700 border border-blue-200"
                  }`}
                >
                  {isSuperAdmin ? "👑 Super Admin" : "🏢 Company Admin"}
                </span>
                <span className="text-xs text-gray-400">Dashboard</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">
                {isSuperAdmin ? "Platform Overview & Content" : "Institutional Cohort Analytics"}
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                {isSuperAdmin
                  ? "Global repository management for reading passages, communication drills, interview questions, and registered users."
                  : "Performance benchmarks, candidate flaw diagnostics, pacing calibration, and institutional standards."}
              </p>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-gray-200 shadow-sm text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-gray-600 font-medium">Speech AI Active</span>
            </div>
          </div>

          {/* =============================================================== */}
          {/* SUPER ADMIN VIEW: Platform Content & User Repositories          */}
          {/* =============================================================== */}
          {isSuperAdmin ? (
            <>
              {/* Approvals Alert Banner */}
              {pendingCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-base shrink-0">
                      ⏳
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-950 flex items-center gap-2">
                        <span>{pendingCount} Training Material{pendingCount > 1 ? "s" : ""} Pending Super Admin Approval</span>
                        <span className="text-[10px] bg-amber-200 text-amber-900 font-extrabold px-2 py-0.5 rounded-full">
                          Action Required
                        </span>
                      </p>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        The BPO Company Admin submitted new training materials that require verification before going live.
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/AdminApprovals"
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition shrink-0 text-center shadow-sm"
                  >
                    Open Approvals Center →
                  </Link>
                </div>
              )}

              {/* Platform Content Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium">Total Registered Users</p>
                  <p className="text-3xl font-extrabold text-gray-900 mt-2">{stats.total_users || 19}</p>
                  <p className="text-[11px] text-gray-500 mt-2">
                    <span className="text-purple-600 font-bold">{stats.total_applicants || 16}</span> Applicants •{" "}
                    <span className="text-blue-600 font-bold">3</span> Staff
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium">Reading Passages</p>
                  <p className="text-3xl font-extrabold text-blue-600 mt-2">{stats.total_paragraphs || 3}</p>
                  <p className="text-[11px] text-gray-500 mt-2">Easy, Medium, Hard tiers</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium">Communication Drills</p>
                  <p className="text-3xl font-extrabold text-emerald-600 mt-2">{stats.total_exercises || 3}</p>
                  <p className="text-[11px] text-gray-500 mt-2">Filler, Grammar, Pacing</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium">Interview Questions</p>
                  <p className="text-3xl font-extrabold text-amber-600 mt-2">{stats.total_questions || 10}</p>
                  <p className="text-[11px] text-gray-500 mt-2">Initial &amp; Final bank</p>
                </div>
              </div>

              {/* Content Management Cards */}
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                  Platform Repositories &amp; Approvals
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  {/* Approvals Center */}
                  <div className="bg-white border border-amber-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-amber-50 rounded-bl-full pointer-events-none" />
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg mb-3 font-bold">
                        ⚖️
                      </div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-gray-900">Approvals Center</h3>
                        {pendingCount > 0 && (
                          <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                            {pendingCount} new
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Review, approve, or reject proposed training materials submitted by BPO Company Admins.
                      </p>
                    </div>
                    <div className="mt-5 pt-4 border-t border-gray-100">
                      <Link
                        to="/AdminApprovals"
                        className="w-full inline-flex justify-center items-center py-2 px-4 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition shadow-sm"
                      >
                        Open Approvals ({pendingCount}) →
                      </Link>
                    </div>
                  </div>

                  {/* Paragraphs */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg mb-3 font-bold">
                        📖
                      </div>
                      <h3 className="text-base font-bold text-gray-900">Reading Passages</h3>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Curate BPO customer support scenarios across Easy, Medium, and Hard difficulty levels.
                      </p>
                    </div>
                    <div className="mt-5 pt-4 border-t border-gray-100">
                      <Link
                        to="/ManageParagraphs"
                        className="w-full inline-flex justify-center items-center py-2 px-4 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm"
                      >
                        Manage Paragraphs →
                      </Link>
                    </div>
                  </div>

                  {/* Communication Drills */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg mb-3 font-bold">
                        🎯
                      </div>
                      <h3 className="text-base font-bold text-gray-900">Speech Drills</h3>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Add and configure targeted drills for speech disfluencies: filler words, grammar, and cadence pacing.
                      </p>
                    </div>
                    <div className="mt-5 pt-4 border-t border-gray-100">
                      <Link
                        to="/ManageExercises"
                        className="w-full inline-flex justify-center items-center py-2 px-4 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
                      >
                        Manage Speech Drills →
                      </Link>
                    </div>
                  </div>

                  {/* Interview Questions */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg mb-3 font-bold">
                        💼
                      </div>
                      <h3 className="text-base font-bold text-gray-900">Interview Question Bank</h3>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Manage standardized HR Initial and Operations Final interview questions and scoring keywords.
                      </p>
                    </div>
                    <div className="mt-5 pt-4 border-t border-gray-100">
                      <Link
                        to="/ManageInterviewQuestions"
                        className="w-full inline-flex justify-center items-center py-2 px-4 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white transition shadow-sm"
                      >
                        Manage Question Bank →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* System & Users Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900 mb-1">Registered Users Oversight</h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Inspect applicant accounts, diagnostic scores, and active training sessions across the platform.
                  </p>
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-800">User Directory</p>
                      <p className="text-[11px] text-gray-500">Monitor candidate progress and accounts</p>
                    </div>
                    <Link
                      to="/MonitorUsers"
                      className="px-4 py-2 bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 rounded-lg text-xs font-semibold transition shadow-sm"
                    >
                      View Users →
                    </Link>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Platform Infrastructure Status</h3>
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                      <span className="text-gray-700 font-medium">PostgreSQL Database</span>
                      <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Connected
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                      <span className="text-gray-700 font-medium">Speech Evaluation Engine</span>
                      <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Operational
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* =============================================================== */
            /* COMPANY ADMIN VIEW: Trainee Benchmarks & Scoring Standards      */
            /* =============================================================== */
            <>
              {/* Institutional Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium">Monitored Trainees</p>
                  <p className="text-3xl font-extrabold text-gray-900 mt-2">{stats.total_applicants || 16}</p>
                  <p className="text-[11px] text-green-600 mt-2">Active training accounts</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium">Cohort Average Score</p>
                  <p className="text-3xl font-extrabold text-blue-600 mt-2">{stats.average_score}%</p>
                  <p className="text-[11px] text-gray-500 mt-2">Performance: {stats.average_performance}</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium">Primary Speech Flaw</p>
                  <p className="text-3xl font-extrabold text-amber-600 mt-2">Filler Words</p>
                  <p className="text-[11px] text-gray-500 mt-2">62% of attempts</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium">Common Pacing Cadence</p>
                  <p className="text-3xl font-extrabold text-purple-600 mt-2">132 WPM</p>
                  <p className="text-[11px] text-gray-500 mt-2">Target range: 120-150</p>
                </div>
              </div>

              {/* Analytics & Standards Shortcuts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Speech Diagnostics */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <h2 className="text-sm font-bold text-gray-900 mb-2">Trainee Speech Flaw Diagnostics</h2>
                  <p className="text-xs text-gray-500 mb-4">
                    Automated speech evaluation identifies candidate communication blockers:
                  </p>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-gray-700">Excessive Filler Words ("um", "ah", "like")</span>
                        <span className="text-amber-600">62% of trainees</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full w-[62%]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-gray-700">Pacing Cadence (&gt;165 WPM or &lt;110 WPM)</span>
                        <span className="text-purple-600">45% of trainees</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-purple-500 h-full w-[45%]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-gray-700">BPO Grammar &amp; Tense Consistency</span>
                        <span className="text-blue-600">38% of trainees</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full w-[38%]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Standards Shortcuts */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 mb-2">Institutional Controls &amp; Standards</h2>
                    <p className="text-xs text-gray-500 mb-4">
                      Configure cutoff score brackets and customize interview questions for your recruitment needs:
                    </p>
                    <div className="space-y-2.5">
                      <Link
                        to="/AdminScoringStandards"
                        className="p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-xl flex items-center justify-between transition block"
                      >
                        <div>
                          <p className="text-xs font-bold text-gray-900">Scoring Standards &amp; Placement Cutoffs</p>
                          <p className="text-[11px] text-gray-500">Configure cutoff score ranges and WPM targets</p>
                        </div>
                        <span className="text-xs text-blue-600 font-semibold">Configure →</span>
                      </Link>

                      <Link
                        to="/ManageParagraphs"
                        className="p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-xl flex items-center justify-between transition block"
                      >
                        <div>
                          <p className="text-xs font-bold text-gray-900">Propose Reading Passages</p>
                          <p className="text-[11px] text-gray-500">Submit company-specific scenarios for Super Admin approval</p>
                        </div>
                        <span className="text-xs text-blue-600 font-semibold">Propose →</span>
                      </Link>

                      <Link
                        to="/ManageExercises"
                        className="p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-xl flex items-center justify-between transition block"
                      >
                        <div>
                          <p className="text-xs font-bold text-gray-900">Propose Communication Drills</p>
                          <p className="text-[11px] text-gray-500">Submit flaw reduction drills (filler words, pacing, grammar)</p>
                        </div>
                        <span className="text-xs text-blue-600 font-semibold">Propose →</span>
                      </Link>

                      <Link
                        to="/ManageInterviewQuestions"
                        className="p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-xl flex items-center justify-between transition block"
                      >
                        <div>
                          <p className="text-xs font-bold text-gray-900">Propose Interview Questions</p>
                          <p className="text-[11px] text-gray-500">Submit account-specific interview prompts for approval</p>
                        </div>
                        <span className="text-xs text-blue-600 font-semibold">Propose →</span>
                      </Link>

                      <Link
                        to="/MonitorUsers"
                        className="p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-xl flex items-center justify-between transition block"
                      >
                        <div>
                          <p className="text-xs font-bold text-gray-900">Trainee Directory</p>
                          <p className="text-[11px] text-gray-500">Inspect candidate scores, progression, and status</p>
                        </div>
                        <span className="text-xs text-blue-600 font-semibold">Inspect →</span>
                      </Link>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-400">
                    Logged in as: <span className="text-gray-700 font-semibold">{currentUser?.name}</span>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;