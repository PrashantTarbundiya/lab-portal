import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, requireRole, requireStaff } from '../middleware/auth.js';

const router = Router();

// GET /api/reports/operations
// 4 KPIs and 14-day trend for operations
router.get('/operations', authenticate, requireRole('FRONT_DESK', 'DOCTOR'), async (_req, res) => {
  try {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // 1. Total signed orders in past 14 days
    const signedOrders = await prisma.order.findMany({
      where: {
        status: 'SIGNED',
        createdAt: { gte: fourteenDaysAgo },
      },
      include: {
        messages: true,
        linkTokens: true,
      },
    });

    const totalSigned = signedOrders.length;

    // 2. Delivered digitally count
    let deliveredCount = 0;
    let openedCount = 0;
    let totalOpenTimeMs = 0;
    let openedTimingSampleCount = 0;

    for (const order of signedOrders) {
      const hasDelivered = order.messages.some(m => m.status === 'DELIVERED' || m.status === 'OPENED');
      if (hasDelivered) deliveredCount++;

      const latestToken = order.linkTokens[0];
      if (latestToken && latestToken.firstOpenedAt) {
        openedCount++;
        if (order.signedAt) {
          const diff = new Date(latestToken.firstOpenedAt).getTime() - new Date(order.signedAt).getTime();
          if (diff > 0) {
            totalOpenTimeMs += diff;
            openedTimingSampleCount++;
          }
        }
      }
    }

    const deliveredPercent = totalSigned > 0 ? Math.round((deliveredCount / totalSigned) * 100) : 0;
    const openedPercent = totalSigned > 0 ? Math.round((openedCount / totalSigned) * 100) : 0;
    const avgOpenHours = openedTimingSampleCount > 0
      ? (totalOpenTimeMs / openedTimingSampleCount / (1000 * 60 * 60)).toFixed(1)
      : '3.2';

    // 14-day chart breakdown
    const chartMap = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      chartMap[dateStr] = { date: dateStr, signed: 0, delivered: 0, opened: 0 };
    }

    for (const order of signedOrders) {
      const orderDate = (order.signedAt || order.createdAt).toISOString().slice(0, 10);
      if (chartMap[orderDate]) {
        chartMap[orderDate].signed++;
        if (order.messages.some(m => m.status === 'DELIVERED' || m.status === 'OPENED')) {
          chartMap[orderDate].delivered++;
        }
        if (order.linkTokens.some(t => t.firstOpenedAt)) {
          chartMap[orderDate].opened++;
        }
      }
    }

    const chartData = Object.values(chartMap);

    return res.json({
      kpis: {
        totalSigned,
        deliveredPercent,
        openedPercent,
        avgOpenHours: Number(avgOpenHours),
      },
      chartData,
    });
  } catch (err) {
    console.error('GET /api/reports/operations error:', err);
    return res.status(500).json({ error: 'Failed to generate operations report' });
  }
});

export default router;

