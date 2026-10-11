export interface GmailSendResult {
  id: string;
  threadId: string;
  labelIds?: string[];
}

export interface EmailPayload {
  to: string;
  subject: string;
  bodyHtml: string;
  cc?: string;
  bcc?: string;
}

/**
 * Encodes string to Base64URL safe format for Gmail API RFC 2822 raw messages
 */
function toBase64Url(str: string): string {
  // Use UTF-8 encoding support
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Builds RFC 2822 compliant email string
 */
function buildRFC2822Message(payload: EmailPayload): string {
  const lines: string[] = [
    `To: ${payload.to}`,
    `Subject: =?utf-8?B?${btoa(new TextEncoder().encode(payload.subject).reduce((acc, byte) => acc + String.fromCharCode(byte), ''))}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
  ];

  if (payload.cc) {
    lines.push(`Cc: ${payload.cc}`);
  }
  if (payload.bcc) {
    lines.push(`Bcc: ${payload.bcc}`);
  }

  lines.push('', payload.bodyHtml);
  return lines.join('\r\n');
}

/**
 * Sends an email using the Gmail API
 */
export async function sendGmailMessage(
  payload: EmailPayload,
  accessToken: string
): Promise<GmailSendResult> {
  const rfcMessage = buildRFC2822Message(payload);
  const rawBase64Url = toBase64Url(rfcMessage);

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: rawBase64Url,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to send email via Gmail (${res.status})`);
  }

  return await res.json();
}

/**
 * Creates a Gmail draft message
 */
export async function createGmailDraft(
  payload: EmailPayload,
  accessToken: string
): Promise<{ id: string; message: GmailSendResult }> {
  const rfcMessage = buildRFC2822Message(payload);
  const rawBase64Url = toBase64Url(rfcMessage);

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        raw: rawBase64Url,
      },
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to create Gmail draft (${res.status})`);
  }

  return await res.json();
}

/**
 * Helper to generate HTML email for an AV Quote Proposal
 */
export function generateQuoteEmailHtml(
  quoteNumber: string,
  eventName: string,
  clientName: string,
  totalAmount: number,
  venue: string,
  dates: string,
  companyName: string
): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #111; line-height: 1.5;">
      <div style="background: #171717; color: #f59e0b; padding: 18px 24px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">${companyName}</h2>
        <div style="font-size: 12px; color: #a3a3a3; margin-top: 4px;">Live Event Production & AV Systems</div>
      </div>
      <div style="border: 1px solid #e5e5e5; border-top: none; padding: 24px; border-radius: 0 0 8px 8px; background: #fafafa;">
        <p style="font-size: 15px;">Hello <strong>${clientName}</strong>,</p>
        <p style="font-size: 14px; color: #444;">
          Thank you for choosing ${companyName}. We have prepared the production quote proposal for <strong>${eventName}</strong>.
        </p>

        <div style="background: #ffffff; border: 1px solid #e5e5e5; border-radius: 6px; padding: 16px; margin: 20px 0;">
          <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #737373;">Quote Reference:</td>
              <td style="padding: 6px 0; font-weight: bold; text-align: right;">#${quoteNumber}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #737373;">Event / Show:</td>
              <td style="padding: 6px 0; font-weight: bold; text-align: right;">${eventName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #737373;">Venue Location:</td>
              <td style="padding: 6px 0; text-align: right;">${venue}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #737373;">Dates:</td>
              <td style="padding: 6px 0; text-align: right;">${dates}</td>
            </tr>
            <tr style="border-top: 1px solid #e5e5e5;">
              <td style="padding: 10px 0 0 0; font-weight: bold; font-size: 15px; color: #171717;">Proposal Total:</td>
              <td style="padding: 10px 0 0 0; font-weight: 900; font-size: 16px; color: #d97706; text-align: right;">$${totalAmount.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 13px; color: #525252;">
          Our audio, video, lighting, and engineering technicians will have the gear prepped and tested according to your specifications. Please review and let us know if you require any adjustments.
        </p>
        <p style="font-size: 13px; color: #737373; margin-top: 24px;">
          Best regards,<br />
          <strong>${companyName} Operations Team</strong>
        </p>
      </div>
    </div>
  `;
}

/**
 * Helper to generate HTML email for an Invoice Payment Request
 */
