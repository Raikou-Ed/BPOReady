import React, { useState, useRef, useEffect } from 'react';

export const PILLAR_FORMULAS = {
  // Paragraph Reading & Pre-Assessment Pillars (Core Monologic Speech Dimensions: Accuracy 50%, Fluency 50%)
  'Accuracy': {
    name: 'Accuracy (Acoustic & Phonetic Clarity)',
    weight: '50%',
    formula: '(Content Accuracy × 40%) + (Filler Cleanliness × 30%) + (Audio Quality × 30%)',
    subWeights: [
      { name: 'Content Accuracy', weight: '40%', desc: 'Word recognition accuracy against target passage' },
      { name: 'Filler Cleanliness', weight: '30%', desc: 'Absence of filler words (um, uh, like) & hesitations' },
      { name: 'Audio Signal Quality', weight: '30%', desc: 'Acoustic mic signal clarity and vocal energy' },
    ],
    standard: 'CEFR Accuracy & Pronunciation Standard',
  },
  'Pronunciation': {
    name: 'Accuracy (Pronunciation)',
    weight: '50%',
    formula: '(Content Accuracy × 40%) + (Filler Cleanliness × 30%) + (Audio Quality × 30%)',
    subWeights: [
      { name: 'Content Accuracy', weight: '40%', desc: 'Word recognition accuracy against target passage' },
      { name: 'Filler Cleanliness', weight: '30%', desc: 'Absence of filler words (um, uh, like) & hesitations' },
      { name: 'Audio Signal Quality', weight: '30%', desc: 'Acoustic mic signal clarity and vocal energy' },
    ],
    standard: 'CEFR Accuracy & Pronunciation Standard',
  },
  'Fluency': {
    name: 'Fluency (Cadence & Pause Smoothness)',
    weight: '50%',
    formula: '(Pacing Rate × 65%) + (Delivery Consistency × 35%)',
    subWeights: [
      { name: 'Pacing Rate', weight: '65%', desc: 'Target conversational cadence of 115–145 words per minute' },
      { name: 'Delivery Consistency', weight: '35%', desc: 'Continuous vocal flow without long unnatural pauses' },
    ],
    standard: 'CEFR Spoken Fluency Standard',
  },
  'Range': {
    name: 'Range (CEFR Range)',
    weight: '20%',
    formula: '(Filler Cleanliness × 55%) + (Content Accuracy × 45%)',
    subWeights: [
      { name: 'Filler Cleanliness', weight: '55%', desc: 'Suppression of verbal crutches & sentence hesitations' },
      { name: 'Content Accuracy', weight: '45%', desc: 'Accurate sentence structure & word sequencing' },
    ],
    standard: 'CEFR Table 3: Lexical & Grammatical Range',
  },
  'Sentence Mastery': {
    name: 'Range (Sentence Mastery)',
    weight: '20%',
    formula: '(Filler Cleanliness × 55%) + (Content Accuracy × 45%)',
    subWeights: [
      { name: 'Filler Cleanliness', weight: '55%', desc: 'Suppression of verbal crutches & sentence hesitations' },
      { name: 'Content Accuracy', weight: '45%', desc: 'Accurate sentence structure & word sequencing' },
    ],
    standard: 'CEFR Table 3: Lexical & Grammatical Range',
  },
  'Coherence': {
    name: 'Coherence (CEFR Coherence)',
    weight: '20%',
    formula: '(Passage Coverage × 70%) + (Completion Ratio × 30%)',
    subWeights: [
      { name: 'Passage Coverage', weight: '70%', desc: 'Percentage of unique passage vocabulary read aloud' },
      { name: 'Completion Ratio', weight: '30%', desc: 'Full passage completion within target reading time' },
    ],
    standard: 'CEFR Table 3: Vocabulary & Discourse Coherence',
  },
  'Vocabulary': {
    name: 'Coherence (Vocabulary)',
    weight: '20%',
    formula: '(Passage Coverage × 70%) + (Completion Ratio × 30%)',
    subWeights: [
      { name: 'Passage Coverage', weight: '70%', desc: 'Percentage of unique passage vocabulary read aloud' },
      { name: 'Completion Ratio', weight: '30%', desc: 'Full passage completion within target reading time' },
    ],
    standard: 'CEFR Table 3: Vocabulary & Discourse Coherence',
  },

  // Mock Interview Scoring Model
  'MockInterview': {
    name: 'Mock Interview Scoring (CEFR Table 3 Balanced Model)',
    weight: '100%',
    formula: '(Accuracy × 20%) + (Fluency × 20%) + (Range × 20%) + (Interaction × 20%) + (Coherence × 20%)',
    subWeights: [
      { name: 'Accuracy (Grammar & Enunciation)', weight: '20%', desc: 'Grammatical control, clear pronunciation & acoustic crispness' },
      { name: 'Fluency (Speaking Pace)', weight: '20%', desc: 'Natural tempo without long hesitation (120–150 words per minute)' },
      { name: 'Range (Professional Lexicon)', weight: '20%', desc: 'Professional BPO vocabulary without crutch words or fillers' },
      { name: 'Interaction (Composure & Tone)', weight: '20%', desc: 'Professional composure, question relevance & confident delivery' },
      { name: 'Coherence (STAR Method Structure)', weight: '20%', desc: 'Structuring answers using Situation, Task, Action, and Result' },
    ],
    standard: 'CEFR Table 3: Spoken Interaction & STAR Coherence',
  },

  // Call Simulation QA Scorecard
  'CallSimulation': {
    name: 'Call Simulation QA (CEFR Customer-Centric Model)',
    weight: '100%',
    formula: '(Interaction × 30%) + (Coherence × 25%) + (Fluency × 15%) + (Accuracy × 15%) + (Range × 15%)',
    subWeights: [
      { name: 'Interaction (Empathy & De-escalation)', weight: '30%', desc: 'Empathy validation, customer de-escalation & active listening' },
      { name: 'Coherence (Troubleshooting & Resolution)', weight: '25%', desc: 'Step-by-step troubleshooting, timeline setting & issue resolution' },
      { name: 'Fluency (Conversational Pace)', weight: '15%', desc: 'Calm, steady conversational tempo with customer under pressure' },
      { name: 'Accuracy (Verification & Enunciation)', weight: '15%', desc: 'Accurate customer verification & clear phonetic enunciation' },
      { name: 'Range (Customer Service Vocabulary)', weight: '15%', desc: 'Polite customer service phrasing ("Certainly", "Allow me to verify")' },
    ],
    standard: 'CEFR Table 3: Spoken Interaction & Customer Phone Support',
  },
};

