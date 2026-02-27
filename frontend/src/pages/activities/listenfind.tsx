import { useState, useEffect, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────────────
interface Option {
    emoji: string;
    label: string;
    correct: boolean;
}

interface Round {
    word: string;
    options: Option[];
    hint: string;
    leoHint: string;
    leoCorrect: string;
    leoWrong: string;
}

// ── Data ───────────────────────────────────────────────────────────────────
const ROUNDS: Round[] = [
    {
        word: "cat",
        options: [
            { emoji: "🐱", label: "cat", correct: true },
            { emoji: "🐶", label: "dog", correct: false },
            { emoji: "🐟", label: "fish", correct: false },
            { emoji: "🐭", label: "mouse", correct: false },
        ],
        hint: "This animal says meow!",
        leoHint: "Listen carefully! This animal says meow and loves to purr. Can you find it?",
        leoCorrect: "Yes! That is a cat! C A T, cat! Well done, superstar!",
        leoWrong: "Hmm, not quite! The word was cat. It is a furry animal that says meow. Look at the pictures again!",
    },
    {
        word: "sun",
        options: [
            { emoji: "🌙", label: "moon", correct: false },
            { emoji: "☀️", label: "sun", correct: true },
            { emoji: "⭐", label: "star", correct: false },
            { emoji: "🌧️", label: "rain", correct: false },
        ],
        hint: "It shines brightly in the sky during the day.",
        leoHint: "It shines brightly in the sky during the day. It keeps us warm. Which picture is it?",
        leoCorrect: "Brilliant! That is the sun! It shines bright every single day. You got it!",
        leoWrong: "Oh so close! The word was sun. It shines brightly in the sky during the day. Find the bright yellow one!",
    },
    {
        word: "cup",
        options: [
            { emoji: "🍽️", label: "plate", correct: false },
            { emoji: "🥄", label: "spoon", correct: false },
            { emoji: "☕", label: "cup", correct: true },
            { emoji: "🫙", label: "jar", correct: false },
        ],
        hint: "You drink from this!",
        leoHint: "You hold this in your hand and drink from it. What could it be?",
        leoCorrect: "Amazing! A cup! You drink juice or tea from a cup. Super work!",
        leoWrong: "Not quite! The word was cup. You drink from a cup. Look for the one you sip from!",
    },
    {
        word: "bus",
        options: [
            { emoji: "🚗", label: "car", correct: false },
            { emoji: "🚌", label: "bus", correct: true },
            { emoji: "✈️", label: "plane", correct: false },
            { emoji: "🚲", label: "bike", correct: false },
        ],
        hint: "Many people ride together in this big vehicle.",
        leoHint: "This is a big vehicle. Lots of people ride inside it together. Can you spot it?",
        leoCorrect: "Yes yes yes! That is a bus! Big and full of people. Fantastic job!",
        leoWrong: "Oops! The word was bus. It is a big vehicle where many people ride together. Find the big one!",
    },
    {
        word: "hat",
        options: [
            { emoji: "👟", label: "shoe", correct: false },
            { emoji: "🧤", label: "glove", correct: false },
            { emoji: "🧦", label: "sock", correct: false },
            { emoji: "🎩", label: "hat", correct: true },
        ],
        hint: "You wear this on your head!",
        leoHint: "You wear this on your head, up on top! Which picture shows it?",
        leoCorrect: "Wonderful! A hat goes right on top of your head. Great listening!",
        leoWrong: "Almost! The word was hat. You wear a hat on your head. Look for what goes on top!",
    },
];

// ── Speech engine ──────────────────────────────────────────────────────────

// Auto-unlock on first user gesture (browser autoplay policy)
let _unlocked = false;
if (typeof window !== "undefined") {
    const unlock = () => {
        if (_unlocked) return;
        _unlocked = true;
        const w = new SpeechSynthesisUtterance(" ");
        w.volume = 0;
        window.speechSynthesis.speak(w);
    };
    ["click", "touchstart", "keydown", "mousedown"].forEach((e) =>
        window.addEventListener(e, unlock, { passive: true })
    );
}

// Chrome: speechSynthesis pauses after ~15 s silence — keep it alive
let _keepAlive: ReturnType<typeof setInterval> | null = null;
function startKeepAlive() {
    if (_keepAlive) return;
    _keepAlive = setInterval(() => {
        if (typeof window !== "undefined" && window.speechSynthesis.paused)
            window.speechSynthesis.resume();
    }, 5000);
}

function getVoice(): SpeechSynthesisVoice | null {
    if (typeof window === "undefined") return null;
    const vs = window.speechSynthesis.getVoices();
    return (
        vs.find((v) => v.lang.startsWith("en") && v.localService) ||
        vs.find((v) => v.lang.startsWith("en")) ||
        null
    );
}

// Core speak — fires once voices are ready, chains onEnd reliably
function speakText(text: string, rate = 0.82, onDone?: () => void) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        onDone?.();
        return;
    }
    startKeepAlive();
    const synth = window.speechSynthesis;
    synth.cancel();

    const fire = () => {
        const utt = new SpeechSynthesisUtterance(text);
        utt.rate = rate;
        utt.pitch = 1.1;
        utt.volume = 1;
        const v = getVoice();
        if (v) utt.voice = v;
        if (onDone) {
            utt.onend = onDone;
            utt.onerror = onDone; // don't hang if speech errors
        }
        synth.speak(utt);
    };

    if (synth.getVoices().length === 0) {
        synth.addEventListener("voiceschanged", function once() {
            synth.removeEventListener("voiceschanged", once);
            fire();
        });
    } else {
        fire();
    }
}

