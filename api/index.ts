import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Basic middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10kb' }));

// AI Breakdown endpoint
app.post('/api/ai/breakdown', async (req, res) => {
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

    const SYSTEM_PROMPT = `Kamu adalah guru bahasa Jepang ahli yang SANGAT KETAT dan FAKTUAL. 
Untuk teks Jepang yang diberikan, ekstrak detail berikut dengan akurasi 100%.

SANGAT PENTING (ATURAN KETAT): 
- DILARANG KERAS berhalusinasi atau mengarang arti kata/kanji. 
- Terjemahan utuh, arti kosakata (meaning), arti kanji, dan arti tata bahasa HARUS SELALU dalam Bahasa Indonesia.
- Jika input teks tidak masuk akal, abaikan saja. Lebih baik kembalikan array kosong jika tidak ada arti yang valid.

1. Semua kosakata (kecuali partikel dan kata level N5 paling dasar). Field "meaning" wajib dalam Bahasa Indonesia.
2. Semua kanji yang muncul. Field "meaning" wajib dalam Bahasa Indonesia.
3. Semua pola tata bahasa. Field "meaning" wajib dalam Bahasa Indonesia.
4. Terjemahan utuh ke Bahasa Indonesia.

Pastikan field "word", "character", "pattern" dan lainnya TIDAK BOLEH KOSONG. Jika tidak ada data yang relevan, hapus dari array (kembalikan array kosong []).

Balas HANYA dalam format JSON (tanpa markdown, tanpa penjelasan).`;

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemma-3-27b-it',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Teks Jepang: ${sanitizedText}` }
        ],
        temperature: 0.1,
        response_format: {
          type: "json_object",
          schema: {
            type: "object",
            properties: {
              vocabulary: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    word: { type: "string" },
                    reading: { type: "string" },
                    meaning: { type: "string" },
                    part_of_speech: { type: "string" },
                    jlpt_level: { type: "string" }
                  },
                  required: ["word", "reading", "meaning"]
                }
              },
              kanji: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    character: { type: "string" },
                    onyomi: { type: "string" },
                    kunyomi: { type: "string" },
                    meaning: { type: "string" },
                    stroke_count: { type: "integer" },
                    jlpt_level: { type: "string" },
                    example_words: { type: "string" },
                    example_sentence: { type: "string" }
                  },
                  required: ["character", "meaning"]
                }
              },
              grammar: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    pattern: { type: "string" },
                    meaning: { type: "string" },
                    structure: { type: "string" },
                    example_sentence: { type: "string" }
                  },
                  required: ["pattern", "meaning"]
                }
              },
              translation: { type: "string" }
            },
            required: ["vocabulary", "kanji", "grammar", "translation"]
          }
        },
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Nvidia API error:', response.status, errorText);
      throw new Error(`Nvidia API error: ${response.statusText}`);
    }

    const data = await response.json();
    const resultText = data.choices?.[0]?.message?.content;
    
    if (!resultText) {
      throw new Error("Empty response from AI");
    }

    console.log('✅ Successfully parsed AI response');
    res.json(JSON.parse(resultText));

  } catch (err: any) {
    console.error('❌ AI API Error:', err.message);
    res.status(500).json({ error: "An error occurred while processing the request." });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Export for Vercel
export default (req: VercelRequest, res: VercelResponse) => {
  return app(req, res);
};