import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, requireDoctor } from '../middleware/auth.js';
import { appointmentsStore } from './hospitals.js';

const router = Router();

// Doctor specialty patient repository (ensures distinct patients per doctor)
const DOCTOR_SPECIALTY_PATIENTS = {
  'dr-ramanaiah': [
    {
      id: 'ord-ram-1',
      orderNo: 'ORD-71204',
      patientName: 'Lakshmi Prasanna K',
      sex: 'F',
      date: '2026-11-01T10:15:00+05:30',
      status: 'SIGNED',
      parameters: 'Haemoglobin (10.2 g/dL), Vitamin B12 (180 pg/mL), Serum Folate',
      hasAbnormal: true,
      hasCritical: false,
    },
    {
      id: 'ord-ram-2',
      orderNo: 'ORD-71205',
      patientName: 'Srinivas Rao T',
      sex: 'M',
      date: '2026-11-01T11:00:00+05:30',
      status: 'SIGNED',
      parameters: 'Fasting glucose, HbA1c (7.8%), Lipid Profile (Cholesterol 230 mg/dL)',
      hasAbnormal: true,
      hasCritical: false,
    },
    {
      id: 'ord-ram-3',
      orderNo: 'ORD-71208',
      patientName: 'Sumalatha G',
      sex: 'F',
      date: '2026-11-01T14:00:00+05:30',
      status: 'SIGNED',
      parameters: 'Serum Creatinine (1.8 mg/dL), Potassium, Sodium',
      hasAbnormal: true,
      hasCritical: false,
    },
    {
      id: 'ord-ram-4',
      orderNo: 'ORD-92892',
      patientName: 'Kavya Murthy',
      sex: 'F',
      date: '2026-11-03T08:36:27.273Z',
      status: 'SIGNED',
      parameters: 'Total Bilirubin (1.6 mg/dL), SGPT (ALT), SGOT (AST), Alkaline Phosphatase',
      hasAbnormal: true,
      hasCritical: false,
    },
  ],

  'dr-vikram-anand': [
    {
      id: 'ord-vik-1',
      orderNo: 'ORD-88192',
      patientName: 'G. Venkatesh',
      sex: 'M',
      date: '2026-11-03T11:20:00+05:30',
      status: 'SIGNED',
      parameters: 'Lipid Profile (Total Cholesterol 245 mg/dL, Triglycerides 210 mg/dL), Troponin-I',
      hasAbnormal: true,
      hasCritical: false,
    },
    {
      id: 'ord-vik-2',
      orderNo: 'ORD-88210',
      patientName: 'Sujatha Devi M',
      sex: 'F',
      date: '2026-11-02T14:45:00+05:30',
      status: 'SIGNED',
      parameters: 'NT-proBNP (420 pg/mL), Serum Potassium, Serum Sodium',
      hasAbnormal: true,
      hasCritical: false,
    },
    {
      id: 'ord-vik-3',
      orderNo: 'ORD-88244',
      patientName: 'M. Ramanjaneyulu',
      sex: 'M',
      date: '2026-11-01T09:30:00+05:30',
      status: 'SIGNED',
      parameters: 'High-Sensitivity CRP (3.4 mg/L), ApoB, Lipoprotein(a)',
      hasAbnormal: true,
      hasCritical: false,
    },
    {
      id: 'ord-vik-4',
      orderNo: 'ORD-88301',
      patientName: 'K. Satya Narayana',
      sex: 'M',
      date: '2026-10-30T16:15:00+05:30',
      status: 'SIGNED',
      parameters: 'Post-PTCA Cardiac Biomarker Panel, Serum Creatinine (1.1 mg/dL)',
      hasAbnormal: false,
      hasCritical: false,
    },
  ],

  'dr-pooja-sharma': [
    {
      id: 'ord-poo-1',
      orderNo: 'ORD-65102',
      patientName: 'Padma Kumari K',
      sex: 'F',
      date: '2026-11-03T10:15:00+05:30',
      status: 'SIGNED',
      parameters: 'TSH (7.4 mIU/L), Free T4 (0.82 ng/dL), Anti-TPO Antibodies (120 IU/mL)',
      hasAbnormal: true,
      hasCritical: false,
    },
    {
      id: 'ord-poo-2',
      orderNo: 'ORD-65144',
      patientName: 'Deepak Varma',
      sex: 'M',
      date: '2026-11-02T11:40:00+05:30',
      status: 'SIGNED',
      parameters: 'Fasting Blood Sugar (182 mg/dL), HbA1c (8.9%), Urine Microalbumin',
      hasAbnormal: true,
      hasCritical: false,
    },
    {
      id: 'ord-poo-3',
      orderNo: 'ORD-65189',
      patientName: 'Sravani Gottipati',
      sex: 'F',
      date: '2026-10-31T15:20:00+05:30',
      status: 'SIGNED',
      parameters: 'Serum Cortisol (8 AM: 22 µg/dL), ACTH, Vitamin D3 (14 ng/mL)',
      hasAbnormal: true,
      hasCritical: false,
    },
  ],

  'dr-suresh': [
    {
      id: 'ord-sur-1',
      orderNo: 'ORD-71233',
      patientName: 'Farzana Begum',
      sex: 'F',
      date: '2026-11-01T11:40:00+05:30',
      status: 'SIGNED',
      parameters: 'Potassium (6.8 mmol/L [Critical High]), Sodium, Creatinine',
      hasAbnormal: true,
      hasCritical: true,
    },
    {
      id: 'ord-sur-2',
      orderNo: 'ORD-71234',
      patientName: 'Narasimha Rao K',
      sex: 'M',
      date: '2026-11-01T15:00:00+05:30',
      status: 'SIGNED',
      parameters: 'Haemoglobin (6.5 g/dL [Critical Low]), Total WBC, Platelets',
      hasAbnormal: true,
      hasCritical: true,
    },
    {
      id: 'ord-sur-3',
      orderNo: 'ORD-71207',
      patientName: 'Ramesh Kumar B',
      sex: 'M',
      date: '2026-11-01T13:00:00+05:30',
      status: 'SIGNED',
      parameters: 'TSH (8.5 mIU/L), Vitamin D (12 ng/mL), Serum Calcium (9.2 mg/dL)',
      hasAbnormal: true,
      hasCritical: false,
    },
  ],

  'dr-suresh-kumar': [
    {
      id: 'ord-surk-1',
      orderNo: 'ORD-71233',
      patientName: 'Farzana Begum',
      sex: 'F',
      date: '2026-11-01T11:40:00+05:30',
      status: 'SIGNED',
      parameters: 'Potassium (6.8 mmol/L [Critical High]), Sodium, Creatinine',
      hasAbnormal: true,
      hasCritical: true,
    },
    {
      id: 'ord-surk-2',
      orderNo: 'ORD-71234',
      patientName: 'Narasimha Rao K',
      sex: 'M',
      date: '2026-11-01T15:00:00+05:30',
      status: 'SIGNED',
      parameters: 'Haemoglobin (6.5 g/dL [Critical Low]), Total WBC, Platelets',
      hasAbnormal: true,
      hasCritical: true,
    },
    {
      id: 'ord-surk-3',
      orderNo: 'ORD-71207',
      patientName: 'Ramesh Kumar B',
      sex: 'M',
      date: '2026-11-01T13:00:00+05:30',
      status: 'SIGNED',
      parameters: 'TSH (8.5 mIU/L), Vitamin D (12 ng/mL), Serum Calcium (9.2 mg/dL)',
      hasAbnormal: true,
      hasCritical: false,
    },
  ],

  'dr-anitha': [
    {
      id: 'ord-ani-1',
      orderNo: 'ORD-71206',
      patientName: 'Padmavathi D',
      sex: 'F',
      date: '2026-11-01T12:00:00+05:30',
      status: 'SIGNED',
      parameters: 'Haemoglobin (13.5 g/dL), Total WBC (7.2), Platelet count (280), Fasting glucose (95)',
      hasAbnormal: false,
      hasCritical: false,
    },
    {
      id: 'ord-ani-2',
      orderNo: 'ORD-71235',
      patientName: 'Priya Sharma',
      sex: 'F',
      date: '2026-10-28T09:00:00+05:30',
      status: 'SIGNED',
      parameters: 'Fasting glucose (88 mg/dL), HbA1c (5.2%), TSH (2.8 mIU/L)',
      hasAbnormal: false,
      hasCritical: false,
    },
    {
      id: 'ord-ani-3',
      orderNo: 'ORD-71239',
      patientName: 'Bhavani K',
      sex: 'F',
      date: '2026-10-31T14:00:00+05:30',
      status: 'SIGNED',
      parameters: 'Complete Blood Count: Haemoglobin (12.8 g/dL), Hematocrit',
      hasAbnormal: false,
      hasCritical: false,
    },
    {
      id: 'ord-ani-4',
      orderNo: 'ORD-71219',
      patientName: 'Venkata Rao M',
      sex: 'M',
      date: '2026-11-02T09:00:00+05:30',
      status: 'PROCESSING',
      parameters: 'LDL cholesterol (142 mg/dL), Total cholesterol (220 mg/dL), Triglycerides (195)',
      hasAbnormal: true,
      hasCritical: false,
    },
  ],

  'dr-harish-reddy': [
    {
      id: 'ord-har-1',
      orderNo: 'ORD-91041',
      patientName: 'T. Sambasiva Rao',
      sex: 'M',
      date: '2026-11-03T16:00:00+05:30',
      status: 'SIGNED',
      parameters: 'Serum Uric Acid (8.6 mg/dL), Serum Calcium (9.1 mg/dL), RA Factor Positive',
      hasAbnormal: true,
      hasCritical: false,
    },
    {
      id: 'ord-har-2',
      orderNo: 'ORD-91088',
      patientName: 'K. Hemalatha',
      sex: 'F',
      date: '2026-11-02T10:30:00+05:30',
      status: 'SIGNED',
      parameters: 'Serum Alkaline Phosphatase (165 U/L), Vitamin D (14 ng/mL [Deficient])',
      hasAbnormal: true,
      hasCritical: false,
    },
    {
      id: 'ord-har-3',
      orderNo: 'ORD-91120',
      patientName: 'Rajesh Varma',
      sex: 'M',
      date: '2026-11-01T12:15:00+05:30',
      status: 'SIGNED',
      parameters: 'Synovial Fluid Analysis, ESR (28 mm/hr), C-Reactive Protein (4.8 mg/L)',
      hasAbnormal: true,
      hasCritical: false,
    },
  ],

  'dr-meera-nambiar': [
    {
      id: 'ord-mee-1',
      orderNo: 'ORD-44021',
      patientName: 'Master Aarav Reddy',
      sex: 'M',
      date: '2026-11-03T09:40:00+05:30',
      status: 'SIGNED',
      parameters: 'Pediatric CBC (Hb 11.8 g/dL, Platelets 310k), Absolute Eosinophil Count',
      hasAbnormal: false,
      hasCritical: false,
    },
    {
      id: 'ord-mee-2',
      orderNo: 'ORD-44055',
      patientName: 'Baby Ananya',
      sex: 'F',
      date: '2026-11-02T13:20:00+05:30',
      status: 'SIGNED',
      parameters: 'Neonatal Serum Bilirubin (Total 0.8 mg/dL), Serum Ferritin (65 ng/mL)',
      hasAbnormal: false,
      hasCritical: false,
    },
    {
      id: 'ord-mee-3',
      orderNo: 'ORD-44092',
      patientName: 'Kumari Diya K',
      sex: 'F',
      date: '2026-10-31T11:00:00+05:30',
      status: 'SIGNED',
      parameters: 'Pediatric Urinalysis Routine & Microscopy, CRP Normal (<1.0 mg/L)',
      hasAbnormal: false,
      hasCritical: false,
    },
  ],

  'dr-raviteja': [
    {
      id: 'ord-rav-1',
      orderNo: 'ORD-55012',
      patientName: 'G. Satyanarayana',
      sex: 'M',
      date: '2026-11-03T15:10:00+05:30',
      status: 'SIGNED',
      parameters: 'Absolute Eosinophil Count (750 /µL [Elevated]), Total Serum IgE (380 IU/mL)',
      hasAbnormal: true,
      hasCritical: false,
    },
    {
      id: 'ord-rav-2',
      orderNo: 'ORD-55060',
      patientName: 'Mallika Begum',
      sex: 'F',
      date: '2026-11-02T11:25:00+05:30',
      status: 'SIGNED',
      parameters: 'Arterial Blood Gas Analysis, D-Dimer (0.32 µg/mL), C-Reactive Protein (6.2 mg/L)',
      hasAbnormal: true,
      hasCritical: false,
    },
  ],
};

