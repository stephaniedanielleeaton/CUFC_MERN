import { Router, Request, Response } from 'express';
import { emailListService } from '../services/emailListService';
import { EmailList } from '../models/EmailList';
import { checkJwt, requireRole } from '../middleware/auth';
import { AddEmailRequest, RemoveEmailRequest } from '../types/dtos/emailList';
import { memberProfileService } from '../services/memberProfileService';

const router = Router();

/**
 * GET /api/email-lists/
 * Returns all email lists with full details including emails
 */
router.get('/', checkJwt, requireRole('club-admin'), async (_req: Request, res: Response) => {
  try {
    const lists = await EmailList.find({}, { _id: 0, id: 1, name: 1, emails: 1 });
    res.json(lists);
  } catch (error) {
    console.error('Error in GET /email-lists:', error);
    res.status(500).json({ error: 'Failed to retrieve email lists' });
  }
});

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
 * GET /api/email-lists/members/all
 * Returns all member emails from member profiles as a special list
 */
router.get('/members/all', checkJwt, requireRole('club-admin'), async (_req: Request, res: Response) => {
  try {
    const memberEmails = await memberProfileService.getAllEmails();
    res.json({ id: 'all-members', name: 'All Members', emails: memberEmails });
  } catch (error) {
    console.error('Error in GET /email-lists/members/all:', error);
    res.status(500).json({ error: 'Failed to retrieve member emails' });
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
