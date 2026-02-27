import React, { useState, useRef } from 'react';
import { authApi, setToken, setProfile, getProfile } from '../lib/api';

// ─── Types ────────────────────────────────────────────────────
type Mode = 'child' | 'adult';
type Step = 'form' | 'done';

// ─── Lumina Logo ──────────────────────────────────────────────
interface LuminaLogoProps { size?: number; color?: string; }
const LuminaLogo: React.FC<LuminaLogoProps> = ({ size = 36, color = '#1A7A62' }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <path d="M20 32 C20 32 8 27 8 14 L8 10 C8 10 14 11 20 16 C26 11 32 10 32 10 L32 14 C32 27 20 32 20 32Z" fill={color} opacity="0.15" />
        <path d="M20 30 C20 30 9 25.5 9 13.5 L9 11 C9 11 14.5 12 20 17 L20 30Z" fill={color} opacity="0.9" />
        <path d="M20 30 C20 30 31 25.5 31 13.5 L31 11 C31 11 25.5 12 20 17 L20 30Z" fill={color} opacity="0.7" />
        <rect x="19.2" y="17" width="1.6" height="13" rx="0.8" fill={color} />
        <circle cx="20" cy="8" r="3.5" fill="#F5A623" opacity="0.9" />
        <line x1="20" y1="3" x2="20" y2="1" stroke="#F5A623" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="24.5" y1="4.5" x2="25.8" y2="3.2" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="15.5" y1="4.5" x2="14.2" y2="3.2" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="26" y1="8" x2="28" y2="8" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="14" y1="8" x2="12" y2="8" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

// ─── Jungle Strip ─────────────────────────────────────────────
const JungleStrip: React.FC = () => (
    <svg viewBox="0 0 800 120" preserveAspectRatio="xMidYMax slice"
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, width: '100%', height: 120, pointerEvents: 'none' }}>
        <path d="M0 80 Q100 65 200 72 Q300 80 400 68 Q500 56 600 70 Q700 84 800 72 L800 120 L0 120Z" fill="#A8C8A4" opacity="0.7" />
        <path d="M0 90 Q120 78 240 84 Q360 92 480 80 Q600 68 720 80 Q780 86 800 82 L800 120 L0 120Z" fill="#8DB889" opacity="0.9" />
        <g transform="translate(30,30)">
            <rect x="-5" y="40" width="10" height="50" rx="5" fill="#9C7B5A" opacity="0.6" />
            <circle cx="0" cy="30" r="32" fill="#B5D6B2" opacity="0.8" />
            <circle cx="-14" cy="20" r="22" fill="#C2DEC0" opacity="0.75" />
            <circle cx="14" cy="18" r="20" fill="#A8CFA4" opacity="0.7" />
        </g>
        <g transform="translate(760,20)">
            <rect x="-5" y="50" width="10" height="50" rx="5" fill="#9C7B5A" opacity="0.6" />
            <circle cx="0" cy="38" r="34" fill="#A8CFA4" opacity="0.8" />
            <circle cx="-16" cy="26" r="22" fill="#B5D6B2" opacity="0.75" />
            <circle cx="16" cy="24" r="20" fill="#C2DEC0" opacity="0.7" />
        </g>
        {[220, 360, 440, 560].map((x, i) => (
            <g key={i} transform={`translate(${x},88)`}>
                {[0, 60, 120, 180, 240, 300].map((deg, j) => {
                    const rad = Math.PI * deg / 180;
                    return <ellipse key={j} cx={Math.cos(rad) * 6} cy={Math.sin(rad) * 6} rx="4.5" ry="3"
                        fill={['#F8BBD0', '#FFF9C4', '#B3E5FC', '#DCEDC8'][i % 4]} opacity="0.85"
                        transform={`rotate(${deg} ${Math.cos(rad) * 6} ${Math.sin(rad) * 6})`} />;
                })}
                <circle cx="0" cy="0" r="3.5" fill={['#F48FB1', '#FFE082', '#81D4FA', '#AED581'][i % 4]} />
            </g>
        ))}
    </svg>
);

// ─── Emoji rows (must match Signup.tsx exactly) ───────────────
const EMOJI_ROWS = [
    ['🌟', '🌈', '🦋', '🌺', '🍀'],
    ['🐵', '🦜', '🐢', '🦁', '🐘'],
    ['🍉', '🍋', '🍓', '🥭', '🍍'],
    ['⭐', '🌙', '☀️', '🌊', '🔥'],
];

