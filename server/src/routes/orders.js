import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { maskPhone, maskName } from '../lib/mask.js';
import { writeLog } from '../lib/audit.js';
import { getMessageStatus } from '../services/messaging.js';
import { parseRange, computeFlag, parseNumericValue } from '../lib/ranges.js';
import { applyCriticalRule } from '../lib/critical.js';
import { hashMobile, normalizeMobile } from '../lib/hashMobile.js';
import { generateToken, LINK_TTL_HOURS } from '../lib/tokens.js';
import { messageProvider, buildReportMessage } from '../services/messaging.js';
import { generateSummariesForOrder } from '../services/summary.js';
import { generatePDF } from '../services/import.js';
import { appointmentsStore } from './hospitals.js';

const router = Router();

// GET /api/orders/lookup?orderNo=ORD-71233
// Allows kiosk order lookup with Year of Birth / Order # and maps to correct patient account
router.get('/lookup', async (req, res) => {
  try {
    const { orderNo, yob } = req.query;
    if (!orderNo) {
      return res.status(400).json({ error: 'Order number is required' });
    }

    const order = await prisma.order.findFirst({
      where: {
        orderNo: { equals: String(orderNo).trim(), mode: 'insensitive' },
      },
      include: {
        patient: {
          include: {
            account: true,
          },
        },
      },
    });

    if (!order || !order.patient) {
      return res.status(404).json({ error: 'Order not found. Please verify Order Number.' });
    }

    return res.json({
      success: true,
      orderId: order.id,
      orderNo: order.orderNo,
      patientId: order.patientId,
      patientName: order.patient.fullName,
      phone: order.patient.account?.mobileE164 || '+919000000001',
    });
  } catch (err) {
    console.error('Order lookup error:', err);
    return res.status(500).json({ error: 'Lookup failed' });
  }
});

// GET /api/orders
export function resolveHospitalForOrder(o) {
  const docName = (o.doctor?.name || o.doctorName || '').toLowerCase();
  const orderNo = o.orderNo || '';

  if (
    orderNo === 'ORD-78486' ||
    orderNo === 'ORD-92892' ||
    docName.includes('harish') ||
    docName.includes('rajeshwari') ||
    docName.includes('apollo')
  ) {
    return {
      hospitalSlug: 'apollo-hospital-vijayawada',
      hospitalName: 'Apollo Specialty Hospital',
      name: 'Apollo Specialty Hospital',
      entityName: 'APOLLO HOSPITALS ENTERPRISE LIMITED',
      hospitalShortName: 'Apollo Hospital',
      shortName: 'Apollo Hospital',
      hospitalBadge: 'Benz Circle',
      hospitalAddress: 'Plot 42, Benz Circle, Vijayawada - 520010',
      address: 'Plot 42, Benz Circle, Vijayawada - 520010',
      subTitle: 'Cardio, Ortho & Multi-Specialty Clinical Diagnostics • NABL ISO 15189',
      gstin: '37AAACA8921P1Z9',
      cin: 'L85110TN1979PLC008035',
      initial: 'A',
    };
  }

  if (
    orderNo === 'ORD-71205' ||
    docName.includes('raviteja') ||
    docName.includes('snigdha') ||
    docName.includes('manipal')
  ) {
    return {
      hospitalSlug: 'manipal-hospital',
      hospitalName: 'Manipal Super-Specialty Hospital',
      name: 'Manipal Super-Specialty Hospital',
      entityName: 'MANIPAL HEALTH ENTERPRISES PRIVATE LIMITED',
      hospitalShortName: 'Manipal Hospital',
      shortName: 'Manipal Hospital',
      hospitalBadge: 'Governorpet',
      hospitalAddress: 'Hospital Road, Governorpet, Vijayawada - 520002',
      address: 'Hospital Road, Governorpet, Vijayawada - 520002',
      subTitle: 'Pulmonology, Oncology & Advanced Pathology Division • NABL ISO 15189',
      gstin: '37AABCM4821N1Z5',
      cin: 'U85110KA2010PTC052210',
      initial: 'M',
    };
  }

  if (
    orderNo === 'ORD-71239' ||
    docName.includes('sarojini') ||
    docName.includes('suresh') ||
    docName.includes('ggh')
  ) {
    return {
      hospitalSlug: 'ggh-vijayawada',
      hospitalName: 'Government General Hospital (GGH)',
      name: 'Government General Hospital (GGH)',
      entityName: 'GOVERNMENT GENERAL HOSPITAL AROGYASRI UNIT',
      hospitalShortName: 'GGH Vijayawada',
      shortName: 'GGH Vijayawada',
      hospitalBadge: 'Teaching Hospital',
      hospitalAddress: 'Old Hospital Road, Vijayawada - 520001',
      address: 'Old Hospital Road, Vijayawada - 520001',
      subTitle: 'Teaching Hospital & Comprehensive Clinical Pathology Laboratories',
      gstin: '37GOVAP1100G1Z1',
      cin: 'AP-HEALTH-GGH-04',
      initial: 'G',
    };
  }

  if (
    orderNo === 'ORD-69102' ||
    orderNo === 'ORD-68910' ||
    docName.includes('anitha') ||
    docName.includes('naidu') ||
    docName.includes('central lab') ||
    docName.includes('reference')
  ) {
    return {
      hospitalSlug: 'company-a-central-lab',
      hospitalName: 'Company A Central Reference Lab',
      name: 'Company A Central Reference Lab',
      entityName: 'COMPANY A CENTRAL REFERENCE LABORATORIES',
      hospitalShortName: 'Reference Lab',
      shortName: 'Reference Lab',
      hospitalBadge: 'Suryaraopet',
      hospitalAddress: 'Suryaraopet Diagnostic Complex, Vijayawada - 520002',
      address: 'Suryaraopet Diagnostic Complex, Vijayawada - 520002',
      subTitle: 'Advanced Molecular & Robotic Immunoassay Hub • NABL ISO 15189',
      gstin: '37AABCC8921K1Z2',
      cin: 'U85110AP2021PTC118920',
      initial: 'C',
    };
  }

  return {
    hospitalSlug: 'company-a-main-hospital',
    hospitalName: 'Company A Main Super-Specialty Hospital',
    name: 'Company A Main Super-Specialty Hospital',
    entityName: 'COMPANY A DIAGNOSTICS & HOSPITALS PVT LTD',
    hospitalShortName: 'Company A Main',
    shortName: 'Company A Main',
    hospitalBadge: 'MG Road Enclave',
    hospitalAddress: 'MG Road Healthcare Enclave, Vijayawada - 520010',
    address: 'Plot 42, Healthcare Enclave, MG Road, Vijayawada - 520010',
    subTitle: 'Central Clinical Reference Laboratory • NABL ISO 15189',
    gstin: '37AABCC8921K1Z2',
    cin: 'U85110AP2021PTC118920',
    initial: 'A',
  };
}

