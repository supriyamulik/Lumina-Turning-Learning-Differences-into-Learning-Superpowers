import React, { useState, useRef, useEffect, useCallback } from 'react';
import { studentApi } from '../lib/api';

// ─── To use Lottie, install `lottie-react` and swap the placeholder divs ──────
// import Lottie from 'lottie-react';
// import leoIdleAnim   from '../assets/animations/leo-idle.json';
// import leoCheerAnim  from '../assets/animations/leo-cheer.json';
// import micAnim       from '../assets/animations/mic-pulse.json';
// import cameraAnim    from '../assets/animations/camera.json';
// import confettiAnim  from '../assets/animations/confetti.json';

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = 'welcome' | 'permissions' | 'ready';

interface OnboardingData {
    interests: string[];
    consentWebcam: boolean;
    consentMic: boolean;
    consentEmotion: boolean;
}

// ─── Text-to-speech helper ────────────────────────────────────────────────────
function speak(text: string, rate = 0.88) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate;
    u.pitch = 1.1;
    // Pick a friendly voice if available
    const voices = window.speechSynthesis.getVoices();
    const friendly = voices.find(v => v.name.toLowerCase().includes('samantha') || v.name.toLowerCase().includes('daniel') || v.lang === 'en-GB');
    if (friendly) u.voice = friendly;
    window.speechSynthesis.speak(u);
}

// ─── Leo avatar (emoji + Lottie slot) ─────────────────────────────────────────
const LeoAvatar: React.FC<{ mood?: 'idle' | 'cheer'; size?: number }> = ({ size = 110 }) => (
    // 🔄 LOTTIE SWAP: replace this div with:
    // <Lottie animationData={mood === 'cheer' ? leoCheerAnim : leoIdleAnim}
    //         loop style={{ width: size, height: size }} />
    <div style={{
        width: size, height: size,
        background: 'radial-gradient(circle at 38% 35%, #FFD166, #E8920C)',
        borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.52,
        boxShadow: '0 8px 32px rgba(232,146,12,0.45), 0 2px 0 #b36a00',
        animation: 'leoBounce 2.8s ease-in-out infinite',
        flexShrink: 0,
    }}>🦁</div>
);

// ─── Speech bubble ─────────────────────────────────────────────────────────────
const Bubble: React.FC<{ text: string }> = ({ text }) => (
    <div style={{
        background: '#fff',
        border: '2.5px solid #E8920C',
        borderRadius: '18px 18px 18px 4px',
        padding: '12px 18px',
        fontSize: 15,
        fontWeight: 600,
        color: '#1C2E24',
        lineHeight: 1.7,
        boxShadow: '0 4px 20px rgba(232,146,12,0.12)',
        animation: 'bubblePop 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
        maxWidth: 320,
        position: 'relative' as const,
    }}>
        {text}
        <div style={{ position: 'absolute', bottom: -13, left: 18, width: 0, height: 0, borderLeft: '11px solid transparent', borderTop: '13px solid #E8920C' }} />
        <div style={{ position: 'absolute', bottom: -9, left: 21, width: 0, height: 0, borderLeft: '8px solid transparent', borderTop: '10px solid #fff' }} />
    </div>
);

