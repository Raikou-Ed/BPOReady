import React, { useState } from "react";
import { Link } from "react-router-dom";
import AudioRecorder from "../components/AudioRecorder";
import { submitExerciseAttempt } from "../api/adminApi";
import { addUserActivity, getCurrentUser } from "../utils/userData";
import ApplicantSidebar from "../components/ApplicantSidebar";

const grammarQuestions = [
  {
    id: 1,
    category: "Subject-Verb Agreement",
    scenario: "Customer is asking about the current status of their multiple pending orders.",
    incorrectSentence: "Each of your two packages are scheduled to arrive tomorrow morning.",
    correctSentence: "Each of your two packages is scheduled to arrive tomorrow morning.",
    options: [
      "Each of your two packages are scheduled to arrive tomorrow morning.",
      "Each of your two packages is scheduled to arrive tomorrow morning.",
      "Each of your two packages were scheduled to arrive tomorrow morning.",
      "Each of your two packages being scheduled to arrive tomorrow morning."
    ],
    correctOptionIndex: 1,
    explanation: "'Each' is an indefinite singular pronoun. Even though 'packages' is plural, the subject is 'Each', requiring the singular verb 'is'."
  },
  {
    id: 2,
    category: "Preposition & Professional Phrasing",
    scenario: "You need to place an irate caller on hold to investigate their billing dispute.",
    incorrectSentence: "Wait for me, I go check your bill right now.",
    correctSentence: "May I place you on a brief hold for one to two minutes while I review your billing statement?",
    options: [
      "Wait for me, I go check your bill right now.",
      "Hold on your line while I am checking that for you.",
      "May I place you on a brief hold for one to two minutes while I review your billing statement?",
      "Just wait there because I need to check your billing problem."
    ],
    correctOptionIndex: 2,
    explanation: "Professional BPO etiquette requires asking permission with a specific time frame rather than giving a direct command like 'Wait for me'."
  },
  {
    id: 3,
    category: "Tense Consistency & Politeness",
    scenario: "Informing a customer that their refund was processed earlier this morning.",
    incorrectSentence: "Our accounting team has processed your refund two hours ago.",
    correctSentence: "Our accounting team processed your refund two hours ago.",
    options: [
      "Our accounting team has processed your refund two hours ago.",
      "Our accounting team processed your refund two hours ago.",
      "Our accounting team had process your refund two hours ago.",
      "Our accounting team is processing your refund two hours ago."
    ],
    correctOptionIndex: 1,
    explanation: "When a specific past time is stated ('two hours ago'), use the simple past tense ('processed') rather than the present perfect ('has processed')."
  },
  {
    id: 4,
    category: "Conditional & Empathy Phrasing",
    scenario: "Assuring a customer whose service was disconnected due to a system glitch.",
    incorrectSentence: "If I was in your position, I will also feel frustrated about this outage.",
    correctSentence: "If I were in your position, I would also feel frustrated about this outage.",
    options: [
      "If I was in your position, I will also feel frustrated about this outage.",
      "If I am in your position, I will also feel frustrated about this outage.",
      "If I were in your position, I would also feel frustrated about this outage.",
      "If I be in your position, I can also feel frustrated about this outage."
    ],
    correctOptionIndex: 2,
    explanation: "Subjunctive mood for hypothetical conditions requires 'If I were...', paired with conditional 'would'."
  }
];