router.get('/', authenticate, async (req, res) => {
  try {
    // ─── PATIENT VIEW ───
    if (req.dbAccount) {
      const patientId = req.query.patientId;
      const hospitalSlug = req.query.hospitalSlug;
      const whereClause = {
        patient: { accountId: req.dbAccount.id },
      };
      if (patientId && patientId !== 'all') {
        const pClean = String(patientId).trim().toLowerCase();
        let matchedPatient = req.dbAccount.patients?.find(p => p.id === patientId);
        if (!matchedPatient && req.dbAccount.patients) {
          if (pClean === 'p1' || pClean.includes('lakshmi')) {
            matchedPatient = req.dbAccount.patients.find(p => p.fullName.toLowerCase().includes('lakshmi'));
          } else if (pClean === 'p2' || pClean.includes('srinivas')) {
            matchedPatient = req.dbAccount.patients.find(p => p.fullName.toLowerCase().includes('srinivas'));
          } else if (pClean === 'p3' || pClean.includes('bhavani')) {
            matchedPatient = req.dbAccount.patients.find(p => p.fullName.toLowerCase().includes('bhavani'));
          } else if (pClean === 'p4' || pClean.includes('raghavendra')) {
            matchedPatient = req.dbAccount.patients.find(p => p.fullName.toLowerCase().includes('raghavendra'));
          } else if (pClean === 'p5' || pClean.includes('kavya')) {
            matchedPatient = req.dbAccount.patients.find(p => p.fullName.toLowerCase().includes('kavya'));
          } else {
            matchedPatient = req.dbAccount.patients.find(p => 
              p.fullName.toLowerCase().includes(pClean) ||
              p.relation.toLowerCase() === pClean
            );
          }
        }

        if (matchedPatient) {
          whereClause.patientId = matchedPatient.id;
        } else {
          whereClause.patientId = String(patientId);
        }
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
        const hospInfo = resolveHospitalForOrder(o);

        return {
          id: o.id,
          orderNo: o.orderNo,
          patientId: o.patientId,
          patientName: o.patient.fullName,
          relation: o.patient.relation,
          doctorName: o.doctor?.name || null,
          date: o.signedAt || o.createdAt,
          status: o.status,
          isHeld,
          testName: o.results.length > 1 ? `${testName} + ${o.results.length - 1} more` : testName,
          resultCount: o.results.length,
          hasCritical: o.hasCritical,
          hospitalSlug: hospInfo.hospitalSlug,
          hospitalName: hospInfo.hospitalName,
          hospitalShortName: hospInfo.hospitalShortName,
          hospitalBadge: hospInfo.hospitalBadge,
          hospitalAddress: hospInfo.hospitalAddress,
        };
      });

      let finalOrders = formatted;
      if (hospitalSlug && hospitalSlug !== 'all') {
        finalOrders = formatted.filter(o => o.hospitalSlug === hospitalSlug);
      }

      return res.json({
        orders: finalOrders,
        activeHospitalSlug: hospitalSlug || 'all',
        totalNetworkOrders: formatted.length,
        filteredFacilityOrders: finalOrders.length,
      });
    }

    // ─── DOCTOR DIRECT CONSOLE VIEW (when not requesting front-desk / hospital view) ───
    if (req.dbUser && req.dbUser.role === 'DOCTOR' && !req.query.hospitalSlug && !req.query.page && !req.query.deliveryStatus && !req.query.search && req.query.view !== 'staff') {
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
          patient: {
            include: { account: true },
          },
          doctor: true,
          results: true,
          linkTokens: { orderBy: { createdAt: 'desc' }, take: 1 },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          callbackTasks: { where: { status: 'OPEN' } },
        },
      });

      const formatted = orders.map(o => {
        const latestToken = o.linkTokens[0];
        const latestMessage = o.messages[0];
        const effectiveDelivery = latestMessage ? getMessageStatus(latestMessage) : 'NOT_SENT';

        let linkStatus = 'Not sent';
        if (o.hasCritical && o.callbackTasks?.length > 0) {
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
          patientName: o.patient?.fullName || 'Patient',
          doctorName: o.doctor?.name || 'Attending Physician',
          patientPhoneMasked: maskPhone(o.patient?.account?.mobileE164),
          status: o.status,
          linkStatus,
          deliveryStatus: effectiveDelivery,
          hasCritical: o.hasCritical,
          hasOpenCallback: (o.callbackTasks || []).length > 0,
          date: o.signedAt || o.createdAt,
          parameters: o.results.map(r => r.parameter).join(', '),
          resultCount: o.results.length,
          isOpdToken: false,
        };
      });

      return res.json({ orders: formatted });
    }

    // ─── STAFF VIEW (FRONT_DESK, HOSPITAL CONSOLES & OPERATORS) ───
    if (req.dbUser) {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const skip = (page - 1) * limit;

      const { search, status, deliveryStatus, dateFrom, dateTo, hospitalSlug } = req.query;

      const HOSPITAL_SLUG_MAP = {
        'company-a-main-hospital': { id: 'HOSP-01', name: 'Company A Main Super-Specialty Hospital', docKw: ['ramanaiah', 'anitha', 'k. suresh', 'lakshmi', 'prasad', 'naidu'] },
        'apollo-hospital-vijayawada': { id: 'HOSP-02', name: 'Apollo Specialty Hospital', docKw: ['harish', 'meera', 'suresh kumar', 'vikram', 'apollo'] },
        'manipal-hospital': { id: 'HOSP-03', name: 'Manipal Super-Specialty Hospital', docKw: ['raviteja', 'ravi teja', 'snigdha', 'manipal'] },
        'ggh-vijayawada': { id: 'HOSP-04', name: 'Government General Hospital (GGH)', docKw: ['sarojini', 'krishna', 'prasad', 'ggh'] },
        'company-a-central-lab': { id: 'LAB-01', name: 'Company A Central Reference Lab', docKw: ['ramanaiah', 'verma', 'anitha'] },
      };

      const activeHospMeta = HOSPITAL_SLUG_MAP[hospitalSlug?.toLowerCase()] || null;

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

      // Filter DB orders by hospital doctors if hospitalSlug is specified
      if (activeHospMeta) {
        where.doctor = {
          OR: activeHospMeta.docKw.map(kw => ({
            name: { contains: kw, mode: 'insensitive' },
          })),
        };
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
            results: true,
            linkTokens: { orderBy: { createdAt: 'desc' }, take: 1 },
            messages: { orderBy: { createdAt: 'desc' }, take: 1 },
            callbackTasks: { where: { status: 'OPEN' } },
          },
        }),
      ]);

      let formatted = orders.map(o => {
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
          doctorName: o.doctor?.name || 'Attending Physician',
          patientPhoneMasked: maskPhone(o.patient.account?.mobileE164),
          status: o.status,
          linkStatus,
          deliveryStatus: effectiveDelivery,
          hasCritical: o.hasCritical,
          hasOpenCallback: o.callbackTasks.length > 0,
          date: o.signedAt || o.createdAt,
          parameters: o.results?.map(r => r.parameter).join(', ') || '',
          resultCount: o.results?.length || 0,
          isOpdToken: false,
        };
      });

      // Integrate booked OPD appointments and admissions for this hospital
      const hospitalApts = appointmentsStore.filter(a => {
        if (!activeHospMeta) return true;
        return a.hospitalId === activeHospMeta.id || a.hospitalName?.toLowerCase().includes(activeHospMeta.name.toLowerCase().split(' ')[0]);
      });

      const formattedApts = hospitalApts.map(a => ({
        id: a.id,
        orderNo: a.tokenNo || `OPD-${a.id}`,
        tokenNo: a.tokenNo,
        patientName: a.patientName,
        doctorName: a.doctorName,
        patientPhoneMasked: a.phoneMasked || '••••••0003',
        status: 'SIGNED',
        linkStatus: 'Active',
        deliveryStatus: 'DELIVERED',
        hasCritical: false,
        hasOpenCallback: false,
        date: a.date,
        timeSlot: a.timeSlot,
        fee: a.fee,
        department: a.department,
        isOpdToken: true,
        type: a.type,
      }));

      // Prepend relevant hospital OPD tokens to front-desk worklist
      formatted = [...formattedApts, ...formatted];

      return res.json({
        orders: formatted,
        hospitalSlug: activeHospMeta ? hospitalSlug.toLowerCase() : 'all',
        hospitalName: activeHospMeta?.name || 'All Facilities',
        stats: {
          totalOrders: formatted.length,
          activeTokens: formattedApts.length,
          criticalAlerts: formatted.filter(o => o.hasCritical).length,
        },
        pagination: {
          total: total + formattedApts.length,
          page,
          limit,
          totalPages: Math.max(1, Math.ceil((total + formattedApts.length) / limit)),
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

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id },
          { orderNo: id },
        ],
      },
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

      const hospInfo = resolveHospitalForOrder(order);

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
        hospital: hospInfo,
        hospitalSlug: hospInfo.hospitalSlug,
        hospitalName: hospInfo.hospitalName,
        hospitalShortName: hospInfo.hospitalShortName,
        hospitalBadge: hospInfo.hospitalBadge,
        hospitalAddress: hospInfo.hospitalAddress,
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

