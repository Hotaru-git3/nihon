// backend/services/ai.service.ts
import dotenv from 'dotenv';

dotenv.config();

const SYSTEM_PROMPT = `Kamu adalah guru bahasa Jepang ahli yang SANGAT KETAT dan FAKTUAL. 
Untuk teks Jepang yang diberikan, ekstrak detail berikut dengan akurasi 100%.

SANGAT PENTING (ATURAN KETAT): 
- DILARANG KERAS berhalusinasi atau mengarang arti kata/kanji. 
- Terjemahan utuh, arti kosakata, arti kanji, dan arti tata bahasa HARUS SELALU dalam Bahasa Indonesia.
- Jika input teks tidak masuk akal, kembalikan array kosong.

Balas HANYA dalam format JSON (tanpa markdown, tanpa penjelasan):
{
  "vocabulary": [{"word": "kata", "reading": "cara baca", "meaning": "arti"}],
  "kanji": [{"character": "kanji", "onyomi": "onyomi", "kunyomi": "kunyomi", "meaning": "arti"}],
  "grammar": [{"pattern": "pola", "meaning": "arti", "example_sentence": "contoh"}],
  "translation": "terjemahan"
}`;

export class AIService {
  private apiKey: string;

  constructor() {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ NVIDIA_API_KEY not configured, using mock mode');
      this.apiKey = '';
    } else {
      this.apiKey = apiKey;
    }
  }

  async generateBreakdown(text: string): Promise<any> {
    // 🔥 KALO GA ADA API KEY, PAKE MOCK
    if (!this.apiKey) {
      console.log('🔧 Using mock mode (no API key)');
      return this.getFallbackData(text);
    }

    try {
      const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'meta/llama-3.1-8b-instruct',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `Teks Jepang: ${text}` }
          ],
          temperature: 0.05,
          max_tokens: 2048
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('NVIDIA API Error:', response.status, errorText);
        return this.getFallbackData(text);
      }

      const data = await response.json();
      let resultText = data.choices?.[0]?.message?.content || '';
      
      // 🔥 CLEAN JSON
      resultText = resultText.trim();
      if (resultText.startsWith('```')) {
        resultText = resultText.replace(/^```(json)?/, '').replace(/```$/, '').trim();
      }

      const firstBrace = resultText.indexOf('{');
      const lastBrace = resultText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        resultText = resultText.substring(firstBrace, lastBrace + 1);
      }
      
      try {
        return JSON.parse(resultText);
      } catch (e) {
        console.error('JSON Parse Error, using fallback');
        return this.getFallbackData(text);
      }
      
    } catch (error) {
      console.error('AI Service Error:', error);
      return this.getFallbackData(text);
    }
  }

  // 🔥 FALLBACK DATA
  private getFallbackData(text: string): any {
    const vocabulary: Array<{ word: string; reading: string; meaning: string }> = [];
    const kanji: Array<{ character: string; onyomi: string; kunyomi: string; meaning: string }> = [];
    const grammar: Array<{ pattern: string; meaning: string; example_sentence: string }> = [];

    // Parse kata
    const chars = text.replace(/\s/g, '').split('');
    let currentWord = '';
    
    for (const char of chars) {
      if (char.match(/[\u3040-\u30FF\u4E00-\u9FAF]/)) {
        currentWord += char;
      } else {
        if (currentWord) {
          vocabulary.push({ word: currentWord, reading: currentWord, meaning: '...' });
          currentWord = '';
        }
      }
    }
    if (currentWord) {
      vocabulary.push({ word: currentWord, reading: currentWord, meaning: '...' });
    }

    // Deteksi grammar
    const grammarPatterns: Record<string, string> = {
      'です': 'adalah (bentuk sopan)',
      'ます': 'bentuk sopan',
      'は': 'partikel topik',
      'が': 'partikel subjek',
      'を': 'partikel objek',
      'に': 'partikel tujuan/waktu',
      'で': 'partikel lokasi'
    };

    for (const [pattern, meaning] of Object.entries(grammarPatterns)) {
      if (text.includes(pattern)) {
        grammar.push({
          pattern: `〜${pattern}`,
          meaning: meaning,
          example_sentence: text
        });
      }
    }

    return {
      vocabulary: vocabulary.slice(0, 10),
      kanji: kanji,
      grammar: grammar.slice(0, 5),
      translation: `Terjemahan: "${text}"`
    };
  }
}

export const aiService = new AIService();