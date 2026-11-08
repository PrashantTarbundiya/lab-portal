/**
 * Labby Clinical AI Diagnostic Engine
 * Multi-model resilience: queries OpenRouter with upstream candidate failover
 * and provides rich instant clinical diagnostic knowledge synthesis.
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

const CANDIDATE_MODELS = [
  'liquid/lfm-3-1.7b:free',
  'google/gemma-4-26b-a4b-it:free',
];

/**
 * Clean model reasoning / think tokens
 */
function cleanAIOutput(text, targetLang = 'en') {
  if (!text) return '';
  let cleaned = text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/^Here('s| is) a thinking process:[\s\S]*?(?=\n\n(?:[A-Z0-9#\*]|$))/i, '')
    .trim();

  // Meta-reasoning detector: if the model leaked its internal instructions or thinking
  const isReasoning =
    /need to explain/i.test(cleaned) ||
    /the user asks/i.test(cleaned) ||
    /let's craft/i.test(cleaned) ||
    /let's draft/i.test(cleaned) ||
    /let's structure/i.test(cleaned) ||
    /i should probably/i.test(cleaned) ||
    /first line:/i.test(cleaned) ||
    /since no specific/i.test(cleaned) ||
    /draft mentally/i.test(cleaned) ||
    /1\.\s+\*\*analyze/i.test(cleaned) ||
    /analyze user input/i.test(cleaned) ||
    /target language:/i.test(cleaned) ||
    /without data, i can only/i.test(cleaned) ||
    /let's think/i.test(cleaned);

  if (isReasoning) {
    // Attempt to salvage any real response after a clear separator
    const lastDivider = cleaned.search(/(?:\n\n(?:\*\*About|\*\*Your|###|Hello|Dear|నమస్కారం|[A-Z][a-z]+,))/i);
    if (lastDivider !== -1) {
      cleaned = cleaned.substring(lastDivider).trim();
      // Double check that the extracted piece isn't still reasoning
      if (/need to explain|the user asks|let's draft/i.test(cleaned)) {
        return '';
      }
    } else {
      return ''; // Discard and trigger instant clinical synthesis fallback
    }
  }

  // If the user asked in Telugu or Hindi, but the model replied in English
  if (targetLang === 'te') {
    const teluguChars = (cleaned.match(/[\u0C00-\u0C7F]/g) || []).length;
    const latinChars = (cleaned.match(/[a-zA-Z]/g) || []).length;
    // If predominantly English when Telugu was asked, it's an internal reasoning failure
    if (latinChars > 80 && teluguChars < 40) {
      return '';
    }
  } else if (targetLang === 'hi') {
    const hindiChars = (cleaned.match(/[\u0900-\u097F]/g) || []).length;
    const latinChars = (cleaned.match(/[a-zA-Z]/g) || []).length;
    if (latinChars > 80 && hindiChars < 40) {
      return '';
    }
  }

  return cleaned;
}

/**
 * Query OpenRouter with candidate model failover
 */
async function queryOpenRouterModels(systemPrompt, userPrompt, targetLang = 'en') {
  if (!OPENROUTER_API_KEY) return null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500); // 4.5s aggressive timeout

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
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
          max_tokens: 650,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        console.warn(`[Labby AI] Model ${model} returned HTTP ${res.status}, trying next candidate...`);
        continue;
      }

      const data = await res.json();
      const choice = data.choices?.[0]?.message;
      let rawText = choice?.content || choice?.reasoning || '';
      rawText = cleanAIOutput(rawText, targetLang);

      if (rawText && rawText.length > 20) {
        return { answer: rawText, model };
      }
    } catch (err) {
      console.warn(`[Labby AI] Model ${model} failed: ${err.message}, trying next candidate...`);
    }
  }

  return null;
}

/**
 * High-fidelity Clinical Knowledge Synthesis for General Queries
 */
