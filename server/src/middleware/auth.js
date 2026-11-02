/**
 * Authentication and authorization middleware using Supabase JWT.
 */
import { supabaseAdmin } from '../lib/supabase.js';
import prisma from '../lib/prisma.js';

/**
 * Authenticate a request by verifying the Supabase JWT from the Authorization header.
 * Attaches req.user (Supabase user), req.dbUser (User table), and/or req.dbAccount (Account table).
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.slice(7);
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = user;

    // Look up in User table (staff/doctor)
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

    // User exists in Supabase but not in our DB yet — allow through for registration
    req.actorType = 'ANON';
    return next();
  } catch (err) {
    console.error('Auth middleware error:', err);
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
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
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
    if (!req.dbUser) {
      return res.status(403).json({ error: 'Staff access required' });
    }
    if (!roles.includes(req.dbUser.role)) {
      return res.status(403).json({ error: `Required role: ${roles.join(' or ')}` });
    }
    return next();
  };
}

/**
 * Require the request to have a patient account (dbAccount).
 */
export function requirePatient(req, res, next) {
  if (!req.dbAccount) {
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
