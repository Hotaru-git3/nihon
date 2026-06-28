// backend/services/ai.service.ts
import dotenv from 'dotenv';

dotenv.config();

const SYSTEM_PROMPT = `Kamu adalah guru bahasa Jepang ahli yang SANGAT KETAT dan FAKTUAL. 
Untuk teks Jepang yang diberikan, ekstrak detail berikut dengan akurasi 100%.

SANGAT PENTING (ATURAN KETAT): 
- DILARANG KERAS berhalusinasi atau mengarang arti kata/kanji. 
- Terjemahan utuh, arti kosakata (meaning), arti kanji, dan arti tata bahasa HARUS SELALU dalam Bahasa Indonesia.
- Terjemahan, cara baca (romaji/hiragana), dan arti HARUS valid sesuai kamus bahasa Jepang asli. 
- Jika input teks tidak masuk akal (misal salah ketik, karakter Mandarin/Hanzi yang bukan kanji Jepang, atau karakter acak), abaikan saja. JANGAN mencoba menebak arti yang salah.

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
      console.warn('⚠️ NVIDIA_API_KEY not configured');
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
      // 🔥 PAKE FETCH NATIVE - BUKAN OPENAI SDK
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
        console.error('NVIDIA API Error:', response.status);
        return this.getFallbackData(text);
      }

      const data = await response.json();
      let resultText = data.choices?.[0]?.message?.content || '';
      
      // Clean JSON
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
    const vocabulary = [];
    const kanji = [];
    const grammar = [];

    // Kamus sederhana
    const dict: Record<string, { reading: string; meaning: string }> = {
      '私': { reading: 'わたし', meaning: 'saya' },
      '学生': { reading: 'がくせい', meaning: 'pelajar' },
      'です': { reading: 'です', meaning: 'adalah (sopan)' },
      '勉強': { reading: 'べんきょう', meaning: 'belajar' },
      '日本語': { reading: 'にほんご', meaning: 'bahasa Jepang' },
      '毎日': { reading: 'まいにち', meaning: 'setiap hari' },
      '本': { reading: 'ほん', meaning: 'buku' },
      '読む': { reading: 'よむ', meaning: 'membaca' },
      '見る': { reading: 'みる', meaning: 'melihat' },
      '食べる': { reading: 'たべる', meaning: 'makan' },
      '飲む': { reading: 'のむ', meaning: 'minum' },
      '行く': { reading: 'いく', meaning: 'pergi' },
      '来る': { reading: 'くる', meaning: 'datang' },
      '帰る': { reading: 'かえる', meaning: 'pulang' },
      '学校': { reading: 'がっこう', meaning: 'sekolah' },
      '先生': { reading: 'せんせい', meaning: 'guru' },
      '友達': { reading: 'ともだち', meaning: 'teman' },
      '家族': { reading: 'かぞく', meaning: 'keluarga' },
    };

    // Parse teks
    const chars = text.replace(/\s/g, '').split('');
    let currentWord = '';

    for (const char of chars) {
      if (char.match(/[\u3040-\u30FF\u4E00-\u9FAF]/)) {
        currentWord += char;
      } else {
        if (currentWord) {
          const found = dict[currentWord];
          if (found) {
            vocabulary.push({ word: currentWord, reading: found.reading, meaning: found.meaning });
            // Cek apakah ada kanji
            if (currentWord.match(/[\u4E00-\u9FAF]/)) {
              kanji.push({
                character: currentWord,
                onyomi: found.reading,
                kunyomi: found.reading,
                meaning: found.meaning
              });
            }
          } else {
            vocabulary.push({ word: currentWord, reading: currentWord, meaning: '...' });
          }
          currentWord = '';
        }
      }
    }
    if (currentWord) {
      const found = dict[currentWord];
      if (found) {
        vocabulary.push({ word: currentWord, reading: found.reading, meaning: found.meaning });
      }
    }

    // Deteksi grammar
    const grammarPatterns: Record<string, string> = {
      'です': 'adalah (bentuk sopan)',
      'ます': 'bentuk sopan',
      'は': 'partikel topik',
      'が': 'partikel subjek',
      'を': 'partikel objek',
      'に': 'partikel tujuan/waktu',
      'で': 'partikel lokasi/alasan',
      'へ': 'partikel arah',
      'と': 'partikel bersama',
      'から': 'partikel dari',
      'まで': 'partikel sampai',
      'の': 'partikel kepemilikan'
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
      vocabulary: vocabulary.slice(0, 15),
      kanji: kanji.slice(0, 10),
      grammar: grammar.slice(0, 8),
      translation: `Terjemahan: "${text}"`
    };
  }
}

export const aiService = new AIService();