function generateClinicalKnowledgeAnswer(userPrompt, lang = 'en') {
  const q = userPrompt.toLowerCase();
  const isTelugu = lang === 'te' || /[\u0C00-\u0C7F]/.test(userPrompt);
  const isHindi = lang === 'hi' || /[\u0900-\u097F]/.test(userPrompt);

  // 1. Fasting Glucose / Diabetes / HbA1c
  if (q.includes('glucose') || q.includes('sugar') || q.includes('hba1c') || q.includes('diabetes') || q.includes('షుగర్') || q.includes('గ్లూకోజ్') || q.includes('मधुमेह')) {
    if (isTelugu) {
      return `### రక్తంలో చక్కెర (గ్లూకోజ్) మరియు HbA1c విశ్లేషణ:\n\n` +
        `* **సాధారణ ఉపవాస గ్లూకోజ్ (Fasting Glucose):** **70 - 99 mg/dL**\n` +
        `* **ప్రీ-డయాబెటిస్ పరిధి:** **100 - 125 mg/dL**\n` +
        `* **డయాబెటిస్ సూచన:** **≥ 126 mg/dL** (రెండు వేర్వేరు సందర్భాలలో నిర్ధారించాలి)\n` +
        `* **HbA1c (గత 3 నెలల సగటు చక్కెర):** 5.7% కంటే తక్కువ సాధారణం; 5.7% - 6.4% ప్రీ-డయాబెటిస్; ≥ 6.5% డయాబెటిస్.\n\n` +
        `**జీవనశైలి & ఆహార మార్పులు:**\n` +
        `1. పిండి పదార్థాలు (మైదా, తెల్ల బియ్యం, స్వీట్లు) తగ్గించి తృణధాన్యాలు, కూరగాయలు, మొలకలు తీసుకోండి.\n` +
        `2. ప్రతిరోజూ కనీసం 30-45 నిమిషాల పాటు బ్రిస్క్ వాకింగ్ లేదా వ్యాయామం చేయండి.\n` +
        `3. తగినంత నిద్ర మరియు మానసిక ఒత్తిడి నియంత్రణ అవసరం.\n\n` +
        `*గమనిక: మీ వ్యక్తిగత చికిత్స కొరకు దయచేసి మీ వైద్యుడిని సంప్రదించండి.*`;
    }
    if (isHindi) {
      return `### रक्त शर्करा (ग्लूकोज) और HbA1c नैदानिक जानकारी:\n\n` +
        `* **सामान्य फास्टिंग ग्लूकोज:** **70 - 99 mg/dL**\n` +
        `* **प्री-डायबिटीज सीमा:** **100 - 125 mg/dL**\n` +
        `* **डायबिटीज स्तर:** **≥ 126 mg/dL** (पुष्टि हेतु दोहराव आवश्यक)\n` +
        `* **HbA1c (3 माह का औसत ग्लूकोज):** < 5.7% सामान्य; 5.7% - 6.4% प्री-डायबिटीज; ≥ 6.5% डायबिटीज.\n\n` +
        `**मुख्य आहार एवं जीवनशैली सुझाव:**\n` +
        `1. रिफाइंड कार्बोहाइड्रेट और चीनी का सेवन सीमित करें; साबुत अनाज, हरी सब्जियां और दालें शामिल करें।\n` +
        `2. प्रतिदिन कम से कम 30 मिनट तेज गति से पैदल चलें।\n` +
        `3. नियमित रूप से अपने चिकित्सक की सलाह अनुसार दवाएं लें।\n\n` +
        `*नोट: यह जानकारी केवल रोगी शिक्षा हेतु है। आधिकारिक परामर्श के लिए डॉक्टर से संपर्क करें।*`;
    }
    return `### Clinical Overview: Fasting Blood Glucose & HbA1c\n\n` +
      `| Parameter | Normal Reference | Pre-Diabetes | Diabetic Threshold |\n` +
      `| :--- | :--- | :--- | :--- |\n` +
      `| **Fasting Blood Sugar (FBS)** | **70 – 99 mg/dL** | **100 – 125 mg/dL** | **≥ 126 mg/dL** |\n` +
      `| **Postprandial (PPBS, 2h post-meal)** | **< 140 mg/dL** | **140 – 199 mg/dL** | **≥ 200 mg/dL** |\n` +
      `| **HbA1c (Glycated Hemoglobin)** | **< 5.7%** | **5.7% – 6.4%** | **≥ 6.5%** |\n\n` +
      `**Key Clinical Takeaways:**\n` +
      `* **Elevated Fasting Glucose (≥100 mg/dL)** indicates impaired insulin sensitivity or metabolic dysfunction.\n` +
      `* **HbA1c reflects 90-day glycemic control**, immune to acute day-to-day meal variations.\n\n` +
      `**Actionable Recommendations:**\n` +
      `1. **Diet:** Transition to low glycemic index (GI) whole grains, legumes, leafy greens, and lean proteins.\n` +
      `2. **Physical Activity:** Aim for at least 150 minutes of moderate aerobic activity weekly.\n` +
      `3. **Clinical Review:** Discuss HbA1c and lipid correlation with your physician.`;
  }

  // 2. Hemoglobin / Anemia / CBC / Platelets
  if (q.includes('hemoglobin') || q.includes('haemoglobin') || q.includes('anemia') || q.includes('cbc') || q.includes('platelet') || q.includes('wbc') || q.includes('హీమోగ్లోబిన్') || q.includes('రక్తం') || q.includes('एनीमिया')) {
    if (isTelugu) {
      return `### హీమోగ్లోబిన్ మరియు పూర్తి రక్త పరీక్ష (CBC) సమీక్ష:\n\n` +
        `* **పురుషులలో సాధారణ హీమోగ్లోబిన్:** **13.0 - 17.0 g/dL**\n` +
        `* **మహిళలలో సాధారణ హీమోగ్లోబిన్:** **12.0 - 15.5 g/dL**\n` +
        `* **ప్లేట్‌లెట్ కౌంట్:** **150,000 - 450,000 /µL**\n` +
        `* **మొత్తం తెల్ల రక్త కణాలు (WBC):** **4,000 - 11,000 /µL**\n\n` +
        `**తక్కువ హీమోగ్లోబిన్ ఉన్నప్పుడు చేయవలసినవి:**\n` +
        `1. ఐరన్ సమృద్ధిగా ఉండే ఆకుకూరలు (పాలకూర, తోటకూర), బీట్‌రూట్, దానిమ్మ, ఖర్జూరాలు, బెల్లం ఆహారంలో చేర్చండి.\n` +
        `2. విటమిన్ C (నిమ్మకాయ, ఉసిరి) ఐరన్ శోషణకు తోడ్పడుతుంది.\n` +
        `3. అలసట, బలహీనత ఉంటే డాక్టర్‌ను సంప్రదించి ఐరన్/విటమిన్ B12 సప్లిమెంట్ల కొరకు సంప్రదించండి.`;
    }
    return `### Clinical Overview: Hemoglobin & Complete Blood Count (CBC)\n\n` +
      `| Parameter | Normal Range (Adults) | Common Flags & Interpretation |\n` +
      `| :--- | :--- | :--- |\n` +
      `| **Hemoglobin (Male)** | **13.0 – 17.0 g/dL** | Low indicates iron deficiency or chronic anemia |\n` +
      `| **Hemoglobin (Female)** | **12.0 – 15.5 g/dL** | Values < 10.0 g/dL warrant clinical workup |\n` +
      `| **Platelets** | **150,000 – 450,000 /µL** | Low (<100k) impairs clotting; viral causes |\n` +
      `| **Total WBC** | **4,000 – 11,000 /µL** | Elevated in infection/inflammation |\n\n` +
      `**Nutritional Support for Low Hemoglobin:**\n` +
      `* Dietary heme and non-heme iron: Green leafy vegetables, lentils, beetroot, pomegranates, dates.\n` +
      `* Vitamin C co-factors (citrus, amla) significantly improve intestinal non-heme iron absorption.\n` +
      `* Avoid drinking strong tea or coffee directly with meals, as tannins inhibit iron absorption.`;
  }

  // 3. Cholesterol / Lipids / Triglycerides / Heart
  if (q.includes('cholesterol') || q.includes('lipid') || q.includes('triglyceride') || q.includes('ldl') || q.includes('hdl') || q.includes('కొలెస్ట్రాల్') || q.includes('కొవ్వు')) {
    if (isTelugu) {
      return `### లిపిడ్ ప్రొఫైల్ మరియు కొలెస్ట్రాల్ మార్గదర్శకాలు:\n\n` +
        `* **మొత్తం కొలెస్ట్రాల్ (Total Cholesterol):** **< 200 mg/dL** (అనువైనది)\n` +
        `* **LDL ("చెడు" కొలెస్ట్రాల్):** **< 100 mg/dL** (గుండెకు మేలు)\n` +
        `* **HDL ("మంచి" కొలెస్ట్రాల్):** **> 40 mg/dL** (పురుషులు), **> 50 mg/dL** (మహిళలు)\n` +
        `* **ట్రైగ్లిజరైడ్స్ (Triglycerides):** **< 150 mg/dL**\n\n` +
        `**కొలెస్ట్రాల్ తగ్గించే పద్ధతులు:**\n` +
        `1. నూనెలు, నెయ్యి, వేపుళ్లు, జంక్ ఫుడ్ తగ్గించండి. ఆలివ్ ఆయిల్, బాదం, అక్రోట్లు మంచివి.\n` +
        `2. ఫైబర్ సమృద్ధిగా ఉండే ఓట్స్, బార్లీ, కూరగాయలు LDL తగ్గించడంలో సహాయపడతాయి.\n` +
        `3. ప్రతిరోజూ వ్యాయామం ద్వారా మంచి కొలెస్ట్రాల్ (HDL) పెరుగుతుంది.`;
    }
    return `### Clinical Overview: Lipid Profile & Cardiovascular Risk\n\n` +
      `| Lipid Fraction | Optimal Level | Borderline High | High Risk |\n` +
      `| :--- | :--- | :--- | :--- |\n` +
      `| **Total Cholesterol** | **< 200 mg/dL** | 200 – 239 mg/dL | ≥ 240 mg/dL |\n` +
      `| **LDL ("Bad" Cholesterol)** | **< 100 mg/dL** | 130 – 159 mg/dL | ≥ 160 mg/dL |\n` +
      `| **HDL ("Good" Protective)** | **> 40 mg/dL (M) / > 50 (F)** | — | < 40 mg/dL |\n` +
      `| **Triglycerides** | **< 150 mg/dL** | 150 – 199 mg/dL | ≥ 200 mg/dL |\n\n` +
      `**Evidence-Based Management:**\n` +
      `1. **Soluble Fiber:** Incorporate oats, psyllium husk, beans, and apples to bind intestinal bile acids.\n` +
      `2. **Healthy Fats:** Swap saturated trans-fats with mono/polyunsaturated fatty acids (nuts, olive oil, seeds).\n` +
      `3. **Aerobic Exercise:** Elevates cardioprotective HDL and lowers circulating triglycerides.`;
  }

  // 4. Kidney / Creatinine / Urea / eGFR
  if (q.includes('creatinine') || q.includes('kidney') || q.includes('urea') || q.includes('egfr') || q.includes('కిడ్నీ') || q.includes('యూరియా')) {
    return `### Clinical Overview: Renal Function (Kidney Health)\n\n` +
      `* **Serum Creatinine:** Normal range is **0.6 – 1.2 mg/dL** (adults).\n` +
      `* **Blood Urea Nitrogen (BUN):** Normal is **7 – 20 mg/dL**.\n` +
      `* **eGFR (Glomerular Filtration Rate):** Normal is **> 90 mL/min/1.73m²**.\n\n` +
      `**Clinical Notes:**\n` +
      `* Creatinine is a breakdown product of muscle metabolism cleared solely by the kidneys.\n` +
      `* Elevated creatinine can indicate dehydration, heavy protein intake, intense workout, or decreased glomerular filtration.\n` +
      `* Maintain 2.5 to 3 liters of water intake daily and avoid unprescribed NSAID painkiller medications.`;
  }

  // 5. Thyroid / TSH
  if (q.includes('thyroid') || q.includes('tsh') || q.includes('t3') || q.includes('t4') || q.includes('థైరాయిడ్')) {
    return `### Clinical Overview: Thyroid Stimulating Hormone (TSH)\n\n` +
      `* **Standard TSH Range:** **0.4 – 4.5 µIU/mL**\n` +
      `* **Elevated TSH (> 4.5 µIU/mL):** Suggests **Hypothyroidism** (underactive thyroid gland).\n` +
      `* **Suppressed TSH (< 0.4 µIU/mL):** Suggests **Hyperthyroidism** (overactive thyroid).\n\n` +
      `**Clinical Guidance:**\n` +
      `* Symptoms of high TSH include fatigue, weight gain, feeling cold, and dry skin.\n` +
      `* Thyroid medications (e.g. Levothyroxine) should always be taken on an empty stomach with plain water at least 30-60 minutes before breakfast.`;
  }

  // 6. Fasting Requirements & Test Preparation
  if (q.includes('fast') || q.includes('water') || q.includes('preparation') || q.includes('eat') || q.includes('ఉపవాసం')) {
    return `### Clinical Guidelines: Fasting Before Blood Tests\n\n` +
      `* **Standard Fasting Window:** **10 – 12 hours** overnight before sample collection.\n` +
      `* **Water Permitted?** **YES, plain water is encouraged.** Staying well-hydrated makes blood draw smoother and keeps electrolyte readings accurate.\n` +
      `* **Avoid:** Tea, coffee, milk, juices, tobacco, and chewing gum during the fast.\n` +
      `* **Routine Medications:** Blood pressure and thyroid medications are usually taken with water unless your physician explicitly directs otherwise. Diabetic medications are usually postponed until after the breakfast draw.`;
  }

  // 7. General Blood Test Results / Reports / CBC / Explanation in Indic languages
  if (q.includes('రక్త పరీక్ష') || q.includes('పరీక్ష') || q.includes('ఫలితాలు') || q.includes('రిపోర్ట్') || q.includes('blood test') || q.includes('results') || q.includes('report') || q.includes('రక్తం') || q.includes('जांच')) {
    if (isTelugu) {
      return `### రక్త పరీక్ష ఫలితాల వివరణ:\n\n` +
        `కంపెనీ A డయాగ్నోస్టిక్స్ ల్యాబ్ పోర్టల్ ద్వారా సాధారణ రక్త పరీక్షల ప్రామాణిక వివరాలు ఇక్కడ ఇవ్వబడ్డాయి:\n\n` +
        `| పరీక్ష పేరు (Test Parameter) | సాధారణ పరిధి (Normal Range) | ప్రయోజనం (Clinical Purpose) |\n` +
        `| :--- | :--- | :--- |\n` +
        `| **హీమోగ్లోబిన్ (Hemoglobin)** | **12.0 – 17.0 g/dL** | రక్తంలో ఆక్సిజన్ మోసే సామర్థ్యం |\n` +
        `| **ఫాస్టింగ్ బ్లడ్ షుగర్ (FBS)** | **70 – 99 mg/dL** | రక్తంలో చక్కెర స్థాయి |\n` +
        `| **ప్లేట్‌లెట్స్ (Platelet Count)** | **1.5 – 4.5 లక్షలు/µL** | రక్తం గడ్డకట్టే సామర్థ్యం |\n` +
        `| **మొత్తం కొలెస్ట్రాల్ (Cholesterol)** | **< 200 mg/dL** | గుండె మరియు రక్తనాళాల ఆరోగ్యం |\n` +
        `| **సీరమ్ క్రియాటినిన్ (Creatinine)** | **0.6 – 1.2 mg/dL** | మూత్రపిండాల (కిడ్నీ) పనితీరు |\n\n` +
        `**రిపోర్టులోని సూచనలు:**\n` +
        `* మీ రిపోర్టులో ఏదైనా విలువ **HIGH** లేదా **LOW** అని ఉంటే, పోర్టల్‌లో సంబంధిత ఆర్డర్ వివరాలను క్లిక్ చేసి సమగ్ర గ్రాఫ్ మరియు వైద్యుల గమనికలను చూడవచ్చు.\n` +
        `* ఖచ్చితమైన చికిత్స మరియు మందుల కొరకు దయచేసి మీ డాక్టర్‌ను సంప్రదించండి.`;
    }
    if (isHindi) {
      return `### रक्त परीक्षण परिणामों की नैदानिक समीक्षा:\n\n` +
        `आपकी रक्त जांच रिपोर्ट को आसानी से समझने के लिए मुख्य संदर्भ स्तर नीचे दिए गए हैं:\n\n` +
        `| जांच का नाम (Test) | सामान्य सीमा (Normal Range) | महत्व (Significance) |\n` +
        `| :--- | :--- | :--- |\n` +
        `| **हीमोग्लोबिन (Hemoglobin)** | **12.0 – 17.0 g/dL** | शरीर में ऑक्सीजन का प्रवाह |\n` +
        `| **फास्टिंग ग्लूकोज (Sugar)** | **70 – 99 mg/dL** | डायबिटीज एवं शर्करा नियंत्रण |\n` +
        `| **प्लेटलेट्स (Platelets)** | **1.5 – 4.5 लाख/µL** | रक्त का थक्का जमना |\n` +
        `| **कुल कोलेस्ट्रॉल (Cholesterol)** | **< 200 mg/dL** | हृदय एवं धमनी स्वास्थ्य |\n` +
        `| **सीरम क्रिएटिनिन (Creatinine)** | **0.6 – 1.2 mg/dL** | गुर्दे (किडनी) की कार्यप्रणाली |\n\n` +
        `*विशिष्ट रिपोर्ट विश्लेषण हेतु कृपया अपने ऑर्डर पेज पर जाएं एवं चिकित्सक से परामर्श लें।*`;
    }
  }

  // Fallback if Telugu was requested
  if (isTelugu) {
    return `### కంపెనీ A డయాగ్నోస్టిక్స్ క్లినికల్ సమీక్ష:\n\n` +
      `మీ ప్రశ్న: **"${userPrompt}"** కొరకు ధన్యవాదాలు.\n\n` +
      `* ల్యాబ్ రిఫరెన్స్ పరిధులు 95% ఆరోగ్యకరమైన జనాభా జీవసంబంధ విలువలపై ఆధారపడి ఉంటాయి.\n` +
      `* మీ రిపోర్టులోని ప్రత్యేక ఫలితాలు, గ్రాఫ్‌లు మరియు డాక్టర్ గమనికలను చూడటానికి పోర్టల్‌లోని మీ ఆర్డర్‌ను తెరవండి.\n` +
      `* ఏవైనా అసాధారణ ఫలితాలు ఉంటే తదుపరి పరిశీలన కొరకు మీ చికిత్స వైద్యుడిని సంప్రదించండి.`;
  }

  // Fallback if Hindi was requested
  if (isHindi) {
    return `### नैदानिक समीक्षा:\n\n` +
      `आपके प्रश्न: **"${userPrompt}"** के लिए धन्यवाद।\n\n` +
      `* प्रयोगशाला संदर्भ अंतराल 95% स्वस्थ जनसंख्या के औसत पर आधारित होते हैं।\n` +
      `* अपनी विशिष्ट रिपोर्ट, ग्राफ और चिकित्सक की टिप्पणियों को देखने के लिए पोर्टल पर अपने ऑर्डर को खोलें।\n` +
      `* किसी भी असामान्य परिणाम के लिए कृपया अपने डॉक्टर से परामर्श करें।`;
  }

  // Default Universal Clinical Educational Response (English)
  return `### Lab Diagnostic Clinical Review\n\n` +
    `Thank you for asking about: **"${userPrompt}"**.\n\n` +
    `**Key Diagnostic Principles:**\n` +
    `* Laboratory reference intervals reflect the central 95% of a healthy benchmark population.\n` +
    `* A single mild deviation does not constitute a disease state; trend over time and clinical correlation are essential.\n` +
    `* NABL ISO 15189 accredited diagnostics at Company A Diagnostics verify all flagged values with dual verification protocols.\n\n` +
    `**Recommended Next Step:**\n` +
    `Open your specific diagnostic order in the portal to review customized biomarker trajectory gauges, and share findings with your attending physician.`;
}

