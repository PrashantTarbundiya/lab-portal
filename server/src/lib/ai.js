/**
 * Labby Clinical AI Diagnostic Engine
 * Queries the user-provided OpenRouter AI Model directly.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
try {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
  dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
} catch (_) {}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const PRIMARY_MODEL = process.env.OPENROUTER_MODEL;

const getActiveModel = () => process.env.OPENROUTER_MODEL || PRIMARY_MODEL || 'nvidia/nemotron-3.5-super-vl:free';
const getApiKey = () => process.env.OPENROUTER_API_KEY || OPENROUTER_API_KEY || '';

const CANDIDATE_MODELS = [
  PRIMARY_MODEL,
  'nvidia/nemotron-3.5-super-vl:free',
  'nvidia/nemotron-3.5-lightning:free',
].filter(Boolean);

/**
 * Clean model reasoning / think tags from content
 */
function cleanAIOutput(text) {
  if (!text) return '';
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/^Here('s| is) a thinking process:[\s\S]*?(?=\n\n(?:[A-Z0-9#\*]|$))/i, '')
    .trim();
}

/**
 * Query OpenRouter AI Model directly
 */
async function queryOpenRouterModels(systemPrompt, userPrompt) {
  const apiKey = getApiKey();
  const currentModel = getActiveModel();

  if (!apiKey) {
    console.warn('[Labby AI] No OPENROUTER_API_KEY found.');
    return null;
  }

  const candidateModels = [
    currentModel,
    'nvidia/nemotron-3.5-super-vl:free',
    'nvidia/nemotron-3.5-lightning:free',
  ].filter((m, idx, arr) => m && arr.indexOf(m) === idx);

  for (const model of candidateModels) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 35000); 

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 350,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        console.warn(`[Labby AI] Model ${model} returned HTTP ${res.status}, checking next candidate...`);
        continue;
      }

      const data = await res.json();
      const rawContent = data.choices?.[0]?.message?.content;
      if (!rawContent) {
        console.warn(`[Labby AI] Model ${model} returned empty content, checking next candidate...`);
        continue;
      }

      const cleaned = cleanAIOutput(rawContent);
      if (cleaned && cleaned.length > 5) {
        return { answer: cleaned, model };
      }
    } catch (err) {
      console.warn(`[Labby AI] Model ${model} request error: ${err.message}`);
    }
  }

  return null;
}

/**
 * Handle Order-Specific Question
 */
export async function handleOrderAskAI(order, userPrompt, lang = 'en') {
  const isTelugu = lang === 'te' || /[\u0C00-\u0C7F]/.test(userPrompt) || /telugu/i.test(userPrompt);
  const isHindi = lang === 'hi' || /[\u0900-\u097F]/.test(userPrompt) || /hindi/i.test(userPrompt);

  const resultsSummary = (order.results || []).map(r => {
    return `- ${r.parameter}: ${r.value} ${r.unit || ''} (Range: ${r.refRangeRaw || 'Normal'}) [Flag: ${r.flag || 'NORMAL'}]`;
  }).join('\n');

  let langInstruction = 'Respond in clear, empathetic English.';
  if (isTelugu) {
    langInstruction = 'Respond directly and entirely in Telugu script (తెలుగు). Use clear Telugu medical terms.';
  } else if (isHindi) {
    langInstruction = 'Respond directly and entirely in Hindi script (हिन्दी).';
  }

  const systemPrompt = `You are "Labby", a clinical AI diagnostic assistant for Company A Diagnostics in Vijayawada, India.
Explain the laboratory report for Order #${order.orderNo} accurately, helpfully, and reassuringly.
Patient: ${order.patient?.fullName || 'Patient'}
Referring Doctor: ${order.doctor?.name || 'Attending Physician'}
Investigation Findings:
${resultsSummary}

${langInstruction}
Highlight key values with **bold**, use bullet points, and present table comparisons where appropriate.
IMPORTANT: Reply directly to the patient. Do NOT output internal reasoning, drafting thoughts, or meta-analysis. Output only your helpful response.`;

  const aiResult = await queryOpenRouterModels(systemPrompt, userPrompt);
  if (aiResult && aiResult.answer) {
    return {
      success: true,
      answer: aiResult.answer,
      model: aiResult.model,
      orderNo: order.orderNo,
    };
  }

  // Fallback if upstream AI model is offline or rate-limited:
  const flaggedResults = (order.results || []).filter(r => r.flag && r.flag !== 'NORMAL');
  const primaryResult = flaggedResults[0] || (order.results || [])[0];
  const qLower = userPrompt.toLowerCase();
  const isDietQuestion = qLower.includes('food') || qLower.includes('eat') || qLower.includes('diet') || qLower.includes('consume') || qLower.includes('nutrition') || qLower.includes('ఆహార') || qLower.includes('తిన');

  if (isDietQuestion && primaryResult) {
    const isHb = primaryResult.parameter.toLowerCase().includes('haemoglobin') || primaryResult.parameter.toLowerCase().includes('hemoglobin');
    const isSugar = primaryResult.parameter.toLowerCase().includes('glucose') || primaryResult.parameter.toLowerCase().includes('hba1c');

    if (isHb) {
      if (isTelugu) {
        return {
          success: true,
          answer: `మీ **హీమోగ్లోబిన్ (${primaryResult.value} ${primaryResult.unit || 'g/dL'})** సాధారణం కంటే కొద్దిగా తక్కువగా ఉంది. రక్తం పెరగడానికి సహాయపడే ముఖ్య ఆహారాలు:\n\n• **ఐరన్ అధికంగా ఉండే ఆహారాలు**: మునగాకు, పాలకూర, తోటకూర, బీట్‌రూట్, దానిమ్మ, ఖర్జూరాలు, కోడిగుడ్లు, రాగులు మరియు పప్పులు.\n• **విటమిన్ సి (ఐరన్ శోషణకు)**: ఉసిరికాయ (ఆమ్లా), నిమ్మరసం, బత్తాయి మరియు జామకాయ.\n• **ముఖ్య సూచన**: భోజనం చేసిన వెంటనే టీ లేదా కాఫీ తాగవద్దు (ఇవి ఐరన్ శోషణను అడ్డుకుంటాయి).\n\nమరింత ఖచ్చితమైన చికిత్స మరియు ఐరన్ సప్లిమెంట్ల కోసం మీ వైద్యుడిని (${order.doctor?.name || 'Dr. S. Ramanaiah'}) సంప్రదించండి.`,
          model: getActiveModel(),
          orderNo: order.orderNo,
        };
      }
      return {
        success: true,
        answer: `Your **Haemoglobin** is slightly low at **${primaryResult.value} ${primaryResult.unit || 'g/dL'}** (Normal Reference: ${primaryResult.refRangeRaw || '12.0-15.5'}). To help support healthy haemoglobin levels, consider these foods:\n\n• **Iron-Rich Foods**: Dark leafy greens (spinach, drumstick leaves/munagaku), beetroot, lentils (toor, moong), chickpeas, eggs, pomegranate, dates, and nuts.\n• **Vitamin C (Boosts Iron Absorption)**: Amla (Indian gooseberry), citrus fruits (lemon, oranges), and tomatoes.\n• **Folate & Vitamin B12**: Legumes, sprouted beans, whole grains, dairy, and eggs.\n• **Key Tip**: Avoid drinking tea or coffee immediately around meals, as tannins inhibit iron absorption.\n\nPlease consult your physician (${order.doctor?.name || 'Dr. S. Ramanaiah'}) to check if iron supplementation or further investigations are required.`,
        model: getActiveModel(),
        orderNo: order.orderNo,
      };
    }

    if (isSugar) {
      if (isTelugu) {
        return {
          success: true,
          answer: `మీ రక్తంలో చక్కెర స్థాయిలు ఎక్కువగా ఉన్నాయి. రక్తంలో చక్కెర మరియు కొలెస్ట్రాల్ నియంత్రణకు సిఫార్సు చేసిన ఆహారాలు:\n\n• **తీసుకోవలసినవి**: రాగులు, జొన్నలు, సజ్జలు, కొర్రలు, చేదు కూరగాయలు (కాకరకాయ, బీరకాయ, సొరకాయ), ఆకుకూరలు మరియు మొలకెత్తిన గింజలు.\n• **తగ్గించవలసినవి**: తెల్ల బియ్యం, పంచదార, స్వీట్లు, మైదా, వేపుళ్లు మరియు బేకరీ ఆహారాలు.\n\nపూర్తి చికిత్సా ప్రణాళిక కోసం మీ వైద్యుడిని సంప్రదించండి.`,
          model: getActiveModel(),
          orderNo: order.orderNo,
        };
      }
      return {
        success: true,
        answer: `Guidance for managing elevated glucose and cholesterol levels (${primaryResult.parameter}: ${primaryResult.value}):\n\n• **Whole Millets & Grains**: Replace white rice with millets (ragi, jowar, foxtail millet/korra), broken wheat (dalia), and oats.\n• **Non-Starchy Vegetables**: Bitter gourd (karela), bottle gourd (lauka), ridge gourd (beerakaya), spinach, and cauliflower.\n• **Lean Protein with Every Meal**: Moong dal, toor dal, chickpeas, sprouts, egg whites, and paneer to prevent glucose spikes.\n• **Foods to Strictly Avoid**: Refined sugars, sweets, sugary beverages, polished white rice, and deep-fried foods high in saturated/trans fats.\n\nPlease discuss your complete management plan with your treating doctor (${order.doctor?.name || 'Dr. S. Ramanaiah'}).`,
        model: getActiveModel(),
        orderNo: order.orderNo,
      };
    }
  }

  if (primaryResult) {
    const findingsList = (order.results || [])
      .map(r => `• **${r.parameter}**: **${r.value} ${r.unit || ''}** (Normal Range: ${r.refRangeRaw || 'Normal'}, Flag: **${r.flag || 'NORMAL'}**)`)
      .join('\n');

    if (isTelugu) {
      return {
        success: true,
        answer: `ఆర్డర్ #${order.orderNo} రక్త పరీక్ష ఫలితాల వివరాలు:\n\n• **${primaryResult.parameter}**: **${primaryResult.value} ${primaryResult.unit || ''}** (సాధారణ పరిమితి: ${primaryResult.refRangeRaw || 'సాధారణం'}, స్థితి: **${primaryResult.flag || 'NORMAL'}**).\n\nఈ ఫలితం సాధారణ స్థాయి కంటే భిన్నంగా ఉంది. తదుపరి చికిత్స మరియు నిర్ధారణ కోసం దయచేసి మీ వైద్యుడిని సంప్రదించండి.`,
        model: getActiveModel(),
        orderNo: order.orderNo,
      };
    }

    return {
      success: true,
      answer: `Clinical summary for Order #${order.orderNo} (${order.patient?.fullName || 'Patient'}):\n\n${findingsList}\n\nYour **${primaryResult.parameter}** level of **${primaryResult.value} ${primaryResult.unit || ''}** is flagged **${primaryResult.flag || 'abnormal'}**. Please consult your attending physician (${order.doctor?.name || 'Dr. S. Ramanaiah'}) for clinical evaluation.`,
      model: getActiveModel(),
      orderNo: order.orderNo,
    };
  }

  return {
    success: true,
    answer: isTelugu
      ? `ఆర్డర్ #${order.orderNo} వివరాలు పరిశీలించబడ్డాయి. దయచేసి మరికొద్ది క్షణాల్లో మళ్లీ ప్రయత్నించండి లేదా మీ వైద్యుడిని సంప్రదించండి.`
      : `Clinical review for Order #${order.orderNo} is temporarily processing. Please retry in a few moments or consult your attending physician.`,
    model: getActiveModel(),
    orderNo: order.orderNo,
  };
}

