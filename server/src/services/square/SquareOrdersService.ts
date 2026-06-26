import { Square } from 'square';
import { getDateMonthsAgo, getTodayMidnight } from '../../utils/dateUtils';
import { SquareOrderDto, mapOrderToDto } from './dto';
import { SquareBaseService } from './SquareBaseService';

// Orders with payments can be COMPLETED (fulfilled) or OPEN (paid but not yet fulfilled)
const PAID_ORDER_STATES: Square.OrderState[] = ['COMPLETED', 'OPEN'];


function filterOrdersWithTender(orders: Square.Order[]): Square.Order[] {
  return orders.filter(order => order.tenders && order.tenders.length > 0);
}

export class SquareOrdersService extends SquareBaseService {
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
            stateFilter: { states: PAID_ORDER_STATES }
          },
          sort: { sortField: 'CREATED_AT', sortOrder: 'DESC' },
        },
      });
      return filterOrdersWithTender(response.orders ?? []).map(mapOrderToDto);
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
            stateFilter: { states: PAID_ORDER_STATES }
          },
          sort: { sortField: 'CREATED_AT', sortOrder: 'DESC' },
        },
      });
      return filterOrdersWithTender(response.orders ?? []).map(mapOrderToDto);
    } catch (error) {
      this.logError(error);
      throw error;
    }
  }
}

export const squareOrdersService = new SquareOrdersService();
