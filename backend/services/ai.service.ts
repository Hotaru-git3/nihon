import { GoogleGenAI, Type, Schema } from '@google/genai';
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

Balas HANYA dalam format JSON (tanpa markdown, tanpa penjelasan).`;

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    vocabulary: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          reading: { type: Type.STRING },
          meaning: { type: Type.STRING },
          part_of_speech: { type: Type.STRING },
          jlpt_level: { type: Type.STRING }
        },
        required: ["word", "reading", "meaning"]
      }
    },
    kanji: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          character: { type: Type.STRING },
          onyomi: { type: Type.STRING },
          kunyomi: { type: Type.STRING },
          meaning: { type: Type.STRING },
          stroke_count: { type: Type.INTEGER },
          jlpt_level: { type: Type.STRING },
          example_words: { type: Type.STRING },
          example_sentence: { type: Type.STRING }
        },
        required: ["character", "meaning"]
      }
    },
    grammar: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          pattern: { type: Type.STRING },
          meaning: { type: Type.STRING },
          structure: { type: Type.STRING },
          example_sentence: { type: Type.STRING }
        },
        required: ["pattern", "meaning"]
      }
    },
    translation: { type: Type.STRING }
  },
  required: ["vocabulary", "kanji", "grammar", "translation"]
};

export class AIService {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not configured. AI features will fail.');
    }

    this.ai = new GoogleGenAI({
      apiKey: apiKey || 'dummy-key',
    });
  }

  async generateBreakdown(text: string): Promise<any> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Teks Jepang: ${text}`,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response from AI");
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