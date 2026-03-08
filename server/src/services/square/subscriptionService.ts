import { SquareService } from './squareService';
import { SquareCustomerService } from './squareCustomerService';
import type { CatalogObject, Order } from 'square';
import { Transaction, TransactionLineItem } from '@cufc/shared';
import { DROP_IN_CATALOG_OBJECT_ID } from '../../config/constants';
import { IntroClassOfferingsService } from './introClassOfferingsService';
import type { VariationDTO } from '@cufc/shared';

interface SubscriptionPlanVariationData {
  name?: string;
  phases?: unknown[];
}

interface MemberSubscriptionDTO {
  id: string;
  planName: string;
  status: string;
  priceFormatted: string;
  activeThrough: string | null;
}

export interface SubscriptionStatusDTO {
  hasActiveSubscription: boolean;
  reason?: string;
}

export interface AllMembersSquareStatusDTO {
  activeSubscribers: string[];
  dropIns: string[];
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
  const squareCustomerService = new SquareCustomerService();
  const subscriptions = await squareCustomerService.getCustomerSubscriptions(squareCustomerId);
  return subscriptions.some((sub) => sub.status === "ACTIVE");
}

export async function getMemberSubscriptionStatus(squareCustomerId: string | null): Promise<SubscriptionStatusDTO> {
  if (!squareCustomerId) {
    return { hasActiveSubscription: false, reason: 'No Square customer ID' };
  }
  const hasActiveSubscription = await checkMemberHasActiveSubscription(squareCustomerId);
  return { hasActiveSubscription };
}

export async function getAllMembersSquareStatus(
  membersWithSquare: { memberId: string; squareCustomerId: string }[]
): Promise<AllMembersSquareStatusDTO> {
  const squareCustomerService = new SquareCustomerService();
  
  const statusChecks = await Promise.all(
    membersWithSquare.map(async (m) => {
      let hasActiveSubscription = false;
      let hasTodayDropIn = false;
      
      try {
        const subscriptions = await squareCustomerService.getCustomerSubscriptions(m.squareCustomerId);
        hasActiveSubscription = subscriptions.some((sub) => sub.status === "ACTIVE");
      } catch {
        // Skip errors (e.g., invalid customer ID) to continue processing remaining members
      }
      
      try {
        hasTodayDropIn = await squareCustomerService.checkCustomerHasTodayDropIn(
          m.squareCustomerId,
          DROP_IN_CATALOG_OBJECT_ID
        );
      } catch {
        // Skip errors to continue processing remaining members
      }
      
      return {
        squareCustomerId: m.squareCustomerId,
        hasActiveSubscription,
        hasTodayDropIn,
      };
    })
  );
  
  const activeSubscribers = statusChecks
    .filter((s) => s.hasActiveSubscription)
    .map((s) => s.squareCustomerId);
  
  const dropIns = statusChecks
    .filter((s) => s.hasTodayDropIn)
    .map((s) => s.squareCustomerId);
  
  return {
    activeSubscribers,
    dropIns,
  };
}

export async function getMemberTransactions(squareCustomerId: string): Promise<Transaction[]> {
  const squareCustomerService = new SquareCustomerService();
  const orders: Order[] = await squareCustomerService.getOrdersByCustomerId(squareCustomerId);
  
  return orders.slice(0, 20).map((order: Order): Transaction => {
    const orderMoney = order.totalMoney?.amount != null 
      ? { amount: Number(order.totalMoney.amount), currency: order.totalMoney.currency }
      : undefined;
    
    return {
      id: order.id,
      createdAt: order.createdAt,
      state: order.state,
      totalMoney: orderMoney,
      lineItems: (order.lineItems || []).map((li): TransactionLineItem => {
        const liMoney = li.totalMoney?.amount != null
          ? { amount: Number(li.totalMoney.amount), currency: li.totalMoney.currency }
          : undefined;
        return {
          name: li.name ?? undefined,
          variationName: li.variationName ?? undefined,
          quantity: li.quantity ?? undefined,
          totalMoney: liMoney,
        };
      }),
    };
  });
}

export interface IntroEnrollmentDTO {
  orderId: string;
  itemName: string;
  variationName: string;
}

export async function getMemberIntroEnrollment(squareCustomerId: string | null): Promise<IntroEnrollmentDTO | null> {
  if (!squareCustomerId) {
    return null;
  }

  const squareCustomerService = new SquareCustomerService();
  const orders = await squareCustomerService.getOrdersByCustomerId(squareCustomerId);

  if (orders.length === 0) {
    return null;
  }

  for (const order of orders) {
    const introLineItem = order.lineItems?.find((li) => {
      const name = (li.name ?? '').toLowerCase();
      return name.includes('introduction to historical european martial arts');
    });

    if (introLineItem) {
      return {
        orderId: order.id ?? "",
        itemName: introLineItem.name ?? "Intro Fencing Class",
        variationName: introLineItem.variationName ?? "",
      };
    }
  }

  return null;
}

export async function getMemberSubscriptions(squareCustomerId: string): Promise<MemberSubscriptionDTO[]> {
  const squareCustomerService = new SquareCustomerService();
  const subscriptions = await squareCustomerService.getCustomerSubscriptions(squareCustomerId);

  const activeSubscriptions = subscriptions.filter(
    (sub) => sub.status === "ACTIVE" || sub.status === "PAUSED"
  );

  const results: MemberSubscriptionDTO[] = [];

  for (const sub of activeSubscriptions) {
    let planName = "Membership";
    let priceFormatted = "—";

    if (sub.planVariationId) {
      try {
        const squareService = new SquareService();
        const planVariation = await squareService.getSubscriptionPlanVariation(sub.planVariationId);
        const catalogObj = planVariation as CatalogObject & { subscriptionPlanVariationData?: SubscriptionPlanVariationData };
        const planData = catalogObj?.subscriptionPlanVariationData;
        if (planData?.name) planName = planData.name;
      } catch (err) {
        console.error("Failed to fetch subscription plan variation:", err);
      }
    }

    const invoiceIds = sub.invoiceIds ?? [];
    const mostRecentInvoiceId = invoiceIds[invoiceIds.length - 1];
    if (mostRecentInvoiceId) {
      try {
        const squareService = new SquareService();
        const invoice = await squareService.getInvoiceById(mostRecentInvoiceId);
        const money = invoice?.paymentRequests?.[0]?.computedAmountMoney;
        priceFormatted = formatMoney(money?.amount ?? undefined, money?.currency ?? undefined);
      } catch (err) {
        console.error("Failed to fetch subscription invoice:", err);
      }
    }

    results.push({
      id: sub.id ?? "",
      planName,
      status: sub.status ?? "ACTIVE",
      priceFormatted,
      activeThrough: formatDate(sub.chargedThroughDate),
    });
  }

  return results;
}
