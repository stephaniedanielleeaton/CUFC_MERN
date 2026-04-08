import type { Square } from 'square';

export interface SquareSubscriptionDto {
  id: string;
  customerId: string | null;
  status: string;
  planVariationId: string | null;
  chargedThroughDate: string | null;
  canceledDate: string | null;
  invoiceIds: string[];
}

export function mapSubscriptionToDto(sub: Square.Subscription): SquareSubscriptionDto {
  return {
    id: sub.id ?? '',
    customerId: sub.customerId ?? null,
    status: sub.status ?? '',
    planVariationId: sub.planVariationId ?? null,
    chargedThroughDate: sub.chargedThroughDate ?? null,
    canceledDate: sub.canceledDate ?? null,
    invoiceIds: sub.invoiceIds ?? [],
  };
}
