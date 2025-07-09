import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { QuizSession, Question, QuizResult } from './schema.js';
import OpenAI from 'openai';
import puppeteer from 'puppeteer';
import nodemailer from 'nodemailer';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ReportData {
  userName: string;
  companyName: string;
  email: string;
  aiEfficiencyScore: number;
  currentDate: string;
  efficiencyLevel: string;
  workflowDescription: string;
  adoptionLevel: string;
  challenges: string[];
  recommendations: Array<{
    department: string;
    suggestion: string;
    stars: string;
  }>;
  timeSaved: string;
  roiTimeline: string;
  logoPath: string;
}

class ReportService {
  constructor() {
    console.log('ReportService initialized');
  }

  public async generateAndSendReport(
    session: QuizSession,
    questions: Question[],
    result: QuizResult
  ): Promise<void> {
    console.log(`🚀 Starting report generation for ${session.userName} at ${session.email}`);
    console.log('📧 Email will be sent to:', session.email);
    
    // Generate report data
    const reportData = await this.generateReportData(session, questions, result);
    
    // Generate HTML content
    const htmlContent = this.generateHTML(reportData);
    
    console.log('Report data generated:', {
      user: reportData.userName,
      company: reportData.companyName,
      score: reportData.aiEfficiencyScore,
      level: reportData.efficiencyLevel,
      challengesCount: reportData.challenges.length,
      recommendationsCount: reportData.recommendations.length
    });
    
    try {
      // Generate PDF from HTML
      console.log('📄 Generating PDF...');
      const pdfBuffer = await this.generatePDF(htmlContent);
      console.log(`📄 PDF generated successfully, size: ${pdfBuffer.length} bytes`);
      
      // Send email with PDF attachment
      console.log('📧 Sending email...');
      await this.sendEmailWithPDF(reportData, pdfBuffer);
      
      console.log(`✅ Report successfully generated and sent to ${reportData.email}`);
    } catch (error) {
      console.error('❌ Error generating/sending report:', error);
      throw error;
    }
  }

  private async generateReportData(
    session: QuizSession,
    questions: Question[],
    result: QuizResult
  ): Promise<ReportData> {
    const answers = session.answers as Record<string, string>;
    
    // Get the absolute path to the logo - adapted for serverless
    const logoPath = path.resolve(process.cwd(), 'attached_assets/Spark AI Logo - Black.png');
    
    return {
      userName: session.userName || 'Valued Client',
      companyName: session.companyName || 'Your Company',
      email: session.email || '',
      aiEfficiencyScore: result.aiEfficiencyScore,
      currentDate: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      efficiencyLevel: this.getEfficiencyLevel(result.aiEfficiencyScore),
      workflowDescription: this.getWorkflowDescription(answers, questions),
      adoptionLevel: this.getAdoptionLevel(answers, questions),
      challenges: this.generateChallenges(answers, questions),
      recommendations: await this.generateRecommendations(answers, questions),
      timeSaved: this.calculateTimeSaved(result.aiEfficiencyScore),
      roiTimeline: this.calculateROITimeline(result.aiEfficiencyScore),
      logoPath: logoPath,
    };
  }

