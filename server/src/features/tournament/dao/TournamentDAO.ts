import { Tournament } from '../models';
import { TournamentDto, mapTournamentToDto } from '../dto';

export class TournamentDAO {
  async findByM2Id(m2TournamentId: number): Promise<TournamentDto | null> {
    const doc = await Tournament.findOne({ m2TournamentId });
    return doc ? mapTournamentToDto(doc) : null;
  }

  async create(m2TournamentId: number, name: string): Promise<TournamentDto> {
    const doc = await Tournament.create({ m2TournamentId, name });
    return mapTournamentToDto(doc);
  }

  async findOrCreate(m2TournamentId: number, name: string): Promise<TournamentDto> {
    const existing = await this.findByM2Id(m2TournamentId);
    if (existing) return existing;
    return this.create(m2TournamentId, name);
  }
}

export const tournamentDAO = new TournamentDAO();
