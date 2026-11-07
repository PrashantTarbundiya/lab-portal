import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { writeLog } from '../lib/audit.js';

const router = Router();

// In-memory persistent doctor credentialing & verification store for hospital network
let doctorsStore = [
  {
    id: 'doc-suresh',
    name: 'Dr. K. Suresh',
    email: 'doctor@demo.local',
    phone: '+91 94401 22891',
    nmcRegNo: 'MCI-2018-84920',
    stateCouncil: 'Andhra Pradesh Medical Council (APMC)',
    specialization: 'Internal Medicine & Critical Care',
    degrees: 'MBBS, MD (Gen Med), FICP',
    hospitalBranch: 'Main Super-Specialty Hospital - Central Wing',
    department: 'General Medicine & ICU',
    verificationStatus: 'VERIFIED',
    verifiedAt: '2026-01-15T10:00:00.000Z',
    verifiedBy: 'Dr. M. Ramanathan, CMO (Super Admin)',
    licenseExpiry: '2029-12-31',
    canSignReports: true,
    ordersCount: 42,
    submittedAt: '2026-01-10T08:30:00.000Z',
  },
  {
    id: 'doc-verma',
    name: 'Dr. A. Verma',
    email: 'pathologist@demo.local',
    phone: '+91 98480 33190',
    nmcRegNo: 'MCI-2021-19284',
    stateCouncil: 'Delhi Medical Council (DMC)',
    specialization: 'Clinical Pathology & Laboratory Medicine',
    degrees: 'MBBS, MD (Pathology), MIAC',
    hospitalBranch: 'Central Automated Core Diagnostics Laboratory',
    department: 'Department of Clinical Biochemistry & Hematology',
    verificationStatus: 'VERIFIED',
    verifiedAt: '2026-02-01T11:15:00.000Z',
    verifiedBy: 'Dr. M. Ramanathan, CMO (Super Admin)',
    licenseExpiry: '2031-06-30',
    canSignReports: true,
    ordersCount: 88,
    submittedAt: '2026-01-25T09:00:00.000Z',
  },
  {
    id: 'doc-pooja',
    name: 'Dr. Pooja Sharma',
    email: 'drpooja@demo.local',
    phone: '+91 99881 77210',
    nmcRegNo: 'NMC-2024-51029',
    stateCouncil: 'Karnataka Medical Council (KMC)',
    specialization: 'Endocrinology & Diabetology',
    degrees: 'MBBS, DNB (Endocrinology)',
    hospitalBranch: 'City Care OPD & Wellness Center',
    department: 'Endocrine & Metabolic Clinic',
    verificationStatus: 'PENDING_VERIFICATION',
    verifiedAt: null,
    verifiedBy: null,
    licenseExpiry: '2034-03-31',
    canSignReports: false,
    ordersCount: 14,
    submittedAt: '2026-11-01T14:20:00.000Z',
    notes: 'Medical Council degree certificate submitted. Awaiting Super Admin CMO verification check.',
  },
  {
    id: 'doc-vikram',
    name: 'Dr. Vikram Anand',
    email: 'vikram.anand@demo.local',
    phone: '+91 97110 55412',
    nmcRegNo: 'NMC-2023-77401',
    stateCouncil: 'Maharashtra Medical Council (MMC)',
    specialization: 'Cardiology & Vascular Medicine',
    degrees: 'MBBS, MD, DM (Cardiology)',
    hospitalBranch: 'Main Super-Specialty Hospital - Cardiac Tower',
    department: 'Cardiovascular Sciences',
    verificationStatus: 'PENDING_VERIFICATION',
    verifiedAt: null,
    verifiedBy: null,
    licenseExpiry: '2033-08-15',
    canSignReports: false,
    ordersCount: 8,
    submittedAt: '2026-11-02T10:45:00.000Z',
    notes: 'State council reciprocity verification document pending.',
  },
  {
    id: 'doc-rajesh',
    name: 'Dr. Rajesh Varma',
    email: 'rajesh.varma@demo.local',
    phone: '+91 94411 90876',
    nmcRegNo: 'SMC-2015-09121',
    stateCouncil: 'Telangana State Medical Council (TSMC)',
    specialization: 'General Practice',
    degrees: 'MBBS',
    hospitalBranch: 'Rural Satellite Clinic 4',
    department: 'Outpatient Family Medicine',
    verificationStatus: 'SUSPENDED',
    verifiedAt: '2025-05-10T12:00:00.000Z',
    verifiedBy: 'Super Admin',
    licenseExpiry: '2025-10-31',
    canSignReports: false,
    ordersCount: 22,
    submittedAt: '2025-05-01T09:00:00.000Z',
    notes: 'License renewal certification overdue. Suspended by Super Admin until renewal is submitted.',
  },
];

