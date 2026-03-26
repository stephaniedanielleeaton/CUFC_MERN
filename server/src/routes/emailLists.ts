import { Router, Request, Response } from 'express';
import { emailListService } from '../services/emailListService';
import { AddEmailRequest, RemoveEmailRequest } from '../types/dtos/emailList';

const router = Router();

/**
 * GET /api/email-lists/summaries
 * Returns id, name, and size of each email list
 */
router.get('/summaries', async (_req: Request, res: Response) => {
  try {
    const summaries = await emailListService.getEmailListSummaries();
    res.json(summaries);
  } catch (error) {
    console.error('Error in GET /email-lists/summaries:', error);
    res.status(500).json({ error: 'Failed to retrieve email list summaries' });
  }
});

/**
 * POST /api/email-lists/promotional/emails
 * Add an email to promotional list (removes from do-not-contact first)
 */
router.post('/promotional/emails', async (req: Request<{}, {}, AddEmailRequest>, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' });
    }
    await emailListService.addEmailToPromotionalList(email);
    res.json({ success: true, message: 'Email added to promotional list' });
  } catch (error) {
    console.error('Error in POST /email-lists/promotional/emails:', error);
    res.status(500).json({ error: 'Failed to add email to promotional list' });
  }
});

/**
 * DELETE /api/email-lists/promotional/emails
 * Remove an email from promotional list (adds to do-not-contact)
 */
router.delete('/promotional/emails', async (req: Request<{}, {}, RemoveEmailRequest>, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' });
    }
    await emailListService.removeEmailFromPromotionalList(email);
    res.json({ success: true, message: 'Email removed from promotional list' });
  } catch (error) {
    console.error('Error in DELETE /email-lists/promotional/emails:', error);
    res.status(500).json({ error: 'Failed to remove email from promotional list' });
  }
});

export default router;
