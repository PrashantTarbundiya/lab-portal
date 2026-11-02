/**
 * Mock messaging provider and message builders.
 * In production, replace MockProvider with a real SMS/WhatsApp gateway.
 */
import prisma from '../lib/prisma.js';

/**
 * Base message provider class.
 */
export class MessageProvider {
  /**
   * Send a message.
   * @param {object} params
   * @param {string} params.to — recipient phone (E.164)
   * @param {string} params.body — message body
   * @param {string} params.channel — WHATSAPP or SMS
   * @param {string} params.orderId — associated order ID
   * @param {string} params.accountId — associated account ID
   * @param {string} params.kind — REPORT_LINK, RESEND, or OTP
   * @returns {Promise<object>} — created Message record
   */
  async send({ to, body, channel, orderId, accountId, kind }) {
    throw new Error('MessageProvider.send() must be implemented by subclass');
  }
}

/**
 * Mock provider that creates Message rows with simulated delivery.
 * Delivery happens 2 seconds after creation (deliverAt).
 */
export class MockProvider extends MessageProvider {
  async send({ to, body, channel = 'WHATSAPP', orderId, accountId, kind = 'REPORT_LINK' }) {
    const deliverAt = new Date(Date.now() + 2000); // 2 seconds from now

    const message = await prisma.message.create({
      data: {
        orderId,
        accountId,
        channel,
        kind,
        body,
        status: 'QUEUED',
        deliverAt,
      },
    });

    return message;
  }
}

/**
 * Get the effective delivery status of a message.
 * If deliverAt has passed and status is QUEUED or SENT, simulate DELIVERED.
 * @param {object} message — Message record
 * @returns {string} — effective status
 */
export function getMessageStatus(message) {
  if (!message) return 'UNKNOWN';

  if (
    message.deliverAt &&
    new Date(message.deliverAt) <= new Date() &&
    (message.status === 'QUEUED' || message.status === 'SENT')
  ) {
    return 'DELIVERED';
  }

  return message.status;
}

/**
 * Build a report notification message.
 * Contains NO patient name or test details for privacy.
 * @param {object} params
 * @param {string} params.labName — lab display name
 * @param {string} params.url — secure link URL
 * @param {string} [params.lang='en'] — language code
 * @returns {string}
 */
export function buildReportMessage({ labName, url, lang = 'en' }) {
  const messages = {
    en: [
      `${labName}: Your lab report is ready.`,
      `View it securely here: ${url}`,
      `You will need an OTP sent to your registered mobile to view the report.`,
      `This link is valid for 72 hours.`,
      `If this message was not meant for you, please tap the "Not for me" button on the link page.`,
    ].join('\n'),

    te: [
      // needs native-speaker review
      `${labName}: మీ ల్యాబ్ రిపోర్ట్ సిద్ధంగా ఉంది.`,
      `ఇక్కడ సురక్షితంగా చూడండి: ${url}`,
      `రిపోర్ట్ చూడటానికి మీ రిజిస్టర్డ్ మొబైల్‌కు పంపిన OTP అవసరం.`,
      `ఈ లింక్ 72 గంటలు చెల్లుబాటు అవుతుంది.`,
      `ఈ సందేశం మీ కోసం కాకపోతే, లింక్ పేజీలో "ఇది నాకు కాదు" బటన్ నొక్కండి.`,
    ].join('\n'),

    hi: [
      // needs native-speaker review
      `${labName}: आपकी लैब रिपोर्ट तैयार है।`,
      `इसे सुरक्षित रूप से यहाँ देखें: ${url}`,
      `रिपोर्ट देखने के लिए आपके रजिस्टर्ड मोबाइल पर भेजे गए OTP की ज़रूरत होगी।`,
      `यह लिंक 72 घंटे तक मान्य है।`,
      `अगर यह संदेश आपके लिए नहीं है, तो लिंक पेज पर "यह मेरे लिए नहीं है" बटन दबाएँ।`,
    ].join('\n'),
  };

  return messages[lang] || messages.en;
}

/** Singleton instance of the mock provider */
export const messageProvider = new MockProvider();
