import { Router, Request, Response } from 'express';
import { DateTime } from 'luxon';
import { checkJwt, requireRole } from '../middleware/auth';
import { analyticsService } from '../services/analyticsService';
import { APP_TIMEZONE } from '../config/appTime';

const router = Router();

router.get('/daily-summary', checkJwt, requireRole('club-admin'), async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/

    let parsedStart: Date | undefined
    if (startDate) {
      if (!dateRegex.test(startDate)) {
        res.status(400).json({ error: 'Invalid startDate format. Use YYYY-MM-DD' })
        return
      }
      const dt = DateTime.fromISO(startDate, { zone: APP_TIMEZONE })
      if (!dt.isValid) {
        res.status(400).json({ error: 'Invalid startDate' })
        return
      }
      parsedStart = dt.toUTC().toJSDate()
    }

    let parsedEnd: Date | undefined
    if (endDate) {
      if (!dateRegex.test(endDate)) {
        res.status(400).json({ error: 'Invalid endDate format. Use YYYY-MM-DD' })
        return
      }
      const dt = DateTime.fromISO(endDate, { zone: APP_TIMEZONE })
      if (!dt.isValid) {
        res.status(400).json({ error: 'Invalid endDate' })
        return
      }
      parsedEnd = dt.toUTC().toJSDate()
    }

    const summary = await analyticsService.getDailySummary(parsedStart, parsedEnd)
    res.json({ summary })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
});

router.get('/quarterly-summary', checkJwt, requireRole('club-admin'), async (_req: Request, res: Response) => {
  try {
    const summary = await analyticsService.getQuarterlySummary()
    res.json({ summary })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
});

export default router;
