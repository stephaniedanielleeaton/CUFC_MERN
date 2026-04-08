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
} from './';
import type { CatalogObject } from 'square';
import { Transaction, MemberSubscriptionDTO, IntroEnrollmentDTO } from '@cufc/shared';

interface SubscriptionPlanVariationData {
  name?: string;
  phases?: unknown[];
}

export interface SubscriptionStatusDTO {
  hasActiveSubscription: boolean;
  reason?: string;
}

function formatMoney(amount: bigint | number | undefined, currency: string | undefined): string {
  if (amount === undefined || amount === null) return "—";
  const dollars = Number(amount) / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency ?? "USD",
  }).format(dollars);
}

function formatDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export async function checkMemberHasActiveSubscription(squareCustomerId: string): Promise<boolean> {
  const subscriptions = await squareSubscriptionsService.getByCustomerId(squareCustomerId);
  return subscriptions.some((sub: SquareSubscriptionDto) => sub.status === "ACTIVE");
}

export async function getMemberSubscriptionStatus(squareCustomerId: string | null): Promise<SubscriptionStatusDTO> {
  if (!squareCustomerId) {
    return { hasActiveSubscription: false, reason: 'No Square customer ID' };
  }
  const hasActiveSubscription = await checkMemberHasActiveSubscription(squareCustomerId);
  return { hasActiveSubscription };
}

export async function getMemberTransactions(squareCustomerId: string): Promise<Transaction[]> {
  const orders = await squareOrdersService.getByCustomerId(squareCustomerId);
  
  if (orders.length > 0) {
    return orders.slice(0, 20).map(mapOrderToTransaction);
  }

  const payments = await squarePaymentsService.getRecentPaymentsPaginated(50);
  const customerPayments = payments.filter(p => p.customerId === squareCustomerId);
  return customerPayments.slice(0, 20).map(mapPaymentToTransaction);
}

export async function getMemberIntroEnrollment(squareCustomerId: string | null): Promise<IntroEnrollmentDTO | null> {
  if (!squareCustomerId) {
    return null;
  }

  const orders = await squareOrdersService.getRecentByCustomerId(squareCustomerId, 3);

  if (orders.length === 0) {
    return null;
  }

  for (const order of orders) {
    const introLineItem = order.lineItems.find((li: SquareLineItemDto) => {
      const name = (li.name ?? '').toLowerCase();
      return name.includes('introduction to historical european martial arts');
    });

    if (introLineItem) {
      return {
        orderId: order.id,
        itemName: introLineItem.name ?? "Intro Fencing Class",
        variationName: introLineItem.variationName ?? "",
      };
    }
  }

  return null;
}

export async function getMemberSubscriptions(squareCustomerId: string): Promise<MemberSubscriptionDTO[]> {
  const subscriptions = await squareSubscriptionsService.getByCustomerId(squareCustomerId);
  const activeSubscriptions = subscriptions.filter((sub: SquareSubscriptionDto) => sub.status === "ACTIVE");

  const results: MemberSubscriptionDTO[] = [];

  for (const sub of activeSubscriptions) {
    let planName = "Membership";
    let priceFormatted = "—";

    if (sub.planVariationId) {
      try {
        const planVariation = await squareCatalogService.getSubscriptionPlanVariation(sub.planVariationId);
        const catalogObj = planVariation as CatalogObject & { subscriptionPlanVariationData?: SubscriptionPlanVariationData };
        const planData = catalogObj?.subscriptionPlanVariationData;
        if (planData?.name) planName = planData.name;
      } catch (err) {
        console.error("Failed to fetch subscription plan variation:", err);
      }
    }

    const invoiceIds = sub.invoiceIds ?? [];
    const mostRecentInvoiceId = invoiceIds[invoiceIds.length - 1];
    let lastInvoiceDate: string | null = null;
    if (mostRecentInvoiceId) {
      try {
        const invoice = await squareInvoicesService.getById(mostRecentInvoiceId);
        const money = invoice?.paymentRequests?.[0]?.computedAmountMoney;
        priceFormatted = formatMoney(money?.amount ?? undefined, money?.currency ?? undefined);
        if (invoice?.paymentRequests?.[0]?.computedAmountMoney) {
          lastInvoiceDate = formatDate(invoice.createdAt);
        }
      } catch (err) {
        console.error("Failed to fetch subscription invoice:", err);
      }
    }

    results.push({
      id: sub.id,
      planName,
      status: sub.status,
      priceFormatted,
      activeThrough: formatDate(sub.chargedThroughDate) ?? undefined,
      lastInvoiceDate: lastInvoiceDate ?? undefined,
      canceledDate: formatDate(sub.canceledDate) ?? undefined,
    });
  }

  return results;
}
