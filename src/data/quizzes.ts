// Quiz questions data - 5 Categories with 30 questions each (150 total)
// Each quiz shows 5 random questions based on daily seed
// Each correct answer = 2 points, so 10 points per quiz
// Daily limit: 100 points max | Questions change every day

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
  // TEST CATEGORY – 2 Questions (for quick testing)
  {
    id: 'test-1',
    question: 'Test: Choose A',
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 0,
    explanation: 'This is a test question for quick verification.',
    category: 'Test',
    difficulty: 'Test',
    points: 1
  },
  {
    id: 'test-2',
    question: 'Test: Choose B',
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 1,
    explanation: 'Another test question to simulate a short quiz.',
    category: 'Test',
    difficulty: 'Test',
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
  },

  // SEERAH - Additional 20 Questions (11-30)
  {
    id: 'seerah-11',
    question: 'What was the age of Prophet Muhammad ﷺ when he received the first revelation?',
    options: ['35 years', '40 years', '45 years', '50 years'],
    correctAnswer: 1,
    explanation: 'The Prophet ﷺ was 40 years old when Angel Jibreel came to him with the first revelation in the Cave of Hira.',
    category: 'Seerah',
    difficulty: 'Seerah',
    points: 2
  },
  {
    id: 'seerah-12',
    question: 'Who was the first male to accept Islam?',
    options: ['Umar ibn al-Khattab', 'Ali ibn Abi Talib', 'Abu Bakr as-Siddiq', 'Uthman ibn Affan'],
    correctAnswer: 2,
    explanation: 'Abu Bakr as-Siddiq (RA) was the first adult male to accept Islam without hesitation.',
    category: 'Seerah',
    difficulty: 'Seerah',
    points: 2
  },
  {
    id: 'seerah-13',
    question: 'In which year did the Year of Sorrow (death of Khadijah and Abu Talib) occur?',
    options: ['8th year of Prophethood', '10th year of Prophethood', '11th year of Prophethood', '13th year of Prophethood'],
    correctAnswer: 1,
    explanation: 'The 10th year of Prophethood is known as the Year of Sorrow when both Khadijah (RA) and Abu Talib passed away.',
    category: 'Seerah',
    difficulty: 'Seerah',
    points: 2
  },
  {
    id: 'seerah-14',
    question: 'Who was known as the "Sword of Allah"?',
    options: ['Hamza ibn Abdul-Muttalib', 'Khalid ibn al-Walid', 'Sa\'d ibn Abi Waqqas', 'Zubayr ibn al-Awwam'],
    correctAnswer: 1,
    explanation: 'Khalid ibn al-Walid (RA) was given the title "Saifullah" (Sword of Allah) by the Prophet ﷺ.',
    category: 'Seerah',
    difficulty: 'Seerah',
    points: 2
  },
  {
    id: 'seerah-15',
    question: 'How many years did the Prophet ﷺ live in Madinah?',
    options: ['8 years', '10 years', '12 years', '13 years'],
    correctAnswer: 1,
    explanation: 'The Prophet ﷺ lived in Madinah for 10 years after the Hijrah until his passing.',
    category: 'Seerah',
    difficulty: 'Seerah',
    points: 2
  },
  {
    id: 'seerah-16',
    question: 'What was the name of the Prophet\'s ﷺ camel during Hijrah?',
    options: ['Al-Qaswa', 'Al-Adba', 'Duldul', 'Al-Aisha'],
    correctAnswer: 0,
    explanation: 'Al-Qaswa was the name of the Prophet\'s beloved camel that he rode during the Hijrah.',
    category: 'Seerah',
    difficulty: 'Seerah',
    points: 2
  },
  {
    id: 'seerah-17',
    question: 'Who carried the Muslim flag at the Battle of Khaybar?',
    options: ['Abu Bakr', 'Umar ibn al-Khattab', 'Ali ibn Abi Talib', 'Uthman ibn Affan'],
    correctAnswer: 2,
    explanation: 'Ali ibn Abi Talib (RA) was given the flag at Khaybar and was victorious with Allah\'s help.',
    category: 'Seerah',
    difficulty: 'Seerah',
    points: 2
  },
  {
    id: 'seerah-18',
    question: 'How many times did the Prophet ﷺ perform Hajj?',
    options: ['Once', 'Twice', 'Three times', 'Four times'],
    correctAnswer: 0,
    explanation: 'The Prophet ﷺ performed Hajj once in his lifetime, known as the Farewell Pilgrimage in 10 AH.',
    category: 'Seerah',
    difficulty: 'Seerah',
    points: 2
  },
  {
    id: 'seerah-19',
    question: 'Who was the milk mother (foster mother) of Prophet Muhammad ﷺ?',
    options: ['Khadijah', 'Halima as-Sa\'diyyah', 'Fatimah', 'Asma bint Abi Bakr'],
    correctAnswer: 1,
    explanation: 'Halima as-Sa\'diyyah (RA) was the Prophet\'s foster mother who nursed him in the desert.',
    category: 'Seerah',
    difficulty: 'Seerah',
    points: 2
  },
  {
    id: 'seerah-20',
    question: 'What was the name of the treaty signed with the Quraysh?',
    options: ['Treaty of Aqaba', 'Treaty of Hudaybiyyah', 'Treaty of Taif', 'Treaty of Badr'],
    correctAnswer: 1,
    explanation: 'The Treaty of Hudaybiyyah was signed in 6 AH and was called a "clear victory" by Allah.',
    category: 'Seerah',
    difficulty: 'Seerah',
    points: 2
  },
  {
    id: 'seerah-21',
    question: 'Which Surah was revealed entirely in one night?',
    options: ['Surah al-Fatiha', 'Surah al-Ikhlas', 'Surah al-Qadr', 'Surah al-Mulk'],
    correctAnswer: 2,
    explanation: 'Surah al-Qadr speaks about the Night of Power when the Quran began to be revealed.',
    category: 'Seerah',
    difficulty: 'Seerah',
    points: 2
  },
  {
    id: 'seerah-22',
    question: 'Who was the uncle of the Prophet ﷺ who protected him but never accepted Islam?',
    options: ['Abbas', 'Abu Lahab', 'Abu Talib', 'Hamza'],
    correctAnswer: 2,
    explanation: 'Abu Talib protected the Prophet ﷺ throughout his life but passed away without accepting Islam.',
    category: 'Seerah',
    difficulty: 'Seerah',
    points: 2
  },
  {
    id: 'seerah-23',
    question: 'How many children did Prophet Muhammad ﷺ have?',
    options: ['5', '7', '9', '11'],
    correctAnswer: 1,
    explanation: 'The Prophet ﷺ had 7 children: 3 sons (Qasim, Abdullah, Ibrahim) and 4 daughters (Zainab, Ruqayyah, Umm Kulthum, Fatimah).',
    category: 'Seerah',
    difficulty: 'Seerah',
    points: 2
  },
  {
    id: 'seerah-24',
    question: 'What miracle occurred when the Prophet ﷺ was born?',
    options: ['Palace of Kisra shook', 'It rained heavily', 'Stars fell', 'Angels appeared'],
    correctAnswer: 0,
    explanation: 'When the Prophet ﷺ was born, the palace of the Persian king Kisra shook and its arches cracked.',
    category: 'Seerah',
    difficulty: 'Seerah',
    points: 2
  },
  {
    id: 'seerah-25',
    question: 'Who was the first person to be martyred in Islam?',
    options: ['Hamza', 'Sumayy ah bint Khayyat', 'Yasir', 'Ammar ibn Yasir'],
    correctAnswer: 1,
    explanation: 'Sumayyah bint Khayyat (RA) was the first martyr in Islam, killed by Abu Jahl for her faith.',
    category: 'Seerah',
    difficulty: 'Seerah',
    points: 2
  },
  {
    id: 'seerah-26',
    question: 'What was the name of the first battle in Islam?',
    options: ['Battle of Uhud', 'Battle of Badr', 'Battle of Khandaq', 'Battle of Khaybar'],
    correctAnswer: 1,
    explanation: 'The Battle of Badr in 2 AH was the first major battle in Islam where Allah gave Muslims victory.',
    category: 'Seerah',
    difficulty: 'Seerah',
    points: 2
  },
  {
    id: 'seerah-27',
    question: 'Who was granted the title "Dhun-Nurayn" (Possessor of Two Lights)?',
    options: ['Ali', 'Abu Bakr', 'Umar', 'Uthman'],
    correctAnswer: 3,
    explanation: 'Uthman ibn Affan (RA) was called Dhun-Nurayn because he married two daughters of the Prophet ﷺ.',
    category: 'Seerah',
    difficulty: 'Seerah',
    points: 2
  },
  {
    id: 'seerah-28',
    question: 'Which companion was known as "Al-Farooq" (The Criterion)?',
    options: ['Abu Bakr', 'Umar ibn al-Khattab', 'Uthman', 'Ali'],
    correctAnswer: 1,
    explanation: 'Umar ibn al-Khattab (RA) was called Al-Farooq because of his ability to distinguish truth from falsehood.',
    category: 'Seerah',
    difficulty: 'Seerah',
    points: 2
  },
  {
    id: 'seerah-29',
    question: 'What was the name of the mountain where the Prophet ﷺ received revelation?',
    options: ['Mount Sinai', 'Mount Uhud', 'Jabal an-Nour (Cave of Hira)', 'Mount Arafat'],
    correctAnswer: 2,
    explanation: 'The Cave of Hira on Jabal an-Nour (Mountain of Light) is where the Prophet ﷺ received the first revelation.',
    category: 'Seerah',
    difficulty: 'Seerah',
    points: 2
  },
  {
    id: 'seerah-30',
    question: 'In which month did the Muslims conquer Makkah?',
    options: ['Ramadan', 'Shawwal', 'Dhul-Hijjah', 'Muharram'],
    correctAnswer: 0,
    explanation: 'The conquest of Makkah occurred in Ramadan of the 8th year after Hijrah.',
    category: 'Seerah',
    difficulty: 'Seerah',
    points: 2
  },

  // HADITH - Additional 20 Questions (11-30)
  {
    id: 'hadith-11',
    question: 'Who compiled Sahih Muslim?',
    options: ['Imam Bukhari', 'Imam Muslim', 'Imam Ahmad', 'Imam Malik'],
    correctAnswer: 1,
    explanation: 'Imam Muslim ibn al-Hajjaj compiled Sahih Muslim, one of the two most authentic hadith collections.',
    category: 'Hadith',
    difficulty: 'Hadith',
    points: 2
  },
  {
    id: 'hadith-12',
    question: '"The best of you are those who learn the Quran and teach it" was narrated by:',
    options: ['Uthman', 'Ali', 'Abu Hurairah', 'Aisha'],
    correctAnswer: 0,
    explanation: 'This hadith about the virtue of learning and teaching Quran was narrated by Uthman ibn Affan (RA).',
    category: 'Hadith',
    difficulty: 'Hadith',
    points: 2
  },
  {
    id: 'hadith-13',
    question: 'What are the Six Books of Hadith collectively called?',
    options: ['Kutub as-Sittah', 'Sahih Sitta', 'Hadith al-Arba\'in', 'Musnad as-Sittah'],
    correctAnswer: 0,
    explanation: 'The Six Books of Hadith (Bukhari, Muslim, Abu Dawud, Tirmidhi, Nasa\'i, Ibn Majah) are called Kutub as-Sittah.',
    category: 'Hadith',
    difficulty: 'Hadith',
    points: 2
  },
  {
    id: 'hadith-14',
    question: '"The strong person is not the one who can overpower others" - this hadith teaches about:',
    options: ['Physical strength', 'Controlling anger', 'Fighting skills', 'Leadership'],
    correctAnswer: 1,
    explanation: 'This hadith teaches that true strength is controlling one\'s anger, not physical power.',
    category: 'Hadith',
    difficulty: 'Hadith',
    points: 2
  },
  {
    id: 'hadith-15',
    question: 'Which companion\'s mother was praised by the Prophet ﷺ as going to Paradise?',
    options: ['Mother of Abu Hurairah', 'Mother of Anas', 'Mother of Abu Bakr', 'Mother of Umar'],
    correctAnswer: 1,
    explanation: 'Umm Sulaim, the mother of Anas ibn Malik, was praised by the Prophet ﷺ and given glad tidings of Paradise.',
    category: 'Hadith',
    difficulty: 'Hadith',
    points: 2
  },
  {
    id: 'hadith-16',
    question: '"Make things easy and do not make them difficult" - this hadith emphasizes:',
    options: ['Leniency in teaching', 'Being lazy', 'Avoiding hardship', 'Taking shortcuts'],
    correctAnswer: 0,
    explanation: 'This hadith teaches us to make religion easy for people and not to burden them unnecessarily.',
    category: 'Hadith',
    difficulty: 'Hadith',
    points: 2
  },
  {
    id: 'hadith-17',
    question: 'What is a Hadith Hasan?',
    options: ['Beautiful narration', 'Good/acceptable hadith', 'Weak hadith', 'Fabricated hadith'],
    correctAnswer: 1,
    explanation: 'Hadith Hasan means a "good" or "acceptable" hadith that is slightly below Sahih in authenticity.',
    category: 'Hadith',
    difficulty: 'Hadith',
    points: 2
  },
  {
    id: 'hadith-18',
    question: '"The believer does not slander, curse, or speak in an obscene manner" is found in:',
    options: ['Bukhari', 'Tirmidhi', 'Muslim', 'Abu Dawud'],
    correctAnswer: 1,
    explanation: 'This hadith about good character is found in Sunan at-Tirmidhi.',
    category: 'Hadith',
    difficulty: 'Hadith',
    points: 2
  },
  {
    id: 'hadith-19',
    question: 'Who is considered the greatest female narrator of hadith?',
    options: ['Khadijah', 'Aisha bint Abi Bakr', 'Fatimah', 'Hafsa'],
    correctAnswer: 1,
    explanation: 'Aisha (RA) narrated over 2,000 hadiths and is the greatest female narrator in Islam.',
    category: 'Hadith',
    difficulty: 'Hadith',
    points: 2
  },
  {
    id: 'hadith-20',
    question: '"The most beloved deed to Allah is the one done regularly, even if it is small" was narrated by:',
    options: ['Aisha', 'Abu Hurairah', 'Ibn Umar', 'Anas'],
    correctAnswer: 0,
    explanation: 'This hadith about consistency in deeds was narrated by Aisha (RA).',
    category: 'Hadith',
    difficulty: 'Hadith',
    points: 2
  },
  {
    id: 'hadith-21',
    question: 'Which scholar compiled "Riyadh as-Saliheen"?',
    options: ['Imam Nawawi', 'Imam Bukhari', 'Imam Muslim', 'Imam Ahmad'],
    correctAnswer: 0,
    explanation: 'Imam Nawawi compiled "Riyadh as-Saliheen" (The Gardens of the Righteous), a famous hadith collection.',
    category: 'Hadith',
    difficulty: 'Hadith',
    points: 2
  },
  {
    id: 'hadith-22',
    question: '"Paradise lies under the feet of mothers" teaches us about:',
    options: ['Respecting mothers', 'Women in Paradise', 'Traveling to Paradise', 'Prostration'],
    correctAnswer: 0,
    explanation: 'This hadith emphasizes the high status of mothers and the importance of respecting and serving them.',
    category: 'Hadith',
    difficulty: 'Hadith',
    points: 2
  },
  {
    id: 'hadith-23',
    question: 'What is the meaning of "Isnad" in hadith science?',
    options: ['The text of hadith', 'The chain of narrators', 'The explanation', 'The collection'],
    correctAnswer: 1,
    explanation: 'Isnad refers to the chain of narrators who transmitted the hadith from one generation to another.',
    category: 'Hadith',
    difficulty: 'Hadith',
    points: 2
  },
  {
    id: 'hadith-24',
    question: '"Whoever believes in Allah and the Last Day should speak good or remain silent" emphasizes:',
    options: ['Prayer', 'Controlling speech', 'Fasting', 'Charity'],
    correctAnswer: 1,
    explanation: 'This hadith teaches us to guard our tongue and only speak what is good or beneficial.',
    category: 'Hadith',
    difficulty: 'Hadith',
    points: 2
  },
  {
    id: 'hadith-25',
    question: 'How many hadith are in Sahih Bukhari (without repetitions)?',
    options: ['Around 2,000', 'Around 2,600', 'Around 5,000', 'Around 7,000'],
    correctAnswer: 1,
    explanation: 'Sahih Bukhari contains around 2,600 hadith without repetitions (7,563 with repetitions).',
    category: 'Hadith',
    difficulty: 'Hadith',
    points: 2
  },
  {
    id: 'hadith-26',
    question: '"The most beloved names to Allah are Abdullah and Abdur-Rahman" means:',
    options: ['These are prophets\' names', 'Names showing servitude to Allah', 'Arabic names only', 'Family names'],
    correctAnswer: 1,
    explanation: 'These names mean "servant of Allah" and "servant of the Most Merciful", showing complete submission to Allah.',
    category: 'Hadith',
    difficulty: 'Hadith',
    points: 2
  },
  {
    id: 'hadith-27',
    question: 'What is a "Mawdu" hadith?',
    options: ['Authentic hadith', 'Weak hadith', 'Fabricated/forged hadith', 'Rare hadith'],
    correctAnswer: 2,
    explanation: 'Mawdu hadith means a fabricated or forged hadith that was falsely attributed to the Prophet ﷺ.',
    category: 'Hadith',
    difficulty: 'Hadith',
    points: 2
  },
  {
    id: 'hadith-28',
    question: '"None of you believes until he loves for his brother what he loves for himself" teaches:',
    options: ['Family love', 'Selfishness', 'Brotherhood and caring for others', 'Competition'],
    correctAnswer: 2,
    explanation: 'This hadith teaches us to wish good for others just as we wish good for ourselves.',
    category: 'Hadith',
    difficulty: 'Hadith',
    points: 2
  },
  {
    id: 'hadith-29',
    question: 'Who compiled "Musnad Ahmad"?',
    options: ['Imam Bukhari', 'Imam Ahmad ibn Hanbal', 'Imam Shafi\'i', 'Imam Malik'],
    correctAnswer: 1,
    explanation: 'Imam Ahmad ibn Hanbal compiled the Musnad, containing over 27,000 hadith narrations.',
    category: 'Hadith',
    difficulty: 'Hadith',
    points: 2
  },
  {
    id: 'hadith-30',
    question: '"Verily, with hardship comes ease" is found in:',
    options: ['Hadith Qudsi', 'Surah Ash-Sharh', 'Sahih Bukhari', 'Sunan Tirmidhi'],
    correctAnswer: 1,
    explanation: 'This beautiful verse is from Surah Ash-Sharh (94:5-6) in the Quran, repeated twice for emphasis.',
    category: 'Hadith',
    difficulty: 'Hadith',
    points: 2
  },

  // PROPHETS - Additional 20 Questions (11-30)
  {
    id: 'prophets-11',
    question: 'Which prophet could talk to animals?',
    options: ['Prophet Musa', 'Prophet Isa', 'Prophet Sulayman', 'Prophet Yunus'],
    correctAnswer: 2,
    explanation: 'Prophet Sulayman (Solomon) was given the ability to understand and speak to animals and jinn.',
    category: 'Prophets',
    difficulty: 'Prophets',
    points: 2
  },
  {
    id: 'prophets-12',
    question: 'Who was the father of Prophet Ibrahim?',
    options: ['Azar', 'Imran', 'Zakariya', 'Lut'],
    correctAnswer: 0,
    explanation: 'Azar (also known as Tarakh) was the father of Prophet Ibrahim and was an idol maker.',
    category: 'Prophets',
    difficulty: 'Prophets',
    points: 2
  },
  {
    id: 'prophets-13',
    question: 'Which prophet was swallowed by a whale?',
    options: ['Prophet Yunus', 'Prophet Musa', 'Prophet Nuh', 'Prophet Isa'],
    correctAnswer: 0,
    explanation: 'Prophet Yunus (Jonah) was swallowed by a large fish/whale after leaving his people.',
    category: 'Prophets',
    difficulty: 'Prophets',
    points: 2
  },
  {
    id: 'prophets-14',
    question: 'Who built the Ka\'bah?',
    options: ['Prophet Muhammad ﷺ', 'Prophet Ibrahim and Ismail', 'Prophet Adam', 'Angels'],
    correctAnswer: 1,
    explanation: 'Prophet Ibrahim and his son Ismail rebuilt the Ka\'bah as commanded by Allah.',
    category: 'Prophets',
    difficulty: 'Prophets',
    points: 2
  },
  {
    id: 'prophets-15',
    question: 'Which prophet was known for his patience during severe trials?',
    options: ['Prophet Ayyub', 'Prophet Yusuf', 'Prophet Musa', 'Prophet Isa'],
    correctAnswer: 0,
    explanation: 'Prophet Ayyub (Job) is known for his immense patience during years of illness and hardship.',
    category: 'Prophets',
    difficulty: 'Prophets',
    points: 2
  },
  {
    id: 'prophets-16',
    question: 'Who was the prophet that interpreted dreams?',
    options: ['Prophet Yusuf', 'Prophet Daud', 'Prophet Sulayman', 'Prophet Yunus'],
    correctAnswer: 0,
    explanation: 'Prophet Yusuf (Joseph) was gifted with the ability to interpret dreams accurately.',
    category: 'Prophets',
    difficulty: 'Prophets',
    points: 2
  },
  {
    id: 'prophets-17',
    question: 'Which prophet was raised in the palace of Pharaoh?',
    options: ['Prophet Harun', 'Prophet Musa', 'Prophet Yusuf', 'Prophet Isa'],
    correctAnswer: 1,
    explanation: 'Prophet Musa (Moses) was raised in the palace of Pharaoh after being found in the river.',
    category: 'Prophets',
    difficulty: 'Prophets',
    points: 2
  },
  {
    id: 'prophets-18',
    question: 'Who was the twin brother of Prophet Musa?',
    options: ['Prophet Harun', 'Prophet Yusha', 'Prophet Shuaib', 'Prophet Yusuf'],
    correctAnswer: 0,
    explanation: 'Prophet Harun (Aaron) was the brother of Prophet Musa and helped him in his mission.',
    category: 'Prophets',
    difficulty: 'Prophets',
    points: 2
  },
  {
    id: 'prophets-19',
    question: 'Which prophet\'s people were destroyed by a loud cry (Sayhah)?',
    options: ['People of Nuh', 'People of Salih', 'People of Lut', 'People of Hud'],
    correctAnswer: 1,
    explanation: 'The people of Prophet Salih (the Thamud) were destroyed by a loud blast/cry from the sky.',
    category: 'Prophets',
    difficulty: 'Prophets',
    points: 2
  },
  {
    id: 'prophets-20',
    question: 'Who was the prophet that married a woman from the people of Madyan?',
    options: ['Prophet Ibrahim', 'Prophet Musa', 'Prophet Yusuf', 'Prophet Muhammad ﷺ'],
    correctAnswer: 1,
    explanation: 'Prophet Musa married Safura, the daughter of Prophet Shuaib from Madyan.',
    category: 'Prophets',
    difficulty: 'Prophets',
    points: 2
  },
  {
    id: 'prophets-21',
    question: 'Which prophet was given the Zabur (Psalms)?',
    options: ['Prophet Musa', 'Prophet Isa', 'Prophet Daud', 'Prophet Sulayman'],
    correctAnswer: 2,
    explanation: 'Prophet Daud (David) was given the Zabur (Psalms) as a scripture from Allah.',
    category: 'Prophets',
    difficulty: 'Prophets',
    points: 2
  },
  {
    id: 'prophets-22',
    question: 'Who was sent to the people of \'Ad?',
    options: ['Prophet Hud', 'Prophet Salih', 'Prophet Lut', 'Prophet Nuh'],
    correctAnswer: 0,
    explanation: 'Prophet Hud was sent to the people of \'Ad who were destroyed by a furious wind.',
    category: 'Prophets',
    difficulty: 'Prophets',
    points: 2
  },
  {
    id: 'prophets-23',
    question: 'Which prophet was born without a father?',
    options: ['Prophet Adam', 'Prophet Isa', 'Prophet Yahya', 'Prophet Idris'],
    correctAnswer: 1,
    explanation: 'Prophet Isa (Jesus) was born miraculously to Maryam without a father.',
    category: 'Prophets',
    difficulty: 'Prophets',
    points: 2
  },
  {
    id: 'prophets-24',
    question: 'Who was the grandfather of Prophet Yusuf?',
    options: ['Prophet Ishaq', 'Prophet Ismail', 'Prophet Ibrahim', 'Prophet Ya\'qub'],
    correctAnswer: 0,
    explanation: 'Prophet Ishaq (Isaac) was the father of Ya\'qub and grandfather of Yusuf.',
    category: 'Prophets',
    difficulty: 'Prophets',
    points: 2
  },
  {
    id: 'prophets-25',
    question: 'Which prophet lived for 950 years?',
    options: ['Prophet Adam', 'Prophet Nuh', 'Prophet Idris', 'Prophet Ibrahim'],
    correctAnswer: 1,
    explanation: 'Prophet Nuh (Noah) lived for 950 years and called his people to Allah for centuries.',
    category: 'Prophets',
    difficulty: 'Prophets',
    points: 2
  },
  {
    id: 'prophets-26',
    question: 'Who was the mother of Prophet Isa?',
    options: ['Maryam bint Imran', 'Asiya', 'Khadijah', 'Hajar'],
    correctAnswer: 0,
    explanation: 'Maryam (Mary) bint Imran was the mother of Prophet Isa and one of the greatest women in Islam.',
    category: 'Prophets',
    difficulty: 'Prophets',
    points: 2
  },
  {
    id: 'prophets-27',
    question: 'Which prophet\'s wife was turned into a pillar of salt?',
    options: ['Wife of Nuh', 'Wife of Lut', 'Wife of Ibrahim', 'Wife of Musa'],
    correctAnswer: 1,
    explanation: 'The wife of Prophet Lut disobeyed and looked back at the destruction, turning into a pillar of salt.',
    category: 'Prophets',
    difficulty: 'Prophets',
    points: 2
  },
  {
    id: 'prophets-28',
    question: 'Who was the father-in-law of Prophet Musa?',
    options: ['Prophet Shuaib', 'Prophet Harun', 'Prophet Yusha', 'Prophet Ilyas'],
    correctAnswer: 0,
    explanation: 'Prophet Shuaib was the father-in-law of Prophet Musa and also a prophet of Allah.',
    category: 'Prophets',
    difficulty: 'Prophets',
    points: 2
  },
  {
    id: 'prophets-29',
    question: 'Which prophet was taken up to the heavens alive?',
    options: ['Prophet Muhammad ﷺ', 'Prophet Isa', 'Prophet Idris', 'All of the above'],
    correctAnswer: 3,
    explanation: 'Prophet Muhammad ﷺ during Mi\'raj, Prophet Isa before crucifixion, and Prophet Idris were all raised to the heavens.',
    category: 'Prophets',
    difficulty: 'Prophets',
    points: 2
  },
  {
    id: 'prophets-30',
    question: 'Who was commanded to sacrifice his son but was given a ram instead?',
    options: ['Prophet Nuh', 'Prophet Ibrahim', 'Prophet Zakariya', 'Prophet Ya\'qub'],
    correctAnswer: 1,
    explanation: 'Prophet Ibrahim was tested by Allah to sacrifice his son, and Allah provided a ram instead.',
    category: 'Prophets',
    difficulty: 'Prophets',
    points: 2
  },

  // QURAN STORIES - Additional 20 Questions (11-30)
  {
    id: 'quran-11',
    question: 'Which Surah tells the story of the elephant army?',
    options: ['Surah al-Fil', 'Surah al-Nas', 'Surah al-Falaq', 'Surah Quraysh'],
    correctAnswer: 0,
    explanation: 'Surah al-Fil describes how Allah protected the Ka\'bah from Abraha\'s elephant army.',
    category: 'Quran Stories',
    difficulty: 'Quran Stories',
    points: 2
  },
  {
    id: 'quran-12',
    question: 'In which Surah is the story of the Sabbath-breakers mentioned?',
    options: ['Surah al-Baqarah', 'Surah al-A\'raf', 'Surah al-Ma\'idah', 'All of these'],
    correctAnswer: 3,
    explanation: 'The story of the Jews who broke the Sabbath law is mentioned in multiple Surahs including Baqarah and A\'raf.',
    category: 'Quran Stories',
    difficulty: 'Quran Stories',
    points: 2
  },
  {
    id: 'quran-13',
    question: 'What is the name of the Surah that contains the story of Mary (Maryam)?',
    options: ['Surah Maryam', 'Surah Al-Imran', 'Surah An-Nisa', 'Both A and B'],
    correctAnswer: 3,
    explanation: 'The story of Maryam is detailed in both Surah Maryam (Chapter 19) and Surah Al-Imran (Chapter 3).',
    category: 'Quran Stories',
    difficulty: 'Quran Stories',
    points: 2
  },
  {
    id: 'quran-14',
    question: 'Which Surah mentions the story of the cow that Bani Israel was commanded to slaughter?',
    options: ['Surah al-Baqarah', 'Surah al-An\'am', 'Surah al-Ma\'idah', 'Surah al-A\'raf'],
    correctAnswer: 0,
    explanation: 'Surah al-Baqarah (The Cow) gets its name from this story where Bani Israel was commanded to sacrifice a cow.',
    category: 'Quran Stories',
    difficulty: 'Quran Stories',
    points: 2
  },
  {
    id: 'quran-15',
    question: 'The story of the two sons of Adam is in which Surah?',
    options: ['Surah al-Baqarah', 'Surah al-Ma\'idah', 'Surah al-A\'raf', 'Surah Yusuf'],
    correctAnswer: 1,
    explanation: 'The story of Cain and Abel (Qabil and Habil) is mentioned in Surah al-Ma\'idah.',
    category: 'Quran Stories',
    difficulty: 'Quran Stories',
    points: 2
  },
  {
    id: 'quran-16',
    question: 'Which Surah tells about the seven sleepers in the cave?',
    options: ['Surah al-Kahf', 'Surah al-Furqan', 'Surah Maryam', 'Surah Ya-Sin'],
    correctAnswer: 0,
    explanation: 'Surah al-Kahf (The Cave) tells the story of the young men who slept in a cave for many years.',
    category: 'Quran Stories',
    difficulty: 'Quran Stories',
    points: 2
  },
  {
    id: 'quran-17',
    question: 'The story of Dhul-Qarnayn (the two-horned one) appears in:',
    options: ['Surah al-Kahf', 'Surah al-Anbiya', 'Surah al-Furqan', 'Surah ar-Ra\'d'],
    correctAnswer: 0,
    explanation: 'The story of Dhul-Qarnayn, who built a wall against Gog and Magog, is in Surah al-Kahf.',
    category: 'Quran Stories',
    difficulty: 'Quran Stories',
    points: 2
  },
  {
    id: 'quran-18',
    question: 'Which Surah is named after a prophet and his story?',
    options: ['Surah Ibrahim', 'Surah Yusuf', 'Surah Nuh', 'All of these'],
    correctAnswer: 3,
    explanation: 'Several Surahs are named after prophets including Ibrahim, Yusuf, Nuh, Hud, and Yunus.',
    category: 'Quran Stories',
    difficulty: 'Quran Stories',
    points: 2
  },
  {
    id: 'quran-19',
    question: 'The story of the man who passed by a town in ruins is in which Surah?',
    options: ['Surah al-Baqarah', 'Surah al-Kahf', 'Surah al-Ma\'idah', 'Surah Yusuf'],
    correctAnswer: 0,
    explanation: 'In Surah al-Baqarah, Allah mentions a man (possibly Uzayr) who passed by a destroyed town and was made to sleep for 100 years.',
    category: 'Quran Stories',
    difficulty: 'Quran Stories',
    points: 2
  },
  {
    id: 'quran-20',
    question: 'Which Surah mentions the story of the man with two gardens?',
    options: ['Surah al-Kahf', 'Surah al-Baqarah', 'Surah Luqman', 'Surah al-Furqan'],
    correctAnswer: 0,
    explanation: 'Surah al-Kahf tells the parable of a man with two gardens who became arrogant and lost everything.',
    category: 'Quran Stories',
    difficulty: 'Quran Stories',
    points: 2
  },
  {
    id: 'quran-21',
    question: 'The story of Talut (Saul) and Jalut (Goliath) is mentioned in:',
    options: ['Surah al-Baqarah', 'Surah al-Ma\'idah', 'Surah al-A\'raf', 'Surah al-Anfal'],
    correctAnswer: 0,
    explanation: 'Surah al-Baqarah tells the story of King Talut and how Daud defeated the giant Jalut.',
    category: 'Quran Stories',
    difficulty: 'Quran Stories',
    points: 2
  },
  {
    id: 'quran-22',
    question: 'Which Surah tells the story of Prophet Yusuf in most detail?',
    options: ['Surah Yusuf', 'Surah al-Baqarah', 'Surah al-An\'am', 'Surah al-A\'raf'],
    correctAnswer: 0,
    explanation: 'Surah Yusuf (Chapter 12) is the only Surah that tells a complete story from beginning to end.',
    category: 'Quran Stories',
    difficulty: 'Quran Stories',
    points: 2
  },
  {
    id: 'quran-23',
    question: 'The story of the Queen of Sheba (Bilqis) is found in:',
    options: ['Surah al-Naml', 'Surah Saba', 'Surah al-Anbiya', 'Both A and B'],
    correctAnswer: 3,
    explanation: 'The story of Queen Bilqis and Prophet Sulayman is mentioned in both Surah al-Naml and Surah Saba.',
    category: 'Quran Stories',
    difficulty: 'Quran Stories',
    points: 2
  },
  {
    id: 'quran-24',
    question: 'Which Surah mentions the story of the wife of Pharaoh (Asiya)?',
    options: ['Surah al-Qasas', 'Surah Tahrim', 'Surah Maryam', 'Surah al-Baqarah'],
    correctAnswer: 1,
    explanation: 'Surah Tahrim mentions Asiya, the believing wife of Pharaoh, as an example for believers.',
    category: 'Quran Stories',
    difficulty: 'Quran Stories',
    points: 2
  },
  {
    id: 'quran-25',
    question: 'The story of the hoopoe bird appears in which Surah?',
    options: ['Surah al-Naml', 'Surah al-Fil', 'Surah al-Anbiya', 'Surah Qaf'],
    correctAnswer: 0,
    explanation: 'In Surah al-Naml, a hoopoe bird brings news to Prophet Sulayman about the Queen of Sheba.',
    category: 'Quran Stories',
    difficulty: 'Quran Stories',
    points: 2
  },
  {
    id: 'quran-26',
    question: 'Which Surah mentions the story of Luqman and his advice to his son?',
    options: ['Surah Luqman', 'Surah al-Ahzab', 'Surah Saba', 'Surah Fatir'],
    correctAnswer: 0,
    explanation: 'Surah Luqman (Chapter 31) contains the wise advice that Luqman gave to his son.',
    category: 'Quran Stories',
    difficulty: 'Quran Stories',
    points: 2
  },
  {
    id: 'quran-27',
    question: 'The story of Prophet Musa splitting the sea is in which Surah?',
    options: ['Surah al-Baqarah', 'Surah ash-Shu\'ara', 'Surah Ta-Ha', 'All of these'],
    correctAnswer: 3,
    explanation: 'The story of Musa parting the Red Sea is mentioned in multiple Surahs including Baqarah, Shu\'ara, and Ta-Ha.',
    category: 'Quran Stories',
    difficulty: 'Quran Stories',
    points: 2
  },
  {
    id: 'quran-28',
    question: 'Which Surah tells about the ants that warned each other about Sulayman\'s army?',
    options: ['Surah al-Naml', 'Surah al-Ankabut', 'Surah al-Nahl', 'Surah Saba'],
    correctAnswer: 0,
    explanation: 'Surah al-Naml (The Ant) tells how an ant warned other ants about Prophet Sulayman\'s army approaching.',
    category: 'Quran Stories',
    difficulty: 'Quran Stories',
    points: 2
  },
  {
    id: 'quran-29',
    question: 'The story of the Battle of Badr is mentioned in:',
    options: ['Surah al-Anfal', 'Surah at-Tawbah', 'Surah Al-Imran', 'Both A and C'],
    correctAnswer: 3,
    explanation: 'The Battle of Badr is mentioned in both Surah al-Anfal (The Spoils of War) and Surah Al-Imran.',
    category: 'Quran Stories',
    difficulty: 'Quran Stories',
    points: 2
  },
  {
    id: 'quran-30',
    question: 'Which Surah tells about the incident of Ifk (false accusation against Aisha)?',
    options: ['Surah al-Nur', 'Surah al-Ahzab', 'Surah al-Ma\'idah', 'Surah at-Tahrim'],
    correctAnswer: 0,
    explanation: 'Surah al-Nur mentions the incident of Ifk where Aisha (RA) was falsely accused and her innocence was declared by Allah.',
    category: 'Quran Stories',
    difficulty: 'Quran Stories',
    points: 2
  },

  // AKHLAQ - Additional 20 Questions (11-30)
  {
    id: 'akhlaq-11',
    question: 'What is the best form of charity (Sadaqah)?',
    options: ['Money', 'A smile', 'Food', 'Clothes'],
    correctAnswer: 1,
    explanation: 'The Prophet ﷺ said that even a smile in your brother\'s face is charity.',
    category: 'Akhlaq',
    difficulty: 'Akhlaq',
    points: 2
  },
  {
    id: 'akhlaq-12',
    question: 'What does "Sabr" mean?',
    options: ['Anger', 'Patience', 'Happiness', 'Sadness'],
    correctAnswer: 1,
    explanation: 'Sabr means patience and perseverance in the face of difficulties, a highly praised quality in Islam.',
    category: 'Akhlaq',
    difficulty: 'Akhlaq',
    points: 2
  },
  {
    id: 'akhlaq-13',
    question: 'Which quality did the Prophet ﷺ have the most perfect form of?',
    options: ['Wealth', 'Power', 'Good character (Akhlaq)', 'Knowledge'],
    correctAnswer: 2,
    explanation: 'Allah described the Prophet ﷺ as having the most perfect character: "You are of a great moral character" (Quran 68:4).',
    category: 'Akhlaq',
    difficulty: 'Akhlaq',
    points: 2
  },
  {
    id: 'akhlaq-14',
    question: 'What is the best deed after believing in Allah?',
    options: ['Fasting', 'Being kind to parents', 'Charity', 'Jihad'],
    correctAnswer: 1,
    explanation: 'The Prophet ﷺ said that being kind and dutiful to parents is among the best deeds after believing in Allah.',
    category: 'Akhlaq',
    difficulty: 'Akhlaq',
    points: 2
  },
  {
    id: 'akhlaq-15',
    question: 'What is "Ihsan"?',
    options: ['Excellence in worship', 'Giving charity', 'Praying on time', 'Reading Quran'],
    correctAnswer: 0,
    explanation: 'Ihsan means excellence in worship - to worship Allah as if you see Him, and if you don\'t see Him, He sees you.',
    category: 'Akhlaq',
    difficulty: 'Akhlaq',
    points: 2
  },
  {
    id: 'akhlaq-16',
    question: 'What should you do when someone does good to you?',
    options: ['Ignore it', 'Do good back', 'Boast about it', 'Forget it'],
    correctAnswer: 1,
    explanation: 'Islam teaches us to reciprocate good treatment and to be grateful to those who are kind to us.',
    category: 'Akhlaq',
    difficulty: 'Akhlaq',
    points: 2
  },
  {
    id: 'akhlaq-17',
    question: 'What is "Tawakkul"?',
    options: ['Worrying', 'Trusting in Allah', 'Being lazy', 'Complaining'],
    correctAnswer: 1,
    explanation: 'Tawakkul means putting your complete trust in Allah after taking the necessary actions.',
    category: 'Akhlaq',
    difficulty: 'Akhlaq',
    points: 2
  },
  {
    id: 'akhlaq-18',
    question: 'What did the Prophet ﷺ say about being moderate?',
    options: ['Be extreme', 'Be balanced', 'Be lazy', 'Be strict only'],
    correctAnswer: 1,
    explanation: 'The Prophet ﷺ taught moderation in all matters and warned against extremism.',
    category: 'Akhlaq',
    difficulty: 'Akhlaq',
    points: 2
  },
  {
    id: 'akhlaq-19',
    question: 'What is "Hayaa"?',
    options: ['Arrogance', 'Modesty/Shyness', 'Anger', 'Envy'],
    correctAnswer: 1,
    explanation: 'Hayaa means modesty, shyness, and having a sense of shame that prevents one from doing wrong.',
    category: 'Akhlaq',
    difficulty: 'Akhlaq',
    points: 2
  },
  {
    id: 'akhlaq-20',
    question: 'What should you say when you make a mistake?',
    options: ['Blame others', 'Say "Astaghfirullah"', 'Get angry', 'Deny it'],
    correctAnswer: 1,
    explanation: 'Saying "Astaghfirullah" (I seek Allah\'s forgiveness) shows we acknowledge our mistakes and seek Allah\'s pardon.',
    category: 'Akhlaq',
    difficulty: 'Akhlaq',
    points: 2
  },
  {
    id: 'akhlaq-21',
    question: 'What is the reward for those who control their anger?',
    options: ['Nothing special', 'Great reward from Allah', 'Punishment', 'Weakness'],
    correctAnswer: 1,
    explanation: 'The Prophet ﷺ said that controlling anger is a sign of strength and brings great reward.',
    category: 'Akhlaq',
    difficulty: 'Akhlaq',
    points: 2
  },
  {
    id: 'akhlaq-22',
    question: 'What should we do with our blessings?',
    options: ['Hide them', 'Be grateful', 'Waste them', 'Show off'],
    correctAnswer: 1,
    explanation: 'Islam teaches us to be grateful (Shukr) for Allah\'s blessings and to use them wisely.',
    category: 'Akhlaq',
    difficulty: 'Akhlaq',
    points: 2
  },
  {
    id: 'akhlaq-23',
    question: 'What is the best way to treat neighbors?',
    options: ['Ignore them', 'With kindness', 'With suspicion', 'Avoid them'],
    correctAnswer: 1,
    explanation: 'The Prophet ﷺ emphasized the rights of neighbors and treating them with kindness and respect.',
    category: 'Akhlaq',
    difficulty: 'Akhlaq',
    points: 2
  },
  {
    id: 'akhlaq-24',
    question: 'What is "Taqwa"?',
    options: ['Fear of people', 'God-consciousness', 'Laziness', 'Showing off'],
    correctAnswer: 1,
    explanation: 'Taqwa means being conscious of Allah and avoiding His displeasure in all our actions.',
    category: 'Akhlaq',
    difficulty: 'Akhlaq',
    points: 2
  },
  {
    id: 'akhlaq-25',
    question: 'How should we speak?',
    options: ['Loudly always', 'Gently and kindly', 'Harshly', 'Never'],
    correctAnswer: 1,
    explanation: 'The Quran commands us to speak in a gentle and kind manner (Quran 17:53).',
    category: 'Akhlaq',
    difficulty: 'Akhlaq',
    points: 2
  },
  {
    id: 'akhlaq-26',
    question: 'What is the cure for envy (Hasad)?',
    options: ['Being content', 'Competing', 'Complaining', 'Boasting'],
    correctAnswer: 0,
    explanation: 'Being content with what Allah has given us and being happy for others helps cure envy.',
    category: 'Akhlaq',
    difficulty: 'Akhlaq',
    points: 2
  },
  {
    id: 'akhlaq-27',
    question: 'What should we do when we enter someone\'s house?',
    options: ['Barge in', 'Ask permission', 'Shout', 'Open everything'],
    correctAnswer: 1,
    explanation: 'Islam teaches us to seek permission before entering someone\'s house and to greet them with Salam.',
    category: 'Akhlaq',
    difficulty: 'Akhlaq',
    points: 2
  },
  {
    id: 'akhlaq-28',
    question: 'What is "Adab"?',
    options: ['Bad manners', 'Good manners', 'Punishment', 'Reward'],
    correctAnswer: 1,
    explanation: 'Adab means good manners, etiquette, and proper behavior in Islam.',
    category: 'Akhlaq',
    difficulty: 'Akhlaq',
    points: 2
  },
  {
    id: 'akhlaq-29',
    question: 'What should we do when we receive a gift?',
    options: ['Reject it', 'Be ungrateful', 'Thank the giver', 'Hide it'],
    correctAnswer: 2,
    explanation: 'We should thank the person who gives us a gift and show gratitude for their kindness.',
    category: 'Akhlaq',
    difficulty: 'Akhlaq',
    points: 2
  },
  {
    id: 'akhlaq-30',
    question: 'What is the best provision for the Hereafter?',
    options: ['Money', 'Taqwa (God-consciousness)', 'Gold', 'Property'],
    correctAnswer: 1,
    explanation: 'Allah says in the Quran: "And take provision, but indeed, the best provision is Taqwa" (Quran 2:197).',
    category: 'Akhlaq',
    difficulty: 'Akhlaq',
    points: 2
  }
];
