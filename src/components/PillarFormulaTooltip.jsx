import React, { useState, useRef, useEffect } from 'react';

export const PILLAR_FORMULAS = {
  'Pronunciation': {
    name: 'Pronunciation',
    weight: '30%',
    formula: 'P = (Content Accuracy × 0.40) + (Filler Cleanliness × 0.30) + (Audio Quality × 0.30)',
    subWeights: [
      { name: 'Content Accuracy', weight: '40%', desc: 'Word recognition accuracy against target passage' },
      { name: 'Filler Cleanliness', weight: '30%', desc: 'Absence of filler words (um, uh, like) & disfluencies' },
      { name: 'Audio Signal Quality', weight: '30%', desc: 'Acoustic mic signal clarity (45%) & energy blend (55%)' },
    ],
  },
  'Fluency': {
    name: 'Fluency',
    weight: '25%',
    formula: 'F = (Pacing Score × 0.65) + (Audio Delivery Consistency × 0.35)',
    subWeights: [
      { name: 'Pacing Score', weight: '65%', desc: 'Target conversational cadence of 115–145 words per minute' },
      { name: 'Delivery Consistency', weight: '35%', desc: 'Smooth vocal delivery without dead air or abrupt halts' },
    ],
  },
  'Sentence Mastery': {
    name: 'Sentence Mastery',
    weight: '25%',
    formula: 'S = (Filler Cleanliness × 0.55) + (Content Accuracy × 0.45)',
    subWeights: [
      { name: 'Filler Cleanliness', weight: '55%', desc: 'Suppression of verbal crutches & hesitation pauses' },
      { name: 'Content Accuracy', weight: '45%', desc: 'Syntactic sentence structure & correct word sequencing' },
    ],
  },
  'Vocabulary': {
    name: 'Vocabulary',
    weight: '20%',
    formula: 'V = (Content Coverage × 0.70) + (Completion Ratio × 0.30)',
    subWeights: [
      { name: 'Content Coverage', weight: '70%', desc: 'Lexical coverage: percentage of target passage words spoken' },
      { name: 'Completion Ratio', weight: '30%', desc: 'Full passage completion ratio within target timeframe' },
    ],
  },
};

export default function PillarFormulaTooltip({ pillarName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const containerRef = useRef(null);

  const info = PILLAR_FORMULAS[pillarName] || Object.values(PILLAR_FORMULAS).find(
    (item) => item.name.toLowerCase() === String(pillarName || '').toLowerCase()
  );

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

  return (
    <span
      ref={containerRef}
      className="relative inline-flex items-center ml-1.5 align-middle select-none"
      onMouseEnter={() => {
        if (!isPinned) setIsOpen(true);
      }}
      onMouseLeave={() => {
        if (!isPinned) setIsOpen(false);
      }}
    >
      {/* Tooltip Trigger Icon */}
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
        className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center transition-all cursor-pointer shadow-xs ${
          isOpen || isPinned
            ? 'bg-blue-600 text-white ring-2 ring-blue-300 ring-offset-1'
            : 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 hover:text-blue-800'
        }`}
        title={`View ${info.name} formula & sub-weights`}
        aria-label={`View ${info.name} formula and sub-weights`}
      >
        i
      </button>

      {/* Floating Popover / Tooltip */}
      {(isOpen || isPinned) && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 bottom-full mb-2.5 w-76 sm:w-84 bg-gray-900/98 text-white rounded-xl shadow-2xl p-3.5 z-[100] border border-gray-700/80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-gray-800">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span className="text-xs font-bold text-gray-100 tracking-wide">
                {info.name} Sub-Weights
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/60">
                Pillar Weight: {info.weight}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsPinned(false);
              }}
              className="text-gray-400 hover:text-white text-xs px-1 hover:bg-gray-800 rounded transition"
            >
              ✕
            </button>
          </div>

          {/* Formula Display Box */}
          <div className="mt-2.5 p-2 rounded-lg bg-gray-950/90 border border-gray-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
              Sub-Weight Formula (WSM):
            </span>
            <code className="text-[11px] font-mono text-emerald-300 font-semibold leading-relaxed block break-words">
              {info.formula}
            </code>
          </div>

          {/* Sub-Components Breakdown */}
          <div className="mt-2.5 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              Feature Decomposition:
            </span>
            {info.subWeights.map((sub, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between gap-2 p-1.5 rounded-md bg-gray-800/40 hover:bg-gray-800/70 transition"
              >
                <div className="flex-1">
                  <div className="text-[11px] font-semibold text-gray-200">
                    {sub.name}
                  </div>
                  <div className="text-[10px] text-gray-400 leading-tight">
                    {sub.desc}
                  </div>
                </div>
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 self-center">
                  {sub.weight}
                </span>
              </div>
            ))}
          </div>

          {/* Academic Attribution Footer */}
          <div className="mt-2.5 pt-2 border-t border-gray-800/80 flex items-center justify-between text-[9px] text-gray-400 font-medium">
            <span>Algorithm: Weighted Sum Model (WSM)</span>
            <span className="text-gray-500">MCDA Framework</span>
          </div>

          {/* Arrow pointing down */}
          <div className="absolute left-2.5 -bottom-1.5 w-3 h-3 bg-gray-900 border-b border-r border-gray-700/80 rotate-45 transform"></div>
        </div>
      )}
    </span>
  );
}
