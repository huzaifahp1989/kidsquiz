// Quiz questions data - 5 Categories with 10 questions each
// Each correct answer = 1 point, so 10 points per quiz
// Weekly limit: 250 points max | Monthly goal: 1000 points = Badge 🏆

export const quizzes = [
  // SEERAH - 10 Questions
  {
    id: 'seerah-1',
    question: 'Who was entrusted to return the Quraysh\'s deposits on the night of Hijrah?',
    options: ['Abu Bakr (RA)', 'Zayd ibn Harithah (RA)', 'Ali ibn Abi Talib (RA)', 'Abdullah ibn Mas\'ud (RA)'],
    correctAnswer: 2,
    explanation: 'Ali ibn Abi Talib (RA) was entrusted with the responsibility of returning all the deposits that the Quraysh had left with the Prophet ﷺ.',
    category: 'Seerah',
    difficulty: 'Seerah',
    points: 1
  },
  {
    id: 'seerah-2',
    question: 'The guide hired for the Hijrah route was:',
    options: ['Mut\'im ibn \'Adi', 'Abdullah ibn Urayqit', 'Abu Jahl', 'Safwan ibn Umayyah'],
    correctAnswer: 1,
    explanation: 'Abdullah ibn Urayqit was hired as the expert guide for the Hijrah journey to Madinah.',
    category: 'Seerah',
    difficulty: 'Seerah',
    points: 1
  },
  {
    id: 'seerah-3',
    question: 'Which battle took place in Shawwal, 3 AH?',
    options: ['Badr', 'Khandaq', 'Uhud', 'Hunayn'],
    correctAnswer: 2,
    explanation: 'The Battle of Uhud took place in Shawwal of the third year after Hijrah.',
    category: 'Seerah',
    difficulty: 'Seerah',
    points: 1
  },
  {
    id: 'seerah-4',
    question: 'Who was sent ahead to Madinah to teach Islam before Hijrah?',
    options: ['Mu\'adh ibn Jabal (RA)', 'Mus\'ab ibn Umair (RA)', 'Bilal ibn Rabah (RA)', 'Ammar ibn Yasir (RA)'],
    correctAnswer: 1,
    explanation: 'Mus\'ab ibn Umair (RA) was sent to Madinah before the Hijrah to teach the Qur\'an and Islam.',
    category: 'Seerah',
    difficulty: 'Seerah',
    points: 1
  },
  {
    id: 'seerah-5',
    question: 'What was the first masjid built by Rasulullah ﷺ?',
    options: ['Masjid Nabawi', 'Masjid al-Haram', 'Masjid Quba', 'Masjid al-Aqsa'],
    correctAnswer: 2,
    explanation: 'Masjid Quba was the first masjid built by the Prophet ﷺ upon arriving in the outskirts of Madinah.',
    category: 'Seerah',
    difficulty: 'Seerah',
    points: 1
  },
  {
    id: 'seerah-6',
    question: 'Which Jewish tribe violated the treaty after Badr?',
    options: ['Banu Qurayzah', 'Banu Nadir', 'Banu Qaynuqa', 'Banu Aws'],
    correctAnswer: 2,
    explanation: 'Banu Qaynuqa were the first Jewish tribe to break their treaty with the Muslims after the Battle of Badr.',
    category: 'Seerah',
    difficulty: 'Seerah',
    points: 1
  },
  {
    id: 'seerah-7',
    question: 'The Prophet\'s ﷺ ring was engraved with:',
    options: ['Allahu Akbar', 'Muhammad Nabiullah', 'Muhammad Rasulullah', 'Rasulullah ﷺ'],
    correctAnswer: 2,
    explanation: 'The Prophet\'s ring was engraved with "Muhammad Rasulullah" (Muhammad, Messenger of Allah).',
    category: 'Seerah',
    difficulty: 'Seerah',
    points: 1
  },
  {
    id: 'seerah-8',
    question: 'Who negotiated for Quraysh at Hudaybiyyah?',
    options: ['Abu Sufyan', 'Suhayl ibn Amr', 'Ikrimah ibn Abi Jahl', 'Walid ibn Mughirah'],
    correctAnswer: 1,
    explanation: 'Suhayl ibn Amr was the chief negotiator for the Quraysh during the Treaty of Hudaybiyyah.',
    category: 'Seerah',
    difficulty: 'Seerah',
    points: 1
  },
  {
    id: 'seerah-9',
    question: 'Who slept in the Prophet\'s ﷺ bed on the night of Hijrah?',
    options: ['Abu Bakr (RA)', 'Ali (RA)', 'Zubayr ibn Awwam (RA)', 'Talha ibn Ubaydullah (RA)'],
    correctAnswer: 1,
    explanation: 'Ali (RA) courageously slept in the Prophet\'s bed to deceive the Quraysh assassins on the night of Hijrah.',
    category: 'Seerah',
    difficulty: 'Seerah',
    points: 1
  },
  {
    id: 'seerah-10',
    question: 'How long did Rasulullah ﷺ remain in Makkah after prophethood?',
    options: ['10 years', '11 years', '13 years', '15 years'],
    correctAnswer: 2,
    explanation: 'The Prophet ﷺ remained in Makkah for 13 years after receiving prophethood before the Hijrah.',
    category: 'Seerah',
    difficulty: 'Seerah',
    points: 1
  },

  // HADITH - 10 Questions
  {
    id: 'hadith-1',
    question: '"Actions are judged by intentions" was narrated by:',
    options: ['Umar ibn al-Khattab (RA)', 'Abu Hurairah (RA)', 'Aisha (RA)', 'Ibn Abbas (RA)'],
    correctAnswer: 0,
    explanation: 'This fundamental hadith was narrated by Umar ibn al-Khattab (RA) and is found in Sahih Bukhari and Muslim.',
    category: 'Hadith',
    difficulty: 'Hadith',
    points: 1
  },
  {
    id: 'hadith-2',
    question: 'Which companion narrated the most ahadith?',
    options: ['Ibn Umar (RA)', 'Abu Hurairah (RA)', 'Anas ibn Malik (RA)', 'Abu Sa\'id al-Khudri (RA)'],
    correctAnswer: 1,
    explanation: 'Abu Hurairah (RA) narrated the most hadith among all companions, with over 5,000 narrations.',
    category: 'Hadith',
    difficulty: 'Hadith',
    points: 1
  },
  {
    id: 'hadith-3',
    question: 'Which book is unanimously regarded as the most authentic after the Qur\'an?',
    options: ['Sunan Abu Dawud', 'Sahih Muslim', 'Sahih Bukhari', 'Muwatta Malik'],
    correctAnswer: 2,
    explanation: 'Sahih Bukhari is unanimously considered the most authentic book of hadith after the Qur\'an.',
    category: 'Hadith',
    difficulty: 'Hadith',
    points: 1
  },
  {
    id: 'hadith-4',
    question: 'A Hadith Qudsi means:',
    options: ['Word & meaning from Allah', 'Word from Prophet ﷺ, meaning from Allah', 'Meaning from Allah, wording from Prophet ﷺ', 'Narrated only by angels'],
    correctAnswer: 2,
    explanation: 'Hadith Qudsi are narrations where the meaning is from Allah but the wording is from the Prophet ﷺ.',
    category: 'Hadith',
    difficulty: 'Hadith',
    points: 1
  },
  {
    id: 'hadith-5',
    question: '"Modesty is part of Iman" is found in:',
    options: ['Sunan Tirmidhi', 'Sahih Muslim', 'Musnad Ahmad', 'Sunan Nasa\'i'],
    correctAnswer: 1,
    explanation: 'This important hadith about modesty (haya) is found in Sahih Muslim.',
    category: 'Hadith',
    difficulty: 'Hadith',
    points: 1
  },
  {
    id: 'hadith-6',
    question: 'Who was known as the Faqih of the Ummah among Sahabah?',
    options: ['Ali (RA)', 'Abdullah ibn Mas\'ud (RA)', 'Abu Bakr (RA)', 'Mu\'adh ibn Jabal (RA)'],
    correctAnswer: 1,
    explanation: 'Abdullah ibn Mas\'ud (RA) was renowned as the Faqih (scholar of Islamic jurisprudence) of the Ummah.',
    category: 'Hadith',
    difficulty: 'Hadith',
    points: 1
  },
  {
    id: 'hadith-7',
    question: 'Backbiting is defined as:',
    options: ['Public criticism', 'Lying openly', 'Mentioning what your brother dislikes', 'Advising privately'],
    correctAnswer: 2,
    explanation: 'Backbiting (gheebah) is mentioning something about your brother that he would dislike, even if true.',
    category: 'Hadith',
    difficulty: 'Hadith',
    points: 1
  },
  {
    id: 'hadith-8',
    question: 'Which collection was authored by Imam Malik?',
    options: ['Musnad Ahmad', 'Sunan Ibn Majah', 'Muwatta Malik', 'Sahih Muslim'],
    correctAnswer: 2,
    explanation: 'Muwatta Malik is the famous hadith collection compiled by Imam Malik ibn Anas.',
    category: 'Hadith',
    difficulty: 'Hadith',
    points: 1
  },
  {
    id: 'hadith-9',
    question: '"Seeking knowledge is obligatory" is narrated in:',
    options: ['Bukhari', 'Muslim', 'Ibn Majah', 'Nasa\'i'],
    correctAnswer: 2,
    explanation: 'This famous hadith about seeking knowledge being obligatory upon every Muslim is narrated in Sunan Ibn Majah.',
    category: 'Hadith',
    difficulty: 'Hadith',
    points: 1
  },
  {
    id: 'hadith-10',
    question: 'A Mutawatir hadith is one that:',
    options: ['Is narrated by one narrator', 'Has weak chain', 'Is narrated by many narrators at every level', 'Is only about aqeedah'],
    correctAnswer: 2,
    explanation: 'A Mutawatir hadith is one narrated by so many people at every level that it is impossible for them to have agreed upon a lie.',
    category: 'Hadith',
    difficulty: 'Hadith',
    points: 1
  },

  // PROPHETS / AMBIYA - 10 Questions
  {
    id: 'prophets-1',
    question: 'Which Prophet was given both prophethood and kingship?',
    options: ['Yusuf (AS)', 'Dawud (AS)', 'Musa (AS)', 'Harun (AS)'],
    correctAnswer: 1,
    explanation: 'Prophet Dawud (David) (AS) was blessed with both prophethood and kingship.',
    category: 'Prophets',
    difficulty: 'Prophets',
    points: 1
  },
  {
    id: 'prophets-2',
    question: 'Which Prophet spoke as an infant?',
    options: ['Yahya (AS)', 'Isa (AS)', 'Ibrahim (AS)', 'Ismail (AS)'],
    correctAnswer: 1,
    explanation: 'Prophet Isa (Jesus) (AS) spoke as an infant from the cradle to defend his mother Maryam.',
    category: 'Prophets',
    difficulty: 'Prophets',
    points: 1
  },
  {
    id: 'prophets-3',
    question: 'Who rebuilt the Ka\'bah with his son?',
    options: ['Adam (AS)', 'Nuh (AS)', 'Ibrahim (AS)', 'Musa (AS)'],
    correctAnswer: 2,
    explanation: 'Prophet Ibrahim (Abraham) (AS) rebuilt the Ka\'bah with his son Ismail (AS).',
    category: 'Prophets',
    difficulty: 'Prophets',
    points: 1
  },
  {
    id: 'prophets-4',
    question: 'Which Prophet was swallowed by a fish?',
    options: ['Zakariyya (AS)', 'Yunus (AS)', 'Ayyub (AS)', 'Hud (AS)'],
    correctAnswer: 1,
    explanation: 'Prophet Yunus (Jonah) (AS) was swallowed by a large fish as a test from Allah.',
    category: 'Prophets',
    difficulty: 'Prophets',
    points: 1
  },
  {
    id: 'prophets-5',
    question: 'Who is the Prophet of extreme patience?',
    options: ['Ya\'qub (AS)', 'Yusuf (AS)', 'Ayyub (AS)', 'Nuh (AS)'],
    correctAnswer: 2,
    explanation: 'Prophet Ayyub (Job) (AS) is known for his extreme patience during severe trials.',
    category: 'Prophets',
    difficulty: 'Prophets',
    points: 1
  },
  {
    id: 'prophets-6',
    question: 'Who interpreted dreams while in prison?',
    options: ['Musa (AS)', 'Yusuf (AS)', 'Isa (AS)', 'Sulayman (AS)'],
    correctAnswer: 1,
    explanation: 'Prophet Yusuf (Joseph) (AS) interpreted dreams for his fellow prisoners in Egypt.',
    category: 'Prophets',
    difficulty: 'Prophets',
    points: 1
  },
  {
    id: 'prophets-7',
    question: 'Hud (AS) was sent to:',
    options: ['Thamud', '\'Ad', 'Madyan', 'Bani Isra\'il'],
    correctAnswer: 1,
    explanation: 'Prophet Hud (AS) was sent to the people of \'Ad to call them to worship Allah alone.',
    category: 'Prophets',
    difficulty: 'Prophets',
    points: 1
  },
  {
    id: 'prophets-8',
    question: 'Which Prophet understood the speech of animals?',
    options: ['Dawud (AS)', 'Sulayman (AS)', 'Nuh (AS)', 'Idris (AS)'],
    correctAnswer: 1,
    explanation: 'Prophet Sulayman (Solomon) (AS) was given the ability to understand the speech of animals and birds.',
    category: 'Prophets',
    difficulty: 'Prophets',
    points: 1
  },
  {
    id: 'prophets-9',
    question: 'Who was raised alive to the heavens?',
    options: ['Idris (AS)', 'Isa (AS)', 'Ilyas (AS)', 'Yunus (AS)'],
    correctAnswer: 1,
    explanation: 'Prophet Isa (Jesus) (AS) was raised alive to the heavens by Allah and will return before the Day of Judgment.',
    category: 'Prophets',
    difficulty: 'Prophets',
    points: 1
  },
  {
    id: 'prophets-10',
    question: 'The famous dua in three layers of darkness was made by:',
    options: ['Nuh (AS)', 'Ayyub (AS)', 'Yunus (AS)', 'Musa (AS)'],
    correctAnswer: 2,
    explanation: 'Prophet Yunus (AS) made this dua from inside the fish, in the darkness of the night, sea, and belly.',
    category: 'Prophets',
    difficulty: 'Prophets',
    points: 1
  },

  // QUR'AN STORIES - 10 Questions
  {
    id: 'quran-stories-1',
    question: 'The story of Ashab al-Kahf appears in:',
    options: ['Surah Yusuf', 'Surah Kahf', 'Surah Maryam', 'Surah Anbiya'],
    correctAnswer: 1,
    explanation: 'The story of the People of the Cave (Ashab al-Kahf) is narrated in Surah Al-Kahf.',
    category: 'Quran Stories',
    difficulty: 'Quran Stories',
    points: 1
  },
  {
    id: 'quran-stories-2',
    question: 'Who built the barrier against Ya\'juj and Ma\'juj?',
    options: ['Sulayman (AS)', 'Dhul Qarnayn', 'Nuh (AS)', 'Musa (AS)'],
    correctAnswer: 1,
    explanation: 'Dhul Qarnayn built the barrier to protect people from the destruction of Ya\'juj and Ma\'juj (Gog and Magog).',
    category: 'Quran Stories',
    difficulty: 'Quran Stories',
    points: 1
  },
  {
    id: 'quran-stories-3',
    question: 'The only woman named in the Qur\'an is:',
    options: ['Aasiya', 'Maryam', 'Khadijah', 'Hajar'],
    correctAnswer: 1,
    explanation: 'Maryam (Mary), the mother of Prophet Isa (AS), is the only woman mentioned by name in the Qur\'an.',
    category: 'Quran Stories',
    difficulty: 'Quran Stories',
    points: 1
  },
  {
    id: 'quran-stories-4',
    question: 'The punishment of the people of Lut was:',
    options: ['Flood', 'Earthquake', 'Fire', 'Stones of baked clay'],
    correctAnswer: 3,
    explanation: 'The people of Prophet Lut (AS) were destroyed by stones of baked clay rained upon them.',
    category: 'Quran Stories',
    difficulty: 'Quran Stories',
    points: 1
  },
  {
    id: 'quran-stories-5',
    question: 'Which bird informed Sulayman (AS) about Sheba?',
    options: ['Eagle', 'Crow', 'Hoopoe', 'Falcon'],
    correctAnswer: 2,
    explanation: 'The Hoopoe bird brought news to Prophet Sulayman (AS) about the Queen of Sheba and her people.',
    category: 'Quran Stories',
    difficulty: 'Quran Stories',
    points: 1
  },
  {
    id: 'quran-stories-6',
    question: 'Which Surah contains two Bismillah?',
    options: ['Tawbah', 'Kahf', 'Naml', 'Anfal'],
    correctAnswer: 2,
    explanation: 'Surah An-Naml contains Bismillah twice - one at the beginning and one within the surah in the letter from Sulayman.',
    category: 'Quran Stories',
    difficulty: 'Quran Stories',
    points: 1
  },
  {
    id: 'quran-stories-7',
    question: 'Who was given wisdom as a child?',
    options: ['Isa (AS)', 'Yahya (AS)', 'Yusuf (AS)', 'Ismail (AS)'],
    correctAnswer: 1,
    explanation: 'Prophet Yahya (John) (AS) was given wisdom and understanding even as a child.',
    category: 'Quran Stories',
    difficulty: 'Quran Stories',
    points: 1
  },
  {
    id: 'quran-stories-8',
    question: 'Bani Isra\'il worshipped:',
    options: ['An idol of stone', 'A golden calf', 'Fire', 'Angels'],
    correctAnswer: 1,
    explanation: 'The Children of Israel (Bani Isra\'il) worshipped a golden calf while Musa (AS) was away receiving the Torah.',
    category: 'Quran Stories',
    difficulty: 'Quran Stories',
    points: 1
  },
  {
    id: 'quran-stories-9',
    question: 'Ibrahim (AS) saw in a dream that he was:',
    options: ['Migrating', 'Fighting', 'Sacrificing his son', 'Building the Ka\'bah'],
    correctAnswer: 2,
    explanation: 'Prophet Ibrahim (AS) saw in a dream that he was sacrificing his son Ismail (AS), which was a test from Allah.',
    category: 'Quran Stories',
    difficulty: 'Quran Stories',
    points: 1
  },
  {
    id: 'quran-stories-10',
    question: 'Which Surah begins with Alhamdulillah?',
    options: ['Fatiha', 'An\'am', 'Kahf', 'All of the above'],
    correctAnswer: 3,
    explanation: 'Multiple Surahs begin with Alhamdulillah (All praise is for Allah), including Al-Fatiha, Al-An\'am, Al-Kahf, Saba, and Fatir.',
    category: 'Quran Stories',
    difficulty: 'Quran Stories',
    points: 1
  },

  // AKHLAQ - 10 Questions
  {
    id: 'akhlaq-1',
    question: 'The heaviest deed on the scale is:',
    options: ['Fasting', 'Salah', 'Good character', 'Jihad'],
    correctAnswer: 2,
    explanation: 'The Prophet ﷺ said that nothing is heavier on the scale than good character (akhlaq).',
    category: 'Akhlaq',
    difficulty: 'Akhlaq',
    points: 1
  },
  {
    id: 'akhlaq-2',
    question: 'Which trait destroys brotherhood?',
    options: ['Anger', 'Envy', 'Fear', 'Sadness'],
    correctAnswer: 1,
    explanation: 'Envy (hasad) is a destructive trait that can destroy the bonds of brotherhood and unity among Muslims.',
    category: 'Akhlaq',
    difficulty: 'Akhlaq',
    points: 1
  },
  {
    id: 'akhlaq-3',
    question: 'Which sin is compared to eating the flesh of one\'s brother?',
    options: ['Lying', 'Backbiting', 'Pride', 'Theft'],
    correctAnswer: 1,
    explanation: 'Allah compares backbiting (gheebah) to eating the flesh of one\'s dead brother in Surah Al-Hujurat.',
    category: 'Akhlaq',
    difficulty: 'Akhlaq',
    points: 1
  },
  {
    id: 'akhlaq-4',
    question: 'The strongest person is one who:',
    options: ['Wins fights', 'Controls anger', 'Has authority', 'Has wealth'],
    correctAnswer: 1,
    explanation: 'The Prophet ﷺ said the strong person is not the one who wins fights, but the one who controls their anger.',
    category: 'Akhlaq',
    difficulty: 'Akhlaq',
    points: 1
  },
  {
    id: 'akhlaq-5',
    question: 'Concealing others\' faults results in:',
    options: ['Increased status', 'People\'s praise', 'Allah concealing your faults', 'Leadership'],
    correctAnswer: 2,
    explanation: 'The Prophet ﷺ said whoever conceals the faults of others, Allah will conceal their faults in this world and the Hereafter.',
    category: 'Akhlaq',
    difficulty: 'Akhlaq',
    points: 1
  },
  {
    id: 'akhlaq-6',
    question: 'Most people enter Jannah because of:',
    options: ['Knowledge', 'Wealth', 'Taqwa and good manners', 'Lineage'],
    correctAnswer: 2,
    explanation: 'The Prophet ﷺ said that most people will enter Paradise because of taqwa (God-consciousness) and good manners.',
    category: 'Akhlaq',
    difficulty: 'Akhlaq',
    points: 1
  },
  {
    id: 'akhlaq-7',
    question: 'When angry, the Prophet ﷺ advised to:',
    options: ['Walk away', 'Sleep', 'Remain silent', 'Argue calmly'],
    correctAnswer: 2,
    explanation: 'The Prophet ﷺ advised to remain silent when angry, as this prevents saying harmful words.',
    category: 'Akhlaq',
    difficulty: 'Akhlaq',
    points: 1
  },
  {
    id: 'akhlaq-8',
    question: 'True richness is:',
    options: ['Property', 'Gold', 'Contentment', 'Trade'],
    correctAnswer: 2,
    explanation: 'The Prophet ﷺ said true richness is not abundance of wealth, but richness of the soul (contentment).',
    category: 'Akhlaq',
    difficulty: 'Akhlaq',
    points: 1
  },
  {
    id: 'akhlaq-9',
    question: 'A believer is best known for:',
    options: ['Strength', 'Intelligence', 'Trustworthiness', 'Leadership'],
    correctAnswer: 2,
    explanation: 'Trustworthiness (amanah) is a fundamental characteristic of a true believer and was a quality the Prophet ﷺ was known for.',
    category: 'Akhlaq',
    difficulty: 'Akhlaq',
    points: 1
  },
  {
    id: 'akhlaq-10',
    question: 'Which quality raises one\'s rank the most?',
    options: ['Long salah', 'Soft speech', 'Humility', 'Silence'],
    correctAnswer: 2,
    explanation: 'Humility is a quality that raises one\'s rank with Allah, while pride is what brought down Iblis (Satan).',
    category: 'Akhlaq',
    difficulty: 'Akhlaq',
    points: 1
  }
];
