import { memberProfileService } from './memberProfileService';
import type { GuestProfileInput } from '@cufc/shared';
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
      profileComplete?: boolean;
    }
  ): Promise<MemberProfileDTO> {
    return memberProfileService.create(auth0Id, data);
  }

  async updateProfile(memberId: string, data: MemberUpdateData): Promise<MemberProfileDTO | null> {
    return memberProfileService.update(memberId, data);
  }

  async createGuestProfile(data: GuestProfileInput): Promise<MemberProfileDTO> {
    return memberProfileService.createGuest(data);
  }

  async getSubscriptions(auth0Id: string): Promise<MemberSubscriptionDTO[]> {
    const profile = await memberProfileService.getByAuth0Id(auth0Id);
    if (!profile?.squareCustomerId) {
      return [];
    }

    const subscriptions = await squareSubscriptionsService.getByCustomerId(profile.squareCustomerId);
    const activeSubscriptions = subscriptions.filter((sub: SquareSubscriptionDto) => sub.status === 'ACTIVE');

    return Promise.all(activeSubscriptions.map((sub) => this.buildSubscriptionDTO(sub)));
  }

  private async buildSubscriptionDTO(sub: SquareSubscriptionDto): Promise<MemberSubscriptionDTO> {
    const planName = await this.fetchPlanName(sub.planVariationId);
    const { priceFormatted, lastInvoiceDate } = await this.fetchInvoiceDetails(sub.invoiceIds);

    return {
      id: sub.id,
      planName,
      status: sub.status,
      priceFormatted,
      activeThrough: this.formatDate(sub.chargedThroughDate) ?? undefined,
      lastInvoiceDate: lastInvoiceDate ?? undefined,
      canceledDate: this.formatDate(sub.canceledDate) ?? undefined,
    };
  }

  private async fetchPlanName(planVariationId: string | null | undefined): Promise<string> {
    if (!planVariationId) {
      return 'Membership';
    }

    try {
      const planVariation = await squareCatalogService.getSubscriptionPlanVariation(planVariationId);
      const catalogObj = planVariation as CatalogObject & { subscriptionPlanVariationData?: SubscriptionPlanVariationData };
      return catalogObj?.subscriptionPlanVariationData?.name ?? 'Membership';
    } catch (err) {
      console.error('Failed to fetch subscription plan variation:', err);
      return 'Membership';
    }
  }

  private async fetchInvoiceDetails(invoiceIds: string[] | undefined): Promise<{
    priceFormatted: string;
    lastInvoiceDate: string | null;
  }> {
    const mostRecentInvoiceId = invoiceIds?.[invoiceIds.length - 1];
    if (!mostRecentInvoiceId) {
      return { priceFormatted: '—', lastInvoiceDate: null };
    }

    try {
      const invoice = await squareInvoicesService.getById(mostRecentInvoiceId);
      const money = invoice?.paymentRequests?.[0]?.computedAmountMoney;
      const priceFormatted = this.formatMoney(money?.amount ?? undefined, money?.currency ?? undefined);
      const lastInvoiceDate = money ? this.formatDate(invoice?.createdAt) : null;

      return { priceFormatted, lastInvoiceDate };
    } catch (err) {
      console.error('Failed to fetch subscription invoice:', err);
      return { priceFormatted: '—', lastInvoiceDate: null };
    }
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
