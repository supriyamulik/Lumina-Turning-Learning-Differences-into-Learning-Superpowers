// ============================================================
// FILE LOCATION: frontend/src/pages/activities/NumberModule.tsx
// ============================================================

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// ── Types ──────────────────────────────────────────────────
interface NumberData {
    n: number;                 // digit: 1–10
    word: string;              // "One"
    leoSpeak: string;          // SPOKEN aloud — clean, short
    leoDisplay: string;        // SHOWN in UI bubble
    emoji: string;             // quantity emoji e.g. "🍎🍎🍎"
    emojiItem: string;         // single item name e.g. "Apple"
    emojiItemPlural: string;   // plural e.g. "Apples"
    dailyItem: string;         // real-life connection e.g. "eyes on your face"
    dailyEmoji: string;        // e.g. "👀"
    dailySpeak: string;        // clean TTS version
    color: string;             // tile accent color
    mouthType: string;
    mouthTitle: string;
    mouthTip: string;
    mouthTipSpeak: string;
    steps: string[];
}
type Step = 1 | 2 | 3 | 4;
type FeedbackType = "success" | "mistake" | null;

// ── Quantity SVG — animated dots/items ──────────────────────
function QuantitySVG({ count, color }: { count: number; color: string }) {
    // Arrange dots in a friendly pattern
    const positions: [number, number][][] = [
        [],                                                            // 0 (unused)
        [[50, 50]],                                                    // 1
        [[30, 50], [70, 50]],                                         // 2
        [[50, 28], [28, 66], [72, 66]],                               // 3
        [[28, 28], [72, 28], [28, 72], [72, 72]],                     // 4
        [[50, 20], [20, 50], [80, 50], [35, 80], [65, 80]],           // 5
        [[25, 25], [75, 25], [25, 62], [75, 62], [50, 43], [50, 82]], // 6 — adjusted
        [[25, 20], [50, 20], [75, 20], [20, 55], [50, 55], [80, 55], [50, 85]],     // 7
        [[22, 22], [50, 22], [78, 22], [22, 55], [78, 55], [22, 88], [50, 88], [78, 88]], // 8
        [[25, 18], [50, 18], [75, 18], [20, 50], [50, 50], [80, 50], [25, 82], [50, 82], [75, 82]], // 9
        [[18, 18], [42, 18], [66, 18], [90, 18], [18, 50], [42, 50], [66, 50], [90, 50], [30, 82], [70, 82]], // 10
    ];

    const dots = positions[count] || [];
    const r = count <= 3 ? 14 : count <= 6 ? 11 : count <= 8 ? 9 : 8;

    return (
        <svg width="110" height="110" viewBox="0 0 110 110" style={{ display: "block" }}>
            {dots.map(([x, y], i) => (
                <circle
                    key={i}
                    cx={x} cy={y} r={r}
                    fill={color}
                    opacity="0.9"
                    style={{ animation: `nmDotPop 0.4s cubic-bezier(0.34,1.6,0.64,1) ${i * 0.07}s both` }}
                />
            ))}
        </svg>
    );
}

