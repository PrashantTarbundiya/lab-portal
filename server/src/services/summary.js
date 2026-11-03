/**
 * Summary generation orchestrator.
 * Uses templates → AI → fallback pipeline to generate patient-friendly summaries.
 */
import prisma from '../lib/prisma.js';

// ────────────────────────────────────────────────────────────
// Summary Templates: 13 tests × LOW/HIGH × 3 languages
// ────────────────────────────────────────────────────────────

export const SUMMARY_TEMPLATES = {
  // ── Haemoglobin ──
  'haemoglobin': {
    LOW: {
      en: 'Your haemoglobin is a little below the usual range. Haemoglobin carries oxygen in your blood. Please show this report to your doctor.',
      // needs native-speaker review
      te: 'మీ హీమోగ్లోబిన్ సాధారణ పరిధి కంటే కొంచెం తక్కువగా ఉంది. హీమోగ్లోబిన్ మీ రక్తంలో ఆక్సిజన్‌ను తీసుకువెళ్తుంది. దయచేసి ఈ రిపోర్ట్‌ను మీ డాక్టర్‌కు చూపించండి.',
      // needs native-speaker review
      hi: 'आपका हीमोग्लोबिन सामान्य सीमा से थोड़ा कम है। हीमोग्लोबिन आपके रक्त में ऑक्सीजन ले जाता है। कृपया यह रिपोर्ट अपने डॉक्टर को दिखाएँ।',
    },
    HIGH: {
      en: 'Your haemoglobin is above the usual range. This may need further evaluation. Please show this report to your doctor.',
      te: 'మీ హీమోగ్లోబిన్ సాధారణ పరిధి కంటే ఎక్కువగా ఉంది. దీనికి మరింత పరీక్ష అవసరం కావచ్చు. దయచేసి ఈ రిపోర్ట్‌ను మీ డాక్టర్‌కు చూపించండి.',
      hi: 'आपका हीमोग्लोबिन सामान्य सीमा से अधिक है। इसके लिए और जाँच की आवश्यकता हो सकती है। कृपया यह रिपोर्ट अपने डॉक्टर को दिखाएँ।',
    },
  },

  // ── Total WBC ──
  'total wbc': {
    LOW: {
      en: 'Your white blood cell count is below the usual range. White blood cells help your body fight infections. Please consult your doctor with this report.',
      te: 'మీ తెల్ల రక్త కణాల సంఖ్య సాధారణ పరిధి కంటే తక్కువగా ఉంది. తెల్ల రక్త కణాలు మీ శరీరానికి ఇన్ఫెక్షన్‌లతో పోరాడటానికి సహాయపడతాయి. దయచేసి ఈ రిపోర్ట్‌తో మీ డాక్టర్‌ను సంప్రదించండి.',
      hi: 'आपकी श्वेत रक्त कोशिकाओं की संख्या सामान्य सीमा से कम है। श्वेत रक्त कोशिकाएँ शरीर को संक्रमण से लड़ने में मदद करती हैं। कृपया इस रिपोर्ट के साथ अपने डॉक्टर से परामर्श करें।',
    },
    HIGH: {
      en: 'Your white blood cell count is above the usual range. This can sometimes indicate your body is responding to an infection or inflammation. Please show this report to your doctor.',
      te: 'మీ తెల్ల రక్త కణాల సంఖ్య సాధారణ పరిధి కంటే ఎక్కువగా ఉంది. ఇది కొన్నిసార్లు మీ శరీరం ఇన్ఫెక్షన్ లేదా ఇన్ఫ్లమేషన్‌కు ప్రతిస్పందిస్తుందని సూచించవచ్చు. దయచేసి ఈ రిపోర్ట్‌ను మీ డాక్టర్‌కు చూపించండి.',
      hi: 'आपकी श्वेत रक्त कोशिकाओं की संख्या सामान्य सीमा से अधिक है। यह कभी-कभी संकेत हो सकता है कि शरीर किसी संक्रमण या सूजन से लड़ रहा है। कृपया यह रिपोर्ट अपने डॉक्टर को दिखाएँ।',
    },
  },

  // ── Platelet count ──
  'platelet count': {
    LOW: {
      en: 'Your platelet count is below the usual range. Platelets help your blood clot. Please consult your doctor with this report.',
      te: 'మీ ప్లేట్‌లెట్ కౌంట్ సాధారణ పరిధి కంటే తక్కువగా ఉంది. ప్లేట్‌లెట్‌లు మీ రక్తం గడ్డకట్టడానికి సహాయపడతాయి. దయచేసి ఈ రిపోర్ట్‌తో మీ డాక్టర్‌ను సంప్రదించండి.',
      hi: 'आपकी प्लेटलेट संख्या सामान्य सीमा से कम है। प्लेटलेट्स रक्त के थक्के जमने में मदद करती हैं। कृपया इस रिपोर्ट के साथ अपने डॉक्टर से परामर्श करें।',
    },
    HIGH: {
      en: 'Your platelet count is above the usual range. Please show this report to your doctor for further guidance.',
      te: 'మీ ప్లేట్‌లెట్ కౌంట్ సాధారణ పరిధి కంటే ఎక్కువగా ఉంది. తదుపరి మార్గదర్శకత్వం కోసం దయచేసి ఈ రిపోర్ట్‌ను మీ డాక్టర్‌కు చూపించండి.',
      hi: 'आपकी प्लेटलेट संख्या सामान्य सीमा से अधिक है। कृपया आगे के मार्गदर्शन के लिए यह रिपोर्ट अपने डॉक्टर को दिखाएँ।',
    },
  },

  // ── Fasting glucose ──
  'fasting glucose': {
    LOW: {
      en: 'Your fasting glucose level is below the usual range. Glucose is your body\'s main source of energy. Please consult your doctor.',
      te: 'మీ ఫాస్టింగ్ గ్లూకోజ్ స్థాయి సాధారణ పరిధి కంటే తక్కువగా ఉంది. గ్లూకోజ్ మీ శరీరానికి ప్రధాన శక్తి వనరు. దయచేసి మీ డాక్టర్‌ను సంప్రదించండి.',
      hi: 'आपका उपवास ग्लूकोज़ स्तर सामान्य सीमा से कम है। ग्लूकोज़ आपके शरीर का मुख्य ऊर्जा स्रोत है। कृपया अपने डॉक्टर से परामर्श करें।',
    },
    HIGH: {
      en: 'Your fasting glucose level is above the usual range. High glucose may need monitoring over time. Please show this report to your doctor.',
      te: 'మీ ఫాస్టింగ్ గ్లూకోజ్ స్థాయి సాధారణ పరిధి కంటే ఎక్కువగా ఉంది. ఎక్కువ గ్లూకోజ్‌కు కాలక్రమేణా పర్యవేక్షణ అవసరం కావచ్చు. దయచేసి ఈ రిపోర్ట్‌ను మీ డాక్టర్‌కు చూపించండి.',
      hi: 'आपका उपवास ग्लूकोज़ स्तर सामान्य सीमा से अधिक है। उच्च ग्लूकोज़ की समय-समय पर निगरानी आवश्यक हो सकती है। कृपया यह रिपोर्ट अपने डॉक्टर को दिखाएँ।',
    },
  },

  // ── HbA1c ──
  'hba1c': {
    LOW: {
      en: 'Your HbA1c level is below the usual range. HbA1c reflects your average blood sugar over the past 2-3 months. Please discuss with your doctor.',
      te: 'మీ HbA1c స్థాయి సాధారణ పరిధి కంటే తక్కువగా ఉంది. HbA1c గత 2-3 నెలల్లో మీ సగటు రక్తంలో చక్కెరను ప్రతిబింబిస్తుంది. దయచేసి మీ డాక్టర్‌తో చర్చించండి.',
      hi: 'आपका HbA1c स्तर सामान्य सीमा से कम है। HbA1c पिछले 2-3 महीनों की औसत रक्त शर्करा दर्शाता है। कृपया अपने डॉक्टर से चर्चा करें।',
    },
    HIGH: {
      en: 'Your HbA1c level is above the usual range, which suggests your average blood sugar has been higher than usual over the past 2-3 months. Please show this report to your doctor.',
      te: 'మీ HbA1c స్థాయి సాధారణ పరిధి కంటే ఎక్కువగా ఉంది, ఇది గత 2-3 నెలల్లో మీ సగటు రక్తంలో చక్కెర సాధారణం కంటే ఎక్కువగా ఉందని సూచిస్తుంది. దయచేసి ఈ రిపోర్ట్‌ను మీ డాక్టర్‌కు చూపించండి.',
      hi: 'आपका HbA1c स्तर सामान्य सीमा से अधिक है, जिसका अर्थ है कि पिछले 2-3 महीनों में आपकी औसत रक्त शर्करा सामान्य से अधिक रही है। कृपया यह रिपोर्ट अपने डॉक्टर को दिखाएँ।',
    },
  },

  // ── Total cholesterol ──
  'total cholesterol': {
    LOW: {
      en: 'Your total cholesterol is below the usual range. Please discuss this with your doctor.',
      te: 'మీ మొత్తం కొలెస్ట్రాల్ సాధారణ పరిధి కంటే తక్కువగా ఉంది. దయచేసి దీని గురించి మీ డాక్టర్‌తో చర్చించండి.',
      hi: 'आपका कुल कोलेस्ट्रॉल सामान्य सीमा से कम है। कृपया इसके बारे में अपने डॉक्टर से चर्चा करें।',
    },
    HIGH: {
      en: 'Your total cholesterol is above the usual range. Cholesterol levels are one factor your doctor considers alongside diet and lifestyle. Please show this report to your doctor.',
      te: 'మీ మొత్తం కొలెస్ట్రాల్ సాధారణ పరిధి కంటే ఎక్కువగా ఉంది. ఆహారం మరియు జీవనశైలితో పాటు మీ డాక్టర్ పరిగణించే అంశాలలో కొలెస్ట్రాల్ స్థాయిలు ఒకటి. దయచేసి ఈ రిపోర్ట్‌ను మీ డాక్టర్‌కు చూపించండి.',
      hi: 'आपका कुल कोलेस्ट्रॉल सामान्य सीमा से अधिक है। कोलेस्ट्रॉल स्तर एक कारक है जिसे आपके डॉक्टर आहार और जीवनशैली के साथ देखते हैं। कृपया यह रिपोर्ट अपने डॉक्टर को दिखाएँ।',
    },
  },

  // ── LDL cholesterol ──
  'ldl cholesterol': {
    LOW: {
      en: 'Your LDL cholesterol is below the usual range. Please discuss this with your doctor.',
      te: 'మీ LDL కొలెస్ట్రాల్ సాధారణ పరిధి కంటే తక్కువగా ఉంది. దయచేసి దీని గురించి మీ డాక్టర్‌తో చర్చించండి.',
      hi: 'आपका LDL कोलेस्ट्रॉल सामान्य सीमा से कम है। कृपया इसके बारे में अपने डॉक्टर से चर्चा करें।',
    },
    HIGH: {
      en: 'Your LDL cholesterol (sometimes called "bad" cholesterol) is above the usual range. Your doctor can advise if any changes are needed. Please show this report to your doctor.',
      te: 'మీ LDL కొలెస్ట్రాల్ (కొన్నిసార్లు "చెడు" కొలెస్ట్రాల్ అని పిలవబడుతుంది) సాధారణ పరిధి కంటే ఎక్కువగా ఉంది. ఏవైనా మార్పులు అవసరమా అని మీ డాక్టర్ సలహా ఇవ్వగలరు. దయచేసి ఈ రిపోర్ట్‌ను మీ డాక్టర్‌కు చూపించండి.',
      hi: 'आपका LDL कोलेस्ट्रॉल (जिसे कभी-कभी "खराब" कोलेस्ट्रॉल कहा जाता है) सामान्य सीमा से अधिक है। आपके डॉक्टर बता सकते हैं कि कोई बदलाव ज़रूरी है या नहीं। कृपया यह रिपोर्ट अपने डॉक्टर को दिखाएँ।',
    },
  },

  // ── HDL cholesterol ──
  'hdl cholesterol': {
    LOW: {
      en: 'Your HDL cholesterol (sometimes called "good" cholesterol) is below the usual range. Regular exercise and a balanced diet may help. Please discuss with your doctor.',
      te: 'మీ HDL కొలెస్ట్రాల్ (కొన్నిసార్లు "మంచి" కొలెస్ట్రాల్ అని పిలవబడుతుంది) సాధారణ పరిధి కంటే తక్కువగా ఉంది. క్రమం తప్పని వ్యాయామం మరియు సమతుల్య ఆహారం సహాయపడవచ్చు. దయచేసి మీ డాక్టర్‌తో చర్చించండి.',
      hi: 'आपका HDL कोलेस्ट्रॉल (जिसे कभी-कभी "अच्छा" कोलेस्ट्रॉल कहा जाता है) सामान्य सीमा से कम है। नियमित व्यायाम और संतुलित आहार मदद कर सकते हैं। कृपया अपने डॉक्टर से चर्चा करें।',
    },
    HIGH: {
      en: 'Your HDL cholesterol is above the usual range. HDL is generally considered protective, but please discuss this result with your doctor.',
      te: 'మీ HDL కొలెస్ట్రాల్ సాధారణ పరిధి కంటే ఎక్కువగా ఉంది. HDL సాధారణంగా రక్షణాత్మకంగా పరిగణించబడుతుంది, కానీ దయచేసి ఈ ఫలితాన్ని మీ డాక్టర్‌తో చర్చించండి.',
      hi: 'आपका HDL कोलेस्ट्रॉल सामान्य सीमा से अधिक है। HDL को आमतौर पर सुरक्षात्मक माना जाता है, लेकिन कृपया इस परिणाम पर अपने डॉक्टर से चर्चा करें।',
    },
  },

  // ── Triglycerides ──
  'triglycerides': {
    LOW: {
      en: 'Your triglyceride level is below the usual range. Please discuss this with your doctor.',
      te: 'మీ ట్రైగ్లిసరైడ్ స్థాయి సాధారణ పరిధి కంటే తక్కువగా ఉంది. దయచేసి దీని గురించి మీ డాక్టర్‌తో చర్చించండి.',
      hi: 'आपका ट्राइग्लिसराइड स्तर सामान्य सीमा से कम है। कृपया इसके बारे में अपने डॉक्टर से चर्चा करें।',
    },
    HIGH: {
      en: 'Your triglyceride level is above the usual range. Triglycerides are a type of fat in your blood. Diet and exercise can sometimes help. Please show this report to your doctor.',
      te: 'మీ ట్రైగ్లిసరైడ్ స్థాయి సాధారణ పరిధి కంటే ఎక్కువగా ఉంది. ట్రైగ్లిసరైడ్‌లు మీ రక్తంలో ఒక రకమైన కొవ్వు. ఆహారం మరియు వ్యాయామం కొన్నిసార్లు సహాయపడవచ్చు. దయచేసి ఈ రిపోర్ట్‌ను మీ డాక్టర్‌కు చూపించండి.',
      hi: 'आपका ट्राइग्लिसराइड स्तर सामान्य सीमा से अधिक है। ट्राइग्लिसराइड्स आपके रक्त में एक प्रकार की वसा है। आहार और व्यायाम कभी-कभी मदद कर सकते हैं। कृपया यह रिपोर्ट अपने डॉक्टर को दिखाएँ।',
    },
  },

  // ── Creatinine ──
  'creatinine': {
    LOW: {
      en: 'Your creatinine level is below the usual range. Creatinine is a waste product filtered by the kidneys. Please discuss this with your doctor.',
      te: 'మీ క్రియాటినిన్ స్థాయి సాధారణ పరిధి కంటే తక్కువగా ఉంది. క్రియాటినిన్ మూత్రపిండాలు ఫిల్టర్ చేసే వ్యర్థ పదార్థం. దయచేసి దీని గురించి మీ డాక్టర్‌తో చర్చించండి.',
      hi: 'आपका क्रिएटिनिन स्तर सामान्य सीमा से कम है। क्रिएटिनिन गुर्दों द्वारा फ़िल्टर किया जाने वाला अपशिष्ट पदार्थ है। कृपया इसके बारे में अपने डॉक्टर से चर्चा करें।',
    },
    HIGH: {
      en: 'Your creatinine level is above the usual range. Creatinine is a waste product filtered by the kidneys. Please show this report to your doctor for further evaluation.',
      te: 'మీ క్రియాటినిన్ స్థాయి సాధారణ పరిధి కంటే ఎక్కువగా ఉంది. క్రియాటినిన్ మూత్రపిండాలు ఫిల్టర్ చేసే వ్యర్థ పదార్థం. తదుపరి మూల్యాంకనం కోసం దయచేసి ఈ రిపోర్ట్‌ను మీ డాక్టర్‌కు చూపించండి.',
      hi: 'आपका क्रिएटिनिन स्तर सामान्य सीमा से अधिक है। क्रिएटिनिन गुर्दों द्वारा फ़िल्टर किया जाने वाला अपशिष्ट पदार्थ है। कृपया आगे की जाँच के लिए यह रिपोर्ट अपने डॉक्टर को दिखाएँ।',
    },
  },

  // ── TSH ──
  'tsh': {
    LOW: {
      en: 'Your TSH level is below the usual range. TSH is a hormone that controls how your thyroid gland works. Please show this report to your doctor.',
      te: 'మీ TSH స్థాయి సాధారణ పరిధి కంటే తక్కువగా ఉంది. TSH అనేది మీ థైరాయిడ్ గ్రంథి ఎలా పనిచేస్తుందో నియంత్రించే హార్మోన్. దయచేసి ఈ రిపోర్ట్‌ను మీ డాక్టర్‌కు చూపించండి.',
      hi: 'आपका TSH स्तर सामान्य सीमा से कम है। TSH एक हार्मोन है जो आपकी थायरॉयड ग्रंथि को नियंत्रित करता है। कृपया यह रिपोर्ट अपने डॉक्टर को दिखाएँ।',
    },
    HIGH: {
      en: 'Your TSH level is above the usual range. TSH is a hormone that controls how your thyroid gland works. Please show this report to your doctor.',
      te: 'మీ TSH స్థాయి సాధారణ పరిధి కంటే ఎక్కువగా ఉంది. TSH అనేది మీ థైరాయిడ్ గ్రంథి ఎలా పనిచేస్తుందో నియంత్రించే హార్మోన్. దయచేసి ఈ రిపోర్ట్‌ను మీ డాక్టర్‌కు చూపించండి.',
      hi: 'आपका TSH स्तर सामान्य सीमा से अधिक है। TSH एक हार्मोन है जो आपकी थायरॉयड ग्रंथि को नियंत्रित करता है। कृपया यह रिपोर्ट अपने डॉक्टर को दिखाएँ।',
    },
  },

  // ── Potassium (non-critical only) ──
  'potassium': {
    LOW: {
      en: 'Your potassium level is a little below the usual range. Potassium helps your muscles and nerves work properly. Please consult your doctor.',
      te: 'మీ పొటాషియం స్థాయి సాధారణ పరిధి కంటే కొంచెం తక్కువగా ఉంది. పొటాషియం మీ కండరాలు మరియు నరాలు సరిగ్గా పనిచేయడానికి సహాయపడుతుంది. దయచేసి మీ డాక్టర్‌ను సంప్రదించండి.',
      hi: 'आपका पोटैशियम स्तर सामान्य सीमा से थोड़ा कम है। पोटैशियम आपकी मांसपेशियों और नसों को ठीक से काम करने में मदद करता है। कृपया अपने डॉक्टर से परामर्श करें।',
    },
    HIGH: {
      en: 'Your potassium level is a little above the usual range. Potassium helps your muscles and nerves work properly. Please consult your doctor.',
      te: 'మీ పొటాషియం స్థాయి సాధారణ పరిధి కంటే కొంచెం ఎక్కువగా ఉంది. పొటాషియం మీ కండరాలు మరియు నరాలు సరిగ్గా పనిచేయడానికి సహాయపడుతుంది. దయచేసి మీ డాక్టర్‌ను సంప్రదించండి.',
      hi: 'आपका पोटैशियम स्तर सामान्य सीमा से थोड़ा अधिक है। पोटैशियम आपकी मांसपेशियों और नसों को ठीक से काम करने में मदद करता है। कृपया अपने डॉक्टर से परामर्श करें।',
    },
  },

  // ── Vitamin D ──
  'vitamin d': {
    LOW: {
      en: 'Your vitamin D level is below the usual range. Vitamin D is important for bone health and your immune system. Please discuss with your doctor about next steps.',
      te: 'మీ విటమిన్ D స్థాయి సాధారణ పరిధి కంటే తక్కువగా ఉంది. విటమిన్ D ఎముకల ఆరోగ్యానికి మరియు మీ రోగనిరోధక వ్యవస్థకు ముఖ్యమైనది. తదుపరి చర్యల గురించి మీ డాక్టర్‌తో చర్చించండి.',
      hi: 'आपका विटामिन D स्तर सामान्य सीमा से कम है। विटामिन D हड्डियों के स्वास्थ्य और आपकी प्रतिरक्षा प्रणाली के लिए महत्वपूर्ण है। कृपया अगले कदमों के बारे में अपने डॉक्टर से चर्चा करें।',
    },
    HIGH: {
      en: 'Your vitamin D level is above the usual range. While vitamin D is essential, very high levels may need monitoring. Please show this report to your doctor.',
      te: 'మీ విటమిన్ D స్థాయి సాధారణ పరిధి కంటే ఎక్కువగా ఉంది. విటమిన్ D అవసరమైనప్పటికీ, చాలా ఎక్కువ స్థాయిలకు పర్యవేక్షణ అవసరం కావచ్చు. దయచేసి ఈ రిపోర్ట్‌ను మీ డాక్టర్‌కు చూపించండి.',
      hi: 'आपका विटामिन D स्तर सामान्य सीमा से अधिक है। जबकि विटामिन D आवश्यक है, बहुत अधिक स्तर की निगरानी की आवश्यकता हो सकती है। कृपया यह रिपोर्ट अपने डॉक्टर को दिखाएँ।',
    },
  },
};

