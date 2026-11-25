const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Fetches live approved reading passages, prioritizing local custom updates and backend API
export async function getParagraphs(level = 'easy') {
  const normLevel = String(level || 'easy').toLowerCase().trim();
  let deletedIds = [];
  let deletedTitles = [];
  try {
    deletedIds = JSON.parse(localStorage.getItem("bpo_deleted_paragraph_ids") || "[]");
    deletedTitles = JSON.parse(localStorage.getItem("bpo_deleted_paragraph_titles") || "[]");
  } catch {}

  const filterValid = (arr) => {
    if (!Array.isArray(arr)) return [];
    return arr.filter((p) => {
      const pDiff = String(p.difficulty || p.level || '').toLowerCase().trim();
      const matchLevel = pDiff === normLevel || (!pDiff && normLevel === 'easy');
      const isDeleted =
        deletedIds.includes(p.id) ||
        deletedIds.includes(String(p.id)) ||
        deletedIds.includes(Number(p.id)) ||
        deletedTitles.includes(p.title?.trim().toLowerCase());
      const isActive = p.is_active !== false && p.is_active !== 0 && p.is_active !== "0";
      return matchLevel && !isDeleted && isActive;
    });
  };

  // 1. Check localStorage first for instant client updates from Admin
  let localList = [];
  try {
    const raw = localStorage.getItem("bpo_custom_paragraphs");
    if (raw) {
      localList = filterValid(JSON.parse(raw));
    }
  } catch {}

  // 2. Fetch from backend API if available
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`${API_BASE}/api/paragraphs?level=${encodeURIComponent(normLevel)}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      const validApi = filterValid(data);
      if (validApi.length > 0) {
        // Merge API with local custom passages, ensuring latest local admin edits take priority
        const map = new Map();
        validApi.forEach((p) => map.set(String(p.id), p));
        localList.forEach((p) => map.set(String(p.id), p));
        return Array.from(map.values());
      }
    }
  } catch (err) {
    // API unavailable or offline
  }

  // 3. If local custom passages exist for this level, return them
  if (localList.length > 0) {
    return localList;
  }

  // 4. Fallback to default paragraphs.json
  try {
    const local = await import('../data/paragraphs.json');
    const data = local.default || local;
    const fallbackList = (data[normLevel] || []).map((p) => ({ ...p, difficulty: normLevel }));
    return filterValid(fallbackList);
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
