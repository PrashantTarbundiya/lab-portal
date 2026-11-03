import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, requireDoctor } from '../middleware/auth.js';

const router = Router();

// GET /api/doctors/orders
// Read-only list of own patients' reports for last 90 days
router.get('/orders', authenticate, requireDoctor, async (req, res) => {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const where = {
      createdAt: { gte: ninetyDaysAgo },
    };

    if (req.dbUser.doctorId) {
      where.doctorId = req.dbUser.doctorId;
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            sex: true,
            dob: true,
          },
        },
        doctor: {
          select: { name: true },
        },
        results: {
          select: {
            parameter: true,
            flag: true,
          },
        },
      },
    });

    const formatted = orders.map(o => ({
      id: o.id,
      orderNo: o.orderNo,
      patientName: o.patient.fullName,
      sex: o.patient.sex,
      date: o.signedAt || o.createdAt,
      status: o.status,
      parameters: o.results.map(r => r.parameter).join(', '),
      hasAbnormal: o.results.some(r => r.flag !== 'NORMAL' && r.flag !== 'UNKNOWN'),
      hasCritical: o.results.some(r => r.flag.includes('CRITICAL')),
    }));

    return res.json({ orders: formatted });
  } catch (err) {
    console.error('GET /api/doctors/orders error:', err);
    return res.status(500).json({ error: 'Failed to fetch doctor orders' });
  }
});

export default router;

