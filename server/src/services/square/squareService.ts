import { SquareClient, Square, SquareEnvironment } from 'square';
import { env } from '../../config/env';

class SquareService {
  private client: SquareClient;
  private readonly RETAIL_LOCATION_ID = env.SQUARE_RETAIL_LOCATION_ID;

  constructor() {
    this.client = new SquareClient({
      token: env.SQUARE_ACCESS_TOKEN,
      environment: env.SQUARE_ENVIRONMENT,
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


  async getOrdersByMemberProfileId(memberProfileId: string): Promise<Square.Order[]> {
    try {
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

  async getOrderById(orderId: string): Promise<Square.Order | null> {
    try {
      const response = await this.client.orders.get({
        orderId,
      });
      return response.order ?? null;
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
                memberProfileId
              }
            }
          ]
        },
        checkoutOptions: {
          redirectUrl,
        }
      });
      return response.paymentLink?.url ?? '';
    } catch (error) {
      this.logError(error as string);
      throw error;
    }
  }
}

export { SquareService };
export const squareService = new SquareService();
