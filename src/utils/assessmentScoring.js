import { clearUserData, getUserData, saveUserData, getCurrentUser } from './userData.js';

export const LEVEL_RANK = {
  easy: 1,
  medium: 2,
  hard: 3,
};

const LEVELS = [
  { level: 'easy', min: 0, max: 75 },
  { level: 'medium', min: 76, max: 89 },
  { level: 'hard', min: 90, max: 100 },
];

export const CEFR_BENCHMARKS = {
  easy: {
    cefr: 'CEFR A2/B1',
    level: 'Easy Level',
    title: 'Foundational Remedial Track',
    badge: 'CEFR B1 Track',
    status: 'Developmental Needed',
    passingText: 'Requires foundational coaching on pronunciation, fluency cadence, and vocabulary.',
  },
  medium: {
    cefr: 'CEFR B2',
    level: 'Medium Level',
    title: 'Official BPO Voice Benchmark',
    badge: 'CEFR B2 Benchmark (Hiring Standard)',
    status: 'Standard Met',
    passingText: 'Meets official BPO hiring benchmark for Teleperformance, Concentrix, and Alorica.',
  },
  hard: {
    cefr: 'CEFR C1/C2',
    level: 'Hard Level',
    title: 'Advanced Voice / Escalations Track',
    badge: 'CEFR C1 (Advanced)',
    status: 'Exceeds Standard',
    passingText: 'Exceptional verbal fluency qualified for Tier-1 technical support and high-complexity voice accounts.',
  },
};

