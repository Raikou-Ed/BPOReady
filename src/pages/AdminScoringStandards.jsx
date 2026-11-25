import React, { useState, useEffect } from "react";
import AdminSidebar from "../components/AdminSidebar";
import { getScoringStandards, updateScoringStandards } from "../api/adminApi";
import { getUserData, saveUserData } from "../utils/userData";
import {
  DEFAULT_READING_CRITERIA,
  DEFAULT_MOCK_INTERVIEW_CRITERIA,
} from "../utils/assessmentScoring";

const defaultStandards = [
  {
    level: "easy",
    min_score: 0,
    max_score: 75,
    description: "Applicants scoring within this range require foundational coaching on pronunciation, pacing, and filler word control.",
    target_wpm: 120,
    passing_threshold: 65,
  },
  {
    level: "medium",
    min_score: 76,
    max_score: 89,
    description: "Demonstrates competent conversational command with occasional pacing or filler slips under pressure.",
    target_wpm: 135,
    passing_threshold: 75,
  },
  {
    level: "hard",
    min_score: 90,
    max_score: 100,
    description: "Exceptional verbal fluency, native-like conversational cadence, and minimal to zero disfluencies.",
    target_wpm: 145,
    passing_threshold: 85,
  },
];

const AdminScoringStandards = () => {
  const [standards, setStandards] = useState(defaultStandards);

  // 1. Spoken Reading Criteria (Pre-Assessment & Paragraph Reading)
  const [readingCriteriaList, setReadingCriteriaList] = useState(() => {
    try {
      const saved = getUserData("bpoReadyScoringCriteria");
      if (Array.isArray(saved) && saved.length > 0) return saved;
    } catch {}
    return DEFAULT_READING_CRITERIA;
  });

  // 2. Mock Interview Criteria
  const [interviewCriteriaList, setInterviewCriteriaList] = useState(() => {
    try {
      const saved = getUserData("bpoReadyMockInterviewCriteria");
      if (Array.isArray(saved) && saved.length > 0) return saved;
    } catch {}
    return DEFAULT_MOCK_INTERVIEW_CRITERIA;
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const totalReadingWeight = readingCriteriaList.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
  const totalInterviewWeight = interviewCriteriaList.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);

  useEffect(() => {
    async function loadStandards() {
      try {
        const data = await getScoringStandards();
        if (data) {
          if (Array.isArray(data) && data.length > 0) {
            setStandards(data);
          } else if (data.standards && Array.isArray(data.standards) && data.standards.length > 0) {
            setStandards(data.standards);
          }
          if (data.readingCriteria && Array.isArray(data.readingCriteria) && data.readingCriteria.length > 0) {
            setReadingCriteriaList(data.readingCriteria);
            saveUserData("bpoReadyScoringCriteria", data.readingCriteria);
          } else if (data.criteria && Array.isArray(data.criteria) && data.criteria.length > 0) {
            setReadingCriteriaList(data.criteria);
            saveUserData("bpoReadyScoringCriteria", data.criteria);
          }
          if (data.mockInterviewCriteria && Array.isArray(data.mockInterviewCriteria) && data.mockInterviewCriteria.length > 0) {
            setInterviewCriteriaList(data.mockInterviewCriteria);
            saveUserData("bpoReadyMockInterviewCriteria", data.mockInterviewCriteria);
          }
        }
      } catch (err) {
        console.warn("Using offline scoring standards:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStandards();
  }, []);

  const handleStandardChange = (index, field, value) => {
    const updated = [...standards];
    updated[index] = {
      ...updated[index],
      [field]: field.includes("score") || field.includes("wpm") || field.includes("threshold")
        ? Number(value)
        : value,
    };
    setStandards(updated);
  };

  // Reading Criteria Handlers
  const handleReadingCriteriaChange = (index, field, value) => {
    const updated = [...readingCriteriaList];
    updated[index] = {
      ...updated[index],
      [field]: field === "weight" ? (value === "" ? "" : Number(value)) : value,
    };
    setReadingCriteriaList(updated);
  };

  const handleAddReadingCriteria = () => {
    setReadingCriteriaList([
      ...readingCriteriaList,
      {
        id: Date.now(),
        name: "New Factor",
        weight: 0,
        detail: "Describe evaluation focus and speech metrics...",
      },
    ]);
  };

  const handleRemoveReadingCriteria = (index) => {
    if (readingCriteriaList.length <= 1) {
      alert("At least one evaluation factor must be maintained for Spoken Reading.");
      return;
    }
    setReadingCriteriaList(readingCriteriaList.filter((_, idx) => idx !== index));
  };

  const handleResetReadingCriteria = () => {
    if (window.confirm("Reset Spoken Reading factors back to standard CEFR (50% Accuracy, 50% Fluency)?")) {
      setReadingCriteriaList(DEFAULT_READING_CRITERIA);
      saveUserData("bpoReadyScoringCriteria", DEFAULT_READING_CRITERIA);
    }
  };

  // Mock Interview Criteria Handlers
  const handleInterviewCriteriaChange = (index, field, value) => {
    const updated = [...interviewCriteriaList];
    updated[index] = {
      ...updated[index],
      [field]: field === "weight" ? (value === "" ? "" : Number(value)) : value,
    };
    setInterviewCriteriaList(updated);
  };

  const handleAddInterviewCriteria = () => {
    setInterviewCriteriaList([
      ...interviewCriteriaList,
      {
        id: Date.now(),
        name: "New Competency",
        weight: 0,
        detail: "Define candidate interview response evaluation standard...",
      },
    ]);
  };

  const handleRemoveInterviewCriteria = (index) => {
    if (interviewCriteriaList.length <= 1) {
      alert("At least one evaluation factor must be maintained for Mock Interview.");
      return;
    }
    setInterviewCriteriaList(interviewCriteriaList.filter((_, idx) => idx !== index));
  };

  const handleResetInterviewCriteria = () => {
    if (window.confirm("Reset Mock Interview factors back to standard CEFR Table 3 (Balanced 20% each)?")) {
      setInterviewCriteriaList(DEFAULT_MOCK_INTERVIEW_CRITERIA);
      saveUserData("bpoReadyMockInterviewCriteria", DEFAULT_MOCK_INTERVIEW_CRITERIA);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setToastMessage("");

    // Save locally first to guarantee immediate offline / client persistence
    saveUserData("bpoReadyScoringCriteria", readingCriteriaList);
    saveUserData("bpoReadyMockInterviewCriteria", interviewCriteriaList);
    saveUserData("bpoReadyScoringStandards", standards);

    try {
      await updateScoringStandards({
        standards,
        readingCriteria: readingCriteriaList,
        criteria: readingCriteriaList,
        mockInterviewCriteria: interviewCriteriaList,
      });
      setToastMessage("All scoring standards & evaluation criteria successfully updated and synced with the evaluation engine!");
    } catch {
      setToastMessage("Standards & criteria saved locally. Changes are actively reflected in the application.");
    } finally {
      setSaving(false);
      setTimeout(() => setToastMessage(""), 4500);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-poppins text-gray-900">
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-gray-200 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                  🏢 Institutional Calibration
                </span>
                <span className="text-xs text-gray-400">Institutional Benchmarks</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">
                Scoring Standards
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Configure institutional evaluation criteria, scoring factors, weight distributions, and track classification thresholds across Pre-Assessment, Paragraph Reading, and Mock Interviews.
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-sm transition flex items-center gap-2 cursor-pointer shrink-0"
            >
              {saving ? "Saving Changes..." : "Save Standards Configuration"}
            </button>
          </div>

          {toastMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2 animate-in fade-in">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>{toastMessage}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* SECTION 1: SPOKEN READING (PRE-ASSESSMENT & PARAGRAPH)   */}
          {/* ======================================================== */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-bold text-gray-900">
                    Spoken Reading Evaluation Criteria &amp; Weight Distribution
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                    Pre-Assessment &amp; Paragraph Reading
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Institutional speech evaluation factors and weight percentages applied across both Pre-Assessment and Paragraph Reading modules.
                </p>
              </div>

              {/* Total Weight Indicator & Add Factor Button */}
              <div className="flex items-center gap-2.5">
                <div
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
                    totalReadingWeight === 100
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-300"
                  }`}
                >
                  <span>{totalReadingWeight === 100 ? "✓" : "⚠️"}</span>
                  <span>Total Weight: {totalReadingWeight}%</span>
                  {totalReadingWeight !== 100 && (
                    <span className="text-[10px] font-normal">
                      ({totalReadingWeight < 100 ? `+${100 - totalReadingWeight}% needed` : `-${totalReadingWeight - 100}% excess`})
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleAddReadingCriteria}
                  className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs transition border border-blue-200 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>+ Add Factor</span>
                </button>
              </div>
            </div>

            {/* Editable Factor Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {readingCriteriaList.map((crit, idx) => (
                <div
                  key={crit.id || idx}
                  className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200 space-y-3 relative group hover:border-blue-300 transition shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Factor Name
                      </label>
                      <input
                        type="text"
                        value={crit.name}
                        onChange={(e) => handleReadingCriteriaChange(idx, "name", e.target.value)}
                        placeholder="e.g. Accuracy, Fluency, Pronunciation"
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      />
                    </div>

                    <div className="w-28">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Weight (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={crit.weight}
                          onChange={(e) => handleReadingCriteriaChange(idx, "weight", e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-extrabold text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition pr-6"
                        />
                        <span className="absolute right-2.5 top-2 text-xs font-bold text-gray-400 pointer-events-none">%</span>
                      </div>
                    </div>

                    {readingCriteriaList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveReadingCriteria(idx)}
                        title="Remove Factor"
                        className="mt-5 p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Guidance &amp; Evaluation Focus
                    </label>
                    <textarea
                      rows="2"
                      value={crit.detail || ""}
                      onChange={(e) => handleReadingCriteriaChange(idx, "detail", e.target.value)}
                      placeholder="e.g. Articulation clarity, vowel/consonant enunciation..."
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Info & Reset */}
            <div className="flex flex-wrap items-center justify-between pt-2 text-xs text-gray-500 gap-2 border-t border-gray-100">
              <span className="text-[11px] text-gray-400">
                💡 Tip: Spoken reading weights must total <strong>100%</strong> to ensure valid candidate composite scoring.
              </span>
              <button
                type="button"
                onClick={handleResetReadingCriteria}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer"
              >
                Reset to CEFR Standard (50% Accuracy, 50% Fluency)
              </button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 2: MOCK INTERVIEW EVALUATION CRITERIA & WEIGHTS  */}
          {/* ======================================================== */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-bold text-gray-900">
                    Mock Interview Evaluation Criteria &amp; Weight Distribution
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                    Mock Interview Session
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Institutional multi-factor evaluation dimensions applied to candidate conversational responses across recorded interview questions.
                </p>
              </div>

              {/* Total Weight Indicator & Add Factor Button */}
              <div className="flex items-center gap-2.5">
                <div
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
                    totalInterviewWeight === 100
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-300"
                  }`}
                >
                  <span>{totalInterviewWeight === 100 ? "✓" : "⚠️"}</span>
                  <span>Total Weight: {totalInterviewWeight}%</span>
                  {totalInterviewWeight !== 100 && (
                    <span className="text-[10px] font-normal">
                      ({totalInterviewWeight < 100 ? `+${100 - totalInterviewWeight}% needed` : `-${totalInterviewWeight - 100}% excess`})
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleAddInterviewCriteria}
                  className="px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl text-xs transition border border-purple-200 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>+ Add Factor</span>
                </button>
              </div>
            </div>

            {/* Editable Factor Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {interviewCriteriaList.map((crit, idx) => (
                <div
                  key={crit.id || idx}
                  className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200 space-y-3 relative group hover:border-purple-300 transition shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Factor Name
                      </label>
                      <input
                        type="text"
                        value={crit.name}
                        onChange={(e) => handleInterviewCriteriaChange(idx, "name", e.target.value)}
                        placeholder="e.g. Accuracy, Fluency, Range, Interaction, Coherence"
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                      />
                    </div>

                    <div className="w-28">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Weight (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={crit.weight}
                          onChange={(e) => handleInterviewCriteriaChange(idx, "weight", e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-extrabold text-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition pr-6"
                        />
                        <span className="absolute right-2.5 top-2 text-xs font-bold text-gray-400 pointer-events-none">%</span>
                      </div>
                    </div>

                    {interviewCriteriaList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveInterviewCriteria(idx)}
                        title="Remove Factor"
                        className="mt-5 p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Guidance &amp; Evaluation Focus
                    </label>
                    <textarea
                      rows="2"
                      value={crit.detail || ""}
                      onChange={(e) => handleInterviewCriteriaChange(idx, "detail", e.target.value)}
                      placeholder="e.g. Grammar, STAR method structure, conversational pace..."
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Info & Reset */}
            <div className="flex flex-wrap items-center justify-between pt-2 text-xs text-gray-500 gap-2 border-t border-gray-100">
              <span className="text-[11px] text-gray-400">
                💡 Tip: Mock Interview weights must total <strong>100%</strong> to evaluate applicant interview scores accurately.
              </span>
              <button
                type="button"
                onClick={handleResetInterviewCriteria}
                className="text-xs text-purple-600 hover:text-purple-800 font-semibold underline cursor-pointer"
              >
                Reset to Standard CEFR Table 3 (Balanced 20% each)
              </button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 3: PERFORMANCE CLASSIFICATION TRACKS             */}
          {/* ======================================================== */}
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-1">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Performance Classification Tracks
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Institutional benchmark bands and passing thresholds directing applicant advancement through Easy, Medium, and Hard tiers.
                </p>
              </div>
            </div>

            {standards.map((std, idx) => {
              const badgeColor =
                std.level === "easy"
                  ? "bg-green-100 text-green-800"
                  : std.level === "medium"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-purple-100 text-purple-800";

              return (
                <div
                  key={std.level || idx}
                  className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${badgeColor}`}>
                        {std.level} Track
                      </span>
                      <span className="text-xs text-gray-400 font-mono">
                        Classification Band: {std.min_score}% – {std.max_score}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Minimum Score (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={std.min_score}
                        onChange={(e) => handleStandardChange(idx, "min_score", e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Maximum Score (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={std.max_score}
                        onChange={(e) => handleStandardChange(idx, "max_score", e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Target Pacing (WPM)
                      </label>
                      <input
                        type="number"
                        min="60"
                        max="220"
                        value={std.target_wpm || 135}
                        onChange={(e) => handleStandardChange(idx, "target_wpm", e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Passing Threshold (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={std.passing_threshold || 75}
                        onChange={(e) => handleStandardChange(idx, "passing_threshold", e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Curriculum Guidance &amp; Evaluator Notes
                    </label>
                    <textarea
                      rows="2"
                      value={std.description || ""}
                      onChange={(e) => handleStandardChange(idx, "description", e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reference Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-xs text-blue-900 leading-relaxed shadow-sm">
            <h4 className="font-bold mb-1">Institutional Calibration Architecture:</h4>
            <p>
              Changes saved on this screen calibrate the speech engine for both <strong>Reading Assessments</strong> (Pre-Assessment and Paragraph Reading) and <strong>Conversational Mock Interviews</strong>. Applicant performance is continuously measured against your customized weights and metrics to assign tracks and unlock certification eligibility.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminScoringStandards;
