import { SquareService } from './squareService';
import { Square } from 'square';
import { IntroClassDTO, VariationDTO } from '@cufc/shared';
import { INTRO_CLASS_CATALOG_OBJECT_ID } from '../../config/constants';

export class IntroClassOfferingsService {
  private squareService: SquareService;

  constructor() {
    this.squareService = new SquareService();
  }

  async getIntroClassOfferings(): Promise<IntroClassDTO> {
    const catalogResponse: Square.GetCatalogObjectResponse =
      await this.squareService.getCatalogObjectById(INTRO_CLASS_CATALOG_OBJECT_ID);

    const inventoryCounts: Square.InventoryCount[] =
      await this.squareService.getInventoryByCatalogObjectId(INTRO_CLASS_CATALOG_OBJECT_ID);

    return this.mapOfferingsToDTO(catalogResponse, inventoryCounts);
  }

  private mapOfferingsToDTO(
    catalogResponse: Square.GetCatalogObjectResponse,
    inventoryCounts: Square.InventoryCount[]
  ): IntroClassDTO {
    const catalogObject = catalogResponse.object;
    if (!catalogObject) throw new Error('Square response missing catalog object');
    if (!this.isCatalogItem(catalogObject)) {
      throw new Error(`Expected ITEM, but got ${catalogObject.type}`);
    }

    const itemData = catalogObject.itemData ?? {};
    const allVariations = itemData.variations ?? [];
    const itemVariations = allVariations.filter(this.isItemVariation);

    const simplifiedVariations = this.mapSimplifiedVariations(
      itemVariations,
      inventoryCounts
    );

    return {
      id: catalogObject.id,
      name: itemData.name ?? '',
      description: itemData.descriptionPlaintext ?? itemData.description ?? '',
      variations: simplifiedVariations,
    };
  }

  private mapSimplifiedVariations(
    squareVariations: Square.CatalogObject.ItemVariation[],
    inventoryCounts: Square.InventoryCount[]
  ): VariationDTO[] {
    const quantityByVariationId = this.buildQuantityLookup(inventoryCounts);
    const variations: VariationDTO[] = [];

    for (const variation of squareVariations) {
      const data = variation.itemVariationData ?? {};

      const simplified: VariationDTO = {
        id: variation.id,
        name: data.name ?? '',
        quantity: quantityByVariationId[variation.id] ?? '0',
      };

      variations.push(simplified);
    }

    return variations;
  }

  private buildQuantityLookup(counts: Square.InventoryCount[]): Record<string, string> {
    const lookup: Record<string, string> = {};
    if (!counts) return lookup;

    for (const c of counts) {
      const variationId = c.catalogObjectId ?? undefined;
      if (!variationId) continue;
      lookup[variationId] = c.quantity ?? '0';
    }

    return lookup;
  }

  private isCatalogItem(obj: Square.CatalogObject): obj is Square.CatalogObject.Item {
    return obj.type === 'ITEM';
  }

  private isItemVariation(
    obj: Square.CatalogObject
  ): obj is Square.CatalogObject.ItemVariation {
    return obj.type === 'ITEM_VARIATION';
  }
}
