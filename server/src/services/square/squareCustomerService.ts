import { SquareClient, Square, SquareEnvironment } from 'square';
import { env } from '../../config/env';

export class SquareCustomerService {
  private readonly client: SquareClient;
  private readonly RETAIL_LOCATION_ID = env.SQUARE_RETAIL_LOCATION_ID;

  constructor() {
    this.client = new SquareClient({
      token: env.SQUARE_ACCESS_TOKEN,
      environment: env.SQUARE_ENVIRONMENT,
    });
  }

  private logError(error: string): void {
    console.error('Square Customer API Error:', error);
  }

  async getCustomerById(customerId: string): Promise<Square.Customer | null> {
    try {
      const response = await this.client.customers.get({ customerId });
      return response.customer ?? null;
    } catch (error) {
      this.logError(error as string);
      return null;
    }
  }

  async getTodayDropInCustomerIds(catalogObjectId: string): Promise<Set<string>> {
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    try {
      const response = await this.client.orders.search({
        locationIds: [this.RETAIL_LOCATION_ID],
        query: {
          filter: {
            dateTimeFilter: {
              createdAt: { startAt: startOfDay.toISOString() },
            },
          },
          sort: { sortField: 'CREATED_AT', sortOrder: 'DESC' },
        },
      });
      const customerIds = new Set<string>();
      for (const order of response.orders ?? []) {
        const hasDropInItem = order.lineItems?.some(
          (li) => li.catalogObjectId === catalogObjectId
        );
        if (hasDropInItem && order.customerId) {
          customerIds.add(order.customerId);
        }
      }
      return customerIds;
    } catch (error) {
      this.logError(error as string);
      throw error;
    }
  }

  async checkCustomerHasTodayDropIn(customerId: string, dropInCatalogId: string): Promise<boolean> {
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    try {
      const response = await this.client.payments.list({
        locationId: this.RETAIL_LOCATION_ID,
        beginTime: todayMidnight.toISOString(),
        sortOrder: 'DESC',
      });
      
      const todaysPayments: Square.Payment[] = (response as { data?: Square.Payment[] }).data ?? [];
      const customerPayments = todaysPayments.filter(
        p => p.customerId === customerId && p.status === 'COMPLETED' && p.orderId
      );

      for (const payment of customerPayments) {
        const orderContainsDropIn = await this.orderContainsCatalogItem(payment.orderId!, dropInCatalogId);
        if (orderContainsDropIn) return true;
      }
    } catch (error) {
      this.logError(error as string);
    }

    return false;
  }

  private async orderContainsCatalogItem(orderId: string, catalogItemId: string): Promise<boolean> {
    try {
      const orderResponse = await this.client.orders.get({ orderId });
      const lineItems = orderResponse.order?.lineItems ?? [];
      return lineItems.some(item => item.catalogObjectId === catalogItemId);
    } catch {
      return false;
    }
  }

  async getActiveSubscriptionsForCustomers(customerIds: string[]): Promise<Set<string>> {
    if (customerIds.length === 0) return new Set();
    try {
      const response = await this.client.subscriptions.search({
        query: {
          filter: {
            customerIds,
          },
        },
      });
      const active = new Set<string>();
      for (const sub of response.subscriptions ?? []) {
        if (sub.status === 'ACTIVE' && sub.customerId) {
          active.add(sub.customerId);
        }
      }
      return active;
    } catch (error) {
      this.logError(error as string);
      throw error;
    }
  }

  async getRecentOrdersForCustomer(customerId: string): Promise<Square.Order[]> {
    const threeMonthsAgo = this.getDateMonthsAgo(3);
    try {
      const response = await this.client.orders.search({
        locationIds: [this.RETAIL_LOCATION_ID],
        query: {
          filter: {
            customerFilter: { customerIds: [customerId] },
            dateTimeFilter: {
              createdAt: { startAt: threeMonthsAgo.toISOString() },
            },
          },
          sort: { sortField: 'CREATED_AT', sortOrder: 'DESC' },
        },
      });
      return response.orders ?? [];
    } catch (error) {
      this.logError(error as string);
      throw error;
    }
  }

  async getCustomerSubscriptions(customerId: string): Promise<Square.Subscription[]> {
    try {
      const response = await this.client.subscriptions.search({
        query: {
          filter: {
            customerIds: [customerId],
          },
        },
      });
      return response.subscriptions ?? [];
    } catch (error) {
      this.logError(error as string);
      throw error;
    }
  }

