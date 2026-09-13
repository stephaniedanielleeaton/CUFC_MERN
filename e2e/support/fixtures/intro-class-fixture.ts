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
        name: `E2E Test - ${variations[index].name}`,
        spots: variations[index].spots,
      })),
    }
  }

  async addEnrollmentVariation(spots: number): Promise<CreatedIntroClass> {
    return this.addVariations([{ name: 'Enrollment', spots }])
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
    const failedVariationIds: string[] = []
    for (const id of this.createdVariationIds) {
      try {
        await this.client.deleteCatalogObject(id)
        console.log(`[IntroClassFixture] Deleted test variation: ${id}`)
      } catch (error) {
        failedVariationIds.push(id)
      }
    }
    this.createdVariationIds.length = 0

    if (failedVariationIds.length > 0) {
      throw new Error(`Failed to delete test variations: ${failedVariationIds.join(', ')}`)
    }
  }
}
