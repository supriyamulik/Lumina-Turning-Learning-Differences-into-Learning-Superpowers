import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// ── Types ──────────────────────────────────────────────────
interface LetterData {
    l: string; ph: string; label: string; vowel: boolean;
    leo: string; mouthType: string; mouthTitle: string;
    mouthTip: string; steps: string[];
}
type Step = 1 | 2 | 3 | 4;
type FeedbackType = "success" | "mistake" | null;

// ── SVG Mouth Illustrations ────────────────────────────────
// mouthType keys: "wide_open" | "rounded" | "lips_together" | "teeth_gap" | "teeth_lip" | "lip_curl" | "relaxed"
function MouthSVG({ type, size = 80 }: { type: string; size?: number }) {
    const s = size;
    const cx = s / 2, cy = s / 2;

    const mouths: Record<string, React.ReactElement> = {
        wide_open: (
            <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
                <ellipse cx={cx} cy={cy} rx={cx - 4} ry={cy - 4} fill="#FDDBB4" stroke="#E8920C" strokeWidth="2" />
                <ellipse cx={cx} cy={cy + 8} rx={cx - 14} ry={cy - 24} fill="#8B1A2A" />
                <rect x={cx - 18} y={cy + 2} width={36} height={8} rx="3" fill="white" />
                <ellipse cx={cx} cy={cy + 20} rx={12} ry={8} fill="#E05070" />
                <path d={`M ${cx - 20} ${cy + 2} Q ${cx} ${cy - 4} ${cx + 20} ${cy + 2}`} fill="none" stroke="#C0703A" strokeWidth="1.5" />
            </svg>
        ),
        lips_together: (
            <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
                <ellipse cx={cx} cy={cy} rx={cx - 4} ry={cy - 4} fill="#FDDBB4" stroke="#E8920C" strokeWidth="2" />
                <path d={`M ${cx - 20} ${cy + 8} Q ${cx - 8} ${cy + 2} ${cx} ${cy + 5} Q ${cx + 8} ${cy + 2} ${cx + 20} ${cy + 8}`} fill="#D4607A" stroke="#B8405A" strokeWidth="1.5" />
                <path d={`M ${cx - 20} ${cy + 8} Q ${cx} ${cy + 22} ${cx + 20} ${cy + 8}`} fill="#E07090" stroke="#B8405A" strokeWidth="1.5" />
                <line x1={cx - 20} y1={cy + 8} x2={cx + 20} y2={cy + 8} stroke="#B8405A" strokeWidth="1.5" />
            </svg>
        ),
        rounded: (
            <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
                <ellipse cx={cx} cy={cy} rx={cx - 4} ry={cy - 4} fill="#FDDBB4" stroke="#E8920C" strokeWidth="2" />
                <ellipse cx={cx} cy={cy + 10} rx={12} ry={14} fill="#8B1A2A" />
                <ellipse cx={cx} cy={cy + 10} rx={10} ry={12} fill="#5A0A15" />
                <path d={`M ${cx - 12} ${cy + 4} Q ${cx - 4} ${cy - 2} ${cx} ${cy + 1} Q ${cx + 4} ${cy - 2} ${cx + 12} ${cy + 4}`} fill="#D4607A" stroke="#B8405A" strokeWidth="1.5" />
                <path d={`M ${cx - 12} ${cy + 16} Q ${cx} ${cy + 26} ${cx + 12} ${cy + 16}`} fill="#E07090" stroke="#B8405A" strokeWidth="1.5" />
            </svg>
        ),
        teeth_gap: (
            <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
                <ellipse cx={cx} cy={cy} rx={cx - 4} ry={cy - 4} fill="#FDDBB4" stroke="#E8920C" strokeWidth="2" />
                <rect x={cx - 18} y={cy + 2} width={36} height={6} rx="2" fill="white" stroke="#DDD" strokeWidth="0.5" />
                <rect x={cx - 18} y={cy + 10} width={36} height={6} rx="2" fill="white" stroke="#DDD" strokeWidth="0.5" />
                <rect x={cx - 18} y={cy + 7} width={36} height={4} fill="#3A0A10" />
                <path d={`M ${cx - 20} ${cy + 2} Q ${cx} ${cy - 5} ${cx + 20} ${cy + 2}`} fill="#D4607A" stroke="#B8405A" strokeWidth="1.5" />
                <path d={`M ${cx - 20} ${cy + 16} Q ${cx} ${cy + 24} ${cx + 20} ${cy + 16}`} fill="#E07090" stroke="#B8405A" strokeWidth="1.5" />
            </svg>
        ),
        teeth_lip: (
            <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
                <ellipse cx={cx} cy={cy} rx={cx - 4} ry={cy - 4} fill="#FDDBB4" stroke="#E8920C" strokeWidth="2" />
                <rect x={cx - 16} y={cy + 2} width={32} height={7} rx="2" fill="white" stroke="#DDD" strokeWidth="0.5" />
                <path d={`M ${cx - 20} ${cy + 10} Q ${cx} ${cy + 18} ${cx + 20} ${cy + 10}`} fill="#E07090" stroke="#B8405A" strokeWidth="2" />
                <path d={`M ${cx - 20} ${cy + 2} Q ${cx - 8} ${cy - 5} ${cx} ${cy - 2} Q ${cx + 8} ${cy - 5} ${cx + 20} ${cy + 2}`} fill="#D4607A" stroke="#B8405A" strokeWidth="1.5" />
            </svg>
        ),
        lip_curl: (
            <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
                <ellipse cx={cx} cy={cy} rx={cx - 4} ry={cy - 4} fill="#FDDBB4" stroke="#E8920C" strokeWidth="2" />
                <ellipse cx={cx} cy={cy + 10} rx={cx - 16} ry={14} fill="#8B1A2A" />
                <rect x={cx - 18} y={cy + 2} width={36} height={6} rx="2" fill="white" />
                <path d={`M ${cx - 10} ${cy + 18} Q ${cx - 4} ${cy + 8} ${cx + 2} ${cy + 4} Q ${cx + 8} ${cy + 2} ${cx + 10} ${cy + 10} Q ${cx + 6} ${cy + 20} ${cx - 10} ${cy + 18}`} fill="#E05070" />
                <path d={`M ${cx - 20} ${cy + 2} Q ${cx} ${cy - 5} ${cx + 20} ${cy + 2}`} fill="#D4607A" stroke="#B8405A" strokeWidth="1.5" />
                <path d={`M ${cx - 20} ${cy + 20} Q ${cx} ${cy + 28} ${cx + 20} ${cy + 20}`} fill="#E07090" stroke="#B8405A" strokeWidth="1.5" />
            </svg>
        ),
        relaxed: (
            <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
                <ellipse cx={cx} cy={cy} rx={cx - 4} ry={cy - 4} fill="#FDDBB4" stroke="#E8920C" strokeWidth="2" />
                <ellipse cx={cx} cy={cy + 10} rx={cx - 18} ry={10} fill="#8B1A2A" />
                <ellipse cx={cx} cy={cy + 16} rx={14} ry={6} fill="#E05070" />
                <path d={`M ${cx - 18} ${cy + 4} Q ${cx} ${cy - 2} ${cx + 18} ${cy + 4}`} fill="#D4607A" stroke="#B8405A" strokeWidth="1.5" />
                <path d={`M ${cx - 18} ${cy + 18} Q ${cx} ${cy + 26} ${cx + 18} ${cy + 18}`} fill="#E07090" stroke="#B8405A" strokeWidth="1.5" />
            </svg>
        ),
    };

    return mouths[type] || mouths["relaxed"];
}

