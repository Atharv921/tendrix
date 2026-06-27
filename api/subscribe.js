/**
 * Tendrix — /api/subscribe.js
 * Vercel Serverless Function (Node.js runtime)
 *
 * WHAT THIS DOES ON EVERY SIGNUP:
 *   1. Appends a row to your Google Sheet  (email, source, time, status, notes)
 *   2. Sends YOU an instant notification email (reply-to = their email)
 *   3. Sends THEM a warm personal confirmation with your cal link
 *   All three run in parallel — no added latency.
 *
 * ─── ONE-TIME SETUP (15 minutes total) ───────────────────────────────────────
 *
 * STEP 1 — Google Sheet
 *   a. Go to sheets.google.com → create a new sheet called "Tendrix Signups"
 *   b. Add these headers in Row 1 (exact spelling matters):
 *      A1: Timestamp (IST)
 *      B1: Email
 *      C1: Source
 *      D1: Status          ← you'll manually update this (e.g. "Contacted", "Called")
 *      E1: Notes           ← your personal notes after each conversation
 *   c. Copy the Sheet ID from the URL:
 *      https://docs.google.com/spreadsheets/d/  →THIS PART←  /edit
 *
 * STEP 2 — Google Service Account
 *   a. Go to console.cloud.google.com → create a new project "Tendrix"
 *   b. Enable "Google Sheets API" for that project
 *   c. Go to IAM & Admin → Service Accounts → Create Service Account
 *      Name: "tendrix-sheets-writer"
 *   d. Create a JSON key → download it
 *   e. Open the JSON key — copy:
 *      - "client_email"  (looks like tendrix-sheets-writer@tendrix.iam.gserviceaccount.com)
 *      - "private_key"   (long string starting with -----BEGIN RSA PRIVATE KEY-----)
 *   f. Share your Google Sheet with the client_email (Editor access)
 *
 * STEP 3 — Resend
 *   a. Create account at resend.com
 *   b. Add + verify tendrix.in as a domain (add DNS TXT record — takes ~10 min)
 *   c. Create an API key → copy it
 *
 * STEP 4 — Vercel Environment Variables
 *   In Vercel dashboard → your project → Settings → Environment Variables, add:
 *
 *   RESEND_API_KEY          re_xxxxxxxxxxxxxxxxxxxx
 *   FOUNDER_EMAIL           atharv@tendrix.in
 *   GOOGLE_SHEET_ID         1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms  (your sheet ID)
 *   GOOGLE_CLIENT_EMAIL     tendrix-sheets-writer@tendrix.iam.gserviceaccount.com
 *   GOOGLE_PRIVATE_KEY      -----BEGIN RSA PRIVATE KEY-----\nMIIE...  (paste full key, with \n)
 *
 *   ⚠️  For GOOGLE_PRIVATE_KEY: in the Vercel UI, paste the key exactly as-is
 *       including newlines — Vercel handles multi-line env vars correctly.
 *
 * STEP 5 — Install dependencies
 *   npm install resend googleapis
 *
 * STEP 6 — Place this file at /api/subscribe.js and deploy.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Resend }  from 'resend';
import { google }  from 'googleapis';

// ── Clients ──────────────────────────────────────────────────────────────────
const resend = new Resend(process.env.RESEND_API_KEY);

function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      // Vercel stores \n as literal \n in some configs — normalise both ways
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

// ── Dedup (within one warm serverless instance — cold starts reset, that's fine) ──
const seen = new Set();

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, source } = req.body || {};

  // Validate
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const emailLower = email.toLowerCase().trim();

  // Dedup
  if (seen.has(emailLower)) {
    return res.status(200).json({ ok: true, note: 'duplicate' });
  }
  seen.add(emailLower);

  const signupSource = source || 'landing-page';
  const signupTime   = new Date().toLocaleString('en-IN', {
    timeZone:   'Asia/Kolkata',
    day:        '2-digit',
    month:      'short',
    year:       'numeric',
    hour:       '2-digit',
    minute:     '2-digit',
    hour12:     true,
  });
  const founderEmail = process.env.FOUNDER_EMAIL || 'atharv@tendrix.in';
  const sheetId      = process.env.GOOGLE_SHEET_ID;

  // ── Run all three in parallel ─────────────────────────────────────────────
  const [sheetsResult, notifyResult, confirmResult] = await Promise.allSettled([

    // 1. Append row to Google Sheet
    (async () => {
      if (!sheetId) throw new Error('GOOGLE_SHEET_ID not set');
      const sheets = getSheetsClient();
      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range:         'Sheet1!A:E',
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [[
            signupTime,    // A: Timestamp (IST)
            emailLower,    // B: Email
            signupSource,  // C: Source (hero-email / pricing-starter / final-email etc.)
            'New',         // D: Status — you'll update this manually
            '',            // E: Notes — your post-call notes
          ]],
        },
      });
      return 'sheet_ok';
    })(),

    // 2. Notify founder
    resend.emails.send({
      from:     'Tendrix Signups <signups@tendrix.in>',
      to:       founderEmail,
      reply_to: emailLower,
      subject:  `🔔 New signup: ${emailLower}`,
      html: `
        <div style="font-family:sans-serif;max-width:500px;color:#111;line-height:1.5;">
          <h2 style="margin:0 0 20px;font-size:20px;color:#FF6B2B;">New Tendrix signup</h2>
          <table style="width:100%;font-size:14px;border-collapse:collapse;">
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:10px 0;color:#888;width:110px;">Email</td>
              <td style="padding:10px 0;font-weight:600;">${emailLower}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:10px 0;color:#888;">Source</td>
              <td style="padding:10px 0;">${signupSource}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#888;">Time (IST)</td>
              <td style="padding:10px 0;">${signupTime}</td>
            </tr>
          </table>
          <div style="margin-top:24px;padding:14px 16px;background:#f9f9f9;border-radius:8px;font-size:13px;color:#555;">
            ✅ This signup has been logged to your Google Sheet automatically.<br/>
            Hit reply to reach them directly — or open Sheets to update status.
          </div>
          <p style="margin-top:20px;font-size:12px;color:#bbb;">
            Reply-to is set to ${emailLower} so you can respond directly from this email.
          </p>
        </div>
      `,
    }),

    // 3. Confirm to user
    resend.emails.send({
      from:    'Atharv from Tendrix <hello@tendrix.in>',
      to:      emailLower,
      subject: "You're on the Tendrix early access list 🎉",
      html: `
        <div style="font-family:sans-serif;max-width:520px;color:#111;line-height:1.7;">
          <h2 style="font-size:22px;margin:0 0 20px;color:#111;">
            You're in — thanks for signing up!
          </h2>

          <p>I'm Atharv, the founder of Tendrix. I'm building an AI tool that reads
          government tender documents — GeM, CPPP, PWD, NHAI — so MSMEs and bid
          managers don't have to spend days doing it manually.</p>

          <p>Before I ask you to try anything, I'd love a quick 15-minute
          conversation to understand how you currently handle tenders. No pitch,
          just questions — your experience will shape what we build first.</p>

          <p>
            <strong>Pick a slot that works for you:</strong><br/>
            <a href="https://cal.com/atharv" style="color:#FF6B2B;font-weight:600;">
              cal.com/atharv →
            </a>
          </p>

          <p>Or just reply to this email with a time and your WhatsApp number —
          I'll reach out directly.</p>

          <p style="margin-top:32px;">
            Atharv Chavan<br/>
            <span style="color:#999;font-size:14px;">Founder · Tendrix</span><br/>
            <a href="https://tendrix.in" style="color:#FF6B2B;font-size:14px;">
              tendrix.in
            </a>
          </p>

          <hr style="border:none;border-top:1px solid #eee;margin:28px 0;"/>
          <p style="font-size:12px;color:#bbb;">
            You signed up at tendrix.in. No spam, ever.<br/>
            <a href="mailto:hello@tendrix.in?subject=Unsubscribe&body=Please remove me"
               style="color:#bbb;">Unsubscribe</a>
          </p>
        </div>
      `,
    }),

  ]);

  // ── Log results ───────────────────────────────────────────────────────────
  const sheetOk   = sheetsResult.status  === 'fulfilled';
  const notifyOk  = notifyResult.status  === 'fulfilled';
  const confirmOk = confirmResult.status === 'fulfilled';

  if (!sheetOk)   console.error('[subscribe] Sheet append failed:', sheetsResult.reason);
  if (!notifyOk)  console.error('[subscribe] Notify email failed:', notifyResult.reason);
  if (!confirmOk) console.error('[subscribe] Confirm email failed:', confirmResult.reason);

  // Return success as long as at least the sheet write OR one email went through
  // (don't fail the user's experience over a partial backend issue)
  if (!sheetOk && !notifyOk && !confirmOk) {
    return res.status(500).json({ error: 'All downstream calls failed' });
  }

  return res.status(200).json({
    ok: true,
    sheet:   sheetOk,
    notify:  notifyOk,
    confirm: confirmOk,
  });
}
