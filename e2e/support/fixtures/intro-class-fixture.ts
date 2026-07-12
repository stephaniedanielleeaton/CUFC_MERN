/**
 * High-level fixture for managing intro class test data.
 * 
 * Works with the EXISTING intro class catalog item by:
 * 1. Adding test variations to it
 * 2. Setting inventory on those variations
 * 3. Cleaning up by deleting only the test variations
 */

import { SquareTestClient } from './square-client'

export interface IntroClassVariation {
  name: string
  spots: number
  priceCents?: number
}

export interface CreatedVariation {
  id: string
  name: string
  spots: number
}

export interface CreatedIntroClass {
  catalogObjectId: string
  variations: CreatedVariation[]
}

export class IntroClassFixture {
  private readonly client: SquareTestClient
  private readonly introClassCatalogId: string
  private readonly createdVariationIds: string[] = []

  constructor(client: SquareTestClient, introClassCatalogId: string) {
    this.client = client
    this.introClassCatalogId = introClassCatalogId
  }

  /**
   * Add test variations to the existing intro class catalog item.
   * Each variation name is prefixed with "E2E Test - " for identification.
   */
  async addVariations(variations: IntroClassVariation[]): Promise<CreatedIntroClass> {
    const result = await this.client.addVariationsToItem(
      this.introClassCatalogId,
      variations.map(v => ({
        name: `E2E Test - ${v.name}`,
        priceCents: v.priceCents ?? 5000,
      }))
    )

    // Validate we got the expected number of variation IDs
    if (result.variationIds.length !== variations.length) {
      throw new Error(
        `Expected ${variations.length} variation IDs from Square, got ${result.variationIds.length}`
      )
    }

    // Track created variation IDs for cleanup
    this.createdVariationIds.push(...result.variationIds)

    // Set inventory for each variation
    const inventoryAdjustments = result.variationIds.map((variationId, index) => ({
      catalogObjectId: variationId,
      quantity: variations[index].spots,
    }))

    await this.client.setInventoryCount(inventoryAdjustments)

    return {
      catalogObjectId: this.introClassCatalogId,
      variations: result.variationIds.map((id, index) => ({
        id,
        name: variations[index].name,
        spots: variations[index].spots,
      })),
    }
  }

  /**
   * Use an existing (non-test) variation for enrollment tests.
   * This is needed because the server caches variation IDs, so newly created
   * test variations won't be recognized by the webhook as intro class orders.
   */
  async useExistingVariation(spots: number): Promise<CreatedIntroClass> {
    const existing = await this.client.getExistingVariation(this.introClassCatalogId)
    if (!existing) {
      throw new Error('No existing intro class variation found to use for enrollment test')
    }

    // Set inventory on the existing variation
    await this.client.setInventoryCount([
      { catalogObjectId: existing.id, quantity: spots },
    ])

    console.log(`[IntroClassFixture] Using existing variation: ${existing.name} (${existing.id}) with ${spots} spots`)

    return {
      catalogObjectId: this.introClassCatalogId,
      variations: [{
        id: existing.id,
        name: existing.name,
        spots,
      }],
    }
  }

  /**
   * Update inventory count for a specific variation.
   */
  async setSpots(variationId: string, spots: number): Promise<void> {
    await this.client.setInventoryCount([
      { catalogObjectId: variationId, quantity: spots },
    ])
  }

  /**
   * Clean up test variations created during this test run.
   * Only deletes variations we created, not the original catalog item.
   */
  async cleanup(): Promise<void> {
    for (const id of this.createdVariationIds) {
      try {
        await this.client.deleteCatalogObject(id)
        console.log(`[IntroClassFixture] Deleted test variation: ${id}`)
      } catch (error) {
        console.warn(`[IntroClassFixture] Failed to delete variation ${id}:`, error)
      }
    }
    this.createdVariationIds.length = 0
  }
}
