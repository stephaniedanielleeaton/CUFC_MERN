import { Tournament } from '../models';
import { TournamentDto, mapTournamentToDto } from '../dto';

export class TournamentDAO {
  async findByM2Id(m2TournamentId: number): Promise<TournamentDto | null> {
    const doc = await Tournament.findOne({ m2TournamentId });
    return doc ? mapTournamentToDto(doc) : null;
  }

  async create(m2TournamentId: number, name: string): Promise<TournamentDto> {
    const doc = await Tournament.create({ m2TournamentId, name, isActive: false });
    return mapTournamentToDto(doc);
  }

  async findOrCreate(m2TournamentId: number, name: string): Promise<TournamentDto> {
    const existing = await this.findByM2Id(m2TournamentId);
    if (existing) return existing;
    return this.create(m2TournamentId, name);
  }

  async setActive(m2TournamentId: number, isActive: boolean): Promise<TournamentDto | null> {
    const doc = await Tournament.findOneAndUpdate(
      { m2TournamentId },
      { isActive },
      { new: true }
    );
    return doc ? mapTournamentToDto(doc) : null;
  }

  async getAll(): Promise<TournamentDto[]> {
    const docs = await Tournament.find({});
    return docs.map(mapTournamentToDto);
  }

  async getActiveM2Ids(): Promise<Set<number>> {
    const docs = await Tournament.find({ isActive: true }, { m2TournamentId: 1 });
    return new Set(docs.map(d => d.m2TournamentId));
  }
}

export const tournamentDAO = new TournamentDAO();
