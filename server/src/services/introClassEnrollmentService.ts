import { SquareClient } from 'square';
import { env } from '../config/env';
import { INTRO_CLASS_CATALOG_OBJECT_ID } from '../config/constants';
import { memberProfileDAO } from '../dao/memberProfileDAO';
import { squareCatalogService } from './square';
import { MemberStatus } from '@cufc/shared';
import { emailService } from './emailService';

interface IntroClassOrderMetadata {
  memberProfileId: string;
  variationName?: string;
}

interface EnrollmentResult {
  success: boolean;
  statusUpdated: boolean;
  error?: string;
}

type MemberProfile = Exclude<Awaited<ReturnType<typeof memberProfileDAO.findById>>, null>;

interface UpdateResult {
  profile: MemberProfile;
  statusUpdated: boolean;
}

export class IntroClassEnrollmentService {
  private readonly client: SquareClient;
  private introClassVariationIds: Set<string> | null = null;

  constructor() {
    this.client = new SquareClient({
      token: env.SQUARE_ACCESS_TOKEN,
      environment: env.SQUARE_ENVIRONMENT,
    });
  }

  private async getIntroClassOrderMetadata(orderId: string): Promise<IntroClassOrderMetadata | null> {
    try {
      const response = await this.client.orders.get({ orderId });
      const lineItems = response.order?.lineItems;

      if (!lineItems || lineItems.length === 0) {
        return null;
      }

      const introClassVariations = await this.getIntroClassVariationIds();
      const isIntroClass = lineItems.some(item => 
        item.catalogObjectId && introClassVariations.has(item.catalogObjectId)
      );

      if (!isIntroClass) {
        return null;
      }

      const memberProfileId = lineItems[0]?.metadata?.memberProfileId;
      if (!memberProfileId) {
        return null;
      }

      const variationName = lineItems[0]?.variationName || lineItems[0]?.name || undefined;

      return { memberProfileId, variationName };
    } catch (error) {
      console.error('[IntroClassEnrollmentService] Failed to get order metadata:', error);
      return null;
    }
  }

  private async getIntroClassVariationIds(): Promise<Set<string>> {
    if (this.introClassVariationIds) {
      return this.introClassVariationIds;
    }

    try {
      const catalogObject = await squareCatalogService.getObjectById(INTRO_CLASS_CATALOG_OBJECT_ID);
      if (catalogObject?.type !== 'ITEM') {
        return new Set();
      }

      const variations = catalogObject.itemData?.variations ?? [];
      this.introClassVariationIds = new Set(
        variations.map(v => v.id).filter((id): id is string => !!id)
      );
      return this.introClassVariationIds;
    } catch (error) {
      console.error('[IntroClassEnrollmentService] Failed to get intro class variations:', error);
      return new Set();
    }
  }

  private appendNote(existing: string | undefined, newNote: string): string {
    return existing ? `${existing}\n${newNote}` : newNote;
  }

  private async updateMemberStatusToEnrolled(
    memberProfileId: string,
    variationName?: string,
    squareCustomerId?: string
  ): Promise<UpdateResult | null> {
    try {
      const profile = await memberProfileDAO.findById(memberProfileId);

      if (!profile) {
        console.warn(`[IntroClassEnrollmentService] Profile not found: ${memberProfileId}`);
        return null;
      }

      const isNew = profile.memberStatus === MemberStatus.New;
      const enrollmentNote = variationName ? `Intro class enrollment: ${variationName}` : null;
      const needsSquareCustomerId = squareCustomerId && !profile.squareCustomerId;

      const updateSet: Record<string, unknown> = {};

      if (isNew) {
        updateSet.memberStatus = MemberStatus.Enrolled;
      }
      if (enrollmentNote) {
        updateSet.notes = this.appendNote(profile.notes, enrollmentNote);
      }
      if (needsSquareCustomerId) {
        updateSet.squareCustomerId = squareCustomerId;
        console.log(`[IntroClassEnrollmentService] Setting squareCustomerId ${squareCustomerId} for profile ${memberProfileId}`);
      }

      if (Object.keys(updateSet).length > 0) {
        await memberProfileDAO.updateById(memberProfileId, updateSet);
      }

      return { profile, statusUpdated: isNew };
    } catch (error) {
      console.error('[IntroClassEnrollmentService] Failed to update member status:', error);
      return null;
    }
  }

  async handlePaymentCompleted(orderId: string, squareCustomerId?: string): Promise<EnrollmentResult> {
    const metadata = await this.getIntroClassOrderMetadata(orderId);
    if (!metadata) {
      console.log(`[IntroClassEnrollmentService] Order ${orderId} is not an intro class order or missing metadata`);
      return { success: true, statusUpdated: false };
    }

    const result = await this.updateMemberStatusToEnrolled(
      metadata.memberProfileId,
      metadata.variationName,
      squareCustomerId
    );
    if (!result) {
      return { success: false, statusUpdated: false, error: 'Failed to update member status' };
    }

    if (result.statusUpdated) {
      await this.sendEnrollmentAlert(result.profile, metadata.variationName, orderId, metadata.memberProfileId);
    } else {
      console.log(`[IntroClassEnrollmentService] Skipping alert for order ${orderId} - member not new`);
    }

    return { success: true, statusUpdated: result.statusUpdated };
  }

  private async sendEnrollmentAlert(
    profile: MemberProfile,
    variationName: string | undefined,
    orderId: string,
    memberProfileId: string
  ): Promise<void> {
    if (!env.EMAIL_ACCOUNT) {
      console.warn('[IntroClassEnrollmentService] No EMAIL_ACCOUNT configured, skipping alert');
      return;
    }

    try {
      const emailContent = this.buildEnrollmentEmailContent(profile, variationName, orderId, memberProfileId);
      await emailService.sendAlertEmail(env.EMAIL_ACCOUNT, 'New Registration - Intro Class', emailContent);
    } catch (error) {
      console.error('[IntroClassEnrollmentService] Failed to send enrollment alert:', error);
    }
  }

  private buildEnrollmentEmailContent(
    profile: MemberProfile,
    variationName: string | undefined,
    orderId: string,
    memberProfileId: string
  ): string {
    return `
<h2>New Intro Class Registration</h2>

<h3>Member Information:</h3>
<ul>
  <li><strong>Preferred Name:</strong> ${profile.displayFirstName} ${profile.displayLastName}</li>
  <li><strong>Legal Name:</strong> ${profile.personalInfo?.legalFirstName || 'N/A'} ${profile.personalInfo?.legalLastName || 'N/A'}</li>
  <li><strong>Email:</strong> <a href="mailto:${profile.personalInfo?.email || ''}">${profile.personalInfo?.email || 'N/A'}</a></li>
  <li><strong>Phone:</strong> ${profile.personalInfo?.phone || 'N/A'}</li>
</ul>

<h3>Class Details:</h3>
<ul>
  <li><strong>Class:</strong> ${variationName || 'Intro Class'}</li>
  <li><strong>Square Order ID:</strong> ${orderId}</li>
  <li><strong>Member Profile ID:</strong> ${memberProfileId}</li>
  <li><strong>Status Updated To:</strong> Enrolled</li>
</ul>
    `.trim();
  }
}

export const introClassEnrollmentService = new IntroClassEnrollmentService();
