'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { addPoints as addPointsFallback } from '@/lib/profile-service';
import {
  Difficulty,
  Option,
  WordSearchConfig,
  hadithActionsPool,
  hadithMeaningPool,
  hadithScenarioPool,
  halalHaramPool,
  hiddenChallenges,
  quranWordSearch,
  sahabahDecisionScenarios,
  sahabahTimeline,
  seerahWordSearch,
  wuduFixerPool,
} from '@/data/games';

type GameId =
  | 'word-search-seerah'
  | 'word-search-quran'
  | 'hadith-match'
  | 'hadith-scenario'
  | 'wudu-fixer'
  | 'halal-haram-makrooh'
  | 'sahabah-timeline'
  | 'sahabah-decision'
  ;

type TaskKind = 'mcq' | 'wordsearch' | 'match' | 'timeline';

interface Task {
  id: string;
  prompt: string;
  kind: TaskKind;
  options: Option[];
  correctOptionId?: string;
  points: number;
  meta?: Record<string, any>;
}

interface WordPlacement {
  word: string;
  start: [number, number];
  end: [number, number];
  reversed: boolean;
  diagonal: boolean;
}

interface WordSearchData {
  grid: string[][];
  placements: WordPlacement[];
  targets: string[];
}

interface GameSession {
  id: GameId;
  title: string;
  icon: string;
  tasks: Task[];
  wordSearch?: WordSearchData;
  conceptualPrompt?: Task;
}

type CompletionSummary = {
  gameTitle: string;
  gameId: GameId;
  pointsEarned: number;
  difficulty: Difficulty;
  tasksPlayed: number;
};

const gameCatalog: { id: GameId; title: string; description: string; icon: string }[] = [
  {
    id: 'word-search-seerah',
    title: 'Word Search – Seerah',
    description: 'Find Seerah words (grid shifts every play) + follow-up MCQ',
    icon: '🕌',
  },
  {
    id: 'word-search-quran',
    title: 'Word Search – Qur’an',
    description: 'Find Qur’an words + conceptual meaning check',
    icon: '📜',
  },
  {
    id: 'hadith-match',
    title: 'Hadith Match – Action & Intention',
    description: 'Match hadith meanings to the most fitting actions',
    icon: '🤝',
  },
  {
    id: 'hadith-scenario',
    title: 'Hadith Scenario Challenge',
    description: 'Pick the best hadith teaching for each scenario',
    icon: '🧭',
  },
  {
    id: 'wudu-fixer',
    title: 'Fiqh – Wudu Fixer',
    description: 'Spot and fix mistakes in wudu order and intention',
    icon: '💧',
  },
  {
    id: 'halal-haram-makrooh',
    title: 'Fiqh – Halal, Haram or Makrooh?',
    description: 'Classify tricky real-life scenarios',
    icon: '⚖️',
  },
  {
    id: 'sahabah-timeline',
    title: 'Sahabah Timeline Puzzle',
    description: 'Arrange events in correct order for a Sahabi',
    icon: '📅',
  },
  {
    id: 'sahabah-decision',
    title: 'Sahabah Decision Game',
    description: 'Choose what a Sahabi would do',
    icon: '🛡️',
  },
];

const MAX_TASKS = 6;

const limitTasks = (tasks: Task[]) => tasks.slice(0, MAX_TASKS);

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const shuffle = <T,>(arr: T[]) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const pickMany = <T,>(arr: T[], count: number) => shuffle(arr).slice(0, count);

const weeklySeed = () => {
  const today = new Date();
  const firstJan = new Date(today.getFullYear(), 0, 1);
  const days = Math.floor((today.getTime() - firstJan.getTime()) / (24 * 60 * 60 * 1000));
  return `${today.getFullYear()}-w${Math.ceil((today.getDay() + 1 + days) / 7)}`;
};

const orientations: Array<[number, number]> = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

