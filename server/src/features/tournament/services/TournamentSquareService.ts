import { SquareClient, Square } from 'square';
import crypto from 'node:crypto';
import { env } from '../../../config/env';
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
    const items: Square.OrderLineItem[] = [];

    if (data.baseFeeInCents > 0) {
      items.push({
        name: `${data.tournamentName} Registration Fee`,
        quantity: '1',
        basePriceMoney: { amount: BigInt(data.baseFeeInCents), currency: 'USD' },
      });
    }

    for (const event of data.selectedEvents) {
      items.push({
        name: event.eventName,
        quantity: '1',
        basePriceMoney: { amount: BigInt(event.priceInCents), currency: 'USD' },
      });
    }

    return items;
  }

  verifyWebhookSignature(body: string, signature: string): boolean {
    const hmac = crypto.createHmac('sha256', env.SQUARE_SIGNATURE_KEY);
    hmac.update(body);
    const expectedSignature = hmac.digest('base64');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
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
