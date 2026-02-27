// frontend/src/pages/activities/Flashcard.tsx
// Route: /island/:id/flashcard
// Flow:   IslandEntry → Flashcard → mini results → /island/:id/word_sort
//
// ACCESSIBILITY RULES (non-negotiable):
// • Leo speaks EVERYTHING automatically — word, instruction, all choices intro
// • Choices spoken individually on hover (120ms debounce)
// • Persistent "Speak again" button re-narrates full context at any time
// • OpenDyslexic font on all word/phoneme content, min 24px
// • Answer buttons min 80px tall, generous touch targets
// • No timers, no red X, no harsh feedback
// • Wrong = gentle shake + warm Leo message
// • Hint after 2 wrong attempts — highlighted letters + Leo explains slowly
// • Auto-advance after 3 wrong with supportive message

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { progressApi } from '../../lib/api';
import { useLeoSpeech } from '../../hooks/useLeoSpeech';

// ─── Types ────────────────────────────────────────────────────
interface FlashCard {
    word: string;
    correctSound: string;
    choices: string[];
    hint: string;
    highlightLetters: string;
    // Full spoken text for each choice (e.g. "the /k/ sound, like in cat")
    spokenChoices: Record<string, string>;
}

// ─── Island config ────────────────────────────────────────────
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