const placeWordsOnGrid = (
  config: WordSearchConfig,
  difficulty: Difficulty,
): WordSearchData => {
  const gridSize = randomInt(
    config.minSize + (difficulty === 'hard' ? 2 : 0),
    config.maxSize,
  );
  const grid = Array.from({ length: gridSize }, () => Array.from({ length: gridSize }, () => ''));
  const placements: WordPlacement[] = [];

  const tryPlace = (word: string) => {
    const reversed = Math.random() > 0.5;
    const diagChance = difficulty !== 'easy' && Math.random() > 0.3;
    const available = diagChance ? orientations : orientations.slice(0, 4);
    const letters = reversed ? [...word].reverse() : [...word];
    const dirs = shuffle(available);
    for (const dir of dirs) {
      for (let attempt = 0; attempt < 40; attempt += 1) {
        const row = randomInt(0, gridSize - 1);
        const col = randomInt(0, gridSize - 1);
        const endRow = row + dir[0] * (letters.length - 1);
        const endCol = col + dir[1] * (letters.length - 1);
        if (endRow < 0 || endRow >= gridSize || endCol < 0 || endCol >= gridSize) continue;
        let fits = true;
        for (let i = 0; i < letters.length; i += 1) {
          const r = row + dir[0] * i;
          const c = col + dir[1] * i;
          if (grid[r][c] && grid[r][c] !== letters[i]) {
            fits = false;
            break;
          }
        }
        if (!fits) continue;
        for (let i = 0; i < letters.length; i += 1) {
          const r = row + dir[0] * i;
          const c = col + dir[1] * i;
          grid[r][c] = letters[i];
        }
        placements.push({
          word,
          start: [row, col],
          end: [endRow, endCol],
          reversed,
          diagonal: dir[0] !== 0 && dir[1] !== 0,
        });
        return true;
      }
    }
    return false;
  };

  const targets: string[] = [];
  const shuffledPool = shuffle(config.wordPool);
  const desiredCount = Math.min(config.count, shuffledPool.length);
  for (const word of shuffledPool) {
    if (targets.length >= desiredCount) break;
    if (tryPlace(word)) {
      targets.push(word);
    }
  }

  for (let r = 0; r < gridSize; r += 1) {
    for (let c = 0; c < gridSize; c += 1) {
      if (!grid[r][c]) {
        grid[r][c] = String.fromCharCode(65 + randomInt(0, 25));
      }
    }
  }

  return { grid, placements, targets };
};

const buildHadithMatchTask = (difficulty: Difficulty): Task => {
  const meanings = pickMany(hadithMeaningPool, 4);
  const pool = shuffle(hadithActionsPool);
  const decoys = pool.filter(a => !meanings.some(m => m.correctActions.includes(a.id))).slice(0, difficulty === 'hard' ? 4 : 3);
  const actions = shuffle([
    ...meanings.flatMap(m => pickMany(m.correctActions, 1)),
    ...decoys.map(d => d.id),
  ]);
  return {
    id: 'hadith-match-task',
    kind: 'match',
    prompt: 'Match each hadith meaning to the most fitting action (options shuffle every play).',
    options: actions.map(id => ({ id, text: hadithActionsPool.find(a => a.id === id)?.text || id })),
    points: difficulty === 'hard' ? 8 : 6,
    meta: { meanings },
  };
};

const buildScenarioTasks = (difficulty: Difficulty): Task[] => {
  const pool = pickMany(hadithScenarioPool, difficulty === 'hard' ? 4 : 3);
  return pool.map(item => {
    const opts = shuffle(item.options);
    const options = opts.map((opt, idx) => ({ id: `${item.id}-${idx}`, text: opt }));
    const correctOptionId = options.find(o => o.text === item.correct)?.id;
    return {
      id: item.id,
      kind: 'mcq',
      prompt: item.scenario,
      points: 3,
      options,
      correctOptionId,
    };
  });
};

const buildSimpleMcqTasks = (
  pool: { id: string; prompt: string; correct: string; options: string[] }[],
  difficulty: Difficulty,
  basePoints = 3,
): Task[] =>
  pickMany(pool, difficulty === 'hard' ? 5 : 4).map(item => {
    const opts = shuffle(item.options);
    const options = opts.map((opt, idx) => ({ id: `${item.id}-${idx}`, text: opt }));
    const correctOptionId = options.find(o => o.text === item.correct)?.id;
    return {
      id: item.id,
      kind: 'mcq',
      prompt: item.prompt,
      options,
      correctOptionId,
      points: basePoints,
    };
  });

const buildTimelineTask = (difficulty: Difficulty): Task => {
  const sahabi = pickMany(sahabahTimeline, 1)[0];
  const shuffledEvents = shuffle(sahabi.events).slice(0, difficulty === 'easy' ? 3 : sahabi.events.length);
  return {
    id: `timeline-${sahabi.id}`,
    kind: 'timeline',
    prompt: `Arrange the life events of ${sahabi.name} in correct order (1 = earliest).`,
    options: shuffledEvents.map((ev, idx) => ({ id: `${idx}`, text: ev })),
    correctOptionId: 'timeline',
    points: difficulty === 'hard' ? 8 : 6,
    meta: { ordered: sahabi.events },
  };
};

