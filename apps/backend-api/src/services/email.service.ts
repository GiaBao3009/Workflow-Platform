/**
 * Email Service
 * Gửi email qua SMTP (Gmail, Outlook, etc.)
 */

import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Cấu hình SMTP transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * Gửi email chung
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('⚠️ SMTP not configured. Email would be sent to:', options.to);
        console.log('📧 Subject:', options.subject);
        return false;
      }

      const info = await this.transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME || 'Workflow Platform'}" <${process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      console.log('✅ Email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Email send failed:', error);
      return false;
    }
  }

  /**
   * Gửi email reset password
   */
  async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/reset-password?token=${resetToken}`;

    const html = this.getPasswordResetTemplate(resetUrl, resetToken);

    return this.sendEmail({
      to: email,
      subject: '🔐 Đặt lại mật khẩu - Workflow Platform',
      html,
    });
  }

  /**
   * Template HTML cho email reset password
   */
  private getPasswordResetTemplate(resetUrl: string, token: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 16px;
            padding: 40px;
            text-align: center;
          }
          .content {
            background: white;
            border-radius: 12px;
            padding: 32px;
            margin-top: 20px;
          }
          .icon {
            font-size: 64px;
            margin-bottom: 20px;
          }
          h1 {
            color: white;
            margin: 0;
            font-size: 28px;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white !important;
            text-decoration: none !important;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 24px 0;
            transition: transform 0.2s;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          }
          .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
          }
          .token {
            background: #f7fafc;
            border: 2px dashed #cbd5e0;
            border-radius: 8px;
            padding: 12px;
            font-family: 'Courier New', monospace;
            font-size: 18px;
            font-weight: bold;
            color: #667eea;
            margin: 16px 0;
          }
          .warning {
            background: #fff5f5;
            border-left: 4px solid #fc8181;
            padding: 12px;
            margin: 20px 0;
            border-radius: 4px;
            text-align: left;
          }
          .footer {
            color: rgba(255, 255, 255, 0.8);
            font-size: 14px;
            margin-top: 24px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">🔐</div>
          <h1>Đặt lại mật khẩu</h1>
          
          <div class="content">
            <p style="font-size: 16px; color: #4a5568;">
              Xin chào! 👋
            </p>
            <p style="color: #718096;">
              Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản <strong>Workflow Platform</strong> của mình.
            </p>
            
            <a href="${resetUrl}" class="button">
              🔗 Đặt lại mật khẩu ngay
            </a>
            
            <p style="color: #a0aec0; font-size: 14px;">
              Hoặc sao chép mã reset này:
            </p>
            <div class="token">${token}</div>
            
            <div class="warning">
              <strong>⚠️ Lưu ý:</strong>
              <ul style="margin: 8px 0; padding-left: 20px;">
                <li>Link này chỉ có hiệu lực trong <strong>1 giờ</strong></li>
                <li>Nếu bạn không yêu cầu reset, vui lòng bỏ qua email này</li>
                <li>Không chia sẻ link này với bất kỳ ai</li>
              </ul>
            </div>
            
            <p style="color: #a0aec0; font-size: 14px; margin-top: 24px;">
              Nếu nút không hoạt động, sao chép link sau vào trình duyệt:<br>
              <code style="background: #edf2f7; padding: 4px 8px; border-radius: 4px; font-size: 12px; word-break: break-all;">
                ${resetUrl}
              </code>
            </p>
          </div>
          
          <div class="footer">
            <p>
              📧 Email tự động từ <strong>Workflow Platform</strong><br>
              Vui lòng không trả lời email này
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();
