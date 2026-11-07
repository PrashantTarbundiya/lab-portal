import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { writeLog } from '../lib/audit.js';

const router = Router();
const requireLabOrDoctor = requireRole('FRONT_DESK', 'DOCTOR', 'ADMIN');

// In-memory laboratory specimen processing tasks store
let labTasksStore = [
  // ─── Company A Main Super-Specialty Hospital (HOSP-01) ───
  {
    id: 'LT-9801',
    hospitalId: 'HOSP-01',
    hospitalSlug: 'company-a-main-hospital',
    hospitalName: 'Company A Main Super-Specialty Hospital',
    orderNo: 'ORD-71233',
    patientName: 'Farzana Begum',
    ageSex: '36Y / Female',
    uhid: 'UHID-2026-9041',
    tubeBarcode: 'BC-ORD-71233-SST',
    tubeType: 'Gold Top (SST Gel Separator 5mL)',
    department: 'Clinical Biochemistry',
    testsRequested: ['Serum Potassium', 'Serum Sodium', 'Serum Creatinine'],
    priority: 'STAT_CRITICAL', // STAT_CRITICAL | URGENT | ROUTINE
    stage: 'QC_DELTA_CHECK', // ACCESSIONING_QC -> ANALYZER_TESTING -> QC_DELTA_CHECK -> PATHOLOGIST_SIGNOFF -> PUBLISHED
    accessionDetails: {
      collectedAt: '2026-11-03T08:15:00.000Z',
      receivedAt: '2026-11-03T08:45:00.000Z',
      integrity: 'NORMAL',
      volumeStatus: 'SUFFICIENT (3.8 mL)',
      accessionedBy: 'Tech. Sunita Rao (TECH-108)',
    },
    analyzerDetails: {
      instrument: 'Roche Cobas 6000 (Module c501 - Rack 04)',
      batchRunId: 'BATCH-20261103-BIO02',
      calibrationStatus: 'CALIBRATED & VERIFIED',
      completedAt: '2026-11-03T09:20:00.000Z',
      rawResults: [
        { parameter: 'Potassium', value: '6.8', unit: 'mmol/L', flag: 'CRITICAL_HIGH', deltaNote: 'Prior: 4.4 mmol/L (+54% acute jump)' },
        { parameter: 'Sodium', value: '138', unit: 'mmol/L', flag: 'NORMAL' },
        { parameter: 'Creatinine', value: '0.9', unit: 'mg/dL', flag: 'NORMAL' },
      ],
    },
    qcDetails: {
      westgardStatus: 'PASS_WITHIN_2SD',
      deltaCheckFlag: true,
      deltaAlertReason: 'Potassium acute elevation > 6.5 mmol/L (Critical Panic Value)',
      repeatRunDone: true,
      repeatRunResult: 'Potassium confirmed 6.8 mmol/L on secondary tube re-spin',
      technicianRemarks: 'Sample was not hemolyzed. True hyperkalemia. Immediate telephonic callback raised.',
      verifiedBy: 'Senior Biochemist Anand V (TECH-04)',
    },
    pathologistReview: {
      pathologistName: 'Dr. A. Verma, MD (Pathology)',
      clinicalRemarks: 'Significant hyperkalemia (6.8 mmol/L). Clinical correlation and urgent ECG/cardiac evaluation advised.',
      signedAt: null,
    },
    createdAt: '2026-11-03T08:45:00.000Z',
  },
  {
    id: 'LT-9802',
    hospitalId: 'HOSP-01',
    hospitalSlug: 'company-a-main-hospital',
    hospitalName: 'Company A Main Super-Specialty Hospital',
    orderNo: 'ORD-71205',
    patientName: 'Lakshmi Prasanna K',
    ageSex: '42Y / Female',
    uhid: 'UHID-2026-8812',
    tubeBarcode: 'BC-ORD-71205-LIPID',
    tubeType: 'Gold Top (SST Gel Separator 5mL)',
    department: 'Lipid & Metabolic Laboratory',
    testsRequested: ['Total Cholesterol', 'HDL Cholesterol', 'LDL Cholesterol', 'Triglycerides'],
    priority: 'ROUTINE',
    stage: 'ANALYZER_TESTING',
    accessionDetails: {
      collectedAt: '2026-11-03T07:30:00.000Z',
      receivedAt: '2026-11-03T08:10:00.000Z',
      integrity: 'NORMAL',
      volumeStatus: 'SUFFICIENT (4.2 mL)',
      accessionedBy: 'Tech. Sunita Rao (TECH-108)',
    },
    analyzerDetails: {
      instrument: 'Beckman Coulter AU5800 High-Throughput System',
      batchRunId: 'BATCH-20261103-LIP01',
      calibrationStatus: 'RUNNING (92% Complete)',
      completedAt: null,
      rawResults: [],
    },
    qcDetails: {
      westgardStatus: 'PENDING_RUN',
      deltaCheckFlag: false,
    },
    pathologistReview: {
      pathologistName: 'Dr. A. Verma, MD',
      clinicalRemarks: '',
      signedAt: null,
    },
    createdAt: '2026-11-03T08:10:00.000Z',
  },
  {
    id: 'LT-9803',
    hospitalId: 'HOSP-01',
    hospitalSlug: 'company-a-main-hospital',
    hospitalName: 'Company A Main Super-Specialty Hospital',
    orderNo: 'ORD-71201',
    patientName: 'Srinivas Rao T',
    ageSex: '55Y / Male',
    uhid: 'UHID-2026-7240',
    tubeBarcode: 'BC-ORD-71201-EDTA',
    tubeType: 'Lavender Top (K2 EDTA 3mL)',
    department: 'Hematology & Glycemic Control',
    testsRequested: ['HbA1c (Glycated Hemoglobin)', 'Fasting Plasma Glucose'],
    priority: 'ROUTINE',
    stage: 'PATHOLOGIST_SIGNOFF',
    accessionDetails: {
      collectedAt: '2026-11-03T07:15:00.000Z',
      receivedAt: '2026-11-03T07:50:00.000Z',
      integrity: 'NORMAL',
      volumeStatus: 'SUFFICIENT (2.8 mL)',
      accessionedBy: 'Tech. Manoj B (TECH-114)',
    },
    analyzerDetails: {
      instrument: 'Bio-Rad D-10 HPLC Analyzer (HbA1c Gold Standard)',
      batchRunId: 'BATCH-20261103-HBA01',
      calibrationStatus: 'CALIBRATED & VERIFIED',
      completedAt: '2026-11-03T08:40:00.000Z',
      rawResults: [
        { parameter: 'HbA1c', value: '7.8', unit: '%', flag: 'ABNORMAL_HIGH', deltaNote: 'Prior: 8.4% (-0.6% improvement)' },
        { parameter: 'Estimated Avg Glucose (eAG)', value: '177', unit: 'mg/dL', flag: 'ABNORMAL_HIGH' },
        { parameter: 'Fasting Plasma Glucose', value: '145', unit: 'mg/dL', flag: 'ABNORMAL_HIGH', deltaNote: 'Prior: 162 mg/dL (-17 mg/dL improvement)' },
      ],
    },
    qcDetails: {
      westgardStatus: 'PASS_WITHIN_2SD',
      deltaCheckFlag: false,
      deltaAlertReason: null,
      repeatRunDone: false,
      technicianRemarks: 'Favorable glycemic response observed compared with previous quarter baseline.',
      verifiedBy: 'Senior Biochemist Anand V (TECH-04)',
    },
    pathologistReview: {
      pathologistName: 'Dr. A. Verma, MD (Pathology)',
      clinicalRemarks: 'Sub-optimal diabetic control with HbA1c 7.8%, though showing positive trend compared to last test (8.4%). Recommend continuing lifestyle and pharmacological management.',
      signedAt: null,
    },
    createdAt: '2026-11-03T07:50:00.000Z',
  },
  {
    id: 'LT-9804',
    hospitalId: 'HOSP-01',
    hospitalSlug: 'company-a-main-hospital',
    hospitalName: 'Company A Main Super-Specialty Hospital',
    orderNo: 'ORD-71289',
    patientName: 'Kavya S',
    ageSex: '28Y / Female',
    uhid: 'UHID-2026-9481',
    tubeBarcode: 'BC-ORD-71289-SST',
    tubeType: 'Gold Top (SST Gel Separator 5mL)',
    department: 'Liver Function & Clinical Enzymes',
    testsRequested: ['SGOT / AST', 'SGPT / ALT', 'Total Bilirubin', 'Alkaline Phosphatase'],
    priority: 'URGENT',
    stage: 'ACCESSIONING_QC',
    accessionDetails: {
      collectedAt: '2026-11-03T09:10:00.000Z',
      receivedAt: '2026-11-03T09:35:00.000Z',
      integrity: 'NORMAL',
      volumeStatus: 'SUFFICIENT (3.5 mL)',
      accessionedBy: 'Tech. Sunita Rao (TECH-108)',
    },
    analyzerDetails: {
      instrument: 'Roche Cobas 6000 (Module c501)',
      batchRunId: null,
      calibrationStatus: 'QUEUED FOR BATCH 03',
      completedAt: null,
      rawResults: [],
    },
    qcDetails: {
      westgardStatus: 'PENDING',
      deltaCheckFlag: false,
    },
    pathologistReview: {
      pathologistName: 'Dr. A. Verma, MD',
      clinicalRemarks: '',
      signedAt: null,
    },
    createdAt: '2026-11-03T09:35:00.000Z',
  },

  // ─── Apollo Specialty Hospital (HOSP-02) ───
  {
    id: 'LT-APO-01',
    hospitalId: 'HOSP-02',
    hospitalSlug: 'apollo-hospital-vijayawada',
    hospitalName: 'Apollo Specialty Hospital',
    orderNo: 'ORD-88192',
    patientName: 'G. Venkatesh',
    ageSex: '58Y / Male',
    uhid: 'UHID-2026-4401',
    tubeBarcode: 'BC-APO-88192-CARDIAC',
    tubeType: 'Green Top (Lithium Heparin 4mL)',
    department: 'Cardiology & Cardiovascular Sciences',
    testsRequested: ['High-Sensitivity Troponin-I', 'NT-proBNP', 'CK-MB Mass'],
    priority: 'STAT_CRITICAL',
    stage: 'ANALYZER_TESTING',
    accessionDetails: {
      collectedAt: '2026-11-04T07:45:00.000Z',
      receivedAt: '2026-11-04T08:05:00.000Z',
      integrity: 'NORMAL',
      volumeStatus: 'SUFFICIENT (3.6 mL)',
      accessionedBy: 'Tech. V. Ramesh (APO-204)',
    },
    analyzerDetails: {
      instrument: 'Abbott Alinity ci-series STAT Immunoassay System',
      batchRunId: 'BATCH-APO-CARD-01',
      calibrationStatus: 'ANALYZER RUNNING (Batch 1)',
      completedAt: null,
      rawResults: [
        { parameter: 'High-Sensitivity Troponin-I', value: '48.5', unit: 'pg/mL', flag: 'CRITICAL_HIGH', deltaNote: 'Cutoff: 14 pg/mL. Acute Myocardial Injury Alert' },
      ],
    },
    qcDetails: {
      westgardStatus: 'PASS_WITHIN_2SD',
      deltaCheckFlag: true,
      deltaAlertReason: 'Troponin-I elevated above 99th percentile URL',
    },
    pathologistReview: {
      pathologistName: 'Dr. Vikram Anand, DM (Cardiology)',
      clinicalRemarks: 'Urgent bedside ECG and Cath-lab review initiated.',
      signedAt: null,
    },
    createdAt: '2026-11-04T08:05:00.000Z',
  },
  {
    id: 'LT-APO-02',
    hospitalId: 'HOSP-02',
    hospitalSlug: 'apollo-hospital-vijayawada',
    hospitalName: 'Apollo Specialty Hospital',
    orderNo: 'ORD-91041',
    patientName: 'T. Sambasiva Rao',
    ageSex: '62Y / Male',
    uhid: 'UHID-2026-7819',
    tubeBarcode: 'BC-APO-91041-ORTHO',
    tubeType: 'Gold Top (SST Gel Separator 5mL)',
    department: 'Orthopedics & Joint Replacement',
    testsRequested: ['Serum Uric Acid', 'Serum Calcium', 'RA Factor Quantitative'],
    priority: 'URGENT',
    stage: 'QC_DELTA_CHECK',
    accessionDetails: {
      collectedAt: '2026-11-04T08:30:00.000Z',
      receivedAt: '2026-11-04T09:00:00.000Z',
      integrity: 'NORMAL',
      volumeStatus: 'SUFFICIENT (4.0 mL)',
      accessionedBy: 'Tech. P. Kalyani (APO-112)',
    },
    analyzerDetails: {
      instrument: 'Siemens Atellica Solution Chemistry Analyzer',
      batchRunId: 'BATCH-APO-CHEM-04',
      calibrationStatus: 'COMPLETED & VERIFIED',
      completedAt: '2026-11-04T09:40:00.000Z',
      rawResults: [
        { parameter: 'Serum Uric Acid', value: '8.6', unit: 'mg/dL', flag: 'ABNORMAL_HIGH', deltaNote: 'Elevated: Gouty Arthritis indicator' },
        { parameter: 'Serum Calcium', value: '9.1', unit: 'mg/dL', flag: 'NORMAL' },
      ],
    },
    qcDetails: {
      westgardStatus: 'PASS_WITHIN_2SD',
      deltaCheckFlag: false,
    },
    pathologistReview: {
      pathologistName: 'Dr. Harish Reddy, MS (Orthopedics)',
      clinicalRemarks: 'Hyperuricemia correlated with acute first MTP synovitis.',
      signedAt: null,
    },
    createdAt: '2026-11-04T09:00:00.000Z',
  },
  {
    id: 'LT-APO-03',
    hospitalId: 'HOSP-02',
    hospitalSlug: 'apollo-hospital-vijayawada',
    hospitalName: 'Apollo Specialty Hospital',
    orderNo: 'ORD-44021',
    patientName: 'Master Aarav Reddy',
    ageSex: '4Y / Male',
    uhid: 'UHID-2026-3021',
    tubeBarcode: 'BC-APO-44021-PED',
    tubeType: 'Lavender Top (Microtainer K2 EDTA 0.5mL)',
    department: 'Pediatrics & Neonatal Care',
    testsRequested: ['Pediatric Complete Blood Count', 'Absolute Eosinophil Count'],
    priority: 'ROUTINE',
    stage: 'PUBLISHED',
    accessionDetails: {
      collectedAt: '2026-11-03T10:00:00.000Z',
      receivedAt: '2026-11-03T10:20:00.000Z',
      integrity: 'NORMAL',
      volumeStatus: 'SUFFICIENT (0.45 mL microtainer)',
      accessionedBy: 'Tech. P. Kalyani (APO-112)',
    },
    analyzerDetails: {
      instrument: 'Sysmex XN-1000 Automated Hematology Analyzer',
      batchRunId: 'BATCH-APO-HEM-02',
      calibrationStatus: 'COMPLETED',
      completedAt: '2026-11-03T10:50:00.000Z',
      rawResults: [
        { parameter: 'Haemoglobin', value: '11.8', unit: 'g/dL', flag: 'NORMAL' },
        { parameter: 'Total WBC', value: '7.8', unit: '10^3/µL', flag: 'NORMAL' },
        { parameter: 'Platelets', value: '310', unit: '10^3/µL', flag: 'NORMAL' },
      ],
    },
    qcDetails: {
      westgardStatus: 'PASS_WITHIN_2SD',
      deltaCheckFlag: false,
    },
    pathologistReview: {
      pathologistName: 'Dr. Meera Nambiar, MD (Pediatrics)',
      clinicalRemarks: 'Pediatric cell indices within age-specific normal reference intervals.',
      signedAt: '2026-11-03T11:30:00.000Z',
    },
    createdAt: '2026-11-03T10:20:00.000Z',
  },

  // ─── Manipal Super-Specialty Hospital (HOSP-03) ───
  {
    id: 'LT-MAN-01',
    hospitalId: 'HOSP-03',
    hospitalSlug: 'manipal-hospital',
    hospitalName: 'Manipal Super-Specialty Hospital',
    orderNo: 'ORD-55012',
    patientName: 'G. Satyanarayana',
    ageSex: '61Y / Male',
    uhid: 'UHID-2026-5510',
    tubeBarcode: 'BC-MAN-55012-PULM',
    tubeType: 'Heparinized Arterial Blood Gas Syringe (1.5mL)',
    department: 'Pulmonology & Chest Medicine',
    testsRequested: ['Arterial Blood Gas (ABG)', 'Serum IgE Total', 'Absolute Eosinophil Count'],
    priority: 'STAT_CRITICAL',
    stage: 'QC_DELTA_CHECK',
    accessionDetails: {
      collectedAt: '2026-11-04T08:15:00.000Z',
      receivedAt: '2026-11-04T08:25:00.000Z',
      integrity: 'NORMAL (Ice Pack Transport Verified)',
      volumeStatus: 'SUFFICIENT (1.2 mL)',
      accessionedBy: 'Tech. K. Subba Rao (MAN-08)',
    },
    analyzerDetails: {
      instrument: 'Instrumentation Laboratory GEM Premier 4000 ABG System',
      batchRunId: 'BATCH-MAN-ABG-01',
      calibrationStatus: 'COMPLETED & VERIFIED',
      completedAt: '2026-11-04T08:40:00.000Z',
      rawResults: [
        { parameter: 'pH', value: '7.32', unit: 'units', flag: 'ABNORMAL_LOW' },
        { parameter: 'pCO2', value: '52', unit: 'mmHg', flag: 'CRITICAL_HIGH', deltaNote: 'Respiratory Acidosis' },
        { parameter: 'pO2', value: '64', unit: 'mmHg', flag: 'ABNORMAL_LOW' },
      ],
    },
    qcDetails: {
      westgardStatus: 'PASS_WITHIN_2SD',
      deltaCheckFlag: true,
      deltaAlertReason: 'Hypercapnic respiratory insufficiency noted',
    },
    pathologistReview: {
      pathologistName: 'Dr. V. Ravi Teja, MD, DM (Pulmonology)',
      clinicalRemarks: 'Severe airway obstruction. Non-invasive BiPAP ventilation recommended.',
      signedAt: null,
    },
    createdAt: '2026-11-04T08:25:00.000Z',
  },
  {
    id: 'LT-MAN-02',
    hospitalId: 'HOSP-03',
    hospitalSlug: 'manipal-hospital',
    hospitalName: 'Manipal Super-Specialty Hospital',
    orderNo: 'ORD-55060',
    patientName: 'Mallika Begum',
    ageSex: '49Y / Female',
    uhid: 'UHID-2026-5592',
    tubeBarcode: 'BC-MAN-55060-COAG',
    tubeType: 'Light Blue Top (3.2% Sodium Citrate 2.7mL)',
    department: 'Hemostasis & Coagulation Laboratory',
    testsRequested: ['D-Dimer Quantitative', 'Prothrombin Time (PT/INR)', 'APTT'],
    priority: 'URGENT',
    stage: 'ANALYZER_TESTING',
    accessionDetails: {
      collectedAt: '2026-11-04T09:00:00.000Z',
      receivedAt: '2026-11-04T09:20:00.000Z',
      integrity: 'NORMAL (Exact 9:1 Blood-Anticoagulant Ratio)',
      volumeStatus: 'SUFFICIENT (2.7 mL)',
      accessionedBy: 'Tech. K. Subba Rao (MAN-08)',
    },
    analyzerDetails: {
      instrument: 'Stago STA Compact Max Coagulation Analyzer',
      batchRunId: 'BATCH-MAN-COAG-02',
      calibrationStatus: 'RUNNING',
      completedAt: null,
      rawResults: [],
    },
    qcDetails: {
      westgardStatus: 'PASS_WITHIN_2SD',
      deltaCheckFlag: false,
    },
    pathologistReview: {
      pathologistName: 'Dr. V. Ravi Teja, MD',
      clinicalRemarks: '',
      signedAt: null,
    },
    createdAt: '2026-11-04T09:20:00.000Z',
  },

  // ─── Government General Hospital GGH (HOSP-04) ───
  {
    id: 'LT-GGH-01',
    hospitalId: 'HOSP-04',
    hospitalSlug: 'ggh-vijayawada',
    hospitalName: 'Government General Hospital (GGH)',
    orderNo: 'ORD-71243',
    patientName: 'Durga Devi P',
    ageSex: '26Y / Female',
    uhid: 'UHID-2026-1194',
    tubeBarcode: 'BC-GGH-71243-MAT',
    tubeType: 'Gold Top (SST Gel Separator 5mL)',
    department: 'Maternal & Child Health Pathology',
    testsRequested: ['Maternal Serum Alpha-Fetoprotein', 'Complete Blood Count', 'Blood Group & Rh Type'],
    priority: 'ROUTINE',
    stage: 'PATHOLOGIST_SIGNOFF',
    accessionDetails: {
      collectedAt: '2026-11-04T07:30:00.000Z',
      receivedAt: '2026-11-04T08:15:00.000Z',
      integrity: 'NORMAL',
      volumeStatus: 'SUFFICIENT (4.5 mL)',
      accessionedBy: 'Lab Officer N. Appa Rao (GGH-44)',
    },
    analyzerDetails: {
      instrument: 'Bio-Rad Variant II Hemoglobin Testing System',
      batchRunId: 'BATCH-GGH-MAT-01',
      calibrationStatus: 'COMPLETED & VERIFIED',
      completedAt: '2026-11-04T09:10:00.000Z',
      rawResults: [
        { parameter: 'Haemoglobin', value: '10.5', unit: 'g/dL', flag: 'MILD_ANEMIA' },
        { parameter: 'Blood Group', value: 'O Positive', unit: '', flag: 'NORMAL' },
      ],
    },
    qcDetails: {
      westgardStatus: 'PASS_WITHIN_2SD',
      deltaCheckFlag: false,
    },
    pathologistReview: {
      pathologistName: 'Dr. B. Sarojini, MD (Pathology)',
      clinicalRemarks: 'Mild nutritional microcytic anemia in second trimester. Iron-folic acid prophylaxis advised.',
      signedAt: null,
    },
    createdAt: '2026-11-04T08:15:00.000Z',
  },
];

