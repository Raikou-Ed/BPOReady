import React, { useState } from "react";
import { Link } from "react-router-dom";
import AudioRecorder from "../components/AudioRecorder";
import { submitExerciseAttempt, evaluateFillerExercise } from "../api/adminApi";
import { addUserActivity, getCurrentUser } from "../utils/userData";
import ApplicantSidebar from "../components/ApplicantSidebar";

const prompts = [
  "Good day! I have thoroughly reviewed your account records. The promotional discount of twenty dollars has now been applied to your monthly invoice, and your updated balance will be visible on your portal within the hour.",
  "I completely understand how critical your internet connectivity is for your daily remote work. Please rest assured that our technical support team is already working to restore the neighborhood node as quickly as possible.",
  "Thank you for your patience while I was confirming your flight itinerary with our partner airlines. Your seat reservation and meal preference have been successfully locked in for tomorrow morning's flight.",
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

  const handleRecorded = async (blob, durationSeconds, transcript) => {
    const text = (transcript || "").trim();
    const localMatches = text.match(fillerRegex) || [];
    const localCount = localMatches.length;
    const initialScore = text ? Math.max(40, Math.min(100, 100 - (localCount * 15))) : 0;

    const initialRecording = {
      blob,
      durationSeconds,
      transcript: text,
      fillerCount: localCount,
      fillerWords: localMatches.map((w) => w.toLowerCase()),
      score: initialScore,
      aiEvaluated: false,
    };
    setRecording(initialRecording);

    // Run AI Audio Multimodal Evaluation to hear all real filler sounds (um, ah, uh)
    setIsAnalyzing(true);
    try {
      const evalData = await evaluateFillerExercise({
        audio: blob,
        prompt_text: currentPrompt,
        transcript: text,
        duration_seconds: durationSeconds,
      });

      if (evalData && evalData.success) {
        setRecording((prev) => {
          if (!prev) return null;
          const mergedFillers = Array.from(
            new Set([...(prev.fillerWords || []), ...(evalData.fillerWords || []).map((f) => f.toLowerCase())])
          );
          return {
            ...prev,
            transcript: evalData.transcript || prev.transcript,
            fillerCount: Math.max(evalData.fillerCount ?? 0, localCount),
            fillerWords: mergedFillers,
            score: evalData.score ?? prev.score,
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
        feedback: recording.aiFeedback || (recording.score >= 85
          ? "Exceptional filler control! Your delivery was smooth and articulate."
          : `Detected ${recording.fillerCount} filler word(s). Take a conscious 1-second pause when forming thoughts instead of using fillers.`),
      });
    } catch {
      setResult({
        score: recording.score,
        fillerCount: recording.fillerCount,
        feedback: recording.aiFeedback || "Practice session completed. Aim for 0 fillers next time!",
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
          <div className="flex justify-between items-center mb-6">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
              Disfluency Reduction Drill
            </span>
            <span className="text-xs text-gray-500 font-medium">Prompt {promptIndex + 1} of {prompts.length}</span>
          </div>

          <h2 className="text-xl font-bold text-gray-800 mb-2">Practice Reading Without Fillers</h2>
          <p className="text-xs text-gray-600 mb-6">
            Read the script below out loud. Aim for 0 filler words. If you need a moment to think, use a silent pause.
          </p>

          <div className="bg-orange-50/70 border border-orange-200 rounded-xl p-6 text-gray-800 text-sm leading-relaxed mb-6 font-medium">
            "{currentPrompt}"
          </div>

          <div className="flex flex-col items-center justify-center gap-3 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <AudioRecorder
              expectedText={currentPrompt}
              onStateChange={setIsRecording}
              onRecorded={handleRecorded}
            />
            {isRecording && (
              <span className="text-xs text-red-600 font-medium animate-pulse">
                Recording your reading... Avoid "um", "ah", "like", and "actually".
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
