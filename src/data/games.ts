// Centralized data pools and helpers for Islamic educational games.
// All content is randomized at runtime by the games page.

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Option {
  id: string;
  text: string;
  correct?: boolean;
}

export interface BaseTask {
  id: string;
  prompt: string;
  options: Option[];
  correctOptionId: string;
  points: number;
  meta?: Record<string, any>;
}

export interface WordSearchConfig {
  wordPool: string[];
  count: number;
  minSize: number;
  maxSize: number;
  followUp?: BaseTask[];
  conceptual?: {
    choices: BaseTask[];
  };
}

export const seerahWordSearch: WordSearchConfig = {
  wordPool: [
    'MAKKAH',
    'MADINAH',
    'HIJRAH',
    'ABUBAKR',
    'KHADIJAH',
    'QURAISH',
    'CAVETHAWR',
    'RASOOL',
    'SUFFAH',
    'BOYCOTT',
    'TAAIF',
    'HUDAYBIYAH',
    'BATTLEBADR',
    'UHAD',
    'AHZAB',
    'ANSAR',
    'MUHAJIROON',
    'ISRA',
    'MIRAJ',
    'AQABAH',
    'TRENCH',
    'FATAH',
  ],
  count: 8,
  minSize: 10,
  maxSize: 14,
  followUp: [
    {
      id: 'seerah-follow-1',
      prompt: 'Which event happened after the Hijrah?',
      points: 4,
      options: [
        { id: 'h1', text: 'Building Masjid Nabawi' },
        { id: 'h2', text: 'First Revelation in Cave Hira' },
        { id: 'h3', text: 'Year of Sorrow' },
        { id: 'h4', text: 'Battle of Badr' },
      ],
      correctOptionId: 'h1',
    },
    {
      id: 'seerah-follow-2',
      prompt: 'Which pact allowed Muslims to return the next year?',
      points: 4,
      options: [
        { id: 'f1', text: 'Treaty of Hudaybiyah' },
        { id: 'f2', text: 'Battle of Uhud' },
        { id: 'f3', text: 'Battle of Badr' },
        { id: 'f4', text: 'Boycott in Makkah' },
      ],
      correctOptionId: 'f1',
    },
    {
      id: 'seerah-follow-3',
      prompt: 'Who were the Ansar?',
      points: 4,
      options: [
        { id: 'a1', text: 'The Muslims of Madinah who helped' },
        { id: 'a2', text: 'The people of Makkah' },
        { id: 'a3', text: 'The travelers' },
        { id: 'a4', text: 'The enemies in Badr' },
      ],
      correctOptionId: 'a1',
    },
    {
      id: 'seerah-follow-4',
      prompt: 'What was the trench dug for?',
      points: 4,
      options: [
        { id: 't1', text: 'Battle of Ahzab (Trench)' },
        { id: 't2', text: 'Battle of Badr' },
        { id: 't3', text: 'Building a Masjid' },
        { id: 't4', text: 'Planting trees' },
      ],
      correctOptionId: 't1',
    },
  ],
};

export const quranWordSearch: WordSearchConfig = {
  wordPool: [
    'QURAN',
    'SURAH',
    'AYAH',
    'TAFSIR',
    'TAJWID',
    'MAKKI',
    'MADANI',
    'HIFZ',
    'WAHY',
    'JUZ',
    'MANZIL',
    'QIRAAT',
    'RUKU',
    'SAJDAH',
    'BASMALAH',
    'FATIHAH',
  ],
  count: 8,
  minSize: 10,
  maxSize: 14,
  conceptual: {
    choices: [
      {
        id: 'q-concept-1',
        prompt: 'You found "Makki". What does it relate to?',
        points: 3,
        options: [
          { id: 'qc1', text: 'Surahs revealed before Hijrah' },
          { id: 'qc2', text: 'Surahs revealed after Hijrah' },
          { id: 'qc3', text: 'Rules of Tajwid' },
          { id: 'qc4', text: 'Number of ayat in a surah' },
        ],
        correctOptionId: 'qc1',
      },
      {
        id: 'q-concept-2',
        prompt: 'You found "Tajwid". What does it relate to?',
        points: 3,
        options: [
          { id: 'qd1', text: 'Rules of Quranic recitation' },
          { id: 'qd2', text: 'Counting ayat' },
          { id: 'qd3', text: 'Memorizing surahs' },
          { id: 'qd4', text: 'Translation methods' },
        ],
        correctOptionId: 'qd1',
      },
      {
        id: 'q-concept-3',
        prompt: 'What is a "Juz"?',
        points: 3,
        options: [
          { id: 'qe1', text: 'One of the 30 parts of the Quran' },
          { id: 'qe2', text: 'A small surah' },
          { id: 'qe3', text: 'A type of prayer' },
          { id: 'qe4', text: 'A prophet name' },
        ],
        correctOptionId: 'qe1',
      },
      {
        id: 'q-concept-4',
        prompt: 'What does "Hifz" mean?',
        points: 3,
        options: [
          { id: 'qf1', text: 'Memorization of the Quran' },
          { id: 'qf2', text: 'Reading from a book' },
          { id: 'qf3', text: 'Writing the Quran' },
          { id: 'qf4', text: 'Understanding Arabic' },
        ],
        correctOptionId: 'qf1',
      },
    ],
  },
};