// ─── Per-island word banks ─────────────────────────────────────
// spokenChoices: what Leo says when a button is hovered
// — uses natural language so the child HEARS the sound in context
const ISLAND_CARDS: Record<number, FlashCard[]> = {
    1: [
        {
            word: 'cat', correctSound: '/k/', highlightLetters: 'c',
            hint: 'Listen to the very first sound in cat. c makes the /k/ sound.',
            choices: ['/k/', '/s/', '/t/', '/p/'],
            spokenChoices: { '/k/': 'the k sound, like in kite', '/s/': 'the s sound, like in sun', '/t/': 'the t sound, like in top', '/p/': 'the p sound, like in pan' },
        },
        {
            word: 'sun', correctSound: '/s/', highlightLetters: 's',
            hint: 'The word sun starts with s. s makes the /s/ sound, like a snake.',
            choices: ['/s/', '/z/', '/f/', '/m/'],
            spokenChoices: { '/s/': 'the s sound, like in sun', '/z/': 'the z sound, like in zoo', '/f/': 'the f sound, like in fish', '/m/': 'the m sound, like in moon' },
        },
        {
            word: 'mop', correctSound: '/m/', highlightLetters: 'm',
            hint: 'Close your lips together and hum. m makes the /m/ sound.',
            choices: ['/m/', '/n/', '/b/', '/p/'],
            spokenChoices: { '/m/': 'the m sound, like in moon', '/n/': 'the n sound, like in net', '/b/': 'the b sound, like in ball', '/p/': 'the p sound, like in pan' },
        },
        {
            word: 'fan', correctSound: '/f/', highlightLetters: 'f',
            hint: 'Blow air through your top teeth. f makes the /f/ sound.',
            choices: ['/f/', '/v/', '/s/', '/h/'],
            spokenChoices: { '/f/': 'the f sound, like in fish', '/v/': 'the v sound, like in van', '/s/': 'the s sound, like in sun', '/h/': 'the h sound, like in hat' },
        },
        {
            word: 'dig', correctSound: '/d/', highlightLetters: 'd',
            hint: 'Tap the tip of your tongue behind your teeth. d makes the /d/ sound.',
            choices: ['/d/', '/b/', '/g/', '/t/'],
            spokenChoices: { '/d/': 'the d sound, like in dog', '/b/': 'the b sound, like in ball', '/g/': 'the g sound, like in go', '/t/': 'the t sound, like in top' },
        },
        {
            word: 'hat', correctSound: '/h/', highlightLetters: 'h',
            hint: 'Breathe out warm air. h makes the /h/ sound.',
            choices: ['/h/', '/a/', '/k/', '/w/'],
            spokenChoices: { '/h/': 'the h sound, like in hat', '/a/': 'the a sound, like in apple', '/k/': 'the k sound, like in kite', '/w/': 'the w sound, like in web' },
        },
        {
            word: 'lip', correctSound: '/l/', highlightLetters: 'l',
            hint: 'Your tongue touches just behind your top teeth. l makes the /l/ sound.',
            choices: ['/l/', '/r/', '/w/', '/n/'],
            spokenChoices: { '/l/': 'the l sound, like in lion', '/r/': 'the r sound, like in run', '/w/': 'the w sound, like in web', '/n/': 'the n sound, like in net' },
        },
        {
            word: 'red', correctSound: '/r/', highlightLetters: 'r',
            hint: 'Curl your tongue back a little. r makes the /r/ sound.',
            choices: ['/r/', '/l/', '/w/', '/d/'],
            spokenChoices: { '/r/': 'the r sound, like in run', '/l/': 'the l sound, like in lion', '/w/': 'the w sound, like in web', '/d/': 'the d sound, like in dog' },
        },
    ],
    2: [
        {
            word: 'cat', correctSound: 'a', highlightLetters: 'a',
            hint: 'Listen to the middle of the word cat. The letter a makes the short a sound.',
            choices: ['a', 'e', 'i', 'o'],
            spokenChoices: { 'a': 'short a, like in cat', 'e': 'short e, like in bed', 'i': 'short i, like in sit', 'o': 'short o, like in hot' },
        },
        {
            word: 'bed', correctSound: 'e', highlightLetters: 'e',
            hint: 'The middle of the word bed has a short e sound. Say it with me... e.',
            choices: ['e', 'a', 'i', 'u'],
            spokenChoices: { 'e': 'short e, like in bed', 'a': 'short a, like in cat', 'i': 'short i, like in sit', 'u': 'short u, like in bug' },
        },
        {
            word: 'sit', correctSound: 'i', highlightLetters: 'i',
            hint: 'Listen to the middle of the word sit. The letter i makes the short i sound.',
            choices: ['i', 'e', 'a', 'o'],
            spokenChoices: { 'i': 'short i, like in sit', 'e': 'short e, like in bed', 'a': 'short a, like in cat', 'o': 'short o, like in hot' },
        },
        {
            word: 'hot', correctSound: 'o', highlightLetters: 'o',
            hint: 'The middle of the word hot has a short o sound. Open your mouth wide... o.',
            choices: ['o', 'u', 'a', 'i'],
            spokenChoices: { 'o': 'short o, like in hot', 'u': 'short u, like in bug', 'a': 'short a, like in cat', 'i': 'short i, like in sit' },
        },
        {
            word: 'bug', correctSound: 'u', highlightLetters: 'u',
            hint: 'Listen to the middle of the word bug. The letter u makes the short u sound.',
            choices: ['u', 'o', 'e', 'a'],
            spokenChoices: { 'u': 'short u, like in bug', 'o': 'short o, like in hot', 'e': 'short e, like in bed', 'a': 'short a, like in cat' },
        },
        {
            word: 'map', correctSound: 'a', highlightLetters: 'a',
            hint: 'The middle of the word map has the same short a sound as in cat.',
            choices: ['a', 'e', 'i', 'u'],
            spokenChoices: { 'a': 'short a, like in cat', 'e': 'short e, like in bed', 'i': 'short i, like in sit', 'u': 'short u, like in bug' },
        },
        {
            word: 'hit', correctSound: 'i', highlightLetters: 'i',
            hint: 'Listen carefully to the middle of hit. The letter i makes the short i sound.',
            choices: ['i', 'e', 'a', 'o'],
            spokenChoices: { 'i': 'short i, like in hit', 'e': 'short e, like in bed', 'a': 'short a, like in cat', 'o': 'short o, like in hot' },
        },
        {
            word: 'cup', correctSound: 'u', highlightLetters: 'u',
            hint: 'The middle of cup has the same short u sound as in bug.',
            choices: ['u', 'o', 'e', 'a'],
            spokenChoices: { 'u': 'short u, like in cup', 'o': 'short o, like in hot', 'e': 'short e, like in bed', 'a': 'short a, like in cat' },
        },
    ],
    3: [
        {
            word: 'ship', correctSound: 'sh', highlightLetters: 'sh',
            hint: 'The letters s and h together make one special sound. sh, like putting your finger to your lips and saying shhhh.',
            choices: ['sh', 'ch', 'th', 'wh'],
            spokenChoices: { 'sh': 'sh, like in ship and shop', 'ch': 'ch, like in chip and chair', 'th': 'th, like in thin and thank', 'wh': 'wh, like in when and where' },
        },
        {
            word: 'chin', correctSound: 'ch', highlightLetters: 'ch',
            hint: 'The letters c and h together make the ch sound. Like a train starting... ch ch ch.',
            choices: ['ch', 'sh', 'th', 'ph'],
            spokenChoices: { 'ch': 'ch, like in chin and cheese', 'sh': 'sh, like in ship', 'th': 'th, like in thin', 'ph': 'ph, like in phone, which sounds like f' },
        },
        {
            word: 'thin', correctSound: 'th', highlightLetters: 'th',
            hint: 'Put the tip of your tongue gently between your teeth and blow. That is the th sound.',
            choices: ['th', 'sh', 'ch', 'wh'],
            spokenChoices: { 'th': 'th, like in thin and thank', 'sh': 'sh, like in ship', 'ch': 'ch, like in chin', 'wh': 'wh, like in when' },
        },
        {
            word: 'when', correctSound: 'wh', highlightLetters: 'wh',
            hint: 'The letters w and h together make the wh sound. It sounds just like w.',
            choices: ['wh', 'sh', 'ch', 'th'],
            spokenChoices: { 'wh': 'wh, like in when and where', 'sh': 'sh, like in ship', 'ch': 'ch, like in chin', 'th': 'th, like in thin' },
        },
        {
            word: 'ring', correctSound: 'ng', highlightLetters: 'ng',
            hint: 'At the end of the word ring, the letters n and g together make the ng sound. Like in sing or king.',
            choices: ['ng', 'nk', 'ck', 'nd'],
            spokenChoices: { 'ng': 'ng, like in ring and sing', 'nk': 'nk, like in pink and drink', 'ck': 'ck, like in back and duck', 'nd': 'nd, like in hand and sand' },
        },
        {
            word: 'frog', correctSound: 'fr', highlightLetters: 'fr',
            hint: 'The letters f and r blend together at the start. fr, say them together quickly.',
            choices: ['fr', 'fl', 'tr', 'gr'],
            spokenChoices: { 'fr': 'fr blend, like in frog and fry', 'fl': 'fl blend, like in flag and fly', 'tr': 'tr blend, like in tree and trip', 'gr': 'gr blend, like in grass and grow' },
        },
        {
            word: 'clap', correctSound: 'cl', highlightLetters: 'cl',
            hint: 'The letters c and l blend together at the start of clap. cl, like in clap and clock.',
            choices: ['cl', 'cr', 'gl', 'bl'],
            spokenChoices: { 'cl': 'cl blend, like in clap and clock', 'cr': 'cr blend, like in crab and cross', 'gl': 'gl blend, like in glad and glass', 'bl': 'bl blend, like in black and blue' },
        },
        {
            word: 'stop', correctSound: 'st', highlightLetters: 'st',
            hint: 'The letters s and t blend together at the start of stop. st, say them smoothly together.',
            choices: ['st', 'sp', 'sk', 'sn'],
            spokenChoices: { 'st': 'st blend, like in stop and star', 'sp': 'sp blend, like in spin and spot', 'sk': 'sk blend, like in skip and skin', 'sn': 'sn blend, like in snail and snap' },
        },
    ],
    4: [
        {
            word: 'cake', correctSound: 'a_e', highlightLetters: 'a',
            hint: 'The silent e at the end of cake makes the a say its own name. The a sounds like ay, as in cake.',
            choices: ['a_e', 'a', 'ai', 'ay'],
            spokenChoices: { 'a_e': 'the magic e pattern, like in cake and make', 'a': 'short a, like in cat', 'ai': 'a i together, like in rain and train', 'ay': 'a y together, like in play and day' },
        },
        {
            word: 'rain', correctSound: 'ai', highlightLetters: 'ai',
            hint: 'The letters a and i together in rain make the ay sound. a i says ay.',
            choices: ['ai', 'ay', 'a_e', 'a'],
            spokenChoices: { 'ai': 'a i together, like in rain and tail', 'ay': 'a y together, like in play and day', 'a_e': 'the magic e pattern, like in cake', 'a': 'short a, like in cat' },
        },
        {
            word: 'play', correctSound: 'ay', highlightLetters: 'ay',
            hint: 'At the end of play, the letters a and y together make the ay sound.',
            choices: ['ay', 'ai', 'a_e', 'ey'],
            spokenChoices: { 'ay': 'a y together, like in play and day', 'ai': 'a i together, like in rain', 'a_e': 'the magic e pattern, like in cake', 'ey': 'e y together, like in they and grey' },
        },
        {
            word: 'leaf', correctSound: 'ea', highlightLetters: 'ea',
            hint: 'The letters e and a together in leaf make the ee sound. e a says ee.',
            choices: ['ea', 'ee', 'ie', 'oa'],
            spokenChoices: { 'ea': 'e a together, like in leaf and beach', 'ee': 'e e together, like in feet and tree', 'ie': 'i e together, like in pie and tie', 'oa': 'o a together, like in boat and road' },
        },
        {
            word: 'feet', correctSound: 'ee', highlightLetters: 'ee',
            hint: 'The two e letters together in feet make the long ee sound. e e says ee.',
            choices: ['ee', 'ea', 'ie', 'ey'],
            spokenChoices: { 'ee': 'e e together, like in feet and tree', 'ea': 'e a together, like in leaf', 'ie': 'i e together, like in pie', 'ey': 'e y together, like in key and monkey' },
        },
        {
            word: 'boat', correctSound: 'oa', highlightLetters: 'oa',
            hint: 'The letters o and a together in boat make the long oh sound. o a says oh.',
            choices: ['oa', 'ow', 'o_e', 'o'],
            spokenChoices: { 'oa': 'o a together, like in boat and coat', 'ow': 'o w together, like in snow and flow', 'o_e': 'the magic e pattern, like in home and bone', 'o': 'short o, like in hot' },
        },
        {
            word: 'kite', correctSound: 'i_e', highlightLetters: 'i',
            hint: 'The silent e at the end of kite makes the i say its own name. The i sounds like eye, as in kite.',
            choices: ['i_e', 'i', 'ie', 'igh'],
            spokenChoices: { 'i_e': 'the magic e pattern, like in kite and bike', 'i': 'short i, like in sit', 'ie': 'i e together, like in pie and tie', 'igh': 'i g h together, like in night and light' },
        },
        {
            word: 'road', correctSound: 'oa', highlightLetters: 'oa',
            hint: 'The letters o and a together in road make the same oh sound as in boat.',
            choices: ['oa', 'ow', 'o', 'oe'],
            spokenChoices: { 'oa': 'o a together, like in road and toad', 'ow': 'o w together, like in snow', 'o': 'short o, like in hot', 'oe': 'o e together, like in toe and foe' },
        },
    ],
    5: [
        {
            word: 'running', correctSound: '-ing', highlightLetters: 'ing',
            hint: 'The ending ing is added to the word run to make running. ing is a suffix that means the action is happening right now.',
            choices: ['-ing', '-ed', '-er', '-est'],
            spokenChoices: { '-ing': 'the ing suffix, like in running and jumping', '-ed': 'the ed suffix, like in jumped and walked', '-er': 'the er suffix, like in faster and bigger', '-est': 'the est suffix, like in tallest and fastest' },
        },
        {
            word: 'jumped', correctSound: '-ed', highlightLetters: 'ed',
            hint: 'The suffix ed is added to jump to make jumped. ed tells us the action already happened in the past.',
            choices: ['-ed', '-ing', '-s', '-er'],
            spokenChoices: { '-ed': 'the ed suffix, like in jumped and walked', '-ing': 'the ing suffix, like in running', '-s': 'the s suffix, like in jumps and runs', '-er': 'the er suffix, like in faster' },
        },
        {
            word: 'faster', correctSound: '-er', highlightLetters: 'er',
            hint: 'The suffix er is added to fast to make faster. er means more... so faster means more fast.',
            choices: ['-er', '-est', '-ly', '-ed'],
            spokenChoices: { '-er': 'the er suffix, like in faster and taller', '-est': 'the est suffix, like in fastest and tallest', '-ly': 'the ly suffix, like in quickly and slowly', '-ed': 'the ed suffix, like in jumped' },
        },
        {
            word: 'tallest', correctSound: '-est', highlightLetters: 'est',
            hint: 'The suffix est is added to tall to make tallest. est means the most... so tallest means the most tall of all.',
            choices: ['-est', '-er', '-ful', '-ly'],
            spokenChoices: { '-est': 'the est suffix, like in tallest and fastest', '-er': 'the er suffix, like in taller', '-ful': 'the ful suffix, like in hopeful and careful', '-ly': 'the ly suffix, like in quickly' },
        },
        {
            word: 'kindness', correctSound: '-ness', highlightLetters: 'ness',
            hint: 'The suffix ness is added to kind to make kindness. ness turns a describing word into a noun, a naming word.',
            choices: ['-ness', '-ful', '-less', '-ment'],
            spokenChoices: { '-ness': 'the ness suffix, like in kindness and darkness', '-ful': 'the ful suffix, like in hopeful', '-less': 'the less suffix, like in hopeless and careless', '-ment': 'the ment suffix, like in movement and payment' },
        },
        {
            word: 'hopeful', correctSound: '-ful', highlightLetters: 'ful',
            hint: 'The suffix ful is added to hope to make hopeful. ful means full of... so hopeful means full of hope.',
            choices: ['-ful', '-less', '-ness', '-ment'],
            spokenChoices: { '-ful': 'the ful suffix, like in hopeful and careful', '-less': 'the less suffix, like in hopeless', '-ness': 'the ness suffix, like in kindness', '-ment': 'the ment suffix, like in movement' },
        },
        {
            word: 'unhappy', correctSound: 'un-', highlightLetters: 'un',
            hint: 'The prefix un comes at the beginning of unhappy. un means not... so unhappy means not happy.',
            choices: ['un-', 're-', 'pre-', 'dis-'],
            spokenChoices: { 'un-': 'the un prefix, like in unhappy and unkind', 're-': 'the re prefix, like in replay and return', 'pre-': 'the pre prefix, like in preschool and preview', 'dis-': 'the dis prefix, like in disagree and disappear' },
        },
        {
            word: 'replay', correctSound: 're-', highlightLetters: 're',
            hint: 'The prefix re comes at the beginning of replay. re means again... so replay means play again.',
            choices: ['re-', 'un-', 'pre-', 'mis-'],
            spokenChoices: { 're-': 'the re prefix, like in replay and return', 'un-': 'the un prefix, like in unhappy', 'pre-': 'the pre prefix, like in preschool', 'mis-': 'the mis prefix, like in mistake and misread' },
        },
    ],
};