// ── SVG Mouth Illustrations (same as AlphabetModule) ────────
function MouthSVG({ type, size = 100 }: { type: string; size?: number }) {
    const s = size;
    const cx = s / 2, cy = s / 2;
    const mouths: Record<string, React.ReactElement> = {
        wide_open: (
            <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display: "block" }}>
                <ellipse cx={cx} cy={cy} rx={cx - 3} ry={cy - 3} fill="#FDDBB4" stroke="#22C55E" strokeWidth="2" />
                <ellipse cx={cx - 8} cy={cy - 10} rx={3} ry={2} fill="#D09070" opacity="0.5" />
                <ellipse cx={cx + 8} cy={cy - 10} rx={3} ry={2} fill="#D09070" opacity="0.5" />
                <ellipse cx={cx} cy={cy + 12} rx={cx - 12} ry={13} fill="#6B0F1A" />
                <rect x={cx - 16} y={cy + 2} width={32} height={7} rx="3" fill="white" />
                <rect x={cx - 14} y={cy + 16} width={28} height={6} rx="3" fill="#F0F0F0" />
                <ellipse cx={cx} cy={cy + 21} rx={13} ry={5} fill="#D94060" />
                <path d={`M ${cx - 18} ${cy + 2} Q ${cx - 6} ${cy - 6} ${cx} ${cy - 3} Q ${cx + 6} ${cy - 6} ${cx + 18} ${cy + 2}`} fill="#C85070" stroke="#A03050" strokeWidth="1" />
                <path d={`M ${cx - 18} ${cy + 22} Q ${cx} ${cy + 32} ${cx + 18} ${cy + 22}`} fill="#D96080" stroke="#A03050" strokeWidth="1" />
            </svg>
        ),
        rounded: (
            <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display: "block" }}>
                <ellipse cx={cx} cy={cy} rx={cx - 3} ry={cy - 3} fill="#FDDBB4" stroke="#22C55E" strokeWidth="2" />
                <ellipse cx={cx - 8} cy={cy - 10} rx={3} ry={2} fill="#D09070" opacity="0.5" />
                <ellipse cx={cx + 8} cy={cy - 10} rx={3} ry={2} fill="#D09070" opacity="0.5" />
                <ellipse cx={cx} cy={cy + 10} rx={11} ry={13} fill="#6B0F1A" />
                <ellipse cx={cx} cy={cy + 11} rx={8} ry={10} fill="#3D0008" />
                <ellipse cx={cx} cy={cy + 4} rx={14} ry={6} fill="#C85070" stroke="#A03050" strokeWidth="1" />
                <ellipse cx={cx} cy={cy + 18} rx={14} ry={6} fill="#D96080" stroke="#A03050" strokeWidth="1" />
            </svg>
        ),
        teeth_gap: (
            <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display: "block" }}>
                <ellipse cx={cx} cy={cy} rx={cx - 3} ry={cy - 3} fill="#FDDBB4" stroke="#22C55E" strokeWidth="2" />
                <ellipse cx={cx - 8} cy={cy - 10} rx={3} ry={2} fill="#D09070" opacity="0.5" />
                <ellipse cx={cx + 8} cy={cy - 10} rx={3} ry={2} fill="#D09070" opacity="0.5" />
                <path d={`M ${cx - 20} ${cy + 8} Q ${cx} ${cy + 4} ${cx + 20} ${cy + 8} Q ${cx + 20} ${cy + 17} ${cx} ${cy + 19} Q ${cx - 20} ${cy + 17} ${cx - 20} ${cy + 8}`} fill="#6B0F1A" />
                <rect x={cx - 18} y={cy + 4} width={36} height={7} rx="3" fill="white" />
                <rect x={cx - 16} y={cy + 13} width={32} height={5} rx="2.5" fill="#F0F0F0" />
                <rect x={cx - 18} y={cy + 10} width={36} height={3} fill="#3D0008" />
                <path d={`M ${cx - 22} ${cy + 4} Q ${cx - 8} ${cy - 4} ${cx} ${cy} Q ${cx + 8} ${cy - 4} ${cx + 22} ${cy + 4}`} fill="#C85070" stroke="#A03050" strokeWidth="1.5" />
                <path d={`M ${cx - 22} ${cy + 19} Q ${cx} ${cy + 27} ${cx + 22} ${cy + 19}`} fill="#D96080" stroke="#A03050" strokeWidth="1.5" />
            </svg>
        ),
        lips_together: (
            <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display: "block" }}>
                <ellipse cx={cx} cy={cy} rx={cx - 3} ry={cy - 3} fill="#FDDBB4" stroke="#22C55E" strokeWidth="2" />
                <ellipse cx={cx - 8} cy={cy - 10} rx={3} ry={2} fill="#D09070" opacity="0.5" />
                <ellipse cx={cx + 8} cy={cy - 10} rx={3} ry={2} fill="#D09070" opacity="0.5" />
                <path d={`M ${cx - 20} ${cy + 8} Q ${cx - 10} ${cy + 1} ${cx - 4} ${cy + 5} Q ${cx} ${cy + 2} ${cx + 4} ${cy + 5} Q ${cx + 10} ${cy + 1} ${cx + 20} ${cy + 8}`} fill="#C85070" stroke="#A03050" strokeWidth="1.5" />
                <path d={`M ${cx - 20} ${cy + 8} Q ${cx} ${cy + 20} ${cx + 20} ${cy + 8}`} fill="#D96080" stroke="#A03050" strokeWidth="1.5" />
                <line x1={cx - 20} y1={cy + 8} x2={cx + 20} y2={cy + 8} stroke="#8B2040" strokeWidth="2" />
            </svg>
        ),
        tongue_up: (
            <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display: "block" }}>
                <ellipse cx={cx} cy={cy} rx={cx - 3} ry={cy - 3} fill="#FDDBB4" stroke="#22C55E" strokeWidth="2" />
                <ellipse cx={cx - 8} cy={cy - 10} rx={3} ry={2} fill="#D09070" opacity="0.5" />
                <ellipse cx={cx + 8} cy={cy - 10} rx={3} ry={2} fill="#D09070" opacity="0.5" />
                <ellipse cx={cx} cy={cy + 13} rx={cx - 14} ry={13} fill="#6B0F1A" />
                <rect x={cx - 17} y={cy + 2} width={34} height={7} rx="3" fill="white" />
                <path d={`M ${cx - 12} ${cy + 23} Q ${cx - 8} ${cy + 14} ${cx - 2} ${cy + 6} Q ${cx + 2} ${cy + 2} ${cx + 6} ${cy + 6} Q ${cx + 10} ${cy + 14} ${cx + 12} ${cy + 23} Z`} fill="#D94060" />
                <path d={`M ${cx - 18} ${cy + 2} Q ${cx - 6} ${cy - 5} ${cx} ${cy - 2} Q ${cx + 6} ${cy - 5} ${cx + 18} ${cy + 2}`} fill="#C85070" stroke="#A03050" strokeWidth="1.5" />
                <path d={`M ${cx - 18} ${cy + 23} Q ${cx} ${cy + 31} ${cx + 18} ${cy + 23}`} fill="#D96080" stroke="#A03050" strokeWidth="1.5" />
            </svg>
        ),
        relaxed: (
            <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display: "block" }}>
                <ellipse cx={cx} cy={cy} rx={cx - 3} ry={cy - 3} fill="#FDDBB4" stroke="#22C55E" strokeWidth="2" />
                <ellipse cx={cx - 8} cy={cy - 10} rx={3} ry={2} fill="#D09070" opacity="0.5" />
                <ellipse cx={cx + 8} cy={cy - 10} rx={3} ry={2} fill="#D09070" opacity="0.5" />
                <ellipse cx={cx} cy={cy + 12} rx={cx - 16} ry={10} fill="#6B0F1A" />
                <ellipse cx={cx} cy={cy + 18} rx={14} ry={5} fill="#D94060" />
                <path d={`M ${cx - 18} ${cy + 4} Q ${cx - 6} ${cy - 2} ${cx} ${cy + 1} Q ${cx + 6} ${cy - 2} ${cx + 18} ${cy + 4}`} fill="#C85070" stroke="#A03050" strokeWidth="1.5" />
                <path d={`M ${cx - 18} ${cy + 20} Q ${cx} ${cy + 28} ${cx + 18} ${cy + 20}`} fill="#D96080" stroke="#A03050" strokeWidth="1.5" />
            </svg>
        ),
    };
    return mouths[type] || mouths["relaxed"];
}

