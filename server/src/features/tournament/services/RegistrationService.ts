import { getM2Service, M2AddPersonData } from './meyerSquared';
import { tournamentService } from './TournamentService';
import { tournamentSquareService } from './TournamentSquareService';
import { tournamentDAO, registrantDAO, CreateRegistrantData } from '../dao';
import { 
  RegistrantDto, 
  RegistrantDetailDto, 
  SelectedEventDto,
  ClubAffiliationDto,
  RegistrationRequestDto,
  RegistrationResponseDto,
} from '../dto';
import { EmailList } from '../../../models/EmailList';
import { memberProfileService } from '../../../services/memberProfileService';
import { emailService } from '../../../services/emailService';
import { env } from '../../../config/env';

function escapeHtml(input: string | undefined | null): string {
  if (!input) return '';
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export class RegistrationError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = 'RegistrationError';
  }
}

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
  
  async processRegistration(
    m2TournamentId: number,
    request: RegistrationRequestDto,
    auth0Id?: string
  ): Promise<RegistrationResponseDto> {
    const tournament = await tournamentService.getTournamentDetails(m2TournamentId);
    if (!tournament) {
      throw new RegistrationError('Tournament not found', 404);
    }

    let userId: string | undefined;
    let hasExistingRegistration = false;
    if (auth0Id) {
      const profile = await memberProfileService.getByAuth0Id(auth0Id);
      userId = profile?._id;
      hasExistingRegistration = await this.hasExistingPaidRegistration(auth0Id, m2TournamentId);
    }

    const baseFeeToCharge = hasExistingRegistration ? 0 : tournament.basePriceInCents;

    const submitData: SubmitRegistrationData = {
      m2TournamentId,
      tournamentName: tournament.name,
      selectedEvents: request.selectedEvents,
      preferredFirstName: request.preferredFirstName,
      preferredLastName: request.preferredLastName,
      legalFirstName: request.legalFirstName,
      legalLastName: request.legalLastName,
      email: request.email,
      phoneNumber: request.phoneNumber,
      clubAffiliation: request.clubAffiliation,
      isMinor: request.isMinor,
      guardianFirstName: request.guardianFirstName,
      guardianLastName: request.guardianLastName,
      baseFeeChargedInCents: baseFeeToCharge,
      userId,
      auth0Id,
      isRequestedAlternativeQualification: request.isRequestedAlternativeQualification,
    };

    const { registrant, paymentId } = await this.createRegistrant(submitData);

    const { paymentUrl } = await tournamentSquareService.createOrderWithPaymentLink({
      tournamentName: tournament.name,
      selectedEvents: request.selectedEvents,
      baseFeeInCents: baseFeeToCharge,
      paymentId,
      m2TournamentId,
      registrantId: registrant.id,
    });

    return {
      registrantId: registrant.id,
      paymentId,
      paymentUrl,
    };
  }

  private async createRegistrant(data: SubmitRegistrationData): Promise<{ registrant: RegistrantDetailDto; paymentId: string }> {
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

  /**
   * @deprecated Use processRegistration instead
   */
  async submitRegistration(data: SubmitRegistrationData): Promise<{ registrant: RegistrantDetailDto; paymentId: string }> {
    return this.createRegistrant(data);
  }

  async hasExistingPaidRegistration(auth0Id: string, m2TournamentId: number, email?: string): Promise<boolean> {
    const profile = await memberProfileService.getByAuth0Id(auth0Id);
    if (profile?._id) {
      const byUserId = await registrantDAO.findPaidByUserIdAndTournament(profile._id.toString(), m2TournamentId);
      if (byUserId) {
        return true;
      }
    }

    const byAuth0 = await registrantDAO.findPaidByAuth0AndTournament(auth0Id, m2TournamentId);
    if (byAuth0) {
      return true;
    }

    if (email) {
      const byEmail = await registrantDAO.findPaidByEmailAndTournament(email, m2TournamentId);
      if (byEmail) {
        return true;
      }
    }

    return false;
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
    // Atomic update - only succeeds if not already paid (idempotent for duplicate webhooks)
    const registrant = await registrantDAO.markPaidIfNotAlready(paymentId, {
      squareOrderId,
      amountPaidInCents,
    });

    if (!registrant) {
      console.log(`[RegistrationService] Payment ${paymentId} already processed or not found, skipping`);
      return null;
    }

    await this.postToM2(registrant);
    await this.addToTournamentEmailList(registrant);
    await this.sendRegistrationAlert(registrant);

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

  private async sendRegistrationAlert(registrant: RegistrantDetailDto): Promise<void> {
    if (!env.EMAIL_ACCOUNT) {
      console.warn('[RegistrationService] No EMAIL_ACCOUNT configured, skipping alert');
      return;
    }

    try {
      const eventsList = registrant.selectedEvents
        .map(event => `<li>${escapeHtml(event.eventName)}</li>`)
        .join('');

      const qualificationNote = registrant.isRequestedAlternativeQualification
        ? `
          <p><strong>Qualification Note:</strong> This registrant requested to use their URG or women&apos;s rating to qualify for a higher division.</p>
        `
        : '';

      const emailContent = `
        <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
          <h2>New Tournament Registration</h2>

          <p><strong>Tournament:</strong> ${escapeHtml(registrant.tournamentName)}</p>

          <p>
            <strong>Preferred Name:</strong> ${escapeHtml(`${registrant.preferredFirstName} ${registrant.preferredLastName}`)}<br/>
            <strong>Legal Name:</strong> ${escapeHtml(`${registrant.legalFirstName} ${registrant.legalLastName}`)}<br/>
            <strong>Email:</strong> ${escapeHtml(registrant.email)}<br/>
            <strong>Phone:</strong> ${escapeHtml(registrant.phoneNumber || 'N/A')}
            ${registrant.guardianFirstName
              ? `<br/><strong>Guardian Name:</strong> ${escapeHtml(`${registrant.guardianFirstName} ${registrant.guardianLastName || ''}`.trim())}`
              : ''}
          </p>

          <p><strong>Registered Events:</strong></p>
          <ul>${eventsList}</ul>

          ${qualificationNote}

          <p>
            <strong>Amount Paid:</strong> $${((registrant.amountPaidInCents || 0) / 100).toFixed(2)}<br/>
            <strong>Payment ID:</strong> ${escapeHtml(registrant.paymentId)}<br/>
            <strong>Square Order ID:</strong> ${escapeHtml(registrant.squareOrderId || 'N/A')}
          </p>
        </div>
      `;

      await emailService.sendAlertEmail(env.EMAIL_ACCOUNT, `New Registration - ${registrant.tournamentName}`, emailContent);
    } catch (error) {
      console.error('[RegistrationService] Failed to send registration alert:', error);
    }
  }
}

export const registrationService = new RegistrationService();
