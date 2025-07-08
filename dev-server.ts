import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper function to load API handlers
async function loadHandler(handlerPath: string) {
  try {
    const module = await import(handlerPath);
    return module.default;
  } catch (error) {
    console.error(`Failed to load handler ${handlerPath}:`, error);
    return null;
  }
}

// API Routes - mirroring the serverless function structure
app.post('/api/quiz-sessions', async (req, res) => {
  const handler = await loadHandler('./api/quiz-sessions.js');
  if (handler) await handler(req, res);
  else res.status(500).json({ error: 'Handler not found' });
});

app.get('/api/questions', async (req, res) => {
  const handler = await loadHandler('./api/questions.js');
  if (handler) await handler(req, res);
  else res.status(500).json({ error: 'Handler not found' });
});

app.get('/api/quiz-sessions/:id', async (req, res) => {
  const handler = await loadHandler('./api/quiz-sessions/[id].js');
  if (handler) {
    req.query = { ...req.query, id: req.params.id };
    await handler(req, res);
  } else {
    res.status(500).json({ error: 'Handler not found' });
  }
});

app.patch('/api/quiz-sessions/:id', async (req, res) => {
  const handler = await loadHandler('./api/quiz-sessions/[id].js');
  if (handler) {
    req.query = { ...req.query, id: req.params.id };
    await handler(req, res);
  } else {
    res.status(500).json({ error: 'Handler not found' });
  }
});

app.post('/api/quiz-sessions/:id/submit', async (req, res) => {
  const handler = await loadHandler('./api/quiz-sessions/[id]/submit.js');
  if (handler) {
    req.query = { ...req.query, id: req.params.id };
    await handler(req, res);
  } else {
    res.status(500).json({ error: 'Handler not found' });
  }
});

app.get('/api/quiz-results/session/:sessionId', async (req, res) => {
  const handler = await loadHandler('./api/quiz-results/session/[sessionId].js');
  if (handler) {
    req.query = { ...req.query, sessionId: req.params.sessionId };
    await handler(req, res);
  } else {
    res.status(500).json({ error: 'Handler not found' });
  }
});

app.post('/api/ai/chat', async (req, res) => {
  const handler = await loadHandler('./api/ai/chat.js');
  if (handler) await handler(req, res);
  else res.status(500).json({ error: 'Handler not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 API Development server running on http://localhost:${PORT}`);
  console.log(`🎯 Frontend should be running on http://127.0.0.1:5000`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api/*`);
}); 