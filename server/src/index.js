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
import adminRoutes from './routes/admin.js';
import labTaskRoutes from './routes/labTasks.js';
import hospitalsRoutes from './routes/hospitals.js';
import paymentRoutes from './routes/payments.js';

const app = express();
const PORT = process.env.PORT || 3000;

// --------------- Middleware ---------------
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

const rawOrigins = process.env.APP_BASE_URL || 'http://localhost:5173';
const allowedOrigins = rawOrigins.split(',').map((s) => s.trim().replace(/\/+$/, ''));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    // Allow localhost, local tunnels, and Vercel preview/production domains
    if (
      /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
      /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin) ||
      /^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/.test(origin)
    ) {
      return callback(null, true);
    }
    if (process.env.NODE_ENV !== 'production' || process.env.OTP_DEMO_MODE === 'true') {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
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
app.use('/api/admin', adminRoutes);
app.use('/api/lab', labTaskRoutes);
app.use('/api/lab-tasks', labTaskRoutes);
app.use('/api/hospitals', hospitalsRoutes);
app.use('/api/payments', paymentRoutes);

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

