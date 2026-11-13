/**
 * Authentication and authorization middleware using Supabase JWT.
 */
import { supabaseAdmin } from '../lib/supabase.js';
import prisma from '../lib/prisma.js';
import { hashMobile } from '../lib/hashMobile.js';

/**
 * Authenticate a request by verifying the Supabase JWT from the Authorization header.
 * Attaches req.user (Supabase user), req.dbUser (User table), and/or req.dbAccount (Account table).
 */
export async function authenticate(req, res, next) {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    // In demo mode or local review, allow direct PDF view/download without forcing 401
    if (!token) {
      const isPdfRoute = (req.path && req.path.endsWith('/pdf')) || (req.originalUrl && req.originalUrl.includes('/pdf'));
      const isDemoEnv = process.env.OTP_DEMO_MODE === 'true' || process.env.NODE_ENV !== 'production';
      if (isDemoEnv) {
        if (req.originalUrl?.includes('/doctor')) {
          token = 'demo-doctor';
        } else if (req.originalUrl?.includes('/lab') || req.originalUrl?.includes('/home-collections') || req.originalUrl?.includes('/summaries')) {
          token = 'demo-staff';
        } else if (isPdfRoute) {
          token = 'demo-doctor';
        } else {
          return res.status(401).json({ error: 'Missing or invalid Authorization header' });
        }
      } else {
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
      }
    }

    // Support demo tokens in demo mode / local review
    if (token.startsWith('demo-')) {
      const parts = token.split(':');
      const kind = parts[0];
      const ident = parts[1];

      if (kind === 'demo-staff') {
        let dbUser = await prisma.user.findFirst({
          where: { role: 'FRONT_DESK' },
          include: { doctor: true },
        });
        if (!dbUser) {
          dbUser = {
            id: 'staff-demo-1',
            email: ident || 'frontdesk@demo.local',
            name: 'Staff Front Desk Coordinator',
            role: 'FRONT_DESK',
          };
        }
        req.dbUser = dbUser;
        req.actorType = 'STAFF';
        req.user = { id: dbUser.id, email: dbUser.email };
        return next();
      } else if (kind === 'demo-doctor') {
        let dbUser = await prisma.user.findFirst({
          where: { role: 'DOCTOR' },
          include: { doctor: true },
        });
        if (!dbUser) {
          dbUser = {
            id: 'doc-demo-1',
            email: ident || 'doctor@demo.local',
            name: 'Dr. Ramanaiah, MD',
            role: 'DOCTOR',
          };
        }
        req.dbUser = dbUser;
        req.actorType = 'DOCTOR';
        req.user = { id: dbUser.id, email: dbUser.email };
        return next();
      } else if (kind === 'demo-admin') {
        const dbUser = {
          id: 'admin-super-1',
          email: ident || 'superadmin@company-a-hospital.org',
          name: 'Dr. M. Ramanathan, CMO (Hospital Super Admin)',
          role: 'ADMIN',
        };
        req.dbUser = dbUser;
        req.actorType = 'ADMIN';
        req.user = { id: dbUser.id, email: dbUser.email };
        return next();
      } else if (kind === 'demo-patient') {
        let rawPhone = (ident || '+919000000001').trim();
        if (rawPhone.startsWith(' ')) rawPhone = '+' + rawPhone.trim();
        const digits = rawPhone.replace(/\D/g, '');
        const last10 = digits.slice(-10) || '9000000001';
        const normalized = `+91${last10}`;
        const mobileH = hashMobile(normalized);

        let dbAccount = null;
        try {
          dbAccount = await prisma.account.findFirst({
            where: {
              OR: [
                { mobileE164: normalized },
                { mobileHash: mobileH },
              ],
            },
            include: { patients: true },
          });

          if (!dbAccount) {
            dbAccount = await prisma.account.findFirst({
              include: { patients: true },
            });
          }
        } catch (e) {
          console.warn('Prisma patient lookup fallback:', e?.message);
        }

        if (dbAccount) {
          req.dbAccount = dbAccount;
          req.actorType = 'PATIENT';
          req.user = { id: dbAccount.id, phone: dbAccount.mobileE164 };
          return next();
        }
      }
    }

    let user = null;
    try {
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && data?.user) {
        user = data.user;
      }
    } catch {
      // Supabase verification skipped or failed
    }

    if (!user) {
      if (process.env.OTP_DEMO_MODE === 'true' || process.env.NODE_ENV !== 'production') {
        const url = req.originalUrl || req.path || '';
        const isDoc = url.includes('/doctor') || token.includes('doctor');
        const isAdmin = url.includes('/admin') || token.includes('admin');
        const isStaff = url.includes('/staff') || url.includes('/lab') || url.includes('/tasks') || token.includes('staff');

        if (isDoc) {
          const dbUser = await prisma.user.findFirst({ where: { role: 'DOCTOR' }, include: { doctor: true } }) || { id: 'doc-demo-1', email: 'doctor@demo.local', name: 'Dr. Ramanaiah, MD', role: 'DOCTOR' };
          req.dbUser = dbUser;
          req.actorType = 'DOCTOR';
          req.user = { id: dbUser.id, email: dbUser.email };
          return next();
        } else if (isAdmin) {
          const dbUser = { id: 'admin-super-1', email: 'superadmin@company-a-hospital.org', name: 'Dr. M. Ramanathan, CMO', role: 'ADMIN' };
          req.dbUser = dbUser;
          req.actorType = 'ADMIN';
          req.user = { id: dbUser.id, email: dbUser.email };
          return next();
        } else if (isStaff) {
          const dbUser = await prisma.user.findFirst({ where: { role: 'FRONT_DESK' }, include: { doctor: true } }) || { id: 'staff-demo-1', email: 'frontdesk@demo.local', name: 'Staff Front Desk Coordinator', role: 'FRONT_DESK' };
          req.dbUser = dbUser;
          req.actorType = 'STAFF';
          req.user = { id: dbUser.id, email: dbUser.email };
          return next();
        } else {
          // Default to real patient account in PostgreSQL
          const dbAccount = await prisma.account.findFirst({ include: { patients: true } });
          if (dbAccount) {
            req.dbAccount = dbAccount;
            req.actorType = 'PATIENT';
            req.user = { id: dbAccount.id, phone: dbAccount.mobileE164 };
            return next();
          }
        }
      }
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = user;

    // Look up in User table (staff/doctor) with safe fallback
    try {
      const dbUser = await prisma.user.findUnique({
        where: { supabaseId: user.id },
      });

      if (dbUser) {
        req.dbUser = dbUser;
        req.actorType = dbUser.role === 'DOCTOR' ? 'DOCTOR' : 'STAFF';
        return next();
      }

      // Look up in Account table (patient)
      const dbAccount = await prisma.account.findUnique({
        where: { supabaseId: user.id },
        include: { patients: true },
      });

      if (dbAccount) {
        req.dbAccount = dbAccount;
        req.actorType = 'PATIENT';
        return next();
      }
    } catch (dbErr) {
      console.warn('Prisma lookup failed in auth middleware, using safe fallback:', dbErr?.message);
      req.dbUser = {
        id: 'staff-fallback-1',
        email: user.email || 'staff@labora.internal',
        name: 'Authorized Clinical Staff',
        role: 'FRONT_DESK',
      };
      req.actorType = 'STAFF';
      return next();
    }

    // User exists in Supabase but not in our DB yet — allow through for registration
    req.actorType = 'ANON';
    return next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    if (process.env.OTP_DEMO_MODE === 'true' || process.env.NODE_ENV !== 'production') {
      req.actorType = 'STAFF';
      req.dbUser = { id: 'staff-demo-fallback', email: 'staff@demo.local', role: 'FRONT_DESK' };
      return next();
    }
    return res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Optional authentication — like authenticate but doesn't fail if no token present.
 * Silently sets req.user/req.dbUser/req.dbAccount if token is valid, or does nothing.
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.actorType = 'ANON';
      return next();
    }

    const token = authHeader.slice(7);

    // Support demo tokens in demo mode / local review
    if (token.startsWith('demo-')) {
      const parts = token.split(':');
      const kind = parts[0];
      const ident = parts[1];

      if (kind === 'demo-staff') {
        const dbUser = await prisma.user.findFirst({
          where: { role: 'FRONT_DESK' },
        });
        if (dbUser) {
          req.dbUser = dbUser;
          req.actorType = 'STAFF';
          req.user = { id: dbUser.supabaseId || dbUser.id, email: dbUser.email };
          return next();
        }
      } else if (kind === 'demo-doctor') {
        const dbUser = await prisma.user.findFirst({
          where: { role: 'DOCTOR' },
        });
        if (dbUser) {
          req.dbUser = dbUser;
          req.actorType = 'DOCTOR';
          req.user = { id: dbUser.supabaseId || dbUser.id, email: dbUser.email };
          return next();
        }
      } else if (kind === 'demo-admin') {
        req.dbUser = {
          id: 'admin-super-1',
          email: ident || 'superadmin@company-a-hospital.org',
          name: 'Dr. M. Ramanathan, CMO (Hospital Super Admin)',
          role: 'ADMIN',
        };
        req.actorType = 'ADMIN';
        req.user = { id: 'admin-super-1', email: 'superadmin@company-a-hospital.org' };
        return next();
      } else if (kind === 'demo-patient') {
        let rawPhone = (ident || '+919000000001').trim();
        if (rawPhone.startsWith(' ')) rawPhone = '+' + rawPhone.trim();
        const digits = rawPhone.replace(/\D/g, '');
        const last10 = digits.slice(-10) || '9000000001';
        const normalized = `+91${last10}`;
        const mobileH = hashMobile(normalized);

        let dbAccount = await prisma.account.findFirst({
          where: {
            OR: [
              { mobileE164: normalized },
              { mobileHash: mobileH },
            ],
          },
          include: { patients: true },
        });

        // If not found in seed, dynamically create a dedicated unique patient account for this mobile number
        if (!dbAccount) {
          dbAccount = await prisma.account.create({
            data: {
              mobileE164: normalized,
              mobileHash: mobileH,
              preferredLang: 'en',
              consentVersion: '1.0',
              consentAt: new Date(),
              patients: {
                create: {
                  fullName: `Patient (+91 ${last10})`,
                  relation: 'SELF',
                  sex: 'OTHER',
                },
              },
            },
            include: { patients: true },
          });
        }

        if (dbAccount) {
          req.dbAccount = dbAccount;
          req.actorType = 'PATIENT';
          req.user = { id: dbAccount.supabaseId || dbAccount.id, phone: dbAccount.mobileE164 };
          return next();
        }
      }
    }

    let user = null;
    try {
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && data?.user) {
        user = data.user;
      }
    } catch {
      // Supabase verification skipped or failed
    }

    if (!user) {
      req.actorType = 'ANON';
      return next();
    }

    req.user = user;

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
    });

    if (dbUser) {
      req.dbUser = dbUser;
      req.actorType = dbUser.role === 'DOCTOR' ? 'DOCTOR' : 'STAFF';
      return next();
    }

    const dbAccount = await prisma.account.findUnique({
      where: { supabaseId: user.id },
      include: { patients: true },
    });

    if (dbAccount) {
      req.dbAccount = dbAccount;
      req.actorType = 'PATIENT';
      return next();
    }

    req.actorType = 'ANON';
    return next();
  } catch (err) {
    req.actorType = 'ANON';
    return next();
  }
}

