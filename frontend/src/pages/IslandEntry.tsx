// frontend/src/pages/IslandEntry.tsx
// Route: /island/:id
// Flow:  Dashboard → IslandEntry → /island/:id/flashcard

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import cuteTiger from '../assets/animations/Cute Tiger.json';
import { progressApi, studentApi } from '../lib/api';

// ─── Island Config (5 islands) ────────────────────────────────
const ISLANDS: Record<number, {
    name: string; emoji: string; phoneme: string; description: string;
    color: string; colorDark: string; colorPale: string;
    leoSpeech: string; bgEmojis: string[];
}> = {
    1: {
        name: 'Whispering Palms',
        emoji: '🌴',
        phoneme: 'Phonological Awareness',
        description: 'Every word is made of tiny sounds called phonemes. In this island you will listen, identify and play with individual sounds and rhyming patterns hidden inside words.',
        color: '#2D8B7E',
        colorDark: '#1E6B5E',
        colorPale: '#E3F4F1',
        leoSpeech: "Welcome to Whispering Palms! I am Leo, your jungle guide. Here we are going to listen really carefully to the sounds inside words. Every word has tiny sounds hiding in it. Are you ready? Let us go!",
        bgEmojis: ['🌴', '🌿', '🦜', '🌺', '🍃'],
    },
    2: {
        name: 'Rabbit Rapids',
        emoji: '🐇',
        phoneme: 'Phonics Foundations — CVC Words',
        description: 'Short vowels and single consonants combine to build CVC words like cat, dog and sun. Follow the river and learn how letters team up to make real words.',
        color: '#4A90C4',
        colorDark: '#2E6FA0',
        colorPale: '#E3F0FA',
        leoSpeech: "Welcome to Rabbit Rapids! We are going to build words like cat, dog and sun by putting sounds together. Short vowels live here in the rapids. Let us dive in!",
        bgEmojis: ['🐇', '💧', '🌊', '🪨', '🐸'],
    },
    3: {
        name: 'Echo Caves',
        emoji: '🦇',
        phoneme: 'Digraphs & Blends',
        description: 'Two letters can make one sound — like sh, ch and th. Inside the caves you will find blends and digraphs hiding in words, waiting for you to discover them.',
        color: '#7B5EA7',
        colorDark: '#5A3E86',
        colorPale: '#EDE8F8',
        leoSpeech: "Welcome to Echo Caves! Listen carefully. Can you hear that? Two letters are making one sound in the dark. Let us find all the blends and digraphs together. I will be right here with you!",
        bgEmojis: ['🦇', '🕯️', '🌑', '💜', '🔮'],
    },
    4: {
        name: 'Sunlight Glade',
        emoji: '☀️',
        phoneme: 'Long Vowels & Vowel Teams',
        description: 'The silent-e rule and vowel teams like ai, ea and oa unlock long vowel sounds. Step into the glade where vowels stretch out and shine.',
        color: '#E8920C',
        colorDark: '#B36A00',
        colorPale: '#FEF3DC',
        leoSpeech: "Welcome to Sunlight Glade! Today vowels are going to stretch out long and bright, just like the word cake or the word rain. The silent e has a superpower. Let us find it together!",
        bgEmojis: ['☀️', '🌻', '🦋', '🌼', '🍯'],
    },
    5: {
        name: 'Morpho Mountain',
        emoji: '🦋',
        phoneme: 'Multisyllabic Mastery',
        description: 'Big words are just small word-parts stacked together. On Morpho Mountain you will break complex words into syllables, discover roots and unlock the meaning of long words.',
        color: '#D4607A',
        colorDark: '#A8354F',
        colorPale: '#FCEEF1',
        leoSpeech: "Welcome to Morpho Mountain! Big words might look scary but every big word is really just small pieces joined together. Let us climb up and break them apart. You have absolutely got this!",
        bgEmojis: ['🦋', '🏔️', '🌸', '🧩', '✨'],
    },
};

// ─── 5 Activities per island ──────────────────────────────────
const MISSIONS = [
    { key: 'flashcard', icon: '🃏', label: 'Flash Cards', desc: 'Spot the sound' },
    { key: 'word_sort', icon: '🔀', label: 'Word Sort', desc: 'Group by sound' },
    { key: 'blending', icon: '🧩', label: 'Blending', desc: 'Build the word' },
    { key: 'listen_find', icon: '👂', label: 'Listen & Find', desc: 'Hear it, find it' },
    { key: 'spell_it', icon: '✏️', label: 'Spell It', desc: 'Write it out' },
];

