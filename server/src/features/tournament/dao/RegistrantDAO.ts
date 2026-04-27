import { Types } from 'mongoose';
import { Registrant } from '../models';
import { RegistrantDto, RegistrantDetailDto, SelectedEventDto, ClubAffiliationDto, mapRegistrantToDto, mapRegistrantToDetailDto } from '../dto';

export interface CreateRegistrantData {
  tournamentId: string;
  m2TournamentId: number;
  tournamentName: string;
  selectedEvents: SelectedEventDto[];
  preferredFirstName: string;
  preferredLastName: string;
  legalFirstName: string;
  legalLastName: string;
  email: string;
  phoneNumber: string;
  clubAffiliation?: ClubAffiliationDto;
  isMinor: boolean;
  guardianFirstName?: string;
  guardianLastName?: string;
  paymentId: string;
  baseFeeChargedInCents: number;
  userId?: string;
  auth0Id?: string;
  isRequestedAlternativeQualification?: boolean;
}

export class RegistrantDAO {
  async create(data: CreateRegistrantData): Promise<RegistrantDetailDto> {
    const doc = await Registrant.create({
      ...data,
      tournamentId: new Types.ObjectId(data.tournamentId),
      userId: data.userId ? new Types.ObjectId(data.userId) : undefined,
    });
    return mapRegistrantToDetailDto(doc);
  }

  async findByPaymentId(paymentId: string): Promise<RegistrantDetailDto | null> {
    const doc = await Registrant.findOne({ paymentId });
    return doc ? mapRegistrantToDetailDto(doc) : null;
  }

  async findByM2TournamentId(m2TournamentId: number): Promise<RegistrantDto[]> {
    const docs = await Registrant.find({ m2TournamentId, isPaid: true }).sort({ createdAt: -1 });
    return docs.map(mapRegistrantToDto);
  }

  async findByAuth0Id(auth0Id: string): Promise<RegistrantDto[]> {
    const docs = await Registrant.find({ auth0Id, isPaid: true }).sort({ createdAt: -1 });
    return docs.map(mapRegistrantToDto);
  }

  async findPaidByAuth0AndTournament(auth0Id: string, m2TournamentId: number): Promise<RegistrantDto | null> {
    const doc = await Registrant.findOne({ auth0Id, m2TournamentId, isPaid: true });
    return doc ? mapRegistrantToDto(doc) : null;
  }

  async findPaidByUserIdAndTournament(userId: string, m2TournamentId: number): Promise<RegistrantDto | null> {
    const doc = await Registrant.findOne({ userId: new Types.ObjectId(userId), m2TournamentId, isPaid: true });
    return doc ? mapRegistrantToDto(doc) : null;
  }

  async findPaidByEmailAndTournament(email: string, m2TournamentId: number): Promise<RegistrantDto | null> {
    const doc = await Registrant.findOne({ email: email.toLowerCase(), m2TournamentId, isPaid: true });
    return doc ? mapRegistrantToDto(doc) : null;
  }

  /**
   * Atomically mark registrant as paid only if not already paid.
   * Returns the updated registrant if this was the first payment, null otherwise.
   * This provides idempotency for duplicate webhook calls.
   */
  async markPaidIfNotAlready(
    paymentId: string,
    data: { squareOrderId: string; amountPaidInCents: number }
  ): Promise<RegistrantDetailDto | null> {
    const doc = await Registrant.findOneAndUpdate(
      { paymentId, isPaid: { $ne: true } },
      { ...data, isPaid: true, paidAt: new Date() },
      { new: true }
    );
    return doc ? mapRegistrantToDetailDto(doc) : null;
  }

  async updateM2StatusByPaymentId(paymentId: string, posted: boolean): Promise<void> {
    await Registrant.findOneAndUpdate(
      { paymentId },
      { m2Posted: posted, m2PostedAt: posted ? new Date() : undefined }
    );
  }

}

export const registrantDAO = new RegistrantDAO();
