// frontend/src/pages/activities/WordSort.tsx
// Route:  /island/:id/word_sort
// Flow:   Flashcard → WordSort → /island/:id/blending
//
// ACTIVITY: Drag words into the correct sound category bucket
// ACCESSIBILITY:
//  • Leo speaks all instructions + word + category prompt automatically
//  • Each word spoken on hover/focus (120ms debounce)
//  • Keyboard: Tab to select word, Tab to bucket, Enter/Space to drop
//  • No timers. Gentle shake on wrong. Praise on correct.
//  • OpenDyslexic on all word text, min 20px
//  • Leo badge = warm amber circle with 🦁 (matches uploaded icon style)

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { progressApi } from '../../lib/api';
import { useLeoSpeech } from '../../hooks/useLeoSpeech';

// ── Types ──────────────────────────────────────────────────────
interface SortWord {
    id: string;
    word: string;
    correctBucket: string;
    spokenHint: string;     // what Leo says on hover
}
interface Bucket {
    id: string;
    label: string;          // visual label e.g. "/k/"
    spokenLabel: string;    // what Leo says for this bucket
    example: string;        // small example word shown in bucket
}
interface Round {
    instruction: string;    // what Leo says at start
    buckets: Bucket[];
    words: SortWord[];
}

// ── Island meta ────────────────────────────────────────────────
const ISLAND_META: Record<number, {
    name: string; emoji: string;
    color: string; colorDark: string; colorPale: string;
}> = {
    1: { name: 'Whispering Palms', emoji: '🌴', color: '#2D8B7E', colorDark: '#1E6B5E', colorPale: '#E3F4F1' },
    2: { name: 'Rabbit Rapids', emoji: '🐇', color: '#4A90C4', colorDark: '#2E6FA0', colorPale: '#E3F0FA' },
    3: { name: 'Echo Caves', emoji: '🦇', color: '#7B5EA7', colorDark: '#5A3E86', colorPale: '#EDE8F8' },
    4: { name: 'Sunlight Glade', emoji: '☀️', color: '#E8920C', colorDark: '#B36A00', colorPale: '#FEF3DC' },
    5: { name: 'Morpho Mountain', emoji: '🦋', color: '#D4607A', colorDark: '#A8354F', colorPale: '#FCEEF1' },
};

