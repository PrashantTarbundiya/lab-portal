import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { maskPhone, maskName } from '../lib/mask.js';
import { writeLog } from '../lib/audit.js';
import { getMessageStatus } from '../services/messaging.js';

const router = Router();

// GET /api/orders
router.get('/', authenticate, async (req, res) => {
  try {
    // ─── PATIENT VIEW ───
    if (req.dbAccount) {
      const patientId = req.query.patientId;
      const whereClause = {
        patient: { accountId: req.dbAccount.id },
      };
      if (patientId) {
        whereClause.patientId = String(patientId);
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
        return {
          id: o.id,
          orderNo: o.orderNo,
          patientName: o.patient.fullName,
          relation: o.patient.relation,
          date: o.signedAt || o.createdAt,
          status: o.status,
          isHeld,
          testName: o.results.length > 1 ? `${testName} + ${o.results.length - 1} more` : testName,
          resultCount: o.results.length,
          hasCritical: o.hasCritical,
        };
      });

      return res.json({ orders: formatted });
    }

    // ─── DOCTOR VIEW ───
    if (req.dbUser && req.dbUser.role === 'DOCTOR') {
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
          patient: true,
          doctor: true,
          results: true,
        },
      });

      const formatted = orders.map(o => ({
        id: o.id,
        orderNo: o.orderNo,
        patientName: o.patient.fullName, // Doctor sees real name
        date: o.signedAt || o.createdAt,
        status: o.status,
        parameters: o.results.map(r => r.parameter).join(', '),
        resultCount: o.results.length,
      }));

      return res.json({ orders: formatted });
    }

    // ─── STAFF VIEW (FRONT_DESK) ───
    if (req.dbUser && req.dbUser.role === 'FRONT_DESK') {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const skip = (page - 1) * limit;

      const { search, status, deliveryStatus, dateFrom, dateTo } = req.query;

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
            linkTokens: { orderBy: { createdAt: 'desc' }, take: 1 },
            messages: { orderBy: { createdAt: 'desc' }, take: 1 },
            callbackTasks: { where: { status: 'OPEN' } },
          },
        }),
      ]);

      const formatted = orders.map(o => {
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
          patientPhoneMasked: maskPhone(o.patient.account?.mobileE164),
          status: o.status,
          linkStatus,
          deliveryStatus: effectiveDelivery,
          hasCritical: o.hasCritical,
          hasOpenCallback: o.callbackTasks.length > 0,
          date: o.signedAt || o.createdAt,
        };
      });

      return res.json({
        orders: formatted,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
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

    const order = await prisma.order.findUnique({
      where: { id },
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

// GET /api/orders/:id/pdf
router.get('/:id/pdf', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
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

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

    return res.send(Buffer.from(pdfBuffer));
  } catch (err) {
    console.error('GET /api/orders/:id/pdf error:', err);
    return res.status(500).json({ error: 'Failed to download PDF' });
  }
});

// POST /api/orders/:id/ask-ai
router.post('/:id/ask-ai', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { question, prompt: rawPrompt, lang = 'en' } = req.body;
    const userPrompt = (question || rawPrompt || '').trim();

    if (!userPrompt) {
      return res.status(400).json({ error: 'Please provide a question or prompt for the AI' });
    }

    const order = await prisma.order.findUnique({
      where: { id },
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

    const langName = lang === 'te' ? 'Telugu (తెలుగు)' : lang === 'hi' ? 'Hindi (हिंदी)' : 'English';

    const systemPrompt = `You are "Labby", a friendly, knowledgeable, and empathetic clinical AI diagnostic companion at Company A Diagnostics in Vijayawada, Andhra Pradesh, India.
A patient or doctor is asking a question about a diagnostic lab report.

DIAGNOSTIC REPORT CONTEXT:
Order Number: ${order.orderNo}
Patient Name: ${order.patient.fullName} (${order.patient.sex || 'Unknown'}, Age: ${order.patient.dob ? Math.floor((new Date() - new Date(order.patient.dob)) / (365.25 * 24 * 3600 * 1000)) + ' years' : 'Adult'})
Referring Doctor: ${order.doctor?.name || 'Self-referred'}
Status: ${order.status}
Critical Alert: ${order.hasCritical ? 'YES - Contains Critical Value(s)' : 'NO'}

LABORATORY TEST RESULTS:
${resultsSummary}

GUIDELINES FOR LABBY:
1. Answer the user's question clearly, warmly, and empathetically in ${langName}.
2. Use clean structure: short paragraphs, bullet points for lists, and a clean markdown table (| Parameter | Your Value | Normal Range | Status |) if comparing parameters.
3. Highlight key terms with **bold**.
4. If asked about abnormal or critical flags, explain biological functions and potential causes in simple, reassuring terms.
5. If there is a CRITICAL result (e.g. Potassium > 6.5 mmol/L), clearly advise prompt medical consultation.
6. NEVER issue a final medical diagnosis or prescribe specific drug dosages.
7. End with a helpful, friendly tip on discussing these numbers with their physician.`;

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

    // Fallback if AI service is offline or rate limited
    if (!aiAnswer) {
      const abnormalList = order.results.filter(r => r.flag && r.flag !== 'NORMAL');
      if (lang === 'te') {
        aiAnswer = `మీ ల్యాబ్ రిపోర్ట్ ఆర్డర్ #${order.orderNo} విశ్లేషణ:\n\n` +
          (abnormalList.length > 0
            ? `మీ నివేదికలో ${abnormalList.map(r => `${r.parameter} (${r.value} ${r.unit})`).join(', ')} సాధారణ పరిధికి భిన్నంగా ఉన్నాయి. ${order.hasCritical ? 'ఈ నివేదికలో క్రిటికల్ స్థాయి ఫలితం ఉంది, కావున వెంటనే మీ డాక్టర్‌ను సంప్రదించండి.' : 'దయచేసి తదుపరి సలహా కొరకు మీ డాక్టర్‌ను సంప్రదించండి.'}`
            : 'మీ అన్ని పరీక్ష ఫలితాలు సాధారణ పరిధిలో ఉన్నాయి. ఆరోగ్యకరమైన జీవనశైలిని కొనసాగించండి.') +
          `\n\nప్రశ్న: "${userPrompt}"\nగమనిక: ఈ సమాచారం అవగాహన కోసం మాత్రమే. ఖచ్చితమైన చికిత్స కోసం మీ డాక్టర్‌ను సంప్రదించండి.`;
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
router.post('/ai/general-ask', authenticate, async (req, res) => {
  try {
    const { question, prompt: rawPrompt, lang = 'en' } = req.body;
    const userPrompt = (question || rawPrompt || '').trim();

    if (!userPrompt) {
      return res.status(400).json({ error: 'Please provide a question' });
    }

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3.5-super-vl:free';
    const langName = lang === 'te' ? 'Telugu (తెలుగు)' : lang === 'hi' ? 'Hindi (हिंदी)' : 'English';

    const systemPrompt = `You are "Labby", a friendly, empathetic clinical AI companion for Company A Diagnostics in Vijayawada, India.
Answer the user's question clearly, helpfully, and empathetically in ${langName}.
Guidelines:
1. Provide accurate educational information regarding medical tests, fasting preparation, and general wellness.
2. Structure your reply nicely with bullet points and bold key terms. If explaining multiple items, use a clean markdown table.
3. Maintain patient safety: Do not provide definitive diagnosis or prescribe drug doses.
4. Always remind them to discuss their results with their physician.`;

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

    if (!aiAnswer) {
      if (lang === 'te') {
        aiAnswer = `మీ ప్రశ్నకు ధన్యవాదాలు: "${userPrompt}"\n\nల్యాబ్ పరీక్షలు, ఉపవాస నియమాలు లేదా రక్త నమూనా సేకరణకు సంబంధించిన మరింత సమాచారం కొరకు మా ల్యాబ్ కేంద్రం లేదా మీ వైద్యుడిని సంప్రదించండి. మీ పరీక్ష నివేదికను పోర్టల్‌లో తెరవడం ద్వారా నిర్దిష్ట ఫలితాల విశ్లేషణను పొందవచ్చు.`;
      } else {
        aiAnswer = `Thank you for your question: "${userPrompt}".\n\nFor questions regarding laboratory tests, fasting requirements, or specimen collection, please consult our front-desk or your treating physician. You can also view your specific report in the portal to see custom AI analyses based on your biological values.`;
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

