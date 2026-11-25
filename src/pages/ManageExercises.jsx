import React, { useState, useEffect } from "react";
import AdminSidebar from "../components/AdminSidebar";
import { getCurrentUser } from "../utils/userData";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const defaultExercises = [
  // --- Speech Pacing Drills (Exact passages from Candidate Speech Pacing Trainer) ---
  {
    id: "pacing-1",
    title: "Passage 1: Customer Empathy & Billing Assurance",
    target_flaw: "speech_pacing",
    difficulty: "easy",
    approval_status: "approved",
    prompt_text: "Thank you for bringing this billing discrepancy to our attention. I completely understand how frustrating unexpected charges can be. I have already initiated a reversal for the twenty-five dollar maintenance fee, and you will see the credit reflected on your next billing statement. Is there anything else about your monthly charges I can clarify for you today?",
  },
  {
    id: "pacing-2",
    title: "Passage 2: Technical Troubleshooting & Router Reset",
    target_flaw: "speech_pacing",
    difficulty: "medium",
    approval_status: "approved",
    prompt_text: "To resolve your intermittent connectivity issue, let's perform a power cycle on your gateway. First, please locate the power cable on the back panel of your router and gently disconnect it. We will keep it unplugged for roughly thirty seconds to allow the internal capacitors to discharge completely. Once reconnected, please watch the broadband indicator light until it turns solid green.",
  },
  {
    id: "pacing-3",
    title: "Passage 3: Call Closing & Quality Survey Invitation",
    target_flaw: "speech_pacing",
    difficulty: "hard",
    approval_status: "approved",
    prompt_text: "It has been my pleasure assisting you today with your order status. For your records, your reference confirmation code is Alpha Bravo Niner Zero. If you have two minutes, please stay on the line for a brief one-question satisfaction survey. Have a wonderful rest of your day!",
  },

  // --- Filler Word Elimination Drills (Exact prompts from Candidate Filler Words Drill) ---
  {
    id: "filler-1",
    title: "Billing Dispute: Unexpected Late Fee",
    target_flaw: "filler_words",
    difficulty: "easy",
    approval_status: "approved",
    prompt_text: "A customer calls furiously demanding to know why their monthly internet invoice has an unexpected $25 fee when they always pay on time. Explain calmly that you verified their records, confirm their on-time payment, waive the fee immediately, and reassure them with smooth delivery without saying 'um' or 'ah'.",
  },
  {
    id: "filler-2",
    title: "Service Outage: Urgent Remote Work",
    target_flaw: "filler_words",
    difficulty: "medium",
    approval_status: "approved",
    prompt_text: "A customer calls in a panic because their home fiber internet suddenly disconnected 15 minutes before an executive video presentation. Validate their urgency, explain that neighborhood cable repairs are underway with a 2-hour ETA, and offer emergency mobile hotspot data without crutch words like 'actually' or 'basically'.",
  },
  {
    id: "filler-3",
    title: "Travel Disruption: Flight Delay & Meal Voucher",
    target_flaw: "filler_words",
    difficulty: "hard",
    approval_status: "approved",
    prompt_text: "A passenger is anxious because their connecting flight was delayed 3 hours due to severe thunderstorms along the flight path. Apologize warmly, explain flight corridor safety, provide their updated departure gate and boarding time, and issue a complimentary $25 meal voucher with steady composure.",
  },

  // --- Grammar & Phrasing Drills (Exact scenarios from Candidate Grammar & Phrasing) ---
  {
    id: "grammar-1",
    title: "Subject-Verb Agreement in Order Status",
    target_flaw: "grammar",
    difficulty: "easy",
    approval_status: "approved",
    prompt_text: "Practice correct subject-verb agreement when updating a customer on multiple orders: 'Each of your two packages is scheduled to arrive tomorrow morning.' (Ensuring singular verb 'is' with indefinite pronoun 'Each').",
  },
  {
    id: "grammar-2",
    title: "Professional Hold Etiquette & Prepositions",
    target_flaw: "grammar",
    difficulty: "medium",
    approval_status: "approved",
    prompt_text: "Practice courteous BPO hold procedure: 'May I place you on a brief hold for one to two minutes while I review your billing statement?' (Polite permission request with specific time frame).",
  },
  {
    id: "grammar-3",
    title: "Tense Consistency in Refund Confirmation",
    target_flaw: "grammar",
    difficulty: "hard",
    approval_status: "approved",
    prompt_text: "Practice past tense accuracy with specific time markers: 'Our accounting team processed your refund two hours ago.' (Using simple past rather than present perfect when past time is specified).",
  }
];

