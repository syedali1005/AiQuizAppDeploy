# Testing Setup Guide for AI Audit Quiz

## 🚀 Quick Setup Steps

### 1. Create Environment File
Create a `.env` file in the root directory (`FINAL_VERSION_QUIZ_V2/.env`) with the following content:

```env
# Email Configuration
# Choose ONE of the following email configurations:

# Option 1: Hostinger Email (Primary - for contactus@sparkai.ae)
EMAIL_USER=contactus@sparkai.ae
EMAIL_PASS=your_hostinger_email_password
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587

# Option 2: Gmail (For Testing - Recommended for initial testing)
# EMAIL_USER=your_gmail@gmail.com
# EMAIL_PASS=your_gmail_app_password
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587

# Option 3: Other Email Providers
# EMAIL_USER=your_email@domain.com
# EMAIL_PASS=your_email_password
# SMTP_HOST=your_smtp_server
# SMTP_PORT=587

# OpenAI Configuration (for AI-powered recommendations)
OPENAI_API_KEY=your_openai_api_key_here

# Application Configuration
NODE_ENV=development
PORT=3000
```

### 2. Email Setup Options

#### Option A: Gmail (Easiest for Testing)
1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password:**
   - Go to Google Account Settings > Security > App Passwords
   - Select "Mail" as the app
   - Copy the 16-character password
3. **Update .env file:**
   ```env
   EMAIL_USER=your_gmail@gmail.com
   EMAIL_PASS=your_16_character_app_password
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   ```

#### Option B: Hostinger (Production)
1. **Get email credentials** from your Hostinger account
2. **Update .env file:**
   ```env
   EMAIL_USER=contactus@sparkai.ae
   EMAIL_PASS=your_hostinger_password
   SMTP_HOST=smtp.hostinger.com
   SMTP_PORT=587
   ```

### 3. OpenAI API Key Setup
1. **Get OpenAI API Key:**
   - Go to https://platform.openai.com/api-keys
   - Create a new API key
   - Copy the key (starts with `sk-`)
2. **Update .env file:**
   ```env
   OPENAI_API_KEY=sk-your_actual_api_key_here
   ```

### 4. Install Dependencies
```bash
npm install
```

### 5. Test the Application

#### Start the Server
```bash
npm run dev
```

#### Test Email Functionality
1. **Open the app** in your browser (usually `http://localhost:3000`)
2. **Complete the quiz** with a valid email address
3. **Check your email** for the AI Audit Report

## 🧪 Testing Checklist

- [ ] `.env` file created with correct variables
- [ ] Email credentials configured (Gmail or Hostinger)
- [ ] OpenAI API key added
- [ ] Dependencies installed (`npm install`)
- [ ] Server starts successfully (`npm run dev`)
- [ ] Quiz completes without errors
- [ ] Email received with PDF attachment
- [ ] PDF opens and displays correctly

## 🔧 Troubleshooting

### Email Issues
- **Gmail not working?** Ensure 2FA is enabled and you're using an app password (not your regular password)
- **SMTP errors?** Check your email provider's SMTP settings
- **Email not received?** Check spam folder and verify email address

### OpenAI Issues
- **API key invalid?** Verify the key starts with `sk-` and is active
- **Rate limits?** Check your OpenAI usage limits
- **No recommendations?** The system will fall back to default recommendations

### PDF Generation Issues
- **PDF not generated?** Ensure Puppeteer dependencies are installed
- **Styling issues?** Check that the HTML template is loading correctly

## 📧 Test Email Addresses
For testing, you can use:
- Your personal Gmail account
- A test email service like Mailtrap.io
- Your actual business email

## 🚀 Production Deployment
When ready for production:
1. Use the Hostinger email configuration
2. Set `NODE_ENV=production`
3. Configure proper domain and SSL
4. Set up email monitoring and analytics

## 📞 Support
If you encounter issues:
1. Check the console for error messages
2. Verify all environment variables are set
3. Test email settings with a simple email first
4. Check OpenAI API key permissions and credits 