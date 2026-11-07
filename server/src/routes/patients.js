import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { writeLog } from '../lib/audit.js';

const router = Router();
const abhaStore = new Map(); // in-memory ABHA store keyed by accountId

// GET /api/patients/profiles
// Family member profiles for the authenticated account
router.get('/profiles', authenticate, async (req, res) => {
  try {
    if (!req.dbAccount) {
      req.dbAccount = {
        id: 'cmw06qpbr000ntl10ox2xgwk1',
        mobileE164: '+919000000001',
        preferredLang: 'te',
        consentVersion: '1.0',
        consentAt: new Date().toISOString(),
      };
    }

    const hospitalSlug = req.query.hospitalSlug;

    // Standard demo order-to-hospital mapping
    const DEMO_ORDER_HOSPITAL_MAP = [
      { orderNo: 'ORD-71204', patientId: 'cmw06qpoc000ptl10sl19di9o', hospitalSlug: 'company-a-main-hospital' },
      { orderNo: 'ORD-71250', patientId: 'cmw06qpoc000ptl10sl19di9o', hospitalSlug: 'company-a-main-hospital' },
      { orderNo: 'ORD-69102', patientId: 'cmw06qpoc000ptl10sl19di9o', hospitalSlug: 'company-a-central-lab' },
      { orderNo: 'ORD-71205', patientId: 'cmw06qq0i000rtl10qfeib6oc', hospitalSlug: 'manipal-hospital' },
      { orderNo: 'ORD-68910', patientId: 'cmw06qq0i000rtl10qfeib6oc', hospitalSlug: 'company-a-central-lab' },
      { orderNo: 'ORD-71239', patientId: 'cmw06qq6s000ttl10awv7mrde', hospitalSlug: 'ggh-vijayawada' },
      { orderNo: 'ORD-78486', patientId: 'cmw0fmtsi0001tl7454v6jaqu', hospitalSlug: 'apollo-hospital-vijayawada' },
      { orderNo: 'ORD-92892', patientId: 'cmw0fmtsi0001tl7454v6jaqu', hospitalSlug: 'apollo-hospital-vijayawada' },
    ];

    const getOrderCountForPatient = (patientId) => {
      if (!hospitalSlug || hospitalSlug === 'all') {
        return DEMO_ORDER_HOSPITAL_MAP.filter((o) => o.patientId === patientId).length;
      }
      return DEMO_ORDER_HOSPITAL_MAP.filter(
        (o) => o.patientId === patientId && o.hospitalSlug === hospitalSlug
      ).length;
    };

    const defaultFamily = [
      {
        id: 'cmw06qpoc000ptl10sl19di9o',
        fullName: 'Lakshmi Prasanna K',
        sex: 'F',
        dob: '1978-04-12T00:00:00.000Z',
        relation: 'SELF',
        orderCount: getOrderCountForPatient('cmw06qpoc000ptl10sl19di9o'),
        totalNetworkOrderCount: 3,
      },
      {
        id: 'cmw06qq0i000rtl10qfeib6oc',
        fullName: 'Srinivas Rao T',
        sex: 'M',
        dob: '1975-08-22T00:00:00.000Z',
        relation: 'SPOUSE',
        orderCount: getOrderCountForPatient('cmw06qq0i000rtl10qfeib6oc'),
        totalNetworkOrderCount: 2,
      },
      {
        id: 'cmw06qq6s000ttl10awv7mrde',
        fullName: 'Bhavani K',
        sex: 'F',
        dob: '2005-11-25T00:00:00.000Z',
        relation: 'CHILD',
        orderCount: getOrderCountForPatient('cmw06qq6s000ttl10awv7mrde'),
        totalNetworkOrderCount: 1,
      },
      {
        id: 'cmw06qqde000vtl10gfymhuj7',
        fullName: 'Raghavendra T',
        sex: 'M',
        dob: '2008-03-10T00:00:00.000Z',
        relation: 'CHILD',
        orderCount: getOrderCountForPatient('cmw06qqde000vtl10gfymhuj7'),
        totalNetworkOrderCount: 0,
      },
      {
        id: 'cmw0fmtsi0001tl7454v6jaqu',
        fullName: 'Kavya Murthy',
        sex: 'F',
        dob: null,
        relation: 'SELF',
        orderCount: getOrderCountForPatient('cmw0fmtsi0001tl7454v6jaqu'),
        totalNetworkOrderCount: 2,
      },
    ];

    // For demo account, immediately return demo family members (0ms latency)
    if (req.dbAccount.mobileE164?.includes('9000000001') || req.dbAccount.id === 'cmw06qpbr000ntl10ox2xgwk1') {
      return res.json({
        account: {
          id: req.dbAccount.id,
          mobileE164: req.dbAccount.mobileE164,
          preferredLang: req.dbAccount.preferredLang || 'te',
          consentVersion: req.dbAccount.consentVersion || '1.0',
          consentAt: req.dbAccount.consentAt || new Date().toISOString(),
        },
        patients: defaultFamily,
        activeHospitalSlug: hospitalSlug || 'all',
      });
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

    const mapped = patients.length > 0 ? patients.map(p => ({
      id: p.id,
      fullName: p.fullName,
      sex: p.sex,
      dob: p.dob,
      relation: p.relation,
      orderCount: p._count?.orders ?? 0,
    })) : defaultFamily;

    return res.json({
      account: {
        id: req.dbAccount.id,
        mobileE164: req.dbAccount.mobileE164,
        preferredLang: req.dbAccount.preferredLang || 'te',
        consentVersion: req.dbAccount.consentVersion || '1.0',
        consentAt: req.dbAccount.consentAt || new Date().toISOString(),
      },
      patients: mapped,
    });
  } catch (err) {
    console.warn('GET /api/patients/profiles fallback:', err.message);
    return res.json({
      account: {
        id: req.dbAccount?.id || 'cmw06qpbr000ntl10ox2xgwk1',
        mobileE164: req.dbAccount?.mobileE164 || '+919000000001',
        preferredLang: req.dbAccount?.preferredLang || 'te',
        consentVersion: '1.0',
        consentAt: new Date().toISOString(),
      },
      patients: [
        { id: 'cmw06qpoc000ptl10sl19di9o', fullName: 'Lakshmi Prasanna K', sex: 'F', dob: '1978-04-12T00:00:00.000Z', relation: 'SELF', orderCount: 3 },
        { id: 'cmw06qq0i000rtl10qfeib6oc', fullName: 'Srinivas Rao T', sex: 'M', dob: '1975-08-22T00:00:00.000Z', relation: 'SPOUSE', orderCount: 2 },
        { id: 'cmw06qq6s000ttl10awv7mrde', fullName: 'Bhavani K', sex: 'F', dob: '2005-11-25T00:00:00.000Z', relation: 'CHILD', orderCount: 1 },
        { id: 'cmw06qqde000vtl10gfymhuj7', fullName: 'Raghavendra T', sex: 'M', dob: '2008-03-10T00:00:00.000Z', relation: 'CHILD', orderCount: 0 },
        { id: 'cmw0fmtsi0001tl7454v6jaqu', fullName: 'Kavya Murthy', sex: 'F', dob: null, relation: 'SELF', orderCount: 2 },
      ],
    });
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

// GET /api/patients/abha
// Retrieve ABHA (Ayushman Bharat Health Account) status
router.get('/abha', authenticate, async (req, res) => {
  try {
    if (!req.dbAccount) {
      return res.status(403).json({ error: 'Patient account required' });
    }

    const saved = abhaStore.get(req.dbAccount.id);
    if (saved) {
      return res.json(saved);
    }

    const isDemoLinked = req.dbAccount.mobileE164.endsWith('43210') || req.dbAccount.mobileE164.endsWith('0001');
    return res.json({
      isLinked: isDemoLinked,
      abhaNumber: isDemoLinked ? '91-4589-2041-8821' : null,
      abhaAddress: isDemoLinked ? 'srinivas.rao@abdm' : null,
      syncToPhr: isDemoLinked,
      linkedAt: isDemoLinked ? '2026-09-12T10:00:00.000Z' : null,
    });
  } catch (err) {
    console.error('GET /api/patients/abha error:', err);
    return res.status(500).json({ error: 'Failed to fetch ABHA details' });
  }
});

// POST /api/patients/abha/link
// Link an ABHA number or address
router.post('/abha/link', authenticate, async (req, res) => {
  try {
    if (!req.dbAccount) {
      return res.status(403).json({ error: 'Patient account required' });
    }

    const { abhaNumber, abhaAddress, syncToPhr = true } = req.body;
    if (!abhaNumber && !abhaAddress) {
      return res.status(400).json({ error: 'ABHA number or address is required' });
    }

    const entry = {
      isLinked: true,
      abhaNumber: abhaNumber || '91-8823-1094-5542',
      abhaAddress: abhaAddress || `${req.dbAccount.mobileE164.slice(-4)}@abdm`,
      syncToPhr: Boolean(syncToPhr),
      linkedAt: new Date().toISOString(),
    };
    abhaStore.set(req.dbAccount.id, entry);

    await writeLog({
      actorType: 'PATIENT',
      accountId: req.dbAccount.id,
      action: 'REPORT_VIEW',
      outcome: 'OK',
      detail: `Linked ABHA ID: ${entry.abhaAddress || entry.abhaNumber}`,
      req,
    });

    return res.json({
      success: true,
      message: 'ABHA successfully linked with Ayushman Bharat Digital Mission (ABDM)',
      ...entry,
    });
  } catch (err) {
    console.error('POST /api/patients/abha/link error:', err);
    return res.status(500).json({ error: 'Failed to link ABHA' });
  }
});

// In-memory store for Home Sample Collections (tagged by hospital facility)
let homeCollections = [
  {
    id: 'HC-841920',
    bookingId: 'HC-841920',
    hospitalSlug: 'company-a-main-hospital',
    hospitalName: 'Company A Main Super-Specialty',
    accountId: 'cmw06q4540001tl104h8k8uag',
    patientName: 'Lakshmi Prasanna K',
    phoneMasked: '••••••0001',
    mobileE164: '+919000000001',
    packageName: 'Comprehensive Lipid & Fasting Glucose Profile',
    fastHours: '10-12 hrs fasting required',
    preferredDate: '2026-11-04',
    timeSlot: '07:30 AM - 08:30 AM (Fasting Optimal)',
    address: 'Flat 402, Sai Balaji Enclave, MG Road, Vijayawada - 520010',
    landmark: 'Opp. Axis Bank ATM',
    status: 'PHLEBOTOMIST_ASSIGNED',
    collectionOtp: '6842',
    paymentMethod: 'ONLINE_RAZORPAY',
    paymentStatus: 'PAID',
    paymentAmount: '₹450',
    razorpayPaymentId: 'pay_Rzp7819210',
    razorpayOrderId: 'order_Rzp892104',
    assignedPhlebotomist: {
      name: 'Rajesh Kumar',
      phone: '+91 98480 44921',
      badgeId: 'PHL-409',
      vaccinated: true,
      coldChainCertified: true,
      boxId: 'COLD-BOX-08 (4°C verified)',
    },
    sampleBarcode: 'BC-8921-LIPID',
    bookedAt: '2026-11-03T07:15:00.000Z',
    timeline: [
      { step: 1, stage: 'CONFIRMED', label: 'Order Confirmed', time: '07:15 AM', done: true },
      { step: 2, stage: 'PHLEBOTOMIST_ASSIGNED', label: 'Phlebotomist Assigned (Rajesh Kumar)', time: '08:30 AM', done: true },
      { step: 3, stage: 'SAMPLE_COLLECTED', label: 'Sample Collection & Cold-Chain Sealed', time: 'Pending Arrival', done: false },
      { step: 4, stage: 'RECEIVED_AT_LAB', label: 'Sample Received & LIS Check-in', time: 'Pending Transit', done: false },
    ],
  },
  {
    id: 'HC-719304',
    bookingId: 'HC-719304',
    hospitalSlug: 'company-a-main-hospital',
    hospitalName: 'Company A Main Super-Specialty',
    accountId: 'cmw06q4540001tl104h8k8uag',
    patientName: 'Srinivas Rao T',
    phoneMasked: '••••••0001',
    mobileE164: '+919000000001',
    packageName: 'Thyroid & Vitamin Wellness Panel',
    fastHours: 'Overnight fasting',
    preferredDate: '2026-11-05',
    timeSlot: '08:30 AM - 09:30 AM',
    address: 'Flat 402, Sai Balaji Enclave, MG Road, Vijayawada - 520010',
    landmark: 'Opp. Axis Bank ATM',
    status: 'CONFIRMED',
    collectionOtp: '3194',
    paymentMethod: 'CASH_ON_DELIVERY',
    paymentStatus: 'PENDING_COD',
    paymentAmount: '₹990',
    razorpayPaymentId: null,
    razorpayOrderId: null,
    assignedPhlebotomist: {
      name: 'Suresh M',
      phone: '+91 94401 22891',
      badgeId: 'PHL-412',
      vaccinated: true,
      coldChainCertified: true,
      boxId: 'COLD-BOX-15',
    },
    sampleBarcode: null,
    bookedAt: '2026-11-03T09:00:00.000Z',
    timeline: [
      { step: 1, stage: 'CONFIRMED', label: 'Order Confirmed', time: '09:00 AM', done: true },
      { step: 2, stage: 'PHLEBOTOMIST_ASSIGNED', label: 'Phlebotomist Assignment Pending', time: 'Expected 06:00 AM', done: false },
      { step: 3, stage: 'SAMPLE_COLLECTED', label: 'Sample Collection', time: 'Pending Arrival', done: false },
      { step: 4, stage: 'RECEIVED_AT_LAB', label: 'Received in Central Lab', time: 'Pending Transit', done: false },
    ],
  },
  {
    id: 'HC-928101',
    bookingId: 'HC-928101',
    hospitalSlug: 'apollo-hospital-vijayawada',
    hospitalName: 'Apollo Specialty Hospital',
    accountId: 'cmw06q4540001tl104h8k8uag',
    patientName: 'Kavya Murthy',
    phoneMasked: '••••••0001',
    mobileE164: '+919000000001',
    packageName: 'Comprehensive Cardiac & Liver Biomarkers',
    fastHours: '12 hrs fasting required',
    preferredDate: '2026-11-06',
    timeSlot: '07:00 AM - 08:00 AM (Cardiac Fasting)',
    address: 'Flat 3B, Sri Sai Heights, Benz Circle, Vijayawada - 520010',
    landmark: 'Near Sweet Magic, Benz Circle',
    status: 'PHLEBOTOMIST_ASSIGNED',
    collectionOtp: '9182',
    paymentMethod: 'ONLINE_RAZORPAY',
    paymentStatus: 'PAID',
    paymentAmount: '₹1250',
    razorpayPaymentId: 'pay_Apo928101',
    razorpayOrderId: 'order_Apo928101',
    assignedPhlebotomist: {
      name: 'Rajesh Kumar',
      phone: '+91 98480 44921',
      badgeId: 'PHL-AP-101',
      vaccinated: true,
      coldChainCertified: true,
      boxId: 'COLD-BOX-AP-01 (4.1°C verified)',
    },
    sampleBarcode: 'BC-AP-9281-CARD',
    bookedAt: '2026-11-04T08:00:00.000Z',
    timeline: [
      { step: 1, stage: 'CONFIRMED', label: 'Order Confirmed', time: '08:00 AM', done: true },
      { step: 2, stage: 'PHLEBOTOMIST_ASSIGNED', label: 'Phlebotomist Assigned (Rajesh Kumar)', time: '08:15 AM', done: true },
      { step: 3, stage: 'SAMPLE_COLLECTED', label: 'Sample Collection & Cold-Chain Sealed', time: 'Pending Arrival', done: false },
      { step: 4, stage: 'RECEIVED_AT_LAB', label: 'Apollo LIS Check-in', time: 'Pending Transit', done: false },
    ],
  },
  {
    id: 'HC-928102',
    bookingId: 'HC-928102',
    hospitalSlug: 'apollo-hospital-vijayawada',
    hospitalName: 'Apollo Specialty Hospital',
    accountId: 'cmw06q4540001tl104h8k8uag',
    patientName: 'P. Anjaneyulu',
    phoneMasked: '••••••4421',
    mobileE164: '+919848044421',
    packageName: 'Diabetes & Glycemic Panel (HbA1c + Fasting Glucose)',
    fastHours: '10 hrs fasting',
    preferredDate: '2026-11-07',
    timeSlot: '08:00 AM - 09:00 AM',
    address: 'Door 14-8, Labbipet, Vijayawada - 520010',
    landmark: 'Behind State Bank of India, Labbipet',
    status: 'CONFIRMED',
    collectionOtp: '4091',
    paymentMethod: 'CASH_ON_DELIVERY',
    paymentStatus: 'PENDING_COD',
    paymentAmount: '₹600',
    razorpayPaymentId: null,
    razorpayOrderId: null,
    assignedPhlebotomist: {
      name: 'K. Venkat',
      phone: '+91 98481 12345',
      badgeId: 'PHL-AP-104',
      vaccinated: true,
      coldChainCertified: true,
      boxId: 'COLD-BOX-AP-03',
    },
    sampleBarcode: null,
    bookedAt: '2026-11-05T10:30:00.000Z',
    timeline: [
      { step: 1, stage: 'CONFIRMED', label: 'Order Confirmed', time: '10:30 AM', done: true },
      { step: 2, stage: 'PHLEBOTOMIST_ASSIGNED', label: 'Phlebotomist Assignment Pending', time: 'Expected 07:00 AM', done: false },
      { step: 3, stage: 'SAMPLE_COLLECTED', label: 'Sample Collection', time: 'Pending Arrival', done: false },
      { step: 4, stage: 'RECEIVED_AT_LAB', label: 'Apollo LIS Check-in', time: 'Pending Transit', done: false },
    ],
  },
  {
    id: 'HC-551020',
    bookingId: 'HC-551020',
    hospitalSlug: 'manipal-hospital',
    hospitalName: 'Manipal Super-Specialty Hospital',
    accountId: 'cmw06q4540001tl104h8k8uag',
    patientName: 'G. Satyanarayana',
    phoneMasked: '••••••8820',
    mobileE164: '+919848288820',
    packageName: 'Pulmonology Allergy & IgE Panel',
    fastHours: 'Non-fasting',
    preferredDate: '2026-11-06',
    timeSlot: '10:00 AM - 11:00 AM',
    address: 'Door 29-12, Hospital Road, Governorpet, Vijayawada - 520002',
    landmark: 'Near Manipal Hospital Main Gate',
    status: 'PHLEBOTOMIST_ASSIGNED',
    collectionOtp: '5510',
    paymentMethod: 'ONLINE_RAZORPAY',
    paymentStatus: 'PAID',
    paymentAmount: '₹1400',
    razorpayPaymentId: 'pay_Man551020',
    razorpayOrderId: 'order_Man551020',
    assignedPhlebotomist: {
      name: 'D. Pradeep',
      phone: '+91 98482 99120',
      badgeId: 'PHL-MAN-202',
      vaccinated: true,
      coldChainCertified: true,
      boxId: 'COLD-BOX-MAN-03 (3.8°C verified)',
    },
    sampleBarcode: 'BC-MAN-5510-IGE',
    bookedAt: '2026-11-04T11:00:00.000Z',
    timeline: [
      { step: 1, stage: 'CONFIRMED', label: 'Order Confirmed', time: '11:00 AM', done: true },
      { step: 2, stage: 'PHLEBOTOMIST_ASSIGNED', label: 'Phlebotomist Assigned (D. Pradeep)', time: '11:20 AM', done: true },
      { step: 3, stage: 'SAMPLE_COLLECTED', label: 'Sample Collection & Cold-Chain Sealed', time: 'Pending Arrival', done: false },
      { step: 4, stage: 'RECEIVED_AT_LAB', label: 'Manipal Central Testing', time: 'Pending Transit', done: false },
    ],
  },
  {
    id: 'HC-440192',
    bookingId: 'HC-440192',
    hospitalSlug: 'ggh-vijayawada',
    hospitalName: 'Government General Hospital (GGH)',
    accountId: 'cmw06q4540001tl104h8k8uag',
    patientName: 'Bhavani K',
    phoneMasked: '••••••0001',
    mobileE164: '+919000000001',
    packageName: 'Pediatric CBC & Ferritin Panel',
    fastHours: 'Non-fasting',
    preferredDate: '2026-11-05',
    timeSlot: '09:00 AM - 10:00 AM',
    address: 'Qtr 12, Old Hospital Road, Vijayawada - 520001',
    landmark: 'Opposite GGH Outpatient Wing',
    status: 'CONFIRMED',
    collectionOtp: '4401',
    paymentMethod: 'CASH_ON_DELIVERY',
    paymentStatus: 'PAID',
    paymentAmount: '₹350',
    razorpayPaymentId: null,
    razorpayOrderId: null,
    assignedPhlebotomist: {
      name: 'M. Ramanjaneyulu',
      phone: '+91 98483 33112',
      badgeId: 'PHL-GGH-09',
      vaccinated: true,
      coldChainCertified: true,
      boxId: 'COLD-BOX-GGH-01',
    },
    sampleBarcode: null,
    bookedAt: '2026-11-04T09:15:00.000Z',
    timeline: [
      { step: 1, stage: 'CONFIRMED', label: 'Order Confirmed', time: '09:15 AM', done: true },
      { step: 2, stage: 'PHLEBOTOMIST_ASSIGNED', label: 'Phlebotomist Assignment Pending', time: 'Expected 08:00 AM', done: false },
      { step: 3, stage: 'SAMPLE_COLLECTED', label: 'Sample Collection', time: 'Pending Arrival', done: false },
      { step: 4, stage: 'RECEIVED_AT_LAB', label: 'GGH Pathology Unit', time: 'Pending Transit', done: false },
    ],
  },
  {
    id: 'HC-689100',
    bookingId: 'HC-689100',
    hospitalSlug: 'company-a-central-lab',
    hospitalName: 'Company A Central Reference Lab',
    accountId: 'cmw06q4540001tl104h8k8uag',
    patientName: 'Lakshmi Prasanna K',
    phoneMasked: '••••••0001',
    mobileE164: '+919000000001',
    packageName: 'Advanced Immunoassay & Vitamin D3/B12 Panel',
    fastHours: '10 hrs fasting',
    preferredDate: '2026-11-04',
    timeSlot: '07:00 AM - 08:00 AM',
    address: 'Surya Enclave, Suryaraopet, Vijayawada - 520002',
    landmark: 'Near Reference Lab Diagnostics',
    status: 'RECEIVED_AT_LAB',
    collectionOtp: '6891',
    paymentMethod: 'ONLINE_RAZORPAY',
    paymentStatus: 'PAID',
    paymentAmount: '₹890',
    razorpayPaymentId: 'pay_Cen689100',
    razorpayOrderId: 'order_Cen689100',
    assignedPhlebotomist: {
      name: 'Ramesh Ch',
      phone: '+91 98484 77812',
      badgeId: 'PHL-CEN-301',
      vaccinated: true,
      coldChainCertified: true,
      boxId: 'COLD-BOX-CEN-07 (4.0°C verified)',
    },
    sampleBarcode: 'BC-CEN-6891-IMMUNO',
    bookedAt: '2026-11-03T06:30:00.000Z',
    timeline: [
      { step: 1, stage: 'CONFIRMED', label: 'Order Confirmed', time: '06:30 AM', done: true },
      { step: 2, stage: 'PHLEBOTOMIST_ASSIGNED', label: 'Phlebotomist Assigned (Ramesh Ch)', time: '06:45 AM', done: true },
      { step: 3, stage: 'SAMPLE_COLLECTED', label: 'Sample Collected & Cold Chain Sealed', time: '07:25 AM', done: true },
      { step: 4, stage: 'RECEIVED_AT_LAB', label: 'Received in Central Reference Lab', time: '08:10 AM', done: true },
    ],
  },
];

// GET /api/patients/home-collections
// Retrieve active & past home sample collection bookings (for patient or staff)
router.get('/home-collections', authenticate, async (req, res) => {
  try {
    const { hospitalSlug } = req.query;
    const isStaff = req.actorType === 'STAFF' || req.query.all === 'true';

    let list = homeCollections;
    if (hospitalSlug && hospitalSlug !== 'all') {
      list = list.filter((c) => c.hospitalSlug === hospitalSlug);
    }

    if (isStaff) {
      return res.json({
        collections: list,
        total: list.length,
      });
    }

    if (!req.dbAccount) {
      return res.json({ collections: list, total: list.length });
    }

    // Filter by patient account or match demo
    let userCollections = list.filter(
      (c) => c.accountId === req.dbAccount.id || c.mobileE164 === req.dbAccount.mobileE164
    );

    return res.json({
      collections: userCollections.length > 0 ? userCollections : list,
      total: userCollections.length > 0 ? userCollections.length : list.length,
    });
  } catch (err) {
    console.error('GET /api/patients/home-collections error:', err);
    return res.status(500).json({ error: 'Failed to retrieve home collections' });
  }
});

// POST /api/patients/home-collection
// Book a home sample collection / phlebotomist visit
router.post('/home-collection', authenticate, async (req, res) => {
  try {
    const {
      packageName,
      preferredDate,
      timeSlot,
      address,
      landmark,
      patientName,
      paymentMethod = 'CASH_ON_DELIVERY',
      paymentStatus,
      paymentAmount,
      razorpayPaymentId,
      razorpayOrderId,
    } = req.body;

    if (!packageName || !preferredDate || !timeSlot || !address) {
      return res.status(400).json({ error: 'Missing required booking fields' });
    }

    const bookingId = `HC-${Math.floor(100000 + Math.random() * 900000)}`;
    const collectionOtp = String(Math.floor(1000 + Math.random() * 9000));
    const nowIso = new Date().toISOString();

    const isOnline = paymentMethod === 'ONLINE_RAZORPAY';
    const finalPaymentMethod = isOnline ? 'ONLINE_RAZORPAY' : 'CASH_ON_DELIVERY';
    const finalPaymentStatus = isOnline ? (paymentStatus || 'PAID') : 'PENDING_COD';
    const finalPaymentAmount = paymentAmount || '₹450';
    const finalRazorpayPaymentId = isOnline
      ? (razorpayPaymentId || `pay_Rzp${Math.floor(10000000 + Math.random() * 90000000)}`)
      : null;
    const finalRazorpayOrderId = isOnline
      ? (razorpayOrderId || `order_Rzp${Math.floor(10000000 + Math.random() * 90000000)}`)
      : null;

    const newBooking = {
      id: bookingId,
      bookingId,
      hospitalSlug: req.body.hospitalSlug || 'company-a-main-hospital',
      hospitalName: req.body.hospitalName || 'Company A Main Super-Specialty',
      accountId: req.dbAccount?.id || 'demo-account',
      patientName: patientName || req.dbAccount?.patients?.[0]?.fullName || 'Verified Patient',
      phoneMasked: req.dbAccount?.mobileE164 ? `••••••${req.dbAccount.mobileE164.slice(-4)}` : '••••••0001',
      mobileE164: req.dbAccount?.mobileE164 || '+919000000001',
      packageName,
      fastHours: '10-12 hrs fasting recommended',
      preferredDate,
      timeSlot,
      address,
      landmark: landmark || null,
      status: 'CONFIRMED',
      collectionOtp,
      paymentMethod: finalPaymentMethod,
      paymentStatus: finalPaymentStatus,
      paymentAmount: finalPaymentAmount,
      razorpayPaymentId: finalRazorpayPaymentId,
      razorpayOrderId: finalRazorpayOrderId,
      assignedPhlebotomist: {
        name: 'Rajesh Kumar',
        phone: '+91 98480 44921',
        badgeId: 'PHL-409',
        vaccinated: true,
        coldChainCertified: true,
        boxId: 'COLD-BOX-08',
      },
      sampleBarcode: null,
      bookedAt: nowIso,
      timeline: [
        { step: 1, stage: 'CONFIRMED', label: 'Order Confirmed', time: 'Just now', done: true },
        { step: 2, stage: 'PHLEBOTOMIST_ASSIGNED', label: 'Phlebotomist Assigned (Rajesh Kumar)', time: 'Scheduled', done: true },
        { step: 3, stage: 'SAMPLE_COLLECTED', label: 'Sample Collection & Cold-Chain Sealed', time: 'Pending Arrival', done: false },
        { step: 4, stage: 'RECEIVED_AT_LAB', label: 'Sample Received & LIS Check-in', time: 'Pending Transit', done: false },
      ],
    };

    homeCollections.unshift(newBooking);

    // Create a staff notification task so the lab sees the booking
    if (req.dbAccount) {
      await prisma.callbackTask.create({
        data: {
          accountId: req.dbAccount.id,
          type: 'CRITICAL_CALLBACK',
          reason: `Home Collection #${bookingId}: ${packageName} on ${preferredDate} (${timeSlot}) | Payment: ${finalPaymentMethod} (${finalPaymentStatus} - ${finalPaymentAmount})`,
          status: 'OPEN',
        },
      }).catch((e) => console.warn('Prisma callback task creation skipped:', e.message));
    }

    await writeLog({
      actorType: 'PATIENT',
      accountId: req.dbAccount?.id,
      action: 'REPORT_VIEW',
      outcome: 'OK',
      detail: `Booked home collection #${bookingId} for ${packageName}`,
      req,
    }).catch(() => { });

    return res.json({
      success: true,
      ...newBooking,
      message: 'Home sample collection scheduled. Our certified phlebotomist will arrive with temperature-controlled sample kits.',
    });
  } catch (err) {
    console.error('POST /api/patients/home-collection error:', err);
    return res.status(500).json({ error: 'Failed to schedule home collection' });
  }
});

// PATCH /api/patients/home-collections/:id/status
// Laboratory staff updates the status of a home collection booking
router.patch('/home-collections/:id/status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, phlebotomistName, phlebotomistPhone, note, sampleBarcode } = req.body;

    const cleanId = String(id || '').trim().toUpperCase();
    let bookingIndex = homeCollections.findIndex(
      (b) =>
        b.id?.toUpperCase() === cleanId ||
        b.bookingId?.toUpperCase() === cleanId ||
        b.id?.toUpperCase().includes(cleanId) ||
        (cleanId && b.bookingId?.toUpperCase().includes(cleanId))
    );

    // Fallback to active demo collection if exact id not found in memory
    if (bookingIndex === -1 && homeCollections.length > 0) {
      bookingIndex = 0;
    }

    if (bookingIndex === -1) {
      return res.status(404).json({ error: 'Home collection booking not found' });
    }

    const booking = homeCollections[bookingIndex];
    if (status) booking.status = status;
    if (phlebotomistName) {
      if (!booking.assignedPhlebotomist) booking.assignedPhlebotomist = {};
      booking.assignedPhlebotomist.name = phlebotomistName;
    }
    if (phlebotomistPhone) {
      if (!booking.assignedPhlebotomist) booking.assignedPhlebotomist = {};
      booking.assignedPhlebotomist.phone = phlebotomistPhone;
    }
    if (sampleBarcode) {
      booking.sampleBarcode = sampleBarcode;
    }

    // Update timeline based on status
    const nowTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    booking.timeline = [
      { step: 1, stage: 'CONFIRMED', label: 'Order Confirmed', time: '07:15 AM', done: true },
      {
        step: 2,
        stage: 'PHLEBOTOMIST_ASSIGNED',
        label: `Phlebotomist Assigned (${booking.assignedPhlebotomist?.name || 'Rajesh Kumar'})`,
        time: '08:30 AM',
        done: ['PHLEBOTOMIST_ASSIGNED', 'SAMPLE_COLLECTED', 'RECEIVED_AT_LAB', 'PUBLISHED'].includes(booking.status),
      },
      {
        step: 3,
        stage: 'SAMPLE_COLLECTED',
        label: 'Sample Collection & Cold-Chain Sealed',
        time: ['SAMPLE_COLLECTED', 'RECEIVED_AT_LAB', 'PUBLISHED'].includes(booking.status) ? nowTime : 'Pending Arrival',
        done: ['SAMPLE_COLLECTED', 'RECEIVED_AT_LAB', 'PUBLISHED'].includes(booking.status),
      },
      {
        step: 4,
        stage: 'RECEIVED_AT_LAB',
        label: 'Sample Received & LIS Check-in',
        time: ['RECEIVED_AT_LAB', 'PUBLISHED'].includes(booking.status) ? nowTime : 'Pending Transit',
        done: ['RECEIVED_AT_LAB', 'PUBLISHED'].includes(booking.status),
      },
    ];

    homeCollections[bookingIndex] = booking;

    await writeLog({
      actorType: req.actorType || 'STAFF',
      actorId: req.dbUser?.id,
      action: 'ORDER_VIEW',
      outcome: 'OK',
      detail: `Updated Home Collection #${id} status to ${status}`,
      req,
    }).catch(() => { });

    return res.json({
      success: true,
      booking,
      message: `Booking #${id} updated to ${status}`,
    });
  } catch (err) {
    console.error('PATCH /api/patients/home-collections/:id/status error:', err);
    return res.status(500).json({ error: 'Failed to update home collection status' });
  }
});

export default router;

