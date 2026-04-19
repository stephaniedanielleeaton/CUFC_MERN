import { useState } from 'react';
import type { RegistrationRequestDto, RegistrationResponseDto } from '@cufc/shared';
import { submitRegistration } from '../api/tournamentApi';

interface UseRegistrationReturn {
  register: (request: RegistrationRequestDto) => Promise<RegistrationResponseDto>;
  loading: boolean;
  error: string | null;
  success: boolean;
  reset: () => void;
}

export function useRegistration(): UseRegistrationReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const register = async (request: RegistrationRequestDto): Promise<RegistrationResponseDto> => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const response = await submitRegistration(request);
      setSuccess(true);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setLoading(false);
    setError(null);
    setSuccess(false);
  };

  return { register, loading, error, success, reset };
}
