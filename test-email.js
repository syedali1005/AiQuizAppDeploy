import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Simple email test script to verify your email configuration
 * Run this with: node test-email.js
 */

async function testEmailConfiguration() {
  console.log('🧪 Testing Email Configuration...\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`EMAIL_USER: ${process.env.EMAIL_USER ? '✅ Set' : '❌ Missing'}`);
  console.log(`EMAIL_PASS: ${process.env.EMAIL_PASS ? '✅ Set' : '❌ Missing'}`);
  console.log(`SMTP_HOST: ${process.env.SMTP_HOST || 'smtp.hostinger.com'}`);
  console.log(`SMTP_PORT: ${process.env.SMTP_PORT || '587'}`);
  console.log(`OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}\n`);

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('❌ Missing required email configuration. Please check your .env file.');
    return;
  }

  // Create transporter
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // Use STARTTLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    // Test connection
    console.log('🔌 Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');

    // Send test email
    console.log('📧 Sending test email...');
    const testEmail = {
      from: {
        name: 'SparkAI Test',
        address: process.env.EMAIL_USER
      },
      to: process.env.EMAIL_USER, // Send to yourself for testing
      subject: '🧪 SparkAI Email Test - Configuration Working!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #6c63ff;">✅ Email Configuration Test Successful!</h2>
          <p>If you're reading this, your email configuration is working correctly.</p>
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Configuration Details:</h3>
            <ul>
              <li><strong>Email:</strong> ${process.env.EMAIL_USER}</li>
              <li><strong>SMTP Host:</strong> ${process.env.SMTP_HOST || 'smtp.hostinger.com'}</li>
              <li><strong>SMTP Port:</strong> ${process.env.SMTP_PORT || '587'}</li>
              <li><strong>OpenAI API:</strong> ${process.env.OPENAI_API_KEY ? 'Configured' : 'Not configured'}</li>
            </ul>
          </div>
          <p style="color: #666;">
            <strong>Next Steps:</strong><br>
            1. Run your quiz application with <code>npm run dev</code><br>
            2. Complete a quiz to test the full PDF report generation<br>
            3. Check that the AI Audit Report email is received
          </p>
          <hr style="margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            This is a test email from SparkAI Quiz Application
          </p>
        </div>
      `
    };

    await transporter.sendMail(testEmail);
    console.log('✅ Test email sent successfully!');
    console.log(`📬 Check your inbox: ${process.env.EMAIL_USER}\n`);

    console.log('🎉 Email configuration is working correctly!');
    console.log('You can now run your quiz application with: npm run dev');

  } catch (error) {
    console.log('❌ Email test failed:');
    console.error(error.message);
    
    // Provide specific troubleshooting tips
    if (error.code === 'EAUTH') {
      console.log('\n💡 Authentication failed. Common fixes:');
      console.log('   - For Gmail: Use App Password, not regular password');
      console.log('   - For Hostinger: Check your email password is correct');
      console.log('   - Verify EMAIL_USER and EMAIL_PASS in .env file');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n💡 Connection failed. Common fixes:');
      console.log('   - Check SMTP_HOST and SMTP_PORT settings');
      console.log('   - Verify internet connection');
      console.log('   - Check if firewall is blocking the connection');
    }
  }
}

// Run the test
testEmailConfiguration().catch(console.error); 