import React, { useState } from 'react';
import { authApi, setToken, setProfile } from '../lib/api';

// ─── Types ────────────────────────────────────────────────────
type Mode = 'child' | 'adult';
type ChildStep = 'avatar' | 'name' | 'pin' | 'confirm' | 'done';
type AdultStep = 'details' | 'done';

// ─── Constants ────────────────────────────────────────────────
const JUNGLE_AVATARS = ['🦁', '🐘', '🦜', '🐵', '🦒', '🐢', '🦋', '🦊', '🐸', '🦓', '🐼', '🦩'];
const EMOJI_ROWS = [
    ['🌟', '🌈', '🦋', '🌺', '🍀'],
    ['🐵', '🦜', '🐢', '🦁', '🐘'],
    ['🍉', '🍋', '🍓', '🥭', '🍍'],
    ['⭐', '🌙', '☀️', '🌊', '🔥'],
];

// ─── Sub-components ───────────────────────────────────────────
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

const StepDots: React.FC<{ total: number; current: number }> = ({ total, current }) => (
    <div style={{ display: 'flex', gap: 7, justifyContent: 'center', marginBottom: 24 }}>
        {Array.from({ length: total }, (_, i) => (
            <div key={i} style={{
                width: i === current ? 22 : 8, height: 8, borderRadius: 100,
                background: i === current ? 'var(--amber)' : i < current ? 'var(--teal)' : 'rgba(26,122,98,0.15)',
                transition: 'all 0.3s ease',
            }} />
        ))}
    </div>
);

