import { SquareClient } from 'square';
import { env } from '../../config/env';
import { MONTHLY_SUBSCRIPTION_CHECKOUT_URL } from '../../config/constants';

export class SquareCheckoutService {
  private readonly client: SquareClient;
  private readonly locationId = env.SQUARE_RETAIL_LOCATION_ID;

  constructor() {
    this.client = new SquareClient({
      token: env.SQUARE_ACCESS_TOKEN,
      environment: env.SQUARE_ENVIRONMENT,
    });
  }

  private logError(error: unknown): void {
    console.error('Square Checkout API Error:', error);
  }

  async createPaymentLink(
    catalogObjectId: string, 
    memberProfileId: string, 
    customerId?: string, 
    redirectUrl?: string
  ): Promise<string> {
    try {
      const response = await this.client.checkout.paymentLinks.create({
        order: {
          locationId: this.locationId,
          ...(customerId ? { customerId } : {}),
          lineItems: [
            {
              catalogObjectId,
              quantity: '1',
              metadata: {
                memberProfileId
              }
            }
          ]
        },
        checkoutOptions: {
          redirectUrl,
        }
      });
      return response.paymentLink?.url ?? '';
    } catch (error) {
      this.logError(error);
      throw error;
    }
  }

  getSubscriptionCheckoutUrl(): string {
    return MONTHLY_SUBSCRIPTION_CHECKOUT_URL;
  }
}

export const squareCheckoutService = new SquareCheckoutService();
