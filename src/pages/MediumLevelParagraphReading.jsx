import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getParagraphs, submitReadingSession } from "../api/paragraphsApi";
import AudioRecorder from "../components/AudioRecorder";
import { calculateAssessmentScore, getAssignedLevel, hasMeaningfulSpeech, saveAssessmentResult, LEVEL_RANK, getScoreTieredFeedback } from "../utils/assessmentScoring";
import { getCurrentUser } from "../utils/userData";
import ApplicantSidebar from "../components/ApplicantSidebar";

const MediumLevelParagraphReading = () => {
  const navigate = useNavigate();
  const [paragraph, setParagraph] = useState(null);
  const [recordingData, setRecordingData] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const assessment = getAssignedLevel();
    if (!assessment) {
      navigate('/pre-assessment', { replace: true });
      return undefined;
    }
    const userRank = LEVEL_RANK[assessment.placedLevel] || 1;
    if (userRank < 2) {
      navigate('/easy-level-paragraph-reading', { replace: true });
      return undefined;
    }
    let mounted = true;
    getParagraphs('medium').then(list => {
      if (!mounted) return;
      setParagraph(list[0] || null);
    });
    return () => (mounted = false);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50 font-poppins">
      <ApplicantSidebar activeItem="Paragraph Reading" />

      {/* Main Content */}
      <div className="flex-1 ml-64">
        {/* Header */}
        <div className="bg-white shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-gray-800">Medium Level - Paragraph Reading</h1>
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
            {/* Instructions */}
            <div className="mb-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-700">
                  Read the paragraph clearly and confidently. Avoid using filler words and maintain a steady pace while speaking.
                </p>
              </div>
            </div>

            {/* Paragraph Box */}
            <div className="mb-8">
              <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-6">
                <p className="text-gray-800 leading-relaxed text-center">
                  {paragraph ? paragraph.content : 'Loading passage...'}
                </p>
              </div>
            </div>
            <div className="mb-8 flex flex-col items-center justify-center gap-3">
              <AudioRecorder
                expectedText={paragraph?.content}
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
                  if (!recordingData || !paragraph) { alert('Please record first'); return; }

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
                      wordCount: paragraph.content.trim().split(/\s+/).length,
                      transcript: recordingData.transcript || '',
                      expectedText: paragraph.content,
                      audioMetrics: recordingData.audioMetrics,
                      currentLevel: 'medium',
                    });

                    const curUser = getCurrentUser();
                    const apiResponse = await submitReadingSession({
                      paragraphId: paragraph.id,
                      applicant_id: curUser?.id,
                      userId: curUser?.id,
                      durationSeconds: recordingData.durationSeconds,
                      transcript: recordingData.transcript || '',
                      expectedText: paragraph.content,
                      audioBlob: recordingData.blob,
                      currentLevel: 'medium',
                      score: localScore.score,
                    });

                    let finalResult;
                    if (apiResponse && apiResponse.success) {
                      finalResult = {
                        score: apiResponse.score,
                        placedLevel: apiResponse.placedLevel || apiResponse.assigned_level || localScore.placedLevel,
                        wordsPerMinute: localScore.wordsPerMinute,
                        criteria: apiResponse.criteria || localScore.criteria,
                        feedbackText: apiResponse.feedbackText || apiResponse?.feedback?.feedback_text || getScoreTieredFeedback(apiResponse.score).feedbackText,
                        suggestions: apiResponse.suggestions || (apiResponse?.feedback?.suggestions ? apiResponse.feedback.suggestions.split('\n') : getScoreTieredFeedback(apiResponse.score).suggestions),
                        aiEvaluated: apiResponse.aiEvaluated ?? true,
                        assessmentId: paragraph.id,
                        completedAt: new Date().toISOString(),
                      };
                    } else {
                      const tiered = getScoreTieredFeedback(localScore.score);
                      finalResult = {
                        ...localScore,
                        feedbackText: apiResponse?.feedback?.feedback_text || tiered.feedbackText,
                        suggestions: apiResponse?.suggestions || tiered.suggestions,
                        aiEvaluated: false,
                        assessmentId: paragraph.id,
                        completedAt: new Date().toISOString(),
                      };
                    }

                    saveAssessmentResult({ ...finalResult, isParagraphPractice: true, currentLevel: 'medium' });
                    navigate('/medium-level-result', { state: { result: finalResult } });
                  } catch (err) {
                    console.error('Submission error:', err);
                    const fallbackResult = calculateAssessmentScore({
                      durationSeconds: recordingData.durationSeconds,
                      wordCount: paragraph.content.trim().split(/\s+/).length,
                      transcript: recordingData.transcript || '',
                      expectedText: paragraph.content,
                      audioMetrics: recordingData.audioMetrics,
                      currentLevel: 'medium',
                    });
                    const tiered = getScoreTieredFeedback(fallbackResult.score);
                    const persisted = {
                      ...fallbackResult,
                      feedbackText: tiered.feedbackText,
                      suggestions: tiered.suggestions,
                      isParagraphPractice: true,
                      currentLevel: 'medium',
                      assessmentId: paragraph.id,
                      completedAt: new Date().toISOString(),
                    };
                    saveAssessmentResult(persisted);
                    navigate('/medium-level-result', { state: { result: persisted } });
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

export default MediumLevelParagraphReading;
