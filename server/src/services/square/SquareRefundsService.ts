import { getDateMonthsAgo } from '../../utils/dateUtils';
import { SquareBaseService } from './SquareBaseService';

export class SquareRefundsService extends SquareBaseService {
  async getCompletedByPaymentId(months: number = 12): Promise<Map<string, number>> {
    const refundsByPaymentId = new Map<string, number>();
    try {
      const beginTime = getDateMonthsAgo(months);
      const page = await this.client.refunds.list({
        locationId: this.locationId,
        beginTime: beginTime.toISOString(),
        status: 'COMPLETED',
      });
      for await (const refund of page) {
        if (refund.paymentId && refund.amountMoney?.amount) {
          const existing = refundsByPaymentId.get(refund.paymentId) ?? 0;
          refundsByPaymentId.set(refund.paymentId, existing + Number(refund.amountMoney.amount));
        }
      }
    } catch (error) {
      this.logError(error);
    }
    return refundsByPaymentId;
  }
}

export const squareRefundsService = new SquareRefundsService();
