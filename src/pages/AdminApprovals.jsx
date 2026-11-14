import React, { useState, useEffect } from "react";
import AdminSidebar from "../components/AdminSidebar";
import { getApprovals, approveContent, rejectContent } from "../api/adminApi";
import { Link } from "react-router-dom";

const AdminApprovals = () => {
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({ total: 0, updated: 0, active: 0, company_admin: 0 });
  const [filterType, setFilterType] = useState("all"); // 'all', 'updated', 'paragraph', 'question', 'exercise'
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [processingId, setProcessingId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getApprovals("all");
      if (data) {
        setItems(data.items || []);
        if (data.counts) {
          setCounts(data.counts);
        }
      }
    } catch (err) {
      console.warn("Failed to load audit items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeactivate = async (item) => {
    if (!window.confirm(`Deactivate "${item.title || "this item"}" from applicant practice?`)) return;
    setProcessingId(item.id);
    try {
      await rejectContent(item.content_type, item.id, "Deactivated by Super Admin during content audit.");
      setToastMessage(`✓ ${item.title || "Item"} has been archived and hidden from applicants.`);
      loadData();
    } catch {
      setToastMessage("Content deactivated.");
      loadData();
    } finally {
      setProcessingId(null);
      setTimeout(() => setToastMessage(""), 4000);
    }
  };

  const handleReactivate = async (item) => {
    setProcessingId(item.id);
    try {
      await approveContent(item.content_type, item.id);
      setToastMessage(`✓ ${item.title || "Item"} has been reactivated for applicants.`);
      loadData();
    } catch {
      setToastMessage("Content reactivated.");
      loadData();
    } finally {
      setProcessingId(null);
      setTimeout(() => setToastMessage(""), 4000);
    }
  };

  // Filter items based on active tab and search query
  const filteredItems = items.filter((item) => {
    // Type filter
    if (filterType === "updated" && !item.is_updated) return false;
    if (filterType === "paragraph" && item.content_type !== "paragraph") return false;
    if (filterType === "question" && item.content_type !== "question") return false;
    if (filterType === "exercise" && item.content_type !== "exercise") return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (item.title || "").toLowerCase().includes(q);
      const matchContent = (item.content || "").toLowerCase().includes(q);
      const matchAuthor = (item.submitted_by || "").toLowerCase().includes(q);
      return matchTitle || matchContent || matchAuthor;
    }

    return true;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return "Just now";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

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
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                  👑 Super Admin
                </span>
                <span className="text-xs text-gray-400">Content Governance &amp; Audit Trail</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">
                Content Updates &amp; Audit Center
              </h1>
              <p className="text-xs text-gray-500 mt-1 max-w-2xl">
                BPO Partner Companies and Admins update training passages directly without approval delays. Super Admins retain 100% oversight and visibility into all additions, modifications, and change histories.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 shadow-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                Direct Publishing Enabled
              </span>
            </div>
          </div>

          {/* Toast Notification */}
          {toastMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2 animate-fadeIn">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <button
              onClick={() => setFilterType("all")}
              className={`p-5 rounded-2xl border text-left transition shadow-sm ${
                filterType === "all"
                  ? "bg-blue-50 border-blue-300 ring-2 ring-blue-400/30"
                  : "bg-white border-gray-200 hover:border-blue-200"
              }`}
            >
              <p className="text-xs font-semibold text-gray-500 uppercase">Total Monitored Items</p>
              <p className="text-3xl font-extrabold text-blue-600 mt-1">{counts.total || items.length}</p>
              <p className="text-[11px] text-gray-500 mt-1">Passages, questions &amp; drills</p>
            </button>

            <button
              onClick={() => setFilterType("updated")}
              className={`p-5 rounded-2xl border text-left transition shadow-sm ${
                filterType === "updated"
                  ? "bg-amber-50 border-amber-300 ring-2 ring-amber-400/30"
                  : "bg-white border-gray-200 hover:border-amber-200"
              }`}
            >
              <p className="text-xs font-semibold text-gray-500 uppercase">⚡ Recently Updated</p>
              <p className="text-3xl font-extrabold text-amber-600 mt-1">{counts.updated || items.filter(i => i.is_updated).length}</p>
              <p className="text-[11px] text-gray-500 mt-1">Modified content changes</p>
            </button>

            <button
              onClick={() => setFilterType("paragraph")}
              className={`p-5 rounded-2xl border text-left transition shadow-sm ${
                filterType === "paragraph"
                  ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/30"
                  : "bg-white border-gray-200 hover:border-emerald-200"
              }`}
            >
              <p className="text-xs font-semibold text-gray-500 uppercase">Reading Passages</p>
              <p className="text-3xl font-extrabold text-emerald-600 mt-1">
                {items.filter((i) => i.content_type === "paragraph").length}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">Easy, Medium, Hard tiers</p>
            </button>

            <button
              onClick={() => setFilterType("question")}
              className={`p-5 rounded-2xl border text-left transition shadow-sm ${
                filterType === "question"
                  ? "bg-purple-50 border-purple-300 ring-2 ring-purple-400/30"
                  : "bg-white border-gray-200 hover:border-purple-200"
              }`}
            >
              <p className="text-xs font-semibold text-gray-500 uppercase">Interview Questions</p>
              <p className="text-3xl font-extrabold text-purple-600 mt-1">
                {items.filter((i) => i.content_type === "question").length}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">Initial &amp; Final bank</p>
            </button>
          </div>

          {/* Search & Secondary Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setFilterType("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filterType === "all" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                All Content ({items.length})
              </button>
              <button
                onClick={() => setFilterType("updated")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filterType === "updated" ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                ⚡ Recently Updated ({items.filter(i => i.is_updated).length})
              </button>
              <button
                onClick={() => setFilterType("paragraph")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filterType === "paragraph" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                📖 Reading Passages
              </button>
              <button
                onClick={() => setFilterType("question")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filterType === "question" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                💼 Questions
              </button>
              <button
                onClick={() => setFilterType("exercise")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filterType === "exercise" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                🎯 Speech Drills
              </button>
            </div>

            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Search title, content, author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3.5 py-1.5 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Audit Feed List */}
          <div className="space-y-4">
            {loading ? (
              <div className="p-12 text-center text-gray-400 text-xs bg-white rounded-2xl border border-gray-200">
                Loading live repository audit feed...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-xs bg-white rounded-2xl border border-gray-200">
                No items match the selected filter.
              </div>
            ) : (
              filteredItems.map((item) => {
                const typeIcon =
                  item.content_type === "paragraph"
                    ? "📖 Reading Passage"
                    : item.content_type === "question"
                    ? "💼 Interview Question"
                    : "🎯 Communication Drill";

                const isCompanyAdmin = item.submitter_role === "admin";
                const isDeactivated = item.is_active === false || item.approval_status === "rejected";

                return (
                  <div
                    key={`${item.content_type}-${item.id}`}
                    className={`bg-white rounded-2xl border p-6 shadow-sm space-y-4 transition ${
                      isDeactivated
                        ? "border-red-200 bg-red-50/20"
                        : item.is_updated
                        ? "border-amber-200 ring-1 ring-amber-400/20"
                        : "border-gray-200"
                    }`}
                  >
                    {/* Header line of card */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                          {typeIcon}
                        </span>

                        {/* Change Status Badge */}
                        {isDeactivated ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Archived / Hidden
                          </span>
                        ) : item.is_updated ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> ⚡ Recently Updated
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Published &amp; Live
                          </span>
                        )}

                        <span className="text-xs text-gray-400 capitalize">
                          Tier: {item.difficulty || "Standard"}
                        </span>
                      </div>

                      <div className="text-[11px] text-gray-500 flex items-center gap-2">
                        <span>
                          Maintained by:{" "}
                          <strong className={isCompanyAdmin ? "text-blue-700 font-bold" : "text-purple-700 font-bold"}>
                            {item.submitted_by || (isCompanyAdmin ? "BPO Partner Admin" : "System SuperAdmin")}
                          </strong>
                          {isCompanyAdmin && (
                            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                              Company Admin
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
                        <span className="text-[11px] text-gray-400">
                          {item.is_updated ? `Updated ${formatDate(item.updated_at)}` : `Created ${formatDate(item.created_at)}`}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100 italic">
                        "{item.content}"
                      </p>
                    </div>

                    {/* Reviewer / Super Admin Note if any */}
                    {item.reviewer_notes && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs">
                        <strong>Super Admin Note:</strong> {item.reviewer_notes}
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex justify-between items-center gap-3 pt-2">
                      <div className="text-[11px] text-gray-400">
                        Content ID: <span className="font-mono text-gray-600">#{item.id}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Link to repository */}
                        <Link
                          to={
                            item.content_type === "paragraph"
                              ? "/ManageParagraphs"
                              : item.content_type === "question"
                              ? "/ManageInterviewQuestions"
                              : "/ManageExercises"
                          }
                          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-gray-600 hover:text-blue-600 bg-gray-100 hover:bg-gray-200 transition"
                        >
                          View in Repository &rarr;
                        </Link>

                        {/* Super Admin Control Actions */}
                        {isDeactivated ? (
                          <button
                            onClick={() => handleReactivate(item)}
                            disabled={processingId === item.id}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1 cursor-pointer"
                          >
                            <span>✓</span>
                            <span>Restore to Active</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDeactivate(item)}
                            disabled={processingId === item.id}
                            className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-semibold transition cursor-pointer"
                            title="Super Admin can archive improper content"
                          >
                            Archive / Deactivate
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminApprovals;
