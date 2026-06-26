import { Square } from 'square';
import { getTodayMidnight, getDateMonthsAgo } from '../../utils/dateUtils';
import { SquarePaymentDto, mapPaymentToDto } from './dto';
import { SquareBaseService } from './SquareBaseService';

export class SquarePaymentsService extends SquareBaseService {
  async getById(paymentId: string): Promise<SquarePaymentDto | null> {
    try {
      const response = await this.client.payments.get({ paymentId });
      return response.payment ? mapPaymentToDto(response.payment) : null;
    } catch (error) {
      this.logError(error);
      return null;
    }
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