  async searchCustomersByEmail(email: string): Promise<Square.Customer[]> {
    try {
      const response = await this.client.customers.search({
        query: {
          filter: {
            emailAddress: { exact: email },
          },
        },
      });
      return response.customers ?? [];
    } catch (error) {
      this.logError(error as string);
      throw error;
    }
  }

  async getCustomerByEmail(email: string): Promise<Square.Customer | null> {
    try {
      const response = await this.client.customers.search({
        query: {
          filter: {
            emailAddress: {
              exact: email,
            },
          },
        },
      });
      return response.customers?.[0] ?? null;
    } catch (error) {
      this.logError(error as string);
      return null;
    }
  }

  async createCustomer(params: {
    email: string;
    givenName?: string;
    familyName?: string;
    referenceId?: string;
  }): Promise<Square.Customer | null> {
    try {
      const response = await this.client.customers.create({
        emailAddress: params.email,
        givenName: params.givenName,
        familyName: params.familyName,
        referenceId: params.referenceId,
      });
      return response.customer ?? null;
    } catch (error) {
      this.logError(error as string);
      throw error;
    }
  }

  async getOrCreateCustomer(params: {
    email: string;
    givenName?: string;
    familyName?: string;
    referenceId?: string;
  }): Promise<Square.Customer | null> {
    const existingCustomer = await this.getCustomerByEmail(params.email);
    if (existingCustomer) {
      return existingCustomer;
    }
    return this.createCustomer(params);
  }

  async getOrdersByCustomerId(customerId: string): Promise<Square.Order[]> {
    try {
      const threeMonthsAgo = this.getDateMonthsAgo(3);
      const response = await this.client.orders.search({
        locationIds: [this.RETAIL_LOCATION_ID],
        query: {
          filter: {
            customerFilter: { customerIds: [customerId] },
            dateTimeFilter: {
              createdAt: { startAt: threeMonthsAgo.toISOString() }
            },
            stateFilter: { states: ['COMPLETED'] }
          },
          sort: { sortField: 'CREATED_AT', sortOrder: 'DESC' },
        },
      });
      return response.orders ?? [];
    } catch (error) {
      this.logError(error as string);
      throw error;
    }
  }

  async getAllOrdersByCustomerId(customerId: string): Promise<Square.Order[]> {
    try {
      const response = await this.client.orders.search({
        locationIds: [this.RETAIL_LOCATION_ID],
        query: {
          filter: {
            customerFilter: { customerIds: [customerId] },
            stateFilter: { states: ['COMPLETED'] }
          },
          sort: { sortField: 'CREATED_AT', sortOrder: 'DESC' },
        },
      });
      return response.orders ?? [];
    } catch (error) {
      this.logError(error as string);
      throw error;
    }
  }

  async getPaymentsByCustomerId(customerId: string): Promise<Square.Payment[]> {
    try {
      const threeMonthsAgo = this.getDateMonthsAgo(3);
      const customer = await this.getCustomerById(customerId);
      const customerEmail = customer?.emailAddress?.toLowerCase();

      const matchingPayments: Square.Payment[] = [];
      let cursor: string | undefined;
      const maxResults = 50;

      do {
        const response = await this.client.payments.list({
          locationId: this.RETAIL_LOCATION_ID,
          beginTime: threeMonthsAgo.toISOString(),
          sortOrder: 'DESC',
          limit: 100,
          cursor,
        }) as unknown as { payments?: Square.Payment[]; cursor?: string };

        const payments = response.payments ?? [];
        for (const payment of payments) {
          const matchesById = payment.customerId === customerId;
          const matchesByEmail = customerEmail && payment.buyerEmailAddress?.toLowerCase() === customerEmail;
          
          if (matchesById || matchesByEmail) {
            matchingPayments.push(payment);
          }
          
          if (matchingPayments.length >= maxResults) break;
        }

        cursor = response.cursor;
      } while (cursor && matchingPayments.length < maxResults);

      return matchingPayments;
    } catch (error) {
      this.logError(error as string);
      return [];
    }
  }

  private getDateMonthsAgo(months: number): Date {
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    return date;
  }
}

export const squareCustomerService = new SquareCustomerService();
