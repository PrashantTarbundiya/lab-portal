import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate, requireStaff } from '../middleware/auth.js';
import { writeLog } from '../lib/audit.js';

const router = Router();

// POST /api/summaries/flag
// Patient flags an auto-generated or template summary
router.post('/flag', authenticate, async (req, res) => {
  try {
    const schema = z.object({
      summaryId: z.string().min(1),
      reason: z.enum(['CONFUSING', 'SEEMS_WRONG', 'WRONG_LANGUAGE', 'OTHER']),
      freeText: z.string().max(300).optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
    }

    const { summaryId, reason, freeText } = parsed.data;

    const summary = await prisma.summary.findUnique({
      where: { id: summaryId },
      include: {
        order: {
          include: { patient: true },
        },
      },
    });

    if (!summary) {
      return res.status(404).json({ error: 'Summary not found' });
    }

    // Access check: patient must own the order
    if (req.dbAccount && summary.order.patient.accountId !== req.dbAccount.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const flag = await prisma.summaryFlag.create({
      data: {
        summaryId,
        patientId: summary.order.patientId,
        reason,
        freeText: freeText || null,
        status: 'OPEN',
      },
    });

    await writeLog({
      actorType: 'PATIENT',
      actorId: summary.order.patientId,
      accountId: summary.order.patient.accountId,
      orderId: summary.orderId,
      action: 'SUMMARY_FLAG',
      outcome: 'OK',
      detail: `Summary flagged: ${reason}`,
      req,
    });

    return res.json({
      success: true,
      message: 'Thank you for your feedback. Our medical team will review this explanation.',
      flagId: flag.id,
    });
  } catch (err) {
    console.error('POST /api/summaries/flag error:', err);
    return res.status(500).json({ error: 'Failed to flag summary' });
  }
});

// GET /api/summaries/flags
// Staff view of flagged summaries
router.get('/flags', authenticate, requireStaff, async (req, res) => {
  try {
    const flags = await prisma.summaryFlag.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        summary: {
          include: {
            order: {
              select: {
                id: true,
                orderNo: true,
                patient: { select: { fullName: true } },
              },
            },
          },
        },
      },
    });

    return res.json({ flags });
  } catch (err) {
    console.error('GET /api/summaries/flags error:', err);
    return res.status(500).json({ error: 'Failed to fetch flagged summaries' });
  }
});

// PUT /api/summaries/flags/:id/review
router.put('/flags/:id/review', authenticate, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const flag = await prisma.summaryFlag.update({
      where: { id },
      data: { status: 'REVIEWED' },
    });

    return res.json({ success: true, flag });
  } catch (err) {
    console.error('PUT /api/summaries/flags/:id/review error:', err);
    return res.status(500).json({ error: 'Failed to update flag' });
  }
});

// GET /api/summaries/sample
// Pathologist weekly review: random 50 summaries from the past 7 days
router.get('/sample', authenticate, requireStaff, async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const summaries = await prisma.summary.findMany({
      where: {
        generatedAt: { gte: sevenDaysAgo },
      },
      take: 50,
      orderBy: { generatedAt: 'desc' },
      include: {
        order: {
          select: {
            id: true,
            orderNo: true,
            patient: { select: { fullName: true } },
            results: {
              where: {
                flag: { notIn: ['NORMAL', 'UNKNOWN'] },
              },
            },
          },
        },
      },
    });

    return res.json({ summaries });
  } catch (err) {
    console.error('GET /api/summaries/sample error:', err);
    return res.status(500).json({ error: 'Failed to fetch summary sample' });
  }
});

// PUT /api/summaries/:id/review
// Pathologist approves or changes a summary
router.put('/:id/review', authenticate, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const schema = z.object({
      status: z.enum(['APPROVED', 'CHANGED']),
      body: z.string().optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed' });
    }

    const { status, body } = parsed.data;

    const updated = await prisma.summary.update({
      where: { id },
      data: {
        reviewStatus: status,
        ...(body ? { body } : {}),
      },
    });

    return res.json({ success: true, summary: updated });
  } catch (err) {
    console.error('PUT /api/summaries/:id/review error:', err);
    return res.status(500).json({ error: 'Failed to review summary' });
  }
});

export default router;

