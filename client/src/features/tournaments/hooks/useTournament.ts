import { useState, useEffect } from 'react';
import type { TournamentDetailDto } from '@cufc/shared';
import { fetchTournament } from '../api/tournamentApi';

export function useTournament(m2TournamentId: number | undefined) {
  const [tournament, setTournament] = useState<TournamentDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!m2TournamentId) {
      setTournament(null);
      setError(null);
      setLoading(false);
      return;
    }

    // Reset state when ID changes
    setLoading(true);
    setTournament(null);
    setError(null);

    let cancelled = false;

    async function load() {
      try {
        const data = await fetchTournament(m2TournamentId!);
        if (!cancelled) {
          setTournament(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load tournament');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [m2TournamentId]);

  return { tournament, loading, error };
}
