import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { getQuestions } from "../utils/questionData";
import ApplicantSidebar from "../components/ApplicantSidebar";

const InitialInterview = () => {
  const { mock } = useMemo(() => getQuestions(), []);
  const question = mock.initial[0];

  return (
    <div className="flex min-h-screen bg-gray-50 font-poppins">
      <ApplicantSidebar activeItem="Mock Interview" />

      {/* Main Content */}
      <div className="flex-1 ml-64 flex items-center justify-center min-h-screen">
        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-lg mx-4">
          {/* Title */}
          <h2 className="text-xl font-bold text-gray-800 text-center mb-6">
            Initial Interview - Question 1 of {mock.initial.length}
          </h2>

          {/* Question */}
          <div className="text-center mb-8">
            <p className="text-lg font-semibold text-gray-800 mb-1">{question?.question || "No question available yet."}</p>
            <p className="text-sm text-gray-400">Provide a clear and confident answer.</p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            <Link to="/InitialInterviewRecording">
            <button className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md">
              Start Recording
            </button>
            </Link>
            <button className="w-full py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors shadow-md">
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InitialInterview;