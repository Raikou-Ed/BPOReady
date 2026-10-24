import React, { useState, useEffect } from "react";
import AdminSidebar from "../components/AdminSidebar";
import { getRegisteredUsers } from "../api/adminApi";
import { getCurrentUser } from "../utils/userData";

const defaultTrainees = [
  { id: 19, name: "Juan Santos Dela Cruz", email: "applicant@bpoready.com", role: "applicant", status: "Active", level: "Easy", score: 61 },
  { id: 20, name: "Maria Santos", email: "maria@email.com", role: "applicant", status: "Active", level: "Hard", score: 94 },
  { id: 21, name: "Claudin Reyes", email: "claudin@email.com", role: "applicant", status: "Active", level: "Easy", score: 68 },
  { id: 22, name: "Ana Lopez", email: "ana@email.com", role: "applicant", status: "Active", level: "Medium", score: 79 },
];

const MonitorUsers = () => {
  const [currentUser] = useState(() => getCurrentUser() || { role: "admin" });
  const isSuperAdmin = currentUser?.role === "super_admin";

  const [users, setUsers] = useState(defaultTrainees);
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      try {
        // Company Admins only request applicants; Super Admins request all accounts
        const requesterRole = isSuperAdmin ? "super_admin" : "admin";
        const roleScope = isSuperAdmin ? "" : "applicant";
        const data = await getRegisteredUsers("", roleScope, requesterRole);

        if (Array.isArray(data) && data.length > 0) {
          const scoped = isSuperAdmin ? data : data.filter((u) => u.role === "applicant");
          const formatted = scoped.map((u) => ({
            id: u.id,
            name: u.name || `${u.first_name || ""} ${u.last_name || ""}`.trim() || "User",
            email: u.email,
            role: u.role || "applicant",
            status: u.status || "Active",
            level: u.assigned_level || u.level || "Easy",
            score: u.diagnostic_score != null ? u.diagnostic_score : (u.score || (u.assigned_level === "hard" ? 92 : u.assigned_level === "easy" ? 61 : 82)),
          }));
          setUsers(formatted);
        }
      } catch (err) {
        console.warn("Using offline user directory:", err);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, [isSuperAdmin]);

  // Strict role-based visibility filter
  const visibleUsers = users.filter((u) => {
    // Security barrier: Company Admin can NEVER see super_admin or other company admins
    if (!isSuperAdmin && u.role !== "applicant") {
      return false;
    }

    const term = search.toLowerCase();
    const matchesSearch =
      u.name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.role?.toLowerCase().includes(term);

    if (!matchesSearch) return false;

    if (filterTab === "all") return true;

    if (isSuperAdmin) {
      // Super Admin filters by account role
      return u.role?.toLowerCase() === filterTab.toLowerCase();
    } else {
      // Company Admin filters trainees by level track
      return u.level?.toLowerCase() === filterTab.toLowerCase();
    }
  });

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
                  {isSuperAdmin ? "👑 Platform Directory • All Accounts" : "🏢 Trainee Monitoring • Applicants Only"}
                </span>
                <span className="text-xs text-gray-400">
                  {isSuperAdmin ? "Access Audit" : "Speech Coaching Records"}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">
                {isSuperAdmin ? "Registered User Accounts" : "Trainee Performance Directory"}
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                {isSuperAdmin
                  ? "Audit registered system accounts across the platform, including BPO Company Admins and Candidates."
                  : "Inspect candidate pre-assessment placement levels, speech diagnostics, and training progression."}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400 font-semibold uppercase">
                {isSuperAdmin ? "Total Accounts" : "Active Trainees"}
              </span>
              <p className="text-2xl font-bold text-blue-600">{visibleUsers.length}</p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isSuperAdmin ? "Search accounts by name, email, or role..." : "Search trainees by name or email..."}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <svg
                className="w-4 h-4 text-gray-400 absolute left-3 top-2.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-200 text-xs w-full md:w-auto">
              {isSuperAdmin ? (
                // Super Admin tabs: Role filtering
                [
                  { id: "all", label: "All Accounts" },
                  { id: "applicant", label: "Trainees" },
                  { id: "admin", label: "Company Admins" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterTab(tab.id)}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                      filterTab === tab.id
                        ? "bg-purple-600 text-white shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))
              ) : (
                // Company Admin tabs: Trainee Level Tracks
                [
                  { id: "all", label: "All Trainees" },
                  { id: "easy", label: "Easy Track" },
                  { id: "medium", label: "Medium Track" },
                  { id: "hard", label: "Hard Track" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterTab(tab.id)}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                      filterTab === tab.id
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Candidate Name</th>
                  <th className="px-6 py-3.5">Email Address</th>
                  {isSuperAdmin && <th className="px-6 py-3.5">Account Role</th>}
                  <th className="px-6 py-3.5">{isSuperAdmin ? "Role Type / Track" : "Assessed Tier"}</th>
                  <th className="px-6 py-3.5">Diagnostic Score</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleUsers.length === 0 ? (
                  <tr>
                    <td colSpan={isSuperAdmin ? 7 : 6} className="px-6 py-8 text-center text-gray-500">
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  visibleUsers.map((u) => {
                    const isCandidate = u.role === "applicant";
                    const tierBadge =
                      u.level?.toLowerCase() === "hard"
                        ? "bg-purple-100 text-purple-700"
                        : u.level?.toLowerCase() === "easy"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-blue-100 text-blue-700";

                    return (
                      <tr key={u.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-semibold text-gray-900 flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            u.role === "admin" ? "bg-indigo-100 text-indigo-700" : "bg-blue-100 text-blue-700"
                          }`}>
                            {u.name?.charAt(0) || "U"}
                          </div>
                          <span>{u.name}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{u.email}</td>

                        {isSuperAdmin && (
                          <td className="px-6 py-4">
                            <span className="capitalize px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-[10px] font-semibold border border-gray-200">
                              {u.role === "admin" ? "Company Admin" : "Candidate"}
                            </span>
                          </td>
                        )}

                        <td className="px-6 py-4">
                          {isCandidate ? (
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${tierBadge}`}>
                              {u.level || "Easy"}
                            </span>
                          ) : (
                            <span className="text-gray-400 font-medium">BPO Partner Staff</span>
                          )}
                        </td>

                        <td className="px-6 py-4 font-semibold text-gray-800">
                          {isCandidate ? (
                            <span className={u.score >= 76 ? "text-emerald-600" : "text-amber-600"}>
                              {u.score != null ? `${u.score}/100` : "Pending"}
                            </span>
                          ) : (
                            <span className="text-gray-400 font-normal">N/A</span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {u.status || "Active"}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedUser(u)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-semibold transition"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* User Details Modal */}
          {selectedUser && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                      {selectedUser.name?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">{selectedUser.name}</h3>
                      <p className="text-xs text-gray-500">{selectedUser.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-gray-400 hover:text-gray-600 font-bold text-lg"
                  >
                    ✕
                  </button>
                </div>

                {/* Score Summary */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Placement Tier</p>
                    <p className="text-base font-extrabold text-blue-600 mt-0.5 capitalize">{selectedUser.level || "Easy"}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Diagnostic Score</p>
                    <p className="text-base font-extrabold text-emerald-600 mt-0.5">{selectedUser.score || 61}%</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Target Pacing</p>
                    <p className="text-base font-extrabold text-purple-600 mt-0.5">135 WPM</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <h4 className="font-bold text-gray-800">Diagnostics &amp; Speech Summary:</h4>
                  <p className="text-gray-600 leading-relaxed bg-blue-50/50 p-3.5 rounded-xl border border-blue-100">
                    Candidate completed pre-assessment evaluation. Articulation and speech pacing are recorded. Continued practice in tiered paragraph passages is recommended to reduce hesitation and filler disfluencies.
                  </p>
                </div>

                <div className="flex justify-end pt-3 border-t border-gray-100">
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default MonitorUsers;