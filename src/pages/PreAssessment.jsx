import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AudioRecorder from '../components/AudioRecorder';
import preAssessment from '../data/preAssessment.json';
import {
  calculateAssessmentScore,
  clearAssessmentResult,
  saveAssessmentResult,
  getAssignedLevel,
  generatePreAssessmentCriteria,
  formatScore,
  hasMeaningfulSpeech,
} from '../utils/assessmentScoring';
import { submitPreAssessmentAudio, getUserPreAssessment, savePreAssessmentResult } from '../api/preAssessmentApi';
import { addUserActivity, getCurrentUser } from '../utils/userData';

const levelLabels = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
const scoreCriteria = new Set(['pronunciation', 'fluency', 'sentenceMastery', 'vocabulary', 'speakingPace', 'passageCoverage']);
const visibleCriteria = new Set(['pronunciation', 'fluency', 'sentenceMastery', 'vocabulary']);

export default function PreAssessment() {
  const navigate = useNavigate();
  const existingAssessment = getAssignedLevel();
  const [result, setResult] = useState(
    existingAssessment && Number(existingAssessment.score) > 0 ? existingAssessment : null
  );
  const [isRetaking, setIsRetaking] = useState(false);
  const [recording, setRecording] = useState(null);
  const [error, setError] = useState('');
  const wordCount = useMemo(() => preAssessment.content.trim().split(/\s+/).length, []);

  useEffect(() => {
    const cur = getCurrentUser();
    if (cur?.id) {
      getUserPreAssessment(cur.id).then(async data => {
        if (data && data.hasAssessment) {
          const scoreNum = Number(data.score ?? 0);
          if (scoreNum > 0) {
            const placed = String(data.placedLevel || cur.assigned_level || 'easy').toLowerCase();
            let finalScore = scoreNum;
            if (placed === 'medium' && finalScore < 76) finalScore = 81;
            if (placed === 'hard' && finalScore < 90) finalScore = 92;
            const wpm = placed === 'hard' ? 145 : (placed === 'medium' ? 135 : 115);
            const synced = {
              score: finalScore,
              placedLevel: placed,
              wordsPerMinute: wpm,
              criteria: generatePreAssessmentCriteria(finalScore, placed, wpm),
              completedAt: data.taken_at,
              isPreAssessment: true,
            };
            setResult(synced);
            saveAssessmentResult(synced);
          }
        } else if (existingAssessment && Number(existingAssessment.score) > 0) {
          // If server does not have it yet, auto-sync existing local result to database
          await savePreAssessmentResult({
            applicant_id: Number(cur.id),
            score: Number(existingAssessment.score),
            placed_level: existingAssessment.placedLevel || 'easy',
            paragraph_id: preAssessment.id || 1,
          });
        }
      });
    }
  }, []);

  const handleRecording = (blob, durationSeconds, transcript, audioMetrics) => {
    setRecording({ blob, durationSeconds, transcript, audioMetrics });
    setError('');
  };

  const submitAssessment = async () => {
    if (!recording) {
      setError('Record your reading before submitting the assessment.');
      return;
    }

    const transcript = (recording.transcript || '').trim();
    const hasSpeech = hasMeaningfulSpeech({
      transcript,
      audioMetrics: recording.audioMetrics,
      durationSeconds: recording.durationSeconds,
    });

    if (!hasSpeech) {
      setError('No meaningful speech was detected (Score: 0). Silence or background noise cannot be scored.');
      setResult({
        score: 0,
        placedLevel: 'easy',
        isZeroScore: true,
      });
      return;
    }

    try {
      const apiResult = await submitPreAssessmentAudio({
        audio: recording.blob,
        expectedText: preAssessment.content,
        durationSeconds: recording.durationSeconds,
        transcript: recording.transcript,
      });

      const localScore = calculateAssessmentScore({
        durationSeconds: recording.durationSeconds,
        wordCount,
        transcript: recording.transcript,
        expectedText: preAssessment.content,
        audioMetrics: recording.audioMetrics,
      });

      const score = apiResult.fallback || !apiResult.criteria
        ? localScore
        : {
            score: Number(Object.entries(apiResult.criteria || {})
              .filter(([name]) => scoreCriteria.has(name))
              .reduce((total, [name, value]) => {
                const localMetricMap = {
                  pronunciation: localScore.metrics.pronunciation,
                  fluency: localScore.metrics.fluency,
                  sentenceMastery: localScore.metrics.sentenceMastery,
                  vocabulary: localScore.metrics.vocabulary,
                  speakingPace: localScore.metrics.fluency,
                  passageCoverage: localScore.metrics.vocabulary,
                };
                const metricValue = value?.score ?? localMetricMap[name] ?? 0;
                const weight = Number(value?.weight ?? localScore.metrics[`${name === 'pronunciation' ? 'pronunciation' : name === 'fluency' ? 'fluency' : name === 'sentenceMastery' ? 'sentenceMastery' : 'vocabulary'}Weight`] ?? 0);
                return total + ((Number(metricValue) * weight) / 100);
              }, 0).toFixed(2)),
            placedLevel: apiResult.placedLevel || localScore.placedLevel,
            wordsPerMinute: localScore.wordsPerMinute,
            metrics: {
              ...localScore.metrics,
              pronunciation: apiResult.criteria?.pronunciation?.score ?? localScore.metrics.pronunciation,
              fluency: apiResult.criteria?.fluency?.score ?? localScore.metrics.fluency,
              sentenceMastery: apiResult.criteria?.sentenceMastery?.score ?? localScore.metrics.sentenceMastery,
              vocabulary: apiResult.criteria?.vocabulary?.score ?? localScore.metrics.vocabulary,
            },
            criteria: Object.entries(apiResult.criteria || {})
              .filter(([name]) => visibleCriteria.has(name))
              .map(([name, value]) => {
                const localMetricMap = {
                  pronunciation: localScore.metrics.pronunciation,
                  fluency: localScore.metrics.fluency,
                  sentenceMastery: localScore.metrics.sentenceMastery,
                  vocabulary: localScore.metrics.vocabulary,
                };
                const weightKeyMap = {
                  pronunciation: 'pronunciationWeight',
                  fluency: 'fluencyWeight',
                  sentenceMastery: 'sentenceMasteryWeight',
                  vocabulary: 'vocabularyWeight',
                };
                const nameLabelMap = {
                  pronunciation: 'Pronunciation',
                  fluency: 'Fluency',
                  sentenceMastery: 'Sentence Mastery',
                  vocabulary: 'Vocabulary',
                };
                const pillarLabelMap = {
                  pronunciation: 'Articulation & Intelligibility',
                  fluency: 'Rhythm & Pacing Control',
                  sentenceMastery: 'Grammar & Structural Accuracy',
                  vocabulary: 'Lexical Precision & Coverage',
                };
                const detailMap = {
                  pronunciation: 'Vowel & consonant articulation clarity',
                  fluency: `${Math.round(localScore.wordsPerMinute)} WPM • Flow & pause control`,
                  sentenceMastery: 'Grammar structure & filler control',
                  vocabulary: `${wordCount} words analyzed • Lexical coverage`,
                };
                const resolvedScore = value?.score ?? localMetricMap[name] ?? null;
                const resolvedWeight = Number(value?.weight ?? localScore.metrics[weightKeyMap[name]] ?? (name === 'pronunciation' ? 30 : name === 'fluency' ? 25 : name === 'sentenceMastery' ? 25 : 20));
                return {
                  name: nameLabelMap[name] || name,
                  pillar: pillarLabelMap[name] || nameLabelMap[name] || name,
                  value: resolvedScore,
                  weight: resolvedWeight,
                  contribution: resolvedScore == null ? 0 : Number(resolvedScore) * (resolvedWeight / 100),
                  detail: resolvedScore == null ? 'Not measured' : (detailMap[name] || ''),
                };
              }),
          };

      const finalScoreNum = Number(score.score || 0);

      // If score is 0, do not save to database as final result!
      if (finalScoreNum <= 0) {
        setError('No meaningful speech detected (Score: 0). Please speak aloud clearly to receive an official placement.');
        setResult({
          score: 0,
          placedLevel: 'easy',
          isZeroScore: true,
        });
        return;
      }

      // Valid score > 0: officially save to database and lock!
      const assessmentResult = {
        ...score,
        isPreAssessment: true,
        assessmentId: preAssessment.id,
        completedAt: new Date().toISOString(),
      };
      saveAssessmentResult(assessmentResult);
      const curUser = getCurrentUser();
      if (curUser?.id) {
        await savePreAssessmentResult({
          applicant_id: Number(curUser.id),
          score: Number(assessmentResult.score),
          placed_level: assessmentResult.placedLevel,
          paragraph_id: preAssessment.id || 1,
        });
      }
      addUserActivity({
        activity: 'Pre-Assessment',
        level: assessmentResult.placedLevel,
        result: `${assessmentResult.score}/100`,
        date: assessmentResult.completedAt,
      });
      setResult(assessmentResult);
      setIsRetaking(false);
      setError('');
    } catch (err) {
      const fallbackScore = calculateAssessmentScore({
        durationSeconds: recording.durationSeconds,
        wordCount,
        transcript: recording.transcript,
        expectedText: preAssessment.content,
        audioMetrics: recording.audioMetrics,
      });

      const fallbackNum = Number(fallbackScore.score || 0);
      if (fallbackNum <= 0) {
        setError('No meaningful speech detected (Score: 0). Please speak aloud clearly to receive an official placement.');
        setResult({
          score: 0,
          placedLevel: 'easy',
          isZeroScore: true,
        });
        return;
      }

      const assessmentResult = {
        ...fallbackScore,
        isPreAssessment: true,
        assessmentId: preAssessment.id,
        completedAt: new Date().toISOString(),
      };
      saveAssessmentResult(assessmentResult);
      const curUser = getCurrentUser();
      if (curUser?.id) {
        await savePreAssessmentResult({
          applicant_id: Number(curUser.id),
          score: Number(assessmentResult.score),
          placed_level: assessmentResult.placedLevel,
          paragraph_id: preAssessment.id || 1,
        });
      }
      addUserActivity({
        activity: 'Pre-Assessment',
        level: assessmentResult.placedLevel,
        result: `${assessmentResult.score}/100`,
        date: assessmentResult.completedAt,
      });
      setResult(assessmentResult);
      setIsRetaking(false);
      setError('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-poppins">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link to="/Dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              B
            </div>
            <span className="font-bold text-gray-800 text-lg">BPOReady</span>
          </Link>
          <Link to="/Dashboard" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        {/* If user already has a completed Pre-Assessment and is NOT retaking */}
        {result && !isRetaking ? (
          Number(result.score) > 0 ? (
            /* Valid Result: PERMANENTLY LOCKED — NO RETAKE ALLOWED */
            <div className="space-y-6">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-emerald-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-lg">
                      ✓
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                        Diagnostic Placement Finalized &amp; Locked
                      </span>
                      <h1 className="text-xl font-bold text-gray-900 mt-0.5">
                        Your Assigned Level: {levelLabels[result.placedLevel] || result.placedLevel}
                      </h1>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] uppercase font-bold text-gray-400">Composite Score</span>
                    <p className="text-3xl font-extrabold text-emerald-700">{formatScore(result.score)}/100</p>
                  </div>
                </div>

                <div className="mt-4 text-xs text-gray-700 leading-relaxed">
                  You have completed your diagnostic pre-assessment. Based on your acoustic clarity, speech pacing ({result.wordsPerMinute || 135} WPM), and pronunciation accuracy, your baseline is officially locked into the <strong>{levelLabels[result.placedLevel] || result.placedLevel} Level</strong> paragraph reading track.
                </div>

                {/* Rubric Factor Breakdown */}
                {Array.isArray(result.criteria) && result.criteria.length > 0 && (
                  <div className="mt-5 overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-sm">
                    <div className="grid grid-cols-4 border-b border-gray-200 bg-gray-50 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-600">
                      <span>Evaluation Factor</span>
                      <span>Result</span>
                      <span>Weight</span>
                      <span>Contribution</span>
                    </div>
                    {result.criteria.map((criterion) => (
                      <div key={criterion.name} className="grid grid-cols-4 border-t border-gray-100 px-4 py-3 text-xs text-gray-700 hover:bg-gray-50/60 transition">
                        <div>
                          <p className="font-semibold text-gray-900">{criterion.name}</p>
                        </div>
                        <div className="flex flex-col justify-center">
                          <span className={criterion.value == null ? 'text-gray-400' : 'font-bold text-gray-900'}>
                            {criterion.value == null ? 'Not measured' : `${criterion.value}/100`}
                          </span>
                          {criterion.detail ? <span className="text-[10px] text-gray-400 font-normal">{criterion.detail}</span> : null}
                        </div>
                        <span className="flex items-center text-gray-500 font-semibold">{criterion.weight ? `${criterion.weight}%` : '-'}</span>
                        <span className="flex items-center font-bold text-emerald-700">{criterion.weight ? Number(criterion.contribution).toFixed(2) : '-'}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Locked Placement Banner */}
                <div className="mt-5 flex items-center gap-2.5 p-3 rounded-xl bg-emerald-100/70 border border-emerald-300 text-xs text-emerald-900 font-semibold">
                  <svg className="w-4 h-4 text-emerald-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Diagnostic Placement Locked: Pre-Assessment is finalized in the database and cannot be retaken. Please proceed to your assigned training module.</span>
                </div>

                {/* Actions: ONLY Proceed to Practice (No Retake Button) */}
                <div className="mt-6">
                  <button
                    onClick={() => {
                      const cur = getCurrentUser();
                      const targetLevel = (cur?.assigned_level || result.placedLevel || 'easy').toLowerCase();
                      navigate(`/${targetLevel}-level-paragraph-reading`);
                    }}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-sm text-center"
                  >
                    Start Assigned {levelLabels[(getCurrentUser()?.assigned_level || result.placedLevel || 'easy').toLowerCase()] || result.placedLevel} Reading Practice →
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* 0 Score / Failed Attempt: ALLOW RETAKE */
            <div className="space-y-6">
              <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-lg">
                    !
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                      No Meaningful Speech Detected (Score: 0)
                    </span>
                    <h1 className="text-xl font-bold text-gray-900 mt-0.5">
                      Pre-Assessment Incomplete — Placement Not Set
                    </h1>
                  </div>
                </div>

                <div className="text-xs text-amber-900 leading-relaxed">
                  Silence or background noise was detected resulting in a score of <strong>0/100</strong>. Because a valid speech sample is required to evaluate your diagnostic level, your result was not saved to the database. Please ensure your microphone is working and speak the passage aloud clearly to receive your official level placement.
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setResult(null);
                      setRecording(null);
                      setIsRetaking(true);
                      setError('');
                    }}
                    className="w-full sm:w-auto px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition shadow-sm"
                  >
                    Retake Assessment Now →
                  </button>
                </div>
              </div>
            </div>
          )
        ) : (
          /* Normal / Retake Assessment Section */
          <div>
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                  {isRetaking ? 'Recalibration Mode' : 'Required First Step'}
                </span>
                {isRetaking && result && (
                  <button
                    onClick={() => setIsRetaking(false)}
                    className="text-xs text-gray-500 hover:text-gray-800 underline font-medium"
                  >
                    Cancel Retake (Keep Current Level)
                  </button>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mt-2">Communication Pre-Assessment</h1>
              <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                Read the standard BPO screening passage aloud. The speech evaluation engine analyzes your pronunciation (30%), fluency (25%), sentence mastery (25%), and vocabulary coverage (20%) to determine your starting difficulty tier.
              </p>
            </div>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b">
                <h2 className="text-sm font-bold text-gray-800">{preAssessment.title}</h2>
                <span className="text-xs text-gray-400">~{wordCount} words</span>
              </div>
              <p className="text-xs text-gray-500">{preAssessment.instructions}</p>

              <div className="p-5 rounded-xl border border-blue-100 bg-blue-50/60 text-sm leading-relaxed text-gray-800 font-medium">
                "{preAssessment.content}"
              </div>

              <div className="pt-2">
                <p className="text-xs text-gray-500 mb-2">
                  Click Start Recording and speak clearly into your microphone:
                </p>
                <AudioRecorder
                  expectedText={preAssessment.content}
                  onRecordingComplete={(blob, duration, transcript, metrics) => handleRecording(blob, duration, transcript, metrics)}
                />
                {recording && (
                  <p className="mt-2 text-xs font-semibold text-emerald-700">
                    ✓ Audio captured ({recording.durationSeconds}s). Ready to submit.
                  </p>
                )}
              </div>

              {error && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg">{error}</p>}

              <div className="pt-2">
                <button
                  onClick={submitAssessment}
                  disabled={!recording}
                  className="w-full py-3 rounded-xl bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs hover:bg-blue-700 transition shadow-sm"
                >
                  Submit Pre-Assessment &amp; Calculate Placement
                </button>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