// Play the target word slowly, THEN after a short gap speak leoLine
function speakWordThenLeo(word: string, leoLine: string, onDone?: () => void) {
    speakText(word, 0.6, () => {
        // 350 ms gap so it feels natural
        setTimeout(() => speakText(leoLine, 0.82, onDone), 350);
    });
}

function shuffle<T>(arr: T[]): T[] {
    return [...arr].sort(() => Math.random() - 0.5);
}

// ── PicCard ────────────────────────────────────────────────────────────────
type CardState = "idle" | "correct" | "wrong";

function PicCard({
    option, state, onClick,
}: {
    option: Option; state: CardState; onClick: () => void;
}) {
    return (
        <div
            onClick={onClick}
            style={{
                background:
                    state === "correct" ? "#edfaf4" :
                        state === "wrong" ? "#fef0f0" : "white",
                borderRadius: 16,
                padding: "18px 12px 14px",
                textAlign: "center",
                cursor: "pointer",
                boxShadow: "0 2px 10px rgba(0,0,0,.07)",
                border: `3px solid ${state === "correct" ? "#4db88a" :
                        state === "wrong" ? "#e87070" : "transparent"
                    }`,
                transition: "transform .2s, border-color .2s",
                position: "relative",
                userSelect: "none",
            }}
        >
            {state !== "idle" && (
                <div style={{
                    position: "absolute", top: 8, right: 8,
                    width: 26, height: 26, borderRadius: "50%",
                    background: state === "correct" ? "#4db88a" : "#e87070",
                    color: "white",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 800,
                }}>
                    {state === "correct" ? "✓" : "✗"}
                </div>
            )}
            <div style={{ fontSize: 48, lineHeight: 1, marginBottom: 8 }}>{option.emoji}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1a3a30" }}>{option.label}</div>
        </div>
    );
}

// ── Leo Bubble ─────────────────────────────────────────────────────────────
type LeoMood = "idle" | "hint" | "correct" | "wrong";

