import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = twilio(accountSid, authToken);
console.log("Twilio SID:", process.env.TWILIO_ACCOUNT_SID);
console.log("Twilio Token:", process.env.TWILIO_AUTH_TOKEN);

export const sendSMS = async (to, message) => {
  try {
    const sms = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });
    return sms;
  } catch (error) {
    console.error("Twilio SMS Error:", error.message || error);
    throw new Error("Failed to send OTP. Please check Twilio configuration.");
  }
};
