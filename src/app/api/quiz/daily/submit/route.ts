import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getStaticQuiz } from '@/lib/quiz-generator';
import { quizzes } from '@/data/quizzes';
import {
  filterQuestionsByTopic,
  getTopicById,
  getTopicQuizQuestions,
  getWeeklyTopicSeed,
} from '@/lib/quiz-topics';
import { isTestModeUserId } from '@/lib/test-mode-server';

const MAX_DAILY_QUIZ_ATTEMPTS = 2;
const TOPIC_QUIZ_SIZE = 5;

function getUtcDayWindow() {
  const now = new Date();
  const dayStart = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    0,
    0,
    0,
    0
  ));
  const nextDayStart = new Date(dayStart);
  nextDayStart.setUTCDate(nextDayStart.getUTCDate() + 1);

  return {
    dayStartIso: dayStart.toISOString(),
    nextDayStartIso: nextDayStart.toISOString(),
    nextDayStartMs: nextDayStart.getTime(),
  };
}

async function enforceDailyQuizAttemptLimit(userId: string) {
  const { dayStartIso, nextDayStartIso, nextDayStartMs } = getUtcDayWindow();
  const { data, count, error } = await supabaseAdmin
    .from('quiz_attempts')
    .select('score, completed_at', { count: 'exact' })
    .eq('user_id', userId)
    .gte('completed_at', dayStartIso)
    .lt('completed_at', nextDayStartIso)
    .order('completed_at', { ascending: false })
    .limit(1);

  if (error) {
    throw error;
  }

  const attemptsToday = Number(count || 0);
  if (attemptsToday >= MAX_DAILY_QUIZ_ATTEMPTS) {
    const timeRemaining = Math.max(0, Math.ceil((nextDayStartMs - Date.now()) / 1000));
    const lastScore = Array.isArray(data) && data[0] ? Number((data[0] as any).score ?? 0) : null;
    return NextResponse.json(
      {
        error: `You have already completed ${MAX_DAILY_QUIZ_ATTEMPTS} quizzes today. Come back tomorrow for more points.`,
        locked: true,
        lockedUntil: nextDayStartMs,
        lastScore,
        attemptsToday,
        maxDailyAttempts: MAX_DAILY_QUIZ_ATTEMPTS,
        timeRemaining,
      },
      { status: 429 }
    );
  }

  return null;
}

async function getTodaysQuizAttemptSummary(userId: string) {
  const { dayStartIso, nextDayStartIso, nextDayStartMs } = getUtcDayWindow();
  const { count, error } = await supabaseAdmin
    .from('quiz_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('completed_at', dayStartIso)
    .lt('completed_at', nextDayStartIso);

  if (error) {
    throw error;
  }

  const attemptsToday = Number(count || 0);
  return {
    attemptsToday,
    maxDailyAttempts: MAX_DAILY_QUIZ_ATTEMPTS,
    remainingDailyAttempts: Math.max(0, MAX_DAILY_QUIZ_ATTEMPTS - attemptsToday),
    lockedUntil: nextDayStartMs,
  };
}

async function ensureFallbackDailyQuizId(date: string, questionIds: string[]): Promise<string> {
  const { data: existing, error: existingErr } = await supabaseAdmin
    .from('daily_quizzes')
    .select('id')
    .eq('quiz_date', date)
    .maybeSingle();

  if (!existingErr && existing?.id) return existing.id;

  const { data: inserted, error: insertErr } = await supabaseAdmin
    .from('daily_quizzes')
    .insert({
      quiz_date: date,
      question_ids: questionIds,
      is_published: false,
    })
    .select('id')
    .single();

  if (!insertErr && inserted?.id) return inserted.id;

  const { data: reread, error: rereadErr } = await supabaseAdmin
    .from('daily_quizzes')
    .select('id')
    .eq('quiz_date', date)
    .single();

  if (rereadErr || !reread?.id) {
    throw new Error(insertErr?.message || rereadErr?.message || 'Could not resolve fallback quiz ID');
  }

  return reread.id;
}

function hasAnswersForEveryQuestion(answers: unknown, questionIds: string[]): answers is Record<string, unknown> {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    return false;
  }

  const answerRecord = answers as Record<string, unknown>;
  return questionIds.every((questionId) => {
    if (!Object.prototype.hasOwnProperty.call(answerRecord, questionId)) {
      return false;
    }

    const answer = answerRecord[questionId];
    return typeof answer === 'number' && Number.isInteger(answer) && answer >= 0;
  });
}

