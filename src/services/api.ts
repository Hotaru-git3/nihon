// services/api.ts
import { DashboardStats, ReviewItem, PaginatedResponse, Vocabulary, Kanji, Grammar, AIBreakdownResult } from '../types';
import { db, auth } from '../firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

const BASE = '/api';

const getAuth = () => {
  if (!auth) throw new Error('Firebase auth not initialized');
  return auth;
};

// -- Auth --
export async function loginUser(data: any): Promise<any> {
  const email = data.email;
  try {
    const cred = await signInWithEmailAndPassword(getAuth(), email, data.password);
    const token = await cred.user.getIdToken();
    
    // 🔥 SAVE KE LOCALSTORAGE
    localStorage.setItem('token', token);
    localStorage.setItem('email', email);
    localStorage.setItem('user_display_name', email.split('@')[0]);
    
    return { token, email: data.email };
  } catch (error: any) {
    if (error.code === 'auth/invalid-credential') throw new Error('Email atau password salah.');
    if (error.code === 'auth/too-many-requests') throw new Error('Terlalu banyak percobaan. Coba lagi nanti.');
    throw new Error(error.message || 'Login gagal.');
  }
}

export async function registerUser(data: any): Promise<any> {
  const email = data.email;
  try {
    const cred = await createUserWithEmailAndPassword(getAuth(), email, data.password);
    const token = await cred.user.getIdToken();
    
    // 🔥 SAVE KE LOCALSTORAGE
    localStorage.setItem('token', token);
    localStorage.setItem('email', email);
    localStorage.setItem('user_display_name', email.split('@')[0]);
    
    return { token, email: data.email };
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') throw new Error('Email ini sudah terdaftar.');
    if (error.code === 'auth/weak-password') throw new Error('Password terlalu pendek (minimal 6 karakter).');
    if (error.code === 'auth/invalid-email') throw new Error('Format email tidak valid.');
    if (error.code === 'auth/admin-restricted-operation' || error.code === 'auth/operation-not-allowed') throw new Error('Fitur register belum diaktifkan (Email/Password Auth di Firebase).');
    throw new Error(error.message || 'Pendaftaran gagal.');
  }
}

// services/api.ts - bagian logout
export async function logoutUser() {
  await signOut(getAuth());
  localStorage.removeItem('token');
  localStorage.removeItem('email');
  localStorage.removeItem('user_display_name');
  
  // 🔥 Redirect ke login
  window.location.href = '/login';
}

// -- Firestore Helpers --
const getUserRef = () => {
  if (!db) throw new Error('Firebase db not initialized');
  if (!auth?.currentUser) throw new Error('Not authenticated');
  return doc(db, 'users', auth.currentUser.uid);
};

// -- Dashboard --
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const userRef = getUserRef();
  const logsSnap = await getDocs(collection(userRef, 'study_log'));
  let totalVocab = 0, totalKanji = 0, totalGrammar = 0;
  const now = new Date().toISOString().split('T')[0];
  let todayReviewCount = 0;
  let masteredVocab = 0, masteredKanji = 0, masteredGrammar = 0;

  logsSnap.forEach(d => {
    const data = d.data();
    if (data.item_type === 'vocabulary') {
      totalVocab++;
      if (data.ease_factor >= 2.5 && data.interval_days > 21) masteredVocab++;
    }
    if (data.item_type === 'kanji') {
      totalKanji++;
      if (data.ease_factor >= 2.5 && data.interval_days > 21) masteredKanji++;
    }
    if (data.item_type === 'grammar') {
      totalGrammar++;
      if (data.ease_factor >= 2.5 && data.interval_days > 21) masteredGrammar++;
    }
    if (data.next_review && data.next_review <= now) todayReviewCount++;
  });

  return {
    streak: 0,
    total_vocab: totalVocab,
    total_kanji: totalKanji,
    total_grammar: totalGrammar,
    due_today: todayReviewCount,
    reviewed_today: 0,
    added_today: 0,
    weekly_activity: [],
    progress: {
      mastered_vocab: masteredVocab,
      mastered_kanji: masteredKanji,
      mastered_grammar: masteredGrammar,
    },
    achievements: {
      early_bird: false,
      night_owl: false,
      vocab_master: masteredVocab >= 100,
      kanji_master: masteredKanji >= 50,
      grammar_master: masteredGrammar >= 50,
      streak_7: false,
      streak_30: false,
      ai_enthusiast: false,
      n1_hero: false
    },
    recently_added: [],
    ai_breakdowns_today: 0
  };
}

// -- Review --
export async function fetchTodayReview(): Promise<ReviewItem[]> {
  const userRef = getUserRef();
  const logsSnap = await getDocs(collection(userRef, 'study_log'));
  const now = new Date().toISOString().split('T')[0];
  
  const items: ReviewItem[] = [];
  
  for (const logDoc of logsSnap.docs) {
    const logData = logDoc.data();
    if (logData.next_review && logData.next_review <= now) {
      const itemSnap = await getDoc(doc(userRef, logData.item_type, logData.item_id));
      if (itemSnap.exists()) {
        const itemData = itemSnap.data();
        let front = '', back = '', reading = '', example = '';
        if (logData.item_type === 'vocabulary') {
          front = itemData.word; back = itemData.meaning; reading = itemData.reading; example = itemData.example_sentence;
        } else if (logData.item_type === 'kanji') {
          front = itemData.character; back = itemData.meaning; reading = `${itemData.onyomi} / ${itemData.kunyomi}`; example = itemData.mnemonic;
        } else {
          front = itemData.pattern; back = itemData.meaning; reading = itemData.structure; example = itemData.example_sentence;
        }
        
        items.push({
          log_id: logDoc.id,
          item_type: logData.item_type as any,
          item_id: logData.item_id,
          ease_factor: logData.ease_factor,
          interval_days: logData.interval_days,
          repetitions: logData.repetitions,
          front, back, reading, example, extra: logData.item_type
        });
      }
    }
  }
  return items;
}

