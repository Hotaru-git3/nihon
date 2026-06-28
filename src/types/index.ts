export interface Vocabulary {
  id?: string | number;
  word: string;
  reading: string;
  meaning: string;
  part_of_speech?: string;
  jlpt_level?: string;
  example_sentence?: string;
  created_at?: string;
}

export interface Kanji {
  id?: string | number;
  character: string;
  onyomi?: string;
  kunyomi?: string;
  meaning: string;
  stroke_count?: number;
  jlpt_level?: string;
  mnemonic?: string;
  example_words?: string;
  example_sentence?: string;
}

export interface Grammar {
  id?: string | number;
  pattern: string;
  meaning: string;
  structure?: string;
  example_sentence?: string;
  jlpt_level?: string;
}

export interface ReviewItem {
  log_id: string;
  item_type: 'vocabulary' | 'kanji' | 'grammar';
  item_id: string;
  front: string;
  back: string;
  extra?: string;
  reading?: string;
  example?: string;
  example_words?: string;
  example_sentence?: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
}

export interface AIBreakdownResult {
  vocabulary: Vocabulary[];
  kanji: Kanji[];
  grammar: Grammar[];
  translation: string;
}

export interface DashboardStats {
  streak: number;
  total_vocab: number;
  total_kanji: number;
  total_grammar: number;
  due_today: number;
  reviewed_today: number;
  added_today: number;
  ai_breakdowns_today?: number;
  weekly_activity: { date: string; count: number }[];
  recently_added?: { type: string; text: string; subtext: string; created_at: string }[];
  progress?: {
    mastered_vocab: number;
    mastered_kanji: number;
    mastered_grammar: number;
  };
  achievements?: {
    early_bird: boolean;
    night_owl: boolean;
    vocab_master: boolean;
    grammar_master: boolean;
    ai_enthusiast: boolean;
    kanji_master: boolean;
    streak_7: boolean;
    streak_30: boolean;
    n1_hero: boolean;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