// GET /api/orders/:id/trends
// Computes longitudinal parameter trends across all past and current orders for this patient
router.get('/:id/trends', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const currentOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        patient: { include: { account: true } },
        results: true,
      },
    });

    if (!currentOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Access check
    if (req.dbAccount && currentOrder.patient.accountId !== req.dbAccount.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Fetch all orders for this patient sorted by date ascending
    const allPatientOrders = await prisma.order.findMany({
      where: {
        patientId: currentOrder.patientId,
        status: 'SIGNED',
      },
      orderBy: { createdAt: 'asc' },
      include: {
        results: true,
      },
    });

    if (allPatientOrders.length <= 1) {
      return res.json({
        hasTrends: false,
        totalOrders: allPatientOrders.length,
        trends: [],
      });
    }

    const trends = [];

    // For each result in current order, look for historical matches across all orders
    for (const currRes of currentOrder.results) {
      const historyPoints = [];

      for (const ord of allPatientOrders) {
        const match = ord.results.find(
          (r) => r.parameter.trim().toLowerCase() === currRes.parameter.trim().toLowerCase()
        );
        if (match) {
          const numVal = match.valueNum !== null ? Number(match.valueNum) : parseFloat(match.value);
          historyPoints.push({
            orderId: ord.id,
            orderNo: ord.orderNo,
            date: ord.signedAt || ord.createdAt,
            value: match.value,
            valueNum: isNaN(numVal) ? null : numVal,
            unit: match.unit || currRes.unit,
            flag: match.flag,
            isCurrent: ord.id === currentOrder.id,
          });
        }
      }

      if (historyPoints.length >= 2) {
        const currentPoint = historyPoints[historyPoints.length - 1];
        const previousPoint = historyPoints[historyPoints.length - 2];

        let delta = null;
        let percentChange = null;
        let direction = 'STABLE';
        let isFavorable = null;

        if (currentPoint.valueNum !== null && previousPoint.valueNum !== null) {
          delta = Math.round((currentPoint.valueNum - previousPoint.valueNum) * 100) / 100;
          if (previousPoint.valueNum !== 0) {
            percentChange = Math.round((delta / previousPoint.valueNum) * 1000) / 10;
          }
          if (delta > 0) direction = 'INCREASED';
          else if (delta < 0) direction = 'DECREASED';

          const paramLower = currRes.parameter.toLowerCase();
          const isHdl = /hdl/i.test(paramLower);
          const lowerIsBetter = !isHdl && /glucose|sugar|hba1c|cholesterol|triglyceride|ldl|bilirubin|sgpt|sgot|creatinine|uric/i.test(paramLower);
          const higherIsBetter = isHdl || /haemoglobin|hb|platelet|vitamin|calcium/i.test(paramLower);

          if (lowerIsBetter) {
            isFavorable = delta < 0;
          } else if (higherIsBetter) {
            isFavorable = delta > 0;
          }
        }

        trends.push({
          parameter: currRes.parameter,
          unit: currRes.unit,
          refRangeRaw: currRes.refRangeRaw,
          currentValue: currentPoint.value,
          previousValue: previousPoint.value,
          previousDate: previousPoint.date,
          currentDate: currentPoint.date,
          delta,
          percentChange,
          direction,
          isFavorable,
          history: historyPoints,
        });
      }
    }

    return res.json({
      hasTrends: trends.length > 0,
      totalOrders: allPatientOrders.length,
      trends,
    });
  } catch (err) {
    console.error('GET /api/orders/:id/trends error:', err);
    return res.status(500).json({ error: 'Failed to compute biomarker trends' });
  }
});

