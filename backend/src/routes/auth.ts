// backend/src/routes/auth.ts

import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin';

const router = Router();

// ── Helpers ───────────────────────────────────────────────────
const generateChildEmail = (name: string, suffix: string) =>
    `child_${name.toLowerCase().replace(/[^a-z0-9]/g, '')}_${suffix}@lumina.app`;

const randomSuffix = () => Math.random().toString(36).substring(2, 6);

// ── POST /api/auth/child/signup ───────────────────────────────
router.post('/child/signup', async (req: Request, res: Response) => {
    const { name, avatar, emojiPin } = req.body;

    if (!name || !avatar || !emojiPin || emojiPin.length !== 4) {
        return res.status(400).json({ error: 'name, avatar and emojiPin (4 items) are required' });
    }

    try {
        const suffix = randomSuffix();
        const email = generateChildEmail(name, suffix);
        const password = `Lumina_${name}_${emojiPin.join('')}_${suffix}`;

        // 1. Create Supabase auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { role: 'student', display_name: name },
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('No user returned from auth');

        // 2. Insert child_profiles — store auth_email + auth_password for login
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('child_profiles')
            .insert({
                user_id: authData.user.id,
                name: name.toUpperCase(),
                avatar,
                emoji_pin: JSON.stringify(emojiPin),
                auth_email: email,
                auth_password: password,
            })
            .select()
            .single();

        if (profileError) {
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            throw profileError;
        }

        // 3. Initialise 8 island rows
        const { error: initError } = await supabaseAdmin
            .rpc('initialise_student_islands', { p_student_id: profile.id });

        if (initError) console.error('Island init error (non-fatal):', initError);

        // 4. Sign in and return session
        const { data: session, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
            email,
            password,
        });

        if (sessionError) throw sessionError;

        return res.status(201).json({
            message: 'Child account created',
            session: session.session,
            profile,
        });

    } catch (err: any) {
        console.error('[child/signup]', err);
        return res.status(500).json({ error: err.message || 'Signup failed' });
    }
});

// ── POST /api/auth/child/login ────────────────────────────────
router.post('/child/login', async (req: Request, res: Response) => {
    const { name, emojiPin } = req.body;

    if (!name || !emojiPin || emojiPin.length !== 4) {
        return res.status(400).json({ error: 'name and emojiPin (4 items) are required' });
    }

    try {
        // 1. Look up by name — select auth_email and auth_password (not auth_password_hash)
        const { data: profiles, error: fetchError } = await supabaseAdmin
            .from('child_profiles')
            .select('id, name, avatar, emoji_pin, auth_email, auth_password, onboarding_done, sun_coins, streak_days')
            .ilike('name', name.trim());

        if (fetchError) throw fetchError;
        if (!profiles || profiles.length === 0) {
            return res.status(404).json({ error: "We couldn't find that name. Check your spelling!" });
        }

        // 2. Match emoji PIN
        const matched = profiles.find(
            (p: any) => JSON.parse(p.emoji_pin).join('') === emojiPin.join('')
        );

        if (!matched) {
            return res.status(401).json({ error: "That PIN doesn't match. Try again! 🔐" });
        }

        if (!matched.auth_email || !matched.auth_password) {
            return res.status(500).json({ error: 'Account credentials missing. Please sign up again.' });
        }

        // 3. Sign in with stored credentials
        const { data: session, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
            email: matched.auth_email,
            password: matched.auth_password,
        });

        if (signInError) throw signInError;

        // 4. Update streak
        await updateStreak(matched.id);

        return res.json({
            message: 'Login successful',
            session: session.session,
            profile: {
                id: matched.id,
                name: matched.name,
                avatar: matched.avatar,
                onboarding_done: matched.onboarding_done,
                sun_coins: matched.sun_coins,
                streak_days: matched.streak_days,
            },
        });

    } catch (err: any) {
        console.error('[child/login]', err);
        return res.status(500).json({ error: err.message || 'Login failed' });
    }
});

// ── POST /api/auth/adult/signup ───────────────────────────────
router.post('/adult/signup', async (req: Request, res: Response) => {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password || !role) {
        return res.status(400).json({ error: 'fullName, email, password and role are required' });
    }
    if (!['teacher', 'parent'].includes(role)) {
        return res.status(400).json({ error: 'role must be teacher or parent' });
    }

    try {
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { role, full_name: fullName },
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('No user returned');

        const { data: profile, error: profileError } = await supabaseAdmin
            .from('adult_profiles')
            .insert({ user_id: authData.user.id, full_name: fullName, role })
            .select()
            .single();

        if (profileError) {
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            throw profileError;
        }

        const { data: session, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
            email, password,
        });
        if (sessionError) throw sessionError;

        return res.status(201).json({
            message: 'Adult account created',
            session: session.session,
            profile,
        });

    } catch (err: any) {
        console.error('[adult/signup]', err);
        return res.status(500).json({ error: err.message || 'Signup failed' });
    }
});

// ── POST /api/auth/adult/login ────────────────────────────────
router.post('/adult/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'email and password are required' });
    }

    try {
        const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });
        if (error) throw error;

        const { data: profile } = await supabaseAdmin
            .from('adult_profiles')
            .select('*')
            .eq('user_id', data.user.id)
            .single();

        return res.json({
            message: 'Login successful',
            session: data.session,
            profile,
        });

    } catch (err: any) {
        console.error('[adult/login]', err);
        const msg = err.message?.includes('Invalid login credentials')
            ? 'Wrong email or password. Please try again.'
            : err.message || 'Login failed';
        return res.status(401).json({ error: msg });
    }
});

// ── Streak helper ─────────────────────────────────────────────
async function updateStreak(studentId: string) {
    const { data: profile } = await supabaseAdmin
        .from('child_profiles')
        .select('streak_days, last_active_date')
        .eq('id', studentId)
        .single();

    if (!profile) return;

    const today = new Date().toISOString().split('T')[0];
    const lastDate = profile.last_active_date;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    let newStreak = profile.streak_days || 0;

    if (lastDate === today) {
        return; // already logged in today
    } else if (lastDate === yesterday) {
        newStreak += 1;
    } else {
        newStreak = 1;
    }

    await supabaseAdmin
        .from('child_profiles')
        .update({ streak_days: newStreak, last_active_date: today })
        .eq('id', studentId);
}

export default router;
