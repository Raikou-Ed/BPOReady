import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { listExercises } from "../api/adminApi";
import ApplicantSidebar from "../components/ApplicantSidebar";

const CommunicationExercises = () => {
  const [exercises, setExercises] = useState([]);

  useEffect(() => {
    listExercises().then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setExercises(data);
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50 font-poppins">
      <ApplicantSidebar activeItem="Exercises" />

      {/* Main Content */}
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-4xl mx-auto py-6">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Remedial Training</span>
            <h1 className="text-3xl font-extrabold text-gray-800 mt-2">Communication Exercises</h1>
            <p className="text-gray-600 mt-2 max-w-2xl mx-auto text-sm leading-relaxed">
              Targeted drills designed to overcome common BPO communication challenges: disfluency control, customer service grammar accuracy, and consistent speaking pace.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Filler Words */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Filler Word Reduction</h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-4">
                  Eliminate hesitation sounds like "um", "uh", "you know", and "like". Practice silent pausing to sound articulate and composed.
                </p>
                <div className="text-xs text-gray-500 space-y-1 mb-6">
                  <p>• Live disfluency detection</p>
                  <p>• Filler highlighting in transcript</p>
                  <p>• Fluency scoring</p>
                </div>
              </div>

              <Link to="/filler-word-exercise">
                <button className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg text-sm transition-colors shadow flex items-center justify-center gap-2 cursor-pointer">
                  <span>Start Filler Drill</span>
                  <span>→</span>
                </button>
              </Link>
            </div>

            {/* 2. Grammar Improvement */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Grammar & Phrasing</h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-4">
                  Master BPO customer service grammar: correct past/present verb tenses, subject-verb agreement, and polite professional terminology.
                </p>
                <div className="text-xs text-gray-500 space-y-1 mb-6">
                  <p>• Real customer service statements</p>
                  <p>• Error identification drills</p>
                  <p>• Spoken correction practice</p>
                </div>
              </div>

              <Link to="/grammar-exercise">
                <button className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm transition-colors shadow flex items-center justify-center gap-2 cursor-pointer">
                  <span>Start Grammar Drill</span>
                  <span>→</span>
                </button>
              </Link>
            </div>

            {/* 3. Speech Pacing */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Speech Pacing Meter</h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-4">
                  Train your speaking rhythm to hit the industry-standard target of 125 to 145 words per minute without rushing or dragging.
                </p>
                <div className="text-xs text-gray-500 space-y-1 mb-6">
                  <p>• Visual WPM tempo gauge</p>
                  <p>• Rhythm consistency feedback</p>
                  <p>• Real-time timing assessment</p>
                </div>
              </div>

              <Link to="/speech-pacing-exercise">
                <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors shadow flex items-center justify-center gap-2 cursor-pointer">
                  <span>Start Pacing Drill</span>
                  <span>→</span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunicationExercises;
