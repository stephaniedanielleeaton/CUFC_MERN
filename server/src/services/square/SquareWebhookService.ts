import { createHmac } from 'node:crypto';
import { env } from '../../config/env';

export class SquareWebhookService {

  verifyWebhookSignature(body: string, signature: string, webhookUrl: string): boolean {
    try {
  
      const payload = webhookUrl + body;

 
      const hmac = createHmac('sha256', env.SQUARE_SIGNATURE_KEY);
      hmac.update(payload);
      const expectedSignature = hmac.digest('base64');

      console.log('[Square Webhook] Expected signature:', expectedSignature);
      console.log('[Square Webhook] Received signature:', signature);


      const expectedBuf = Buffer.from(expectedSignature);
      const receivedBuf = Buffer.from(signature);

      if (expectedBuf.length !== receivedBuf.length) {
        return false;
      }

      return expectedBuf.equals(receivedBuf);
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }
}

export const squareWebhookService = new SquareWebhookService();
