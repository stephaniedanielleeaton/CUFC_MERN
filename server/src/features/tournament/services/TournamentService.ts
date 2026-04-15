import { getM2Service } from './meyerSquared';
import { TournamentDetailDto, ClubDto } from '../dto';

export class TournamentService {
  async getClubTournaments(): Promise<TournamentDetailDto[]> {
    const m2Service = getM2Service();
    return m2Service.getClubTournaments();
  }

  async getTournamentDetails(m2TournamentId: number): Promise<TournamentDetailDto | null> {
    const m2Service = getM2Service();
    return m2Service.getTournament(m2TournamentId);
  }

  async getClubs(): Promise<ClubDto[]> {
    const m2Service = getM2Service();
    return m2Service.getAllClubs();
  }
}

export const tournamentService = new TournamentService();
