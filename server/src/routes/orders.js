import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { maskPhone, maskName } from '../lib/mask.js';
import { writeLog } from '../lib/audit.js';
import { getMessageStatus } from '../services/messaging.js';

const router = Router();

// GET /api/orders
router.get('/', authenticate, async (req, res) => {
  try {
    // ─── PATIENT VIEW ───
    if (req.dbAccount) {
      const patientId = req.query.patientId;
      const whereClause = {
        patient: { accountId: req.dbAccount.id },
      };
      if (patientId) {
        whereClause.patientId = String(patientId);
      }

      const orders = await prisma.order.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: true,
          doctor: true,
          results: { select: { parameter: true, flag: true } },
          summaries: true,
          callbackTasks: { where: { status: 'OPEN' } },
        },
      });

      const formatted = orders.map(o => {
        // First parameter name as panel/test title
        const testName = o.results.length > 0 ? o.results[0].parameter : 'Laboratory Tests';
        const isHeld = o.hasCritical && o.callbackTasks.length > 0;
        return {
          id: o.id,
          orderNo: o.orderNo,
          patientName: o.patient.fullName,
          relation: o.patient.relation,
          date: o.signedAt || o.createdAt,
          status: o.status,
          isHeld,
          testName: o.results.length > 1 ? `${testName} + ${o.results.length - 1} more` : testName,
          resultCount: o.results.length,
          hasCritical: o.hasCritical,
        };
      });

      return res.json({ orders: formatted });
    }

    // ─── DOCTOR VIEW ───
    if (req.dbUser && req.dbUser.role === 'DOCTOR') {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const whereClause = {
        createdAt: { gte: ninetyDaysAgo },
      };
      if (req.dbUser.doctorId) {
        whereClause.doctorId = req.dbUser.doctorId;
      }

      const orders = await prisma.order.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: true,
          doctor: true,
          results: true,
        },
      });

      const formatted = orders.map(o => ({
        id: o.id,
        orderNo: o.orderNo,
        patientName: o.patient.fullName, // Doctor sees real name
        date: o.signedAt || o.createdAt,
        status: o.status,
        parameters: o.results.map(r => r.parameter).join(', '),
        resultCount: o.results.length,
      }));

      return res.json({ orders: formatted });
    }

    // ─── STAFF VIEW (FRONT_DESK) ───
    if (req.dbUser && req.dbUser.role === 'FRONT_DESK') {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const skip = (page - 1) * limit;

      const { search, status, deliveryStatus, dateFrom, dateTo } = req.query;

      const where = {};

      if (status) {
        where.status = status;
      }

      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(String(dateFrom));
        if (dateTo) {
          const toDate = new Date(String(dateTo));
          toDate.setHours(23, 59, 59, 999);
          where.createdAt.lte = toDate;
        }
      }

      if (search) {
        const s = String(search).trim();
        where.OR = [
          { orderNo: { contains: s, mode: 'insensitive' } },
          { patient: { fullName: { contains: s, mode: 'insensitive' } } },
          { patient: { account: { mobileE164: { endsWith: s } } } },
        ];
      }

      const [total, orders] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            patient: {
              include: { account: true },
            },
            doctor: true,
            linkTokens: { orderBy: { createdAt: 'desc' }, take: 1 },
            messages: { orderBy: { createdAt: 'desc' }, take: 1 },
            callbackTasks: { where: { status: 'OPEN' } },
          },
        }),
      ]);

      const formatted = orders.map(o => {
        const latestToken = o.linkTokens[0];
        const latestMessage = o.messages[0];
        const effectiveDelivery = latestMessage ? getMessageStatus(latestMessage) : 'NOT_SENT';

        let linkStatus = 'Not sent';
        if (o.hasCritical && o.callbackTasks.length > 0) {
          linkStatus = 'Held';
        } else if (latestToken) {
          if (latestToken.revokedAt) {
            linkStatus = 'Revoked';
          } else if (new Date(latestToken.expiresAt) < new Date()) {
            linkStatus = 'Expired';
          } else {
            linkStatus = 'Active';
          }
        }

        return {
          id: o.id,
          orderNo: o.orderNo,
          patientName: o.patient.fullName,
          patientPhoneMasked: maskPhone(o.patient.account?.mobileE164),
          status: o.status,
          linkStatus,
          deliveryStatus: effectiveDelivery,
          hasCritical: o.hasCritical,
          hasOpenCallback: o.callbackTasks.length > 0,
          date: o.signedAt || o.createdAt,
        };
      });

      return res.json({
        orders: formatted,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    return res.status(403).json({ error: 'Unauthorized role' });
  } catch (err) {
    console.error('GET /api/orders error:', err);
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        patient: { include: { account: true } },
        doctor: true,
        results: true,
        summaries: true,
        linkTokens: { orderBy: { createdAt: 'desc' } },
        messages: { orderBy: { createdAt: 'desc' } },
        callbackTasks: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Access check for patient
    if (req.dbAccount) {
      if (order.patient.accountId !== req.dbAccount.id) {
        await writeLog({
          actorType: 'PATIENT',
          accountId: req.dbAccount.id,
          orderId: order.id,
          action: 'REPORT_VIEW',
          outcome: 'DENIED',
          detail: 'Attempted to access order from another account',
          req,
        });
        return res.status(403).json({ error: 'Access denied' });
      }

      await writeLog({
        actorType: 'PATIENT',
        actorId: order.patientId,
        accountId: req.dbAccount.id,
        orderId: order.id,
        action: 'REPORT_VIEW',
        outcome: 'OK',
        req,
      });

      // Format patient view
      const lang = req.query.lang || req.dbAccount.preferredLang || 'en';
      const summary = order.summaries.find(s => s.lang === lang) || order.summaries.find(s => s.lang === 'en');

      let parsedSummaryItems = [];
      if (summary && summary.body) {
        try {
          parsedSummaryItems = JSON.parse(summary.body);
        } catch {
          parsedSummaryItems = summary.body.split('\n\n').map(text => ({ text }));
        }
      }

      return res.json({
        id: order.id,
        orderNo: order.orderNo,
        patient: {
          id: order.patient.id,
          fullName: order.patient.fullName,
          sex: order.patient.sex,
          relation: order.patient.relation,
        },
        doctorName: order.doctor?.name || null,
        date: order.signedAt || order.createdAt,
        status: order.status,
        hasCritical: order.hasCritical,
        isHeld: order.hasCritical && order.callbackTasks.some(t => t.status === 'OPEN'),
        results: order.results.map(r => ({
          parameter: r.parameter,
          value: r.value,
          unit: r.unit,
          refRangeRaw: r.refRangeRaw,
          flag: r.flag,
        })),
        summary: summary ? {
          id: summary.id,
          source: summary.source,
          reviewStatus: summary.reviewStatus,
          items: parsedSummaryItems,
          lang: summary.lang,
        } : null,
      });
    }

    // Access check for staff/doctor
    if (req.dbUser) {
      await writeLog({
        actorType: req.dbUser.role === 'DOCTOR' ? 'DOCTOR' : 'STAFF',
        actorId: req.dbUser.id,
        orderId: order.id,
        action: 'REPORT_VIEW',
        outcome: 'OK',
        req,
      });

      const effectiveMessages = order.messages.map(m => ({
        ...m,
        status: getMessageStatus(m),
      }));

      return res.json({
        order,
        messages: effectiveMessages,
        patientPhoneMasked: maskPhone(order.patient.account?.mobileE164),
      });
    }

    return res.status(403).json({ error: 'Access denied' });
  } catch (err) {
    console.error('GET /api/orders/:id error:', err);
    return res.status(500).json({ error: 'Failed to retrieve order' });
  }
});

// GET /api/orders/:id/pdf
router.get('/:id/pdf', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        patient: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Access control
    if (req.dbAccount && order.patient.accountId !== req.dbAccount.id) {
      await writeLog({
        actorType: 'PATIENT',
        accountId: req.dbAccount.id,
        orderId: order.id,
        action: 'PDF_DOWNLOAD',
        outcome: 'DENIED',
        req,
      });
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!order.pdf) {
      return res.status(404).json({ error: 'PDF report not yet available' });
    }

    await writeLog({
      actorType: req.actorType || 'PATIENT',
      actorId: req.dbUser?.id || req.dbAccount?.id,
      orderId: order.id,
      action: 'PDF_DOWNLOAD',
      outcome: 'OK',
      req,
    });

    const fileName = order.pdfFileName || `${order.orderNo}_report.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

    return res.send(Buffer.from(order.pdf));
  } catch (err) {
    console.error('GET /api/orders/:id/pdf error:', err);
    return res.status(500).json({ error: 'Failed to download PDF' });
  }
});

export default router;

