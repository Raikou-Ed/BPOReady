import React, { useState, useEffect } from "react";
import AdminSidebar from "../components/AdminSidebar";
import { getCurrentUser } from "../utils/userData";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const defaultParagraphs = [
  {
    id: "pre-assessment-001",
    title: "Spoken English Diagnostic Assessment",
    difficulty: "pre-assessment",
    word_count: 77,
    approval_status: "approved",
    content: "Effective communication begins with clarity of thought and the ability to articulate ideas with confidence. When speaking, maintaining a steady pace and pronouncing words accurately allows listeners to understand the intended message without confusion. Genuine listening is equally essential, as it fosters constructive dialogue and mutual respect. Cultivating strong spoken language skills enables individuals to connect thoughtfully with others, navigate diverse conversations, and express viewpoints with poise and professional credibility."
  },
  {
    id: 1,
    title: "The Value of Daily Speaking Practice",
    difficulty: "easy",
    word_count: 48,
    approval_status: "approved",
    content: "Speaking English clearly takes time, patience, and regular practice. When you read aloud every day, you improve your voice, rhythm, and confidence. Using simple words helps everyone understand your message right away. Staying calm and breathing properly allows you to speak smoothly and share your thoughts with ease."
  },
  {
    id: 2,
    title: "Effective Communication in the Workplace",
    difficulty: "medium",
    word_count: 60,
    approval_status: "approved",
    content: "Effective communication is an essential skill in every modern workplace. When people share their ideas clearly and listen with respect, teams solve problems faster and achieve better results. Practicing structured speech techniques helps individuals build vocal confidence, control their speaking pace, and adapt comfortably to different professional conversations. Over time, consistent practice transforms everyday spoken interactions into meaningful professional relationships."
  },
  {
    id: 3,
    title: "Mastering Advanced Verbal Precision",
    difficulty: "hard",
    word_count: 61,
    approval_status: "approved",
    content: "Mastering advanced verbal communication requires cognitive adaptability, precise phonetic articulation, and disciplined breath management. Professionals who articulate intricate concepts clearly can navigate high-pressure discussions with authority and composure. Developing these capabilities demands sustained linguistic awareness, critical self-evaluation, and continuous refinement across demanding professional environments. Ultimately, achieving vocal excellence empowers individuals to deliver persuasive arguments, project executive presence, and influence organizational outcomes."
  }
];

