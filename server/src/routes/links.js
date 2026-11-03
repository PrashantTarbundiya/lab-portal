import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { hashToken, generateToken, constantTimeCompare, LINK_TTL_HOURS } from '../lib/tokens.js';
import { maskPhonePartial } from '../lib/mask.js';
import { writeLog } from '../lib/audit.js';
import { authenticate, requireStaff } from '../middleware/auth.js';
import { messageProvider, buildReportMessage } from '../services/messaging.js';
import { supabaseAdmin } from '../lib/supabase.js';

const router = Router();
const LAB_NAME = process.env.LAB_NAME || 'Company A Diagnostics';

// GET /api/links/:token/info
// Neutral OTP landing gate — NEVER sends OTP or alters state on GET
router.get('/:token/info', async (req, res) => {
  try {
    const { token } = req.params;
    const tokenH = hashToken(token);

    const link = await prisma.linkToken.findUnique({
      where: { tokenHash: tokenH },
      include: {
        account: true,
        order: true,
      },
    });

    // Check validity
    if (!link || link.revokedAt || new Date(link.expiresAt) <= new Date()) {
      return res.json({
        valid: false,
        message: 'This link is no longer valid. Please log in with your registered mobile number.',
      });
    }

    return res.json({
      valid: true,
      labName: LAB_NAME,
      maskedPhone: maskPhonePartial(link.account.mobileE164),
      expiresAt: link.expiresAt,
    });
  } catch (err) {
    console.error('GET /api/links/:token/info error:', err);
    return res.status(500).json({ valid: false, message: 'Server error' });
  }
});