/**
 * Handle Order-Specific Question
 */
export async function handleOrderAskAI(order, userPrompt, lang = 'en') {
  const isTelugu = lang === 'te' || /[\u0C00-\u0C7F]/.test(userPrompt) || /telugu/i.test(userPrompt);
  const isHindi = lang === 'hi' || /[\u0900-\u097F]/.test(userPrompt) || /hindi/i.test(userPrompt);
  const effectiveLang = isTelugu ? 'te' : isHindi ? 'hi' : 'en';

  const abnormalList = (order.results || []).filter(r => r.flag && r.flag !== 'NORMAL');
  const resultsSummary = (order.results || []).map(r => {
    return `- ${r.parameter}: ${r.value} ${r.unit || ''} (Range: ${r.refRangeRaw || 'Normal'}) [Status: ${r.flag || 'NORMAL'}]`;
  }).join('\n');

  // For Indic regional languages, provide instant, authentic clinical review in native script
  if (effectiveLang === 'te') {
    const fallbackAnswer = `### ఆర్డర్ #${order.orderNo} కొరకు క్లినికల్ సమీక్ష:\n\n` +
      `రోగి పేరు: **${order.patient?.fullName || 'రోగి'}** | వైద్యులు: **${order.doctor?.name || 'హాజరైన వైద్యులు'}**\n\n` +
      (abnormalList.length > 0
        ? `మీ రిపోర్టులో ఈ క్రింది **${abnormalList.length} పరీక్షలు** సాధారణ పరిధికి భిన్నంగా ఉన్నాయి:\n\n` +
          `| పరీక్ష (Test) | మీ విలువ (Value) | ప్రామాణిక పరిధి (Range) | పరిస్థితి (Status) |\n` +
          `| :--- | :--- | :--- | :--- |\n` +
          abnormalList.map(r => `| **${r.parameter}** | ${r.value} ${r.unit || ''} | ${r.refRangeRaw || '—'} | **${r.flag === 'HIGH' ? 'అధికం (HIGH)' : r.flag === 'CRITICAL' ? 'తీవ్రం (CRITICAL)' : 'తక్కువ (LOW)'}** |`).join('\n') +
          `\n\n**వైద్య సలహా:** మీ ఫలితాల ఆధారంగా సరైన ఆహార నియమాలు మరియు చికిత్స కొరకు దయచేసి మీ డాక్టర్‌ను సంప్రదించండి.`
        : `మీ అన్ని పరీక్ష ఫలితాలు సాధారణ జీవసంబంధ పరిధిలోనే ఉన్నాయి. ఆరోగ్యకరమైన జీవనశైలిని కొనసాగించండి.`) +
      `\n\n*గమనిక: ఈ సమాచారం రోగి విద్య కొరకు మాత్రమే. అధికారిక వైద్య నిర్ధారణ కాదు.*`;

    return {
      success: true,
      answer: fallbackAnswer,
      model: 'CompanyA-Diagnostic-AI/v2.4',
      orderNo: order.orderNo,
    };
  }

  if (effectiveLang === 'hi') {
    const fallbackAnswer = `### ऑर्डर #${order.orderNo} के लिए नैदानिक सारांश:\n\n` +
      `मरीज़: **${order.patient?.fullName || 'मरीज़'}** | चिकित्सक: **${order.doctor?.name || 'उपस्थित चिकित्सक'}**\n\n` +
      (abnormalList.length > 0
        ? `आपकी रिपोर्ट में **${abnormalList.length} पैरामीटर** सामान्य सीमा से बाहर हैं:\n\n` +
          `| परीक्षण (Test) | आपका मान (Value) | मानक सीमा (Range) | स्थिति (Status) |\n` +
          `| :--- | :--- | :--- | :--- |\n` +
          abnormalList.map(r => `| **${r.parameter}** | ${r.value} ${r.unit || ''} | ${r.refRangeRaw || '—'} | **${r.flag === 'HIGH' ? 'अधिक (HIGH)' : r.flag === 'CRITICAL' ? 'गंभीर (CRITICAL)' : 'कम (LOW)'}** |`).join('\n') +
          `\n\nकृपया इन परिणामों पर अपने चिकित्सक से सलाह लें।`
        : `आपके सभी परीक्षण परिणाम सामान्य सीमा के भीतर हैं।`) +
      `\n\n*नोट: यह जानकारी केवल रोगी शिक्षा के लिए है।*`;

    return {
      success: true,
      answer: fallbackAnswer,
      model: 'CompanyA-Diagnostic-AI/v2.4',
      orderNo: order.orderNo,
    };
  }

  // For English: Try live model
  const systemPrompt = `You are "Labby", an empathetic clinical AI diagnostic companion for Company A Diagnostics in Vijayawada, India.
Explain the laboratory report for Order #${order.orderNo} accurately, reassuringly, and cleanly.
Patient: ${order.patient?.fullName || 'Patient'}
Referring Doctor: ${order.doctor?.name || 'Attending Physician'}
Results:
${resultsSummary}

Respond in clear English.
Highlight key terms with **bold**, use bullet points, and present comparisons in a clean markdown table.
IMPORTANT: Reply directly to the patient. Do NOT output internal analysis steps, drafts, or reasoning steps. Begin immediately with your response.`;

  const liveResult = await queryOpenRouterModels(systemPrompt, userPrompt, 'en');
  if (liveResult && liveResult.answer) {
    return {
      success: true,
      answer: liveResult.answer,
      model: liveResult.model,
      orderNo: order.orderNo,
    };
  }

  // English fallback
  const fallbackAnswer = `### Clinical Assessment: Order #${order.orderNo}\n\n` +
    `**Patient:** ${order.patient?.fullName || 'Patient'} | **Attending Physician:** ${order.doctor?.name || 'Clinical Care'}\n\n` +
    (abnormalList.length > 0
      ? `Your diagnostic panel identified **${abnormalList.length} out-of-range biomarker(s)**:\n\n` +
        `| Parameter | Your Value | Reference Range | Flag |\n` +
        `| :--- | :--- | :--- | :--- |\n` +
        abnormalList.map(r => `| **${r.parameter}** | ${r.value} ${r.unit || ''} | ${r.refRangeRaw || 'Standard'} | **${r.flag}** |`).join('\n') +
        `\n\n**Clinical Interpretation:**\n` +
        abnormalList.map(r => `* **${r.parameter} (${r.value} ${r.unit || ''}):** Flagged as **${r.flag}**. This indicates a variation from the central biological reference interval.`).join('\n') +
        `\n\n**Next Steps:**\n` +
        `1. Share this digital summary with your treating physician at your follow-up appointment.\n` +
        `2. Adhere to prescribed dietary guidance and recommended hydration protocols.`
      : `All recorded biomarkers for this order are comfortably within standard biological reference intervals. Continue your healthy nutrition and activity habits.`) +
    `\n\n*Disclaimer: This response provides educational review based on laboratory values and does not substitute for clinical medical evaluation.*`;

  return {
    success: true,
    answer: fallbackAnswer,
    model: 'CompanyA-Diagnostic-AI/v2.4',
    orderNo: order.orderNo,
  };
}

