import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, requireStaff } from '../middleware/auth.js';
import { getMessageStatus, messageProvider } from '../services/messaging.js';
import { maskPhone } from '../lib/mask.js';
import { writeLog } from '../lib/audit.js';

const router = Router();

// GET /api/messages
// Staff outbox drawer / review messages
router.get('/', authenticate, requireStaff, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const messages = await prisma.message.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: { orderNo: true },
        },
        account: {
          select: { mobileE164: true },
        },
      },
    });

    const formatted = messages.map(m => ({
      ...m,
      effectiveStatus: getMessageStatus(m),
      maskedPhone: maskPhone(m.account?.mobileE164),
    }));

    const isDemo = process.env.OTP_DEMO_MODE === 'true';

    return res.json({
      messages: formatted,
      isDemo,
    });
  } catch (err) {
    console.error('GET /api/messages error:', err);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// GET /api/messages/order/:orderId
router.get('/order/:orderId', authenticate, requireStaff, async (req, res) => {
  try {
    const { orderId } = req.params;
    const messages = await prisma.message.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
      include: {
        account: { select: { mobileE164: true } },
      },
    });

    const formatted = messages.map(m => ({
      ...m,
      effectiveStatus: getMessageStatus(m),
      maskedPhone: maskPhone(m.account?.mobileE164),
    }));

    return res.json({ messages: formatted });
  } catch (err) {
    console.error('GET /api/messages/order/:orderId error:', err);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /api/messages/:id/resend-sms
// Fallback for failed WhatsApp messages
router.post('/:id/resend-sms', authenticate, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;

    const original = await prisma.message.findUnique({
      where: { id },
      include: {
        account: true,
      },
    });

    if (!original) {
      return res.status(404).json({ error: 'Original message not found' });
    }

    const newMessage = await messageProvider.send({
      to: original.account.mobileE164,
      body: original.body,
      channel: 'SMS',
      orderId: original.orderId,
      accountId: original.accountId,
      kind: 'RESEND',
    });

    await writeLog({
      actorType: 'STAFF',
      actorId: req.dbUser.id,
      accountId: original.accountId,
      orderId: original.orderId,
      action: 'RESEND_LINK',
      outcome: 'OK',
      detail: 'Resent via SMS channel fallback',
      req,
    });

    return res.json({
      success: true,
      message: 'Resent as SMS',
      newMessage,
    });
  } catch (err) {
    console.error('POST /api/messages/:id/resend-sms error:', err);
    return res.status(500).json({ error: 'Failed to resend SMS' });
  }
});

export default router;