function duplicateAttemptResponse() {
  return NextResponse.json(
    { error: 'You have already attempted this topic quiz.' },
    { status: 409 }
  );
}

function isDailyAttemptLimitError(error: { message?: string } | null): boolean {
  return Boolean(error?.message?.includes('daily_quiz_attempt_limit_reached'));
}

async function submitQuizAttemptAndAward(params: {
  userId: string;
  quizId: string;
  topic: string;
  score: number;
  maxScore: number;
  durationSeconds: number | null;
  isFlagged: boolean;
  isTestMode: boolean;
}) {
  return supabaseAdmin.rpc('submit_daily_topic_quiz_attempt', {
    p_user_id: params.userId,
    p_quiz_id: params.quizId,
    p_topic: params.topic,
    p_score: params.score,
    p_max_score: params.maxScore,
    p_duration_seconds: params.durationSeconds,
    p_is_flagged: params.isFlagged,
    p_is_test_mode: params.isTestMode,
  });
}

function successNoPoints(score: number, maxScore: number, totalPossiblePoints: number, flags?: Record<string, unknown>) {
  return {
    success: true,
    score,
    maxScore,
    points: 0,
    totalPossiblePoints,
    message: 'Test mode active. Retry accepted without leaderboard points.',
    reason: 'test_mode_retry',
    todayPoints: 0,
    dailyLimit: 100,
    ...flags,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, quizId, answers, durationSeconds, topic } = body;

    if (!userId || typeof quizId !== 'string' || !answers || typeof answers !== 'object' || Array.isArray(answers)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const isTestMode = await isTestModeUserId(userId);

    const { data: userRow } = await supabaseAdmin.from('users').select('uid').eq('uid', userId).maybeSingle();
    if (!userRow) {
      const { error: createUserErr } = await supabaseAdmin
        .from('users')
        .upsert(
          {
            uid: userId,
            role: 'kid',
            name: `Learner-${userId.slice(0, 8)}`,
            age: 10,
            email: `user-${userId.slice(0, 8)}@local`,
            points: 0,
            weeklypoints: 0,
            monthlypoints: 0,
            level: 'Beginner',
          },
          { onConflict: 'uid' }
        );

      if (createUserErr) {
        console.error('Failed to ensure users row for quiz submit:', createUserErr);
        return NextResponse.json({ error: 'Could not prepare user profile for quiz submission.' }, { status: 500 });
      }
    }

    if (quizId.startsWith('topic-')) {
      const topicQuizMatch = /^topic-([a-z]+)-(\d{4}-\d{2}-\d{2})$/.exec(quizId);
      const topicDefinition = getTopicById(topicQuizMatch?.[1]);
      const weekSeedFromId = topicQuizMatch?.[2];
      const currentWeekSeed = getWeeklyTopicSeed();

      if (!topicDefinition || weekSeedFromId !== currentWeekSeed) {
        return NextResponse.json(
          { error: 'This topic quiz is invalid or is no longer current.' },
          { status: 400 }
        );
      }

      const todayDate = new Date().toISOString().split('T')[0];

      const topicQuestions = getTopicQuizQuestions(
        (quizzes as any[]).filter((q) => q && q.id),
        topicDefinition.id,
        currentWeekSeed,
        TOPIC_QUIZ_SIZE
      );
      if (topicQuestions.length !== TOPIC_QUIZ_SIZE) {
        return NextResponse.json(
          { error: 'A complete five-question quiz is not available for this topic.' },
          { status: 400 }
        );
      }

      const expectedQuestionIds = topicQuestions.map((question: any) => String(question.id));
      if (!hasAnswersForEveryQuestion(answers, expectedQuestionIds)) {
        return NextResponse.json(
          { error: 'Please answer all five questions before submitting this topic.' },
          { status: 400 }
        );
      }

      if (!isTestMode) {
        const limitResponse = await enforceDailyQuizAttemptLimit(userId);
        if (limitResponse) {
          return limitResponse;
        }
      }

      const fallbackDailyQuizId = await ensureFallbackDailyQuizId(
        todayDate,
        expectedQuestionIds
      );

      let correctCount = 0;
      const questionMap = new Map(topicQuestions.map((q: any) => [String(q.id), q]));
      for (const [qId, ansIdx] of Object.entries(answers)) {
        const q = questionMap.get(String(qId));
        if (q && Number(q.correctAnswer) === Number(ansIdx)) correctCount++;
      }

      const score = correctCount * 10;
      const maxScore = topicQuestions.length * 10;
      const totalPoints = 50;

      const { data: submissionResult, error: attemptError } = await submitQuizAttemptAndAward({
        userId,
        quizId: fallbackDailyQuizId,
        topic: topicDefinition.id,
        score,
        maxScore,
        durationSeconds: Number.isFinite(Number(durationSeconds)) ? Number(durationSeconds) : null,
        isFlagged: Number(durationSeconds) < 20,
        isTestMode,
      });

      if (attemptError) {
        if (isTestMode && attemptError.code === '23505') {
          return NextResponse.json(successNoPoints(score, maxScore, totalPoints, { isTopicQuiz: true }));
        }
        if (isDailyAttemptLimitError(attemptError)) {
          if (isTestMode) {
            return NextResponse.json(successNoPoints(score, maxScore, totalPoints, { isTopicQuiz: true }));
          }
          const limitResponse = await enforceDailyQuizAttemptLimit(userId);
          if (limitResponse) return limitResponse;
        }
        if (attemptError.code === '23505') {
          return duplicateAttemptResponse();
        }
        throw attemptError;
      }

      const finalPointsAwarded = Number(submissionResult?.points_awarded ?? 0);
      const awardReason = String(submissionResult?.reason || '');
      const todayPoints = Number(submissionResult?.today_points ?? 0);
      const dailyLimit = Number(submissionResult?.daily_limit ?? 100);
      const attemptSummary = await getTodaysQuizAttemptSummary(userId);
      const awardMessage = isTestMode
        ? 'Test mode active. Quiz recorded, but no leaderboard points were added.'
        : finalPointsAwarded > 0
          ? `Topic completed! ${finalPointsAwarded} points added to leaderboard.`
          : awardReason === 'daily_limit_reached'
            ? 'You have reached today\'s 100-point limit. Quiz completed, but no points were added.'
            : 'Quiz completed, but points could not be added right now.';

      return NextResponse.json({
        success: true,
        score,
        maxScore,
        points: finalPointsAwarded,
        totalPossiblePoints: totalPoints,
        message: awardMessage,
        reason: awardReason,
        todayPoints,
        dailyLimit,
        isTopicQuiz: true,
        attemptsToday: attemptSummary.attemptsToday,
        maxDailyAttempts: attemptSummary.maxDailyAttempts,
        remainingDailyAttempts: attemptSummary.remainingDailyAttempts,
        lockedUntil: attemptSummary.lockedUntil,
      });
    }

    if (quizId.startsWith('fallback-')) {
      if (!isTestMode) {
        const limitResponse = await enforceDailyQuizAttemptLimit(userId);
        if (limitResponse) {
          return limitResponse;
        }
      }

      const date = quizId.replace('fallback-', '');
      const todayDate = new Date().toISOString().split('T')[0];
      const topicDefinition = getTopicById(topic);
      if (date !== todayDate || !topicDefinition) {
        return NextResponse.json(
          { error: 'This topic quiz is invalid or is no longer current.' },
          { status: 400 }
        );
      }

      const staticQuiz = getStaticQuiz(date);
      const questions = staticQuiz.questions;
      const activeQuestions = filterQuestionsByTopic(questions, topicDefinition.id);
      if (activeQuestions.length !== TOPIC_QUIZ_SIZE) {
        return NextResponse.json(
          { error: 'Please use the current five-question topic quiz.' },
          { status: 400 }
        );
      }

      const expectedQuestionIds = activeQuestions.map((question: any) => String(question.id));
      if (!hasAnswersForEveryQuestion(answers, expectedQuestionIds)) {
        return NextResponse.json(
          { error: 'Please answer every question before submitting this quiz.' },
          { status: 400 }
        );
      }

      const fallbackDailyQuizId = await ensureFallbackDailyQuizId(
        date,
        expectedQuestionIds
      );

      let correctCount = 0;
      const questionMap = new Map(activeQuestions.map((q: any) => [String(q.id), q]));
      for (const [qId, ansIdx] of Object.entries(answers)) {
        const q = questionMap.get(String(qId));
        if (q && Number(q.correctAnswer) === Number(ansIdx)) correctCount++;
      }

      const score = correctCount * 10;
      const maxScore = activeQuestions.length * 10;
      const totalPoints = 50;
      const attemptTopic = topicDefinition.id;

      const { data: submissionResult, error: attemptError } = await submitQuizAttemptAndAward({
        userId,
        quizId: fallbackDailyQuizId,
        topic: attemptTopic,
        score,
        maxScore,
        durationSeconds: Number.isFinite(Number(durationSeconds)) ? Number(durationSeconds) : null,
        isFlagged: false,
        isTestMode,
      });

      if (attemptError) {
        if (isTestMode && attemptError.code === '23505') {
          return NextResponse.json(successNoPoints(score, maxScore, totalPoints, { isFallback: true }));
        }
        if (isDailyAttemptLimitError(attemptError)) {
          if (isTestMode) {
            return NextResponse.json(successNoPoints(score, maxScore, totalPoints, { isFallback: true }));
          }
          const limitResponse = await enforceDailyQuizAttemptLimit(userId);
          if (limitResponse) return limitResponse;
        }
        if (attemptError.code === '23505') {
          return duplicateAttemptResponse();
        }
        throw attemptError;
      }

      const finalPointsAwarded = Number(submissionResult?.points_awarded ?? 0);
      const awardReason = String(submissionResult?.reason || '');
      const todayPoints = Number(submissionResult?.today_points ?? 0);
      const dailyLimit = Number(submissionResult?.daily_limit ?? 100);
      const attemptSummary = await getTodaysQuizAttemptSummary(userId);
      const awardMessage = isTestMode
        ? 'Test mode active. Quiz recorded, but no leaderboard points were added.'
        : finalPointsAwarded > 0
          ? `Topic completed! ${finalPointsAwarded} points added to leaderboard.`
          : awardReason === 'daily_limit_reached'
            ? 'You have reached today\'s 100-point limit. Quiz completed, but no points were added.'
            : 'Quiz completed, but points could not be added right now.';

      return NextResponse.json({
        success: true,
        score,
        maxScore,
        points: finalPointsAwarded,
        totalPossiblePoints: totalPoints,
        message: awardMessage,
        reason: awardReason,
        todayPoints,
        dailyLimit,
        isFallback: true,
        attemptsToday: attemptSummary.attemptsToday,
        maxDailyAttempts: attemptSummary.maxDailyAttempts,
        remainingDailyAttempts: attemptSummary.remainingDailyAttempts,
        lockedUntil: attemptSummary.lockedUntil,
      });
    }

    const { data: quiz, error: quizError } = await supabaseAdmin
      .from('daily_quizzes')
      .select('question_ids, quiz_date')
      .eq('id', quizId)
      .single();

    const todayDate = new Date().toISOString().split('T')[0];
    if (quizError || !quiz || quiz.quiz_date !== todayDate) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    const topicDefinition = getTopicById(topic);
    if (!topicDefinition) {
      return NextResponse.json({ error: 'A valid quiz topic is required.' }, { status: 400 });
    }

    const questionIds = quiz.question_ids as string[];
    const { data: questions, error: qError } = await supabaseAdmin
      .from('questions')
      .select('id, category, correct_answer_index')
      .in('id', questionIds);

    if (qError || !questions) {
      return NextResponse.json({ error: 'Questions not found' }, { status: 500 });
    }

    const candidateQuestions = filterQuestionsByTopic(questions, topicDefinition.id);
    if (candidateQuestions.length !== TOPIC_QUIZ_SIZE) {
      return NextResponse.json(
        { error: 'Please use the current five-question topic quiz.' },
        { status: 400 }
      );
    }

    const activeQuestionIds = candidateQuestions.map((question) => String(question.id));

    if (!hasAnswersForEveryQuestion(answers, activeQuestionIds)) {
      return NextResponse.json(
        { error: 'Please answer every question before submitting this quiz.' },
        { status: 400 }
      );
    }

    let correctCount = 0;
    const questionMap = new Map(candidateQuestions.map((q) => [String(q.id), q.correct_answer_index]));
    for (const [qId, ansIdx] of Object.entries(answers)) {
      if (questionMap.get(String(qId)) === Number(ansIdx)) correctCount++;
    }

    const score = correctCount * 10;
    const maxScore = activeQuestionIds.length * 10;
    const isFlagged = Number(durationSeconds) < 20;

    if (!isTestMode) {
      const limitResponse = await enforceDailyQuizAttemptLimit(userId);
      if (limitResponse) {
        return limitResponse;
      }
    }

    const attemptTopic = topicDefinition.id;
    const { data: existingAttempt } = await supabaseAdmin
      .from('quiz_attempts')
      .select('id')
      .eq('user_id', userId)
      .eq('quiz_id', quizId)
      .eq('topic', attemptTopic)
      .maybeSingle();

    if (!isTestMode && existingAttempt) {
      return duplicateAttemptResponse();
    }

    const { data: submissionResult, error: attemptError } = await submitQuizAttemptAndAward({
      userId,
      quizId,
      topic: attemptTopic,
      score,
      maxScore,
      durationSeconds: Number.isFinite(Number(durationSeconds)) ? Number(durationSeconds) : null,
      isFlagged,
      isTestMode,
    });

    const totalPoints = 50;

    if (attemptError) {
      if (isTestMode && attemptError.code === '23505') {
        return NextResponse.json(successNoPoints(score, maxScore, totalPoints, { attemptId: null }));
      }
      if (isDailyAttemptLimitError(attemptError)) {
        if (isTestMode) {
          return NextResponse.json(successNoPoints(score, maxScore, totalPoints, { attemptId: null }));
        }
        const limitResponse = await enforceDailyQuizAttemptLimit(userId);
        if (limitResponse) return limitResponse;
      }
      if (attemptError.code === '23505') {
        return duplicateAttemptResponse();
      }
      throw attemptError;
    }

    const finalPointsAwarded = Number(submissionResult?.points_awarded ?? 0);
    const awardReason = String(submissionResult?.reason || '');
    const todayPoints = Number(submissionResult?.today_points ?? 0);
    const dailyLimit = Number(submissionResult?.daily_limit ?? 100);
    const attemptSummary = await getTodaysQuizAttemptSummary(userId);
    const awardMessage = isTestMode
      ? 'Test mode active. Quiz recorded, but no leaderboard points were added.'
      : finalPointsAwarded > 0
        ? `Topic completed! ${finalPointsAwarded} points added to leaderboard.`
        : awardReason === 'daily_limit_reached'
          ? 'You have reached today\'s 100-point limit. Quiz completed, but no points were added.'
          : 'Quiz completed, but points could not be added right now.';

    return NextResponse.json({
      success: true,
      score,
      maxScore,
      points: finalPointsAwarded,
      totalPossiblePoints: totalPoints,
      message: awardMessage,
      reason: awardReason,
      todayPoints,
      dailyLimit,
      attemptId: submissionResult?.attempt_id ?? null,
      attemptsToday: attemptSummary.attemptsToday,
      maxDailyAttempts: attemptSummary.maxDailyAttempts,
      remainingDailyAttempts: attemptSummary.remainingDailyAttempts,
      lockedUntil: attemptSummary.lockedUntil,
    });
  } catch (err: any) {
    console.error('Submit error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
