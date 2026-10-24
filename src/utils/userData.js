export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

export function getUserStorageKey(name) {
  // 'user' is the primary session object and must NEVER be scoped or removed
  if (name === 'user') return null;
  const user = getCurrentUser();
  const identity = user?.id || user?.email;
  return identity ? `${name}:${identity}` : null;
}

export function getUserData(name, fallback = null) {
  if (name === 'user') {
    return getCurrentUser() || fallback;
  }

  const userStorageKey = getUserStorageKey(name);

  // If a user is logged in, ONLY read their user-scoped key!
  // Do NOT fall back to unscoped keys from previous sessions or accounts.
  if (userStorageKey) {
    try {
      const storedValue = localStorage.getItem(userStorageKey);
      if (storedValue !== null) return JSON.parse(storedValue);
    } catch {
      // ignore
    }
    return fallback;
  }

  // Fallback to unscoped active session key only when no user is logged in (guest mode)
  try {
    const storedValue = localStorage.getItem(name);
    if (storedValue !== null) return JSON.parse(storedValue);
  } catch {
    return fallback;
  }

  return fallback;
}

export function saveUserData(name, value) {
  // Session user object handling: update directly and NEVER remove 'user'
  if (name === 'user') {
    localStorage.setItem('user', JSON.stringify(value));
    if (value?.id) {
      localStorage.setItem('userId', String(value.id));
    }
    return;
  }

  const userStorageKey = getUserStorageKey(name);
  if (userStorageKey) {
    localStorage.setItem(userStorageKey, JSON.stringify(value));
  } else {
    // Only maintain un-scoped key for guest/non-logged-in sessions
    localStorage.setItem(name, JSON.stringify(value));
  }
}

export function clearUserData(name) {
  if (name === 'user') {
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    return;
  }

  const userStorageKey = getUserStorageKey(name);
  if (userStorageKey) {
    localStorage.removeItem(userStorageKey);
  }
  localStorage.removeItem(name);
}

export function clearLegacyUserData() {
  ['bpoReadyAssessment', 'bpoReadyActivity'].forEach((key) => localStorage.removeItem(key));

  const currentUser = getCurrentUser();
  if (!currentUser) return;

  const identity = currentUser.id || currentUser.email;
  if (!identity) return;

  ['bpoReadyAssessment', 'bpoReadyActivity'].forEach((key) => {
    localStorage.removeItem(`${key}:${identity}`);
  });
}

export function getUserActivity() {
  return getUserData('bpoReadyActivity', []);
}

export function addUserActivity(activity) {
  const current = getUserActivity();
  saveUserData('bpoReadyActivity', [{ ...activity, id: Date.now() }, ...current]);
}