// ── Acceptable spoken forms for each letter (for pronunciation evaluation) ──
const ACCEPTABLE_UTTERANCES: Record<string, string[]> = {
    A: ["ah", "a", "apple", "æ"],
    B: ["buh", "b", "buhh", "ball"],
    C: ["kuh", "k", "c", "cat"],
    D: ["duh", "d", "d", "dog"],
    E: ["eh", "e", "egg"],
    F: ["fuh", "f", "fish"],
    G: ["guh", "g", "goat"],
    H: ["huh", "h", "hat"],
    I: ["ih", "i", "igloo"],
    J: ["juh", "j", "jump"],
    K: ["kuh", "k", "kite"],
    L: ["luh", "l", "lion"],
    M: ["mmm", "m", "m", "moon"],
    N: ["nnn", "n", "nest"],
    O: ["oh", "o", "orange"],
    P: ["puh", "p", "pen"],
    Q: ["kwuh", "q", "queen"],
    R: ["rrr", "r", "rain"],
    S: ["sss", "s", "sun"],
    T: ["tuh", "t", "tree"],
    U: ["uh", "u", "umbrella"],
    V: ["vvv", "v", "van"],
    W: ["wuh", "w", "water"],
    X: ["ks", "x", "fox"],
    Y: ["yuh", "y", "yellow"],
    Z: ["zzz", "z", "zebra", "buzz"], // simplified and added "buzz"
};

