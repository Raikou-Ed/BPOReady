import React, { useState, useEffect } from "react";
import AdminSidebar from "../components/AdminSidebar";
import { getCurrentUser } from "../utils/userData";

const API_BASE = "http://localhost:8000";

const defaultParagraphs = [
  {
    id: 1,
    title: "BPO Industry Overview",
    difficulty: "easy",
    category: "BPO Industry",
    word_count: 45,
    approval_status: "approved",
    content: "The Philippine Business Process Outsourcing (BPO) industry remains one of the country’s leading economic sectors, generating significant revenue and employing many Filipinos. The industry relies on strong communication skills, particularly English fluency and clarity, which are essential in customer service and voice-based roles."
  },
  {
    id: 2,
    title: "Communication Challenges",
    difficulty: "medium",
    category: "Communication Skills",
    word_count: 50,
    approval_status: "approved",
    content: "Many applicants struggle with interview performance due to communication-related challenges such as lack of confidence, poor grammar, ineffective sentence construction, and limited opportunities for structured speaking practice. These issues highlight the need for tools that improve spoken communication through structured practice and automated feedback."
  },
  {
    id: 3,
    title: "AI-Powered Interview Coaching",
    difficulty: "hard",
    category: "Speech AI",
    word_count: 55,
    approval_status: "approved",
    content: "By integrating speech analysis, grammar checking, and progressive paragraph-reading modules, AI-powered interview coaching systems can provide personalized, real-time feedback. Such systems can analyze pronunciation, detect filler words, evaluate pacing and confidence, and provide targeted exercises that improve interview readiness for industry-specific roles like BPO."
  }
];

const ManageParagraphs = () => {
  const [currentUser] = useState(() => getCurrentUser() || { role: "super_admin", name: "Admin" });
  const [paragraphs, setParagraphs] = useState(defaultParagraphs);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    difficulty: "easy",
    category: "Customer Service",
    content: "",
  });
  const [message, setMessage] = useState("");

  const isSuperAdmin = currentUser?.role === "super_admin";

  const fetchParagraphs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/paragraphs?admin=1`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setParagraphs(data);
        }
      }
    } catch (err) {
      console.warn("Using offline paragraphs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParagraphs();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      title: "",
      difficulty: "easy",
      category: "Customer Service",
      content: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingId(p.id);
    setFormData({
      title: p.title,
      difficulty: p.difficulty,
      category: p.category || "General",
      content: p.content,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this paragraph?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/paragraphs/${id}`, { method: "DELETE" });
      if (res.ok) {
        setParagraphs(paragraphs.filter((p) => p.id !== id));
        setMessage("Paragraph deleted successfully.");
      } else {
        setParagraphs(paragraphs.filter((p) => p.id !== id));
        setMessage("Paragraph removed from view.");
      }
    } catch {
      setParagraphs(paragraphs.filter((p) => p.id !== id));
      setMessage("Paragraph removed locally.");
    }
    setTimeout(() => setMessage(""), 3500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const word_count = formData.content.trim().split(/\s+/).length;
    const approval_status = isSuperAdmin ? "approved" : "pending";
    const payload = {
      ...formData,
      word_count,
      approval_status,
      created_by_user_id: currentUser?.id,
    };

    try {
      if (editingId) {
        const res = await fetch(`${API_BASE}/api/paragraphs/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          setParagraphs(paragraphs.map((p) => (p.id === editingId ? { ...(updated.paragraph || updated), approval_status: p.approval_status } : p)));
          setMessage("Paragraph updated successfully.");
        } else {
          setParagraphs(paragraphs.map((p) => (p.id === editingId ? { ...p, ...payload } : p)));
          setMessage("Paragraph updated locally.");
        }
      } else {
        const res = await fetch(`${API_BASE}/api/paragraphs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          setParagraphs([...paragraphs, created.paragraph || created]);
          setMessage(
            isSuperAdmin
              ? "New reading passage created and published."
              : "New passage submitted! Pending Super Admin review before going live."
          );
        } else {
          const newP = { id: Date.now(), ...payload };
          setParagraphs([...paragraphs, newP]);
          setMessage(
            isSuperAdmin
              ? "New reading passage saved locally."
              : "Passage saved! Pending Super Admin review."
          );
        }
      }
    } catch {
      if (editingId) {
        setParagraphs(paragraphs.map((p) => (p.id === editingId ? { ...p, ...payload } : p)));
      } else {
        setParagraphs([...paragraphs, { id: Date.now(), ...payload }]);
      }
      setMessage("Saved locally.");
    }

    setIsModalOpen(false);
    setTimeout(() => setMessage(""), 4000);
  };

  const filtered = paragraphs.filter((p) => {
    if (filterLevel === "all") return true;
    return p.difficulty?.toLowerCase() === filterLevel;
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
                <span className="text-xs text-gray-400">Content Repository</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">
                {isSuperAdmin ? "Reading Passages Repository" : "Propose Reading Passages"}
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                {isSuperAdmin
                  ? "Read-only quality audit of all reading scripts. Content authoring is reserved for BPO Company Admins; approvals are managed in the Approvals Center."
                  : "Submit company-tailored customer care scripts. Submissions require Super Admin approval before going live to candidates."}
              </p>
            </div>

            {/* ONLY Company Admin can author/propose content */}
            {!isSuperAdmin ? (
              <button
                onClick={handleOpenAdd}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-sm transition flex items-center gap-2 shrink-0"
              >
                + Propose Reading Passage
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
                  <strong>Quality Control Policy:</strong> Super Admins do not author training passages. Materials are authored by industry experts (BPO Company Admin) and approved by Super Admin.
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
            {["all", "easy", "medium", "hard"].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl capitalize transition ${
                  filterLevel === lvl
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {lvl} Passages ({lvl === "all" ? paragraphs.length : paragraphs.filter((p) => p.difficulty?.toLowerCase() === lvl).length})
              </button>
            ))}
          </div>

          {/* Passages List */}
          <div className="space-y-4">
            {filtered.map((p) => {
              const badgeBg =
                p.difficulty === "easy"
                  ? "bg-green-100 text-green-800"
                  : p.difficulty === "medium"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-purple-100 text-purple-800";

              const status = p.approval_status || "approved";

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${badgeBg}`}>
                        {p.difficulty} Level
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

                      <h3 className="text-sm font-bold text-gray-900">{p.title}</h3>
                      <span className="text-xs text-gray-400">
                        ({p.category || "General"} • ~{p.word_count || p.content.split(/\s+/).length} words)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {p.reviewer_notes && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                      <span className="font-bold text-amber-600 mt-0.5">ℹ️</span>
                      <div>
                        <span className="font-semibold">Reviewer Feedback:</span> {p.reviewer_notes}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100 italic">
                    "{p.content}"
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
                {editingId ? "Edit Reading Passage" : "Create New Reading Passage"}
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
                  Passage Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Customer Care Billing Assurance"
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Technical Support"
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Passage Text Content
                </label>
                <textarea
                  rows="5"
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter the full reading passage script here..."
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Estimated Words: {formData.content.trim() ? formData.content.trim().split(/\s+/).length : 0}
                </p>
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
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition shadow-sm"
                >
                  {editingId ? "Update Passage" : "Save Passage"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageParagraphs;
