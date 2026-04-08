import type { Square } from 'square';
import { Transaction } from '@cufc/shared';

export interface SquarePaymentDto {
  id: string;
  customerId: string | null;
  orderId: string | null;
  status: string;
  amount: number | null;
  currency: string | null;
  createdAt: string | null;
  buyerEmail: string | null;
}

export function mapPaymentToDto(payment: Square.Payment): SquarePaymentDto {
  return {
    id: payment.id ?? '',
    customerId: payment.customerId ?? null,
    orderId: payment.orderId ?? null,
    status: payment.status ?? '',
    amount: toAmount(payment.totalMoney?.amount),
    currency: payment.totalMoney?.currency ?? null,
    createdAt: payment.createdAt ?? null,
    buyerEmail: payment.buyerEmailAddress ?? null,
  };
}

export function mapPaymentToTransaction(payment: SquarePaymentDto): Transaction {
  return {
    id: payment.id,
    createdAt: payment.createdAt ?? undefined,
    state: payment.status ?? undefined,
    totalMoney: payment.amount != null 
      ? { amount: payment.amount, currency: payment.currency ?? undefined }
      : undefined,
    lineItems: [],
  };
}

function toAmount(value: bigint | number | null | undefined): number | null {
  if (value === undefined || value === null) return null;
  return Number(value);
}
