import mongoose, { Schema, Document, Types } from 'mongoose';
import { RegistrantDto, RegistrantDetailDto, SelectedEventDto, ClubAffiliationDto } from '../dto/RegistrantDto';

const SelectedEventSchema = new Schema({
  m2EventId: { type: Number, required: true },
  eventName: { type: String, required: true },
  priceInCents: { type: Number, required: true },
}, { _id: false });

const ClubAffiliationSchema = new Schema({
  m2ClubId: { type: Number, required: true },
  name: { type: String, required: true },
}, { _id: false });

export interface ISelectedEvent {
  m2EventId: number;
  eventName: string;
  priceInCents: number;
}

export interface IClubAffiliation {
  m2ClubId: number;
  name: string;
}

export interface IRegistrant extends Document {
  tournamentId: Types.ObjectId;
  m2TournamentId: number;
  tournamentName: string;
  selectedEvents: ISelectedEvent[];
  preferredFirstName: string;
  preferredLastName: string;
  legalFirstName: string;
  legalLastName: string;
  email: string;
  phoneNumber: string;
  clubAffiliation?: IClubAffiliation;
  isMinor: boolean;
  guardianFirstName?: string;
  guardianLastName?: string;
  paymentId: string;
  squareOrderId?: string;
  isPaid?: boolean;
  paidAt?: Date;
  amountPaidInCents?: number;
  baseFeeChargedInCents?: number;
  m2Posted?: boolean;
  m2PostedAt?: Date;
  userId?: Types.ObjectId;
  auth0Id?: string;
  isRequestedAlternativeQualification?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Mappers live here because we map FROM IRegistrant
export function mapRegistrantToDto(doc: IRegistrant): RegistrantDto {
  return {
    id: doc._id.toString(),
    paymentId: doc.paymentId,
    tournamentId: doc.tournamentId.toString(),
    m2TournamentId: doc.m2TournamentId,
    tournamentName: doc.tournamentName,
    selectedEvents: doc.selectedEvents.map((e): SelectedEventDto => ({
      m2EventId: e.m2EventId,
      eventName: e.eventName,
      priceInCents: e.priceInCents,
    })),
    displayName: `${doc.preferredFirstName} ${doc.preferredLastName}`,
    email: doc.email,
    isPaid: doc.isPaid ?? false,
    paidAt: doc.paidAt?.toISOString(),
    amountPaidInCents: doc.amountPaidInCents,
    baseFeeChargedInCents: doc.baseFeeChargedInCents,
    m2Posted: doc.m2Posted ?? false,
    createdAt: doc.createdAt?.toISOString() ?? '',
  };
}

export function mapRegistrantToDetailDto(doc: IRegistrant): RegistrantDetailDto {
  return {
    ...mapRegistrantToDto(doc),
    preferredFirstName: doc.preferredFirstName,
    preferredLastName: doc.preferredLastName,
    legalFirstName: doc.legalFirstName,
    legalLastName: doc.legalLastName,
    phoneNumber: doc.phoneNumber,
    clubAffiliation: doc.clubAffiliation ? {
      m2ClubId: doc.clubAffiliation.m2ClubId,
      name: doc.clubAffiliation.name,
    } as ClubAffiliationDto : undefined,
    isMinor: doc.isMinor,
    guardianFirstName: doc.guardianFirstName,
    guardianLastName: doc.guardianLastName,
    squareOrderId: doc.squareOrderId,
    auth0Id: doc.auth0Id,
    isRequestedAlternativeQualification: doc.isRequestedAlternativeQualification ?? false,
  };
}

const RegistrantSchema = new Schema<IRegistrant>({
  tournamentId: { type: Schema.Types.ObjectId, ref: 'Tournament', required: true, index: true },
  m2TournamentId: { type: Number, required: true, index: true },
  tournamentName: { type: String, required: true },
  selectedEvents: [SelectedEventSchema],
  preferredFirstName: { type: String, required: true },
  preferredLastName: { type: String, required: true },
  legalFirstName: { type: String, required: true },
  legalLastName: { type: String, required: true },
  email: { type: String, required: true, index: true },
  phoneNumber: { type: String, required: true },
  clubAffiliation: ClubAffiliationSchema,
  isMinor: { type: Boolean, required: true },
  guardianFirstName: String,
  guardianLastName: String,
  paymentId: { type: String, required: true, unique: true, index: true },
  squareOrderId: { type: String, index: true },
  isPaid: { type: Boolean, default: false, index: true },
  paidAt: Date,
  amountPaidInCents: Number,
  baseFeeChargedInCents: Number,
  m2Posted: { type: Boolean, default: false },
  m2PostedAt: Date,
  userId: { type: Schema.Types.ObjectId, ref: 'MemberProfile', index: true },
  auth0Id: { type: String, index: true },
  isRequestedAlternativeQualification: { type: Boolean, default: false },
}, { timestamps: true });

export const Registrant = mongoose.model<IRegistrant>('Registrant', RegistrantSchema);
