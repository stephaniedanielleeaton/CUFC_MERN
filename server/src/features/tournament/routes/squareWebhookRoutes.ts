import { Router, Request, Response } from 'express';
import { registrationService, tournamentSquareService } from '../services';
import { squareWebhookService } from '../../../services/square/SquareWebhookService';
import { squarePaymentsService } from '../../../services/square/SquarePaymentsService';
import { introClassEnrollmentService } from '../../../services/introClassEnrollmentService';

const router = Router();

interface SquareWebhookRequest extends Request {
  rawBody?: string;
  body: SquareWebhookEvent;
}

interface SquareWebhookEvent {
  type: string;
  data?: {
    id?: string;
    object?: {
      payment?: {
        id?: string;
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
router.post('/', async (req: SquareWebhookRequest, res: Response<WebhookResponse>) => {
  try {
    const signature = req.headers['x-square-hmacsha256-signature'] as string;
    const rawBody = req.rawBody;

    console.log('[Square Webhook] Headers:', JSON.stringify(req.headers, null, 2));
    console.log('[Square Webhook] Signature header:', signature);
    console.log('[Square Webhook] Raw body exists:', !!rawBody);
    console.log('[Square Webhook] Raw body length:', rawBody?.length);

    if (!rawBody) {
      console.warn('[Square Webhook] Missing raw body');
      return res.status(401).json({ error: 'Missing raw body' });
    }

    if (!signature) {
      console.warn('[Square Webhook] Missing signature header');
      return res.status(401).json({ error: 'Missing signature' });
    }

    const webhookUrl = `https://${req.headers.host}${req.originalUrl}`;
    console.log('[Square Webhook] Webhook URL:', webhookUrl);

    const isValid = squareWebhookService.verifyWebhookSignature(rawBody, signature, webhookUrl);
    console.log('[Square Webhook] Signature valid:', isValid);

    if (!isValid) {
      console.warn('[Square Webhook] Invalid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;

    if (event.type !== 'payment.updated') {
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

    // Fetch full payment details to get customer_id (not always in webhook payload)
    const paymentId = payment.id || event.data?.id;
    let customerId: string | undefined;
    if (paymentId) {
      const fullPayment = await squarePaymentsService.getById(paymentId);
      customerId = fullPayment?.customerId ?? undefined;
    }

    // Try to handle as intro class enrollment first
    await introClassEnrollmentService.handlePaymentCompleted(orderId, customerId);

    // Then try to handle as tournament registration
    const metadata = await tournamentSquareService.getOrderMetadata(orderId);
    if (!metadata) {
      console.log('[Square Webhook] No tournament metadata found for order:', orderId);
      return res.status(200).json({ received: true });
    }

    const amountPaidInCents = await tournamentSquareService.getOrderTotal(orderId);
    if (amountPaidInCents === null) {
      console.error('[Square Webhook] Failed to get order total for:', orderId);
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
