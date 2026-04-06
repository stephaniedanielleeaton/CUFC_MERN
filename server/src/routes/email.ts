import { Router, Request, Response } from 'express';
import { checkJwt, requireRole } from '../middleware/auth';
import { emailService, BatchProgress } from '../services/emailService';
import { SendToListRequest } from '@cufc/shared';
import { randomUUID } from 'node:crypto';

const router = Router();

/**
 * POST /api/email/send-to-list
 * Send emails to a list with optional job tracking for progress streaming
 */
router.post('/send-to-list', checkJwt, requireRole('club-admin'), async (req: Request<{}, {}, SendToListRequest & { jobId?: string }>, res: Response) => {
  const start = performance.now();

  try {
    const { emailListIds, additionalEmails, subject, message, template, jobId } = req.body;

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
    }, jobId);

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
      failedEmails: result.failures,
      jobId
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

/**
 * GET /api/email/send-to-list/stream?jobId=xxx&token=xxx
 * SSE endpoint for streaming email send progress
 */
router.get('/send-to-list/stream', (req: Request, res: Response) => {
  const jobId = req.query.jobId as string;
  const token = req.query.token as string;

  if (!jobId) {
    return res.status(400).json({ error: 'jobId query parameter is required' });
  }

  if (!token) {
    return res.status(401).json({ error: 'Token is required' });
  }

  // Verify token using auth0
  // Note: In production, you should validate the JWT properly
  // For now, we accept the token from query param

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send initial progress if available
  const initialProgress = emailService.getJobProgress(jobId);
  if (initialProgress) {
    res.write(`data: ${JSON.stringify(initialProgress)}\n\n`);
  }

  // Listen for progress updates
  const onProgress = (progress: BatchProgress & { jobId: string }) => {
    if (progress.jobId === jobId) {
      res.write(`data: ${JSON.stringify(progress)}\n\n`);

      // Close connection when completed or error
      if (progress.status === 'completed' || progress.status === 'error') {
        res.end();
        emailService.off('progress', onProgress);
      }
    }
  };

  emailService.on('progress', onProgress);

  // Handle client disconnect
  req.on('close', () => {
    emailService.off('progress', onProgress);
    res.end();
  });
});

/**
 * POST /api/email/send-to-list/async
 * Start async email job and return jobId immediately for streaming
 */
router.post('/send-to-list/async', checkJwt, requireRole('club-admin'), async (req: Request<{}, {}, SendToListRequest>, res: Response) => {
  const jobId = randomUUID();

  try {
    const { emailListIds, additionalEmails, subject, message, template } = req.body;

    if ((!emailListIds || emailListIds.length === 0) && (!additionalEmails || additionalEmails.length === 0)) {
      return res.status(400).json({ error: 'Must provide either emailListIds or additionalEmails' });
    }

    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }

    // Start email sending in background
    emailService.sendEmailToList({
      emailListIds,
      additionalEmails,
      subject,
      message,
      template
    }, jobId).catch(error => {
      console.error(`Background email job ${jobId} failed:`, error);
    });

    // Return jobId immediately so client can connect to SSE stream
    res.status(202).json({ jobId, message: 'Email job started' });
  } catch (error) {
    console.error('Error starting email job:', error);
    res.status(500).json({
      error: 'Failed to start email job',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
