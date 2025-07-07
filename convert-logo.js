import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logoPath = path.join(__dirname, 'attached_assets/Spark AI Logo - Black.png');

if (fs.existsSync(logoPath)) {
    const logoBuffer = fs.readFileSync(logoPath);
    const logoBase64 = logoBuffer.toString('base64');
    const dataUri = `data:image/png;base64,${logoBase64}`;
    
    console.log('Logo converted successfully!');
    console.log('First 50 chars:', dataUri.substring(0, 50));
    
    // Save to file
    fs.writeFileSync('logo-data.txt', dataUri);
    console.log('Logo saved to logo-data.txt');
} else {
    console.log('Logo file not found at:', logoPath);
    console.log('Available files:');
    try {
        const files = fs.readdirSync('attached_assets');
        files.forEach(file => console.log(' -', file));
    } catch (e) {
        console.log('Cannot read attached_assets directory');
    }
} 