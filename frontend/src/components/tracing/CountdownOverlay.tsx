import React, { useEffect, useState } from 'react';
import { playCountdownBeep } from '../../utils/soundHelper';

interface CountdownOverlayProps {
    onComplete: () => void;
    canvasSize: number;
}

const CountdownOverlay: React.FC<CountdownOverlayProps> = ({
    onComplete,
    canvasSize,
}) => {
    const [count, setCount] = useState<number | string>(3);
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const steps = [
            { value: 3, delay: 0 },
            { value: 2, delay: 1000 },
            { value: 1, delay: 2000 },
            { value: '🚀 GO!', delay: 3000 },
        ];

        const timers: ReturnType<typeof setTimeout>[] = [];

        steps.forEach(({ value, delay }) => {
            const t = setTimeout(() => {
                setCount(value);
                playCountdownBeep(value === '🚀 GO!');
            }, delay);
            timers.push(t);
        });

        // Hide overlay and notify parent after GO
        const done = setTimeout(() => {
            setVisible(false);
            onComplete();
        }, 3800);
        timers.push(done);

        return () => timers.forEach(clearTimeout);
    }, [onComplete]);

    if (!visible) return null;

    const isGo = count === '🚀 GO!';

    return (
        <div
            className="absolute inset-0 flex items-center justify-center z-20"
            style={{
                background: 'rgba(0,0,0,0.55)',
                width: canvasSize,
                height: canvasSize,
            }}
        >
            <div
                key={String(count)}
                className={`flex items-center justify-center rounded-full font-black select-none
          transition-all duration-200
          ${isGo
                        ? 'text-5xl text-green-300 w-48 h-48 bg-green-900/60 border-4 border-green-400'
                        : 'text-8xl text-white w-40 h-40 bg-indigo-700/70 border-4 border-indigo-300'
                    }`}
                style={{
                    animation: 'popIn 0.25s ease-out',
                }}
            >
                {count}
            </div>

            <style>{`
        @keyframes popIn {
          0%   { transform: scale(0.4); opacity: 0; }
          70%  { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
        </div>
    );
};

export default CountdownOverlay;