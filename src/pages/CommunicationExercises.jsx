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
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">CEFR Table 3 Targeted Drills</span>
            <h1 className="text-3xl font-extrabold text-gray-800 mt-2">Communication Exercises</h1>
            <p className="text-gray-600 mt-2 max-w-2xl mx-auto text-sm leading-relaxed">
              Targeted gym drills designed to train each Council of Europe CEFR Table 3 spoken pillar: Fluency, Range, Accuracy, and Coherence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Speech Pacing -> Trains CEFR Fluency */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wide">
                    Trains CEFR Fluency
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">Speech Pacing Drill</h3>
                <p className="text-xs font-semibold text-blue-600 mb-2">CEFR Spoken Fluency Dimension</p>
                <p className="text-xs text-gray-600 leading-relaxed mb-4">
                  Train your speaking rhythm to hit the industry sweet spot of 125 to 150 words per minute with smooth breath timing and natural pauses.
                </p>
                <div className="text-xs text-gray-500 space-y-1 mb-6">
                  <p>• Visual WPM tempo gauge</p>
                  <p>• Rhythm consistency feedback</p>
                  <p>• Pause & cadence stabilization</p>
                </div>
              </div>

              <Link to="/speech-pacing-exercise">
                <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors shadow flex items-center justify-center gap-2 cursor-pointer">
                  <span>Start Pacing Drill</span>
                  <span>→</span>
                </button>
              </Link>
            </div>

            {/* 2. Filler Words -> Trains CEFR Range */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 uppercase tracking-wide">
                    Trains CEFR Range
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">Filler Words Drill</h3>
                <p className="text-xs font-semibold text-orange-600 mb-2">CEFR Lexical Range Dimension</p>
                <p className="text-xs text-gray-600 leading-relaxed mb-4">
                  Eliminate hesitation sounds ("um", "uh", "you know", "like") to expand lexical control and deliver confident, crutch-free speech.
                </p>
                <div className="text-xs text-gray-500 space-y-1 mb-6">
                  <p>• Real-time disfluency detection</p>
                  <p>• Crutch word highlighting in transcript</p>
                  <p>• Lexical range expansion scoring</p>
                </div>
              </div>

              <Link to="/filler-word-exercise">
                <button className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg text-sm transition-colors shadow flex items-center justify-center gap-2 cursor-pointer">
                  <span>Start Filler Drill</span>
                  <span>→</span>
                </button>
              </Link>
            </div>

            {/* 3. Grammar & Phrasing -> Trains CEFR Accuracy & Coherence */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
                    Trains CEFR Accuracy &amp; Coherence
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">Grammar &amp; Syntax Drill</h3>
                <p className="text-xs font-semibold text-emerald-600 mb-2">CEFR Accuracy &amp; Coherence Dimensions</p>
                <p className="text-xs text-gray-600 leading-relaxed mb-4">
                  Master customer service grammar: verb tenses, subject-verb agreement, subjunctive clauses, and coherent sentence connectors.
                </p>
                <div className="text-xs text-gray-500 space-y-1 mb-6">
                  <p>• Contact center statement scenarios</p>
                  <p>• Syntactic error detection</p>
                  <p>• Spoken correction & discourse practice</p>
                </div>
              </div>

              <Link to="/grammar-exercise">
                <button className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm transition-colors shadow flex items-center justify-center gap-2 cursor-pointer">
                  <span>Start Grammar Drill</span>
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
