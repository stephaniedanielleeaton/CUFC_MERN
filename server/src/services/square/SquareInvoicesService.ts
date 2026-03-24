import { SquareClient, Square } from 'square';
import { env } from '../../config/env';
import { InvoiceDetailsDto } from '../../types/dtos/admin';

export class SquareInvoicesService {
  private readonly client: SquareClient;

  constructor() {
    this.client = new SquareClient({
      token: env.SQUARE_ACCESS_TOKEN,
      environment: env.SQUARE_ENVIRONMENT,
    });
  }

  private logError(error: unknown): void {
    console.error('Square Invoices API Error:', error);
  }

  async getById(invoiceId: string): Promise<Square.Invoice | null> {
    try {
      const response = await this.client.invoices.get({ invoiceId });
      return response.invoice ?? null;
    } catch (error) {
      this.logError(error);
      throw error;
    }
  }

  async getInvoiceDetails(invoiceId: string): Promise<InvoiceDetailsDto | null> {
    try {
      const invoice = await this.getById(invoiceId);
      if (!invoice) {
        return null;
      }

      const money = invoice.paymentRequests?.[0]?.computedAmountMoney;
      const amountCents = money?.amount ? Number(money.amount) : null;
      const currency = money?.currency ?? null;
      
      const priceFormatted = this.formatMoney(amountCents, currency);

      return {
        invoiceId,
        priceFormatted,
        createdAt: invoice.createdAt ?? null,
        amountCents,
        currency,
      };
    } catch (error) {
      this.logError(error);
      return null;
    }
  }

  private formatMoney(amountCents: number | null, currency: string | null): string {
    if (amountCents === null || amountCents === undefined) return '—';
    const dollars = amountCents / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency ?? 'USD',
    }).format(dollars);
  }
}

export const squareInvoicesService = new SquareInvoicesService();
