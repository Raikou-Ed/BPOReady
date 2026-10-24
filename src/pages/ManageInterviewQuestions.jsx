import React, { useState, useEffect } from "react";
import AdminSidebar from "../components/AdminSidebar";
import {
  listInterviewQuestions,
  createInterviewQuestion,
  updateInterviewQuestion,
  deleteInterviewQuestion,
} from "../api/adminApi";
import { getCurrentUser } from "../utils/userData";

const defaultQuestions = [
  {
    id: 1,
    question_type: "initial",
    category: "Introduction",
    difficulty: "easy",
    question_text: "Tell me about yourself and your background.",
    expected_keywords: "education, experience, strengths, background",
  },
  {
    id: 2,
    question_type: "initial",
    category: "Motivation",
    difficulty: "easy",
    question_text: "Why do you want to build a career in the BPO / Call Center industry?",
    expected_keywords: "growth, customer service, communication, dynamic environment",
  },
  {
    id: 3,
    question_type: "initial",
    category: "Workplace Adaptability",
    difficulty: "medium",
    question_text: "How do you handle night shifts and rotating work schedules?",
    expected_keywords: "discipline, sleep routine, commitment, physical health",
  },
  {
    id: 4,
    question_type: "final",
    category: "Conflict Resolution",
    difficulty: "hard",
    question_text: "Describe a specific time you had to deal with an extremely angry or unreasonable customer. How did you resolve the situation?",
    expected_keywords: "empathy, de-escalation, listening, resolution, follow-up",
  },
  {
    id: 5,
    question_type: "final",
    category: "Pressure Management",
    difficulty: "hard",
    question_text: "How do you maintain high call quality when handling high call volumes and back-to-back customer inquiries?",
    expected_keywords: "focus, composure, process adherence, efficiency",
  },
];

const ManageInterviewQuestions = () => {
  const [currentUser] = useState(() => getCurrentUser() || { role: "super_admin" });
  const [questions, setQuestions] = useState(defaultQuestions);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    question_type: "initial",
    category: "General HR",
    difficulty: "easy",
    question_text: "",
    expected_keywords: "",
  });
  const [message, setMessage] = useState("");

  const isSuperAdmin = currentUser?.role === "super_admin";

  const fetchQuestions = async () => {
    try {
      const data = await listInterviewQuestions();
      if (Array.isArray(data) && data.length > 0) {
        setQuestions(data);
      }
    } catch (err) {
      console.warn("Using offline questions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      question_type: "initial",
      category: "General HR",
      difficulty: "easy",
      question_text: "",
      expected_keywords: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (q) => {
    setEditingId(q.id);
    setFormData({
      question_type: q.question_type || "initial",
      category: q.category || "General HR",
      difficulty: q.difficulty || "easy",
      question_text: q.question_text || q.question || "",
      expected_keywords: q.expected_keywords || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    try {
      await deleteInterviewQuestion(id);
      setQuestions(questions.filter((q) => q.id !== id));
      setMessage("Question deleted successfully.");
    } catch {
      setQuestions(questions.filter((q) => q.id !== id));
      setMessage("Question removed locally.");
    }
    setTimeout(() => setMessage(""), 3000);
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
        const updated = await updateInterviewQuestion(editingId, payload);
        setQuestions(
          questions.map((q) => (q.id === editingId ? { ...(updated.question || updated), approval_status: q.approval_status } : q))
        );
      } else {
        const created = await createInterviewQuestion(payload);
        setQuestions([...questions, created.question || created]);
      }
      setIsModalOpen(false);
      setMessage(
        isSuperAdmin
          ? "Question saved and published to Question Bank."
          : "Question submitted! Pending Super Admin review before going live."
      );
    } catch {
      if (editingId) {
        setQuestions(
          questions.map((q) => (q.id === editingId ? { ...q, ...payload } : q))
        );
      } else {
        setQuestions([...questions, { id: Date.now(), ...payload }]);
      }
      setIsModalOpen(false);
      setMessage("Question saved locally.");
    }
    setTimeout(() => setMessage(""), 3500);
  };

  const filtered = questions.filter((q) => {
    if (filterType === "all") return true;
    return q.question_type?.toLowerCase() === filterType;
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
                <span className="text-xs text-gray-400">Questions</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">
                {isSuperAdmin ? "Interview Question Bank Repository" : "Propose Interview Questions"}
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                {isSuperAdmin
                  ? "Read-only quality audit of all Initial HR and Final Operations interview prompts. Prompts are authored by BPO Company Admins; approvals are managed in the Approvals Center."
                  : "Submit customized interview prompts tailored to your account. Questions require Super Admin approval before being activated for candidate interviews."}
              </p>
            </div>

            {/* ONLY Company Admin can author/propose content */}
            {!isSuperAdmin ? (
              <button
                onClick={handleOpenAdd}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-sm transition flex items-center gap-2 shrink-0"
              >
                + Propose New Question
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
                  <strong>Quality Control Policy:</strong> Super Admins do not author interview questions. Scenarios are authored by BPO Company Admins and approved by Super Admin.
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
              { key: "all", label: "All Questions" },
              { key: "initial", label: "Initial HR Screening" },
              { key: "final", label: "Final Operations / Behavioral" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilterType(f.key)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
                  filterType === f.key
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {f.label} ({f.key === "all" ? questions.length : questions.filter((q) => q.question_type?.toLowerCase() === f.key).length})
              </button>
            ))}
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {filtered.map((q) => {
              const typeBadge =
                q.question_type === "initial"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-purple-100 text-purple-800";

              const status = q.approval_status || "approved";

              return (
                <div
                  key={q.id}
                  className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${typeBadge}`}>
                        {q.question_type} Interview
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

                      <span className="text-xs font-semibold text-gray-700">
                        {q.category || "General HR"}
                      </span>
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded capitalize">
                        {q.difficulty} Tier
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(q)}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(q.id)}
                        className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {q.reviewer_notes && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                      <span className="font-bold text-amber-600 mt-0.5">ℹ️</span>
                      <div>
                        <span className="font-semibold">Reviewer Feedback:</span> {q.reviewer_notes}
                      </div>
                    </div>
                  )}

                  <p className="text-sm font-semibold text-gray-900 leading-relaxed">
                    "{q.question_text || q.question}"
                  </p>

                  {q.expected_keywords && (
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <span className="font-semibold text-gray-600">Scoring Keywords:</span>
                      <span className="text-blue-700 font-mono">
                        {q.expected_keywords}
                      </span>
                    </div>
                  )}
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
                {editingId ? "Edit Interview Question" : "Add New Interview Question"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Interview Round
                  </label>
                  <select
                    value={formData.question_type}
                    onChange={(e) => setFormData({ ...formData, question_type: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  >
                    <option value="initial">Initial Interview (HR)</option>
                    <option value="final">Final Interview (Ops)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Difficulty Tier
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
                  Category
                </label>
                <input
                  type="text"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g. Conflict Resolution / De-escalation"
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Question Prompt Text
                </label>
                <textarea
                  rows="3"
                  required
                  value={formData.question_text}
                  onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                  placeholder="Enter the complete interview question..."
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Target Scoring Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.expected_keywords}
                  onChange={(e) => setFormData({ ...formData, expected_keywords: e.target.value })}
                  placeholder="e.g. empathy, active listening, de-escalation, resolution"
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
                  {editingId ? "Update Question" : "Save Question"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageInterviewQuestions;