"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOTPEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const sendOTPEmail = async (email, otp) => {
    // Create transporter inside the function to ensure fresh environment variables
    const transporter = nodemailer_1.default.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            ciphers: 'SSLv3'
        }
    });
    // Always log OTP to console for development
    console.log(`\n🔐 OTP for ${email}: ${otp}\n`);
    // Debug environment variables
    console.log('🔧 Debug - EMAIL_USER:', process.env.EMAIL_USER);
    console.log('🔧 Debug - EMAIL_PASS:', process.env.EMAIL_PASS ? '***SET***' : 'NOT SET');
    console.log('🔧 Debug - EMAIL_PASS length:', process.env.EMAIL_PASS?.length);
    console.log('🔧 Debug - EMAIL_PASS first 4 chars:', process.env.EMAIL_PASS?.substring(0, 4));
    // Check if email is properly configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS ||
        process.env.EMAIL_USER === 'your-email@gmail.com' ||
        process.env.EMAIL_PASS === 'your-app-password' ||
        process.env.EMAIL_USER.includes('your-email') ||
        process.env.EMAIL_PASS.includes('your-app')) {
        console.log('⚠️  Gmail not configured. Please set up your Gmail credentials in .env file');
        console.log('📧 OTP is logged above for testing purposes');
        return true; // Return true so registration doesn't fail
    }
    // Test the transporter connection first
    try {
        console.log('🔧 Testing SMTP connection...');
        await transporter.verify();
        console.log('✅ SMTP connection verified successfully');
    }
    catch (error) {
        console.error('❌ SMTP connection failed:', error);
        console.log('🔧 Debug - Full error details:', {
            message: error.message,
            code: error.code,
            command: error.command
        });
        console.log(`🔐 OTP for ${email}: ${otp} (SMTP connection failed, but OTP is logged above)`);
        return true; // Return true so registration doesn't fail
    }
    const mailOptions = {
        from: `"Highway Notes" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🔐 Your OTP for Highway Notes',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3B82F6; margin: 0;">Highway Notes</h1>
          <p style="color: #6B7280; margin: 5px 0;">Your secure note-taking app</p>
        </div>
        
        <div style="background-color: #F8FAFC; border: 1px solid #E5E7EB; border-radius: 8px; padding: 30px; text-align: center; margin: 20px 0;">
          <h2 style="color: #1F2937; margin: 0 0 10px 0;">Your Verification Code</h2>
          <div style="background-color: #3B82F6; color: white; font-size: 32px; font-weight: bold; padding: 15px; border-radius: 8px; margin: 15px 0; letter-spacing: 3px;">
            ${otp}
          </div>
          <p style="color: #6B7280; margin: 0; font-size: 14px;">This code will expire in 10 minutes</p>
        </div>
        
        <div style="background-color: #FEF3C7; border: 1px solid #F59E0B; border-radius: 6px; padding: 15px; margin: 20px 0;">
          <p style="color: #92400E; margin: 0; font-size: 14px;">
            <strong>Security Notice:</strong> If you didn't request this OTP, please ignore this email and consider changing your password.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
          <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
            This email was sent by Highway Notes. Please do not reply to this email.
          </p>
        </div>
      </div>
    `
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ OTP email sent to ${email}`);
        return true;
    }
    catch (error) {
        console.error('❌ Email sending error:', error);
        console.log(`🔐 OTP for ${email}: ${otp} (Email failed, but OTP is logged above)`);
        return true; // Return true so registration doesn't fail
    }
};
exports.sendOTPEmail = sendOTPEmail;
//# sourceMappingURL=email.js.map