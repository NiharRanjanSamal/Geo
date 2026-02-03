import { createTransport } from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const emailHost = process.env.EMAIL_HOST;
    const emailPort = process.env.EMAIL_PORT;
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;

    // Check if email is configured
    if (!emailHost || !emailUser || !emailPassword) {
      console.warn('⚠️  Email service not configured. Password reset emails will be logged to console instead.');
      this.isConfigured = false;
      return;
    }

    try {
      this.transporter = createTransport({
        host: emailHost,
        port: parseInt(emailPort || '587'),
        secure: emailPort === '465', // true for 465, false for other ports
        auth: {
          user: emailUser,
          pass: emailPassword,
        },
      });

      this.isConfigured = true;
      console.log('✅ Email service configured successfully');
    } catch (error) {
      console.error('❌ Failed to configure email service:', error);
      this.isConfigured = false;
    }
  }

  async sendPasswordResetEmail(to: string, resetToken: string, resetUrl: string): Promise<boolean> {
    const subject = 'Reset Your Password - GeoAttend';

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Reset Your Password</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0; padding:0; background-color:#f0fdf4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f0fdf4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px;">
          <!-- Card -->
          <tr>
            <td style="background-color:#ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.06), 0 2px 4px -2px rgba(0,0,0,0.06); overflow: hidden;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <!-- Header with brand -->
                <tr>
                  <td style="padding: 40px 40px 24px 40px; text-align: center;">
                    <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #059669 0%, #047857 100%); border-radius: 14px; margin: 0 auto 16px auto; line-height: 56px; font-size: 28px; font-weight: 700; color: #ffffff;">G</div>
                    <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #0f172a; letter-spacing: -0.02em;">Reset Your Password</h1>
                    <p style="margin: 8px 0 0 0; font-size: 15px; color: #64748b;">GeoAttend · Smart Attendance</p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding: 0 40px 32px 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #334155;">Hello,</p>
                    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #475569;">We received a request to reset your password. Click the button below — it will take you to a secure page to set a new password.</p>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                      <tr>
                        <td style="border-radius: 10px; background: linear-gradient(135deg, #059669 0%, #047857 100%);">
                          <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none;">Reset Password</a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 24px 0 0 0; font-size: 13px; color: #94a3b8;">Or copy this link into your browser:</p>
                    <p style="margin: 6px 0 0 0; font-size: 13px; word-break: break-all; color: #059669;">${resetUrl}</p>
                    <!-- Token (compact) -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 28px;">
                      <tr>
                        <td style="background-color: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; padding: 16px 20px;">
                          <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Reset code (if link doesn’t work)</p>
                          <p style="margin: 0; font-size: 14px; font-family: 'SF Mono', 'Monaco', 'Consolas', monospace; color: #0f172a; letter-spacing: 0.5px; word-break: break-all;">${resetToken}</p>
                          <p style="margin: 10px 0 0 0; font-size: 12px; color: #94a3b8;">Valid for 30 minutes</p>
                        </td>
                      </tr>
                    </table>
                    <!-- Security note -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 24px;">
                      <tr>
                        <td style="background-color: #fffbeb; border-radius: 10px; border-left: 4px solid #f59e0b; padding: 14px 18px;">
                          <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #92400e;"><strong>Security:</strong> If you didn’t request this, ignore this email. Your password won’t change.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding: 24px 40px 32px 40px; border-top: 1px solid #f1f5f9;">
                    <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">This is an automated message from GeoAttend.</p>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #cbd5e1; text-align: center;">© 2026 GeoAttend · Smart Attendance, Simplified</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const text = `
Reset Your Password - GeoAttend

Hello,

We received a request to reset your password. Click the link below (or copy it into your browser):

${resetUrl}

Reset code (if link doesn't work): ${resetToken}
Valid for 30 minutes.

If you didn't request this, ignore this email — your password will not change.

— GeoAttend Team
    `;

    return this.sendEmail({
      to,
      subject,
      html,
      text,
    });
  }

  private async sendEmail(options: EmailOptions): Promise<boolean> {
    // If email is not configured, log to console instead
    if (!this.isConfigured || !this.transporter) {
      console.log('='.repeat(70));
      console.log('📧 EMAIL (Not Sent - Email Service Not Configured)');
      console.log('='.repeat(70));
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Text:\n${options.text || 'See HTML version'}`);
      console.log('='.repeat(70));
      console.log('To enable email sending, configure EMAIL_* variables in .env file.');
      console.log('='.repeat(70));
      return false;
    }

    try {
      const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
      
      await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      console.log(`✅ Email sent successfully to ${options.to}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      
      // Fall back to console logging
      console.log('='.repeat(70));
      console.log('📧 EMAIL (Failed to Send - Logged for Reference)');
      console.log('='.repeat(70));
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Text:\n${options.text || 'See HTML version'}`);
      console.log('='.repeat(70));
      
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