// GET /api/admin/overview or /api/admin/metrics — High-level hospital & diagnostic network stats
router.get(['/overview', '/metrics'], authenticate, requireAdmin, async (_req, res) => {
  const total = doctorsStore.length;
  const verified = doctorsStore.filter(d => d.verificationStatus === 'VERIFIED').length;
  const pending = doctorsStore.filter(d => d.verificationStatus === 'PENDING_VERIFICATION').length;
  const suspended = doctorsStore.filter(d => d.verificationStatus === 'SUSPENDED').length;

  return res.json({
    hospitalName: 'Company A Healthcare & Academic Medical Center',
    accreditations: ['NABL ISO 15189:2022', 'NABH Digital Health', 'ABDM Gateway Grade 1'],
    stats: {
      totalDoctors: total,
      verifiedDoctors: verified,
      pendingVerification: pending,
      suspendedDoctors: suspended,
      activeHospitalBeds: 450,
      dailyDiagnosticTests: 1240,
      activeLaboratories: 3,
      avgTurnaroundHours: 1.8,
    },
    superAdmin: {
      name: 'Dr. M. Ramanathan, MD, FRCPath',
      role: 'Chief Medical Officer (CMO) & Super Admin',
      email: 'cmo@company-a-hospital.org',
    },
  });
});

// GET /api/admin/doctors — List of doctors with NMC verification details
router.get('/doctors', authenticate, requireAdmin, async (req, res) => {
  const { status, search } = req.query;
  let filtered = [...doctorsStore];

  if (status && status !== 'ALL') {
    filtered = filtered.filter(d => d.verificationStatus === status);
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      d =>
        d.name.toLowerCase().includes(q) ||
        d.nmcRegNo.toLowerCase().includes(q) ||
        d.specialization.toLowerCase().includes(q) ||
        d.hospitalBranch.toLowerCase().includes(q)
    );
  }

  return res.json({
    doctors: filtered,
    total: filtered.length,
    counts: {
      all: doctorsStore.length,
      verified: doctorsStore.filter(d => d.verificationStatus === 'VERIFIED').length,
      pending: doctorsStore.filter(d => d.verificationStatus === 'PENDING_VERIFICATION').length,
      suspended: doctorsStore.filter(d => d.verificationStatus === 'SUSPENDED').length,
    },
  });
});

// PATCH /api/admin/doctors/:id/verify — Approve, Reject, or Suspend doctor
router.patch('/doctors/:id/verify', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  const validStatuses = ['VERIFIED', 'PENDING_VERIFICATION', 'SUSPENDED'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  const doctor = doctorsStore.find(d => d.id === id);
  if (!doctor) {
    return res.status(404).json({ error: 'Doctor record not found' });
  }

  doctor.verificationStatus = status;
  doctor.canSignReports = status === 'VERIFIED';
  doctor.verifiedAt = status === 'VERIFIED' ? new Date().toISOString() : null;
  doctor.verifiedBy = status === 'VERIFIED' ? 'Dr. M. Ramanathan, CMO (Super Admin)' : null;
  if (notes) doctor.notes = notes;

  await writeLog({
    actorType: 'STAFF',
    actorId: 'admin-super-1',
    action: 'TASK_DONE',
    outcome: 'OK',
    detail: `Doctor ${doctor.name} (${doctor.nmcRegNo}) verification updated to ${status}`,
    req,
  });

  return res.json({
    success: true,
    message: `Doctor ${doctor.name} is now ${status}`,
    doctor,
  });
});