const buildDecisionTasks = (difficulty: Difficulty): Task[] =>
  pickMany(sahabahDecisionScenarios, difficulty === 'hard' ? 4 : 3).map(item => {
    const opts = shuffle(item.options);
    const options = opts.map((opt, idx) => ({ id: `${item.id}-${idx}`, text: opt }));
    const correctOptionId = options.find(o => o.text === item.correct)?.id;
    return {
      id: item.id,
      kind: 'mcq',
      prompt: item.prompt,
      points: 3,
      options,
      correctOptionId,
    };
  });

const withHiddenChallenge = (tasks: Task[]): Task[] => {
  const roll = Math.random();
  if (roll > 0.1) return tasks;
  const hidden = pickMany(hiddenChallenges, 1)[0];
  const insertAt = randomInt(0, tasks.length);
  const challenge: Task = {
    ...hidden,
    kind: 'mcq',
    options: shuffle(hidden.options),
  };
  return [...tasks.slice(0, insertAt), challenge, ...tasks.slice(insertAt)];
};

const buildWordSearchSession = (config: WordSearchConfig, difficulty: Difficulty, id: string): GameSession => {
  const ws = placeWordsOnGrid(config, difficulty);
  const followUps: Task[] = config.followUp
    ? pickMany(config.followUp, Math.min(2, config.followUp.length)).map(q => {
        const opts = shuffle(q.options);
        const options = opts.map((opt, idx) => ({ id: `${q.id}-${idx}`, text: opt.text || opt }));
        const correctOptionId = options.find(o => o.text === q.options.find((o: any) => o.id === q.correctOptionId)?.text)?.id;
        return {
          id: q.id,
          kind: 'mcq',
          prompt: q.prompt,
          points: q.points,
          options,
          correctOptionId,
        } as Task;
      })
    : [];

  const conceptualTask = config.conceptual
    ? (() => {
        const choice = pickMany(config.conceptual.choices, 1)[0];
        const opts = shuffle(choice.options);
        const options = opts.map((opt, idx) => ({ id: `${choice.id}-${idx}`, text: opt.text || opt }));
        const correctOptionId = options.find(o => o.text === choice.options.find((o: any) => o.id === choice.correctOptionId)?.text)?.id;
        return {
          id: choice.id,
          kind: 'mcq',
          prompt: choice.prompt,
          points: choice.points,
          options,
          correctOptionId,
        } as Task;
      })()
    : undefined;

  return {
    id: id as GameId,
    title: id === 'word-search-seerah' ? 'Word Search – Seerah' : 'Word Search – Qur’an',
    icon: id === 'word-search-seerah' ? '🕌' : '📜',
    // Show conceptual prompt after the word search, then follow-ups
    tasks: limitTasks(withHiddenChallenge([
      ...(conceptualTask ? [conceptualTask] : []),
      ...followUps,
    ])),
    wordSearch: ws,
    conceptualPrompt: conceptualTask,
  };
};

const buildGameSession = (gameId: GameId, difficulty: Difficulty): GameSession => {
  switch (gameId) {
    case 'word-search-seerah':
      return buildWordSearchSession(seerahWordSearch, difficulty, gameId);
    case 'word-search-quran':
      return buildWordSearchSession(quranWordSearch, difficulty, gameId);
    case 'hadith-match':
      return {
        id: gameId,
        title: 'Hadith Match – Action & Intention',
        icon: '🤝',
        tasks: limitTasks(withHiddenChallenge([buildHadithMatchTask(difficulty), buildHadithMatchTask(difficulty)])),
      };
    case 'hadith-scenario':
      return {
        id: gameId,
        title: 'Hadith Scenario Challenge',
        icon: '🧭',
        tasks: limitTasks(withHiddenChallenge(buildScenarioTasks(difficulty))),
      };
    case 'wudu-fixer':
      return {
        id: gameId,
        title: 'Fiqh – Wudu Fixer',
        icon: '💧',
        tasks: limitTasks(withHiddenChallenge(buildSimpleMcqTasks(wuduFixerPool, difficulty, 3))),
      };
    case 'halal-haram-makrooh':
      return {
        id: gameId,
        title: 'Fiqh – Halal, Haram or Makrooh?',
        icon: '⚖️',
        tasks: limitTasks(withHiddenChallenge(buildSimpleMcqTasks(halalHaramPool, difficulty, 3))),
      };
    case 'sahabah-timeline':
      return {
        id: gameId,
        title: 'Sahabah Timeline Puzzle',
        icon: '📅',
        tasks: limitTasks(withHiddenChallenge([buildTimelineTask(difficulty), buildTimelineTask(difficulty)])),
      };
    case 'sahabah-decision':
    default:
      return {
        id: 'sahabah-decision',
        title: 'Sahabah Decision Game',
        icon: '🛡️',
        tasks: limitTasks(withHiddenChallenge(buildDecisionTasks(difficulty))),
      };
  }
};

