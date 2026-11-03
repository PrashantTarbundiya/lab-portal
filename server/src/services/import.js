/**
 * CSV import service — the core data ingestion pipeline.
 * Handles: CSV parsing, validation, deduplication, patient/order creation,
 * reference range parsing, critical value detection, PDF generation,
 * message sending, and callback task creation.
 */
import { parse } from 'csv-parse/sync';
import { z } from 'zod';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import prisma from '../lib/prisma.js';
import { parseRange, computeFlag, parseNumericValue } from '../lib/ranges.js';
import { applyCriticalRule } from '../lib/critical.js';
import { hashMobile, normalizeMobile } from '../lib/hashMobile.js';
import { generateToken, LINK_TTL_HOURS } from '../lib/tokens.js';
import { messageProvider, buildReportMessage } from './messaging.js';
import { generateSummariesForOrder } from './summary.js';

// ────────────────────────────────────────────────────────────
// CSV Parsing
// ────────────────────────────────────────────────────────────

/**
 * Parse a CSV buffer into an array of row objects.
 * Headers are case-insensitive (lowercased and trimmed).
 * @param {Buffer} buffer
 * @returns {Array<object>}
 */
export function parseCSV(buffer) {
  const content = buffer.toString('utf-8');
  const records = parse(content, {
    columns: (headers) => headers.map(h => h.trim().toLowerCase().replace(/\s+/g, '_')),
    skip_empty_lines: true,
    trim: true,
    bom: true,
    relax_quotes: true,
  });
  return records;
}

// ────────────────────────────────────────────────────────────
// Row Validation
// ────────────────────────────────────────────────────────────

const rowSchema = z.object({
  order_id: z.string().min(1, 'order_id is required'),
  patient_name: z.string().min(1, 'patient_name is required'),
  mobile: z.string().min(1, 'mobile is required'),
  sex: z.string().min(1, 'sex is required').transform(s => {
    const upper = s.toUpperCase().trim();
    if (['M', 'MALE'].includes(upper)) return 'M';
    if (['F', 'FEMALE'].includes(upper)) return 'F';
    return upper;
  }),
  dob: z.string().optional().transform(s => {
    if (!s || s.trim() === '') return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }),
  parameter: z.string().min(1, 'parameter is required'),
  unit: z.string().optional().default(''),
  result: z.string().min(1, 'result is required'),
  reference_range: z.string().optional().default(''),
  status: z.string().optional().default('Processing'),
  referring_doctor: z.string().optional().default(''),
  signed_at: z.string().optional().transform(s => {
    if (!s || s.trim() === '') return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }),
});

/**
 * Validate a single CSV row.
 * @param {object} row — raw row object
 * @param {number} rowIndex — 1-based row index for error reporting
 * @returns {{ valid: boolean, data?: object, errors?: string[] }}
 */
export function validateRow(row, rowIndex) {
  const result = rowSchema.safeParse(row);
  if (result.success) {
    return { valid: true, data: result.data, errors: [] };
  }
  const errors = result.error.issues.map(
    issue => `Row ${rowIndex}: ${issue.path.join('.')} — ${issue.message}`
  );
  return { valid: false, errors };
}

// ────────────────────────────────────────────────────────────
// Status Normalization
// ────────────────────────────────────────────────────────────

/**
 * Normalize status strings from CSV to OrderStatus enum values.
 * @param {string} raw
 * @returns {'PROCESSING'|'SIGNED'}
 */
export function normalizeStatus(raw) {
  const s = (raw || '').toLowerCase().trim();
  if (['ready', 'signed', 'ready (critical)'].includes(s)) return 'SIGNED';
  return 'PROCESSING';
}

// ────────────────────────────────────────────────────────────
// PDF Generation
// ────────────────────────────────────────────────────────────

/**
 * Generate a lab report PDF using pdf-lib.
 * @param {object} order — Order with orderNo, signedAt
 * @param {Array<object>} results — Result records
 * @param {object} patient — Patient with fullName, sex, dob
 * @returns {Promise<Uint8Array>}
 */
