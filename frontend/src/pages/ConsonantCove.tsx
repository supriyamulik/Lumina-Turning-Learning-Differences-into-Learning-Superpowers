// frontend/src/pages/ConsonantCove.tsx
// Route:  /consonant-cove
// Bonus island — accessible from dashboard island map
//
// CONCEPT: Ocean/cove themed. Vowel tile pre-filled in centre slot.
// Student drags consonant tiles into [START] and [END] slots to
// build a real CVC word. Leo (Lottie tiger) narrates everything.
//
// DYSLEXIA RULES (non-negotiable):
// • Leo speaks every tile on hover + auto-narrates instructions
// • No timers anywhere
// • Wrong = gentle wave-shake + warm message, never "wrong"
// • After 2 wrong → Leo reveals answer + moves on
// • OpenDyslexic font on all letter/word content, min 22px
// • Full keyboard: Tab to select tile, Tab to slot, Enter to place
// • Correct = wave burst + coin pop Lottie celebration

import React, {
    useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import Lottie from 'lottie-react';
import { useNavigate } from 'react-router-dom';
import { progressApi } from '../lib/api';
import { useLeoSpeech } from '../hooks/useLeoSpeech';
import tigerAnim from '../assets/animations/Cute Tiger.json';

// ── Types ──────────────────────────────────────────────────────
interface CVCWord {
    id: string;
    start: string;
    vowel: string;
    end: string;
    word: string;
    emoji: string;
    leoIntro: string;
    leoHint: string;
    startSound: string;
    vowelSound: string;
    endSound: string;
}

// ── Word bank (20 CVC words) ───────────────────────────────────
const CVC_WORDS: CVCWord[] = [
    {
        id: 'w01', start: 'c', vowel: 'a', end: 't', word: 'cat', emoji: '🐱',
        leoIntro: 'The middle sound is aaa. Can you find the letters to complete this word?',
        leoHint: 'The word starts with the kuh sound. It is a furry animal that says meow!',
        startSound: 'kuh', vowelSound: 'aaa', endSound: 'tuh'
    },
    {
        id: 'w02', start: 'd', vowel: 'o', end: 'g', word: 'dog', emoji: '🐶',
        leoIntro: 'The middle sound is oh. Build the word for a furry friend that barks!',
        leoHint: 'The word starts with duh and ends with guh. It is a pet that loves walks!',
        startSound: 'duh', vowelSound: 'oh', endSound: 'guh'
    },
    {
        id: 'w03', start: 'h', vowel: 'a', end: 't', word: 'hat', emoji: '🎩',
        leoIntro: 'The middle sound is aaa. You wear this on your head!',
        leoHint: 'The word starts with huh. It sits right on top of your head!',
        startSound: 'huh', vowelSound: 'aaa', endSound: 'tuh'
    },
    {
        id: 'w04', start: 'p', vowel: 'o', end: 't', word: 'pot', emoji: '🪴',
        leoIntro: 'The middle sound is oh. You cook soup in this!',
        leoHint: 'The word starts with puh. You boil water in a...?',
        startSound: 'puh', vowelSound: 'oh', endSound: 'tuh'
    },
    {
        id: 'w05', start: 'b', vowel: 'u', end: 'g', word: 'bug', emoji: '🐛',
        leoIntro: 'The middle sound is uh. This little creature lives in the garden!',
        leoHint: 'The word starts with buh. It is a tiny crawling creature!',
        startSound: 'buh', vowelSound: 'uh', endSound: 'guh'
    },
    {
        id: 'w06', start: 's', vowel: 'u', end: 'n', word: 'sun', emoji: '☀️',
        leoIntro: 'The middle sound is uh. It shines in the sky every day!',
        leoHint: 'The word starts with sss. It gives us light and warmth!',
        startSound: 'sss', vowelSound: 'uh', endSound: 'nnn'
    },
    {
        id: 'w07', start: 'r', vowel: 'u', end: 'n', word: 'run', emoji: '🏃',
        leoIntro: 'The middle sound is uh. What do fast legs do?',
        leoHint: 'The word starts with rrr. You do this in a race!',
        startSound: 'rrr', vowelSound: 'uh', endSound: 'nnn'
    },
    {
        id: 'w08', start: 'b', vowel: 'e', end: 'd', word: 'bed', emoji: '🛏️',
        leoIntro: 'The middle sound is eh. You sleep in this every night!',
        leoHint: 'The word starts with buh. You lie down in a...?',
        startSound: 'buh', vowelSound: 'eh', endSound: 'duh'
    },
    {
        id: 'w09', start: 'r', vowel: 'e', end: 'd', word: 'red', emoji: '🔴',
        leoIntro: 'The middle sound is eh. This is the colour of apples and fire!',
        leoHint: 'The word starts with rrr. It is the colour of a strawberry!',
        startSound: 'rrr', vowelSound: 'eh', endSound: 'duh'
    },
    {
        id: 'w10', start: 'l', vowel: 'e', end: 'g', word: 'leg', emoji: '🦵',
        leoIntro: 'The middle sound is eh. You use these to walk and run!',
        leoHint: 'The word starts with lll. It is part of your body below your hip!',
        startSound: 'lll', vowelSound: 'eh', endSound: 'guh'
    },
    {
        id: 'w11', start: 's', vowel: 'i', end: 't', word: 'sit', emoji: '🪑',
        leoIntro: 'The middle sound is ih. What do you do on a chair?',
        leoHint: 'The word starts with sss. You do this when you are on a chair!',
        startSound: 'sss', vowelSound: 'ih', endSound: 'tuh'
    },
    {
        id: 'w12', start: 'b', vowel: 'i', end: 'g', word: 'big', emoji: '🐘',
        leoIntro: 'The middle sound is ih. An elephant is very...?',
        leoHint: 'The word starts with buh. An elephant is very big!',
        startSound: 'buh', vowelSound: 'ih', endSound: 'guh'
    },
    {
        id: 'w13', start: 'p', vowel: 'i', end: 'g', word: 'pig', emoji: '🐷',
        leoIntro: 'The middle sound is ih. This farm animal loves mud!',
        leoHint: 'The word starts with puh. It oinks and lives on a farm!',
        startSound: 'puh', vowelSound: 'ih', endSound: 'guh'
    },
    {
        id: 'w14', start: 'f', vowel: 'o', end: 'x', word: 'fox', emoji: '🦊',
        leoIntro: 'The middle sound is oh. This clever orange animal lives in the forest!',
        leoHint: 'The word starts with fff. It is orange and very clever!',
        startSound: 'fff', vowelSound: 'oh', endSound: 'ks'
    },
    {
        id: 'w15', start: 'b', vowel: 'o', end: 'x', word: 'box', emoji: '📦',
        leoIntro: 'The middle sound is oh. You put things inside this!',
        leoHint: 'The word starts with buh. You pack things into a...?',
        startSound: 'buh', vowelSound: 'oh', endSound: 'ks'
    },
    {
        id: 'w16', start: 'm', vowel: 'a', end: 'p', word: 'map', emoji: '🗺️',
        leoIntro: 'The middle sound is aaa. You use this to find your way!',
        leoHint: 'The word starts with mmm. It shows you where to go!',
        startSound: 'mmm', vowelSound: 'aaa', endSound: 'puh'
    },
    {
        id: 'w17', start: 'j', vowel: 'a', end: 'm', word: 'jam', emoji: '🍓',
        leoIntro: 'The middle sound is aaa. You spread this on toast!',
        leoHint: 'The word starts with juh. It is sweet and goes on bread!',
        startSound: 'juh', vowelSound: 'aaa', endSound: 'mmm'
    },
    {
        id: 'w18', start: 'w', vowel: 'e', end: 'b', word: 'web', emoji: '🕸️',
        leoIntro: 'The middle sound is eh. A spider makes this!',
        leoHint: 'The word starts with wuh. A spider spins a...?',
        startSound: 'wuh', vowelSound: 'eh', endSound: 'buh'
    },
    {
        id: 'w19', start: 'c', vowel: 'u', end: 'p', word: 'cup', emoji: '☕',
        leoIntro: 'The middle sound is uh. You drink from this!',
        leoHint: 'The word starts with kuh. You sip tea from a...?',
        startSound: 'kuh', vowelSound: 'uh', endSound: 'puh'
    },
    {
        id: 'w20', start: 't', vowel: 'u', end: 'b', word: 'tub', emoji: '🛁',
        leoIntro: 'The middle sound is uh. You have a bath in this!',
        leoHint: 'The word starts with tuh. You fill it with water and bubbles!',
        startSound: 'tuh', vowelSound: 'uh', endSound: 'buh'
    },
];

// All single consonants available as draggable tiles
const ALL_CONSONANTS = ['b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'w', 'x', 'y', 'z'];

const WORDS_PER_SESSION = 8;

function shuffle<T>(arr: T[]): T[] {
    return [...arr].sort(() => Math.random() - 0.5);
}

// For each word, pick 5 distractor consonants + the correct ones
function buildTileSet(word: CVCWord): string[] {
    const correct = [word.start, word.end];
    const others = shuffle(ALL_CONSONANTS.filter(c => !correct.includes(c))).slice(0, 6);
    return shuffle([...new Set([...correct, ...others])]);
}

// ── Leo Tiger Component ────────────────────────────────────────
const LeoTiger: React.FC<{ talking?: boolean; size?: number; mood?: 'happy' | 'thinking' | 'celebrate' }> = ({
    talking, size = 110, mood = 'thinking',
}) => {
    const style: React.CSSProperties = {
        width: size, height: size, flexShrink: 0,
        filter: talking ? 'drop-shadow(0 0 12px rgba(232,146,12,0.55))' : 'none',
        transition: 'filter 0.3s ease',
        transform: mood === 'celebrate' ? 'scale(1.12) rotate(-4deg)' : 'scale(1)',
    };
    return <Lottie animationData={tigerAnim} loop style={style} />;
};

// ── Slot component ─────────────────────────────────────────────
interface SlotProps {
    label: string;
    value: string | null;
    isVowel?: boolean;
    isOver?: boolean;
    isWrong?: boolean;
    isRight?: boolean;
    color: string;
    colorPale: string;
    onClick?: () => void;
    onDragOver?: (e: React.DragEvent) => void;
    onDrop?: (e: React.DragEvent) => void;
    onDragLeave?: () => void;
}
const Slot: React.FC<SlotProps> = ({
    label, value, isVowel, isOver, isWrong, isRight, color, colorPale,
    onClick, onDragOver, onDrop, onDragLeave,
}) => {
    const bg = isVowel
        ? `linear-gradient(135deg,${color}22,${color}44)`
        : isRight ? 'linear-gradient(135deg,#E6F9EF,#C8F0D8)'
            : isWrong ? '#FFF3F3'
                : isOver ? colorPale
                    : value ? `linear-gradient(135deg,${colorPale},${color}18)`
                        : '#fff';

    const border = isVowel
        ? `3px solid ${color}`
        : isRight ? '3px solid #27AE60'
            : isWrong ? '3px solid #E89090'
                : isOver ? `3px solid ${color}`
                    : value ? `2.5px solid ${color}88`
                        : '2.5px dashed rgba(45,139,126,0.28)';

    return (
        <div
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragLeave={onDragLeave}
            onClick={onClick}
            style={{
                width: 88, height: 92, borderRadius: 20,
                background: bg, border,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 4, cursor: isVowel ? 'default' : 'pointer',
                transition: 'all 0.22s cubic-bezier(0.34,1.2,0.64,1)',
                transform: isOver ? 'scale(1.07)' : isRight ? 'scale(1.05)' : 'scale(1)',
                boxShadow: isOver
                    ? `0 8px 24px ${color}44`
                    : isRight ? '0 6px 20px rgba(39,174,96,0.3)'
                        : '0 3px 12px rgba(45,100,80,0.08)',
                animation: isWrong ? 'coveShake 0.42s ease both' : 'none',
                userSelect: 'none',
            }}
        >
            <div style={{
                fontFamily: "'OpenDyslexic','Lexend',sans-serif",
                fontSize: value ? '2.2rem' : '1.5rem',
                fontWeight: 800,
                color: isVowel ? color : value ? '#1C2E24' : 'rgba(45,139,126,0.25)',
                lineHeight: 1,
                transition: 'all 0.2s',
            }}>
                {value || (isVowel ? '' : '?')}
            </div>
            <div style={{
                fontSize: 10, fontWeight: 800, letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: isVowel ? color : 'rgba(45,139,126,0.4)',
            }}>
                {label}
            </div>
            {isRight && <div style={{ fontSize: 16, lineHeight: 1 }}>✅</div>}
        </div>
    );
};

// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════
const ConsonantCove: React.FC = () => {
    const navigate = useNavigate();
    const { say, cancel, speakOnHover, cancelHover, talking, ready } = useLeoSpeech();

    const color = '#0EA5C8';
    const colorDark = '#0A7A97';
    const colorPale = '#E0F7FC';

    // ── Session state ──
    const [words, setWords] = useState<CVCWord[]>([]);
    const [wordIdx, setWordIdx] = useState(0);
    const [startSlot, setStartSlot] = useState<string | null>(null);
    const [endSlot, setEndSlot] = useState<string | null>(null);
    const [attempts, setAttempts] = useState(0);
    const [startWrong, setStartWrong] = useState(false);
    const [endWrong, setEndWrong] = useState(false);
    const [startRight, setStartRight] = useState(false);
    const [endRight, setEndRight] = useState(false);
    const [leoMsg, setLeoMsg] = useState('');
    const [leoMood, setLeoMood] = useState<'thinking' | 'happy' | 'celebrate'>('thinking');
    const [dragOver, setDragOver] = useState<'start' | 'end' | null>(null);
    const [dragging, setDragging] = useState<string | null>(null);
    const [selected, setSelected] = useState<string | null>(null); // keyboard selection
    const [wordDone, setWordDone] = useState(false);
    const [sessionDone, setDone] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const resultsRef = useRef<{ correct: boolean; attempts: number }[]>([]);
    const advTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const word = words[wordIdx];
    const tiles = useMemo(() => word ? buildTileSet(word) : [], [word?.id]);

    // ── Init ───────────────────────────────────────────────────
    useEffect(() => {
        setWords(shuffle(CVC_WORDS).slice(0, WORDS_PER_SESSION));
    }, []);

    // ── New word ───────────────────────────────────────────────
    useEffect(() => {
        if (!word || !ready) return;
        setStartSlot(null); setEndSlot(null);
        setAttempts(0);
        setStartWrong(false); setEndWrong(false);
        setStartRight(false); setEndRight(false);
        setWordDone(false); setSelected(null);
        setLeoMood('thinking');
        setShowCelebration(false);
        if (advTimer.current) clearTimeout(advTimer.current);

        const t = setTimeout(() => {
            setLeoMsg(word.leoIntro);
            say(word.leoIntro, 'instruction');
        }, 500);
        return () => clearTimeout(t);
    }, [wordIdx, words, ready]);

    // ── Check word when both slots filled ─────────────────────
    useEffect(() => {
        if (!startSlot || !endSlot || !word || wordDone) return;

        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        const startOk = startSlot === word.start;
        const endOk = endSlot === word.end;

        if (startOk && endOk) {
            // CORRECT
            setStartRight(true); setEndRight(true);
            setWordDone(true);
            setLeoMood('celebrate');
            setShowCelebration(true);
            const praises = [
                `Yes! ${word.start.toUpperCase()} — ${word.vowel.toUpperCase()} — ${word.end.toUpperCase()} spells "${word.word}"! ${word.emoji} Amazing!`,
                `Brilliant! You built the word "${word.word}"! ${word.emoji} You are a word wizard!`,
                `Perfect! ${word.emoji} "${word.word.toUpperCase()}" — you got every sound right!`,
                `Incredible! The letters come together to make "${word.word}"! ${word.emoji}`,
            ];
            const msg = praises[Math.floor(Math.random() * praises.length)];
            setLeoMsg(msg);
            say(msg, 'praise');
            resultsRef.current.push({ correct: true, attempts: newAttempts });

            advTimer.current = setTimeout(() => {
                setShowCelebration(false);
                if (wordIdx < words.length - 1) {
                    setWordIdx(i => i + 1);
                } else {
                    finishSession();
                }
            }, 2400);

        } else {
            // WRONG
            if (!startOk) { setStartWrong(true); setTimeout(() => setStartWrong(false), 600); }
            if (!endOk) { setEndWrong(true); setTimeout(() => setEndWrong(false), 600); }

            // Clear wrong slots after shake
            setTimeout(() => {
                if (!startOk) setStartSlot(null);
                if (!endOk) setEndSlot(null);
            }, 650);

            if (newAttempts === 1) {
                const msg = `Good try! Listen again — ${word.leoHint}`;
                setLeoMsg(msg);
                say(msg, 'hint');
                setLeoMood('thinking');
            } else {
                // Reveal after 2 wrong
                const msg = `The word is "${word.word}"! ${word.emoji} ${word.start.toUpperCase()} — ${word.vowel.toUpperCase()} — ${word.end.toUpperCase()}. Let us try the next one!`;
                setLeoMsg(msg);
                say(msg, 'hint');
                setLeoMood('happy');
                resultsRef.current.push({ correct: false, attempts: newAttempts });
                advTimer.current = setTimeout(() => {
                    if (wordIdx < words.length - 1) setWordIdx(i => i + 1);
                    else finishSession();
                }, 2800);
            }
        }
    }, [startSlot, endSlot]);

    // ── Finish ─────────────────────────────────────────────────
    const finishSession = async () => {
        setDone(true);
        const results = resultsRef.current;
        const total = results.length;
        const correct = results.filter(r => r.correct).length;
        const weighted = results.reduce((s, r) => {
            if (r.correct && r.attempts === 1) return s + 100;
            if (r.correct && r.attempts === 2) return s + 65;
            if (r.correct) return s + 35;
            return s;
        }, 0);
        const score = total > 0 ? Math.round(weighted / total) : 0;
        const msg = score >= 85
            ? `Wow! You built ${correct} out of ${total} words perfectly! You are a Consonant Cove champion!`
            : score >= 60
                ? `Great building, ${correct} out of ${total} words! You are getting stronger every day!`
                : `Well done for trying! You built ${correct} out of ${total} words. Keep practising!`;
        setLeoMsg(msg);
        setLeoMood(score >= 60 ? 'celebrate' : 'happy');
        say(msg, 'results');

        setSaving(true);
        try {
            await progressApi.saveActivity({
                islandId: 6,   // bonus island id
                activityType: 'consonant_cove',
                score,
                totalQuestions: total,
                correct,
            });
        } catch (_) { }
        setSaving(false);
    };

    // ── Drag handlers ──────────────────────────────────────────
    const handleDragStart = (letter: string) => setDragging(letter);
    const handleDragEnd = () => { setDragging(null); setDragOver(null); };

    const handleDrop = (slot: 'start' | 'end') => (e: React.DragEvent) => {
        e.preventDefault();
        const letter = dragging || e.dataTransfer.getData('letter');
        if (!letter || wordDone) return;
        setDragOver(null);
        if (slot === 'start') setStartSlot(letter);
        else setEndSlot(letter);
        say(letter, 'word');
    };

    // ── Keyboard / tap placement ───────────────────────────────
    const handleTileClick = (letter: string) => {
        if (wordDone) return;
        if (selected === letter) { setSelected(null); return; }
        say(letter, 'word');
        setSelected(letter);
    };

    const handleSlotClick = (slot: 'start' | 'end') => {
        if (!selected || wordDone) return;
        if (slot === 'start') setStartSlot(selected);
        else setEndSlot(selected);
        setSelected(null);
        say(selected, 'word');
    };

    // ── Results screen ─────────────────────────────────────────
    if (sessionDone) {
        const results = resultsRef.current;
        const total = results.length;
        const correct = results.filter(r => r.correct).length;
        const weighted = results.reduce((s, r) => {
            if (r.correct && r.attempts === 1) return s + 100;
            if (r.correct && r.attempts === 2) return s + 65;
            if (r.correct) return s + 35;
            return s;
        }, 0);
        const score = total > 0 ? Math.round(weighted / total) : 0;
        const stars = score >= 88 ? 3 : score >= 62 ? 2 : 1;
        const coins = score >= 80 ? 12 : score >= 60 ? 7 : 3;

        return (
            <>
                <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@400;600;700;800&family=Fraunces:opsz,wght@9..144,700;9..144,800&display=swap');
          *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
          body{font-family:'Lexend',sans-serif;background:#E0F7FC}
          @keyframes popIn{0%{opacity:0;transform:scale(0.82) translateY(24px)}70%{transform:scale(1.06)}100%{opacity:1;transform:scale(1)}}
          @keyframes starPop{0%{opacity:0;transform:scale(0) rotate(-30deg)}70%{transform:scale(1.3) rotate(5deg)}100%{opacity:1;transform:scale(1)}}
          @keyframes wave{0%,100%{transform:translateX(0)}50%{transform:translateX(-25px)}}
          @keyframes coinSpin{from{transform:rotateY(0)}to{transform:rotateY(360deg)}}
        `}</style>
                <div style={{
                    minHeight: '100vh', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', padding: '28px 18px',
                    background: 'linear-gradient(160deg,#0EA5C8 0%,#38BDF8 35%,#BAE6FD 70%,#E0F7FC 100%)',
                }}>
                    {/* Animated waves */}
                    <svg style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', pointerEvents: 'none', zIndex: 0 }}
                        viewBox="0 0 1440 120" preserveAspectRatio="none">
                        <path d="M0,60 C360,100 720,20 1080,60 C1260,80 1380,40 1440,60 L1440,120 L0,120 Z"
                            fill="rgba(255,255,255,0.18)" style={{ animation: 'wave 6s ease-in-out infinite' }} />
                        <path d="M0,80 C240,40 600,100 960,70 C1200,50 1380,90 1440,80 L1440,120 L0,120 Z"
                            fill="rgba(255,255,255,0.12)" style={{ animation: 'wave 8s ease-in-out infinite reverse' }} />
                    </svg>

                    <div style={{
                        background: '#fff', borderRadius: 28, padding: '36px 28px',
                        maxWidth: 420, width: '100%', textAlign: 'center',
                        boxShadow: '0 16px 60px rgba(14,165,200,0.22)',
                        animation: 'popIn 0.55s cubic-bezier(0.34,1.2,0.64,1) both',
                        position: 'relative', zIndex: 1,
                    }}>
                        <LeoTiger size={100} mood="celebrate" talking={talking} />
                        <div style={{
                            fontFamily: "'Fraunces',serif",
                            fontSize: '1.9rem', fontWeight: 800, color: colorDark, marginBottom: 6, marginTop: 8,
                        }}>
                            {stars === 3 ? 'Cove Champion!' : stars === 2 ? 'Great Builder!' : 'Keep Going!'}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#6B8876', marginBottom: 20 }}>
                            Consonant Cove 🏝️ · CVC Word Building
                        </div>

                        {/* Stars */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 22 }}>
                            {[1, 2, 3].map(s => (
                                <span key={s} style={{
                                    fontSize: 44, opacity: s <= stars ? 1 : 0.15,
                                    filter: s <= stars ? 'none' : 'grayscale(1)',
                                    animation: s <= stars ? `starPop 0.5s ${(s - 1) * 0.2}s cubic-bezier(0.34,1.5,0.64,1) both` : 'none',
                                }}>⭐</span>
                            ))}
                        </div>

                        {/* Score pills */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
                            {[{ val: `${score}%`, lbl: 'Score' }, { val: `${correct}/${total}`, lbl: 'Words Built' }].map(({ val, lbl }) => (
                                <div key={lbl} style={{
                                    background: colorPale, border: `1.5px solid ${color}33`,
                                    borderRadius: 16, padding: '11px 20px', minWidth: 90,
                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                }}>
                                    <div style={{ fontSize: '1.55rem', fontWeight: 800, color: colorDark, lineHeight: 1 }}>{val}</div>
                                    <div style={{
                                        fontSize: 11, fontWeight: 700, color: '#6B8876', marginTop: 4,
                                        textTransform: 'uppercase', letterSpacing: '0.08em'
                                    }}>{lbl}</div>
                                </div>
                            ))}
                        </div>

                        {/* Coins */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                            background: '#FFFBF0', border: '1.5px solid rgba(232,146,12,0.22)',
                            borderRadius: 14, padding: '10px 20px', marginBottom: 20,
                            fontSize: 15, fontWeight: 800, color: '#B36A00',
                        }}>
                            <span style={{ display: 'inline-block', animation: 'coinSpin 2.4s linear infinite' }}>☀️</span>
                            +{coins} Sun Coins earned!
                        </div>

                        {/* Leo message */}
                        <div style={{
                            display: 'flex', alignItems: 'flex-start', gap: 12,
                            background: '#F0FAFE', borderRadius: 16, padding: '13px 15px',
                            marginBottom: 24, textAlign: 'left',
                        }}>
                            <LeoTiger size={52} mood="happy" talking={talking} />
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#304838', lineHeight: 1.78, paddingTop: 4 }}>
                                {leoMsg}
                            </div>
                        </div>

                        {saving && (
                            <div style={{ fontSize: 12, color: '#6B8876', marginBottom: 12, fontWeight: 600 }}>
                                Saving your progress…
                            </div>
                        )}

                        <button
                            onClick={() => { cancel(); navigate('/dashboard'); }}
                            style={{
                                width: '100%', padding: '15px', marginBottom: 10,
                                background: `linear-gradient(135deg,${colorDark},${color})`,
                                color: '#fff', border: 'none', borderRadius: 16,
                                fontFamily: "'Lexend',sans-serif", fontSize: 16, fontWeight: 800,
                                cursor: 'pointer', boxShadow: `0 5px 20px ${color}55`,
                                minHeight: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            }}
                        >
                            🗺️ Back to Island Map
                        </button>
                        <button
                            onClick={() => {
                                cancel();
                                setWordIdx(0); resultsRef.current = [];
                                setDone(false); setLeoMsg('');
                                setWords(shuffle(CVC_WORDS).slice(0, WORDS_PER_SESSION));
                            }}
                            style={{
                                width: '100%', padding: '12px',
                                background: 'transparent', color: colorDark,
                                border: `2px solid ${color}44`, borderRadius: 14,
                                fontFamily: "'Lexend',sans-serif", fontSize: 14, fontWeight: 700,
                                cursor: 'pointer', minHeight: 48,
                            }}
                        >
                            🔄 Play again
                        </button>
                    </div>
                </div>
            </>
        );
    }

    if (!word) return null;

    const progressPct = Math.round((wordIdx / words.length) * 100);
    const bothFilled = startSlot !== null && endSlot !== null;

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@400;600;700;800&family=Fraunces:opsz,wght@9..144,700;9..144,800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{height:100%;overflow-x:hidden;font-family:'Lexend',sans-serif;}

        @keyframes fadeUp  {from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn  {from{opacity:0}to{opacity:1}}
        @keyframes wave    {0%,100%{transform:translateX(0)}50%{transform:translateX(-30px)}}
        @keyframes wave2   {0%,100%{transform:translateX(0)}50%{transform:translateX(30px)}}
        @keyframes bobble  {0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes coveShake{0%{transform:translateX(0)}15%{transform:translateX(-8px)}40%{transform:translateX(8px)}65%{transform:translateX(-5px)}85%{transform:translateX(5px)}100%{transform:translateX(0)}}
        @keyframes tileIn  {from{opacity:0;transform:scale(0.8) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes celebrate{0%{transform:scale(1)}30%{transform:scale(1.15) rotate(3deg)}60%{transform:scale(1.1) rotate(-2deg)}100%{transform:scale(1)}}
        @keyframes burstPop {0%{opacity:0;transform:scale(0)}60%{opacity:1;transform:scale(1.2)}100%{opacity:1;transform:scale(1)}}
        @keyframes talkGlow {0%,100%{filter:drop-shadow(0 0 6px rgba(232,146,12,0.3))}50%{filter:drop-shadow(0 0 18px rgba(232,146,12,0.7))}}
        @keyframes shimmer  {0%{background-position:200% center}100%{background-position:-200% center}}

        .cove-page{
          min-height:100vh;
          background:linear-gradient(180deg,#0EA5C8 0%,#38BDF8 30%,#BAE6FD 60%,#E0F7FC 100%);
          display:flex;flex-direction:column;position:relative;overflow:hidden;
        }

        /* ─ Waves ─ */
        .waves-bg{position:fixed;bottom:0;left:0;width:100%;pointer-events:none;z-index:0;}
        .wave-path1{animation:wave 7s ease-in-out infinite;}
        .wave-path2{animation:wave2 9s ease-in-out infinite;}

        /* ─ Top bar ─ */
        .cove-topbar{
          padding:14px 22px;display:flex;align-items:center;gap:12px;
          flex-wrap:wrap;position:relative;z-index:10;
          animation:fadeIn 0.35s ease both;
        }
        .cove-back{
          display:flex;align-items:center;gap:7px;
          background:rgba(255,255,255,0.88);border:1.5px solid rgba(255,255,255,0.5);
          border-radius:100px;padding:10px 20px;
          font-size:14px;font-weight:700;color:#0A7A97;
          cursor:pointer;transition:all 0.2s;min-height:48px;
          backdrop-filter:blur(8px);
        }
        .cove-back:hover{background:#fff;transform:translateX(-2px);}
        .cove-badge{
          display:flex;align-items:center;gap:7px;
          border:1.5px solid rgba(255,255,255,0.4);border-radius:100px;
          padding:8px 16px;font-size:12px;font-weight:800;
          background:rgba(255,255,255,0.22);color:#fff;
          backdrop-filter:blur(8px);
        }
        .cove-prog-wrap{flex:1;min-width:120px;}
        .cove-prog-lbl{font-size:11px;font-weight:700;color:rgba(255,255,255,0.8);margin-bottom:5px;text-align:right;}
        .cove-prog-track{height:9px;background:rgba(255,255,255,0.25);border-radius:100px;overflow:hidden;}
        .cove-prog-fill{
          height:100%;border-radius:100px;
          background:linear-gradient(90deg,#fff,rgba(255,255,255,0.7));
          transition:width 0.6s cubic-bezier(0.34,1.2,0.64,1);
        }
        .cove-speak{
          display:flex;align-items:center;gap:7px;
          background:rgba(255,255,255,0.22);border:1.5px solid rgba(255,255,255,0.4);
          border-radius:100px;padding:10px 18px;
          font-size:13px;font-weight:700;color:#fff;
          cursor:pointer;min-height:48px;backdrop-filter:blur(8px);
          transition:all 0.2s;
        }
        .cove-speak:hover{background:rgba(255,255,255,0.35);}

        /* ─ Main ─ */
        .cove-main{
          flex:1;display:flex;flex-direction:column;align-items:center;
          padding:0 18px 40px;max-width:700px;margin:0 auto;width:100%;
          position:relative;z-index:2;
        }

        /* ─ Leo + message ─ */
        .cove-leo-strip{
          display:flex;align-items:flex-start;gap:14px;
          background:rgba(255,255,255,0.92);
          border:1.5px solid rgba(255,255,255,0.7);
          border-radius:22px;padding:14px 18px;
          box-shadow:0 4px 20px rgba(14,165,200,0.15);
          margin-bottom:22px;width:100%;
          backdrop-filter:blur(12px);
          animation:fadeUp 0.38s ease both;
        }
        .cove-leo-msg{
          flex:1;font-size:15px;font-weight:600;color:#0A4A5E;
          line-height:1.78;letter-spacing:0.022em;padding-top:4px;
        }

        /* ─ Word target area ─ */
        .cove-word-area{
          display:flex;flex-direction:column;align-items:center;
          margin-bottom:24px;animation:fadeUp 0.4s 0.08s ease both;width:100%;
        }
        .cove-word-label{
          font-size:11px;font-weight:800;color:rgba(255,255,255,0.85);
          text-transform:uppercase;letter-spacing:0.18em;margin-bottom:14px;
        }
        .cove-slots{
          display:flex;align-items:center;gap:12px;justify-content:center;flex-wrap:wrap;
        }
        .cove-plus{
          font-size:26px;font-weight:800;color:rgba(255,255,255,0.6);
          animation:bobble 2.5s ease-in-out infinite;
        }

        /* ─ Emoji reveal ─ */
        .cove-emoji-reveal{
          font-size:56px;margin-top:14px;
          animation:burstPop 0.5s cubic-bezier(0.34,1.5,0.64,1) both;
          filter:drop-shadow(0 4px 12px rgba(14,165,200,0.3));
        }
        .cove-word-reveal{
          font-family:'OpenDyslexic','Lexend',sans-serif;
          font-size:2rem;font-weight:800;color:#fff;letter-spacing:0.08em;
          margin-top:6px;animation:burstPop 0.5s 0.15s cubic-bezier(0.34,1.5,0.64,1) both;
          text-shadow:0 2px 12px rgba(14,165,200,0.4);
        }

        /* ─ Consonant tiles ─ */
        .cove-tiles-section{
          width:100%;animation:fadeUp 0.42s 0.12s ease both;
        }
        .cove-tiles-label{
          font-size:11px;font-weight:800;color:rgba(255,255,255,0.8);
          text-transform:uppercase;letter-spacing:0.16em;
          margin-bottom:12px;text-align:center;
        }
        .cove-tiles{
          display:flex;flex-wrap:wrap;gap:10px;justify-content:center;
        }
        .cove-tile{
          width:58px;height:62px;border-radius:16px;
          background:rgba(255,255,255,0.92);
          border:2.5px solid rgba(255,255,255,0.6);
          display:flex;flex-direction:column;align-items:center;justify-content:center;
          cursor:grab;gap:3px;
          transition:border-color 0.18s ease,box-shadow 0.18s ease,background 0.18s ease;
          animation:tileIn 0.35s ease both;
          box-shadow:0 3px 12px rgba(14,165,200,0.15);
          user-select:none;
          backdrop-filter:blur(6px);
        }
        .cove-tile:hover{
          background:#fff;
          border-color:${color};
          box-shadow:0 6px 20px rgba(14,165,200,0.35);
        }
        .cove-tile.selected{
          background:#fff;
          border-color:${color};
          box-shadow:0 0 0 3px ${color}55,0 6px 20px rgba(14,165,200,0.35);
        }
        .cove-tile.dragging{opacity:0.45;transform:scale(0.94);}
        .cove-tile-letter{
          font-family:'OpenDyslexic','Lexend',sans-serif;
          font-size:1.6rem;font-weight:800;color:#0A4A5E;line-height:1;
        }
        .cove-tile-sound{
          font-size:9px;font-weight:700;color:rgba(14,165,200,0.7);letter-spacing:0.06em;
        }

        /* ─ Hint ─ */
        .cove-hint{
          margin-top:16px;padding:12px 16px;
          background:rgba(255,255,255,0.88);
          border:1.5px solid rgba(255,255,255,0.6);
          border-radius:14px;width:100%;
          font-size:14px;font-weight:600;color:#0A4A5E;
          line-height:1.72;text-align:center;
          animation:fadeUp 0.3s ease both;backdrop-filter:blur(8px);
        }

        /* ─ Instructions ─ */
        .cove-instructions{
          margin-top:12px;padding:11px 16px;
          background:rgba(255,255,255,0.7);border-radius:12px;
          font-size:13px;font-weight:600;color:#0A7A97;
          text-align:center;animation:fadeUp 0.3s 0.2s ease both;
          backdrop-filter:blur(6px);
        }

        @media(max-width:500px){
          .cove-tile{width:50px;height:54px;}
          .cove-tile-letter{font-size:1.35rem;}
          .cove-badge{display:none;}
        }
      `}</style>

            {/* ─ Animated ocean background ─ */}
            <svg className="waves-bg" viewBox="0 0 1440 180" preserveAspectRatio="none">
                <path className="wave-path1"
                    d="M0,90 C360,140 720,40 1080,90 C1260,115 1380,65 1440,90 L1440,180 L0,180 Z"
                    fill="rgba(255,255,255,0.14)" />
                <path className="wave-path2"
                    d="M0,120 C240,70 600,150 960,110 C1200,80 1380,140 1440,120 L1440,180 L0,180 Z"
                    fill="rgba(255,255,255,0.09)" />
            </svg>

            <div className="cove-page">

                {/* ─ Top bar ─ */}
                <div className="cove-topbar">
                    <button className="cove-back" onClick={() => { cancel(); navigate('/dashboard'); }}>
                        ← Map
                    </button>
                    <div className="cove-badge">🏝️ Consonant Cove</div>
                    <div className="cove-prog-wrap">
                        <div className="cove-prog-lbl">{wordIdx + 1} of {words.length} words</div>
                        <div className="cove-prog-track">
                            <div className="cove-prog-fill" style={{ width: `${progressPct}%` }} />
                        </div>
                    </div>
                    <button className="cove-speak"
                        onClick={() => { cancel(); if (word) { setLeoMsg(word.leoIntro); say(word.leoIntro, 'instruction'); } }}>
                        🔊 {talking ? 'Speaking…' : 'Speak again'}
                    </button>
                </div>

                <div className="cove-main">

                    {/* ─ Leo + message ─ */}
                    <div className="cove-leo-strip">
                        <div style={{ animation: talking ? 'talkGlow 1.2s ease-in-out infinite' : 'none' }}>
                            <LeoTiger size={80} talking={talking} mood={leoMood} />
                        </div>
                        <div className="cove-leo-msg">{leoMsg}</div>
                    </div>

                    {/* ─ Word slots ─ */}
                    <div className="cove-word-area">
                        <div className="cove-word-label">
                            {wordDone ? `✨ ${word.word.toUpperCase()} ✨` : 'Drag letters into the empty slots'}
                        </div>

                        <div className="cove-slots">
                            {/* START slot */}
                            <Slot
                                label="Start" value={startSlot}
                                isOver={dragOver === 'start'} isWrong={startWrong} isRight={startRight}
                                color={color} colorPale={colorPale}
                                onClick={() => handleSlotClick('start')}
                                onDragOver={e => { e.preventDefault(); setDragOver('start'); }}
                                onDrop={handleDrop('start')}
                                onDragLeave={() => setDragOver(null)}
                            />

                            <div className="cove-plus">+</div>

                            {/* VOWEL (pre-filled) */}
                            <Slot
                                label="Vowel" value={word.vowel.toUpperCase()}
                                isVowel color={color} colorPale={colorPale}
                            />

                            <div className="cove-plus">+</div>

                            {/* END slot */}
                            <Slot
                                label="End" value={endSlot}
                                isOver={dragOver === 'end'} isWrong={endWrong} isRight={endRight}
                                color={color} colorPale={colorPale}
                                onClick={() => handleSlotClick('end')}
                                onDragOver={e => { e.preventDefault(); setDragOver('end'); }}
                                onDrop={handleDrop('end')}
                                onDragLeave={() => setDragOver(null)}
                            />
                        </div>

                        {/* Word picture + reveal on correct */}
                        {wordDone && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div className="cove-emoji-reveal">{word.emoji}</div>
                                <div className="cove-word-reveal">{word.word.toUpperCase()}</div>
                            </div>
                        )}
                    </div>

                    {/* ─ Consonant tiles ─ */}
                    {!wordDone && (
                        <div className="cove-tiles-section">
                            <div className="cove-tiles-label">
                                {selected
                                    ? `"${selected.toUpperCase()}" selected — now tap a slot above!`
                                    : 'Tap a letter to select it, then tap a slot — or drag it directly!'}
                            </div>
                            <div className="cove-tiles">
                                {tiles.map((letter, i) => (
                                    <div
                                        key={letter}
                                        className={[
                                            'cove-tile',
                                            selected === letter ? 'selected' : '',
                                            dragging === letter ? 'dragging' : '',
                                        ].join(' ')}
                                        style={{ animationDelay: `${i * 0.04}s` }}
                                        draggable
                                        onDragStart={() => handleDragStart(letter)}
                                        onDragEnd={handleDragEnd}
                                        onClick={() => handleTileClick(letter)}
                                        onMouseEnter={() => speakOnHover(letter, 'word')}
                                        onMouseLeave={cancelHover}
                                        onFocus={() => speakOnHover(letter, 'word')}
                                        onBlur={cancelHover}
                                        tabIndex={0}
                                        role="button"
                                        aria-label={`Letter ${letter}. ${selected === letter ? 'Selected. Now tap a slot.' : 'Tap to select.'}`}
                                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleTileClick(letter); } }}
                                    >
                                        <div className="cove-tile-letter">{letter.toUpperCase()}</div>
                                        <div className="cove-tile-sound">/{letter}/</div>
                                    </div>
                                ))}
                            </div>

                            {/* Instructions */}
                            <div className="cove-instructions">
                                {!startSlot && !endSlot && '👆 Pick a letter for the START slot first'}
                                {startSlot && !endSlot && `✅ Good! Now find the letter for the END slot`}
                                {!startSlot && endSlot && `✅ Good! Now find the letter for the START slot`}
                                {startSlot && endSlot && '🔍 Checking your word…'}
                            </div>

                            {/* Leo hint box after wrong attempt */}
                            {attempts > 0 && (
                                <div className="cove-hint">
                                    💡 {word.leoHint}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default ConsonantCove;