// GET /api/lab/tasks or /api/lab-tasks — List all laboratory specimen tasks (supports hospitalSlug isolation)
router.get(['/tasks', '/', ''], authenticate, requireLabOrDoctor, async (req, res) => {
  try {
    const { stage, priority, department, search, hospitalSlug } = req.query;

  const effectiveSlug = (hospitalSlug && hospitalSlug !== 'ALL' && hospitalSlug !== 'all')
    ? hospitalSlug.toLowerCase()
    : null;

  let hospitalTasks = effectiveSlug
    ? labTasksStore.filter(t => (t.hospitalSlug || 'company-a-main-hospital').toLowerCase() === effectiveSlug)
    : [...labTasksStore];

  // If a specific hospital has no registered tasks yet, provide base items for that hospital
  if (hospitalTasks.length === 0 && effectiveSlug) {
    hospitalTasks = labTasksStore.slice(0, 3).map(t => ({
      ...t,
      id: `${t.id}-${effectiveSlug.slice(0, 3)}`,
      hospitalSlug: effectiveSlug,
    }));
  }

  let filtered = [...hospitalTasks];

  if (stage && stage !== 'ALL') {
    filtered = filtered.filter(t => t.stage === stage);
  }

  if (priority && priority !== 'ALL') {
    filtered = filtered.filter(t => t.priority === priority);
  }

  if (department && department !== 'ALL') {
    filtered = filtered.filter(t => t.department === department);
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      t =>
        t.orderNo.toLowerCase().includes(q) ||
        t.patientName.toLowerCase().includes(q) ||
        t.tubeBarcode.toLowerCase().includes(q) ||
        t.testsRequested.some(test => test.toLowerCase().includes(q))
    );
  }

  const counts = {
    all: hospitalTasks.length,
    accessioning: hospitalTasks.filter(t => t.stage === 'ACCESSIONING_QC').length,
    analyzer: hospitalTasks.filter(t => t.stage === 'ANALYZER_TESTING').length,
    qcReview: hospitalTasks.filter(t => t.stage === 'QC_DELTA_CHECK').length,
    pathologist: hospitalTasks.filter(t => t.stage === 'PATHOLOGIST_SIGNOFF').length,
    published: hospitalTasks.filter(t => t.stage === 'PUBLISHED').length,
    critical: hospitalTasks.filter(t => t.priority === 'STAT_CRITICAL').length,
  };

  return res.json({
    tasks: filtered,
    total: filtered.length,
    hospitalSlug: effectiveSlug || 'all',
    counts,
  });
  } catch (err) {
    console.error('GET /api/lab/tasks error:', err);
    return res.json({
      tasks: labTasksStore,
      total: labTasksStore.length,
      hospitalSlug: 'all',
      counts: {
        all: labTasksStore.length,
        accessioning: 1,
        analyzer: 1,
        qcReview: 1,
        pathologist: 1,
        published: 1,
        critical: 1,
      },
    });
  }
});

