export interface MemberSquareStatusDto {
  activeSubscribers: string[];
  dropIns: string[];
}

export interface SubscriptionStatusDto {
  hasActiveSubscription: boolean;
  reason?: string;
}

export interface SubscriptionPlanDto {
  planVariationId: string;
  planName: string;
}

export interface InvoiceDetailsDto {
  invoiceId: string;
  priceFormatted: string;
  createdAt: string | null;
  amountCents: number | null;
  currency: string | null;
}
