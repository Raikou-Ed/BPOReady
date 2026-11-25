import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ApplicantSidebar from "../components/ApplicantSidebar";
import { getMockInterviewQuestions } from "../api/adminApi";

const defaultPrompt = "Tell me about yourself and why you chose to pursue an entry-level career in the BPO industry.";

const isSelfIntroQuestion = (q) => {
  const text = (q.question_text || q.question || "").toLowerCase();
  return (
    text.includes("tell me about yourself") ||
    text.includes("tell us about yourself") ||
    text.includes("about yourself") ||
    text.includes("introduce yourself") ||
    text.includes("introduction") ||
    text.includes("walk me through")
  );
};

const InitialInterview = () => {
  const [questionText, setQuestionText] = useState(() => {
    try {
      const raw = localStorage.getItem("bpo_custom_questions");
      if (raw) {
        const custom = JSON.parse(raw).filter(
          (q) => (q.interview_type || q.question_type) === "initial" && q.is_active !== false
        );
        const intro = custom.find(isSelfIntroQuestion);
        if (intro) return intro.question_text || intro.question;
        if (custom.length > 0) return custom[0].question_text || custom[0].question;
      }
    } catch {}
    return defaultPrompt;
  });

  const [totalQuestions, setTotalQuestions] = useState(5);

  useEffect(() => {
    let deletedIds = [];
    try {
      deletedIds = JSON.parse(localStorage.getItem("bpo_deleted_question_ids") || "[]");
    } catch {}

    const filterValid = (arr) =>
      arr.filter(
        (q) =>
          q.is_active !== false &&
          !deletedIds.includes(q.id) &&
          !deletedIds.includes(String(q.id))
      );

    try {
      const raw = localStorage.getItem("bpo_custom_questions");
      if (raw) {
        const custom = filterValid(
          JSON.parse(raw).filter((q) => (q.interview_type || q.question_type) === "initial")
        );
        if (custom.length > 0) {
          setTotalQuestions(custom.length);
          const intro = custom.find(isSelfIntroQuestion);
          if (intro) {
            setQuestionText(intro.question_text || intro.question);
          } else {
            setQuestionText(custom[0].question_text || custom[0].question);
          }
        }
      }
    } catch {}

    getMockInterviewQuestions("initial")
      .then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          const valid = filterValid(list);
          if (valid.length > 0) {
            setTotalQuestions(valid.length);
            const intro = valid.find(isSelfIntroQuestion);
            if (intro) {
              setQuestionText(intro.question_text || intro.question);
            } else {
              setQuestionText(valid[0].question_text || valid[0].question);
            }
          }
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50 font-poppins">
      <ApplicantSidebar activeItem="Mock Interview" />

      {/* Main Content */}
      <div className="flex-1 ml-64 flex items-center justify-center min-h-screen">
        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-lg mx-4">
          {/* Title */}
          <h2 className="text-xl font-bold text-gray-800 text-center mb-6">
            Initial Interview - Question 1 of {totalQuestions}
          </h2>

          {/* Question */}
          <div className="text-center mb-8">
            <p className="text-lg font-semibold text-gray-800 mb-1 leading-snug">
              "{questionText}"
            </p>
            <p className="text-xs text-gray-400 mt-2">Provide a clear and confident answer.</p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            <Link to="/InitialInterviewRecording">
              <button className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-md text-sm">
                Start Recording
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InitialInterview;