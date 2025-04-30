// mpesa.js
require('dotenv').config();
const fetch = require('node-fetch');

const {
  MPESA_CONSUMER_KEY: consumerKey,
  MPESA_CONSUMER_SECRET: consumerSecret,
  MPESA_SHORTCODE: shortCode,
  MPESA_PASSKEY: passkey,
  MPESA_CALLBACK_URL: callbackUrl
} = process.env;

// 1. Ensure all env vars are set
if (!consumerKey || !consumerSecret || !shortCode || !passkey || !callbackUrl) {
  throw new Error("Missing one or more required MPESA_ environment variables.");
}

// 2. Prepare Basic auth header
const auth = Buffer
  .from(`${consumerKey}:${consumerSecret}`)
  .toString('base64');

/**
 * Perform an M-Pesa STK Push.
 * @param {{phone:string, amount:number, accountRef?:string, desc?:string}} opts
 */
async function lipaNaMpesa({ phone, amount, accountRef = 'ThirdOpinion', desc = 'Podcast Booking' }) {
  // Validate phone (must be 10 digits)
  if (!/^\d{10}$/.test(phone)) {
    throw new Error("Invalid phone format. Use e.g. 0712345678");
  }
  // Validate amount
  if (typeof amount !== 'number' || amount <= 0) {
    throw new Error("Invalid amount. Must be a positive number.");
  }

  const msisdn = phone.replace(/^0/, '254');

  // 1️⃣ Fetch OAuth token
  const tokenRes = await fetch(
    'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    { headers: { Authorization: `Basic ${auth}` } }
  );
  let tokenData;
  try {
    tokenData = await tokenRes.json();
  } catch (err) {
    console.error("⚠️  Couldn’t parse OAuth response:", err);
    throw new Error("M-Pesa auth failed (invalid JSON).");
  }
  console.log("📡 OAuth:", tokenRes.status, tokenRes.statusText, tokenData);

  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error("M-Pesa auth failed: " + (tokenData.errorMessage || tokenRes.statusText));
  }
  const access_token = tokenData.access_token;

  // 2️⃣ Build STK password/timestamp
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:TZ\.]/g, '')
    .slice(0, 14);
  const password = Buffer
    .from(shortCode + passkey + timestamp)
    .toString('base64');

  // 3️⃣ Prepare payload
  const payload = {
    BusinessShortCode: shortCode,
    Password:          password,
    Timestamp:         timestamp,
    TransactionType:   'CustomerPayBillOnline',
    Amount:            amount,
    PartyA:            msisdn,
    PartyB:            shortCode,
    PhoneNumber:       msisdn,
    CallBackURL:       callbackUrl,
    AccountReference:  accountRef,
    TransactionDesc:   desc
  };
  console.log("📨 STK Push payload:", payload);

  // 4️⃣ Send STK Push request
  const stkRes = await fetch(
    'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }
  );

  let stkData;
  try {
    stkData = await stkRes.json();
  } catch (err) {
    console.error("⚠️  Couldn’t parse STK response:", err);
    throw new Error("M-Pesa STK Push failed (invalid JSON).");
  }
  console.log("🚀 STK Push response:", stkRes.status, stkRes.statusText, stkData);

  if (!stkRes.ok || stkData.ResponseCode !== '0') {
    throw new Error(
      `M-Pesa STK Push error (${stkData.errorCode || stkData.ResponseCode}): ` +
      (stkData.errorMessage || stkData.ResponseDescription || JSON.stringify(stkData))
    );
  }

  return stkData;
}

module.exports = { lipaNaMpesa };
