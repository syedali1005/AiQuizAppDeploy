import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize OpenAI client only if API key is available
let openai: OpenAI | null = null;
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  } else {
    console.log('Warning: OPENAI_API_KEY not found. AI features will be disabled.');
  }
} catch (error) {
  console.error('Error initializing OpenAI:', error);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "production") {
    const distPath = path.resolve(import.meta.dirname, "public");
    app.use(express.static(distPath));
    
    app.get("*", (req, res) => {
      if (!req.path.startsWith("/api")) {
        res.sendFile(path.resolve(distPath, "index.html"));
      }
    });
  } else {
    await setupVite(app, server);
  }

  app.post('/api/ai/chat', async (req, res) => {
    if (!openai) {
      return res.status(503).json({ 
        error: 'AI service is not available. Please configure OPENAI_API_KEY to enable AI features.',
        isConfigError: true
      });
    }

    try {
      const { message, category, questionType } = req.body;

      const completion = await openai.chat.completions.create({
        model: "o4-mini-2025-04-16",
        messages: [
          {
            role: "system",
            content: `You are a helpful AI assistant specializing in business automation and digital transformation solutions. 
            You are currently helping with the ${category} category, specifically for ${questionType} type questions.
            Provide specific, actionable recommendations for tools and processes that can help automate and improve business operations.
            Keep responses concise and focused on practical solutions.`
          },
          {
            role: "user",
            content: message
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      res.json({ response: completion.choices[0].message.content });
    } catch (error) {
      console.error('OpenAI API error:', error);
      res.status(500).json({ error: 'Failed to get AI response' });
    }
  });

  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, '127.0.0.1', () => {
    log(`Server running at http://127.0.0.1:${port}`);
  });
})();

export default app;
