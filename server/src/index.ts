import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST - must be before any other imports
// Use absolute path to server/.env.local
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

async function startServer() {
  const express = (await import('express')).default;
  const cors = (await import('cors')).default;
  const { dbConnect } = await import('./config/database');
  
  // Import routes dynamically after env vars are loaded
  const attendanceRoutes = (await import('./routes/attendance')).default;
  const membersRoutes = (await import('./routes/members')).default;
  const authRoutes = (await import('./routes/auth')).default;
  const adminRoutes = (await import('./routes/admin')).default;
  const introClassRoutes = (await import('./routes/introClass')).default;
  const checkoutRoutes = (await import('./routes/checkout')).default;
  const webhookRoutes = (await import('./routes/webhooks')).default;

  const app = express();
  const PORT = process.env.PORT || 3000;

  // Middleware
  app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3001',
    credentials: true
  }));
  app.use(express.json());

  // Routes
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/members', membersRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/intro-class-offerings', introClassRoutes);
  app.use('/api/checkout', checkoutRoutes);
  app.use('/api/webhooks', webhookRoutes);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Connect to database and start server
  try {
    await dbConnect();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }
}

startServer();
