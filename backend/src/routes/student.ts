// backend/src/routes/student.ts
// ─────────────────────────────────────────────────────────────
// GET  /api/student/dashboard   — all data needed for the dashboard
// GET  /api/student/profile     — student profile
// PUT  /api/student/onboarding  — save onboarding data
// POST /api/student/session/start  — start a learning session
// PUT  /api/student/session/end    — end a learning session
// ─────────────────────────────────────────────────────────────

import { Router, Response } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { requireAuth, AuthRequest } from '../middleware/requireAuth';

const router = Router();

// All student routes require auth
router.use(requireAuth);

// ── GET /api/student/dashboard ────────────────────────────────
// Returns everything the dashboard needs in one request
router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // 1. Get student profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('child_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    // 2. Get island progress (joined with island master data)
    const { data: islands, error: islandError } = await supabaseAdmin
      .from('student_island_progress')
      .select(`
        *,
        island:islands(id, name, phoneme, emoji, description, order_index)
      `)
      .eq('student_id', profile.id)
      .order('island_id');

    if (islandError) throw islandError;

    // 3. Get phoneme mastery scores
    const { data: mastery, error: masteryError } = await supabaseAdmin
      .from('phoneme_mastery')
      .select(`
        *,
        island:islands(id, name, phoneme)
      `)
      .eq('student_id', profile.id)
      .order('island_id');

    if (masteryError) throw masteryError;

    // 4. Get latest session (for Leo's message context)
    const { data: lastSession } = await supabaseAdmin
      .from('session_history')
      .select('*')
      .eq('student_id', profile.id)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    // 5. Get active island details for today's quest
    const activeIsland = islands?.find(i => i.status === 'active');

    // 6. Compute Leo message based on progress
    const leoMessage = computeLeoMessage(profile, activeIsland, mastery || []);

    return res.json({
      profile: {
        id:           profile.id,
        name:         profile.name,
        avatar:       profile.avatar,
        sunCoins:     profile.sun_coins,
        streakDays:   profile.streak_days,
        onboardingDone: profile.onboarding_done,
        interests:    profile.interests,
      },
      islands: islands || [],
      mastery:  mastery || [],
      lastSession,
      activeIsland,
      leoMessage,
    });

  } catch (err: any) {
    console.error('[student/dashboard]', err);
    return res.status(500).json({ error: err.message });
  }
});

// ── GET /api/student/profile ──────────────────────────────────
router.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('child_profiles')
      .select('*')
      .eq('user_id', req.user!.id)
      .single();

    if (error || !profile) return res.status(404).json({ error: 'Profile not found' });

    return res.json({ profile });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/student/onboarding ───────────────────────────────
router.put('/onboarding', async (req: AuthRequest, res: Response) => {
  const { interests, consentWebcam, consentMic, consentEmotion } = req.body;

  try {
    const { data, error } = await supabaseAdmin
      .from('child_profiles')
      .update({
        interests,
        consent_webcam:  consentWebcam,
        consent_mic:     consentMic,
        consent_emotion: consentEmotion,
        onboarding_done: true,
      })
      .eq('user_id', req.user!.id)
      .select()
      .single();

    if (error) throw error;

    return res.json({ message: 'Onboarding saved', profile: data });
  } catch (err: any) {
    console.error('[student/onboarding]', err);
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /api/student/session/start ──────────────────────────
router.post('/session/start', async (req: AuthRequest, res: Response) => {
  try {
    const { data: profile } = await supabaseAdmin
      .from('child_profiles')
      .select('id')
      .eq('user_id', req.user!.id)
      .single();

    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const { data: session, error } = await supabaseAdmin
      .from('session_history')
      .insert({ student_id: profile.id })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({ sessionId: session.id });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/student/session/end ─────────────────────────────
router.put('/session/end', async (req: AuthRequest, res: Response) => {
  const { sessionId, activitiesDone, coinsEarned, islandsVisited } = req.body;

  if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

  try {
    const now      = new Date();
    const { data: session } = await supabaseAdmin
      .from('session_history')
      .select('started_at')
      .eq('id', sessionId)
      .single();

    const durationSeconds = session
      ? Math.floor((now.getTime() - new Date(session.started_at).getTime()) / 1000)
      : 0;

    const { error } = await supabaseAdmin
      .from('session_history')
      .update({
        ended_at:         now.toISOString(),
        duration_seconds: durationSeconds,
        activities_done:  activitiesDone || 0,
        coins_earned:     coinsEarned    || 0,
        islands_visited:  islandsVisited || [],
      })
      .eq('id', sessionId);

    if (error) throw error;

    // Add earned coins to student balance
    if (coinsEarned && coinsEarned > 0) {
      const { data: prof } = await supabaseAdmin
        .from('child_profiles')
        .select('id, sun_coins, user_id')
        .eq('user_id', req.user!.id)
        .single();

      if (prof) {
        await supabaseAdmin
          .from('child_profiles')
          .update({ sun_coins: (prof.sun_coins || 0) + coinsEarned })
          .eq('id', prof.id);
      }
    }

    return res.json({ message: 'Session ended', durationSeconds });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── Leo message logic ─────────────────────────────────────────
function computeLeoMessage(profile: any, activeIsland: any, mastery: any[]): string {
  const name = profile.name;

  if (profile.streak_days >= 7) {
    return `${profile.streak_days} days in a row — that's incredible, ${name}! The jungle is so proud of you! 🌴`;
  }

  if (activeIsland) {
    const pct = activeIsland.progress_pct;
    if (pct >= 80) {
      return `You're SO close to completing ${activeIsland.island?.name}! Just a little more — you've got this! 🔥`;
    }
    if (pct >= 40) {
      return `Great progress on ${activeIsland.island?.name}! You're already ${pct}% through. Keep going! ⭐`;
    }
    return `${activeIsland.island?.name} is waiting for you today, ${name}! Let's learn some new sounds! 🦁`;
  }

  if (profile.streak_days === 0) {
    return `Welcome back, ${name}! Let's start your streak today. Even 5 minutes helps! 🌿`;
  }

  return `You're doing amazing, ${name}! Every day you practise, you get stronger! 💪`;
}

export default router;