const syncPacingStorage = (list) => {
  try {
    let deletedIds = [];
    try {
      deletedIds = JSON.parse(localStorage.getItem("bpo_deleted_exercise_ids") || "[]");
    } catch {}

    const pacing = list
      .filter(
        (e) =>
          e.target_flaw === "speech_pacing" &&
          e.is_active !== false &&
          !deletedIds.includes(e.id) &&
          !deletedIds.includes(String(e.id)) &&
          !deletedIds.includes(Number(e.id)) &&
          !e.title?.toLowerCase().includes("optimal speech pacing practice")
      )
      .map((p, idx) => {
        const words = p.prompt_text ? p.prompt_text.trim().split(/\s+/).length : 60;
        return {
          id: p.id,
          title: p.title?.replace(/^Passage\s*\d+:\s*/i, "") || `Passage ${idx + 1}`,
          targetWords: words,
          estimatedSeconds: Math.round((words / 135) * 60) || 25,
          text: p.prompt_text,
        };
      });
    localStorage.setItem("bpo_pacing_scripts_custom", JSON.stringify(pacing));
  } catch {}
};

const ManageExercises = () => {
  const [currentUser] = useState(() => getCurrentUser() || { role: "super_admin", name: "Admin" });
  const [exercises, setExercises] = useState(() => {
    let deletedIds = [];
    try {
      deletedIds = JSON.parse(localStorage.getItem("bpo_deleted_exercise_ids") || "[]");
    } catch {}

    try {
      const cached = localStorage.getItem("bpo_custom_exercises");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter(
            (e) =>
              e.is_active !== false &&
              e.is_active !== 0 &&
              e.is_active !== "0" &&
              !deletedIds.includes(e.id) &&
              !deletedIds.includes(String(e.id)) &&
              !deletedIds.includes(Number(e.id))
          );
          if (valid.length > 0) return valid;
        }
      }
    } catch {}

    return defaultExercises;
  });

  const [loading, setLoading] = useState(true);
  const [filterFlaw, setFilterFlaw] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    target_flaw: "speech_pacing",
    difficulty: "easy",
    prompt_text: "",
  });
  const [message, setMessage] = useState("");

  const isSuperAdmin = currentUser?.role === "super_admin";

  const fetchExercises = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/exercises?admin=1`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          let deletedIds = [];
          try {
            deletedIds = JSON.parse(localStorage.getItem("bpo_deleted_exercise_ids") || "[]");
          } catch {}

          const normalized = data
            .filter(
              (d) =>
                d.is_active !== false &&
                d.is_active !== 0 &&
                d.is_active !== "0" &&
                !deletedIds.includes(d.id) &&
                !deletedIds.includes(String(d.id)) &&
                !deletedIds.includes(Number(d.id))
            )
            .map((d) => ({
              ...d,
              prompt_text: d.prompt_text || d.exercise_content || "",
            }));

          // Merge with default exercises to ensure all categories have full active UI drills
          let merged = [...normalized];
          defaultExercises.forEach((def) => {
            if (
              !deletedIds.includes(def.id) &&
              !merged.some((m) => m.title === def.title || m.id === def.id)
            ) {
              merged.push(def);
            }
          });

          setExercises(merged);
          localStorage.setItem("bpo_custom_exercises", JSON.stringify(merged));
          syncPacingStorage(merged);
        }
      }
    } catch (err) {
      console.warn("Using offline exercises:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      title: "",
      target_flaw: filterFlaw !== "all" ? filterFlaw : "speech_pacing",
      difficulty: "easy",
      prompt_text: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ex) => {
    setEditingId(ex.id);
    setFormData({
      title: ex.title,
      target_flaw: ex.target_flaw,
      difficulty: ex.difficulty,
      prompt_text: ex.prompt_text,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this exercise drill?")) return;
    const remaining = exercises.filter((e) => e.id !== id);
    setExercises(remaining);
    localStorage.setItem("bpo_custom_exercises", JSON.stringify(remaining));
    syncPacingStorage(remaining);

    // Track locally deleted ID so it stays deleted on refresh
    try {
      const deletedIds = JSON.parse(localStorage.getItem("bpo_deleted_exercise_ids") || "[]");
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        localStorage.setItem("bpo_deleted_exercise_ids", JSON.stringify(deletedIds));
      }
    } catch {}

    try {
      const res = await fetch(`${API_BASE}/api/exercises/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMessage("Exercise drill deleted successfully.");
      } else {
        setMessage("Exercise removed from view.");
      }
    } catch {
      setMessage("Exercise removed locally.");
    }
    setTimeout(() => setMessage(""), 3500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const approval_status = "approved"; // Published live immediately per adviser directive
    const payload = {
      ...formData,
      approval_status,
      created_by_user_id: currentUser?.id,
    };

    let updatedList = exercises;

    try {
      if (editingId) {
        updatedList = exercises.map((ex) => (ex.id === editingId ? { ...ex, ...payload } : ex));
        setExercises(updatedList);
        localStorage.setItem("bpo_custom_exercises", JSON.stringify(updatedList));
        syncPacingStorage(updatedList);

        const res = await fetch(`${API_BASE}/api/exercises/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setMessage("Exercise drill updated and published live! Synced with candidate practice interface.");
        } else {
          setMessage("Exercise drill updated locally.");
        }
      } else {
        const newEx = { id: `drill-${Date.now()}`, ...payload };
        updatedList = [...exercises, newEx];
        setExercises(updatedList);
        localStorage.setItem("bpo_custom_exercises", JSON.stringify(updatedList));
        syncPacingStorage(updatedList);

        const res = await fetch(`${API_BASE}/api/exercises`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setMessage("New exercise drill created and published live! Synced with candidate practice interface.");
        } else {
          setMessage("New drill saved locally.");
        }
      }
    } catch {
      setMessage("Saved locally.");
    }

    setIsModalOpen(false);
    setTimeout(() => setMessage(""), 3500);
  };

  const filtered = exercises.filter((e) => {
    if (filterFlaw === "all") return true;
    return e.target_flaw?.toLowerCase() === filterFlaw;
  });

  return (
    <div className="flex min-h-screen bg-gray-50 font-poppins text-gray-900">
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-gray-200 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${isSuperAdmin
                    ? "bg-purple-100 text-purple-700 border border-purple-200"
                    : "bg-blue-100 text-blue-700 border border-blue-200"
                    }`}
                >
                  {isSuperAdmin ? "👑 Super Admin" : "🏢 Company Admin"}
                </span>
                <span className="text-xs text-gray-400">Speech Drills</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">
                {isSuperAdmin ? "Speech Drills Repository" : "Manage Speech Drills"}
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                {isSuperAdmin
                  ? "View-only audit of all speech and communication flaw drills. Authored and managed directly by BPO Company Admins."
                  : "Create and update speech drills to help candidates minimize filler words, improve pacing, and master grammar. Changes are published immediately."}
              </p>
            </div>

            {/* Actions: View Only for Super Admin, Add for Company Admin */}
            <div className="flex items-center gap-2.5 shrink-0">
              {isSuperAdmin ? (
                <>
                  <span className="px-3 py-2 bg-purple-50 border border-purple-200 text-purple-700 font-semibold rounded-xl text-xs flex items-center gap-1.5">
                    👁️ View Only Mode
                  </span>
                  <a
                    href="/AdminApprovals"
                    className="px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 font-semibold rounded-xl text-xs transition flex items-center gap-1.5 shrink-0"
                  >
                    <span>📋 Content Updates &amp; Audit</span>
                  </a>
                </>
              ) : (
                <button
                  onClick={handleOpenAdd}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-sm transition flex items-center gap-2 shrink-0"
                >
                  + Add Speech Drill
                </button>
              )}
            </div>
          </div>

          {/* Super Admin View-Only Notice Banner */}
          {isSuperAdmin && (
            <div className="p-3.5 bg-purple-50 border border-purple-200 text-purple-900 rounded-xl text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-purple-700 text-sm">👁️</span>
                <span>
                  <strong>View-Only Oversight:</strong> Super Admins can monitor and view all speech flaw drills. Drill authoring, editing, and deleting are reserved for BPO Company Admins.
                </span>
              </div>
              <a
                href="/AdminApprovals"
                className="text-xs font-bold text-purple-700 underline shrink-0 hover:text-purple-900"
              >
                View Updates &amp; Audit Center →
              </a>
            </div>
          )}

          {message && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>{message}</span>
            </div>
          )}

          {/* Filter Bar */}
          <div className="flex gap-2">
            {[
              { key: "all", label: "All Drills" },
              { key: "filler_words", label: "Filler Words" },
              { key: "grammar", label: "Grammar & Phrasing" },
              { key: "speech_pacing", label: "Speech Pacing" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilterFlaw(f.key)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${filterFlaw === f.key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }`}
              >
                {f.label} ({f.key === "all" ? exercises.length : exercises.filter((e) => e.target_flaw?.toLowerCase() === f.key).length})
              </button>
            ))}
          </div>

          {/* Exercises List */}
          <div className="space-y-4">
            {filtered.map((ex) => {
              const flawBadge =
                ex.target_flaw === "filler_words"
                  ? "bg-amber-100 text-amber-800"
                  : ex.target_flaw === "grammar"
                    ? "bg-indigo-100 text-indigo-800"
                    : "bg-emerald-100 text-emerald-800";

              const status = ex.approval_status || "approved";

              return (
                <div
                  key={ex.id}
                  className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${flawBadge}`}>
                        {ex.target_flaw?.replace("_", " ")}
                      </span>

                      {/* Status & Change Badges */}
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live / Active
                      </span>
                      {ex.is_updated && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> ⚡ Recently Updated
                        </span>
                      )}

                      <h3 className="text-sm font-bold text-gray-900">{ex.title}</h3>
                      <span className="text-xs text-gray-400 capitalize">
                        ({ex.difficulty} tier • ~{ex.prompt_text ? ex.prompt_text.trim().split(/\s+/).length : 0} words)
                      </span>
                    </div>
                    {!isSuperAdmin && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(ex)}
                          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(ex.id)}
                          className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {ex.reviewer_notes && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                      <span className="font-bold text-amber-600 mt-0.5">ℹ️</span>
                      <div>
                        <span className="font-semibold">Reviewer Feedback:</span> {ex.reviewer_notes}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100 italic">
                    "{ex.prompt_text}"
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-900">
                {editingId ? "Edit Speech Drill" : "Create New Speech Drill"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Drill Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Passage 1: Customer Empathy & Billing Assurance"
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Target Speech Flaw
                  </label>
                  <select
                    value={formData.target_flaw}
                    onChange={(e) => setFormData({ ...formData, target_flaw: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
                  >
                    <option value="speech_pacing">Speech Pacing</option>
                    <option value="filler_words">Filler Words</option>
                    <option value="grammar">Grammar & Phrasing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
                  >
                    <option value="easy">Easy Level</option>
                    <option value="medium">Medium Level</option>
                    <option value="hard">Hard Level</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Drill Prompt Script / Passage Content
                </label>
                <textarea
                  rows="5"
                  required
                  value={formData.prompt_text}
                  onChange={(e) => setFormData({ ...formData, prompt_text: e.target.value })}
                  placeholder="Enter the targeted practice prompt or passage candidates will speak..."
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Estimated Words: {formData.prompt_text.trim() ? formData.prompt_text.trim().split(/\s+/).length : 0}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-sm cursor-pointer"
                >
                  {editingId ? "Update Drill" : "Save Drill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageExercises;
