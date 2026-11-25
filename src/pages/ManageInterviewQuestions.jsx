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
    interview_type: "initial",
    question_text: "Tell me about yourself and your background.",
  },
  {
    id: 2,
    question_type: "initial",
    interview_type: "initial",
    question_text: "Why do you want to build a career in the BPO / Call Center industry?",
  },
  {
    id: 3,
    question_type: "initial",
    interview_type: "initial",
    question_text: "How do you handle night shifts and rotating work schedules?",
  },
  {
    id: 4,
    question_type: "final",
    interview_type: "final",
    question_text: "Describe a specific time you had to deal with an extremely angry or unreasonable customer. How did you resolve the situation?",
  },
  {
    id: 5,
    question_type: "final",
    interview_type: "final",
    question_text: "How do you maintain high call quality when handling high call volumes and back-to-back customer inquiries?",
  },
];

const getQuestionType = (q) => {
  return (q.interview_type || q.question_type || "initial").toLowerCase();
};

const normalizeQuestion = (q) => {
  const type = getQuestionType(q);
  return {
    ...q,
    interview_type: type,
    question_type: type,
  };
};

const ManageInterviewQuestions = () => {
  const [currentUser] = useState(() => getCurrentUser() || { role: "super_admin" });
  const [questions, setQuestions] = useState(() => {
    // Clear legacy text-based blocklist so re-adding questions always works
    try {
      localStorage.removeItem("bpo_deleted_question_texts");
    } catch {}

    let deletedIds = [];
    try {
      deletedIds = JSON.parse(localStorage.getItem("bpo_deleted_question_ids") || "[]");
    } catch {}

    try {
      const cached = localStorage.getItem("bpo_custom_questions");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed
            .filter(
              (q) =>
                q.is_active !== false &&
                !deletedIds.includes(q.id) &&
                !deletedIds.includes(String(q.id)) &&
                !deletedIds.includes(Number(q.id))
            )
            .map(normalizeQuestion);
          if (valid.length > 0) return valid;
        }
      }
    } catch {}

    return defaultQuestions.map(normalizeQuestion);
  });

  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    question_type: "initial",
    question_text: "",
  });
  const [message, setMessage] = useState("");

  const isSuperAdmin = currentUser?.role === "super_admin";

  const fetchQuestions = async () => {
    try {
      try {
        localStorage.removeItem("bpo_deleted_question_texts");
      } catch {}

      const data = await listInterviewQuestions();
      if (Array.isArray(data) && data.length > 0) {
        let deletedIds = [];
        try {
          deletedIds = JSON.parse(localStorage.getItem("bpo_deleted_question_ids") || "[]");
        } catch {}

        const validFromApi = data
          .filter(
            (q) =>
              q.is_active !== false &&
              !deletedIds.includes(q.id) &&
              !deletedIds.includes(String(q.id)) &&
              !deletedIds.includes(Number(q.id))
          )
          .map(normalizeQuestion);

        let localCustom = [];
        try {
          const raw = localStorage.getItem("bpo_custom_questions");
          if (raw) {
            localCustom = JSON.parse(raw)
              .filter(
                (q) =>
                  q.is_active !== false &&
                  !deletedIds.includes(q.id) &&
                  !deletedIds.includes(String(q.id)) &&
                  !deletedIds.includes(Number(q.id))
              )
              .map(normalizeQuestion);
          }
        } catch {}

        const map = new Map();
        validFromApi.forEach((q) => map.set(String(q.id), q));

        // Preserve any offline/custom questions not yet in API
        localCustom.forEach((q) => {
          const textMatch = Array.from(map.values()).some(
            (existing) =>
              (existing.question_text || existing.question || "").trim().toLowerCase() ===
              (q.question_text || q.question || "").trim().toLowerCase()
          );
          if (!map.has(String(q.id)) && !textMatch) {
            map.set(String(q.id), q);
          }
        });

        // Only fall back to defaults if database is completely empty
        if (map.size === 0) {
          defaultQuestions.forEach((def) => {
            if (
              !deletedIds.includes(def.id) &&
              !deletedIds.includes(String(def.id))
            ) {
              map.set(String(def.id), normalizeQuestion(def));
            }
          });
        }

        const merged = Array.from(map.values()).map(normalizeQuestion);
        setQuestions(merged);
        localStorage.setItem("bpo_custom_questions", JSON.stringify(merged));
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
      question_text: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (q) => {
    setEditingId(q.id);
    setFormData({
      question_type: q.question_type || q.interview_type || "initial",
      question_text: q.question_text || q.question || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;

    const remaining = questions.filter((q) => q.id !== id);
    setQuestions(remaining);
    localStorage.setItem("bpo_custom_questions", JSON.stringify(remaining));

    try {
      const deletedIds = JSON.parse(localStorage.getItem("bpo_deleted_question_ids") || "[]");
      if (!deletedIds.includes(id)) deletedIds.push(id);
      if (!deletedIds.includes(String(id))) deletedIds.push(String(id));
      localStorage.setItem("bpo_deleted_question_ids", JSON.stringify(deletedIds));
    } catch {}

    try {
      await deleteInterviewQuestion(id);
      setMessage("Question deleted successfully.");
    } catch {
      setMessage("Question removed locally.");
    }
    setTimeout(() => setMessage(""), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const approval_status = "approved"; // Published live immediately per adviser directive
    const chosenType = (formData.question_type || formData.interview_type || "initial").toLowerCase();
    const payload = {
      question_type: chosenType,
      interview_type: chosenType,
      question_text: formData.question_text.trim(),
      approval_status,
      created_by_user_id: currentUser?.id,
    };

    if (editingId) {
      const updatedList = questions.map((q) =>
        q.id === editingId ? normalizeQuestion({ ...q, ...payload }) : q
      );
      setQuestions(updatedList);
      localStorage.setItem("bpo_custom_questions", JSON.stringify(updatedList));
      setIsModalOpen(false);

      try {
        await updateInterviewQuestion(editingId, payload);
        setMessage("Interview question updated and active for applicants! Monitored in Super Admin audit trail.");
      } catch {
        setMessage("Interview question updated locally.");
      }
      setTimeout(() => setMessage(""), 3500);
      return;
    }

    // Adding new question:
    const tempId = `q-${Date.now()}`;
    const newQ = normalizeQuestion({ id: tempId, ...payload });
    const updatedList = [...questions, newQ];
    setQuestions(updatedList);
    localStorage.setItem("bpo_custom_questions", JSON.stringify(updatedList));
    setIsModalOpen(false);

    try {
      const created = await createInterviewQuestion(payload);
      const realId = created?.question?.id || created?.id;
      if (realId) {
        setQuestions((current) => {
          const wasDeleted = !current.some((q) => q.id === tempId);
          if (wasDeleted) {
            deleteInterviewQuestion(realId).catch(() => {});
            try {
              const delIds = JSON.parse(localStorage.getItem("bpo_deleted_question_ids") || "[]");
              if (!delIds.includes(realId)) delIds.push(realId);
              if (!delIds.includes(String(realId))) delIds.push(String(realId));
              localStorage.setItem("bpo_deleted_question_ids", JSON.stringify(delIds));
            } catch {}
            return current;
          }
          const withRealId = current.map((q) =>
            q.id === tempId ? normalizeQuestion({ ...q, id: realId }) : q
          );
          localStorage.setItem("bpo_custom_questions", JSON.stringify(withRealId));
          return withRealId;
        });
      }
      setMessage("Interview question saved and active for applicants! Monitored in Super Admin audit trail.");
    } catch (err) {
      console.warn("API save failed, preserved locally:", err);
      setMessage("Interview question saved locally.");
    }
    setTimeout(() => setMessage(""), 3500);
  };

  const filtered = questions.filter((q) => {
    if (filterType === "all") return true;
    return getQuestionType(q) === filterType;
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
                {isSuperAdmin ? "Question Bank Repository" : "Manage Interview Questions"}
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                {isSuperAdmin
                  ? "View-only audit of all Initial HR and Final Operations interview prompts. Authored and managed directly by BPO Company Admins."
                  : "Create and update interview prompts tailored to recruitment accounts. Questions are published immediately."}
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
                  + Add Interview Question
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
                  <strong>View-Only Oversight:</strong> Super Admins can monitor and view all interview prompts. Prompt authoring, editing, and deleting are reserved for BPO Company Admins.
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
              { key: "all", label: "All Questions" },
              { key: "initial", label: "Initial HR Screening" },
              { key: "final", label: "Final Operations / Behavioral" },
            ].map((f) => {
              const count =
                f.key === "all"
                  ? questions.length
                  : questions.filter((q) => getQuestionType(q) === f.key).length;

              return (
                <button
                  key={f.key}
                  onClick={() => setFilterType(f.key)}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
                    filterType === f.key
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  {f.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {filtered.map((q) => {
              const type = getQuestionType(q);
              const isInitial = type === "initial";
              const typeBadge = isInitial
                ? "bg-blue-100 text-blue-800"
                : "bg-purple-100 text-purple-800";
              const typeLabel = isInitial ? "Initial HR" : "Final Ops";

              const status = q.approval_status || "approved";

              return (
                <div
                  key={q.id}
                  className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${typeBadge}`}>
                        {typeLabel} Interview
                      </span>

                      {/* Status & Change Badges */}
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live / Active
                      </span>
                      {q.is_updated && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> ⚡ Recently Updated
                        </span>
                      )}
                    </div>
                    {!isSuperAdmin && (
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
                    )}
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
                  Question Prompt Text
                </label>
                <textarea
                  rows="4"
                  required
                  value={formData.question_text}
                  onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                  placeholder="Enter the complete interview question..."
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