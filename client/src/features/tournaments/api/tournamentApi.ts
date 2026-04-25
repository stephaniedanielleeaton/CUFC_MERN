import type {
  TournamentDetailDto,
  ClubDto,
  RegistrationRequestDto,
  RegistrationResponseDto,
  UserRegistrationDto,
} from '@cufc/shared';
import { API_ENDPOINTS } from '../../../constants/api';

export async function fetchTournaments(): Promise<TournamentDetailDto[]> {
  const res = await fetch(API_ENDPOINTS.TOURNAMENTS.ROOT);
  if (!res.ok) throw new Error('Failed to fetch tournaments');
  return res.json();
}

export async function fetchTournament(m2TournamentId: number): Promise<TournamentDetailDto> {
  const res = await fetch(API_ENDPOINTS.TOURNAMENTS.BY_ID(m2TournamentId));
  if (!res.ok) throw new Error('Failed to fetch tournament');
  return res.json();
}

export async function fetchClubs(): Promise<ClubDto[]> {
  const res = await fetch(API_ENDPOINTS.TOURNAMENTS.CLUBS);
  if (!res.ok) throw new Error('Failed to fetch clubs');
  return res.json();
}

export async function submitRegistration(
  request: RegistrationRequestDto
): Promise<RegistrationResponseDto> {
  const res = await fetch(API_ENDPOINTS.TOURNAMENTS.REGISTER(request.m2TournamentId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    let message = 'Failed to submit registration';
    try {
      const error = await res.json();
      message = error.message || message;
    } catch {
      // Response wasn't JSON, use default message
    }
    throw new Error(message);
  }
  return res.json();
}

export async function fetchUserRegistrations(
  token: string
): Promise<UserRegistrationDto[]> {
  const res = await fetch(API_ENDPOINTS.TOURNAMENTS.USER_REGISTRATIONS, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch user registrations');
  return res.json();
}

export type TournamentWithStatus = TournamentDetailDto & { isEnabled: boolean };

export async function fetchTournamentsForAdmin(
  token: string
): Promise<TournamentWithStatus[]> {
  const res = await fetch('/api/tournaments/admin/all', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch tournaments');
  return res.json();
}

export async function toggleTournamentVisibility(
  token: string,
  m2TournamentId: number,
  name: string,
  isEnabled: boolean
): Promise<void> {
  const res = await fetch(`/api/tournaments/admin/${m2TournamentId}/toggle`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ isEnabled, name }),
  });
  if (!res.ok) throw new Error('Failed to update tournament visibility');
}

export async function checkHasRegistration(
  token: string,
  m2TournamentId: number
): Promise<boolean> {
  const res = await fetch(`/api/tournaments/user/has-registration/${m2TournamentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return false;
  const data = await res.json();
  return data.hasRegistration === true;
}
