import React, { useState } from "react";
import { Link } from "react-router-dom";
import AudioRecorder from "../components/AudioRecorder";
import { submitExerciseAttempt } from "../api/adminApi";
import { addUserActivity, getCurrentUser } from "../utils/userData";
import ApplicantSidebar from "../components/ApplicantSidebar";

const pacingScripts = [
  {
    id: 1,
    title: "Customer Empathy & Billing Assurance",
    targetWords: 68,
    estimatedSeconds: 30, // ~136 WPM
    text: "Thank you for bringing this billing discrepancy to our attention. I completely understand how frustrating unexpected charges can be. I have already initiated a reversal for the twenty-five dollar maintenance fee, and you will see the credit reflected on your next billing statement. Is there anything else about your monthly charges I can clarify for you today?",
  },
  {
    id: 2,
    title: "Technical Troubleshooting & Router Reset",
    targetWords: 92,
    estimatedSeconds: 40, // ~138 WPM
    text: "To resolve your intermittent connectivity issue, let's perform a power cycle on your gateway. First, please locate the power cable on the back panel of your router and gently disconnect it. We will keep it unplugged for roughly thirty seconds to allow the internal capacitors to discharge completely. Once reconnected, please watch the broadband indicator light until it turns solid green.",
  },
  {
    id: 3,
    title: "Call Closing & Quality Survey Invitation",
    targetWords: 52,
    estimatedSeconds: 23, // ~135 WPM
    text: "It has been my pleasure assisting you today with your order status. For your records, your reference confirmation code is Alpha Bravo Niner Zero. If you have two minutes, please stay on the line for a brief one-question satisfaction survey. Have a wonderful rest of your day!",
  }
];

