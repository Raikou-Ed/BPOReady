import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUserActivity, getCurrentUser } from "../utils/userData";
import { getApplicantHistory } from "../api/adminApi";
import ApplicantSidebar from "../components/ApplicantSidebar";

const PracticeHistory = () => {
  const [activities, setActivities] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(true);

  const currentUser = getCurrentUser() || { id: 19, name: "Applicant" };

  useEffect(() => {
    async function loadHistory() {
      const local = getUserActivity();
      try {
        const remote = await getApplicantHistory(currentUser.id || 19);
        if (Array.isArray(remote) && remote.length > 0) {
          const remoteList = remote.map((r) => ({
            id: r.id,
            activity: r.activity_type || r.activity || "Practice Drill",
            level: r.level || "Standard",
            result: r.result || (r.score ? `${r.score}/100` : "Completed"),
            date: r.date || r.created_at || new Date().toISOString(),
            type: r.type || "practice"
          }));

          // Merge any local-only activities (e.g. recent pre-assessment) if not in remote
          const remoteTypes = new Set(remoteList.map(r => r.type));
          const localPreAssess = (local || []).filter(l => l.activity === 'Pre-Assessment' && !remoteTypes.has('pre_assessment'));
          const combined = [...remoteList, ...localPreAssess];
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
              <h1 className="text-2xl font-bold text-gray-900 mt-1">Practice History</h1>
              <p className="text-xs text-gray-500 mt-1">
                Full chronological record of your speech recordings, mock interviews, and communication drills.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400 font-semibold uppercase">Total Sessions</span>
              <p className="text-2xl font-bold text-blue-600">{activities.length}</p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2">
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
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
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
                  <th className="px-6 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length > 0 ? (
                  filtered.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-semibold text-gray-900 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
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
                      <td className="px-6 py-4 text-right">
                        <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full font-bold text-[10px] uppercase">
                          Completed
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                      No matching practice sessions found. Choose another filter or start a new practice drill!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeHistory;