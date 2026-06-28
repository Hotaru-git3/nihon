import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { aiService } from './services/ai.service';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.disable('x-powered-by');

// Set trust proxy to allow express-rate-limit to read X-Forwarded-For properly
app.set('trust proxy', 1);

// OWASP Security Implementations:
// 1. Helmet helps secure Express apps by setting various HTTP headers (A05: Security Misconfiguration)
app.use(
  helmet({
    contentSecurityPolicy: false, // Might interfere with inline scripts/styles if not configured
    crossOriginEmbedderPolicy: false,
  })
);

// 2. CORS configuration - restrict methods and headers
app.use(cors({
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. Body parser with strict size limits (A03: Injection / A04: Insecure Design DoS)
app.use(express.json({ limit: '10kb' }));

// Serve static files from the Vite build
app.use(express.static(path.join(__dirname, '../dist')));

// 4. Rate limiting to prevent brute force & DoS (A04: Insecure Design)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Specific stricter rate limiting for auth endpoints (A07: Identification and Authentication Failures)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 auth requests
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/', authLimiter);

app.get('/api/firebase-config', (req, res) => {
  try {
    const configPath = path.join(__dirname, '../firebase-applet-config.json');
    if (!fs.existsSync(configPath)) {
      return res.status(404).json({ error: 'Firebase config not found' });
    }
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    res.json(config);
  } catch (err: any) {
    // Return 404 instead of 500 so the client falls back to env vars gracefully
    res.status(404).json({ error: 'Firebase config could not be loaded' });
  }
});

// 5. Basic logging for monitoring (A09: Security Logging and Monitoring Failures)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Helper for XSS Sanitization (A03: Injection)
const sanitizeInput = (str: any): string => {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>]/g, '');
};

import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin (Uses environment credentials or application default credentials)
if (!getApps().length) {
  initializeApp();
}

// Auth Middleware
const authenticateToken = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    (req as any).user = decodedToken;
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    return res.status(403).json({ error: 'Forbidden: Invalid token' });
  }
};

// Protect all other API routes
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/auth') || req.path.startsWith('/firebase-config') || req.path.startsWith('/ai/breakdown')) {
    return next();
  }
  // The rest of the routes are no longer used since we migrated to Firebase
  // but we keep the middleware for completeness
  return res.status(404).json({ error: 'Endpoint migrated to Firebase' });
});

// --- AI ---
app.post('/api/ai/breakdown', authenticateToken, async (req, res) => {
  try {
    const text = req.body.text;
    
    // Strict input validation (A03: Injection)
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: "Invalid input type." });
    }
    
    // Limit input length
    const sanitizedText = text.trim();
    if (sanitizedText.length === 0 || sanitizedText.length > 500) {
      return res.status(400).json({ error: "Text must be between 1 and 500 characters." });
    }

    const parsed = await aiService.generateBreakdown(sanitizedText);

    res.json(parsed);
  } catch (err: any) {
    console.error("AI API Error:", err);
    // Generic error message to prevent leaking internal details (A05: Security Misconfiguration)
    res.status(500).json({ error: "An error occurred while processing the request." });
  }
});

app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  } else {
    next();
  }
});

const PORT = process.env.NODE_ENV === 'production' ? (process.env.PORT || 3000) : 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
