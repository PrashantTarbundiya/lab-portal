/**
 * Labby Clinical AI Diagnostic Engine
 * Queries the user-provided OpenRouter AI Model directly.
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const PRIMARY_MODEL = process.env.OPENROUTER_MODEL || 'liquid/lfm-3-1.7b:free';

const CANDIDATE_MODELS = [
  PRIMARY_MODEL,
  'liquid/lfm-3-1.7b:free',
  'liquid/lfm-2.5-2.6b:free',
  'google/gemma-4-26b-a4b-it:free',
  'google/gemma-4-31b-it:free',
  'nvidia/nemotron-3.5-lightning:free',
].filter((m, idx, arr) => arr.indexOf(m) === idx);

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
  if (!OPENROUTER_API_KEY) {
    console.warn('[Labby AI] No OPENROUTER_API_KEY found.');
    return null;
  }

  for (const model of CANDIDATE_MODELS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000); // 25s timeout for full generation

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://isocodelabs.com',
          'X-Title': 'Company A Diagnostics Lab Portal',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 1500,
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
      if (cleaned && cleaned.length > 10) {
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

  // Fallback if upstream AI model is offline or rate-limited (HTTP 429 quota exhaustion):
  const flaggedResults = (order.results || []).filter(r => r.flag && r.flag !== 'NORMAL');
  const primaryResult = flaggedResults[0] || (order.results || [])[0];

  if (primaryResult) {
    const findingsList = (order.results || [])
      .map(r => `• **${r.parameter}**: **${r.value} ${r.unit || ''}** (Normal Range: ${r.refRangeRaw || 'Normal'}, Flag: **${r.flag || 'NORMAL'}**)`)
      .join('\n');

    if (isTelugu) {
      return {
        success: true,
        answer: `ఆర్డర్ #${order.orderNo} రక్త పరీక్ష ఫలితాల వివరాలు:\n\n• **${primaryResult.parameter}**: **${primaryResult.value} ${primaryResult.unit || ''}** (సాధారణ పరిమితి: ${primaryResult.refRangeRaw || 'సాధారణం'}, స్థితి: **${primaryResult.flag || 'NORMAL'}**).\n\nఈ ఫలితం సాధారణ స్థాయి కంటే భిన్నంగా ఉంది. తదుపరి చికిత్స మరియు నిర్ధారణ కోసం దయచేసి మీ వైద్యుడిని సంప్రదించండి.`,
        model: 'Clinical-Report-Engine',
        orderNo: order.orderNo,
      };
    }

    return {
      success: true,
      answer: `Clinical summary for Order #${order.orderNo} (${order.patient?.fullName || 'Patient'}):\n\n${findingsList}\n\nYour **${primaryResult.parameter}** level of **${primaryResult.value} ${primaryResult.unit || ''}** is flagged **${primaryResult.flag || 'abnormal'}**. Please consult your attending physician (${order.doctor?.name || 'Dr. K. Srinivas Rao'}) for clinical evaluation.`,
      model: 'Clinical-Report-Engine',
      orderNo: order.orderNo,
    };
  }

  return {
    success: true,
    answer: isTelugu
      ? `ఆర్డర్ #${order.orderNo} వివరాలు పరిశీలించబడ్డాయి. దయచేసి మరికొద్ది క్షణాల్లో మళ్లీ ప్రయత్నించండి లేదా మీ వైద్యుడిని సంప్రదించండి.`
      : `Clinical review for Order #${order.orderNo} is temporarily processing. Please retry in a few moments or consult your attending physician.`,
    model: 'AI-Service-Offline',
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
    model: 'Clinical-Knowledge-Engine',
  };
}
