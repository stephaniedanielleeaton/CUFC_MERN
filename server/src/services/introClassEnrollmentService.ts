import { SquareClient } from 'square';
import { env } from '../config/env';
import { INTRO_CLASS_CATALOG_OBJECT_ID } from '../config/constants';
import { memberProfileDAO } from '../dao/memberProfileDAO';
import { squareCatalogService } from './square';
import { MemberStatus } from '@cufc/shared';

interface IntroClassOrderMetadata {
  memberProfileId: string;
  variationName?: string;
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

  async getOrderMetadata(orderId: string): Promise<IntroClassOrderMetadata | null> {
    try {
      const response = await this.client.orders.get({ orderId });
      const lineItems = response.order?.lineItems;

      if (!lineItems || lineItems.length === 0) {
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

  async isIntroClassOrder(orderId: string): Promise<boolean> {
    try {
      const response = await this.client.orders.get({ orderId });
      const lineItems = response.order?.lineItems;

      if (!lineItems || lineItems.length === 0) {
        return false;
      }

      const introClassVariations = await this.getIntroClassVariationIds();

      return lineItems.some(item => 
        item.catalogObjectId && introClassVariations.has(item.catalogObjectId)
      );
    } catch (error) {
      console.error('[IntroClassEnrollmentService] Failed to check if intro class order:', error);
      return false;
    }
  }

  private async getIntroClassVariationIds(): Promise<Set<string>> {
    if (this.introClassVariationIds) {
      return this.introClassVariationIds;
    }

    try {
      const catalogObject = await squareCatalogService.getObjectById(INTRO_CLASS_CATALOG_OBJECT_ID);
      if (!catalogObject || catalogObject.type !== 'ITEM') {
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

  async updateMemberStatusToEnrolled(memberProfileId: string, variationName?: string): Promise<boolean> {
    try {
      const profile = await memberProfileDAO.findById(memberProfileId);

      if (!profile) {
        console.warn(`[IntroClassEnrollmentService] Profile not found: ${memberProfileId}`);
        return false;
      }

      if (profile.memberStatus === MemberStatus.Full) {
        console.log(`[IntroClassEnrollmentService] Profile ${memberProfileId} is already Full, skipping`);
        return true;
      }

      const updateSet: Record<string, unknown> = {};

      if (profile.memberStatus !== MemberStatus.Enrolled) {
        updateSet.memberStatus = MemberStatus.Enrolled;
      }

      if (variationName) {
        const existingNotes = profile.notes || '';
        const noteLine = `Intro class enrollment: ${variationName}`;
        updateSet.notes = existingNotes ? `${existingNotes}\n${noteLine}` : noteLine;
      }

      if (Object.keys(updateSet).length > 0) {
        await memberProfileDAO.updateById(memberProfileId, updateSet);
      }

      console.log(`[IntroClassEnrollmentService] Updated profile ${memberProfileId} to Enrolled`);
      return true;
    } catch (error) {
      console.error('[IntroClassEnrollmentService] Failed to update member status:', error);
      return false;
    }
  }

  async handlePaymentCompleted(orderId: string): Promise<void> {
    const isIntroClass = await this.isIntroClassOrder(orderId);
    if (!isIntroClass) {
      console.log(`[IntroClassEnrollmentService] Order ${orderId} is not an intro class order`);
      return;
    }

    const metadata = await this.getOrderMetadata(orderId);
    if (!metadata) {
      console.warn(`[IntroClassEnrollmentService] No metadata found for order ${orderId}`);
      return;
    }

    await this.updateMemberStatusToEnrolled(metadata.memberProfileId, metadata.variationName);
  }
}

export const introClassEnrollmentService = new IntroClassEnrollmentService();
