import express from 'express';
import cors from 'cors';
import path from 'path';
import { env } from './config/env';
import { dbConnect } from './config/database';

import attendanceRoutes from './routes/attendance';
import membersRoutes from './routes/members';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import introClassRoutes from './routes/introClass';
import checkoutRoutes from './routes/checkout';
import contactRoutes from './routes/contact';
import emailListRoutes from './routes/emailLists';
import emailRoutes from './routes/email';
import scheduleRoutes from './routes/schedule';
import { tournamentRoutes, squareWebhookRoutes } from './features/tournament';

const app = express();

// Secure CORS configuration
app.use(
  cors({
    origin: env.APP_BASE_URL,
    credentials: true,
  })
);

// Capture raw body for webhook signature verification
app.use('/api/square/webhook', express.json({
  verify: (req: express.Request, _res, buf) => {
    (req as express.Request & { rawBody?: string }).rawBody = buf.toString();
  }
}));

app.use(express.json());

// Serve React build
app.use(express.static(path.join(__dirname, '../../client/dist')));

// API routes
app.use('/api/attendance', attendanceRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/intro-class-offerings', introClassRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/email-lists', emailListRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/square/webhook', squareWebhookRoutes);
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// SPA routing
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

async function start() {
  try {
    await dbConnect();

    app.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT}`);
    }).on('error', (error) => {
      console.error('Failed to start server:', error);
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }
}

start();