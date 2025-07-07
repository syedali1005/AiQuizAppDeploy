import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { QuizSession, Question, QuizResult } from '@shared/schema';
import OpenAI from 'openai';
import puppeteer from 'puppeteer';
import nodemailer from 'nodemailer';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    console.log(`Generating report for ${session.userName} at ${session.email}`);
    
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
    
    // Get the absolute path to the logo
    const logoPath = path.resolve(__dirname, '../attached_assets/Spark AI Logo - Black.png');
    
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
    const templatePath = path.resolve(__dirname, 'templates/report-template.html');
    let template = fs.readFileSync(templatePath, 'utf8');
    
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
          path.resolve(__dirname, '../attached_assets/Spark AI Logo - Black.png'),
          path.resolve(process.cwd(), 'attached_assets/Spark AI Logo - Black.png'),
          path.resolve(process.cwd(), 'FINAL_VERSION_QUIZ_V2/attached_assets/Spark AI Logo - Black.png')
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
    template = template.replace(/\{\{userName\}\}/g, reportData.userName);
    template = template.replace(/\{\{companyName\}\}/g, reportData.companyName);
    template = template.replace(/\{\{currentDate\}\}/g, reportData.currentDate);
    template = template.replace(/\{\{aiEfficiencyScore\}\}/g, reportData.aiEfficiencyScore.toString());
    template = template.replace(/\{\{efficiencyLevel\}\}/g, reportData.efficiencyLevel);
    template = template.replace(/\{\{workflowDescription\}\}/g, reportData.workflowDescription);
    template = template.replace(/\{\{adoptionLevel\}\}/g, reportData.adoptionLevel);
    template = template.replace(/\{\{timeSaved\}\}/g, reportData.timeSaved);
    template = template.replace(/\{\{roiTimeline\}\}/g, reportData.roiTimeline);
    
    // Replace logo placeholder with base64 if available
    if (logoBase64) {
      console.log('🔄 Replacing logo placeholder with base64 data...');
      const beforeReplace = template.includes('{{logoBase64}}');
      console.log(`🔍 Template contains logo placeholder: ${beforeReplace}`);
      
      template = template.replace(/\{\{logoBase64\}\}/g, logoBase64);
      
      const afterReplace = template.includes('data:image/png;base64,');
      console.log(`✅ Logo replaced with base64: ${afterReplace}`);
    } else {
      console.log('⚠️  No logo base64 data, using text fallback...');
      // Fallback to text logo
      template = template.replace(
        /<img src="\{\{logoBase64\}\}" alt="SparkAI" \/>/g,
        '<span style="font-size: 24px; font-weight: 700; color: #6c63ff;">✨ SparkAI</span>'
      );
    }
    
    // Replace challenges list
    const challengesHTML = reportData.challenges
      .map(challenge => `<li>${challenge}</li>`)
      .join('\n                ');
    template = template.replace(
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
    template = template.replace(
      /\{\{#each recommendations\}\}\s*<tr>[\s\S]*?<\/tr>\s*\{\{\/each\}\}/g,
      recommendationsHTML
    );
    
    return template;
  }

  private getEfficiencyLevel(score: number): string {
    if (score >= 71) return 'AI-Savvy';
    if (score >= 31) return 'Adopter';
    return 'Explorer';
  }

  private getWorkflowDescription(answers: Record<string, string>, questions: Question[]): string {
    const aiExperienceQ = questions.find(q => 
      q.question.includes('AI tools or automation systems')
    );
    
    if (aiExperienceQ) {
      const answer = answers[aiExperienceQ.id.toString()];
      if (answer?.includes('extensively')) return 'highly automated';
      if (answer?.includes('basic tools')) return 'partially automated';
      if (answer?.includes('not interested')) return 'fully manual';
    }
    
    return 'predominantly manual';
  }

  private getAdoptionLevel(answers: Record<string, string>, questions: Question[]): string {
    const aiExperienceQ = questions.find(q => 
      q.question.includes('AI tools or automation systems')
    );
    
    if (aiExperienceQ) {
      const answer = answers[aiExperienceQ.id.toString()];
      if (answer?.includes('extensively')) return 'advanced';
      if (answer?.includes('basic tools')) return 'moderate';
      if (answer?.includes('interested')) return 'minimal but growing';
    }
    
    return 'minimal';
  }

  private generateChallenges(answers: Record<string, string>, questions: Question[]): string[] {
    const challenges: string[] = [];
    
    // Check for repetitive tasks
    const tasksQuestion = questions.find(q => 
      q.question.includes('repetitive or time-consuming tasks')
    );
    if (tasksQuestion && answers[tasksQuestion.id.toString()]) {
      challenges.push('Manual handling of repetitive tasks consuming significant time');
    }
    
    // Check for CRM/lead management issues
    const salesQuestions = questions.filter(q => 
      q.category === 'Sales Department'
    );
    if (salesQuestions.length > 0) {
      const manualCRM = salesQuestions.some(q => {
        const answer = answers[q.id.toString()];
        return answer?.includes('manual') || answer?.includes('spreadsheet');
      });
      if (manualCRM) {
        challenges.push('Manual CRM & Lead Tracking processes');
      }
    }
    
    // Add default challenges if none found
    if (challenges.length === 0) {
      challenges.push('Limited automation in daily operations');
      challenges.push('Potential for AI-driven efficiency improvements');
      challenges.push('Manual processes that could benefit from smart automation');
    }
    
    return challenges.slice(0, 5);
  }

  private async generateRecommendations(answers: Record<string, string>, questions: Question[]): Promise<Array<{
    department: string;
    suggestion: string;
    stars: string;
  }>> {
    try {
      // Try to generate AI-powered recommendations
      return await this.generateAIRecommendations(answers, questions);
    } catch (error) {
      console.error('Error generating AI recommendations, falling back to default:', error);
      return this.generateDefaultRecommendations(answers, questions);
    }
  }

  private async generateAIRecommendations(answers: Record<string, string>, questions: Question[]): Promise<Array<{
    department: string;
    suggestion: string;
    stars: string;
  }>> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not available');
    }

    const assessmentData = questions.map(q => ({
      question: q.question,
      answer: answers[q.id.toString()] || "No answer provided",
      category: q.category
    }));

    const prompt = `Based on these AI audit survey responses, generate 3-4 specific, actionable recommendations for AI implementation. Each recommendation should include:
1. Department/Area name
2. Specific suggestion with tools/technologies
3. Impact rating (use ★★★★★ for high impact, ★★★★☆ for medium, ★★★☆☆ for low)

Survey Data:
${JSON.stringify(assessmentData, null, 2)}

Format your response as a JSON array with objects containing: department, suggestion, stars
Focus on practical, implementable solutions that match the user's current AI maturity level.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an AI implementation consultant. Generate practical, specific recommendations based on survey responses. Respond only with valid JSON."
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
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    // Clean and parse the JSON response
    let cleanContent = content.trim();
    
    // Remove markdown code blocks if present
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/```\s*/, '').replace(/\s*```$/, '');
    }
    
    const recommendations = JSON.parse(cleanContent);
    
    // Validate the structure
    if (!Array.isArray(recommendations)) {
      throw new Error('Invalid response format');
    }

    return recommendations.map(rec => ({
      department: rec.department || 'General',
      suggestion: rec.suggestion || 'AI implementation recommendation',
      stars: rec.stars || '★★★★☆'
    }));
  }

  private generateDefaultRecommendations(answers: Record<string, string>, questions: Question[]): Array<{
    department: string;
    suggestion: string;
    stars: string;
  }> {
    const recommendations: Array<{
      department: string;
      suggestion: string;
      stars: string;
    }> = [];
    
    // Generate recommendations based on selected departments
    const departmentQ = questions.find(q => 
      q.question.includes('department(s) would benefit most')
    );
    
    let selectedDepartments: string[] = [];
    if (departmentQ) {
      const answer = answers[departmentQ.id.toString()];
      if (answer) {
        try {
          selectedDepartments = answer.startsWith('[') ? JSON.parse(answer) : [answer];
        } catch {
          selectedDepartments = [answer];
        }
      }
    }
    
    // Sales recommendations
    if (selectedDepartments.some(d => d.includes('Sales'))) {
      recommendations.push({
        department: 'Sales',
        suggestion: 'Implement CRM automation with HubSpot + Zapier for lead scoring and follow-up sequences',
        stars: '★★★★★'
      });
    }
    
    // Customer Support recommendations
    if (selectedDepartments.some(d => d.includes('Customer Support'))) {
      recommendations.push({
        department: 'Customer Support',
        suggestion: 'Deploy AI chatbot for FAQ handling using Intercom or Zendesk AI',
        stars: '★★★★★'
      });
    }

    // Marketing recommendations
    if (selectedDepartments.some(d => d.includes('Marketing'))) {
      recommendations.push({
        department: 'Marketing',
        suggestion: 'Automate content creation and social media scheduling with Buffer + ChatGPT',
        stars: '★★★★☆'
      });
    }

    // HR recommendations  
    if (selectedDepartments.some(d => d.includes('HR'))) {
      recommendations.push({
        department: 'HR',
        suggestion: 'Streamline recruitment with AI-powered candidate screening tools',
        stars: '★★★★☆'
      });
    }

    // Finance recommendations
    if (selectedDepartments.some(d => d.includes('Finance'))) {
      recommendations.push({
        department: 'Finance',
        suggestion: 'Automate invoice processing and reconciliation with AI-powered tools',
        stars: '★★★★★'
      });
    }
    
    // Add default recommendations if none found
    if (recommendations.length === 0) {
      recommendations.push({
        department: 'Data Management',
        suggestion: 'Implement automated data validation and cleaning processes using AI',
        stars: '★★★★★'
      });
      recommendations.push({
        department: 'Process Automation',
        suggestion: 'Deploy AI-powered workflow automation for routine tasks',
        stars: '★★★★☆'
      });
      recommendations.push({
        department: 'Customer Service',
        suggestion: 'Integrate AI chatbots for 24/7 customer support',
        stars: '★★★☆☆'
      });
    }
    
    return recommendations;
  }

  private calculateTimeSaved(score: number): string {
    if (score >= 71) return '60-80%';
    if (score >= 31) return '40-60%';
    return '20-40%';
  }

  private calculateROITimeline(score: number): string {
    if (score >= 71) return '15-30 days';
    if (score >= 31) return '30-60 days';
    return '60-90 days';
  }

  private async generatePDF(htmlContent: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      // Set content and wait for any images/fonts to load
      await page.setContent(htmlContent, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      // Generate PDF with professional settings
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0.5in',
          bottom: '0.5in',
          left: '0.5in',
          right: '0.5in'
        },
        preferCSSPageSize: true
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  private async sendEmailWithPDF(reportData: ReportData, pdfBuffer: Buffer): Promise<void> {
    // Determine email provider based on EMAIL_USER
    const isGmail = process.env.EMAIL_USER?.includes('@gmail.com');
    
    let transporter;
    
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
    } else {
      // Hostinger or other SMTP configuration
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
        }
      });
      console.log(`📧 Using SMTP configuration: ${process.env.SMTP_HOST || 'smtp.hostinger.com'}`);
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
    await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully with PDF attachment');
  }

  /**
   * Customize the email subject line here
   */
  private getEmailSubject(reportData: ReportData): string {
    return `🚀 Your AI Audit Report is Ready - ${reportData.companyName}`;
  }

  /**
   * Customize the email template here - modify this method to change the email content
   */
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