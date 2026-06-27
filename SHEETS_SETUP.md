# Tendrix Signups — Google Sheet Setup Guide

## What your sheet will look like after the first signup

| Timestamp (IST)     | Email                    | Source           | Status    | Notes                          |
|---------------------|--------------------------|------------------|-----------|--------------------------------|
| 15 Jul 2025, 10:32 AM | ramesh@example.com     | hero-email       | Contacted | Called 16 Jul, interested      |
| 15 Jul 2025, 2:14 PM  | priya@itfirm.co.in     | pricing-starter  | New       |                                |
| 16 Jul 2025, 9:05 AM  | anil@constructco.in    | final-email      | Called    | Wants team plan, follow up Sep |

**You update columns D (Status) and E (Notes) manually after each outreach.**

---

## Step 1 — Create the Google Sheet (2 min)

1. Go to [sheets.google.com](https://sheets.google.com) → **Blank spreadsheet**
2. Rename the sheet: "Tendrix Signups"
3. Add headers in Row 1, exactly as shown:

```
A1: Timestamp (IST)
B1: Email
C1: Source
D1: Status
E1: Notes
```

4. **Bold Row 1** and freeze it: View → Freeze → 1 row
5. Copy the Sheet ID from the URL bar:
   `https://docs.google.com/spreadsheets/d/`**`1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms`**`/edit`
   → Save this, you'll need it in Step 4

---

## Step 2 — Enable Google Sheets API (3 min)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click the project dropdown (top bar) → **New Project**
   - Project name: `Tendrix`
   - Click **Create**
3. Make sure the Tendrix project is selected in the dropdown
4. Go to **APIs & Services → Library**
5. Search "Google Sheets API" → click it → click **Enable**

---

## Step 3 — Create a Service Account (5 min)

1. In Google Cloud Console → **IAM & Admin → Service Accounts**
2. Click **Create Service Account**
   - Name: `tendrix-sheets-writer`
   - Description: `Writes signup rows to Tendrix Google Sheet`
   - Click **Create and Continue** → **Done** (skip role assignment)
3. Click the service account you just created
4. Go to the **Keys** tab → **Add Key → Create new key → JSON**
5. A `.json` file downloads — open it and copy:
   - `"client_email"` value  → looks like `tendrix-sheets-writer@tendrix-xyz.iam.gserviceaccount.com`
   - `"private_key"` value   → long string starting with `-----BEGIN RSA PRIVATE KEY-----`

---

## Step 4 — Share the Sheet with the Service Account (1 min)

1. Open your Google Sheet
2. Click **Share** (top right)
3. Paste the `client_email` from Step 3 into the share field
4. Set permission to **Editor**
5. Click **Send** (uncheck "notify people")

---

## Step 5 — Add Environment Variables to Vercel (3 min)

In Vercel dashboard → your project → **Settings → Environment Variables**:

| Variable Name          | Value                                          |
|------------------------|------------------------------------------------|
| `RESEND_API_KEY`       | `re_xxxxxxxxxxxxxxxxxxxx`  (from resend.com)   |
| `FOUNDER_EMAIL`        | `atharv@tendrix.in`                            |
| `GOOGLE_SHEET_ID`      | The Sheet ID you copied in Step 1              |
| `GOOGLE_CLIENT_EMAIL`  | The `client_email` from Step 3                 |
| `GOOGLE_PRIVATE_KEY`   | The full `private_key` from Step 3 (with `\n`)|

⚠️ **For `GOOGLE_PRIVATE_KEY`**: paste the full key including
`-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----`.
Vercel's UI handles multi-line values correctly — just paste as-is.

---

## Step 6 — Install & Deploy (2 min)

```bash
npm install resend googleapis
vercel deploy
```

That's it. Test it by submitting your own email on the landing page —
you should see a new row appear in the sheet within 2–3 seconds.

---

## Managing your signups day-to-day

**Status values to use in column D:**

| Status       | Meaning                                      |
|--------------|----------------------------------------------|
| `New`        | Auto-set on signup — not yet contacted        |
| `Contacted`  | You've sent LinkedIn/WhatsApp message         |
| `Replied`    | They responded                               |
| `Call booked`| Meeting scheduled                            |
| `Called`     | Interview done — add notes in column E        |
| `Not relevant` | Wrong persona, not worth following up      |

**Tip:** Sort by column D to see all "New" leads at the top every morning.
The sheet becomes your full outreach CRM for the validation phase.

---

## If Google Sheets setup feels like too much right now

Replace the Sheet append block in `api/subscribe.js` with this one-liner
and signups will only go via email (still functional, just no spreadsheet):

```js
// Comment out the Google Sheets block and just keep the two resend.emails.send() calls
// Everything still works — you'll just track leads manually from your inbox
```

You can add Sheets later without touching the landing page.