// ── Number Data ────────────────────────────────────────────
const NUMBERS: NumberData[] = [
    {
        n: 1, word: "One",
        leoSpeak: "One.  One.  One apple.",
        leoDisplay: "1 — One 🍎",
        emoji: "🍎", emojiItem: "Apple", emojiItemPlural: "Apple",
        dailyItem: "1 sun in the sky", dailyEmoji: "☀️",
        dailySpeak: "There is one sun in the sky!",
        color: "#EF4444",
        mouthType: "wide_open", mouthTitle: "Say — One",
        mouthTip: "Start with a W shape. Round lips, then open wide: wuh-un.",
        mouthTipSpeak: "Start with a W shape. Round lips, then open wide. Say wuh-un.",
        steps: ["Round lips like a W 💋", "Open mouth for the un sound 👄", "Say One — wuh-un! ☀️"],
    },
    {
        n: 2, word: "Two",
        leoSpeak: "Two.  Two.  Two eyes.",
        leoDisplay: "2 — Two 👀",
        emoji: "👀", emojiItem: "Eye", emojiItemPlural: "Eyes",
        dailyItem: "2 eyes on your face", dailyEmoji: "👀",
        dailySpeak: "You have two eyes on your face!",
        color: "#F97316",
        mouthType: "rounded", mouthTitle: "Say — Two",
        mouthTip: "Round your lips tight like you're whistling. Say tooo.",
        mouthTipSpeak: "Round your lips tight like you are whistling. Say tooo.",
        steps: ["Round lips into a tight circle 💋", "Say tooo — hold it! 🎵", "Two! Like whistling! 😙"],
    },
    {
        n: 3, word: "Three",
        leoSpeak: "Three.  Three.  Three wheels on a tricycle.",
        leoDisplay: "3 — Three 🛺",
        emoji: "🛺", emojiItem: "Wheel", emojiItemPlural: "Wheels",
        dailyItem: "3 wheels on a tricycle", dailyEmoji: "🛺",
        dailySpeak: "A tricycle has three wheels!",
        color: "#EAB308",
        mouthType: "teeth_gap", mouthTitle: "Say — Three",
        mouthTip: "Tongue tip between teeth for th, then pull back and say ree.",
        mouthTipSpeak: "Put tongue tip between teeth for th, then pull back and say ree.",
        steps: ["Tongue tip between teeth 👅", "Blow air — th! 💨", "Pull back and say ree — Three! 🛺"],
    },
    {
        n: 4, word: "Four",
        leoSpeak: "Four.  Four.  Four wheels on a car.",
        leoDisplay: "4 — Four 🚗",
        emoji: "🚗", emojiItem: "Wheel", emojiItemPlural: "Wheels",
        dailyItem: "4 wheels on a car", dailyEmoji: "🚗",
        dailySpeak: "A car has four wheels!",
        color: "#22C55E",
        mouthType: "relaxed", mouthTitle: "Say — Four",
        mouthTip: "Open mouth relaxed. Say faw — like a yawn but shorter.",
        mouthTipSpeak: "Open mouth in a relaxed way. Say faw, like a short yawn.",
        steps: ["Relax your mouth 😌", "Say faw — short yawn sound 😮", "Four! Like a car vroom! 🚗"],
    },
    {
        n: 5, word: "Five",
        leoSpeak: "Five.  Five.  Five fingers on your hand.",
        leoDisplay: "5 — Five 🖐️",
        emoji: "🖐️", emojiItem: "Finger", emojiItemPlural: "Fingers",
        dailyItem: "5 fingers on your hand", dailyEmoji: "🖐️",
        dailySpeak: "You have five fingers on your hand!",
        color: "#06B6D4",
        mouthType: "lips_together", mouthTitle: "Say — Five",
        mouthTip: "Top teeth touch bottom lip for F, then open for ive.",
        mouthTipSpeak: "Top teeth touch bottom lip for F, then open wide for ive.",
        steps: ["Top teeth on bottom lip 😬", "Blow air — fuh! 💨", "Open and say ive — Five! 🖐️"],
    },
    {
        n: 6, word: "Six",
        leoSpeak: "Six.  Six.  Six legs on an insect.",
        leoDisplay: "6 — Six 🐛",
        emoji: "🐛", emojiItem: "Leg", emojiItemPlural: "Legs",
        dailyItem: "6 legs on an insect", dailyEmoji: "🐛",
        dailySpeak: "An insect has six legs!",
        color: "#8B5CF6",
        mouthType: "teeth_gap", mouthTitle: "Say — Six",
        mouthTip: "S sound first — hiss, then short icks. Mouth slightly open.",
        mouthTipSpeak: "Make the S sound first like a hiss, then say icks. Six!",
        steps: ["Teeth nearly together 😬", "Hiss — sss! 🐍", "Then icks — Six! 🐛"],
    },
    {
        n: 7, word: "Seven",
        leoSpeak: "Seven.  Seven.  Seven days in a week.",
        leoDisplay: "7 — Seven 📅",
        emoji: "📅", emojiItem: "Day", emojiItemPlural: "Days",
        dailyItem: "7 days in a week", dailyEmoji: "📅",
        dailySpeak: "There are seven days in a week!",
        color: "#EC4899",
        mouthType: "tongue_up", mouthTitle: "Say — Seven",
        mouthTip: "Seh-ven. Two syllables. First open — seh, then close teeth — ven.",
        mouthTipSpeak: "Say it in two parts. Seh, then ven. Seh-ven. Seven!",
        steps: ["Open mouth — say seh 👄", "Then close for ven 😬", "Seh-ven! Seven! 📅"],
    },
    {
        n: 8, word: "Eight",
        leoSpeak: "Eight.  Eight.  Eight legs on a spider.",
        leoDisplay: "8 — Eight 🕷️",
        emoji: "🕷️", emojiItem: "Leg", emojiItemPlural: "Legs",
        dailyItem: "8 legs on a spider", dailyEmoji: "🕷️",
        dailySpeak: "A spider has eight legs!",
        color: "#14B8A6",
        mouthType: "wide_open", mouthTitle: "Say — Eight",
        mouthTip: "Say ay like the letter A, then add t. Ay-t. Eight!",
        mouthTipSpeak: "Say ay like the letter A, then add t at the end. Ay-t. Eight!",
        steps: ["Open mouth — say ay 👄", "Tongue tip up — add t 👅", "Ay-t! Eight! 🕷️"],
    },
    {
        n: 9, word: "Nine",
        leoSpeak: "Nine.  Nine.  Nine planets in space.",
        leoDisplay: "9 — Nine 🪐",
        emoji: "🪐", emojiItem: "Planet", emojiItemPlural: "Planets",
        dailyItem: "9 planets in space", dailyEmoji: "🪐",
        dailySpeak: "There are nine planets in space!",
        color: "#F59E0B",
        mouthType: "wide_open", mouthTitle: "Say — Nine",
        mouthTip: "N sound first — tongue to ridge, then open wide — ine. Nyne!",
        mouthTipSpeak: "N sound first with tongue to ridge, then open wide and say ine. Nine!",
        steps: ["Tongue to ridge — nnn 👅", "Open wide — ine! 👄", "Nine! Like a rhyme! 🪐"],
    },
    {
        n: 10, word: "Ten",
        leoSpeak: "Ten.  Ten.  Ten fingers on two hands.",
        leoDisplay: "10 — Ten 🙌",
        emoji: "🙌", emojiItem: "Finger", emojiItemPlural: "Fingers",
        dailyItem: "10 fingers on two hands", dailyEmoji: "🙌",
        dailySpeak: "You have ten fingers on two hands!",
        color: "#6366F1",
        mouthType: "tongue_up", mouthTitle: "Say — Ten",
        mouthTip: "T sound — tongue tap, then open for en. T-en. Ten!",
        mouthTipSpeak: "Tap tongue for T, then open for en. T-en. Ten!",
        steps: ["Tongue tap — tuh! 👅", "Open for en 👄", "T-en! Ten! 🙌"],
    },
];

// ── Speech helper ──────────────────────────────────────────
function doSpeak(text: string, onStart?: () => void, onEnd?: () => void) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.65;
    u.pitch = 1.05;
    u.volume = 1;
    if (onStart) u.onstart = onStart;
    if (onEnd) u.onend = onEnd;
    window.speechSynthesis.speak(u);
}

