import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10kb' }));

// ========================================
// FIREBASE ADMIN INIT
// ========================================
if (!getApps().length) {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      initializeApp({
        credential: cert(config),
        projectId: config.projectId,
      });
      console.log('✅ Firebase Admin initialized with config file');
    } else {
      const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
      if (projectId) {
        initializeApp({ projectId });
        console.log('✅ Firebase Admin initialized with project ID:', projectId);
      } else {
        initializeApp();
        console.log('✅ Firebase Admin initialized with default credentials');
      }
    }
  } catch (err: any) {
    console.error('❌ Firebase Admin init error:', err.message);
    if (!getApps().length) {
      initializeApp();
      console.log('⚠️ Firebase Admin initialized with default (fallback)');
    }
  }
}

// ========================================
// AUTH MIDDLEWARE
// ========================================
const authenticateToken = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    (req as any).user = decodedToken;
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    return res.status(403).json({ error: 'Forbidden: Invalid token' });
  }
};

// ========================================
// OPENAI CLIENT (NVIDIA)
// ========================================
const openai = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY || '',
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

const SYSTEM_PROMPT = `Kamu adalah guru bahasa Jepang ahli yang SANGAT KETAT dan FAKTUAL. 
Untuk teks Jepang yang diberikan, ekstrak detail berikut dengan akurasi 100%.

SANGAT PENTING (ATURAN KETAT): 
- DILARANG KERAS berhalusinasi atau mengarang arti kata/kanji. 
- Terjemahan utuh, arti kosakata (meaning), arti kanji, dan arti tata bahasa HARUS SELALU dalam Bahasa Indonesia.
- Terjemahan, cara baca (romaji/hiragana), dan arti HARUS valid sesuai kamus bahasa Jepang asli. 
- Jika input teks tidak masuk akal, abaikan saja. JANGAN mencoba menebak arti yang salah. Lebih baik kembalikan array kosong jika tidak ada arti yang valid.

1. Semua kosakata (kecuali partikel dan kata level N5 paling dasar). Field "meaning" wajib dalam Bahasa Indonesia.
2. Semua kanji yang muncul. Untuk kanji sertakan contoh kalimat singkat dan contoh gabungan kata. Field "meaning" wajib dalam Bahasa Indonesia.
3. Semua pola tata bahasa. Field "meaning" wajib dalam Bahasa Indonesia.
4. Terjemahan utuh ke Bahasa Indonesia.

Balas HANYA JSON (tanpa markdown, tanpa penjelasan).`;

// ========================================
// AI BREAKDOWN ENDPOINT
// ========================================
app.post('/api/ai/breakdown', authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: "Invalid input type." });
    }
    
    const sanitizedText = text.trim();
    if (sanitizedText.length === 0 || sanitizedText.length > 500) {
      return res.status(400).json({ error: "Text must be between 1 and 500 characters." });
    }

    console.log(`🤖 Processing: "${sanitizedText.substring(0, 50)}..."`);

    const completion = await openai.chat.completions.create({
      model: 'meta/llama-3.1-8b-instruct',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Teks Jepang: ${sanitizedText}` }
      ],
      temperature: 0.2,
      top_p: 0.7,
      max_tokens: 1024,
    });

    const resultText = completion.choices[0]?.message?.content;
    
    if (!resultText) {
      throw new Error('Empty response from AI');
    }

    console.log('✅ AI Response received');

    try {
      const parsed = JSON.parse(resultText);
      return res.json(parsed);
    } catch {
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return res.json(JSON.parse(jsonMatch[0]));
      }
      throw new Error('Invalid JSON format');
    }

  } catch (err: any) {
    console.error('❌ AI API Error:', err.message);
    res.status(500).json({ error: "An error occurred while processing the request." });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default (req: VercelRequest, res: VercelResponse) => {
  return app(req, res);
};