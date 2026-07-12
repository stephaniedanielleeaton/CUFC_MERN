/**
 * Direct Square API client for E2E test fixtures.
 * This bypasses the server and talks directly to Square's sandbox API.
 */

interface SquareConfig {
  accessToken: string
  environment: 'sandbox' | 'production'
  locationId: string
}

interface CatalogItemVariation {
  id: string
  name: string
  priceCents: number
}

interface UpsertItemRequest {
  idempotencyKey: string
  name: string
  description?: string
  variations: CatalogItemVariation[]
}

interface UpsertItemResponse {
  catalogObjectId: string
  variationIds: string[]
}

interface InventoryAdjustment {
  catalogObjectId: string
  quantity: number
}

export class SquareTestClient {
  private readonly baseUrl: string
  private readonly headers: Record<string, string>
  private readonly locationId: string

  constructor(config: SquareConfig) {
    this.baseUrl = config.environment === 'sandbox'
      ? 'https://connect.squareupsandbox.com/v2'
      : 'https://connect.squareup.com/v2'
    
    this.headers = {
      'Authorization': `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
      'Square-Version': '2024-01-18',
    }
    
    this.locationId = config.locationId
  }

  /**
   * Create or update a catalog item with variations.
   * Uses client-generated IDs prefixed with # for new items.
   */
  async upsertCatalogItem(request: UpsertItemRequest): Promise<UpsertItemResponse> {
    const variations = request.variations.map((v, index) => ({
      type: 'ITEM_VARIATION',
      id: v.id,
      itemVariationData: {
        name: v.name,
        pricingType: 'FIXED_PRICING',
        priceMoney: {
          amount: v.priceCents,
          currency: 'USD',
        },
        trackInventory: true,
        ordinal: index,
      },
    }))

    const body = {
      idempotencyKey: request.idempotencyKey,
      object: {
        type: 'ITEM',
        id: `#${request.idempotencyKey}`,
        presentAtAllLocations: true,
        itemData: {
          name: request.name,
          description: request.description,
          productType: 'REGULAR',
          variations,
        },
      },
    }

    const response = await fetch(`${this.baseUrl}/catalog/object`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Square upsert failed: ${JSON.stringify(error)}`)
    }

    const data = await response.json() as {
      catalogObject: {
        id: string
        itemData: { variations: { id: string }[] }
      }
    }
    const catalogObject = data.catalogObject

    return {
      catalogObjectId: catalogObject.id,
      variationIds: catalogObject.itemData.variations.map(v => v.id),
    }
  }

  /**
   * Set inventory count for a catalog item variation.
   * This uses PHYSICAL_COUNT to set an absolute value.
   * See: https://developer.squareup.com/reference/square/inventory-api/batch-change-inventory
   */
  async setInventoryCount(adjustments: InventoryAdjustment[]): Promise<void> {
    const occurred_at = new Date().toISOString()
    
    const changes = adjustments.map((adj) => ({
      type: 'PHYSICAL_COUNT',
      physical_count: {
        catalog_object_id: adj.catalogObjectId,
        state: 'IN_STOCK',
        location_id: this.locationId,
        quantity: String(adj.quantity),
        occurred_at,
      },
    }))

    const body = {
      idempotency_key: `inv-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      changes,
      ignore_unchanged_counts: true,
    }