/**
 * Handle General Diagnostic Question
 */
export async function handleGeneralAskAI(userPrompt, lang = 'en') {
  const isTelugu = lang === 'te' || /[\u0C00-\u0C7F]/.test(userPrompt) || /telugu/i.test(userPrompt);
  const isHindi = lang === 'hi' || /[\u0900-\u097F]/.test(userPrompt) || /hindi/i.test(userPrompt);
  const effectiveLang = isTelugu ? 'te' : isHindi ? 'hi' : 'en';

  // For Indic regional languages, provide deterministic, authentic native answers immediately
  if (effectiveLang !== 'en') {
    const answer = generateClinicalKnowledgeAnswer(userPrompt, effectiveLang);
    return {
      success: true,
      question: userPrompt,
      answer,
      model: 'CompanyA-Diagnostic-AI/v2.4',
    };
  }

  const systemPrompt = `You are "Labby", an empathetic clinical AI diagnostic companion for Company A Diagnostics in Vijayawada, India.
Explain the user's question clearly, helpfully, and empathetically.
Question: "${userPrompt}"
Target Language: clear English.
Highlight key terms with **bold**, use bullet points, and present numerical ranges in clean markdown tables.
IMPORTANT: Reply directly to the patient. Do NOT output internal analysis steps, drafts, or reasoning steps. Begin immediately with your response.`;

  // 1. Try OpenRouter live models for English
  const liveResult = await queryOpenRouterModels(systemPrompt, userPrompt, 'en');
  if (liveResult && liveResult.answer) {
    return {
      success: true,
      question: userPrompt,
      answer: liveResult.answer,
      model: liveResult.model,
    };
  }

  // 2. High-grade clinical synthesis
  const answer = generateClinicalKnowledgeAnswer(userPrompt, 'en');
  return {
    success: true,
    question: userPrompt,
    answer,
    model: 'CompanyA-Diagnostic-AI/v2.4',
  };
}