// ─── Permission card ───────────────────────────────────────────────────────────
const PermCard: React.FC<{
    icon: string;
    title: string;
    desc: string;
    status: 'idle' | 'testing' | 'ok' | 'denied';
    on: boolean;
    onToggle: () => void;
    onTest: () => void;
    // lottieAnim?: object; // pass your Lottie JSON here when ready
}> = ({ icon, title, desc, status, on, onToggle, onTest }) => (
    <div style={{
        background: on ? '#E3F4F1' : '#fff',
        border: `2.5px solid ${on ? '#2D8B7E' : 'rgba(45,139,126,0.18)'}`,
        borderRadius: 20,
        padding: '16px 18px',
        marginBottom: 12,
        transition: 'all 0.25s',
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* 🔄 LOTTIE SWAP: <Lottie animationData={lottieAnim} loop={status==='testing'} style={{width:40,height:40}} /> */}
            <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: on ? 'rgba(45,139,126,0.15)' : 'rgba(232,146,12,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, flexShrink: 0,
                animation: status === 'testing' ? 'pulse 1s ease-in-out infinite' : 'none',
            }}>{icon}</div>

            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1C2E24', marginBottom: 2 }}>{title}</div>
                <div style={{ fontSize: 12, color: '#5A7866', fontWeight: 500 }}>{desc}</div>
            </div>

            {/* Toggle */}
            <button onClick={onToggle} style={{
                width: 44, height: 24, borderRadius: 100,
                background: on ? '#2D8B7E' : 'rgba(45,139,126,0.2)',
                border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0,
                transition: 'background 0.25s',
            }}>
                <div style={{
                    position: 'absolute', width: 18, height: 18, borderRadius: '50%',
                    background: '#fff', top: 3, left: on ? 23 : 3,
                    transition: 'left 0.25s cubic-bezier(0.34,1.5,0.64,1)',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                }} />
            </button>
        </div>

        {/* Test button row — shown when toggled on */}
        {on && status !== 'ok' && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1.5px solid rgba(45,139,126,0.12)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={onTest} disabled={status === 'testing'} style={{
                    padding: '8px 18px', borderRadius: 12,
                    background: status === 'testing' ? 'rgba(45,139,126,0.15)' : '#2D8B7E',
                    color: status === 'testing' ? '#2D8B7E' : '#fff',
                    border: 'none', cursor: status === 'testing' ? 'not-allowed' : 'pointer',
                    fontSize: 13, fontWeight: 700, fontFamily: 'Lexend, sans-serif',
                    display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s',
                }}>
                    {status === 'testing' ? '⏳ Testing…' : 'Quick test'}
                </button>
                {status === 'denied' && <span style={{ fontSize: 12, color: '#D4607A', fontWeight: 600 }}>Access denied — check browser settings</span>}
            </div>
        )}

        {on && status === 'ok' && (
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, color: '#27AE60', fontSize: 13, fontWeight: 700 }}>
                <span>✅</span> All good!
            </div>
        )}
    </div>
);