// POST /api/links/:token/request-otp
// State-changing POST to request OTP sent to phone
router.post('/:token/request-otp', async (req, res) => {
  try {
    const { token } = req.params;
    const tokenH = hashToken(token);

    const link = await prisma.linkToken.findUnique({
      where: { tokenHash: tokenH },
      include: { account: true, order: true },
    });

    if (!link || link.revokedAt || new Date(link.expiresAt) <= new Date()) {
      return res.status(400).json({ error: 'This link is no longer valid.' });
    }

    const phone = link.account.mobileE164;

    // Send OTP via Supabase Auth
    const { error } = await supabaseAdmin.auth.signInWithOtp({
      phone,
    });

    if (error) {
      console.warn('Supabase signInWithOtp notice:', error.message);
      // Even if provider fails in local demo, we continue for demo mode
    }

    await writeLog({
      actorType: 'ANON',
      accountId: link.accountId,
      orderId: link.orderId,
      action: 'OTP_SEND',
      outcome: 'OK',
      detail: 'OTP requested via link gate',
      req,
    });

    const isDemo = process.env.OTP_DEMO_MODE === 'true';

    return res.json({
      success: true,
      message: `OTP sent to ${maskPhonePartial(phone)}`,
      demoOtp: isDemo ? '123456' : undefined,
    });
  } catch (err) {
    console.error('POST /api/links/:token/request-otp error:', err);
    return res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// POST /api/links/:token/verify
// Patient submits OTP to unlock the report
router.post('/:token/verify', async (req, res) => {
  try {
    const { token } = req.params;
    const schema = z.object({
      otp: z.string().min(6),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid OTP format' });
    }

    const { otp } = parsed.data;
    const tokenH = hashToken(token);

    const link = await prisma.linkToken.findUnique({
      where: { tokenHash: tokenH },
      include: { account: true, order: true },
    });

    if (!link || link.revokedAt || new Date(link.expiresAt) <= new Date()) {
      return res.status(400).json({ error: 'This link is no longer valid.' });
    }

    const phone = link.account.mobileE164;
    const isDemo = process.env.OTP_DEMO_MODE === 'true';

    // Verify OTP with Supabase or demo mode
    let verified = false;
    let sessionData = null;

    if (isDemo && otp === '123456') {
      verified = true;
    } else {
      const { data, error } = await supabaseAdmin.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms',
      });
      if (!error && data?.session) {
        verified = true;
        sessionData = data.session;
      }
    }

    if (!verified) {
      await writeLog({
        actorType: 'ANON',
        accountId: link.accountId,
        orderId: link.orderId,
        action: 'OTP_FAIL',
        outcome: 'OTP_FAIL',
        req,
      });
      return res.status(400).json({ error: 'Invalid OTP or expired' });
    }

    // Success: update link token open metrics
    await prisma.linkToken.update({
      where: { id: link.id },
      data: {
        firstOpenedAt: link.firstOpenedAt || new Date(),
        openCount: { increment: 1 },
      },
    });

    // Mark associated message as OPENED
    await prisma.message.updateMany({
      where: {
        orderId: link.orderId,
        accountId: link.accountId,
      },
      data: { status: 'OPENED' },
    });

    await writeLog({
      actorType: 'PATIENT',
      accountId: link.accountId,
      orderId: link.orderId,
      action: 'LINK_OPEN',
      outcome: 'OK',
      detail: 'Report unlocked via OTP',
      req,
    });

    return res.json({
      success: true,
      orderId: link.orderId,
      accountId: link.accountId,
      session: sessionData,
      token: sessionData?.access_token || `demo-patient:${link.account.mobileE164}`,
    });
  } catch (err) {
    console.error('POST /api/links/:token/verify error:', err);
    return res.status(500).json({ error: 'Verification failed' });
  }
});

// POST /api/links/:token/not-for-me
// Recipient clicks "This is not for me"
router.post('/:token/not-for-me', async (req, res) => {
  try {
    const { token } = req.params;
    const tokenH = hashToken(token);

    const link = await prisma.linkToken.findUnique({
      where: { tokenHash: tokenH },
      include: { account: true, order: true },
    });

    if (link) {
      // Revoke the token
      await prisma.linkToken.update({
        where: { id: link.id },
        data: { revokedAt: new Date() },
      });

      // Create WRONG_NUMBER task for staff
      await prisma.callbackTask.create({
        data: {
          orderId: link.orderId,
          accountId: link.accountId,
          type: 'WRONG_NUMBER',
          reason: 'Patient tapped "This is not for me" on link landing page',
          status: 'OPEN',
        },
      });

      await writeLog({
        actorType: 'ANON',
        accountId: link.accountId,
        orderId: link.orderId,
        action: 'WRONG_NUMBER',
        outcome: 'OK',
        detail: 'Patient reported wrong number on link gate',
        req,
      });
    }

    return res.json({
      success: true,
      message: 'Thank you. We have recorded this and our team will verify the contact details.',
    });
  } catch (err) {
    console.error('POST /api/links/:token/not-for-me error:', err);
    return res.status(500).json({ error: 'Failed to process report' });
  }
});

// POST /api/links/resend/:orderId
// Staff resends report link
router.post('/resend/:orderId', authenticate, requireStaff, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        patient: { include: { account: true } },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Rate limit: max 3 resends per order per day
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentResends = await prisma.message.count({
      where: {
        orderId,
        kind: 'RESEND',
        createdAt: { gte: oneDayAgo },
      },
    });

    if (recentResends >= 3) {
      return res.status(429).json({
        error: 'Rate limit exceeded: maximum 3 resends per order per 24 hours.',
      });
    }

    // Revoke previous tokens
    await prisma.linkToken.updateMany({
      where: { orderId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    // Generate new token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + LINK_TTL_HOURS * 60 * 60 * 1000);

    await prisma.linkToken.create({
      data: {
        orderId,
        accountId: order.patient.accountId,
        tokenHash: token.hash,
        expiresAt,
      },
    });

    // Create new message
    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';
    const linkUrl = `${baseUrl}/r/${token.raw}`;
    const body = buildReportMessage({
      labName: LAB_NAME,
      url: linkUrl,
      lang: order.patient.account?.preferredLang || 'en',
    });

    const message = await messageProvider.send({
      to: order.patient.account.mobileE164,
      body,
      channel: 'WHATSAPP',
      orderId,
      accountId: order.patient.accountId,
      kind: 'RESEND',
    });

    await writeLog({
      actorType: 'STAFF',
      actorId: req.dbUser.id,
      accountId: order.patient.accountId,
      orderId,
      action: 'RESEND_LINK',
      outcome: 'OK',
      detail: 'Resent report link',
      req,
    });

    return res.json({
      success: true,
      message: 'New link created and queued for delivery.',
      messageId: message.id,
    });
  } catch (err) {
    console.error('POST /api/links/resend/:orderId error:', err);
    return res.status(500).json({ error: 'Failed to resend link' });
  }
});

export default router;

