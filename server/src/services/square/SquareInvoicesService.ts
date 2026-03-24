import { SquareClient, Square } from 'square';
import { env } from '../../config/env';

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
}

export const squareInvoicesService = new SquareInvoicesService();
