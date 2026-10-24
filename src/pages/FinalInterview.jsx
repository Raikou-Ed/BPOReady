import React from "react";
import { Link } from "react-router-dom";
import ApplicantSidebar from "../components/ApplicantSidebar";

const FinalInterview = () => {
  return (
    <div className="flex min-h-screen bg-gray-50 font-poppins">
      <ApplicantSidebar activeItem="Mock Interview" />

      {/* Main Content */}
      <div className="flex-1 ml-64 flex items-center justify-center min-h-screen p-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-10 w-full max-w-xl text-center">
          <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-3">Final Interview Simulation</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-6">
            The Final Interview evaluates your problem-solving, situational judgment, and composure under pressure. You will be asked 5 behavioral questions commonly used by BPO hiring managers and account leads.
          </p>

          <div className="bg-purple-50 rounded-xl p-5 mb-8 text-left border border-purple-100 text-xs text-purple-900 space-y-2">
            <p className="font-semibold text-sm text-purple-800 mb-1">Key Advice for Final Interviews:</p>
            <p>• Use the STAR framework (Situation, Task, Action, Result) when describing past experiences.</p>
            <p>• Stay calm, positive, and emphasize customer satisfaction and teamwork.</p>
            <p>• Maintain an even pace between 125 and 145 words per minute.</p>
          </div>

          <Link to="/FinalInterviewRecording">
            <button className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl shadow-md transition-all text-base">
              Begin Final Interview Session
            </button>
          </Link>

          <div className="mt-4">
            <Link to="/MockInterview" className="text-xs text-gray-500 hover:text-gray-700">
              ← Return to Interview Selection
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalInterview;