// ── Per-island word sort content ───────────────────────────────
const ISLAND_ROUNDS: Record<number, Round[]> = {
    // Island 1: Phonological Awareness — sort by starting sound
    1: [
        {
            instruction: 'Sort each word into the bucket that matches its starting sound. Listen to each word and think about the very first sound you hear.',
            buckets: [
                { id: 's', label: '/s/', spokenLabel: 'the s sound', example: 'sun' },
                { id: 'm', label: '/m/', spokenLabel: 'the m sound', example: 'moon' },
                { id: 'p', label: '/p/', spokenLabel: 'the p sound', example: 'pot' },
            ],
            words: [
                { id: 'w1', word: 'sit', correctBucket: 's', spokenHint: 'sit — what sound does it start with?' },
                { id: 'w2', word: 'map', correctBucket: 'm', spokenHint: 'map — what is the very first sound?' },
                { id: 'w3', word: 'pen', correctBucket: 'p', spokenHint: 'pen — listen to the start' },
                { id: 'w4', word: 'sock', correctBucket: 's', spokenHint: 'sock — does it start like sun?' },
                { id: 'w5', word: 'mud', correctBucket: 'm', spokenHint: 'mud — does it start like moon?' },
                { id: 'w6', word: 'pig', correctBucket: 'p', spokenHint: 'pig — does it start like pot?' },
            ],
        },
        {
            instruction: 'Now sort by ending sound. Listen carefully to the last sound in each word.',
            buckets: [
                { id: 't', label: '/t/', spokenLabel: 'the t sound at the end', example: 'cat' },
                { id: 'n', label: '/n/', spokenLabel: 'the n sound at the end', example: 'sun' },
                { id: 'g', label: '/g/', spokenLabel: 'the g sound at the end', example: 'bag' },
            ],
            words: [
                { id: 'w7', word: 'hot', correctBucket: 't', spokenHint: 'hot — what is the last sound?' },
                { id: 'w8', word: 'man', correctBucket: 'n', spokenHint: 'man — listen to the end' },
                { id: 'w9', word: 'bug', correctBucket: 'g', spokenHint: 'bug — what comes last?' },
                { id: 'w10', word: 'sit', correctBucket: 't', spokenHint: 'sit — does it end like cat?' },
                { id: 'w11', word: 'pin', correctBucket: 'n', spokenHint: 'pin — does it end like sun?' },
                { id: 'w12', word: 'wig', correctBucket: 'g', spokenHint: 'wig — does it end like bag?' },
            ],
        },
    ],

    // Island 2: CVC Phonics — sort by vowel sound
    2: [
        {
            instruction: 'Each word has a vowel in the middle. Sort the words into the bucket that matches the vowel sound you hear.',
            buckets: [
                { id: 'a', label: 'short a', spokenLabel: 'short a, like in cat', example: 'cat' },
                { id: 'i', label: 'short i', spokenLabel: 'short i, like in sit', example: 'sit' },
                { id: 'o', label: 'short o', spokenLabel: 'short o, like in hot', example: 'hot' },
            ],
            words: [
                { id: 'w1', word: 'bag', correctBucket: 'a', spokenHint: 'bag — what vowel is in the middle?' },
                { id: 'w2', word: 'lip', correctBucket: 'i', spokenHint: 'lip — listen to the middle sound' },
                { id: 'w3', word: 'top', correctBucket: 'o', spokenHint: 'top — short a, i, or o?' },
                { id: 'w4', word: 'mad', correctBucket: 'a', spokenHint: 'mad — does it sound like cat?' },
                { id: 'w5', word: 'dig', correctBucket: 'i', spokenHint: 'dig — does it sound like sit?' },
                { id: 'w6', word: 'dot', correctBucket: 'o', spokenHint: 'dot — does it sound like hot?' },
            ],
        },
        {
            instruction: 'Now sort these words. Listen for the short e and short u sounds in the middle.',
            buckets: [
                { id: 'e', label: 'short e', spokenLabel: 'short e, like in bed', example: 'bed' },
                { id: 'u', label: 'short u', spokenLabel: 'short u, like in bug', example: 'bug' },
                { id: 'a', label: 'short a', spokenLabel: 'short a, like in cat', example: 'cat' },
            ],
            words: [
                { id: 'w7', word: 'net', correctBucket: 'e', spokenHint: 'net — listen to the middle' },
                { id: 'w8', word: 'cup', correctBucket: 'u', spokenHint: 'cup — short e or short u?' },
                { id: 'w9', word: 'fan', correctBucket: 'a', spokenHint: 'fan — which vowel?' },
                { id: 'w10', word: 'peg', correctBucket: 'e', spokenHint: 'peg — does it sound like bed?' },
                { id: 'w11', word: 'bun', correctBucket: 'u', spokenHint: 'bun — does it sound like bug?' },
                { id: 'w12', word: 'cap', correctBucket: 'a', spokenHint: 'cap — does it sound like cat?' },
            ],
        },
    ],

    // Island 3: Digraphs & Blends — sort by starting digraph/blend
    3: [
        {
            instruction: 'These words start with two letters that make one sound together. Sort each word into the correct digraph bucket.',
            buckets: [
                { id: 'sh', label: 'sh', spokenLabel: 's h, like in ship', example: 'ship' },
                { id: 'ch', label: 'ch', spokenLabel: 'c h, like in chin', example: 'chin' },
                { id: 'th', label: 'th', spokenLabel: 't h, like in thin', example: 'thin' },
            ],
            words: [
                { id: 'w1', word: 'shop', correctBucket: 'sh', spokenHint: 'shop — which two letters start this word?' },
                { id: 'w2', word: 'chip', correctBucket: 'ch', spokenHint: 'chip — listen to the very start' },
                { id: 'w3', word: 'this', correctBucket: 'th', spokenHint: 'this — sh, ch, or th?' },
                { id: 'w4', word: 'shed', correctBucket: 'sh', spokenHint: 'shed — does it start like ship?' },
                { id: 'w5', word: 'chop', correctBucket: 'ch', spokenHint: 'chop — does it start like chin?' },
                { id: 'w6', word: 'thank', correctBucket: 'th', spokenHint: 'thank — does it start like thin?' },
            ],
        },
        {
            instruction: 'Now sort by starting blend. A blend is when two consonants work together but you can still hear both sounds.',
            buckets: [
                { id: 'fl', label: 'fl', spokenLabel: 'f l blend, like in flag', example: 'flag' },
                { id: 'gr', label: 'gr', spokenLabel: 'g r blend, like in grass', example: 'grass' },
                { id: 'st', label: 'st', spokenLabel: 's t blend, like in stop', example: 'stop' },
            ],
            words: [
                { id: 'w7', word: 'flat', correctBucket: 'fl', spokenHint: 'flat — which blend starts this?' },
                { id: 'w8', word: 'grin', correctBucket: 'gr', spokenHint: 'grin — fl, gr, or st?' },
                { id: 'w9', word: 'stem', correctBucket: 'st', spokenHint: 'stem — listen to the beginning' },
                { id: 'w10', word: 'flip', correctBucket: 'fl', spokenHint: 'flip — does it start like flag?' },
                { id: 'w11', word: 'grab', correctBucket: 'gr', spokenHint: 'grab — does it start like grass?' },
                { id: 'w12', word: 'step', correctBucket: 'st', spokenHint: 'step — does it start like stop?' },
            ],
        },
    ],

    // Island 4: Long Vowels — sort by vowel spelling pattern
    4: [
        {
            instruction: 'These words all have a long a sound — the letter a says its own name. Sort them by which spelling pattern makes the long a sound.',
            buckets: [
                { id: 'a_e', label: 'a__e', spokenLabel: 'magic e pattern, like in cake', example: 'cake' },
                { id: 'ai', label: 'ai', spokenLabel: 'a i together, like in rain', example: 'rain' },
                { id: 'ay', label: 'ay', spokenLabel: 'a y together, like in play', example: 'play' },
            ],
            words: [
                { id: 'w1', word: 'made', correctBucket: 'a_e', spokenHint: 'made — how is the long a spelled here?' },
                { id: 'w2', word: 'tail', correctBucket: 'ai', spokenHint: 'tail — which pattern do you see?' },
                { id: 'w3', word: 'stay', correctBucket: 'ay', spokenHint: 'stay — a__e, ai, or ay?' },
                { id: 'w4', word: 'bake', correctBucket: 'a_e', spokenHint: 'bake — does it use the magic e?' },
                { id: 'w5', word: 'paid', correctBucket: 'ai', spokenHint: 'paid — does it use a i together?' },
                { id: 'w6', word: 'clay', correctBucket: 'ay', spokenHint: 'clay — does it use a y together?' },
            ],
        },
        {
            instruction: 'Now sort words with the long e and long i sounds by their spelling patterns.',
            buckets: [
                { id: 'ee', label: 'ee', spokenLabel: 'e e together, like in feet', example: 'feet' },
                { id: 'ea', label: 'ea', spokenLabel: 'e a together, like in leaf', example: 'leaf' },
                { id: 'i_e', label: 'i__e', spokenLabel: 'magic e with i, like in kite', example: 'kite' },
            ],
            words: [
                { id: 'w7', word: 'tree', correctBucket: 'ee', spokenHint: 'tree — e e or e a?' },
                { id: 'w8', word: 'team', correctBucket: 'ea', spokenHint: 'team — which long e spelling?' },
                { id: 'w9', word: 'mine', correctBucket: 'i_e', spokenHint: 'mine — is there a magic e?' },
                { id: 'w10', word: 'seed', correctBucket: 'ee', spokenHint: 'seed — does it use e e?' },
                { id: 'w11', word: 'read', correctBucket: 'ea', spokenHint: 'read — does it use e a?' },
                { id: 'w12', word: 'bike', correctBucket: 'i_e', spokenHint: 'bike — magic e with i?' },
            ],
        },
    ],

    // Island 5: Morphology — sort by prefix or suffix
    5: [
        {
            instruction: 'Sort each word by the prefix at the beginning. A prefix changes the meaning of the root word.',
            buckets: [
                { id: 'un', label: 'un-', spokenLabel: 'un prefix, meaning not', example: 'unhappy' },
                { id: 're', label: 're-', spokenLabel: 're prefix, meaning again', example: 'replay' },
                { id: 'pre', label: 'pre-', spokenLabel: 'pre prefix, meaning before', example: 'preview' },
            ],
            words: [
                { id: 'w1', word: 'unkind', correctBucket: 'un', spokenHint: 'unkind — which prefix comes first?' },
                { id: 'w2', word: 'retell', correctBucket: 're', spokenHint: 'retell — un, re, or pre?' },
                { id: 'w3', word: 'prepay', correctBucket: 'pre', spokenHint: 'prepay — listen for the prefix' },
                { id: 'w4', word: 'unclear', correctBucket: 'un', spokenHint: 'unclear — does it start with un?' },
                { id: 'w5', word: 'rewrite', correctBucket: 're', spokenHint: 'rewrite — does it start with re?' },
                { id: 'w6', word: 'preview', correctBucket: 'pre', spokenHint: 'preview — does it start with pre?' },
            ],
        },
        {
            instruction: 'Now sort by the suffix at the end of each word.',
            buckets: [
                { id: 'ing', label: '-ing', spokenLabel: 'ing suffix, happening now', example: 'running' },
                { id: 'ed', label: '-ed', spokenLabel: 'ed suffix, happened before', example: 'jumped' },
                { id: 'ful', label: '-ful', spokenLabel: 'ful suffix, full of', example: 'hopeful' },
            ],
            words: [
                { id: 'w7', word: 'singing', correctBucket: 'ing', spokenHint: 'singing — which ending?' },
                { id: 'w8', word: 'walked', correctBucket: 'ed', spokenHint: 'walked — ing, ed, or ful?' },
                { id: 'w9', word: 'careful', correctBucket: 'ful', spokenHint: 'careful — listen for the suffix' },
                { id: 'w10', word: 'flying', correctBucket: 'ing', spokenHint: 'flying — does it end with ing?' },
                { id: 'w11', word: 'painted', correctBucket: 'ed', spokenHint: 'painted — does it end with ed?' },
                { id: 'w12', word: 'joyful', correctBucket: 'ful', spokenHint: 'joyful — does it end with ful?' },
            ],
        },
    ],
};

