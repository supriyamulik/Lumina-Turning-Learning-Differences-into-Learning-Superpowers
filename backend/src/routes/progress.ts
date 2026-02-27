// backend/src/routes/progress.ts
// ─────────────────────────────────────────────────────────────
// POST /api/progress/activity    — save one activity result + update mastery
// GET  /api/progress/island/:id  — get full island progress for student
// POST /api/progress/coins       — award sun coins
//
// FIX: recomputeIslandProgress now calculates progress as:
//   (number of activity types with a passing score ≥ 60) / 5 × 100
//
//   Old (broken): averaged raw scores across all 5 types — unfinished
//   activities counted as 0, dragging the average below 80% forever.
//
//   New: each activity is either "passed" (best score ≥ 60) or "not yet".
//   5/5 passed  → 100% → island completes
//   3/5 passed  →  60%
//   1/5 passed  →  20%
//   The progress ring on the map and mission board both reflect this.
// ─────────────────────────────────────────────────────────────

import { Router, Response } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { requireAuth, AuthRequest } from '../middleware/requireAuth';

const router = Router();
router.use(requireAuth);

const ACTIVITY_TYPES = ['flashcard', 'word_sort', 'blending', 'listen_find', 'spell_it'];
const PASS_THRESHOLD = 60;   // score ≥ 60 counts as "activity passed"
const COMPLETE_AT = 5;    // all 5 activities must be passed to complete island

// ── POST /api/progress/activity ───────────────────────────────
router.post('/activity', async (req: AuthRequest, res: Response) => {
    const {
        islandId,
        activityType,
        score,
        totalQuestions,
        correct,
        timeSpentSec,
        phonemeErrors,
    } = req.body;

    if (!islandId || !activityType || score == null) {
        return res.status(400).json({ error: 'islandId, activityType and score are required' });
    }

    try {
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('child_profiles')
            .select('id, sun_coins')
            .eq('user_id', req.user!.id)
            .single();

        if (profileError || !profile) {
            return res.status(404).json({ error: 'Student profile not found' });
        }

        const studentId = profile.id;

        // 1. Save activity score
        const { error: scoreError } = await supabaseAdmin
            .from('activity_scores')
            .insert({
                student_id: studentId,
                island_id: islandId,
                activity_type: activityType,
                score,
                total_questions: totalQuestions || 0,
                correct: correct || 0,
                time_spent_sec: timeSpentSec || 0,
                phoneme_errors: phonemeErrors || {},
            });

        if (scoreError) throw scoreError;

        // 2. Update rolling mastery score for this island
        await updateMastery(studentId, islandId, score);

        // 3. Recompute island progress correctly
        //    Returns: { progressPct, passedCount, bestPerType }
        const { progressPct, passedCount, bestPerType } = await recomputeIslandProgress(studentId, islandId);

        // 4. Award coins based on this activity's score
        const coinsEarned = score >= 80 ? 10 : score >= 60 ? 5 : 2;
        await supabaseAdmin
            .from('child_profiles')
            .update({ sun_coins: (profile.sun_coins || 0) + coinsEarned })
            .eq('id', studentId);

        // 5. Complete island if ALL 5 activities passed
        let islandCompleted = false;
        if (passedCount >= COMPLETE_AT) {
            islandCompleted = await maybeCompleteIsland(studentId, islandId);
        }

        return res.json({
            message: 'Activity saved',
            coinsEarned,
            progressPct,
            passedCount,
            totalActivities: ACTIVITY_TYPES.length,
            islandCompleted,
            bestScores: bestPerType,   // handy for the mission board
        });

    } catch (err: any) {
        console.error('[progress/activity]', err);
        return res.status(500).json({ error: err.message });
    }
});