// POST /api/admin/doctors — Super Admin manually onboards a doctor
router.post('/doctors', authenticate, requireAdmin, async (req, res) => {
  const { name, email, phone, nmcRegNo, stateCouncil, specialization, degrees, hospitalBranch, department } = req.body;

  if (!name || !nmcRegNo) {
    return res.status(400).json({ error: 'Doctor name and NMC Registration Number are required' });
  }

  const newDoc = {
    id: `doc-${Date.now().toString(36)}`,
    name,
    email: email || `${name.toLowerCase().replace(/[^a-z]/g, '')}@hospital.local`,
    phone: phone || '+91 90000 00000',
    nmcRegNo,
    stateCouncil: stateCouncil || 'National Medical Commission',
    specialization: specialization || 'General Medicine',
    degrees: degrees || 'MBBS',
    hospitalBranch: hospitalBranch || 'Main Super-Specialty Hospital',
    department: department || 'Clinical Services',
    verificationStatus: 'VERIFIED',
    verifiedAt: new Date().toISOString(),
    verifiedBy: 'Dr. M. Ramanathan, CMO (Super Admin)',
    licenseExpiry: '2030-12-31',
    canSignReports: true,
    ordersCount: 0,
    submittedAt: new Date().toISOString(),
  };

  doctorsStore.unshift(newDoc);

  await writeLog({
    actorType: 'STAFF',
    actorId: 'admin-super-1',
    action: 'IMPORT',
    outcome: 'OK',
    detail: `Super Admin onboarded doctor ${name} (Reg #${nmcRegNo})`,
    req,
  });

  return res.status(201).json({
    success: true,
    doctor: newDoc,
  });
});

// GET /api/admin/facilities — List hospital network facilities
router.get('/facilities', authenticate, requireAdmin, async (_req, res) => {
  return res.json({
    facilities: [
      {
        id: 'fac-1',
        name: 'Company A Main Super-Specialty Hospital',
        type: 'Tertiary Care Hospital (450 Beds)',
        location: 'MG Road Healthcare Enclave, Vijayawada',
        status: 'OPERATIONAL',
        accreditation: 'NABL ISO 15189 & NABH Gold',
        labDirector: 'Dr. A. Verma, MD',
        activeTechnicians: 16,
      },
      {
        id: 'fac-2',
        name: 'Central Automated Core Diagnostics Laboratory',
        type: 'Automated Reference Core Lab',
        location: 'Tech Park Biotech Zone, Vijayawada',
        status: 'OPERATIONAL (24x7 High-Throughput)',
        accreditation: 'NABL ISO 15189:2022',
        labDirector: 'Dr. M. Ramanathan, CMO',
        activeTechnicians: 24,
      },
      {
        id: 'fac-3',
        name: 'City Care OPD & Wellness Center',
        type: 'Satellite Outpatient Diagnostic Hub',
        location: 'Benz Circle Commercial Wing',
        status: 'OPERATIONAL',
        accreditation: 'NABL Collection & Testing Center',
        labDirector: 'Dr. K. Suresh, MD',
        activeTechnicians: 8,
      },
    ],
  });
});

// GET /api/admin/hospitals/:slug/analytics — Hospital-specific administrative metrics
router.get(['/hospitals/:slug/analytics', '/analytics'], authenticate, requireAdmin, async (req, res) => {
  const { slug } = req.params;
  return res.json({
    hospitalSlug: slug || 'apollo-hospital-vijayawada',
    timestamp: new Date().toISOString(),
    metrics: {
      opdVisitsToday: 342,
      criticalAlertsResolved: 14,
      avgTurnaroundTimeMins: 42,
      tatAdherenceRate: '98.6%',
      nablAuditReadiness: '100% Compliant',
      activePhlebotomists: 18,
      pendingAccessions: 7,
      samplesAnalyzedToday: 890,
    },
    weeklyTrend: [
      { day: 'Mon', samples: 780, tatMinutes: 44 },
      { day: 'Tue', samples: 812, tatMinutes: 41 },
      { day: 'Wed', samples: 840, tatMinutes: 40 },
      { day: 'Thu', samples: 790, tatMinutes: 43 },
      { day: 'Fri', samples: 890, tatMinutes: 39 },
      { day: 'Sat', samples: 920, tatMinutes: 45 },
      { day: 'Sun', samples: 610, tatMinutes: 38 },
    ],
  });
});

export { doctorsStore };
export default router;
