import { Router, Request, Response } from 'express';
import { registrationService, tournamentSquareService } from '../services';

const router = Router();

interface SquareWebhookRequest extends Request {
  rawBody?: string;
  body: SquareWebhookEvent;
}

interface SquareWebhookEvent {
  type: string;
  data?: {
    object?: {
      payment?: {
        status: string;
        order_id?: string;
      };
    };
  };
}

interface WebhookResponse {
  received?: boolean;
  error?: string;
}

/**
 * POST /api/tournaments/webhooks/square
 * Handle Square payment webhooks
 */
router.post('/square', async (req: SquareWebhookRequest, res: Response<WebhookResponse>) => {
  try {
    const signature = req.headers['x-square-signature'] as string;
    const rawBody = req.rawBody;

    if (!rawBody || !tournamentSquareService.verifyWebhookSignature(rawBody, signature)) {
      console.warn('Invalid Square webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;

    if (event.type !== 'payment.updated' && event.type !== 'order.fulfillment.updated') {
      return res.status(200).json({ received: true });
    }

    const payment = event.data?.object?.payment;
    if (payment?.status !== 'COMPLETED') {
      return res.status(200).json({ received: true });
    }

    const orderId = payment.order_id;
    if (!orderId) {
      return res.status(200).json({ received: true });
    }

    const metadata = await tournamentSquareService.getOrderMetadata(orderId);
    if (!metadata) {
      console.warn('No tournament metadata found for order:', orderId);
      return res.status(200).json({ received: true });
    }

    const amountPaidInCents = await tournamentSquareService.getOrderTotal(orderId);
    if (amountPaidInCents === null) {
      console.error('Failed to get order total for:', orderId);
      return res.status(200).json({ received: true });
    }

    await registrationService.finalizePayment(
      metadata.paymentId,
      orderId,
      amountPaidInCents
    );

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing Square webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
