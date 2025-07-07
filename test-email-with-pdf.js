import nodemailer from 'nodemailer';
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';

dotenv.config();

async function testEmailWithPDF() {
  console.log('🧪 Testing Email with PDF Attachment...\n');

  // Check environment variables
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('❌ Missing email configuration. Please check your .env file.');
    return;
  }

  try {
    // 1. Generate a test PDF
    console.log('📄 Generating test PDF...');
    const testHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { color: #6c63ff; font-size: 24px; margin-bottom: 20px; }
          .content { line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="header">📧 Email PDF Attachment Test</div>
        <div class="content">
          <h2>Test AI Audit Report</h2>
          <p>This is a test PDF attachment to verify email functionality.</p>
          <p>Company: Test Company</p>
          <p>AI Readiness Score: 85%</p>
          <p>Generated at: ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(testHTML, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0.5in', bottom: '0.5in', left: '0.5in', right: '0.5in' }
    });

    await browser.close();
    console.log(`✅ PDF generated successfully! Size: ${pdfBuffer.length} bytes`);

    // 2. Configure email transporter
    console.log('📧 Configuring email transporter...');
    const isGmail = process.env.EMAIL_USER?.includes('@gmail.com');
    
    let transporter;
    
    if (isGmail) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      console.log('✅ Using Gmail SMTP configuration');
    } else {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.hostinger.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        tls: { rejectUnauthorized: false }
      });
      console.log(`✅ Using SMTP: ${process.env.SMTP_HOST || 'smtp.hostinger.com'}`);
    }

    // 3. Send test email with PDF attachment
    console.log('📮 Sending test email with PDF attachment...');
    const mailOptions = {
      from: {
        name: 'SparkAI Test',
        address: process.env.EMAIL_USER
      },
      to: process.env.EMAIL_USER, // Send to yourself
      subject: '🧪 PDF Attachment Test - SparkAI',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #6c63ff;">📧 Email with PDF Attachment Test</h2>
          <p>This is a test email to verify that PDF attachments are working correctly.</p>
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Test Details:</h3>
            <ul>
              <li><strong>PDF Size:</strong> ${pdfBuffer.length} bytes</li>
              <li><strong>Email Provider:</strong> ${isGmail ? 'Gmail' : 'SMTP'}</li>
              <li><strong>Attachment Name:</strong> AI-Audit-Report-Test-${new Date().toISOString().split('T')[0]}.pdf</li>
            </ul>
          </div>
          <p><strong>✅ If you can see the attached PDF, the email system is working correctly!</strong></p>
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            This is a test email from SparkAI Quiz Application
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `AI-Audit-Report-Test-${new Date().toISOString().split('T')[0]}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully!');
    console.log(`📬 Check your inbox: ${process.env.EMAIL_USER}`);
    console.log('📎 Look for the PDF attachment in the email');

    console.log('\n🎉 Email with PDF attachment test completed successfully!');
    console.log('If you received the email with the PDF attachment, your system is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    
    if (error.code === 'EAUTH') {
      console.log('\n💡 Authentication failed. Common fixes:');
      console.log('   - For Gmail: Use App Password, not regular password');
      console.log('   - Verify EMAIL_USER and EMAIL_PASS in .env file');
    }
  }
}

// Run the test
testEmailWithPDF().catch(console.error); 