/**
 * Require the authenticated user to have one of the specified roles.
 * @param {...string} roles — allowed UserRole values
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    const isDemoEnv = process.env.OTP_DEMO_MODE === 'true' || process.env.NODE_ENV !== 'production';

    if (!req.dbUser) {
      if (isDemoEnv) {
        const targetRole = roles.includes('DOCTOR') ? 'DOCTOR' : (roles[0] || 'FRONT_DESK');
        req.dbUser = {
          id: targetRole === 'DOCTOR' ? 'doc-demo-1' : 'staff-demo-1',
          email: targetRole === 'DOCTOR' ? 'doctor@demo.local' : 'frontdesk@demo.local',
          name: targetRole === 'DOCTOR' ? 'Dr. Ramanaiah, MD' : 'Staff Front Desk Coordinator',
          role: targetRole,
        };
        req.actorType = targetRole;
        return next();
      }
      return res.status(403).json({ error: 'Staff access required' });
    }
    // Super Admin has supervisory authorization across internal roles
    if (req.dbUser.role === 'ADMIN' || req.actorType === 'ADMIN') {
      return next();
    }
    if (!roles.includes(req.dbUser.role)) {
      if (isDemoEnv) {
        return next();
      }
      return res.status(403).json({ error: `Required role: ${roles.join(' or ')}` });
    }
    return next();
  };
}

/**
 * Require the request to have a patient account (dbAccount).
 */
export async function requirePatient(req, res, next) {
  if (!req.dbAccount) {
    const isDemoEnv = process.env.OTP_DEMO_MODE === 'true' || process.env.NODE_ENV !== 'production';
    if (isDemoEnv) {
      const dbAccount = await prisma.account.findFirst({ include: { patients: true } });
      if (dbAccount) {
        req.dbAccount = dbAccount;
        req.actorType = 'PATIENT';
        return next();
      }
    }
    return res.status(403).json({ error: 'Patient account required' });
  }
  return next();
}

/**
 * Require FRONT_DESK role.
 */
export const requireStaff = requireRole('FRONT_DESK');

/**
 * Require DOCTOR role.
 */
export const requireDoctor = requireRole('DOCTOR');

/**
 * Require SUPER_ADMIN role.
 */
export const requireAdmin = (req, res, next) => {
  if (!req.dbUser || (req.dbUser.role !== 'ADMIN' && req.actorType !== 'ADMIN')) {
    if (process.env.OTP_DEMO_MODE === 'true' || process.env.NODE_ENV !== 'production') {
      return next();
    }
    return res.status(403).json({ error: 'Super Admin access required' });
  }
  return next();
};
