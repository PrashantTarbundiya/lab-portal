/**
 * Labby Clinical AI Diagnostic Engine
 * Queries the user-provided OpenRouter AI Model directly.
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const PRIMARY_MODEL = process.env.OPENROUTER_MODEL || 'liquid/lfm-3-1.7b:free';

const CANDIDATE_MODELS = [
  PRIMARY_MODEL,
  'liquid/lfm-3-1.7b:free',
  'google/gemma-4-26b-a4b-it:free',
  'meta-llama/llama-3.2-3b-instruct:free',
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

  // Fallback only if all upstream AI models completely fail or time out
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
      ? `డయాగ్నస్టిక్ సమాచారం ప్రస్తుతం ప్రాసెస్ అవుతోంది. దయచేసి కాసేపటి తర్వాత మళ్లీ అడగండి.`
      : `AI diagnostic assistant is momentarily busy. Please try asking your question again in a moment.`,
    model: 'AI-Service-Offline',
  };
}