// ────────────────────────────────────────────────────────────
// Template lookup
// ────────────────────────────────────────────────────────────

/**
 * Look up a summary template for a given parameter, direction, and language.
 * @param {string} parameter
 * @param {'LOW'|'HIGH'} direction
 * @param {'en'|'te'|'hi'} lang
 * @returns {string|null}
 */
export function getTemplate(parameter, direction, lang) {
  if (!parameter || !direction || !lang) return null;
  const key = parameter.toLowerCase().trim();
  const entry = SUMMARY_TEMPLATES[key];
  if (!entry) return null;
  const dirEntry = entry[direction];
  if (!dirEntry) return null;
  return dirEntry[lang] || null;
}

// ────────────────────────────────────────────────────────────
// AI output validation
// ────────────────────────────────────────────────────────────

/** Regex that guards AI input parameter strings */
export const INPUT_GUARD_REGEX = /^[A-Za-z0-9 ()/%.,+\-µ]{1,60}$/;

/** Words that must never appear in AI-generated patient summaries */
export const BANNED_WORDS = [
  'cancer', 'diabetes', 'tablet', 'medicine', 'you have',
  'diagnos', 'treat', 'prescription', 'malignant', 'tumor',
  'tumour', 'fatal', 'terminat', 'die', 'death', 'prognosis',
];