function LeoBubble({ message, mood, speaking }: { message: string; mood: LeoMood; speaking: boolean }) {
    const bg =
        mood === "correct" ? "#edfaf4" :
            mood === "wrong" ? "#fef4f4" :
                mood === "hint" ? "#e8f5f0" : "white";

    const border =
        mood === "correct" ? "2px solid #4db88a66" :
            mood === "wrong" ? "2px solid #e8707066" :
                "2px solid #d0e8e0";

    return (
        <div style={{
            display: "flex", alignItems: "flex-end", gap: 12,
            maxWidth: 700, margin: "0 auto 24px", padding: "0 24px",
        }}>
            {/* Leo avatar — pulses when speaking */}
            <div style={{
                width: 54, height: 54, borderRadius: "50%",
                background: "linear-gradient(135deg,#f5c542,#e8a020)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, flexShrink: 0,
                border: "3px solid white",
                boxShadow: speaking
                    ? "0 0 0 4px rgba(77,184,160,.35), 0 3px 14px rgba(245,197,66,.45)"
                    : "0 3px 14px rgba(245,197,66,.45)",
                transition: "box-shadow .3s",
                animation: speaking ? "leoSpeak .7s ease-in-out infinite" : "leoFloat 3s ease-in-out infinite",
            }}>
                🦁
            </div>

            {/* Speech bubble */}
            <div style={{
                background: bg,
                border,
                borderRadius: "18px 18px 18px 4px",
                padding: "13px 18px",
                boxShadow: "0 3px 14px rgba(0,0,0,.08)",
                fontSize: 15, fontWeight: 800, color: "#1a3a30",
                maxWidth: 500, lineHeight: 1.65,
                transition: "background .3s, border-color .3s",
                flex: 1,
            }}>
                {/* Animated sound bars when speaking */}
                {speaking && (
                    <span style={{ marginRight: 8, display: "inline-flex", alignItems: "center", gap: 2, verticalAlign: "middle" }}>
                        {[1, 2, 3].map((i) => (
                            <span key={i} style={{
                                display: "inline-block",
                                width: 3, height: 12,
                                background: "#4db8a0",
                                borderRadius: 2,
                                animation: `soundBar .8s ${i * 0.15}s ease-in-out infinite alternate`,
                            }} />
                        ))}
                    </span>
                )}
                {message}
            </div>
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function ListenAndFind() {
    const [current, setCurrent] = useState(0);
    const [shuffled, setShuffled] = useState<Option[]>(() => shuffle(ROUNDS[0].options));
    const [cardStates, setCardStates] = useState<Record<string, CardState>>({});
    const [answered, setAnswered] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackCorrect, setFeedbackCorrect] = useState(true);
    const [audioLabel, setAudioLabel] = useState("Tap to hear the word");
    const [leoMood, setLeoMood] = useState<LeoMood>("idle");
    const [leoMsg, setLeoMsg] = useState("Tap the big button above to hear the word!");
    const [leoSpeaking, setLeoSpeaking] = useState(false);

    const round = ROUNDS[current];

    // Init each round
    useEffect(() => {
        setShuffled(shuffle(round.options));
        setCardStates({});
        setAnswered(false);
        setShowFeedback(false);
        setAudioLabel("Tap to hear the word");
        setLeoMood("idle");
        setLeoMsg("Tap the big button above to hear the word!");
        setLeoSpeaking(false);
        // Auto-play after short delay
        const t = setTimeout(() => triggerPlay(), 700);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current]);

    // Play word + Leo hint sentence
    const triggerPlay = useCallback(() => {
        setAudioLabel(round.word.toUpperCase());
        setLeoMood("hint");
        setLeoMsg(round.leoHint);
        setLeoSpeaking(true);

        speakWordThenLeo(round.word, round.leoHint, () => {
            setLeoSpeaking(false);
        });
    }, [round]);

    // User selects a picture
    const handleSelect = (option: Option) => {
        if (answered) return;
        setAnswered(true);
        setCardStates({ [option.label]: option.correct ? "correct" : "wrong" });

        const mood: LeoMood = option.correct ? "correct" : "wrong";
        const msg = option.correct ? round.leoCorrect : round.leoWrong;

        setLeoMood(mood);
        setLeoMsg(msg);
        setLeoSpeaking(true);

        speakText(msg, 0.82, () => setLeoSpeaking(false));

        // Show feedback overlay after Leo starts speaking
        setTimeout(() => {
            setFeedbackCorrect(option.correct);
            setShowFeedback(true);
        }, 1000);
    };

    const handleNext = () => {
        setShowFeedback(false);
        setCurrent((c) => (c + 1) % ROUNDS.length);
    };

    const progress = ((current + 1) / ROUNDS.length) * 100;

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          0%   { transform: scale(.85); opacity: 0; }
          60%  { transform: scale(1.04); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes leoFloat {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(-6px); }
        }
        @keyframes leoSpeak {
          0%,100% { transform: translateY(0) scale(1); }
          50%     { transform: translateY(-4px) scale(1.06); }
        }
        @keyframes soundBar {
          from { transform: scaleY(0.4); opacity: 0.5; }
          to   { transform: scaleY(1.4); opacity: 1; }
        }
        @keyframes speakPulse {
          0%,100% { box-shadow: 0 2px 8px rgba(0,0,0,.08); }
          50%     { box-shadow: 0 2px 22px rgba(77,184,160,.55); }
        }
      `}</style>

            <div style={{
                fontFamily: "'Nunito', sans-serif",
                background: "linear-gradient(135deg,#e8f5f0 0%,#f5f0e8 40%,#faf5e8 70%,#eef8f4 100%)",
                minHeight: "100vh", color: "#1a3a30", paddingBottom: 40,
            }}>

                {/* ── TOP BAR ── */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px" }}>
                    <button style={{
                        background: "white", border: "none", borderRadius: 50,
                        padding: "10px 20px", fontFamily: "'Nunito',sans-serif",
                        fontWeight: 700, fontSize: 14, color: "#1a3a30", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 6,
                        boxShadow: "0 2px 8px rgba(0,0,0,.08)",
                    }}>← Back</button>

                    <div style={{
                        background: "white", borderRadius: 50, padding: "10px 18px",
                        fontSize: 14, fontWeight: 800, color: "#1a4a3a",
                        boxShadow: "0 2px 8px rgba(0,0,0,.08)",
                    }}>
                        🌴 Listen &amp; Find · Whispering Palms
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#7a9e94" }}>
                            Card {current + 1} of {ROUNDS.length}
                        </span>
                        <div style={{
                            background: "white", borderRadius: 50, padding: "10px 16px",
                            fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: 14,
                            color: "#4db8a0", display: "flex", alignItems: "center", gap: 6,
                            boxShadow: leoSpeaking
                                ? "0 2px 22px rgba(77,184,160,.55)"
                                : "0 2px 8px rgba(0,0,0,.08)",
                            transition: "box-shadow .3s",
                            animation: leoSpeaking ? "speakPulse .9s ease-in-out infinite" : "none",
                        }}>
                            🔊 {leoSpeaking ? "Speaking…" : "Leo"}
                        </div>
                    </div>
                </div>

                {/* ── PROGRESS BAR ── */}
                <div style={{ padding: "0 24px", maxWidth: 748, margin: "0 auto 10px" }}>
                    <div style={{ background: "#d0e8e0", borderRadius: 50, height: 5, overflow: "hidden" }}>
                        <div style={{
                            height: "100%", background: "#4db8a0", borderRadius: 50,
                            width: `${progress}%`, transition: "width .5s ease",
                        }} />
                    </div>
                </div>

                {/* ── DOTS ── */}
                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 20 }}>
                    {ROUNDS.map((_, i) => (
                        <div key={i} style={{
                            width: 10, height: 10, borderRadius: "50%",
                            background: i === current ? "#4db8a0" : "#d0e8e0",
                            transform: i === current ? "scale(1.3)" : "scale(1)",
                            transition: "background .3s, transform .3s",
                        }} />
                    ))}
                </div>

                {/* ── MAIN CARD ── */}
                <div style={{
                    background: "white", borderRadius: 18, margin: "0 auto 24px",
                    maxWidth: 700, padding: "32px 28px 28px",
                    boxShadow: "0 4px 24px rgba(0,0,0,.07)", textAlign: "center",
                    animation: "fadeSlideUp .4s ease both",
                }}>
                    <p style={{
                        fontSize: 11, fontWeight: 800, letterSpacing: "0.12em",
                        color: "#7a9e94", textTransform: "uppercase", marginBottom: 16,
                    }}>
                        🎧 Listen to the word · Find the picture
                    </p>

                    {/* Big play button */}
                    <button
                        onClick={triggerPlay}
                        style={{
                            display: "inline-flex", alignItems: "center", gap: 12,
                            background: "#1a4a3a", color: "white", border: "none",
                            borderRadius: 60, padding: "18px 36px",
                            fontFamily: "'Nunito',sans-serif",
                            fontSize: 22, fontWeight: 900, cursor: "pointer",
                            boxShadow: "0 6px 20px rgba(26,74,58,.25)",
                            marginBottom: 12, transition: "transform .15s",
                        }}
                    >
                        <span style={{ fontSize: 28 }}>🔊</span>
                        <span>{audioLabel}</span>
                    </button>
                    <br />
                    <button
                        onClick={triggerPlay}
                        style={{
                            background: "#e8f5f0", border: "none", borderRadius: 50,
                            padding: "10px 22px", fontFamily: "'Nunito',sans-serif",
                            fontWeight: 700, fontSize: 14, color: "#2d7a5f",
                            cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
                        }}
                    >
                        🔉 Hear word again
                    </button>
                </div>

                {/* ── QUESTION ── */}
                <p style={{
                    textAlign: "center", maxWidth: 700, margin: "0 auto 20px",
                    fontSize: 20, fontWeight: 800, color: "#1a3a30",
                }}>
                    Which picture matches the word you heard?
                </p>

                {/* ── PICTURE GRID ── */}
                <div style={{
                    display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 14, maxWidth: 700, margin: "0 auto 24px",
                }}>
                    {shuffled.map((opt) => (
                        <PicCard
                            key={opt.label}
                            option={opt}
                            state={cardStates[opt.label] ?? "idle"}
                            onClick={() => handleSelect(opt)}
                        />
                    ))}
                </div>

                {/* ── LEO BUBBLE ── speaks hint / correct / wrong */}
                <LeoBubble message={leoMsg} mood={leoMood} speaking={leoSpeaking} />

                {/* ── FEEDBACK OVERLAY ── */}
                {showFeedback && (
                    <div
                        style={{
                            position: "fixed", inset: 0, background: "rgba(0,0,0,.38)",
                            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
                        }}
                        onClick={handleNext}
                    >
                        <div
                            style={{
                                background: "white", borderRadius: 24,
                                padding: "40px 48px", textAlign: "center",
                                boxShadow: "0 20px 60px rgba(0,0,0,.2)",
                                animation: "popIn .3s ease both",
                                minWidth: 320, maxWidth: 440,
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div style={{ fontSize: 64, marginBottom: 10 }}>
                                {feedbackCorrect ? "🎉" : "🤔"}
                            </div>
                            <div style={{ fontSize: 28, fontWeight: 900, color: "#1a3a30", marginBottom: 10 }}>
                                {feedbackCorrect ? "Amazing!" : "Not quite!"}
                            </div>

                            {/* Leo message inside overlay */}
                            <div style={{
                                display: "flex", alignItems: "center", gap: 12,
                                background: feedbackCorrect ? "#edfaf4" : "#fef4f4",
                                border: `2px solid ${feedbackCorrect ? "#4db88a55" : "#e8707055"}`,
                                borderRadius: 16, padding: "14px 16px", marginBottom: 24,
                                textAlign: "left",
                            }}>
                                <span style={{ fontSize: 30, flexShrink: 0 }}>🦁</span>
                                <span style={{ fontSize: 14, fontWeight: 800, color: "#1a3a30", lineHeight: 1.65 }}>
                                    {feedbackCorrect ? round.leoCorrect : round.leoWrong}
                                </span>
                            </div>

                            <button
                                onClick={handleNext}
                                style={{
                                    background: "#1a4a3a", color: "white", border: "none",
                                    borderRadius: 50, padding: "14px 40px",
                                    fontFamily: "'Nunito',sans-serif",
                                    fontSize: 17, fontWeight: 800, cursor: "pointer",
                                    boxShadow: "0 4px 16px rgba(26,74,58,.28)",
                                }}
                            >
                                Next Word →
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </>
    );
}