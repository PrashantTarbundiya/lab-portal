/**
 * Append-only access log writer.
 */
import prisma from './prisma.js';
import crypto from 'crypto';

/**
 * Write a row to the access log.
 * @param {object} params
 * @param {string} params.actorType — PATIENT|STAFF|DOCTOR|SYSTEM|ANON
 * @param {string} [params.actorId]
 * @param {string} [params.accountId]
 * @param {string} [params.orderId]
 * @param {string} params.action — LogAction enum value
 * @param {string} [params.outcome='OK'] — LogOutcome enum value
 * @param {string} [params.detail]
 * @param {object} [params.req] — Express request object for IP/UA extraction
 * @returns {Promise<object>}
 */
export async function writeLog({ actorType, actorId, accountId, orderId, action, outcome = 'OK', detail, req }) {
  const ipHash = req
    ? crypto
        .createHmac('sha256', process.env.APP_HASH_SECRET || 'dev')
        .update(req.ip || '')
        .digest('hex')
        .slice(0, 16)
    : null;
  const userAgentShort = req?.headers?.['user-agent']?.slice(0, 100) || null;

  return prisma.accessLog.create({
    data: {
      actorType,
      actorId,
      accountId,
      orderId,
      action,
      ipHash,
      userAgentShort,
      outcome,
      detail,
    },
  });
}