/**
 * Validate AI-generated summary output.
 * @param {string} output — raw JSON string from AI
 * @param {Array<{parameter: string, value: string}>} inputParams — input parameters
 * @returns {{ valid: boolean, items?: Array, error?: string }}
 */
export function validateAIOutput(output, inputParams) {
  let parsed;
  try {
    parsed = JSON.parse(output);
  } catch {
    return { valid: false, error: 'Invalid JSON' };
  }

  const items = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed.items) ? parsed.items : null);
  if (!items) {
    return { valid: false, error: 'AI output is not an array or does not contain items array' };
  }

  // One item per parameter
  if (items.length !== inputParams.length) {
    return { valid: false, error: `Expected ${inputParams.length} items, got ${items.length}` };
  }

  // Collect all numeric values from input for cross-check
  const inputNumbers = new Set();
  for (const p of inputParams) {
    const valNums = String(p.value || '').match(/[\d.]+/g);
    if (valNums) valNums.forEach(n => inputNumbers.add(n));
    const rangeNums = String(p.range || '').match(/[\d.]+/g);
    if (rangeNums) rangeNums.forEach(n => inputNumbers.add(n));
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (!item || typeof item !== 'object') {
      return { valid: false, error: `Item ${i} is not an object` };
    }

    if (!item.parameter || !item.text) {
      return { valid: false, error: `Item ${i} missing parameter or text` };
    }

    // Length limit
    if (item.text.length > 500) {
      return { valid: false, error: `Item ${i} text exceeds 500 characters` };
    }

    // Banned words check with word boundary to avoid matching "die" in "studies"
    const lowerText = item.text.toLowerCase();
    for (const word of BANNED_WORDS) {
      const regex = new RegExp(`\\b${word}`, 'i');
      if (regex.test(lowerText)) {
        return { valid: false, error: `Item ${i} contains banned word: "${word}"` };
      }
    }

    // Every number in the text must exist in input data
    // Strip trailing punctuation like '.' or ','
    const textNums = (item.text.match(/\b\d+(?:\.\d+)?\b/g) || []);
    for (const num of textNums) {
      if (!inputNumbers.has(num)) {
        return { valid: false, error: `Invented number: item ${i} contains number "${num}" not in input data` };
      }
    }
  }

  return { valid: true, items };
}

