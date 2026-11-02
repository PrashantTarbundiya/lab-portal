import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import prisma from './lib/prisma.js';
import { csrfCheck } from './middleware/csrf.js';

// Route imports
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import importRoutes from './routes/import.js';
import orderRoutes from './routes/orders.js';
import linkRoutes from './routes/links.js';
import messageRoutes from './routes/messages.js';
import summaryRoutes from './routes/summaries.js';
import taskRoutes from './routes/tasks.js';
import accessLogRoutes from './routes/accessLog.js';
import reportRoutes from './routes/reports.js';
import patientRoutes from './routes/patients.js';
import doctorRoutes from './routes/doctors.js';

const app = express();
const PORT = process.env.PORT || 3000;

// --------------- Middleware ---------------
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: process.env.APP_BASE_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(csrfCheck);

// Demo mode warning
if (process.env.OTP_DEMO_MODE === 'true') {
  console.warn('⚠️  OTP_DEMO_MODE is ON — OTPs will be visible in responses. Do NOT use in production.');
}

// --------------- Routes ---------------
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/import', importRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/links', linkRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/summaries', summaryRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/access-log', accessLogRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);

// --------------- Error handler ---------------
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// --------------- Start ---------------
app.listen(PORT, () => {
  console.log(`🚀 Lab Portal API running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
});

export { prisma };
export default app;

