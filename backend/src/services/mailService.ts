import { env } from '../config/env.js';

type SendMailInput = {
  to: string;
  subject: string;
  text: string;
};

/** Send transactional email via Resend when configured; otherwise log to console (dev). */
export async function sendMail(input: SendMailInput): Promise<void> {
  if (env.resendApiKey) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.mailFrom,
        to: [input.to],
        subject: input.subject,
        text: input.text,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error('[mail] Resend failed:', response.status, detail);
      throw new Error('Could not send password reset email.');
    }
    return;
  }

  console.info('[mail] Email delivery not configured (set RESEND_API_KEY). Message logged below:');
  console.info(`To: ${input.to}`);
  console.info(`Subject: ${input.subject}`);
  console.info(input.text);
}
