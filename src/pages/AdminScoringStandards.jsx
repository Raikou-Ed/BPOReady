import React, { useState, useEffect } from "react";
import AdminSidebar from "../components/AdminSidebar";
import { getScoringStandards, updateScoringStandards } from "../api/adminApi";
import { getUserData, saveUserData } from "../utils/userData";
import { DEFAULT_READING_CRITERIA, getActiveEvaluationCriteria } from "../utils/assessmentScoring";

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
  const [criteriaList, setCriteriaList] = useState(() => {
    try {
      const saved = getUserData("bpoReadyScoringCriteria");
      if (Array.isArray(saved) && saved.length > 0) return saved;
    } catch {}
    return [
      {
        id: 1,
        name: "Accuracy",
        weight: 50,
        detail: "Vowel/consonant enunciation, acoustic clarity, syllable stress intelligibility, and phonetic precision.",
      },
      {
        id: 2,
        name: "Fluency",
        weight: 50,
        detail: "Speech rhythm, optimal cadence (115–145 WPM), natural flow, and continuous delivery without unnatural pauses.",
      },
    ];
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const totalWeight = criteriaList.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);

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
          if (data.criteria && Array.isArray(data.criteria) && data.criteria.length > 0) {
            setCriteriaList(data.criteria);
            saveUserData("bpoReadyScoringCriteria", data.criteria);
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

  const handleChange = (index, field, value) => {
    const updated = [...standards];
    updated[index] = {
      ...updated[index],
      [field]: field.includes("score") || field.includes("wpm") || field.includes("threshold")
        ? Number(value)
        : value,
    };
    setStandards(updated);
  };

  const handleCriteriaChange = (index, field, value) => {
    const updated = [...criteriaList];
    updated[index] = {
      ...updated[index],
      [field]: field === "weight" ? (value === "" ? "" : Number(value)) : value,
    };
    setCriteriaList(updated);
  };

  const handleAddCriteria = () => {
    setCriteriaList([
      ...criteriaList,
      {
        id: Date.now(),
        name: "New Factor",
        weight: 0,
        detail: "Describe evaluation focus and speech metrics...",
      },
    ]);
  };

  const handleRemoveCriteria = (index) => {
    if (criteriaList.length <= 1) {
      alert("At least one evaluation factor must be maintained.");
      return;
    }
    setCriteriaList(criteriaList.filter((_, idx) => idx !== index));
  };

  const handleResetCriteria = () => {
    if (window.confirm("Reset evaluation factors back to standard CEFR (50% Accuracy, 50% Fluency)?")) {
      const reset = [
        {
          id: 1,
          name: "Accuracy",
          weight: 50,
          detail: "Vowel/consonant enunciation, acoustic clarity, syllable stress intelligibility, and phonetic precision.",
        },
        {
          id: 2,
          name: "Fluency",
          weight: 50,
          detail: "Speech rhythm, optimal cadence (115–145 WPM), natural flow, and continuous delivery without unnatural pauses.",
        },
      ];
      setCriteriaList(reset);
      saveUserData("bpoReadyScoringCriteria", reset);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setToastMessage("");

    // Save locally first to guarantee immediate offline / client persistence
    saveUserData("bpoReadyScoringCriteria", criteriaList);
    saveUserData("bpoReadyScoringStandards", standards);

    try {
      await updateScoringStandards({ standards, criteria: criteriaList });
      setToastMessage("Scoring standards & evaluation criteria successfully updated and synced with the evaluation engine!");
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
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-gray-200 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                  🏢 Institutional Calibration
                </span>
                <span className="text-xs text-gray-400">Benchmarks</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">
                Scoring Standards
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Configure institutional evaluation criteria, scoring factors, weight distributions, and track classification thresholds for Pre-Assessment and Paragraph Reading.
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-sm transition flex items-center gap-2 cursor-pointer"
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

          {/* Evaluation Criteria Distribution (Pre-Assessment & Paragraph Reading) */}
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
                    totalWeight === 100
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-300"
                  }`}
                >
                  <span>{totalWeight === 100 ? "✓" : "⚠️"}</span>
                  <span>Total Weight: {totalWeight}%</span>
                  {totalWeight !== 100 && (
                    <span className="text-[10px] font-normal">
                      ({totalWeight < 100 ? `+${100 - totalWeight}% needed` : `-${totalWeight - 100}% excess`})
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleAddCriteria}
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
              {criteriaList.map((crit, idx) => (
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
                        onChange={(e) => handleCriteriaChange(idx, "name", e.target.value)}
                        placeholder="e.g. Accuracy, Fluency, Range"
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
                          onChange={(e) => handleCriteriaChange(idx, "weight", e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-extrabold text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition pr-6"
                        />
                        <span className="absolute right-2.5 top-2 text-xs font-bold text-gray-400 pointer-events-none">%</span>
                      </div>
                    </div>

                    {criteriaList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCriteria(idx)}
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
                      onChange={(e) => handleCriteriaChange(idx, "detail", e.target.value)}
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
                💡 Tip: All evaluation factor weights should total <strong>100%</strong> to ensure valid candidate composite scoring.
              </span>
              <button
                type="button"
                onClick={handleResetCriteria}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer"
              >
                Reset to CEFR Standard (50% Accuracy, 50% Fluency)
              </button>
            </div>
          </div>

          {/* Standards Cards */}
          <div className="space-y-5">
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
                        onChange={(e) => handleChange(idx, "min_score", e.target.value)}
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
                        onChange={(e) => handleChange(idx, "max_score", e.target.value)}
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
                        onChange={(e) => handleChange(idx, "target_wpm", e.target.value)}
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
                        onChange={(e) => handleChange(idx, "passing_threshold", e.target.value)}
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
                      onChange={(e) => handleChange(idx, "description", e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reference Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-xs text-blue-900 leading-relaxed shadow-sm">
            <h4 className="font-bold mb-1">Evaluation Calibration Logic:</h4>
            <p>
              When an applicant records their speech sample in <strong>Pre-Assessment</strong> or <strong>Paragraph Reading</strong>, the evaluation engine evaluates speech metrics against these active institutional criteria and weights. Scores matching the <strong>Easy</strong> tier direct candidates to foundational speech drills, while <strong>Hard</strong> tier unlocks advanced interview simulations.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminScoringStandards;
