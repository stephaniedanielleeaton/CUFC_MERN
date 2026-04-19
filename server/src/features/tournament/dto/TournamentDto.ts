// DTO interface only - mapper is in ../models/Tournament.ts (mapping FROM ITournament)

export interface TournamentDto {
  id: string;
  m2TournamentId: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
