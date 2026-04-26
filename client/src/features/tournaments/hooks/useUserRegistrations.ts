import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import type { UserRegistrationDto } from '@cufc/shared';
import { fetchUserRegistrations } from '../api/tournamentApi';

export function useUserRegistrations() {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [registrations, setRegistrations] = useState<UserRegistrationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setRegistrations([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const token = await getAccessTokenSilently();
        const data = await fetchUserRegistrations(token);
        if (!cancelled) {
          setRegistrations(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load registrations');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [isAuthenticated, getAccessTokenSilently]);

  return { registrations, loading, error, isAuthenticated };
}