// ── Helpers ────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
    return [...arr].sort(() => Math.random() - 0.5);
}

// ── Leo Badge — matches the uploaded icon style ─────────────────
// Warm amber circle, flat lion face emoji, no SVG
const LeoBadge: React.FC<{ size?: number; talking?: boolean }> = ({ size = 48, talking }) => (
    <div style={{
        width: size, height: size, borderRadius: '50%',
        background: talking
            ? 'linear-gradient(135deg,#FFB830,#E8920C)'
            : 'linear-gradient(135deg,#F5A623,#E8920C)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.52, flexShrink: 0,
        boxShadow: `0 3px 14px rgba(232,146,12,${talking ? '0.55' : '0.28'})`,
        border: `${talking ? '3px' : '2.5px'} solid rgba(255,255,255,${talking ? '0.9' : '0.65'})`,
        transition: 'all 0.25s ease',
        userSelect: 'none',
    }}>🦁</div>
);

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
const WordSort: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const islandId = parseInt(id || '1', 10);
    const meta = ISLAND_META[islandId];
    const rounds = ISLAND_ROUNDS[islandId] ?? ISLAND_ROUNDS[1];

    const { say, cancel, speakOnHover, cancelHover, talking, ready } = useLeoSpeech();

    // ── State ──────────────────────────────────────────────────
    const [roundIdx, setRoundIdx] = useState(0);
    const [words, setWords] = useState<SortWord[]>([]);
    const [bucketWords, setBucketWords] = useState<Record<string, string[]>>({});
    const [placed, setPlaced] = useState<Record<string, string>>({}); // wordId → bucketId
    const [wrongAnim, setWrongAnim] = useState<string | null>(null);
    const [correctAnim, setCorrectAnim] = useState<string | null>(null);
    const [leoMsg, setLeoMsg] = useState('');
    const [sessionDone, setDone] = useState(false);
    const [saving, setSaving] = useState(false);

    // Keyboard-drag state
    const [selectedWordId, setSelectedWordId] = useState<string | null>(null);

    // Drag state (mouse/touch)
    const [dragging, setDragging] = useState<string | null>(null);
    const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
    const [overBucket, setOverBucket] = useState<string | null>(null);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    // Scoring
    const attemptsRef = useRef<Record<string, number>>({});
    const resultsRef = useRef<{ wordId: string; correct: boolean; attempts: number }[]>([]);

    const round = rounds[roundIdx];

    // ── Init round ─────────────────────────────────────────────
    useEffect(() => {
        if (!meta || !round) return;
        const shuffled = shuffle(round.words);
        setWords(shuffled);
        const bw: Record<string, string[]> = {};
        round.buckets.forEach(b => { bw[b.id] = []; });
        setBucketWords(bw);
        setPlaced({});
        attemptsRef.current = {};
        setWrongAnim(null);
        setCorrectAnim(null);
        setSelectedWordId(null);
        setLeoMsg('');
    }, [roundIdx, islandId]);

    // ── Narrate round on ready (FIXED: single utterance) ───────
    useEffect(() => {
        if (!ready || !round) return;
        const t = setTimeout(() => {
            const fullMsg = `Round ${roundIdx + 1}. ${round.instruction} Drag each word into the right bucket. You can hover over a word to hear it.`;
            setLeoMsg(round.instruction);
            // Use a single say() with natural punctuation — no manual pauses
            say(fullMsg, 'instruction');
        }, 450);
        return () => clearTimeout(t);
    }, [roundIdx, ready]);

    // ── Check if all words placed ───────────────────────────────
    const unplacedWords = words.filter(w => !placed[w.id]);
    const allPlaced = words.length > 0 && unplacedWords.length === 0;

    useEffect(() => {
        if (!allPlaced || sessionDone) return;

        const isLastRound = roundIdx >= rounds.length - 1;

        if (isLastRound) {
            finishSession();
        } else {
            // Celebrate + move to next round
            const msg = 'Amazing! Round complete! Get ready for the next one.';
            setLeoMsg(msg);
            say(msg, 'praise');
            setTimeout(() => setRoundIdx(r => r + 1), 2200);
        }
    }, [allPlaced]);

    // ── Drop word into bucket ───────────────────────────────────
    const handleDrop = useCallback((wordId: string, bucketId: string) => {
        const word = words.find(w => w.id === wordId);
        if (!word || placed[wordId]) return;

        const attempts = (attemptsRef.current[wordId] ?? 0) + 1;
        attemptsRef.current[wordId] = attempts;

        if (word.correctBucket === bucketId) {
            // ✓ Correct
            setPlaced(p => ({ ...p, [wordId]: bucketId }));
            setBucketWords(bw => ({
                ...bw,
                [bucketId]: [...(bw[bucketId] ?? []), wordId],
            }));
            setCorrectAnim(wordId);
            setTimeout(() => setCorrectAnim(null), 600);
            setSelectedWordId(null);
            setOverBucket(null);

            const praises = [
                'Yes! That is right!',
                'Brilliant! Well done!',
                'Exactly right! Great listening!',
                'Perfect! You got it!',
                'Fantastic sorting!',
            ];
            const msg = praises[Math.floor(Math.random() * praises.length)];
            setLeoMsg(msg);
            say(msg, 'praise');

            resultsRef.current.push({ wordId, correct: true, attempts });

        } else {
            // ✗ Wrong
            setWrongAnim(wordId);
            setTimeout(() => setWrongAnim(null), 500);

            if (attempts < 3) {
                // Hint for first two wrong tries
                const tryAgain = attempts === 1
                    ? `Good try! Think about the sound — try again. ${word.spokenHint}`
                    : `Almost there! Listen carefully. ${word.spokenHint}`;

                setLeoMsg(tryAgain);
                say(tryAgain, 'hint');
            } else {
                // After 3 wrong attempts: give explicit guidance and auto‑place
                const bucket = round.buckets.find(b => b.id === word.correctBucket)!;
                const guidance = `Let me help you. The word "${word.word}" goes in the ${bucket.spokenLabel} bucket because ${bucket.spokenLabel}. I will place it for you now.`;
                setLeoMsg(guidance);
                say(guidance, 'hint');

                // Auto‑place after a short delay
                setTimeout(() => {
                    setPlaced(p => ({ ...p, [wordId]: word.correctBucket }));
                    setBucketWords(bw => ({
                        ...bw,
                        [word.correctBucket]: [...(bw[word.correctBucket] ?? []), wordId],
                    }));
                    setCorrectAnim(wordId); // optional: show a gentle placement
                    setTimeout(() => setCorrectAnim(null), 600);
                    setSelectedWordId(null);
                    setOverBucket(null);
                }, 2000);

                resultsRef.current.push({ wordId, correct: false, attempts });
            }
        }
    }, [words, placed, round, say]);

    // ── Finish session ──────────────────────────────────────────
    const finishSession = async () => {
        setDone(true);
        const results = resultsRef.current;
        const total = results.length;
        const correct = results.filter(r => r.correct).length;
        const weighted = results.reduce((s, r) => {
            if (r.correct && r.attempts === 1) return s + 100;
            if (r.correct && r.attempts === 2) return s + 70;
            if (r.correct) return s + 40;
            return s;
        }, 0);
        const score = total > 0 ? Math.round(weighted / total) : 0;

        const msg = score >= 85
            ? `Incredible! You sorted ${correct} out of ${total} words perfectly! You are a sorting superstar!`
            : score >= 60
                ? `Really great work! You sorted ${correct} out of ${total}. Keep practising and you will get even better!`
                : `Well done for trying! You sorted ${correct} out of ${total}. Let us keep learning together!`;
        setLeoMsg(msg);
        say(msg, 'results');

        setSaving(true);
        try {
            await progressApi.saveActivity({
                islandId,
                activityType: 'word_sort',
                score,
                totalQuestions: total,
                correct,
            });
        } catch (_) { }
        setSaving(false);
    };

    // ── Mouse drag handlers ─────────────────────────────────────
    const handleMouseDown = (e: React.MouseEvent, wordId: string) => {
        if (placed[wordId]) return;
        e.preventDefault();
        setDragging(wordId);
        setDragPos({ x: e.clientX, y: e.clientY });
        dragStartPos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!dragging) return;
        setDragPos({ x: e.clientX, y: e.clientY });

        // Detect which bucket we're over
        const bucketEls = document.querySelectorAll('[data-bucket-id]');
        let found: string | null = null;
        bucketEls.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (e.clientX >= rect.left && e.clientX <= rect.right &&
                e.clientY >= rect.top && e.clientY <= rect.bottom) {
                found = (el as HTMLElement).dataset.bucketId ?? null;
            }
        });
        setOverBucket(found);
    }, [dragging]);

    const handleMouseUp = useCallback((e: MouseEvent) => {
        if (dragging && overBucket) {
            handleDrop(dragging, overBucket);
        }
        setDragging(null);
        setOverBucket(null);
    }, [dragging, overBucket, handleDrop]);

    useEffect(() => {
        if (dragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragging, handleMouseMove, handleMouseUp]);

    // Touch drag
    const handleTouchStart = (e: React.TouchEvent, wordId: string) => {
        if (placed[wordId]) return;
        const t = e.touches[0];
        setDragging(wordId);
        setDragPos({ x: t.clientX, y: t.clientY });
    };
    const handleTouchMove = (e: React.TouchEvent) => {
        const t = e.touches[0];
        setDragPos({ x: t.clientX, y: t.clientY });
        const bucketEls = document.querySelectorAll('[data-bucket-id]');
        let found: string | null = null;
        bucketEls.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (t.clientX >= rect.left && t.clientX <= rect.right &&
                t.clientY >= rect.top && t.clientY <= rect.bottom) {
                found = (el as HTMLElement).dataset.bucketId ?? null;
            }
        });
        setOverBucket(found);
    };
    const handleTouchEnd = () => {
        if (dragging && overBucket) handleDrop(dragging, overBucket);
        setDragging(null);
        setOverBucket(null);
    };

    // ── Keyboard: select word then select bucket ────────────────
    const handleWordKeyDown = (e: React.KeyboardEvent, wordId: string) => {
        if (placed[wordId]) return;
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setSelectedWordId(prev => prev === wordId ? null : wordId);
            const word = words.find(w => w.id === wordId);
            if (word) say(word.spokenHint, 'word');
        }
    };
    const handleBucketKeyDown = (e: React.KeyboardEvent, bucketId: string) => {
        if (!selectedWordId) return;
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleDrop(selectedWordId, bucketId);
        }
    };

    // Progress
    const totalWords = rounds.reduce((s, r) => s + r.words.length, 0);
    const placedSoFar = Object.keys(placed).length + (roundIdx * (rounds[0]?.words.length ?? 0));
    const progressPct = totalWords > 0 ? Math.round((Object.keys(placed).length / words.length) * 100) : 0;
    const starsForScore = (s: number) => s >= 88 ? 3 : s >= 62 ? 2 : 1;

    if (!meta || !round) return null;

    // ── Results screen ──────────────────────────────────────────
    if (sessionDone) {
        const results = resultsRef.current;
        const total = results.length;
        const correct = results.filter(r => r.correct).length;
        const weighted = results.reduce((s, r) => {
            if (r.correct && r.attempts === 1) return s + 100;
            if (r.correct && r.attempts === 2) return s + 70;
            if (r.correct) return s + 40;
            return s;
        }, 0);
        const finalScore = total > 0 ? Math.round(weighted / total) : 0;
        const stars = starsForScore(finalScore);
        const coins = finalScore >= 80 ? 10 : finalScore >= 60 ? 6 : 3;

        return (
            <>
                <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@400;600;700;800&family=Fraunces:opsz,wght@9..144,700;9..144,800&display=swap');
          *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
          html,body{height:100%;font-family:'Lexend',sans-serif;background:#FDF6ED}
          @keyframes popIn  {0%{opacity:0;transform:scale(0.82) translateY(18px)}70%{transform:scale(1.04)}100%{opacity:1;transform:scale(1)}}
          @keyframes starPop{0%{opacity:0;transform:scale(0) rotate(-25deg)}70%{transform:scale(1.25) rotate(4deg)}100%{opacity:1;transform:scale(1) rotate(0)}}
          @keyframes coinSpin{0%{transform:rotateY(0deg)}100%{transform:rotateY(360deg)}}
        `}</style>
                <div style={{
                    minHeight: '100vh', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', padding: '28px 18px',
                    background: `radial-gradient(ellipse at 20% 10%,${meta.colorPale} 0%,transparent 55%),
                      radial-gradient(ellipse at 80% 90%,${meta.colorPale} 0%,transparent 55%),#FDF6ED`,
                }}>
                    <div style={{
                        background: '#fff', borderRadius: 28, padding: '40px 34px',
                        maxWidth: 420, width: '100%',
                        boxShadow: '0 12px 48px rgba(45,100,80,0.14)',
                        textAlign: 'center', animation: 'popIn 0.55s cubic-bezier(0.34,1.2,0.64,1) both',
                    }}>
                        <div style={{ fontSize: 56, marginBottom: 8 }}>
                            {stars === 3 ? '🏆' : stars === 2 ? '🌟' : '💪'}
                        </div>
                        <div style={{ fontFamily: "'Fraunces',serif", fontSize: '1.85rem', fontWeight: 800, color: meta.colorDark, marginBottom: 6 }}>
                            {stars === 3 ? 'Incredible!' : stars === 2 ? 'Great sorting!' : 'Keep going!'}
                        </div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#6B8876', marginBottom: 22, lineHeight: 1.7 }}>
                            Word Sort · {meta.name} {meta.emoji}
                        </div>

                        {/* Stars */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 22 }}>
                            {[1, 2, 3].map(s => (
                                <span key={s} style={{
                                    fontSize: 40,
                                    opacity: s <= stars ? 1 : 0.15,
                                    filter: s <= stars ? 'none' : 'grayscale(1)',
                                    animation: s <= stars ? `starPop 0.5s ${(s - 1) * 0.18}s cubic-bezier(0.34,1.5,0.64,1) both` : 'none',
                                }}>⭐</span>
                            ))}
                        </div>

                        {/* Score pills */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
                            {[
                                { val: `${finalScore}%`, lbl: 'Score' },
                                { val: `${correct}/${total}`, lbl: 'Sorted' },
                            ].map(({ val, lbl }) => (
                                <div key={lbl} style={{
                                    background: meta.colorPale, border: `1.5px solid ${meta.color}33`,
                                    borderRadius: 16, padding: '12px 22px', minWidth: 90,
                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                }}>
                                    <div style={{ fontSize: '1.55rem', fontWeight: 800, color: meta.colorDark, lineHeight: 1 }}>{val}</div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#6B8876', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{lbl}</div>
                                </div>
                            ))}
                        </div>

                        {/* Coins */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                            background: '#FFFBF0', border: '1.5px solid rgba(232,146,12,0.22)',
                            borderRadius: 14, padding: '11px 22px', marginBottom: 22,
                            fontSize: 15, fontWeight: 800, color: '#B36A00',
                        }}>
                            <span style={{ fontSize: 22, display: 'inline-block', animation: 'coinSpin 2.2s linear infinite' }}>☀️</span>
                            +{coins} Sun Coins earned!
                        </div>

                        {/* Leo message */}
                        <div style={{
                            display: 'flex', alignItems: 'flex-start', gap: 13,
                            background: '#F8F4F0', borderRadius: 16, padding: '14px 16px',
                            marginBottom: 26, textAlign: 'left',
                        }}>
                            <LeoBadge size={44} talking={talking} />
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#304838', lineHeight: 1.78, letterSpacing: '0.022em' }}>
                                {leoMsg}
                            </div>
                        </div>

                        {saving && <div style={{ fontSize: 12, color: '#6B8876', marginBottom: 14, fontWeight: 600 }}>Saving your progress…</div>}

                        <button
                            onClick={() => { cancel(); navigate(`/island/${islandId}/blending`); }}
                            style={{
                                width: '100%', padding: '16px', marginBottom: 10,
                                background: `linear-gradient(135deg,${meta.colorDark},${meta.color})`,
                                color: '#fff', border: 'none', borderRadius: 16,
                                fontFamily: "'Lexend',sans-serif", fontSize: 17, fontWeight: 800,
                                cursor: 'pointer', boxShadow: `0 5px 20px ${meta.color}44`,
                                minHeight: 58, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                            }}
                        >
                            Next Activity — Blending 🔀
                        </button>

                        <button
                            onClick={() => {
                                cancel();
                                setRoundIdx(0);
                                resultsRef.current = [];
                                attemptsRef.current = {};
                                setDone(false);
                                setLeoMsg('');
                            }}
                            style={{
                                width: '100%', padding: '13px',
                                background: 'transparent', color: meta.colorDark,
                                border: `2px solid ${meta.color}44`, borderRadius: 14,
                                fontFamily: "'Lexend',sans-serif", fontSize: 14, fontWeight: 700,
                                cursor: 'pointer', minHeight: 50,
                            }}
                        >
                            🔄 Try again
                        </button>
                    </div>
                </div>
            </>
        );
    }

    // ── Activity screen ─────────────────────────────────────────
    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@400;600;700;800&family=Fraunces:opsz,wght@9..144,700;9..144,800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{height:100%;overflow-x:hidden;font-family:'Lexend',sans-serif;background:#FDF6ED}

        @keyframes fadeIn  {from{opacity:0}to{opacity:1}}
        @keyframes fadeUp  {from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shake   {0%{transform:translateX(0)}15%{transform:translateX(-10px)}35%{transform:translateX(10px)}55%{transform:translateX(-7px)}75%{transform:translateX(7px)}100%{transform:translateX(0)}}
        @keyframes correctPop{0%{transform:scale(1)}40%{transform:scale(1.18)}100%{transform:scale(1)}}
        @keyframes wordIn  {from{opacity:0;transform:translateY(10px) scale(0.92)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes bucketGlow{0%,100%{box-shadow:0 4px 16px rgba(45,100,80,0.10)}50%{box-shadow:0 4px 28px rgba(45,100,80,0.22)}}
        @keyframes talkPulse{0%,100%{box-shadow:0 3px 14px rgba(232,146,12,0.28)}50%{box-shadow:0 3px 22px rgba(232,146,12,0.55)}}
        @keyframes floatIn {from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}
        @keyframes selectedPulse{0%,100%{box-shadow:0 0 0 3px ${meta.color}44}50%{box-shadow:0 0 0 6px ${meta.color}22}}

        .ws-page{
          min-height:100vh;display:flex;flex-direction:column;
          background:
            radial-gradient(ellipse at 4% 0%,${meta.colorPale} 0%,transparent 48%),
            radial-gradient(ellipse at 96% 100%,${meta.colorPale} 0%,transparent 48%),
            #FDF6ED;
        }

        /* ── Top bar ── */
        .ws-topbar{
          padding:14px 24px;display:flex;align-items:center;gap:12px;
          position:relative;z-index:10;animation:fadeIn 0.35s ease both;
          flex-wrap:wrap;
        }
        .ws-back{
          display:flex;align-items:center;gap:7px;
          background:rgba(255,255,255,0.88);border:1.5px solid rgba(45,139,126,0.12);
          border-radius:100px;padding:10px 20px;
          font-family:'Lexend',sans-serif;font-size:14px;font-weight:700;color:#304838;
          cursor:pointer;transition:all 0.2s;min-height:48px;flex-shrink:0;
        }
        .ws-back:hover{background:#fff;transform:translateX(-2px)}

        .ws-badge{
          display:flex;align-items:center;gap:7px;
          border:1.5px solid ${meta.color}44;border-radius:100px;
          padding:8px 16px;font-size:12px;font-weight:800;
          background:${meta.colorPale};color:${meta.colorDark};
          letter-spacing:0.04em;flex-shrink:0;
        }
        .ws-progress-wrap{flex:1;min-width:120px;}
        .ws-progress-lbl{font-size:11px;font-weight:700;color:#6B8876;margin-bottom:5px;text-align:right;}
        .ws-progress-track{height:9px;background:#EDE3D4;border-radius:100px;overflow:hidden;}
        .ws-progress-fill{
          height:100%;border-radius:100px;
          background:linear-gradient(90deg,${meta.colorDark},${meta.color});
          transition:width 0.55s cubic-bezier(0.34,1.2,0.64,1);
        }
        .ws-speak-btn{
          display:flex;align-items:center;gap:8px;
          background:${meta.colorPale};border:1.5px solid ${meta.color}44;
          border-radius:100px;padding:10px 20px;
          font-family:'Lexend',sans-serif;font-size:13px;font-weight:700;color:${meta.colorDark};
          cursor:pointer;min-height:48px;flex-shrink:0;white-space:nowrap;transition:all 0.2s;
        }
        .ws-speak-btn.talking{animation:talkPulse 1.2s ease-in-out infinite}

        /* ── Round indicator ── */
        .ws-round-strip{
          display:flex;align-items:center;justify-content:center;gap:8px;
          padding:0 24px 10px;animation:fadeIn 0.4s ease both;
        }
        .ws-round-dot{
          width:10px;height:10px;border-radius:50%;
          background:#EDE3D4;transition:all 0.3s;
        }
        .ws-round-dot.done   {background:${meta.color};}
        .ws-round-dot.current{background:${meta.color};transform:scale(1.5);box-shadow:0 0 0 3px ${meta.color}33;}

        /* ── Main area ── */
        .ws-main{
          flex:1;display:flex;flex-direction:column;
          padding:0 20px 36px;max-width:720px;margin:0 auto;width:100%;
        }

        /* ── Leo strip ── */
        .ws-leo-strip{
          display:flex;align-items:flex-start;gap:13px;
          background:#fff;border:1.5px solid rgba(45,139,126,0.1);
          border-radius:18px;padding:15px 17px;
          box-shadow:0 2px 10px rgba(45,100,80,0.06);
          margin-bottom:20px;min-height:70px;
          animation:fadeUp 0.36s ease both;
        }
        .ws-leo-msg{
          font-size:15px;font-weight:600;color:#304838;
          line-height:1.78;letter-spacing:0.022em;padding-top:3px;
        }

        /* ── Instruction banner ── */
        .ws-instruction{
          text-align:center;font-size:16px;font-weight:700;color:#304838;
          margin-bottom:18px;line-height:1.55;letter-spacing:0.025em;
          animation:fadeUp 0.38s 0.1s ease both;
          padding:12px 16px;
          background:#fff;border:1.5px solid ${meta.color}22;
          border-radius:14px;
        }

        /* ── Word bank ── */
        .ws-word-bank{
          display:flex;flex-wrap:wrap;gap:10px;justify-content:center;
          margin-bottom:24px;min-height:52px;
          animation:fadeUp 0.4s 0.15s ease both;
          padding:14px 12px;
          background:rgba(255,255,255,0.7);
          border:1.5px dashed ${meta.color}44;
          border-radius:18px;
        }
        .ws-word-bank-label{
          width:100%;text-align:center;
          font-size:11px;font-weight:800;color:${meta.color};
          text-transform:uppercase;letter-spacing:0.14em;margin-bottom:4px;
        }

        /* ── Word chip ── */
        .ws-word{
          padding:12px 20px;border-radius:14px;
          font-family:'OpenDyslexic','Lexend',sans-serif;
          font-size:1.2rem;font-weight:700;color:#1C2E24;
          background:#fff;border:2.5px solid rgba(45,139,126,0.14);
          box-shadow:0 3px 12px rgba(45,100,80,0.08);
          cursor:grab;user-select:none;
          transition:all 0.18s cubic-bezier(0.34,1.2,0.64,1);
          animation:wordIn 0.36s ease both;
          min-height:50px;display:flex;align-items:center;
        }
        .ws-word:hover{
          border-color:${meta.color};
          transform:translateY(-3px) scale(1.04);
          box-shadow:0 8px 20px ${meta.color}28;
        }
        .ws-word.selected{
          border-color:${meta.color};
          background:${meta.colorPale};
          animation:selectedPulse 1.4s ease-in-out infinite;
        }
        .ws-word.dragging{
          opacity:0.3;transform:scale(0.95);cursor:grabbing;
        }
        .ws-word.correct-anim{
          animation:correctPop 0.45s ease both;
          border-color:#27AE60;background:linear-gradient(135deg,#E6F8EE,#D0F0DE);
        }
        .ws-word.wrong-anim{
          animation:shake 0.44s ease both;
          border-color:#E8AAAA;background:#FFF2F2;
        }

        /* ── Buckets grid ── */
        .ws-buckets{
          display:grid;
          grid-template-columns:repeat(auto-fit,minmax(160px,1fr));
          gap:14px;
          animation:fadeUp 0.42s 0.2s ease both;
        }

        /* ── Bucket ── */
        .ws-bucket{
          border-radius:20px;
          border:2.5px dashed rgba(45,139,126,0.22);
          background:#fff;
          padding:14px 12px;
          min-height:140px;
          display:flex;flex-direction:column;
          align-items:center;
          gap:8px;
          transition:all 0.2s cubic-bezier(0.34,1.2,0.64,1);
          position:relative;
          cursor:pointer;
        }
        .ws-bucket:hover,.ws-bucket:focus{
          outline:none;
          border-color:${meta.color};
          background:${meta.colorPale};
          transform:scale(1.02);
        }
        .ws-bucket.over{
          border-color:${meta.color};
          background:${meta.colorPale};
          border-style:solid;
          transform:scale(1.04);
          box-shadow:0 8px 28px ${meta.color}28;
          animation:bucketGlow 1.2s ease-in-out infinite;
        }
        .ws-bucket.selected-target{
          border-color:${meta.color};
          border-style:solid;
          background:${meta.colorPale};
        }

        .ws-bucket-label{
          font-family:'OpenDyslexic','Lexend',sans-serif;
          font-size:1.35rem;font-weight:800;color:${meta.colorDark};
          letter-spacing:0.06em;text-align:center;
        }
        .ws-bucket-example{
          font-size:11px;font-weight:700;color:#6B8876;
          background:${meta.colorPale};border:1px solid ${meta.color}22;
          border-radius:8px;padding:2px 10px;letter-spacing:0.05em;
        }
        .ws-bucket-words{
          display:flex;flex-wrap:wrap;gap:6px;justify-content:center;
          margin-top:4px;
        }
        .ws-placed-word{
          padding:6px 12px;border-radius:10px;
          font-family:'OpenDyslexic','Lexend',sans-serif;
          font-size:0.95rem;font-weight:700;
          background:${meta.colorPale};color:${meta.colorDark};
          border:1.5px solid ${meta.color}33;
          animation:floatIn 0.3s cubic-bezier(0.34,1.4,0.64,1) both;
        }
        .ws-bucket-drop-hint{
          font-size:12px;font-weight:600;color:#B0C4BC;
          text-align:center;margin-top:auto;
          pointer-events:none;
        }

        /* ── Drag ghost ── */
        .ws-drag-ghost{
          position:fixed;pointer-events:none;z-index:999;
          padding:12px 20px;border-radius:14px;
          font-family:'OpenDyslexic','Lexend',sans-serif;
          font-size:1.2rem;font-weight:700;color:#fff;
          background:${meta.color};
          box-shadow:0 10px 32px ${meta.color}55;
          transform:translate(-50%,-50%) rotate(-4deg) scale(1.08);
          transition:none;white-space:nowrap;
        }

        /* ── Keyboard hint ── */
        .ws-kb-hint{
          text-align:center;font-size:12px;font-weight:600;color:#6B8876;
          margin-bottom:10px;
          animation:fadeIn 0.5s 0.6s ease both;opacity:0;
          animation-fill-mode:forwards;
        }

        @media(max-width:520px){
          .ws-word{font-size:1.05rem;padding:10px 14px;}
          .ws-bucket-label{font-size:1.1rem;}
          .ws-buckets{grid-template-columns:1fr 1fr;}
          .ws-badge{display:none;}
        }
      `}</style>

            {/* Floating drag ghost */}
            {dragging && (
                <div className="ws-drag-ghost" style={{ left: dragPos.x, top: dragPos.y }}>
                    {words.find(w => w.id === dragging)?.word}
                </div>
            )}

            <div className="ws-page" ref={containerRef}>

                {/* ── Top bar ── */}
                <div className="ws-topbar">
                    <button className="ws-back" onClick={() => { cancel(); navigate(`/island/${islandId}`); }}>
                        ← Back
                    </button>
                    <div className="ws-badge">🔀 Word Sort · {meta.name}</div>
                    <div className="ws-progress-wrap">
                        <div className="ws-progress-lbl">
                            Round {roundIdx + 1} of {rounds.length} · {Object.keys(placed).length}/{words.length} sorted
                        </div>
                        <div className="ws-progress-track">
                            <div className="ws-progress-fill" style={{ width: `${progressPct}%` }} />
                        </div>
                    </div>
                    <button
                        className={`ws-speak-btn${talking ? ' talking' : ''}`}
                        onClick={() => {
                            const msg = `Round ${roundIdx + 1}. ${round.instruction}`;
                            setLeoMsg(round.instruction);
                            say(msg, 'instruction');
                        }}
                    >
                        🔊 {talking ? 'Speaking…' : 'Speak again'}
                    </button>
                </div>

                {/* ── Round dots ── */}
                <div className="ws-round-strip">
                    {rounds.map((_, i) => (
                        <div key={i} className={`ws-round-dot${i < roundIdx ? ' done' : i === roundIdx ? ' current' : ''}`} />
                    ))}
                </div>

                <div className="ws-main">

                    {/* Leo strip */}
                    {leoMsg && (
                        <div className="ws-leo-strip">
                            <LeoBadge size={46} talking={talking} />
                            <div className="ws-leo-msg">{leoMsg}</div>
                        </div>
                    )}

                    {/* Instruction */}
                    <div className="ws-instruction">
                        {round.instruction}
                    </div>

                    {/* Keyboard hint */}
                    {selectedWordId && (
                        <div className="ws-kb-hint" style={{ opacity: 1, color: meta.colorDark, fontWeight: 700, fontSize: 13, marginBottom: 10, padding: '8px 14px', background: meta.colorPale, borderRadius: 10 }}>
                            ✋ "{words.find(w => w.id === selectedWordId)?.word}" selected — click or press Enter on a bucket to place it
                        </div>
                    )}
                    {!selectedWordId && !dragging && (
                        <div className="ws-kb-hint">
                            💡 Drag words to buckets, or click a word then click a bucket
                        </div>
                    )}

                    {/* Word bank */}
                    <div className="ws-word-bank">
                        <div className="ws-word-bank-label">Words to sort</div>
                        {unplacedWords.map((word, idx) => (
                            <div
                                key={word.id}
                                className={[
                                    'ws-word',
                                    dragging === word.id ? 'dragging' : '',
                                    correctAnim === word.id ? 'correct-anim' : '',
                                    wrongAnim === word.id ? 'wrong-anim' : '',
                                    selectedWordId === word.id ? 'selected' : '',
                                ].join(' ')}
                                style={{ animationDelay: `${idx * 0.06}s` }}
                                onMouseDown={e => handleMouseDown(e, word.id)}
                                onTouchStart={e => handleTouchStart(e, word.id)}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                                onMouseEnter={() => speakOnHover(word.spokenHint, 'word')}
                                onMouseLeave={cancelHover}
                                onFocus={() => speakOnHover(word.spokenHint, 'word')}
                                onBlur={cancelHover}
                                onKeyDown={e => handleWordKeyDown(e, word.id)}
                                tabIndex={0}
                                role="button"
                                aria-label={`Word: ${word.word}. Press Enter to select.`}
                                aria-pressed={selectedWordId === word.id}
                            >
                                {word.word}
                            </div>
                        ))}
                        {unplacedWords.length === 0 && words.length > 0 && (
                            <div style={{ fontSize: 14, fontWeight: 700, color: meta.colorDark, padding: '8px 0' }}>
                                All words sorted! 🎉
                            </div>
                        )}
                    </div>

                    {/* Buckets */}
                    <div className="ws-buckets">
                        {round.buckets.map(bucket => {
                            const wordsInBucket = (bucketWords[bucket.id] ?? [])
                                .map(wid => words.find(w => w.id === wid))
                                .filter(Boolean) as SortWord[];
                            const isOver = overBucket === bucket.id;
                            const isTarget = selectedWordId !== null;

                            return (
                                <div
                                    key={bucket.id}
                                    data-bucket-id={bucket.id}
                                    className={[
                                        'ws-bucket',
                                        isOver ? 'over' : '',
                                        isTarget && !isOver ? 'selected-target' : '',
                                    ].join(' ')}
                                    onClick={() => { if (selectedWordId) handleDrop(selectedWordId, bucket.id); }}
                                    onKeyDown={e => handleBucketKeyDown(e, bucket.id)}
                                    onMouseEnter={() => speakOnHover(bucket.spokenLabel, 'instruction')}
                                    onMouseLeave={cancelHover}
                                    onFocus={() => speakOnHover(bucket.spokenLabel, 'instruction')}
                                    onBlur={cancelHover}
                                    tabIndex={0}
                                    role="group"
                                    aria-label={`Bucket: ${bucket.spokenLabel}. ${wordsInBucket.length} words placed.`}
                                    style={{
                                        borderColor: wordsInBucket.length > 0 ? meta.color + '66' : undefined,
                                        background: wordsInBucket.length > 0 ? meta.colorPale : undefined,
                                    }}
                                >
                                    {/* Bucket label */}
                                    <div className="ws-bucket-label">{bucket.label}</div>
                                    <div className="ws-bucket-example">e.g. {bucket.example}</div>

                                    {/* Placed words */}
                                    <div className="ws-bucket-words">
                                        {wordsInBucket.map(w => (
                                            <div key={w.id} className="ws-placed-word">{w.word}</div>
                                        ))}
                                    </div>

                                    {/* Drop hint when empty */}
                                    {wordsInBucket.length === 0 && (
                                        <div className="ws-bucket-drop-hint">
                                            {isOver ? '⬇️ Drop here!' : 'Drop words here'}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                </div>
            </div>
        </>
    );
};

export default WordSort;