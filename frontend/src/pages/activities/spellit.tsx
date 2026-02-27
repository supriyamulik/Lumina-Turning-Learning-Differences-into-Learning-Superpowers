import { useState, useEffect, useCallback } from "react";

// ===========================================================================
// Types
// ===========================================================================
interface Round {
    word: string;
    emoji: string;
    hint: string;
}

type LetterState = "idle" | "correct" | "wrong";

// ===========================================================================
// Data
// ===========================================================================
const ROUNDS: Round[] = [
    { word: "cat", emoji: "🐱", hint: "A furry pet that says meow!" },
    { word: "sun", emoji: "☀️", hint: "It shines bright in the daytime sky." },
    { word: "cup", emoji: "☕", hint: "You drink from this." },
    { word: "bus", emoji: "🚌", hint: "A big vehicle that carries many people." },
    { word: "hat", emoji: "🎩", hint: "You wear this on your head." },
    { word: "dog", emoji: "🐶", hint: "A loyal pet that loves to fetch!" },
    { word: "frog", emoji: "🐸", hint: "This green animal loves to jump and swim." },
    { word: "star", emoji: "⭐", hint: "It twinkles in the night sky." },
];

// ===========================================================================
// Phonics map
// ===========================================================================
const PHONICS: Record<string, string> = {
    a: "ay", b: "buh", c: "cuh", d: "duh", e: "eh",
    f: "fuh", g: "guh", h: "huh", i: "ih", j: "juh",
    k: "kuh", l: "luh", m: "muh", n: "nuh", o: "oh",
    p: "puh", q: "kwuh", r: "ruh", s: "sss", t: "tuh",
    u: "uh", v: "vuh", w: "wuh", x: "eks", y: "yuh", z: "zuh",
};

// ===========================================================================
// Speech utilities
// ===========================================================================

// Auto-unlock audio context on first user interaction (no banner needed).
// Browsers require a real gesture before speechSynthesis will produce sound.
let _audioUnlocked = false;
function autoUnlockSpeech() {
    if (_audioUnlocked || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    _audioUnlocked = true;
    const warmup = new SpeechSynthesisUtterance(" ");
    warmup.volume = 0;
    window.speechSynthesis.speak(warmup);
}
if (typeof window !== "undefined") {
    ["click", "touchstart", "keydown", "mousedown"].forEach((evt) => {
        window.addEventListener(evt, autoUnlockSpeech, { once: false, passive: true });
    });
}

// Chrome bug: speechSynthesis pauses after ~15s of silence. Keep it awake.
let _keepAliveTimer: ReturnType<typeof setInterval> | null = null;
function ensureKeepAlive() {
    if (_keepAliveTimer) return;
    _keepAliveTimer = setInterval(() => {
        if (
            typeof window !== "undefined" &&
            "speechSynthesis" in window &&
            window.speechSynthesis.paused
        ) {
            window.speechSynthesis.resume();
        }
    }, 5000);
}

// Get an English voice, preferring local/non-Google ones
function getBestVoice(): SpeechSynthesisVoice | null {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    return (
        voices.find((v) => v.lang.startsWith("en") && v.localService) ||
        voices.find((v) => v.lang.startsWith("en")) ||
        null
    );
}

// Core speak — robust: waits for voices if not yet loaded
function speak(text: string, rate = 0.82) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    ensureKeepAlive();
    const synth = window.speechSynthesis;
    synth.cancel();

    const fire = () => {
        const utt = new SpeechSynthesisUtterance(text);
        utt.rate = rate;
        utt.pitch = 1.1;
        utt.volume = 1;
        const v = getBestVoice();
        if (v) utt.voice = v;
        synth.speak(utt);
    };

    if (synth.getVoices().length === 0) {
        synth.addEventListener("voiceschanged", function onVoices() {
            synth.removeEventListener("voiceschanged", onVoices);
            fire();
        });
    } else {
        fire();
    }
}

