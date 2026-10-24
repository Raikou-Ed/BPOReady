import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listCallScenarios } from "../api/adminApi";
import ApplicantSidebar from "../components/ApplicantSidebar";

import { CALL_SCENARIOS } from "../data/callScenariosData";

const CallSimulation = () => {
  const [filterType, setFilterType] = useState("all");
  const [scenarios, setScenarios] = useState(CALL_SCENARIOS);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadScenarios() {
      try {
        const data = await listCallScenarios();
        if (Array.isArray(data) && data.length > 0) {
          const merged = CALL_SCENARIOS.map((local) => {
            const apiMatch = data.find((d) => Number(d.id) === Number(local.id));
            return apiMatch ? { ...local, ...apiMatch, dialogues: local.dialogues } : local;
          });
          setScenarios(merged);
        }
      } catch (err) {
        console.warn("Using local scenarios:", err);
      }
    }
    loadScenarios();
  }, []);

  const filtered = scenarios.filter((s) => {
    if (filterType === "all") return true;
    return s.call_type?.toLowerCase() === filterType;
  });

  return (
    <div className="flex min-h-screen bg-gray-50 font-poppins">
      <ApplicantSidebar activeItem="Call Simulation" />

      {/* Main Content */}
      <div className="flex-1 ml-64 p-10">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full uppercase tracking-wider mb-2">
              Speech-to-Speech Practice
            </span>
            <h1 className="text-3xl font-bold text-gray-900">Call Simulation Studio</h1>
            <p className="text-sm text-gray-500 mt-1">
              Simulate realistic BPO phone customer interactions. Listen to customer speech prompts and respond live into your microphone with active empathy and swift problem resolution.
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-gray-200">
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType("all")}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                  filterType === "all"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                All Scenarios ({scenarios.length})
              </button>
              <button
                onClick={() => setFilterType("inbound")}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                  filterType === "inbound"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Inbound Customer Care
              </button>
              <button
                onClick={() => setFilterType("outbound")}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                  filterType === "outbound"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Outbound Calls
              </button>
            </div>
            <div className="text-xs text-gray-500 pr-3 font-medium">
              Simulated Voice Engine Active
            </div>
          </div>

          {/* Scenario Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        s.call_type === "inbound"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {s.call_type === "inbound" ? "📥 Inbound Call" : "📤 Outbound Call"}
                    </span>
                    <span
                      className={`text-xs font-semibold capitalize px-2 py-0.5 rounded ${
                        s.difficulty === "easy"
                          ? "bg-green-100 text-green-700"
                          : s.difficulty === "medium"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {s.difficulty || "Medium"} Difficulty
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed mb-4">
                    {s.scenario_brief}
                  </p>
                </div>

                <button
                  onClick={() => navigate(`/call-simulation/${s.id}`)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  Connect Call Simulation
                </button>
              </div>
            ))}
          </div>

          {/* Quick Best Practices Guide */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6 rounded-2xl shadow-sm">
            <h4 className="text-base font-bold mb-2">BPO Call Handling Quality Standards (HEAT Model):</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs text-blue-100 mt-3">
              <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                <p className="font-bold text-white mb-1">H - Hear</p>
                <p>Listen attentively without interrupting while the customer explains their issue.</p>
              </div>
              <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                <p className="font-bold text-white mb-1">E - Empathize</p>
                <p>Validate feelings ("I completely understand how inconvenient this has been for you").</p>
              </div>
              <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                <p className="font-bold text-white mb-1">A - Apologize</p>
                <p>Acknowledge inconvenience professionally without assigning internal blame.</p>
              </div>
              <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                <p className="font-bold text-white mb-1">T - Take Action</p>
                <p>Provide a concrete, step-by-step resolution and clear timeline.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallSimulation;
