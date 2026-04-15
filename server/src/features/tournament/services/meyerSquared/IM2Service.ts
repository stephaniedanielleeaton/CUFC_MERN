import { TournamentDetailDto, ClubDto } from '../../dto';

export interface M2AddPersonData {
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  clubId?: number;
}

export interface IM2Service {
  getClubTournaments(): Promise<TournamentDetailDto[]>;
  getTournament(tournamentId: number): Promise<TournamentDetailDto | null>;
  getAllClubs(): Promise<ClubDto[]>;
  addPersonToEvent(eventId: number, person: M2AddPersonData): Promise<void>;
}
