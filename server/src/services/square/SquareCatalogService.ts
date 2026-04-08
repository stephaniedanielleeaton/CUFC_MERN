import { SquareClient, Square } from 'square';
import { env } from '../../config/env';
import { SubscriptionPlanDto } from '../../types/dtos/admin';
import { SubscriptionPlanVariationData } from '../../types/interfaces/square/square';

export class SquareCatalogService {
  private readonly client: SquareClient;
  private readonly locationId = env.SQUARE_RETAIL_LOCATION_ID;

  constructor() {
    this.client = new SquareClient({
      token: env.SQUARE_ACCESS_TOKEN,
      environment: env.SQUARE_ENVIRONMENT,
    });
  }

  private logError(error: unknown): void {
    console.error('Square Catalog API Error:', error);
  }

  async getObjectById(catalogObjectId: string): Promise<Square.CatalogObject | null> {
    try {
      const response = await this.client.catalog.object.get({
        objectId: catalogObjectId,
      });
      return response.object ?? null;
    } catch (error) {
      this.logError(error);
      throw error;
    }
  }

  async getSubscriptionPlanVariation(planVariationId: string): Promise<Square.CatalogObject | null> {
    return this.getObjectById(planVariationId);
  }

  async getSubscriptionPlanName(planVariationId: string): Promise<SubscriptionPlanDto> {
    try {
      const catalogObject = await this.getObjectById(planVariationId);
      const catalogObj = catalogObject as Square.CatalogObject & { subscriptionPlanVariationData?: SubscriptionPlanVariationData };
      const planName = catalogObj?.subscriptionPlanVariationData?.name ?? 'Membership';
      
      return {
        planVariationId,
        planName,
      };
    } catch (error) {
      this.logError(error);
      return {
        planVariationId,
        planName: 'Membership',
      };
    }
  }

  async getInventoryByCatalogObjectId(catalogObjectId: string): Promise<Square.InventoryCount[]> {
    try {
      const response = await this.client.inventory.batchGetCounts({
        catalogObjectIds: [catalogObjectId],
        locationIds: [this.locationId]
      });
      return response.data;
    } catch (error) {
      this.logError(error);
      throw error;
    }
  }
}

export const squareCatalogService = new SquareCatalogService();
