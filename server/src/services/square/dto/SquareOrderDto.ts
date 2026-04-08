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
  state: string | null;
  totalAmount: number | null;
  currency: string | null;
  createdAt: string | null;
  lineItems: SquareLineItemDto[];
}

export function mapOrderToDto(order: Square.Order): SquareOrderDto {
  return {
    id: order.id ?? '',
    customerId: order.customerId ?? null,
    state: order.state ?? null,
    totalAmount: toAmount(order.totalMoney?.amount),
    currency: order.totalMoney?.currency ?? null,
    createdAt: order.createdAt ?? null,
    lineItems: (order.lineItems ?? []).map(li => mapLineItemToDto(li)),
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
    totalMoney: order.totalAmount != null 
      ? { amount: order.totalAmount, currency: order.currency ?? undefined }
      : undefined,
    lineItems: order.lineItems.map((li): TransactionLineItem => ({
      name: li.name ?? undefined,
      variationName: li.variationName ?? undefined,
      quantity: li.quantity ?? undefined,
      totalMoney: li.amount != null 
        ? { amount: li.amount, currency: li.currency ?? undefined }
        : undefined,
    })),
  };
}

function toAmount(value: bigint | number | null | undefined): number | null {
  if (value === undefined || value === null) return null;
  return Number(value);
}