export const hadithMeaningPool = [
  {
    id: 'h-actions-intentions',
    text: 'Actions are by intentions',
    correctActions: ['making-intention'],
  },
  {
    id: 'h-smile',
    text: 'Smiling is charity',
    correctActions: ['helping-sibling', 'showing-kindness'],
  },
  {
    id: 'h-remove-harm',
    text: 'Remove harm from the path',
    correctActions: ['cleaning-masjid', 'clearing-path'],
  },
  {
    id: 'h-consistent',
    text: 'Best deeds are those done consistently',
    correctActions: ['regular-small-deeds', 'daily-quran'],
  },
  {
    id: 'h-gentleness',
    text: 'Allah loves gentleness',
    correctActions: ['be-gentle', 'soft-speech'],
  },
  {
    id: 'h-honesty',
    text: 'Truthfulness leads to piety',
    correctActions: ['telling-truth', 'admitting-mistake'],
  },
  {
    id: 'h-parents',
    text: 'Paradise lies at the feet of mothers',
    correctActions: ['serving-mom', 'respecting-parents'],
  },
  {
    id: 'h-cleanliness',
    text: 'Cleanliness is half of faith',
    correctActions: ['washing-hands', 'wudu-properly'],
  },
];

export const hadithActionsPool = [
  { id: 'helping-sibling', text: 'Helping a sibling with homework' },
  { id: 'showing-kindness', text: 'Smiling and greeting kindly' },
  { id: 'cleaning-masjid', text: 'Cleaning the masjid entrance' },
  { id: 'clearing-path', text: 'Removing a rock from the walkway' },
  { id: 'making-intention', text: 'Making intention before doing an action' },
  { id: 'being-rough', text: 'Speaking harshly to others' },
  { id: 'regular-small-deeds', text: 'Doing a small good deed daily' },
  { id: 'daily-quran', text: 'Reading a page of Quran every day' },
  { id: 'ignoring-others', text: 'Ignoring someone who needs help' },
  { id: 'being-patient', text: 'Showing patience when annoyed' },
  { id: 'rushing-prayer', text: 'Rushing prayer to finish quickly' },
  { id: 'rough-play', text: 'Being rough during play' },
  { id: 'be-gentle', text: 'Responding with gentleness' },
  { id: 'soft-speech', text: 'Lowering your voice kindly' },
  { id: 'telling-truth', text: 'Telling the truth even if scared' },
  { id: 'admitting-mistake', text: 'Admitting a mistake honestly' },
  { id: 'serving-mom', text: 'Helping mother with chores' },
  { id: 'respecting-parents', text: 'Speaking politely to parents' },
  { id: 'washing-hands', text: 'Washing hands before eating' },
  { id: 'wudu-properly', text: 'Performing wudu with care' },
];

