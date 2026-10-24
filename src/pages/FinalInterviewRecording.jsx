import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AudioRecorder from "../components/AudioRecorder";
import { getMockInterviewQuestions, submitMockInterview } from "../api/adminApi";
import { addUserActivity, getCurrentUser } from "../utils/userData";
import ApplicantSidebar from "../components/ApplicantSidebar";

const defaultFinalQuestions = [
  { id: 6, question_text: "Describe a scenario where a customer is shouting and angry. How would you de-escalate the call while staying professional?" },
  { id: 7, question_text: "How would you handle a customer whose issue cannot be immediately resolved due to company policy?" },
  { id: 8, question_text: "Tell me about a time you had a disagreement with a team member. How did you handle the situation constructively?" },
  { id: 9, question_text: "If a customer uses personal insults toward you during a difficult conversation, how do you protect your composure and maintain control of the interaction?" },
  { id: 10, question_text: "What are your professional career aspirations over the next two to three years within our BPO organization?" },
];

const FinalInterviewRecording = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState(defaultFinalQuestions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [currentRecording, setCurrentRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const currentUser = getCurrentUser() || { id: 19, name: "Applicant" };

  useEffect(() => {
    getMockInterviewQuestions("final").then((list) => {
      if (Array.isArray(list) && list.length > 0) {
        setQuestions(list);
      }
    }).catch(() => {});
  }, []);

  const currentQ = questions[currentIndex] || defaultFinalQuestions[0];

  const handleRecorded = (blob, durationSeconds, transcript, audioMetrics) => {
    setCurrentRecording({
      blob,
      durationSeconds: Math.max(1, durationSeconds),
      transcript: transcript || "Spoken response recorded successfully.",
      audioMetrics,
    });
    setError("");
  };

  const handleNextOrSubmit = async () => {
    if (!currentRecording) {
      setError("Please record your spoken answer before proceeding.");
      return;
    }

    const currentAnswerObj = {
      question_id: currentQ.id,
      question_order: currentIndex + 1,
      question_text: currentQ.question_text,
      answer_text: currentRecording.transcript,
      duration_seconds: currentRecording.durationSeconds,
    };

    const updatedAnswers = [...answers, currentAnswerObj];
    setAnswers(updatedAnswers);
    setCurrentRecording(null);
    setError("");

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setSubmitting(true);
      setError("");
      try {
        const payload = {
          applicant_id: currentUser.id || 19,
          interview_type: "final",
          answers: updatedAnswers,
        };

        const result = await submitMockInterview(payload);

        addUserActivity({
          activity: "Final Mock Interview",
          level: "Final Interview",
          result: `${result.overall_score || 88}/100`,
          type: "mock_interview",
        });

        navigate("/MockInterviewFeedback", {
          state: {
            interviewType: "Final Interview",
            result: result,
            answers: updatedAnswers,
          },
        });
      } catch (err) {
        console.warn("API submit failed, calculating local fallback result:", err);
        let totalWords = 0;
        let totalDuration = 0;
        let fillerCount = 0;
        const fillerMap = {};
        updatedAnswers.forEach((ans) => {
          const text = (ans.answer_text || '').toLowerCase();
          const words = text.match(/[a-z']+/g) || [];
          totalWords += words.length;
          totalDuration += (ans.duration_seconds || 0);
          const matches = text.match(/\b(um|uh|uhm|ah|like|you know|actually|basically)\b/g) || [];
          matches.forEach((f) => {
            fillerCount++;
            fillerMap[f] = (fillerMap[f] || 0) + 1;
          });
        });

        const avgWords = updatedAnswers.length > 0 ? (totalWords / updatedAnswers.length) : 0;
        const wpm = totalDuration > 0 ? Math.round((totalWords / totalDuration) * 60) : 120;
        const pacingScore = Math.max(20, Math.min(100, Math.round(100 - Math.abs(wpm - 135) * 1.5)));
        const fillerCleanliness = Math.max(10, Math.min(100, Math.round(100 - (fillerCount * 8))));
        const depthScore = Math.min(100, Math.max(15, Math.round((avgWords / 35) * 85)));
        const clarityScore = Math.max(15, Math.min(95, Math.round((pacingScore * 0.4) + (fillerCleanliness * 0.3) + (depthScore * 0.3))));
        const confidenceScore = Math.max(10, Math.min(95, Math.round((depthScore * 0.5) + (fillerCleanliness * 0.3) + (pacingScore * 0.2))));
        const grammarScore = Math.max(20, Math.min(95, Math.round(85 - (fillerCount * 3))));
        const answerQuality = Math.max(10, Math.min(95, Math.round((depthScore * 0.6) + (clarityScore * 0.4))));

        const overallScore = Math.round(
          (clarityScore * 0.25) +
          (confidenceScore * 0.20) +
          (pacingScore * 0.20) +
          (fillerCleanliness * 0.15) +
          (answerQuality * 0.20)
        );

        let feedbackText = "";
        let suggestions = "";
        if (overallScore < 50) {
          feedbackText = "The responses provided in this final interview lacked the required depth, de-escalation strategies, and professional composure expected in advanced BPO scenarios. Practice articulating complete solutions with empathy.";
          suggestions = "• Provide complete, detailed explanations instead of single-phrase or dismissive answers.\n• Use the STAR method to demonstrate empathy and customer problem-solving.\n• Eliminate conversational filler sounds by taking brief silent pauses.";
        } else if (overallScore < 75) {
          feedbackText = "Foundational attempt at the final mock interview. You addressed situational questions, but need greater depth in customer de-escalation and fewer hesitation sounds.";
          suggestions = "• Structure answers with clearer problem-solving milestones.\n• Practice maintaining an empathetic customer-first tone.\n• Reduce hesitation words through focused mock practice.";
        } else {
          feedbackText = "Strong situational handling. You demonstrated great empathy and calm problem resolution in your scenarios.";
          suggestions = "• Keep customer satisfaction focal points clear\n• Pause smoothly between key points\n• Reaffirm resolution commitments explicitly";
        }

        const fallbackResult = {
          overall_score: overallScore,
          feedback: {
            filler_word_count: fillerCount,
            filler_words: fillerMap,
            clarity_score: clarityScore,
            confidence_score: confidenceScore,
            pacing_score: pacingScore,
            grammar_score: grammarScore,
            answer_quality_score: answerQuality,
            feedback_text: feedbackText,
            suggestions: suggestions,
          },
          stats: { wpm, filler_count: fillerCount },
        };

        addUserActivity({
          activity: "Final Mock Interview",
          level: "Final Interview",
          result: `${overallScore}/100`,
          type: "mock_interview",
        });

        navigate("/MockInterviewFeedback", {
          state: {
            interviewType: "Final Interview",
            result: fallbackResult,
            answers: updatedAnswers,
          },
        });
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-poppins">
      <ApplicantSidebar activeItem="Mock Interview" />

      {/* Main Content */}
      <div className="flex-1 ml-64 flex items-center justify-center min-h-screen p-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 w-full max-w-2xl">
          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center text-sm font-semibold text-gray-600 mb-2">
              <span className="text-purple-600 uppercase tracking-wide">Final Interview Simulation</span>
              <span>Question {currentIndex + 1} of {questions.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Question Box */}
          <div className="bg-purple-50/60 border border-purple-100 rounded-xl p-6 text-center mb-8">
            <p className="text-xs uppercase tracking-wider text-purple-600 font-bold mb-2">Lead Interviewer Asks:</p>
            <h3 className="text-xl font-bold text-gray-800 leading-snug">
              "{currentQ.question_text}"
            </h3>
            <p className="text-xs text-gray-500 mt-3">
              Deliver your response maintaining calm composure, empathy, and professional vocabulary.
            </p>
          </div>

          {/* Audio Recorder with Live Volume & Real-time Transcription */}
          <div className="mb-6">
            <AudioRecorder
              key={currentIndex}
              onStateChange={setIsRecording}
              onRecorded={handleRecorded}
            />
          </div>

          {error && (
            <div className="mb-5 text-sm text-red-600 text-center font-medium bg-red-50 p-2.5 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {/* Next / Submit Button */}
          <button
            onClick={handleNextOrSubmit}
            disabled={submitting || isRecording}
            className="w-full py-3.5 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 shadow-md transition-all disabled:opacity-50 text-base flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Evaluating Responses...
              </>
            ) : currentIndex < questions.length - 1 ? (
              "Next Question →"
            ) : (
              "Submit Final Interview for Evaluation"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinalInterviewRecording;
