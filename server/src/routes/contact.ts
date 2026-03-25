import { Router, Request, Response } from 'express';
import { emailService } from '../services/emailService';

const router = Router();

interface ContactFormRequest {
  fullName: string;
  emailAddress: string;
  contactNumber?: string;
  message: string;
}

// POST /api/contact - Submit contact form
router.post('/', async (req: Request, res: Response) => {
  try {
    const formData: ContactFormRequest = req.body;

    // Validate required fields
    if (!formData.fullName || !formData.emailAddress || !formData.message) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'fullName, emailAddress, and message are required'
      });
    }

    await emailService.sendContactEmail(formData);

    res.status(200).json({
      success: true,
      message: 'Contact form submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({
      error: 'Failed to submit contact form',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
