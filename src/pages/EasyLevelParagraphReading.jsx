import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getParagraphs, submitReadingSession } from "../api/paragraphsApi";
import AudioRecorder from "../components/AudioRecorder";
import { calculateAssessmentScore, getAssignedLevel, hasMeaningfulSpeech, saveAssessmentResult, getScoreTieredFeedback, getActiveEvaluationCriteria } from "../utils/assessmentScoring";
import { getCurrentUser, addUserActivity } from "../utils/userData";
import ApplicantSidebar from "../components/ApplicantSidebar";

const EasyLevelParagraphReading = () => {
  const navigate = useNavigate();
  const [paragraphs, setParagraphs] = useState(() => {
    try {
      let deletedIds = JSON.parse(localStorage.getItem("bpo_deleted_paragraph_ids") || "[]");
      let deletedTitles = JSON.parse(localStorage.getItem("bpo_deleted_paragraph_titles") || "[]");
      const raw = localStorage.getItem("bpo_custom_paragraphs");
      if (raw) {
        const parsed = JSON.parse(raw);
        const valid = parsed.filter((p) => {
          const pDiff = String(p.difficulty || p.level || "").toLowerCase().trim();
          const matchLevel = pDiff === "easy" || !pDiff;
          const isDeleted =
            deletedIds.includes(p.id) ||
            deletedIds.includes(String(p.id)) ||
            deletedIds.includes(Number(p.id)) ||
            deletedTitles.includes(p.title?.trim().toLowerCase());
          const isActive = p.is_active !== false && p.is_active !== 0 && p.is_active !== "0";
          return matchLevel && !isDeleted && isActive;
        });
        if (valid.length > 0) return valid;
      }
    } catch {}
    return [];
  });
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [recordingData, setRecordingData] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const assessment = getAssignedLevel();
    if (!assessment) {
      navigate('/pre-assessment', { replace: true });
      return undefined;
    }
    let mounted = true;
    getParagraphs('easy').then(list => {
      if (!mounted) return;
      if (Array.isArray(list) && list.length > 0) {
        setParagraphs(list);
      }
    });
    return () => (mounted = false);
  }, []);

  const currentParagraph = paragraphs[selectedIdx] || paragraphs[0] || null;

  return (
    <div className="flex min-h-screen bg-gray-50 font-poppins">
      <ApplicantSidebar activeItem="Paragraph Reading" />

      {/* Main Content */}
      <div className="flex-1 ml-64">
        {/* Header */}
        <div className="bg-white shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-gray-800">Easy Level - Paragraph Reading</h1>
          </div>
        </div>

        {/* Page Content */}
        <div className="container mx-auto px-4 py-12">
          {/* Title Section */}
          <div className="text-center mb-8">
            <p className="text-lg text-gray-600">
              Complete each level to unlock the next and improve your communication skills step by step.
            </p>
          </div>

          {/* Main Practice Card */}
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
            {/* Passage Selector Tabs when multiple passages exist */}
            {paragraphs.length > 1 && (
              <div className="mb-6 pb-4 border-b border-gray-200">
                <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Select Practice Passage ({paragraphs.length} Available)
                </span>
                <div className="flex flex-wrap gap-2">
                  {paragraphs.map((p, idx) => (
                    <button
                      key={p.id || idx}
                      onClick={() => {
                        setSelectedIdx(idx);
                        setRecordingData(null);
                      }}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        selectedIdx === idx
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                      }`}
                    >
                      Passage {idx + 1}: {p.title || `Passage ${idx + 1}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Passage Title & Word Count Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                {currentParagraph?.title || "Reading Passage"}
              </span>
              <span className="text-xs text-gray-500 font-medium">
                Word Count: ~{currentParagraph?.content ? currentParagraph.content.trim().split(/\s+/).length : 0} words
              </span>
            </div>

            {/* Instructions */}
            <div className="mb-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-700">
                  Read the paragraph clearly and confidently. Avoid using filler words and maintain a steady pace while speaking.
                </p>
              </div>
            </div>

            {/* Paragraph Box */}
            <div className="mb-8">
              <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-6">
                <p className="text-gray-800 leading-relaxed text-center font-medium">
                  {currentParagraph ? currentParagraph.content : 'Loading passage...'}
                </p>
              </div>
            </div>
            <div className="mb-8 flex flex-col items-center justify-center gap-3">
              <AudioRecorder
                key={currentParagraph?.id || selectedIdx}
                expectedText={currentParagraph?.content}
                onStateChange={setIsRecording}
                onRecorded={(blob, durationSeconds, transcript, audioMetrics) => setRecordingData({ blob, durationSeconds, transcript, audioMetrics })}
              />
              {recordingData && (
                <span className="text-sm text-green-700">Recording captured: {recordingData.durationSeconds}s</span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <button
                disabled={isRecording || isSubmitting}
                className={`px-10 py-3 font-semibold rounded-lg transition-colors shadow-md flex items-center justify-center gap-2 ${
                  isRecording || isSubmitting
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 cursor-pointer'
                }`}
                onClick={async () => {
                  if (isRecording) {
                    alert('Please click Stop on the recorder to finish your reading before submitting.');
                    return;
                  }
                  if (!recordingData || !currentParagraph) {
                    alert('Please record your response first.');
                    return;
                  }

                  const transcript = (recordingData.transcript || '').trim();
                  const hasSpeech = hasMeaningfulSpeech({
                    transcript,
                    audioMetrics: recordingData.audioMetrics,
                    durationSeconds: recordingData.durationSeconds,
                  });
                  if (!hasSpeech) {
                    alert('No speech was detected. Please read the paragraph clearly before submitting.');
                    return;
                  }

                  setIsSubmitting(true);
                  try {
                    const localScore = calculateAssessmentScore({
                      durationSeconds: recordingData.durationSeconds,
                      wordCount: currentParagraph.content.trim().split(/\s+/).length,
                      transcript: recordingData.transcript || '',
                      expectedText: currentParagraph.content,
                      audioMetrics: recordingData.audioMetrics,
                      currentLevel: 'easy',
                    });

                    const curUser = getCurrentUser();
                    const apiResponse = await submitReadingSession({
                      paragraphId: currentParagraph.id,
                      applicant_id: curUser?.id,
                      userId: curUser?.id,
                      durationSeconds: recordingData.durationSeconds,
                      transcript: recordingData.transcript || '',
                      expectedText: currentParagraph.content,
                      audioBlob: recordingData.blob,
                      currentLevel: 'easy',
                      score: localScore.score,
                    });

                    let finalResult;
                    if (apiResponse && apiResponse.success) {
                      const activeCrit = getActiveEvaluationCriteria();
                      let finalCriteria = localScore.criteria;
                      if (Array.isArray(apiResponse.criteria) && apiResponse.criteria.length === activeCrit.length) {
                        finalCriteria = apiResponse.criteria;
                      } else {
                        finalCriteria = activeCrit.map((c) => {
                          const key = (c.name || '').toLowerCase().replace(/[^a-z]/g, '');
                          const apiMatch = Array.isArray(apiResponse.criteria)
                            ? apiResponse.criteria.find(ac => (ac.name || '').toLowerCase().replace(/[^a-z]/g, '') === key)
                            : null;
                          const localMatch = localScore.criteria.find(lc => (lc.name || '').toLowerCase().replace(/[^a-z]/g, '') === key);
                          const val = apiMatch ? Number(apiMatch.value ?? apiMatch.score ?? 0) : (localMatch ? Number(localMatch.value || 0) : 75);
                          const weight = Number(c.weight || 0);
                          return {
                            name: c.name,
                            pillar: c.pillar || `CEFR ${c.name}`,
                            value: Math.round(val),
                            weight,
                            contribution: Number(((val * weight) / 100).toFixed(2)),
                            detail: c.detail || `${Math.round(localScore.wordsPerMinute)} WPM cadence`,
                          };
                        });
                      }
                      const resolvedScore = Number(finalCriteria.reduce((sum, c) => sum + (c.contribution || 0), 0).toFixed(2)) || apiResponse.score || localScore.score;

                      finalResult = {
                        score: resolvedScore,
                        placedLevel: Number(resolvedScore) >= 76 ? 'medium' : 'easy',
                        wordsPerMinute: localScore.wordsPerMinute,
                        criteria: finalCriteria,
                        feedbackText: apiResponse.feedbackText || apiResponse?.feedback?.feedback_text || getScoreTieredFeedback(resolvedScore).feedbackText,
                        suggestions: apiResponse.suggestions || (apiResponse?.feedback?.suggestions ? apiResponse.feedback.suggestions.split('\n') : getScoreTieredFeedback(resolvedScore).suggestions),
                        aiEvaluated: apiResponse.aiEvaluated ?? true,
                        assessmentId: currentParagraph.id,
                        completedAt: new Date().toISOString(),
                      };
                    } else {
                      const tiered = getScoreTieredFeedback(localScore.score);
                      finalResult = {
                        ...localScore,
                        feedbackText: apiResponse?.feedback?.feedback_text || tiered.feedbackText,
                        suggestions: apiResponse?.suggestions || tiered.suggestions,
                        aiEvaluated: false,
                        assessmentId: currentParagraph.id,
                        completedAt: new Date().toISOString(),
                      };
                    }

                    saveAssessmentResult({ ...finalResult, isParagraphPractice: true, currentLevel: 'easy' });
                    addUserActivity({
                      id: `pr_${Date.now()}`,
                      activity: "Easy Level Paragraph Reading",
                      level: "Easy Level",
                      result: `${finalResult.score}/100`,
                      score: finalResult.score,
                      type: "paragraph_reading",
                      criteria: finalResult.criteria,
                      feedbackText: finalResult.feedbackText,
                      suggestions: finalResult.suggestions,
                      wordsPerMinute: finalResult.wordsPerMinute,
                      passageTitle: currentParagraph?.title || "Easy Reading Passage",
                      date: finalResult.completedAt || new Date().toISOString(),
                    });
                    navigate('/EasyLevelResult', { state: { result: finalResult } });
                  } catch (err) {
                    console.error('Submission error:', err);
                    const fallbackResult = calculateAssessmentScore({
                      durationSeconds: recordingData.durationSeconds,
                      wordCount: currentParagraph.content.trim().split(/\s+/).length,
                      transcript: recordingData.transcript || '',
                      expectedText: currentParagraph.content,
                      audioMetrics: recordingData.audioMetrics,
                      currentLevel: 'easy',
                    });
                    const tiered = getScoreTieredFeedback(fallbackResult.score);
                    const persisted = {
                      ...fallbackResult,
                      feedbackText: tiered.feedbackText,
                      suggestions: tiered.suggestions,
                      isParagraphPractice: true,
                      currentLevel: 'easy',
                      assessmentId: currentParagraph.id,
                      completedAt: new Date().toISOString(),
                    };
                    saveAssessmentResult(persisted);
                    addUserActivity({
                      id: `pr_${Date.now()}`,
                      activity: "Easy Level Paragraph Reading",
                      level: "Easy Level",
                      result: `${persisted.score}/100`,
                      score: persisted.score,
                      type: "paragraph_reading",
                      criteria: persisted.criteria,
                      feedbackText: persisted.feedbackText,
                      suggestions: persisted.suggestions,
                      wordsPerMinute: persisted.wordsPerMinute,
                      passageTitle: currentParagraph?.title || "Easy Reading Passage",
                      date: persisted.completedAt || new Date().toISOString(),
                    });
                    navigate('/EasyLevelResult', { state: { result: persisted } });
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  'Submit'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EasyLevelParagraphReading;
