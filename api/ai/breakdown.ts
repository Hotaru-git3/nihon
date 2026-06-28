// api/ai/breakdown.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 🔥 CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    // 🔥 Mock response (atau pake NVIDIA API)
    const result = {
      vocabulary: [
        { word: '勉強', reading: 'べんきょう', meaning: 'belajar' },
        { word: '日本語', reading: 'にほんご', meaning: 'bahasa Jepang' },
        { word: '毎日', reading: 'まいにち', meaning: 'setiap hari' }
      ],
      grammar: [
        { pattern: '〜ます', meaning: 'bentuk sopan', example: '勉強します' },
        { pattern: '〜てください', meaning: 'tolong...', example: '見てください' }
      ],
      translation: `Terjemahan dari teks: "${text.substring(0, 50)}..."`
    };

    return res.json(result);
    
  } catch (error: any) {
    console.error('AI Error:', error);
    return res.status(500).json({ error: error.message || 'AI analysis failed' });
  }
}