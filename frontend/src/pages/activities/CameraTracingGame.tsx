import React, { useState, useEffect, useCallback } from 'react';
import CameraCanvas from '../../components/tracing/CameraCanvas';
import {
    letterDots, numberDots,
    LETTER_ORDER, NUMBER_ORDER, FULL_ORDER,
    type CharacterPath, shuffleArray,
} from '../../data/dotPaths';
import { speakLetter } from '../../utils/speechHelper';

type Mode = 'letters' | 'numbers' | 'both';
type Difficulty = 'all' | 'easy' | 'medium' | 'hard';

interface RoundResult {
    character: string;
    accuracy: number;
    difficulty: string;
}

const difficultyColor = {
    easy: 'bg-green-100 text-green-700 border-green-300',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    hard: 'bg-red-100 text-red-700 border-red-300',
};

const CameraTracingGame: React.FC = () => {
    const [mode, setMode] = useState<Mode | null>(null);
    const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
    const [queue, setQueue] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [results, setResults] = useState<RoundResult[]>([]);
    const [celebrating, setCelebrating] = useState(false);
    const [lastAccuracy, setLastAccuracy] = useState(0);
    const [completed, setCompleted] = useState(false);
    const [canvasKey, setCanvasKey] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    const dataMap: Record<string, CharacterPath> = {
        ...letterDots, ...numberDots,
    };

    const currentKey = queue[currentIndex];
    const currentData = currentKey ? dataMap[currentKey] : undefined;

    // Build shuffled queue when mode + difficulty selected
    useEffect(() => {
        if (!mode || !difficulty) return;

        let baseOrder =
            mode === 'letters' ? LETTER_ORDER :
                mode === 'numbers' ? NUMBER_ORDER :
                    FULL_ORDER;

        if (difficulty !== 'all') {
            baseOrder = baseOrder.filter(
                (k) => dataMap[k]?.difficulty === difficulty
            );
        }

        setQueue(shuffleArray(baseOrder));
        setCurrentIndex(0);
        setResults([]);
        setCompleted(false);
    }, [mode, difficulty]);

    // Speak on new character
    useEffect(() => {
        if (currentData) speakLetter(currentData.character);
    }, [currentIndex, currentData]);

    const handleComplete = useCallback((accuracy: number) => {
        if (!currentData || isProcessing) return;  // 👈 block double calls

        setIsProcessing(true);                      // 👈 lock it
        setLastAccuracy(accuracy);
        setCelebrating(true);
        setResults((prev) => [
            ...prev,
            { character: currentKey, accuracy, difficulty: currentData.difficulty },
        ]);

        setTimeout(() => {
            setCelebrating(false);
            setIsProcessing(false);                   // 👈 unlock after moving on
            if (currentIndex < queue.length - 1) {
                setCurrentIndex((i) => i + 1);
                setCanvasKey((k) => k + 1);
            } else {
                setCompleted(true);
            }
        }, 2000);
    }, [currentData, currentIndex, currentKey, queue.length, isProcessing]);

    const handleRetry = () => {
        setCanvasKey((k) => k + 1);
        if (currentData) speakLetter(currentData.character);
    };

    const averageAccuracy =
        results.length > 0
            ? Math.round(results.reduce((a, b) => a + b.accuracy, 0) / results.length)
            : 0;

    // ── Screen 1: Mode selection ──────────────────────────────
    if (!mode) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex flex-col items-center justify-center gap-8 p-6">
                <h1 className="text-5xl font-bold text-indigo-700 text-center">✏️ Tracing Game</h1>
                <p className="text-gray-500 text-xl text-center">What do you want to practice?</p>
                <div className="flex flex-wrap gap-6 justify-center">
                    {[
                        { label: '🔤 Letters', value: 'letters' as Mode },
                        { label: '🔢 Numbers', value: 'numbers' as Mode },
                        { label: '🌟 Both!', value: 'both' as Mode },
                    ].map(({ label, value }) => (
                        <button key={value} onClick={() => setMode(value)}
                            className="px-10 py-6 rounded-2xl bg-white border-2 border-indigo-200 text-indigo-700 text-2xl font-bold shadow-lg hover:bg-indigo-50 hover:border-indigo-400 transition">
                            {label}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // ── Screen 2: Difficulty selection ───────────────────────
    if (!difficulty) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex flex-col items-center justify-center gap-8 p-6">
                <h1 className="text-4xl font-bold text-indigo-700 text-center">Choose Difficulty</h1>
                <div className="flex flex-wrap gap-6 justify-center">
                    {[
                        { label: '⭐ All Levels', value: 'all' as Difficulty, color: 'border-indigo-300 text-indigo-700' },
                        { label: '🟢 Easy', value: 'easy' as Difficulty, color: 'border-green-300  text-green-700' },
                        { label: '🟡 Medium', value: 'medium' as Difficulty, color: 'border-yellow-300 text-yellow-700' },
                        { label: '🔴 Hard', value: 'hard' as Difficulty, color: 'border-red-300    text-red-700' },
                    ].map(({ label, value, color }) => (
                        <button key={value} onClick={() => setDifficulty(value)}
                            className={`px-10 py-6 rounded-2xl bg-white border-2 text-xl font-bold shadow-lg hover:opacity-80 transition ${color}`}>
                            {label}
                        </button>
                    ))}
                </div>
                <button onClick={() => setMode(null)} className="text-gray-400 hover:text-gray-600 text-sm">
                    ← Back
                </button>
            </div>
        );
    }

    // ── Screen 3: Final summary ───────────────────────────────
    if (completed) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex flex-col items-center justify-center gap-6 p-6">
                <div className="text-8xl">🏆</div>
                <h1 className="text-4xl font-bold text-green-700">Amazing job!</h1>
                <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
                    <h2 className="text-xl font-bold text-gray-700 mb-4 text-center">Your Results</h2>

                    {/* Average score */}
                    <div className="text-center mb-4">
                        <div className="text-5xl font-bold text-indigo-600">{averageAccuracy}%</div>
                        <div className="text-gray-400 text-sm">Average Accuracy</div>
                    </div>

                    {/* Per character results */}
                    <div className="flex flex-wrap gap-2 justify-center mb-4">
                        {results.map((r, i) => (
                            <div key={i}
                                className={`px-3 py-2 rounded-xl border text-sm font-bold flex flex-col items-center
                  ${r.accuracy >= 80 ? 'bg-green-50 border-green-300 text-green-700' :
                                        r.accuracy >= 50 ? 'bg-yellow-50 border-yellow-300 text-yellow-700' :
                                            'bg-red-50 border-red-300 text-red-700'}`}>
                                <span className="text-lg">{r.character}</span>
                                <span>{r.accuracy}%</span>
                            </div>
                        ))}
                    </div>

                    {/* Stars */}
                    <div className="text-center text-3xl">
                        {averageAccuracy >= 80 ? '⭐⭐⭐' : averageAccuracy >= 50 ? '⭐⭐' : '⭐'}
                    </div>
                </div>

                <div className="flex gap-4">
                    <button onClick={() => { setMode(null); setDifficulty(null); }}
                        className="px-8 py-4 rounded-2xl bg-indigo-500 text-white text-xl font-bold hover:bg-indigo-600">
                        Play Again 🔄
                    </button>
                </div>
            </div>
        );
    }

    // ── Screen 4: Main game ───────────────────────────────────
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex flex-col items-center py-6 px-4 gap-4">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl font-bold text-indigo-700">
                    Trace the {isNaN(Number(currentKey)) ? 'Letter' : 'Number'}
                </h1>
                {currentData && (
                    <span className={`inline-block mt-1 px-3 py-1 rounded-full border text-xs font-semibold
            ${difficultyColor[currentData.difficulty]}`}>
                        {currentData.difficulty}
                    </span>
                )}
                <p className="text-gray-400 mt-1 text-sm">{currentData?.hint}</p>
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-md">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{currentIndex + 1} of {queue.length}</span>
                    <span>
                        {results.length > 0
                            ? `Avg: ${Math.round(results.reduce((a, b) => a + b.accuracy, 0) / results.length)}%`
                            : ''}
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full transition-all"
                        style={{ width: `${((currentIndex) / queue.length) * 100}%` }} />
                </div>
            </div>

            {/* Big character */}
            <div className="text-8xl font-bold text-indigo-100 select-none leading-none">
                {currentKey}
            </div>

            {/* Camera canvas */}
            {currentData && !completed && (
                <CameraCanvas
                    key={canvasKey}
                    dots={currentData.dots}
                    onComplete={handleComplete}
                />
            )}

            {/* Bottom controls */}
            <div className="flex gap-3">
                <button onClick={handleRetry}
                    className="px-5 py-3 rounded-xl bg-white border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition">
                    🔄 Retry
                </button>
                <button onClick={() => speakLetter(currentKey)}
                    className="px-5 py-3 rounded-xl bg-white border-2 border-indigo-200 text-indigo-600 font-semibold hover:bg-indigo-50 transition">
                    🔊 Hear it again
                </button>
                <button onClick={() => {
                    if (currentIndex < queue.length - 1) {
                        setCurrentIndex((i) => i + 1);
                        setCanvasKey((k) => k + 1);
                    } else setCompleted(true);
                }}
                    className="px-5 py-3 rounded-xl bg-gray-100 text-gray-500 font-semibold hover:bg-gray-200 transition">
                    Skip →
                </button>
            </div>

            {/* Celebration overlay */}
            {celebrating && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
                    <div className="bg-white rounded-3xl p-10 text-center shadow-2xl">
                        <div className="text-7xl mb-3">
                            {lastAccuracy >= 80 ? '🌟' : lastAccuracy >= 50 ? '👍' : '💪'}
                        </div>
                        <h2 className="text-3xl font-bold text-green-600">
                            {lastAccuracy >= 80 ? 'Amazing!' : lastAccuracy >= 50 ? 'Good job!' : 'Keep going!'}
                        </h2>
                        <p className="text-gray-400 mt-2 text-lg">Accuracy: {lastAccuracy}%</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CameraTracingGame;