// ─── Login Component ──────────────────────────────────────────
const Login: React.FC = () => {
    const [mode, setMode] = useState<Mode>('child');
    const [step, setStep] = useState<Step>('form');

    // Child state
    const [secretWord, setSecretWord] = useState('');
    const [emojiPin, setEmojiPin] = useState<string[]>([]);

    // Adult state
    const [adultEmail, setAdultEmail] = useState('');
    const [adultPass, setAdultPass] = useState('');
    const [showPass, setShowPass] = useState(false);

    // Shared
    const [shake, setShake] = useState(false);
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState('');

    const wordRef = useRef<HTMLInputElement>(null);

    const [bubbles] = useState(() =>
        Array.from({ length: 14 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            size: 18 + Math.random() * 28,
            delay: Math.random() * 6,
            dur: 7 + Math.random() * 6,
            emoji: ['🌿', '🍃', '🌸', '✨', '🌟', '🍀', '🌺'][Math.floor(Math.random() * 7)],
        }))
    );

    const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 600); };

    const addEmoji = (e: string) => { if (emojiPin.length < 4) setEmojiPin(p => [...p, e]); };
    const removeEmoji = () => setEmojiPin(p => p.slice(0, -1));

    const resetMode = (m: Mode) => {
        setMode(m);
        setSecretWord(''); setEmojiPin([]);
        setAdultEmail(''); setAdultPass('');
        setServerError(''); setStep('form');
    };

    // ── Child login ───────────────────────────────────────────
    const handleChildSubmit = async () => {
        const trimmedName = secretWord.trim().toUpperCase();
        if (trimmedName.length < 2 || emojiPin.length < 4) { triggerShake(); return; }

        setLoading(true);
        setServerError('');
        try {
            const result = await authApi.childLogin({ name: trimmedName, emojiPin });
            setToken(result.session.access_token);
            setProfile(result.profile);
            setStep('done');
        } catch (err: any) {
            setServerError(err.message || 'Login failed. Please try again.');
            triggerShake();
        } finally {
            setLoading(false);
        }
    };

    // ── Adult login ───────────────────────────────────────────
    const handleAdultSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adultEmail || !adultPass) { triggerShake(); return; }

        setLoading(true);
        setServerError('');
        try {
            const result = await authApi.adultLogin({ email: adultEmail, password: adultPass });
            setToken(result.session.access_token);
            setProfile(result.profile);
            setStep('done');
        } catch (err: any) {
            setServerError(err.message || 'Wrong email or password. Please try again.');
            triggerShake();
        } finally {
            setLoading(false);
        }
    };

    // ── Redirect after login ──────────────────────────────────
    const handleDashboardRedirect = () => {
        const profile = getProfile();
        if (!profile) { window.location.href = '/'; return; }
        if (mode === 'adult') { window.location.href = '/dashboard'; return; }
        window.location.href = profile.onboarding_done ? '/dashboard' : '/onboarding';
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700;800&family=Fraunces:ital,opsz,wght@0,9..144,700;1,9..144,500&display=swap');
                *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
                :root {
                    --cream:#FDF6ED; --teal:#1A7A62; --teal-mid:#2A9478; --teal-pale:#E4F2EE;
                    --amber:#E8920C; --amber-pale:#FDF3DC;
                    --text:#1C2E24; --text-mid:#304838; --text-soft:#5A7866;
                    --border:rgba(26,122,98,0.14); --red:#E74C3C;
                }
                body {
                    font-family:'Lexend',sans-serif; background:var(--cream);
                    min-height:100vh; overflow-x:hidden;
                    letter-spacing:0.02em; line-height:1.6; font-size:16px;
                }
                @keyframes floatUp{0%{transform:translateY(0) rotate(0deg);opacity:0}10%{opacity:0.7}90%{opacity:0.4}100%{transform:translateY(-100vh) rotate(360deg);opacity:0}}
                @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
                @keyframes fadeIn{from{opacity:0}to{opacity:1}}
                @keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-6px)}80%{transform:translateX(6px)}}
                @keyframes pop{0%{transform:scale(0.7);opacity:0}60%{transform:scale(1.12)}100%{transform:scale(1);opacity:1}}
                @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
                @keyframes successPop{0%{transform:scale(0);opacity:0}60%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
                @keyframes spin{to{transform:rotate(360deg)}}

                .page{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px 16px 140px;position:relative;overflow:hidden;background:linear-gradient(180deg,#D6EEF8 0%,#E8F5E9 60%,#C8E6C9 100%)}
                .bubble{position:absolute;pointer-events:none;animation:floatUp linear infinite;user-select:none;z-index:0}
                .card{background:rgba(253,246,237,0.96);backdrop-filter:blur(20px);border:2px solid rgba(255,255,255,0.88);border-radius:28px;padding:40px 48px;width:100%;max-width:560px;box-shadow:0 12px 52px rgba(26,100,70,0.14),inset 0 2px 0 rgba(255,255,255,1);position:relative;z-index:2;animation:fadeUp 0.6s ease both}
                .card.shake{animation:shake 0.5s ease both}
                .mode-tabs{display:flex;background:rgba(26,122,98,0.08);border-radius:100px;padding:4px;margin-bottom:28px;gap:4px}
                .mode-tab{flex:1;text-align:center;cursor:pointer;padding:10px 16px;border-radius:100px;font-family:'Lexend',sans-serif;font-size:14px;font-weight:700;border:none;background:transparent;color:var(--text-soft);transition:all 0.22s}
                .mode-tab.active{background:#fff;color:var(--teal);box-shadow:0 2px 10px rgba(26,122,98,0.14)}
                .secret-label{font-size:13px;font-weight:700;color:var(--text-soft);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:8px;display:block}
                .secret-input{width:100%;background:#fff;border:2.5px solid var(--border);border-radius:16px;padding:16px 20px;font-family:'Lexend',sans-serif;font-size:20px;font-weight:700;color:var(--text);letter-spacing:0.12em;outline:none;transition:border-color 0.2s,box-shadow 0.2s;min-height:48px}
                .secret-input:focus{border-color:var(--teal);box-shadow:0 0 0 4px rgba(26,122,98,0.1)}
                .secret-input::placeholder{color:#C0D0C8;font-weight:500;letter-spacing:0.04em}
                .pin-display{display:flex;gap:10px;justify-content:center;margin-bottom:20px}
                .pin-slot{width:62px;height:62px;background:#fff;border:2.5px solid var(--border);border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:28px;transition:all 0.2s}
                .pin-slot.filled{border-color:var(--teal);background:var(--teal-pale);box-shadow:0 4px 12px rgba(26,122,98,0.18);animation:pop 0.25s ease both}
                .pin-slot.empty-pulse{border-color:rgba(26,122,98,0.25);border-style:dashed}
                .emoji-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:16px}
                .emoji-btn{aspect-ratio:1;background:#fff;border:2px solid rgba(26,122,98,0.1);border-radius:14px;font-size:24px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.15s;user-select:none;min-height:48px}
                .emoji-btn:hover{transform:scale(1.18);border-color:var(--teal);box-shadow:0 4px 14px rgba(26,122,98,0.2);background:var(--teal-pale)}
                .emoji-btn:active{transform:scale(0.92)}
                .emoji-btn:disabled{opacity:0.4;cursor:not-allowed;transform:none}
                .input-group{margin-bottom:18px}
                .input-label{display:block;font-size:13px;font-weight:700;color:var(--text-soft);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:8px}
                .input-field{width:100%;padding:14px 18px;background:#fff;border:2.5px solid var(--border);border-radius:14px;outline:none;font-family:'Lexend',sans-serif;font-size:16px;font-weight:500;color:var(--text);transition:border-color 0.2s,box-shadow 0.2s;min-height:48px}
                .input-field:focus{border-color:var(--teal);box-shadow:0 0 0 4px rgba(26,122,98,0.1)}
                .input-field::placeholder{color:#C0D0C8}
                .pass-wrap{position:relative}
                .pass-toggle{position:absolute;right:16px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:18px;padding:4px;color:var(--text-soft)}
                .btn-primary{width:100%;padding:16px;background:var(--amber);color:#fff;font-family:'Lexend',sans-serif;font-size:17px;font-weight:800;border:none;border-radius:16px;cursor:pointer;letter-spacing:0.04em;box-shadow:0 5px 18px rgba(232,146,12,0.4);transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:8px;min-height:52px}
                .btn-primary:hover:not(:disabled){background:#CC7A00;transform:translateY(-2px);box-shadow:0 8px 24px rgba(232,146,12,0.5)}
                .btn-primary:disabled{opacity:0.55;cursor:not-allowed}
                .btn-delete{flex:0 0 auto;padding:12px 18px;background:rgba(231,76,60,0.1);color:#C0392B;font-family:'Lexend',sans-serif;font-size:14px;font-weight:700;border:2px solid rgba(231,76,60,0.2);border-radius:12px;cursor:pointer;transition:all 0.2s;min-height:48px}
                .btn-delete:hover{background:rgba(231,76,60,0.18)}
                .btn-delete:disabled{opacity:0.4;cursor:not-allowed}
                .success-card{display:flex;flex-direction:column;align-items:center;text-align:center;gap:14px;animation:successPop 0.5s ease both}
                .success-icon{font-size:72px;animation:bounce 1.5s ease-in-out infinite}
                .server-err{background:#FDECEA;border:2px solid rgba(231,76,60,0.25);border-radius:12px;padding:12px 16px;color:var(--red);font-size:14px;font-weight:700;text-align:center;margin-bottom:16px;line-height:1.6}
                .helper{font-size:14px;color:var(--text-soft);font-weight:600;text-align:center;margin-top:20px}
                .helper a{color:var(--teal);font-weight:800;text-decoration:none}
                .helper a:hover{text-decoration:underline}
                .spinner{width:18px;height:18px;border:3px solid rgba(255,255,255,0.4);border-top-color:#fff;border-radius:50%;animation:spin 0.7s linear infinite;flex-shrink:0}
            `}</style>

            <div className="page">
                {bubbles.map(b => (
                    <div key={b.id} className="bubble" style={{
                        left: `${b.x}%`, bottom: '-40px', fontSize: b.size, opacity: 0,
                        animationDelay: `${b.delay}s`, animationDuration: `${b.dur}s`,
                    }}>{b.emoji}</div>
                ))}

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, zIndex: 2, animation: 'fadeIn 0.5s ease both' }}>
                    <LuminaLogo size={40} color="#1A7A62" />
                    <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 26, color: 'var(--teal)', letterSpacing: '-0.015em' }}>Lumina</span>
                </div>

                <div className={`card${shake ? ' shake' : ''}`}>

                    {/* ── Success screen ── */}
                    {step === 'done' ? (
                        <div className="success-card">
                            <div className="success-icon">{mode === 'child' ? '🎉' : '🌿'}</div>
                            <h2 style={{ fontFamily: 'Fraunces,serif', fontSize: '1.9rem', color: 'var(--teal)', fontWeight: 700 }}>
                                Welcome back!
                            </h2>
                            <p style={{ color: 'var(--text-soft)', fontSize: 16, fontWeight: 600, maxWidth: 300, lineHeight: 1.6 }}>
                                {mode === 'child'
                                    ? "Great job! Let's get back to the jungle adventure! 🌿"
                                    : "You're logged in. Let's check your students' progress."}
                            </p>
                            <button
                                onClick={handleDashboardRedirect}
                                style={{
                                    marginTop: 8, background: 'var(--teal)', color: '#fff',
                                    fontFamily: "'Lexend',sans-serif", fontWeight: 800, fontSize: 17,
                                    padding: '14px 40px', borderRadius: 100, border: 'none',
                                    cursor: 'pointer', boxShadow: '0 5px 18px rgba(26,122,98,0.35)',
                                    transition: 'all 0.2s',
                                }}>
                                Go to dashboard →
                            </button>
                        </div>

                    ) : (
                        <>
                            {/* ── Mode tabs ── */}
                            <div className="mode-tabs">
                                {(['child', 'adult'] as Mode[]).map(m => (
                                    <button key={m} className={`mode-tab${mode === m ? ' active' : ''}`}
                                        onClick={() => resetMode(m)}>
                                        {m === 'child' ? '🌟 I\'m a learner' : '🌿 Adult log in'}
                                    </button>
                                ))}
                            </div>

                            {serverError && <div className="server-err">⚠️ {serverError}</div>}

                            {/* ── Child login ── */}
                            {mode === 'child' && (
                                <>
                                    <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.65rem', color: 'var(--text)', fontWeight: 700, textAlign: 'center', marginBottom: 6 }}>
                                        Hello, explorer! 👋
                                    </h2>
                                    <p style={{ color: 'var(--text-soft)', fontSize: 15, textAlign: 'center', marginBottom: 24, fontWeight: 600, lineHeight: 1.6 }}>
                                        Type your <strong style={{ color: 'var(--teal)' }}>name</strong> and pick your <strong style={{ color: 'var(--amber)' }}>emoji PIN</strong>
                                    </p>

                                    <div style={{ marginBottom: 20 }}>
                                        <label className="secret-label" htmlFor="secret">🔑 Your name</label>
                                        <input
                                            id="secret" ref={wordRef} type="text"
                                            className="secret-input" placeholder="e.g. ALEX"
                                            value={secretWord}
                                            onChange={e => setSecretWord(e.target.value.toUpperCase())}
                                            autoComplete="off" spellCheck={false} maxLength={12}
                                        />
                                    </div>

                                    <label className="secret-label" style={{ marginBottom: 10, display: 'block' }}>🐾 Your emoji PIN (pick 4)</label>
                                    <div className="pin-display">
                                        {Array.from({ length: 4 }, (_, i) => (
                                            <div key={i} className={`pin-slot${emojiPin[i] ? ' filled' : ' empty-pulse'}`}>
                                                {emojiPin[i] || ''}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="emoji-grid">
                                        {EMOJI_ROWS.flat().map(e => (
                                            <button key={e} className="emoji-btn"
                                                onClick={() => addEmoji(e)}
                                                disabled={emojiPin.length >= 4}>{e}</button>
                                        ))}
                                    </div>

                                    <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                                        <button className="btn-delete" onClick={removeEmoji} disabled={emojiPin.length === 0}>← Delete</button>
                                        <button className="btn-primary"
                                            disabled={secretWord.trim().length < 2 || emojiPin.length < 4 || loading}
                                            onClick={handleChildSubmit}>
                                            {loading ? <><div className="spinner" />Checking…</> : "Let's go! 🚀"}
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* ── Adult login ── */}
                            {mode === 'adult' && (
                                <>
                                    <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.65rem', color: 'var(--text)', fontWeight: 700, textAlign: 'center', marginBottom: 6 }}>
                                        Welcome back 🌿
                                    </h2>
                                    <p style={{ color: 'var(--text-soft)', fontSize: 15, textAlign: 'center', marginBottom: 28, fontWeight: 600, lineHeight: 1.6 }}>
                                        Teacher or parent? Log in below.
                                    </p>

                                    <form onSubmit={handleAdultSubmit}>
                                        <div className="input-group">
                                            <label className="input-label" htmlFor="email">📧 Email address</label>
                                            <input id="email" type="email" className="input-field"
                                                placeholder="you@example.com"
                                                value={adultEmail}
                                                onChange={e => setAdultEmail(e.target.value)}
                                                autoComplete="email" />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label" htmlFor="password">🔒 Password</label>
                                            <div className="pass-wrap">
                                                <input id="password" type={showPass ? 'text' : 'password'}
                                                    className="input-field" placeholder="Your password"
                                                    value={adultPass}
                                                    onChange={e => setAdultPass(e.target.value)}
                                                    autoComplete="current-password" />
                                                <button type="button" className="pass-toggle" onClick={() => setShowPass(s => !s)}>
                                                    {showPass ? '🙈' : '👁'}
                                                </button>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', marginBottom: 20 }}>
                                            <a href="/forgot-password" style={{ fontSize: 13, color: 'var(--teal)', fontWeight: 700, textDecoration: 'none' }}>
                                                Forgot password?
                                            </a>
                                        </div>
                                        <button type="submit" className="btn-primary"
                                            disabled={loading || !adultEmail || !adultPass}>
                                            {loading ? <><div className="spinner" />Logging in…</> : 'Log in →'}
                                        </button>
                                    </form>
                                </>
                            )}

                            <p className="helper">New to Lumina? <a href="/signup">Create an account</a></p>
                        </>
                    )}
                </div>

                <JungleStrip />
            </div>
        </>
    );
};

export default Login;