// ── GET /api/progress/island/:id ─────────────────────────────
router.get('/island/:id', async (req: AuthRequest, res: Response) => {
    const islandId = parseInt(req.params.id as string, 10);

    if (isNaN(islandId)) {
        return res.status(400).json({ error: 'Invalid island id' });
    }

    try {
        const { data: profile } = await supabaseAdmin
            .from('child_profiles')
            .select('id')
            .eq('user_id', req.user!.id)
            .single();

        if (!profile) return res.status(404).json({ error: 'Profile not found' });

        // All activity score rows for this island (ordered newest first)
        const { data: scores } = await supabaseAdmin
            .from('activity_scores')
            .select('*')
            .eq('student_id', profile.id)
            .eq('island_id', islandId)
            .order('played_at', { ascending: false });

        // Island-level progress row
        const { data: progress } = await supabaseAdmin
            .from('student_island_progress')
            .select('*')
            .eq('student_id', profile.id)
            .eq('island_id', islandId)
            .single();

        // Phoneme mastery row
        const { data: mastery } = await supabaseAdmin
            .from('phoneme_mastery')
            .select('*')
            .eq('student_id', profile.id)
            .eq('island_id', islandId)
            .single();

        // Compute best score per activity type for the mission board ticks
        const bestPerType: Record<string, number> = {};
        for (const s of scores ?? []) {
            if (!bestPerType[s.activity_type] || s.score > bestPerType[s.activity_type]) {
                bestPerType[s.activity_type] = s.score;
            }
        }

        // Count how many activities are passed
        const passedCount = ACTIVITY_TYPES.filter(t => (bestPerType[t] ?? 0) >= PASS_THRESHOLD).length;

        return res.json({
            scores,          // full score history
            progress,        // student_island_progress row (has progress_pct, status)
            mastery,         // phoneme_mastery row
            bestScores: bestPerType,   // { flashcard: 85, word_sort: 70, ... }
            passedCount,
            totalActivities: ACTIVITY_TYPES.length,
        });

    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

// ── POST /api/progress/coins ──────────────────────────────────
router.post('/coins', async (req: AuthRequest, res: Response) => {
    const { amount, reason } = req.body;

    if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'amount must be positive' });
    }

    try {
        const { data: profile, error } = await supabaseAdmin
            .from('child_profiles')
            .select('id, sun_coins')
            .eq('user_id', req.user!.id)
            .single();

        if (error || !profile) return res.status(404).json({ error: 'Profile not found' });

        const newTotal = (profile.sun_coins || 0) + amount;

        await supabaseAdmin
            .from('child_profiles')
            .update({ sun_coins: newTotal })
            .eq('id', profile.id);

        return res.json({ newTotal, reason });

    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════

// ── Update rolling mastery score ──────────────────────────────
async function updateMastery(studentId: string, islandId: number, newScore: number) {
    // Take rolling average of last 4 scores + this one
    const { data: recent } = await supabaseAdmin
        .from('activity_scores')
        .select('score')
        .eq('student_id', studentId)
        .eq('island_id', islandId)
        .order('played_at', { ascending: false })
        .limit(4);

    const allScores = [newScore, ...(recent || []).map((r: any) => r.score)];
    const avg = Math.round(allScores.reduce((a: number, b: number) => a + b, 0) / allScores.length);

    const { data: existing } = await supabaseAdmin
        .from('phoneme_mastery')
        .select('id, attempts')
        .eq('student_id', studentId)
        .eq('island_id', islandId)
        .single();

    if (existing) {
        await supabaseAdmin
            .from('phoneme_mastery')
            .update({
                mastery_score: avg,
                attempts: (existing.attempts || 0) + 1,
                last_updated: new Date().toISOString(),
            })
            .eq('id', existing.id);
    } else {
        await supabaseAdmin
            .from('phoneme_mastery')
            .insert({
                student_id: studentId,
                island_id: islandId,
                mastery_score: avg,
                attempts: 1,
            });
    }
}

// ── Recompute island progress ─────────────────────────────────
// Progress = (activities with best score ≥ 60) / 5 × 100
// This means:
//   • Completing 1 activity correctly → 20%
//   • Completing 3 activities correctly → 60%
//   • Completing all 5 correctly → 100% → triggers island completion
async function recomputeIslandProgress(
    studentId: string,
    islandId: number,
): Promise<{ progressPct: number; passedCount: number; bestPerType: Record<string, number> }> {

    const { data: scores } = await supabaseAdmin
        .from('activity_scores')
        .select('activity_type, score')
        .eq('student_id', studentId)
        .eq('island_id', islandId);

    const bestPerType: Record<string, number> = {};
    for (const s of scores ?? []) {
        if (!bestPerType[s.activity_type] || s.score > bestPerType[s.activity_type]) {
            bestPerType[s.activity_type] = s.score;
        }
    }

    // Count activities where the student has scored ≥ PASS_THRESHOLD at least once
    const passedCount = ACTIVITY_TYPES.filter(
        t => (bestPerType[t] ?? 0) >= PASS_THRESHOLD,
    ).length;

    // Progress as a clean percentage of activities completed
    const progressPct = Math.round((passedCount / ACTIVITY_TYPES.length) * 100);

    // Persist to student_island_progress
    const { data: existing } = await supabaseAdmin
        .from('student_island_progress')
        .select('id, status')
        .eq('student_id', studentId)
        .eq('island_id', islandId)
        .single();

    if (existing) {
        // Never overwrite a 'completed' status with 'in_progress'
        const newStatus = existing.status === 'completed'
            ? 'completed'
            : passedCount > 0 ? 'in_progress' : 'active';

        await supabaseAdmin
            .from('student_island_progress')
            .update({
                progress_pct: progressPct,
                status: newStatus,
                updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
    } else {
        // Create the row if it does not exist yet
        await supabaseAdmin
            .from('student_island_progress')
            .insert({
                student_id: studentId,
                island_id: islandId,
                progress_pct: progressPct,
                status: passedCount > 0 ? 'in_progress' : 'active',
            });
    }

    return { progressPct, passedCount, bestPerType };
}

// ── Complete island + unlock next ────────────────────────────
async function maybeCompleteIsland(studentId: string, islandId: number): Promise<boolean> {
    const { data: current } = await supabaseAdmin
        .from('student_island_progress')
        .select('status')
        .eq('student_id', studentId)
        .eq('island_id', islandId)
        .single();

    // Already completed — nothing to do
    if (!current || current.status === 'completed') return false;

    // Mark this island as completed
    await supabaseAdmin
        .from('student_island_progress')
        .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            progress_pct: 100,
        })
        .eq('student_id', studentId)
        .eq('island_id', islandId);

    // Unlock the next island (islands 1–5)
    const nextIslandId = islandId + 1;
    if (nextIslandId <= 5) {
        const { data: nextIsland } = await supabaseAdmin
            .from('student_island_progress')
            .select('id, status')
            .eq('student_id', studentId)
            .eq('island_id', nextIslandId)
            .single();

        if (nextIsland) {
            // Only unlock if it is still locked
            if (nextIsland.status === 'locked' || nextIsland.status === 'not_started') {
                await supabaseAdmin
                    .from('student_island_progress')
                    .update({
                        status: 'active',
                        unlocked_at: new Date().toISOString(),
                    })
                    .eq('id', nextIsland.id);
            }
        } else {
            // Row doesn't exist yet — create it as active
            await supabaseAdmin
                .from('student_island_progress')
                .insert({
                    student_id: studentId,
                    island_id: nextIslandId,
                    status: 'active',
                    progress_pct: 0,
                    unlocked_at: new Date().toISOString(),
                });
        }
    }

    return true;
}

export default router;