// ── A–Z Data (mouthType replaces mouthEmoji) ──────────────
const LETTERS: LetterData[] = [
    { l: "A", ph: "/æ/", label: "ah", vowel: true, leo: "A says /ah/ — like in Apple! Open your mouth wide!", mouthType: "wide_open", mouthTitle: "Mouth Shape: /ah/", mouthTip: "Open your mouth wide. Tongue lies flat. Say ahhhh!", steps: ["Open your mouth wide 👄", "Keep tongue flat 👅", "Say 'ahh' from your throat 🔊"] },
    { l: "B", ph: "/b/", label: "buh", vowel: false, leo: "B says /buh/ — like in Ball! Pop your lips!", mouthType: "lips_together", mouthTitle: "Mouth Shape: /buh/", mouthTip: "Press lips together tightly, then pop them open!", steps: ["Press lips together firmly", "Build up air pressure 💨", "Pop your lips open — buh! 💥"] },
    { l: "C", ph: "/k/", label: "kuh", vowel: false, leo: "C says /kuh/ — like in Cat! Back of tongue up!", mouthType: "relaxed", mouthTitle: "Mouth Shape: /kuh/", mouthTip: "Back of tongue touches roof of mouth. Air comes out fast!", steps: ["Open mouth slightly", "Raise the BACK of your tongue", "Release air quickly — kuh! 💨"] },
    { l: "D", ph: "/d/", label: "duh", vowel: false, leo: "D says /duh/ — like in Dog! Tip of tongue up!", mouthType: "lip_curl", mouthTitle: "Mouth Shape: /duh/", mouthTip: "Touch tongue tip to the ridge just behind your top front teeth.", steps: ["Touch tongue tip to top ridge 👅", "Mouth slightly open", "Say 'duh' — tongue drops 💨"] },
    { l: "E", ph: "/ɛ/", label: "eh", vowel: true, leo: "E says /eh/ — like in Egg! Mouth slightly open!", mouthType: "teeth_gap", mouthTitle: "Mouth Shape: /eh/", mouthTip: "Mouth slightly open and spread wide — like a small smile.", steps: ["Spread your lips slightly", "Keep mouth slightly open", "Say 'ehh' — like Egg 🥚"] },
    { l: "F", ph: "/f/", label: "fuh", vowel: false, leo: "F says /fuh/ — like in Fish! Teeth on lip!", mouthType: "teeth_lip", mouthTitle: "Mouth Shape: /fuh/", mouthTip: "Top teeth gently rest on bottom lip. Blow air out steadily.", steps: ["Rest top teeth on bottom lip", "Blow steady air out 💨", "Say 'fuh' — like Fish 🐟"] },
    { l: "G", ph: "/g/", label: "guh", vowel: false, leo: "G says /guh/ — like in Goat! Back of tongue up!", mouthType: "relaxed", mouthTitle: "Mouth Shape: /guh/", mouthTip: "Like C but voiced! Back of tongue touches roof — add your voice!", steps: ["Back of tongue touches roof", "Add your voice this time 🎵", "Release — guh! 💨"] },
    { l: "H", ph: "/h/", label: "huh", vowel: false, leo: "H says /huh/ — like in Hat! Just breathe out!", mouthType: "relaxed", mouthTitle: "Mouth Shape: /huh/", mouthTip: "Open your mouth and breathe out with your voice.", steps: ["Open your mouth", "Breathe out with voice 🌬️", "Say 'huh' — like a sigh"] },
    { l: "I", ph: "/ɪ/", label: "ih", vowel: true, leo: "I says /ih/ — like in Igloo! Short and quick!", mouthType: "teeth_gap", mouthTitle: "Mouth Shape: /ih/", mouthTip: "Lips spread slightly. Short, quick sound — don't hold it!", steps: ["Spread lips slightly", "Keep tongue high in mouth", "Say 'ih' — quick and short! ⚡"] },
    { l: "J", ph: "/dʒ/", label: "juh", vowel: false, leo: "J says /juh/ — like in Jump! Tongue curves up!", mouthType: "lip_curl", mouthTitle: "Mouth Shape: /juh/", mouthTip: "Tongue tip curves up behind top teeth, then releases with voice!", steps: ["Curl tongue tip upward 👅", "Touch ridge behind top teeth", "Release with voice — juh! 🎵"] },
    { l: "K", ph: "/k/", label: "kuh", vowel: false, leo: "K says /kuh/ — like in Kite! Same as C!", mouthType: "relaxed", mouthTitle: "Mouth Shape: /kuh/", mouthTip: "Same as C! Back of tongue touches roof of mouth.", steps: ["Open mouth slightly", "Raise BACK of tongue", "Release air — kuh! 💨"] },
    { l: "L", ph: "/l/", label: "luh", vowel: false, leo: "L says /luh/ — like in Lion! Tongue tip up!", mouthType: "lip_curl", mouthTitle: "Mouth Shape: /luh/", mouthTip: "Touch tongue tip to the ridge behind your top front teeth.", steps: ["Touch tongue tip to top ridge 👅", "Keep your voice on 🎵", "Say 'luh' — like Lion 🦁"] },
    { l: "M", ph: "/m/", label: "mmm", vowel: false, leo: "M says /mmm/ — like in Moon! Lips together!", mouthType: "lips_together", mouthTitle: "Mouth Shape: /mmm/", mouthTip: "Press lips together. Voice hums through your nose.", steps: ["Press lips together gently", "Let voice hum through nose", "Feel the vibration on your lips!"] },
    { l: "N", ph: "/n/", label: "nnn", vowel: false, leo: "N says /nnn/ — like in Nest! Tongue up, hum!", mouthType: "lip_curl", mouthTitle: "Mouth Shape: /nnn/", mouthTip: "Tongue touches ridge behind top teeth. Voice hums through nose.", steps: ["Touch tongue to top ridge", "Lips slightly open", "Hum through your nose — nnn"] },
    { l: "O", ph: "/ɒ/", label: "oh", vowel: true, leo: "O says /oh/ — like in Orange! Make a circle!", mouthType: "rounded", mouthTitle: "Mouth Shape: /oh/", mouthTip: "Round your lips into a circle — like blowing out a candle!", steps: ["Round your lips in a circle", "Push lips slightly forward", "Say 'ohh' — like Orange 🍊"] },
    { l: "P", ph: "/p/", label: "puh", vowel: false, leo: "P says /puh/ — like in Pen! Pop quietly!", mouthType: "lips_together", mouthTitle: "Mouth Shape: /puh/", mouthTip: "Like B but NO voice! Press lips, build air, tiny pop!", steps: ["Press lips together firmly", "No voice — silent air", "Pop lips open — puh! 💨"] },
    { l: "Q", ph: "/kw/", label: "kwuh", vowel: false, leo: "Q says /kwuh/ — like in Queen! K and W together!", mouthType: "rounded", mouthTitle: "Mouth Shape: /kwuh/", mouthTip: "Say K then quickly round your lips for W — kwuh!", steps: ["Start with K sound", "Quickly round lips for W", "Blend together — kwuh!"] },
    { l: "R", ph: "/r/", label: "rrr", vowel: false, leo: "R says /rrr/ — like in Rain! Curl tongue back!", mouthType: "lip_curl", mouthTitle: "Mouth Shape: /rrr/", mouthTip: "Curl tongue tip back slightly — don't touch anything! Lips round slightly.", steps: ["Curl tongue tip back slightly", "Don't touch the roof 🚫", "Round lips a little — rrr"] },
    { l: "S", ph: "/s/", label: "sss", vowel: false, leo: "S says /sss/ — like in Sun! Snake sound!", mouthType: "teeth_gap", mouthTitle: "Mouth Shape: /sss/", mouthTip: "Teeth almost together. Air flows through the tiny gap.", steps: ["Bring teeth almost together", "Leave tiny air gap 💨", "Blow air steadily — sss 🐍"] },
    { l: "T", ph: "/t/", label: "tuh", vowel: false, leo: "T says /tuh/ — like in Tree! Tongue tap!", mouthType: "lip_curl", mouthTitle: "Mouth Shape: /tuh/", mouthTip: "Tongue tip touches ridge behind top teeth, flicks down. No voice!", steps: ["Touch tongue to top ridge", "No voice — just air", "Flick tongue down — tuh! ⚡"] },
    { l: "U", ph: "/ʌ/", label: "uh", vowel: true, leo: "U says /uh/ — like in Umbrella! Short uh!", mouthType: "relaxed", mouthTitle: "Mouth Shape: /uh/", mouthTip: "Relaxed mouth, open slightly. The lazy vowel — just say 'uh'!", steps: ["Relax your mouth", "Open slightly — not too wide", "Say 'uh' — like Umbrella ☂️"] },
    { l: "V", ph: "/v/", label: "vvv", vowel: false, leo: "V says /vvv/ — like in Van! Like F with voice!", mouthType: "teeth_lip", mouthTitle: "Mouth Shape: /vvv/", mouthTip: "Like F but ADD your voice! Top teeth on bottom lip, blow and voice!", steps: ["Top teeth on bottom lip", "Turn your voice ON 🎵", "Blow and voice — vvv! 🚐"] },
    { l: "W", ph: "/w/", label: "wuh", vowel: false, leo: "W says /wuh/ — like in Water! Round lips!", mouthType: "rounded", mouthTitle: "Mouth Shape: /wuh/", mouthTip: "Round lips tight like you're about to kiss! Then open for 'wuh'!", steps: ["Round lips tightly — like a kiss", "Voice is on 🎵", "Open lips as you say — wuh! 💧"] },
    { l: "X", ph: "/ks/", label: "ks", vowel: false, leo: "X says /ks/ — like in Fox! K and S together!", mouthType: "teeth_gap", mouthTitle: "Mouth Shape: /ks/", mouthTip: "X is two sounds — K then S! Say them fast: 'ks'.", steps: ["Say K sound first", "Immediately follow with S", "Blend fast — ks! Like Fox 🦊"] },
    { l: "Y", ph: "/j/", label: "yuh", vowel: false, leo: "Y says /yuh/ — like in Yellow! Tongue middle!", mouthType: "teeth_gap", mouthTitle: "Mouth Shape: /yuh/", mouthTip: "Middle of tongue rises to touch roof. Lips spread slightly.", steps: ["Spread lips slightly", "Middle of tongue rises", "Say 'yuh' — like Yellow 🌼"] },
    { l: "Z", ph: "/z/", label: "zzz", vowel: false, leo: "Z says /z/ — like in Zebra! Buzz like a bee 🐝", mouthType: "teeth_gap", mouthTitle: "Mouth Shape: /zzz/", mouthTip: "Just like S but ADD your voice! Buzz like a bee.", steps: ["Teeth nearly together", "Turn voice ON 🎵", "Buzz! — zzz like a bee 🐝"] },
];

