const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Dashboard & Users
export async function getDashboardStats() {
  try {
    const res = await fetch(`${API_BASE}/api/admin/dashboard-stats`);
    if (!res.ok) throw new Error('API error');
    return res.json();
  } catch (err) {
    console.warn('getDashboardStats failed:', err);
    return {
      total_applicants: 16,
      total_users: 19,
      total_paragraphs: 3,
      total_questions: 10,
      total_exercises: 3,
      total_mock_sessions: 4,
      average_performance: 'Good',
      common_speech_flaw: 'Filler Words (um, ah)',
    };
  }
}

export async function getRegisteredUsers(search = '', role = '', requesterRole = '') {
  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (role) params.append('role', role);
    if (requesterRole) params.append('requester_role', requesterRole);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/api/admin/registered-users${qs}`);
    if (!res.ok) throw new Error('API error');
    return res.json();
  } catch (err) {
    console.warn('getRegisteredUsers failed:', err);
    return [];
  }
}

// Paragraph Passages
export async function listParagraphs(level = '') {
  try {
    const res = await fetch(`${API_BASE}/api/paragraphs${level ? `?level=${level}` : ''}`);
    if (!res.ok) throw new Error('API error');
    return res.json();
  } catch (err) {
    console.warn('listParagraphs failed:', err);
    return [];
  }
}

export async function createParagraph(payload) {
  const res = await fetch(`${API_BASE}/api/paragraphs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function updateParagraph(id, payload) {
  const res = await fetch(`${API_BASE}/api/paragraphs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function deleteParagraph(id) {
  const res = await fetch(`${API_BASE}/api/paragraphs/${id}`, { method: 'DELETE' });
  return res.json();
}

// Interview Questions
export async function listInterviewQuestions(type = '', admin = true) {
  try {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (admin) params.append('admin', '1');
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/api/interview-questions${qs}`);
    if (!res.ok) throw new Error('API error');
    return res.json();
  } catch (err) {
    console.warn('listInterviewQuestions failed:', err);
    return [];
  }
}

export async function createInterviewQuestion(payload) {
  const res = await fetch(`${API_BASE}/api/interview-questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function updateInterviewQuestion(id, payload) {
  const res = await fetch(`${API_BASE}/api/interview-questions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function deleteInterviewQuestion(id) {
  const res = await fetch(`${API_BASE}/api/interview-questions/${id}`, { method: 'DELETE' });
  return res.json();
}

// Scoring Standards
export async function getScoringStandards() {
  try {
    const res = await fetch(`${API_BASE}/api/scoring-standards`);
    if (!res.ok) throw new Error('API error');
    return res.json();
  } catch (err) {
    console.warn('getScoringStandards failed:', err);
    return [
      { level: 'easy', min_score: 0, max_score: 75 },
      { level: 'medium', min_score: 76, max_score: 89 },
      { level: 'hard', min_score: 90, max_score: 100 },
    ];
  }
}

export async function updateScoringStandards(standards) {
  const res = await fetch(`${API_BASE}/api/scoring-standards`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ standards }),
  });
  return res.json();
}

// Communication Exercises
export async function listExercises(targetFlaw = '', admin = true) {
  try {
    const params = new URLSearchParams();
    if (targetFlaw) params.append('target_flaw', targetFlaw);
    if (admin) params.append('admin', '1');
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/api/exercises${qs}`);
    if (!res.ok) throw new Error('API error');
    return res.json();
  } catch (err) {
    console.warn('listExercises failed:', err);
    return [];
  }
}

export async function submitExerciseAttempt(payload) {
  const res = await fetch(`${API_BASE}/api/exercises/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function evaluateFillerExercise({ audio, prompt_text, transcript, duration_seconds }) {
  const formData = new FormData();
  if (audio) {
    formData.append('audio', audio, 'recording.wav');
  }
  formData.append('prompt_text', prompt_text || '');
  formData.append('transcript', transcript || '');
  if (duration_seconds != null) {
    formData.append('duration_seconds', String(duration_seconds));
  }

  const res = await fetch(`${API_BASE}/api/exercises/evaluate-filler`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to evaluate filler exercise');
  return res.json();
}

// Call Simulations
export async function listCallScenarios(callType = '') {
  try {
    const res = await fetch(`${API_BASE}/api/call-simulations/scenarios${callType ? `?call_type=${callType}` : ''}`);
    if (!res.ok) throw new Error('API error');
    return res.json();
  } catch (err) {
    console.warn('listCallScenarios failed:', err);
    return [];
  }
}

export async function submitCallSimulation(payload) {
  const res = await fetch(`${API_BASE}/api/call-simulations/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

// Mock Interview Simulation
export async function getMockInterviewQuestions(type = 'initial') {
  try {
    const res = await fetch(`${API_BASE}/api/mock-interview/questions?type=${type}`);
    if (!res.ok) throw new Error('API error');
    return res.json();
  } catch (err) {
    console.warn('getMockInterviewQuestions failed:', err);
    return [];
  }
}

export async function submitMockInterview(payload) {
  const res = await fetch(`${API_BASE}/api/mock-interview/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

// History & Summary Reports
export async function getApplicantHistory(applicantId) {
  try {
    const res = await fetch(`${API_BASE}/api/reports/history/${applicantId}`);
    if (!res.ok) throw new Error('API error');
    return res.json();
  } catch (err) {
    console.warn('getApplicantHistory failed:', err);
    return [];
  }
}

export async function getApplicantSummary(applicantId) {
  try {
    const res = await fetch(`${API_BASE}/api/reports/summary/${applicantId}`);
    if (!res.ok) throw new Error('API error');
    return res.json();
  } catch (err) {
    console.warn('getApplicantSummary failed:', err);
    return null;
  }
}

// Super Admin Approvals Center
export async function getApprovals(status = 'pending') {
  try {
    const res = await fetch(`${API_BASE}/api/admin/approvals?status=${status}`);
    if (!res.ok) throw new Error('API error');
    return res.json();
  } catch (err) {
    console.warn('getApprovals failed:', err);
    return { items: [], counts: { pending: 0, approved: 0, rejected: 0 } };
  }
}

export async function approveContent(type, id) {
  const res = await fetch(`${API_BASE}/api/admin/approvals/${type}/${id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  return res.json();
}

export async function rejectContent(type, id, notes = '') {
  const res = await fetch(`${API_BASE}/api/admin/approvals/${type}/${id}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes }),
  });
  return res.json();
}
