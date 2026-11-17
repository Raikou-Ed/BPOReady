import React from "react";
import { Link } from "react-router-dom";

/**
 * Maps Gemini AI improvement tips / feedback text to targeted communication drills.
 *
 * Categories:
 * 1. Grammar & Sentence Structure -> /grammar-exercise
 * 2. Filler Words & Disfluencies   -> /filler-word-exercise
 * 3. Speech Pacing & Cadence       -> /speech-pacing-exercise
 */
export const getExerciseForTip = (text) => {
  if (!text || typeof text !== "string") return null;
  const lower = text.toLowerCase();

  // 1. Grammar & Sentence Construction
  if (
    lower.includes("grammar") ||
    lower.includes("sentence") ||
    lower.includes("verb") ||
    lower.includes("tense") ||
    lower.includes("syntax") ||
    lower.includes("diction") ||
    lower.includes("phrasing") ||
    lower.includes("subject-verb") ||
    lower.includes("structure") ||
    lower.includes("preposition") ||
    lower.includes("vocabulary")
  ) {
    return {
      title: "Grammar Correction Drill",
      label: "Practice Grammar Drill",
      path: "/grammar-exercise",
      icon: "✍️",
      btnClass: "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200",
    };
  }

  // 2. Filler Words, Hesitations, Disfluencies
  if (
    lower.includes("filler") ||
    lower.includes("disfluenc") ||
    lower.includes("hesitat") ||
    lower.includes("um") ||
    lower.includes("uh") ||
    lower.includes("ah") ||
    lower.includes("like") ||
    lower.includes("pause") ||
    lower.includes("pausing")
  ) {
    return {
      title: "Filler Word Elimination",
      label: "Practice Filler Reduction",
      path: "/filler-word-exercise",
      icon: "🎯",
      btnClass: "bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200",
    };
  }

  // 3. Speech Pacing, Speed, WPM, Cadence
  if (
    lower.includes("pace") ||
    lower.includes("pacing") ||
    lower.includes("speed") ||
    lower.includes("fast") ||
    lower.includes("slow") ||
    lower.includes("rushed") ||
    lower.includes("cadence") ||
    lower.includes("wpm") ||
    lower.includes("breath") ||
    lower.includes("tempo")
  ) {
    return {
      title: "Speech Pacing Trainer",
      label: "Practice Speech Pacing",
      path: "/speech-pacing-exercise",
      icon: "⏱️",
      btnClass: "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200",
    };
  }

  return null;
};

/**
 * Clean UI badge inserted directly under a targeted AI recommendation tip.
 */
export const SuggestedExerciseBadge = ({ tipText }) => {
  const match = getExerciseForTip(tipText);
  if (!match) return null;

  return (
    <div className="mt-2.5 pt-2 border-t border-amber-200/60 flex items-center justify-between gap-2">
      <span className="text-[11px] font-semibold text-gray-500">
        AI Recommended Drill:
      </span>
      <Link
        to={match.path}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition shadow-xs ${match.btnClass}`}
      >
        <span>{match.icon}</span>
        <span>{match.label}</span>
        <span>→</span>
      </Link>
    </div>
  );
};
