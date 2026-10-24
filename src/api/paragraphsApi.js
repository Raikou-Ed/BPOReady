const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Fetches live approved reading passages from backend API, falling back to local JSON if offline
export async function getParagraphs(level = 'easy') {
  try {
    const res = await fetch(`${API_BASE}/api/paragraphs?level=${encodeURIComponent(level)}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('API unavailable, falling back to local passages:', err);
  }

  try {
    const local = await import('../data/paragraphs.json');
    const data = local.default || local;
    return data[level] || [];
  } catch (err2) {
    console.warn('Failed to load fallback passages:', err2);
    return [];
  }
}

export async function submitReadingSession(payload) {
  try {
    let res;
    const audio = payload.audio || payload.audioBlob;
    if (audio) {
      const formData = new FormData();
      const fileName = audio.type === 'audio/wav' ? 'reading.wav' : 'reading.webm';
      formData.append('audio', audio, fileName);
      if (payload.paragraphId != null) formData.append('paragraphId', String(payload.paragraphId));
      if (payload.paragraph_id != null) formData.append('paragraph_id', String(payload.paragraph_id));
      if (payload.applicant_id != null) formData.append('applicant_id', String(payload.applicant_id));
      if (payload.userId != null) formData.append('userId', String(payload.userId));
      if (payload.durationSeconds != null) formData.append('durationSeconds', String(payload.durationSeconds));
      if (payload.transcript != null) formData.append('transcript', payload.transcript);
      if (payload.expectedText != null) formData.append('expectedText', payload.expectedText);
      if (payload.currentLevel != null) formData.append('currentLevel', payload.currentLevel);
      if (payload.score != null) formData.append('score', String(payload.score));

      res = await fetch(`${API_BASE}/api/paragraph-reading/submit`, {
        method: 'POST',
        body: formData,
      });
    } else {
      res = await fetch(`${API_BASE}/api/paragraph-reading/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `API error ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.warn('submitReadingSession failed:', err);
    return { success: false, message: err.message || 'offline' };
  }
}

export default { getParagraphs, submitReadingSession };
