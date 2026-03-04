export type CurrencyCode = 'USD' | string;

export interface VariationDTO {
  id: string;
  name: string;
  quantity?: string;
}

export interface IntroClassDTO {
  id: string;
  name: string;
  description: string;
  variations?: VariationDTO[];
}