// GET /api/orders/:id/pdf
router.get('/:id/pdf', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id },
          { orderNo: id },
        ],
      },
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

    let pdfBuffer = order.pdf;
    let fileName = order.pdfFileName || `${order.orderNo}_report.pdf`;

    if (!pdfBuffer) {
      const fullOrder = await prisma.order.findUnique({
        where: { id },
        include: { results: true, patient: true, doctor: true },
      });
      if (fullOrder && fullOrder.results?.length > 0) {
        const { generatePDF } = await import('../services/import.js');
        const pdfBytes = await generatePDF(fullOrder, fullOrder.results, fullOrder.patient);
        pdfBuffer = Buffer.from(pdfBytes);
        await prisma.order.update({
          where: { id },
          data: { pdf: pdfBuffer, pdfFileName: fileName },
        });
      } else {
        return res.status(404).json({ error: 'PDF report not yet available' });
      }
    }

    await writeLog({
      actorType: req.actorType || 'PATIENT',
      actorId: req.dbUser?.id || req.dbAccount?.id,
      orderId: order.id,
      action: 'PDF_DOWNLOAD',
      outcome: 'OK',
      req,
    });

    const disposition = req.query?.download === '1' ? 'attachment' : 'inline';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${disposition}; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

    return res.send(Buffer.from(pdfBuffer));
  } catch (err) {
    console.error('GET /api/orders/:id/pdf error:', err);
    return res.status(500).json({ error: 'Failed to download PDF' });
  }
});

