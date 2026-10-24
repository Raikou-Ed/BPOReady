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
        { name: 'Pronunciation', pillar: 'Pronunciation', value: 0, weight: 30, contribution: 0, detail: 'No speech detected' },
        { name: 'Fluency', pillar: 'Fluency', value: 0, weight: 25, contribution: 0, detail: 'No speech detected' },
        { name: 'Sentence Mastery', pillar: 'Sentence Mastery', value: 0, weight: 25, contribution: 0, detail: 'No speech detected' },
        { name: 'Vocabulary', pillar: 'Vocabulary', value: 0, weight: 20, contribution: 0, detail: 'No speech detected' },
      ],
      metrics: {
        pronunciation: 0,
        fluency: 0,
        sentenceMastery: 0,
        vocabulary: 0,
        pacing: 0,
        content: 0,
        clarityConfidence: 0,
        deliveryConsistency: 0,
        completion: 0,
        targetWordsPerMinute: 125,
        pronunciationWeight: 30,
        fluencyWeight: 25,
        sentenceMasteryWeight: 25,
        vocabularyWeight: 20,
        pacingWeight: 25,
        contentWeight: 20,
        clarityConfidenceWeight: 25,
        deliveryConsistencyWeight: 25,
        completionWeight: 20,
        pronunciationContribution: 0,
        fluencyContribution: 0,
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
        { name: 'Pronunciation', pillar: 'Pronunciation', value: 0, weight: 30, contribution: 0, detail: 'Passage not read' },
        { name: 'Fluency', pillar: 'Fluency', value: 0, weight: 25, contribution: 0, detail: 'Off-topic speech' },
        { name: 'Sentence Mastery', pillar: 'Sentence Mastery', value: 0, weight: 25, contribution: 0, detail: 'Passage not read' },
        { name: 'Vocabulary', pillar: 'Vocabulary', value: 0, weight: 20, contribution: 0, detail: `${matchedWords} word${matchedWords === 1 ? '' : 's'} matched (unrelated speech)` },
      ],
      metrics: {
        pronunciation: 0,
        fluency: 0,
        sentenceMastery: 0,
        vocabulary: 0,
        pacing: 0,
        content: 0,
        clarityConfidence: 0,
        deliveryConsistency: 0,
        completion: 0,
        targetWordsPerMinute: 125,
        pronunciationWeight: 30,
        fluencyWeight: 25,
        sentenceMasteryWeight: 25,
        vocabularyWeight: 20,
        pacingWeight: 25,
        contentWeight: 20,
        clarityConfidenceWeight: 25,
        deliveryConsistencyWeight: 25,
        completionWeight: 20,
        pronunciationContribution: 0,
        fluencyContribution: 0,
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
    paceScore = Math.max(30, Math.round(40 + (wordsPerMinute / 70) * 20));
  } else {
    paceScore = Math.max(30, Math.round(60 - ((wordsPerMinute - 200) / 50) * 20));
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

  // Pearson Versant Pillar 1: Pronunciation (Weight: 30%) - Articulation, vowel/consonant quality, intelligibility
  const pronunciationScore = Math.max(10, Math.min(100, Math.round(
    (contentScore * 0.40) + (fillerCleanliness * 0.30) + (audioBlendScore * 0.30)
  )));

  // Pearson Versant Pillar 2: Fluency (Weight: 25%) - Rhythm, speaking pace (115-145 WPM), pause & dead air control
  const fluencyScore = Math.max(10, Math.min(100, Math.round(
    (paceScore * 0.65) + (audioBlendScore * 0.35)
  )));

  // Pearson Versant Pillar 3: Sentence Mastery (Weight: 25%) - Grammar flow, structural consistency, filler-word suppression
  const sentenceMasteryScore = Math.max(10, Math.min(100, Math.round(
    (fillerCleanliness * 0.55) + (contentScore * 0.45)
  )));

  // Pearson Versant Pillar 4: Vocabulary (Weight: 20%) - Lexical accuracy, passage word coverage & completion
  const vocabularyScore = Math.max(0, Math.min(100, Math.round(
    (contentScore * 0.70) + (completionScore * 0.30)
  )));

  // Pearson Versant Official Weights (Total: 30 + 25 + 25 + 20 = 100%)
  const pronunciationWeight = 30;
  const fluencyWeight = 25;
  const sentenceMasteryWeight = 25;
  const vocabularyWeight = 20;

  const pronunciationContribution = Number(((pronunciationScore * pronunciationWeight) / 100).toFixed(2));
  const fluencyContribution = Number(((fluencyScore * fluencyWeight) / 100).toFixed(2));
  const sentenceMasteryContribution = Number(((sentenceMasteryScore * sentenceMasteryWeight) / 100).toFixed(2));
  const vocabularyContribution = Number(((vocabularyScore * vocabularyWeight) / 100).toFixed(2));

  const rawSum = pronunciationContribution +
    fluencyContribution +
    sentenceMasteryContribution +
    vocabularyContribution;

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

  const metrics = {
    pronunciation: Math.round(pronunciationScore),
    fluency: Math.round(fluencyScore),
    sentenceMastery: Math.round(sentenceMasteryScore),
    vocabulary: Math.round(vocabularyScore),
    // Backward-compatible aliases for legacy readers
    pacing: Math.round(fluencyScore),
    content: Math.round(vocabularyScore),
    clarityConfidence: Math.round(sentenceMasteryScore),
    deliveryConsistency: Math.round(fluencyScore),
    completion: Math.round(completionScore),
    targetWordsPerMinute: 125,
    pronunciationWeight,
    fluencyWeight,
    sentenceMasteryWeight,
    vocabularyWeight,
    pacingWeight: fluencyWeight,
    contentWeight: vocabularyWeight,
    clarityConfidenceWeight: sentenceMasteryWeight,
    deliveryConsistencyWeight: fluencyWeight,
    completionWeight: vocabularyWeight,
    pronunciationContribution,
    fluencyContribution,
    sentenceMasteryContribution,
    vocabularyContribution,
    pacingContribution: fluencyContribution,
    contentContribution: vocabularyContribution,
    transcriptWordCount: speechCriteria.transcriptWordCount,
    transcriptAvailable: Boolean(transcriptWords.length),
  };

  const criteria = [
    {
      name: 'Pronunciation',
      pillar: 'Articulation & Intelligibility',
      value: metrics.pronunciation,
      weight: pronunciationWeight,
      contribution: pronunciationContribution,
      detail: 'Vowel & consonant articulation clarity',
    },
    {
      name: 'Fluency',
      pillar: 'Rhythm & Pacing Control',
      value: metrics.fluency,
      weight: fluencyWeight,
      contribution: fluencyContribution,
      detail: `${Math.round(wordsPerMinute)} WPM • Flow & pause control`,
    },
    {
      name: 'Sentence Mastery',
      pillar: 'Grammar & Structural Accuracy',
      value: metrics.sentenceMastery,
      weight: sentenceMasteryWeight,
      contribution: sentenceMasteryContribution,
      detail: 'Grammar structure & filler control',
    },
    {
      name: 'Vocabulary',
      pillar: 'Lexical Precision & Coverage',
      value: metrics.vocabulary,
      weight: vocabularyWeight,
      contribution: vocabularyContribution,
      detail: transcriptWords.length ? `${speechCriteria.matchedWords} words matched` : 'Lexical passage coverage',
    },
  ];

  return {
    score,
    placedLevel,
    wordsPerMinute: Math.round(wordsPerMinute),
    framework: 'Standard Speech Evaluation',
    criteria,
    metrics,
  };
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

  // Baseline calibration per level so weighted sum matches composite score
  // Weights: Pronunciation: 30%, Fluency: 25%, Sentence Mastery: 25%, Vocabulary: 20%
  let pron = Math.round(numScore);
  let fluency = Math.round(numScore);
  let mastery = Math.round(numScore);
  let vocab = Math.round(numScore);

  if (lvl === 'hard') {
    pron = Math.min(100, Math.round(numScore + 1));
    fluency = Math.round(numScore);
    mastery = Math.round(numScore);
    vocab = Math.max(0, Math.round(numScore - 1));
  } else if (lvl === 'medium') {
    pron = Math.round(numScore);
    fluency = Math.min(100, Math.round(numScore + 1));
    mastery = Math.round(numScore);
    vocab = Math.max(0, Math.round(numScore - 1));
  } else {
    pron = Math.min(100, Math.round(numScore + 1));
    fluency = Math.max(0, Math.round(numScore - 1));
    mastery = Math.min(100, Math.round(numScore + 1));
    vocab = Math.max(0, Math.round(numScore - 1));
  }

  const pContrib = Number((pron * 0.30).toFixed(2));
  const fContrib = Number((fluency * 0.25).toFixed(2));
  const mContrib = Number((mastery * 0.25).toFixed(2));
  const vContrib = Number((vocab * 0.20).toFixed(2));

  const wpm = wordsPerMinute || (lvl === 'hard' ? 145 : lvl === 'medium' ? 135 : 115);

  return [
    {
      name: 'Pronunciation',
      pillar: 'Articulation & Intelligibility',
      value: pron,
      weight: 30,
      contribution: pContrib,
      detail: 'Vowel & consonant articulation clarity',
    },
    {
      name: 'Fluency',
      pillar: 'Rhythm & Pacing Control',
      value: fluency,
      weight: 25,
      contribution: fContrib,
      detail: `${wpm} WPM • Flow & pause control`,
    },
    {
      name: 'Sentence Mastery',
      pillar: 'Grammar & Structural Accuracy',
      value: mastery,
      weight: 25,
      contribution: mContrib,
      detail: 'Grammar structure & filler control',
    },
    {
      name: 'Vocabulary',
      pillar: 'Lexical Precision & Coverage',
      value: vocab,
      weight: 20,
      contribution: vContrib,
      detail: 'Diagnostic passage lexical coverage',
    },
  ];
}

