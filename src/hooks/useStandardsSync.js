import { useEffect, useState } from 'react';
import { syncInstitutionalStandards } from '../utils/assessmentScoring';

/**
 * Subscribes a component to live institutional scoring standard updates from
 * the backend API, same-browser storage events, and tab focus changes.
 */
export function useStandardsSync() {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    syncInstitutionalStandards(true);

    const handleUpdate = () => setVersion((v) => v + 1);
    const handleStorage = (e) => {
      if (!e.key || e.key.startsWith('bpoReady')) {
        setVersion((v) => v + 1);
      }
    };
    const handleFocus = () => {
      syncInstitutionalStandards(true);
    };

    window.addEventListener('bpo-scoring-standards-updated', handleUpdate);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('bpo-scoring-standards-updated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return version;
}