export default function PillarFormulaTooltip({ pillarName, align = 'left', placement = 'auto' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [positionBelow, setPositionBelow] = useState(placement === 'bottom');
  const containerRef = useRef(null);

  const info = PILLAR_FORMULAS[pillarName] || Object.values(PILLAR_FORMULAS).find(
    (item) => item.name.toLowerCase() === String(pillarName || '').toLowerCase()
  );

  useEffect(() => {
    if (isOpen || isPinned) {
      if (placement === 'bottom') {
        setPositionBelow(true);
      } else if (placement === 'top') {
        setPositionBelow(false);
      } else if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // If trigger is within 360px of the viewport top, place below to prevent cutoff
        setPositionBelow(rect.top < 360);
      }
    }
  }, [isOpen, isPinned, placement]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setIsPinned(false);
      }
    }
    if (isOpen || isPinned) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, isPinned]);

  if (!info) return null;

  const isAlignRight = align === 'right';

  return (
    <span
      ref={containerRef}
      className="relative inline-flex items-center ml-1.5 align-middle select-none text-left"
      onMouseEnter={() => {
        if (!isPinned) setIsOpen(true);
      }}
      onMouseLeave={() => {
        if (!isPinned) setIsOpen(false);
      }}
    >
      {/* Subtle, standard question mark / info trigger icon */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (isPinned) {
            setIsPinned(false);
            setIsOpen(false);
          } else {
            setIsPinned(true);
            setIsOpen(true);
          }
        }}
        className={`w-4 h-4 rounded-full text-[10px] font-semibold flex items-center justify-center transition-all cursor-pointer ${isOpen || isPinned
          ? 'bg-blue-600 text-white shadow-xs'
          : 'bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600 border border-gray-200'
          }`}
        title={`Click to view ${info.name} formula`}
        aria-label={`View ${info.name} calculation breakdown`}
      >
        i
      </button>

      {/* Clean, professional popover that matches the BPOReady light theme */}
      {(isOpen || isPinned) && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute ${
            positionBelow ? 'top-full mt-2.5' : 'bottom-full mb-2.5'
          } w-72 sm:w-84 max-h-[80vh] overflow-y-auto bg-white text-gray-800 rounded-xl shadow-2xl p-3.5 z-[100] border border-gray-200 animate-in fade-in zoom-in-95 duration-100 ${
            isAlignRight ? 'right-0' : 'left-0'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div>
              <h4 className="text-xs font-bold text-gray-900">
                {info.name} Breakdown
              </h4>
              <p className="text-[10px] text-gray-500 font-medium">
                Evaluation Weight: <span className="font-semibold text-blue-600">{info.weight}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsPinned(false);
              }}
              className="text-gray-400 hover:text-gray-600 text-xs w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 transition"
            >
              ✕
            </button>
          </div>

          {/* Formula Card - Soft Blue Accent */}
          <div className="mt-2.5 p-2.5 rounded-lg bg-blue-50/70 border border-blue-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block mb-1">
              Formula:
            </span>
            <div className="text-xs font-medium text-blue-950 leading-relaxed">
              {info.formula}
            </div>
          </div>

          {/* Sub-Weights List */}
          <div className="mt-2.5 space-y-1.5 max-h-48 overflow-y-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              Components:
            </span>
            {info.subWeights.map((sub, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 p-1.5 rounded-md hover:bg-gray-50 transition border border-transparent hover:border-gray-100"
              >
                <div className="flex-1 pr-1">
                  <div className="text-xs font-semibold text-gray-800">
                    {sub.name}
                  </div>
                  <div className="text-[10px] text-gray-500 leading-tight">
                    {sub.desc}
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200 flex-shrink-0">
                  {sub.weight}
                </span>
              </div>
            ))}
          </div>

          {/* Subtle note footer */}
          <div className="mt-2.5 pt-2 border-t border-gray-100 text-[10px] text-gray-400 flex items-center justify-between">
            <span>{info.standard || 'Evaluation Rubric'}</span>
            <span>Weighted Scoring</span>
          </div>

          {/* Pointer arrow */}
          <div
            className={`absolute ${
              positionBelow
                ? '-top-1.5 border-t border-l border-gray-200'
                : '-bottom-1.5 border-b border-r border-gray-200'
            } w-3 h-3 bg-white rotate-45 transform ${
              isAlignRight ? 'right-3' : 'left-2.5'
            }`}
          ></div>
        </div>
      )}
    </span>
  );
}
