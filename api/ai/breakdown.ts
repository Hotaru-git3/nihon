// api/ai/breakdown.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

// 🔥 ALLOWED ORIGINS
const ALLOWED_ORIGINS = [
  'https://nihonn-five.vercel.app',
  'https://nihonn-git-main-hotaru-git3s-projects.vercel.app',
  'http://localhost:3000',
  'http://192.168.1.22:3000'
];

// 🔥 MAX TEXT LENGTH
const MAX_TEXT_LENGTH = 5000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 🔥 CORS - AMAN
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text } = req.body;
    
    // 🔥 VALIDASI INPUT
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    // 🔥 SANITASI
    const sanitizedText = sanitizeInput(text);
    
    if (sanitizedText.length === 0) {
      return res.status(400).json({ error: 'Text is empty after sanitization' });
    }

    // 🔥 PAKE NVIDIA API
    const apiKey = process.env.NVIDIA_API_KEY;
    
    if (apiKey) {
      try {
        const response = await fetch('https://api.nvidia.ai/v1/analyze', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            text: sanitizedText,
            language: 'ja',
            analysis_type: 'full'
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          return res.json(data);
        }
      } catch (error) {
        console.log('NVIDIA API error, falling back to mock');
      }
    }

    // 🔥 FALLBACK: Parse manual
    const result = analyzeJapanese(sanitizedText);
    return res.json(result);
    
  } catch (error: any) {
    // 🔥 LOG TAPI JANGAN BOCORIN DETAIL
    console.error('AI Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// 🔥 SANITASI INPUT
function sanitizeInput(text: string): string {
  return text
    .replace(/[<>]/g, '')
    .replace(/[{}]/g, '')
    .replace(/[()]/g, '')
    .replace(/[\]\[]/g, '')
    .replace(/[`´]/g, '')
    .slice(0, MAX_TEXT_LENGTH);
}

// 🔥 SIMPLE JAPANESE PARSER (FALLBACK)
function analyzeJapanese(text: string) {
  const clean = text.replace(/\s/g, '');
  
  const vocabulary: Array<{ word: string; reading: string; meaning: string }> = [];
  const grammar: Array<{ pattern: string; meaning: string; example: string }> = [];
  
  // 🔥 Parse kata
  const chars = clean.split('');
  let currentWord = '';
  
  for (const char of chars) {
    if (char.match(/[\u3040-\u30FF\u4E00-\u9FAF]/)) {
      currentWord += char;
    } else {
      if (currentWord) {
        vocabulary.push({
          word: currentWord,
          reading: currentWord,
          meaning: '...'
        });
        currentWord = '';
      }
    }
  }
  if (currentWord) {
    vocabulary.push({
      word: currentWord,
      reading: currentWord,
      meaning: '...'
    });
  }
  
  // 🔥 Deteksi grammar
  const grammarPatterns: Record<string, { meaning: string; example: string }> = {
    'です': { meaning: 'adalah (bentuk sopan)', example: '私は学生です' },
    'ます': { meaning: 'bentuk sopan', example: '勉強します' },
    'は': { meaning: 'partikel topik', example: '私は' },
    'が': { meaning: 'partikel subjek', example: '私が' },
    'を': { meaning: 'partikel objek', example: '本を' },
    'に': { meaning: 'partikel tujuan/waktu', example: '学校に' },
    'で': { meaning: 'partikel lokasi/alasan', example: '公園で' },
    'へ': { meaning: 'partikel arah', example: '東京へ' },
    'と': { meaning: 'partikel bersama', example: '友達と' },
    'から': { meaning: 'partikel dari', example: '日本から' },
    'まで': { meaning: 'partikel sampai', example: '駅まで' },
    'の': { meaning: 'partikel kepemilikan', example: '私の本' }
  };

  for (const [pattern, info] of Object.entries(grammarPatterns)) {
    if (text.includes(pattern)) {
      grammar.push({
        pattern: `〜${pattern}`,
        meaning: info.meaning,
        example: info.example
      });
    }
  }
  
  return {
    vocabulary: vocabulary.slice(0, 10),
    grammar: grammar.slice(0, 5),
    translation: `Terjemahan: "${text}"`
  };
}