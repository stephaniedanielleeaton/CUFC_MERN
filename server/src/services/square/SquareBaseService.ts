import { SquareClient } from 'square';
import { env } from '../../config/env';

export abstract class SquareBaseService {
  protected readonly client: SquareClient;
  protected readonly locationId: string = env.SQUARE_RETAIL_LOCATION_ID;

  constructor() {
    this.client = new SquareClient({
      token: env.SQUARE_ACCESS_TOKEN,
      environment: env.SQUARE_ENVIRONMENT,
    });
  }

  protected logError(error: unknown): void {
    const summary = error instanceof Error ? error.message : String(error)
    if (summary.includes('CUSTOMER_NOT_FOUND')) return
    console.error(`[${this.constructor.name}] ${summary}`)
  }
}