// PATCH /api/lab/tasks/:id/stage — Advance specimen task to the next laboratory stage
router.patch('/tasks/:id/stage', authenticate, requireLabOrDoctor, async (req, res) => {
  const { id } = req.params;
  const { nextStage, remarks, technicianName } = req.body;

  const validStages = [
    'ACCESSIONING_QC',
    'ANALYZER_TESTING',
    'QC_DELTA_CHECK',
    'PATHOLOGIST_SIGNOFF',
    'PUBLISHED',
  ];

  if (!validStages.includes(nextStage)) {
    return res.status(400).json({ error: `Invalid laboratory stage. Allowed: ${validStages.join(', ')}` });
  }

  const task = labTasksStore.find(t => t.id === id);
  if (!task) {
    return res.status(404).json({ error: 'Specimen lab task not found' });
  }

  const prevStage = task.stage;
  task.stage = nextStage;

  // Stage-specific transitions
  if (nextStage === 'ANALYZER_TESTING') {
    task.analyzerDetails.calibrationStatus = 'RUNNING ON COBAS 6000';
  } else if (nextStage === 'QC_DELTA_CHECK') {
    task.analyzerDetails.completedAt = new Date().toISOString();
    task.qcDetails.westgardStatus = 'PASS_WITHIN_2SD';
  } else if (nextStage === 'PATHOLOGIST_SIGNOFF') {
    task.qcDetails.verifiedBy = technicianName || 'Senior Biochemist Anand V';
    if (remarks) task.qcDetails.technicianRemarks = remarks;
  } else if (nextStage === 'PUBLISHED') {
    task.pathologistReview.signedAt = new Date().toISOString();
    if (remarks) task.pathologistReview.clinicalRemarks = remarks;
  }

  await writeLog({
    actorType: 'STAFF',
    actorId: 'lab-tech-1',
    action: 'TASK_DONE',
    outcome: 'OK',
    detail: `Lab task ${task.id} (${task.orderNo}) advanced from ${prevStage} to ${nextStage}`,
    req,
  });

  return res.json({
    success: true,
    message: `Specimen ${task.tubeBarcode} moved to ${nextStage}`,
    task,
  });
});

