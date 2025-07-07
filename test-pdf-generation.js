import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function testPDFGeneration() {
  console.log('🧪 Testing PDF Generation...');
  
  // Simple HTML content for testing
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
      <div class="header">🧪 PDF Generation Test</div>
      <div class="content">
        <h2>Test Report</h2>
        <p>This is a test PDF to verify that Puppeteer is working correctly.</p>
        <p>If you can see this PDF, the generation system is working!</p>
        <p>Generated at: ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;

  try {
    console.log('🚀 Launching browser...');
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    console.log('📄 Creating PDF...');
    const page = await browser.newPage();
    
    await page.setContent(testHTML, { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.5in',
        bottom: '0.5in',
        left: '0.5in',
        right: '0.5in'
      }
    });

    await browser.close();

    console.log(`✅ PDF generated successfully! Size: ${pdfBuffer.length} bytes`);
    
    // Save test PDF to file
    const testPdfPath = path.join(process.cwd(), 'test-pdf-output.pdf');
    fs.writeFileSync(testPdfPath, pdfBuffer);
    console.log(`📁 Test PDF saved to: ${testPdfPath}`);
    
    return pdfBuffer;
    
  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    throw error;
  }
}

// Run the test
testPDFGeneration()
  .then(() => {
    console.log('🎉 PDF generation test completed successfully!');
  })
  .catch((error) => {
    console.error('💥 PDF generation test failed:', error);
  }); 