// Speak the letter name, then its phonics sound as two chained utterances
function speakLetter(letter: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    ensureKeepAlive();
    const synth = window.speechSynthesis;
    synth.cancel();

    const phonic = PHONICS[letter.toLowerCase()] ?? letter;

    const fire = () => {
        const v = getBestVoice();

        const makeUtt = (text: string, rate: number) => {
            const u = new SpeechSynthesisUtterance(text);
            u.rate = rate;
            u.pitch = 1.15;
            u.volume = 1;
            if (v) u.voice = v;
            return u;
        };

        // Say the letter name first
        const u1 = makeUtt(letter.toUpperCase(), 0.75);
        u1.onend = () => {
            // Then say the phonics sound
            const u2 = makeUtt(phonic, 0.65);
            synth.speak(u2);
        };
        synth.speak(u1);
    };

    if (synth.getVoices().length === 0) {
        synth.addEventListener("voiceschanged", function onVoices() {
            synth.removeEventListener("voiceschanged", onVoices);
            fire();
        });
    } else {
        fire();
    }
}

function shuffle<T>(arr: T[]): T[] {
    return [...arr].sort(() => Math.random() - 0.5);
}

// ===========================================================================
// LetterTile
// ===========================================================================
function LetterTile({
    letter, state, popping,
}: {
    letter: string;
    state: LetterState;
    popping: boolean;
}) {
    const bg =
        state === "correct" ? "#4db88a" :
            state === "wrong" ? "#e87070" :
                letter ? "#e8f5f0" : "white";

    const borderColor =
        state === "correct" ? "#4db88a" :
            state === "wrong" ? "#e87070" :
                letter ? "#a0d8c8" : "#d0e8e0";

    return (
        <div style={{
            width: 56, height: 62, borderRadius: 16,
            background: bg,
            border: `3px solid ${borderColor}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, fontWeight: 900,
            color: state !== "idle" ? "white" : "#1a4a3a",
            fontFamily: "'Nunito', sans-serif",
            boxShadow:
                state === "correct" ? "0 4px 16px rgba(77,184,138,.35)" :
                    state === "wrong" ? "0 4px 16px rgba(232,112,112,.35)" :
                        "0 2px 8px rgba(0,0,0,.07)",
            transition: "background .22s, border-color .22s",
            transform: popping ? "scale(1.18)" : "scale(1)",
            userSelect: "none",
        }}>
            {letter.toUpperCase()}
        </div>
    );
}

// ===========================================================================
// LetterChip — hover = Leo speaks that letter
// ===========================================================================
function LetterChip({
    letter, used, onClick, onHover,
}: {
    letter: string;
    used: boolean;
    onClick: () => void;
    onHover: (l: string) => void;
}) {
    const [hovered, setHovered] = useState(false);

    return (
        <button
            onClick={onClick}
            disabled={used}
            onMouseEnter={() => { if (!used) { setHovered(true); onHover(letter); } }}
            onMouseLeave={() => setHovered(false)}
            style={{
                width: 56, height: 56, borderRadius: 16,
                background: used ? "#edf3f1" : hovered ? "#1a4a3a" : "white",
                border: used
                    ? "2px solid #d4e8e0"
                    : hovered
                        ? "2px solid #1a4a3a"
                        : "2px solid #b0d8cc",
                fontSize: 24, fontWeight: 900,
                color: used ? "#b0c8c0" : hovered ? "white" : "#1a4a3a",
                cursor: used ? "not-allowed" : "pointer",
                fontFamily: "'Nunito', sans-serif",
                boxShadow: used
                    ? "none"
                    : hovered
                        ? "0 6px 20px rgba(26,74,58,.32)"
                        : "0 3px 10px rgba(0,0,0,.1)",
                transform: used ? "scale(0.9)" : hovered ? "scale(1.15)" : "scale(1)",
                transition: "all .15s ease",
                userSelect: "none",
            }}
        >
            {letter.toUpperCase()}
        </button>
    );
}

// ===========================================================================
// Leo speech bubble
// ===========================================================================
function LeoBubble({ message, visible }: { message: string; visible: boolean }) {
    return (
        <div style={{
            display: "flex", alignItems: "flex-end", gap: 10,
            maxWidth: 700, margin: "0 auto 20px", padding: "0 24px",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(10px)",
            transition: "opacity .28s, transform .28s",
            pointerEvents: "none",
        }}>
            <div style={{
                width: 52, height: 52, borderRadius: "50%",
                background: "linear-gradient(135deg,#f5c542,#e8a020)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 26, flexShrink: 0,
                boxShadow: "0 3px 14px rgba(245,197,66,.45)",
                border: "3px solid white",
            }}>
                🦁
            </div>
            <div style={{
                background: "white",
                borderRadius: "18px 18px 18px 4px",
                padding: "12px 18px",
                boxShadow: "0 3px 14px rgba(0,0,0,.1)",
                fontSize: 15, fontWeight: 800, color: "#1a3a30",
                maxWidth: 460,
            }}>
                {message}
            </div>
        </div>
    );
}

// ===========================================================================
// Main Component
// ===========================================================================
export default function SpellIt() {
    const [current, setCurrent] = useState(0);
    const [chips, setChips] = useState<string[]>([]);
    const [typed, setTyped] = useState<string[]>([]);
    const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set());
    const [letterStates, setLetterStates] = useState<LetterState[]>([]);
    const [poppingIdx, setPoppingIdx] = useState<number | null>(null);
    const [checked, setChecked] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackCorrect, setFeedbackCorrect] = useState(false);
    const [score, setScore] = useState(0);
    const [shake, setShake] = useState(false);
    const [leoMsg, setLeoMsg] = useState("Hover any letter and I will say it for you!");
    const [leoVisible, setLeoVisible] = useState(true);

    const round = ROUNDS[current];

    // Init round
    const initRound = useCallback((idx: number) => {
        const r = ROUNDS[idx];
        const extras = "bcdefghjklmnopqrstuvwxyz"
            .split("").filter((c) => !r.word.includes(c))
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.max(3, 7 - r.word.length));
        const pool = shuffle([...r.word.split(""), ...extras]);
        setChips(pool);
        setTyped(Array(r.word.length).fill(""));
        setUsedIndices(new Set());
        setLetterStates(Array(r.word.length).fill("idle" as LetterState));
        setChecked(false);
        setShowFeedback(false);
        setPoppingIdx(null);
        setShake(false);
        setLeoMsg(`Let's spell "${r.word.toUpperCase()}"! ${r.emoji} Hover any letter and I will say it!`);
        setLeoVisible(true);
        setTimeout(() => speak(r.word, 0.72), 500);
    }, []);

    useEffect(() => { initRound(current); }, [current, initRound]);

    // Keyboard support
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (checked) return;
            const key = e.key.toLowerCase();
            if (key === "backspace") { doBackspace(); return; }
            if (key === "enter") { doCheck(); return; }
            const idx = chips.findIndex((c, i) => c === key && !usedIndices.has(i));
            if (idx !== -1) addLetter(key, idx);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    });

    // Leo: hover letter chip
    const handleChipHover = (letter: string) => {
        const phonic = PHONICS[letter.toLowerCase()] ?? letter;
        setLeoMsg(`"${letter.toUpperCase()}" makes the sound... ${phonic}!`);
        setLeoVisible(true);
        speakLetter(letter);
    };

    // Add letter
    const addLetter = (letter: string, chipIdx: number) => {
        if (checked) return;
        const nextEmpty = typed.findIndex((l) => l === "");
        if (nextEmpty === -1) return;
        const newTyped = [...typed];
        newTyped[nextEmpty] = letter;
        setTyped(newTyped);
        setUsedIndices((prev) => new Set([...prev, chipIdx]));
        setPoppingIdx(nextEmpty);
        speak(letter, 0.9);
        setTimeout(() => setPoppingIdx(null), 220);
    };

    // Backspace
    const doBackspace = () => {
        if (checked) return;
        let last = -1;
        for (let i = typed.length - 1; i >= 0; i--) {
            if (typed[i] !== "") { last = i; break; }
        }
        if (last === -1) return;
        const removed = typed[last];
        const newTyped = [...typed];
        newTyped[last] = "";
        setTyped(newTyped);
        const chipIdx = chips.findIndex((c, i) => c === removed && usedIndices.has(i));
        if (chipIdx !== -1) {
            const next = new Set(usedIndices);
            next.delete(chipIdx);
            setUsedIndices(next);
        }
        setLetterStates(Array(round.word.length).fill("idle" as LetterState));
    };

    const doClear = () => {
        if (checked) return;
        setTyped(Array(round.word.length).fill(""));
        setUsedIndices(new Set());
        setLetterStates(Array(round.word.length).fill("idle" as LetterState));
        setLeoMsg("All cleared! Try again, you can do it!");
        speak("All cleared! Try again!", 0.85);
    };

    // Check answer
    const doCheck = () => {
        if (checked) return;
        if (typed.some((l) => l === "")) {
            setShake(true);
            setLeoMsg("Oops! Fill in all the letters first!");
            speak("Fill in all the letters first!", 0.85);
            setTimeout(() => setShake(false), 420);
            return;
        }
        const states: LetterState[] = typed.map((l, i) =>
            l === round.word[i] ? "correct" : "wrong"
        );
        setLetterStates(states);
        setChecked(true);
        const allCorrect = states.every((s) => s === "correct");
        setFeedbackCorrect(allCorrect);
        if (allCorrect) setScore((s) => s + 1);

        if (allCorrect) {
            setLeoMsg(`YES! ${round.word.toUpperCase()}! ${round.word.toUpperCase()}! You spelled it perfectly!`);
            setTimeout(() => speak(`${round.word}! ${round.word}! Amazing spelling!`, 0.78), 400);
        } else {
            setLeoMsg(`Hmm, not quite! Look at the picture carefully. It is a ${round.word}! ${round.emoji} Let's try again!`);
            setTimeout(() => speak(`Not quite! Look at the picture carefully. It is a ${round.word}. Let's try again!`, 0.78), 400);
        }
        setTimeout(() => setShowFeedback(true), 1100);
    };

    const handleNext = () => {
        setShowFeedback(false);
        setCurrent((c) => (c + 1) % ROUNDS.length);
    };

    const progress = ((current + 1) / ROUNDS.length) * 100;

    // ===========================================================================
    // Render
    // ===========================================================================
    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeUp    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes popIn     { 0%{transform:scale(.78);opacity:0} 65%{transform:scale(1.07)} 100%{transform:scale(1);opacity:1} }
        @keyframes shake     { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 60%{transform:translateX(8px)} }
        @keyframes bounce    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes glow      { 0%,100%{box-shadow:0 2px 8px rgba(0,0,0,.08)} 50%{box-shadow:0 3px 20px rgba(77,184,160,.42)} }
        @keyframes correctPop{ 0%{transform:scale(1)} 40%{transform:scale(1.22)} 70%{transform:scale(.95)} 100%{transform:scale(1)} }
        @keyframes wrongWig  { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-7deg)} 75%{transform:rotate(7deg)} }
        @keyframes leoWiggle { 0%,100%{transform:rotate(0) scale(1)} 30%{transform:rotate(-10deg) scale(1.1)} 70%{transform:rotate(8deg) scale(1.1)} }

        .card-in     { animation: fadeUp .4s ease both; }
        .pop-in      { animation: popIn .34s ease both; }
        .bounce-em   { animation: bounce 1.7s ease infinite; }
        .glow-btn    { animation: glow 2.4s ease infinite; }
        .correct-tile{ animation: correctPop .35s ease; }
        .wrong-tile  { animation: wrongWig .38s ease; }
        .leo-wiggle  { animation: leoWiggle .5s ease; }
        .shake-anim  { animation: shake .4s ease; }
      `}</style>

            <div style={{
                fontFamily: "'Nunito', sans-serif",
                background: "linear-gradient(135deg,#e8f5f0 0%,#f5f0e8 40%,#faf5e8 70%,#eef8f4 100%)",
                minHeight: "100vh", color: "#1a3a30",
                paddingBottom: 40,
                paddingTop: 0,
            }}>

                {/* TOP BAR */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px" }}>
                    <button style={{
                        background: "white", border: "none", borderRadius: 50,
                        padding: "10px 20px", fontFamily: "'Nunito',sans-serif",
                        fontWeight: 700, fontSize: 14, color: "#1a3a30", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 6,
                        boxShadow: "0 2px 8px rgba(0,0,0,.08)",
                    }}>
                        &larr; Back
                    </button>

                    <div style={{
                        background: "white", borderRadius: 50, padding: "10px 20px",
                        fontSize: 14, fontWeight: 800, color: "#1a4a3a",
                        boxShadow: "0 2px 8px rgba(0,0,0,.08)",
                    }}>
                        Spell It &middot; Whispering Palms
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#7a9e94" }}>
                            Card {current + 1} of {ROUNDS.length}
                        </span>
                        <div style={{
                            background: "white", borderRadius: 50, padding: "9px 16px",
                            fontSize: 13, fontWeight: 800, color: "#f5a623",
                            boxShadow: "0 2px 8px rgba(0,0,0,.08)",
                            display: "flex", alignItems: "center", gap: 5,
                        }}>
                            &#11088; {score}
                        </div>
                    </div>
                </div>

                {/* PROGRESS */}
                <div style={{ padding: "0 24px", maxWidth: 748, margin: "0 auto 10px" }}>
                    <div style={{ background: "#d0e8e0", borderRadius: 50, height: 5, overflow: "hidden" }}>
                        <div style={{
                            height: "100%", background: "#4db8a0", borderRadius: 50,
                            width: `${progress}%`, transition: "width .5s ease",
                        }} />
                    </div>
                </div>

                {/* DOTS */}
                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 18 }}>
                    {ROUNDS.map((_, i) => (
                        <div key={i} style={{
                            width: 10, height: 10, borderRadius: "50%",
                            background: i === current ? "#4db8a0" : "#d0e8e0",
                            transform: i === current ? "scale(1.3)" : "scale(1)",
                            transition: "background .3s, transform .3s",
                        }} />
                    ))}
                </div>

                {/* PICTURE CARD */}
                <div className="card-in" style={{
                    background: "white", borderRadius: 20, margin: "0 auto 18px",
                    maxWidth: 700, padding: "26px 28px 22px",
                    boxShadow: "0 4px 24px rgba(0,0,0,.07)", textAlign: "center",
                }}>
                    <p style={{
                        fontSize: 11, fontWeight: 800, letterSpacing: "0.13em",
                        color: "#7a9e94", textTransform: "uppercase", marginBottom: 12,
                    }}>
                        LOOK AT THE PICTURE &middot; SPELL THE WORD
                    </p>

                    <div className="bounce-em" style={{ fontSize: 80, lineHeight: 1, marginBottom: 14 }}>
                        {round.emoji}
                    </div>

                    <button
                        className="glow-btn"
                        onClick={() => speak(round.word, 0.72)}
                        style={{
                            background: "#e8f5f0", border: "none", borderRadius: 50,
                            padding: "10px 24px", fontFamily: "'Nunito',sans-serif",
                            fontWeight: 800, fontSize: 14, color: "#2d7a5f",
                            cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7,
                        }}
                    >
                        🔊 Hear the word
                    </button>
                </div>

                {/* ANSWER TILES */}
                <div style={{ textAlign: "center", maxWidth: 700, margin: "0 auto 8px" }}>
                    <p style={{ fontSize: 16, fontWeight: 800, color: "#1a3a30", marginBottom: 12 }}>
                        Tap letters to build the word:
                    </p>
                    <div
                        className={shake ? "shake-anim" : ""}
                        style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}
                    >
                        {typed.map((letter, i) => (
                            <div
                                key={i}
                                className={
                                    checked && letterStates[i] === "correct" ? "correct-tile" :
                                        checked && letterStates[i] === "wrong" ? "wrong-tile" : ""
                                }
                            >
                                <LetterTile
                                    letter={letter}
                                    state={letterStates[i] ?? "idle"}
                                    popping={poppingIdx === i}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* ACTION BUTTONS */}
                <div style={{ display: "flex", justifyContent: "center", gap: 10, maxWidth: 700, margin: "12px auto" }}>
                    <button onClick={doBackspace} disabled={checked} style={{
                        background: "#e8f5f0", border: "none", borderRadius: 50,
                        padding: "11px 22px", fontFamily: "'Nunito',sans-serif",
                        fontWeight: 700, fontSize: 14,
                        color: checked ? "#aac8c0" : "#2d7a5f",
                        cursor: checked ? "not-allowed" : "pointer",
                    }}>
                        Undo
                    </button>

                    <button onClick={doClear} disabled={checked} style={{
                        background: "#e8f5f0", border: "none", borderRadius: 50,
                        padding: "11px 22px", fontFamily: "'Nunito',sans-serif",
                        fontWeight: 700, fontSize: 14,
                        color: checked ? "#aac8c0" : "#2d7a5f",
                        cursor: checked ? "not-allowed" : "pointer",
                    }}>
                        Clear
                    </button>

                    <button onClick={doCheck} disabled={checked} style={{
                        background: checked ? "#b0d8cc" : "#1a4a3a",
                        border: "none", borderRadius: 50,
                        padding: "11px 34px", fontFamily: "'Nunito',sans-serif",
                        fontWeight: 800, fontSize: 16, color: "white",
                        cursor: checked ? "not-allowed" : "pointer",
                        boxShadow: checked ? "none" : "0 4px 16px rgba(26,74,58,.28)",
                        transition: "transform .15s",
                    }}>
                        Check
                    </button>
                </div>

                {/* LETTER CHIPS */}
                <div style={{
                    background: "white", borderRadius: 20, maxWidth: 700, margin: "0 auto 16px",
                    padding: "20px 24px", boxShadow: "0 4px 20px rgba(0,0,0,.07)",
                }}>
                    <p style={{
                        fontSize: 11, fontWeight: 800, letterSpacing: ".12em",
                        color: "#7a9e94", textTransform: "uppercase",
                        marginBottom: 14, textAlign: "center",
                    }}>
                        Hover a letter &mdash; Leo will say it for you! 🦁
                    </p>

                    <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
                        {chips.map((letter, i) => (
                            <LetterChip
                                key={i}
                                letter={letter}
                                used={usedIndices.has(i)}
                                onClick={() => addLetter(letter, i)}
                                onHover={handleChipHover}
                            />
                        ))}
                    </div>
                </div>

                {/* LEO BUBBLE */}
                <LeoBubble message={leoMsg} visible={leoVisible} />

                {/* FEEDBACK OVERLAY */}
                {showFeedback && (
                    <div style={{
                        position: "fixed", inset: 0,
                        background: "rgba(0,0,0,.42)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        zIndex: 200,
                    }}>
                        <div
                            className="pop-in"
                            style={{
                                background: "white", borderRadius: 26,
                                padding: "44px 52px 40px", textAlign: "center",
                                boxShadow: "0 28px 70px rgba(0,0,0,.24)",
                                minWidth: 340, maxWidth: 480,
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {feedbackCorrect ? (
                                <>
                                    <div style={{ fontSize: 72, marginBottom: 6 }}>🎉</div>
                                    <div style={{ fontSize: 30, fontWeight: 900, color: "#1a3a30", marginBottom: 8 }}>
                                        Amazing Spelling!
                                    </div>

                                    {/* Leo says word twice */}
                                    <div style={{
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        gap: 10, background: "#e8f5f0", borderRadius: 16,
                                        padding: "12px 20px", marginBottom: 18,
                                    }}>
                                        <span className="leo-wiggle" style={{ fontSize: 34 }}>🦁</span>
                                        <div style={{ textAlign: "left" }}>
                                            <div style={{ fontSize: 13, fontWeight: 800, color: "#7a9e94" }}>Leo says:</div>
                                            <div style={{ fontSize: 20, fontWeight: 900, color: "#2d7a5f", letterSpacing: 1 }}>
                                                "{round.word.toUpperCase()}! {round.word.toUpperCase()}!" {round.emoji}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 28 }}>
                                        {round.word.split("").map((l, i) => (
                                            <div key={i} style={{
                                                width: 50, height: 56, borderRadius: 14,
                                                background: "#4db88a",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                fontSize: 24, fontWeight: 900, color: "white",
                                                boxShadow: "0 4px 12px rgba(77,184,138,.4)",
                                                animation: `popIn ${0.12 + i * 0.1}s ease both`,
                                            }}>
                                                {l.toUpperCase()}
                                            </div>
                                        ))}
                                    </div>

                                    <button onClick={handleNext} style={{
                                        background: "#1a4a3a", color: "white", border: "none",
                                        borderRadius: 50, padding: "14px 44px",
                                        fontFamily: "'Nunito',sans-serif", fontSize: 17, fontWeight: 800,
                                        cursor: "pointer", boxShadow: "0 4px 16px rgba(26,74,58,.28)",
                                    }}>
                                        Next Word
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div style={{ fontSize: 64, marginBottom: 8 }}>🤔</div>
                                    <div style={{ fontSize: 26, fontWeight: 900, color: "#1a3a30", marginBottom: 12 }}>
                                        Let's Try Again!
                                    </div>

                                    <div style={{
                                        background: "#fff8e6", borderRadius: 16, padding: "14px 20px",
                                        marginBottom: 16, display: "flex", alignItems: "center", gap: 12,
                                        textAlign: "left", border: "2px solid #f5e0a0",
                                    }}>
                                        <span style={{ fontSize: 36 }}>🦁</span>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 800, color: "#7a6020" }}>
                                                Look at the picture carefully...
                                            </div>
                                            <div style={{ fontSize: 18, fontWeight: 900, color: "#e8a020", marginTop: 3 }}>
                                                See the {round.emoji} ? It's a {round.word.toUpperCase()}!
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ fontSize: 12, fontWeight: 800, color: "#7a9e94", marginBottom: 10, letterSpacing: ".1em" }}>
                                        THE CORRECT SPELLING IS:
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 24 }}>
                                        {round.word.split("").map((l, i) => (
                                            <div key={i} style={{
                                                width: 50, height: 56, borderRadius: 14,
                                                background: "#e87070",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                fontSize: 24, fontWeight: 900, color: "white",
                                                boxShadow: "0 4px 12px rgba(232,112,112,.35)",
                                                animation: `popIn ${0.12 + i * 0.1}s ease both`,
                                            }}>
                                                {l.toUpperCase()}
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                                        <button
                                            onClick={() => { setShowFeedback(false); initRound(current); }}
                                            style={{
                                                background: "#1a4a3a", color: "white", border: "none",
                                                borderRadius: 50, padding: "13px 32px",
                                                fontFamily: "'Nunito',sans-serif", fontSize: 16, fontWeight: 800,
                                                cursor: "pointer", boxShadow: "0 4px 16px rgba(26,74,58,.28)",
                                            }}
                                        >
                                            Try Again
                                        </button>

                                        <button onClick={handleNext} style={{
                                            background: "#e8f5f0", color: "#2d7a5f", border: "none",
                                            borderRadius: 50, padding: "13px 28px",
                                            fontFamily: "'Nunito',sans-serif", fontSize: 16, fontWeight: 800,
                                            cursor: "pointer",
                                        }}>
                                            Skip
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </>
    );
}