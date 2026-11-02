import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const prisma = new PrismaClient();

const HASH_SECRET = process.env.APP_HASH_SECRET || 'dev-secret';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'Demo@12345';
const LAB_NAME = process.env.LAB_NAME || 'Company A Diagnostics';

function hashMobile(mobile) {
  return crypto.createHmac('sha256', HASH_SECRET).update(mobile).digest('hex');
}

function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function generateTokenPair() {
  const raw = crypto.randomBytes(32).toString('base64url');
  return { raw, hash: hashToken(raw) };
}

async function generatePDF(orderNo, patientName, results, doctorName) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontSize = 10;
  let y = 790;

  // Header
  page.drawText(LAB_NAME, { x: 50, y, font: boldFont, size: 16, color: rgb(0.06, 0.37, 0.34) });
  y -= 20;
  page.drawText('NABL Accredited Laboratory | Vijayawada, Andhra Pradesh', { x: 50, y, font, size: 8, color: rgb(0.4, 0.4, 0.4) });
  y -= 30;

  // Line
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 1, color: rgb(0.9, 0.9, 0.9) });
  y -= 20;

  // Patient info
  page.drawText(`Order: ${orderNo}`, { x: 50, y, font: boldFont, size: fontSize });
  page.drawText(`Date: ${new Date().toLocaleDateString('en-IN')}`, { x: 350, y, font, size: fontSize });
  y -= 15;
  page.drawText(`Patient: ${patientName}`, { x: 50, y, font, size: fontSize });
  if (doctorName) {
    page.drawText(`Ref. Doctor: ${doctorName}`, { x: 350, y, font, size: fontSize });
  }
  y -= 25;

  // Table header
  page.drawRectangle({ x: 50, y: y - 2, width: 495, height: 18, color: rgb(0.95, 0.96, 0.97) });
  page.drawText('Parameter', { x: 55, y: y + 2, font: boldFont, size: 9 });
  page.drawText('Result', { x: 250, y: y + 2, font: boldFont, size: 9 });
  page.drawText('Unit', { x: 340, y: y + 2, font: boldFont, size: 9 });
  page.drawText('Reference', { x: 420, y: y + 2, font: boldFont, size: 9 });
  y -= 20;

  // Results
  for (const r of results) {
    const isAbnormal = r.flag && r.flag !== 'NORMAL' && r.flag !== 'UNKNOWN';
    const textColor = isAbnormal ? rgb(0.7, 0.11, 0.11) : rgb(0.07, 0.09, 0.15);
    page.drawText(r.parameter || '', { x: 55, y, font, size: fontSize, color: textColor, maxWidth: 180 });
    page.drawText(r.value || '', { x: 250, y, font: isAbnormal ? boldFont : font, size: fontSize, color: textColor });
    page.drawText(r.unit || '', { x: 340, y, font, size: fontSize, color: textColor });
    page.drawText(r.refRangeRaw || '', { x: 420, y, font, size: fontSize, color: rgb(0.4, 0.4, 0.4) });
    y -= 15;
  }

  y -= 20;
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 1, color: rgb(0.9, 0.9, 0.9) });
  y -= 25;

  page.drawText('Pathologist Signature: ___________________', { x: 50, y, font, size: 9, color: rgb(0.4, 0.4, 0.4) });
  y -= 15;
  page.drawText('This is a computer-generated report.', { x: 50, y, font, size: 8, color: rgb(0.6, 0.6, 0.6) });

  return Buffer.from(await doc.save());
}

