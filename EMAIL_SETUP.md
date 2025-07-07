# Email Setup for PDF Report Delivery

## Overview
The AI Audit Quiz now automatically generates PDF reports and sends them to users' email addresses. This requires email configuration.

## Required Environment Variables

Add these variables to your `.env` file:

### Hostinger Email Configuration (Primary - contactus@sparkai.ae)
```env
EMAIL_USER=contactus@sparkai.ae
EMAIL_PASS=your_email_password
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
```

**Hostinger SMTP Settings:**
- **SMTP Server:** smtp.hostinger.com
- **Port:** 587 (STARTTLS) or 465 (SSL)
- **Security:** STARTTLS or SSL/TLS
- **Authentication:** Required
- **Username:** Full email address (contactus@sparkai.ae)
- **Password:** Your email account password

### Alternative: Gmail Configuration (For Testing)
```env
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_gmail_app_password
```

**To get Gmail App Password:**
1. Enable 2-Factor Authentication on your Gmail account
2. Go to Google Account Settings > Security > App Passwords
3. Generate a new app password for "Mail"
4. Use this 16-character password (not your regular Gmail password)

Then uncomment the Gmail configuration section in `server/reportService.ts`

## How It Works

1. **User completes quiz** → Provides email address
2. **OpenAI processes responses** → Generates personalized recommendations
3. **System generates PDF** → Uses Puppeteer to create professional PDF report
4. **Email sent automatically** → PDF attached to professional email

## Email Features

- **Professional HTML email** with SparkAI branding
- **PDF attachment** with personalized report
- **Branded filename** (e.g., `AI-Audit-Report-TechCorp_Solutions-2024-05-27.pdf`)
- **Call-to-action** linking to SparkAI.ae

## Testing

To test email functionality:
1. Set up environment variables
2. Complete a quiz with a valid email address
3. Check the email inbox for the report

## Troubleshooting

- **Gmail not working?** Ensure 2FA is enabled and you're using an app password
- **SMTP errors?** Check your SMTP provider's documentation for correct settings
- **PDF generation fails?** Ensure Puppeteer dependencies are installed correctly

## Production Recommendations

- Use a dedicated email service (SendGrid, Mailgun, etc.)
- Set up proper SPF/DKIM records for deliverability
- Monitor email delivery rates and bounces 