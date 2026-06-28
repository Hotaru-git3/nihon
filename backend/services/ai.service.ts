// backend/services/ai.service.ts
import dotenv from 'dotenv';

dotenv.config();

const SYSTEM_PROMPT = `Kamu adalah guru bahasa Jepang ahli. Untuk teks Jepang yang diberikan, ekstrak:

1. **Kosakata**: Semua kata (termasuk partikel penting), dengan:
   - "word": kata asli
   - "reading": cara baca (hiragana)
   - "meaning": arti dalam BAHASA INDONESIA

2. **Kanji**: Setiap karakter kanji dengan:
   - "character": kanji
   - "onyomi": onyomi (katakana)
   - "kunyomi": kunyomi (hiragana)  
   - "meaning": arti dalam BAHASA INDONESIA

3. **Tata Bahasa**: Pola grammar dengan:
   - "pattern": pola
   - "meaning": arti dalam BAHASA INDONESIA
   - "example_sentence": contoh kalimat

4. **Translation**: Terjemahan utuh ke BAHASA INDONESIA

BALAS HANYA JSON:
{
  "vocabulary": [{"word": "...", "reading": "...", "meaning": "..."}],
  "kanji": [{"character": "...", "onyomi": "...", "kunyomi": "...", "meaning": "..."}],
  "grammar": [{"pattern": "...", "meaning": "...", "example_sentence": "..."}],
  "translation": "..."
}

JANGAN ADA ARRAY KOSONG - isi semua field yang relevan!`;

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
    // 🔥 KALO GA ADA API KEY, PAKE MOCK YANG LEBIH BAIK
    if (!this.apiKey) {
      console.log('🔧 Using enhanced mock mode');
      return this.getEnhancedFallback(text);
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
            { role: 'user', content: `Teks: "${text}"` }
          ],
          temperature: 0.05,
          max_tokens: 2048
        })
      });

      if (!response.ok) {
        console.error('NVIDIA API Error:', response.status);
        return this.getEnhancedFallback(text);
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
        const result = JSON.parse(resultText);
        // 🔥 PASTIKAN FIELD ADA
        return {
          vocabulary: result.vocabulary || [],
          kanji: result.kanji || [],
          grammar: result.grammar || [],
          translation: result.translation || `Terjemahan: "${text}"`
        };
      } catch (e) {
        console.error('JSON Parse Error, using fallback');
        return this.getEnhancedFallback(text);
      }
      
    } catch (error) {
      console.error('AI Error:', error);
      return this.getEnhancedFallback(text);
    }
  }

  // 🔥 ENHANCED FALLBACK - LEBIH PINTER
  private getEnhancedFallback(text: string): any {
    const vocabulary = [];
    const kanji = [];
    const grammar = [];

    // 🔥 KAMUS SEDERHANA
    const dictionary: Record<string, { reading: string; meaning: string }> = {
      '私': { reading: 'わたし', meaning: 'saya' },
      '学生': { reading: 'がくせい', meaning: 'pelajar/mahasiswa' },
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
      '時間': { reading: 'じかん', meaning: 'waktu' },
      '今日': { reading: 'きょう', meaning: 'hari ini' },
      '明日': { reading: 'あした', meaning: 'besok' },
      '昨日': { reading: 'きのう', meaning: 'kemarin' },
      '何': { reading: 'なに', meaning: 'apa' },
      '誰': { reading: 'だれ', meaning: 'siapa' },
      'どこ': { reading: 'どこ', meaning: 'di mana' },
      'いつ': { reading: 'いつ', meaning: 'kapan' },
      'なぜ': { reading: 'なぜ', meaning: 'mengapa' },
      'どう': { reading: 'どう', meaning: 'bagaimana' },
      'とても': { reading: 'とても', meaning: 'sangat' },
      'あまり': { reading: 'あまり', meaning: 'tidak terlalu' },
      'よく': { reading: 'よく', meaning: 'sering' },
      'ときどき': { reading: 'ときどき', meaning: 'kadang-kadang' },
      'いつも': { reading: 'いつも', meaning: 'selalu' },
      'そして': { reading: 'そして', meaning: 'dan' },
      'だから': { reading: 'だから', meaning: 'karena itu' },
      'でも': { reading: 'でも', meaning: 'tetapi' },
      'また': { reading: 'また', meaning: 'lagi' },
    };

    // 🔥 PARSE TEXT - ambil kata per kata
    const chars = text.replace(/\s/g, '').split('');
    let currentWord = '';
    let currentKanji = '';

    for (const char of chars) {
      // Kanji
      if (char.match(/[\u4E00-\u9FAF]/)) {
        currentKanji += char;
        currentWord += char;
      } 
      // Hiragana/Katakana
      else if (char.match(/[\u3040-\u30FF]/)) {
        if (currentKanji) {
          // Tambah kanji
          if (dictionary[currentKanji]) {
            kanji.push({
              character: currentKanji,
              onyomi: dictionary[currentKanji].reading,
              kunyomi: dictionary[currentKanji].reading,
              meaning: dictionary[currentKanji].meaning
            });
          }
          currentKanji = '';
        }
        currentWord += char;
      } 
      // Lainnya (partikel, tanda baca)
      else {
        if (currentWord) {
          // Coba cari di kamus
          const found = dictionary[currentWord];
          if (found) {
            vocabulary.push({
              word: currentWord,
              reading: found.reading,
              meaning: found.meaning
            });
          } else {
            // Coba deteksi partikel
            if (['は', 'が', 'を', 'に', 'で', 'へ', 'と', 'から', 'まで', 'の'].includes(currentWord)) {
              grammar.push({
                pattern: `〜${currentWord}`,
                meaning: `partikel ${currentWord}`,
                example_sentence: text
              });
            } else {
              vocabulary.push({
                word: currentWord,
                reading: currentWord,
                meaning: '...'
              });
            }
          }
          currentWord = '';
        }
      }
    }

    // 🔥 Tambah sisa kata
    if (currentWord) {
      const found = dictionary[currentWord];
      if (found) {
        vocabulary.push({
          word: currentWord,
          reading: found.reading,
          meaning: found.meaning
        });
      }
    }
    if (currentKanji && dictionary[currentKanji]) {
      kanji.push({
        character: currentKanji,
        onyomi: dictionary[currentKanji].reading,
        kunyomi: dictionary[currentKanji].reading,
        meaning: dictionary[currentKanji].meaning
      });
    }

    // 🔥 Deteksi grammar
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
      'の': 'partikel kepemilikan',
      'よね': 'partikel konfirmasi',
      'ね': 'partikel kesepakatan',
      'よ': 'partikel penekanan',
      'か': 'partikel pertanyaan'
    };

    for (const [pattern, meaning] of Object.entries(grammarPatterns)) {
      if (text.includes(pattern) && !grammar.find(g => g.pattern === `〜${pattern}`)) {
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
      translation: this.translateJapanese(text)
    };
  }

  // 🔥 TERJEMAHAN SEDERHANA
  private translateJapanese(text: string): string {
    // Coba translate sederhana
    let result = text;
    
    const translations: Record<string, string> = {
      '私は': 'saya',
      '学生です': 'adalah pelajar',
      'です': 'adalah',
      '勉強します': 'belajar',
      '日本語': 'bahasa Jepang',
      '毎日': 'setiap hari',
      '本を読みます': 'membaca buku',
      '学校に行きます': 'pergi ke sekolah',
      '食べます': 'makan',
      '飲みます': 'minum',
      '見ます': 'melihat',
      '行きます': 'pergi',
      '来ます': 'datang',
      '帰ります': 'pulang'
    };

    for (const [jp, id] of Object.entries(translations)) {
      if (text.includes(jp)) {
        result = text.replace(jp, id);
        break;
      }
    }

    return `Terjemahan: "${result}"`;
  }
}

export const aiService = new AIService();