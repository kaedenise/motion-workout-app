/**
 * SMS Service — Twilio integration for phone verification codes
 * 
 * Requires environment variables:
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_PHONE_NUMBER
 */

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

interface SendSMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send SMS verification code via Twilio
 * In demo mode (no Twilio creds), logs to console instead
 */
export async function sendVerificationCodeSMS(
  phoneNumber: string,
  code: string
): Promise<SendSMSResult> {
  // Demo mode: no Twilio credentials
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.log(`[SMS Demo] Verification code for ${phoneNumber}: ${code}`);
    return {
      success: true,
      messageId: `demo-${Date.now()}`,
    };
  }

  try {
    // Twilio API endpoint
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        From: TWILIO_PHONE_NUMBER,
        To: phoneNumber,
        Body: `Your MotionFit verification code is: ${code}. Valid for 10 minutes.`,
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Twilio SMS error:", error);
      return {
        success: false,
        error: "Failed to send SMS",
      };
    }

    const data = (await response.json()) as { sid?: string };
    return {
      success: true,
      messageId: data.sid,
    };
  } catch (err) {
    console.error("SMS service error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