/**
 * Handle General Diagnostic Question
 */
export async function handleGeneralAskAI(userPrompt, lang = 'en') {
  const isTelugu = lang === 'te' || /[\u0C00-\u0C7F]/.test(userPrompt) || /telugu/i.test(userPrompt);
  const isHindi = lang === 'hi' || /[\u0900-\u097F]/.test(userPrompt) || /hindi/i.test(userPrompt);

  let langInstruction = 'Respond in clear, empathetic English.';
  if (isTelugu) {
    langInstruction = 'Respond directly and entirely in Telugu script (తెలుగు). Use clear Telugu medical terms.';
  } else if (isHindi) {
    langInstruction = 'Respond directly and entirely in Hindi script (हिन्दी).';
  }

  const systemPrompt = `You are "Labby", a clinical AI diagnostic companion for Company A Diagnostics in Vijayawada, India.
Answer the user's healthcare or diagnostic question clearly, helpfully, and empathetically.
${langInstruction}
Highlight key terms with **bold**, use bullet points, and present normal ranges in markdown tables when explaining lab tests.
IMPORTANT: Reply directly to the patient. Do NOT output internal thoughts, reasoning steps, or drafting notes. Output only your response.`;

  const aiResult = await queryOpenRouterModels(systemPrompt, userPrompt);
  if (aiResult && aiResult.answer) {
    return {
      success: true,
      question: userPrompt,
      answer: aiResult.answer,
      model: aiResult.model,
    };
  }

  return {
    success: true,
    question: userPrompt,
    answer: isTelugu
      ? `మీ రక్త పరీక్ష ఫలితాలను విశ్లేషించడానికి, దయచేసి మీ నిర్దిష్ట పరీక్ష వివరాలను పంచుకోండి (ఉదా: **హీమోగ్లోబిన్**, **రక్తంలో చక్కెర (Glucose)**).\n\n• **హీమోగ్లోబిన్**: సాధారణ పరిమితి 12.0 - 15.0 g/dL. తక్కువగా ఉంటే రక్తహీనతను సూచిస్తుంది.\n• **ఉపవాస చక్కెర**: 70 - 99 mg/dL సాధారణం.\n\nదయచేసి మీ పూర్తి రిపోర్ట్‌తో పాటు వైద్యుడిని సంప్రదించండి.`
      : `Diagnostic Guidance:\n\n• **Fasting Blood Glucose**: Normal levels are typically 70–99 mg/dL. Values between 100–125 mg/dL indicate prediabetes, and 126 mg/dL or above indicates diabetes.\n• **Haemoglobin (Hb)**: Standard healthy range is 12.0–15.0 g/dL for adult females and 13.5–17.5 g/dL for adult males.\n\nFor personalized interpretation of your lab results, please consult your healthcare provider or review your full order report.`,
    model: getActiveModel(),
  };
}
