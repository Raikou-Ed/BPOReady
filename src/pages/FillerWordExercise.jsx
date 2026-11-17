import React, { useState } from "react";
import { Link } from "react-router-dom";
import AudioRecorder from "../components/AudioRecorder";
import { submitExerciseAttempt, evaluateFillerExercise } from "../api/adminApi";
import { addUserActivity, getCurrentUser } from "../utils/userData";
import ApplicantSidebar from "../components/ApplicantSidebar";

const prompts = [
  {
    title: "Billing Dispute: Unexpected Late Fee",
    customer: "Frustrated Subscriber",
    situation: "A customer calls furiously demanding to know why their monthly internet invoice has an unexpected $25 fee when they always pay on time.",
    objectives: [
      "Acknowledge and empathize with their frustration immediately.",
      "Explain calmly that you verified their records and confirmed their on-time payment.",
      "Reassure them that the $25 fee is being waived and credited immediately.",
      "Confirm their updated balance and ask if there is anything else they need.",
    ],
    hint: "Avoid 'um' or 'ah' when checking records. Take a 1-second silent pause instead.",
    promptText: "Customer dispute regarding unexpected $25 fee. Agent must empathize, verify on-time payment, waive fee, and confirm updated balance.",
  },
  {
    title: "Service Outage: Urgent Remote Work",
    customer: "Panicked Remote Worker",
    situation: "A customer calls in a panic because their home fiber internet suddenly disconnected 15 minutes before an executive video presentation.",
    objectives: [
      "Acknowledge how critical an uninterrupted connection is for their remote work.",
      "Explain that a neighborhood cable was severed and technicians are on-site repairing it.",
      "Provide an estimated restoration time of 2 hours.",
      "Offer to provision complimentary emergency cellular hotspot data as a backup.",
    ],
    hint: "Don't use crutch words like 'actually' or 'basically'. Maintain a steady, reassuring tone.",
    promptText: "Customer fiber internet outage before important meeting. Agent must validate urgency, explain technical repair, provide 2-hour ETA, and offer backup hotspot data.",
  },
  {
    title: "Travel Disruption: Flight Delay & Meal Voucher",
    customer: "Stranded Airport Passenger",
    situation: "A passenger at the terminal is visibly anxious because their connecting flight was delayed by 3 hours due to severe weather along the flight corridor.",
    objectives: [
      "Warmly apologize for the delay and validate their travel inconvenience.",
      "Explain that extreme thunderstorms along the flight path require a temporary safety hold.",
      "Provide their updated boarding time and departure gate number.",
      "Issue a complimentary $25 airport food & beverage digital voucher to their phone.",
    ],
    hint: "Take a deep breath before stating departure details. Never use 'like' or 'you know'.",
    promptText: "Passenger connecting flight delayed 3 hours due to weather. Agent must apologize, explain flight safety, provide new boarding time and gate, and issue $25 meal voucher.",
  },
];

const FILLER_LIST = [
  "um", "umm", "ummm",
  "uh", "uhh", "uhhh",
  "uhm", "uhmm",
  "ah", "ahh", "ahhh",
  "er", "erm",
  "hmm", "hmmm", "mhm",
  "like",
  "actually",
  "basically",
  "literally",
  "honestly",
  "you know",
  "i mean",
];

const fillerRegex = /\b(um+|uh+|uhm+|ah+|ahh+|er+|erm+|hmm+|mhm|like|you\s+know|actually|basically|literally|honestly|i\s+mean)\b/gi;

