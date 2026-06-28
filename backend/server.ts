// backend/server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { aiService } from './services/ai.service';

dotenv.config();

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

// 🔥 SECURITY
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// 🔥 CORS
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://192.168.1.22:3000',
    'https://nihonn-five.vercel.app',
    'https://nihonn-git-main-hotaru-git3s-projects.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// 🔥 BODY PARSER
app.use(express.json({ limit: '10kb' }));

// 🔥 RATE LIMIT
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// 🔥 LOGGING
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// 🔥 AI ENDPOINT - SEDERHANA (GA PAKE AUTH DULU)
app.post('/api/ai/breakdown', async (req, res) => {
  try {
    const { text } = req.body;
    
    // 🔥 VALIDASI
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    const sanitized = text.trim();
    if (sanitized.length === 0 || sanitized.length > 500) {
      return res.status(400).json({ error: 'Text must be 1-500 characters' });
    }

    console.log('📝 Analyzing:', sanitized);
    const result = await aiService.generateBreakdown(sanitized);
    console.log('✅ AI Result:', result);
    
    res.json(result);
  } catch (err: any) {
    console.error('❌ AI Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🔥 HEALTH CHECK
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 🔥 SERVE STATIC (untuk production)
if (process.env.NODE_ENV === 'production') {
  import('path').then(path => {
    const staticPath = path.join(__dirname, '../dist');
    app.use(express.static(staticPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(staticPath, 'index.html'));
    });
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;