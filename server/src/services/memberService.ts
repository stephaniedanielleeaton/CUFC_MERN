import { memberProfileService } from './memberProfileService';
import { attendanceService } from './attendanceService';
import { INTRO_CLASS_CATALOG_OBJECT_ID } from '../config/constants';
import { 
  squareSubscriptionsService,
  squareOrdersService,
  squarePaymentsService,
  squareCatalogService,
  squareInvoicesService,
  SquareSubscriptionDto,
  SquareLineItemDto,
  mapOrderToTransaction,
  mapPaymentToTransaction,
} from './square';
import { 
  MemberProfileDTO, 
  MemberUpdateData, 
  Transaction, 
  MemberSubscriptionDTO, 
  IntroEnrollmentDTO, 
  AttendanceRecord 
} from '@cufc/shared';
import type { CatalogObject } from 'square';

interface SubscriptionPlanVariationData {
  name?: string;
  phases?: unknown[];
}

class MemberService {
  async getProfileByAuth0Id(auth0Id: string): Promise<MemberProfileDTO | null> {
    return memberProfileService.getByAuth0Id(auth0Id);
  }

  async findAndLinkByEmail(auth0Id: string, email: string): Promise<MemberProfileDTO | null> {
    return memberProfileService.findAndLinkByEmail(auth0Id, email);
  }

  async createProfile(
    auth0Id: string,
    data?: {
      displayFirstName?: string;
      displayLastName?: string;
      personalInfo?: { email?: string };
      guardian?: { firstName?: string; lastName?: string };
    }
  ): Promise<MemberProfileDTO> {
    return memberProfileService.create(auth0Id, data);
  }

  async updateProfile(memberId: string, data: MemberUpdateData): Promise<MemberProfileDTO | null> {
    return memberProfileService.update(memberId, data);
  }

  async getSubscriptions(auth0Id: string): Promise<MemberSubscriptionDTO[]> {
    const profile = await memberProfileService.getByAuth0Id(auth0Id);
    if (!profile?.squareCustomerId) {
      return [];
    }

    const subscriptions = await squareSubscriptionsService.getByCustomerId(profile.squareCustomerId);
    const activeSubscriptions = subscriptions.filter((sub: SquareSubscriptionDto) => sub.status === 'ACTIVE');

    const results: MemberSubscriptionDTO[] = [];

    for (const sub of activeSubscriptions) {
      let planName = 'Membership';
      let priceFormatted = '—';

      if (sub.planVariationId) {
        try {
          const planVariation = await squareCatalogService.getSubscriptionPlanVariation(sub.planVariationId);
          const catalogObj = planVariation as CatalogObject & { subscriptionPlanVariationData?: SubscriptionPlanVariationData };
          const planData = catalogObj?.subscriptionPlanVariationData;
          if (planData?.name) planName = planData.name;
        } catch (err) {
          console.error('Failed to fetch subscription plan variation:', err);
        }
      }

      const invoiceIds = sub.invoiceIds ?? [];
      const mostRecentInvoiceId = invoiceIds[invoiceIds.length - 1];
      let lastInvoiceDate: string | null = null;

      if (mostRecentInvoiceId) {
        try {
          const invoice = await squareInvoicesService.getById(mostRecentInvoiceId);
          const money = invoice?.paymentRequests?.[0]?.computedAmountMoney;
          priceFormatted = this.formatMoney(money?.amount ?? undefined, money?.currency ?? undefined);
          if (invoice?.paymentRequests?.[0]?.computedAmountMoney) {
            lastInvoiceDate = this.formatDate(invoice.createdAt);
          }
        } catch (err) {
          console.error('Failed to fetch subscription invoice:', err);
        }
      }

      results.push({
        id: sub.id,
        planName,
        status: sub.status,
        priceFormatted,
        activeThrough: this.formatDate(sub.chargedThroughDate) ?? undefined,
        lastInvoiceDate: lastInvoiceDate ?? undefined,
        canceledDate: this.formatDate(sub.canceledDate) ?? undefined,
      });
    }

    return results;
  }

  async getIntroEnrollment(auth0Id: string): Promise<IntroEnrollmentDTO | null> {
    const profile = await memberProfileService.getByAuth0Id(auth0Id);
    if (!profile?.squareCustomerId) {
      return null;
    }

    // Get intro class variations to match against order line items
    const introClassItem = await squareCatalogService.getObjectById(INTRO_CLASS_CATALOG_OBJECT_ID);
    if (introClassItem?.type !== 'ITEM' || !introClassItem.itemData?.variations) {
      return null;
    }

    const variationIds = new Set(
      introClassItem.itemData.variations.map((v) => v.id)
    );

    const orders = await squareOrdersService.getRecentByCustomerId(profile.squareCustomerId, 3);

    for (const order of orders) {
      const introLineItem = order.lineItems.find((li: SquareLineItemDto) => {
        return li.catalogObjectId && variationIds.has(li.catalogObjectId);
      });

      if (introLineItem) {
        return {
          orderId: order.id,
          itemName: introLineItem.name ?? 'Intro Fencing Class',
          variationName: introLineItem.variationName ?? '',
        };
      }
    }

    return null;
  }

  async getTransactions(auth0Id: string): Promise<Transaction[]> {
    const profile = await memberProfileService.getByAuth0Id(auth0Id);
    if (!profile?.squareCustomerId) {
      return [];
    }

    const orders = await squareOrdersService.getByCustomerId(profile.squareCustomerId);

    if (orders.length > 0) {
      return orders.slice(0, 20).map(mapOrderToTransaction);
    }

    const payments = await squarePaymentsService.getRecentPaymentsPaginated(50);
    const customerPayments = payments.filter(p => p.customerId === profile.squareCustomerId);
    return customerPayments.slice(0, 20).map(mapPaymentToTransaction);
  }

  async getAttendanceHistory(auth0Id: string): Promise<AttendanceRecord[]> {
    const profile = await memberProfileService.getByAuth0Id(auth0Id);
    if (!profile?._id) {
      return [];
    }

    return attendanceService.getMemberHistory(profile._id.toString());
  }

  async getLastCheckIn(memberProfileId: string) {
    return attendanceService.getLastCheckIn(memberProfileId);
  }

  private formatMoney(amount: bigint | number | undefined, currency: string | undefined): string {
    if (amount === undefined || amount === null) return '—';
    const dollars = Number(amount) / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency ?? 'USD',
    }).format(dollars);
  }

  private formatDate(dateStr: string | null | undefined): string | null {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}

export const memberService = new MemberService();
