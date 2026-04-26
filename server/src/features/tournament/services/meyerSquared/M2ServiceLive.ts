import axios from 'axios';
import { IM2Service, M2AddPersonData } from './IM2Service';
import { 
  M2ClubTournamentsResponse,
  M2ClubResponse, 
  M2AddPersonRequest,
  mapM2ClubTournamentsToDto,
  mapM2ClubToDto,
} from './m2Types';
import { TournamentDetailDto, ClubDto } from '../../dto';
import { env } from '../../../../config/env';

export class M2ServiceLive implements IM2Service {
  private token: string | null = null;
  private tokenExpiry: number | null = null;

  private async getToken(): Promise<string> {
    if (this.token && this.tokenExpiry && (this.tokenExpiry - Date.now() > 300000)) {
      return this.token;
    }

    const response = await axios.post(env.M2_AUTH_URL, {
      client_id: env.M2_CLIENT_ID,
      client_secret: env.M2_CLIENT_SECRET,
      audience: env.M2_AUDIENCE,
      grant_type: 'client_credentials'
    });

    const accessToken = response.data.access_token;
    if (!accessToken) {
      throw new Error('No access token received from Auth0');
    }
    this.token = accessToken;
    this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
    return accessToken;
  }

  async getClubTournaments(): Promise<TournamentDetailDto[]> {
    const response = await axios.get<M2ClubTournamentsResponse[]>(
      `${env.M2_BASE_URL}/tournament/public/clubwithevents/${env.M2_CLUB_ID}`
    );
    return response.data.map((t) => mapM2ClubTournamentsToDto(t));
  }

  async getTournament(tournamentId: number): Promise<TournamentDetailDto | null> {
    const tournaments = await this.getClubTournaments();
    return tournaments.find((t) => t.m2TournamentId === tournamentId) ?? null;
  }

  async getAllClubs(): Promise<ClubDto[]> {
    const token = await this.getToken();
    const response = await axios.get<M2ClubResponse[]>(`${env.M2_BASE_URL}/club/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.map(mapM2ClubToDto);
  }

  async addPersonToEvent(eventId: number, person: M2AddPersonData): Promise<void> {
    const token = await this.getToken();
    const request: M2AddPersonRequest = {
      Email: person.email,
      DisplayName: person.displayName,
      FirstName: person.firstName,
      LastName: person.lastName,
      ClubId: person.clubId,
    };
    await axios.post(
      `${env.M2_BASE_URL}/event/${eventId}/addPersonFromThirdParty`,
      request,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }
}
