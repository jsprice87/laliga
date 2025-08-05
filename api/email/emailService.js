const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initialize();
  }

  initialize() {
    const emailConfig = {
      service: process.env.EMAIL_SERVICE || 'gmail',
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    };

    // For development, use a test account if no config is provided
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('⚠️ No email configuration found. Using development mode.');
      this.setupDevelopmentMode();
      return;
    }

    try {
      this.transporter = nodemailer.createTransport(emailConfig);
      this.isConfigured = true;
      console.log('✅ Email service configured successfully');
      
      // Verify connection
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('❌ Email service verification failed:', error);
          this.isConfigured = false;
        } else {
          console.log('✅ Email service is ready to send messages');
        }
      });
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      this.setupDevelopmentMode();
    }
  }

  async setupDevelopmentMode() {
    try {
      // Create a test account for development
      const testAccount = await nodemailer.createTestAccount();
      
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      
      this.isConfigured = true;
      console.log('🧪 Email service configured for development mode');
      console.log(`📧 Test email credentials: ${testAccount.user} / ${testAccount.pass}`);
      console.log('🔗 View sent emails at: https://ethereal.email/messages');
      
    } catch (error) {
      console.error('❌ Failed to setup development email mode:', error);
      this.isConfigured = false;
    }
  }

  async sendPasswordResetEmail(email, username, resetToken) {
    if (!this.isConfigured) {
      console.error('❌ Email service not configured. Cannot send email.');
      return {
        success: false,
        error: 'Email service not available',
        token: resetToken // Return token for development
      };
    }

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:8000'}/reset-password.html?token=${resetToken}`;
    
    const mailOptions = {
      from: {
        name: 'La Liga del Fuego',
        address: process.env.EMAIL_FROM || 'noreply@laligadelfuego.com'
      },
      to: email,
      subject: '🔐 Password Reset Request - La Liga del Fuego',
      html: this.generatePasswordResetEmailHTML(username, resetUrl),
      text: this.generatePasswordResetEmailText(username, resetUrl)
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Password reset email sent successfully');
      console.log('📧 Message ID:', result.messageId);
      
      // For development mode, provide preview URL
      if (nodemailer.getTestMessageUrl(result)) {
        const previewUrl = nodemailer.getTestMessageUrl(result);
        console.log('🔗 Preview email at:', previewUrl);
        
        return {
          success: true,
          messageId: result.messageId,
          previewUrl: previewUrl,
          message: 'Password reset email sent successfully'
        };
      }
      
      return {
        success: true,
        messageId: result.messageId,
        message: 'Password reset email sent successfully'
      };
      
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      return {
        success: false,
        error: error.message,
        token: resetToken // Return token as fallback
      };
    }
  }

  generatePasswordResetEmailHTML(username, resetUrl) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset - La Liga del Fuego</title>
    <style>
        body {
            font-family: 'Courier New', monospace;
            background-color: #000;
            color: #00ffff;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border: 2px solid #ff00ff;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 0 20px rgba(255, 0, 255, 0.3);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #ff00ff;
            text-shadow: 0 0 10px #ff00ff;
            margin-bottom: 10px;
        }
        .title {
            font-size: 18px;
            color: #00ffff;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .content {
            margin: 20px 0;
        }
        .greeting {
            font-size: 16px;
            margin-bottom: 20px;
        }
        .message {
            background: rgba(0, 255, 255, 0.1);
            border: 1px solid #00ffff;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .reset-button {
            display: block;
            width: 200px;
            margin: 30px auto;
            padding: 15px 30px;
            background: linear-gradient(45deg, #ff00ff, #00ffff);
            color: #000;
            text-decoration: none;
            font-weight: bold;
            font-family: 'Courier New', monospace;
            text-align: center;
            border-radius: 5px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .reset-button:hover {
            opacity: 0.8;
        }
        .warning {
            background: rgba(255, 255, 0, 0.1);
            border: 1px solid #ffff00;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            font-size: 14px;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #333;
            font-size: 12px;
            color: #888;
            text-align: center;
        }
        .link {
            color: #00ffff;
            word-break: break-all;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏆 LA LIGA DEL FUEGO 🏆</div>
            <div class="title">Password Reset Request</div>
        </div>
        
        <div class="content">
            <div class="greeting">
                Hello ${username || 'Fantasy Champion'},
            </div>
            
            <div class="message">
                We received a request to reset your password for your La Liga del Fuego account. 
                If you made this request, click the button below to reset your password.
            </div>
            
            <a href="${resetUrl}" class="reset-button">Reset Password</a>
            
            <div class="warning">
                ⚠️ <strong>Important Security Information:</strong><br>
                • This link will expire in 1 hour<br>
                • If you didn't request this reset, please ignore this email<br>
                • Never share this link with anyone<br>
                • The link can only be used once
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p class="link">${resetUrl}</p>
        </div>
        
        <div class="footer">
            This is an automated message from La Liga del Fuego.<br>
            If you have any questions, please contact your league administrator.
        </div>
    </div>
</body>
</html>
    `;
  }

  generatePasswordResetEmailText(username, resetUrl) {
    return `
🏆 LA LIGA DEL FUEGO - PASSWORD RESET REQUEST 🏆

Hello ${username || 'Fantasy Champion'},

We received a request to reset your password for your La Liga del Fuego account.

To reset your password, visit this link:
${resetUrl}

IMPORTANT SECURITY INFORMATION:
• This link will expire in 1 hour
• If you didn't request this reset, please ignore this email
• Never share this link with anyone
• The link can only be used once

If you have any questions, please contact your league administrator.

---
This is an automated message from La Liga del Fuego.
    `;
  }

  // Test email functionality
  async sendTestEmail(to = 'test@example.com') {
    if (!this.isConfigured) {
      return { success: false, error: 'Email service not configured' };
    }

    const mailOptions = {
      from: {
        name: 'La Liga del Fuego',
        address: process.env.EMAIL_FROM || 'noreply@laligadelfuego.com'
      },
      to: to,
      subject: '🧪 Test Email - La Liga del Fuego',
      html: '<h1>Test Email</h1><p>If you received this, the email service is working!</p>',
      text: 'Test Email - If you received this, the email service is working!'
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      return {
        success: true,
        messageId: result.messageId,
        previewUrl: nodemailer.getTestMessageUrl(result)
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Singleton instance
const emailService = new EmailService();
module.exports = emailService;