import { SquareClient } from 'square';
import { env } from '../../config/env';
import { SquareSubscriptionDto, mapSubscriptionToDto } from './dto';

export class SquareSubscriptionsService {
  private readonly client: SquareClient;

  constructor() {
    this.client = new SquareClient({
      token: env.SQUARE_ACCESS_TOKEN,
      environment: env.SQUARE_ENVIRONMENT,
    });
  }

  private logError(error: unknown): void {
    console.error('Square Subscriptions API Error:', error);
  }

  async getByCustomerId(customerId: string): Promise<SquareSubscriptionDto[]> {
    try {
      const response = await this.client.subscriptions.search({
        query: {
          filter: {
            customerIds: [customerId],
          },
        },
      });
      return (response.subscriptions ?? []).map(mapSubscriptionToDto);
    } catch (error) {
      this.logError(error);
      throw error;
    }
  }

  async getActiveForCustomers(customerIds: string[]): Promise<SquareSubscriptionDto[]> {
    if (customerIds.length === 0) return [];
    try {
      const response = await this.client.subscriptions.search({
        query: {
          filter: {
            customerIds,
          },
        },
      });
      return (response.subscriptions ?? [])
        .filter(sub => sub.status === 'ACTIVE')
        .map(mapSubscriptionToDto);
    } catch (error) {
      this.logError(error);
      throw error;
    }
  }
}

export const squareSubscriptionsService = new SquareSubscriptionsService();
