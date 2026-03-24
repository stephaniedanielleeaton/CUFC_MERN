import { squareCatalogService } from './';
import { Square } from 'square';
import { IntroClassDTO, VariationDTO } from '@cufc/shared';
import { INTRO_CLASS_CATALOG_OBJECT_ID } from '../../config/constants';

export class IntroClassOfferingsService {
  async getIntroClassOfferings(): Promise<IntroClassDTO> {
    const catalogObject = await squareCatalogService.getObjectById(INTRO_CLASS_CATALOG_OBJECT_ID);
    if (!catalogObject) throw new Error('Catalog object not found');

    const inventoryCounts: Square.InventoryCount[] =
      await squareCatalogService.getInventoryByCatalogObjectId(INTRO_CLASS_CATALOG_OBJECT_ID);

    return this.mapOfferingsToDTO(catalogObject, inventoryCounts);
  }

  private mapOfferingsToDTO(
    catalogObject: Square.CatalogObject,
    inventoryCounts: Square.InventoryCount[]
  ): IntroClassDTO {
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
