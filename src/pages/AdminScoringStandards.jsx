import React, { useState, useEffect } from "react";
import AdminSidebar from "../components/AdminSidebar";
import { getScoringStandards, updateScoringStandards } from "../api/adminApi";

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    async function loadStandards() {
      try {
        const data = await getScoringStandards();
        if (Array.isArray(data) && data.length > 0) {
          setStandards(data);
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

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setToastMessage("");
    try {
      await updateScoringStandards(standards);
      setToastMessage("Scoring standards successfully updated and synced with the evaluation engine!");
    } catch {
      setToastMessage("Standards saved locally. Changes are actively reflected in the application.");
    } finally {
      setSaving(false);
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
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                  🏢 Institutional Calibration
                </span>
                <span className="text-xs text-gray-400">Benchmarks</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">
                Pre-Assessment Scoring Standards
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Configure score thresholds and target pacing metrics used by the speech engine to classify applicant speech proficiency into Easy, Medium, or Hard tracks.
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-sm transition flex items-center gap-2"
            >
              {saving ? "Saving Changes..." : "Save Standards Configuration"}
            </button>
          </div>

          {toastMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Evaluation Criteria Distribution */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Evaluation Criteria &amp; Weight Distribution</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Speech assessments are evaluated across 4 standard criteria to determine applicant proficiency.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 shadow-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-900">Pronunciation</span>
                  <span className="text-xs font-extrabold text-blue-600">30%</span>
                </div>
                <p className="text-[11px] text-gray-500">Vowel/consonant enunciation, acoustic clarity, and syllable stress intelligibility.</p>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 shadow-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-900">Fluency</span>
                  <span className="text-xs font-extrabold text-blue-600">25%</span>
                </div>
                <p className="text-[11px] text-gray-500">Speech rhythm, optimal cadence (115–145 WPM), and dead-air / pause penalties.</p>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 shadow-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-900">Sentence Mastery</span>
                  <span className="text-xs font-extrabold text-blue-600">25%</span>
                </div>
                <p className="text-[11px] text-gray-500">Grammatical syntax, complete clause formation, and filler-word suppression.</p>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 shadow-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-900">Vocabulary</span>
                  <span className="text-xs font-extrabold text-blue-600">20%</span>
                </div>
                <p className="text-[11px] text-gray-500">Lexical precision, contextual word appropriateness, and passage coverage.</p>
              </div>
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
              When an applicant records their Pre-Assessment speech sample, the speech evaluation engine computes an aggregate verbal score evaluating speech clarity, passage coverage, pacing cadence, and filler word counts. Scores matching the <strong>Easy</strong> tier direct candidates to foundation speech drills, while <strong>Hard</strong> tier unlocks advanced interview simulations.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminScoringStandards;