export default function GamesPage() {
  const { user, refreshProfile, profile } = useAuth() as any;
  const [selectedGameId, setSelectedGameId] = useState<GameId | null>(null);
  const [session, setSession] = useState<GameSession | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [taskIndex, setTaskIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [matchAnswers, setMatchAnswers] = useState<Record<string, string>>({});
  const [timelineOrder, setTimelineOrder] = useState<Record<string, number>>({});
  const [foundWords, setFoundWords] = useState<Record<string, boolean>>({});
  const [dragActive, setDragActive] = useState(false);
  const [dragStart, setDragStart] = useState<[number, number] | null>(null);
  const [dragHover, setDragHover] = useState<[number, number] | null>(null);
  const [dragHighlight, setDragHighlight] = useState<Record<string, boolean>>({});
  const [points, setPoints] = useState(0);
  const pointsRef = useRef(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [wrongStreak, setWrongStreak] = useState(0);
  const [comboActive, setComboActive] = useState(false);
  const [badgeUnlocked, setBadgeUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [pointsSaved, setPointsSaved] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [completion, setCompletion] = useState<CompletionSummary | null>(null);

  const applyPointGain = (totalEarned: number) => {
    setPoints(prev => {
      const next = prev + totalEarned;
      pointsRef.current = next;
      return next;
    });
  };

  const weekKey = useMemo(() => weeklySeed(), []);
  useEffect(() => {
    // Auto-enable dev mode for admins
    if (profile?.role === 'admin') {
      setDevMode(true);
    } else {
      setDevMode(false);
    }
  }, [profile?.role]);

  const currentTask = session?.tasks[taskIndex];

  const resetState = (opts?: { keepBadge?: boolean; keepCompletion?: boolean }) => {
    setTaskIndex(0);
    setSelectedOption(null);
    setMatchAnswers({});
    setTimelineOrder({});
    setFoundWords({});
    setDragActive(false);
    setDragStart(null);
    setDragHover(null);
    setDragHighlight({});
    setPoints(0);
    pointsRef.current = 0;
    setFeedback(null);
    setCorrectStreak(0);
    setWrongStreak(0);
    setComboActive(false);
    setPointsSaved(false);
    setToast(null);
    if (!opts?.keepBadge) setBadgeUnlocked(false);
    if (!opts?.keepCompletion) setCompletion(null);
  };

  const startGame = (gameId: GameId) => {
    if (!user?.id) {
      setToast('Please sign in to play and earn points');
      setTimeout(() => setToast(null), 2200);
      return;
    }
    const nextSession = buildGameSession(gameId, difficulty);
    setSelectedGameId(gameId);
    setSession(nextSession);
    resetState();
  };

  const quitGame = () => {
    setSelectedGameId(null);
    setSession(null);
    resetState();
  };

  const adjustDifficulty = (wasCorrect: boolean) => {
    if (wasCorrect) {
      const next = correctStreak + 1;
      setCorrectStreak(next);
      setWrongStreak(0);
      if (next >= 3) {
        setDifficulty(prev => (prev === 'easy' ? 'medium' : prev === 'medium' ? 'hard' : 'hard'));
      }
    } else {
      const nextWrong = wrongStreak + 1;
      setWrongStreak(nextWrong);
      setCorrectStreak(0);
      if (nextWrong >= 2) {
        setDifficulty(prev => (prev === 'hard' ? 'medium' : 'easy'));
      }
    }
  };

  const awardPoints = async (base: number, projectedStreak: number) => {
    if (!user?.id) {
      setToast('Please sign in to earn points');
      setTimeout(() => setToast(null), 2200);
      return;
    }

    const combo = projectedStreak >= 5;
    const totalEarned = combo ? base * 2 : base;
    setComboActive(combo);
    setLoading(true);

    const rpcName = 'add_points';

    const handleSuccess = () => {
      applyPointGain(totalEarned);
      setToast(`⭐ +${totalEarned} points${combo ? ' (2x combo!)' : ''}${devMode ? ' [Dev Mode]' : ''}`);
      setPointsSaved(true);
      setTimeout(() => setToast(null), 2500);
      setTimeout(() => setPointsSaved(false), 2500);
    };

    try {
      console.info('[games] awarding via RPC', { rpcName, uid: user.id, totalEarned });
      const { data, error } = await supabase.rpc(rpcName, {
        p_uid: user.id,
        p_points_to_add: totalEarned,
      });

      if (!error && data && data.success !== false) {
        console.info('[games] RPC success', data);
        handleSuccess();
        await refreshProfile();
        return;
      }

      console.warn('[games] RPC failed, falling back', { error, data });
      const rpcReason = error?.message || data?.reason || 'unknown error';

      // Fallback: direct update via profile-service (respects RLS)
      console.info('[games] fallback addPoints', { uid: user.id, totalEarned });
      const fallbackProfile = await addPointsFallback(user.id, totalEarned);
      if (fallbackProfile) {
        console.info('[games] fallback success', fallbackProfile);
        handleSuccess();
        await refreshProfile();
        return;
      }

      setToast(`⚠️ Points not saved (${rpcReason}). Complete your profile first.`);
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      console.error('[games] awardPoints error', err);
      console.info('[games] fallback after error', { uid: user?.id, totalEarned });
      const fallbackProfile = await addPointsFallback(user.id, totalEarned);
      if (fallbackProfile) {
        console.info('[games] fallback success after error', fallbackProfile);
        handleSuccess();
        await refreshProfile();
      } else {
        const msg = err?.message || 'unexpected error';
        setToast(`⚠️ Points not saved (${msg}). Complete your profile first.`);
        setTimeout(() => setToast(null), 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  const finishGame = async () => {
    if (!user?.id || !selectedGameId || !session) return;
    const finalPoints = pointsRef.current;
    setCompletion({
      gameTitle: session.title,
      gameId: session.id,
      pointsEarned: finalPoints,
      difficulty,
      tasksPlayed: session.tasks.length,
    });
    setBadgeUnlocked(true);
    try {
      await supabase.rpc('mark_game_completed', {
        uid: user.id,
        game_id: `${selectedGameId}-${weekKey}`,
        score_val: finalPoints,
      });
    } catch (err) {
      console.warn('mark_game_completed failed', err);
    }
    setSelectedGameId(null);
    setSession(null);
    resetState({ keepBadge: true, keepCompletion: true });
  };

  const evaluateMcq = async () => {
    if (!currentTask || !selectedOption) return;
    const correct = selectedOption === currentTask.correctOptionId;
    const projectedStreak = correct ? correctStreak + 1 : 0;
    
    if (correct) {
      await awardPoints(currentTask.points, projectedStreak);
      setFeedback('🎉 Correct!');
    } else {
      const correctText = currentTask.options.find(o => o.id === currentTask.correctOptionId)?.text || 'Unknown';
      setFeedback(`Not quite. The correct answer was: ${correctText}`);
    }

    adjustDifficulty(correct);
    
    // Delay before advancing so user can read feedback
    setTimeout(async () => {
      setFeedback(null);
      await advanceTask();
    }, correct ? 1500 : 3500);
  };

  const evaluateMatch = async () => {
    if (!currentTask?.meta?.meanings) return;
    const meanings = currentTask.meta.meanings as { id: string; text: string; correctActions: string[] }[];
    const allAnswered = meanings.every(m => matchAnswers[m.id]);
    if (!allAnswered) {
      setFeedback('Answer all matches before submitting.');
      return;
    }
    const correct = meanings.every(m => m.correctActions.includes(matchAnswers[m.id]));
    const projectedStreak = correct ? correctStreak + 1 : 0;
    
    if (correct) {
      await awardPoints(currentTask.points, projectedStreak);
      setFeedback('Matched perfectly! MashaAllah!');
    } else {
      setFeedback('Some matches were incorrect. Review the answers.');
    }
    
    adjustDifficulty(correct);

    setTimeout(async () => {
      setFeedback(null);
      await advanceTask();
    }, correct ? 1500 : 3500);
  };

  const evaluateTimeline = async () => {
    if (!currentTask?.meta?.ordered) return;
    const ordered = currentTask.meta.ordered as string[];
    const positions = ordered.map(ev => timelineOrder[ev]);
    if (positions.some(p => p === undefined)) {
      setFeedback('Please assign an order to every event.');
      return;
    }
    const correct = ordered.every((ev, idx) => timelineOrder[ev] === idx + 1);
    const projectedStreak = correct ? correctStreak + 1 : 0;
    
    if (correct) {
      await awardPoints(currentTask.points, projectedStreak);
      setFeedback('Timeline locked correctly! Well done.');
    } else {
      setFeedback('The order is not quite right. Keep learning!');
    }
    
    adjustDifficulty(correct);

    setTimeout(async () => {
      setFeedback(null);
      await advanceTask();
    }, correct ? 1500 : 3500);
  };

  const evaluateWordSearch = async () => {
    if (!session?.wordSearch) return;
    const allFound = session.wordSearch.targets.every(w => foundWords[w]);
    if (!allFound) {
      setFeedback('Mark all words as found first.');
      return;
    }
    const projectedStreak = correctStreak + 1;
    await awardPoints(4, projectedStreak);
    adjustDifficulty(true);
    setFeedback('Great search! Ready for the next challenge.');
    
    setTimeout(async () => {
      setFeedback(null);
      await advanceTask();
    }, 1500);
  };

  // Helpers for drag selection on word grid
  const keyFor = (r: number, c: number) => `${r}-${c}`;
  const getLineCells = (start: [number, number], end: [number, number]) => {
    const [sr, sc] = start;
    const [er, ec] = end;
    const dr = er - sr;
    const dc = ec - sc;
    const len = Math.max(Math.abs(dr), Math.abs(dc));
    // must be straight line (row, col, or diagonal)
    if (!(dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc))) return [];
    const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
    const stepC = dc === 0 ? 0 : dc / Math.abs(dc);
    const cells: Array<[number, number]> = [];
    for (let i = 0; i <= len; i += 1) {
      cells.push([sr + stepR * i, sc + stepC * i]);
    }
    return cells;
  };

  const checkSelectionMatch = (start: [number, number], end: [number, number]) => {
    if (!session?.wordSearch) return null;
    const placements = session.wordSearch.placements;
    for (const p of placements) {
      const s = p.start;
      const e = p.end;
      const direct = s[0] === start[0] && s[1] === start[1] && e[0] === end[0] && e[1] === end[1];
      const reverse = e[0] === start[0] && e[1] === start[1] && s[0] === end[0] && s[1] === end[1];
      if (direct || reverse) return p.word;
    }
    return null;
  };

  const onCellPointerDown = (r: number, c: number) => {
    setDragActive(true);
    setDragStart([r, c]);
    setDragHover([r, c]);
    setDragHighlight({ [keyFor(r, c)]: true });
  };

  const onCellPointerEnter = (r: number, c: number) => {
    if (!dragActive || !dragStart) return;
    setDragHover([r, c]);
    const cells = getLineCells(dragStart, [r, c]);
    if (cells.length) {
      const hl: Record<string, boolean> = {};
      cells.forEach(([cr, cc]) => {
        hl[keyFor(cr, cc)] = true;
      });
      setDragHighlight(hl);
    }
  };

  const onCellPointerUp = (r: number, c: number) => {
    if (!dragActive || !dragStart) return;
    const matchWord = checkSelectionMatch(dragStart, [r, c]);
    if (matchWord) {
      setFoundWords(prev => ({ ...prev, [matchWord]: true }));
      setToast(`🔎 Found: ${matchWord}`);
      setTimeout(() => setToast(null), 1500);
    }
    setDragActive(false);
    setDragStart(null);
    setDragHover(null);
    setDragHighlight({});
  };

  const advanceTask = async () => {
    setSelectedOption(null);
    setMatchAnswers({});
    setTimelineOrder({});
    if (!session) return;
    if (taskIndex < session.tasks.length - 1) {
      setTaskIndex(taskIndex + 1);
    } else {
      await finishGame();
    }
  };

  // Remove auto-restart on difficulty changes to avoid endless sessions and off-topic reshuffles

  return (
    <div className="min-h-screen bg-gradient-to-b from-islamic-light to-white py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-islamic-dark mb-2 islamic-shadow">🎮 Islamic Educational Games</h1>
          <p className="text-gray-700">Dynamic, randomized games that get smarter as you play.</p>
          <div className="mt-3 text-sm text-gray-600">Weekly seed: {weekKey} • Difficulty: {difficulty}</div>
        </div>

        {!session ? (
          <div className="space-y-6">
            {/* Daily Limit Rules */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">📊</div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-green-800 mb-2">Daily Points Limit Rules</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>✅ <strong>Play unlimited games</strong> - no restrictions on how many you can play!</li>
                    <li>⭐ <strong>Earn up to 100 points per day</strong> - points vary by game difficulty and performance</li>
                    <li>🔄 <strong>Games refresh weekly</strong> - new randomized content every week with daily variations!</li>
                    <li>🕛 <strong>Points reset at midnight</strong> - come back tomorrow to earn 100 more points</li>
                  </ul>
                </div>
              </div>
            </div>

            {completion && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-green-700">Nice run!</p>
                    <p className="text-lg font-bold text-islamic-dark">Finished {completion.gameTitle}</p>
                    <p className="text-sm text-gray-700">Earned {completion.pointsEarned} pts • {completion.tasksPlayed} tasks • Difficulty: {completion.difficulty}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {badgeUnlocked && <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-sm font-semibold text-green-700 border border-green-300">🏅 Badge progress saved</span>}
                    <Button variant="primary" onClick={() => { setCompletion(null); resetState(); }}>Play another game</Button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gameCatalog.map(game => (
                <button
                  key={game.id}
                  onClick={() => startGame(game.id)}
                  className="p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-islamic-blue hover:shadow-lg transition text-left"
                >
                  <div className="text-3xl mb-2">{game.icon}</div>
                  <div className="font-bold text-lg text-islamic-dark">{game.title}</div>
                  <div className="text-sm text-gray-600">{game.description}</div>
                  <div className="text-xs text-islamic-blue mt-2">Randomized each play • Combo bonuses • Weekly refresh</div>
                </button>
              ))}
            </div>

            <div className="bg-blue-50 border-l-4 border-islamic-blue p-4 rounded">
              <h4 className="font-bold text-islamic-dark mb-2">Global Randomization & Difficulty</h4>
              <ul className="text-gray-700 text-sm space-y-1">
                <li>• Random words/questions/options every play (never same set twice in a row)</li>
                <li>• Difficulty scales up after 3 correct streak; eases after 2 misses</li>
                <li>• Answers always shuffled; decoys are realistic, topic-aware</li>
                <li>• Combo bonus: 5 correct in a row → 2× points</li>
                <li>• Hidden challenge: 10% chance per session</li>
                <li>• Weekly reset seed: {weekKey}</li>
              </ul>
            </div>

            {toast && (
              <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded text-sm text-center">
                {toast}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-islamic-blue to-islamic-green text-white p-6 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{session.title}</div>
                  <div className="text-sm opacity-80">Randomized session • {taskIndex + 1}/{session.tasks.length}</div>
                </div>
                <div className="text-4xl">{session.icon}</div>
              </div>
              <div className="mt-3 flex gap-4 text-sm">
                <span>Difficulty: {difficulty}</span>
                <span>Streak: {correctStreak} ✅ / {wrongStreak} ❌</span>
                <span>Points: {points}</span>
                {comboActive && <span className="font-semibold">🔥 Combo Active (2×)</span>}
                {pointsSaved && <span className="font-semibold">✅ Points updated</span>}
                {profile?.role === 'admin' && (
                  <label className="ml-auto flex items-center gap-2 text-white">
                    <input
                      type="checkbox"
                      className="accent-yellow-400"
                      checked={devMode}
                      onChange={e => setDevMode(e.target.checked)}
                    />
                    <span className="text-xs">Dev Mode (no limits)</span>
                  </label>
                )}
              </div>
            </div>

            {session.wordSearch && (
              <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold mb-2">Word Grid (rows/cols shuffle every play)</div>
                    <div className="overflow-x-auto pb-2">
                      <div
                        className="grid gap-1 select-none min-w-max mx-auto"
                        style={{
                          gridTemplateColumns: `repeat(${session.wordSearch.grid.length}, minmax(28px, 1fr))`,
                          touchAction: 'none',
                        }}
                      >
                        {session.wordSearch.grid.map((row, rIdx) =>
                          row.map((cell, cIdx) => (
                            <div
                              key={`${rIdx}-${cIdx}`}
                              className={`text-center text-sm font-mono border rounded py-1 cursor-pointer w-7 h-8 flex items-center justify-center ${
                                dragHighlight[keyFor(rIdx, cIdx)] ? 'bg-yellow-200 border-yellow-500' : 'bg-gray-50'
                              }`}
                              onPointerDown={() => onCellPointerDown(rIdx, cIdx)}
                              onPointerEnter={() => onCellPointerEnter(rIdx, cIdx)}
                              onPointerUp={() => onCellPointerUp(rIdx, cIdx)}
                            >
                              {cell}
                            </div>
                          )),
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="w-full md:w-64">
                    <div className="font-bold mb-2">Find these words (tap when you locate)</div>
                    <div className="space-y-2">
                      {session.wordSearch.targets.map(word => (
                        <button
                          key={word}
                          onClick={() => setFoundWords(prev => ({ ...prev, [word]: !prev[word] }))}
                          className={`w-full text-left px-3 py-2 rounded border ${
                            foundWords[word] ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-white'
                          }`}
                        >
                          {foundWords[word] ? '✅' : '🔍'} {word}
                        </button>
                      ))}
                    </div>
                    <Button className="w-full mt-3" variant="success" onClick={evaluateWordSearch}>
                      Confirm Words Found
                    </Button>
                    {session.conceptualPrompt && (
                      <div className="text-xs text-gray-600 mt-2">
                        Concept check appears after the search.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentTask && currentTask.kind === 'mcq' && (
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <div className="text-lg font-bold text-islamic-dark mb-4">{currentTask.prompt}</div>
                <div className="space-y-3">
                  {currentTask.options.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedOption(opt.id)}
                      className={`w-full text-left px-4 py-3 rounded border-2 transition ${
                        selectedOption === opt.id
                          ? 'border-islamic-blue bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-islamic-blue'
                      }`}
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex gap-3">
                  <Button variant="success" onClick={evaluateMcq} disabled={!selectedOption || loading}>
                    Submit
                  </Button>
                  <Button variant="secondary" onClick={quitGame}>
                    Quit
                  </Button>
                </div>
              </div>
            )}

            {currentTask && currentTask.kind === 'match' && currentTask.meta?.meanings && (
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <div className="font-bold text-lg mb-4">{currentTask.prompt}</div>
                <div className="space-y-4">
                  {(currentTask.meta.meanings as any[]).map((meaning: any) => (
                    <div key={meaning.id} className="border rounded-lg p-3">
                      <div className="font-semibold text-islamic-dark mb-2">{meaning.text}</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {currentTask.options.map(opt => (
                          <button
                            key={opt.id}
                            onClick={() => setMatchAnswers(prev => ({ ...prev, [meaning.id]: opt.id }))}
                            className={`text-left px-3 py-2 rounded border-2 transition ${
                              matchAnswers[meaning.id] === opt.id
                                ? 'border-islamic-green bg-green-50'
                                : 'border-gray-200 bg-white hover:border-islamic-blue'
                            }`}
                          >
                            {opt.text}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-3">
                  <Button variant="success" onClick={evaluateMatch} disabled={loading}>
                    Submit Matches
                  </Button>
                  <Button variant="secondary" onClick={quitGame}>
                    Quit
                  </Button>
                </div>
              </div>
            )}

            {currentTask && currentTask.kind === 'timeline' && currentTask.meta?.ordered && (
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <div className="font-bold text-lg mb-4">{currentTask.prompt}</div>
                <div className="space-y-3">
                  {(currentTask.meta!.ordered as string[]).map(event => (
                    <div key={event} className="flex items-center gap-3">
                      <select
                        className="border rounded px-2 py-1"
                        value={timelineOrder[event] || ''}
                        onChange={e => setTimelineOrder(prev => ({ ...prev, [event]: Number(e.target.value) }))}
                      >
                        <option value="">Order</option>
                        {(currentTask.meta!.ordered as string[]).map((_, idx) => (
                          <option key={idx} value={idx + 1}>{idx + 1}</option>
                        ))}
                      </select>
                      <span className="text-gray-800">{event}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-3">
                  <Button variant="success" onClick={evaluateTimeline} disabled={loading}>
                    Submit Order
                  </Button>
                  <Button variant="secondary" onClick={quitGame}>
                    Quit
                  </Button>
                </div>
              </div>
            )}

            {feedback && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded text-sm text-gray-800">
                {feedback}
              </div>
            )}

            {badgeUnlocked && (
              <div className="bg-green-100 border border-green-300 text-green-800 p-4 rounded text-sm">
                🏆 Knowledge badge progress updated! Finish all 8 games this week to unlock.
              </div>
            )}

            {toast && (
              <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded text-sm text-center">
                {toast}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
