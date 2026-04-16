import { useState, useEffect } from 'react';
import type { ClubDto } from '@cufc/shared';
import { fetchClubs } from '../api/tournamentApi';

export function useClubs() {
  const [clubs, setClubs] = useState<ClubDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchClubs();
        if (!cancelled) {
          setClubs(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load clubs');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { clubs, loading, error };
}
