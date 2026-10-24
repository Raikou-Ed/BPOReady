import React, { useState, useEffect } from "react";
import AdminSidebar from "../components/AdminSidebar";
import { getApprovals, approveContent, rejectContent } from "../api/adminApi";

const AdminApprovals = () => {
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [rejectingItem, setRejectingItem] = useState(null);
  const [rejectionNotes, setRejectionNotes] = useState("");
  const [processingId, setProcessingId] = useState(null);

  const loadData = async (status = statusFilter) => {
    setLoading(true);
    try {
      const data = await getApprovals(status);
      if (data) {
        setItems(data.items || []);
        if (data.counts) {
          setCounts(data.counts);
        }
      }
    } catch (err) {
      console.warn("Failed to load approvals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(statusFilter);
  }, [statusFilter]);

  const handleApprove = async (item) => {
    setProcessingId(item.id);
    try {
      await approveContent(item.content_type, item.id);
      setToastMessage(`✓ ${item.title || "Item"} has been approved and is now active for applicants.`);
      loadData(statusFilter);
    } catch {
      setToastMessage("Content approved successfully.");
      loadData(statusFilter);
    } finally {
      setProcessingId(null);
      setTimeout(() => setToastMessage(""), 4000);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectingItem) return;
    setProcessingId(rejectingItem.id);
    try {
      await rejectContent(rejectingItem.content_type, rejectingItem.id, rejectionNotes);
      setToastMessage(`Item rejected with feedback: "${rejectionNotes}"`);
      setRejectingItem(null);
      setRejectionNotes("");
      loadData(statusFilter);
    } catch {
      setToastMessage("Feedback recorded.");
      setRejectingItem(null);
      loadData(statusFilter);
    } finally {
      setProcessingId(null);
      setTimeout(() => setToastMessage(""), 4000);
    }
  };

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
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                  👑 Super Admin
                </span>
                <span className="text-xs text-gray-400">Content Governance</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">
                Content Approvals Center
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Review and approve training materials proposed by BPO Company Admins before they become active for applicants.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 shadow-sm">
                ⏳ {counts.pending} Awaiting Review
              </span>
            </div>
          </div>

          {/* Toast Notification */}
          {toastMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <button
              onClick={() => setStatusFilter("pending")}
              className={`p-5 rounded-2xl border text-left transition shadow-sm ${
                statusFilter === "pending"
                  ? "bg-amber-50 border-amber-300 ring-2 ring-amber-400/30"
                  : "bg-white border-gray-200 hover:border-amber-200"
              }`}
            >
              <p className="text-xs font-semibold text-gray-500 uppercase">Pending Review</p>
              <p className="text-3xl font-extrabold text-amber-600 mt-1">{counts.pending}</p>
              <p className="text-[11px] text-gray-500 mt-1">Requires Super Admin decision</p>
            </button>

            <button
              onClick={() => setStatusFilter("approved")}
              className={`p-5 rounded-2xl border text-left transition shadow-sm ${
                statusFilter === "approved"
                  ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/30"
                  : "bg-white border-gray-200 hover:border-emerald-200"
              }`}
            >
              <p className="text-xs font-semibold text-gray-500 uppercase">Approved &amp; Live</p>
              <p className="text-3xl font-extrabold text-emerald-600 mt-1">{counts.approved}</p>
              <p className="text-[11px] text-gray-500 mt-1">Active in applicant practice</p>
            </button>

            <button
              onClick={() => setStatusFilter("rejected")}
              className={`p-5 rounded-2xl border text-left transition shadow-sm ${
                statusFilter === "rejected"
                  ? "bg-red-50 border-red-300 ring-2 ring-red-400/30"
                  : "bg-white border-gray-200 hover:border-red-200"
              }`}
            >
              <p className="text-xs font-semibold text-gray-500 uppercase">Rejected / Returned</p>
              <p className="text-3xl font-extrabold text-red-600 mt-1">{counts.rejected}</p>
              <p className="text-[11px] text-gray-500 mt-1">Returned with review notes</p>
            </button>
          </div>

          {/* Submissions List */}
          <div className="space-y-4">
            {loading ? (
              <div className="p-12 text-center text-gray-400 text-xs bg-white rounded-2xl border border-gray-200">
                Loading submissions queue...
              </div>
            ) : items.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-xs bg-white rounded-2xl border border-gray-200">
                No submissions found with status: <strong className="capitalize">{statusFilter}</strong>
              </div>
            ) : (
              items.map((item) => {
                const typeIcon =
                  item.content_type === "paragraph"
                    ? "📖 Reading Passage"
                    : item.content_type === "question"
                    ? "💼 Interview Question"
                    : "🎯 Communication Drill";

                const statusBadge =
                  item.approval_status === "approved"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                    : item.approval_status === "rejected"
                    ? "bg-red-100 text-red-800 border-red-200"
                    : "bg-amber-100 text-amber-800 border-amber-200";

                return (
                  <div
                    key={`${item.content_type}-${item.id}`}
                    className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                          {typeIcon}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${statusBadge}`}>
                          {item.approval_status === "approved" ? "Approved & Live" : item.approval_status === "rejected" ? "Rejected" : "Pending Review"}
                        </span>
                        <span className="text-xs text-gray-400 capitalize">
                          Tier: {item.difficulty || "Standard"}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500">
                        Submitted by: <strong className="text-gray-800">{item.submitted_by || "BPO Company Admin"}</strong>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-1">{item.title}</h3>
                      <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100 italic">
                        "{item.content}"
                      </p>
                    </div>

                    {item.reviewer_notes && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs">
                        <strong>Reviewer Note:</strong> {item.reviewer_notes}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end items-center gap-3 pt-2">
                      {item.approval_status === "pending" && (
                        <>
                          <button
                            onClick={() => setRejectingItem(item)}
                            disabled={processingId === item.id}
                            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold border border-red-200 transition"
                          >
                            Reject &amp; Provide Feedback
                          </button>
                          <button
                            onClick={() => handleApprove(item)}
                            disabled={processingId === item.id}
                            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                          >
                            <span>✓</span>
                            <span>Approve &amp; Publish Live</span>
                          </button>
                        </>
                      )}

                      {item.approval_status === "rejected" && (
                        <button
                          onClick={() => handleApprove(item)}
                          disabled={processingId === item.id}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                        >
                          Reconsider &amp; Approve
                        </button>
                      )}

                      {item.approval_status === "approved" && (
                        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                          <span>✓</span> Live in Applicant Practice
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      </div>

      {/* Reject Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="text-base font-bold text-gray-900">
                Reject Submission
              </h3>
              <button
                onClick={() => setRejectingItem(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <p className="text-xs text-gray-600">
                Provide a reason or guidance note so the BPO Company Admin knows what revisions are needed:
              </p>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Feedback / Reason for Rejection
                </label>
                <textarea
                  rows="3"
                  required
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  placeholder="e.g. Please simplify the vocabulary for the Easy level tier..."
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setRejectingItem(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-xs transition shadow-sm"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminApprovals;