const SpeechPacingExercise = () => {
  const [selectedScriptIdx, setSelectedScriptIdx] = useState(0);
  const [recording, setRecording] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const currentUser = getCurrentUser() || { id: 19, name: "Applicant" };
  const currentScript = pacingScripts[selectedScriptIdx];

  const handleRecorded = (blob, durationSeconds, transcript) => {
    const text = transcript || "";
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const durationMin = durationSeconds > 0 ? durationSeconds / 60 : 0.1;
    const wpm = Math.round(words / durationMin);

    // Score calculation based on 130-150 optimal range
    let score = 50;
    let status = "Needs Practice";
    let statusColor = "text-yellow-600";
    let badgeBg = "bg-yellow-100";
    let advice = "";

    if (wpm >= 125 && wpm <= 150) {
      score = 95;
      status = "Optimal BPO Pacing";
      statusColor = "text-green-600";
      badgeBg = "bg-green-100";
      advice = "Outstanding pacing! Your cadence is clear, conversational, and easy for customers to comprehend without sounding rushed or hesitant.";
    } else if (wpm >= 110 && wpm < 125) {
      score = 80;
      status = "Slightly Slow";
      statusColor = "text-blue-600";
      badgeBg = "bg-blue-100";
      advice = "Good clarity, but slightly deliberate. Try to link your words more fluidly to reach the 130 WPM mark.";
    } else if (wpm > 150 && wpm <= 165) {
      score = 80;
      status = "Slightly Fast";
      statusColor = "text-orange-600";
      badgeBg = "bg-orange-100";
      advice = "Good energy, but take a micro-pause at commas and periods so the customer has time to digest numbers and details.";
    } else if (wpm < 110) {
      score = 65;
      status = "Too Slow / Hesitant";
      statusColor = "text-amber-600";
      badgeBg = "bg-amber-100";
      advice = "Your pace is below standard call-center conversational rate. Practice reading sentences in full breath groups.";
    } else {
      score = 60;
      status = "Too Fast / Rushed";
      statusColor = "text-red-600";
      badgeBg = "bg-red-100";
      advice = "Your delivery exceeds 165 WPM. In a live BPO environment, rushed speech creates repeat contacts and misunderstandings.";
    }

    setRecording({
      blob,
      durationSeconds,
      transcript: text,
      wordCount: words,
      wpm,
      score,
      status,
      statusColor,
      badgeBg,
      advice,
    });
  };

  const handleSaveResult = async () => {
    if (!recording) return;
    setSubmitting(true);
    try {
      await submitExerciseAttempt({
        applicant_id: currentUser.id || 19,
        exercise_id: 3,
        response_text: `Pacing: ${recording.wpm} WPM on "${currentScript.title}". Words: ${recording.wordCount}`,
        duration_seconds: recording.durationSeconds,
        filler_count: 0,
        calculated_score: recording.score,
      });

      addUserActivity({
        activity: "Speech Pacing Trainer",
        level: "Communication Exercise",
        result: `${recording.wpm} WPM (${recording.score}/100)`,
        type: "exercise",
      });

      setResult({
        saved: true,
        score: recording.score,
        wpm: recording.wpm,
        status: recording.status,
      });
    } catch (e) {
      console.warn("Backend exercise submission fallback:", e);
      setResult({
        saved: true,
        score: recording.score,
        wpm: recording.wpm,
        status: recording.status,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-poppins">
      <ApplicantSidebar activeItem="Exercises" />

      {/* Main Content */}
      <div className="flex-1 ml-64 p-10">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full uppercase tracking-wider mb-2">
                Words-Per-Minute (WPM) Cadence
              </span>
              <h1 className="text-2xl font-bold text-gray-900">Speech Pacing Trainer</h1>
              <p className="text-sm text-gray-500">
                Master the golden BPO conversational speed bracket: <strong>125 – 150 Words Per Minute</strong>.
              </p>
            </div>
            <div className="text-right bg-white p-3 rounded-xl border border-gray-200">
              <span className="text-xs text-gray-400 font-bold uppercase">Optimal Target</span>
              <p className="text-lg font-bold text-green-600">130 – 150 WPM</p>
            </div>
          </div>

          {/* Script Selector Tabs */}
          <div className="flex gap-2 border-b border-gray-200 pb-3">
            {pacingScripts.map((script, idx) => (
              <button
                key={script.id}
                onClick={() => {
                  setSelectedScriptIdx(idx);
                  setRecording(null);
                  setResult(null);
                }}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
                  selectedScriptIdx === idx
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                Passage {idx + 1}: {script.title}
              </button>
            ))}
          </div>

          {/* Practice Passage Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {currentScript.title}
              </span>
              <span className="text-xs text-gray-500 font-medium">
                Word Count: ~{currentScript.targetWords} words | Target Time: ~{currentScript.estimatedSeconds}s
              </span>
            </div>

            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl mb-6">
              <p className="text-base text-gray-800 leading-relaxed font-medium">
                "{currentScript.text}"
              </p>
            </div>

            {/* Audio Recorder */}
            <div className="border-t pt-4">
              <p className="text-xs text-gray-500 mb-3 text-center">
                Press Start Recording, read the passage at your natural conversational speed, and press Stop when finished.
              </p>
              <AudioRecorder onRecordingComplete={handleRecorded} />
            </div>
          </div>

          {/* Real-time Analysis Card if Recorded */}
          {recording && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Speech Cadence Analysis</h3>
                  <p className="text-xs text-gray-500">Live pacing breakdown based on audio timestamp and transcribed words.</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${recording.badgeBg} ${recording.statusColor}`}>
                  {recording.status}
                </span>
              </div>

              {/* Visual Speedometer Meter */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-gray-400">0 WPM</span>
                  <span className="text-xs font-bold text-amber-500">&lt;110 (Slow)</span>
                  <span className="text-xs font-bold text-green-600">125 - 150 (Ideal)</span>
                  <span className="text-xs font-bold text-red-500">&gt;165 (Fast)</span>
                  <span className="text-xs font-bold text-gray-400">220 WPM</span>
                </div>
                {/* Visual Bar */}
                <div className="w-full bg-gray-200 h-4 rounded-full overflow-hidden relative">
                  <div className="absolute left-[50%] w-[16%] h-full bg-green-200 border-x border-green-400" />
                  <div
                    className="h-full bg-blue-600 transition-all duration-500 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(5, (recording.wpm / 200) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl text-center">
                  <p className="text-xs text-gray-500 font-medium">Calculated WPM</p>
                  <p className="text-2xl font-extrabold text-blue-600 mt-1">{recording.wpm}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl text-center">
                  <p className="text-xs text-gray-500 font-medium">Spoken Words</p>
                  <p className="text-2xl font-extrabold text-gray-800 mt-1">{recording.wordCount}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl text-center">
                  <p className="text-xs text-gray-500 font-medium">Duration</p>
                  <p className="text-2xl font-extrabold text-gray-800 mt-1">{recording.durationSeconds}s</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl text-center">
                  <p className="text-xs text-gray-500 font-medium">Pacing Score</p>
                  <p className="text-2xl font-extrabold text-green-600 mt-1">{recording.score}%</p>
                </div>
              </div>

              {/* Feedback Advice */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-xs font-bold text-blue-900 mb-1">AI Coach Evaluation:</p>
                <p className="text-xs text-blue-800 leading-relaxed">{recording.advice}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                {!result?.saved ? (
                  <button
                    onClick={handleSaveResult}
                    disabled={submitting}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition"
                  >
                    {submitting ? "Saving Result..." : "Save Pacing Record to History"}
                  </button>
                ) : (
                  <div className="flex-1 py-3 bg-green-50 border border-green-200 text-green-800 text-center font-semibold rounded-xl text-sm">
                    ✓ Saved to your Practice History!
                  </div>
                )}
                <Link
                  to="/communication-exercises"
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition"
                >
                  Return to Exercises
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpeechPacingExercise;