export async function fetchRandomReview(): Promise<ReviewItem[]> {
  return fetchTodayReview();
}

export async function submitRating(logId: string, quality: number): Promise<void> {
  const userRef = getUserRef();
  const logRef = doc(userRef, 'study_log', logId);
  const logSnap = await getDoc(logRef);
  if (!logSnap.exists()) return;
  
  let { ease_factor, interval_days, repetitions } = logSnap.data();
  let new_ease, new_interval, new_reps;

  if (quality < 3) {
    new_ease = 2.5; new_interval = 1; new_reps = 0;
  } else {
    if (repetitions === 0) new_interval = 1;
    else if (repetitions === 1) new_interval = 3;
    else new_interval = Math.round(interval_days * ease_factor);
    new_ease = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (new_ease < 1.3) new_ease = 1.3;
    new_reps = repetitions + 1;
  }

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + new_interval);
  
  await updateDoc(logRef, {
    ease_factor: new_ease,
    interval_days: new_interval,
    repetitions: new_reps,
    next_review: nextDate.toISOString().split('T')[0],
    last_reviewed: new Date().toISOString().split('T')[0],
    response_quality: quality
  });
}

// -- Generic CRUD --
async function fetchPaginated<T>(colName: string, page: number, search: string, jlpt: string): Promise<PaginatedResponse<T>> {
  const userRef = getUserRef();
  const snap = await getDocs(collection(userRef, colName));
  let items = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  
  if (jlpt) items = items.filter(i => i.jlpt_level === jlpt);
  if (search) {
    const s = search.toLowerCase();
    items = items.filter(i => 
      (i.word && i.word.toLowerCase().includes(s)) || 
      (i.character && i.character.toLowerCase().includes(s)) ||
      (i.pattern && i.pattern.toLowerCase().includes(s)) ||
      (i.meaning && i.meaning.toLowerCase().includes(s))
    );
  }
  
  const limit = 10;
  const total = items.length;
  const start = (page - 1) * limit;
  const paginated = items.slice(start, start + limit);
  
  return {
    data: paginated,
    total,
    page,
    per_page: limit,
    total_pages: Math.ceil(total / limit)
  };
}

async function createItem(colName: string, data: any) {
  const userRef = getUserRef();
  const docRef = await addDoc(collection(userRef, colName), { ...data, created_at: new Date().toISOString() });
  
  await addDoc(collection(userRef, 'study_log'), {
    item_type: colName,
    item_id: docRef.id,
    ease_factor: 2.5,
    interval_days: 0,
    repetitions: 0,
    next_review: new Date().toISOString().split('T')[0]
  });
  return { id: docRef.id, ...data };
}

async function updateItem(colName: string, id: string, data: any) {
  const ref = doc(getUserRef(), colName, id);
  await updateDoc(ref, { ...data, updated_at: new Date().toISOString() });
  return { id, ...data };
}

async function deleteItem(colName: string, id: string) {
  const userRef = getUserRef();
  await deleteDoc(doc(userRef, colName, id));
  
  const logsSnap = await getDocs(query(collection(userRef, 'study_log'), where('item_id', '==', id)));
  for (const d of logsSnap.docs) {
    await deleteDoc(d.ref);
  }
}

// -- Vocabulary --
export const fetchVocabulary = (p=1, s='', j='') => fetchPaginated<Vocabulary>('vocabulary', p, s, j);
export const createVocabulary = (d: any) => createItem('vocabulary', d);
export const updateVocabulary = (id: any, d: any) => updateItem('vocabulary', id, d);
export const deleteVocabulary = (id: any) => deleteItem('vocabulary', id);

// -- Kanji --
export const fetchKanji = (p=1, s='', j='') => fetchPaginated<Kanji>('kanji', p, s, j);
export const createKanji = (d: any) => createItem('kanji', d);
export const updateKanji = (id: any, d: any) => updateItem('kanji', id, d);
export const deleteKanji = (id: any) => deleteItem('kanji', id);

// -- Grammar --
export const fetchGrammar = (p=1, s='', j='') => fetchPaginated<Grammar>('grammar', p, s, j);
export const createGrammar = (d: any) => createItem('grammar', d);
export const updateGrammar = (id: any, d: any) => updateItem('grammar', id, d);
export const deleteGrammar = (id: any) => deleteItem('grammar', id);

// -- AI --
export async function analyzeText(text: string): Promise<AIBreakdownResult> {
  const user = auth?.currentUser;
  const token = user ? await user.getIdToken() : '';
  const res = await fetch(`${BASE}/ai/breakdown`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ text })
  });
  if (!res.ok) throw new Error('AI request failed');
  return res.json();
}

export async function saveFromAI(item: any, type: string): Promise<void> {
  await createItem(type, item);
}