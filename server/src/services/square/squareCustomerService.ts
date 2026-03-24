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

  async checkCustomerHasTodayDropIn(customerId: string, catalogObjectId: string): Promise<boolean> {
    // Use local midnight (not UTC) to match the user's timezone
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    console.log(`[DropIn Check] Checking customer ${customerId} for drop-in item ${catalogObjectId}`);
    console.log(`[DropIn Check] Start of day (local): ${startOfDay.toISOString()}`);

    // Use Payments API - it correctly links customer_id even when Orders API doesn't
    try {
      const response = await this.client.payments.list({
        locationId: this.RETAIL_LOCATION_ID,
        beginTime: startOfDay.toISOString(),
        sortOrder: 'DESC',
      });
      
      // The SDK returns a paginated response - extract payments from data array
      const payments: Square.Payment[] = (response as { data?: Square.Payment[] }).data ?? [];
      
      console.log(`[DropIn Check] Found ${payments.length} payments since ${startOfDay.toISOString()}`);

      for (const payment of payments) {
        console.log(`[DropIn Check] Payment ${payment.id}: customerId=${payment.customerId}, status=${payment.status}, orderId=${payment.orderId}`);
        
        // Check if this payment belongs to the customer and is completed
        if (payment.customerId !== customerId || payment.status !== 'COMPLETED') {
          console.log(`[DropIn Check] Skipping - customer mismatch or not completed`);
          continue;
        }

        console.log(`[DropIn Check] Found matching payment for customer!`);

        // Get the order to check if it contains the drop-in item
        if (payment.orderId) {
          try {
            const orderResponse = await this.client.orders.get({
              orderId: payment.orderId,
            });
            const lineItems = orderResponse.order?.lineItems ?? [];
            console.log(`[DropIn Check] Order ${payment.orderId} has ${lineItems.length} line items:`);
            lineItems.forEach(li => {
              console.log(`[DropIn Check]   - catalogObjectId: ${li.catalogObjectId}, name: ${li.name}`);
            });
            
            const hasDropInItem = lineItems.some(
              (li) => li.catalogObjectId === catalogObjectId
            );
            console.log(`[DropIn Check] Has drop-in item: ${hasDropInItem}`);
            if (hasDropInItem) return true;
          } catch (err) {
            console.log(`[DropIn Check] Order lookup failed:`, err);
          }
        }
      }
    } catch (error) {
      console.log(`[DropIn Check] Error:`, error);
      this.logError(error as string);
    }

    console.log(`[DropIn Check] No drop-in found for customer ${customerId}`);
    return false;
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
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      // Get customer email for matching payments that don't have customer_id linked
      const customer = await this.getCustomerById(customerId);
      const customerEmail = customer?.emailAddress?.toLowerCase();

      const allPayments: Square.Payment[] = [];
      let cursor: string | undefined;

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
          // Match by customer_id
          if (payment.customerId === customerId) {
            allPayments.push(payment);
          } 
          // Match by email in buyer_email_address
          else if (customerEmail && payment.buyerEmailAddress?.toLowerCase() === customerEmail) {
            allPayments.push(payment);
          }
          
          if (allPayments.length >= 50) break;
        }

        cursor = response.cursor;
      } while (cursor && allPayments.length < 50);

      return allPayments;
    } catch (error) {
      this.logError(error as string);
      return [];
    }
  }
}

export const squareCustomerService = new SquareCustomerService();
