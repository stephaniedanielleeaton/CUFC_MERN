import { 
  squarePaymentsService,
  squareOrdersService,
  squareSubscriptionsService,
  squareCatalogService,
  squareInvoicesService,
  SquareOrderDto,
  SquarePaymentDto,
  SquareSubscriptionDto,
  SquareLineItemDto,
  mapOrderToTransaction,
  mapPaymentToTransaction,
} from './square';
import { MemberSquareStatusDto, SubscriptionStatusDto } from '../types/dtos/admin';
import { memberProfileService } from './memberProfileService';
import { attendanceService } from './attendanceService';
import { MemberUpdateData, Transaction, MemberSubscriptionDTO, IntroEnrollmentDTO, AttendanceRecord } from '@cufc/shared';
import { DROP_IN_CATALOG_OBJECT_ID } from '../config/constants';





class AdminService {

  async getAllMembers() {
    return memberProfileService.getAll();
  }

  async updateMember(memberId: string, data: MemberUpdateData) {
    return memberProfileService.update(memberId, data);
  }

  async deleteMember(memberId: string) {
    return memberProfileService.delete(memberId);
  }

  async getMemberAttendance(memberId: string): Promise<AttendanceRecord[]> {
    return attendanceService.getMemberHistory(memberId);
  }

  async getMemberSubscriptionStatus(memberId: string): Promise<SubscriptionStatusDto> {
    const squareCustomerId = await memberProfileService.getSquareCustomerId(memberId);
    
    if (!squareCustomerId) {
      return { hasActiveSubscription: false, reason: 'No Square customer ID' };
    }

    const subscriptions = await squareSubscriptionsService.getByCustomerId(squareCustomerId);
    const hasActiveSubscription = subscriptions.some((sub: SquareSubscriptionDto) => sub.status === 'ACTIVE');
    return { hasActiveSubscription };
  }

  async getAllMembersSquareStatus(): Promise<MemberSquareStatusDto> {
    const membersWithSquare = await memberProfileService.getMembersWithSquareCustomerId();
    const todaysPayments = await squarePaymentsService.getTodaysPayments();
    
    const statusChecks = await Promise.all(
      membersWithSquare.map(async (m) => {
        let hasActiveSubscription = false;
        let hasTodayDropIn = false;
        
        try {
          const subscriptions = await squareSubscriptionsService.getByCustomerId(m.squareCustomerId);
          hasActiveSubscription = subscriptions.some((sub: SquareSubscriptionDto) => sub.status === 'ACTIVE');
        } catch {
          // Continue processing remaining members
        }
        
        try {
          hasTodayDropIn = await this.checkCustomerHasTodayDropIn(m.squareCustomerId, todaysPayments);
        } catch {
          // Continue processing remaining members
        }
        
        return {
          squareCustomerId: m.squareCustomerId,
          hasActiveSubscription,
          hasTodayDropIn,
        };
      })
    );
    
    return {
      activeSubscribers: statusChecks.filter(s => s.hasActiveSubscription).map(s => s.squareCustomerId),
      dropIns: statusChecks.filter(s => s.hasTodayDropIn).map(s => s.squareCustomerId),
    };
  }

  private async checkCustomerHasTodayDropIn(
    customerId: string, 
    todaysPayments: SquarePaymentDto[]
  ): Promise<boolean> {
    const customerPayments = todaysPayments.filter(
      p => p.customerId === customerId && p.status === 'COMPLETED' && p.orderId
    );

    for (const payment of customerPayments) {
      if (!payment.orderId) continue;
      const order = await squareOrdersService.getById(payment.orderId);
      if (order && this.orderContainsDropIn(order)) {
        return true;
      }
    }

    return false;
  }

  private orderContainsDropIn(order: SquareOrderDto): boolean {
    return order.lineItems.some(item => item.catalogObjectId === DROP_IN_CATALOG_OBJECT_ID);
  }

  async getMemberTransactions(memberId: string): Promise<Transaction[]> {
    const squareCustomerId = await memberProfileService.getSquareCustomerId(memberId);
    
    if (!squareCustomerId) {
      return [];
    }

    const orders = await squareOrdersService.getRecentByCustomerId(squareCustomerId, 3);
    
    if (orders.length > 0) {
      return orders.map(mapOrderToTransaction);
    }

    const payments = await squarePaymentsService.getRecentPaymentsPaginated(20);
    const customerPayments = payments.filter(p => p.customerId === squareCustomerId);
    return customerPayments.map(mapPaymentToTransaction);
  }

  async getMemberIntroEnrollment(memberId: string): Promise<IntroEnrollmentDTO | null> {
    const squareCustomerId = await memberProfileService.getSquareCustomerId(memberId);
    
    if (!squareCustomerId) {
      return null;
    }

    const orders = await squareOrdersService.getRecentByCustomerId(squareCustomerId, 3);

    for (const order of orders) {
      const introLineItem = order.lineItems.find((li: SquareLineItemDto) => {
        const name = (li.name ?? '').toLowerCase();
        return name.includes('introduction to historical european martial arts');
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

  async getMemberSubscriptions(memberId: string): Promise<MemberSubscriptionDTO[]> {
    const squareCustomerId = await memberProfileService.getSquareCustomerId(memberId);
    if (!squareCustomerId) {
      return [];
    }

    const subscriptions = await squareSubscriptionsService.getByCustomerId(squareCustomerId);
    const activeSubscriptions = subscriptions.filter((sub: SquareSubscriptionDto) => sub.status === 'ACTIVE');

    const results = await Promise.all(
      activeSubscriptions.map((sub) => this.mapSubscriptionToDTO(sub))
    );

    return results;
  }

  private async mapSubscriptionToDTO(sub: SquareSubscriptionDto): Promise<MemberSubscriptionDTO> {
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
    const planDto = await squareCatalogService.getSubscriptionPlanName(planVariationId);
    return planDto.planName;
  }

  private async fetchInvoiceDetails(invoiceIds: string[] | undefined): Promise<{ priceFormatted: string; lastInvoiceDate: string | null }> {
    const ids = invoiceIds ?? [];
    const mostRecentInvoiceId = ids.at(-1);

    if (!mostRecentInvoiceId) {
      return { priceFormatted: '—', lastInvoiceDate: null };
    }

    const invoiceDetails = await squareInvoicesService.getInvoiceDetails(mostRecentInvoiceId);
    if (!invoiceDetails) {
      return { priceFormatted: '—', lastInvoiceDate: null };
    }

    return {
      priceFormatted: invoiceDetails.priceFormatted,
      lastInvoiceDate: this.formatDate(invoiceDetails.createdAt),
    };
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

export const adminService = new AdminService();