// ─── Lottie tiger — replaces the old sun/star SVG everywhere ─────────────────
const LeoAvatar: React.FC<{ size?: number }> = ({ size = 80 }) => (
    <Lottie
        animationData={cuteTiger}
        loop
        style={{ width: size, height: size, flexShrink: 0 }}
    />
);

// ─── Jungle horizon SVG ───────────────────────────────────────
const JungleHorizon: React.FC<{ color: string }> = ({ color }) => (
    <svg viewBox="0 0 800 180" preserveAspectRatio="xMidYMax slice"
        style={{ position: 'fixed', bottom: 0, left: 0, right: 0, width: '100%', pointerEvents: 'none', zIndex: 0 }}>
        <path d="M0 110 Q100 72 200 88 Q300 104 400 76 Q500 50 600 72 Q700 94 800 68 L800 180 L0 180Z"
            fill={color} opacity="0.14" />
        <path d="M0 135 Q150 98 300 115 Q450 132 600 104 Q700 90 800 100 L800 180 L0 180Z"
            fill={color} opacity="0.22" />
        <path d="M0 158 Q200 134 400 142 Q600 150 800 135 L800 180 L0 180Z"
            fill={color} opacity="0.38" />
    </svg>
);

// ─── Speech helper ─────────────────────────────────────────────────────────────
function leoSpeak(text: string, onStart?: () => void, onEnd?: () => void) {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.88; utt.pitch = 1.1; utt.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
        v.name.toLowerCase().includes('daniel') ||
        v.name.toLowerCase().includes('karen') ||
        v.name.toLowerCase().includes('moira') ||
        (v.lang === 'en-GB' && v.localService)
    ) || voices.find(v => v.lang.startsWith('en'));
    if (preferred) utt.voice = preferred;
    utt.onstart = () => onStart?.();
    utt.onend = () => onEnd?.();
    utt.onerror = () => onEnd?.();
    window.speechSynthesis.speak(utt);
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
const IslandEntry: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const islandId = parseInt(id || '1', 10);
    const island = ISLANDS[islandId];

    const [progress, setProgress] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [leoTalking, setLeoTalking] = useState(false);
    const [revealed, setRevealed] = useState(false);
    const [missionsShown, setMissionsShown] = useState(false);
    const hasSpoken = useRef(false);

    useEffect(() => {
        if (!island) { navigate('/dashboard'); return; }
        progressApi.getIslandProgress(islandId)
            .then(d => setProgress(d))
            .catch(() => setProgress(null))
            .finally(() => setLoading(false));
        studentApi.startSession().catch(() => { });
    }, [islandId]);

    useEffect(() => {
        if (loading) return;
        const t1 = setTimeout(() => setRevealed(true), 100);
        const t2 = setTimeout(() => setMissionsShown(true), 420);
        const t3 = setTimeout(() => {
            if (hasSpoken.current || !island) return;
            hasSpoken.current = true;
            const speak = () => leoSpeak(
                island.leoSpeech,
                () => setLeoTalking(true),
                () => setLeoTalking(false),
            );
            if (window.speechSynthesis.getVoices().length > 0) speak();
            else window.speechSynthesis.onvoiceschanged = speak;
        }, 820);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, [loading]);

    const handleReplay = () => {
        if (!island) return;
        leoSpeak(island.leoSpeech, () => setLeoTalking(true), () => setLeoTalking(false));
    };

    const handleBegin = () => {
        window.speechSynthesis.cancel();
        const firstIncomplete = MISSIONS.find(m => !(m.key in bestScores));
        const target = firstIncomplete ? firstIncomplete.key : MISSIONS[0].key;
        navigate(`/island/${islandId}/${target}`);
    };

    const handleBack = () => {
        window.speechSynthesis.cancel();
        navigate('/dashboard');
    };

    // NEW: Click handler for individual missions
    const handleMissionClick = (missionKey: string) => {
        window.speechSynthesis.cancel(); // stop any Leo speech
        navigate(`/island/${islandId}/${missionKey}`);
    };

    // derive scores
    const bestScores: Record<string, number> = {};
    for (const s of (progress?.scores ?? [])) {
        const key: string = s.activity_type ?? '';
        const val: number = typeof s.score === 'number' ? Math.round(s.score) : 0;
        if (key && (!bestScores[key] || val > bestScores[key])) bestScores[key] = val;
    }
    const overallPct = progress?.progress?.progress_pct ?? 0;
    const isCompleted = progress?.progress?.status === 'completed';
    const doneCount = Object.keys(bestScores).length;

    if (!island) return null;

    const cssVars = { '--ic': island.color, '--icd': island.colorDark, '--icp': island.colorPale } as React.CSSProperties;

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@400;600;700;800&family=Fraunces:opsz,wght@9..144,700;9..144,800&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        html, body { height:100%; overflow-x:hidden; }
        :root {
          --cream:#FDF6ED; --cream2:#F4EDE0; --cream3:#EDE3D4;
          --text:#1C2E24; --text-mid:#304838; --text-soft:#6B8876;
          --border:rgba(45,139,126,0.12);
          --font-ui:'Lexend',sans-serif;
          --font-h:'Fraunces',serif;
          --font-read:'OpenDyslexic','Lexend',sans-serif;
        }
        body { font-family:var(--font-ui); background:var(--cream); color:var(--text); font-size:16px; line-height:1.65; letter-spacing:0.02em; }

        @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
        @keyframes fadeUp    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes leoFloat  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes floatDeco { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-16px) rotate(10deg)} }
        @keyframes missionIn { from{opacity:0;transform:translateX(-16px)} to{opacity:1;transform:translateX(0)} }
        @keyframes shimmer   { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes leoLand   { from{opacity:0;transform:translateX(-32px) scale(0.88)} to{opacity:1;transform:translateX(0) scale(1)} }
        @keyframes bounceLeo { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-12px) scale(1.04)} }

        .ie-page { min-height:100vh; position:relative; overflow:hidden; display:flex; flex-direction:column; }
        .ie-topbar { padding:16px 28px; display:flex; align-items:center; justify-content:space-between; position:relative; z-index:10; animation:fadeIn 0.35s ease both; }
        .ie-back { display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.86); border:2px solid var(--border); border-radius:100px; padding:10px 22px; font-family:var(--font-ui); font-size:14px; font-weight:700; color:var(--text-mid); cursor:pointer; transition:all 0.2s; backdrop-filter:blur(10px); min-height:48px; }
        .ie-back:hover { background:#fff; transform:translateX(-3px); }
        .ie-badge { display:flex; align-items:center; gap:6px; border:2px solid transparent; border-radius:100px; padding:4px 16px 4px 4px; font-size:13px; font-weight:800; letter-spacing:0.04em; }
        .ie-grid { flex:1; display:grid; grid-template-columns:1fr 1fr; gap:24px; padding:4px 28px 120px; max-width:1040px; margin:0 auto; width:100%; align-items:start; position:relative; z-index:5; }
        @media (max-width:760px) { .ie-grid { grid-template-columns:1fr; padding:4px 16px 100px; } .ie-topbar { padding:14px 16px; } }
        .ie-left, .ie-right { display:flex; flex-direction:column; gap:18px; }
        .ie-hero { border-radius:24px; padding:28px 28px 26px; color:#fff; position:relative; overflow:hidden; opacity:0; transform:translateY(22px); transition:opacity 0.5s ease,transform 0.5s ease; }
        .ie-hero.show { opacity:1; transform:translateY(0); }
        .ie-hero-deco { position:absolute; right:-14px; bottom:-22px; font-size:104px; opacity:0.11; transform:rotate(18deg); pointer-events:none; user-select:none; line-height:1; }
        .ie-island-num { font-size:11px; font-weight:800; letter-spacing:0.2em; text-transform:uppercase; opacity:0.72; margin-bottom:10px; }
        .ie-island-name { font-family:var(--font-h); font-size:clamp(1.65rem,3.5vw,2.3rem); font-weight:800; line-height:1.15; margin-bottom:10px; }
        .ie-phoneme-pill { display:inline-flex; align-items:center; gap:7px; background:rgba(255,255,255,0.2); border:1.5px solid rgba(255,255,255,0.3); border-radius:100px; padding:5px 16px; font-size:13px; font-weight:700; font-family:var(--font-read); letter-spacing:0.05em; margin-bottom:18px; }
        .ie-island-desc { font-size:14.5px; line-height:1.88; opacity:0.92; font-weight:500; letter-spacing:0.025em; }
        .ie-progress-row { margin-top:20px; display:flex; align-items:center; gap:12px; }
        .ie-prog-track { flex:1; height:9px; background:rgba(255,255,255,0.22); border-radius:100px; overflow:hidden; }
        .ie-prog-fill { height:100%; border-radius:100px; background:rgba(255,255,255,0.88); transition:width 1.1s cubic-bezier(0.34,1.2,0.64,1); }
        .ie-prog-pct { font-size:13px; font-weight:800; opacity:0.88; white-space:nowrap; }
        .ie-leo-card { background:#fff; border:2px solid rgba(255,255,255,0.9); border-radius:22px; overflow:hidden; box-shadow:0 4px 22px rgba(45,100,80,0.09); opacity:0; transform:translateY(16px); transition:opacity 0.5s 0.16s ease,transform 0.5s 0.16s ease; }
        .ie-leo-card.show { opacity:1; transform:translateY(0); }
        .ie-leo-top { background:linear-gradient(135deg,#FEF3DC,#FDE8C0); padding:14px 20px 0; display:flex; align-items:flex-end; gap:14px; border-bottom:2px solid rgba(232,146,12,0.1); }
        .ie-leo-anim { flex-shrink:0; margin-bottom:-6px; animation:leoFloat 3.2s ease-in-out infinite; }
        .ie-leo-anim.land { animation:leoLand 0.55s cubic-bezier(0.34,1.2,0.64,1) both,leoFloat 3.2s 0.55s ease-in-out infinite; }
        .ie-leo-meta { padding-bottom:16px; }
        .ie-leo-tag { display:inline-flex; align-items:center; gap:5px; background:#E8920C; color:#fff; font-size:10px; font-weight:800; letter-spacing:0.1em; text-transform:uppercase; padding:3px 10px; border-radius:100px; margin-bottom:5px; }
        .ie-leo-title { font-family:var(--font-h); font-size:1rem; font-weight:700; color:var(--text-mid); }
        .ie-leo-speech { padding:16px 20px 14px; font-size:15px; font-weight:600; color:var(--text-mid); line-height:1.78; letter-spacing:0.025em; min-height:60px; }
        .ie-leo-actions { padding:0 20px 18px; }
        .ie-replay-btn { display:flex; align-items:center; gap:7px; border-radius:100px; padding:9px 20px; font-family:var(--font-ui); font-size:13px; font-weight:700; cursor:pointer; transition:all 0.2s; min-height:44px; border:2px solid transparent; }
        .ie-board { background:#fff; border:2px solid rgba(255,255,255,0.9); border-radius:22px; padding:22px 22px 20px; box-shadow:0 4px 22px rgba(45,100,80,0.09); opacity:0; transform:translateY(16px); transition:opacity 0.5s 0.26s ease,transform 0.5s 0.26s ease; }
        .ie-board.show { opacity:1; transform:translateY(0); }
        .ie-board-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
        .ie-board-title { font-family:var(--font-h); font-size:1.05rem; font-weight:700; color:var(--text); display:flex; align-items:center; gap:8px; }
        .ie-board-sub { font-size:12px; font-weight:600; color:var(--text-soft); }
        .ie-mission-list { display:flex; flex-direction:column; gap:9px; }
        .ie-mission { display:flex; align-items:center; gap:13px; padding:12px 15px; border-radius:15px; border:2px solid transparent; min-height:62px; opacity:0; transform:translateX(-14px); cursor:pointer; transition:transform 0.15s, border-color 0.15s; }
        .ie-mission:hover { border-color: var(--ic) !important; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .ie-mission.anim { animation:missionIn 0.36s ease both; }
        .ie-mission.done     { background:var(--icp); border-color:var(--ic-border,rgba(45,139,126,0.18)); }
        .ie-mission.upcoming { background:var(--cream2); border-color:var(--border); }
        .ie-m-icon { width:44px; height:44px; border-radius:13px; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; }
        .ie-m-icon.done     { background:var(--ic-icon-bg,rgba(45,139,126,0.14)); }
        .ie-m-icon.upcoming { background:var(--cream3); }
        .ie-m-info { flex:1; min-width:0; }
        .ie-m-label { font-size:14px; font-weight:700; color:var(--text); margin-bottom:1px; }
        .ie-m-desc  { font-size:12px; font-weight:600; color:var(--text-soft); }
        .ie-m-score { flex-shrink:0; font-size:13px; font-weight:800; padding:4px 12px; border-radius:100px; }
        .ie-m-score.done     { border:1.5px solid var(--ic-border,rgba(45,139,126,0.2)); }
        .ie-m-score.upcoming { background:var(--cream3); color:var(--text-soft); font-size:12px; }
        .ie-m-check { width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:800; color:#fff; flex-shrink:0; }
        .ie-m-dot   { width:10px; height:10px; border-radius:50%; background:var(--cream3); flex-shrink:0; }
        .ie-begin-wrap { opacity:0; transform:translateY(16px); transition:opacity 0.5s 0.46s ease,transform 0.5s 0.46s ease; }
        .ie-begin-wrap.show { opacity:1; transform:translateY(0); }
        .ie-begin-btn { width:100%; display:flex; align-items:center; justify-content:center; gap:10px; color:#fff; border:none; border-radius:18px; padding:18px 24px; font-family:var(--font-ui); font-size:18px; font-weight:800; letter-spacing:0.03em; cursor:pointer; transition:transform 0.2s,box-shadow 0.2s; min-height:62px; position:relative; overflow:hidden; }
        .ie-begin-btn::after { content:''; position:absolute; inset:0; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent); background-size:220% 100%; animation:shimmer 2.4s ease-in-out infinite; }
        .ie-begin-btn:hover { transform:translateY(-3px); }
        .ie-begin-btn:hover::after { animation:none; background:none; }
        .ie-begin-sub { text-align:center; font-size:12.5px; font-weight:700; color:var(--text-soft); margin-top:10px; display:flex; align-items:center; justify-content:center; gap:18px; flex-wrap:wrap; }
        .ie-begin-sub span { display:flex; align-items:center; gap:5px; }
        .ie-deco { position:fixed; user-select:none; pointer-events:none; opacity:0.09; animation:floatDeco 7s ease-in-out infinite; z-index:0; }
        .ie-loading { min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:20px; background:var(--cream); font-family:var(--font-ui); }
        .ie-loading-leo { animation:bounceLeo 1.4s ease-in-out infinite; }
        .ie-loading-txt { font-size:17px; font-weight:700; letter-spacing:0.05em; }
        @media (max-width:500px) { .ie-island-name { font-size:1.5rem; } .ie-begin-btn { font-size:16px; min-height:56px; } }
      `}</style>

            {loading ? (
                <div className="ie-loading">
                    <div className="ie-loading-leo">
                        <LeoAvatar size={100} />
                    </div>
                    <div className="ie-loading-txt" style={{ color: island.color }}>
                        Preparing {island.name}…
                    </div>
                </div>
            ) : (
                <div className="ie-page" style={{
                    ...cssVars,
                    background: `radial-gradient(ellipse at 8% 0%, ${island.colorPale} 0%, transparent 52%),
                                 radial-gradient(ellipse at 92% 95%, ${island.colorPale} 0%, transparent 52%),
                                 #FDF6ED`,
                }}>
                    {island.bgEmojis.map((em, i) => (
                        <div key={i} className="ie-deco" style={{
                            fontSize: [30, 38, 26, 34, 22][i],
                            top: `${[7, 16, 52, 68, 33][i]}%`,
                            left: `${[2, 87, 1, 91, 48][i]}%`,
                            animationDelay: `${i * 1.5}s`, animationDuration: `${6 + i * 1.3}s`,
                        }}>{em}</div>
                    ))}

                    {/* Top bar — Lottie tiger in badge (replaces old sun emoji) */}
                    <div className="ie-topbar">
                        <button className="ie-back" onClick={handleBack}>← Back to map</button>
                        <div className="ie-badge" style={{ background: island.colorPale, borderColor: island.color + '44', color: island.colorDark }}>
                            <LeoAvatar size={32} />
                            Island {islandId} of 5
                        </div>
                    </div>

                    <div className="ie-grid">
                        <div className="ie-left">
                            {/* Hero card */}
                            <div className={`ie-hero${revealed ? ' show' : ''}`}
                                style={{ background: `linear-gradient(145deg, ${island.colorDark} 0%, ${island.color} 100%)`, boxShadow: `0 8px 36px ${island.color}55` }}>
                                <div className="ie-hero-deco">{island.emoji}</div>
                                <div className="ie-island-num">
                                    Island {islandId} &nbsp;·&nbsp;
                                    {isCompleted ? '✅ Completed' : overallPct > 0 ? '⚡ In Progress' : '🌟 New Adventure'}
                                </div>
                                <div className="ie-island-name">{island.name}</div>
                                <div className="ie-phoneme-pill">🎯 {island.phoneme}</div>
                                <div className="ie-island-desc">{island.description}</div>
                                {overallPct > 0 && (
                                    <div className="ie-progress-row">
                                        <div className="ie-prog-track">
                                            <div className="ie-prog-fill" style={{ width: `${overallPct}%` }} />
                                        </div>
                                        <div className="ie-prog-pct">{overallPct}%</div>
                                    </div>
                                )}
                            </div>

                            {/* Leo card — Lottie tiger replaces SVG */}
                            <div className={`ie-leo-card${revealed ? ' show' : ''}`}>
                                <div className="ie-leo-top">
                                    <div className={`ie-leo-anim${revealed ? ' land' : ''}`}>
                                        <LeoAvatar size={86} />
                                    </div>
                                    <div className="ie-leo-meta">
                                        <div className="ie-leo-tag">🐯 Leo says</div>
                                        <div className="ie-leo-title">Your jungle guide</div>
                                    </div>
                                </div>
                                <div className="ie-leo-speech">{island.leoSpeech}</div>
                                <div className="ie-leo-actions">
                                    <button className="ie-replay-btn" onClick={handleReplay}
                                        style={{ background: island.colorPale, color: island.colorDark, borderColor: island.color + '33' }}>
                                        🔊 Hear again
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="ie-right">
                            {/* Mission board */}
                            <div className={`ie-board${missionsShown ? ' show' : ''}`}>
                                <div className="ie-board-header">
                                    <div className="ie-board-title">🗺️ Mission Board</div>
                                    <div className="ie-board-sub">{doneCount} / 5 done</div>
                                </div>
                                <div className="ie-mission-list">
                                    {MISSIONS.map((m, idx) => {
                                        const score = bestScores[m.key];
                                        const done = score !== undefined;
                                        return (
                                            <div
                                                key={m.key}
                                                className={`ie-mission ${done ? 'done' : 'upcoming'}${missionsShown ? ' anim' : ''}`}
                                                onClick={() => handleMissionClick(m.key)}
                                                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleMissionClick(m.key)}
                                                role="button"
                                                tabIndex={0}
                                                style={{
                                                    ['--icp' as any]: island.colorPale,
                                                    ['--ic-border' as any]: island.color + '30',
                                                    ['--ic-icon-bg' as any]: island.color + '1A',
                                                }}
                                            >
                                                <div className={`ie-m-icon ${done ? 'done' : 'upcoming'}`}>{m.icon}</div>
                                                <div className="ie-m-info">
                                                    <div className="ie-m-label">{m.label}</div>
                                                    <div className="ie-m-desc">{m.desc}</div>
                                                </div>
                                                <div className={`ie-m-score ${done ? 'done' : 'upcoming'}`}
                                                    style={done ? { background: island.colorPale, color: island.colorDark } : {}}>
                                                    {done ? `${score}%` : 'Not started'}
                                                </div>
                                                {done
                                                    ? <div className="ie-m-check" style={{ background: island.color }}>✓</div>
                                                    : <div className="ie-m-dot" />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Begin button */}
                            <div className={`ie-begin-wrap${missionsShown ? ' show' : ''}`}>
                                <button className="ie-begin-btn" onClick={handleBegin}
                                    style={{ background: `linear-gradient(135deg, ${island.colorDark}, ${island.color})`, boxShadow: `0 6px 26px ${island.color}55, 0 3px 0 ${island.colorDark}` }}>
                                    {isCompleted ? '🔁 Practise Again' : overallPct > 0 ? '▶ Continue Mission' : '🚀 Begin Mission!'}
                                </button>
                                <div className="ie-begin-sub">
                                    <span>⏱️ No timers</span>
                                    <span>🎯 5 activities</span>
                                    <span>☀️ +20 coins</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <JungleHorizon color={island.color} />
                </div>
            )}
        </>
    );
};

export default IslandEntry;