export const hadithScenarioPool = [
  {
    id: 'anger-control',
    scenario: 'You are angry but choose to stay quiet and breathe.',
    correct: 'Control of anger',
    options: [
      'Strength is anger',
      'Control of anger',
      'Loud speech',
      'Winning arguments',
    ],
  },
  {
    id: 'honesty',
    scenario: 'You forgot to return a book and decide to be honest.',
    correct: 'Truthfulness',
    options: ['Hiding the truth', 'Truthfulness', 'Blaming others', 'Delaying honesty'],
  },
  {
    id: 'mercy',
    scenario: 'You forgive someone who bumped into you.',
    correct: 'Mercy',
    options: ['Revenge', 'Mercy', 'Shouting back', 'Ignoring kindly'],
  },
  {
    id: 'patience',
    scenario: 'You wait calmly in a long line.',
    correct: 'Patience',
    options: ['Complaining', 'Patience', 'Pushing ahead', 'Leaving angry'],
  },
  {
    id: 'intention',
    scenario: 'You start homework by saying Bismillah and set a good intention.',
    correct: 'Actions by intentions',
    options: [
      'Do it for praise',
      'No intention needed',
      'Actions by intentions',
      'Do it fast only',
    ],
  },
  {
    id: 'sharing',
    scenario: 'You share your toys with a friend who has none.',
    correct: 'Generosity',
    options: ['Generosity', 'Showing off', 'Keeping everything', 'Wastefulness'],
  },
  {
    id: 'neighbor',
    scenario: 'You send some food to your neighbor.',
    correct: 'Rights of neighbors',
    options: ['Rights of neighbors', 'Wasting food', 'Asking for favor', 'Ignoring them'],
  },
];

export const wuduFixerPool = [
  {
    id: 'order-head-feet',
    prompt: 'Ahmad washed his feet before wiping his head.',
    correct: 'Incorrect (Fix order)',
    options: ['Correct', 'Incorrect (Fix order)', 'Skip wiping head'],
  },
  {
    id: 'missing-intention',
    prompt: 'Sara made wudu quickly without intention.',
    correct: 'Incorrect (Missing intention)',
    options: ['Correct', 'Incorrect (Missing intention)', 'Add extra washes'],
  },
  {
    id: 'skipped-arm',
    prompt: 'Ali washed face and feet but skipped his arms.',
    correct: 'Incorrect (Skipped arm)',
    options: ['Correct', 'Incorrect (Skipped arm)', 'Order is wrong'],
  },
  {
    id: 'extra-steps',
    prompt: 'Fatimah washed each part five times.',
    correct: 'Makrooh (Too many times)',
    options: ['Correct', 'Makrooh (Too many times)', 'Nullifies wudu'],
  },
  {
    id: 'conserve-water',
    prompt: 'Hamza left the tap running the whole time.',
    correct: 'Makrooh (Waste of water)',
    options: ['Correct', 'Makrooh (Waste of water)', 'Farḍ to waste less'],
  },
  {
    id: 'missed-heel',
    prompt: 'Zaid washed his feet but left his heels dry.',
    correct: 'Incorrect (Invalid wudu)',
    options: ['Correct', 'Incorrect (Invalid wudu)', 'Makrooh'],
  },
];

export const halalHaramPool = [
  {
    id: 'delay-salah',
    prompt: 'Delaying salah until the last minute without reason.',
    correct: 'Makrooh',
    options: ['Halal', 'Haram', 'Makrooh'],
  },
  {
    id: 'doubtful-food',
    prompt: 'Eating doubtful food when halal is available.',
    correct: 'Makrooh',
    options: ['Halal', 'Haram', 'Makrooh'],
  },
  {
    id: 'helping-parents',
    prompt: 'Helping parents late at night even if tired.',
    correct: 'Halal',
    options: ['Halal', 'Haram', 'Makrooh'],
  },
  {
    id: 'lying-joke',
    prompt: 'Lying as a joke.',
    correct: 'Haram',
    options: ['Halal', 'Haram', 'Makrooh'],
  },
  {
    id: 'water-waste',
    prompt: 'Using water excessively in wudu.',
    correct: 'Makrooh',
    options: ['Halal', 'Haram', 'Makrooh'],
  },
  {
    id: 'backbiting',
    prompt: 'Talking bad about someone behind their back.',
    correct: 'Haram',
    options: ['Halal', 'Haram', 'Makrooh'],
  },
  {
    id: 'siwak',
    prompt: 'Using Siwak (Miswak) to clean teeth.',
    correct: 'Halal',
    options: ['Halal', 'Haram', 'Makrooh'],
  },
];

