import { SquareClient, Square } from 'square';
import { env } from '../../../config/env';

// WebhooksHelper is not properly exported in TypeScript types, use require pattern
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { WebhooksHelper } = require('square');
import { SelectedEventDto } from '../dto';

export interface CreateOrderData {
  tournamentName: string;
  selectedEvents: SelectedEventDto[];
  baseFeeInCents: number;
  paymentId: string;
  m2TournamentId: number;
  registrantId: string;
}

export interface OrderResult {
  orderId: string;
  paymentUrl: string;
}

export interface WebhookOrderMetadata {
  paymentId: string;
  m2TournamentId: number;
  registrantId: string;
}

export class TournamentSquareService {
  private readonly client: SquareClient;
  private readonly locationId: string;

  constructor() {
    this.client = new SquareClient({
      token: env.SQUARE_ACCESS_TOKEN,
      environment: env.SQUARE_ENVIRONMENT,
    });
    this.locationId = env.SQUARE_RETAIL_LOCATION_ID;
  }

  async createOrderWithPaymentLink(data: CreateOrderData): Promise<OrderResult> {
    const lineItems = this.buildLineItems(data);

    const response = await this.client.checkout.paymentLinks.create({
      order: {
        locationId: this.locationId,
        referenceId: data.paymentId,
        lineItems,
        metadata: {
          payment_id: data.paymentId,
          m2_tournament_id: data.m2TournamentId.toString(),
          registrant_id: data.registrantId,
        },
      },
      checkoutOptions: {
        redirectUrl: `${env.APP_BASE_URL}/tournaments/payment-success?paymentId=${data.paymentId}`,
      },
    });

    const orderId = response.relatedResources?.orders?.[0]?.id;
    const paymentUrl = response.paymentLink?.url;

    if (!orderId || !paymentUrl) {
      throw new Error('Failed to create payment link');
    }

    return { orderId, paymentUrl };
  }

  private buildLineItems(data: CreateOrderData): Square.OrderLineItem[] {
    const eventNames = data.selectedEvents.map((e) => e.eventName).join(', ');
    const itemName = `${data.tournamentName} - ${eventNames}`;
    const totalCents = data.baseFeeInCents + data.selectedEvents.reduce((sum, e) => sum + e.priceInCents, 0);

    return [
      {
        name: itemName,
        quantity: '1',
        basePriceMoney: { amount: BigInt(totalCents), currency: 'USD' },
      },
    ];
  }

  verifyWebhookSignature(body: string, signature: string, webhookUrl: string): boolean {
    try {
      // Ensure HTTPS for webhook URL
      const normalizedUrl = webhookUrl.replace('http://', 'https://');

      return WebhooksHelper.isValidWebhookEventSignature(
        body,
        signature,
        env.SQUARE_SIGNATURE_KEY,
        normalizedUrl
      );
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  async getOrderMetadata(orderId: string): Promise<WebhookOrderMetadata | null> {
    try {
      const response = await this.client.orders.get({ orderId });
      const metadata = response.order?.metadata;

      if (!metadata?.payment_id || !metadata?.m2_tournament_id || !metadata?.registrant_id) {
        return null;
      }

      return {
        paymentId: metadata.payment_id,
        m2TournamentId: parseInt(metadata.m2_tournament_id, 10),
        registrantId: metadata.registrant_id,
      };
    } catch (error) {
      console.error('Failed to get order metadata:', error);
      return null;
    }
  }

  async getOrderTotal(orderId: string): Promise<number | null> {
    try {
      const response = await this.client.orders.get({ orderId });
      const amount = response.order?.totalMoney?.amount;
      return amount ? Number(amount) : null;
    } catch (error) {
      console.error('Failed to get order total:', error);
      return null;
    }
  }
}

export const tournamentSquareService = new TournamentSquareService();
