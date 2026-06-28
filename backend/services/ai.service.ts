// backend/services/ai.service.ts
import dotenv from 'dotenv';

dotenv.config();

const SYSTEM_PROMPT = `Kamu adalah guru bahasa Jepang ahli. Untuk teks Jepang yang diberikan, ekstrak:

1. **Kosakata**: Semua kata dengan "word", "reading" (hiragana), "meaning" (dalam BAHASA INDONESIA)
2. **Kanji**: Setiap karakter kanji dengan "character", "onyomi" (katakana), "kunyomi" (hiragana), "meaning" (dalam BAHASA INDONESIA)
3. **Tata Bahasa**: Pola grammar dengan "pattern", "meaning" (dalam BAHASA INDONESIA), "example_sentence"
4. **Translation**: Terjemahan utuh ke BAHASA INDONESIA

BALAS HANYA JSON (tanpa markdown, tanpa penjelasan):
{
  "vocabulary": [{"word": "...", "reading": "...", "meaning": "..."}],
  "kanji": [{"character": "...", "onyomi": "...", "kunyomi": "...", "meaning": "..."}],
  "grammar": [{"pattern": "...", "meaning": "...", "example_sentence": "..."}],
  "translation": "..."
}

JANGAN ADA ARRAY KOSONG. Jika tidak ada data, isi array kosong [].

Contoh untuk "私は学生です":
{
  "vocabulary": [
    {"word": "私", "reading": "わたし", "meaning": "saya"},
    {"word": "学生", "reading": "がくせい", "meaning": "pelajar/mahasiswa"}
  ],
  "kanji": [
    {"character": "私", "onyomi": "シ", "kunyomi": "わたし", "meaning": "saya/pribadi"},
    {"character": "学生", "onyomi": "ガクセイ", "kunyomi": "まなぶ", "meaning": "pelajar/mahasiswa"}
  ],
  "grammar": [
    {"pattern": "〜です", "meaning": "adalah (bentuk sopan)", "example_sentence": "私は学生です"},
    {"pattern": "〜は", "meaning": "partikel topik", "example_sentence": "私は"}
  ],
  "translation": "Saya adalah pelajar/mahasiswa"
}`;

export class AIService {
  private apiKey: string;

  constructor() {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      throw new Error('NVIDIA_API_KEY is not configured');
    }
    this.apiKey = apiKey;
    console.log('✅ NVIDIA API Key loaded');
  }

  async generateBreakdown(text: string): Promise<any> {
    console.log('📝 Calling NVIDIA API for:', text);
    
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
            { role: 'user', content: `Teks Jepang: "${text}"` }
          ],
          temperature: 0.05,
          max_tokens: 2048
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ NVIDIA API Error:', response.status, errorText);
        throw new Error(`NVIDIA API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ NVIDIA API Response received');

      let resultText = data.choices?.[0]?.message?.content || '';
      console.log('📄 Raw response:', resultText);

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
        console.log('✅ Parsed result:', JSON.stringify(result, null, 2));
        
        // Pastikan semua field ada
        return {
          vocabulary: result.vocabulary || [],
          kanji: result.kanji || [],
          grammar: result.grammar || [],
          translation: result.translation || `Terjemahan: "${text}"`
        };
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError);
        console.error('Raw text:', resultText);
        throw new Error('Invalid JSON response from AI');
      }

    } catch (error: any) {
      console.error('❌ AI Service Error:', error.message);
      throw new Error(`AI service error: ${error.message}`);
    }
  }
}

export const aiService = new AIService();