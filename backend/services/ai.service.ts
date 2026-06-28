import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const SYSTEM_PROMPT = `Kamu adalah guru bahasa Jepang ahli yang SANGAT KETAT dan FAKTUAL. 
Untuk teks Jepang yang diberikan, ekstrak detail berikut dengan akurasi 100%.

SANGAT PENTING (ATURAN KETAT): 
- DILARANG KERAS berhalusinasi atau mengarang arti kata/kanji. 
- Terjemahan utuh, arti kosakata (meaning), arti kanji, dan arti tata bahasa HARUS SELALU dalam Bahasa Indonesia.
- Terjemahan, cara baca (romaji/hiragana), dan arti HARUS valid sesuai kamus bahasa Jepang asli. 
- Jika input teks tidak masuk akal (misal salah ketik, karakter Mandarin/Hanzi yang bukan kanji Jepang, atau karakter acak), abaikan saja. JANGAN mencoba menebak arti yang salah (seperti mengartikan 邮 sebagai minum). Lebih baik kembalikan array kosong jika tidak ada arti yang valid.

1. Semua kosakata (kecuali partikel dan kata level N5 paling dasar). Field "meaning" wajib dalam Bahasa Indonesia.
2. Semua kanji yang muncul. Untuk kanji sertakan contoh kalimat singkat yang menggunakannya, dan juga contoh gabungan kata (elemen pendukung) yang menggunakan kanji tersebut beserta artinya (misal: "銀行 (ginkou) - bank"). Field "meaning" wajib dalam Bahasa Indonesia.
3. Semua pola tata bahasa. Field "meaning" wajib dalam Bahasa Indonesia.
4. Terjemahan utuh ke Bahasa Indonesia.

Pastikan field "word", "character", "pattern" dan lainnya TIDAK BOLEH KOSONG. Jika tidak ada data yang relevan (misalnya tidak ada kanji atau tidak ada tata bahasa), hapus dari array (kembalikan array kosong []).

Balas HANYA dalam format JSON (tanpa markdown, tanpa penjelasan):
{
  "vocabulary": [{"word": "kata", "reading": "cara baca", "meaning": "arti", "part_of_speech": "jenis kata", "jlpt_level": "N5"}],
  "kanji": [{"character": "kanji", "onyomi": "onyomi", "kunyomi": "kunyomi", "meaning": "arti", "stroke_count": 0, "jlpt_level": "N5", "example_words": "contoh kata", "example_sentence": "contoh kalimat"}],
  "grammar": [{"pattern": "pola", "meaning": "arti", "structure": "struktur", "example_sentence": "contoh kalimat"}],
  "translation": "terjemahan"
}`;

export class AIService {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      throw new Error('NVIDIA_API_KEY is not configured');
    }

    this.openai = new OpenAI({
      baseURL: 'https://integrate.api.nvidia.com/v1',
      apiKey: apiKey,
    });
  }

  async generateBreakdown(text: string): Promise<any> {
    const response = await this.openai.chat.completions.create({
      model: 'meta/llama-3.1-8b-instruct',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Teks Jepang: ${text}` },
      ],
      temperature: 0.05,
      top_p: 0.5,
      max_tokens: 2048,
      stream: false,
    });

    let resultText = response.choices[0]?.message?.content || '';
    resultText = resultText.trim();
    if (resultText.startsWith('\`\`\`')) {
      resultText = resultText.replace(/^\`\`\`(json)?/, '').replace(/\`\`\`$/, '').trim();
    }

    const firstBrace = resultText.indexOf('{');
    const lastBrace = resultText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      resultText = resultText.substring(firstBrace, lastBrace + 1);
    }
    
    try {
      return JSON.parse(resultText);
    } catch (e) {
      console.error("Failed to parse JSON. Raw output:", resultText);
      throw new Error("Invalid JSON response from AI");
    }
  }
}

export const aiService = new AIService();
