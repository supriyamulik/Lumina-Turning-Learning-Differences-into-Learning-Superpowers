// frontend/src/hooks/useLeoSpeech.ts
// ─────────────────────────────────────────────────────────────
// Shared speech hook used by every Lumina activity screen.
// Handles voice selection, rate/pitch per content type,
// and queuing so Leo never speaks over himself.
// ─────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from 'react';

// ─── Speech rate presets (research-based for dyslexic children) ──
export const SPEECH_RATE = {
    word: 0.62,   // reading a target word — slow, every phoneme clear
    choices: 0.68,   // reading answer options
    instruction: 0.75,   // "Which sound do you hear…"
    praise: 0.80,   // "Amazing! You got it!"
    hint: 0.70,   // hint explanation — patient
    results: 0.82,   // end-of-session summary — upbeat
    navigation: 0.78,   // button labels on hover
} as const;

export type SpeechRateKey = keyof typeof SPEECH_RATE;

// ─── Voice picker — priority order for child-friendliness ────
function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    const priority = [
        (v: SpeechSynthesisVoice) => v.name === 'Daniel',                                    // en-GB, warm male
        (v: SpeechSynthesisVoice) => v.name === 'Karen',                                     // en-AU, clear female
        (v: SpeechSynthesisVoice) => v.name === 'Moira',                                     // en-IE, soft female
        (v: SpeechSynthesisVoice) => v.name === 'Samantha',                                  // en-US, clear female
        (v: SpeechSynthesisVoice) => v.name.includes('Google UK English Female'),             // Chrome
        (v: SpeechSynthesisVoice) => v.name.includes('Google UK English Male'),               // Chrome
        (v: SpeechSynthesisVoice) => v.lang === 'en-GB' && v.localService,                   // any local GB
        (v: SpeechSynthesisVoice) => v.lang === 'en-AU' && v.localService,                   // any local AU
        (v: SpeechSynthesisVoice) => v.lang.startsWith('en') && v.localService,              // any local English
        (v: SpeechSynthesisVoice) => v.lang.startsWith('en'),                                // any English
    ];
    for (const test of priority) {
        const found = voices.find(test);
        if (found) return found;
    }
    return voices[0] ?? null;
}

// ─── Queue item ───────────────────────────────────────────────
interface QueueItem {
    text: string;
    rate: number;
    pitch: number;
    onEnd?: () => void;
}

// ═════════════════════════════════════════════════════════════
// HOOK
// ═════════════════════════════════════════════════════════════
export function useLeoSpeech() {
    const [talking, setTalking] = useState(false);
    const [ready, setReady] = useState(false);
    const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
    const queueRef = useRef<QueueItem[]>([]);
    const speakingRef = useRef(false);

    // ── Load voices ──
    useEffect(() => {
        const load = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                voiceRef.current = pickVoice(voices);
                setReady(true);
            }
        };
        load();
        window.speechSynthesis.onvoiceschanged = load;
        return () => { window.speechSynthesis.cancel(); };
    }, []);

    // ── Internal: speak one item then drain queue ──
    const drainQueue = useCallback(() => {
        if (speakingRef.current || queueRef.current.length === 0) return;
        const item = queueRef.current.shift()!;
        speakingRef.current = true;
        setTalking(true);

        const utt = new SpeechSynthesisUtterance(item.text);
        utt.rate = item.rate;
        utt.pitch = item.pitch;
        utt.volume = 1;
        if (voiceRef.current) utt.voice = voiceRef.current;

        utt.onend = () => {
            speakingRef.current = false;
            setTalking(queueRef.current.length > 0);
            item.onEnd?.();
            drainQueue();
        };
        utt.onerror = () => {
            speakingRef.current = false;
            setTalking(false);
            drainQueue();
        };

        window.speechSynthesis.speak(utt);
    }, []);

    // ── Public: cancel everything ──
    const cancel = useCallback(() => {
        window.speechSynthesis.cancel();
        queueRef.current = [];
        speakingRef.current = false;
        setTalking(false);
    }, []);

    // ── Public: speak one utterance (cancels current, clears queue) ──
    const say = useCallback((
        text: string,
        rateKey: SpeechRateKey = 'instruction',
        onEnd?: () => void,
    ) => {
        cancel();
        queueRef.current = [{ text, rate: SPEECH_RATE[rateKey], pitch: 1.08, onEnd }];
        // tiny delay so cancel() has time to flush
        setTimeout(drainQueue, 60);
    }, [cancel, drainQueue]);

    // ── Public: queue multiple utterances in sequence ──
    const sayAll = useCallback((
        items: Array<{ text: string; rateKey?: SpeechRateKey; onEnd?: () => void; pauseAfterMs?: number }>,
    ) => {
        cancel();
        // Build queue — insert silence pauses using empty utterances with short text
        const queue: QueueItem[] = [];
        for (const item of items) {
            queue.push({
                text: item.text,
                rate: SPEECH_RATE[item.rateKey ?? 'instruction'],
                pitch: 1.08,
                onEnd: item.onEnd,
            });
            // simulate pause by inserting a near-silent breath
            if (item.pauseAfterMs && item.pauseAfterMs > 0) {
                queue.push({ text: '.', rate: 0.1, pitch: 1 });
            }
        }
        queueRef.current = queue;
        setTimeout(drainQueue, 60);
    }, [cancel, drainQueue]);

    // ── Public: speak on hover (for choice buttons) ──
    // Debounced — only fires if hovered for 120ms to avoid accidental reads
    const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const speakOnHover = useCallback((text: string, rateKey: SpeechRateKey = 'choices') => {
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = setTimeout(() => {
            say(text, rateKey);
        }, 120);
    }, [say]);

    const cancelHover = useCallback(() => {
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    }, []);

    return { say, sayAll, cancel, speakOnHover, cancelHover, talking, ready };
}