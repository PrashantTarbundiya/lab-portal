import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate, requireStaff } from '../middleware/auth.js';
import { writeLog } from '../lib/audit.js';
import { generateToken, LINK_TTL_HOURS } from '../lib/tokens.js';
import { messageProvider, buildReportMessage } from '../services/messaging.js';

const router = Router();
const LAB_NAME = process.env.LAB_NAME || 'Company A Diagnostics';

// GET /api/tasks
router.get('/', authenticate, requireStaff, async (req, res) => {
  try {
    const { type, status } = req.query;

    const where = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const tasks = await prisma.callbackTask.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            id: true,
            orderNo: true,
            patient: { select: { fullName: true, account: { select: { mobileE164: true } } } },
          },
        },
        account: {
          select: { mobileE164: true },
        },
        doneBy: {
          select: { name: true },
        },
      },
    });

    return res.json({ tasks });
  } catch (err) {
    console.error('GET /api/tasks error:', err);
    return res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/stats
router.get('/stats', authenticate, requireStaff, async (_req, res) => {
  try {
    const openTasks = await prisma.callbackTask.groupBy({
      by: ['type'],
      where: { status: 'OPEN' },
      _count: { id: true },
    });

    const stats = {
      CRITICAL_CALLBACK: 0,
      WRONG_NUMBER: 0,
      MOBILE_CHANGE: 0,
      CONSENT_WITHDRAWAL: 0,
    };

    openTasks.forEach(t => {
      stats[t.type] = t._count.id;
    });

    return res.json({ stats });
  } catch (err) {
    console.error('GET /api/tasks/stats error:', err);
    return res.status(500).json({ error: 'Failed to fetch task stats' });
  }
});

// PUT /api/tasks/:id/done
// Marks callback done. If CRITICAL_CALLBACK, releases held link and sends message!
router.put('/:id/done', authenticate, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const schema = z.object({
      note: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    const note = parsed.success ? parsed.data.note : undefined;

    const task = await prisma.callbackTask.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            patient: { include: { account: true } },
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.type === 'CRITICAL_CALLBACK' && (!note || note.trim().length === 0)) {
      return res.status(400).json({ error: 'A note explaining the callback is required for critical results' });
    }

    // Update task status
    const updated = await prisma.callbackTask.update({
      where: { id },
      data: {
        status: 'DONE',
        doneById: req.dbUser.id,
        doneAt: new Date(),
        note: note || null,
      },
    });

    // If critical callback, check if all critical tasks for this order are done
    // If so, release the link and send notification!
    if (task.type === 'CRITICAL_CALLBACK' && task.orderId) {
      const remainingOpenTasks = await prisma.callbackTask.count({
        where: {
          orderId: task.orderId,
          type: 'CRITICAL_CALLBACK',
          status: 'OPEN',
        },
      });

      if (remainingOpenTasks === 0 && task.order) {
        const order = task.order;
        const account = order.patient.account;

        // Check if message was already sent
        const existingMsg = await prisma.message.findFirst({
          where: { orderId: order.id, kind: 'REPORT_LINK' },
        });

        if (!existingMsg) {
          // Generate new token & send message
          const { raw, hash } = generateToken();
          const expiresAt = new Date(Date.now() + LINK_TTL_HOURS * 60 * 60 * 1000);

          await prisma.linkToken.create({
            data: {
              orderId: order.id,
              accountId: account.id,
              tokenHash: hash,
              expiresAt,
            },
          });

          const baseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';
          const url = `${baseUrl}/r/${raw}`;
          const body = buildReportMessage({
            labName: LAB_NAME,
            url,
            lang: account.preferredLang || 'en',
          });

          await messageProvider.send({
            to: account.mobileE164,
            body,
            channel: 'WHATSAPP',
            orderId: order.id,
            accountId: account.id,
            kind: 'REPORT_LINK',
          });
        }
      }
    }

    await writeLog({
      actorType: 'STAFF',
      actorId: req.dbUser.id,
      orderId: task.orderId,
      accountId: task.accountId,
      action: 'TASK_DONE',
      outcome: 'OK',
      detail: `Task marked done: ${task.type}`,
      req,
    });

    return res.json({ success: true, task: updated });
  } catch (err) {
    console.error('PUT /api/tasks/:id/done error:', err);
    return res.status(500).json({ error: 'Failed to complete task' });
  }
});

export default router;
