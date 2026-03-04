import { Router, Request, Response } from 'express';
import { WebhooksHelper } from 'square';
import { updateMemberProfileById } from '../services/memberProfileService';

const router = Router();

const SQUARE_SIGNATURE_KEY = process.env.SQUARE_SIGNATURE_KEY || '';
const SQUARE_WEBHOOK_URL = process.env.SQUARE_WEBHOOK_URL || '';

// POST /api/webhooks/square - Handle Square webhook events
router.post('/square', async (req: Request, res: Response) => {
  const signature = req.headers['x-square-hmacsha256-signature'] as string;
  const body = JSON.stringify(req.body);

  // Verify the webhook signature
  if (SQUARE_SIGNATURE_KEY) {
    const isValid = WebhooksHelper.verifySignature({
      requestBody: body,
      signatureHeader: signature,
      signatureKey: SQUARE_SIGNATURE_KEY,
      notificationUrl: SQUARE_WEBHOOK_URL,
    });

    if (!isValid) {
      console.error('[Webhook] Invalid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }
  } else {
    console.warn('[Webhook] No signature key configured - skipping verification');
  }

  const event = req.body;
  console.log('[Webhook] Received event:', event.type);

  try {
    if (event.type === 'order.completed' || event.type === 'order.updated') {
      await handleOrderCompleted(event.data?.object?.order_completed?.order || event.data?.object?.order);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('[Webhook] Error processing event:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

async function handleOrderCompleted(order: {
  id?: string;
  customer_id?: string;
  line_items?: Array<{
    metadata?: Record<string, string>;
  }>;
}) {
  if (!order) {
    console.log('[Webhook] No order data in event');
    return;
  }

  const customerId = order.customer_id;
  if (!customerId) {
    console.log('[Webhook] Order has no customer_id');
    return;
  }

  // Find memberProfileId in line item metadata
  let memberProfileId: string | null = null;
  for (const lineItem of order.line_items || []) {
    if (lineItem.metadata?.memberProfileId) {
      memberProfileId = lineItem.metadata.memberProfileId;
      break;
    }
  }

  if (!memberProfileId) {
    console.log('[Webhook] No memberProfileId found in order metadata');
    return;
  }

  console.log(`[Webhook] Linking Square customer ${customerId} to member profile ${memberProfileId}`);

  try {
    await updateMemberProfileById(memberProfileId, {
      squareCustomerId: customerId,
    });
    console.log(`[Webhook] Successfully linked Square customer to member profile`);
  } catch (error) {
    console.error('[Webhook] Failed to update member profile:', error);
  }
}

export default router;