async function seed() {
  console.log('🌱 Seeding lab portal database...');

  // Clean existing data (in reverse dependency order)
  await prisma.accessLog.deleteMany();
  await prisma.summaryFlag.deleteMany();
  await prisma.summary.deleteMany();
  await prisma.callbackTask.deleteMany();
  await prisma.message.deleteMany();
  await prisma.linkToken.deleteMany();
  await prisma.importRun.deleteMany();
  await prisma.result.deleteMany();
  await prisma.order.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.criticalRule.deleteMany();
  await prisma.summaryTemplate.deleteMany();

  // ─── Critical Rules ───
  console.log('  Creating critical rules...');
  const criticalRules = [
    { parameter: 'Potassium', criticalLow: 2.5, criticalHigh: 6.5 },
    { parameter: 'Sodium', criticalLow: 120, criticalHigh: 160 },
    { parameter: 'Haemoglobin', criticalLow: 7.0, criticalHigh: 20.0 },
    { parameter: 'Glucose, fasting', criticalLow: 40, criticalHigh: 450 },
    { parameter: 'Fasting glucose', criticalLow: 40, criticalHigh: 450 },
    { parameter: 'Platelet count', criticalLow: 20, criticalHigh: 1000 },
    { parameter: 'Calcium', criticalLow: 6.0, criticalHigh: 13.0 },
    { parameter: 'Creatinine', criticalLow: null, criticalHigh: 10.0 },
    { parameter: 'TSH', criticalLow: null, criticalHigh: 50 },
    { parameter: 'Total WBC', criticalLow: 2.0, criticalHigh: 30.0 },
    { parameter: 'INR', criticalLow: null, criticalHigh: 5.0 },
  ];
  for (const rule of criticalRules) {
    await prisma.criticalRule.create({ data: rule });
  }

  // ─── Doctors ───
  console.log('  Creating doctors...');
  const doctors = await Promise.all([
    prisma.doctor.create({ data: { name: 'Dr. S. Ramanaiah' } }),
    prisma.doctor.create({ data: { name: 'Dr. P. Anitha' } }),
    prisma.doctor.create({ data: { name: 'Dr. K. Suresh' } }),
    prisma.doctor.create({ data: { name: 'Dr. M. Lakshmi' } }),
    prisma.doctor.create({ data: { name: 'Dr. V. Prasad' } }),
    prisma.doctor.create({ data: { name: 'Dr. R. Naidu' } }),
    prisma.doctor.create({ data: { name: 'Dr. B. Sarojini' } }),
    prisma.doctor.create({ data: { name: 'Dr. G. Krishna' } }),
  ]);
  const [drRamanaiah, drAnitha, drSuresh, drLakshmi, drPrasad, drNaidu, drSarojini, drKrishna] = doctors;

  // ─── Staff Users ───
  console.log('  Creating staff users...');
  const staff1 = await prisma.user.create({
    data: { email: 'frontdesk@demo.local', name: 'Priya Reddy', role: 'FRONT_DESK' },
  });
  const staff2 = await prisma.user.create({
    data: { email: 'frontdesk2@demo.local', name: 'Kavitha Nair', role: 'FRONT_DESK' },
  });
  const doctorUser = await prisma.user.create({
    data: { email: 'doctor@demo.local', name: 'Dr. S. Ramanaiah', role: 'DOCTOR', doctorId: drRamanaiah.id },
  });

  // ─── Accounts (mobile numbers) ───
  console.log('  Creating accounts and patients...');

  const accountsData = [
    { mobile: '+919000000001', lang: 'te', patients: [
      { fullName: 'Lakshmi Prasanna K', sex: 'F', dob: new Date('1978-04-12'), relation: 'SELF' },
      { fullName: 'Srinivas Rao T', sex: 'M', dob: new Date('1975-08-22'), relation: 'SPOUSE' },
      { fullName: 'Bhavani K', sex: 'F', dob: new Date('2005-11-25'), relation: 'CHILD' },
      { fullName: 'Raghavendra T', sex: 'M', dob: new Date('2008-03-10'), relation: 'CHILD' },
    ]},
    { mobile: '+919000000002', lang: 'en', patients: [
      { fullName: 'Venkata Rao M', sex: 'M', dob: new Date('1962-09-03'), relation: 'SELF' },
    ]},
    { mobile: '+919000000003', lang: 'hi', patients: [
      { fullName: 'Farzana Begum', sex: 'F', dob: new Date('1990-01-20'), relation: 'SELF' },
    ]},
    { mobile: '+919000000004', lang: 'te', patients: [
      { fullName: 'Padmavathi D', sex: 'F', dob: new Date('1955-03-18'), relation: 'SELF' },
      { fullName: 'Kavitha M', sex: 'F', dob: new Date('1980-09-10'), relation: 'CHILD' },
      { fullName: 'Suresh D', sex: 'M', dob: new Date('1953-06-22'), relation: 'SPOUSE' },
    ]},
    { mobile: '+919000000005', lang: 'en', patients: [
      { fullName: 'Ramesh Kumar B', sex: 'M', dob: new Date('1968-11-05'), relation: 'SELF' },
    ]},
    { mobile: '+919000000006', lang: 'te', patients: [
      { fullName: 'Sumalatha G', sex: 'F', dob: new Date('1982-07-14'), relation: 'SELF' },
    ]},
    { mobile: '+919000000007', lang: 'en', patients: [
      { fullName: 'Anusha P', sex: 'F', dob: new Date('1995-05-28'), relation: 'SELF' },
    ]},
    { mobile: '+919000000008', lang: 'te', patients: [
      { fullName: 'Narasimha Rao K', sex: 'M', dob: new Date('1958-12-01'), relation: 'SELF' },
      { fullName: 'Saraswathi K', sex: 'F', dob: new Date('1960-04-15'), relation: 'SPOUSE' },
      { fullName: 'Srikanth K', sex: 'M', dob: new Date('1985-08-20'), relation: 'CHILD' },
    ]},
    { mobile: '+919000000009', lang: 'en', patients: [
      { fullName: 'Priya Sharma', sex: 'F', dob: new Date('1988-06-15'), relation: 'SELF' },
    ]},
    { mobile: '+919000000010', lang: 'en', patients: [
      { fullName: 'Rajesh Varma', sex: 'M', dob: new Date('1972-02-20'), relation: 'SELF' },
    ]},
    { mobile: '+919000000011', lang: 'te', patients: [
      { fullName: 'Ravi Teja S', sex: 'M', dob: new Date('1992-04-03'), relation: 'SELF' },
    ]},
    { mobile: '+919000000012', lang: 'hi', patients: [
      { fullName: 'Mohammed Ismail', sex: 'M', dob: new Date('1965-07-30'), relation: 'SELF' },
      { fullName: 'Ayesha Begum', sex: 'F', dob: new Date('1968-11-12'), relation: 'SPOUSE' },
      { fullName: 'Faiz Mohammed', sex: 'M', dob: new Date('1993-02-18'), relation: 'CHILD' },
    ]},
    { mobile: '+919000000013', lang: 'en', patients: [
      { fullName: 'Satya Narayana V', sex: 'M', dob: new Date('1970-01-25'), relation: 'SELF' },
    ]},
    { mobile: '+919000000014', lang: 'te', patients: [
      { fullName: 'Durga Devi P', sex: 'F', dob: new Date('1960-05-08'), relation: 'SELF' },
    ]},
    { mobile: '+919000000015', lang: 'en', patients: [
      { fullName: 'Arun Kumar G', sex: 'M', dob: new Date('1985-09-14'), relation: 'SELF' },
    ]},
    { mobile: '+919000000016', lang: 'te', patients: [
      { fullName: 'Manga Rani T', sex: 'F', dob: new Date('1978-12-03'), relation: 'SELF' },
      { fullName: 'Chandra Sekhar T', sex: 'M', dob: new Date('1975-03-20'), relation: 'SPOUSE' },
    ]},
    { mobile: '+919000000017', lang: 'en', patients: [
      { fullName: 'Sanjay Reddy B', sex: 'M', dob: new Date('1990-07-22'), relation: 'SELF' },
    ]},
    { mobile: '+919000000018', lang: 'hi', patients: [
      { fullName: 'Deepika Singh', sex: 'F', dob: new Date('1995-10-30'), relation: 'SELF' },
    ]},
  ];

  const accounts = {};
  const patientsByName = {};

  for (const ad of accountsData) {
    const account = await prisma.account.create({
      data: {
        mobileE164: ad.mobile,
        mobileHash: hashMobile(ad.mobile),
        preferredLang: ad.lang,
        consentVersion: '1.0',
        consentAt: new Date('2026-10-15'),
      },
    });
    accounts[ad.mobile] = account;

    for (const pd of ad.patients) {
      const patient = await prisma.patient.create({
        data: { accountId: account.id, ...pd },
      });
      patientsByName[pd.fullName] = { patient, account };
    }
  }

  // ─── Orders ───
  console.log('  Creating orders and results...');

  const ordersData = [
    // Scenario 1: Normal report, all values normal
    {
      orderNo: 'ORD-71206', patientName: 'Padmavathi D', doctor: drAnitha,
      status: 'SIGNED', signedAt: new Date('2026-11-01T12:00:00+05:30'),
      results: [
        { parameter: 'Haemoglobin', unit: 'g/dL', value: '13.5', refRangeRaw: '12.0-15.5', flag: 'NORMAL' },
        { parameter: 'Total WBC', unit: '10^3/µL', value: '7.2', refRangeRaw: '4.0-11.0', flag: 'NORMAL' },
        { parameter: 'Platelet count', unit: '10^3/µL', value: '280', refRangeRaw: '150-400', flag: 'NORMAL' },
        { parameter: 'Fasting glucose', unit: 'mg/dL', value: '95', refRangeRaw: '70-100', flag: 'NORMAL' },
      ],
    },
    // Scenario 2: Low haemoglobin (template summary)
    {
      orderNo: 'ORD-71204', patientName: 'Lakshmi Prasanna K', doctor: drRamanaiah,
      status: 'SIGNED', signedAt: new Date('2026-11-01T10:15:00+05:30'),
      results: [
        { parameter: 'Haemoglobin', unit: 'g/dL', value: '10.2', refRangeRaw: '12.0-15.5', flag: 'LOW', valueNum: 10.2, refLow: 12.0, refHigh: 15.5 },
        { parameter: 'Total WBC', unit: '10^3/µL', value: '6.5', refRangeRaw: '4.0-11.0', flag: 'NORMAL' },
        { parameter: 'Platelet count', unit: '10^3/µL', value: '250', refRangeRaw: '150-400', flag: 'NORMAL' },
        { parameter: 'RBC count', unit: '10^6/µL', value: '4.1', refRangeRaw: '3.8-5.2', flag: 'NORMAL' },
      ],
    },
    // Scenario 3: Several out-of-range, one without template (AI/fallback)
    {
      orderNo: 'ORD-71205', patientName: 'Srinivas Rao T', doctor: drRamanaiah,
      status: 'SIGNED', signedAt: new Date('2026-11-01T11:00:00+05:30'),
      results: [
        { parameter: 'Fasting glucose', unit: 'mg/dL', value: '145', refRangeRaw: '70-100', flag: 'HIGH', valueNum: 145, refLow: 70, refHigh: 100 },
        { parameter: 'HbA1c', unit: '%', value: '7.8', refRangeRaw: '<5.7', flag: 'HIGH', valueNum: 7.8, refHigh: 5.7 },
        { parameter: 'Total cholesterol', unit: 'mg/dL', value: '230', refRangeRaw: '<200', flag: 'HIGH', valueNum: 230, refHigh: 200 },
        { parameter: 'LDL cholesterol', unit: 'mg/dL', value: '155', refRangeRaw: '0-100', flag: 'HIGH', valueNum: 155, refLow: 0, refHigh: 100 },
        { parameter: 'HDL cholesterol', unit: 'mg/dL', value: '35', refRangeRaw: '>40', flag: 'LOW', valueNum: 35, refLow: 40 },
        { parameter: 'Triglycerides', unit: 'mg/dL', value: '280', refRangeRaw: '<150', flag: 'HIGH', valueNum: 280, refHigh: 150 },
      ],
    },
    // Scenario 4: Critical potassium — held, callback OPEN
    {
      orderNo: 'ORD-71233', patientName: 'Farzana Begum', doctor: drSuresh,
      status: 'SIGNED', signedAt: new Date('2026-11-01T11:40:00+05:30'),
      hasCritical: true,
      results: [
        { parameter: 'Potassium', unit: 'mmol/L', value: '6.8', refRangeRaw: '3.5-5.1', flag: 'CRITICAL_HIGH', valueNum: 6.8, refLow: 3.5, refHigh: 5.1 },
        { parameter: 'Sodium', unit: 'mmol/L', value: '138', refRangeRaw: '136-145', flag: 'NORMAL' },
        { parameter: 'Creatinine', unit: 'mg/dL', value: '0.9', refRangeRaw: '0.6-1.2', flag: 'NORMAL' },
      ],
      callbackTask: { type: 'CRITICAL_CALLBACK', parameter: 'Potassium', value: '6.8', reason: 'Critical high potassium (6.8 mmol/L, critical threshold: 6.5)', status: 'OPEN' },
    },
    // Scenario 5: Critical with callback DONE, link released
    {
      orderNo: 'ORD-71234', patientName: 'Narasimha Rao K', doctor: drSuresh,
      status: 'SIGNED', signedAt: new Date('2026-11-01T15:00:00+05:30'),
      hasCritical: true,
      results: [
        { parameter: 'Haemoglobin', unit: 'g/dL', value: '6.5', refRangeRaw: '13.0-17.0', flag: 'CRITICAL_LOW', valueNum: 6.5, refLow: 13.0, refHigh: 17.0 },
        { parameter: 'Total WBC', unit: '10^3/µL', value: '5.8', refRangeRaw: '4.0-11.0', flag: 'NORMAL' },
      ],
      callbackTask: { type: 'CRITICAL_CALLBACK', parameter: 'Haemoglobin', value: '6.5', reason: 'Critical low haemoglobin (6.5 g/dL, critical threshold: 7.0)', status: 'DONE', note: 'Patient informed, advised immediate hospital visit. Spoke to Dr. K. Suresh.' },
    },
    // Scenario 6: Link expired (created 5 days ago), resent (new token)
    {
      orderNo: 'ORD-71235', patientName: 'Priya Sharma', doctor: drAnitha,
      status: 'SIGNED', signedAt: new Date('2026-10-28T09:00:00+05:30'),
      results: [
        { parameter: 'Fasting glucose', unit: 'mg/dL', value: '88', refRangeRaw: '70-100', flag: 'NORMAL' },
        { parameter: 'HbA1c', unit: '%', value: '5.2', refRangeRaw: '<5.7', flag: 'NORMAL' },
        { parameter: 'TSH', unit: 'mIU/L', value: '2.8', refRangeRaw: '0.4-4.0', flag: 'NORMAL' },
      ],
      expiredLink: true,
    },
    // Scenario 7: Failed WhatsApp delivery with SMS fallback
    {
      orderNo: 'ORD-71208', patientName: 'Sumalatha G', doctor: drRamanaiah,
      status: 'SIGNED', signedAt: new Date('2026-11-01T14:00:00+05:30'),
      results: [
        { parameter: 'Creatinine', unit: 'mg/dL', value: '1.8', refRangeRaw: '0.6-1.2', flag: 'HIGH', valueNum: 1.8, refLow: 0.6, refHigh: 1.2 },
        { parameter: 'Potassium', unit: 'mmol/L', value: '4.8', refRangeRaw: '3.5-5.1', flag: 'NORMAL' },
        { parameter: 'Sodium', unit: 'mmol/L', value: '140', refRangeRaw: '136-145', flag: 'NORMAL' },
      ],
      failedMessage: true,
    },
    // Scenario 8: Summary flagged by patient
    {
      orderNo: 'ORD-71207', patientName: 'Ramesh Kumar B', doctor: drSuresh,
      status: 'SIGNED', signedAt: new Date('2026-11-01T13:00:00+05:30'),
      results: [
        { parameter: 'TSH', unit: 'mIU/L', value: '8.5', refRangeRaw: '0.4-4.0', flag: 'HIGH', valueNum: 8.5, refLow: 0.4, refHigh: 4.0 },
        { parameter: 'Vitamin D', unit: 'ng/mL', value: '12', refRangeRaw: '30-100', flag: 'LOW', valueNum: 12, refLow: 30, refHigh: 100 },
        { parameter: 'Calcium', unit: 'mg/dL', value: '9.2', refRangeRaw: '8.5-10.5', flag: 'NORMAL' },
      ],
      flaggedSummary: true,
    },
    // Scenario 9: Family account (profiles handled by account 9000000001)
    {
      orderNo: 'ORD-71239', patientName: 'Bhavani K', doctor: drAnitha,
      status: 'SIGNED', signedAt: new Date('2026-10-31T14:00:00+05:30'),
      results: [
        { parameter: 'Haemoglobin', unit: 'g/dL', value: '12.8', refRangeRaw: '12.0-15.5', flag: 'NORMAL' },
      ],
    },
    // Scenario 10: Still processing
    {
      orderNo: 'ORD-71219', patientName: 'Venkata Rao M', doctor: drAnitha,
      status: 'PROCESSING',
      results: [
        { parameter: 'LDL cholesterol', unit: 'mg/dL', value: '142', refRangeRaw: '0-100', flag: 'HIGH', valueNum: 142, refLow: 0, refHigh: 100 },
        { parameter: 'Total cholesterol', unit: 'mg/dL', value: '220', refRangeRaw: '<200', flag: 'HIGH', valueNum: 220, refHigh: 200 },
        { parameter: 'HDL cholesterol', unit: 'mg/dL', value: '42', refRangeRaw: '>40', flag: 'NORMAL' },
        { parameter: 'Triglycerides', unit: 'mg/dL', value: '195', refRangeRaw: '<150', flag: 'HIGH', valueNum: 195, refHigh: 150 },
      ],
    },
    // Scenario 11: "This is not for me" — revoked link + WRONG_NUMBER task
    {
      orderNo: 'ORD-71236', patientName: 'Rajesh Varma', doctor: drRamanaiah,
      status: 'SIGNED', signedAt: new Date('2026-10-29T10:30:00+05:30'),
      results: [
        { parameter: 'INR', unit: '', value: '1.2', refRangeRaw: '0.8-1.2', flag: 'NORMAL' },
      ],
      wrongNumber: true,
    },
    // Scenario 12: Mobile change (will be triggered by lis_export_invalid.csv import)
    // Additional orders
    {
      orderNo: 'ORD-71237', patientName: 'Kavitha M', doctor: drAnitha,
      status: 'SIGNED', signedAt: new Date('2026-10-30T08:45:00+05:30'),
      results: [
        { parameter: 'Haemoglobin', unit: 'g/dL', value: '11.8', refRangeRaw: '12.0-15.5', flag: 'LOW', valueNum: 11.8, refLow: 12.0, refHigh: 15.5 },
        { parameter: 'Vitamin D', unit: 'ng/mL', value: '18', refRangeRaw: '30-100', flag: 'LOW', valueNum: 18, refLow: 30, refHigh: 100 },
      ],
    },
    {
      orderNo: 'ORD-71238', patientName: 'Ravi Teja S', doctor: drSuresh,
      status: 'SIGNED', signedAt: new Date('2026-10-31T11:00:00+05:30'),
      results: [
        { parameter: 'Haemoglobin', unit: 'g/dL', value: '15.5', refRangeRaw: '13.0-17.0', flag: 'NORMAL' },
        { parameter: 'Total WBC', unit: '10^3/µL', value: '7.0', refRangeRaw: '4.0-11.0', flag: 'NORMAL' },
        { parameter: 'Platelet count', unit: '10^3/µL', value: '310', refRangeRaw: '150-400', flag: 'NORMAL' },
      ],
    },
    // More orders for realistic volume
    {
      orderNo: 'ORD-71240', patientName: 'Mohammed Ismail', doctor: drLakshmi,
      status: 'SIGNED', signedAt: new Date('2026-10-25T09:00:00+05:30'),
      results: [
        { parameter: 'Fasting glucose', unit: 'mg/dL', value: '180', refRangeRaw: '70-100', flag: 'HIGH', valueNum: 180, refLow: 70, refHigh: 100 },
        { parameter: 'HbA1c', unit: '%', value: '8.2', refRangeRaw: '<5.7', flag: 'HIGH', valueNum: 8.2, refHigh: 5.7 },
        { parameter: 'Creatinine', unit: 'mg/dL', value: '1.5', refRangeRaw: '0.7-1.3', flag: 'HIGH', valueNum: 1.5, refLow: 0.7, refHigh: 1.3 },
      ],
    },
    {
      orderNo: 'ORD-71241', patientName: 'Ayesha Begum', doctor: drLakshmi,
      status: 'SIGNED', signedAt: new Date('2026-10-25T09:30:00+05:30'),
      results: [
        { parameter: 'TSH', unit: 'mIU/L', value: '12.5', refRangeRaw: '0.4-4.0', flag: 'HIGH', valueNum: 12.5, refLow: 0.4, refHigh: 4.0 },
        { parameter: 'Haemoglobin', unit: 'g/dL', value: '11.5', refRangeRaw: '12.0-15.5', flag: 'LOW', valueNum: 11.5, refLow: 12.0, refHigh: 15.5 },
      ],
    },
    {
      orderNo: 'ORD-71220', patientName: 'Anusha P', doctor: drAnitha,
      status: 'PROCESSING',
      results: [
        { parameter: 'Haemoglobin', unit: 'g/dL', value: '14.2', refRangeRaw: '12.0-15.5', flag: 'NORMAL' },
        { parameter: 'Total WBC', unit: '10^3/µL', value: '8.1', refRangeRaw: '4.0-11.0', flag: 'NORMAL' },
      ],
    },
    {
      orderNo: 'ORD-71242', patientName: 'Satya Narayana V', doctor: drPrasad,
      status: 'SIGNED', signedAt: new Date('2026-10-26T14:00:00+05:30'),
      results: [
        { parameter: 'Haemoglobin', unit: 'g/dL', value: '14.8', refRangeRaw: '13.0-17.0', flag: 'NORMAL' },
        { parameter: 'Potassium', unit: 'mmol/L', value: '4.2', refRangeRaw: '3.5-5.1', flag: 'NORMAL' },
        { parameter: 'Sodium', unit: 'mmol/L', value: '142', refRangeRaw: '136-145', flag: 'NORMAL' },
      ],
    },
    {
      orderNo: 'ORD-71243', patientName: 'Durga Devi P', doctor: drNaidu,
      status: 'SIGNED', signedAt: new Date('2026-10-27T10:00:00+05:30'),
      results: [
        { parameter: 'Total cholesterol', unit: 'mg/dL', value: '185', refRangeRaw: '<200', flag: 'NORMAL' },
        { parameter: 'LDL cholesterol', unit: 'mg/dL', value: '95', refRangeRaw: '0-100', flag: 'NORMAL' },
        { parameter: 'Triglycerides', unit: 'mg/dL', value: '130', refRangeRaw: '<150', flag: 'NORMAL' },
      ],
    },
    {
      orderNo: 'ORD-71244', patientName: 'Arun Kumar G', doctor: drSarojini,
      status: 'SIGNED', signedAt: new Date('2026-10-28T15:00:00+05:30'),
      results: [
        { parameter: 'Vitamin D', unit: 'ng/mL', value: '22', refRangeRaw: '30-100', flag: 'LOW', valueNum: 22, refLow: 30, refHigh: 100 },
        { parameter: 'Calcium', unit: 'mg/dL', value: '8.8', refRangeRaw: '8.5-10.5', flag: 'NORMAL' },
      ],
    },
    {
      orderNo: 'ORD-71245', patientName: 'Manga Rani T', doctor: drKrishna,
      status: 'SIGNED', signedAt: new Date('2026-10-29T11:00:00+05:30'),
      results: [
        { parameter: 'Haemoglobin', unit: 'g/dL', value: '13.2', refRangeRaw: '12.0-15.5', flag: 'NORMAL' },
        { parameter: 'Fasting glucose', unit: 'mg/dL', value: '105', refRangeRaw: '70-100', flag: 'HIGH', valueNum: 105, refLow: 70, refHigh: 100 },
      ],
    },
    {
      orderNo: 'ORD-71246', patientName: 'Chandra Sekhar T', doctor: drKrishna,
      status: 'SIGNED', signedAt: new Date('2026-10-30T09:30:00+05:30'),
      results: [
        { parameter: 'Creatinine', unit: 'mg/dL', value: '1.0', refRangeRaw: '0.7-1.3', flag: 'NORMAL' },
        { parameter: 'Potassium', unit: 'mmol/L', value: '4.5', refRangeRaw: '3.5-5.1', flag: 'NORMAL' },
      ],
    },
    {
      orderNo: 'ORD-71247', patientName: 'Sanjay Reddy B', doctor: drPrasad,
      status: 'PROCESSING',
      results: [
        { parameter: 'Haemoglobin', unit: 'g/dL', value: '15.0', refRangeRaw: '13.0-17.0', flag: 'NORMAL' },
      ],
    },
    {
      orderNo: 'ORD-71248', patientName: 'Deepika Singh', doctor: drSarojini,
      status: 'SIGNED', signedAt: new Date('2026-10-31T16:00:00+05:30'),
      results: [
        { parameter: 'TSH', unit: 'mIU/L', value: '0.3', refRangeRaw: '0.4-4.0', flag: 'LOW', valueNum: 0.3, refLow: 0.4, refHigh: 4.0 },
        { parameter: 'Haemoglobin', unit: 'g/dL', value: '13.0', refRangeRaw: '12.0-15.5', flag: 'NORMAL' },
      ],
    },
    {
      orderNo: 'ORD-71249', patientName: 'Faiz Mohammed', doctor: drLakshmi,
      status: 'SIGNED', signedAt: new Date('2026-11-01T08:00:00+05:30'),
      results: [
        { parameter: 'Haemoglobin', unit: 'g/dL', value: '16.2', refRangeRaw: '13.0-17.0', flag: 'NORMAL' },
        { parameter: 'Platelet count', unit: '10^3/µL', value: '220', refRangeRaw: '150-400', flag: 'NORMAL' },
      ],
    },
  ];

  const createdOrders = {};

  for (const od of ordersData) {
    const { patient, account } = patientsByName[od.patientName];
    if (!patient) {
      console.warn(`  ⚠️ Patient not found: ${od.patientName}`);
      continue;
    }

    // Generate PDF for signed orders
    let pdf = null;
    if (od.status === 'SIGNED') {
      pdf = await generatePDF(od.orderNo, od.patientName, od.results, od.doctor?.name);
    }

    const order = await prisma.order.create({
      data: {
        orderNo: od.orderNo,
        patientId: patient.id,
        doctorId: od.doctor?.id,
        status: od.status,
        hasCritical: od.hasCritical || false,
        signedAt: od.signedAt || null,
        pdf,
        pdfFileName: od.status === 'SIGNED' ? `${od.orderNo}_report.pdf` : null,
      },
    });
    createdOrders[od.orderNo] = { order, patient, account, ...od };

    // Create results
    for (const r of od.results) {
      await prisma.result.create({
        data: {
          orderId: order.id,
          parameter: r.parameter,
          unit: r.unit || null,
          value: r.value,
          valueNum: r.valueNum || null,
          refRangeRaw: r.refRangeRaw || null,
          refLow: r.refLow || null,
          refHigh: r.refHigh || null,
          refOp: r.refLow != null && r.refHigh != null ? 'RANGE' : r.refHigh != null ? 'LT' : r.refLow != null ? 'GT' : null,
          flag: r.flag || 'NORMAL',
        },
      });
    }

    // Create link tokens and messages for signed orders
    if (od.status === 'SIGNED') {
      const token = generateTokenPair();
      const isExpired = od.expiredLink;
      const expiresAt = isExpired
        ? new Date(Date.now() - 48 * 60 * 60 * 1000) // expired 2 days ago
        : new Date(Date.now() + 72 * 60 * 60 * 1000);

      const linkToken = await prisma.linkToken.create({
        data: {
          orderId: order.id,
          accountId: account.id,
          tokenHash: token.hash,
          expiresAt,
          revokedAt: od.wrongNumber ? new Date() : isExpired ? null : null,
          firstOpenedAt: (!od.hasCritical && !isExpired && !od.wrongNumber) ? new Date(Date.now() - 24 * 60 * 60 * 1000) : null,
          openCount: (!od.hasCritical && !isExpired && !od.wrongNumber) ? 1 : 0,
        },
      });

      // If expired, create a resent token
      if (isExpired) {
        const newToken = generateTokenPair();
        await prisma.linkToken.create({
          data: {
            orderId: order.id,
            accountId: account.id,
            tokenHash: newToken.hash,
            expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
          },
        });
      }

      // Create message
      if (!od.hasCritical || od.callbackTask?.status === 'DONE') {
        const msg = await prisma.message.create({
          data: {
            orderId: order.id,
            accountId: account.id,
            channel: 'WHATSAPP',
            kind: 'REPORT_LINK',
            body: `Your report from ${LAB_NAME} is ready. Open: ${process.env.APP_BASE_URL || 'http://localhost:5173'}/r/${token.raw} . You will need an OTP sent to your mobile. Link valid 72 hours.`,
            status: od.failedMessage ? 'FAILED' : 'DELIVERED',
            failureReason: od.failedMessage ? 'Number not on WhatsApp' : null,
            deliverAt: od.failedMessage ? null : new Date(Date.now() - 2000),
          },
        });

        // SMS fallback for failed message
        if (od.failedMessage) {
          await prisma.message.create({
            data: {
              orderId: order.id,
              accountId: account.id,
              channel: 'SMS',
              kind: 'RESEND',
              body: `Your report from ${LAB_NAME} is ready. Open: ${process.env.APP_BASE_URL || 'http://localhost:5173'}/r/${token.raw}`,
              status: 'DELIVERED',
              deliverAt: new Date(Date.now() - 1000),
            },
          });
        }
      }

      // Callback tasks
      if (od.callbackTask) {
        await prisma.callbackTask.create({
          data: {
            orderId: order.id,
            accountId: account.id,
            type: od.callbackTask.type,
            parameter: od.callbackTask.parameter,
            value: od.callbackTask.value,
            reason: od.callbackTask.reason,
            status: od.callbackTask.status,
            doneById: od.callbackTask.status === 'DONE' ? staff1.id : null,
            doneAt: od.callbackTask.status === 'DONE' ? new Date() : null,
            note: od.callbackTask.note || null,
          },
        });
      }

      // Wrong number task
      if (od.wrongNumber) {
        await prisma.callbackTask.create({
          data: {
            orderId: order.id,
            accountId: account.id,
            type: 'WRONG_NUMBER',
            reason: 'Recipient reported "This is not for me"',
            status: 'OPEN',
          },
        });
      }
    }
  }

  // ─── Summaries ───
  console.log('  Creating summaries...');
  const summaryTemplates = {
    'Haemoglobin_LOW_en': 'Your haemoglobin is a little below the usual range. Haemoglobin carries oxygen in your blood. Please show this report to your doctor.',
    'Haemoglobin_LOW_te': 'మీ హీమోగ్లోబిన్ సాధారణ స్థాయి కంటే కొంచెం తక్కువగా ఉంది. హీమోగ్లోబిన్ మీ రక్తంలో ఆక్సిజన్‌ను మోసుకెళ్తుంది. దయచేసి మీ డాక్టర్‌కు ఈ రిపోర్ట్ చూపించండి.',
    'Haemoglobin_LOW_hi': 'आपका हीमोग्लोबिन सामान्य सीमा से थोड़ा कम है। हीमोग्लोबिन आपके रक्त में ऑक्सीजन ले जाता है। कृपया यह रिपोर्ट अपने डॉक्टर को दिखाएं।',
    'TSH_HIGH_en': 'Your TSH level is above the usual range. TSH helps control how your thyroid works. Please show this report to your doctor.',
    'TSH_HIGH_te': 'మీ TSH స్థాయి సాధారణ స్థాయి కంటే ఎక్కువగా ఉంది. TSH మీ థైరాయిడ్ ఎలా పనిచేస్తుందో నియంత్రించడంలో సహాయపడుతుంది. దయచేసి మీ డాక్టర్‌కు ఈ రిపోర్ట్ చూపించండి.',
    'TSH_HIGH_hi': 'आपका TSH स्तर सामान्य सीमा से ऊपर है। TSH आपके थायरॉइड को नियंत्रित करने में मदद करता है। कृपया यह रिपोर्ट अपने डॉक्टर को दिखाएं।',
    'Vitamin D_LOW_en': 'Your vitamin D is below the usual range. Vitamin D helps keep your bones strong. Please show this report to your doctor.',
    'Vitamin D_LOW_te': 'మీ విటమిన్ D సాధారణ స్థాయి కంటే తక్కువగా ఉంది. విటమిన్ D మీ ఎముకలను బలంగా ఉంచడంలో సహాయపడుతుంది. దయచేసి మీ డాక్టర్‌కు ఈ రిపోర్ట్ చూపించండి.',
    'Vitamin D_LOW_hi': 'आपका विटामिन D सामान्य सीमा से कम है। विटामिन D आपकी हड्डियों को मजबूत रखने में मदद करता है। कृपया यह रिपोर्ट अपने डॉक्टर को दिखाएं।',
    'Fasting glucose_HIGH_en': 'Your fasting blood sugar is above the usual range (145 mg/dL, usual 70-100). Please show this report to your doctor.',
    'Fasting glucose_HIGH_te': 'మీ ఉపవాస రక్త చక్కెర సాధారణ స్థాయి కంటే ఎక్కువగా ఉంది. దయచేసి మీ డాక్టర్‌కు ఈ రిపోర్ట్ చూపించండి.',
    'Fasting glucose_HIGH_hi': 'आपकी उपवास रक्त शर्करा सामान्य सीमा से ऊपर है। कृपया यह रिपोर्ट अपने डॉक्टर को दिखाएं।',
    'Creatinine_HIGH_en': 'Your creatinine is above the usual range. Creatinine shows how well your kidneys are working. Please show this report to your doctor.',
    'Creatinine_HIGH_te': 'మీ క్రియాటినిన్ సాధారణ స్థాయి కంటే ఎక్కువగా ఉంది. క్రియాటినిన్ మీ మూత్రపిండాలు ఎంత బాగా పనిచేస్తున్నాయో చూపిస్తుంది. దయచేసి మీ డాక్టర్‌కు ఈ రిపోర్ట్ చూపించండి.',
    'Creatinine_HIGH_hi': 'आपका क्रिएटिनिन सामान्य सीमा से ऊपर है। क्रिएटिनिन दिखाता है कि आपकी किडनी कितनी अच्छी तरह काम कर रही है। कृपया यह रिपोर्ट अपने डॉक्टर को दिखाएं।',
    'LDL cholesterol_HIGH_en': 'Your LDL cholesterol is above the usual range. LDL is sometimes called "bad" cholesterol. Please show this report to your doctor.',
    'LDL cholesterol_HIGH_te': 'మీ LDL కొలెస్ట్రాల్ సాధారణ స్థాయి కంటే ఎక్కువగా ఉంది. దయచేసి మీ డాక్టర్‌కు ఈ రిపోర్ట్ చూపించండి.',
    'LDL cholesterol_HIGH_hi': 'आपका LDL कोलेस्ट्रॉल सामान्य सीमा से ऊपर है। कृपया यह रिपोर्ट अपने डॉक्टर को दिखाएं।',
    'HDL cholesterol_LOW_en': 'Your HDL cholesterol is below the usual range. HDL is sometimes called "good" cholesterol. Please show this report to your doctor.',
    'Total cholesterol_HIGH_en': 'Your total cholesterol is above the usual range. Please show this report to your doctor.',
    'Triglycerides_HIGH_en': 'Your triglycerides are above the usual range. Please show this report to your doctor.',
    'HbA1c_HIGH_en': 'Your HbA1c is above the usual range. HbA1c shows your average blood sugar over the past 2-3 months. Please show this report to your doctor.',
    'TSH_LOW_en': 'Your TSH level is below the usual range. TSH helps control how your thyroid works. Please show this report to your doctor.',
  };

  // Store summary templates
  for (const [key, text] of Object.entries(summaryTemplates)) {
    const [testKey, direction, lang] = key.split('_');
    await prisma.summaryTemplate.create({
      data: { testKey, direction, lang, text, reviewed: false },
    });
  }

  // Create summaries for signed orders with out-of-range results
  for (const [orderNo, od] of Object.entries(createdOrders)) {
    if (od.status !== 'SIGNED') continue;
    if (od.hasCritical) continue; // No summary for critical

    const outOfRange = od.results.filter(r => r.flag !== 'NORMAL' && r.flag !== 'UNKNOWN');
    if (outOfRange.length === 0) continue;

    const langs = ['en', 'te', 'hi'];
    for (const lang of langs) {
      const items = outOfRange.map(r => {
        const templateKey = `${r.parameter}_${r.flag.replace('CRITICAL_', '')}_${lang}`;
        const template = summaryTemplates[templateKey];
        if (template) return template;
        return `The value for ${r.parameter} is outside the usual range (${r.value} ${r.unit || ''}, usual ${r.refRangeRaw}). Please see your doctor.`;
      });

      await prisma.summary.create({
        data: {
          orderId: od.order.id,
          lang,
          source: items.some((_i, idx) => !summaryTemplates[`${outOfRange[idx].parameter}_${outOfRange[idx].flag.replace('CRITICAL_', '')}_${lang}`]) ? 'FALLBACK' : 'TEMPLATE',
          body: JSON.stringify(items.map((text, i) => ({
            parameter: outOfRange[i].parameter,
            value: outOfRange[i].value,
            unit: outOfRange[i].unit || '',
            refRange: outOfRange[i].refRangeRaw,
            flag: outOfRange[i].flag,
            text,
          }))),
          reviewStatus: 'UNREVIEWED',
        },
      });
    }
  }

  // Scenario 8: Flag a summary
  const flaggedOrder = createdOrders['ORD-71207'];
  if (flaggedOrder) {
    const summary = await prisma.summary.findFirst({ where: { orderId: flaggedOrder.order.id, lang: 'en' } });
    if (summary) {
      await prisma.summaryFlag.create({
        data: {
          summaryId: summary.id,
          patientId: flaggedOrder.patient.id,
          reason: 'CONFUSING',
          freeText: 'I do not understand what TSH means',
          status: 'OPEN',
        },
      });
    }
  }

  // Scenario 12: MOBILE_CHANGE task
  await prisma.callbackTask.create({
    data: {
      orderId: createdOrders['ORD-71204']?.order.id,
      accountId: accounts['+919000000001'].id,
      type: 'MOBILE_CHANGE',
      reason: 'Mobile changed from ••••0001 to ••••0099 on re-import. Needs staff review.',
      status: 'OPEN',
    },
  });

  // ─── Access Logs (~200 rows) ───
  console.log('  Creating access logs...');
  const logActions = ['LOGIN', 'OTP_SEND', 'OTP_VERIFY', 'LINK_OPEN', 'REPORT_VIEW', 'PDF_DOWNLOAD', 'RESEND_LINK', 'PHONE_REVEAL', 'TASK_DONE', 'IMPORT', 'LOGOUT'];
  const logOutcomes = ['OK', 'OK', 'OK', 'OK', 'OK', 'OK', 'DENIED', 'EXPIRED', 'OTP_FAIL', 'RATE_LIMITED'];

  for (let i = 0; i < 200; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const hoursAgo = Math.floor(Math.random() * 24);
    const action = logActions[Math.floor(Math.random() * logActions.length)];
    const outcome = logOutcomes[Math.floor(Math.random() * logOutcomes.length)];
    const isStaff = action === 'RESEND_LINK' || action === 'PHONE_REVEAL' || action === 'TASK_DONE' || action === 'IMPORT';
    const orderKeys = Object.keys(createdOrders);
    const randomOrder = createdOrders[orderKeys[Math.floor(Math.random() * orderKeys.length)]];

    await prisma.accessLog.create({
      data: {
        at: new Date(Date.now() - daysAgo * 86400000 - hoursAgo * 3600000),
        actorType: isStaff ? 'STAFF' : 'PATIENT',
        actorId: isStaff ? staff1.id : randomOrder?.patient.id,
        accountId: randomOrder?.account.id,
        orderId: randomOrder?.order.id,
        action,
        ipHash: crypto.createHash('sha256').update(`192.168.1.${Math.floor(Math.random() * 255)}`).digest('hex').slice(0, 16),
        userAgentShort: isStaff ? 'Mozilla/5.0 Chrome/120' : 'Mozilla/5.0 Mobile Safari/17',
        outcome,
        detail: outcome !== 'OK' ? `${outcome} for ${action}` : null,
      },
    });
  }

  console.log('✅ Seed complete!');
  console.log(`   Accounts: ${Object.keys(accounts).length}`);
  console.log(`   Patients: ${Object.keys(patientsByName).length}`);
  console.log(`   Orders: ${Object.keys(createdOrders).length}`);
  console.log(`   Doctors: ${doctors.length}`);
  console.log(`   Staff: 3`);
  console.log(`   Access logs: 200`);
  console.log('');
  console.log('📋 Demo scenarios:');
  console.log('   1. Normal report: ORD-71206 (Padmavathi D)');
  console.log('   2. Low haemoglobin: ORD-71204 (Lakshmi Prasanna K)');
  console.log('   3. Multiple out-of-range: ORD-71205 (Srinivas Rao T)');
  console.log('   4. Critical held: ORD-71233 (Farzana Begum)');
  console.log('   5. Critical done: ORD-71234 (Narasimha Rao K)');
  console.log('   6. Expired + resent: ORD-71235 (Priya Sharma)');
  console.log('   7. Failed WhatsApp: ORD-71208 (Sumalatha G)');
  console.log('   8. Flagged summary: ORD-71207 (Ramesh Kumar B)');
  console.log('   9. Family account: 9000000001 (Lakshmi family)');
  console.log('   10. Processing: ORD-71219 (Venkata Rao M)');
  console.log('   11. Wrong number: ORD-71236 (Rajesh Varma)');
  console.log('   12. Mobile change: ORD-71204 task');
  console.log('');
  console.log('🔑 Demo logins:');
  console.log('   Patient: 9000000001 (Lakshmi family, Telugu)');
  console.log('   Staff: frontdesk@demo.local / Demo@12345');
  console.log('   Doctor: doctor@demo.local / Demo@12345');
}

seed()
  .catch(e => { console.error('Seed error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());