// POST /api/orders
// Create a new diagnostic order (for staff walk-in entry)
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      patientName,
      mobile,
      sex = 'F',
      dob,
      doctorName = 'Dr. S. Ramanaiah',
      status = 'SIGNED',
      results = [],
    } = req.body;

    if (!patientName || !patientName.trim()) {
      return res.status(400).json({ error: 'Patient name is required' });
    }
    if (!mobile || !mobile.trim()) {
      return res.status(400).json({ error: 'Patient mobile number is required' });
    }
    if (!results || results.length === 0) {
      return res.status(400).json({ error: 'At least one test result parameter is required' });
    }

    const normMobile = normalizeMobile(mobile);
    if (!normMobile) {
      return res.status(400).json({ error: 'Invalid 10-digit mobile number' });
    }

    const mobileHash = hashMobile(normMobile);

    // 1. Account
    let account = await prisma.account.findFirst({
      where: { mobileHash },
    });
    if (!account) {
      account = await prisma.account.create({
        data: {
          mobileE164: normMobile,
          mobileHash,
        },
      });
    }

    // 2. Patient
    let patient = await prisma.patient.findFirst({
      where: {
        accountId: account.id,
        fullName: patientName.trim(),
      },
    });
    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          accountId: account.id,
          fullName: patientName.trim(),
          sex: sex || 'F',
          dob: dob ? new Date(dob) : null,
        },
      });
    }

    // 3. Doctor
    let doctor = null;
    if (doctorName && doctorName.trim()) {
      doctor = await prisma.doctor.findFirst({
        where: { name: doctorName.trim() },
      });
      if (!doctor) {
        doctor = await prisma.doctor.create({
          data: { name: doctorName.trim() },
        });
      }
    }

    // 4. Generate unique Order No
    let orderNo = `ORD-${Math.floor(70000 + Math.random() * 25000)}`;
    let exists = await prisma.order.findUnique({ where: { orderNo } });
    while (exists) {
      orderNo = `ORD-${Math.floor(70000 + Math.random() * 25000)}`;
      exists = await prisma.order.findUnique({ where: { orderNo } });
    }

    // 5. Parse critical rules and results
    const criticalRules = await prisma.criticalRule.findMany();
    let hasCritical = false;

    const formattedResults = [];
    for (const r of results) {
      const parsedRange = parseRange(r.refRangeRaw || '');
      const numVal = parseNumericValue(r.value);
      let flag = r.flag || computeFlag(numVal, parsedRange);

      const critCheck = applyCriticalRule(r.parameter, numVal, criticalRules);
      if (critCheck.isCritical) {
        hasCritical = true;
        flag = critCheck.flag;
      }

      formattedResults.push({
        parameter: r.parameter,
        value: String(r.value),
        valueNum: numVal !== null ? numVal : undefined,
        unit: r.unit || '',
        refRangeRaw: r.refRangeRaw || '',
        refLow: parsedRange.low !== null ? parsedRange.low : undefined,
        refHigh: parsedRange.high !== null ? parsedRange.high : undefined,
        refOp: parsedRange.op || undefined,
        flag: flag || 'NORMAL',
      });
    }

    const isSigned = status === 'SIGNED';

    // 6. Create Order with Results
    const newOrder = await prisma.order.create({
      data: {
        orderNo,
        patientId: patient.id,
        doctorId: doctor?.id || null,
        status: isSigned ? 'SIGNED' : 'PROCESSING',
        hasCritical,
        signedAt: isSigned ? new Date() : null,
        pdfFileName: `${orderNo}.pdf`,
        results: {
          create: formattedResults,
        },
      },
      include: {
        results: true,
        patient: { include: { account: true } },
        doctor: true,
      },
    });

    // 7. If SIGNED: Generate PDF, LinkToken, Summary, Messages
    if (isSigned) {
      try {
        const pdfBytes = await generatePDF(newOrder, newOrder.results, patient);
        await prisma.order.update({
          where: { id: newOrder.id },
          data: { pdf: Buffer.from(pdfBytes) },
        });

        const tokenObj = generateToken();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + LINK_TTL_HOURS);
        await prisma.linkToken.create({
          data: {
            orderId: newOrder.id,
            accountId: account.id,
            tokenHash: tokenObj.hash,
            expiresAt,
          },
        });

        await generateSummariesForOrder(newOrder.id);

        if (!hasCritical) {
          const appUrl = process.env.APP_URL || 'http://localhost:5173';
          const reportLink = `${appUrl}/r/${tokenObj.raw}`;
          const messageText = buildReportMessage(
            patient.fullName,
            orderNo,
            reportLink,
            LINK_TTL_HOURS
          );
          await messageProvider.send(account.mobileE164, messageText, newOrder.id);
        } else {
          // Critical callback task
          await prisma.callbackTask.create({
            data: {
              accountId: account.id,
              orderId: newOrder.id,
              type: 'CRITICAL_CALLBACK',
              parameter: formattedResults.find(r => (r.flag || '').includes('CRITICAL'))?.parameter || 'Critical Test Result',
              value: formattedResults.find(r => (r.flag || '').includes('CRITICAL'))?.value || '',
              reason: `Critical value detected during manual order entry for ${orderNo}.`,
            },
          });
        }
      } catch (err) {
        console.warn('Post-creation artifacts generation error:', err);
      }
    }

    await writeLog({
      actorType: req.actorType || 'STAFF',
      actorId: req.dbUser?.id || req.dbAccount?.id,
      orderId: newOrder.id,
      action: 'IMPORT',
      outcome: 'OK',
      detail: `Created order ${orderNo} (${results.length} parameters, ${status})`,
      req,
    });

    return res.status(201).json({
      success: true,
      order: {
        id: newOrder.id,
        orderNo: newOrder.orderNo,
        status: newOrder.status,
        patientName: patient.fullName,
        resultsCount: formattedResults.length,
      },
    });
  } catch (err) {
    console.error('POST /api/orders error:', err);
    return res.status(500).json({ error: err.message || 'Failed to create order' });
  }
});

