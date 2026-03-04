import { SquareClient, Square, SquareEnvironment } from 'square';

export class SquareService {
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
    console.error('Square API Error:', error);
  }

  async getCatalogObjectById(catalogObjectId: string): Promise<Square.GetCatalogObjectResponse> {
    try {
      const response = await this.client.catalog.object.get({
        objectId: catalogObjectId,
      });
      return response;
    } catch (error) {
      this.logError(error as string);
      throw error;
    }
  }

  async getInventoryByCatalogObjectId(catalogObjectId: string): Promise<Square.InventoryCount[]> {
    try {
      const response = await this.client.inventory.batchGetCounts({
        catalogObjectIds: [catalogObjectId],
        locationIds: [this.RETAIL_LOCATION_ID]
      });
      
      return response.data;
    } catch (error) {
      this.logError(error as string);
      throw error;
    }
  }

  async getInvoiceById(invoiceId: string): Promise<Square.Invoice | null> {
    try {
      const response = await this.client.invoices.get({ invoiceId });
      return response.invoice ?? null;
    } catch (error) {
      this.logError(error as string);
      throw error;
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
        },
      });
      const customerIds = new Set<string>();
      for (const order of response.orders ?? []) {
        const hasItem = order.lineItems?.some(
          (li) => li.catalogObjectId === catalogObjectId
        );
        if (hasItem && order.customerId) customerIds.add(order.customerId);
      }
      return customerIds;
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

  async getSubscriptionPlanVariation(planVariationId: string): Promise<Square.CatalogObject | null> {
    try {
      const response = await this.client.catalog.object.get({
        objectId: planVariationId,
      });
      return response.object ?? null;
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

  async getOrdersByMemberProfileId(memberProfileId: string): Promise<Square.Order[]> {
    try {
      // Search for orders in the last 6 months to limit results
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const response = await this.client.orders.search({
        locationIds: [this.RETAIL_LOCATION_ID],
        query: {
          filter: {
            dateTimeFilter: {
              createdAt: { startAt: sixMonthsAgo.toISOString() }
            },
            stateFilter: { states: ['COMPLETED'] }
          },
          sort: { sortField: 'CREATED_AT', sortOrder: 'DESC' },
        },
        limit: 100,
      });
      const orders = response.orders ?? [];
      return orders.filter((o) =>
        o.lineItems?.some((li) => li.metadata?.['memberProfileId'] === memberProfileId)
      );
    } catch (error) {
      this.logError(error as string);
      throw error;
    }
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

  async getSingleVariantCheckout(catalogObjectId: string, memberProfileId: string, customerId?: string, redirectUrl?: string): Promise<string> {
    try {
      const response = await this.client.checkout.paymentLinks.create({
        order: {
          locationId: this.RETAIL_LOCATION_ID,
          ...(customerId ? { customerId } : {}),
          lineItems: [
            {
              catalogObjectId,
              quantity: '1',
              metadata: {
                'memberProfileId': memberProfileId
              }
            }
          ]
        },
        checkoutOptions: {
          redirectUrl: redirectUrl,
        }
      });
      return response.paymentLink?.url ?? '';
    } catch (error) {
      this.logError(error as string);
      throw error;
    }
  }
}
