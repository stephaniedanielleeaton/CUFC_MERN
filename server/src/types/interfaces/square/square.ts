export interface SubscriptionPhase {
  ordinal: number;
  cadence: 'DAILY' | 'WEEKLY' | 'EVERY_TWO_WEEKS' | 'THIRTY_DAYS' | 'SIXTY_DAYS' | 'NINETY_DAYS' | 'MONTHLY' | 'EVERY_TWO_MONTHS' | 'QUARTERLY' | 'EVERY_FOUR_MONTHS' | 'EVERY_SIX_MONTHS' | 'ANNUAL';
  periods?: number;
  pricing?: {
    type: 'STATIC' | 'RELATIVE';
    priceMoney?: {
      amount: bigint;
      currency: string;
    };
    discountIds?: string[];
  };
}

export interface SubscriptionPlanVariationData {
  name?: string;
  phases?: SubscriptionPhase[];
}