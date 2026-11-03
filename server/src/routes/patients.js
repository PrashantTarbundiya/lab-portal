import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { writeLog } from '../lib/audit.js';

const router = Router();

// GET /api/patients/profiles
// Family member profiles for the authenticated account
router.get('/profiles', authenticate, async (req, res) => {
  try {
    if (!req.dbAccount) {
      return res.status(403).json({ error: 'Patient account required' });
    }

    const patients = await prisma.patient.findMany({
      where: { accountId: req.dbAccount.id },
      include: {
        _count: {
          select: { orders: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return res.json({
      account: {
        id: req.dbAccount.id,
        mobileE164: req.dbAccount.mobileE164,
        preferredLang: req.dbAccount.preferredLang,
        consentVersion: req.dbAccount.consentVersion,
        consentAt: req.dbAccount.consentAt,
      },
      patients: patients.map(p => ({
        id: p.id,
        fullName: p.fullName,
        sex: p.sex,
        dob: p.dob,
        relation: p.relation,
        orderCount: p._count.orders,
      })),
    });
  } catch (err) {
    console.error('GET /api/patients/profiles error:', err);
    return res.status(500).json({ error: 'Failed to fetch profiles' });
  }
});

// POST /api/patients/profiles
// Add a family member
router.post('/profiles', authenticate, async (req, res) => {
  try {
    if (!req.dbAccount) {
      return res.status(403).json({ error: 'Patient account required' });
    }

    const schema = z.object({
      fullName: z.string().min(1),
      sex: z.enum(['M', 'F', 'OTHER']),
      dob: z.string().optional(),
      relation: z.enum(['SELF', 'SPOUSE', 'CHILD', 'PARENT', 'OTHER']).default('OTHER'),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
    }

    const { fullName, sex, dob, relation } = parsed.data;

    const patient = await prisma.patient.create({
      data: {
        accountId: req.dbAccount.id,
        fullName,
        sex,
        dob: dob ? new Date(dob) : null,
        relation,
      },
    });

    return res.json({ success: true, patient });
  } catch (err) {
    console.error('POST /api/patients/profiles error:', err);
    return res.status(500).json({ error: 'Failed to add profile' });
  }
});

// POST /api/patients/withdraw-consent
// DPDP Act 2023 consent withdrawal / data deletion request
router.post('/withdraw-consent', authenticate, async (req, res) => {
  try {
    if (!req.dbAccount) {
      return res.status(403).json({ error: 'Patient account required' });
    }

    const task = await prisma.callbackTask.create({
      data: {
        accountId: req.dbAccount.id,
        type: 'CONSENT_WITHDRAWAL',
        reason: 'Patient requested consent withdrawal / data erasure via privacy portal',
        status: 'OPEN',
      },
    });

    await writeLog({
      actorType: 'PATIENT',
      accountId: req.dbAccount.id,
      action: 'CONSENT_WITHDRAW',
      outcome: 'OK',
      detail: 'Consent withdrawal requested',
      req,
    });

    return res.json({
      success: true,
      message: 'Your withdrawal request has been received. In accordance with DPDP regulations, our privacy officer will process your request within 7 business days.',
      taskId: task.id,
    });
  } catch (err) {
    console.error('POST /api/patients/withdraw-consent error:', err);
    return res.status(500).json({ error: 'Failed to process request' });
  }
});

export default router;

