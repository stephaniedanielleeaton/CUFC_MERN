import { SquareClient, Square } from 'square';
import { env } from '../../config/env';
import { getTodayMidnight, getDateMonthsAgo } from '../../utils/dateUtils';
import { SquarePaymentDto, mapPaymentToDto } from './dto';

export class SquarePaymentsService {
  private readonly client: SquareClient;
  private readonly locationId = env.SQUARE_RETAIL_LOCATION_ID;

  constructor() {
    this.client = new SquareClient({
      token: env.SQUARE_ACCESS_TOKEN,
      environment: env.SQUARE_ENVIRONMENT,
    });
  }

  private logError(error: unknown): void {
    console.error('Square Payments API Error:', error);
  }

  async getTodaysPayments(): Promise<SquarePaymentDto[]> {
    try {
      const todayMidnight = getTodayMidnight();
      const response = await this.client.payments.list({
        locationId: this.locationId,
        beginTime: todayMidnight.toISOString(),
        sortOrder: 'DESC',
      });
      
      const payments: Square.Payment[] = (response as { data?: Square.Payment[] }).data ?? [];
      return payments.map(mapPaymentToDto);
    } catch (error) {
      this.logError(error);
      return [];
    }
  }

  async getPaymentsSince(startTime: Date): Promise<SquarePaymentDto[]> {
    try {
      const response = await this.client.payments.list({
        locationId: this.locationId,
        beginTime: startTime.toISOString(),
        sortOrder: 'DESC',
      });
      
      const payments: Square.Payment[] = (response as { data?: Square.Payment[] }).data ?? [];
      return payments.map(mapPaymentToDto);
    } catch (error) {
      this.logError(error);
      return [];
    }
  }

  async getRecentPaymentsPaginated(maxResults: number = 50): Promise<SquarePaymentDto[]> {
    try {
      const threeMonthsAgo = getDateMonthsAgo(3);
      const allPayments: Square.Payment[] = [];
      let cursor: string | undefined;

      do {
        const response = await this.client.payments.list({
          locationId: this.locationId,
          beginTime: threeMonthsAgo.toISOString(),
          sortOrder: 'DESC',
          limit: 100,
          cursor,
        }) as unknown as { payments?: Square.Payment[]; cursor?: string };

        const payments = response.payments ?? [];
        allPayments.push(...payments);
        
        if (allPayments.length >= maxResults) break;
        cursor = response.cursor;
      } while (cursor);

      return allPayments.slice(0, maxResults).map(mapPaymentToDto);
    } catch (error) {
      this.logError(error);
      return [];
    }
  }
}

export const squarePaymentsService = new SquarePaymentsService();