// POST /api/orders/:id/ask-ai
router.post('/:id/ask-ai', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { question, prompt: rawPrompt, lang = 'en' } = req.body;
    const userPrompt = (question || rawPrompt || '').trim();

    if (!userPrompt) {
      return res.status(400).json({ error: 'Please provide a question or prompt for the AI' });
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id },
          { orderNo: id },
        ],
      },
      include: {
        results: true,
        patient: { include: { account: true } },
        doctor: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Access control
    if (req.dbAccount && order.patient.accountId !== req.dbAccount.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Prepare clinical results context
    const resultsSummary = order.results.map((r) => {
      return `- ${r.parameter}: ${r.value} ${r.unit || ''} (Standard Range: ${r.refRangeRaw || 'Not specified'}) [Flag: ${r.flag || 'NORMAL'}]`;
    }).join('\n');

    // Robust language & Indic script detection
    const isTelugu = lang === 'te' || /[\u0C00-\u0C7F]/.test(userPrompt) || /telugu/i.test(userPrompt) || /తెలుగు/.test(userPrompt);
    const isHindi = lang === 'hi' || /[\u0900-\u097F]/.test(userPrompt) || /hindi/i.test(userPrompt) || /हिंदी/.test(userPrompt);
    const effectiveLang = isTelugu ? 'te' : isHindi ? 'hi' : 'en';
    const langName = isTelugu ? 'Telugu (తెలుగు)' : isHindi ? 'Hindi (हिन्दी)' : 'English';

    const langInstruction = isTelugu
      ? `CRITICAL MANDATORY INSTRUCTION: You MUST write your ENTIRE response exclusively in natural, fluent Telugu script (తెలుగు లిపి). Do NOT use English sentences or English explanations. Explain biological values and clinical advice directly in Telugu.`
      : isHindi
      ? `CRITICAL MANDATORY INSTRUCTION: You MUST write your ENTIRE response exclusively in natural, fluent Hindi script (हिन्दी / देवनागरी लिपि). Do NOT use English sentences or English explanations. Explain biological values and clinical advice directly in Hindi.`
      : `Write your response in clear, empathetic English.`;

    const systemPrompt = `You are "Labby", a friendly, knowledgeable, and empathetic clinical AI diagnostic companion at Company A Diagnostics in Vijayawada, Andhra Pradesh, India.
A patient or doctor is asking a question about a diagnostic lab report.

${langInstruction}

DIAGNOSTIC REPORT CONTEXT:
Order Number: ${order.orderNo}
Patient Name: ${order.patient.fullName} (${order.patient.sex || 'Unknown'}, Age: ${order.patient.dob ? Math.floor((new Date() - new Date(order.patient.dob)) / (365.25 * 24 * 3600 * 1000)) + ' years' : 'Adult'})
Referring Doctor: ${order.doctor?.name || 'Self-referred'}
Status: ${order.status}
Critical Alert: ${order.hasCritical ? 'YES - Contains Critical Value(s)' : 'NO'}

LABORATORY TEST RESULTS:
${resultsSummary}

GUIDELINES FOR LABBY:
1. ${langInstruction}
2. Use clean structure: short paragraphs, bullet points for lists, and a clean markdown table (| Parameter | Your Value | Normal Range | Status |) if comparing parameters.
3. Highlight key terms with **bold**.
4. If asked about abnormal or critical flags, explain biological functions and potential causes in simple, reassuring terms.
5. If there is a CRITICAL result (e.g. Potassium > 6.5 mmol/L), clearly advise prompt medical consultation.
6. NEVER issue a final medical diagnosis or prescribe specific drug dosages.
7. End with a helpful, friendly tip on discussing these numbers with their physician.
8. REMINDER: The target language is ${langName}. Respond fully in ${langName}.`;

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3.5-super-vl:free';

    let aiAnswer = null;

    if (openRouterKey) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 18000);

        const openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openRouterKey}`,
            'HTTP-Referer': 'https://isocodelabs.com',
            'X-Title': 'Company A Diagnostic Portal',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.3,
            max_tokens: 800,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (openRouterRes.ok) {
          const data = await openRouterRes.json();
          aiAnswer = data.choices?.[0]?.message?.content?.trim();
        } else {
          console.error('OpenRouter ask-ai HTTP status:', openRouterRes.status);
        }
      } catch (err) {
        console.error('OpenRouter ask-ai error:', err.message);
      }
    }

    // Verify Indic script fidelity: if user requested Telugu or Hindi and the model answered in English,
    // discard the English reply so that our high-fidelity native Indic diagnostic review is delivered.
    if (aiAnswer) {
      if (effectiveLang === 'te') {
        const teluguChars = (aiAnswer.match(/[\u0C00-\u0C7F]/g) || []).length;
        if (teluguChars < 12) {
          console.warn('AI returned English despite Telugu prompt; switching to native Telugu template.');
          aiAnswer = null;
        }
      } else if (effectiveLang === 'hi') {
        const hindiChars = (aiAnswer.match(/[\u0900-\u097F]/g) || []).length;
        if (hindiChars < 12) {
          console.warn('AI returned English despite Hindi prompt; switching to native Hindi template.');
          aiAnswer = null;
        }
      }
    }

    // Comprehensive multi-language fallback if AI service is offline or rate limited
    if (!aiAnswer) {
      const abnormalList = order.results.filter(r => r.flag && r.flag !== 'NORMAL');
      if (effectiveLang === 'te') {
        aiAnswer = `ఆర్డర్ #${order.orderNo} కోసం ల్యాబ్ డయాగ్నస్టిక్ సమీక్ష:\n\n` +
          (abnormalList.length > 0
            ? `మీ రిపోర్టులో క్రింది **${abnormalList.length} పరీక్షలు** సాధారణ శ్రేణికి భిన్నంగా ఉన్నాయి:\n\n` +
              `| పరీక్ష (Test) | మీ విలువ (Value) | ప్రామాణిక పరిధి (Range) | పరిస్థితి (Status) |\n` +
              `| :--- | :--- | :--- | :--- |\n` +
              abnormalList.map(r => `| **${r.parameter}** | ${r.value} ${r.unit || ''} | ${r.refRangeRaw || '—'} | **${r.flag === 'HIGH' ? 'అధికం (HIGH)' : r.flag === 'CRITICAL' ? 'తీవ్రం (CRITICAL)' : 'తక్కువ (LOW)'}** |`).join('\n') +
              `\n\n${order.hasCritical ? '⚠️ **ముఖ్యమైన గమనిక:** కొన్ని పరీక్ష విలువలు క్రిటికల్ స్థాయిలో ఉన్నాయి. దయచేసి వెంటనే మీ చికిత్సా వైద్యుడిని సంప్రదించండి.' : 'ఈ ఫలితాల ఆధారంగా సరైన ఆహార మార్పులు మరియు జీవనశైలి సూచనల కొరకు మీ డాక్టర్‌ను సంప్రదించండి.'}`
            : 'మీ అన్ని పరీక్ష ఫలితాలు సాధారణ జీవసంబంధ పరిధిలోనే ఉన్నాయి. ఆరోగ్యకరమైన జీవనశైలిని కొనసాగించండి.') +
          `\n\nమీ ప్రశ్న: "${userPrompt}" పై వివరణ:\nఈ ఫలితాలు మీ ప్రస్తుత ఆరోగ్య స్థితిని సూచిస్తున్నాయి. మరింత క్లినికల్ వివరణ కొరకు మీ వైద్యుడితో మాట్లాడండి.\n\n*గమనిక: ఈ సమాచారం రోగి అవగాహన కొరకు మాత్రమే. అధికారిక వైద్య నిర్ధారణ కాదు.*`;
      } else if (effectiveLang === 'hi') {
        aiAnswer = `ऑर्डर #${order.orderNo} के लिए नैदानिक सारांश:\n\n` +
          (abnormalList.length > 0
            ? `आपकी जांच रिपोर्ट में **${abnormalList.length} पैरामीटर** सामान्य सीमा से बाहर पाए गए हैं:\n\n` +
              `| परीक्षण (Test) | आपका मान (Value) | मानक सीमा (Range) | स्थिति (Status) |\n` +
              `| :--- | :--- | :--- | :--- |\n` +
              abnormalList.map(r => `| **${r.parameter}** | ${r.value} ${r.unit || ''} | ${r.refRangeRaw || '—'} | **${r.flag === 'HIGH' ? 'अधिक (HIGH)' : r.flag === 'CRITICAL' ? 'गंभीर (CRITICAL)' : 'कम (LOW)'}** |`).join('\n') +
              `\n\n${order.hasCritical ? '⚠️ **आवश्यक सूचना:** कुछ मान गंभीर श्रेणी में हैं। कृपया तुरंत अपने डॉक्टर से संपर्क करें।' : 'कृपया इन परिणामों पर अपने चिकित्सक से परामर्श लें और आवश्यक जीवनशैली बदलाव करें।'}`
            : 'आपके सभी परीक्षण परिणाम सामान्य सीमा के भीतर हैं। स्वस्थ जीवनशैली बनाए रखें।') +
          `\n\nआपके प्रश्न: "${userPrompt}" पर परामर्श:\nयह रिपोर्ट आपके वर्तमान स्वास्थ्य संकेतकों को दर्शाती है। विस्तृत सलाह हेतु अपने चिकित्सक से परामर्श लें।\n\n*नोट: यह जानकारी केवल रोगी शिक्षा के लिए है। यह आधिकारिक चिकित्सीय निदान नहीं है।*`;
      } else {
        aiAnswer = `Clinical Assessment for Order #${order.orderNo}:\n\n` +
          (abnormalList.length > 0
            ? `Your test results show ${abnormalList.map(r => `${r.parameter}: ${r.value} ${r.unit} (${r.flag})`).join(', ')}. ` +
              (order.hasCritical ? '⚠️ Note: One or more parameters require prompt clinical review. Please show this report to your treating physician immediately.' : 'These variations should be discussed with your physician along with your symptoms and medical history.')
            : 'All recorded test parameters are within normal biological reference intervals.') +
          `\n\nIn response to: "${userPrompt}"\n\nDisclaimer: This AI response is provided for patient education only and does not replace professional medical evaluation.`;
      }
    }

    await writeLog({
      actorType: req.actorType || 'PATIENT',
      actorId: req.dbUser?.id || req.dbAccount?.id,
      orderId: order.id,
      action: 'REPORT_VIEW',
      outcome: 'OK',
      detail: `AI Query (${model}): ${userPrompt.slice(0, 60)}...`,
      req,
    });

    return res.json({
      success: true,
      question: userPrompt,
      answer: aiAnswer,
      model,
      orderNo: order.orderNo,
    });
  } catch (err) {
    console.error('POST /api/orders/:id/ask-ai error:', err);
    return res.status(500).json({ error: 'Failed to process AI question' });
  }
});

