import { google } from "googleapis";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });

  try {
    const { firstName, lastName, email, phone } = req.body;

    if (!firstName || !lastName || !email || !phone) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const clientEmail   = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    let   privateKey    = process.env.GOOGLE_PRIVATE_KEY;

    if (!spreadsheetId || !clientEmail || !privateKey) {
      return res.status(500).json({ success: false, message: "Server configuration error." });
    }

    privateKey = privateKey.replace(/\\n/g, "\n");

    const auth = new google.auth.JWT({
      email:  clientEmail,
      key:    privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets    = google.sheets({ version: "v4", auth });
    const range     = process.env.GOOGLE_SHEET_RANGE || "Sheet1!A:E";
    const timestamp = new Date().toISOString();

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[timestamp, firstName, lastName, email, phone]] },
    });

    return res.status(200).json({ success: true, message: "RSVP received" });
  } catch (err: any) {
    console.error("RSVP error:", err.message);
    return res.status(500).json({ success: false, message: "Server error. Please try again." });
  }
}