// ────────────────────────────────────────────────────────────
// Fallback generator
// ────────────────────────────────────────────────────────────

/**
 * Generate a simple fallback summary when template and AI both fail.
 * @param {string} parameter
 * @param {string} value
 * @param {string} range
 * @param {'en'|'te'|'hi'} lang
 * @returns {string}
 */
export function generateFallback(parameter, value, range, lang) {
  const templates = {
    en: `The value for ${parameter} is outside the usual range (${value}, usual ${range}). Please see your doctor.`,
    // needs native-speaker review
    te: `${parameter} యొక్క విలువ సాధారణ పరిధి వెలుపల ఉంది (${value}, సాధారణ ${range}). దయచేసి మీ డాక్టర్‌ను సంప్రదించండి.`,
    // needs native-speaker review
    hi: `${parameter} का मान सामान्य सीमा से बाहर है (${value}, सामान्य ${range})। कृपया अपने डॉक्टर से परामर्श करें।`,
  };

  return templates[lang] || templates.en;
}

// ────────────────────────────────────────────────────────────
// AI caller
// ────────────────────────────────────────────────────────────

/**
 * Call Anthropic Claude API for summary generation.
 * @param {Array<{parameter: string, value: string, range: string, flag: string}>} items
 * @param {'en'|'te'|'hi'} lang
 * @returns {Promise<Array|null>}
 */