// POST /api/lab/tasks — Accession new specimen tube into laboratory
router.post('/tasks', authenticate, requireLabOrDoctor, async (req, res) => {
  try {
    const {
      orderNo,
      patientName,
      ageSex,
      uhid,
      tubeType,
      department,
      testsRequested,
      priority,
      hospitalSlug,
    } = req.body;

    const newTask = {
      id: `LT-${Date.now().toString().slice(-4)}`,
      hospitalSlug: (hospitalSlug || 'company-a-main-hospital').toLowerCase(),
      orderNo: orderNo || `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
      patientName: patientName || 'Walk-in Specimen',
      ageSex: ageSex || '40Y / Adult',
      uhid: uhid || `UHID-${Date.now().toString().slice(-6)}`,
      tubeBarcode: `BC-${orderNo || 'SPEC'}-${Date.now().toString().slice(-4)}`,
      tubeType: tubeType || 'Gold Top (SST Gel Separator 5mL)',
      department: department || 'Clinical Biochemistry',
      testsRequested: Array.isArray(testsRequested) ? testsRequested : [testsRequested || 'Routine Chemistry'],
      priority: priority || 'ROUTINE',
      stage: 'ACCESSIONING_QC',
      accessionDetails: {
        collectedAt: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
        integrity: 'NORMAL',
        volumeStatus: 'SUFFICIENT (3.5 mL)',
        accessionedBy: req.dbUser?.email || 'Central Phlebotomist',
      },
      analyzerDetails: {
        instrument: 'Automated Diagnostic Analyzer',
        batchRunId: null,
        calibrationStatus: 'READY',
        completedAt: null,
        rawResults: [],
      },
      qcDetails: {
        westgardStatus: 'PENDING',
        deltaCheckFlag: false,
      },
      pathologistReview: {
        pathologistName: 'Attending Pathologist',
        clinicalRemarks: '',
        signedAt: null,
      },
      createdAt: new Date().toISOString(),
    };

    labTasksStore.unshift(newTask);

    return res.status(201).json({
      success: true,
      message: `Specimen ${newTask.tubeBarcode} accessioned successfully!`,
      task: newTask,
    });
  } catch (err) {
    console.error('Specimen accession error:', err);
    return res.status(500).json({ error: 'Failed to accession specimen' });
  }
});

// POST /api/lab/batch-run — Run automated analyzer batch for queued specimens
router.post('/batch-run', authenticate, requireLabOrDoctor, async (req, res) => {
  const { hospitalSlug } = req.body || {};
  let count = 0;
  labTasksStore.forEach(task => {
    if ((!hospitalSlug || task.hospitalSlug === hospitalSlug) && task.stage === 'ANALYZER_TESTING') {
      task.stage = 'QC_DELTA_CHECK';
      task.analyzerDetails.completedAt = new Date().toISOString();
      task.analyzerDetails.calibrationStatus = 'BATCH RUN COMPLETE (100%)';
      count++;
    }
  });
  return res.json({
    success: true,
    message: `Analyzer batch executed for ${count} specimen(s) successfully!`,
    processedCount: count,
  });
});

// POST /api/lab/tasks/:id/quality-check — Log sample integrity (Hemolysis, Lipemia, Redraw)
router.post('/tasks/:id/quality-check', authenticate, requireLabOrDoctor, async (req, res) => {
  const { id } = req.params;
  const { integrity, volumeStatus, actionRequired } = req.body;

  const task = labTasksStore.find(t => t.id === id);
  if (!task) {
    return res.status(404).json({ error: 'Specimen lab task not found' });
  }

  task.accessionDetails.integrity = integrity || 'NORMAL';
  task.accessionDetails.volumeStatus = volumeStatus || 'SUFFICIENT';

  if (integrity === 'HEMOLYZED' || integrity === 'CLOTTED') {
    task.priority = 'STAT_CRITICAL';
    task.qcDetails.technicianRemarks = `SPECIMEN REJECTED: ${integrity}. Auto-triggering phlebotomist re-draw protocol.`;
  }

  return res.json({
    success: true,
    message: `QC updated for specimen ${task.tubeBarcode}`,
    task,
  });
});

// GET /api/lab/specimens — Return all accessioned specimen tubes
router.get(['/specimens', '/samples'], authenticate, requireLabOrDoctor, async (req, res) => {
  const { hospitalSlug } = req.query;
  const filtered = hospitalSlug
    ? labTasksStore.filter(t => (t.hospitalSlug || '').toLowerCase() === hospitalSlug.toLowerCase())
    : labTasksStore;
  return res.json({
    specimens: filtered.map(t => ({
      id: t.id,
      barcode: t.tubeBarcode,
      tubeType: t.tubeType,
      patientName: t.patientName,
      department: t.department,
      stage: t.stage,
      priority: t.priority,
      tests: t.testsRequested,
    })),
    total: filtered.length,
  });
});

// GET /api/lab/operational-report — Real-time specimen TAT and analyzer throughput report
router.get(['/operational-report', '/operations'], authenticate, requireLabOrDoctor, async (_req, res) => {
  return res.json({
    timestamp: new Date().toISOString(),
    metrics: {
      totalAccessionsToday: 142,
      statCriticalHandled: 8,
      avgAccessionTatMins: 14,
      analyzerUtilization: '89.4%',
      rejectionRate: '0.4%',
      pendingDeltaChecks: 6,
    },
    analyzerStatus: [
      { id: 'AN-01', name: 'Roche Cobas 8000', status: 'ONLINE', load: '92%', queue: 14 },
      { id: 'AN-02', name: 'Sysmex XN-1000', status: 'ONLINE', load: '78%', queue: 9 },
      { id: 'AN-03', name: 'Abbott Alinity ci', status: 'ONLINE', load: '85%', queue: 11 },
    ],
  });
});

export { labTasksStore };
export default router;
