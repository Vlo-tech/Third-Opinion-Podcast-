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

if (!consumerKey || !consumerSecret || !shortCode || !passkey || !callbackUrl) {
  throw new Error("Missing one of the required MPESA_ environment variables.");
}

// base64 for Basic auth header
const auth = Buffer
  .from(`${consumerKey}:${consumerSecret}`)
  .toString('base64');

async function lipaNaMpesa({ phone, amount, accountRef, desc }) {
  // 1. Get access token
  const tokenRes = await fetch(
    'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    { headers: { Authorization: `Basic ${auth}` } }
  );
  if (!tokenRes.ok) throw new Error("Failed to fetch Mpesa access token");
  const { access_token } = await tokenRes.json();

  // 2. Build STK Push payload
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:TZ\.]/g, '')
    .slice(0, 14);
  const password = Buffer
    .from(shortCode + passkey + timestamp)
    .toString('base64');

  const payload = {
    BusinessShortCode: shortCode,
    Password:          password,
    Timestamp:         timestamp,
    TransactionType:   'CustomerPayBillOnline',
    Amount:            amount,
    PartyA:            phone.replace(/^0/, '254'),
    PartyB:            shortCode,
    PhoneNumber:       phone.replace(/^0/, '254'),
    CallBackURL:       callbackUrl,
    AccountReference:  accountRef,
    TransactionDesc:   desc
  };

  // 3. Send STK Push
  const stkRes = await fetch(
    'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
    {
      method:  'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }
  );

  if (!stkRes.ok) {
    const errorBody = await stkRes.text();
    throw new Error(`Mpesa STK Push failed: ${errorBody}`);
  }
  return stkRes.json();
}

module.exports = { lipaNaMpesa };