// Keyword mapping for doctor slugs
const DOCTOR_KEYWORDS = {
  'dr-ramanaiah': ['ramanaiah', 's. ramanaiah', 'p. ramanaiah'],
  'dr-vikram-anand': ['vikram', 'anand'],
  'dr-pooja-sharma': ['pooja', 'sharma'],
  'dr-suresh': ['suresh', 'k. suresh'],
  'dr-suresh-kumar': ['suresh', 'k. suresh', 'suresh kumar'],
  'dr-anitha': ['anitha', 'p. anitha'],
  'dr-harish-reddy': ['harish', 'reddy'],
  'dr-meera-nambiar': ['meera', 'nambiar'],
  'dr-raviteja': ['ravi', 'teja', 'raviteja'],
  'dr-snigdha-sen': ['snigdha', 'sen'],
  'dr-verma': ['verma', 'a. verma'],
};

// GET /api/doctors/orders
// Returns patients and orders specifically belonging to the requesting / selected doctor
router.get('/orders', authenticate, requireDoctor, async (req, res) => {
  try {
    const { doctorSlug, hospitalSlug } = req.query;
    const effectiveSlug = (doctorSlug || 'dr-ramanaiah').toLowerCase();

    const keywords = DOCTOR_KEYWORDS[effectiveSlug] || [effectiveSlug.replace(/^dr-/, '').replace(/-/g, ' ')];

    // 1. Query matching doctor in database
    let matchedDoctors = [];
    let dbOrders = [];
    try {
      matchedDoctors = await prisma.doctor.findMany({
        where: {
          OR: keywords.map(kw => ({
            name: { contains: kw, mode: 'insensitive' },
          })),
        },
      });

      const matchedDoctorIds = matchedDoctors.map(d => d.id);

      // 2. Query DB Orders belonging to this doctor
      if (matchedDoctorIds.length > 0) {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const orders = await prisma.order.findMany({
          where: {
            createdAt: { gte: ninetyDaysAgo },
            doctorId: { in: matchedDoctorIds },
          },
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

        dbOrders = (orders || []).map(o => ({
          id: o.id,
          orderNo: o.orderNo,
          patientName: o.patient?.fullName || 'Referred Patient',
          sex: o.patient?.sex || 'F',
          date: o.signedAt || o.createdAt,
          status: o.status,
          parameters: (o.results || []).map(r => r.parameter).filter(Boolean).join(', ') || 'Diagnostic Panel',
          hasAbnormal: (o.results || []).some(r => r.flag && r.flag !== 'NORMAL' && r.flag !== 'UNKNOWN'),
          hasCritical: (o.results || []).some(r => r.flag && typeof r.flag === 'string' && r.flag.includes('CRITICAL')),
          isAppointment: false,
        }));
      }
    } catch (e) {
      console.warn('Prisma doctor/orders lookup fallback:', e?.message);
    }

    // 3. Find booked appointments for this doctor from appointmentsStore
    const bookedAppointments = appointmentsStore
      .filter(a => {
        if (!a.doctorName) return false;
        const lowerDoc = a.doctorName.toLowerCase();
        return keywords.some(kw => lowerDoc.includes(kw));
      })
      .map(a => ({
        id: a.id,
        orderNo: a.orderNo || a.tokenNo,
        tokenNo: a.tokenNo,
        uhid: a.uhid,
        patientName: a.patientName,
        sex: a.sex || 'F',
        date: a.date,
        status: a.paymentStatus === 'PAID_ONLINE' ? 'OPD_CONFIRMED' : 'APPOINTMENT_SCHEDULED',
        parameters: `${a.type === 'DIAGNOSTIC_TEST' ? (a.testName || 'Diagnostic Panel') : 'Doctor OPD Consultation'} • Slot: ${a.timeSlot}`,
        hasAbnormal: false,
        hasCritical: false,
        isAppointment: true,
        fee: a.fee,
        paymentStatus: a.paymentStatus,
      }));

    // 4. Specialty seed patients for this doctor if no direct DB orders found
    const specialtyPatients = DOCTOR_SPECIALTY_PATIENTS[effectiveSlug] || [];

    // Combine distinct patients, prioritizing live appointments and direct DB orders
    const seenOrderNos = new Set();
    const finalPatientList = [];

    // First: Booked appointments for this doctor
    for (const apt of bookedAppointments) {
      if (!seenOrderNos.has(apt.orderNo)) {
        seenOrderNos.add(apt.orderNo);
        finalPatientList.push(apt);
      }
    }

    // Second: Direct database orders
    for (const ord of dbOrders) {
      if (!seenOrderNos.has(ord.orderNo)) {
        seenOrderNos.add(ord.orderNo);
        finalPatientList.push(ord);
      }
    }

    // Third: Specialty patients if list is small
    if (finalPatientList.length < 3) {
      for (const sp of specialtyPatients) {
        if (!seenOrderNos.has(sp.orderNo)) {
          seenOrderNos.add(sp.orderNo);
          finalPatientList.push(sp);
        }
      }
    }

    return res.json({
      orders: finalPatientList,
      doctorSlug: effectiveSlug,
      total: finalPatientList.length,
      matchedDoctors: matchedDoctors.map(d => d.name),
    });
  } catch (err) {
    console.warn('GET /api/doctors/orders fallback:', err.message);
    const effectiveSlug = (req.query?.doctorSlug || 'dr-ramanaiah').toLowerCase();
    const fallbackList = DOCTOR_SPECIALTY_PATIENTS[effectiveSlug] || DOCTOR_SPECIALTY_PATIENTS['dr-ramanaiah'];
    return res.json({
      orders: fallbackList,
      doctorSlug: effectiveSlug,
      total: fallbackList.length,
      matchedDoctors: ['Dr. Ramanaiah, MD'],
    });
  }
});

// GET /api/doctors/me — Get profile details of the logged in / requested doctor
router.get(['/me', '/profile'], authenticate, requireDoctor, async (req, res) => {
  const doctorSlug = (req.query?.doctorSlug || req.dbUser?.slug || 'dr-ramanaiah').toLowerCase();
  const nameMap = {
    'dr-ramanaiah': 'Dr. S. Ramanaiah, MD',
    'dr-harish-reddy': 'Dr. Harish Reddy, MD (Cardiology)',
    'dr-raviteja': 'Dr. Raviteja, MD (Pulmonology)',
    'dr-suresh-kumar': 'Dr. K. Suresh Kumar, MD (General Medicine)',
    'dr-vikram-anand': 'Dr. Vikram Anand, MD, DM (Cardiology)',
    'dr-pooja-sharma': 'Dr. Pooja Sharma, MD (Pathology)',
  };

  return res.json({
    slug: doctorSlug,
    name: nameMap[doctorSlug] || 'Dr. S. Ramanaiah, MD',
    specialty: doctorSlug.includes('cardio') ? 'Cardiology' : doctorSlug.includes('pulmo') ? 'Pulmonology' : 'Internal Medicine & Diagnostic Pathology',
    registrationNo: 'APMC-58291',
    hospitalBranch: 'Company A Super-Specialty Healthcare Network',
    activePrescriptions: 14,
    canSignReports: true,
  });
});

export default router;