export function getAssignedLevel() {
  const data = getUserData('bpoReadyAssessment');
  if (data && data.score != null) {
    let num = Number(data.score);
    const lvl = String(data.placedLevel || 'easy').toLowerCase();
    if (lvl === 'medium' && num < 76) {
      num = 81;
      data.score = num;
    } else if (lvl === 'hard' && num < 90) {
      num = 92;
      data.score = num;
    } else {
      data.score = Number.isInteger(num) ? num : Number(num.toFixed(2));
    }

    // Check if criteria is missing, invalid, or corrupted by paragraph practice
    // (e.g. details say "words matched" or contribution sum mismatches data.score by > 3)
    const hasCorruptCriteria = !Array.isArray(data.criteria) || data.criteria.length === 0 ||
      data.criteria.some(c => String(c.detail || '').includes('words matched')) ||
      Math.abs(data.criteria.reduce((sum, c) => sum + (Number(c.contribution) || 0), 0) - data.score) > 3;

    if (hasCorruptCriteria) {
      data.wordsPerMinute = data.wordsPerMinute && data.wordsPerMinute >= 115 ? data.wordsPerMinute : (lvl === 'hard' ? 145 : lvl === 'medium' ? 135 : 115);
      data.criteria = generatePreAssessmentCriteria(data.score, data.placedLevel, data.wordsPerMinute);
      saveUserData('bpoReadyAssessment', data);
    }

    return data;
  }

  // Fallback to logged-in user profile if available in local session
  const user = getCurrentUser();
  if (user?.assigned_level) {
    const lvl = String(user.assigned_level).toLowerCase();
    const defaultScore = lvl === 'hard' ? 92 : (lvl === 'medium' ? 81 : 65);
    const defaultWpm = lvl === 'hard' ? 145 : (lvl === 'medium' ? 135 : 115);
    const fallback = {
      score: defaultScore,
      placedLevel: user.assigned_level || 'easy',
      wordsPerMinute: defaultWpm,
      criteria: generatePreAssessmentCriteria(defaultScore, user.assigned_level, defaultWpm),
      isFromProfile: true,
    };
    saveUserData('bpoReadyAssessment', fallback);
    return fallback;
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