// ── Leo Speech ──────────────────────────────────────────────
function speak(text: string, onStart?: () => void, onEnd?: () => void) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.78; // slightly slower for clarity
    u.pitch = 1.1;
    if (onStart) u.onstart = onStart;
    if (onEnd) u.onend = onEnd;
    window.speechSynthesis.speak(u);
}

// ══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════
export default function AlphabetModule() {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>(1);
    const [current, setCurrent] = useState<LetterData | null>(null);
    const [mastered, setMastered] = useState<Set<string>>(new Set());
    const [feedback, setFeedback] = useState<FeedbackType>(null);
    const [leoText, setLeoText] = useState("Tap any letter to learn its sound! 🌟");
    const [leoTalking, setLeoTalking] = useState(false);
    const [recording, setRecording] = useState(false);
    const [micProgress, setMicProgress] = useState(0);
    const [soundPlaying, setSoundPlaying] = useState(false);
    const micIntervalRef = useRef<number | null>(null);
    const recognitionRef = useRef<any>(null);

    const leoSay = (text: string) => {
        setLeoText(text);
        speak(text, () => setLeoTalking(true), () => setLeoTalking(false));
    };

    // ── setupMicPanel must be defined BEFORE JSX return ──
    const setupMicPanel = () => {
        setMicProgress(0);
        setRecording(false);
        leoSay(`Now you try! Say the sound: ${current?.label}!`);
    };

    // Step 1 → 2: select letter
    const selectLetter = (item: LetterData) => {
        setCurrent(item);
        setFeedback(null);
        setStep(2);
        setSoundPlaying(true);
        setTimeout(() => { leoSay(item.leo); setSoundPlaying(false); }, 400);
    };

    // Step 2 → 3
    const goToMic = () => {
        setStep(3);
        setMicProgress(0);
        setRecording(false);
        leoSay(`Now you try! Say the sound: ${current?.label}!`);
    };

    // Step 3: recording
    const startRec = () => {
        if (!current) return;
        setRecording(true);
        setMicProgress(0);
        let pct = 0;
        micIntervalRef.current = window.setInterval(() => {
            pct = Math.min(pct + 2.5, 100);
            setMicProgress(pct);
            if (pct >= 100) { clearInterval(micIntervalRef.current!); handleStopRec(); }
        }, 80);
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SR) {
            const rec = new SR();
            rec.continuous = false; rec.interimResults = false;
            rec.onresult = (e: any) => {
                clearInterval(micIntervalRef.current!);
                const said = e.results[0][0].transcript.toLowerCase().trim();
                evalPronunciation(said);
            };
            rec.onerror = () => showMistake();
            rec.start();
            recognitionRef.current = rec;
        }
    };

    const handleStopRec = () => {
        setRecording(false);
        clearInterval(micIntervalRef.current!);
        if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch (_) { } }
        setTimeout(() => {
            if (feedback === null) Math.random() > 0.35 ? showSuccess() : showMistake();
        }, 1200);
    };

    // Enhanced pronunciation evaluation
    const evalPronunciation = (said: string) => {
        if (!current) return;

        const letter = current.l;
        const acceptable = ACCEPTABLE_UTTERANCES[letter] || [current.label, current.l.toLowerCase()];

        // Check if any acceptable utterance is a substring of what the user said
        const match = acceptable.some(utt => said.includes(utt));

        if (match) {
            showSuccess();
        } else {
            showMistake();
        }
    };

    const showSuccess = () => {
        if (!current) return;
        setMastered(prev => new Set([...prev, current.l]));
        setFeedback("success");
        setStep(4);
        leoSay(`Amazing! ${current.l} says ${current.label}! You got it perfectly! You are a star!`);
    };

    const showMistake = () => {
        if (!current) return;
        setFeedback("mistake");
        setStep(4);
        leoSay(`Almost there! Let me show you the mouth shape for ${current.ph}. ${current.mouthTip}`);
    };

    useEffect(() => {
        setTimeout(() => leoSay("Tap any letter to learn its sound! 🌟"), 600);
    }, []);

    const masteredCount = mastered.size;
    const progPct = (masteredCount / 26) * 100;

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,ital,wght@9..144,1,700;9..144,0,900&family=Lexend:wght@400;600;700;800&display=swap');
        .am-app{min-height:100vh;background:linear-gradient(180deg,#9DD4EC 0%,#B8DFF0 15%,#C8EAF5 30%,#CEEBD8 58%,#A8D4A0 100%);font-family:'Lexend',sans-serif;position:relative;overflow-x:hidden;}
        .am-sun{position:fixed;top:3%;right:4%;width:60px;height:60px;background:radial-gradient(circle at 42% 42%,#FFE566,#F5B528);border-radius:50%;box-shadow:0 0 0 12px rgba(245,181,40,.15),0 0 0 24px rgba(245,181,40,.07);animation:amSunP 4s ease-in-out infinite;pointer-events:none;z-index:1;}
        @keyframes amSunP{0%,100%{box-shadow:0 0 0 12px rgba(245,181,40,.15)}50%{box-shadow:0 0 0 20px rgba(245,181,40,.22)}}
        .am-cloud{position:fixed;background:white;border-radius:60px;opacity:.85;pointer-events:none;z-index:1;}
        .am-cloud::before,.am-cloud::after{content:'';position:absolute;background:white;border-radius:50%;}
        .am-c1{width:120px;height:38px;top:5%;left:3%;animation:amCD 20s ease-in-out infinite;}
        .am-c1::before{width:64px;height:58px;top:-26px;left:16px;}.am-c1::after{width:52px;height:46px;top:-20px;left:54px;}
        @keyframes amCD{0%,100%{transform:translateX(0)}50%{transform:translateX(16px)}}
        .am-back{position:fixed;top:14px;left:14px;z-index:200;background:rgba(255,255,255,.82);backdrop-filter:blur(10px);border:1.5px solid rgba(255,255,255,.95);border-radius:100px;padding:7px 16px;font-family:'Lexend',sans-serif;font-size:12px;font-weight:700;color:#1A3828;cursor:pointer;transition:all .2s;}
        .am-back:hover{background:white;transform:translateX(-2px);}
        .am-main{position:relative;z-index:2;max-width:960px;margin:0 auto;padding:20px 16px 80px;}
        .am-topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;padding-top:10px;}
        .am-title{font-family:'Fraunces',serif;font-size:clamp(20px,3.5vw,28px);font-weight:900;color:#1A3828;}
        .am-title span{color:#E8920C;font-style:italic;}
        .am-prog-wrap{display:flex;align-items:center;gap:10px;}
        .am-prog-lbl{font-size:12px;font-weight:700;color:#2D5040;}
        .am-prog-bar{width:100px;height:7px;background:rgba(255,255,255,.5);border-radius:100px;overflow:hidden;}
        .am-prog-fill{height:100%;background:linear-gradient(90deg,#E8920C,#F5B528);border-radius:100px;transition:width .6s ease;}
        .am-mastery{background:rgba(255,255,255,.65);backdrop-filter:blur(10px);border:1.5px solid rgba(255,255,255,.9);border-radius:14px;padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:14px;box-shadow:0 2px 12px rgba(0,0,0,.06);}
        .am-mastery-n{font-family:'Fraunces',serif;font-size:22px;font-weight:900;color:#1A3828;}
        .am-mastery-lbl{font-size:11px;font-weight:700;color:#2D5040;}
        .am-dots{display:flex;flex-wrap:wrap;gap:4px;margin-top:3px;}
        .am-dot{width:8px;height:8px;border-radius:50%;background:rgba(0,0,0,.12);}
        .am-dot-done{background:#22C55E;}
        .am-leo{background:rgba(255,255,255,.72);backdrop-filter:blur(12px);border:1.5px solid rgba(255,255,255,.9);border-radius:18px;padding:11px 16px;display:flex;align-items:center;gap:12px;margin-bottom:14px;box-shadow:0 3px 14px rgba(0,0,0,.07);}
        .am-leo-face{width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#F5A623,#E8920C);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;box-shadow:0 3px 10px rgba(232,146,12,.35);border:2px solid rgba(255,255,255,.8);}
        .am-leo-face.talking{animation:amLP .7s ease-in-out infinite;}
        @keyframes amLP{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
        .am-leo-txt{font-size:13px;font-weight:600;color:#3D2B00;line-height:1.6;flex:1;}
        .am-replay{background:rgba(232,146,12,.15);border:1.5px solid rgba(232,146,12,.3);border-radius:100px;padding:5px 12px;font-size:11px;font-weight:800;color:#92400E;cursor:pointer;white-space:nowrap;font-family:'Lexend',sans-serif;}
        .am-steps{display:flex;align-items:center;gap:0;margin-bottom:16px;background:rgba(255,255,255,.6);backdrop-filter:blur(8px);border:1.5px solid rgba(255,255,255,.9);border-radius:14px;padding:9px 14px;box-shadow:0 2px 10px rgba(0,0,0,.06);}
        .am-step{display:flex;align-items:center;gap:6px;flex:1;}
        .am-sdot{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0;transition:all .3s;}
        .am-sdot-done{background:#22C55E;color:white;}
        .am-sdot-active{background:linear-gradient(135deg,#E8920C,#F5B528);color:white;animation:amSP 2s ease-in-out infinite;}
        @keyframes amSP{0%,100%{box-shadow:0 2px 8px rgba(232,146,12,.45)}50%{box-shadow:0 2px 16px rgba(232,146,12,.7)}}
        .am-sdot-pending{background:rgba(255,255,255,.5);color:#9CA3AF;border:1.5px solid rgba(0,0,0,.1);}
        .am-slbl{font-size:10.5px;font-weight:700;color:#2D5040;}
        .am-slbl-active{color:#92400E;}
        .am-slbl-pending{color:#9CA3AF;}
        .am-sdiv{width:20px;height:2px;background:rgba(0,0,0,.1);border-radius:2px;flex-shrink:0;}
        /* GRID */
        .am-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(66px,1fr));gap:9px;background:rgba(255,255,255,.65);backdrop-filter:blur(10px);border:1.5px solid rgba(255,255,255,.9);border-radius:22px;padding:18px;box-shadow:0 4px 22px rgba(0,0,0,.08);}
        .am-tile{border-radius:14px;padding:9px 5px;text-align:center;cursor:pointer;transition:all .22s cubic-bezier(.34,1.4,.64,1);border:2px solid transparent;position:relative;}
        .am-tile:hover{transform:scale(1.13) translateY(-3px);box-shadow:0 8px 18px rgba(0,0,0,.14);}
        .am-tile-vowel{background:linear-gradient(135deg,#FEF3C7,#FDE68A);border-color:#F5D78A;}
        .am-tile-con{background:linear-gradient(135deg,#DBEAFE,#BFDBFE);border-color:#93C5FD;}
        .am-tile-mastered{border-color:#22C55E !important;box-shadow:0 0 0 2px rgba(34,197,94,.3);}
        .am-tile-check{position:absolute;top:-5px;right:-5px;width:16px;height:16px;background:#22C55E;border-radius:50%;font-size:9px;color:white;display:flex;align-items:center;justify-content:center;font-weight:800;line-height:1;}
        .am-tu{font-family:'Fraunces',serif;font-size:24px;font-weight:900;line-height:1;color:#1A3828;}
        .am-tl{font-size:12px;font-weight:700;color:#4B5563;}
        .am-tph{font-size:8px;font-weight:600;color:#9CA3AF;margin-top:1px;}
        /* ZOOM */
        .am-zoom-stage{background:rgba(255,255,255,.75);backdrop-filter:blur(14px);border:2px solid rgba(255,255,255,.95);border-radius:26px;padding:28px 20px;margin-bottom:18px;box-shadow:0 6px 30px rgba(0,0,0,.1);text-align:center;position:relative;overflow:hidden;}
        .am-zoom-pair{display:flex;align-items:center;justify-content:center;gap:28px;margin-bottom:8px;}
        .am-zoom-col{display:flex;flex-direction:column;align-items:center;}
        .am-zoom-case{font-size:10px;font-weight:700;color:#9CA3AF;margin-bottom:4px;}
        .am-zoom-letter{font-family:'Fraunces',serif;font-weight:900;line-height:1;animation:amZI .5s cubic-bezier(.34,1.4,.64,1) both;}
        @keyframes amZI{from{opacity:0;transform:scale(0.3) rotate(-10deg)}to{opacity:1;transform:scale(1) rotate(0deg)}}
        .am-zoom-vowel{color:#D97706;}.am-zoom-con{color:#2563EB;}
        .am-zoom-ph{display:inline-block;background:rgba(232,146,12,.12);border:1.5px solid rgba(232,146,12,.3);border-radius:100px;padding:5px 16px;font-size:15px;font-weight:800;color:#92400E;margin:8px auto 4px;font-family:'Fraunces',serif;}
        .am-zoom-leo{font-size:13px;font-weight:600;color:#3D2B00;font-style:italic;}
        .am-wave{display:flex;align-items:center;justify-content:center;gap:4px;height:28px;margin:8px auto;}
        .am-wbar{width:4px;border-radius:100px;background:linear-gradient(180deg,#E8920C,#F5B528);animation:amW 1s ease-in-out infinite;}
        .am-wbar:nth-child(1){height:7px;}.am-wbar:nth-child(2){height:14px;animation-delay:.1s;}.am-wbar:nth-child(3){height:22px;animation-delay:.2s;}.am-wbar:nth-child(4){height:14px;animation-delay:.3s;}.am-wbar:nth-child(5){height:7px;animation-delay:.4s;}
        @keyframes amW{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.9)}}
        /* MIC */
        .am-mic-panel{text-align:center;background:rgba(255,255,255,.65);backdrop-filter:blur(10px);border:1.5px solid rgba(255,255,255,.9);border-radius:24px;padding:28px 20px;box-shadow:0 4px 22px rgba(0,0,0,.08);}
        .am-mic-ltr{font-family:'Fraunces',serif;font-size:68px;font-weight:900;color:#1A3828;margin-bottom:4px;}
        .am-mic-ph{display:inline-block;background:rgba(232,146,12,.12);border:1.5px solid rgba(232,146,12,.3);border-radius:100px;padding:4px 14px;font-size:13px;font-weight:800;color:#92400E;margin-bottom:18px;}
        .am-mic-hint{font-size:13px;font-weight:600;color:#2D5040;background:rgba(255,255,255,.6);border-radius:12px;padding:8px 18px;display:inline-block;margin-bottom:22px;}
        .am-mic-btn{width:84px;height:84px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:34px;background:linear-gradient(135deg,#E8920C,#D97706);box-shadow:0 6px 22px rgba(232,146,12,.5);color:white;transition:all .2s;position:relative;margin:0 auto 12px;}
        .am-mic-btn:hover{transform:scale(1.08);}
        .am-mic-btn.rec{background:linear-gradient(135deg,#DC2626,#B91C1C);animation:amRec 1s ease-in-out infinite;}
        @keyframes amRec{0%,100%{box-shadow:0 6px 22px rgba(220,38,38,.5),0 0 0 0 rgba(220,38,38,.4)}50%{box-shadow:0 6px 22px rgba(220,38,38,.5),0 0 0 14px rgba(220,38,38,0)}}
        .am-mic-status{font-size:13px;font-weight:700;color:#6B7280;margin-bottom:12px;}
        .am-mic-status.rec{color:#DC2626;}
        .am-mic-prog{width:180px;height:6px;background:rgba(0,0,0,.08);border-radius:100px;overflow:hidden;margin:0 auto;}
        .am-mic-pfill{height:100%;background:linear-gradient(90deg,#E8920C,#F5B528);border-radius:100px;transition:width .1s linear;}
        /* SUCCESS */
        .am-success{text-align:center;background:rgba(255,255,255,.75);backdrop-filter:blur(12px);border:2px solid rgba(255,255,255,.95);border-radius:26px;padding:28px 20px;box-shadow:0 6px 30px rgba(0,0,0,.1);}
        .am-star-burst{font-size:48px;margin-bottom:6px;animation:amSB .6s cubic-bezier(.34,1.6,.64,1) both;}
        @keyframes amSB{from{opacity:0;transform:scale(0)}to{opacity:1;transform:scale(1)}}
        .am-s-title{font-family:'Fraunces',serif;font-size:26px;font-weight:900;color:#1A3828;margin-bottom:4px;}
        .am-s-sub{font-size:13.5px;font-weight:600;color:#2D5040;margin-bottom:16px;}
        .am-coins{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#FEF3C7,#FDE68A);border:1.5px solid #F5D78A;border-radius:100px;padding:7px 18px;font-size:14px;font-weight:800;color:#92400E;margin-bottom:20px;}
        .am-next-btn{background:linear-gradient(135deg,#22C55E,#16A34A);color:white;border:none;border-radius:16px;padding:15px 44px;font-family:'Lexend',sans-serif;font-size:16px;font-weight:800;cursor:pointer;animation:amGlow 2s ease-in-out infinite;}
        @keyframes amGlow{0%,100%{box-shadow:0 6px 18px rgba(34,197,94,.4),0 0 0 0 rgba(34,197,94,.3)}50%{box-shadow:0 10px 26px rgba(34,197,94,.5),0 0 0 10px rgba(34,197,94,0)}}
        /* MISTAKE / MOUTH CARD */
        .am-mistake{text-align:center;}
        .am-enc{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.7);border-radius:14px;padding:10px 14px;margin-bottom:14px;}
        .am-enc-leo{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#F5A623,#E8920C);display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;}
        .am-enc-txt{font-size:13px;font-weight:600;color:#3D2B00;line-height:1.5;text-align:left;}
        .am-mouth-card{background:rgba(255,255,255,.88);backdrop-filter:blur(12px);border:2px solid rgba(255,200,100,.4);border-radius:22px;padding:22px;margin-bottom:14px;box-shadow:0 4px 22px rgba(0,0,0,.1);}
        .am-mouth-svg{display:flex;justify-content:center;margin-bottom:10px;}
        .am-mouth-title{font-family:'Fraunces',serif;font-size:18px;font-weight:800;color:#1A3828;margin-bottom:6px;}
        .am-mouth-tip{font-size:13px;font-weight:600;color:#4B5563;line-height:1.7;background:rgba(254,243,199,.6);border-radius:10px;padding:9px 14px;margin:8px 0;}
        .am-step-list{display:flex;flex-direction:column;gap:8px;text-align:left;margin-top:10px;}
        .am-step-row{display:flex;align-items:flex-start;gap:9px;font-size:13px;font-weight:600;color:#374151;}
        .am-step-n{width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#E8920C,#F5B528);color:white;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;}
        .am-try-btn{background:linear-gradient(135deg,#E8920C,#D97706);color:white;border:none;border-radius:14px;padding:13px 36px;font-family:'Lexend',sans-serif;font-size:14px;font-weight:800;cursor:pointer;box-shadow:0 4px 14px rgba(232,146,12,.4);}
        /* NAV BTNS */
        .am-nav{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:14px;flex-wrap:wrap;}
        .am-nbtn{background:rgba(255,255,255,.8);border:1.5px solid rgba(0,0,0,.1);border-radius:100px;padding:8px 18px;font-family:'Lexend',sans-serif;font-size:12px;font-weight:700;color:#1A3828;cursor:pointer;transition:all .2s;}
        .am-nbtn:hover{background:white;box-shadow:0 3px 10px rgba(0,0,0,.1);}
        .am-nbtn-primary{background:linear-gradient(135deg,#E8920C,#D97706);color:white;border-color:transparent;box-shadow:0 4px 12px rgba(232,146,12,.4);}
        .am-nbtn-primary:hover{transform:translateY(-1px);box-shadow:0 7px 18px rgba(232,146,12,.5);}
        /* LEGEND */
        .am-legend{display:flex;gap:14px;justify-content:center;margin-top:12px;flex-wrap:wrap;}
        .am-legend-item{display:flex;align-items:center;gap:5px;font-size:11.5px;font-weight:700;color:#2D5040;}
        .am-legend-dot{width:11px;height:11px;border-radius:3px;}
      `}</style>

            <div className="am-app">
                <div className="am-sun" />
                <div className="am-cloud am-c1" />

                <button className="am-back" onClick={() => navigate("/learningmodule")}>← Learning Cove</button>

                <div className="am-main">
                    {/* Top bar */}
                    <div className="am-topbar">
                        <h1 className="am-title">Alphabet <span>Module</span></h1>
                        <div className="am-prog-wrap">
                            <span className="am-prog-lbl">{masteredCount} / 26</span>
                            <div className="am-prog-bar">
                                <div className="am-prog-fill" style={{ width: `${progPct}%` }} />
                            </div>
                        </div>
                    </div>

                    {/* Mastery tracker */}
                    <div className="am-mastery">
                        <div>
                            <div className="am-mastery-n">{masteredCount}</div>
                            <div className="am-mastery-lbl">Letters Mastered</div>
                        </div>
                        <div className="am-dots">
                            {LETTERS.map(l => (
                                <div key={l.l} className={`am-dot${mastered.has(l.l) ? " am-dot-done" : ""}`} title={l.l} />
                            ))}
                        </div>
                    </div>

                    {/* Leo card */}
                    <div className="am-leo">
                        <div className={`am-leo-face${leoTalking ? " talking" : ""}`}>🦁</div>
                        <div className="am-leo-txt">{leoText}</div>
                        <button className="am-replay" onClick={() => leoSay(leoText)}>🔊 Replay</button>
                    </div>

                    {/* Step indicator */}
                    <div className="am-steps">
                        {[{ n: 1, lbl: "Pick Letter" }, { n: 2, lbl: "Zoom & Sound" }, { n: 3, lbl: "Echo Mic" }, { n: 4, lbl: "Feedback" }].map((s, i) => (
                            <div key={s.n} className="am-step" style={{ flex: 1 }}>
                                {i > 0 && <div className="am-sdiv" />}
                                <div className={`am-sdot ${step > s.n ? "am-sdot-done" : step === s.n ? "am-sdot-active" : "am-sdot-pending"}`}>
                                    {step > s.n ? "✓" : s.n}
                                </div>
                                <div className={`am-slbl ${step === s.n ? "am-slbl-active" : step < s.n ? "am-slbl-pending" : ""}`}>
                                    {s.lbl}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── STEP 1: GRID ── */}
                    {step === 1 && (
                        <div>
                            <div style={{ textAlign: "center", marginBottom: 14 }}>
                                <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 800, color: "#1A3828" }}>Choose a Letter 🔤</h2>
                                <p style={{ fontSize: 13, color: "#2D5040", fontWeight: 500 }}>Tap any letter to learn its sound!</p>
                            </div>
                            <div className="am-grid">
                                {LETTERS.map((item, i) => (
                                    <div
                                        key={item.l}
                                        className={`am-tile ${item.vowel ? "am-tile-vowel" : "am-tile-con"}${mastered.has(item.l) ? " am-tile-mastered" : ""}`}
                                        style={{ animationDelay: `${i * 0.03}s` }}
                                        onClick={() => selectLetter(item)}
                                    >
                                        {mastered.has(item.l) && <div className="am-tile-check">✓</div>}
                                        <div className="am-tu">{item.l}</div>
                                        <div className="am-tl">{item.l.toLowerCase()}</div>
                                        <div className="am-tph">{item.ph}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="am-legend">
                                <div className="am-legend-item"><div className="am-legend-dot" style={{ background: "linear-gradient(135deg,#FEF3C7,#FDE68A)", border: "1.5px solid #F5D78A" }} />Vowels</div>
                                <div className="am-legend-item"><div className="am-legend-dot" style={{ background: "linear-gradient(135deg,#DBEAFE,#BFDBFE)", border: "1.5px solid #93C5FD" }} />Consonants</div>
                                <div className="am-legend-item"><div className="am-legend-dot" style={{ background: "#22C55E" }} />Mastered ✓</div>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2: ZOOM ── */}
                    {step === 2 && current && (
                        <div className="am-zoom-stage">
                            <div className="am-zoom-pair">
                                {[{ label: "UPPERCASE", letter: current.l, size: "clamp(90px,14vw,120px)" }, { label: "lowercase", letter: current.l.toLowerCase(), size: "clamp(64px,10vw,90px)" }].map(z => (
                                    <div key={z.label} className="am-zoom-col">
                                        <div className="am-zoom-case">{z.label}</div>
                                        <span className={`am-zoom-letter ${current.vowel ? "am-zoom-vowel" : "am-zoom-con"}`} style={{ fontSize: z.size }}>{z.letter}</span>
                                    </div>
                                ))}
                            </div>
                            {soundPlaying && (
                                <div className="am-wave">
                                    {[0, 1, 2, 3, 4].map(i => <div key={i} className="am-wbar" />)}
                                </div>
                            )}
                            <div className="am-zoom-ph">{current.ph}</div>
                            <div className="am-zoom-leo">"{current.l} says {current.label}!"</div>
                            <div className="am-nav">
                                <button className="am-nbtn" onClick={() => setStep(1)}>← Back</button>
                                <button className="am-nbtn am-nbtn-primary" onClick={goToMic}>🎙️ Now You Try!</button>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 3: MIC ── */}
                    {step === 3 && current && (
                        <div className="am-mic-panel">
                            <div className="am-mic-ltr" style={{ color: current.vowel ? "#D97706" : "#2563EB" }}>{current.l}</div>
                            <div className="am-mic-ph">{current.ph} — "{current.label}"</div>
                            <div className="am-mic-hint">🎙️ Press & hold the mic, then say the sound!</div>
                            <button
                                className={`am-mic-btn${recording ? " rec" : ""}`}
                                onMouseDown={startRec} onMouseUp={handleStopRec}
                                onTouchStart={startRec} onTouchEnd={handleStopRec}
                            >
                                {recording ? "🔴" : "🎙️"}
                            </button>
                            <div className={`am-mic-status${recording ? " rec" : ""}`}>
                                {recording ? "Recording..." : "Hold to speak"}
                            </div>
                            <div className="am-mic-prog">
                                <div className="am-mic-pfill" style={{ width: `${micProgress}%` }} />
                            </div>
                            <div className="am-nav" style={{ marginTop: 20 }}>
                                <button className="am-nbtn" onClick={() => { setStep(2); leoSay(current.leo); }}>← Hear Again</button>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 4A: SUCCESS ── */}
                    {step === 4 && feedback === "success" && current && (
                        <div className="am-success">
                            <div className="am-star-burst">⭐🌟⭐</div>
                            <h2 className="am-s-title">Perfect! 🎉</h2>
                            <p className="am-s-sub">You said <strong>"{current.l} {current.ph}"</strong> perfectly!</p>
                            <div className="am-coins">☀️ +10 Sun Coins earned!</div>
                            <div className="am-leo" style={{ margin: "0 0 20px", textAlign: "left" }}>
                                <div className={`am-leo-face${leoTalking ? " talking" : ""}`}>🦁</div>
                                <div className="am-leo-txt">{leoText}</div>
                            </div>
                            <button className="am-next-btn" onClick={() => { setStep(1); setCurrent(null); setFeedback(null); }}>
                                Next Letter →
                            </button>
                        </div>
                    )}

                    {step === 4 && feedback === "mistake" && current && (
                        <div className="am-mistake">
                            <div className="am-enc">
                                <div className="am-enc-leo">🦁</div>
                                <div className="am-enc-txt">Almost there! Let me show you the mouth shape for <strong>{current.ph}</strong>!</div>
                            </div>
                            <div className="am-mouth-card">
                                <div className="am-mouth-svg">
                                    <MouthSVG type={current.mouthType} size={90} />
                                </div>
                                <h3 className="am-mouth-title">{current.mouthTitle}</h3>
                                <div className="am-mouth-tip">{current.mouthTip}</div>
                                <div className="am-step-list">
                                    {current.steps.map((s, i) => (
                                        <div key={i} className="am-step-row">
                                            <div className="am-step-n">{i + 1}</div>
                                            <span>{s}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <button className="am-try-btn" onClick={() => { setFeedback(null); setStep(3); setupMicPanel(); }}>
                                🎙️ Try Again!
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </>
    );
}