export function generateInvoiceEmailHtml(
  invoiceNumber: string,
  eventName: string,
  clientName: string,
  totalAmount: number,
  balanceDue: number,
  dueDate: string,
  companyName: string
): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #111; line-height: 1.5;">
      <div style="background: #171717; color: #10b981; padding: 18px 24px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; font-size: 20px; font-weight: 800;">${companyName} · Commercial Billing</h2>
        <div style="font-size: 12px; color: #a3a3a3; margin-top: 4px;">Invoice #${invoiceNumber}</div>
      </div>
      <div style="border: 1px solid #e5e5e5; border-top: none; padding: 24px; border-radius: 0 0 8px 8px; background: #fafafa;">
        <p style="font-size: 15px;">Dear <strong>${clientName}</strong>,</p>
        <p style="font-size: 14px; color: #444;">
          Please find attached the billing statement for production services rendered for <strong>${eventName}</strong>.
        </p>

        <div style="background: #ffffff; border: 1px solid #e5e5e5; border-radius: 6px; padding: 16px; margin: 20px 0;">
          <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #737373;">Invoice Number:</td>
              <td style="padding: 6px 0; font-weight: bold; text-align: right;">${invoiceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #737373;">Due Date:</td>
              <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #ef4444;">${dueDate}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #737373;">Invoice Subtotal:</td>
              <td style="padding: 6px 0; text-align: right;">$${totalAmount.toFixed(2)}</td>
            </tr>
            <tr style="border-top: 1px solid #e5e5e5;">
              <td style="padding: 10px 0 0 0; font-weight: bold; font-size: 15px;">Balance Due:</td>
              <td style="padding: 10px 0 0 0; font-weight: 900; font-size: 16px; color: #059669; text-align: right;">$${balanceDue.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 13px; color: #525252;">
          Payment can be remitted via ACH transfer, corporate card, or company check.
        </p>
        <p style="font-size: 13px; color: #737373; margin-top: 24px;">
          Best regards,<br />
          <strong>${companyName} Finance Department</strong>
        </p>
      </div>
    </div>
  `;
}

/**
 * Helper to generate HTML email for a Labor Shift Dispatch Call
 */
export function generateShiftCallEmailHtml(
  staffName: string,
  role: string,
  eventName: string,
  venue: string,
  date: string,
  startTime: string,
  endTime: string,
  notes: string,
  companyName: string
): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #111; line-height: 1.5;">
      <div style="background: #171717; color: #38bdf8; padding: 18px 24px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; font-size: 20px; font-weight: 800;">${companyName} · Crew Dispatch Call</h2>
        <div style="font-size: 12px; color: #a3a3a3; margin-top: 4px;">Crew Call for ${date}</div>
      </div>
      <div style="border: 1px solid #e5e5e5; border-top: none; padding: 24px; border-radius: 0 0 8px 8px; background: #fafafa;">
        <p style="font-size: 15px;">Hi <strong>${staffName}</strong>,</p>
        <p style="font-size: 14px; color: #444;">
          You have been dispatched for the following production call. Please confirm your receipt and arrival time.
        </p>

        <div style="background: #ffffff; border: 1px solid #e5e5e5; border-radius: 6px; padding: 16px; margin: 20px 0;">
          <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #737373;">Production / Show:</td>
              <td style="padding: 6px 0; font-weight: bold; text-align: right;">${eventName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #737373;">Dispatched Role:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #0284c7; text-align: right;">${role}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #737373;">Call Date:</td>
              <td style="padding: 6px 0; text-align: right;">${date}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #737373;">Call Time:</td>
              <td style="padding: 6px 0; font-weight: bold; text-align: right;">${startTime} - ${endTime}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #737373;">Venue Location:</td>
              <td style="padding: 6px 0; text-align: right;">${venue}</td>
            </tr>
          </table>
          ${
            notes
              ? `<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #eee; font-size: 12px; color: #555;"><strong>Call Notes:</strong> ${notes}</div>`
              : ''
          }
        </div>

        <p style="font-size: 13px; color: #525252;">
          Dress code: Show blacks, closed-toe steel-toe or work boots. Bring your standard tech kit and radio headset.
        </p>
        <p style="font-size: 13px; color: #737373; margin-top: 24px;">
          Best regards,<br />
          <strong>${companyName} Production Management</strong>
        </p>
      </div>
    </div>
  `;
}
