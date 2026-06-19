import { Square } from 'square';
import { SubscriptionPlanDto } from '../../types/dtos/admin';
import { SubscriptionPlanVariationData } from '../../types/interfaces/square/square';
import { SquareBaseService } from './SquareBaseService';

export class SquareCatalogService extends SquareBaseService {
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