// ─── Signup Component ─────────────────────────────────────────
const Signup: React.FC = () => {
    const [mode, setMode] = useState<Mode>('child');

    // Child state
    const [childStep, setChildStep] = useState<ChildStep>('avatar');
    const [avatar, setAvatar] = useState('');
    const [childName, setChildName] = useState('');
    const [emojiPin, setEmojiPin] = useState<string[]>([]);
    const [confirmPin, setConfirmPin] = useState<string[]>([]);
    const [confirmingPin, setConfirming] = useState(false);
    const [pinError, setPinError] = useState(false);

    // Adult state
    const [adultStep, setAdultStep] = useState<AdultStep>('details');
    const [adultRole, setAdultRole] = useState<'teacher' | 'parent' | ''>('');
    const [adultName, setAdultName] = useState('');
    const [adultEmail, setAdultEmail] = useState('');
    const [adultPass, setAdultPass] = useState('');
    const [showPass, setShowPass] = useState(false);

    // Shared
    const [shake, setShake] = useState(false);
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState('');

    const [bubbles] = useState(() =>
        Array.from({ length: 12 }, (_, i) => ({
            id: i, x: Math.random() * 100,
            size: 18 + Math.random() * 26,
            delay: Math.random() * 6,
            dur: 8 + Math.random() * 5,
            emoji: ['🌿', '🍃', '🌸', '✨', '🌟', '🍀', '🌺'][Math.floor(Math.random() * 7)],
        }))
    );

    const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 500); };

    const resetAll = () => {
        setChildStep('avatar'); setAvatar(''); setChildName('');
        setEmojiPin([]); setConfirmPin([]); setConfirming(false); setPinError(false);
        setAdultStep('details'); setAdultRole(''); setAdultName('');
        setAdultEmail(''); setAdultPass(''); setServerError('');
    };

    // ── Child PIN helpers ─────────────────────────────────────
    const addEmoji = (e: string) => {
        if (confirmingPin) { if (confirmPin.length < 4) setConfirmPin(p => [...p, e]); }
        else { if (emojiPin.length < 4) setEmojiPin(p => [...p, e]); }
    };
    const deleteEmoji = () => {
        if (confirmingPin) setConfirmPin(p => p.slice(0, -1));
        else setEmojiPin(p => p.slice(0, -1));
    };

    // ── Child signup ──────────────────────────────────────────
    const submitChildSignup = async () => {
        if (confirmPin.join('') !== emojiPin.join('')) {
            setPinError(true); setConfirmPin([]); triggerShake(); return;
        }
        setLoading(true); setServerError('');
        try {
            const result = await authApi.childSignup({
                name: childName.trim().toUpperCase(),
                avatar,
                emojiPin,
            });
            setToken(result.session.access_token);
            setProfile(result.profile);
            setChildStep('done');
        } catch (err: any) {
            setServerError(err.message || 'Signup failed. Please try again.');
            triggerShake();
        } finally {
            setLoading(false);
        }
    };

    // ── Adult signup ──────────────────────────────────────────
    const handleAdultSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adultRole || !adultName || !adultEmail || !adultPass) { triggerShake(); return; }
        setLoading(true); setServerError('');
        try {
            const result = await authApi.adultSignup({
                fullName: adultName,
                email: adultEmail,
                password: adultPass,
                role: adultRole as 'teacher' | 'parent',
            });
            setToken(result.session.access_token);
            setProfile(result.profile);
            setAdultStep('done');
        } catch (err: any) {
            setServerError(err.message || 'Something went wrong. Please try again.');
            triggerShake();
        } finally {
            setLoading(false);
        }
    };

    // ── Password strength ─────────────────────────────────────
    const passwordStrength = (p: string): number => {
        if (p.length >= 12 && /[A-Z]/.test(p) && /[0-9]/.test(p)) return 4;
        if (p.length >= 8 && /[A-Z]/.test(p)) return 3;
        if (p.length >= 6) return 2;
        return 1;
    };
    const strengthColor = (level: number, i: number) =>
        i <= level ? level >= 4 ? '#1A7A62' : level >= 3 ? '#27AE60' : level >= 2 ? '#E8920C' : '#E74C3C' : 'rgba(0,0,0,0.08)';

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700;800&family=Fraunces:ital,opsz,wght@0,9..144,700;1,9..144,500&display=swap');
                *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
                :root {
                    --cream:#FDF6ED; --cream2:#F7EFE1;
                    --teal:#1A7A62; --teal-mid:#2A9478; --teal-pale:#E4F2EE;
                    --amber:#E8920C; --amber-pale:#FDF3DC;
                    --text:#1C2E24; --text-mid:#304838; --text-soft:#5A7866;
                    --border:rgba(26,122,98,0.14); --red:#E74C3C;
                }
                body {
                    font-family:'Lexend',sans-serif; background:var(--cream);
                    min-height:100vh; overflow-x:hidden;
                    letter-spacing:0.02em; line-height:1.6; font-size:16px;
                }
                @keyframes floatUp{0%{transform:translateY(0) rotate(0deg);opacity:0}10%{opacity:0.65}90%{opacity:0.35}100%{transform:translateY(-100vh) rotate(360deg);opacity:0}}
                @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
                @keyframes fadeIn{from{opacity:0}to{opacity:1}}
                @keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-6px)}80%{transform:translateX(6px)}}
                @keyframes pop{0%{transform:scale(0.6);opacity:0}65%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
                @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
                @keyframes successIn{0%{transform:scale(0);opacity:0}60%{transform:scale(1.12)}100%{transform:scale(1);opacity:1}}
                @keyframes wiggle{0%,100%{transform:rotate(0deg)}25%{transform:rotate(-8deg)}75%{transform:rotate(8deg)}}
                @keyframes slideIn{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}
                @keyframes spin{to{transform:rotate(360deg)}}

                .page{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px 16px 150px;position:relative;overflow:hidden;background:linear-gradient(180deg,#D6EEF8 0%,#E8F5E9 60%,#C8E6C9 100%)}
                .bubble{position:absolute;pointer-events:none;animation:floatUp linear infinite;user-select:none;z-index:0}
                .card{background:rgba(253,246,237,0.96);backdrop-filter:blur(20px);border:2px solid rgba(255,255,255,0.88);border-radius:28px;padding:36px 32px 32px;width:100%;max-width:480px;box-shadow:0 12px 52px rgba(26,100,70,0.14),inset 0 2px 0 rgba(255,255,255,1);position:relative;z-index:2;animation:fadeUp 0.55s ease both}
                .card.shake{animation:shake 0.5s ease both}
                .step-body{animation:slideIn 0.35s ease both}
                .mode-tabs{display:flex;background:rgba(26,122,98,0.08);border-radius:100px;padding:4px;margin-bottom:24px;gap:4px}
                .mode-tab{flex:1;text-align:center;cursor:pointer;padding:10px 12px;border-radius:100px;font-family:'Lexend',sans-serif;font-size:14px;font-weight:700;border:none;background:transparent;color:var(--text-soft);transition:all 0.22s}
                .mode-tab.active{background:#fff;color:var(--teal);box-shadow:0 2px 10px rgba(26,122,98,0.14)}
                .avatar-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-bottom:20px}
                .avatar-btn{aspect-ratio:1;font-size:28px;background:#fff;border:2.5px solid rgba(26,122,98,0.1);border-radius:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.18s;user-select:none;min-height:48px}
                .avatar-btn:hover{transform:scale(1.18);border-color:var(--teal);background:var(--teal-pale)}
                .avatar-btn.selected{border-color:var(--amber);background:var(--amber-pale);box-shadow:0 4px 14px rgba(232,146,12,0.3);animation:wiggle 0.5s ease}
                .name-input{width:100%;background:#fff;border:2.5px solid var(--border);border-radius:16px;padding:18px 22px;font-family:'Lexend',sans-serif;font-size:22px;font-weight:700;color:var(--text);letter-spacing:0.1em;text-align:center;outline:none;transition:border-color 0.2s,box-shadow 0.2s;margin-bottom:20px;min-height:60px}
                .name-input:focus{border-color:var(--teal);box-shadow:0 0 0 4px rgba(26,122,98,0.1)}
                .name-input::placeholder{color:#C0D0C8;font-weight:500;letter-spacing:0.04em;font-size:18px}
                .pin-display{display:flex;gap:10px;justify-content:center;margin-bottom:18px}
                .pin-slot{width:60px;height:60px;background:#fff;border:2.5px solid var(--border);border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:26px;transition:all 0.2s}
                .pin-slot.filled{border-color:var(--teal);background:var(--teal-pale);box-shadow:0 4px 12px rgba(26,122,98,0.18);animation:pop 0.22s ease both}
                .pin-slot.confirm-filled{border-color:var(--amber);background:var(--amber-pale);box-shadow:0 4px 12px rgba(232,146,12,0.2);animation:pop 0.22s ease both}
                .pin-slot.error{border-color:var(--red);background:#FDECEA}
                .pin-slot.empty-pulse{border-color:rgba(26,122,98,0.22);border-style:dashed}
                .emoji-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:14px}
                .emoji-btn{aspect-ratio:1;font-size:22px;background:#fff;border:2px solid rgba(26,122,98,0.1);border-radius:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.15s;user-select:none;min-height:44px}
                .emoji-btn:hover{transform:scale(1.18);border-color:var(--teal);background:var(--teal-pale);box-shadow:0 4px 12px rgba(26,122,98,0.18)}
                .emoji-btn:active{transform:scale(0.9)}
                .emoji-btn:disabled{opacity:0.4;cursor:not-allowed;transform:none}
                .btn-primary{width:100%;padding:15px;background:var(--amber);color:#fff;font-family:'Lexend',sans-serif;font-size:17px;font-weight:800;border:none;border-radius:16px;cursor:pointer;letter-spacing:0.04em;box-shadow:0 5px 18px rgba(232,146,12,0.4);transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:8px;min-height:52px}
                .btn-primary:hover:not(:disabled){background:#CC7A00;transform:translateY(-2px);box-shadow:0 8px 24px rgba(232,146,12,0.5)}
                .btn-primary:disabled{opacity:0.48;cursor:not-allowed}
                .btn-teal{width:100%;padding:15px;background:var(--teal);color:#fff;font-family:'Lexend',sans-serif;font-size:17px;font-weight:800;border:none;border-radius:16px;cursor:pointer;letter-spacing:0.04em;box-shadow:0 5px 18px rgba(26,122,98,0.35);transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:8px;min-height:52px}
                .btn-teal:hover:not(:disabled){background:#155F4D;transform:translateY(-2px)}
                .btn-teal:disabled{opacity:0.48;cursor:not-allowed}
                .btn-back{background:transparent;border:2px solid var(--border);border-radius:12px;padding:10px 18px;font-family:'Lexend',sans-serif;font-size:14px;font-weight:700;color:var(--text-soft);cursor:pointer;transition:all 0.18s;min-height:44px}
                .btn-back:hover{border-color:var(--teal);color:var(--teal);background:var(--teal-pale)}
                .btn-delete{padding:12px 16px;flex:0 0 auto;background:rgba(231,76,60,0.1);color:#C0392B;font-family:'Lexend',sans-serif;font-size:14px;font-weight:700;border:2px solid rgba(231,76,60,0.2);border-radius:12px;cursor:pointer;transition:all 0.18s;min-height:48px}
                .btn-delete:hover{background:rgba(231,76,60,0.18)}
                .btn-delete:disabled{opacity:0.4;cursor:not-allowed}
                .role-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px}
                .role-btn{padding:16px 12px;background:#fff;border:2.5px solid var(--border);border-radius:16px;cursor:pointer;text-align:center;font-family:'Lexend',sans-serif;font-size:14px;font-weight:700;color:var(--text-mid);transition:all 0.2s;min-height:80px}
                .role-btn .role-icon{font-size:30px;display:block;margin-bottom:6px}
                .role-btn:hover{border-color:var(--teal);background:var(--teal-pale);color:var(--teal)}
                .role-btn.selected{border-color:var(--teal);background:var(--teal-pale);color:var(--teal);box-shadow:0 4px 14px rgba(26,122,98,0.18)}
                .input-group{margin-bottom:16px}
                .input-label{display:block;font-size:12.5px;font-weight:700;color:var(--text-soft);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:7px}
                .input-field{width:100%;padding:13px 17px;background:#fff;border:2.5px solid var(--border);border-radius:14px;outline:none;font-family:'Lexend',sans-serif;font-size:16px;font-weight:500;color:var(--text);transition:border-color 0.2s,box-shadow 0.2s;min-height:48px}
                .input-field:focus{border-color:var(--teal);box-shadow:0 0 0 4px rgba(26,122,98,0.1)}
                .input-field::placeholder{color:#C0D0C8}
                .pass-wrap{position:relative}
                .pass-toggle{position:absolute;right:14px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:18px;padding:4px;color:var(--text-soft)}
                .strength-bar{display:flex;gap:4px;margin-top:8px}
                .strength-seg{flex:1;height:4px;border-radius:100px;transition:background 0.3s}
                .success-wrap{display:flex;flex-direction:column;align-items:center;text-align:center;gap:14px;animation:successIn 0.5s ease both}
                .success-icon{font-size:80px;animation:bounce 1.4s ease-in-out infinite;display:inline-block}
                .err-msg{color:var(--red);font-size:13px;font-weight:700;text-align:center;margin-top:6px}
                .server-err{background:#FDECEA;border:2px solid rgba(231,76,60,0.25);border-radius:12px;padding:12px 16px;color:var(--red);font-size:14px;font-weight:700;text-align:center;margin-bottom:14px;line-height:1.6}
                .helper{font-size:14px;color:var(--text-soft);font-weight:600;text-align:center;margin-top:18px}
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

                <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, zIndex: 2, textDecoration: 'none', animation: 'fadeIn 0.5s ease both' }}>
                    <LuminaLogo size={40} color="#1A7A62" />
                    <span style={{ fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 26, color: 'var(--teal)', letterSpacing: '-0.015em' }}>Lumina</span>
                </a>

                <div className={`card${shake ? ' shake' : ''}`}>

                    {childStep !== 'done' && adultStep !== 'done' && (
                        <div className="mode-tabs">
                            {(['child', 'adult'] as Mode[]).map(m => (
                                <button key={m} className={`mode-tab${mode === m ? ' active' : ''}`}
                                    onClick={() => { setMode(m); resetAll(); }}>
                                    {m === 'child' ? "🌿 I'm a learner" : '🌱 Teacher / Parent'}
                                </button>
                            ))}
                        </div>
                    )}

                    {serverError && <div className="server-err">⚠️ {serverError}</div>}

                    {/* ══ CHILD SIGNUP ══ */}
                    {mode === 'child' && (
                        <>
                            {/* Step 1 — Avatar */}
                            {childStep === 'avatar' && (
                                <div className="step-body">
                                    <StepDots total={3} current={0} />
                                    <h2 style={{ fontFamily: 'Fraunces,serif', fontSize: '1.55rem', color: 'var(--text)', fontWeight: 700, textAlign: 'center', marginBottom: 6 }}>
                                        Pick your jungle friend! 🌴
                                    </h2>
                                    <p style={{ color: 'var(--text-soft)', fontSize: 14.5, textAlign: 'center', marginBottom: 20, fontWeight: 600, lineHeight: 1.6 }}>
                                        This will be your avatar in Lumina
                                    </p>
                                    <div className="avatar-grid">
                                        {JUNGLE_AVATARS.map(a => (
                                            <button key={a} className={`avatar-btn${avatar === a ? ' selected' : ''}`}
                                                onClick={() => setAvatar(a)}>{a}</button>
                                        ))}
                                    </div>
                                    <button className="btn-primary" disabled={!avatar}
                                        onClick={() => setChildStep('name')}>
                                        That's my friend! →
                                    </button>
                                </div>
                            )}

                            {/* Step 2 — Name */}
                            {childStep === 'name' && (
                                <div className="step-body">
                                    <StepDots total={3} current={1} />
                                    <div style={{ textAlign: 'center', marginBottom: 12 }}>
                                        <span style={{ fontSize: 52, animation: 'bounce 2s ease-in-out infinite', display: 'inline-block' }}>{avatar}</span>
                                    </div>
                                    <h2 style={{ fontFamily: 'Fraunces,serif', fontSize: '1.55rem', color: 'var(--text)', fontWeight: 700, textAlign: 'center', marginBottom: 6 }}>
                                        What's your name? ✨
                                    </h2>
                                    <p style={{ color: 'var(--text-soft)', fontSize: 14.5, textAlign: 'center', marginBottom: 20, fontWeight: 600, lineHeight: 1.6 }}>
                                        Type your <strong style={{ color: 'var(--teal)' }}>first name</strong> — this is your secret word too!
                                    </p>
                                    <input type="text" className="name-input" placeholder="e.g. ALEX"
                                        value={childName}
                                        onChange={e => setChildName(e.target.value.toUpperCase())}
                                        maxLength={12} autoFocus autoComplete="off" spellCheck={false} />
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <button className="btn-back" onClick={() => setChildStep('avatar')}>← Back</button>
                                        <button className="btn-primary" style={{ flex: 1 }}
                                            disabled={childName.trim().length < 2}
                                            onClick={() => setChildStep('pin')}>
                                            That's me! →
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 3 — PIN */}
                            {childStep === 'pin' && (
                                <div className="step-body">
                                    <StepDots total={3} current={2} />
                                    <div style={{ textAlign: 'center', marginBottom: 10 }}>
                                        <span style={{ fontSize: 36, display: 'inline-block' }}>{avatar}</span>
                                        <span style={{ fontFamily: 'Fraunces,serif', fontSize: '1.1rem', color: 'var(--teal)', fontWeight: 700, marginLeft: 10 }}>
                                            Hi {childName}!
                                        </span>
                                    </div>

                                    {!confirmingPin ? (
                                        <>
                                            <h2 style={{ fontFamily: 'Fraunces,serif', fontSize: '1.45rem', color: 'var(--text)', fontWeight: 700, textAlign: 'center', marginBottom: 4 }}>
                                                Create your emoji PIN 🔐
                                            </h2>
                                            <p style={{ color: 'var(--text-soft)', fontSize: 14, textAlign: 'center', marginBottom: 18, fontWeight: 600, lineHeight: 1.6 }}>
                                                Pick <strong style={{ color: 'var(--amber)' }}>4 emojis</strong> — this is your secret key!
                                            </p>
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
                                                        disabled={emojiPin.length >= 4}
                                                        onClick={() => addEmoji(e)}>{e}</button>
                                                ))}
                                            </div>
                                            <div style={{ display: 'flex', gap: 10 }}>
                                                <button className="btn-delete" onClick={deleteEmoji} disabled={emojiPin.length === 0}>← Delete</button>
                                                <button className="btn-primary" style={{ flex: 1 }}
                                                    disabled={emojiPin.length < 4}
                                                    onClick={() => setConfirming(true)}>
                                                    Confirm PIN →
                                                </button>
                                            </div>
                                            <div style={{ marginTop: 12 }}>
                                                <button className="btn-back" style={{ width: '100%' }} onClick={() => setChildStep('name')}>← Back</button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <h2 style={{ fontFamily: 'Fraunces,serif', fontSize: '1.45rem', color: 'var(--text)', fontWeight: 700, textAlign: 'center', marginBottom: 4 }}>
                                                Tap it again! 🎯
                                            </h2>
                                            <p style={{ color: 'var(--text-soft)', fontSize: 14, textAlign: 'center', marginBottom: 18, fontWeight: 600, lineHeight: 1.6 }}>
                                                Pick the <strong style={{ color: 'var(--amber)' }}>same 4 emojis</strong> to confirm
                                            </p>
                                            <div style={{ marginBottom: 8, textAlign: 'center' }}>
                                                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-soft)' }}>
                                                    Your PIN was:
                                                </span>
                                                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 6, marginBottom: 16 }}>
                                                    {emojiPin.map((e, i) => (
                                                        <div key={i} style={{ width: 44, height: 44, background: 'rgba(26,122,98,0.08)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, border: '1.5px solid rgba(26,122,98,0.15)' }}>{e}</div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="pin-display">
                                                {Array.from({ length: 4 }, (_, i) => (
                                                    <div key={i} className={`pin-slot${pinError ? ' error' : confirmPin[i] ? ' confirm-filled' : ' empty-pulse'}`}>
                                                        {confirmPin[i] || ''}
                                                    </div>
                                                ))}
                                            </div>
                                            {pinError && <p className="err-msg">❌ Those don't match! Try again.</p>}
                                            <div className="emoji-grid" style={{ marginTop: pinError ? 8 : 0 }}>
                                                {EMOJI_ROWS.flat().map(e => (
                                                    <button key={e} className="emoji-btn"
                                                        disabled={confirmPin.length >= 4}
                                                        onClick={() => addEmoji(e)}>{e}</button>
                                                ))}
                                            </div>
                                            <div style={{ display: 'flex', gap: 10 }}>
                                                <button className="btn-delete" onClick={deleteEmoji} disabled={confirmPin.length === 0}>← Delete</button>
                                                <button className="btn-teal" style={{ flex: 1 }}
                                                    disabled={confirmPin.length < 4 || loading}
                                                    onClick={submitChildSignup}>
                                                    {loading ? <><div className="spinner" />Saving…</> : 'Done! ✅'}
                                                </button>
                                            </div>
                                            <div style={{ marginTop: 12 }}>
                                                <button className="btn-back" style={{ width: '100%' }}
                                                    onClick={() => { setConfirming(false); setConfirmPin([]); setPinError(false); }}>
                                                    ← Change my PIN
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Done */}
                            {childStep === 'done' && (
                                <div className="success-wrap">
                                    <div className="success-icon">{avatar}</div>
                                    <h2 style={{ fontFamily: 'Fraunces,serif', fontSize: '1.9rem', color: 'var(--teal)', fontWeight: 700 }}>
                                        Welcome, {childName}! 🎉
                                    </h2>
                                    <p style={{ color: 'var(--text-soft)', fontSize: 16, fontWeight: 600, maxWidth: 300, lineHeight: 1.6 }}>
                                        Your jungle adventure is ready. Let's go explore! 🌴
                                    </p>
                                    <a href="/onboarding" style={{
                                        marginTop: 6, display: 'inline-block',
                                        background: 'var(--amber)', color: '#fff',
                                        fontFamily: "'Lexend',sans-serif", fontWeight: 800, fontSize: 17,
                                        padding: '14px 40px', borderRadius: 100, textDecoration: 'none',
                                        boxShadow: '0 5px 18px rgba(232,146,12,0.4)',
                                    }}>
                                        Start exploring! →
                                    </a>
                                </div>
                            )}
                        </>
                    )}

                    {/* ══ ADULT SIGNUP ══ */}
                    {mode === 'adult' && (
                        <>
                            {adultStep === 'details' && (
                                <div className="step-body">
                                    <h2 style={{ fontFamily: 'Fraunces,serif', fontSize: '1.55rem', color: 'var(--text)', fontWeight: 700, textAlign: 'center', marginBottom: 4 }}>
                                        Create your account 🌿
                                    </h2>
                                    <p style={{ color: 'var(--text-soft)', fontSize: 14.5, textAlign: 'center', marginBottom: 22, fontWeight: 600, lineHeight: 1.6 }}>
                                        Join Lumina as a teacher or parent
                                    </p>
                                    <form onSubmit={handleAdultSubmit}>
                                        <div className="role-grid">
                                            {([{ key: 'teacher', icon: '🐘', label: 'Teacher' }, { key: 'parent', icon: '🦒', label: 'Parent / Carer' }] as const).map(({ key, icon, label }) => (
                                                <button key={key} type="button"
                                                    className={`role-btn${adultRole === key ? ' selected' : ''}`}
                                                    onClick={() => setAdultRole(key)}>
                                                    <span className="role-icon">{icon}</span>{label}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label" htmlFor="aname">👤 Full name</label>
                                            <input id="aname" type="text" className="input-field"
                                                placeholder="Your full name" value={adultName}
                                                onChange={e => setAdultName(e.target.value)}
                                                autoComplete="name" />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label" htmlFor="aemail">📧 Email address</label>
                                            <input id="aemail" type="email" className="input-field"
                                                placeholder="you@example.com" value={adultEmail}
                                                onChange={e => setAdultEmail(e.target.value)}
                                                autoComplete="email" />
                                        </div>
                                        <div className="input-group" style={{ marginBottom: 24 }}>
                                            <label className="input-label" htmlFor="apass">🔒 Password</label>
                                            <div className="pass-wrap">
                                                <input id="apass" type={showPass ? 'text' : 'password'}
                                                    className="input-field" placeholder="At least 8 characters"
                                                    value={adultPass}
                                                    onChange={e => setAdultPass(e.target.value)}
                                                    autoComplete="new-password" />
                                                <button type="button" className="pass-toggle"
                                                    onClick={() => setShowPass(s => !s)}>
                                                    {showPass ? '🙈' : '👁'}
                                                </button>
                                            </div>
                                            {adultPass.length > 0 && (
                                                <div className="strength-bar">
                                                    {[1, 2, 3, 4].map(i => (
                                                        <div key={i} className="strength-seg"
                                                            style={{ background: strengthColor(passwordStrength(adultPass), i) }} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <button type="submit" className="btn-primary"
                                            disabled={loading || !adultRole || !adultName || !adultEmail || adultPass.length < 6}>
                                            {loading ? <><div className="spinner" />Creating account…</> : 'Create account →'}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {adultStep === 'done' && (
                                <div className="success-wrap">
                                    <div className="success-icon">🌿</div>
                                    <h2 style={{ fontFamily: 'Fraunces,serif', fontSize: '1.9rem', color: 'var(--teal)', fontWeight: 700 }}>
                                        Welcome to Lumina!
                                    </h2>
                                    <p style={{ color: 'var(--text-soft)', fontSize: 15, fontWeight: 600, maxWidth: 300, lineHeight: 1.6 }}>
                                        {adultRole === 'teacher'
                                            ? "Your teacher dashboard is ready. Let's help your students thrive! 🐘"
                                            : "Your parent dashboard is ready. Let's track your child's adventure! 🦒"}
                                    </p>
                                    <a href="/dashboard" style={{
                                        marginTop: 8, display: 'inline-block',
                                        background: 'var(--teal)', color: '#fff',
                                        fontFamily: "'Lexend',sans-serif", fontWeight: 800, fontSize: 17,
                                        padding: '14px 40px', borderRadius: 100, textDecoration: 'none',
                                        boxShadow: '0 5px 18px rgba(26,122,98,0.35)',
                                    }}>
                                        Go to dashboard →
                                    </a>
                                </div>
                            )}
                        </>
                    )}

                    {childStep !== 'done' && adultStep !== 'done' && (
                        <p className="helper">Already have an account? <a href="/login">Log in here</a></p>
                    )}
                </div>

                <JungleStrip />
            </div>
        </>
    );
};

export default Signup;