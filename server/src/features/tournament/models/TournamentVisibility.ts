import mongoose, { Schema, Document } from 'mongoose';

export interface ITournamentVisibility extends Document {
  m2TournamentId: number;
  name: string;
  isEnabled: boolean;
  enabledAt?: Date;
  enabledBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const TournamentVisibilitySchema = new Schema<ITournamentVisibility>({
  m2TournamentId: { type: Number, required: true, unique: true, index: true },
  name: { type: String, required: true },
  isEnabled: { type: Boolean, default: true },
  enabledAt: { type: Date },
  enabledBy: { type: String },
}, { timestamps: true });

export const TournamentVisibility = mongoose.model<ITournamentVisibility>('TournamentVisibility', TournamentVisibilitySchema);