export function hasMeaningfulSpeech({ transcript = '', audioMetrics = null, durationSeconds = 0 }) {
  const transcriptText = String(transcript || '').trim();
  const transcriptWords = (transcriptText.toLowerCase().match(/[a-z']+/g) || []).map(word => word.replace(/'s$/, ''));
  const signalQuality = Number(audioMetrics?.signal ?? 0);
  const consistencyQuality = Number(audioMetrics?.consistency ?? 0);
  const duration = Number(durationSeconds) || 0;

  // 1. Real words recognized by speech recognition
  if (transcriptWords.length >= 2 || transcriptText.length >= 5) {
    return true;
  }

  // 2. If browser speech recognition is not supported or yielded empty text,
  // there MUST be substantial voice audio recorded (at least 2.5s duration, signal >= 15, and consistency >= 15%)
  if (duration >= 2.5 && signalQuality >= 15 && consistencyQuality >= 15) {
    return true;
  }

  // Pure silence, too short, or empty background noise
  return false;
}

function getSpeechCriteria({ transcript = '', expectedText = '', wordCount = 0, durationSeconds = 0, audioMetrics = null }) {
  const transcriptWords = (transcript.toLowerCase().match(/[a-z']+/g) || []).map(word => word.replace(/'s$/, ''));
  const expectedWords = (expectedText.toLowerCase().match(/[a-z']+/g) || []).map(word => word.replace(/'s$/, ''));
  const hasMeaningfulAudio = hasMeaningfulSpeech({ transcript, audioMetrics, durationSeconds });

  if (!hasMeaningfulAudio) {
    return { content: 0, filler: 0, fillerWords: 0, transcriptWordCount: 0, hasMeaningfulAudio: false, matchedWords: 0 };
  }

  if (!expectedWords.length) {
    return { content: 80, filler: 100, fillerWords: 0, transcriptWordCount: transcriptWords.length, hasMeaningfulAudio: true, matchedWords: 0 };
  }

  const transcriptCounts = {};
  transcriptWords.forEach((word) => {
    transcriptCounts[word] = (transcriptCounts[word] || 0) + 1;
  });

  const expectedCounts = {};
  expectedWords.forEach((word) => {
    expectedCounts[word] = (expectedCounts[word] || 0) + 1;
  });

  let matchedWords = 0;
  Object.keys(expectedCounts).forEach((word) => {
    matchedWords += Math.min(expectedCounts[word], transcriptCounts[word] || 0);
  });

  let content = 0;
  if (transcriptWords.length > 0) {
    // Exact word matching against expected passage
    content = Math.min(100, Math.round((matchedWords / expectedWords.length) * 100));
  } else {
    // When browser speech recognition is offline/unsupported but user spoke with real voice:
    const targetDuration = Math.max(10, Math.round((expectedWords.length / 125) * 60));
    const durationRatio = Math.min(100, Math.round((Number(durationSeconds) / targetDuration) * 100));
    const consistencyQuality = Number(audioMetrics?.consistency ?? 50);
    content = Math.max(25, Math.min(75, Math.round((durationRatio * 0.5) + (consistencyQuality * 0.5))));
  }

  const fillerWords = transcriptWords.filter(word => ['um', 'uh', 'erm', 'like', 'actually', 'uhm', 'er'].includes(word)).length;
  const fillerRate = fillerWords / Math.max(transcriptWords.length, 1);
  const filler = Math.max(20, Math.min(100, Math.round(100 - (fillerRate * 500) - (fillerWords * 8))));

  return { content, filler, fillerWords, transcriptWordCount: transcriptWords.length, hasMeaningfulAudio: true, matchedWords };
}

export function calculateAssessmentScore({ durationSeconds, wordCount, transcript, expectedText, audioMetrics = null, currentLevel = null }) {
  const rawDuration = Number(durationSeconds) || 0;
  const hasAudio = hasMeaningfulSpeech({ transcript, audioMetrics, durationSeconds: rawDuration });

  if (!hasAudio) {
    return {
      score: 0,
      placedLevel: currentLevel || 'easy',
      wordsPerMinute: 0,
      criteria: [
        { name: 'Accuracy', pillar: 'Accuracy (Acoustic & Phonetic Articulation)', value: 0, weight: 50, contribution: 0, detail: 'No speech detected' },
        { name: 'Fluency', pillar: 'Fluency (Speech Rate & Pause Smoothness)', value: 0, weight: 50, contribution: 0, detail: 'No speech detected' },
      ],
      metrics: {
        accuracy: 0,
        fluency: 0,
        range: 0,
        coherence: 0,
        // Backward-compatible aliases for legacy readers
        pronunciation: 0,
        sentenceMastery: 0,
        vocabulary: 0,
        pacing: 0,
        content: 0,
        clarityConfidence: 0,
        deliveryConsistency: 0,
        completion: 0,
        targetWordsPerMinute: 125,
        accuracyWeight: 50,
        fluencyWeight: 50,
        rangeWeight: 0,
        coherenceWeight: 0,
        pronunciationWeight: 50,
        sentenceMasteryWeight: 0,
        vocabularyWeight: 0,
        pacingWeight: 50,
        contentWeight: 0,
        clarityConfidenceWeight: 0,
        deliveryConsistencyWeight: 50,
        completionWeight: 0,
        accuracyContribution: 0,
        fluencyContribution: 0,
        rangeContribution: 0,
        coherenceContribution: 0,
        pronunciationContribution: 0,
        sentenceMasteryContribution: 0,
        vocabularyContribution: 0,
        transcriptWordCount: 0,
        transcriptAvailable: false,
      },
    };
  }

  const duration = Math.max(rawDuration, 1);
  const expectedWords = (expectedText.toLowerCase().match(/[a-z']+/g) || []).map(word => word.replace(/'s$/, ''));
  const expectedWordCount = expectedWords.length || 30;

  const transcriptText = String(transcript || '').trim();
  const transcriptWords = (transcriptText.toLowerCase().match(/[a-z']+/g) || []).map(word => word.replace(/'s$/, ''));

  const speechCriteria = getSpeechCriteria({ transcript, expectedText, wordCount: transcriptWords.length || wordCount, durationSeconds: duration, audioMetrics });

  const matchedWords = speechCriteria.matchedWords ?? 0;
  const isSpeechTranscribed = transcriptWords.length > 0;
  const coverageRatio = expectedWordCount > 0 ? (matchedWords / expectedWordCount) : 0;

  // If speech was transcribed, but fewer than 3 words matched OR coverage is under 15%:
  // (Prevents scoring unrelated speech that only shares coincidental words like 'and', 'the', 'is')
  if (isSpeechTranscribed && (matchedWords < 3 || coverageRatio < 0.15)) {
    return {
      score: 0,
      placedLevel: currentLevel || 'easy',
      wordsPerMinute: 0,
      criteria: [
        { name: 'Accuracy', pillar: 'Accuracy (Pronunciation & Articulation)', value: 0, weight: 50, contribution: 0, detail: 'Passage not read' },
        { name: 'Fluency', pillar: 'Fluency (Pacing & Smoothness: 115–145 WPM)', value: 0, weight: 50, contribution: 0, detail: 'Off-topic speech' },
      ],
      metrics: {
        accuracy: 0,
        fluency: 0,
        range: 0,
        coherence: 0,
        // Backward-compatible aliases for legacy readers
        pronunciation: 0,
        sentenceMastery: 0,
        vocabulary: 0,
        pacing: 0,
        content: 0,
        clarityConfidence: 0,
        deliveryConsistency: 0,
        completion: 0,
        targetWordsPerMinute: 125,
        accuracyWeight: 50,
        fluencyWeight: 50,
        rangeWeight: 0,
        coherenceWeight: 0,
        pronunciationWeight: 50,
        sentenceMasteryWeight: 0,
        vocabularyWeight: 0,
        pacingWeight: 50,
        contentWeight: 0,
        clarityConfidenceWeight: 0,
        deliveryConsistencyWeight: 50,
        completionWeight: 0,
        accuracyContribution: 0,
        fluencyContribution: 0,
        rangeContribution: 0,
        coherenceContribution: 0,
        pronunciationContribution: 0,
        sentenceMasteryContribution: 0,
        vocabularyContribution: 0,
        transcriptWordCount: transcriptWords.length,
        transcriptAvailable: true,
      },
    };
  }

  // Calculate speaking rate (WPM)
  let wordsPerMinute = 0;
  if (transcriptWords.length > 0) {
    wordsPerMinute = Math.round((transcriptWords.length / duration) * 60);
  } else {
    const estimatedWords = Math.min(expectedWordCount, Math.max(1, Math.round((duration / 25) * expectedWordCount)));
    wordsPerMinute = Math.round((estimatedWords / duration) * 60);
  }

  // Pace scoring (natural conversational & reading pace: 110-145 WPM)
  let paceScore = 80;
  if (wordsPerMinute >= 115 && wordsPerMinute <= 145) {
    paceScore = 100;
  } else if (wordsPerMinute >= 95 && wordsPerMinute < 115) {
    paceScore = Math.round(82 + ((wordsPerMinute - 95) / 20) * 18);
  } else if (wordsPerMinute > 145 && wordsPerMinute <= 170) {
    paceScore = Math.round(100 - ((wordsPerMinute - 145) / 25) * 18);
  } else if (wordsPerMinute >= 70 && wordsPerMinute < 95) {
    paceScore = Math.round(68 + ((wordsPerMinute - 70) / 25) * 14);
  } else if (wordsPerMinute > 170 && wordsPerMinute <= 200) {
    paceScore = Math.round(82 - ((wordsPerMinute - 170) / 30) * 17);
  } else if (wordsPerMinute < 70) {
    paceScore = Math.max(30, Math.round(48 + (wordsPerMinute / 70) * 20));
  } else {
    paceScore = Math.max(30, Math.round(65 - ((wordsPerMinute - 200) / 50) * 20));
  }

  const targetDuration = Math.max(10, Math.round((expectedWordCount / 125) * 60));
  const timeRatio = Math.min(1, duration / targetDuration);

  // Completion evaluates how much of the assigned passage was read to completion
  const completionScore = isSpeechTranscribed
    ? Math.min(100, Math.round(coverageRatio * 100))
    : Math.min(100, Math.round(timeRatio * 100));

  const signalQuality = Number(audioMetrics?.signal ?? 50);
  const consistencyQuality = Number(audioMetrics?.consistency ?? 50);
  const audioBlendScore = Math.max(40, Math.min(100, Math.round((signalQuality * 0.45) + (consistencyQuality * 0.55))));

  const fillerCleanliness = Math.max(20, Math.min(100, speechCriteria.filler));
  const contentScore = Math.max(0, Math.min(100, speechCriteria.content));

  // CEFR Table 3 Dimension 1: Accuracy / Pronunciation (Weight: 30%) - Acoustic enunciation & phonetic clarity
  const accuracyScore = Math.max(10, Math.min(100, Math.round(
    (contentScore * 0.40) + (fillerCleanliness * 0.30) + (audioBlendScore * 0.30)
  )));

  // CEFR Table 3 Dimension 2: Fluency (Weight: 30%) - Conversational reading pace (115-145 WPM) & pause smoothness
  const fluencyScore = Math.max(10, Math.min(100, Math.round(
    (paceScore * 0.65) + (audioBlendScore * 0.35)
  )));

  // CEFR Table 3 Dimension 3: Range / Sentence Mastery (Weight: 20%) - Vocabulary coverage & filler suppression
  const rangeScore = Math.max(10, Math.min(100, Math.round(
    (fillerCleanliness * 0.55) + (contentScore * 0.45)
  )));

  // CEFR Table 3 Dimension 4: Coherence / Vocabulary (Weight: 20%) - Complete sentence flow without choppy breaks
  const coherenceScore = Math.max(0, Math.min(100, Math.round(
    (contentScore * 0.70) + (completionScore * 0.30)
  )));

  const activeCriteria = getActiveEvaluationCriteria();

  const scoreLookup = {
    accuracy: accuracyScore,
    pronunciation: accuracyScore,
    fluency: fluencyScore,
    pacing: fluencyScore,
    speakingpace: fluencyScore,
    range: rangeScore,
    sentencemastery: rangeScore,
    coherence: coherenceScore,
    vocabulary: coherenceScore,
  };

  const calculatedCriteria = activeCriteria.map(c => {
    const key = (c.name || '').toLowerCase().replace(/[^a-z]/g, '');
    let val = scoreLookup[key];
    if (val == null) {
      val = Math.round((accuracyScore + fluencyScore) / 2);
    }
    const weight = Number(c.weight || 0);
    const contribution = Number(((val * weight) / 100).toFixed(2));
    return {
      name: c.name,
      pillar: c.pillar || `CEFR ${c.name}`,
      value: Math.round(val),
      weight,
      contribution,
      detail: c.detail || `${Math.round(wordsPerMinute)} WPM cadence`,
    };
  });

  const rawSum = calculatedCriteria.reduce((sum, c) => sum + c.contribution, 0);
  const score = Math.max(0, Math.min(100, Number(rawSum.toFixed(2))));

  // Determine placedLevel with progressive advancement & anti-downgrade rules
  const basePlacement = LEVELS.find(({ min, max }) => score >= min && score <= max) || LEVELS[0];
  let placedLevel = basePlacement.level;

  if (currentLevel === 'easy') {
    // In Easy Level: passing score (>= 76 / CEFR B2) unlocks Medium Level.
    // The candidate CANNOT jump directly to Hard Level from Easy!
    placedLevel = score >= 76 ? 'medium' : 'easy';
  } else if (currentLevel === 'medium') {
    // In Medium Level: passing score (>= 90 / CEFR C1) unlocks Hard Level.
    // Low score NEVER demotes back to Easy!
    placedLevel = score >= 90 ? 'hard' : 'medium';
  } else if (currentLevel === 'hard') {
    // In Hard Level: candidate is at the highest level. NEVER demoted to Easy or Medium!
    placedLevel = 'hard';
  }

  const accuracyWeight = activeCriteria.find(c => (c.name || '').toLowerCase().includes('accuracy'))?.weight ?? 50;
  const fluencyWeight = activeCriteria.find(c => (c.name || '').toLowerCase().includes('fluency'))?.weight ?? 50;
  const rangeWeight = activeCriteria.find(c => (c.name || '').toLowerCase().includes('range'))?.weight ?? 0;
  const coherenceWeight = activeCriteria.find(c => (c.name || '').toLowerCase().includes('coherence'))?.weight ?? 0;
  const pronunciationWeight = accuracyWeight;
  const sentenceMasteryWeight = rangeWeight;
  const vocabularyWeight = coherenceWeight;

  const accuracyContribution = Number(((accuracyScore * accuracyWeight) / 100).toFixed(2));
  const fluencyContribution = Number(((fluencyScore * fluencyWeight) / 100).toFixed(2));
  const rangeContribution = Number(((rangeScore * rangeWeight) / 100).toFixed(2));
  const coherenceContribution = Number(((coherenceScore * coherenceWeight) / 100).toFixed(2));
  const pronunciationContribution = accuracyContribution;
  const sentenceMasteryContribution = rangeContribution;
  const vocabularyContribution = coherenceContribution;

  const metrics = {
    accuracy: Math.round(accuracyScore),
    fluency: Math.round(fluencyScore),
    range: Math.round(rangeScore),
    coherence: Math.round(coherenceScore),
    // Backward-compatible aliases for legacy readers
    pronunciation: Math.round(accuracyScore),
    sentenceMastery: Math.round(rangeScore),
    vocabulary: Math.round(coherenceScore),
    pacing: Math.round(fluencyScore),
    content: Math.round(coherenceScore),
    clarityConfidence: Math.round(rangeScore),
    deliveryConsistency: Math.round(fluencyScore),
    completion: Math.round(completionScore),
    targetWordsPerMinute: 125,
    accuracyWeight,
    fluencyWeight,
    rangeWeight,
    coherenceWeight,
    pronunciationWeight,
    sentenceMasteryWeight,
    vocabularyWeight,
    pacingWeight: fluencyWeight,
    contentWeight: coherenceWeight,
    clarityConfidenceWeight: rangeWeight,
    deliveryConsistencyWeight: fluencyWeight,
    completionWeight: coherenceWeight,
    accuracyContribution,
    fluencyContribution,
    rangeContribution,
    coherenceContribution,
    pronunciationContribution,
    sentenceMasteryContribution,
    vocabularyContribution,
    pacingContribution: fluencyContribution,
    contentContribution: coherenceContribution,
    transcriptWordCount: speechCriteria.transcriptWordCount,
    transcriptAvailable: Boolean(transcriptWords.length),
  };

  const criteria = calculatedCriteria;

  return {
    score,
    placedLevel,
    wordsPerMinute: Math.round(wordsPerMinute),
    framework: 'CEFR Table 3 Spoken Assessment',
    criteria,
    metrics,
  };
}

export const DEFAULT_READING_CRITERIA = [
  {
    id: 1,
    name: 'Accuracy',
    pillar: 'Accuracy (Acoustic & Phonetic Articulation)',
    weight: 50,
    detail: 'Vowel & consonant articulation clarity',
  },
  {
    id: 2,
    name: 'Fluency',
    pillar: 'Fluency (Speech Rate & Pause Smoothness)',
    weight: 50,
    detail: 'Speech rhythm, optimal cadence & pause control',
  },
];

export function getActiveEvaluationCriteria() {
  try {
    const custom = getUserData('bpoReadyScoringCriteria');
    if (Array.isArray(custom) && custom.length === 2) {
      return custom.map((c, idx) => ({
        id: c.id || idx + 1,
        name: c.name || (idx === 0 ? 'Accuracy' : 'Fluency'),
        pillar: c.pillar || (idx === 0 ? 'Accuracy (Acoustic & Phonetic Articulation)' : 'Fluency (Speech Rate & Pause Smoothness)'),
        weight: Number(c.weight) != null ? Number(c.weight) : 50,
        detail: c.detail || '',
      }));
    }
  } catch { }
  return DEFAULT_READING_CRITERIA;
}

export function sanitizeReadingResult(raw, defaultLevel = 'medium') {
  if (!raw) return null;
  const numScore = Number(raw.score || 0);
  const activeCriteria = getActiveEvaluationCriteria();
  const activeCount = activeCriteria.length;

  const hasLegacyCriteria =
    !Array.isArray(raw.criteria) ||
    raw.criteria.length !== activeCount ||
    raw.criteria.some(
      (c) =>
        c.name === 'Pronunciation' ||
        c.name === 'Sentence Mastery' ||
        c.name === 'Vocabulary' ||
        c.name === 'Range' ||
        c.name === 'Coherence'
    );

  let criteria = raw.criteria;
  if (hasLegacyCriteria) {
    if (numScore === 0) {
      criteria = [
        {
          name: 'Accuracy',
          pillar: 'Accuracy (Acoustic & Phonetic Articulation)',
          value: 0,
          weight: 50,
          contribution: 0,
          detail: 'Passage not read',
        },
        {
          name: 'Fluency',
          pillar: 'Fluency (Speech Rate & Pause Smoothness)',
          value: 0,
          weight: 50,
          contribution: 0,
          detail: 'Passage not read',
        },
      ];
    } else {
      criteria = generatePreAssessmentCriteria(numScore, raw.placedLevel || defaultLevel, raw.wordsPerMinute);
    }
  }

  // Determine correct placedLevel for this practice attempt according to level rules:
  // 1–75 Easy · 76–89 Medium · 90–100 Hard
  let placedLevel = defaultLevel;
  if (defaultLevel === 'medium') {
    placedLevel = numScore >= 90 ? 'hard' : 'medium';
  } else if (defaultLevel === 'easy') {
    placedLevel = numScore >= 76 ? 'medium' : 'easy';
  } else if (defaultLevel === 'hard') {
    placedLevel = 'hard';
  }

  const sanitized = {
    ...raw,
    score: numScore,
    placedLevel,
    criteria,
  };

  try {
    saveUserData('bpoReadyLastParagraphResult', sanitized);
  } catch { }

  return sanitized;
}

export const DEFAULT_MOCK_INTERVIEW_CRITERIA = [
  {
    id: 1,
    name: 'Accuracy',
    weight: 20,
    detail: 'Grammar control, clear pronunciation, and phonetic crispness.',
  },
  {
    id: 2,
    name: 'Fluency',
    weight: 20,
    detail: 'Natural speaking tempo (120–150 WPM) without hesitation.',
  },
  {
    id: 3,
    name: 'Range',
    weight: 20,
    detail: 'Professional BPO vocabulary without crutch words or fillers.',
  },
  {
    id: 4,
    name: 'Interaction',
    weight: 20,
    detail: 'Professional composure, question relevance, and confident tone.',
  },
  {
    id: 5,
    name: 'Coherence',
    weight: 20,
    detail: 'STAR method structure (Situation, Task, Action, Result).',
  },
];

export function getActiveMockInterviewCriteria() {
  try {
    const custom = getUserData('bpoReadyMockInterviewCriteria');
    if (Array.isArray(custom) && custom.length > 0) {
      return custom;
    }
  } catch { }
  return DEFAULT_MOCK_INTERVIEW_CRITERIA;
}

export const DEFAULT_CALL_SIMULATION_CRITERIA = [
  {
    id: 1,
    name: 'Interaction',
    weight: 40,
    detail: 'Active listening, customer empathy, conversational turn-taking, and post-call comprehension quiz accuracy.',
  },
  {
    id: 2,
    name: 'Fluency',
    weight: 30,
    detail: 'Conversational speech cadence, natural tempo (115–145 WPM), and dead-air management.',
  },
  {
    id: 3,
    name: 'Accuracy',
    weight: 30,
    detail: 'Phonetic articulation, grammatical correctness, verification precision, and professional phrasing.',
  },
];

export function getActiveCallSimulationCriteria() {
  try {
    const custom = getUserData('bpoReadyCallSimulationCriteria');
    if (Array.isArray(custom) && custom.length > 0) {
      return custom;
    }
  } catch { }
  return DEFAULT_CALL_SIMULATION_CRITERIA;
}

export const DEFAULT_CERTIFICATION_PREREQUISITES = {
  required_readings: 10,
  required_mock_interviews: 10,
  required_call_simulations: 10,
  min_performance_avg: 75,
  min_exam_composite: 85,
  min_stage_score: 70,
};

export function getActiveCertificationPrerequisites() {
  try {
    const saved = getUserData('bpoReadyCertificationPrerequisites');
    if (saved && typeof saved === 'object') {
      return {
        required_readings: Number(saved.required_readings ?? DEFAULT_CERTIFICATION_PREREQUISITES.required_readings),
        required_mock_interviews: Number(saved.required_mock_interviews ?? DEFAULT_CERTIFICATION_PREREQUISITES.required_mock_interviews),
        required_call_simulations: Number(saved.required_call_simulations ?? DEFAULT_CERTIFICATION_PREREQUISITES.required_call_simulations),
        min_performance_avg: Number(saved.min_performance_avg ?? DEFAULT_CERTIFICATION_PREREQUISITES.min_performance_avg),
        min_exam_composite: Number(saved.min_exam_composite ?? DEFAULT_CERTIFICATION_PREREQUISITES.min_exam_composite),
        min_stage_score: Number(saved.min_stage_score ?? DEFAULT_CERTIFICATION_PREREQUISITES.min_stage_score),
      };
    }
  } catch { }
  return DEFAULT_CERTIFICATION_PREREQUISITES;
}

export function formatScore(score) {
  if (score == null) return "0";
  const num = Number(score);
  if (isNaN(num)) return score;
  return Number.isInteger(num) ? String(num) : num.toFixed(2);
}

export function generatePreAssessmentCriteria(score, placedLevel = 'easy', wordsPerMinute = null) {
  const numScore = Number(score) || 70;
  const lvl = String(placedLevel || 'easy').toLowerCase();
  const wpm = wordsPerMinute || (lvl === 'hard' ? 145 : lvl === 'medium' ? 135 : 115);
  const activeCriteria = getActiveEvaluationCriteria();

  return activeCriteria.map((c, idx) => {
    const weight = Number(c.weight || 0);
    let val = Math.round(numScore);
    if (idx === 0) {
      val = lvl === 'hard' ? Math.min(100, Math.round(numScore + 1)) : Math.round(numScore);
    } else {
      val = lvl === 'hard' ? Math.max(0, Math.round(numScore - 1)) : Math.round(numScore);
    }
    const contribution = Number(((val * weight) / 100).toFixed(2));
    return {
      name: c.name,
      pillar: c.pillar || `CEFR ${c.name} Standard`,
      value: val,
      weight,
      contribution,
      detail: c.detail || (c.name.toLowerCase().includes('fluency') ? `${wpm} WPM • Flow & pause control` : 'Vowel & consonant articulation clarity'),
    };
  });
}

export function getAssignedLevel() {
  const data = getUserData('bpoReadyAssessment');
  if (data && data.score != null) {
    let num = Number(data.score);
    data.score = Number.isInteger(num) ? num : Number(num.toFixed(2));
    const lvl = String(data.placedLevel || 'easy').toLowerCase();
    const activeCount = getActiveEvaluationCriteria().length;

    // Check if criteria is missing, invalid, or length does not match active factors
    const hasCorruptOrLegacyCriteria = !Array.isArray(data.criteria) || data.criteria.length !== activeCount ||
      data.criteria.some(c => c.name === 'Pronunciation' || c.name === 'Sentence Mastery' || c.name === 'Vocabulary' || String(c.detail || '').includes('words matched')) ||
      Math.abs(data.criteria.reduce((sum, c) => sum + (Number(c.contribution) || 0), 0) - data.score) > 3;

    if (hasCorruptOrLegacyCriteria) {
      data.wordsPerMinute = data.wordsPerMinute && data.wordsPerMinute >= 115 ? data.wordsPerMinute : (lvl === 'hard' ? 145 : lvl === 'medium' ? 135 : 115);
      data.criteria = generatePreAssessmentCriteria(data.score, data.placedLevel, data.wordsPerMinute);
      saveUserData('bpoReadyAssessment', data);
    }

    return data;
  }

  return null;
}

export function saveAssessmentResult(result) {
  if (!result) return;
  if (result.score != null) {
    const num = Number(result.score);
    result.score = Number.isInteger(num) ? num : Number(num.toFixed(2));
  }

  // If this is a paragraph reading practice session (NOT a diagnostic pre-assessment)
  const isParagraphPractice = Boolean(result.isParagraphPractice || result.currentLevel || (!result.isPreAssessment));

  if (isParagraphPractice) {
    // Save paragraph attempt separately in bpoReadyLastParagraphResult
    saveUserData('bpoReadyLastParagraphResult', result);

    // Paragraph practice should NEVER overwrite or modify bpoReadyAssessment baseline data!
    // It only promotes the user's unlocked tier in the profile if higher.
    if (result.placedLevel) {
      const existing = getUserData('bpoReadyAssessment');
      const currentLevel = existing?.placedLevel || getCurrentUser()?.assigned_level || 'easy';
      const existingRank = LEVEL_RANK[currentLevel] || 1;
      const newRank = LEVEL_RANK[result.placedLevel] || 1;
      if (newRank > existingRank) {
        if (existing) {
          existing.placedLevel = result.placedLevel;
          saveUserData('bpoReadyAssessment', existing);
        }
        const user = getCurrentUser();
        if (user && user.assigned_level !== result.placedLevel) {
          user.assigned_level = result.placedLevel;
          saveUserData('user', user);
        }
      }
    }
    return;
  }

  // Otherwise, this IS the Pre-Assessment
  const existing = getUserData('bpoReadyAssessment');
  if (existing && existing.placedLevel) {
    const existingRank = LEVEL_RANK[existing.placedLevel] || 1;
    const newRank = LEVEL_RANK[result.placedLevel] || 1;
    if (existingRank > newRank) {
      result.placedLevel = existing.placedLevel;
    }
  }

  if (!result.criteria || !Array.isArray(result.criteria) || result.criteria.length === 0) {
    result.criteria = generatePreAssessmentCriteria(result.score, result.placedLevel, result.wordsPerMinute);
  }

  saveUserData('bpoReadyAssessment', result);

  const user = getCurrentUser();
  if (user) {
    user.assigned_level = result.placedLevel;
    saveUserData('user', user);
  }
}

export function clearAssessmentResult() {
  clearUserData('bpoReadyAssessment');
  clearUserData('bpoReadyLastParagraphResult');
  const user = getCurrentUser();
  if (user && (user.assigned_level || user.assignedLevel)) {
    delete user.assigned_level;
    delete user.assignedLevel;
    saveUserData('user', user);
  }
}

export function getScoreTieredFeedback(score) {
  const num = Number(score) || 0;
  if (num < 50) {
    return {
      feedbackText: "Reading performance is significantly below the BPO passing threshold. There were frequent hesitations, missed words, or substantial pacing mismatches. Targeted practice and word familiarization are required before advancing.",
      suggestions: [
        "Read the passage silently two to three times before recording to ensure correct pronunciation.",
        "Focus on pronouncing every syllable clearly rather than rushing through the text.",
        "Minimize pauses and avoid filler sounds like 'um' or 'uh' by practicing with a steady metronome or timer."
      ]
    };
  } else if (num < 76) {
    return {
      feedbackText: "Foundational reading attempt with room for improvement. Pronunciation and word recognition were partially clear, but pacing inconsistencies and occasional disfluencies reduced overall fluency.",
      suggestions: [
        "Work on pacing consistency: aim for a steady conversational pace of 115-145 words per minute.",
        "Emphasize final consonant sounds (e.g., -ed, -s, -t) for crisper articulation.",
        "Practice smooth sentence transitions without abrupt stops between phrases."
      ]
    };
  } else if (num < 90) {
    return {
      feedbackText: "Solid reading performance meeting standard BPO hiring benchmarks. Pacing is natural and word recognition is consistent, with only minor areas for articulation refinement.",
      suggestions: [
        "Continue refining intonation and vocal inflections to sound even more natural and engaging.",
        "Maintain vocal energy consistently from the first word to the closing sentence.",
        "Practice with industry-specific technical vocabulary to expand lexical confidence."
      ]
    };
  } else {
    return {
      feedbackText: "Exceptional reading performance demonstrating high verbal fluency, accurate word recognition, and professional cadence. Well-suited for high-complexity customer accounts.",
      suggestions: [
        "Practice advanced customer scenario roleplays to maintain peak vocal readiness.",
        "Refine tonal adaptability to match diverse customer temperaments.",
        "Explore complex escalation call simulations to further enhance composure."
      ]
    };
  }
}

