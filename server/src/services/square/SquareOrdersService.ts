import { SquareClient } from 'square';
import { env } from '../../config/env';
import { getDateMonthsAgo, getTodayMidnight } from '../../utils/dateUtils';
import { SquareOrderDto, mapOrderToDto } from './dto';

export class SquareOrdersService {
  private readonly client: SquareClient;
  private readonly locationId = env.SQUARE_RETAIL_LOCATION_ID;

  constructor() {
    this.client = new SquareClient({
      token: env.SQUARE_ACCESS_TOKEN,
      environment: env.SQUARE_ENVIRONMENT,
    });
  }

  private logError(error: unknown): void {
    console.error('Square Orders API Error:', error);
  }

  async getById(orderId: string): Promise<SquareOrderDto | null> {
    try {
      const response = await this.client.orders.get({ orderId });
      return response.order ? mapOrderToDto(response.order) : null;
    } catch (error) {
      this.logError(error);
      return null;
    }
  }

  async getTodaysOrders(): Promise<SquareOrderDto[]> {
    try {
      const todayMidnight = getTodayMidnight();
      const response = await this.client.orders.search({
        locationIds: [this.locationId],
        query: {
          filter: {
            dateTimeFilter: {
              createdAt: { startAt: todayMidnight.toISOString() },
            },
          },
          sort: { sortField: 'CREATED_AT', sortOrder: 'DESC' },
        },
      });
      return (response.orders ?? []).map(mapOrderToDto);
    } catch (error) {
      this.logError(error);
      return [];
    }
  }

  async getByCustomerId(customerId: string): Promise<SquareOrderDto[]> {
    try {
      const response = await this.client.orders.search({
        locationIds: [this.locationId],
        query: {
          filter: {
            customerFilter: { customerIds: [customerId] },
            stateFilter: { states: ['COMPLETED'] }
          },
          sort: { sortField: 'CREATED_AT', sortOrder: 'DESC' },
        },
      });
      return (response.orders ?? []).map(mapOrderToDto);
    } catch (error) {
      this.logError(error);
      throw error;
    }
  }

  async getRecentByCustomerId(customerId: string, months: number = 3): Promise<SquareOrderDto[]> {
    try {
      const startDate = getDateMonthsAgo(months);
      const response = await this.client.orders.search({
        locationIds: [this.locationId],
        query: {
          filter: {
            customerFilter: { customerIds: [customerId] },
            dateTimeFilter: {
              createdAt: { startAt: startDate.toISOString() }
            },
            stateFilter: { states: ['COMPLETED'] }
          },
          sort: { sortField: 'CREATED_AT', sortOrder: 'DESC' },
        },
      });
      return (response.orders ?? []).map(mapOrderToDto);
    } catch (error) {
      this.logError(error);
      throw error;
    }
  }
}

export const squareOrdersService = new SquareOrdersService();
