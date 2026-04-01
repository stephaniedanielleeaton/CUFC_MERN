import { Router, Request, Response } from 'express';
import { checkJwt, requireRole } from '../middleware/auth';
import { emailService } from '../services/emailService';
import { SendToListRequest } from '@cufc/shared';

const router = Router();

router.post('/send-to-list', checkJwt, requireRole('club-admin'), async (req: Request<{}, {}, SendToListRequest>, res: Response) => {
  const start = performance.now();

  try {
    const { emailListIds, additionalEmails, subject, message, template } = req.body;

    if ((!emailListIds || emailListIds.length === 0) && (!additionalEmails || additionalEmails.length === 0)) {
      return res.status(400).json({ error: 'Must provide either emailListIds or additionalEmails' });
    }

    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }

    const result = await emailService.sendEmailToList({
      emailListIds,
      additionalEmails,
      subject,
      message,
      template
    });

    const duration = performance.now() - start;
    console.log(`POST /email/send-to-list took ${duration}ms`);

    res.status(200).json({
      ...result,
      summary: {
        totalEmails: result.successCount + result.failureCount + result.blockedEmails.length,
        emailsSent: result.successCount,
        emailsFailed: result.failureCount,
        emailsBlocked: result.blockedEmails.length,
      },
      blockedEmails: result.blockedEmails,
      failedEmails: result.failures
    });
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`Error in POST /email/send-to-list (${duration}ms):`, error);
    res.status(500).json({
      error: 'Failed to send emails to list',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
