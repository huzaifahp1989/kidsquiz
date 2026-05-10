export const MASJID_AL_AQSA_COMPETITION_KEY = 'masjid-al-aqsa-quiz-2026';
export const MASJID_AL_AQSA_MAX_MAIN_SCORE = 10;
export const MASJID_AL_AQSA_MAX_BONUS_SCORE = 5;
export const MASJID_AL_AQSA_MAX_TOTAL_SCORE = 15;
export const MASJID_AL_AQSA_TIMER_SECONDS = 1200;

export type CompetitionQuestion = {
  id: string;
  order: number;
  prompt: string;
  answerHint: string;
  reference: string;
  points: number;
  isBonus?: boolean;
};

export const MASJID_AL_AQSA_QUESTIONS: CompetitionQuestion[] = [
  {
    id: 'aqsa-q1',
    order: 1,
    prompt: 'Which surah of the Qur’an mentions the night journey to Masjid Al-Aqsa?',
    answerHint: 'Surah Al-Isra (Surah 17)',
    reference: 'Qur’an 17:1',
    points: 1,
  },
  {
    id: 'aqsa-q2',
    order: 2,
    prompt: 'Complete the ayah: “Glory be to the One Who took His servant by night from Al-Masjid Al-Haram to _________.”',
    answerHint: 'Al-Masjid Al-Aqsa',
    reference: 'Qur’an 17:1',
    points: 1,
  },
  {
    id: 'aqsa-q3',
    order: 3,
    prompt: 'Who led the Prophets in prayer at Masjid Al-Aqsa during Al-Isra wal-Mi‘raj?',
    answerHint: 'Prophet Muhammad ﷺ',
    reference: 'Reported in authentic narrations on Al-Isra wal-Mi‘raj',
    points: 1,
  },
  {
    id: 'aqsa-q4',
    order: 4,
    prompt: 'What was the first qiblah for the Muslims before the Ka‘bah?',
    answerHint: 'Masjid Al-Aqsa',
    reference: 'Sahih al-Bukhari',
    points: 1,
  },
  {
    id: 'aqsa-q5',
    order: 5,
    prompt: 'Which Prophet is strongly associated with rebuilding Masjid Al-Aqsa in its honored form?',
    answerHint: 'Prophet Sulayman عليه السلام',
    reference: 'Historical and tafsir narrations on Masjid Al-Aqsa',
    points: 1,
  },
  {
    id: 'aqsa-q6',
    order: 6,
    prompt: 'How many masajid are specifically mentioned in the hadith for which travelling is especially recommended?',
    answerHint: 'Three',
    reference: 'Sahih al-Bukhari and Sahih Muslim',
    points: 1,
  },
  {
    id: 'aqsa-q7',
    order: 7,
    prompt: 'What reward is mentioned in narrations for praying in Masjid Al-Aqsa compared to ordinary masajid?',
    answerHint: 'A multiplied reward; some narrations mention 500 prayers',
    reference: 'Various narrations on virtue of prayer in Masjid Al-Aqsa',
    points: 1,
  },
  {
    id: 'aqsa-q8',
    order: 8,
    prompt: 'Which Companion peacefully received Jerusalem during the Khilafah period?',
    answerHint: 'Umar ibn al-Khattab رضي الله عنه',
    reference: 'Early Islamic history and seerah',
    points: 1,
  },
  {
    id: 'aqsa-q9',
    order: 9,
    prompt: 'What is the Arabic meaning of the word “Al-Aqsa”?',
    answerHint: 'The Furthest',
    reference: 'Arabic language meaning',
    points: 1,
  },
  {
    id: 'aqsa-q10',
    order: 10,
    prompt: 'According to authentic hadith, which major event connected to the Prophet ﷺ took place involving Masjid Al-Aqsa?',
    answerHint: 'Al-Isra wal-Mi‘raj',
    reference: 'Sahih al-Bukhari and Sahih Muslim',
    points: 1,
  },
  {
    id: 'aqsa-bonus',
    order: 11,
    prompt: 'Explain why Masjid Al-Aqsa is important in Islam. Mention at least 3 virtues or historical events connected to it.',
    answerHint: 'Open written answer',
    reference: 'Bonus question for manual review',
    points: 5,
    isBonus: true,
  },
];

export const MASJID_AL_AQSA_MAIN_QUESTION_COUNT = MASJID_AL_AQSA_QUESTIONS.filter((question) => !question.isBonus).length;
export const MASJID_AL_AQSA_BONUS_QUESTION = MASJID_AL_AQSA_QUESTIONS.find((question) => question.isBonus) || null;

export type MasjidAlAqsaQuestion = (typeof MASJID_AL_AQSA_QUESTIONS)[number];

export type MasjidAlAqsaSubmission = {
  id: string;
  full_name: string;
  email: string;
  user_id: string | null;
  question_order: string[];
  answers: Record<string, string>;
  bonus_answer: string;
  time_taken_seconds: number;
  status: 'submitted' | 'reviewed' | 'approved' | 'rejected';
  question_marks: number[];
  bonus_marks: number;
  main_score: number;
  total_score: number;
  admin_notes: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
};

export function normalizeCompetitionAnswer(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function shuffleQuestions<T>(items: T[]) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
