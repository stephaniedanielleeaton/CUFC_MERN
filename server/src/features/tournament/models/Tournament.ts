import mongoose, { Schema, Document } from 'mongoose';
import { TournamentDto } from '../dto/TournamentDto';

export interface ITournament extends Document {
  m2TournamentId: number;
  name: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Mapper lives here because we map FROM ITournament
export function mapTournamentToDto(doc: ITournament): TournamentDto {
  return {
    id: doc._id.toString(),
    m2TournamentId: doc.m2TournamentId,
    name: doc.name,
    isActive: doc.isActive ?? true,
    createdAt: doc.createdAt?.toISOString() ?? '',
    updatedAt: doc.updatedAt?.toISOString() ?? '',
  };
}

const TournamentSchema = new Schema<ITournament>({
  m2TournamentId: { type: Number, required: true, unique: true, index: true },
  name: { type: String, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const Tournament = mongoose.model<ITournament>('Tournament', TournamentSchema);
