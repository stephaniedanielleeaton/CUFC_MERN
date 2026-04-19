import { getM2Service, M2AddPersonData } from './meyerSquared';
import { tournamentDAO, registrantDAO, CreateRegistrantData } from '../dao';
import { 
  RegistrantDto, 
  RegistrantDetailDto, 
  SelectedEventDto,
  ClubAffiliationDto,
} from '../dto';
import { EmailList } from '../../../models/EmailList';

export interface SubmitRegistrationData {
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
  baseFeeChargedInCents: number;
  userId?: string;
  auth0Id?: string;
  isRequestedAlternativeQualification?: boolean;
}

export class RegistrationService {
  async submitRegistration(data: SubmitRegistrationData): Promise<{ registrant: RegistrantDetailDto; paymentId: string }> {
    const tournament = await tournamentDAO.findOrCreate(data.m2TournamentId, data.tournamentName);
    const paymentId = this.generatePaymentId(data.m2TournamentId);

    const createData: CreateRegistrantData = {
      ...data,
      tournamentId: tournament.id,
      paymentId,
    };

    const registrant = await registrantDAO.create(createData);
    return { registrant, paymentId };
  }

  async hasExistingPaidRegistration(auth0Id: string, m2TournamentId: number): Promise<boolean> {
    const existing = await registrantDAO.findPaidByUserAndTournament(auth0Id, m2TournamentId);
    return existing !== null;
  }

  async getRegistrantsByTournament(m2TournamentId: number): Promise<RegistrantDto[]> {
    return registrantDAO.findByM2TournamentId(m2TournamentId);
  }

  async getRegistrantsByUser(auth0Id: string): Promise<RegistrantDto[]> {
    return registrantDAO.findByAuth0Id(auth0Id);
  }

  async finalizePayment(
    paymentId: string,
    squareOrderId: string,
    amountPaidInCents: number
  ): Promise<RegistrantDetailDto | null> {
    const existing = await registrantDAO.findByPaymentId(paymentId);
    if (!existing || existing.isPaid) {
      return null;
    }

    const registrant = await registrantDAO.updatePaymentStatus(paymentId, {
      squareOrderId,
      amountPaidInCents,
    });

    if (registrant) {
      await this.postToM2(registrant);
      await this.addToTournamentEmailList(registrant);
    }

    return registrant;
  }

  private async postToM2(registrant: RegistrantDetailDto): Promise<void> {
    const m2Service = getM2Service();

    try {
      for (const event of registrant.selectedEvents) {
        const personData: M2AddPersonData = {
          email: registrant.email,
          displayName: `${registrant.preferredFirstName} ${registrant.preferredLastName}`,
          firstName: registrant.legalFirstName,
          lastName: registrant.legalLastName,
          clubId: registrant.clubAffiliation?.m2ClubId,
        };
        await m2Service.addPersonToEvent(event.m2EventId, personData);
      }
      await registrantDAO.updateM2StatusByPaymentId(registrant.paymentId, true);
    } catch (error) {
      await registrantDAO.updateM2StatusByPaymentId(registrant.paymentId, false);
      await this.sendM2FailureAlert(registrant, error);
    }
  }

  private async sendM2FailureAlert(registrant: RegistrantDetailDto, error: unknown): Promise<void> {
    const errorMessage = error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null
        ? JSON.stringify(error)
        : String(error);
    const subject = `[ALERT] M2 Registration Failed - ${registrant.displayName}`;
    const message = `
      <h2>M2 Registration Failed</h2>
      <p><strong>Registrant:</strong> ${registrant.displayName}</p>
      <p><strong>Email:</strong> ${registrant.email}</p>
      <p><strong>Tournament:</strong> ${registrant.tournamentName}</p>
      <p><strong>Events:</strong> ${registrant.selectedEvents.map(e => e.eventName).join(', ')}</p>
      <p><strong>Error:</strong> ${errorMessage}</p>
      <p>Please manually add this registrant to M2.</p>
    `;

    try {
      console.error('M2 failure alert:', subject, message);
    } catch (emailError) {
      console.error('Failed to send M2 failure alert email:', emailError);
    }
  }

  private async addToTournamentEmailList(registrant: RegistrantDetailDto): Promise<void> {
    const listId = `tournament-${registrant.m2TournamentId}`;
    const listName = `${registrant.tournamentName} Registrants`;

    try {
      let list = await EmailList.findOne({ id: listId });
      if (!list) {
        list = new EmailList({ id: listId, name: listName, emails: [] });
      }
      if (!list.emails.includes(registrant.email.toLowerCase())) {
        list.emails.push(registrant.email.toLowerCase());
        await list.save();
      }
    } catch (error) {
      console.error('Failed to add email to tournament list:', error);
    }
  }

  private generatePaymentId(m2TournamentId: number): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `${m2TournamentId}-${timestamp}-${random}`;
  }
}

export const registrationService = new RegistrationService();
