import { getM2Service } from './meyerSquared';
import { TournamentDetailDto, ClubDto } from '../dto';
import { TournamentVisibility } from '../models';

export class TournamentService {
  /**
   * Get tournaments for public display (only enabled ones)
   */
  async getClubTournaments(): Promise<TournamentDetailDto[]> {
    const m2Service = getM2Service();
    const allTournaments = await m2Service.getClubTournaments();
    
    const enabledDocs = await TournamentVisibility.find({ isEnabled: true }, { m2TournamentId: 1 });
    const enabledIds = new Set(enabledDocs.map(d => d.m2TournamentId));
    return allTournaments.filter(t => enabledIds.has(t.m2TournamentId));
  }


  async getClubTournamentsForAdmin(): Promise<(TournamentDetailDto & { isEnabled: boolean })[]> {
    const m2Service = getM2Service();
    const allTournaments = await m2Service.getClubTournaments();
    
    const visibilityDocs = await TournamentVisibility.find({});
    const visibilityMap = new Map(visibilityDocs.map(d => [d.m2TournamentId, d.isEnabled]));
    
    return allTournaments.map(t => ({
      ...t,
      isEnabled: visibilityMap.get(t.m2TournamentId) ?? false,
    }));
  }

  async getTournamentDetails(m2TournamentId: number): Promise<TournamentDetailDto | null> {
    const m2Service = getM2Service();
    return m2Service.getTournament(m2TournamentId);
  }

  async getClubs(): Promise<ClubDto[]> {
    const m2Service = getM2Service();
    return m2Service.getAllClubs();
  }


  async setTournamentEnabled(
    m2TournamentId: number,
    name: string,
    isEnabled: boolean,
    enabledBy?: string
  ): Promise<{ m2TournamentId: number; isEnabled: boolean }> {
    const doc = await TournamentVisibility.findOneAndUpdate(
      { m2TournamentId },
      {
        m2TournamentId,
        name,
        isEnabled,
        ...(isEnabled ? { enabledAt: new Date(), enabledBy } : {}),
      },
      { upsert: true, new: true }
    );
    return { m2TournamentId: doc.m2TournamentId, isEnabled: doc.isEnabled };
  }
}

export const tournamentService = new TournamentService();