    const response = await fetch(`${this.baseUrl}/inventory/changes/batch-create`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Square inventory update failed: ${JSON.stringify(error)}`)
    }
  }

  /**
   * Get existing variations from a catalog item.
   * Returns the first variation that is NOT a test variation (doesn't start with "E2E Test").
   */
  async getExistingVariation(itemId: string): Promise<{ id: string; name: string } | null> {
    const response = await fetch(`${this.baseUrl}/catalog/object/${itemId}`, {
      method: 'GET',
      headers: this.headers,
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json() as {
      object?: {
        item_data?: {
          variations?: { id: string; item_variation_data?: { name: string } }[]
        }
      }
    }

    const variations = data.object?.item_data?.variations ?? []
    // Find a non-test variation (one that doesn't start with "E2E Test")
    const existingVariation = variations.find(
      v => v.item_variation_data?.name && !v.item_variation_data.name.startsWith('E2E Test')
    )

    if (!existingVariation) {
      return null
    }

    return {
      id: existingVariation.id,
      name: existingVariation.item_variation_data?.name ?? '',
    }
  }

  /**
   * Add variations to an existing catalog item.
   * First retrieves the item, then upserts with the new variations added.
   */
  async addVariationsToItem(
    itemId: string,
    variations: { name: string; priceCents: number }[]
  ): Promise<{ variationIds: string[] }> {
    // First, get the current item to get its version
    const getResponse = await fetch(`${this.baseUrl}/catalog/object/${itemId}`, {
      method: 'GET',
      headers: this.headers,
    })

    if (!getResponse.ok) {
      const error = await getResponse.json()
      throw new Error(`Failed to get catalog item: ${JSON.stringify(error)}`)
    }

    // We just need to verify the item exists

    // Create new variations with temporary IDs (REST API uses snake_case)
    const newVariations = variations.map((v, index) => ({
      type: 'ITEM_VARIATION',
      id: `#e2e-var-${Date.now()}-${index}`,
      present_at_all_locations: true,
      item_variation_data: {
        item_id: itemId,
        name: v.name,
        pricing_type: 'FIXED_PRICING',
        price_money: {
          amount: v.priceCents,
          currency: 'USD',
        },
        track_inventory: true,
      },
    }))

    // Batch upsert just the new variations
    const body = {
      idempotency_key: `add-var-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      batches: [{
        objects: newVariations,
      }],
    }

    const response = await fetch(`${this.baseUrl}/catalog/batch-upsert`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to add variations: ${JSON.stringify(error)}`)
    }

    const data = await response.json() as {
      objects?: { id: string; type: string }[]
      id_mappings?: { client_object_id: string; object_id: string }[]
    }

    // Get the real IDs from the id mappings (REST API uses snake_case)
    const variationIds = (data.id_mappings ?? [])
      .filter(m => m.client_object_id.startsWith('#e2e-var-'))
      .map(m => m.object_id)

    return { variationIds }
  }

  /**
   * Delete a catalog object by ID.
   */
  async deleteCatalogObject(objectId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/catalog/object/${objectId}`, {
      method: 'DELETE',
      headers: this.headers,
    })

    if (!response.ok && response.status !== 404) {
      const error = await response.json()
      throw new Error(`Square delete failed: ${JSON.stringify(error)}`)
    }
  }

  /**
   * Search for catalog objects by type and name prefix.
   * Useful for finding and cleaning up test items/variations.
   */
  async searchCatalogObjects(
    objectTypes: string[],
    namePrefix: string
  ): Promise<{ id: string; type: string; name: string }[]> {
    const body = {
      object_types: objectTypes,
      query: {
        prefix_query: {
          attribute_name: 'name',
          attribute_prefix: namePrefix,
        },
      },
    }

    const response = await fetch(`${this.baseUrl}/catalog/search`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      return []
    }

    const data = await response.json() as {
      objects?: {
        id: string
        type: string
        item_variation_data?: { name: string }
        item_data?: { name: string }
      }[]
    }

    return (data.objects ?? []).map(obj => ({
      id: obj.id,
      type: obj.type,
      name: obj.item_variation_data?.name ?? obj.item_data?.name ?? '',
    }))
  }

  /**
   * Clean up all test variations (those with "E2E Test" prefix).
   */
  async cleanupTestVariations(): Promise<number> {
    const testObjects = await this.searchCatalogObjects(
      ['ITEM_VARIATION'],
      'E2E Test'
    )

    let deleted = 0
    for (const obj of testObjects) {
      try {
        await this.deleteCatalogObject(obj.id)
        console.log(`[SquareTestClient] Deleted stale test variation: ${obj.name} (${obj.id})`)
        deleted++
      } catch (error) {
        console.warn(`[SquareTestClient] Failed to delete ${obj.id}:`, error)
      }
    }

    return deleted
  }
}
