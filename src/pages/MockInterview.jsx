import React from "react";
import { Link, useNavigate } from "react-router-dom";
import ApplicantSidebar from "../components/ApplicantSidebar";

const MockInterview = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-gray-50 font-poppins">
      <ApplicantSidebar activeItem="Mock Interview" />

      {/* Main Content */}
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-4xl mx-auto py-6">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Simulated Training Module</span>
            <h1 className="text-3xl font-extrabold text-gray-800 mt-2">Mock Interview Simulation</h1>
            <p className="text-gray-600 mt-2 max-w-2xl mx-auto text-sm leading-relaxed">
              Practice answering common BPO interview questions through structured sessions. Choose between Initial and Final Interview simulations with automated AI evaluation.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Initial Interview */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Initial Interview Simulation</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-6">
                  Essential HR screening questions designed to test self-introduction, communication confidence, flexibility for shifting schedules, and motivation for the BPO industry.
                </p>
                <div className="space-y-1.5 text-xs text-gray-500 mb-6">
                  <p>✓ 5 standard screening questions</p>
                  <p>✓ Real audio recording & transcription</p>
                  <p>✓ Pacing, clarity & filler-word analysis</p>
                </div>
              </div>

              <Link to="/InitialInterviewRecording">
                <button className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition-all text-sm">
                  Start Initial Interview (5 Questions)
                </button>
              </Link>
            </div>

            {/* Final Interview */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Final Interview Simulation</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-6">
                  Operations & Account Manager situational questions focusing on handling irate callers, resolving customer conflicts, staying composed under pressure, and long-term commitment.
                </p>
                <div className="space-y-1.5 text-xs text-gray-500 mb-6">
                  <p>✓ 5 behavioral & escalation scenarios</p>
                  <p>✓ Empathy and problem-solving evaluation</p>
                  <p>✓ In-depth AI scorecard and feedback</p>
                </div>
              </div>

              <Link to="/FinalInterviewRecording">
                <button className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl shadow-md transition-all text-sm">
                  Start Final Interview (5 Questions)
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockInterview;
