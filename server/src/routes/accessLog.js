import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, requireStaff } from '../middleware/auth.js';
import { writeLog } from '../lib/audit.js';

const router = Router();

// GET /api/access-log
router.get('/', authenticate, requireStaff, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const { action, outcome, dateFrom, dateTo } = req.query;

    const where = {};
    if (action) where.action = action;
    if (outcome) where.outcome = outcome;
    if (dateFrom || dateTo) {
      where.at = {};
      if (dateFrom) where.at.gte = new Date(String(dateFrom));
      if (dateTo) {
        const toDate = new Date(String(dateTo));
        toDate.setHours(23, 59, 59, 999);
        where.at.lte = toDate;
      }
    }

    const [total, logs] = await Promise.all([
      prisma.accessLog.count({ where }),
      prisma.accessLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { at: 'desc' },
      }),
    ]);

    return res.json({
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('GET /api/access-log error:', err);
    return res.status(500).json({ error: 'Failed to fetch access logs' });
  }
});

// GET /api/access-log/export
// CSV export of logs
router.get('/export', authenticate, requireStaff, async (_req, res) => {
  try {
    const logs = await prisma.accessLog.findMany({
      orderBy: { at: 'desc' },
      take: 1000,
    });

    const headers = ['id', 'at_utc', 'actor_type', 'actor_id', 'order_id', 'action', 'outcome', 'ip_hash', 'user_agent'];
    const rows = logs.map(l => [
      l.id,
      l.at.toISOString(),
      l.actorType,
      l.actorId || '',
      l.orderId || '',
      l.action,
      l.outcome,
      l.ipHash || '',
      `"${(l.userAgentShort || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="access_log_export.csv"');
    return res.send(csvContent);
  } catch (err) {
    console.error('GET /api/access-log/export error:', err);
    return res.status(500).json({ error: 'Failed to export logs' });
  }
});

// POST /api/access-log/reveal-phone/:orderId
// Staff unmasks phone number — audited per spec
router.post('/reveal-phone/:orderId', authenticate, requireStaff, async (req, res) => {
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

    const rawMobile = order.patient.account?.mobileE164;

    await writeLog({
      actorType: 'STAFF',
      actorId: req.dbUser.id,
      accountId: order.patient.accountId,
      orderId,
      action: 'PHONE_REVEAL',
      outcome: 'OK',
      detail: 'Staff revealed patient phone number',
      req,
    });

    return res.json({
      phone: rawMobile,
    });
  } catch (err) {
    console.error('POST /api/access-log/reveal-phone error:', err);
    return res.status(500).json({ error: 'Failed to reveal phone' });
  }
});

export default router;

