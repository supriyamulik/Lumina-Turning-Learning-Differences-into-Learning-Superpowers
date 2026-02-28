import React, { useState, useEffect } from 'react';
import TracingCanvas from '../components/TracingCanvas';
import { letterPaths, type LetterPath } from '../data/letterPaths';
import confetti from 'canvas-confetti';

const LETTERS_ORDER = ['O', 'C', 'A', 'B', 'S'];

const TracingGame: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [scores, setScores] = useState<number[]>([]);
    const [key, setKey] = useState(0); // force re-mount canvas on next letter
    const [showResult, setShowResult] = useState(false);
    const [lastAccuracy, setLastAccuracy] = useState(0);

    const currentLetter = LETTERS_ORDER[currentIndex];
    const letterData: LetterPath = letterPaths[currentLetter];

    const handleComplete = (accuracy: number) => {
        setLastAccuracy(accuracy);
        setShowResult(true);
        setScores((prev) => [...prev, accuracy]);

        if (accuracy >= 70) {
            confetti({
                particleCount: 120,
                spread: 80,
                origin: { y: 0.6 },
                colors: ['#6366f1', '#22c55e', '#f59e0b'],
            });
        }
    };

    const handleNext = () => {
        setShowResult(false);
        setKey((k) => k + 1);
        if (currentIndex < LETTERS_ORDER.length - 1) {
            setCurrentIndex((i) => i + 1);
        } else {
            setCurrentIndex(0); // loop back or show final score
        }
    };

    const handleRetry = () => {
        setShowResult(false);
        setKey((k) => k + 1);
    };

    const averageScore =
        scores.length > 0
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex flex-col items-center py-10 px-4">
            {/* Header */}
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-bold text-indigo-700 mb-1">✏️ Trace the Letter</h1>
                <p className="text-gray-500 text-lg">{letterData.hint}</p>
            </div>

            {/* Progress */}
            <div className="flex gap-2 mb-6">
                {LETTERS_ORDER.map((l, i) => (
                    <div
                        key={l}
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
              ${i < currentIndex ? 'bg-green-400 text-white' : ''}
              ${i === currentIndex ? 'bg-indigo-500 text-white ring-4 ring-indigo-200' : ''}
              ${i > currentIndex ? 'bg-gray-200 text-gray-500' : ''}
            `}
                    >
                        {l}
                    </div>
                ))}
            </div>

            {/* Big Letter Preview */}
            <div className="text-9xl font-bold text-indigo-100 select-none mb-2 leading-none">
                {currentLetter}
            </div>

            {/* Canvas */}
            <TracingCanvas
                key={key}
                letterData={letterData}
                onComplete={handleComplete}
            />

            {/* Instructions */}
            <p className="mt-4 text-gray-400 text-sm">
                🖱️ Click and drag to trace • Follow the dotted line • Green = great job!
            </p>

            {/* Result overlay / action buttons */}
            {showResult && (
                <div className="mt-6 bg-white rounded-2xl shadow-xl p-6 text-center w-80">
                    <div className="text-5xl mb-3">
                        {lastAccuracy >= 80 ? '🌟' : lastAccuracy >= 60 ? '👍' : '💪'}
                    </div>
                    <h2 className="text-2xl font-bold mb-1">
                        {lastAccuracy >= 80
                            ? 'Amazing!'
                            : lastAccuracy >= 60
                                ? 'Good job!'
                                : 'Keep practicing!'}
                    </h2>
                    <p className="text-gray-500 mb-4">Accuracy: {lastAccuracy}%</p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={handleRetry}
                            className="px-5 py-2 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200"
                        >
                            🔄 Try Again
                        </button>
                        <button
                            onClick={handleNext}
                            className="px-5 py-2 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-600"
                        >
                            Next Letter →
                        </button>
                    </div>
                </div>
            )}

            {/* Running score */}
            {scores.length > 0 && (
                <div className="mt-4 text-gray-500 text-sm">
                    Average Score: <span className="font-bold text-indigo-600">{averageScore}%</span>
                    {' '}across {scores.length} letter{scores.length > 1 ? 's' : ''}
                </div>
            )}
        </div>
    );
};

export default TracingGame;