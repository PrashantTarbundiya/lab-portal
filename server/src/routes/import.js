import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../lib/prisma.js';
import { authenticate, requireStaff } from '../middleware/auth.js';
import { processImport } from '../services/import.js';
import { writeLog } from '../lib/audit.js';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const upload = multer({
  limits: { fileSize: 4 * 1024 * 1024 }, // 4 MB per spec
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed (max 4 MB)'));
    }
  },
  storage: multer.memoryStorage(),
});

// POST /api/import/upload
router.post('/upload', authenticate, requireStaff, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a CSV file' });
    }

    const report = await processImport(req.file.buffer, req.file.originalname, req.dbUser.id);

    await writeLog({
      actorType: 'STAFF',
      actorId: req.dbUser.id,
      action: 'IMPORT',
      outcome: 'OK',
      detail: `Imported ${req.file.originalname}: ${report.rowsOk}/${report.rowsTotal} ok`,
      req,
    });

    return res.json({ success: true, report });
  } catch (err) {
    console.error('POST /api/import/upload error:', err);
    return res.status(500).json({ error: err.message || 'Import failed' });
  }
});

// POST /api/import/simulate
// Simulates LIS dropping files in a folder
router.post('/simulate', authenticate, requireStaff, async (req, res) => {
  try {
    const fileType = req.body.fileType || 'sample'; // 'sample' or 'update'
    const fileName = fileType === 'update' ? 'lis_export_update.csv' : 'lis_export_sample.csv';
    const filePath = path.resolve(__dirname, '../../../sample-data', fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: `Sample file ${fileName} not found` });
    }

    const buffer = fs.readFileSync(filePath);
    const report = await processImport(buffer, fileName, req.dbUser.id);

    await writeLog({
      actorType: 'STAFF',
      actorId: req.dbUser.id,
      action: 'IMPORT',
      outcome: 'OK',
      detail: `Simulated LIS import: ${fileName}`,
      req,
    });

    return res.json({ success: true, report, fileName });
  } catch (err) {
    console.error('POST /api/import/simulate error:', err);
    return res.status(500).json({ error: err.message || 'Simulation failed' });
  }
});

// GET /api/import/runs
router.get('/runs', authenticate, requireStaff, async (req, res) => {
  try {
    const runs = await prisma.importRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: 20,
      include: {
        uploadedBy: { select: { name: true, email: true } },
      },
    });

    return res.json({ runs });
  } catch (err) {
    console.error('GET /api/import/runs error:', err);
    return res.status(500).json({ error: 'Failed to fetch import runs' });
  }
});

// GET /api/import/runs/:id
router.get('/runs/:id', authenticate, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const run = await prisma.importRun.findUnique({
      where: { id },
      include: {
        uploadedBy: { select: { name: true, email: true } },
      },
    });

    if (!run) {
      return res.status(404).json({ error: 'Import run not found' });
    }

    return res.json({ run });
  } catch (err) {
    console.error('GET /api/import/runs/:id error:', err);
    return res.status(500).json({ error: 'Failed to fetch import run' });
  }
});

export default router;

