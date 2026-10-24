// Laravel is served separately from Vite during local development.
const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

async function request(path, payload, method = 'POST') {
  const requestOptions = {
    method,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  };

  try {
    const response = await fetch(`${API_BASE}${path}`, requestOptions);
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const firstError = body.errors && Object.values(body.errors).flat()[0];
      throw new Error(firstError || body.message || `Request failed (${response.status}).`);
    }
    return body;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Cannot connect to the server. Make sure Laravel is running on port 8000.');
    }
    throw error;
  }
}

export function registerUser(payload) {
  return request('/api/auth/register', payload);
}

export function loginUser(payload) {
  return request('/api/auth/login', payload);
}

export function loginAdmin(payload) {
  return request('/api/auth/admin-login', payload);
}

export function updateProfile(userId, payload) {
  return request(`/api/auth/profile/${userId}`, payload, 'PUT');
}

export function changePassword(userId, payload) {
  return request(`/api/auth/change-password/${userId}`, payload, 'POST');
}

export function resetPassword(payload) {
  return request('/api/auth/reset-password', payload, 'POST');
}

export function saveAuthenticatedUser(data) {
  const nextUser = data?.user;
  if (!nextUser) {
    throw new Error('Invalid login response.');
  }

  const previousUser = JSON.parse(localStorage.getItem('user') || 'null');
  const previousIdentity = previousUser?.id || previousUser?.email;
  const nextIdentity = nextUser.id || nextUser.email;

  // Always remove unscoped keys to prevent guest or prior session leakage
  ['bpoReadyAssessment', 'bpoReadyActivity'].forEach((key) => {
    localStorage.removeItem(key);
    if (previousIdentity && previousIdentity !== nextIdentity) {
      localStorage.removeItem(`${key}:${previousIdentity}`);
    }
  });

  localStorage.setItem('user', JSON.stringify(nextUser));
  localStorage.setItem('token', data.token);
  localStorage.setItem('userId', String(nextUser.id));
}