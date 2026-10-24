import { getCurrentUser } from '../utils/userData';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export async function submitPreAssessmentAudio(payload) {
  const formData = new FormData();
  if (payload.audio) {
    const fileName = payload.audio.type === 'audio/wav' ? 'pre-assessment.wav' : 'pre-assessment.webm';
    formData.append('audio', payload.audio, fileName);
  }
  if (payload.expectedText) formData.append('expectedText', payload.expectedText);
  if (payload.durationSeconds) formData.append('durationSeconds', String(payload.durationSeconds));
  if (payload.transcript) formData.append('transcript', payload.transcript);

  const currentUser = getCurrentUser();
  const applicantId = payload.applicant_id || payload.userId || currentUser?.id;
  if (applicantId) {
    formData.append('applicant_id', String(applicantId));
  }

  try {
    const response = await fetch(`${API_BASE}/api/pre-assessment/analyze`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Pre-assessment analysis failed.');
    }

    return data;
  } catch (error) {
    console.warn('Pre-assessment analysis endpoint unavailable:', error);
    return {
      speechAiAvailable: false,
      fallback: true,
      message: 'Speech AI is not configured; using local heuristics.',
    };
  }
}

export async function getUserPreAssessment(userId) {
  try {
    const response = await fetch(`${API_BASE}/api/pre-assessment/user/${userId}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn('Could not fetch user pre-assessment:', error);
    return null;
  }
}

export async function savePreAssessmentResult(payload) {
  try {
    const response = await fetch(`${API_BASE}/api/pre-assessment/save-result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    return await response.json();
  } catch (error) {
    console.warn('Could not save pre-assessment result to server:', error);
    return null;
  }
}

export default { submitPreAssessmentAudio, getUserPreAssessment, savePreAssessmentResult };
