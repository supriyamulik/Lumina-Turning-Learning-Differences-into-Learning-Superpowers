// frontend/src/pages/activities/Blending.tsx
// Route:  /island/:id/blending
// Flow:   WordSort → Blending → /island/:id/listen_find
//
// CONCEPT: Leo plays individual phoneme sounds one by one with animated
// sound-wave tiles. The student watches/listens, then taps the correct
// whole-word picture card. A "slow blend" replay button re-plays each
// phoneme separately. A "fast blend" button plays them merged.
// After selecting: Leo confirms/corrects, the word "snaps together"
// with a tile-merging animation.
//
// DYSLEXIA ACCESSIBILITY (non-negotiable):
// • Leo narrates EVERYTHING automatically — instruction, each phoneme, choices
// • Every phoneme tile spoken on hover/focus
// • Every choice card spoken on hover/focus (word + description)
// • No timers anywhere
// • Wrong = warm wiggle + Leo gives a new hint, never "that's wrong"
// • After 2 wrong: Leo reveals which picture and why
// • OpenDyslexic font on all text, min 20px
// • Picture cards use emoji + word label — dual coding for retention
// • Slow / Fast replay controls give the student full control of pacing
// • Phoneme tiles animate with a sound-wave pulse so the student
//   can SEE the sound as well as hear it (visual-auditory-kinesthetic)