// ══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════
export default function NumberModule() {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>(1);
    const [current, setCurrent] = useState<NumberData | null>(null);
    const [mastered, setMastered] = useState<Set<number>>(new Set());
    const [feedback, setFeedback] = useState<FeedbackType>(null);
    const [leoText, setLeoText] = useState("Tap any number to learn it! 🌟");
    const [leoTalking, setLeoTalking] = useState(false);
    const [recording, setRecording] = useState(false);
    const [micProgress, setMicProgress] = useState(0);
    const [soundPlaying, setSoundPlaying] = useState(false);
    const [showDaily, setShowDaily] = useState(false);

    const micIntervalRef = useRef<number | null>(null);
    const recognitionRef = useRef<any>(null);
    const resultReceivedRef = useRef(false);

    const sayLeo = (displayText: string, spokenText: string) => {
        setLeoText(displayText);
        doSpeak(spokenText, () => setLeoTalking(true), () => setLeoTalking(false));
    };

    const replayCurrent = () => {
        if (current) sayLeo(current.leoDisplay, current.leoSpeak);
        else sayLeo("Tap any number to learn it! 🌟", "Tap any number to learn it!");
    };

    // ── Step 1 → 2 ──────────────────────────────────────────
    const selectNumber = (item: NumberData) => {
        window.speechSynthesis.cancel();
        setCurrent(item);
        setFeedback(null);
        setShowDaily(false);
        resultReceivedRef.current = false;
        setStep(2);
        setSoundPlaying(true);
        setTimeout(() => {
            sayLeo(item.leoDisplay, item.leoSpeak);
            setTimeout(() => setSoundPlaying(false), 3500);
        }, 200);
    };

    // ── Step 2 → 3 ──────────────────────────────────────────
    const goToMic = () => {
        if (!current) return;
        setStep(3);
        setMicProgress(0);
        setRecording(false);
        resultReceivedRef.current = false;
        setFeedback(null);
        sayLeo(
            `Your turn! Say: ${current.word} 🎙️`,
            `Your turn! Say ${current.word}!`
        );
    };

    // ── Recording ───────────────────────────────────────────
    const startRec = () => {
        if (!current || recording) return;
        setRecording(true);
        setMicProgress(0);
        resultReceivedRef.current = false;
        window.speechSynthesis.cancel();

        let pct = 0;
        micIntervalRef.current = window.setInterval(() => {
            pct = Math.min(pct + 2, 100);
            setMicProgress(pct);
            if (pct >= 100) {
                clearInterval(micIntervalRef.current!);
                if (!resultReceivedRef.current) {
                    resultReceivedRef.current = true;
                    doFallback();
                }
            }
        }, 80);

        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SR) {
            try {
                const rec = new SR();
                rec.lang = "en-US";
                rec.continuous = false;
                rec.interimResults = false;
                rec.maxAlternatives = 5;

                rec.onresult = (e: any) => {
                    if (resultReceivedRef.current) return;
                    resultReceivedRef.current = true;
                    clearInterval(micIntervalRef.current!);
                    setMicProgress(100);
                    const alts: string[] = [];
                    for (let i = 0; i < e.results[0].length; i++) {
                        alts.push(e.results[0][i].transcript.toLowerCase().trim());
                    }
                    evalSpeech(alts);
                };

                rec.onerror = () => {
                    if (resultReceivedRef.current) return;
                    resultReceivedRef.current = true;
                    clearInterval(micIntervalRef.current!);
                    showMistake();
                };

                rec.onend = () => {
                    setTimeout(() => {
                        if (!resultReceivedRef.current) {
                            resultReceivedRef.current = true;
                            doFallback();
                        }
                    }, 500);
                };

                rec.start();
                recognitionRef.current = rec;
            } catch {
                setTimeout(() => {
                    if (!resultReceivedRef.current) {
                        resultReceivedRef.current = true;
                        doFallback();
                    }
                }, 3000);
            }
        } else {
            setTimeout(() => {
                if (!resultReceivedRef.current) {
                    resultReceivedRef.current = true;
                    showSuccess();
                }
            }, 3000);
        }
    };

    const handleStopRec = () => {
        setRecording(false);
        clearInterval(micIntervalRef.current!);
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (_) { }
            recognitionRef.current = null;
        }
    };

    const doFallback = () => { Math.random() > 0.4 ? showSuccess() : showMistake(); };

    const evalSpeech = (alternatives: string[]) => {
        if (!current) return;
        const word = current.word.toLowerCase();
        const digit = current.n.toString();
        // also accept number words that sound similar (e.g. "to" for "two", "for" for "four")
        const soundAlikes: Record<string, string[]> = {
            one: ["won", "wan"], two: ["to", "too", "tu"],
            three: ["tree", "free"], four: ["for", "fore", "far"],
            five: ["fife", "hive"], six: ["sicks", "sex"],
            seven: ["sevin"], eight: ["ate", "ait"],
            nine: ["nein", "nyne"], ten: ["tin", "tan"],
        };
        const extras = soundAlikes[word] || [];
        const matched = alternatives.some(said =>
            said.includes(word) ||
            said.includes(digit) ||
            extras.some(e => said.includes(e))
        );
        matched ? showSuccess() : showMistake();
    };

    const showSuccess = () => {
        if (!current) return;
        setMastered(prev => new Set([...prev, current.n]));
        setFeedback("success");
        setStep(4);
        setRecording(false);
        sayLeo(
            `⭐ Amazing! ${current.n} is ${current.word}!`,
            `Amazing! ${current.n} is ${current.word}. ${current.dailySpeak} You are a star!`
        );
    };

    const showMistake = () => {
        if (!current) return;
        setFeedback("mistake");
        setStep(4);
        setRecording(false);
        sayLeo(
            `Almost! Watch the mouth for "${current.word}" 👄`,
            `Almost there! ${current.mouthTipSpeak}`
        );
    };

    useEffect(() => {
        setTimeout(() => sayLeo("Tap any number to learn it! 🌟", "Tap any number to learn it!"), 600);
    }, []);

    const masteredCount = mastered.size;
    const progPct = (masteredCount / 10) * 100;

    // number → pastel tile colors
    const tileGradients = [
        "linear-gradient(135deg,#FEE2E2,#FECACA)", // 1 red
        "linear-gradient(135deg,#FFEDD5,#FED7AA)", // 2 orange
        "linear-gradient(135deg,#FEF9C3,#FEF08A)", // 3 yellow
        "linear-gradient(135deg,#DCFCE7,#BBF7D0)", // 4 green
        "linear-gradient(135deg,#CFFAFE,#A5F3FC)", // 5 cyan
        "linear-gradient(135deg,#EDE9FE,#DDD6FE)", // 6 violet
        "linear-gradient(135deg,#FCE7F3,#FBCFE8)", // 7 pink
        "linear-gradient(135deg,#CCFBF1,#99F6E4)", // 8 teal
        "linear-gradient(135deg,#FEF3C7,#FDE68A)", // 9 amber
        "linear-gradient(135deg,#E0E7FF,#C7D2FE)", // 10 indigo
    ];

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,ital,wght@9..144,1,700;9..144,0,900&family=Lexend:wght@400;600;700;800&display=swap');

        @keyframes nmDotPop {
          from { opacity:0; transform:scale(0); }
          to   { opacity:0.9; transform:scale(1); }
        }
        @keyframes nmSunP  { 0%,100%{box-shadow:0 0 0 12px rgba(34,197,94,.12)}50%{box-shadow:0 0 0 22px rgba(34,197,94,.2)} }
        @keyframes nmCD    { 0%,100%{transform:translateX(0)}50%{transform:translateX(16px)} }
        @keyframes nmLP    { 0%,100%{transform:scale(1)}50%{transform:scale(1.12)} }
        @keyframes nmSP    { 0%,100%{box-shadow:0 2px 8px rgba(34,197,94,.4)}50%{box-shadow:0 2px 18px rgba(34,197,94,.7)} }
        @keyframes nmW     { 0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.9)} }
        @keyframes nmRec   { 0%,100%{box-shadow:0 6px 22px rgba(220,38,38,.5),0 0 0 0 rgba(220,38,38,.4)}50%{box-shadow:0 6px 22px rgba(220,38,38,.5),0 0 0 14px rgba(220,38,38,0)} }
        @keyframes nmZI    { from{opacity:0;transform:scale(0.2) rotate(-12deg)}to{opacity:1;transform:scale(1) rotate(0)} }
        @keyframes nmSB    { from{opacity:0;transform:scale(0)}to{opacity:1;transform:scale(1)} }
        @keyframes nmGlow  { 0%,100%{box-shadow:0 6px 18px rgba(34,197,94,.4),0 0 0 0 rgba(34,197,94,.3)}50%{box-shadow:0 10px 26px rgba(34,197,94,.5),0 0 0 10px rgba(34,197,94,0)} }
        @keyframes nmSlide { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
        @keyframes nmTilePop { from{opacity:0;transform:scale(0.7) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)} }

        .nm-app{min-height:100vh;background:linear-gradient(180deg,#A8D8A8 0%,#B8E4B8 15%,#C8EAC8 30%,#D4EFD4 55%,#CEEBD8 80%,#A8D4A0 100%);font-family:'Lexend',sans-serif;position:relative;overflow-x:hidden;}
        .nm-sun{position:fixed;top:3%;right:4%;width:60px;height:60px;background:radial-gradient(circle at 42% 42%,#A7F3D0,#34D399);border-radius:50%;box-shadow:0 0 0 12px rgba(34,197,94,.12),0 0 0 24px rgba(34,197,94,.06);animation:nmSunP 4s ease-in-out infinite;pointer-events:none;z-index:1;}
        .nm-cloud{position:fixed;background:rgba(255,255,255,.9);border-radius:60px;pointer-events:none;z-index:1;}
        .nm-cloud::before,.nm-cloud::after{content:'';position:absolute;background:rgba(255,255,255,.9);border-radius:50%;}
        .nm-c1{width:120px;height:38px;top:5%;left:3%;animation:nmCD 20s ease-in-out infinite;}
        .nm-c1::before{width:64px;height:58px;top:-26px;left:16px;}.nm-c1::after{width:52px;height:46px;top:-20px;left:54px;}
        .nm-c2{width:90px;height:28px;top:8%;left:38%;animation:nmCD 28s ease-in-out infinite reverse;}
        .nm-c2::before{width:48px;height:44px;top:-20px;left:12px;}.nm-c2::after{width:38px;height:34px;top:-14px;left:38px;}

        .nm-back{position:fixed;top:14px;left:14px;z-index:200;background:rgba(255,255,255,.82);backdrop-filter:blur(10px);border:1.5px solid rgba(255,255,255,.95);border-radius:100px;padding:7px 16px;font-family:'Lexend',sans-serif;font-size:12px;font-weight:700;color:#14532D;cursor:pointer;transition:all .2s;}
        .nm-back:hover{background:white;transform:translateX(-2px);}

        .nm-main{position:relative;z-index:2;max-width:960px;margin:0 auto;padding:20px 16px 80px;}
        .nm-topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;padding-top:10px;}
        .nm-title{font-family:'Fraunces',serif;font-size:clamp(20px,3.5vw,28px);font-weight:900;color:#14532D;}
        .nm-title span{color:#16A34A;font-style:italic;}

        .nm-prog-wrap{display:flex;align-items:center;gap:10px;}
        .nm-prog-lbl{font-size:12px;font-weight:700;color:#166534;}
        .nm-prog-bar{width:100px;height:7px;background:rgba(255,255,255,.5);border-radius:100px;overflow:hidden;}
        .nm-prog-fill{height:100%;background:linear-gradient(90deg,#16A34A,#4ADE80);border-radius:100px;transition:width .6s ease;}

        .nm-mastery{background:rgba(255,255,255,.65);backdrop-filter:blur(10px);border:1.5px solid rgba(255,255,255,.9);border-radius:14px;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:14px;box-shadow:0 2px 12px rgba(0,0,0,.06);}
        .nm-mastery-n{font-family:'Fraunces',serif;font-size:22px;font-weight:900;color:#14532D;}
        .nm-mastery-lbl{font-size:11px;font-weight:700;color:#166534;}
        .nm-dots{display:flex;flex-wrap:wrap;gap:5px;margin-top:3px;}
        .nm-dot{width:9px;height:9px;border-radius:50%;background:rgba(0,0,0,.12);}
        .nm-dot-done{background:#22C55E;}

        .nm-leo{background:rgba(255,255,255,.72);backdrop-filter:blur(12px);border:1.5px solid rgba(255,255,255,.9);border-radius:18px;padding:11px 16px;display:flex;align-items:center;gap:12px;margin-bottom:14px;box-shadow:0 3px 14px rgba(0,0,0,.07);}
        .nm-leo-face{width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#4ADE80,#16A34A);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;box-shadow:0 3px 10px rgba(34,197,94,.35);border:2px solid rgba(255,255,255,.8);}
        .nm-leo-face.talking{animation:nmLP .5s ease-in-out infinite;}
        .nm-leo-txt{font-size:13px;font-weight:600;color:#14532D;line-height:1.6;flex:1;}
        .nm-replay{background:rgba(34,197,94,.15);border:1.5px solid rgba(34,197,94,.3);border-radius:100px;padding:5px 12px;font-size:11px;font-weight:800;color:#166534;cursor:pointer;white-space:nowrap;font-family:'Lexend',sans-serif;}

        .nm-steps{display:flex;align-items:center;margin-bottom:16px;background:rgba(255,255,255,.6);backdrop-filter:blur(8px);border:1.5px solid rgba(255,255,255,.9);border-radius:14px;padding:9px 14px;box-shadow:0 2px 10px rgba(0,0,0,.06);}
        .nm-step{display:flex;align-items:center;gap:6px;flex:1;}
        .nm-sdot{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0;transition:all .3s;}
        .nm-sdot-done{background:#22C55E;color:white;}
        .nm-sdot-active{background:linear-gradient(135deg,#16A34A,#4ADE80);color:white;animation:nmSP 2s ease-in-out infinite;}
        .nm-sdot-pending{background:rgba(255,255,255,.5);color:#9CA3AF;border:1.5px solid rgba(0,0,0,.1);}
        .nm-slbl{font-size:10.5px;font-weight:700;color:#166534;}
        .nm-slbl-active{color:#14532D;}
        .nm-slbl-pending{color:#9CA3AF;}
        .nm-sdiv{width:20px;height:2px;background:rgba(0,0,0,.1);border-radius:2px;flex-shrink:0;}

        /* ── STEP 1: GRID ── */
        .nm-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:12px;background:rgba(255,255,255,.65);backdrop-filter:blur(10px);border:1.5px solid rgba(255,255,255,.9);border-radius:22px;padding:20px;box-shadow:0 4px 22px rgba(0,0,0,.08);}
        .nm-tile{border-radius:18px;padding:14px 8px;text-align:center;cursor:pointer;transition:all .22s cubic-bezier(.34,1.4,.64,1);border:2.5px solid transparent;position:relative;animation:nmTilePop .5s cubic-bezier(.34,1.4,.64,1) both;}
        .nm-tile:hover{transform:scale(1.12) translateY(-4px);box-shadow:0 10px 24px rgba(0,0,0,.15);}
        .nm-tile-mastered{box-shadow:0 0 0 3px rgba(34,197,94,.4);}
        .nm-tile-check{position:absolute;top:-6px;right:-6px;width:18px;height:18px;background:#22C55E;border-radius:50%;font-size:10px;color:white;display:flex;align-items:center;justify-content:center;font-weight:800;line-height:1;}
        .nm-tnum{font-family:'Fraunces',serif;font-size:32px;font-weight:900;line-height:1;color:#14532D;}
        .nm-tword{font-size:11px;font-weight:700;color:#4B5563;margin-top:2px;}
        .nm-temoji{font-size:16px;margin-top:3px;}

        /* ── STEP 2: ZOOM ── */
        .nm-zoom-stage{background:rgba(255,255,255,.78);backdrop-filter:blur(14px);border:2px solid rgba(255,255,255,.95);border-radius:26px;padding:28px 20px;box-shadow:0 6px 30px rgba(0,0,0,.1);text-align:center;}
        .nm-zoom-num{font-family:'Fraunces',serif;font-weight:900;line-height:1;animation:nmZI .55s cubic-bezier(.34,1.4,.64,1) both;}
        .nm-zoom-word{font-family:'Fraunces',serif;font-size:clamp(28px,5vw,42px);font-weight:900;color:#14532D;margin:6px 0 4px;animation:nmZI .55s cubic-bezier(.34,1.4,.64,1) .1s both;}
        .nm-zoom-qty{display:flex;flex-direction:column;align-items:center;gap:8px;margin:16px 0;}
        .nm-qty-label{font-size:13px;font-weight:700;color:#166534;background:rgba(34,197,94,.1);border:1.5px solid rgba(34,197,94,.25);border-radius:100px;padding:5px 16px;}
        .nm-wave{display:flex;align-items:center;justify-content:center;gap:4px;height:28px;margin:8px auto;}
        .nm-wbar{width:4px;border-radius:100px;background:linear-gradient(180deg,#16A34A,#4ADE80);animation:nmW 1s ease-in-out infinite;}
        .nm-wbar:nth-child(1){height:7px;}.nm-wbar:nth-child(2){height:14px;animation-delay:.1s;}.nm-wbar:nth-child(3){height:22px;animation-delay:.2s;}.nm-wbar:nth-child(4){height:14px;animation-delay:.3s;}.nm-wbar:nth-child(5){height:7px;animation-delay:.4s;}

        /* ── Daily routine card ── */
        .nm-daily-btn{background:rgba(34,197,94,.12);border:1.5px solid rgba(34,197,94,.3);border-radius:14px;padding:9px 18px;font-family:'Lexend',sans-serif;font-size:13px;font-weight:700;color:#166534;cursor:pointer;margin:12px auto 0;display:block;transition:all .2s;}
        .nm-daily-btn:hover{background:rgba(34,197,94,.22);}
        .nm-daily-card{background:linear-gradient(135deg,rgba(220,252,231,.9),rgba(187,247,208,.8));border:2px solid rgba(34,197,94,.3);border-radius:16px;padding:16px;margin:12px 0;animation:nmSlide .4s ease both;}
        .nm-daily-row{display:flex;align-items:center;gap:12px;}
        .nm-daily-big{font-size:44px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.15));}
        .nm-daily-txt{font-size:14px;font-weight:700;color:#14532D;line-height:1.5;}
        .nm-daily-sub{font-size:12px;font-weight:500;color:#166534;margin-top:3px;}

        /* ── STEP 3: MIC ── */
        .nm-mic-panel{text-align:center;background:rgba(255,255,255,.65);backdrop-filter:blur(10px);border:1.5px solid rgba(255,255,255,.9);border-radius:24px;padding:28px 20px;box-shadow:0 4px 22px rgba(0,0,0,.08);}
        .nm-mic-num{font-family:'Fraunces',serif;font-size:80px;font-weight:900;color:#14532D;margin-bottom:2px;line-height:1;}
        .nm-mic-word{font-family:'Fraunces',serif;font-size:28px;font-weight:900;margin-bottom:6px;}
        .nm-mic-qty{display:flex;justify-content:center;margin:8px 0 14px;}
        .nm-mic-hint{font-size:14px;font-weight:700;color:#166534;background:rgba(255,255,255,.7);border-radius:12px;padding:10px 20px;display:inline-block;margin-bottom:22px;border:1.5px solid rgba(0,0,0,.06);}
        .nm-mic-btn{width:84px;height:84px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:34px;background:linear-gradient(135deg,#16A34A,#4ADE80);box-shadow:0 6px 22px rgba(34,197,94,.5);color:white;transition:all .2s;position:relative;margin:0 auto 12px;}
        .nm-mic-btn:hover{transform:scale(1.08);}
        .nm-mic-btn.rec{background:linear-gradient(135deg,#DC2626,#B91C1C);animation:nmRec 1s ease-in-out infinite;}
        .nm-mic-status{font-size:13px;font-weight:700;color:#6B7280;margin-bottom:12px;}
        .nm-mic-status.rec{color:#DC2626;}
        .nm-mic-prog{width:180px;height:6px;background:rgba(0,0,0,.08);border-radius:100px;overflow:hidden;margin:0 auto;}
        .nm-mic-pfill{height:100%;background:linear-gradient(90deg,#16A34A,#4ADE80);border-radius:100px;transition:width .1s linear;}

        /* ── STEP 4A: SUCCESS ── */
        .nm-success{text-align:center;background:rgba(255,255,255,.78);backdrop-filter:blur(12px);border:2px solid rgba(255,255,255,.95);border-radius:26px;padding:28px 20px;box-shadow:0 6px 30px rgba(0,0,0,.1);}
        .nm-star-burst{font-size:52px;margin-bottom:6px;animation:nmSB .6s cubic-bezier(.34,1.6,.64,1) both;}
        .nm-s-title{font-family:'Fraunces',serif;font-size:28px;font-weight:900;color:#14532D;margin-bottom:4px;}
        .nm-s-sub{font-size:14px;font-weight:600;color:#166534;margin-bottom:10px;}
        .nm-daily-success{background:linear-gradient(135deg,rgba(220,252,231,.9),rgba(187,247,208,.8));border:2px solid rgba(34,197,94,.3);border-radius:16px;padding:14px 20px;margin:12px 0 18px;display:flex;align-items:center;gap:14px;}
        .nm-coins{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#DCFCE7,#BBF7D0);border:1.5px solid #86EFAC;border-radius:100px;padding:7px 18px;font-size:14px;font-weight:800;color:#14532D;margin-bottom:20px;}
        .nm-next-btn{background:linear-gradient(135deg,#22C55E,#16A34A);color:white;border:none;border-radius:16px;padding:15px 44px;font-family:'Lexend',sans-serif;font-size:16px;font-weight:800;cursor:pointer;animation:nmGlow 2s ease-in-out infinite;}

        /* ── STEP 4B: MISTAKE ── */
        .nm-mistake{text-align:center;}
        .nm-enc{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.7);border-radius:14px;padding:10px 14px;margin-bottom:14px;}
        .nm-enc-leo{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#4ADE80,#16A34A);display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;}
        .nm-enc-txt{font-size:13px;font-weight:600;color:#14532D;line-height:1.5;text-align:left;}
        .nm-mouth-card{background:rgba(255,255,255,.88);backdrop-filter:blur(12px);border:2px solid rgba(34,197,94,.25);border-radius:22px;padding:22px;margin-bottom:14px;box-shadow:0 4px 22px rgba(0,0,0,.1);}
        .nm-mouth-svg{display:flex;justify-content:center;margin-bottom:10px;}
        .nm-mouth-title{font-family:'Fraunces',serif;font-size:18px;font-weight:800;color:#14532D;margin-bottom:6px;}
        .nm-mouth-tip{font-size:13px;font-weight:600;color:#4B5563;line-height:1.7;background:rgba(220,252,231,.6);border-radius:10px;padding:9px 14px;margin:8px 0;}
        .nm-step-list{display:flex;flex-direction:column;gap:8px;text-align:left;margin-top:10px;}
        .nm-step-row{display:flex;align-items:flex-start;gap:9px;font-size:13px;font-weight:600;color:#374151;}
        .nm-step-n{width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#16A34A,#4ADE80);color:white;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;}
        .nm-try-btn{background:linear-gradient(135deg,#16A34A,#4ADE80);color:white;border:none;border-radius:14px;padding:13px 36px;font-family:'Lexend',sans-serif;font-size:14px;font-weight:800;cursor:pointer;box-shadow:0 4px 14px rgba(34,197,94,.4);}

        /* ── NAV ── */
        .nm-nav{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:14px;flex-wrap:wrap;}
        .nm-nbtn{background:rgba(255,255,255,.8);border:1.5px solid rgba(0,0,0,.1);border-radius:100px;padding:8px 18px;font-family:'Lexend',sans-serif;font-size:12px;font-weight:700;color:#14532D;cursor:pointer;transition:all .2s;}
        .nm-nbtn:hover{background:white;box-shadow:0 3px 10px rgba(0,0,0,.1);}
        .nm-nbtn-primary{background:linear-gradient(135deg,#16A34A,#4ADE80);color:white;border-color:transparent;box-shadow:0 4px 12px rgba(34,197,94,.4);}
        .nm-nbtn-primary:hover{transform:translateY(-1px);box-shadow:0 7px 18px rgba(34,197,94,.5);}
      `}</style>

            <div className="nm-app">
                <div className="nm-sun" />
                <div className="nm-cloud nm-c1" />
                <div className="nm-cloud nm-c2" />
                <button className="nm-back" onClick={() => navigate("/learningmodule")}>← Learning Cove</button>

                <div className="nm-main">
                    {/* Top bar */}
                    <div className="nm-topbar">
                        <h1 className="nm-title">Numbers <span>Module</span></h1>
                        <div className="nm-prog-wrap">
                            <span className="nm-prog-lbl">{masteredCount} / 10</span>
                            <div className="nm-prog-bar">
                                <div className="nm-prog-fill" style={{ width: `${progPct}%` }} />
                            </div>
                        </div>
                    </div>

                    {/* Mastery tracker */}
                    <div className="nm-mastery">
                        <div>
                            <div className="nm-mastery-n">{masteredCount}</div>
                            <div className="nm-mastery-lbl">Numbers Mastered</div>
                        </div>
                        <div className="nm-dots">
                            {NUMBERS.map(num => (
                                <div
                                    key={num.n}
                                    className={`nm-dot${mastered.has(num.n) ? " nm-dot-done" : ""}`}
                                    title={num.word}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Leo card */}
                    <div className="nm-leo">
                        <div className={`nm-leo-face${leoTalking ? " talking" : ""}`}>🦁</div>
                        <div className="nm-leo-txt">{leoText}</div>
                        <button className="nm-replay" onClick={replayCurrent}>🔊 Replay</button>
                    </div>

                    {/* Step indicator */}
                    <div className="nm-steps">
                        {[{ n: 1, lbl: "Pick Number" }, { n: 2, lbl: "See & Count" }, { n: 3, lbl: "You Say It" }, { n: 4, lbl: "Feedback" }].map((s, i) => (
                            <div key={s.n} className="nm-step" style={{ flex: 1 }}>
                                {i > 0 && <div className="nm-sdiv" />}
                                <div className={`nm-sdot ${step > s.n ? "nm-sdot-done" : step === s.n ? "nm-sdot-active" : "nm-sdot-pending"}`}>
                                    {step > s.n ? "✓" : s.n}
                                </div>
                                <div className={`nm-slbl ${step === s.n ? "nm-slbl-active" : step < s.n ? "nm-slbl-pending" : ""}`}>
                                    {s.lbl}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ══ STEP 1: GRID ══ */}
                    {step === 1 && (
                        <div>
                            <div style={{ textAlign: "center", marginBottom: 14 }}>
                                <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 800, color: "#14532D" }}>Choose a Number 🔢</h2>
                                <p style={{ fontSize: 13, color: "#166534", fontWeight: 500 }}>Tap any number to learn how to count!</p>
                            </div>
                            <div className="nm-grid">
                                {NUMBERS.map((item, i) => (
                                    <div
                                        key={item.n}
                                        className={`nm-tile${mastered.has(item.n) ? " nm-tile-mastered" : ""}`}
                                        style={{
                                            background: tileGradients[i],
                                            borderColor: item.color + "60",
                                            animationDelay: `${i * 0.06}s`,
                                        }}
                                        onClick={() => selectNumber(item)}
                                    >
                                        {mastered.has(item.n) && <div className="nm-tile-check">✓</div>}
                                        <div className="nm-tnum" style={{ color: item.color }}>{item.n}</div>
                                        <div className="nm-tword">{item.word}</div>
                                        <div className="nm-temoji">{item.emoji}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ══ STEP 2: ZOOM & QUANTITY ══ */}
                    {step === 2 && current && (
                        <div className="nm-zoom-stage">
                            {/* Big number + word */}
                            <div className="nm-zoom-num" style={{ fontSize: "clamp(80px,16vw,120px)", color: current.color }}>
                                {current.n}
                            </div>
                            <div className="nm-zoom-word">{current.word}</div>

                            {soundPlaying && (
                                <div className="nm-wave">{[0, 1, 2, 3, 4].map(i => <div key={i} className="nm-wbar" />)}</div>
                            )}

                            {/* Quantity dots pop-up */}
                            <div className="nm-zoom-qty">
                                <QuantitySVG count={current.n} color={current.color} />
                                <div className="nm-qty-label">
                                    {current.n} {current.n === 1 ? current.emojiItem : current.emojiItemPlural} {current.emoji}
                                </div>
                            </div>

                            {/* Daily routine reveal */}
                            {!showDaily ? (
                                <button className="nm-daily-btn" onClick={() => {
                                    setShowDaily(true);
                                    sayLeo(
                                        `Real life: ${current.dailyEmoji} ${current.dailyItem}`,
                                        current.dailySpeak
                                    );
                                }}>
                                    🌍 See it in real life!
                                </button>
                            ) : (
                                <div className="nm-daily-card">
                                    <div className="nm-daily-row">
                                        <div className="nm-daily-big">{current.dailyEmoji}</div>
                                        <div>
                                            <div className="nm-daily-txt">{current.n} = {current.word}</div>
                                            <div className="nm-daily-sub">{current.dailyItem}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="nm-nav">
                                <button className="nm-nbtn" onClick={() => setStep(1)}>← Back</button>
                                <button className="nm-nbtn" onClick={replayCurrent}>🔊 Hear Again</button>
                                <button className="nm-nbtn nm-nbtn-primary" onClick={goToMic}>🎙️ Now You Try!</button>
                            </div>
                        </div>
                    )}

                    {/* ══ STEP 3: MIC ══ */}
                    {step === 3 && current && (
                        <div className="nm-mic-panel">
                            <div className="nm-mic-num" style={{ color: current.color }}>{current.n}</div>
                            <div className="nm-mic-word" style={{ color: current.color }}>{current.word}</div>
                            {/* small quantity visual reminder */}
                            <div className="nm-mic-qty">
                                <QuantitySVG count={current.n} color={current.color} />
                            </div>
                            <div className="nm-mic-hint">
                                Hold 🎙️ and say: <strong style={{ fontSize: 16 }}>{current.word}</strong>
                            </div>
                            <button
                                className={`nm-mic-btn${recording ? " rec" : ""}`}
                                onMouseDown={startRec} onMouseUp={handleStopRec}
                                onTouchStart={startRec} onTouchEnd={handleStopRec}
                            >
                                {recording ? "🔴" : "🎙️"}
                            </button>
                            <div className={`nm-mic-status${recording ? " rec" : ""}`}>
                                {recording ? "Recording... speak now!" : "Hold to speak"}
                            </div>
                            <div className="nm-mic-prog">
                                <div className="nm-mic-pfill" style={{ width: `${micProgress}%` }} />
                            </div>
                            <div className="nm-nav" style={{ marginTop: 20 }}>
                                <button className="nm-nbtn" onClick={() => { setStep(2); replayCurrent(); }}>← Hear Again</button>
                            </div>
                        </div>
                    )}

                    {/* ══ STEP 4A: SUCCESS ══ */}
                    {step === 4 && feedback === "success" && current && (
                        <div className="nm-success">
                            <div className="nm-star-burst">⭐🌟⭐</div>
                            <h2 className="nm-s-title">Perfect! 🎉</h2>
                            <p className="nm-s-sub"><strong>{current.n}</strong> is <strong>{current.word}</strong>!</p>

                            {/* Daily routine reinforcement on success */}
                            <div className="nm-daily-success">
                                <div style={{ fontSize: 40 }}>{current.dailyEmoji}</div>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: "#14532D" }}>{current.dailySpeak}</div>
                                    <div style={{ fontSize: 12, fontWeight: 500, color: "#166534", marginTop: 3 }}>
                                        {current.n} {current.n === 1 ? current.emojiItem : current.emojiItemPlural} {current.emoji}
                                    </div>
                                </div>
                            </div>

                            <div className="nm-coins">🌿 +10 Leaf Coins earned!</div>
                            <div className="nm-leo" style={{ margin: "0 0 20px", textAlign: "left" }}>
                                <div className={`nm-leo-face${leoTalking ? " talking" : ""}`}>🦁</div>
                                <div className="nm-leo-txt">{leoText}</div>
                            </div>
                            <button className="nm-next-btn" onClick={() => { setStep(1); setCurrent(null); setFeedback(null); setShowDaily(false); }}>
                                Next Number →
                            </button>
                        </div>
                    )}

                    {/* ══ STEP 4B: MISTAKE ══ */}
                    {step === 4 && feedback === "mistake" && current && (
                        <div className="nm-mistake">
                            <div className="nm-enc">
                                <div className="nm-enc-leo">🦁</div>
                                <div className="nm-enc-txt">Almost! Let's look at the mouth shape for <strong>"{current.word}"</strong></div>
                            </div>
                            <div className="nm-mouth-card">
                                <div className="nm-mouth-svg">
                                    <MouthSVG type={current.mouthType} size={100} />
                                </div>
                                <h3 className="nm-mouth-title">{current.mouthTitle}</h3>
                                <div className="nm-mouth-tip">{current.mouthTip}</div>
                                <div className="nm-step-list">
                                    {current.steps.map((s, i) => (
                                        <div key={i} className="nm-step-row">
                                            <div className="nm-step-n">{i + 1}</div>
                                            <span>{s}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                                <button className="nm-nbtn" onClick={replayCurrent}>🔊 Hear Sound</button>
                                <button className="nm-try-btn" onClick={() => {
                                    setFeedback(null);
                                    setStep(3);
                                    sayLeo(`Your turn! Say: ${current.word} 🎙️`, `Your turn! Say ${current.word}!`);
                                }}>
                                    🎙️ Try Again!
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </>
    );
}