const ManageParagraphs = () => {
  const [currentUser] = useState(() => getCurrentUser() || { role: "super_admin", name: "Admin" });
  const [paragraphs, setParagraphs] = useState(() => {
    let deletedIds = [];
    let deletedTitles = [];
    try {
      deletedIds = JSON.parse(localStorage.getItem("bpo_deleted_paragraph_ids") || "[]");
      deletedTitles = JSON.parse(localStorage.getItem("bpo_deleted_paragraph_titles") || "[]");
    } catch {}

    try {
      const cached = localStorage.getItem("bpo_custom_paragraphs");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter(
            (p) =>
              p.is_active !== false &&
              p.is_active !== 0 &&
              p.is_active !== "0" &&
              !deletedIds.includes(p.id) &&
              !deletedIds.includes(String(p.id)) &&
              !deletedIds.includes(Number(p.id)) &&
              !deletedTitles.includes(p.title?.trim().toLowerCase())
          );
          const customPre = localStorage.getItem("bpo_preassessment_custom");
          if (customPre) {
            const preObj = JSON.parse(customPre);
            return valid.map((p) =>
              p.difficulty === "pre-assessment"
                ? { ...p, title: preObj.title || p.title, content: preObj.content || p.content }
                : p
            );
          }
          return valid;
        }
      }
    } catch {}

    try {
      const customPre = localStorage.getItem("bpo_preassessment_custom");
      if (customPre) {
        const preObj = JSON.parse(customPre);
        return defaultParagraphs.map((p) =>
          p.difficulty === "pre-assessment"
            ? { ...p, title: preObj.title || p.title, content: preObj.content || p.content }
            : p
        );
      }
    } catch {}

    return defaultParagraphs;
  });

  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    difficulty: "easy",
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
          let deletedIds = [];
          let deletedTitles = [];
          try {
            deletedIds = JSON.parse(localStorage.getItem("bpo_deleted_paragraph_ids") || "[]");
            deletedTitles = JSON.parse(localStorage.getItem("bpo_deleted_paragraph_titles") || "[]");
          } catch {}

          // Filter out inactive/deleted passages
          let merged = data.filter(
            (p) =>
              p.is_active !== false &&
              p.is_active !== 0 &&
              p.is_active !== "0" &&
              !deletedIds.includes(p.id) &&
              !deletedIds.includes(String(p.id)) &&
              !deletedIds.includes(Number(p.id)) &&
              !deletedTitles.includes(p.title?.trim().toLowerCase())
          );

          const customPre = localStorage.getItem("bpo_preassessment_custom");
          let preParsed = null;
          if (customPre) {
            try {
              preParsed = JSON.parse(customPre);
            } catch {}
          }

          if (!merged.some((p) => p.difficulty?.toLowerCase() === "pre-assessment")) {
            const preItem = defaultParagraphs.find((p) => p.difficulty === "pre-assessment");
            if (preItem) {
              merged.unshift(
                preParsed
                  ? { ...preItem, title: preParsed.title || preItem.title, content: preParsed.content || preItem.content }
                  : preItem
              );
            }
          } else if (preParsed) {
            merged = merged.map((p) =>
              p.difficulty?.toLowerCase() === "pre-assessment"
                ? { ...p, title: preParsed.title || p.title, content: preParsed.content || p.content }
                : p
            );
          }
          setParagraphs(merged);
          localStorage.setItem("bpo_custom_paragraphs", JSON.stringify(merged));
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
      content: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingId(p.id);
    setFormData({
      title: p.title,
      difficulty: p.difficulty,
      content: p.content,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this paragraph?")) return;
    const target = paragraphs.find((p) => p.id === id);
    const targetTitle = target?.title?.trim().toLowerCase();

    const remaining = paragraphs.filter((p) => p.id !== id);
    setParagraphs(remaining);
    localStorage.setItem("bpo_custom_paragraphs", JSON.stringify(remaining));

    // Persist deleted ID and Title locally so refresh never resurrects it
    try {
      const deletedIds = JSON.parse(localStorage.getItem("bpo_deleted_paragraph_ids") || "[]");
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        localStorage.setItem("bpo_deleted_paragraph_ids", JSON.stringify(deletedIds));
      }
      if (targetTitle) {
        const deletedTitles = JSON.parse(localStorage.getItem("bpo_deleted_paragraph_titles") || "[]");
        if (!deletedTitles.includes(targetTitle)) {
          deletedTitles.push(targetTitle);
          localStorage.setItem("bpo_deleted_paragraph_titles", JSON.stringify(deletedTitles));
        }
      }
    } catch {}

    try {
      const res = await fetch(`${API_BASE}/api/paragraphs/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMessage("Paragraph deleted successfully.");
      } else {
        setMessage("Paragraph removed from view.");
      }
    } catch {
      setMessage("Paragraph removed locally.");
    }
    setTimeout(() => setMessage(""), 3500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const word_count = formData.content.trim().split(/\s+/).length;
    const approval_status = "approved"; // Published live immediately per adviser directive
    const payload = {
      ...formData,
      word_count,
      approval_status,
      created_by_user_id: currentUser?.id,
    };

    let updatedList = paragraphs;

    // If pre-assessment, also persist to dedicated pre-assessment storage for candidate view
    if (formData.difficulty === "pre-assessment") {
      localStorage.setItem("bpo_preassessment_custom", JSON.stringify({
        id: editingId || "pre-assessment-custom",
        title: formData.title,
        content: formData.content,
      }));
    }

    try {
      if (editingId) {
        updatedList = paragraphs.map((p) => (p.id === editingId ? { ...p, ...payload } : p));
        setParagraphs(updatedList);
        localStorage.setItem("bpo_custom_paragraphs", JSON.stringify(updatedList));

        const res = await fetch(`${API_BASE}/api/paragraphs/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setMessage(formData.difficulty === "pre-assessment"
            ? "Pre-Assessment reading passage updated and published live!"
            : "Reading passage updated and published live! Monitored in Super Admin audit trail.");
        } else {
          setMessage("Reading passage updated locally.");
        }
      } else {
        const tempId = `para-${Date.now()}`;
        const newP = { id: tempId, ...payload };
        if (formData.difficulty === "pre-assessment") {
          updatedList = [newP, ...paragraphs.filter(p => p.difficulty !== "pre-assessment")];
        } else {
          updatedList = [...paragraphs, newP];
        }
        setParagraphs(updatedList);
        localStorage.setItem("bpo_custom_paragraphs", JSON.stringify(updatedList));

        const res = await fetch(`${API_BASE}/api/paragraphs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          const realId = created.id || created.paragraph?.id;
          if (realId) {
            setParagraphs((current) => {
              const wasDeleted = !current.some((p) => p.id === tempId);
              if (wasDeleted) {
                fetch(`${API_BASE}/api/paragraphs/${realId}`, { method: "DELETE" }).catch(() => {});
                try {
                  const delIds = JSON.parse(localStorage.getItem("bpo_deleted_paragraph_ids") || "[]");
                  if (!delIds.includes(realId)) {
                    delIds.push(realId);
                    localStorage.setItem("bpo_deleted_paragraph_ids", JSON.stringify(delIds));
                  }
                } catch {}
                return current;
              }
              const withRealId = current.map((p) => (p.id === tempId ? { ...p, id: realId } : p));
              localStorage.setItem("bpo_custom_paragraphs", JSON.stringify(withRealId));
              return withRealId;
            });
          }
          setMessage(formData.difficulty === "pre-assessment"
            ? "New Pre-Assessment reading passage created and activated live!"
            : "New reading passage created and published live! Monitored in Super Admin audit trail.");
        } else {
          setMessage("New reading passage saved locally.");
        }
      }
    } catch {
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
                {isSuperAdmin ? "Reading Passages Repository" : "Manage Reading Passages"}
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                {isSuperAdmin
                  ? "View-only audit of all reading passages, including Pre-Assessment diagnostic scripts and difficulty training modules."
                  : "Create and update reading passages for candidate assessments and diagnostic Pre-Assessment. Changes are published immediately."}
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
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-sm transition flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  + Add Reading Passage
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
                  <strong>View-Only Oversight:</strong> Super Admins can monitor and view all reading passages. Content authoring, editing, and deleting are reserved for BPO Company Admins.
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
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "All Passages" },
              { key: "pre-assessment", label: "Pre-Assessment" },
              { key: "easy", label: "Easy Level" },
              { key: "medium", label: "Medium Level" },
              { key: "hard", label: "Hard Level" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilterLevel(f.key)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition cursor-pointer ${
                  filterLevel === f.key
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {f.label} ({f.key === "all" ? paragraphs.length : paragraphs.filter((p) => p.difficulty?.toLowerCase() === f.key).length})
              </button>
            ))}
          </div>

          {/* Passages List */}
          <div className="space-y-4">
            {filtered.map((p) => {
              const isPre = p.difficulty?.toLowerCase() === "pre-assessment";
              const badgeBg =
                isPre
                  ? "bg-indigo-100 text-indigo-800"
                  : p.difficulty === "easy"
                  ? "bg-green-100 text-green-800"
                  : p.difficulty === "medium"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-purple-100 text-purple-800";

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${badgeBg}`}>
                        {isPre ? "Pre-Assessment" : `${p.difficulty} Level`}
                      </span>

                      {/* Status & Change Badges */}
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live / Active
                      </span>
                      {p.is_updated && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> ⚡ Recently Updated
                        </span>
                      )}

                      <h3 className="text-sm font-bold text-gray-900">{p.title}</h3>
                      <span className="text-xs text-gray-400">
                        (~{p.word_count || p.content.split(/\s+/).length} words)
                      </span>
                    </div>

                    {!isSuperAdmin && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition cursor-pointer"
                        >
                          Edit
                        </button>
                        {!isPre && (
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition cursor-pointer"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    )}
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

      {/* Modal Dialog (Category Removed, Pre-Assessment Added) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-900">
                {editingId ? "Edit Reading Passage" : "Create New Reading Passage"}
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
                  Passage Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Spoken English Diagnostic Assessment"
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
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
                  <option value="pre-assessment">Pre-Assessment</option>
                  <option value="easy">Easy Level</option>
                  <option value="medium">Medium Level</option>
                  <option value="hard">Hard Level</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Passage Text Content
                </label>
                <textarea
                  rows="6"
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
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition shadow-sm cursor-pointer"
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
