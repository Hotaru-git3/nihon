import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10kb' }));

const SYSTEM_PROMPT = `Kamu adalah guru bahasa Jepang ahli yang SANGAT KETAT dan FAKTUAL. 
Untuk teks Jepang yang diberikan, ekstrak detail berikut dengan akurasi 100%.

SANGAT PENTING (ATURAN KETAT): 
- DILARANG KERAS berhalusinasi atau mengarang arti kata/kanji. 
- Terjemahan utuh, arti kosakata (meaning), arti kanji, dan arti tata bahasa HARUS SELALU dalam Bahasa Indonesia.
- Terjemahan, cara baca (romaji/hiragana), dan arti HARUS valid sesuai kamus bahasa Jepang asli. 
- Jika input teks tidak masuk akal, abaikan saja. JANGAN mencoba menebak arti yang salah. Lebih baik kembalikan array kosong jika tidak ada arti yang valid.

1. Semua kosakata (kecuali partikel dan kata level N5 paling dasar). Field "meaning" wajib dalam Bahasa Indonesia.
2. Semua kanji yang muncul. Untuk kanji sertakan contoh kalimat singkat yang menggunakannya, dan juga contoh gabungan kata (elemen pendukung) yang menggunakan kanji tersebut beserta artinya (misal: "銀行 (ginkou) - bank"). Field "meaning" wajib dalam Bahasa Indonesia.
3. Semua pola tata bahasa. Field "meaning" wajib dalam Bahasa Indonesia.
4. Terjemahan utuh ke Bahasa Indonesia.

Pastikan field "word", "character", "pattern" dan lainnya TIDAK BOLEH KOSONG. Jika tidak ada data yang relevan, hapus dari array (kembalikan array kosong []).

Balas HANYA dalam format JSON (tanpa markdown, tanpa penjelasan):
{
  "vocabulary": [{"word": "kata", "reading": "cara baca", "meaning": "arti", "part_of_speech": "jenis kata", "jlpt_level": "N5"}],
  "kanji": [{"character": "kanji", "onyomi": "onyomi", "kunyomi": "kunyomi", "meaning": "arti", "stroke_count": 0, "jlpt_level": "N5", "example_words": "contoh kata", "example_sentence": "contoh kalimat"}],
  "grammar": [{"pattern": "pola", "meaning": "arti", "structure": "struktur", "example_sentence": "contoh kalimat"}],
  "translation": "terjemahan"
}`;

interface ModelConfig {
  name: string;
  apiKey: string;
  temperature: number;
  top_p: number;
  max_tokens: number;
}

class AIService {
  private models: ModelConfig[];

  constructor() {
    this.models = [
      {
        name: 'stockmark/stockmark-2-100b-instruct',
        apiKey: process.env.NVIDIA_API_KEY || '',
        temperature: 0.05,
        top_p: 0.5,
        max_tokens: 2048,
      },
      {
        name: 'qwen/qwen3.5-122b-a10b',
        apiKey: process.env.NVIDIA_API_KEY_QWEN || '',
        temperature: 0.6,
        top_p: 0.95,
        max_tokens: 2048,
      },
      {
        name: 'meta/llama-3.3-70b-instruct',
        apiKey: process.env.NVIDIA_API_KEY_LLAMA || '',
        temperature: 0.2,
        top_p: 0.7,
        max_tokens: 1024,
      },
    ].filter(m => m.apiKey);
  }

  async generateBreakdown(text: string): Promise<any> {
    let lastError = null;

    for (const modelConfig of this.models) {
      try {
        console.log(`🤖 Trying model: ${modelConfig.name}`);
        
        const openai = new OpenAI({
          baseURL: 'https://integrate.api.nvidia.com/v1',
          apiKey: modelConfig.apiKey,
        });

        const response = await openai.chat.completions.create({
          model: modelConfig.name,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `Teks Jepang: ${text}\n\nPENTING: Semua arti wajib Bahasa Indonesia.` },
          ],
          temperature: modelConfig.temperature,
          top_p: modelConfig.top_p,
          max_tokens: modelConfig.max_tokens,
          stream: false,
        });

        let resultText = response.choices[0]?.message?.content || '';
        resultText = resultText.trim();
        
        if (resultText.startsWith('```')) {
          resultText = resultText.replace(/^```(json)?/, '').replace(/```$/, '').trim();
        }

        const firstBrace = resultText.indexOf('{');
        const lastBrace = resultText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          resultText = resultText.substring(firstBrace, lastBrace + 1);
        }
        
        const parsed = JSON.parse(resultText);
        console.log(`✅ Success with model: ${modelConfig.name}`);
        return parsed;

      } catch (err: any) {
        console.log(`❌ Model ${modelConfig.name} failed:`, err.message);
        lastError = err;
      }
    }

    throw lastError || new Error('All models failed');
  }
}

const aiService = new AIService();

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

    const parsed = await aiService.generateBreakdown(sanitizedText);
    console.log('✅ AI Response parsed successfully');
    
    res.json(parsed);

  } catch (err: any) {
    console.error('❌ AI API Error:', err.message);
    res.status(500).json({ error: "An error occurred while processing the request." });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', models: aiService['models'].length });
});

export default (req: VercelRequest, res: VercelResponse) => {
  return app(req, res);
};