import React, {
  useCallback, useEffect, useRef, useState,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { progressApi } from '../../lib/api';
import { useLeoSpeech } from '../../hooks/useLeoSpeech';

// ── Types ──────────────────────────────────────────────────────
interface BlendItem {
  id: string;
  phonemes: string[];   // e.g. ['/k/', '/æ/', '/t/']
  spoken: string[];   // what TTS actually says per phoneme e.g. ['kuh','aa','tuh']
  word: string;     // the blended answer e.g. "cat"
  emoji: string;     // picture representation  🐱
  distractors: { word: string; emoji: string }[];   // 2 wrong picture choices
  slowBlend: string;     // Leo slow-blend spoken text e.g. "k...a...t"
  fastBlend: string;     // Leo fast-blend spoken text e.g. "cat"
  leoHint: string;     // hint after first wrong attempt
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

// ── Per-island blend banks ─────────────────────────────────────
const ISLAND_BLENDS: Record<number, BlendItem[]> = {

  // ── Island 1: Simple 3-phoneme CVC words ──
  1: [
    {
      id: 'i1-1', phonemes: ['/s/', '/ʌ/', '/n/'], spoken: ['sss', 'uh', 'nnn'],
      word: 'sun', emoji: '☀️',
      distractors: [{ word: 'sit', emoji: '🪑' }, { word: 'net', emoji: '🕸️' }],
      slowBlend: 's... u... n', fastBlend: 'sun',
      leoHint: 'Listen again — the first sound is sss, like a snake. What does sss-uh-nnn make?',
    },
    {
      id: 'i1-2', phonemes: ['/k/', '/æ/', '/t/'], spoken: ['kuh', 'aa', 'tuh'],
      word: 'cat', emoji: '🐱',
      distractors: [{ word: 'cup', emoji: '☕' }, { word: 'bat', emoji: '🦇' }],
      slowBlend: 'k... a... t', fastBlend: 'cat',
      leoHint: 'The sounds are kuh, aa, tuh. Say them faster and faster until they stick together!',
    },
    {
      id: 'i1-3', phonemes: ['/d/', '/ɒ/', '/ɡ/'], spoken: ['duh', 'oh', 'guh'],
      word: 'dog', emoji: '🐶',
      distractors: [{ word: 'dig', emoji: '⛏️' }, { word: 'log', emoji: '🪵' }],
      slowBlend: 'd... o... g', fastBlend: 'dog',
      leoHint: 'Duh — oh — guh. Blend the sounds together like glue. What animal could it be?',
    },
    {
      id: 'i1-4', phonemes: ['/h/', '/æ/', '/t/'], spoken: ['huh', 'aa', 'tuh'],
      word: 'hat', emoji: '🎩',
      distractors: [{ word: 'hot', emoji: '🔥' }, { word: 'bat', emoji: '🏏' }],
      slowBlend: 'h... a... t', fastBlend: 'hat',
      leoHint: 'Huh — aa — tuh. You wear this on your head!',
    },
    {
      id: 'i1-5', phonemes: ['/b/', '/ɪ/', '/ɡ/'], spoken: ['buh', 'ih', 'guh'],
      word: 'big', emoji: '🐘',
      distractors: [{ word: 'bag', emoji: '👜' }, { word: 'bit', emoji: '🍪' }],
      slowBlend: 'b... i... g', fastBlend: 'big',
      leoHint: 'Buh — ih — guh. An elephant is very... what?',
    },
    {
      id: 'i1-6', phonemes: ['/r/', '/ʌ/', '/n/'], spoken: ['rrr', 'uh', 'nnn'],
      word: 'run', emoji: '🏃',
      distractors: [{ word: 'sun', emoji: '☀️' }, { word: 'rug', emoji: '🪵' }],
      slowBlend: 'r... u... n', fastBlend: 'run',
      leoHint: 'Rrr — uh — nnn. What do legs do fast?',
    },
    {
      id: 'i1-7', phonemes: ['/p/', '/ɒ/', '/t/'], spoken: ['puh', 'oh', 'tuh'],
      word: 'pot', emoji: '🪴',
      distractors: [{ word: 'pit', emoji: '🕳️' }, { word: 'dot', emoji: '⚫' }],
      slowBlend: 'p... o... t', fastBlend: 'pot',
      leoHint: 'Puh — oh — tuh. You cook soup in a...?',
    },
    {
      id: 'i1-8', phonemes: ['/w/', '/ɛ/', '/b/'], spoken: ['wuh', 'eh', 'buh'],
      word: 'web', emoji: '🕸️',
      distractors: [{ word: 'wet', emoji: '💧' }, { word: 'bed', emoji: '🛏️' }],
      slowBlend: 'w... e... b', fastBlend: 'web',
      leoHint: 'Wuh — eh — buh. A spider makes a...?',
    },
  ],

  // ── Island 2: CVC with all short vowels ──
  2: [
    {
      id: 'i2-1', phonemes: ['/f/', '/ɪ/', '/ʃ/'], spoken: ['fff', 'ih', 'shh'],
      word: 'fish', emoji: '🐟',
      distractors: [{ word: 'dish', emoji: '🍽️' }, { word: 'fit', emoji: '💪' }],
      slowBlend: 'f... i... sh', fastBlend: 'fish',
      leoHint: 'Fff — ih — shh. It swims in the ocean!',
    },
    {
      id: 'i2-2', phonemes: ['/ʃ/', '/ɪ/', '/p/'], spoken: ['shh', 'ih', 'puh'],
      word: 'ship', emoji: '🚢',
      distractors: [{ word: 'chip', emoji: '🍟' }, { word: 'shop', emoji: '🛍️' }],
      slowBlend: 'sh... i... p', fastBlend: 'ship',
      leoHint: 'Shh — ih — puh. It sails on the sea!',
    },
    {
      id: 'i2-3', phonemes: ['/t/', '/r/', '/ʌ/', '/k/'], spoken: ['tuh', 'rrr', 'uh', 'kuh'],
      word: 'truck', emoji: '🚚',
      distractors: [{ word: 'track', emoji: '🛤️' }, { word: 'trick', emoji: '🎭' }],
      slowBlend: 't... r... u... ck', fastBlend: 'truck',
      leoHint: 'Tuh — rrr — uh — kuh. A big vehicle that carries things!',
    },
    {
      id: 'i2-4', phonemes: ['/f/', '/r/', '/ɒ/', '/ɡ/'], spoken: ['fff', 'rrr', 'oh', 'guh'],
      word: 'frog', emoji: '🐸',
      distractors: [{ word: 'blog', emoji: '📝' }, { word: 'from', emoji: '📬' }],
      slowBlend: 'f... r... o... g', fastBlend: 'frog',
      leoHint: 'Fff — rrr — oh — guh. It jumps and says ribbit!',
    },
    {
      id: 'i2-5', phonemes: ['/s/', '/t/', '/ɒ/', '/p/'], spoken: ['sss', 'tuh', 'oh', 'puh'],
      word: 'stop', emoji: '🛑',
      distractors: [{ word: 'step', emoji: '👣' }, { word: 'shop', emoji: '🏪' }],
      slowBlend: 's... t... o... p', fastBlend: 'stop',
      leoHint: 'Sss — tuh — oh — puh. The red sign at the road says...?',
    },
    {
      id: 'i2-6', phonemes: ['/k/', '/r/', '/æ/', '/b/'], spoken: ['kuh', 'rrr', 'aa', 'buh'],
      word: 'crab', emoji: '🦀',
      distractors: [{ word: 'grab', emoji: '🤲' }, { word: 'drab', emoji: '🩶' }],
      slowBlend: 'c... r... a... b', fastBlend: 'crab',
      leoHint: 'Kuh — rrr — aa — buh. It walks sideways on the beach!',
    },
    {
      id: 'i2-7', phonemes: ['/d/', '/r/', '/ʌ/', '/m/'], spoken: ['duh', 'rrr', 'uh', 'mmm'],
      word: 'drum', emoji: '🥁',
      distractors: [{ word: 'drip', emoji: '💧' }, { word: 'trim', emoji: '✂️' }],
      slowBlend: 'd... r... u... m', fastBlend: 'drum',
      leoHint: 'Duh — rrr — uh — mmm. You hit this to make music!',
    },
    {
      id: 'i2-8', phonemes: ['/ɡ/', '/r/', '/æ/', '/s/'], spoken: ['guh', 'rrr', 'aa', 'sss'],
      word: 'grass', emoji: '🌿',
      distractors: [{ word: 'glass', emoji: '🥛' }, { word: 'class', emoji: '🏫' }],
      slowBlend: 'g... r... a... ss', fastBlend: 'grass',
      leoHint: 'Guh — rrr — aa — sss. It is green and grows in a garden!',
    },
  ],

  // ── Island 3: Digraph blends ──
  3: [
    {
      id: 'i3-1', phonemes: ['/tʃ/', '/ɛ/', '/s/', '/t/'], spoken: ['chh', 'eh', 'sss', 'tuh'],
      word: 'chest', emoji: '📦',
      distractors: [{ word: 'nest', emoji: '🪺' }, { word: 'test', emoji: '📝' }],
      slowBlend: 'ch... e... s... t', fastBlend: 'chest',
      leoHint: 'Chh — eh — sss — tuh. A treasure box is called a...?',
    },
    {
      id: 'i3-2', phonemes: ['/θ/', '/r/', '/oʊ/', '/n/'], spoken: ['thh', 'rrr', 'oh', 'nnn'],
      word: 'throne', emoji: '👑',
      distractors: [{ word: 'phone', emoji: '📱' }, { word: 'stone', emoji: '🪨' }],
      slowBlend: 'th... r... o... ne', fastBlend: 'throne',
      leoHint: 'Thh — rrr — oh — nnn. A king sits on a...?',
    },
    {
      id: 'i3-3', phonemes: ['/ʃ/', '/eɪ/', '/k/'], spoken: ['shh', 'ay', 'kuh'],
      word: 'shake', emoji: '🤝',
      distractors: [{ word: 'snake', emoji: '🐍' }, { word: 'lake', emoji: '🏞️' }],
      slowBlend: 'sh... a... ke', fastBlend: 'shake',
      leoHint: 'Shh — ay — kuh. You do this with someone\'s hand!',
    },
    {
      id: 'i3-4', phonemes: ['/w/', '/iː/', '/t/'], spoken: ['wuh', 'ee', 'tuh'],
      word: 'wheat', emoji: '🌾',
      distractors: [{ word: 'beat', emoji: '🥁' }, { word: 'heat', emoji: '🌡️' }],
      slowBlend: 'wh... ea... t', fastBlend: 'wheat',
      leoHint: 'Wuh — ee — tuh. Bread is made from...?',
    },
    {
      id: 'i3-5', phonemes: ['/k/', '/l/', '/ɒ/', '/k/'], spoken: ['kuh', 'lll', 'oh', 'kuh'],
      word: 'clock', emoji: '🕐',
      distractors: [{ word: 'block', emoji: '🧱' }, { word: 'flock', emoji: '🐦' }],
      slowBlend: 'cl... o... ck', fastBlend: 'clock',
      leoHint: 'Kuh — lll — oh — kuh. It tells you the time!',
    },
    {
      id: 'i3-6', phonemes: ['/θ/', '/ʌ/', '/m/'], spoken: ['thh', 'uh', 'mmm'],
      word: 'thumb', emoji: '👍',
      distractors: [{ word: 'plum', emoji: '🍑' }, { word: 'drum', emoji: '🥁' }],
      slowBlend: 'th... u... mb', fastBlend: 'thumb',
      leoHint: 'Thh — uh — mmm. The short fat finger on your hand!',
    },
    {
      id: 'i3-7', phonemes: ['/s/', '/p/', '/l/', '/æ/', '/ʃ/'], spoken: ['sss', 'puh', 'lll', 'aa', 'shh'],
      word: 'splash', emoji: '💦',
      distractors: [{ word: 'flash', emoji: '⚡' }, { word: 'crash', emoji: '💥' }],
      slowBlend: 'spl... a... sh', fastBlend: 'splash',
      leoHint: 'Sss — puh — lll — aa — shh. What happens when you jump in a puddle?',
    },
    {
      id: 'i3-8', phonemes: ['/s/', '/t/', '/r/', '/ɪ/', '/ŋ/'], spoken: ['sss', 'tuh', 'rrr', 'ih', 'ng'],
      word: 'string', emoji: '🧵',
      distractors: [{ word: 'spring', emoji: '🌸' }, { word: 'sting', emoji: '🐝' }],
      slowBlend: 'str... i... ng', fastBlend: 'string',
      leoHint: 'Sss — tuh — rrr — ih — ng. You tie things with this thin thread!',
    },
  ],

  // ── Island 4: Long vowel blends ──
  4: [
    {
      id: 'i4-1', phonemes: ['/r/', '/eɪ/', '/n/'], spoken: ['rrr', 'ay', 'nnn'],
      word: 'rain', emoji: '🌧️',
      distractors: [{ word: 'ruin', emoji: '🏚️' }, { word: 'main', emoji: '🔧' }],
      slowBlend: 'r... ai... n', fastBlend: 'rain',
      leoHint: 'Rrr — ay — nnn. Water that falls from clouds!',
    },
    {
      id: 'i4-2', phonemes: ['/l/', '/iː/', '/f/'], spoken: ['lll', 'ee', 'fff'],
      word: 'leaf', emoji: '🍃',
      distractors: [{ word: 'beef', emoji: '🥩' }, { word: 'reef', emoji: '🪸' }],
      slowBlend: 'l... ea... f', fastBlend: 'leaf',
      leoHint: 'Lll — ee — fff. Green flat thing on a tree!',
    },
    {
      id: 'i4-3', phonemes: ['/s/', '/n/', '/oʊ/', '/f/', '/l/', '/eɪ/', '/k/'],
      spoken: ['sss', 'nnn', 'oh', 'fff', 'lll', 'ay', 'kuh'],
      word: 'snowflake', emoji: '❄️',
      distractors: [{ word: 'sunshine', emoji: '☀️' }, { word: 'raindrop', emoji: '💧' }],
      slowBlend: 'sn... o... w... fl... a... ke', fastBlend: 'snowflake',
      leoHint: 'It falls in winter and has six sides. Every single one is unique!',
    },
    {
      id: 'i4-4', phonemes: ['/b/', '/oʊ/', '/t/'], spoken: ['buh', 'oh', 'tuh'],
      word: 'boat', emoji: '⛵',
      distractors: [{ word: 'coat', emoji: '🧥' }, { word: 'goat', emoji: '🐐' }],
      slowBlend: 'b... oa... t', fastBlend: 'boat',
      leoHint: 'Buh — oh — tuh. It floats on water and has a sail!',
    },
    {
      id: 'i4-5', phonemes: ['/t/', '/r/', '/eɪ/', '/n/'], spoken: ['tuh', 'rrr', 'ay', 'nnn'],
      word: 'train', emoji: '🚂',
      distractors: [{ word: 'plain', emoji: '✈️' }, { word: 'brain', emoji: '🧠' }],
      slowBlend: 'tr... ai... n', fastBlend: 'train',
      leoHint: 'Tuh — rrr — ay — nnn. It runs on rails and toots its horn!',
    },
    {
      id: 'i4-6', phonemes: ['/d/', '/r/', '/iː/', '/m/'], spoken: ['duh', 'rrr', 'ee', 'mmm'],
      word: 'dream', emoji: '💭',
      distractors: [{ word: 'cream', emoji: '🍦' }, { word: 'steam', emoji: '♨️' }],
      slowBlend: 'dr... ea... m', fastBlend: 'dream',
      leoHint: 'Duh — rrr — ee — mmm. What happens in your mind while you sleep!',
    },
    {
      id: 'i4-7', phonemes: ['/l/', '/aɪ/', '/t/'], spoken: ['lll', 'eye', 'tuh'],
      word: 'light', emoji: '💡',
      distractors: [{ word: 'night', emoji: '🌙' }, { word: 'sight', emoji: '👁️' }],
      slowBlend: 'l... igh... t', fastBlend: 'light',
      leoHint: 'Lll — eye — tuh. A bulb gives off...?',
    },
    {
      id: 'i4-8', phonemes: ['/s/', '/m/', '/aɪ/', '/l/'], spoken: ['sss', 'mmm', 'eye', 'lll'],
      word: 'smile', emoji: '😊',
      distractors: [{ word: 'while', emoji: '⏳' }, { word: 'tile', emoji: '🔲' }],
      slowBlend: 'sm... i... le', fastBlend: 'smile',
      leoHint: 'Sss — mmm — eye — lll. What a happy face makes!',
    },
  ],

  // ── Island 5: Multisyllabic morpheme blending ──
  5: [
    {
      id: 'i5-1', phonemes: ['re-', 'play'], spoken: ['ree', 'play'],
      word: 'replay', emoji: '🔄',
      distractors: [{ word: 'display', emoji: '🖥️' }, { word: 'repay', emoji: '💳' }],
      slowBlend: 're... play', fastBlend: 'replay',
      leoHint: 'Re means again. Play. So replay means to play again!',
    },
    {
      id: 'i5-2', phonemes: ['un-', 'hap-', 'py'], spoken: ['unn', 'hap', 'pee'],
      word: 'unhappy', emoji: '😢',
      distractors: [{ word: 'happy', emoji: '😊' }, { word: 'snappy', emoji: '🐊' }],
      slowBlend: 'un... hap... py', fastBlend: 'unhappy',
      leoHint: 'Un means not. Happy. So unhappy means not happy!',
    },
    {
      id: 'i5-3', phonemes: ['but-', 'ter-', 'fly'], spoken: ['butt', 'err', 'fly'],
      word: 'butterfly', emoji: '🦋',
      distractors: [{ word: 'dragonfly', emoji: '🪲' }, { word: 'firefly', emoji: '✨' }],
      slowBlend: 'but... ter... fly', fastBlend: 'butterfly',
      leoHint: 'Butt — err — fly. A beautiful insect with colourful wings!',
    },
    {
      id: 'i5-4', phonemes: ['rain-', 'bow'], spoken: ['rayn', 'bow'],
      word: 'rainbow', emoji: '🌈',
      distractors: [{ word: 'raindrop', emoji: '💧' }, { word: 'elbow', emoji: '💪' }],
      slowBlend: 'rain... bow', fastBlend: 'rainbow',
      leoHint: 'Rain — bow. The colourful arc in the sky after it rains!',
    },
    {
      id: 'i5-5', phonemes: ['sun-', 'flow-', 'er'], spoken: ['sunn', 'flow', 'err'],
      word: 'sunflower', emoji: '🌻',
      distractors: [{ word: 'sunshine', emoji: '☀️' }, { word: 'cornflower', emoji: '💐' }],
      slowBlend: 'sun... flow... er', fastBlend: 'sunflower',
      leoHint: 'Sun — flow — er. A tall yellow flower that faces the sun!',
    },
    {
      id: 'i5-6', phonemes: ['pre-', 'view'], spoken: ['pree', 'view'],
      word: 'preview', emoji: '👁️',
      distractors: [{ word: 'review', emoji: '⭐' }, { word: 'renew', emoji: '♻️' }],
      slowBlend: 'pre... view', fastBlend: 'preview',
      leoHint: 'Pre means before. View means see. Preview means see it before it is released!',
    },
    {
      id: 'i5-7', phonemes: ['back-', 'pack'], spoken: ['bak', 'pak'],
      word: 'backpack', emoji: '🎒',
      distractors: [{ word: 'haystack', emoji: '🌾' }, { word: 'setback', emoji: '⬅️' }],
      slowBlend: 'back... pack', fastBlend: 'backpack',
      leoHint: 'Back — pack. You carry this on your back to school!',
    },
    {
      id: 'i5-8', phonemes: ['hand-', 'shake'], spoken: ['hand', 'shayk'],
      word: 'handshake', emoji: '🤝',
      distractors: [{ word: 'earthquake', emoji: '🌋' }, { word: 'milkshake', emoji: '🥤' }],
      slowBlend: 'hand... shake', fastBlend: 'handshake',
      leoHint: 'Hand — shake. What you do when you meet someone for the first time!',
    },
  ],
};

const ITEMS_PER_SESSION = 6;

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

// ── Leo Badge ──────────────────────────────────────────────────
const LeoBadge: React.FC<{ size?: number; talking?: boolean }> = ({
  size = 48, talking,
}) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    background: talking
      ? 'linear-gradient(135deg,#FFB830,#E8920C)'
      : 'linear-gradient(135deg,#F5A623,#E8920C)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size * 0.52, flexShrink: 0,
    boxShadow: `0 3px 14px rgba(232,146,12,${talking ? '0.60' : '0.28'})`,
    border: `${talking ? '3px' : '2.5px'} solid rgba(255,255,255,${talking ? '0.9' : '0.65'})`,
    transition: 'all 0.25s ease',
    userSelect: 'none' as const,
  }}>🦁</div>
);

// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════
const Blending: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const islandId = parseInt(id || '1', 10);
  const meta = ISLAND_META[islandId];
  const allItems = ISLAND_BLENDS[islandId] ?? ISLAND_BLENDS[1];

  const { say, cancel, speakOnHover, cancelHover, talking, ready } = useLeoSpeech();

  // ── State ──────────────────────────────────────────────────
  const [items, setItems] = useState<BlendItem[]>([]);
  const [itemIdx, setItemIdx] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);   // chosen word
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [leoMsg, setLeoMsg] = useState('');
  const [activeTile, setActiveTile] = useState<number | null>(null);   // which phoneme tile is "sounding"
  const [isBlending, setIsBlending] = useState(false);                 // snap-together anim
  const [blendSpeed, setBlendSpeed] = useState<'slow' | 'fast' | null>(null);
  const [sessionDone, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showChoices, setShowChoices] = useState(false);
  const resultsRef = useRef<{ correct: boolean; attempts: number }[]>([]);
  const blendTimer = useRef<ReturnType<typeof setTimeout>[]>([]);

  const item = items[itemIdx];

  // ── CRITICAL: useMemo so choices are shuffled ONCE per item, never on re-render
  // Without this, every hover (talking state change → re-render) calls shuffle()
  // again and the cards swap positions mid-interaction
  const choices = React.useMemo(() => {
    if (!item) return [];
    return shuffle([
      { word: item.word, emoji: item.emoji },
      ...item.distractors,
    ]);
  }, [item?.id]); // only reshuffle when the item itself changes

  // ── Init ───────────────────────────────────────────────────
  useEffect(() => {
    if (!meta) { navigate('/dashboard'); return; }
    setItems(shuffle(allItems).slice(0, ITEMS_PER_SESSION));
  }, [islandId]);

  // ── On new item ────────────────────────────────────────────
  useEffect(() => {
    if (!item || !ready) return;
    setSelected(null);
    setIsCorrect(null);
    setAttempts(0);
    setActiveTile(null);
    setIsBlending(false);
    setBlendSpeed(null);
    setShowChoices(false);
    setLeoMsg('');
    blendTimer.current.forEach(clearTimeout);
    blendTimer.current = [];

    // Brief pause then auto-play slow blend
    const t = setTimeout(() => {
      setLeoMsg(`Listen to each sound… ${item.slowBlend}`);
      playSlow(item, false);
    }, 550);
    return () => clearTimeout(t);
  }, [itemIdx, items, ready]);

  // ── Play phonemes one by one (slow) ───────────────────────
  const playSlow = useCallback((target: BlendItem, userTriggered = true) => {
    if (!target) return;
    blendTimer.current.forEach(clearTimeout);
    blendTimer.current = [];
    setBlendSpeed('slow');
    setActiveTile(null);

    const msg = userTriggered
      ? `Slow blend: ${target.slowBlend}`
      : `Listen to each sound: ${target.slowBlend}`;
    setLeoMsg(msg);

    // Stagger each phoneme tile activation + TTS
    target.spoken.forEach((ph, i) => {
      const t1 = setTimeout(() => {
        setActiveTile(i);
        say(ph, 'word');
      }, i * 900);
      blendTimer.current.push(t1);
    });

    // After all phonemes, show choice cards
    const totalDelay = target.spoken.length * 900 + 400;
    const t2 = setTimeout(() => {
      setActiveTile(null);
      setBlendSpeed(null);
      setShowChoices(true);
      if (!userTriggered) {
        setLeoMsg('Which word did you hear? Tap the picture!');
        say('Which word did you hear? Tap the picture!', 'instruction');
      }
    }, totalDelay);
    blendTimer.current.push(t2);
  }, [say]);

  // ── Play fast blend (the whole word) ──────────────────────
  const playFast = useCallback((target: BlendItem) => {
    if (!target) return;
    blendTimer.current.forEach(clearTimeout);
    blendTimer.current = [];
    setBlendSpeed('fast');
    setActiveTile(null);
    setIsBlending(true);
    const msg = `Fast blend: ${target.fastBlend}`;
    setLeoMsg(msg);
    say(target.fastBlend, 'word');
    setTimeout(() => { setIsBlending(false); setBlendSpeed(null); }, 900);
  }, [say]);

  // ── Handle choice selection ────────────────────────────────
  const handleChoice = useCallback((word: string) => {
    if (selected !== null || isCorrect !== null || !item) return;
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    setSelected(word);

    if (word === item.word) {
      setIsCorrect(true);
      setIsBlending(true);
      const praises = [
        `Yes! The sounds blend to make "${item.word}"! Amazing listening!`,
        `Brilliant! ${item.slowBlend} blends into "${item.word}"! You got it!`,
        `Perfect blend! You heard all the sounds and put them together!`,
        `Incredible! That is exactly right — "${item.word}"!`,
        `Superstar! You blended those sounds like a reading champion!`,
      ];
      const msg = praises[Math.floor(Math.random() * praises.length)];
      setLeoMsg(msg);
      say(msg, 'praise');
      resultsRef.current.push({ correct: true, attempts: newAttempts });

      setTimeout(() => {
        setIsBlending(false);
        if (itemIdx < items.length - 1) {
          setTimeout(() => setItemIdx(i => i + 1), 600);
        } else {
          finishSession();
        }
      }, 1600);

    } else {
      setIsCorrect(false);
      setTimeout(() => {
        setSelected(null);
        setIsCorrect(null);
      }, 800);

      if (newAttempts === 1) {
        const msg = `Good try! Listen one more time… ${item.leoHint}`;
        setLeoMsg(msg);
        say(msg, 'hint');
      } else {
        // Reveal answer after 2 wrong — never let them feel stuck
        const msg = `The sounds blend to make "${item.word}"! ${item.emoji} Let us try the next one!`;
        setLeoMsg(msg);
        say(msg, 'hint');
        resultsRef.current.push({ correct: false, attempts: newAttempts });
        setTimeout(() => {
          if (itemIdx < items.length - 1) {
            setItemIdx(i => i + 1);
          } else {
            finishSession();
          }
        }, 2800);
      }
    }
  }, [selected, isCorrect, item, attempts, itemIdx, items, say]);

  // ── Finish session ─────────────────────────────────────────
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
      ? `Wow! You blended ${correct} out of ${total} words perfectly! Your listening ears are incredible!`
      : score >= 60
        ? `Great blending, ${correct} out of ${total}! You are getting stronger every day!`
        : `Well done for trying every single one! You blended ${correct} out of ${total}. Keep going — you are learning!`;
    setLeoMsg(msg);
    say(msg, 'results');

    setSaving(true);
    try {
      await progressApi.saveActivity({
        islandId,
        activityType: 'blending',
        score,
        totalQuestions: total,
        correct,
      });
    } catch (_) { }
    setSaving(false);
  };

  if (!meta || !item) return null;

  // ── RESULTS SCREEN ────────────────────────────────────────
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
    const coins = score >= 80 ? 10 : score >= 60 ? 6 : 3;

    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@400;600;700;800&family=Fraunces:opsz,wght@9..144,700;9..144,800&display=swap');
          *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
          body{font-family:'Lexend',sans-serif;background:#FDF6ED}
          @keyframes popIn{0%{opacity:0;transform:scale(0.82) translateY(20px)}70%{transform:scale(1.05)}100%{opacity:1;transform:scale(1)}}
          @keyframes starPop{0%{opacity:0;transform:scale(0) rotate(-30deg)}70%{transform:scale(1.3) rotate(5deg)}100%{opacity:1;transform:scale(1)}}
          @keyframes coinSpin{from{transform:rotateY(0)}to{transform:rotateY(360deg)}}
        `}</style>
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: '28px 18px',
          background: `radial-gradient(ellipse at 20% 10%,${meta.colorPale} 0%,transparent 55%),
                      radial-gradient(ellipse at 80% 90%,${meta.colorPale} 0%,transparent 55%),#FDF6ED`,
        }}>
          <div style={{
            background: '#fff', borderRadius: 28, padding: '40px 32px',
            maxWidth: 420, width: '100%', textAlign: 'center',
            boxShadow: '0 12px 52px rgba(45,100,80,0.13)',
            animation: 'popIn 0.55s cubic-bezier(0.34,1.2,0.64,1) both',
          }}>
            <div style={{ fontSize: 60, marginBottom: 6 }}>
              {stars === 3 ? '🏆' : stars === 2 ? '🌟' : '💪'}
            </div>
            <div style={{
              fontFamily: "'Fraunces',serif",
              fontSize: '1.9rem', fontWeight: 800, color: meta.colorDark, marginBottom: 6,
            }}>
              {stars === 3 ? 'Perfect Blending!' : stars === 2 ? 'Great Listening!' : 'Keep Practising!'}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#6B8876', marginBottom: 22 }}>
              Blending · {meta.name} {meta.emoji}
            </div>

            {/* Stars */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 22 }}>
              {[1, 2, 3].map(s => (
                <span key={s} style={{
                  fontSize: 44,
                  opacity: s <= stars ? 1 : 0.15,
                  filter: s <= stars ? 'none' : 'grayscale(1)',
                  animation: s <= stars ? `starPop 0.5s ${(s - 1) * 0.2}s cubic-bezier(0.34,1.5,0.64,1) both` : 'none',
                }}>⭐</span>
              ))}
            </div>

            {/* Scores */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
              {[
                { val: `${score}%`, lbl: 'Score' },
                { val: `${correct}/${total}`, lbl: 'Blended' },
              ].map(({ val, lbl }) => (
                <div key={lbl} style={{
                  background: meta.colorPale, border: `1.5px solid ${meta.color}33`,
                  borderRadius: 16, padding: '12px 22px', minWidth: 90,
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: meta.colorDark, lineHeight: 1 }}>{val}</div>
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
              borderRadius: 14, padding: '11px 22px', marginBottom: 22,
              fontSize: 15, fontWeight: 800, color: '#B36A00',
            }}>
              <span style={{ display: 'inline-block', animation: 'coinSpin 2.4s linear infinite' }}>☀️</span>
              +{coins} Sun Coins earned!
            </div>

            {/* Leo */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 13,
              background: '#F8F4F0', borderRadius: 16, padding: '14px 16px',
              marginBottom: 26, textAlign: 'left',
            }}>
              <LeoBadge size={44} talking={talking} />
              <div style={{
                fontFamily: "'Lexend',sans-serif",
                fontSize: 14, fontWeight: 600, color: '#304838', lineHeight: 1.78,
              }}>
                {leoMsg}
              </div>
            </div>

            {saving && (
              <div style={{ fontSize: 12, color: '#6B8876', marginBottom: 14, fontWeight: 600 }}>
                Saving your progress…
              </div>
            )}

            <button
              onClick={() => { cancel(); navigate(`/island/${islandId}/listen_find`); }}
              style={{
                width: '100%', padding: '16px', marginBottom: 10,
                background: `linear-gradient(135deg,${meta.colorDark},${meta.color})`,
                color: '#fff', border: 'none', borderRadius: 16,
                fontFamily: "'Lexend',sans-serif", fontSize: 17, fontWeight: 800,
                cursor: 'pointer', boxShadow: `0 5px 20px ${meta.color}44`,
                minHeight: 58, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
              }}
            >
              Next Activity — Listen &amp; Find 👂
            </button>

            <button
              onClick={() => {
                cancel();
                setItemIdx(0);
                resultsRef.current = [];
                setDone(false);
                setLeoMsg('');
                setItems(shuffle(allItems).slice(0, ITEMS_PER_SESSION));
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

  // ── ACTIVITY SCREEN ───────────────────────────────────────
  const progressPct = Math.round((itemIdx / items.length) * 100);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@400;600;700;800&family=Fraunces:opsz,wght@9..144,700;9..144,800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{height:100%;overflow-x:hidden;font-family:'Lexend',sans-serif;background:#FDF6ED}

        @keyframes fadeIn   {from{opacity:0}to{opacity:1}}
        @keyframes fadeUp   {from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes tileIn   {from{opacity:0;transform:translateY(16px) scale(0.88)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes soundWave{0%,100%{transform:scaleY(1)}25%{transform:scaleY(1.7)}75%{transform:scaleY(0.5)}}
        @keyframes tileActive{0%{transform:scale(1)}30%{transform:scale(1.14)}70%{transform:scale(1.08)}100%{transform:scale(1)}}
        @keyframes blendSnap {0%{letter-spacing:0.4em;opacity:0.7}100%{letter-spacing:0.02em;opacity:1}}
        @keyframes cardIn   {from{opacity:0;transform:scale(0.86) translateY(20px)}70%{transform:scale(1.04)}to{opacity:1;transform:scale(1)}}
        @keyframes shake    {0%{transform:translateX(0)}15%{transform:translateX(-9px)}40%{transform:translateX(9px)}65%{transform:translateX(-6px)}85%{transform:translateX(6px)}100%{transform:translateX(0)}}
        @keyframes correctBurst{0%{transform:scale(1)}40%{transform:scale(1.12)}100%{transform:scale(1)}}
        @keyframes pulse    {0%,100%{box-shadow:0 0 0 0 rgba(232,146,12,0.5)}60%{box-shadow:0 0 0 10px rgba(232,146,12,0)}}
        @keyframes talkRing {0%,100%{box-shadow:0 3px 14px rgba(232,146,12,0.28)}50%{box-shadow:0 3px 22px rgba(232,146,12,0.6)}}
        @keyframes barIn    {from{width:0}}

        .bl-page{
          min-height:100vh;display:flex;flex-direction:column;
          background:
            radial-gradient(ellipse at 5% 0%,${meta.colorPale} 0%,transparent 40%),
            radial-gradient(ellipse at 95% 100%,${meta.colorPale} 0%,transparent 40%),
            #FDF6ED;
        }

        /* ─ Top bar ─ */
        .bl-topbar{
          padding:14px 22px;display:flex;align-items:center;
          gap:12px;flex-wrap:wrap;animation:fadeIn 0.35s ease both;
          position:relative;z-index:10;
        }
        .bl-back{
          display:flex;align-items:center;gap:7px;
          background:rgba(255,255,255,0.9);border:1.5px solid rgba(45,139,126,0.12);
          border-radius:100px;padding:10px 20px;
          font-size:14px;font-weight:700;color:#304838;
          cursor:pointer;transition:all 0.2s;min-height:48px;flex-shrink:0;
        }
        .bl-back:hover{background:#fff;transform:translateX(-2px);}
        .bl-badge{
          display:flex;align-items:center;gap:7px;
          border:1.5px solid ${meta.color}44;border-radius:100px;
          padding:8px 16px;font-size:12px;font-weight:800;
          background:${meta.colorPale};color:${meta.colorDark};flex-shrink:0;
        }
        .bl-prog-wrap{flex:1;min-width:120px;}
        .bl-prog-lbl{font-size:11px;font-weight:700;color:#6B8876;margin-bottom:5px;text-align:right;}
        .bl-prog-track{height:9px;background:#EDE3D4;border-radius:100px;overflow:hidden;}
        .bl-prog-fill{
          height:100%;border-radius:100px;
          background:linear-gradient(90deg,${meta.colorDark},${meta.color});
          transition:width 0.6s cubic-bezier(0.34,1.2,0.64,1);
        }

        /* ─ Main ─ */
        .bl-main{
          flex:1;display:flex;flex-direction:column;align-items:center;
          padding:0 18px 36px;max-width:660px;margin:0 auto;width:100%;
        }

        /* ─ Leo strip ─ */
        .bl-leo{
          display:flex;align-items:flex-start;gap:13px;
          background:#fff;border:1.5px solid rgba(45,139,126,0.1);
          border-radius:18px;padding:14px 17px;
          box-shadow:0 2px 10px rgba(45,100,80,0.06);
          margin-bottom:18px;width:100%;
          min-height:68px;animation:fadeUp 0.35s ease both;
        }
        .bl-leo-msg{
          font-size:15px;font-weight:600;color:#304838;
          line-height:1.78;letter-spacing:0.022em;padding-top:2px;
          font-family:'Lexend',sans-serif;
        }

        /* ─ Phoneme tiles ─ */
        .bl-tiles-wrap{
          width:100%;display:flex;flex-direction:column;
          align-items:center;margin-bottom:20px;
          animation:fadeUp 0.38s 0.08s ease both;
        }
        .bl-tiles-label{
          font-size:11px;font-weight:800;color:${meta.color};
          text-transform:uppercase;letter-spacing:0.16em;margin-bottom:12px;
        }
        .bl-tiles{
          display:flex;flex-wrap:wrap;gap:10px;justify-content:center;
          align-items:flex-end;
        }

        /* individual tile */
        .bl-tile{
          position:relative;
          min-width:64px;padding:16px 20px;border-radius:18px;
          border:2.5px solid rgba(45,139,126,0.14);
          background:#fff;
          box-shadow:0 3px 12px rgba(45,100,80,0.07);
          display:flex;flex-direction:column;align-items:center;gap:6px;
          transition:all 0.22s cubic-bezier(0.34,1.2,0.64,1);
          animation:tileIn 0.4s ease both;
          cursor:pointer;
        }
        .bl-tile:hover{
          border-color:${meta.color};
          box-shadow:0 6px 20px ${meta.color}28;
          background:${meta.colorPale};
        }
        .bl-tile.active{
          border-color:${meta.color};
          background:${meta.colorPale};
          animation:tileActive 0.5s ease both;
          box-shadow:0 6px 22px ${meta.color}40;
          transform:translateY(-4px) scale(1.08);
        }
        .bl-tile.blending{
          animation:blendSnap 0.6s cubic-bezier(0.34,1.4,0.64,1) both;
        }
        .bl-phoneme{
          font-family:'OpenDyslexic','Lexend',sans-serif;
          font-size:1.35rem;font-weight:800;color:#1C2E24;
          letter-spacing:0.04em;
        }
        .bl-tile.active .bl-phoneme{color:${meta.colorDark};}

        /* sound-wave bars inside tile */
        .bl-wave{
          display:flex;align-items:center;gap:2.5px;height:16px;
        }
        .bl-bar{
          width:3.5px;border-radius:2px;
          background:${meta.color};opacity:0.35;height:6px;
          transition:all 0.15s;
        }
        .bl-tile.active .bl-bar{
          opacity:1;
          animation:soundWave 0.45s ease-in-out infinite;
        }
        .bl-tile.active .bl-bar:nth-child(1){animation-delay:0s;   height:10px;}
        .bl-tile.active .bl-bar:nth-child(2){animation-delay:0.07s;height:14px;}
        .bl-tile.active .bl-bar:nth-child(3){animation-delay:0.14s;height:10px;}
        .bl-tile.active .bl-bar:nth-child(4){animation-delay:0.07s;height:7px;}

        /* ─ Replay controls ─ */
        .bl-controls{
          display:flex;gap:10px;justify-content:center;
          margin-bottom:22px;flex-wrap:wrap;
          animation:fadeUp 0.4s 0.12s ease both;
        }
        .bl-btn{
          display:flex;align-items:center;gap:8px;
          border:none;border-radius:100px;padding:12px 22px;
          font-family:'Lexend',sans-serif;font-size:14px;font-weight:800;
          cursor:pointer;min-height:50px;transition:all 0.2s;flex-shrink:0;
        }
        .bl-btn-slow{
          background:${meta.colorPale};color:${meta.colorDark};
          border:2px solid ${meta.color}44;
        }
        .bl-btn-slow:hover{background:${meta.color}22;transform:scale(1.04);}
        .bl-btn-slow.active{
          background:${meta.colorPale};border-color:${meta.color};
          animation:pulse 1.4s ease-in-out infinite;
        }
        .bl-btn-fast{
          background:${meta.color};color:#fff;
          box-shadow:0 4px 16px ${meta.color}44;
        }
        .bl-btn-fast:hover{background:${meta.colorDark};transform:scale(1.04);}
        .bl-btn-fast.active{animation:pulse 1.4s ease-in-out infinite;}
        .bl-speak-btn{
          background:rgba(255,255,255,0.88);color:#304838;
          border:2px solid rgba(45,139,126,0.18);
        }
        .bl-speak-btn:hover{background:#fff;}
        .bl-speak-btn.talking{animation:talkRing 1.2s ease-in-out infinite;}

        /* ─ Choice cards ─ */
        .bl-choices-label{
          font-size:11px;font-weight:800;color:#6B8876;
          text-transform:uppercase;letter-spacing:0.16em;
          margin-bottom:12px;text-align:center;
          animation:fadeIn 0.3s ease both;
        }
        .bl-choices{
          display:flex;flex-wrap:wrap;gap:14px;
          justify-content:center;width:100%;
          align-items:stretch;
          animation:fadeUp 0.42s ease both;
        }
        .bl-card{
          display:flex;flex-direction:column;align-items:center;gap:8px;
          background:#fff;border:2.5px solid rgba(45,139,126,0.13);
          border-radius:22px;padding:20px 18px;
          min-width:130px;flex:1;max-width:175px;
          cursor:pointer;
          transition:border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
          box-shadow:0 4px 14px rgba(45,100,80,0.07);
          animation:cardIn 0.45s cubic-bezier(0.34,1.2,0.64,1) both;
        }
        .bl-card:hover{
          border-color:${meta.color};
          box-shadow:0 8px 28px ${meta.color}38;
          background:${meta.colorPale};
        }
        .bl-card:focus{outline:3px solid ${meta.color};outline-offset:2px;}
        .bl-card.correct{
          border-color:#27AE60;
          background:linear-gradient(135deg,#E6F9EF,#C8F0D8);
          animation:correctBurst 0.5s ease both;
        }
        .bl-card.wrong{
          border-color:#E89090;background:#FFF3F3;
          animation:shake 0.44s ease both;
        }
        .bl-card-emoji{font-size:3rem;line-height:1;user-select:none;}
        .bl-card-word{
          font-family:'OpenDyslexic','Lexend',sans-serif;
          font-size:1.2rem;font-weight:800;color:#1C2E24;
          letter-spacing:0.04em;text-align:center;
        }

        /* ─ Hint box ─ */
        .bl-hint{
          margin-top:14px;padding:13px 16px;
          background:${meta.colorPale};border:1.5px solid ${meta.color}33;
          border-radius:14px;width:100%;
          font-size:14px;font-weight:600;color:${meta.colorDark};
          line-height:1.72;text-align:center;
          animation:fadeUp 0.3s ease both;
        }

        @media(max-width:500px){
          .bl-card{min-width:110px;padding:16px 12px;}
          .bl-card-emoji{font-size:2.5rem;}
          .bl-badge{display:none;}
          .bl-phoneme{font-size:1.1rem;}
        }
      `}</style>

      <div className="bl-page">

        {/* ─ Top bar ─ */}
        <div className="bl-topbar">
          <button className="bl-back" onClick={() => { cancel(); navigate(`/island/${islandId}`); }}>
            ← Back
          </button>
          <div className="bl-badge">🔀 Blending · {meta.name}</div>
          <div className="bl-prog-wrap">
            <div className="bl-prog-lbl">
              {itemIdx + 1} of {items.length} words
            </div>
            <div className="bl-prog-track">
              <div className="bl-prog-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
          <button
            className={`bl-btn bl-speak-btn${talking ? ' talking' : ''}`}
            onClick={() => {
              cancel();
              const msg = `Listen again: ${item.slowBlend}`;
              setLeoMsg(`Listen to each sound… ${item.slowBlend}`);
              say(msg, 'instruction');
            }}
          >
            🔊 {talking ? 'Speaking…' : 'Speak again'}
          </button>
        </div>

        <div className="bl-main">

          {/* ─ Leo strip ─ */}
          {leoMsg && (
            <div className="bl-leo">
              <LeoBadge size={46} talking={talking} />
              <div className="bl-leo-msg">{leoMsg}</div>
            </div>
          )}

          {/* ─ Phoneme tiles ─ */}
          <div className="bl-tiles-wrap">
            <div className="bl-tiles-label">
              {isBlending && isCorrect ? '✨ Blending together…' : 'Sound pieces — click any tile to hear it'}
            </div>
            <div className="bl-tiles">
              {item.phonemes.map((ph, i) => (
                <div
                  key={i}
                  className={[
                    'bl-tile',
                    activeTile === i ? 'active' : '',
                    isBlending && isCorrect ? 'blending' : '',
                  ].join(' ')}
                  style={{ animationDelay: `${i * 0.09}s` }}
                  onClick={() => {
                    setActiveTile(i);
                    say(item.spoken[i], 'word');
                    setTimeout(() => setActiveTile(a => a === i ? null : a), 700);
                  }}
                  onMouseEnter={() => speakOnHover(item.spoken[i], 'word')}
                  onMouseLeave={cancelHover}
                  onFocus={() => speakOnHover(item.spoken[i], 'word')}
                  onBlur={cancelHover}
                  tabIndex={0}
                  role="button"
                  aria-label={`Sound: ${ph}. Press to hear it.`}
                >
                  <div className="bl-phoneme">{ph}</div>
                  <div className="bl-wave">
                    {[0, 1, 2, 3].map(b => (
                      <div key={b} className="bl-bar"
                        style={{ animationDelay: `${b * 0.07}s` }} />
                    ))}
                  </div>
                </div>
              ))}

              {/* Blended word tile — shown after correct answer */}
              {isCorrect && (
                <div style={{
                  display: 'flex', alignItems: 'center',
                  gap: 6, padding: '0 6px',
                  animation: 'fadeIn 0.3s ease both',
                }}>
                  <span style={{ fontSize: 28, fontWeight: 800, color: meta.colorDark, opacity: 0.6 }}>→</span>
                  <div className={`bl-tile blending`} style={{
                    background: `linear-gradient(135deg,${meta.colorDark}18,${meta.color}22)`,
                    borderColor: meta.color,
                    boxShadow: `0 6px 22px ${meta.color}33`,
                  }}>
                    <div className="bl-phoneme" style={{ color: meta.colorDark, fontSize: '1.5rem' }}>
                      {item.word}
                    </div>
                    <div style={{ fontSize: 22 }}>{item.emoji}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ─ Replay controls ─ */}
          <div className="bl-controls">
            <button
              className={`bl-btn bl-btn-slow${blendSpeed === 'slow' ? ' active' : ''}`}
              onClick={() => playSlow(item, true)}
              disabled={isCorrect === true}
              aria-label="Play each sound slowly"
            >
              🐢 Slow blend
            </button>
            <button
              className={`bl-btn bl-btn-fast${blendSpeed === 'fast' ? ' active' : ''}`}
              onClick={() => playFast(item)}
              disabled={isCorrect === true}
              aria-label="Play the full blended word"
            >
              ⚡ Fast blend
            </button>
          </div>

          {/* ─ Choice cards ─ */}
          {showChoices && isCorrect !== true && (
            <>
              <div className="bl-choices-label">Which word did you hear? Tap the picture 👇</div>
              <div className="bl-choices">
                {choices.map((c, ci) => {
                  const state = selected === c.word
                    ? (isCorrect === null ? '' : isCorrect ? 'correct' : 'wrong')
                    : '';
                  return (
                    <div
                      key={c.word}
                      className={`bl-card${state ? ' ' + state : ''}`}
                      style={{ animationDelay: `${ci * 0.1}s` }}
                      onClick={() => handleChoice(c.word)}
                      onMouseEnter={() => speakOnHover(`${c.word}. ${c.emoji}`, 'word')}
                      onMouseLeave={cancelHover}
                      onFocus={() => speakOnHover(`${c.word}`, 'word')}
                      onBlur={cancelHover}
                      tabIndex={0}
                      role="button"
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleChoice(c.word); } }}
                      aria-label={`Choice: ${c.word}`}
                      aria-pressed={selected === c.word}
                    >
                      <div className="bl-card-emoji">{c.emoji}</div>
                      <div className="bl-card-word">{c.word}</div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* If choices not shown yet, show a hint */}
          {!showChoices && !isCorrect && (
            <div className="bl-hint">
              👂 Listen to all the sounds — then the picture cards will appear!
              <br />
              <span style={{ fontSize: 13, opacity: 0.75 }}>
                Tap 🐢 Slow blend to hear each sound, or ⚡ Fast blend to hear the whole word.
              </span>
            </div>
          )}

          {/* After wrong attempt — show hint */}
          {attempts > 0 && isCorrect === false && (
            <div className="bl-hint">
              {item.leoHint}
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default Blending;