const CARDS_PER_SESSION = 6;

// ─── Helpers ──────────────────────────────────────────────────
function starsForScore(score: number) {
    return score >= 88 ? 3 : score >= 62 ? 2 : 1;
}

function renderWordWithHighlight(
    word: string, letters: string, active: boolean, color: string,
) {
    if (!active || !letters) return <span>{word}</span>;
    const idx = word.toLowerCase().indexOf(letters.toLowerCase());
    if (idx === -1) return <span>{word}</span>;
    return (
        <span>
            {word.slice(0, idx)}
            <span style={{
                color, background: color + '1E',
                borderBottom: `3px solid ${color}`,
                borderRadius: 4, padding: '0 2px',
                transition: 'all 0.3s',
            }}>
                {word.slice(idx, idx + letters.length)}
            </span>
            {word.slice(idx + letters.length)}
        </span>
    );
}

// ─── Leo Badge ────────────────────────────────────────────────
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
// MAIN
// ══════════════════════════════════════════════════════════════
const Flashcard: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const islandId = parseInt(id || '1', 10);
    const meta = ISLAND_META[islandId];
    const { say, sayAll, cancel, speakOnHover, cancelHover, talking, ready } = useLeoSpeech();

    // ── Session ──
    const [cards, setCards] = useState<FlashCard[]>([]);
    const [cardIdx, setCardIdx] = useState(0);
    const [attempts, setAttempts] = useState(0);
    const [hintShown, setHintShown] = useState(false);
    const [selected, setSelected] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [leoMsg, setLeoMsg] = useState('');
    const [shakeKey, setShakeKey] = useState(0);
    const [sessionDone, setDone] = useState(false);
    const [results, setResults] = useState<{ correct: boolean; attempts: number }[]>([]);
    const [coinsEarned, setCoins] = useState(0);
    const [saving, setSaving] = useState(false);
    const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Init cards ──
    useEffect(() => {
        if (!meta) { navigate('/dashboard'); return; }
        const all = ISLAND_CARDS[islandId] ?? [];
        const shuffled = [...all].sort(() => Math.random() - 0.5).slice(0, CARDS_PER_SESSION);
        setCards(shuffled);
    }, [islandId]);

    const currentCard = cards[cardIdx];

    // ── Narrate full context for current card ──
    // Called on mount of each new card AND by "Speak again" button
    const narrateCard = useCallback((card: FlashCard) => {
        if (!card) return;
        setLeoMsg(`Which sound does ${card.word} start with?`);
        // MODIFIED: Combined into a single sentence with natural pause (ellipsis)
        say(`${card.word}... Which sound does ${card.word} start with?`, 'instruction');
    }, [say]);

    // ── When card changes ──
    useEffect(() => {
        if (!currentCard || !ready) return;
        setSelected(null);
        setIsCorrect(null);
        setAttempts(0);
        setHintShown(false);
        setLeoMsg('');
        if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);

        const t = setTimeout(() => narrateCard(currentCard), 420);
        return () => clearTimeout(t);
    }, [cardIdx, cards, ready]);

    // ── Speak again handler ──
    const handleSpeakAgain = useCallback(() => {
        if (!currentCard || sessionDone) return;
        if (hintShown) {
            // Re-read hint context
            const msg = `${currentCard.hint}`;
            setLeoMsg(msg);
            say(msg, 'hint');
        } else {
            narrateCard(currentCard);
        }
    }, [currentCard, sessionDone, hintShown, narrateCard, say]);

    // ── Answer handler ──
    const handleChoice = useCallback((choice: string) => {
        if (selected !== null || isCorrect !== null) return;
        const correct = choice === currentCard.correctSound;

        if (correct) {
            setSelected(choice);
            setIsCorrect(true);

            const praisePhrases = [
                'Amazing work! You got it right!',
                'Yes! That is exactly right! Well done!',
                'Brilliant! You are doing so well!',
                'Perfect! I knew you could do it!',
                'Fantastic! You are a phonics superstar!',
            ];
            const msg = praisePhrases[Math.floor(Math.random() * praisePhrases.length)];
            setLeoMsg(msg);
            say(msg, 'praise');

            const newResults = [...results, { correct: true, attempts }];
            setResults(newResults);

            autoAdvanceTimer.current = setTimeout(() => {
                if (cardIdx + 1 >= cards.length) finishSession(newResults);
                else setCardIdx(i => i + 1);
            }, 2000);

        } else {
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);
            setShakeKey(k => k + 1);

            if (newAttempts >= 3) {
                // Auto-advance
                const spoken = currentCard.correctSound.replace(/\//g, ''); const msg = `That one was tricky. The answer was ${spoken}. Let us keep going. You are doing great!`;
                setLeoMsg(msg);
                say(msg, 'hint');
                const newResults = [...results, { correct: false, attempts: newAttempts }];
                setResults(newResults);
                autoAdvanceTimer.current = setTimeout(() => {
                    if (cardIdx + 1 >= cards.length) finishSession(newResults);
                    else setCardIdx(i => i + 1);
                }, 3200);

            } else if (newAttempts >= 2) {
                // Show hint
                setHintShown(true);
                const hintText = `Good try! Here is a hint. ${currentCard.hint}`;
                setLeoMsg(hintText);
                say(hintText, 'hint');

            } else {
                // First wrong
                const tryAgain = [
                    'Good try! Listen again and have another go.',
                    'Almost! You can do it. Try once more.',
                    'Keep going! Listen carefully and try again.',
                ];
                const msg = tryAgain[Math.floor(Math.random() * tryAgain.length)];
                setLeoMsg(msg);
                say(msg, 'praise');
            }
        }
    }, [selected, isCorrect, currentCard, attempts, cardIdx, cards, results, say]);

    // ── Finish session ──
    const finishSession = async (finalResults: { correct: boolean; attempts: number }[]) => {
        const total = finalResults.length;
        const correct = finalResults.filter(r => r.correct).length;
        const weighted = finalResults.reduce((sum, r) => {
            if (r.correct && r.attempts === 0) return sum + 100;
            if (r.correct && r.attempts === 1) return sum + 70;
            if (r.correct) return sum + 40;
            return sum;
        }, 0);
        const score = Math.round(weighted / total);
        const coins = score >= 80 ? 10 : score >= 60 ? 6 : 3;
        setCoins(coins);
        setDone(true);

        const resultMsg = score >= 85
            ? `Fantastic work!  You got  ${correct}  out of  ${total}  correct.  You are a phonics superstar!`
            : score >= 60
                ? `Really great effort!  You got  ${correct}  out of  ${total}.  Every time you practise you get stronger!`
                : `Well done for trying every single one!  You got  ${correct}  out of  ${total}.  Let us keep practising together!`;
        setLeoMsg(resultMsg);
        say(resultMsg, 'results');

        setSaving(true);
        try {
            await progressApi.saveActivity({
                islandId,
                activityType: 'flashcard',
                score,
                totalQuestions: total,
                correct,
            });
        } catch (_) { }
        setSaving(false);
    };

    // ── Computed ──
    const finalScore = results.length > 0
        ? Math.round(results.reduce((s, r) => s + (r.correct && r.attempts === 0 ? 100 : r.correct && r.attempts === 1 ? 70 : r.correct ? 40 : 0), 0) / results.length)
        : 0;
    const stars = starsForScore(finalScore);
    const correctCount = results.filter(r => r.correct).length;
    const progressPct = cards.length > 0 ? (cardIdx / cards.length) * 100 : 0;

    if (!meta || cards.length === 0) return null;

    // ──────────────────────────────────────────────────────────
    // RESULTS SCREEN
    // ──────────────────────────────────────────────────────────
    if (sessionDone) {
        return (
            <>
                <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@400;600;700;800&family=Fraunces:opsz,wght@9..144,700;9..144,800&display=swap');
          *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
          html,body { height:100%; font-family:'Lexend',sans-serif; }
          body { background:#FDF6ED; }
          @keyframes popIn   { 0%{opacity:0;transform:scale(0.82) translateY(18px)} 70%{transform:scale(1.04)} 100%{opacity:1;transform:scale(1)} }
          @keyframes starPop { 0%{opacity:0;transform:scale(0) rotate(-25deg)} 70%{transform:scale(1.25) rotate(4deg)} 100%{opacity:1;transform:scale(1) rotate(0)} }
          @keyframes coinSpin{ 0%{transform:rotateY(0deg)} 100%{transform:rotateY(360deg)} }
          @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        `}</style>
                <div style={{
                    minHeight: '100vh', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', padding: '28px 18px',
                    background: `radial-gradient(ellipse at 20% 10%, ${meta.colorPale} 0%, transparent 55%),
                      radial-gradient(ellipse at 80% 90%, ${meta.colorPale} 0%, transparent 55%),
                      #FDF6ED`,
                }}>
                    <div style={{
                        background: '#fff', borderRadius: 28, padding: '40px 34px',
                        maxWidth: 420, width: '100%',
                        boxShadow: '0 12px 48px rgba(45,100,80,0.14)',
                        textAlign: 'center',
                        animation: 'popIn 0.55s cubic-bezier(0.34,1.2,0.64,1) both',
                    }}>
                        {/* Icon */}
                        <div style={{ fontSize: 56, marginBottom: 8 }}>
                            {stars === 3 ? '🏆' : stars === 2 ? '🌟' : '💪'}
                        </div>

                        {/* Title */}
                        <div style={{
                            fontFamily: "'Fraunces',serif", fontSize: '1.85rem',
                            fontWeight: 800, color: meta.colorDark, marginBottom: 6,
                        }}>
                            {stars === 3 ? 'Amazing!' : stars === 2 ? 'Great job!' : 'Keep going!'}
                        </div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#6B8876', marginBottom: 22, lineHeight: 1.7 }}>
                            Flash Cards · {meta.name} {meta.emoji}
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
                                { val: `${correctCount}/${cards.length}`, lbl: 'Correct' },
                            ].map(({ val, lbl }) => (
                                <div key={lbl} style={{
                                    background: meta.colorPale,
                                    border: `1.5px solid ${meta.color}33`,
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
                            +{coinsEarned} Sun Coins earned!
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

                        {/* Speak again on results */}
                        <button
                            onClick={handleSpeakAgain}
                            style={{
                                width: '100%', padding: '12px 16px', marginBottom: 12,
                                background: talking ? meta.colorPale : '#F8F4F0',
                                border: `1.5px solid ${meta.color}33`,
                                borderRadius: 14,
                                fontFamily: "'Lexend',sans-serif", fontSize: 14, fontWeight: 700, color: meta.colorDark,
                                cursor: 'pointer', transition: 'all 0.2s', minHeight: 50,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            }}
                        >
                            🔊 {talking ? 'Leo is speaking…' : 'Hear results again'}
                        </button>

                        {saving && (
                            <div style={{ fontSize: 12, color: '#6B8876', marginBottom: 14, fontWeight: 600 }}>
                                Saving your progress…
                            </div>
                        )}

                        <button
                            onClick={() => { cancel(); navigate(`/island/${islandId}/word_sort`); }}
                            style={{
                                width: '100%', padding: '16px', marginBottom: 10,
                                background: `linear-gradient(135deg, ${meta.colorDark}, ${meta.color})`,
                                color: '#fff', border: 'none', borderRadius: 16,
                                fontFamily: "'Lexend',sans-serif", fontSize: 17, fontWeight: 800,
                                cursor: 'pointer', transition: 'all 0.22s',
                                boxShadow: `0 5px 20px ${meta.color}44`,
                                minHeight: 58,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                            }}
                            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                            onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
                        >
                            Next Activity — Word Sort 🔀
                        </button>

                        <button
                            onClick={() => {
                                cancel();
                                const reshuffled = [...(ISLAND_CARDS[islandId] ?? [])]
                                    .sort(() => Math.random() - 0.5).slice(0, CARDS_PER_SESSION);
                                setCards(reshuffled); setCardIdx(0); setResults([]);
                                setDone(false); setSelected(null); setIsCorrect(null);
                                setAttempts(0); setHintShown(false); setLeoMsg('');
                            }}
                            style={{
                                width: '100%', padding: '13px',
                                background: 'transparent', color: meta.colorDark,
                                border: `2px solid ${meta.color}44`, borderRadius: 14,
                                fontFamily: "'Lexend',sans-serif", fontSize: 14, fontWeight: 700,
                                cursor: 'pointer', transition: 'all 0.2s', minHeight: 50,
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = meta.colorPale; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                        >
                            🔁 Try again
                        </button>
                    </div>
                </div>
            </>
        );
    }

    // ──────────────────────────────────────────────────────────
    // ACTIVITY SCREEN
    // ──────────────────────────────────────────────────────────
    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@400;600;700;800&family=Fraunces:opsz,wght@9..144,700;9..144,800&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        html, body { height:100%; overflow-x:hidden; }
        body {
          font-family:'Lexend',sans-serif; font-size:16px;
          line-height:1.65; letter-spacing:0.02em; background:#FDF6ED;
        }

        @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
        @keyframes fadeUp    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cardIn    { from{opacity:0;transform:scale(0.9) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes shake     { 0%{transform:translateX(0)} 15%{transform:translateX(-10px)} 35%{transform:translateX(10px)} 55%{transform:translateX(-7px)} 75%{transform:translateX(7px)} 90%{transform:translateX(-3px)} 100%{transform:translateX(0)} }
        @keyframes correctGlow { 0%{box-shadow:0 6px 28px rgba(45,100,80,0.1)} 50%{box-shadow:0 6px 36px rgba(39,174,96,0.28)} 100%{box-shadow:0 6px 28px rgba(39,174,96,0.18)} }
        @keyframes hintDrop  { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes choiceIn  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes leoMsgIn  { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
        @keyframes talkPulse { 0%,100%{box-shadow:0 3px 14px rgba(232,146,12,0.28)} 50%{box-shadow:0 3px 22px rgba(232,146,12,0.55)} }

        /* ── Page ── */
        .fc-page {
          min-height:100vh; display:flex; flex-direction:column;
          background:
            radial-gradient(ellipse at 4% 0%, ${meta.colorPale} 0%, transparent 48%),
            radial-gradient(ellipse at 96% 100%, ${meta.colorPale} 0%, transparent 48%),
            #FDF6ED;
        }

        /* ── Top bar ── */
        .fc-topbar {
          padding:14px 24px; display:flex; align-items:center; gap:12px;
          position:relative; z-index:10; animation:fadeIn 0.35s ease both;
          flex-wrap:wrap;
        }
        .fc-back {
          display:flex; align-items:center; gap:7px;
          background:rgba(255,255,255,0.88); border:1.5px solid rgba(45,139,126,0.12);
          border-radius:100px; padding:10px 20px;
          font-family:'Lexend',sans-serif; font-size:14px; font-weight:700; color:#304838;
          cursor:pointer; transition:all 0.2s; backdrop-filter:blur(8px);
          min-height:48px; flex-shrink:0;
        }
        .fc-back:hover { background:#fff; transform:translateX(-2px); }

        .fc-badge {
          display:flex; align-items:center; gap:7px;
          border:1.5px solid ${meta.color}44; border-radius:100px;
          padding:8px 16px; font-size:12px; font-weight:800;
          background:${meta.colorPale}; color:${meta.colorDark};
          letter-spacing:0.04em; flex-shrink:0;
        }

        .fc-progress-wrap { flex:1; min-width:120px; }
        .fc-progress-lbl { font-size:11px; font-weight:700; color:#6B8876; margin-bottom:5px; text-align:right; }
        .fc-progress-track { height:9px; background:#EDE3D4; border-radius:100px; overflow:hidden; }
        .fc-progress-fill {
          height:100%; border-radius:100px;
          background:linear-gradient(90deg, ${meta.colorDark}, ${meta.color});
          transition:width 0.55s cubic-bezier(0.34,1.2,0.64,1);
        }

        /* ── Speak-again persistent button ── */
        .fc-speak-btn {
          display:flex; align-items:center; gap:8px;
          background:${meta.colorPale}; border:1.5px solid ${meta.color}44;
          border-radius:100px; padding:10px 20px;
          font-family:'Lexend',sans-serif; font-size:13px; font-weight:700; color:${meta.colorDark};
          cursor:pointer; transition:all 0.2s; min-height:48px; flex-shrink:0;
          white-space:nowrap;
        }
        .fc-speak-btn:hover { background:${meta.colorPale}; filter:brightness(0.95); }
        .fc-speak-btn.talking { animation:talkPulse 1.2s ease-in-out infinite; }

        /* ── Main content ── */
        .fc-main {
          flex:1; display:flex; flex-direction:column; align-items:center;
          padding:6px 20px 36px; max-width:580px; margin:0 auto; width:100%;
        }

        /* ── Card dots ── */
        .fc-dots {
          display:flex; gap:8px; justify-content:center;
          margin-bottom:16px; animation:fadeIn 0.4s ease both;
        }
        .fc-dot { width:10px; height:10px; border-radius:50%; background:#EDE3D4; transition:all 0.3s; }
        .fc-dot.done    { background:${meta.color}; }
        .fc-dot.current { background:${meta.color}; transform:scale(1.45); box-shadow:0 0 0 3px ${meta.color}33; }

        /* ── Word card ── */
        .fc-card-outer {
          width:100%; margin-bottom:18px;
          animation:cardIn 0.45s cubic-bezier(0.34,1.2,0.64,1) both;
        }
        .fc-card-outer.shake { animation:shake 0.44s ease both; }

        .fc-word-card {
          background:#fff; border:2px solid rgba(255,255,255,0.95);
          border-radius:24px; padding:30px 26px 26px;
          text-align:center; position:relative; overflow:hidden;
          box-shadow:0 6px 28px rgba(45,100,80,0.1);
          transition:border-color 0.3s, box-shadow 0.3s;
        }
        .fc-word-card.correct {
          border-color:#27AE60;
          animation:correctGlow 0.8s ease both;
        }

        .fc-card-lbl {
          font-size:11.5px; font-weight:800; letter-spacing:0.16em;
          text-transform:uppercase; color:#6B8876; margin-bottom:14px;
          line-height:1.6;
        }
        .fc-word {
          font-family:'OpenDyslexic','Lexend',sans-serif;
          font-size:clamp(2.6rem, 10vw, 4rem);
          font-weight:700; color:#1C2E24;
          line-height:1.25; letter-spacing:0.05em;
          margin-bottom:20px; min-height:80px;
          display:flex; align-items:center; justify-content:center;
        }
        .fc-replay {
          display:inline-flex; align-items:center; gap:7px;
          background:${meta.colorPale}; border:1.5px solid ${meta.color}33;
          border-radius:100px; padding:9px 20px;
          font-family:'Lexend',sans-serif; font-size:13.5px; font-weight:700; color:${meta.colorDark};
          cursor:pointer; transition:all 0.18s; min-height:46px;
        }
        .fc-replay:hover { filter:brightness(0.96); }

        /* ── Hint ── */
        .fc-hint {
          background:#FEF3DC; border:1.5px solid rgba(232,146,12,0.28);
          border-radius:14px; padding:12px 16px; margin-top:14px;
          display:flex; align-items:flex-start; gap:9px;
          animation:hintDrop 0.32s ease both; text-align:left;
        }
        .fc-hint-text {
          font-size:14px; font-weight:600; color:#8A5C00;
          line-height:1.78; letter-spacing:0.025em;
          font-family:'OpenDyslexic','Lexend',sans-serif;
        }

        /* ── Question ── */
        .fc-question {
          font-size:18px; font-weight:700; color:#304838;
          text-align:center; margin-bottom:18px;
          line-height:1.55; letter-spacing:0.025em;
          animation:fadeUp 0.38s 0.12s ease both;
        }

        /* ── Choice grid ── */
        .fc-choices {
          display:grid; grid-template-columns:1fr 1fr;
          gap:13px; width:100%;
          animation:fadeUp 0.4s 0.2s ease both;
        }

        .fc-choice {
          min-height:84px; display:flex; flex-direction:column;
          align-items:center; justify-content:center; gap:4px;
          background:#fff; border:2.5px solid rgba(45,139,126,0.14);
          border-radius:20px; padding:14px 10px;
          font-family:'OpenDyslexic','Lexend',sans-serif;
          font-size:1.55rem; font-weight:700; color:#1C2E24;
          letter-spacing:0.05em; cursor:pointer;
          transition:all 0.18s cubic-bezier(0.34,1.2,0.64,1);
          box-shadow:0 3px 12px rgba(45,100,80,0.07);
          user-select:none; position:relative; overflow:hidden;
          animation:choiceIn 0.36s ease both;
        }
        .fc-choice:nth-child(1){ animation-delay:0.08s; }
        .fc-choice:nth-child(2){ animation-delay:0.14s; }
        .fc-choice:nth-child(3){ animation-delay:0.20s; }
        .fc-choice:nth-child(4){ animation-delay:0.26s; }

        .fc-choice:not(:disabled):hover {
          border-color:${meta.color};
          background:${meta.colorPale};
          transform:translateY(-4px) scale(1.03);
          box-shadow:0 8px 22px ${meta.color}2E;
        }
        .fc-choice:not(:disabled):active { transform:scale(0.97); }

        .fc-choice.is-correct {
          background:linear-gradient(135deg,#E6F8EE,#D0F0DE);
          border-color:#27AE60; color:#1A6B3A;
          box-shadow:0 4px 18px rgba(39,174,96,0.22);
        }
        .fc-choice.is-wrong {
          background:#FFF2F2; border-color:#E8AAAA; color:#B05060;
          animation:shake 0.36s ease both;
        }
        .fc-choice:disabled:not(.is-correct):not(.is-wrong) {
          opacity:0.45; cursor:not-allowed;
        }

        /* choice hover label (screen-reader style) */
        .fc-choice-hover-label {
          font-size:11px; font-weight:700; color:#6B8876;
          text-align:center; letter-spacing:0.05em;
          font-family:'Lexend',sans-serif;
          opacity:0; transition:opacity 0.2s;
        }
        .fc-choice:hover .fc-choice-hover-label { opacity:1; }

        /* ── Leo strip ── */
        .fc-leo-strip {
          width:100%; margin-top:18px;
          display:flex; align-items:flex-start; gap:13px;
          background:#fff; border:1.5px solid rgba(45,139,126,0.1);
          border-radius:18px; padding:15px 17px;
          box-shadow:0 2px 10px rgba(45,100,80,0.06);
          animation:leoMsgIn 0.36s ease both; min-height:70px;
        }
        .fc-leo-msg {
          font-size:15px; font-weight:600; color:#304838;
          line-height:1.78; letter-spacing:0.022em;
          padding-top:3px;
        }

        @media(max-width:500px){
          .fc-word   { font-size:2.3rem; }
          .fc-choice { font-size:1.28rem; min-height:74px; }
          .fc-topbar { padding:10px 12px; }
          .fc-badge  { display:none; }
        }
      `}</style>

            <div className="fc-page">

                {/* ── Top bar ── */}
                <div className="fc-topbar">
                    <button className="fc-back"
                        onClick={() => { cancel(); navigate(`/island/${islandId}`); }}>
                        ← Back
                    </button>

                    <div className="fc-badge">🃏 Flash Cards · {meta.name}</div>

                    <div className="fc-progress-wrap">
                        <div className="fc-progress-lbl">
                            Card {Math.min(cardIdx + 1, cards.length)} of {cards.length}
                        </div>
                        <div className="fc-progress-track">
                            <div className="fc-progress-fill" style={{ width: `${progressPct}%` }} />
                        </div>
                    </div>

                    {/* ── Persistent speak-again ── */}
                    <button
                        className={`fc-speak-btn${talking ? ' talking' : ''}`}
                        onClick={handleSpeakAgain}
                        aria-label="Hear the question again"
                    >
                        🔊 {talking ? 'Speaking…' : 'Speak again'}
                    </button>
                </div>

                {/* ── Main ── */}
                <div className="fc-main">

                    {/* Progress dots */}
                    <div className="fc-dots">
                        {cards.map((_, i) => (
                            <div key={i} className={`fc-dot${i < cardIdx ? ' done' : i === cardIdx ? ' current' : ''}`} />
                        ))}
                    </div>

                    {/* Word card */}
                    <div
                        key={`card-${cardIdx}-${shakeKey}`}
                        className={`fc-card-outer${selected !== null && !isCorrect ? ' shake' : ''}`}
                    >
                        <div className={`fc-word-card${isCorrect ? ' correct' : ''}`}>
                            <div className="fc-card-lbl">Look at this word · Listen carefully</div>

                            <div className="fc-word">
                                {renderWordWithHighlight(
                                    currentCard.word, currentCard.highlightLetters, hintShown, meta.color,
                                )}
                            </div>

                            <button
                                className="fc-replay"
                                // MODIFIED: Combined into a single sentence with periods for pauses
                                onClick={() => say(`The word is ${currentCard.word}. ${currentCard.word}.`, 'instruction')}
                            >
                                🔊 Hear word again
                            </button>

                            {/* Hint */}
                            {hintShown && (
                                <div className="fc-hint">
                                    <span style={{ fontSize: 18, flexShrink: 0, marginTop: 2 }}>💡</span>
                                    <span className="fc-hint-text">{currentCard.hint}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Question */}
                    <div className="fc-question">
                        Which sound do you hear at the start?
                    </div>

                    {/* Choices */}
                    <div className="fc-choices">
                        {currentCard.choices.map((choice) => {
                            const isChosen = selected === choice;
                            const isWrong = isChosen && isCorrect === false;
                            const isRight = isChosen && isCorrect === true;
                            const locked = isCorrect === true || attempts >= 3;
                            return (
                                <button
                                    key={choice}
                                    className={`fc-choice${isRight ? ' is-correct' : ''}${isWrong ? ' is-wrong' : ''}`}
                                    onClick={() => handleChoice(choice)}
                                    disabled={locked && !isRight}
                                    onMouseEnter={() => {
                                        if (!locked) speakOnHover(currentCard.spokenChoices[choice], 'choices');
                                    }}
                                    onMouseLeave={cancelHover}
                                    onFocus={() => {
                                        if (!locked) speakOnHover(currentCard.spokenChoices[choice], 'choices');
                                    }}
                                    onBlur={cancelHover}
                                    aria-label={`Answer: ${currentCard.spokenChoices[choice]}`}
                                >
                                    {choice}
                                    <span className="fc-choice-hover-label">hover to hear</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Leo message strip */}
                    {leoMsg && (
                        <div className="fc-leo-strip">
                            <LeoBadge size={46} talking={talking} />
                            <div className="fc-leo-msg">{leoMsg}</div>
                        </div>
                    )}

                </div>
            </div>
        </>
    );
};

export default Flashcard;