  private generateHTML(reportData: ReportData): string {
    // Use inline template for serverless compatibility
    const template = this.getInlineTemplate();
    
    // Convert logo to base64 for embedding in PDF
    let logoBase64 = '';
    console.log(`🖼️  Attempting to load logo from: ${reportData.logoPath}`);
    console.log(`🖼️  Logo file exists: ${fs.existsSync(reportData.logoPath)}`);
    
    try {
      if (fs.existsSync(reportData.logoPath)) {
        const logoBuffer = fs.readFileSync(reportData.logoPath);
        logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
        console.log(`✅ Logo loaded successfully, base64 length: ${logoBase64.length}`);
      } else {
        console.warn('❌ Logo file not found, trying alternative paths...');
        
        // Try alternative paths
        const altPaths = [
          path.resolve(process.cwd(), 'attached_assets/Spark AI Logo - Black.png'),
          path.resolve(process.cwd(), 'AIQuizApp/attached_assets/Spark AI Logo - Black.png'),
          path.resolve(process.cwd(), 'public/Spark AI Logo - Black.png')
        ];
        
        for (const altPath of altPaths) {
          console.log(`🔍 Trying alternative path: ${altPath}`);
          if (fs.existsSync(altPath)) {
            const logoBuffer = fs.readFileSync(altPath);
            logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
            console.log(`✅ Logo loaded from alternative path, base64 length: ${logoBase64.length}`);
            break;
          }
        }
      }
    } catch (error) {
      console.warn('❌ Could not load logo, using text fallback:', error);
    }
    
    // Replace placeholders in template
    let html = template;
    html = html.replace(/\{\{userName\}\}/g, reportData.userName);
    html = html.replace(/\{\{companyName\}\}/g, reportData.companyName);
    html = html.replace(/\{\{currentDate\}\}/g, reportData.currentDate);
    html = html.replace(/\{\{aiEfficiencyScore\}\}/g, reportData.aiEfficiencyScore.toString());
    html = html.replace(/\{\{efficiencyLevel\}\}/g, reportData.efficiencyLevel);
    html = html.replace(/\{\{workflowDescription\}\}/g, reportData.workflowDescription);
    html = html.replace(/\{\{adoptionLevel\}\}/g, reportData.adoptionLevel);
    html = html.replace(/\{\{timeSaved\}\}/g, reportData.timeSaved);
    html = html.replace(/\{\{roiTimeline\}\}/g, reportData.roiTimeline);
    
    // Replace logo placeholder with base64 if available
    if (logoBase64) {
      html = html.replace(/\{\{logoBase64\}\}/g, logoBase64);
    } else {
      // Fallback to text logo
      html = html.replace(
        /<img src="\{\{logoBase64\}\}" alt="SparkAI" \/>/g,
        '<span style="font-size: 24px; font-weight: 700; color: #6c63ff;">✨ SparkAI</span>'
      );
    }
    
    // Replace challenges list
    const challengesHTML = reportData.challenges
      .map(challenge => `<li>${challenge}</li>`)
      .join('\n                ');
    html = html.replace(
      /\{\{#each challenges\}\}\s*<li>\{\{this\}\}<\/li>\s*\{\{\/each\}\}/g,
      challengesHTML
    );
    
    // Replace recommendations table
    const recommendationsHTML = reportData.recommendations
      .map(rec => `
                    <tr>
                        <td>
                            <span class="department-badge">${rec.department}</span>
                        </td>
                        <td>${rec.suggestion}</td>
                        <td>
                            <span class="impact-stars">${rec.stars}</span>
                        </td>
                    </tr>`)
      .join('\n');
    html = html.replace(
      /\{\{#each recommendations\}\}[\s\S]*?\{\{\/each\}\}/g,
      recommendationsHTML
    );
    
    return html;
  }

  private getInlineTemplate(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #6c63ff;
        }
        .logo {
            margin-bottom: 20px;
        }
        .logo img {
            max-height: 60px;
        }
        h1 {
            color: #2c3e50;
            margin: 0;
            font-size: 28px;
        }
        .subtitle {
            color: #7f8c8d;
            margin-top: 10px;
            font-size: 16px;
        }
        .score-section {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            margin: 30px 0;
        }
        .score-number {
            font-size: 48px;
            font-weight: bold;
            margin: 10px 0;
        }
        .score-label {
            font-size: 18px;
            opacity: 0.9;
        }
        .section {
            margin: 30px 0;
        }
        .section h2 {
            color: #2c3e50;
            border-bottom: 2px solid #ecf0f1;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .recommendations-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .recommendations-table th,
        .recommendations-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ecf0f1;
        }
        .recommendations-table th {
            background-color: #f8f9fa;
            font-weight: 600;
            color: #2c3e50;
        }
        .department-badge {
            background-color: #6c63ff;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
        }
        .impact-stars {
            color: #f39c12;
            font-size: 16px;
        }
        .challenges-list {
            list-style: none;
            padding: 0;
        }
        .challenges-list li {
            background: #fff3cd;
            margin: 10px 0;
            padding: 15px;
            border-left: 4px solid #ffc107;
            border-radius: 4px;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ecf0f1;
            color: #7f8c8d;
        }
        .contact-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">
                <img src="{{logoBase64}}" alt="SparkAI" />
            </div>
            <h1>AI Efficiency Audit Report</h1>
            <div class="subtitle">Comprehensive Analysis for {{companyName}}</div>
            <div class="subtitle">Generated on {{currentDate}}</div>
        </div>

        <div class="score-section">
            <div class="score-label">Your AI Efficiency Score</div>
            <div class="score-number">{{aiEfficiencyScore}}/100</div>
            <div class="score-label">{{efficiencyLevel}}</div>
        </div>

        <div class="section">
            <h2>Executive Summary</h2>
            <p>Dear {{userName}},</p>
            <p>Based on our comprehensive AI audit assessment, {{companyName}} demonstrates {{adoptionLevel}} in AI adoption and implementation. {{workflowDescription}}</p>
            <p>This report provides actionable insights and recommendations to enhance your AI efficiency and maximize ROI.</p>
        </div>

        <div class="section">
            <h2>Key Challenges Identified</h2>
            <ul class="challenges-list">
                {{#each challenges}}
                <li>{{this}}</li>
                {{/each}}
            </ul>
        </div>

        <div class="section">
            <h2>Recommended Solutions</h2>
            <table class="recommendations-table">
                <thead>
                    <tr>
                        <th>Department</th>
                        <th>Recommendation</th>
                        <th>Impact</th>
                    </tr>
                </thead>
                <tbody>
                    {{#each recommendations}}
                    <tr>
                        <td>
                            <span class="department-badge">{{department}}</span>
                        </td>
                        <td>{{suggestion}}</td>
                        <td>
                            <span class="impact-stars">{{stars}}</span>
                        </td>
                    </tr>
                    {{/each}}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>Projected Benefits</h2>
            <div class="contact-info">
                <p><strong>Estimated Time Savings:</strong> {{timeSaved}} per week</p>
                <p><strong>ROI Timeline:</strong> {{roiTimeline}}</p>
                <p><strong>Next Steps:</strong> Schedule a consultation to discuss implementation strategy</p>
            </div>
        </div>

        <div class="footer">
            <p>This report was generated by SparkAI's proprietary assessment system.</p>
            <p>For questions or to schedule a consultation, contact us at info@sparkai.com</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private getEfficiencyLevel(score: number): string {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Moderate";
    return "Needs Improvement";
  }

  private getWorkflowDescription(answers: Record<string, string>, questions: Question[]): string {
    // Analyze answers to provide workflow description
    const adoptionAnswer = Object.entries(answers).find(([qId, answer]) => {
      const question = questions.find(q => q.id.toString() === qId);
      return question?.question.toLowerCase().includes('ai adoption');
    });
    
    if (adoptionAnswer) {
      const [, answer] = adoptionAnswer;
      if (answer.includes('Advanced')) return "Your organization shows advanced AI implementation across multiple departments.";
      if (answer.includes('Some integrated')) return "Your organization has begun integrating AI solutions but has room for expansion.";
      if (answer.includes('Basic')) return "Your organization is in the early stages of AI adoption with basic tools in use.";
    }
    
    return "Your organization has significant potential for AI implementation and optimization.";
  }

  private getAdoptionLevel(answers: Record<string, string>, questions: Question[]): string {
    // Analyze answers to determine adoption level
    const toolsAnswer = Object.entries(answers).find(([qId, answer]) => {
      const question = questions.find(q => q.id.toString() === qId);
      return question?.question.toLowerCase().includes('ai tools');
    });
    
    if (toolsAnswer) {
      const [, answer] = toolsAnswer;
      if (answer.includes('Advanced')) return "strong progress";
      if (answer.includes('Some')) return "moderate progress";
      if (answer.includes('Basic')) return "initial progress";
    }
    
    return "emerging potential";
  }

  private generateChallenges(answers: Record<string, string>, questions: Question[]): string[] {
    const challenges: string[] = [];
    
    // Analyze answers to identify challenges
    const challengeAnswer = Object.entries(answers).find(([qId, answer]) => {
      const question = questions.find(q => q.id.toString() === qId);
      return question?.question.toLowerCase().includes('challenge');
    });
    
    if (challengeAnswer) {
      const [, answer] = challengeAnswer;
      challenges.push(`Primary challenge: ${answer}`);
    }
    
    // Add generic challenges based on analysis
    challenges.push("Integration complexity with existing systems");
    challenges.push("Need for staff training and change management");
    challenges.push("Measuring ROI and success metrics");
    
    return challenges;
  }

  private async generateRecommendations(answers: Record<string, string>, questions: Question[]): Promise<Array<{
    department: string;
    suggestion: string;
    stars: string;
  }>> {
    try {
      return await this.generateAIRecommendations(answers, questions);
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      return this.generateDefaultRecommendations(answers, questions);
    }
  }

  private async generateAIRecommendations(answers: Record<string, string>, questions: Question[]): Promise<Array<{
    department: string;
    suggestion: string;
    stars: string;
  }>> {
    const prompt = `Based on the following survey responses, generate 4-5 specific AI implementation recommendations. 
    
    Survey Data:
    ${JSON.stringify(answers, null, 2)}
    
    Return recommendations in this exact JSON format:
    [
      {
        "department": "Department Name",
        "suggestion": "Specific actionable recommendation",
        "stars": "★★★★★"
      }
    ]
    
    Use 3-5 stars based on potential impact. Focus on practical, implementable solutions.`;
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an AI implementation consultant. Generate specific, actionable recommendations based on survey data."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 800,
      temperature: 0.7
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      try {
        // Clean up the content to handle markdown formatting
        let cleanContent = content.trim();
        
        // Remove markdown code blocks if present
        if (cleanContent.startsWith('```json')) {
          cleanContent = cleanContent.replace(/```json\s*/, '').replace(/```\s*$/, '');
        } else if (cleanContent.startsWith('```')) {
          cleanContent = cleanContent.replace(/```\s*/, '').replace(/```\s*$/, '');
        }
        
        const recommendations = JSON.parse(cleanContent);
        return Array.isArray(recommendations) ? recommendations : this.generateDefaultRecommendations(answers, questions);
      } catch (parseError) {
        console.error('Error parsing AI recommendations:', parseError);
        console.error('Raw content:', content);
        return this.generateDefaultRecommendations(answers, questions);
      }
    }

    return this.generateDefaultRecommendations(answers, questions);
  }

  private generateDefaultRecommendations(answers: Record<string, string>, questions: Question[]): Array<{
    department: string;
    suggestion: string;
    stars: string;
  }> {
    return [
      {
        department: "Operations",
        suggestion: "Implement AI-powered customer service chatbots to handle routine inquiries",
        stars: "★★★★★"
      },
      {
        department: "Marketing",
        suggestion: "Deploy AI content generation tools for social media and email campaigns",
        stars: "★★★★☆"
      },
      {
        department: "Sales",
        suggestion: "Integrate AI lead scoring and CRM automation for better conversion rates",
        stars: "★★★★☆"
      },
      {
        department: "HR",
        suggestion: "Automate resume screening and candidate matching with AI tools",
        stars: "★★★☆☆"
      },
      {
        department: "Finance",
        suggestion: "Implement AI-powered expense management and financial reporting",
        stars: "★★★☆☆"
      }
    ];
  }

  private calculateTimeSaved(score: number): string {
    if (score >= 80) return "15-20 hours";
    if (score >= 60) return "10-15 hours";
    if (score >= 40) return "5-10 hours";
    return "20-30 hours";
  }

  private calculateROITimeline(score: number): string {
    if (score >= 80) return "3-6 months";
    if (score >= 60) return "6-12 months";
    if (score >= 40) return "12-18 months";
    return "6-9 months";
  }

  private async generatePDF(htmlContent: string): Promise<Buffer> {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920x1080'
        ]
      });

      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      });

      return pdfBuffer;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  private async sendEmailWithPDF(reportData: ReportData, pdfBuffer: Buffer): Promise<void> {
    // Debug environment variables
    console.log('🔍 Email Environment Variables Check:');
    console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Missing');
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Set' : '❌ Missing');
    console.log('SMTP_HOST:', process.env.SMTP_HOST || 'smtp.hostinger.com');
    console.log('SMTP_PORT:', process.env.SMTP_PORT || '587');
    
    // Validate required environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Missing required email environment variables: EMAIL_USER and EMAIL_PASS');
    }
    
    // Determine email provider based on EMAIL_USER
    const isGmail = process.env.EMAIL_USER?.includes('@gmail.com');
    const isOutlook = process.env.EMAIL_USER?.includes('@outlook.com') || process.env.EMAIL_USER?.includes('@hotmail.com');
    
    let transporter: any;
    
    if (isGmail) {
      // Gmail configuration
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      console.log('📧 Using Gmail SMTP configuration');
    } else if (isOutlook) {
      // Outlook/Hotmail configuration
      transporter = nodemailer.createTransport({
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        tls: {
          ciphers: 'SSLv3',
          rejectUnauthorized: false
        }
      });
      console.log('📧 Using Outlook SMTP configuration');
    } else {
      // Hostinger or other SMTP configuration - Optimized for Vercel
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.hostinger.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false, // Use STARTTLS
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        tls: {
          rejectUnauthorized: false // Accept self-signed certificates
        },
        // Add these settings for Vercel/serverless compatibility
        connectionTimeout: 60000, // 60 seconds
        greetingTimeout: 30000,   // 30 seconds
        socketTimeout: 60000      // 60 seconds
      });
      console.log(`📧 Using SMTP configuration: ${process.env.SMTP_HOST || 'smtp.hostinger.com'}`);
    }

    // Verify SMTP connection before sending
    try {
      await transporter.verify();
      console.log('✅ SMTP connection verified successfully');
    } catch (verifyError) {
      console.error('❌ SMTP connection verification failed:', verifyError);
      throw new Error(`SMTP connection failed: ${verifyError}`);
    }

    const mailOptions = {
      from: {
        name: 'SparkAI Team',
        address: process.env.EMAIL_USER || 'contactus@sparkai.ae'
      },
      to: reportData.email,
      subject: this.getEmailSubject(reportData),
      html: this.generateEmailTemplate(reportData),
      attachments: [
        {
          filename: `AI-Audit-Report-${reportData.companyName.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().split('T')[0]}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    console.log(`📎 Email prepared with PDF attachment (${pdfBuffer.length} bytes)`);
    console.log(`📧 Sending to: ${reportData.email}`);
    console.log(`📧 From: ${process.env.EMAIL_USER}`);
    
    try {
      const result = await transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully with PDF attachment');
      console.log('📧 Message ID:', result.messageId);
    } catch (error: any) {
      console.error('❌ Email sending failed:', error);
      console.error('SMTP Configuration:', {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.EMAIL_USER,
        hasPass: !!process.env.EMAIL_PASS,
        isGmail,
        isOutlook
      });
      
      // Provide more specific error messages
      if (error.code === 'EAUTH') {
        throw new Error('Email authentication failed. Please check your EMAIL_USER and EMAIL_PASS credentials.');
      } else if (error.code === 'ECONNECTION') {
        throw new Error('Email connection failed. Please check your SMTP settings.');
      } else {
        throw new Error(`Email sending failed: ${error.message || 'Unknown error'}`);
      }
    }
  }

  private getEmailSubject(reportData: ReportData): string {
    return `Your AI Efficiency Report - ${reportData.aiEfficiencyScore}/100 Score | ${reportData.companyName}`;
  }

  private generateEmailTemplate(reportData: ReportData): string {
    return `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
        
        <!-- Header Section -->
        <div style="text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, #6c63ff, #8b5cf6); padding: 30px; border-radius: 15px; color: white;">
          <h1 style="font-size: 32px; margin-bottom: 10px; font-weight: 800;">🎉 Your AI Audit Report is Ready!</h1>
          <p style="font-size: 18px; opacity: 0.9; margin: 0;">Comprehensive Analysis & Strategic Recommendations</p>
        </div>
        
        <!-- Personal Greeting -->
        <div style="background: #f8fafc; padding: 30px; border-radius: 15px; margin-bottom: 25px; border-left: 5px solid #6c63ff;">
          <h2 style="color: #1a1a1a; font-size: 24px; margin-bottom: 15px;">Hello ${reportData.userName}! 👋</h2>
          <p style="color: #4b5563; line-height: 1.7; margin-bottom: 20px; font-size: 16px;">
            Thank you for taking the time to complete our comprehensive AI Audit assessment! 
          </p>
          <p style="color: #4b5563; line-height: 1.7; margin-bottom: 20px; font-size: 16px;">
            We've carefully analyzed your responses and prepared a detailed, personalized report specifically tailored for <strong style="color: #6c63ff;">${reportData.companyName}</strong>.
          </p>
          
          <!-- Score Highlight -->
          <div style="background: white; padding: 20px; border-radius: 10px; text-align: center; border: 2px solid #6c63ff; margin-top: 20px;">
            <p style="color: #374151; margin-bottom: 10px; font-weight: 600;">Your AI Readiness Score:</p>
            <div style="font-size: 36px; font-weight: 800; color: #6c63ff; margin-bottom: 5px;">${reportData.aiEfficiencyScore}%</div>
            <div style="background: #e6e6ff; color: #6c63ff; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: 600;">${reportData.efficiencyLevel} Level</div>
          </div>
        </div>

        <!-- Report Contents -->
        <div style="background: #ffffff; border: 2px solid #6c63ff; border-radius: 15px; padding: 30px; margin-bottom: 25px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h3 style="color: #6c63ff; font-size: 20px; margin-bottom: 20px; display: flex; align-items: center;">
            📎 Your Comprehensive Report Includes:
          </h3>
          <ul style="color: #4b5563; line-height: 2; padding-left: 20px; font-size: 15px;">
            <li><strong>Personalized AI readiness assessment</strong> based on your specific responses</li>
            <li><strong>Strategic recommendations</strong> tailored to your industry and business needs</li>
            <li><strong>ROI projections</strong> showing potential efficiency improvements</li>
            <li><strong>Specific tools and technologies</strong> recommendations for your business</li>
            <li><strong>Expert insights</strong> on AI adoption best practices</li>
          </ul>
        </div>

        <!-- Call to Action -->
        <div style="background: linear-gradient(135deg, #1a1a1a, #374151); padding: 30px; border-radius: 15px; text-align: center; margin-bottom: 25px;">
          <h3 style="color: #ffffff; font-size: 22px; margin-bottom: 15px;">Ready to Transform Your Business? 🚀</h3>
          <p style="color: #e5e7eb; margin-bottom: 25px; font-size: 16px; line-height: 1.6;">
            Our AI experts are ready to help you implement these recommendations and accelerate your business growth.
          </p>
          <a href="https://sparkai.ae/contact" style="background: #6c63ff; color: white; padding: 15px 30px; border-radius: 30px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(108, 99, 255, 0.3); transition: all 0.3s ease;">
            📅 Book Your FREE Strategy Call
          </a>
          <p style="color: #9ca3af; margin-top: 15px; font-size: 14px;">
            30-minute consultation • No obligation • Immediate insights
          </p>
        </div>

        <!-- Additional Value -->
        <div style="background: #f0f9ff; padding: 25px; border-radius: 12px; margin-bottom: 25px; border-left: 4px solid #0ea5e9;">
          <h4 style="color: #0c4a6e; font-size: 18px; margin-bottom: 15px;">💡 What Happens Next?</h4>
          <ol style="color: #374151; line-height: 1.8; padding-left: 20px;">
            <li><strong>Review your report</strong> - Take time to understand your AI readiness score and recommendations</li>
            <li><strong>Identify quick wins</strong> - Start with the high-impact, low-effort recommendations</li>
            <li><strong>Book a strategy call</strong> - Get personalized guidance from our AI implementation experts</li>
            <li><strong>Create your roadmap</strong> - Develop a step-by-step plan for AI adoption in your business</li>
          </ol>
        </div>

        <!-- Contact Information -->
        <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin-bottom: 25px;">
          <h4 style="color: #1a1a1a; font-size: 18px; margin-bottom: 15px;">Questions? We're Here to Help! 💬</h4>
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 15px;">
            If you have any questions about your report or want to discuss your AI implementation strategy, don't hesitate to reach out:
          </p>
          <div style="display: flex; flex-wrap: wrap; gap: 15px;">
            <div style="flex: 1; min-width: 200px;">
              <strong style="color: #6c63ff;">📧 Email:</strong><br>
              <a href="mailto:contactus@sparkai.ae" style="color: #4b5563; text-decoration: none;">contactus@sparkai.ae</a>
            </div>
            <div style="flex: 1; min-width: 200px;">
              <strong style="color: #6c63ff;">🌐 Website:</strong><br>
              <a href="https://sparkai.ae" style="color: #4b5563; text-decoration: none;">sparkai.ae</a>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="border-top: 2px solid #6c63ff; padding-top: 25px; text-align: center;">
          <div style="margin-bottom: 15px;">
            <strong style="color: #6c63ff; font-size: 18px;">SparkAI</strong>
            <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">Automation • Training • Development</p>
          </div>
          <p style="color: #9ca3af; font-size: 12px; line-height: 1.5;">
            This report was generated specifically for ${reportData.companyName} based on your assessment responses.<br>
            Please do not reply to this automated email. For support, contact us at contactus@sparkai.ae
          </p>
        </div>
      </div>
    `;
  }
}

export const reportService = new ReportService(); 
