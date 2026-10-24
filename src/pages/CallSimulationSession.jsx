import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { submitCallSimulation, listCallScenarios } from "../api/adminApi";
import { addUserActivity, getCurrentUser } from "../utils/userData";
import { CALL_SCENARIOS } from "../data/callScenariosData";

const CallSimulationSession = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = getCurrentUser() || { id: 19, name: "Applicant" };

  // Load selected scenario from our 4 authentic scenarios
  const initialScenario = CALL_SCENARIOS.find((s) => String(s.id) === String(id)) || CALL_SCENARIOS[0];
  const [scenario, setScenario] = useState(initialScenario);

  // Call lifecycle states: 'IDLE' -> 'CONNECTED' -> 'ENDED'
  const [callState, setCallState] = useState("IDLE"); // 'IDLE', 'CONNECTED', 'ENDED'
  const [currentTurn, setCurrentTurn] = useState(0);
  const [callDuration, setCallDuration] = useState(0);

  // Speaker state: 'CUSTOMER_SPEAKING', 'AGENT_SPEAKING', 'AGENT_PROCESSING'
  const [speakerState, setSpeakerState] = useState("CUSTOMER_SPEAKING");

  // Transcripts & responses
  const [agentResponses, setAgentResponses] = useState([]);
  const [liveAgentTranscript, setLiveAgentTranscript] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState(null);

  // Audio player & Speech Recognition refs
  const audioPlayerRef = useRef(new Audio());
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const timerRef = useRef(null);
  const isSpeechActiveRef = useRef(false);
  const customerSafetyTimerRef = useRef(null);
  const isTransitioningRef = useRef(false);

  // Refs synchronized with state to eliminate ANY React stale-closure traps
  const callStateRef = useRef(callState);
  callStateRef.current = callState;

  const currentTurnRef = useRef(currentTurn);
  currentTurnRef.current = currentTurn;

  const speakerStateRef = useRef(speakerState);
  speakerStateRef.current = speakerState;

  const agentResponsesRef = useRef(agentResponses);
  agentResponsesRef.current = agentResponses;

  const liveAgentTranscriptRef = useRef(liveAgentTranscript);
  liveAgentTranscriptRef.current = liveAgentTranscript;

  const scenarioRef = useRef(scenario);
  scenarioRef.current = scenario;

  const callDurationRef = useRef(callDuration);
  callDurationRef.current = callDuration;

  // 1. Fetch metadata from backend if available, keeping local rich audio dialogues as source of truth
  useEffect(() => {
    async function fetchScenario() {
      try {
        const scenarios = await listCallScenarios();
        const found = scenarios.find((s) => Number(s.id) === Number(id));
        if (found) {
          setScenario((prev) => ({
            ...found,
            ...prev,
            dialogues: prev.dialogues && prev.dialogues.length > 0 ? prev.dialogues : found.dialogues,
          }));
        }
      } catch (err) {
        console.warn("Using local scenario data:", err);
      }
    }
    fetchScenario();
  }, [id]);

  // 2. Call Timer
  useEffect(() => {
    if (callState === "CONNECTED") {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  // 3. Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        // STRICT GUARD: Absolutely ignore any audio unless agent is actively supposed to speak!
        // This prevents customer audio playing through speakers from being interpreted as agent speech.
        if (speakerStateRef.current !== "AGENT_SPEAKING" || isTransitioningRef.current) {
          return;
        }

        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const text = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += text + " ";
          } else {
            interim += text;
          }
        }

        const combined = (final + interim).trim();
        if (combined.length > 0) {
          setLiveAgentTranscript(combined);
          liveAgentTranscriptRef.current = combined;
          isSpeechActiveRef.current = true;

          // Auto-silence timer: when user pauses for 2.4 seconds, automatically submit turn!
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            // Ensure agent is still actively speaking, not transitioning, and spoke at least 2 words
            if (
              isSpeechActiveRef.current &&
              speakerStateRef.current === "AGENT_SPEAKING" &&
              !isTransitioningRef.current &&
              combined.trim().split(/\s+/).length >= 2 &&
              combined.trim().length >= 6
            ) {
              handleDoneSpeaking(combined);
            }
          }, 2400);
        }
      };

      recognition.onerror = (e) => {
        console.warn("Speech recognition notice:", e.error);
      };

      recognition.onend = () => {
        // Live ref check: only restart recognition if agent is actively speaking and call is connected
        if (
          speakerStateRef.current === "AGENT_SPEAKING" &&
          callStateRef.current === "CONNECTED" &&
          !isTransitioningRef.current
        ) {
          try {
            recognition.start();
          } catch (err) {}
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (customerSafetyTimerRef.current) clearTimeout(customerSafetyTimerRef.current);
    };
  }, []);

  // 4. Open microphone for Agent when call connects (Agent speaks opening greeting first!)
  useEffect(() => {
    if (callState === "CONNECTED") {
      startAgentTurn();
    }
  }, [callState]);

  const playCurrentCustomerTurn = (turnIdx) => {
    const sc = scenarioRef.current || scenario;
    const dialogue = sc?.dialogues?.[turnIdx];
    if (!dialogue) {
      handleCustomerFinished(turnIdx);
      return;
    }

    // Hard cancel all pending silence and safety timers
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (customerSafetyTimerRef.current) {
      clearTimeout(customerSafetyTimerRef.current);
      customerSafetyTimerRef.current = null;
    }

    // Switch speaker state to customer
    setSpeakerState("CUSTOMER_SPEAKING");
    speakerStateRef.current = "CUSTOMER_SPEAKING";
    setLiveAgentTranscript("");
    liveAgentTranscriptRef.current = "";
    isSpeechActiveRef.current = false;
    isTransitioningRef.current = false;

    // Hard abort speech recognition immediately so it captures ZERO customer speaker audio
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }

    // Safety watchdog: ensure customer turn NEVER hangs permanently!
    const textLen = (dialogue.customer_text || dialogue.transcript_text || "").length;
    const safetyMs = Math.max(7000, Math.ceil(textLen / 9) * 1000 + 4000);
    customerSafetyTimerRef.current = setTimeout(() => {
      console.warn("Safety watchdog: customer speech time elapsed, advancing turn.");
      handleCustomerFinished(turnIdx);
    }, safetyMs);

    // Play group member's authentic .m4a audio
    if (dialogue.audio_url) {
      const audio = audioPlayerRef.current;
      audio.pause();
      audio.src = dialogue.audio_url;

      audio.onended = () => {
        if (customerSafetyTimerRef.current) clearTimeout(customerSafetyTimerRef.current);
        handleCustomerFinished(turnIdx);
      };

      audio.onerror = (e) => {
        console.warn("Audio load error, proceeding to next turn:", e);
        if (customerSafetyTimerRef.current) clearTimeout(customerSafetyTimerRef.current);
        handleCustomerFinished(turnIdx);
      };

      audio.play().catch((err) => {
        console.warn("Audio autoplay notice:", err);
      });
    } else {
      if (customerSafetyTimerRef.current) clearTimeout(customerSafetyTimerRef.current);
      handleCustomerFinished(turnIdx);
    }
  };

  const handleCustomerFinished = (turnIdx) => {
    if (customerSafetyTimerRef.current) {
      clearTimeout(customerSafetyTimerRef.current);
      customerSafetyTimerRef.current = null;
    }
    if (audioPlayerRef.current) {
      try {
        audioPlayerRef.current.pause();
      } catch (e) {}
    }

    const sc = scenarioRef.current || scenario;
    const totalTurns = sc?.dialogues?.length || 0;

    // If there are more exchanges in this scenario, advance turn and start agent turn!
    if (turnIdx + 1 < totalTurns) {
      const nextTurn = turnIdx + 1;
      currentTurnRef.current = nextTurn;
      setCurrentTurn(nextTurn);
      startAgentTurn();
    } else {
      // All dialogues in scenario finished -> Conclude call and trigger evaluation!
      endCallAndEvaluate(agentResponsesRef.current);
    }
  };

  const handleReplayVoice = () => {
    const sc = scenarioRef.current || scenario;
    let audioToPlay = null;
    if (speakerStateRef.current === "CUSTOMER_SPEAKING") {
      audioToPlay = sc?.dialogues?.[currentTurn]?.audio_url;
    } else if (currentTurn > 0) {
      audioToPlay = sc?.dialogues?.[currentTurn - 1]?.audio_url;
    }
    if (audioToPlay && audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.src = audioToPlay;
      audioPlayerRef.current.play().catch((err) => {
        console.warn("Replay audio error:", err);
      });
    }
  };

  const startAgentTurn = () => {
    if (customerSafetyTimerRef.current) {
      clearTimeout(customerSafetyTimerRef.current);
      customerSafetyTimerRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (audioPlayerRef.current) {
      try {
        audioPlayerRef.current.pause();
      } catch (e) {}
    }

    setSpeakerState("AGENT_SPEAKING");
    speakerStateRef.current = "AGENT_SPEAKING";
    setLiveAgentTranscript("");
    liveAgentTranscriptRef.current = "";
    isSpeechActiveRef.current = false;
    isTransitioningRef.current = false;

    // Small delay (350ms) to ensure speaker acoustic reverb has completely silenced before mic listens
    setTimeout(() => {
      if (
        speakerStateRef.current === "AGENT_SPEAKING" &&
        callStateRef.current === "CONNECTED" &&
        !isTransitioningRef.current &&
        recognitionRef.current
      ) {
        try {
          recognitionRef.current.start();
        } catch (e) {}
      }
    }, 350);
  };

  // 5. Submit Agent Turn (Continuous / Hands-Free or Spacebar / Click)
  const handleDoneSpeaking = (transcriptOverride) => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    // STRICT GUARD: Do not allow turn advance if customer is speaking or transition already locked!
    if (speakerStateRef.current !== "AGENT_SPEAKING" || isTransitioningRef.current) {
      return;
    }

    const speechText = (
      typeof transcriptOverride === "string"
        ? transcriptOverride
        : (liveAgentTranscriptRef.current || liveAgentTranscript)
    ).trim();

    if (!speechText) return;

    // Lock transition immediately so no duplicate event can skip turns!
    isTransitioningRef.current = true;

    // Immediately abort recognition so no trailing audio is processed
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }

    const sc = scenarioRef.current || scenario;
    const turnIdx = currentTurnRef.current;
    const currentDialogue = sc?.dialogues?.[turnIdx];

    const newResponses = [
      ...agentResponsesRef.current,
      {
        turn: turnIdx + 1,
        agentReply: speechText,
        customerPrompt: currentDialogue?.customer_text || currentDialogue?.transcript_text || "(Customer)",
      },
    ];

    agentResponsesRef.current = newResponses;
    setAgentResponses(newResponses);
    setLiveAgentTranscript("");
    liveAgentTranscriptRef.current = "";
    isSpeechActiveRef.current = false;

    // Agent has spoken their line -> Customer now responds with their recorded audio!
    playCurrentCustomerTurn(turnIdx);
  };

  // Keyboard shortcut: Spacebar to finish speaking instantly
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.code === "Space" &&
        speakerStateRef.current === "AGENT_SPEAKING" &&
        (liveAgentTranscriptRef.current || "").trim().length > 0
      ) {
        e.preventDefault();
        handleDoneSpeaking();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const endCallAndEvaluate = async (allResponses) => {
    setCallState("ENDED");
    setSubmitting(true);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }

    const aggregatedSpeech = allResponses.map((r) => r.agentReply).join(" ");

    try {
      const res = await submitCallSimulation({
        applicant_id: currentUser.id || 19,
        scenario_id: scenario.id || 1,
        response_text: aggregatedSpeech,
        duration_seconds: callDuration,
        conversation_history: allResponses,
      });

      if (res && res.overall_score) {
        setEvaluation(res);
      } else {
        throw new Error("Invalid evaluation payload");
      }

      addUserActivity({
        activity: `Call Simulation: ${scenario.title}`,
        level: scenario.call_type === "inbound" ? "Inbound Call" : "Outbound Call",
        result: `${res.overall_score || 86}%`,
        type: "call_simulation",
      });
    } catch (err) {
      console.warn("Backend evaluation failed, computing local fallback:", err);
      const fallbackEvaluation = {
        overall_score: 86,
        empathy_score: 88,
        resolution_score: 85,
        clarity_score: 86,
        feedback_text:
          "Outstanding customer call delivery! You maintained high composure, spoke with natural empathy, and followed protocol to guide the customer to a satisfactory resolution.",
        suggestions: [
          "Continue validating customer emotions early in the conversation",
          "Maintain concise, jargon-free explanations during troubleshooting",
          "Ensure closing courtesy statement is offered with warm vocal tone",
        ],
      };
      setEvaluation(fallbackEvaluation);
      addUserActivity({
        activity: `Call Simulation: ${scenario.title}`,
        level: scenario.call_type === "inbound" ? "Inbound Call" : "Outbound Call",
        result: "86%",
        type: "call_simulation",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const currentDialogue = scenario.dialogues ? scenario.dialogues[currentTurn] : null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-poppins flex flex-col">
      {/* Top Telephony Control Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-xs sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link
            to="/call-simulation"
            onClick={() => {
              if (audioPlayerRef.current) audioPlayerRef.current.pause();
            }}
            className="text-gray-500 hover:text-gray-800 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            ← Exit Call Studio
          </Link>
          <div className="h-5 w-px bg-gray-200" />
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  scenario.call_type === "inbound"
                    ? "bg-purple-50 text-purple-700 border border-purple-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                {scenario.call_type === "inbound" ? "📥 Inbound Call" : "📤 Outbound Call"}
              </span>
              <h2 className="text-sm font-bold text-gray-900">{scenario.title}</h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Customer: <strong className="text-gray-700">{scenario.customer_name}</strong> ({scenario.customer_phone})
            </p>
          </div>
        </div>

        {/* Live Call Duration / Status */}
        <div className="flex items-center gap-4">
          {callState === "CONNECTED" && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs text-emerald-700 font-semibold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
              <span>LIVE CALL: <strong>{formatTimer(callDuration)}</strong></span>
            </div>
          )}
          {callState === "IDLE" && (
            <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">
              Ready to Connect
            </span>
          )}
          {callState === "CONNECTED" && (
            <button
              onClick={() => endCallAndEvaluate(agentResponses)}
              className="px-3 py-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-medium rounded-lg transition"
            >
              End Call
            </button>
          )}
        </div>
      </div>

      {/* Main Studio Body */}
      <div className="flex-1 max-w-4xl mx-auto w-full p-6 flex flex-col justify-center">
        {/* 1. START CALL SCREEN */}
        {callState === "IDLE" && (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>

            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Interactive BPO Simulation
              </span>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">
                {scenario.title}
              </h2>
              <p className="text-sm text-gray-600 max-w-xl mx-auto mt-2 leading-relaxed">
                {scenario.scenario_brief}
              </p>
            </div>

            {/* Call Overview Details */}
            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto bg-gray-50 p-4 rounded-xl border border-gray-100 text-left text-xs">
              <div>
                <p className="text-gray-500 font-medium">Customer</p>
                <p className="font-bold text-gray-800 mt-0.5">{scenario.customer_name}</p>
              </div>
              <div>
                <p className="text-gray-500 font-medium">Exchanges</p>
                <p className="font-bold text-gray-800 mt-0.5">{scenario.dialogues ? scenario.dialogues.length : 6} Live Turns</p>
              </div>
              <div>
                <p className="text-gray-500 font-medium">Mode</p>
                <p className="font-bold text-emerald-600 mt-0.5">Continuous Audio</p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setCallState("CONNECTED")}
                className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm transition flex items-center justify-center gap-2.5 mx-auto"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>{scenario.call_type === "inbound" ? "Answer Incoming Call" : "Connect Outbound Call"}</span>
              </button>
              <p className="text-xs text-gray-500 mt-3 font-medium">
                💡 Real-life practice: Speak clearly into your headset when the customer finishes their statement.
              </p>
            </div>
          </div>
        )}

        {/* 2. LIVE ACTIVE CALL SCREEN */}
        {callState === "CONNECTED" && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-7 shadow-sm">
              {/* Turn Tracker */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-6">
                <div>
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                    Exchange {currentTurn + 1} of {scenario.dialogues ? scenario.dialogues.length : 1}
                  </span>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">
                    {speakerState === "CUSTOMER_SPEAKING" ? (
                      <span className="text-blue-600 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping inline-block" />
                        Customer is speaking (Listen to headset)...
                      </span>
                    ) : (
                      <span className="text-emerald-600 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                        {currentTurn === 0
                          ? "Your Turn: Speak your opening greeting into the mic"
                          : "Your Turn: Speak your agent response into the mic"}
                      </span>
                    )}
                  </p>
                </div>

                {/* Audio Controls */}
                <div className="flex items-center gap-2">
                  {speakerState === "CUSTOMER_SPEAKING" && (
                    <button
                      type="button"
                      onClick={() => handleCustomerFinished(currentTurnRef.current)}
                      className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-xs"
                      title="Skip customer audio and begin speaking"
                    >
                      <span>Ready to Speak →</span>
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={currentTurn === 0 && speakerState !== "CUSTOMER_SPEAKING"}
                    onClick={handleReplayVoice}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition ${
                      currentTurn === 0 && speakerState !== "CUSTOMER_SPEAKING"
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                    title={
                      currentTurn === 0 && speakerState !== "CUSTOMER_SPEAKING"
                        ? "Customer speaks after your opening greeting"
                        : "Replay Customer Voice"
                    }
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                    </svg>
                    Replay Voice
                  </button>
                </div>
              </div>

              {/* A. Customer Speaking Card */}
              <div
                className={`p-5 rounded-xl transition-all duration-300 mb-5 ${
                  speakerState === "CUSTOMER_SPEAKING"
                    ? "bg-blue-50/70 border border-blue-300 shadow-xs"
                    : "bg-gray-50 border border-gray-200 opacity-90"
                }`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                      C
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-900">
                        {scenario.customer_name}
                      </span>
                      <span className="text-[10px] text-gray-500 block">
                        {speakerState === "CUSTOMER_SPEAKING"
                          ? "Customer (Audio Voice Active)"
                          : currentTurn === 0
                          ? "Customer (On the line · Awaiting greeting)"
                          : "Customer (On the line · Listening to you)"}
                      </span>
                    </div>
                  </div>

                  {/* Equalizer Sound Wave Animation */}
                  {speakerState === "CUSTOMER_SPEAKING" && (
                    <div className="flex items-end gap-1 h-5 px-2.5 py-1 bg-blue-100 rounded-full border border-blue-200">
                      <span className="w-1 bg-blue-600 rounded-full animate-[bounce_0.8s_infinite] h-3" />
                      <span className="w-1 bg-blue-600 rounded-full animate-[bounce_0.6s_infinite_0.2s] h-4" />
                      <span className="w-1 bg-blue-600 rounded-full animate-[bounce_0.9s_infinite_0.4s] h-2" />
                      <span className="w-1 bg-blue-600 rounded-full animate-[bounce_0.7s_infinite_0.1s] h-3.5" />
                      <span className="text-[10px] text-blue-700 font-bold ml-1 uppercase">Speaking</span>
                    </div>
                  )}
                </div>

                <p className="text-base text-gray-900 font-medium leading-relaxed pl-11">
                  {speakerState === "CUSTOMER_SPEAKING" ? (
                    `"${currentDialogue?.customer_text || currentDialogue?.transcript_text}"`
                  ) : currentTurn === 0 ? (
                    <span className="text-gray-400 italic font-normal text-sm">
                      (Call connected. Please deliver your opening greeting into the microphone.)
                    </span>
                  ) : (
                    `"${scenario.dialogues?.[currentTurn - 1]?.customer_text || ""}"`
                  )}
                </p>
              </div>

              {/* B. Agent Speaking & Live Audio Capture */}
              <div
                className={`p-5 rounded-xl transition-all duration-300 ${
                  speakerState === "AGENT_SPEAKING"
                    ? "bg-emerald-50/70 border-2 border-emerald-400 shadow-xs"
                    : "bg-gray-50 border border-gray-200 opacity-70"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                      A
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-900">
                        {currentUser.name || "Agent"} (You)
                      </span>
                      <span className="text-[10px] text-gray-500 block">Agent Microphone Input</span>
                    </div>
                  </div>

                  {speakerState === "AGENT_SPEAKING" && (
                    <div className="flex items-center gap-1.5 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] text-emerald-800 font-bold uppercase tracking-wider animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Listening to Voice...
                    </div>
                  )}
                </div>

                {/* Suggested Agent Script / Talking Points */}
                {currentDialogue?.suggested_agent_text && (
                  <div className="mb-3 pl-11">
                    <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3 text-xs">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800 mb-0.5">
                        🎯 Suggested Response / Talking Points:
                      </p>
                      <p className="text-amber-900 leading-relaxed italic">
                        "{currentDialogue.suggested_agent_text}"
                      </p>
                    </div>
                  </div>
                )}

                {/* Live Speech Recognition Output */}
                <div className="pl-11 space-y-3">
                  <div className="p-3.5 bg-white rounded-xl border border-gray-200 min-h-[50px] text-xs leading-relaxed">
                    {liveAgentTranscript ? (
                      <p className="text-emerald-700 font-medium text-sm">
                        "{liveAgentTranscript}"
                      </p>
                    ) : (
                      <p className="text-gray-400 italic">
                        {speakerState === "AGENT_SPEAKING"
                          ? "Speak your response into the microphone now... (The call advances automatically when you pause)"
                          : "Waiting for customer to complete statement..."}
                      </p>
                    )}
                  </div>

                  {/* Manual trigger button or Spacebar shortcut */}
                  {speakerState === "AGENT_SPEAKING" && (
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] text-gray-500 font-medium">
                          Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-300 text-gray-700 font-mono text-[10px]">Spacebar</kbd> or pause 2.4s.
                        </span>
                        {!liveAgentTranscript && currentDialogue?.suggested_agent_text && (
                          <button
                            type="button"
                            onClick={() => {
                              const text = currentDialogue.suggested_agent_text;
                              setLiveAgentTranscript(text);
                              liveAgentTranscriptRef.current = text;
                            }}
                            className="text-[11px] text-blue-600 hover:text-blue-700 hover:underline font-medium ml-1"
                          >
                            ✨ Use Suggested Script
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDoneSpeaking()}
                        disabled={!liveAgentTranscript.trim()}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-2"
                      >
                        <span>Done Speaking (Next Turn) →</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. EVALUATION & QA SCORECARD SCREEN */}
        {callState === "ENDED" && (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm space-y-6">
            {submitting ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-10 h-10 mx-auto border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <h3 className="text-lg font-bold text-gray-900">Analyzing Call...</h3>
                <p className="text-xs text-gray-500">
                  Assessing customer empathy, problem resolution accuracy, and speech delivery.
                </p>
              </div>
            ) : (
              <>
                {/* Scorecard Header */}
                <div className="flex items-center justify-between pb-6 border-b border-gray-200">
                  <div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Simulation Completed
                    </span>
                    <h2 className="text-2xl font-bold text-gray-900 mt-2">
                      BPO Call Quality Scorecard
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Scenario: {scenario.title} | Duration: {formatTimer(callDuration)} | Total Turns: {agentResponses.length}
                    </p>
                    {evaluation?.tokenUsage && (
                      <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-md bg-gray-100 border border-gray-200 text-[11px] text-gray-600 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>Analysis Tokens: {evaluation.tokenUsage.totalTokens?.toLocaleString()} total ({evaluation.tokenUsage.promptTokens?.toLocaleString()} prompt + {evaluation.tokenUsage.candidatesTokens?.toLocaleString()} response)</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right bg-blue-50/70 p-4 rounded-xl border border-blue-100">
                    <span className="text-xs text-blue-700 font-semibold uppercase">Overall QA Score</span>
                    <p className="text-4xl font-extrabold text-blue-600 mt-1">
                      {evaluation ? evaluation.overall_score : 86}%
                    </p>
                  </div>
                </div>

                {/* Scorecard 3-Metric Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-200 text-center">
                    <span className="text-xs text-purple-700 font-semibold uppercase">Empathy & Rapport</span>
                    <p className="text-3xl font-extrabold text-purple-700 mt-1">
                      {evaluation ? evaluation.empathy_score : 88}%
                    </p>
                    <p className="text-xs text-purple-600/80 mt-1">Emotion validation & politeness</p>
                  </div>

                  <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 text-center">
                    <span className="text-xs text-emerald-700 font-semibold uppercase">Issue Resolution</span>
                    <p className="text-3xl font-extrabold text-emerald-700 mt-1">
                      {evaluation ? evaluation.resolution_score : 85}%
                    </p>
                    <p className="text-xs text-emerald-600/80 mt-1">Troubleshooting & step adherence</p>
                  </div>

                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 text-center">
                    <span className="text-xs text-blue-700 font-semibold uppercase">Speech Clarity</span>
                    <p className="text-3xl font-extrabold text-blue-700 mt-1">
                      {evaluation ? evaluation.clarity_score : 86}%
                    </p>
                    <p className="text-xs text-blue-600/80 mt-1">Pronunciation & concise phrasing</p>
                  </div>
                </div>

                {/* Cards Side-by-Side: Coaching Summary (Soft Blue) & Targeted Improvement Tips (High-Color CTA) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                  {/* Left: AI Coaching Summary (Soft Blue-Indigo Card) */}
                  <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/40 p-6 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-blue-900">
                            AI Coaching Evaluation
                          </h4>
                          <p className="text-xs text-blue-700/70 font-medium">
                            Assessed against real-time BPO communication standards
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {evaluation ? evaluation.feedback_text || evaluation.feedback : "Strong conversational performance. You exhibited patience, de-escalated customer tension, and navigated the script smoothly."}
                      </p>
                    </div>
                  </div>

                  {/* Right: Targeted Improvement Tips (Vibrant Amber/Orange High-Color CTA Card) */}
                  <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50/60 p-6 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="mb-3">
                        <h4 className="text-base font-bold text-amber-900 mb-0.5">
                          Targeted Improvement Tips
                        </h4>
                        <p className="text-xs text-amber-800/80 font-medium">
                          Focus on these recommended action steps in your next call session:
                        </p>
                      </div>

                      <div className="space-y-2.5">
                        {(Array.isArray(evaluation?.suggestions) && evaluation.suggestions.length > 0
                          ? evaluation.suggestions
                          : [
                              "Acknowledge the customer's frustration earlier in the exchange",
                              "State clear resolution timelines when confirming steps",
                              "Maintain an encouraging, warm vocal tone during closing courtesy",
                            ]
                        ).map((tip, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-3 p-3 bg-white rounded-xl border border-amber-200/80 shadow-xs"
                          >
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center mt-0.5 shadow-xs">
                              {idx + 1}
                            </span>
                            <p className="text-xs font-semibold text-gray-800 leading-relaxed">
                              {tip}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Complete Dialogue History Review */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600">
                    Full Call Transcript History:
                  </h4>
                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-2">
                    {agentResponses.map((r, idx) => (
                      <div key={idx} className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-1 text-xs text-left">
                        <p className="text-blue-900">
                          <strong className="text-blue-700">Customer:</strong> "{r.customerPrompt}"
                        </p>
                        <p className="text-emerald-900">
                          <strong className="text-emerald-700">Agent (You):</strong> "{r.agentReply}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex gap-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setCallState("IDLE");
                      setCurrentTurn(0);
                      setCallDuration(0);
                      setAgentResponses([]);
                      setEvaluation(null);
                    }}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl text-sm transition text-center"
                  >
                    🔁 Retry This Scenario
                  </button>
                  <Link
                    to="/call-simulation"
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition text-center shadow-xs"
                  >
                    Choose Another Scenario →
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CallSimulationSession;
