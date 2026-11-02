import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { normalizeMobile, hashMobile } from '../lib/hashMobile.js';
import { writeLog } from '../lib/audit.js';

const router = Router();

// POST /api/auth/register-patient
router.post('/register-patient', authenticate, async (req, res) => {
  try {
    const schema = z.object({
      phone: z.string().min(10),
      fullName: z.string().min(1),
      sex: z.enum(['M', 'F', 'OTHER']).default('OTHER'),
      dob: z.string().optional(),
      relation: z.enum(['SELF', 'SPOUSE', 'CHILD', 'PARENT', 'OTHER']).default('SELF'),
      preferredLang: z.enum(['en', 'te', 'hi']).default('en'),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation error', details: parsed.error.issues });
    }

    const { phone, fullName, sex, dob, relation, preferredLang } = parsed.data;
    const normalized = normalizeMobile(phone);
    if (!normalized) {
      return res.status(400).json({ error: 'Invalid Indian mobile number' });
    }

    const mobileH = hashMobile(normalized);
    const supabaseId = req.user.id;

    // Check if account with this mobileHash already exists
    let account = await prisma.account.findFirst({
      where: { mobileHash: mobileH },
    });

    if (account) {
      account = await prisma.account.update({
        where: { id: account.id },
        data: {
          supabaseId,
          preferredLang,
        },
      });
    } else {
      account = await prisma.account.create({
        data: {
          supabaseId,
          mobileE164: normalized,
          mobileHash: mobileH,
          preferredLang,
        },
      });
    }

    // Check or create patient
    let patient = await prisma.patient.findFirst({
      where: {
        accountId: account.id,
        fullName: { equals: fullName, mode: 'insensitive' },
      },
    });

    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          accountId: account.id,
          fullName,
          sex,
          dob: dob ? new Date(dob) : null,
          relation,
        },
      });
    }

    await writeLog({
      actorType: 'PATIENT',
      actorId: patient.id,
      accountId: account.id,
      action: 'LOGIN',
      outcome: 'OK',
      detail: `Registered/linked patient account for ${fullName}`,
      req,
    });

    return res.json({
      success: true,
      account,
      patient,
    });
  } catch (err) {
    console.error('register-patient error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
});

// POST /api/auth/register-staff
router.post('/register-staff', authenticate, async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      name: z.string().min(1),
      role: z.enum(['FRONT_DESK', 'DOCTOR']),
      doctorId: z.string().optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation error', details: parsed.error.issues });
    }

    const { email, name, role, doctorId } = parsed.data;
    const user = await prisma.user.upsert({
      where: { email },
      create: {
        supabaseId: req.user.id,
        email,
        name,
        role,
        doctorId: doctorId || null,
      },
      update: {
        supabaseId: req.user.id,
        name,
        role,
        doctorId: doctorId || null,
      },
    });

    await writeLog({
      actorType: role === 'DOCTOR' ? 'DOCTOR' : 'STAFF',
      actorId: user.id,
      action: 'LOGIN',
      outcome: 'OK',
      detail: `Staff user login/registered: ${email}`,
      req,
    });

    return res.json({ success: true, user });
  } catch (err) {
    console.error('register-staff error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    if (req.dbUser) {
      return res.json({
        type: 'STAFF',
        user: req.dbUser,
        role: req.dbUser.role,
      });
    }

    if (req.dbAccount) {
      const patients = await prisma.patient.findMany({
        where: { accountId: req.dbAccount.id },
        include: {
          _count: { select: { orders: true } },
        },
      });

      return res.json({
        type: 'PATIENT',
        account: req.dbAccount,
        patients,
      });
    }

    // New supabase user not yet mapped to dbUser or dbAccount
    return res.json({
      type: 'UNREGISTERED',
      supabaseUser: {
        id: req.user.id,
        email: req.user.email,
        phone: req.user.phone,
      },
    });
  } catch (err) {
    console.error('me error:', err);
    return res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

// POST /api/auth/consent
router.post('/consent', authenticate, async (req, res) => {
  try {
    if (!req.dbAccount) {
      return res.status(403).json({ error: 'Patient account required' });
    }

    const schema = z.object({
      version: z.string().default('1.0'),
    });
    const parsed = schema.safeParse(req.body);
    const version = parsed.success ? parsed.data.version : '1.0';

    const account = await prisma.account.update({
      where: { id: req.dbAccount.id },
      data: {
        consentVersion: version,
        consentAt: new Date(),
      },
    });

    await writeLog({
      actorType: 'PATIENT',
      accountId: account.id,
      action: 'LOGIN',
      outcome: 'OK',
      detail: `Consent accepted version ${version}`,
      req,
    });

    return res.json({ success: true, account });
  } catch (err) {
    console.error('consent error:', err);
    return res.status(500).json({ error: 'Failed to save consent' });
  }
});

// POST /api/auth/update-lang
router.post('/update-lang', authenticate, async (req, res) => {
  try {
    if (!req.dbAccount) {
      return res.status(403).json({ error: 'Patient account required' });
    }

    const schema = z.object({
      lang: z.enum(['en', 'te', 'hi']),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid language' });
    }

    const account = await prisma.account.update({
      where: { id: req.dbAccount.id },
      data: { preferredLang: parsed.data.lang },
    });

    return res.json({ success: true, preferredLang: account.preferredLang });
  } catch (err) {
    console.error('update-lang error:', err);
    return res.status(500).json({ error: 'Failed to update language' });
  }
});

// POST /api/auth/logout
router.post('/logout', optionalAuth, async (req, res) => {
  try {
    await writeLog({
      actorType: req.actorType || 'ANON',
      actorId: req.dbUser?.id || req.dbAccount?.id,
      action: 'LOGOUT',
      outcome: 'OK',
      req,
    });
    return res.json({ success: true });
  } catch (err) {
    return res.json({ success: true });
  }
});

export default router;
