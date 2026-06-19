import { MONTHLY_SUBSCRIPTION_CHECKOUT_URL } from '../../config/constants';
import { SquareBaseService } from './SquareBaseService';

export class SquareCheckoutService extends SquareBaseService {
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