export async function callAI(items, lang) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const langNames = { en: 'English', te: 'Telugu', hi: 'Hindi' };
  const langName = langNames[lang] || 'English';

  const prompt = `You are a medical lab report summarizer. Generate a brief, patient-friendly explanation for each of the following abnormal test results.

STRICT RULES:
1. Write in ${langName}.
2. For each parameter, write 1-2 simple sentences explaining what the test measures and that the value is outside the usual range.
3. Always end with "Please show this report to your doctor." (or its ${langName} translation).
4. NEVER mention any diagnosis, disease name, medication, or treatment.
5. NEVER use words like: cancer, diabetes, tablet, medicine, diagnose, treat, prescription.
6. Only reference numbers that appear in the input data.
7. Do NOT include the patient's name or any personal details.

INPUT:
${JSON.stringify(items)}

Respond with a JSON array of objects, each with "parameter" and "text" fields. Nothing else.`;

  const maxRetries = 1;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 2048,
          temperature: 0,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`AI API error (attempt ${attempt}):`, response.status);
        continue;
      }

      const data = await response.json();
      const text = data.content?.[0]?.text;
      if (!text) continue;

      // Extract JSON from response (may have markdown wrappers)
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) continue;

      return JSON.parse(jsonMatch[0]);
    } catch (err) {
      console.error(`AI call failed (attempt ${attempt}):`, err.message);
      continue;
    }
  }

  return null;
}

