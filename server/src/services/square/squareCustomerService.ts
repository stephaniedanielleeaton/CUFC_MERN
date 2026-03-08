import { SquareClient, Square, SquareEnvironment } from 'square';

export class SquareCustomerService {
  private client: SquareClient;
  private readonly RETAIL_LOCATION_ID = process.env.SQUARE_RETAIL_LOCATION_ID || '';

  constructor() {
    this.client = new SquareClient({
      token: process.env.SQUARE_ACCESS_TOKEN,
      environment: process.env.NODE_ENV === 'production' 
        ? SquareEnvironment.Production 
        : SquareEnvironment.Sandbox,
    });
  }

  private logError(error: string): void {
    console.error('Square Customer API Error:', error);
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

  async checkCustomerHasTodayDropIn(customerId: string, catalogObjectId: string): Promise<boolean> {
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    try {
      const response = await this.client.orders.search({
        locationIds: [this.RETAIL_LOCATION_ID],
        query: {
          filter: {
            customerFilter: { customerIds: [customerId] },
            dateTimeFilter: {
              createdAt: { startAt: startOfDay.toISOString() },
            },
          },
          sort: { sortField: 'CREATED_AT', sortOrder: 'DESC' },
        },
      });
      for (const order of response.orders ?? []) {
        const hasDropInItem = order.lineItems?.some(
          (li) => li.catalogObjectId === catalogObjectId
        );
        if (hasDropInItem) return true;
      }
      return false;
    } catch (error) {
      this.logError(error as string);
      throw error;
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
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
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
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      const response = await this.client.orders.search({
        locationIds: [this.RETAIL_LOCATION_ID],
        query: {
          filter: {
            customerFilter: { customerIds: [customerId] },
            dateTimeFilter: {
              createdAt: { startAt: threeMonthsAgo.toISOString() }
            }
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
}

export const squareCustomerService = new SquareCustomerService();
