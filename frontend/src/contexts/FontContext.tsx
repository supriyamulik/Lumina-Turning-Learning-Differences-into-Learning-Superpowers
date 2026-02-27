import React, { createContext, useContext, useEffect, useState } from 'react';

type Font = 'default' | 'dyslexic';

interface FontContextType {
    font: Font;
    toggleFont: () => void;
}

const FontContext = createContext<FontContextType | undefined>(undefined);

export const FontProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [font, setFont] = useState<Font>(() => {
        const saved = localStorage.getItem('font-preference') as Font;
        return saved || 'dyslexic'; // default to dyslexic
    });

    useEffect(() => {
        localStorage.setItem('font-preference', font);
        document.body.classList.remove('font-default', 'font-dyslexic');
        document.body.classList.add(`font-${font}`);
    }, [font]);

    const toggleFont = () => {
        setFont(prev => (prev === 'default' ? 'dyslexic' : 'default'));
    };

    return (
        <FontContext.Provider value={{ font, toggleFont }}>
            {children}
        </FontContext.Provider>
    );
};

export const useFont = () => {
    const context = useContext(FontContext);
    if (!context) throw new Error('useFont must be used within FontProvider');
    return context;
};