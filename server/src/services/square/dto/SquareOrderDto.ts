import type { Square } from 'square';
import { Transaction, TransactionLineItem } from '@cufc/shared';

export interface SquareLineItemDto {
  catalogObjectId: string | null;
  name: string | null;
  variationName: string | null;
  quantity: string | null;
  amount: number | null;
  currency: string | null;
}

export interface SquareOrderDto {
  id: string;
  customerId: string | null;
  paymentId: string | null;
  state: string | null;
  totalAmount: number | null;
  refundedAmount: number | null;
  currency: string | null;
  createdAt: string | null;
  lineItems: SquareLineItemDto[];
}

export function mapOrderToDto(order: Square.Order): SquareOrderDto {
  return {
    id: order.id ?? '',
    customerId: order.customerId ?? null,
    paymentId: order.tenders?.[0]?.paymentId ?? null,
    state: order.state ?? null,
    totalAmount: toAmount(order.totalMoney?.amount),
    refundedAmount: null,
    currency: order.totalMoney?.currency ?? null,
    createdAt: order.createdAt ?? null,
    lineItems: (order.lineItems ?? []).map(mapLineItemToDto),
  };
}

export function mapLineItemToDto(li: Square.OrderLineItem): SquareLineItemDto {
  return {
    catalogObjectId: li.catalogObjectId ?? null,
    name: li.name ?? null,
    variationName: li.variationName ?? null,
    quantity: li.quantity ?? null,
    amount: toAmount(li.totalMoney?.amount),
    currency: li.totalMoney?.currency ?? null,
  };
}

export function mapOrderToTransaction(order: SquareOrderDto): Transaction {
  return {
    id: order.id,
    createdAt: order.createdAt ?? undefined,
    state: order.state ?? undefined,
    totalMoney: order.totalAmount == null
      ? undefined
      : { amount: order.totalAmount, currency: order.currency ?? undefined },
    refundedMoney: order.refundedAmount == null
      ? undefined
      : { amount: order.refundedAmount, currency: order.currency ?? undefined },
    lineItems: order.lineItems.map((li): TransactionLineItem => ({
      name: li.name ?? undefined,
      variationName: li.variationName ?? undefined,
      quantity: li.quantity ?? undefined,
      totalMoney: li.amount == null
        ? undefined
        : { amount: li.amount, currency: li.currency ?? undefined },
    })),
  };
}

export function applyRefundsToOrders(orders: SquareOrderDto[], refundMap: Map<string, number>): void {
  for (const order of orders) {
    if (order.paymentId) {
      const refunded = refundMap.get(order.paymentId);
      if (refunded) order.refundedAmount = refunded;
    }
  }
}

function toAmount(value: bigint | number | null | undefined): number | null {
  if (value === undefined || value === null) return null;
  return Number(value);
}
