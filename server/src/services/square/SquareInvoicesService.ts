import { Square } from 'square';
import { InvoiceDetailsDto } from '../../types/dtos/admin';
import { formatMoneyCents } from '../../utils/formatUtils';
import { SquareBaseService } from './SquareBaseService';

export class SquareInvoicesService extends SquareBaseService {
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

      return {
        invoiceId,
        priceFormatted: formatMoneyCents(money?.amount, money?.currency),
        createdAt: invoice.createdAt ?? null,
        amountCents,
        currency,
      };
    } catch (error) {
      this.logError(error);
      return null;
    }
  }

}

export const squareInvoicesService = new SquareInvoicesService();
