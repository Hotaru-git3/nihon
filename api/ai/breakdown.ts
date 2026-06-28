import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// ========================================
// FIREBASE ADMIN INIT
// ========================================
if (!getApps().length) {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      initializeApp({
        credential: cert(config),
        projectId: config.projectId,
      });
      console.log('✅ Firebase Admin initialized with config file');
    } else {
      initializeApp({
        projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
      });
      console.log('✅ Firebase Admin initialized with project ID');
    }
  } catch (err) {
    console.warn('⚠️ Firebase Admin init warning:', err);
    if (!getApps().length) {
      initializeApp();
      console.log('✅ Firebase Admin initialized with default credentials');
    }
  }
}

// ========================================
// NVIDIA CONFIG
// ========================================
const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const NVIDIA_MODEL = 'google/gemma-3-27b-it';

// ========================================
// SYSTEM PROMPT
// ========================================
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

// ========================================
// JSON SCHEMA
// ========================================
const JSON_SCHEMA = {
  type: "json_object" as const,
  schema: {
    type: "object" as const,
    properties: {
      vocabulary: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            word: { type: "string" as const },
            reading: { type: "string" as const },
            meaning: { type: "string" as const },
            part_of_speech: { type: "string" as const },
            jlpt_level: { type: "string" as const }
          },
          required: ["word", "reading", "meaning"]
        }
      },
      kanji: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            character: { type: "string" as const },
            onyomi: { type: "string" as const },
            kunyomi: { type: "string" as const },
            meaning: { type: "string" as const },
            stroke_count: { type: "integer" as const },
            jlpt_level: { type: "string" as const },
            example_words: { type: "string" as const },
            example_sentence: { type: "string" as const }
          },
          required: ["character", "meaning"]
        }
      },
      grammar: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            pattern: { type: "string" as const },
            meaning: { type: "string" as const },
            structure: { type: "string" as const },
            example_sentence: { type: "string" as const }
          },
          required: ["pattern", "meaning"]
        }
      },
      translation: { type: "string" as const }
    },
    required: ["vocabulary", "kanji", "grammar", "translation"]
  }
};

// ========================================
// MAIN HANDLER
// ========================================
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only POST allowed
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ========================================
  // AUTHENTICATION
  // ========================================
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized - No token provided' });
  }
  
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    console.log(`✅ Authenticated user: ${decodedToken.uid}`);
  } catch (error: any) {
    console.error('❌ Token verification failed:', error.message);
    return res.status(403).json({ error: 'Forbidden: Invalid token' });
  }

  // ========================================
  // INPUT VALIDATION
  // ========================================
  try {
    const { text } = req.body;
    
    // Type check
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: "Invalid input type. 'text' must be a string." });
    }
    
    // Sanitize & length check
    const sanitizedText = text.trim();
    if (sanitizedText.length === 0) {
      return res.status(400).json({ error: "Text cannot be empty." });
    }
    if (sanitizedText.length > 500) {
      return res.status(400).json({ error: "Text must be between 1 and 500 characters." });
    }

    // ========================================
    // CALL NVIDIA API
    // ========================================
    console.log(`🤖 Processing text: "${sanitizedText.substring(0, 50)}..."`);

    const nvidiaResponse = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Teks Jepang: ${sanitizedText}` }
        ],
        temperature: 0.1,
        response_format: JSON_SCHEMA,
        max_tokens: 2000,
      }),
    });

    if (!nvidiaResponse.ok) {
      const errorText = await nvidiaResponse.text();
      console.error('❌ Nvidia API error:', nvidiaResponse.status, errorText);
      throw new Error(`Nvidia API returned ${nvidiaResponse.status}: ${errorText}`);
    }

    const data = await nvidiaResponse.json();
    console.log('✅ Nvidia API response received');

    // Extract content from response
    const resultText = data.choices?.[0]?.message?.content;
    
    if (!resultText) {
      console.error('❌ Empty content in response:', JSON.stringify(data));
      throw new Error("Empty response from AI");
    }

    // ========================================
    // PARSE & RETURN JSON
    // ========================================
    try {
      const parsed = JSON.parse(resultText);
      
      // Validate required fields
      if (!parsed.vocabulary || !parsed.kanji || !parsed.grammar || !parsed.translation) {
        throw new Error("Response missing required fields");
      }

      console.log('✅ Successfully parsed AI response');
      return res.json(parsed);

    } catch (parseError: any) {
      console.error('❌ Failed to parse JSON. Raw output:', resultText);
      return res.status(500).json({ 
        error: "Invalid JSON response from AI",
        raw: resultText.substring(0, 200) // Send partial for debugging
      });
    }

  } catch (err: any) {
    console.error('❌ AI API Error:', err.message);
    return res.status(500).json({ 
      error: "An error occurred while processing the request.",
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}