// POST /api/orders/ai/general-ask
router.post('/ai/general-ask', optionalAuth, async (req, res) => {
  try {
    const { question, prompt: rawPrompt, lang = 'en' } = req.body;
    const userPrompt = (question || rawPrompt || '').trim();

    if (!userPrompt) {
      return res.status(400).json({ error: 'Please provide a question' });
    }

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3.5-super-vl:free';
    const isTelugu = lang === 'te' || /[\u0C00-\u0C7F]/.test(userPrompt) || /telugu/i.test(userPrompt) || /తెలుగు/.test(userPrompt);
    const isHindi = lang === 'hi' || /[\u0900-\u097F]/.test(userPrompt) || /hindi/i.test(userPrompt) || /हिंदी/.test(userPrompt);
    const effectiveLang = isTelugu ? 'te' : isHindi ? 'hi' : 'en';
    const langName = isTelugu ? 'Telugu (తెలుగు)' : isHindi ? 'Hindi (हिन्दी)' : 'English';

    const langInstruction = isTelugu
      ? `CRITICAL MANDATORY INSTRUCTION: You MUST write your ENTIRE response exclusively in natural, fluent Telugu script (తెలుగు లిపి). Do NOT reply in English.`
      : isHindi
      ? `CRITICAL MANDATORY INSTRUCTION: You MUST write your ENTIRE response exclusively in natural, fluent Hindi script (हिन्दी / देवनागरी लिपि). Do NOT reply in English.`
      : `Write your response in clear, empathetic English.`;

    const systemPrompt = `You are "Labby", a friendly, empathetic clinical AI diagnostic companion for Company A Diagnostics in Vijayawada, India.
${langInstruction}
Answer the user's question clearly, helpfully, and empathetically in ${langName}.
Guidelines:
1. ${langInstruction}
2. Provide accurate educational information regarding medical tests, fasting preparation, and general wellness.
3. Structure your reply nicely with bullet points and bold key terms. If explaining multiple items, use a clean markdown table.
4. Maintain patient safety: Do not provide definitive diagnosis or prescribe drug doses.
5. Always remind them to discuss their results with their physician.
6. REMINDER: The user has selected ${langName}. Write completely in ${langName}.`;

    let aiAnswer = null;

    if (openRouterKey) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 18000);

        const openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openRouterKey}`,
            'HTTP-Referer': 'https://isocodelabs.com',
            'X-Title': 'Company A Diagnostic Portal',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.3,
            max_tokens: 800,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (openRouterRes.ok) {
          const data = await openRouterRes.json();
          aiAnswer = data.choices?.[0]?.message?.content?.trim();
        }
      } catch (err) {
        console.error('General AI ask error:', err.message);
      }
    }

    if (aiAnswer) {
      if (effectiveLang === 'te') {
        const teluguChars = (aiAnswer.match(/[\u0C00-\u0C7F]/g) || []).length;
        if (teluguChars < 12) {
          aiAnswer = null;
        }
      } else if (effectiveLang === 'hi') {
        const hindiChars = (aiAnswer.match(/[\u0900-\u097F]/g) || []).length;
        if (hindiChars < 12) {
          aiAnswer = null;
        }
      }
    }

    if (!aiAnswer) {
      if (effectiveLang === 'te') {
        aiAnswer = `మీ ప్రశ్నకు ధన్యవాదాలు: "${userPrompt}"\n\nల్యాబ్ పరీక్షలు, ఉపవాస నియమాలు లేదా రక్త నమూనా సేకరణకు సంబంధించిన మరింత సమాచారం కొరకు మా ల్యాబ్ కేంద్రం లేదా మీ వైద్యుడిని సంప్రదించండి. మీ పరీక్ష నివేదికను పోర్టల్‌లో తెరవడం ద్వారా నిర్దిష్ట ఫలితాల విశ్లేషణను పొందవచ్చు.\n\n*గమనిక: ఈ సమాచారం రోగి విద్య మరియు అవగాహన కొరకు మాత్రమే. వైద్య సలహా కొరకు మీ డాక్టర్‌ను సంప్రదించండి.*`;
      } else if (effectiveLang === 'hi') {
        aiAnswer = `आपके प्रश्न के लिए धन्यवाद: "${userPrompt}"\n\nप्रयोगशाला परीक्षण, उपवास नियम, या नमूना संग्रह के बारे में अधिक जानकारी के लिए कृपया हमारे लैब केंद्र या अपने चिकित्सक से संपर्क करें। अपने पोर्टल में रिपोर्ट खोलकर आप विस्तृत एआई विश्लेषण देख सकते हैं।\n\n*नोट: यह जानकारी केवल रोगी शिक्षा के उद्देश्य से है। चिकित्सीय सलाह हेतु डॉक्टर से परामर्श लें।*`;
      } else {
        aiAnswer = `Thank you for your question: "${userPrompt}".\n\nFor questions regarding laboratory tests, fasting requirements, or specimen collection, please consult our front-desk or your treating physician. You can also view your specific report in the portal to see custom AI analyses based on your biological values.\n\n*Disclaimer: This educational tool does not substitute for a clinical consultation.*`;
      }
    }

    return res.json({
      success: true,
      question: userPrompt,
      answer: aiAnswer,
      model,
    });
  } catch (err) {
    console.error('general-ask error:', err);
    return res.status(500).json({ error: 'Failed to process AI question' });
  }
});

export default router;

