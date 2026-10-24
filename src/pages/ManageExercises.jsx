import React, { useState, useEffect } from "react";
import AdminSidebar from "../components/AdminSidebar";
import { getCurrentUser } from "../utils/userData";

const API_BASE = "http://localhost:8000";

const defaultExercises = [
  {
    id: 1,
    title: "Billing Adjustment Clarity",
    target_flaw: "filler_words",
    difficulty: "easy",
    approval_status: "approved",
    prompt_text: "Good day! I have thoroughly reviewed your account records. The promotional discount of twenty dollars has now been applied to your monthly invoice, and your updated balance will be visible on your portal within the hour.",
  },
  {
    id: 2,
    title: "Customer Escalation & Empathy Response",
    target_flaw: "grammar",
    difficulty: "medium",
    approval_status: "approved",
    prompt_text: "I completely understand how critical your internet connectivity is for your daily remote work. Please rest assured that our technical support team is already working to restore the neighborhood node as quickly as possible.",
  },
  {
    id: 3,
    title: "Flight Itinerary Reassurance",
    target_flaw: "speech_pacing",
    difficulty: "hard",
    approval_status: "approved",
    prompt_text: "Thank you for your patience while I was confirming your flight itinerary with our partner airlines. Your seat reservation and meal preference have been successfully locked in for tomorrow morning's flight.",
  }
];

const ManageExercises = () => {
  const [currentUser] = useState(() => getCurrentUser() || { role: "super_admin", name: "Admin" });
  const [exercises, setExercises] = useState(defaultExercises);
  const [loading, setLoading] = useState(true);
  const [filterFlaw, setFilterFlaw] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    target_flaw: "filler_words",
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
          // Normalize exercise_content to prompt_text if needed
          const normalized = data.map((d) => ({
            ...d,
            prompt_text: d.prompt_text || d.exercise_content || "",
          }));
          setExercises(normalized);
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
      target_flaw: "filler_words",
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
    try {
      const res = await fetch(`${API_BASE}/api/exercises/${id}`, { method: "DELETE" });
      if (res.ok) {
        setExercises(exercises.filter((e) => e.id !== id));
        setMessage("Exercise drill deleted successfully.");
      } else {
        setExercises(exercises.filter((e) => e.id !== id));
        setMessage("Exercise removed from view.");
      }
    } catch {
      setExercises(exercises.filter((e) => e.id !== id));
      setMessage("Exercise removed locally.");
    }
    setTimeout(() => setMessage(""), 3500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const approval_status = isSuperAdmin ? "approved" : "pending";
    const payload = {
      ...formData,
      approval_status,
      created_by_user_id: currentUser?.id,
    };

    try {
      if (editingId) {
        const res = await fetch(`${API_BASE}/api/exercises/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          setExercises(exercises.map((ex) => (ex.id === editingId ? { ...(updated.exercise || updated), prompt_text: formData.prompt_text, approval_status: ex.approval_status } : ex)));
          setMessage("Exercise drill updated successfully.");
        } else {
          setExercises(exercises.map((ex) => (ex.id === editingId ? { ...ex, ...payload } : ex)));
          setMessage("Exercise drill updated locally.");
        }
      } else {
        const res = await fetch(`${API_BASE}/api/exercises`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          const newObj = {
            ...(created.exercise || created),
            prompt_text: formData.prompt_text,
            approval_status,
          };
          setExercises([...exercises, newObj]);
          setMessage(
            isSuperAdmin
              ? "New exercise drill created and published."
              : "New drill submitted! Pending Super Admin review before going live."
          );
        } else {
          const newEx = { id: Date.now(), ...payload };
          setExercises([...exercises, newEx]);
          setMessage("New drill saved locally.");
        }
      }
    } catch {
      if (editingId) {
        setExercises(exercises.map((ex) => (ex.id === editingId ? { ...ex, ...payload } : ex)));
      } else {
        setExercises([...exercises, { id: Date.now(), ...payload }]);
      }
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
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                    isSuperAdmin
                      ? "bg-purple-100 text-purple-700 border border-purple-200"
                      : "bg-blue-100 text-blue-700 border border-blue-200"
                  }`}
                >
                  {isSuperAdmin ? "👑 Super Admin" : "🏢 Company Admin"}
                </span>
                <span className="text-xs text-gray-400">Speech Drills</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">
                {isSuperAdmin ? "Communication Exercises Repository" : "Propose Communication Drills"}
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                {isSuperAdmin
                  ? "Read-only quality audit of all speech flaw drills. Drills are authored by BPO Company Admins; approvals are managed in the Approvals Center."
                  : "Submit company-specific speech drills to train candidates on flaw reduction. Submissions require Super Admin approval."}
              </p>
            </div>

            {/* ONLY Company Admin can author/propose content */}
            {!isSuperAdmin ? (
              <button
                onClick={handleOpenAdd}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-sm transition flex items-center gap-2 shrink-0"
              >
                + Propose Exercise Drill
              </button>
            ) : (
              <a
                href="/AdminApprovals"
                className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-semibold rounded-xl text-xs transition flex items-center gap-1.5 shrink-0"
              >
                <span>⚖️ Go to Approvals Center</span>
              </a>
            )}
          </div>

          {/* Super Admin Notice Banner */}
          {isSuperAdmin && (
            <div className="p-3.5 bg-purple-50 border border-purple-200 text-purple-900 rounded-xl text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-purple-700 text-sm">ℹ️</span>
                <span>
                  <strong>Quality Control Policy:</strong> Super Admins do not author communication drills. Coaching prompts are authored by BPO Company Admins and approved by Super Admin.
                </span>
              </div>
              <a
                href="/AdminApprovals"
                className="text-xs font-bold text-purple-700 underline shrink-0 hover:text-purple-900"
              >
                Review Pending Submissions →
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
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
                  filterFlaw === f.key
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

                      {/* Approval Status Badge */}
                      {status === "approved" && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live / Approved
                        </span>
                      )}
                      {status === "pending" && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Pending Approval
                        </span>
                      )}
                      {status === "rejected" && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Rejected
                        </span>
                      )}

                      <h3 className="text-sm font-bold text-gray-900">{ex.title}</h3>
                      <span className="text-xs text-gray-400 capitalize">
                        ({ex.difficulty} tier)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(ex)}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(ex.id)}
                        className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition"
                      >
                        Delete
                      </button>
                    </div>
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
                {editingId ? "Edit Communication Drill" : "Create New Communication Drill"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
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
                  placeholder="e.g. Flight Cancellation De-escalation without Fillers"
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
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  >
                    <option value="filler_words">Filler Words</option>
                    <option value="grammar">Grammar Mastery</option>
                    <option value="speech_pacing">Speech Pacing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Drill Prompt Script
                </label>
                <textarea
                  rows="5"
                  required
                  value={formData.prompt_text}
                  onChange={(e) => setFormData({ ...formData, prompt_text: e.target.value })}
                  placeholder="Enter the targeted practice prompt candidates will speak..."
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-sm"
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