const FillerWordExercise = () => {
  const [promptIndex, setPromptIndex] = useState(0);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const currentUser = getCurrentUser() || { id: 19, name: "Applicant" };
  const currentPrompt = prompts[promptIndex];

  const handleRecorded = async (blob, durationSeconds, transcript, audioMetrics) => {
    const text = (transcript || "").trim();
    const spokenTokens = text.split(/\s+/).filter(Boolean).filter((w) => !w.startsWith("[") && !w.toLowerCase().includes("silence"));

    if (spokenTokens.length < 2) {
      const zeroRecording = {
        blob,
        durationSeconds,
        transcript: text || "[No audible speech detected / Silence]",
        fillerCount: 0,
        fillerWords: [],
        score: 0,
        aiFeedback: "No audible speech detected during your recording. To practice filler word reduction, please speak the prompt clearly into your microphone.",
        aiEvaluated: false,
      };
      setRecording(zeroRecording);
      return;
    }

    const liveFillers = audioMetrics?.detectedFillers || [];
    const localMatches = text.match(fillerRegex) || [];
    const combinedFillers = Array.from(new Set([
      ...localMatches.map((w) => w.toLowerCase()),
      ...liveFillers.map((w) => w.toLowerCase()),
    ]));
    const localCount = Math.max(localMatches.length, liveFillers.length);
    const initialScore = Math.max(35, Math.min(100, 100 - (localCount * 15)));

    const initialRecording = {
      blob,
      durationSeconds,
      transcript: text,
      fillerCount: localCount,
      fillerWords: combinedFillers,
      score: initialScore,
      aiEvaluated: false,
    };
    setRecording(initialRecording);

    // Run AI Audio Multimodal Evaluation to hear all real filler sounds (um, ah, uh)
    setIsAnalyzing(true);
    try {
      const evalData = await evaluateFillerExercise({
        audio: blob,
        prompt_text: currentPrompt.promptText || currentPrompt.situation,
        transcript: text,
        duration_seconds: durationSeconds,
        client_fillers: combinedFillers,
      });

      if (evalData && evalData.success) {
        setRecording((prev) => {
          if (!prev) return null;
          const mergedFillers = Array.from(
            new Set([
              ...(prev.fillerWords || []),
              ...(evalData.fillerWords || []).map((f) => f.toLowerCase()),
            ])
          );
          const finalCount = Math.max(
            evalData.fillerCount ?? 0,
            mergedFillers.length,
            localCount
          );
          const finalScore = evalData.score != null
            ? Math.min(evalData.score, prev.score)
            : Math.max(30, 100 - (finalCount * 15));

          return {
            ...prev,
            transcript: evalData.transcript || prev.transcript,
            fillerCount: finalCount,
            fillerWords: mergedFillers,
            score: finalScore,
            aiFeedback: evalData.feedback,
            aiEvaluated: evalData.aiEvaluated ?? true,
          };
        });
      }
    } catch (err) {
      console.warn("AI filler evaluation fallback:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    if (!recording) return;
    setSubmitting(true);
    try {
      await submitExerciseAttempt({
        applicant_id: currentUser.id || 19,
        exercise_id: 1,
        response_text: recording.transcript,
        duration_seconds: recording.durationSeconds,
        filler_count: recording.fillerCount,
        calculated_score: recording.score,
      });

      addUserActivity({
        activity: "Filler Word Elimination",
        level: "Communication Exercise",
        result: `${recording.score}/100`,
        type: "exercise",
      });

      setResult({
        score: recording.score,
        fillerCount: recording.fillerCount,
        feedback: recording.score === 0
          ? "No audible speech detected during your recording. Please ensure your microphone is enabled and speak clearly."
          : (recording.aiFeedback || (recording.score >= 85
              ? "Exceptional filler control! Your delivery was smooth and articulate."
              : `Detected ${recording.fillerCount} filler word(s). Take a conscious 1-second pause when forming thoughts instead of using fillers.`)),
      });
    } catch {
      setResult({
        score: recording.score,
        fillerCount: recording.fillerCount,
        feedback: recording.score === 0
          ? "No audible speech detected during your recording. Please speak clearly to practice filler reduction."
          : (recording.aiFeedback || "Practice session completed. Aim for 0 fillers next time!"),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const highlightTranscript = (text, detectedFillers = []) => {
    if (!text || !text.trim()) {
      return <span className="text-gray-400 italic">No speech captured yet.</span>;
    }

    const fillerSet = new Set([
      ...FILLER_LIST,
      ...(detectedFillers || []).map((f) => f.toLowerCase().trim()),
    ]);

    const pattern = new RegExp(
      `\\b(${[...fillerSet].map((w) => w.replace(/\s+/g, "\\s+")).join("|")})\\b`,
      "gi"
    );

    const parts = text.split(pattern);
    return parts.map((part, i) => {
      const clean = part.toLowerCase().trim();
      if (fillerSet.has(clean)) {
        return (
          <mark
            key={i}
            className="bg-red-100 text-red-800 border border-red-300 font-bold px-1.5 py-0.5 rounded-md mx-0.5 inline-block shadow-xs"
          >
            ⚠️ {part}
          </mark>
        );
      }
      return part;
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-poppins">
      <ApplicantSidebar activeItem="Exercises" />

      {/* Main Content */}
      <div className="flex-1 ml-64 p-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 w-full max-w-2xl">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              Impromptu BPO Scenario Drill
            </span>
            <span className="text-xs text-gray-500 font-medium">Scenario {promptIndex + 1} of {prompts.length}</span>
          </div>

          <h2 className="text-2xl font-extrabold text-gray-900 mb-1">{currentPrompt.title}</h2>
          <p className="text-xs text-gray-600 mb-5 leading-relaxed">
            Respond spontaneously to the caller in your own words. Because you must formulate your response on the spot, train your brain to <strong>use a 1-second silent pause</strong> when thinking instead of saying <em>"um"</em>, <em>"ah"</em>, or <em>"like"</em>.
          </p>

          {/* Scenario Situation Card */}
          <div className="bg-gradient-to-br from-amber-50/90 to-orange-50/70 border border-orange-200 rounded-2xl p-5 mb-5 shadow-xs">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-orange-200/70">
              <span className="text-xs font-bold text-orange-950 uppercase tracking-wider flex items-center gap-1.5">
                <span>📞</span> Customer Situation
              </span>
              <span className="text-[11px] font-semibold bg-white/80 border border-orange-200 px-2.5 py-0.5 rounded-full text-orange-800">
                {currentPrompt.customer}
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-900 leading-relaxed mb-3">
              "{currentPrompt.situation}"
            </p>

            <div className="bg-white/80 rounded-xl p-3.5 border border-orange-200/60">
              <span className="text-[11px] font-bold text-orange-900 uppercase tracking-wider block mb-1.5">
                🎯 Key Points to Cover (Speak Naturally):
              </span>
              <ul className="text-xs text-gray-700 space-y-1 pl-4 list-disc font-medium">
                {currentPrompt.objectives.map((obj, i) => (
                  <li key={i}>{obj}</li>
                ))}
              </ul>
            </div>

            <div className="mt-3 flex items-center gap-2 text-[11px] text-amber-800 font-medium bg-amber-100/60 px-3 py-1.5 rounded-lg border border-amber-200/50">
              <span>💡</span>
              <span><strong>Coach Tip:</strong> {currentPrompt.hint}</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-3 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <AudioRecorder
              expectedText={currentPrompt.promptText}
              onStateChange={setIsRecording}
              onRecorded={handleRecorded}
            />
            {isRecording && (
              <span className="text-xs text-red-600 font-semibold animate-pulse flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                Recording your spontaneous response... Take silent pauses when thinking!
              </span>
            )}
          </div>

          {recording && (
            <div className="space-y-4 mb-6">
              {/* Spoken Transcript Card */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-800">Your Spoken Transcript:</p>
                  {isAnalyzing ? (
                    <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-1.5 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                      AI verifying audio for "um" &amp; "ah"...
                    </span>
                  ) : recording.aiEvaluated ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      ✓ AI Audio Analyzed
                    </span>
                  ) : null}
                </div>
                <p className="leading-relaxed text-sm text-gray-800">
                  {highlightTranscript(recording.transcript, recording.fillerWords)}
                </p>
              </div>

              {/* Detected Filler Details */}
              <div className="flex items-center justify-between p-4 bg-orange-50/60 rounded-xl border border-orange-200 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Fillers Detected:</p>
                  <p className={`text-xl font-bold ${recording.fillerCount > 0 ? "text-red-600" : "text-emerald-700"}`}>
                    {recording.fillerCount}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Estimated Fluency:</p>
                  <p className="text-xl font-bold text-blue-700">{recording.score}%</p>
                </div>
              </div>

              {/* Specific Detected Words Pill Tags */}
              {recording.fillerWords && recording.fillerWords.length > 0 && (
                <div className="p-3 bg-red-50/70 border border-red-200 rounded-xl text-xs">
                  <span className="font-semibold text-red-800 block mb-1.5">Detected Disfluencies:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {recording.fillerWords.map((word, idx) => (
                      <span key={idx} className="bg-red-200 text-red-800 px-2 py-0.5 rounded-md font-bold text-[11px]">
                        "{word}"
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Coaching Commentary */}
              {recording.aiFeedback && (
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed font-medium">
                  <span className="font-bold text-blue-800 block mb-0.5">💡 AI Speech Coach Feedback:</span>
                  {recording.aiFeedback}
                </div>
              )}
            </div>
          )}

          {result && (
            <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-sm text-green-900">
              <p className="font-bold mb-1">Drill Completed! Score: {result.score}/100</p>
              <p className="text-xs">{result.feedback}</p>
            </div>
          )}

          <div className="flex gap-3">
            {!result ? (
              <button
                onClick={handleSubmit}
                disabled={!recording || submitting || isAnalyzing}
                className="flex-1 py-3 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 shadow-md transition-all disabled:opacity-50 text-sm"
              >
                {submitting ? "Submitting..." : isAnalyzing ? "Analyzing Audio..." : "Submit Drill Result"}
              </button>
            ) : (
              <button
                onClick={() => {
                  setRecording(null);
                  setResult(null);
                  setPromptIndex((promptIndex + 1) % prompts.length);
                }}
                className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-md transition-all text-sm"
              >
                Next Drill Prompt →
              </button>
            )}

            <Link to="/communication-exercises" className="py-3 px-5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 flex items-center justify-center">
              Menu
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FillerWordExercise;