export const sahabahTimeline = [
  {
    id: 'abu-bakr',
    name: 'Abu Bakr (RA)',
    events: [
      'Accepted Islam early',
      'Faced persecution in Makkah',
      'Migrated to Madinah with the Prophet ﷺ',
      'Supported the Prophet ﷺ in battles',
    ],
  },
  {
    id: 'umar',
    name: 'Umar (RA)',
    events: [
      'Accepted Islam boldly',
      'Protected Muslims in public prayer',
      'Migrated to Madinah openly',
      'Served as a just leader',
    ],
  },
  {
    id: 'uthman',
    name: 'Uthman (RA)',
    events: [
      'Married two daughters of the Prophet ﷺ',
      'Migrated to Abyssinia',
      'Compiled the Quran',
      'Was known for modesty (Haya)',
    ],
  },
  {
    id: 'ali',
    name: 'Ali (RA)',
    events: [
      'Accepted Islam as a child',
      'Slept in Prophet’s ﷺ bed during Hijrah',
      'Hero of Khaybar',
      'Married Fatimah (RA)',
    ],
  },
  {
    id: 'bilal',
    name: 'Bilal (RA)',
    events: [
      'Accepted Islam as a slave',
      'Endured torture for saying “Ahad”',
      'Freed by Abu Bakr (RA)',
      'Called the Adhan in Madinah',
    ],
  },
  {
    id: 'musab',
    name: 'Mus’ab ibn Umair (RA)',
    events: [
      'Accepted Islam in Makkah',
      'Faced family opposition',
      'Became teacher in Madinah',
      'Carried the banner at Uhud',
    ],
  },
];

export const sahabahDecisionScenarios = [
  {
    id: 'bilal-firm',
    prompt: "You are Bilal (RA) being tortured for saying 'Ahad'.",
    correct: 'Stay firm saying “Ahad”',
    options: [
      'Give up to stop pain',
      'Stay firm saying “Ahad”',
      'Argue loudly',
      'Run away',
    ],
  },
  {
    id: 'umar-justice',
    prompt: 'You are Umar (RA) and someone needs fairness.',
    correct: 'Judge with justice and courage',
    options: [
      'Ignore the issue',
      'Judge with justice and courage',
      'Favor friends',
      'Delay the case forever',
    ],
  },
  {
    id: 'abu-bakr-charity',
    prompt: 'You are Abu Bakr (RA) asked to spend for the needy.',
    correct: 'Give generously for Allah',
    options: [
      'Save every coin',
      'Give generously for Allah',
      'Only help close friends',
      'Wait for others to help first',
    ],
  },
  {
    id: 'uthman-well',
    prompt: 'You are Uthman (RA). The Muslims need water but the well is expensive.',
    correct: 'Buy the well for the Muslims',
    options: [
      'Buy the well for the Muslims',
      'Ignore the need',
      'Ask others to pay',
      'Keep money for yourself',
    ],
  },
  {
    id: 'ali-courage',
    prompt: 'You are Ali (RA). The Prophet ﷺ needs someone to sleep in his bed as a decoy.',
    correct: 'Sleep in the bed bravely',
    options: [
      'Sleep in the bed bravely',
      'Refuse out of fear',
      'Run away with him',
      'Hide somewhere else',
    ],
  },
  {
    id: 'musab-teacher',
    prompt: 'You are Mus’ab ibn Umair (RA) teaching new Muslims.',
    correct: 'Teach with patience and kindness',
    options: [
      'Give up teaching',
      'Teach with patience and kindness',
      'Be harsh when correcting',
      'Only teach wealthy people',
    ],
  },
];

export const hiddenChallenges: BaseTask[] = [
  {
    id: 'hidden-1',
    prompt: 'Hidden Challenge: Name two lessons from Hudaybiyah.',
    points: 6,
    options: [
      { id: 'hc1', text: 'Patience and strategic peace' },
      { id: 'hc2', text: 'Rush and fight quickly' },
      { id: 'hc3', text: 'Avoid treaties always' },
      { id: 'hc4', text: 'Delay decisions' },
    ],
    correctOptionId: 'hc1',
  },
  {
    id: 'hidden-2',
    prompt: 'Hidden Challenge: What makes a deed most beloved?',
    points: 6,
    options: [
      { id: 'hb1', text: 'Consistency and sincerity' },
      { id: 'hb2', text: 'Speed and showing off' },
      { id: 'hb3', text: 'Doing it rarely but a lot' },
      { id: 'hb4', text: 'Doing it only when seen' },
    ],
    correctOptionId: 'hb1',
  },
];

// (Removed) Minimal test pool used for local testing