const GrammarExercise = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [spokenTranscript, setSpokenTranscript] = useState("");
  const [spokenAccuracy, setSpokenAccuracy] = useState(null);
  const [scoreList, setScoreList] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const currentUser = getCurrentUser() || { id: 19, name: "Applicant" };
  const currentQuestion = grammarQuestions[currentIndex];

  const handleSelectOption = (idx) => {
    if (isAnswerChecked) return;
    setSelectedOption(idx);
  };

  const handleCheckAnswer = () => {
    if (selectedOption === null) return;
    setIsAnswerChecked(true);
  };

  const handleRecorded = (blob, durationSeconds, transcript) => {
    setSpokenTranscript(transcript);
    if (!transcript) {
      setSpokenAccuracy(50);
      return;
    }
    // Calculate simple word similarity
    const targetWords = currentQuestion.correctSentence.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/);
    const spokenWords = transcript.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/);
    let matched = 0;
    targetWords.forEach(w => {
      if (spokenWords.includes(w)) matched++;
    });
    const acc = Math.round((matched / targetWords.length) * 100);
    setSpokenAccuracy(acc);
  };

  const handleNextQuestion = () => {
    const isCorrect = selectedOption === currentQuestion.correctOptionIndex;
    const qScore = (isCorrect ? 60 : 20) + (spokenAccuracy ? Math.round(spokenAccuracy * 0.4) : 20);
    const updatedScores = [...scoreList, qScore];
    setScoreList(updatedScores);

    if (currentIndex + 1 < grammarQuestions.length) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setIsAnswerChecked(false);
      setSpokenTranscript("");
      setSpokenAccuracy(null);
    } else {
      finalizeExercise(updatedScores);
    }
  };

  const finalizeExercise = async (scores) => {
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    setIsCompleted(true);
    setSubmitting(true);
    try {
      await submitExerciseAttempt({
        applicant_id: currentUser.id || 19,
        exercise_id: 2,
        response_text: `Grammar Drill completed. Average score: ${avgScore}%`,
        duration_seconds: scores.length * 35,
        filler_count: 0,
        calculated_score: avgScore,
      });

      addUserActivity({
        activity: "BPO Grammar Mastery",
        level: "Communication Exercise",
        result: `${avgScore}/100`,
        type: "exercise",
      });
    } catch (e) {
      console.warn("Backend exercise submission fallback:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const overallScore = scoreList.length > 0 ? Math.round(scoreList.reduce((a, b) => a + b, 0) / scoreList.length) : 0;

  return (
    <div className="flex min-h-screen bg-gray-50 font-poppins">
      <ApplicantSidebar activeItem="Exercises" />

      {/* Main Content */}
      <div className="flex-1 ml-64 p-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full uppercase tracking-wider mb-2">
                Grammar & BPO Professional Phrasing
              </span>
              <h1 className="text-2xl font-bold text-gray-900">Grammar Accuracy Drill</h1>
              <p className="text-sm text-gray-500">
                Identify customer service grammatical errors, choose the professional correction, and practice reading it aloud.
              </p>
            </div>
            {!isCompleted && (
              <div className="text-right">
                <span className="text-sm font-semibold text-gray-500">Question</span>
                <p className="text-xl font-bold text-blue-600">
                  {currentIndex + 1} <span className="text-gray-400 font-normal">/ {grammarQuestions.length}</span>
                </p>
              </div>
            )}
          </div>

          {!isCompleted ? (
            <div className="space-y-6">
              {/* Question Card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between pb-3 border-b mb-4">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Category: {currentQuestion.category}
                  </span>
                  <span className="text-xs px-2.5 py-1 bg-amber-100 text-amber-800 rounded-md font-medium">
                    Common BPO Mistake
                  </span>
                </div>

                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg mb-5">
                  <p className="text-xs font-semibold text-amber-800 mb-1">Scenario:</p>
                  <p className="text-sm text-gray-700 mb-2">{currentQuestion.scenario}</p>
                  <p className="text-xs font-semibold text-red-700 mb-0.5">Problematic Statement:</p>
                  <p className="text-sm text-red-900 font-medium italic">"{currentQuestion.incorrectSentence}"</p>
                </div>

                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  Select the grammatically correct, professional customer service response:
                </h3>

                {/* Multiple Choice Options */}
                <div className="space-y-3 mb-6">
                  {currentQuestion.options.map((option, idx) => {
                    let cardBorder = "border-gray-200 hover:border-blue-400";
                    let cardBg = "bg-white";

                    if (selectedOption === idx) {
                      cardBorder = "border-blue-600";
                      cardBg = "bg-blue-50/50";
                    }

                    if (isAnswerChecked) {
                      if (idx === currentQuestion.correctOptionIndex) {
                        cardBorder = "border-green-500 ring-2 ring-green-100";
                        cardBg = "bg-green-50";
                      } else if (selectedOption === idx) {
                        cardBorder = "border-red-400";
                        cardBg = "bg-red-50";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(idx)}
                        disabled={isAnswerChecked}
                        className={`w-full text-left p-4 rounded-xl border transition-all duration-150 flex items-start gap-3 ${cardBorder} ${cardBg}`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                            selectedOption === idx
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="text-sm text-gray-800 font-medium">{option}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Check Answer Button */}
                {!isAnswerChecked ? (
                  <button
                    onClick={handleCheckAnswer}
                    disabled={selectedOption === null}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-sm transition"
                  >
                    Check Answer & Unlock Speech Verification
                  </button>
                ) : (
                  <div className="mt-4 pt-4 border-t space-y-4">
                    {/* Explanation */}
                    <div
                      className={`p-4 rounded-xl ${
                        selectedOption === currentQuestion.correctOptionIndex
                          ? "bg-green-50 border border-green-200 text-green-900"
                          : "bg-red-50 border border-red-200 text-red-900"
                      }`}
                    >
                      <p className="font-bold text-sm mb-1">
                        {selectedOption === currentQuestion.correctOptionIndex ? "✓ Correct!" : "✗ Needs Improvement"}
                      </p>
                      <p className="text-xs leading-relaxed">{currentQuestion.explanation}</p>
                    </div>

                    {/* Speech Verification Section */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="text-sm font-bold text-gray-900">Step 2: Read Correct Sentence Aloud</h4>
                          <p className="text-xs text-gray-500">
                            Speak the professional response naturally into your microphone to reinforce verbal fluency.
                          </p>
                        </div>
                        {spokenAccuracy !== null && (
                          <span className="text-xs font-bold px-2.5 py-1 bg-green-100 text-green-800 rounded-full">
                            Spoken Match: {spokenAccuracy}%
                          </span>
                        )}
                      </div>

                      <div className="p-3 bg-white border border-gray-200 rounded-lg text-sm text-blue-900 font-semibold mb-4">
                        "{currentQuestion.correctSentence}"
                      </div>

                      <AudioRecorder onRecordingComplete={handleRecorded} />

                      {spokenTranscript && (
                        <div className="mt-3 p-3 bg-gray-100 rounded-lg text-xs text-gray-700">
                          <span className="font-semibold text-gray-600 block mb-1">Detected Speech:</span>
                          "{spokenTranscript}"
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleNextQuestion}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow transition"
                    >
                      {currentIndex + 1 < grammarQuestions.length ? "Continue to Next Question →" : "Finish Drill & View Results"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Results Screen */
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
                ✓
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Grammar Drill Completed!</h2>
                <p className="text-gray-500 text-sm mt-1">
                  You have successfully completed all BPO grammar and professional phrasing questions.
                </p>
              </div>

              <div className="inline-block bg-blue-50 border border-blue-200 rounded-2xl px-8 py-5">
                <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">Overall Accuracy Score</p>
                <p className="text-4xl font-extrabold text-blue-700">{overallScore}%</p>
                <p className="text-xs text-gray-600 mt-2">
                  {overallScore >= 80 ? "Superb grammar and professional diction!" : "Good practice! Review BPO subjunctive and agreement rules."}
                </p>
              </div>

              <div className="flex gap-4 justify-center pt-4">
                <Link
                  to="/communication-exercises"
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition"
                >
                  More Exercises
                </Link>
                <Link
                  to="/speech-pacing-exercise"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition"
                >
                  Try Speech Pacing Drill →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GrammarExercise;
