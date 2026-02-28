export interface LetterPath {
    letter: string;
    viewBox: string;
    pathData: string;       // SVG path for the guide
    startPoint: { x: number; y: number };
    difficulty: 'easy' | 'medium' | 'hard';
    hint: string;
}

export const letterPaths: Record<string, LetterPath> = {
    A: {
        letter: 'A',
        viewBox: '0 0 200 200',
        pathData: 'M 100 20 L 20 180 M 100 20 L 180 180 M 45 130 L 155 130',
        startPoint: { x: 100, y: 20 },
        difficulty: 'medium',
        hint: 'Start at the top, go down-left, then down-right!',
    },
    B: {
        letter: 'B',
        viewBox: '0 0 200 200',
        pathData: 'M 50 20 L 50 180 M 50 20 Q 150 20 150 80 Q 150 100 50 100 M 50 100 Q 160 100 160 140 Q 160 180 50 180',
        startPoint: { x: 50, y: 20 },
        difficulty: 'medium',
        hint: 'Draw a straight line down, then add two bumps!',
    },
    C: {
        letter: 'C',
        viewBox: '0 0 200 200',
        pathData: 'M 160 50 Q 40 20 40 100 Q 40 180 160 160',
        startPoint: { x: 160, y: 50 },
        difficulty: 'easy',
        hint: 'Curve around like a crescent moon!',
    },
    O: {
        letter: 'O',
        viewBox: '0 0 200 200',
        pathData: 'M 100 20 Q 180 20 180 100 Q 180 180 100 180 Q 20 180 20 100 Q 20 20 100 20',
        startPoint: { x: 100, y: 20 },
        difficulty: 'easy',
        hint: 'Draw a big circle all the way around!',
    },
    S: {
        letter: 'S',
        viewBox: '0 0 200 200',
        pathData: 'M 160 50 Q 40 20 40 90 Q 40 130 160 140 Q 180 180 60 190',
        startPoint: { x: 160, y: 50 },
        difficulty: 'hard',
        hint: 'Curve one way, then the other — like a snake!',
    },
};

export const wordPaths: Record<string, string[]> = {
    CAT: ['C', 'A'],
    BAG: ['B', 'A'],
};