// ─── Main Onboarding ───────────────────────────────────────────────────────────
const Onboarding: React.FC<{ studentName?: string }> = ({ studentName = 'Explorer' }) => {
    const [step, setStep] = useState<Step>('welcome');
    const [camOn, setCamOn] = useState(false);
    const [micOn, setMicOn] = useState(false);
    const [camStatus, setCamStatus] = useState<'idle' | 'testing' | 'ok' | 'denied'>('idle');
    const [micStatus, setMicStatus] = useState<'idle' | 'testing' | 'ok' | 'denied'>('idle');
    const [micLevel, setMicLevel] = useState(0);
    const [saving, setSaving] = useState(false);

    const streamRef = useRef<MediaStream | null>(null);
    const micTimerRef = useRef<number | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);

    useEffect(() => () => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        if (micTimerRef.current) clearInterval(micTimerRef.current);
        window.speechSynthesis?.cancel();
    }, []);

    // ── Leo speech on each step ──────────────────────────────────────────────────
    useEffect(() => {
        // Small delay so voices are loaded
        const t = setTimeout(() => {
            if (step === 'welcome')
                speak(`Hi ${studentName}! I'm Leo. Welcome to Lumina! Let's get you ready for your jungle adventure.`);
            if (step === 'permissions')
                speak("You can turn on your camera and microphone so I can help you even more. Don't worry, it's totally optional!");
            if (step === 'ready')
                speak(`Woohoo! You're all set, ${studentName}! Let's start your adventure!`);
        }, 400);
        return () => clearTimeout(t);
    }, [step]);

    // ── Camera test ───────────────────────────────────────────────────────────────
    const testCamera = useCallback(async () => {
        setCamStatus('testing');
        speak('Testing your camera now. Smile!');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            streamRef.current = stream;
            // Show stream for 2s then confirm
            setTimeout(() => {
                stream.getTracks().forEach(t => t.stop());
                setCamStatus('ok');
                speak('Camera works perfectly!');
            }, 2000);
        } catch {
            setCamStatus('denied');
            speak("No worries, camera is optional.");
        }
    }, []);

    // ── Mic test ──────────────────────────────────────────────────────────────────
    const testMic = useCallback(async () => {
        setMicStatus('testing');
        setMicLevel(0);
        speak('Testing your microphone. Please say: S… S… Sun!', 0.82);
        await new Promise(r => setTimeout(r, 2200)); // let Leo finish first
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            const ctx = new AudioContext();
            const src = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            src.connect(analyser);
            analyserRef.current = analyser;
            const data = new Uint8Array(analyser.frequencyBinCount);

            micTimerRef.current = window.setInterval(() => {
                analyser.getByteFrequencyData(data);
                const avg = data.reduce((a, b) => a + b, 0) / data.length;
                setMicLevel(Math.min(100, avg * 2.8));
            }, 80);

            // 5 seconds to say the word
            setTimeout(() => {
                if (micTimerRef.current) clearInterval(micTimerRef.current);
                stream.getTracks().forEach(t => t.stop());
                setMicLevel(0);
                setMicStatus('ok');
                speak('Your voice sounds great!');
            }, 5000);
        } catch {
            setMicStatus('denied');
            speak("Microphone is optional, no worries!");
        }
    }, []);

    // ── Save + redirect ────────────────────────────────────────────────────────────
    const finish = async () => {
        setSaving(true);
        speak(`Let's go, ${studentName}!`);
        try {
            await studentApi.saveOnboarding({
                interests: [],
                consentWebcam: camOn && camStatus === 'ok',
                consentMic: micOn && micStatus === 'ok',
                consentEmotion: false,
            });
        } catch {/* fallback */ }
        window.location.href = '/dashboard';
    };

    const stepNum = { welcome: 0, permissions: 1, ready: 2 }[step];

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700;800&family=Fraunces:ital,opsz,wght@0,9..144,700;1,9..144,500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --cream:#FDF6ED; --teal:#2D8B7E; --teal-pale:#E3F4F1;
          --amber:#E8920C; --amber-pale:#FEF3DC; --rose:#D4607A;
          --text:#1C2E24; --soft:#5A7866; --border:rgba(45,139,126,0.18);
          --green:#27AE60;
        }
        body { font-family:'Lexend',sans-serif; background:var(--cream); min-height:100vh; overflow-x:hidden; color:var(--text); }
        @keyframes fadeUp    { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn   { from{opacity:0;transform:translateX(30px)} to{opacity:1;transform:translateX(0)} }
        @keyframes bubblePop { 0%{transform:scale(0.75);opacity:0} 70%{transform:scale(1.04)} 100%{transform:scale(1);opacity:1} }
        @keyframes leoBounce { 0%,100%{transform:translateY(0) rotate(-1deg)} 50%{transform:translateY(-10px) rotate(2deg)} }
        @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:0.55} }
        @keyframes barGrow   { from{transform:scaleY(0)} to{transform:scaleY(1)} }
        @keyframes confetti  { 0%{transform:translateY(0) rotate(0deg);opacity:1} 100%{transform:translateY(120px) rotate(400deg);opacity:0} }
        @keyframes pop       { 0%{transform:scale(0.8);opacity:0} 70%{transform:scale(1.06)} 100%{transform:scale(1);opacity:1} }
      `}</style>

            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(155deg, #E3F4F1 0%, #FDF6ED 45%, #FEF8EC 100%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '24px 16px 48px', position: 'relative', overflow: 'hidden',
            }}>

                {/* Floating jungle emojis */}
                {['🌿', '🍃', '🌺', '🦋', '⭐', '🍀', '✨', '🌸'].map((e, i) => (
                    <div key={i} style={{
                        position: 'absolute', fontSize: 18 + i * 2, opacity: 0.25,
                        left: `${6 + i * 12}%`, bottom: -20,
                        animation: `leoBounce ${7 + i * 0.6}s ease-in-out infinite`,
                        animationDelay: `${i * 0.8}s`, pointerEvents: 'none', userSelect: 'none',
                    }}>{e}</div>
                ))}

                {/* Step dots */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 24, zIndex: 2 }}>
                    {[0, 1, 2].map(i => (
                        <div key={i} style={{
                            height: 10, borderRadius: 100,
                            width: i === stepNum ? 30 : 10,
                            background: i === stepNum ? '#E8920C' : i < stepNum ? '#2D8B7E' : 'rgba(45,139,126,0.2)',
                            transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                        }} />
                    ))}
                </div>

                {/* Card */}
                <div style={{
                    background: 'rgba(253,246,237,0.97)',
                    border: '2.5px solid rgba(255,255,255,0.9)',
                    borderRadius: 32, padding: '36px 40px',
                    width: '100%', maxWidth: 540,
                    boxShadow: '0 20px 60px rgba(45,139,126,0.11), 0 4px 16px rgba(0,0,0,0.05), inset 0 2px 0 #fff',
                    position: 'relative', zIndex: 2,
                    animation: 'fadeUp 0.55s cubic-bezier(0.34,1.2,0.64,1) both',
                }}>

                    {/* ── Leo + bubble ────────────────────────────────────────── */}
                    {step !== 'ready' && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 28 }}>
                            <LeoAvatar mood="idle" size={88} />
                            <Bubble text={
                                step === 'welcome'
                                    ? `Hi ${studentName}! I'm Leo 🦁 I'll be your reading guide. Let's set up your jungle!`
                                    : `You can turn on your camera and microphone — they help me cheer you on! Both are totally optional.`
                            } />
                        </div>
                    )}

                    {/* ════════════════ WELCOME ════════════════ */}
                    {step === 'welcome' && (
                        <div style={{ animation: 'slideIn 0.4s cubic-bezier(0.34,1.2,0.64,1) both' }}>
                            <h2 style={{ fontFamily: 'Fraunces,serif', fontSize: '1.7rem', fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>
                                Welcome to Lumina! 🌴
                            </h2>
                            <p style={{ color: 'var(--soft)', fontSize: 15, textAlign: 'center', marginBottom: 28, lineHeight: 1.7, fontWeight: 500 }}>
                                Your jungle adventure is about to begin.<br />Leo will guide you every step of the way!
                            </p>

                            {[
                                { icon: '📖', text: 'Stories made just for you' },
                                { icon: '🎯', text: 'Fun reading games and challenges' },
                                { icon: '🏆', text: 'Earn coins and unlock new islands' },
                            ].map((item, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    background: 'var(--teal-pale)', border: '2px solid var(--border)',
                                    borderRadius: 16, padding: '13px 16px', marginBottom: 10,
                                    animation: `fadeUp 0.4s ${0.1 * i + 0.2}s both`,
                                }}>
                                    <span style={{ fontSize: 22 }}>{item.icon}</span>
                                    <span style={{ fontSize: 15, fontWeight: 600 }}>{item.text}</span>
                                </div>
                            ))}

                            <button onClick={() => setStep('permissions')} style={{
                                width: '100%', marginTop: 24, padding: '16px', borderRadius: 18,
                                background: 'var(--amber)', color: '#fff', border: 'none',
                                fontSize: 17, fontWeight: 700, fontFamily: 'Lexend,sans-serif',
                                cursor: 'pointer', letterSpacing: '0.03em',
                                boxShadow: '0 6px 20px rgba(232,146,12,0.4), 0 2px 0 #B36A00 inset',
                            }}>
                                Let's go, {studentName}! 🦁
                            </button>
                        </div>
                    )}

                    {/* ════════════════ PERMISSIONS ════════════════ */}
                    {step === 'permissions' && (
                        <div style={{ animation: 'slideIn 0.4s cubic-bezier(0.34,1.2,0.64,1) both' }}>
                            <h2 style={{ fontFamily: 'Fraunces,serif', fontSize: '1.55rem', fontWeight: 700, marginBottom: 6, textAlign: 'center' }}>
                                Camera & Microphone
                            </h2>
                            <p style={{ color: 'var(--soft)', fontSize: 14, textAlign: 'center', marginBottom: 22, lineHeight: 1.7, fontWeight: 500 }}>
                                Totally optional — but Leo loves cheering you on! 🎉
                            </p>

                            {/* Camera card */}
                            <PermCard
                                icon="📷"
                                title="Camera"
                                desc="Leo can see you smile when you get an answer right!"
                                status={camStatus}
                                on={camOn}
                                onToggle={() => { setCamOn(v => !v); if (!camOn) setCamStatus('idle'); }}
                                onTest={testCamera}
                            />

                            {/* Mic card */}
                            <PermCard
                                icon="🎤"
                                title="Microphone"
                                desc="Read words out loud and Leo will listen and help!"
                                status={micStatus}
                                on={micOn}
                                onToggle={() => { setMicOn(v => !v); if (!micOn) setMicStatus('idle'); }}
                                onTest={testMic}
                            />

                            {/* Mic visualiser — shown during test */}
                            {micStatus === 'testing' && (
                                <div style={{
                                    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                                    gap: 4, height: 48, margin: '4px 0 16px', padding: '0 12px',
                                    background: 'rgba(45,139,126,0.06)', borderRadius: 14,
                                }}>
                                    {Array.from({ length: 14 }, (_, i) => {
                                        const h = Math.max(6, (micLevel / 100) * 38 * (0.5 + Math.abs(Math.sin(i * 0.9)) * 0.5));
                                        return (
                                            <div key={i} style={{
                                                width: 7, borderRadius: 100, transformOrigin: 'bottom',
                                                background: micLevel > 55 ? '#2D8B7E' : micLevel > 20 ? '#E8920C' : 'rgba(45,139,126,0.25)',
                                                height: `${h}px`, transition: 'height 0.08s ease',
                                                animation: 'barGrow 0.1s ease both',
                                            }} />
                                        );
                                    })}
                                    <span style={{ fontSize: 12, color: '#2D8B7E', fontWeight: 700, marginLeft: 10, whiteSpace: 'nowrap' }}>
                                        Say: "S… S… Sun!" 🌞
                                    </span>
                                </div>
                            )}

                            <button onClick={() => setStep('ready')} style={{
                                width: '100%', marginTop: 8, padding: '15px', borderRadius: 18,
                                background: 'var(--amber)', color: '#fff', border: 'none',
                                fontSize: 16, fontWeight: 700, fontFamily: 'Lexend,sans-serif',
                                cursor: 'pointer', letterSpacing: '0.03em',
                                boxShadow: '0 6px 20px rgba(232,146,12,0.4), 0 2px 0 #B36A00 inset',
                            }}>
                                {camOn || micOn ? 'Looks good! Continue →' : 'Skip for now →'}
                            </button>
                        </div>
                    )}

                    {/* ════════════════ READY ════════════════ */}
                    {step === 'ready' && (
                        <div style={{ textAlign: 'center', animation: 'pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both' }}>
                            {/* Confetti */}
                            {Array.from({ length: 18 }, (_, i) => (
                                <div key={i} style={{
                                    position: 'absolute', left: `${5 + i * 5}%`, top: -8,
                                    width: 9 + (i % 3) * 3, height: 9 + (i % 3) * 3,
                                    borderRadius: i % 2 === 0 ? '50%' : 3,
                                    background: ['#E8920C', '#2D8B7E', '#7B6FA8', '#D4607A', '#27AE60', '#4A90C4'][i % 6],
                                    animation: `confetti ${1.4 + (i % 4) * 0.2}s ease ${i * 0.07}s both`,
                                    pointerEvents: 'none',
                                }} />
                            ))}

                            {/* 🔄 LOTTIE SWAP: <Lottie animationData={confettiAnim} loop={false} style={{width:100,height:100,margin:'0 auto'}} /> */}
                            <div style={{ fontSize: 80, animation: 'leoBounce 1.6s ease-in-out infinite', display: 'inline-block', marginBottom: 8 }}>
                                🦁
                            </div>

                            <h2 style={{ fontFamily: 'Fraunces,serif', fontSize: '2rem', fontWeight: 700, marginBottom: 10 }}>
                                You're all set, {studentName}! 🎉
                            </h2>
                            <p style={{ color: 'var(--soft)', fontSize: 16, lineHeight: 1.7, marginBottom: 28, fontWeight: 500 }}>
                                Your jungle is waiting.<br />
                                Leo will cheer you on every step of the way!
                            </p>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 28 }}>
                                {camOn && camStatus === 'ok' && (
                                    <span style={{ background: 'var(--teal-pale)', border: '2px solid var(--border)', borderRadius: 100, padding: '6px 14px', fontSize: 13, fontWeight: 700, color: 'var(--teal)' }}>📷 Camera ready</span>
                                )}
                                {micOn && micStatus === 'ok' && (
                                    <span style={{ background: 'var(--teal-pale)', border: '2px solid var(--border)', borderRadius: 100, padding: '6px 14px', fontSize: 13, fontWeight: 700, color: 'var(--teal)' }}>🎤 Mic ready</span>
                                )}
                                <span style={{ background: 'var(--amber-pale)', border: '2px solid rgba(232,146,12,0.25)', borderRadius: 100, padding: '6px 14px', fontSize: 13, fontWeight: 700, color: 'var(--amber)' }}>🌴 Island 1 unlocked</span>
                            </div>

                            <button onClick={finish} disabled={saving} style={{
                                width: '100%', padding: '17px', borderRadius: 18,
                                background: saving ? 'rgba(232,146,12,0.5)' : 'var(--amber)',
                                color: '#fff', border: 'none',
                                fontSize: 17, fontWeight: 700, fontFamily: 'Lexend,sans-serif',
                                cursor: saving ? 'not-allowed' : 'pointer', letterSpacing: '0.03em',
                                boxShadow: saving ? 'none' : '0 6px 24px rgba(232,146,12,0.45), 0 2px 0 #B36A00 inset',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                transition: 'all 0.2s',
                            }}>
                                {saving ? (
                                    <>
                                        <div style={{ width: 18, height: 18, border: '3px solid rgba(255,255,255,0.4)', borderTop: '3px solid #fff', borderRadius: '50%', animation: 'pulse 0.7s linear infinite' }} />
                                        Loading…
                                    </>
                                ) : 'Start My Adventure! 🌴'}
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </>
    );
};

export default Onboarding;