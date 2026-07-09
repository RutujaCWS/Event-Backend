// src/services/smsService.js
import twilio from 'twilio';

const DEFAULT_SENDER = process.env.TWILIO_PHONE_NUMBER;
const COUNTRY_CODE = process.env.SMS_COUNTRY_CODE || '91';

/**
 * Send an SMS via Twilio
 * @param {string} to - Recipient mobile (10 digits, no country code)
 * @param {string} message - SMS text
 * @param {string} from - Optional sender number (overrides default)
 */
export const sendSMS = async (to, message, from = null) => {
  // ✅ Validate credentials inside the function (after dotenv has loaded)
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error('❌ Twilio credentials missing. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env');
  }

  // Create client lazily (only when needed)
  const client = twilio(accountSid, authToken);

  try {
    // Clean and format the number
    let cleanNumber = to.replace(/[^0-9]/g, '');
    cleanNumber = cleanNumber.replace(/^0+/, '');
    const fullNumber = `+${COUNTRY_CODE}${cleanNumber}`;

    const sender = from || DEFAULT_SENDER;
    if (!sender) {
      throw new Error('Sender phone number not configured');
    }

    const response = await client.messages.create({
      body: message,
      from: sender,
      to: fullNumber,
    });

    console.log(`✅ SMS sent to ${fullNumber}: ${response.sid}`);
    return response;
  } catch (error) {
    console.error('❌ Twilio SMS error:', error.message);
    throw error;
  }
};