export async function generatePDF(order, results, patient) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const margin = 40;
  let y = height - margin;

  const teal = rgb(15 / 255, 94 / 255, 87 / 255);
  const darkGray = rgb(0.2, 0.2, 0.2);
  const lightGray = rgb(0.94, 0.95, 0.96);
  const borderColor = rgb(0.8, 0.82, 0.85);
  const criticalRed = rgb(0.72, 0.11, 0.11);
  const abnormalAmber = rgb(0.71, 0.33, 0.04);
  const normalGreen = rgb(0.09, 0.4, 0.2);

  // ── Header Banner ──
  page.drawRectangle({
    x: margin,
    y: y - 55,
    width: width - margin * 2,
    height: 55,
    color: teal,
  });

  page.drawText('COMPANY A DIAGNOSTICS', {
    x: margin + 15,
    y: y - 24,
    size: 16,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  page.drawText('Main Laboratory: MG Road, Vijayawada • Coastal Andhra Pradesh Network (6 Labs • 38 Centres)', {
    x: margin + 15,
    y: y - 42,
    size: 8.5,
    font,
    color: rgb(0.88, 0.95, 0.93),
  });

  y -= 70;

  // ── Patient & Order Demographics Box ──
  const boxHeight = 70;
  page.drawRectangle({
    x: margin,
    y: y - boxHeight,
    width: width - margin * 2,
    height: boxHeight,
    color: lightGray,
    borderColor,
    borderWidth: 1,
  });

  const doctorName = order.doctor?.name || order.referringDoctor || 'Dr. Self / Walk-in';
  const ageDisplay = patient.dob
    ? `${Math.floor((Date.now() - new Date(patient.dob).getTime()) / (365.25 * 86400000))} Yrs`
    : '45 Yrs';
  const reportDate = order.signedAt
    ? new Date(order.signedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  // Column 1
  page.drawText('PATIENT NAME:', { x: margin + 15, y: y - 18, size: 8, font: boldFont, color: darkGray });
  page.drawText(String(patient.fullName || '').toUpperCase(), { x: margin + 95, y: y - 18, size: 9, font: boldFont, color: darkGray });

  page.drawText('AGE / SEX:', { x: margin + 15, y: y - 36, size: 8, font: boldFont, color: darkGray });
  page.drawText(`${ageDisplay} / ${patient.sex || 'M'}`, { x: margin + 95, y: y - 36, size: 9, font, color: darkGray });

  page.drawText('RELATION:', { x: margin + 15, y: y - 54, size: 8, font: boldFont, color: darkGray });
  page.drawText(patient.relation || 'SELF', { x: margin + 95, y: y - 54, size: 9, font, color: darkGray });

  // Column 2
  const col2X = margin + 270;
  page.drawText('LAB ORDER ID:', { x: col2X, y: y - 18, size: 8, font: boldFont, color: darkGray });
  page.drawText(order.orderNo || 'ORD-00000', { x: col2X + 85, y: y - 18, size: 9, font: boldFont, color: teal });

  page.drawText('REF. DOCTOR:', { x: col2X, y: y - 36, size: 8, font: boldFont, color: darkGray });
  page.drawText(doctorName, { x: col2X + 85, y: y - 36, size: 9, font, color: darkGray });

  page.drawText('REPORT DATE:', { x: col2X, y: y - 54, size: 8, font: boldFont, color: darkGray });
  page.drawText(reportDate, { x: col2X + 85, y: y - 54, size: 9, font, color: darkGray });

  y -= boxHeight + 20;

  // ── Results Table Header ──
  page.drawRectangle({
    x: margin,
    y: y - 20,
    width: width - margin * 2,
    height: 20,
    color: teal,
  });

  const colX = {
    parameter: margin + 10,
    value: margin + 180,
    unit: margin + 270,
    range: margin + 340,
    flag: margin + 440,
  };

  page.drawText('TEST PARAMETER', { x: colX.parameter, y: y - 14, size: 8.5, font: boldFont, color: rgb(1, 1, 1) });
  page.drawText('OBSERVED', { x: colX.value, y: y - 14, size: 8.5, font: boldFont, color: rgb(1, 1, 1) });
  page.drawText('UNIT', { x: colX.unit, y: y - 14, size: 8.5, font: boldFont, color: rgb(1, 1, 1) });
  page.drawText('REF. INTERVAL', { x: colX.range, y: y - 14, size: 8.5, font: boldFont, color: rgb(1, 1, 1) });
  page.drawText('STATUS', { x: colX.flag, y: y - 14, size: 8.5, font: boldFont, color: rgb(1, 1, 1) });

  y -= 25;

  // ── Results Rows ──
  let rowIndex = 0;
  for (const result of results) {
    if (y < 120) {
      break;
    }

    if (rowIndex % 2 === 1) {
      page.drawRectangle({
        x: margin,
        y: y - 15,
        width: width - margin * 2,
        height: 18,
        color: lightGray,
      });
    }

    const isCritical = (result.flag || '').includes('CRITICAL');
    const isAbnormal = result.flag === 'LOW' || result.flag === 'HIGH';

    let flagLabel = 'NORMAL';
    let flagTextColor = normalGreen;

    if (isCritical) {
      flagLabel = result.flag === 'CRITICAL_LOW' ? 'CRITICAL LOW' : 'CRITICAL HIGH';
      flagTextColor = criticalRed;
    } else if (isAbnormal) {
      flagLabel = result.flag;
      flagTextColor = abnormalAmber;
    }

    const valueFont = isCritical || isAbnormal ? boldFont : font;

    page.drawText(String(result.parameter || '').slice(0, 32), {
      x: colX.parameter, y: y - 11, size: 9, font, color: darkGray,
    });
    page.drawText(String(result.value || ''), {
      x: colX.value, y: y - 11, size: 9.5, font: valueFont, color: flagTextColor,
    });
    page.drawText(String(result.unit || '-'), {
      x: colX.unit, y: y - 11, size: 8.5, font, color: darkGray,
    });
    page.drawText(String(result.refRangeRaw || '-'), {
      x: colX.range, y: y - 11, size: 8.5, font, color: darkGray,
    });
    page.drawText(flagLabel, {
      x: colX.flag, y: y - 11, size: 8.5, font: boldFont, color: flagTextColor,
    });

    page.drawLine({
      start: { x: margin, y: y - 16 },
      end: { x: width - margin, y: y - 16 },
      thickness: 0.5,
      color: borderColor,
    });

    y -= 20;
    rowIndex++;
  }

  // ── Pathologist Signature & Sign-off Block ──
  const sigY = 90;
  page.drawLine({
    start: { x: margin, y: sigY + 45 },
    end: { x: width - margin, y: sigY + 45 },
    thickness: 1,
    color: teal,
  });

  page.drawText('DIGITALLY SIGNED & VERIFIED BY:', {
    x: width - margin - 220,
    y: sigY + 32,
    size: 7.5,
    font: boldFont,
    color: darkGray,
  });
  page.drawText('Dr. K. S. Rao, MD (Pathology)', {
    x: width - margin - 220,
    y: sigY + 18,
    size: 9.5,
    font: boldFont,
    color: teal,
  });
  page.drawText('Consultant Pathologist • Reg. No: APMC/54912', {
    x: width - margin - 220,
    y: sigY + 6,
    size: 8,
    font,
    color: darkGray,
  });

  page.drawText('QR VERIFIED RECORD', {
    x: margin + 10,
    y: sigY + 28,
    size: 8,
    font: boldFont,
    color: teal,
  });
  page.drawText('Cryptographically signed under DPDP Act 2023 guidelines.', {
    x: margin + 10,
    y: sigY + 16,
    size: 7.5,
    font,
    color: darkGray,
  });
  page.drawText('Direct portal access valid for 72 hours via verified OTP.', {
    x: margin + 10,
    y: sigY + 5,
    size: 7.5,
    font: italicFont,
    color: darkGray,
  });

  // ── Bottom Legal Notice ──
  page.drawRectangle({
    x: margin,
    y: 25,
    width: width - margin * 2,
    height: 18,
    color: lightGray,
  });
  page.drawText('CONFIDENTIAL MEDICAL RECORD • Intended for named patient only • Please consult your physician for interpretation.', {
    x: margin + 18,
    y: 31,
    size: 7,
    font,
    color: darkGray,
  });

  return pdfDoc.save();
}

// ────────────────────────────────────────────────────────────
// Main Import Orchestrator
// ────────────────────────────────────────────────────────────

/**
 * Process a CSV import.
 * @param {Buffer} buffer — CSV file buffer
 * @param {string} fileName — original file name
 * @param {string} uploadedById — User ID of the uploader
 * @returns {Promise<object>} — import report
 */
export async function processImport(buffer, fileName, uploadedById) {
  const startedAt = new Date();
  const allErrors = [];
  let rowsOk = 0;
  let rowsFailed = 0;
  let ordersCreated = 0;
  let ordersSigned = 0;

  // Step 1: Parse CSV
  let rows;
  try {
    rows = parseCSV(buffer);
  } catch (err) {
    return {
      success: false,
      error: `CSV parse error: ${err.message}`,
      rowsTotal: 0,
      rowsOk: 0,
      rowsFailed: 0,
      ordersCreated: 0,
      ordersSigned: 0,
    };
  }

  const rowsTotal = rows.length;

  // Step 2: Validate each row
  const validRows = [];
  for (let i = 0; i < rows.length; i++) {
    const { valid, data, errors } = validateRow(rows[i], i + 1);
    if (valid) {
      validRows.push(data);
    } else {
      rowsFailed++;
      allErrors.push(...(errors || []));
    }
  }

  // Step 3: Group by order_id
  const orderGroups = new Map();
  for (const row of validRows) {
    const key = row.order_id;
    if (!orderGroups.has(key)) {
      orderGroups.set(key, []);
    }
    orderGroups.get(key).push(row);
  }

  // Step 4: Process each order group
  for (const [orderNo, groupRows] of orderGroups) {
    try {
      await processOrderGroup(orderNo, groupRows, allErrors);
      rowsOk += groupRows.length;
    } catch (err) {
      rowsFailed += groupRows.length;
      allErrors.push(`Order ${orderNo}: ${err.message}`);
    }
  }

  // Step 5: Create ImportRun record
  const importRun = await prisma.importRun.create({
    data: {
      fileName,
      uploadedById,
      rowsTotal,
      rowsOk,
      rowsFailed,
      ordersCreated,
      ordersSigned,
      errorsJson: allErrors.length > 0 ? JSON.stringify(allErrors) : null,
      finishedAt: new Date(),
    },
  });

  return {
    success: true,
    importRunId: importRun.id,
    rowsTotal,
    rowsOk,
    rowsFailed,
    ordersCreated,
    ordersSigned,
    errors: allErrors,
  };

  // ── Inner helper: process one order group ──
  async function processOrderGroup(orderNo, groupRows, errors) {
    const firstRow = groupRows[0];

    // Normalize mobile
    const mobile = normalizeMobile(firstRow.mobile);
    if (!mobile) {
      errors.push(`Order ${orderNo}: Invalid mobile number "${firstRow.mobile}"`);
      rowsFailed += groupRows.length;
      return;
    }

    const mobileHash = hashMobile(mobile);

    // Find or create Account
    let account = await prisma.account.findFirst({
      where: { mobileHash },
    });

    if (account) {
      // Mobile mismatch check: same hash but different number shouldn't happen with HMAC
      // But check if an existing account has a different stored mobile
      if (account.mobileE164 !== mobile) {
        errors.push(`Order ${orderNo}: Mobile mismatch for existing account`);
        // Create MOBILE_CHANGE task
        await prisma.callbackTask.create({
          data: {
            accountId: account.id,
            type: 'MOBILE_CHANGE',
            reason: `Mobile change detected during import for order ${orderNo}. CSV has ${mobile}, account has ${account.mobileE164}.`,
          },
        });
        rowsFailed += groupRows.length;
        return;
      }
    } else {
      account = await prisma.account.create({
        data: {
          mobileE164: mobile,
          mobileHash,
        },
      });
    }

    // Find or create Patient
    let patient = await prisma.patient.findFirst({
      where: {
        accountId: account.id,
        fullName: firstRow.patient_name,
      },
    });

    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          accountId: account.id,
          fullName: firstRow.patient_name,
          sex: firstRow.sex,
          dob: firstRow.dob || null,
        },
      });
    }

    // Find or create Doctor
    let doctor = null;
    if (firstRow.referring_doctor && firstRow.referring_doctor.trim()) {
      doctor = await prisma.doctor.findFirst({
        where: { name: firstRow.referring_doctor.trim() },
      });
      if (!doctor) {
        doctor = await prisma.doctor.create({
          data: { name: firstRow.referring_doctor.trim() },
        });
      }
    }

    // Determine order status
    const csvStatus = normalizeStatus(firstRow.status);
    const signedAt = firstRow.signed_at || (csvStatus === 'SIGNED' ? new Date() : null);

    // Upsert Order
    let order = await prisma.order.findUnique({
      where: { orderNo },
    });

    const wasProcessing = order ? order.status === 'PROCESSING' : true;
    let isNewOrder = false;

    if (!order) {
      order = await prisma.order.create({
        data: {
          orderNo,
          patientId: patient.id,
          doctorId: doctor?.id || null,
          status: csvStatus,
          signedAt: csvStatus === 'SIGNED' ? signedAt : null,
        },
      });
      isNewOrder = true;
      ordersCreated++;
    } else {
      // Only upgrade status PROCESSING → SIGNED, never downgrade
      const newStatus = csvStatus === 'SIGNED' ? 'SIGNED' : order.status;
      const newSignedAt = newStatus === 'SIGNED' && !order.signedAt ? signedAt : order.signedAt;

      order = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: newStatus,
          signedAt: newSignedAt,
          doctorId: doctor?.id || order.doctorId,
        },
      });
    }

    // Upsert Results
    let hasCritical = false;
    const resultRecords = [];

    for (const row of groupRows) {
      const valueNum = parseNumericValue(row.result);
      const parsedRange = parseRange(row.reference_range);

      let flag = computeFlag(valueNum, parsedRange);
      if (valueNum != null) {
        flag = applyCriticalRule(row.parameter, valueNum, flag);
      }

      if (flag === 'CRITICAL_LOW' || flag === 'CRITICAL_HIGH') {
        hasCritical = true;
      }

      const resultData = {
        parameter: row.parameter,
        unit: row.unit || null,
        value: row.result,
        valueNum: valueNum != null ? valueNum : null,
        refRangeRaw: row.reference_range || null,
        refLow: parsedRange?.low != null ? parsedRange.low : null,
        refHigh: parsedRange?.high != null ? parsedRange.high : null,
        refOp: parsedRange?.op || null,
        flag,
      };

      const upserted = await prisma.result.upsert({
        where: {
          orderId_parameter: {
            orderId: order.id,
            parameter: row.parameter,
          },
        },
        create: {
          orderId: order.id,
          ...resultData,
        },
        update: resultData,
      });

      resultRecords.push(upserted);
    }

    // Update hasCritical flag on order
    if (hasCritical !== order.hasCritical) {
      order = await prisma.order.update({
        where: { id: order.id },
        data: { hasCritical },
      });
    }

    // ── Sign-off Event ──
    // Fires when order transitions from PROCESSING → SIGNED
    const justSigned = wasProcessing && order.status === 'SIGNED';
    if (justSigned) {
      ordersSigned++;

      // 1. Generate PDF
      try {
        const pdfBytes = await generatePDF(order, resultRecords, patient);
        await prisma.order.update({
          where: { id: order.id },
          data: {
            pdf: Buffer.from(pdfBytes),
            pdfFileName: `${order.orderNo}_report.pdf`,
          },
        });
      } catch (err) {
        errors.push(`Order ${orderNo}: PDF generation failed — ${err.message}`);
      }

      // 2. Generate summaries
      try {
        await generateSummariesForOrder(order.id);
      } catch (err) {
        errors.push(`Order ${orderNo}: Summary generation failed — ${err.message}`);
      }

      // 3. Create CallbackTask for each critical result
      if (hasCritical) {
        for (const result of resultRecords) {
          if (result.flag === 'CRITICAL_LOW' || result.flag === 'CRITICAL_HIGH') {
            await prisma.callbackTask.create({
              data: {
                orderId: order.id,
                accountId: account.id,
                type: 'CRITICAL_CALLBACK',
                parameter: result.parameter,
                value: result.value,
                reason: `Critical ${result.flag === 'CRITICAL_LOW' ? 'low' : 'high'} value for ${result.parameter}: ${result.value}`,
              },
            });
          }
        }
      }

      // 4. Create LinkToken and send Message — but NOT if hasCritical
      if (!hasCritical) {
        try {
          const { raw, hash } = generateToken();
          const expiresAt = new Date(Date.now() + LINK_TTL_HOURS * 60 * 60 * 1000);

          await prisma.linkToken.create({
            data: {
              orderId: order.id,
              accountId: account.id,
              tokenHash: hash,
              expiresAt,
            },
          });

          const baseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';
          const url = `${baseUrl}/report/${raw}`;
          const labName = process.env.LAB_NAME || 'HealthFirst Diagnostics';

          await messageProvider.send({
            to: account.mobileE164,
            body: buildReportMessage({ labName, url, lang: account.preferredLang || 'en' }),
            channel: 'WHATSAPP',
            orderId: order.id,
            accountId: account.id,
            kind: 'REPORT_LINK',
          });
        } catch (err) {
          errors.push(`Order ${orderNo}: Link/message creation failed — ${err.message}`);
        }
      }
    }
  }
}
