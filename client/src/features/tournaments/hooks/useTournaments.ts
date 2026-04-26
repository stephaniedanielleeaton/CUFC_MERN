import { useState, useEffect } from 'react';
import type { TournamentDetailDto } from '@cufc/shared';
import { fetchTournaments } from '../api/tournamentApi';

export function useTournaments() {
  const [tournaments, setTournaments] = useState<TournamentDetailDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchTournaments();
        if (!cancelled) {
          setTournaments(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load tournaments');
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

  return { tournaments, loading, error };
}