// ────────────────────────────────────────────────────────────
// Main orchestrator
// ────────────────────────────────────────────────────────────

/**
 * Generate summaries for all 3 languages for an order.
 * Pipeline: templates → AI → fallback
 * @param {string} orderId
 * @returns {Promise<void>}
 */
export async function generateSummariesForOrder(orderId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { results: true },
  });

  if (!order) return;

  // Find abnormal results
  const abnormalResults = order.results.filter(
    r => r.flag && !['NORMAL', 'UNKNOWN'].includes(r.flag)
  );

  if (abnormalResults.length === 0) {
    // Create a simple "all normal" summary for each language
    const normalMessages = {
      en: 'All your test results are within the usual range. Please keep this report for your records.',
      // needs native-speaker review
      te: 'మీ అన్ని పరీక్ష ఫలితాలు సాధారణ పరిధిలో ఉన్నాయి. దయచేసి ఈ రిపోర్ట్‌ను మీ రికార్డుల కోసం ఉంచుకోండి.',
      // needs native-speaker review
      hi: 'आपके सभी परीक्षण परिणाम सामान्य सीमा में हैं। कृपया इस रिपोर्ट को अपने रिकॉर्ड के लिए रखें।',
    };

    for (const lang of ['en', 'te', 'hi']) {
      await prisma.summary.upsert({
        where: { orderId_lang: { orderId, lang } },
        create: {
          orderId,
          lang,
          source: 'TEMPLATE',
          body: normalMessages[lang],
        },
        update: {
          source: 'TEMPLATE',
          body: normalMessages[lang],
        },
      });
    }
    return;
  }

  // For each language, generate summaries
  for (const lang of ['en', 'te', 'hi']) {
    const summaryParts = [];
    const needsAI = [];
    let source = 'TEMPLATE';

    // Step 1: Try templates first
    for (const result of abnormalResults) {
      const direction = result.flag.includes('LOW') ? 'LOW' : 'HIGH';
      const template = getTemplate(result.parameter, direction, lang);

      if (template) {
        summaryParts.push({ parameter: result.parameter, text: template, fromTemplate: true });
      } else {
        needsAI.push({
          parameter: result.parameter,
          value: result.value,
          range: result.refRangeRaw || '',
          flag: result.flag,
        });
      }
    }

    // Step 2: Try AI for gaps
    if (needsAI.length > 0) {
      // Validate inputs
      const validForAI = needsAI.filter(item => INPUT_GUARD_REGEX.test(item.parameter));

      if (validForAI.length > 0) {
        const aiResult = await callAI(validForAI, lang);
        if (aiResult) {
          const validation = validateAIOutput(
            JSON.stringify(aiResult),
            validForAI
          );

          if (validation.valid) {
            source = summaryParts.length > 0 ? 'TEMPLATE' : 'AI';
            for (const item of validation.items) {
              summaryParts.push({ parameter: item.parameter, text: item.text, fromTemplate: false });
            }
            // Remove matched items from needsAI
            const aiParams = new Set(validation.items.map(i => i.parameter.toLowerCase()));
            const remaining = needsAI.filter(n => !aiParams.has(n.parameter.toLowerCase()));
            needsAI.length = 0;
            needsAI.push(...remaining);
          }
        }
      }
    }

    // Step 3: Fallback for anything remaining
    if (needsAI.length > 0) {
      source = summaryParts.length > 0 ? source : 'FALLBACK';
      for (const item of needsAI) {
        const fallbackText = generateFallback(item.parameter, item.value, item.range, lang);
        summaryParts.push({ parameter: item.parameter, text: fallbackText, fromTemplate: false });
      }
    }

    // Combine all parts
    const fullBody = summaryParts.map(p => p.text).join('\n\n');
    const allFromTemplates = summaryParts.every(p => p.fromTemplate);
    const finalSource = allFromTemplates ? 'TEMPLATE' : (source === 'AI' ? 'AI' : needsAI.length > 0 ? 'FALLBACK' : source);

    await prisma.summary.upsert({
      where: { orderId_lang: { orderId, lang } },
      create: {
        orderId,
        lang,
        source: finalSource,
        body: fullBody,
        model: finalSource === 'AI' ? 'claude-3-5-haiku-20241022' : null,
      },
      update: {
        source: finalSource,
        body: fullBody,
        model: finalSource === 'AI' ? 'claude-3-5-haiku-20241022' : null,
      },
    });
  }
}
