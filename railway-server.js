import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Helper function to load API handlers
async function loadHandler(handlerPath) {
  try {
    const module = await import(handlerPath);
    return module.default;
  } catch (error) {
    console.error(`Failed to load handler ${handlerPath}:`, error);
    return null;
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
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

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle React routing (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
}); 