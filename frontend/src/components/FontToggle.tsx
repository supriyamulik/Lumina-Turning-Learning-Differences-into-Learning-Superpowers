import React from 'react';
import { useFont } from '../contexts/FontContext';

const FontToggle: React.FC = () => {
    const { font, toggleFont } = useFont();
    const isDyslexic = font === 'dyslexic';

    return (
        <div
            onClick={toggleFont}
            className="sb-sound" // reuse your sidebar item class
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '11px',
                padding: '10px 14px',
                borderRadius: '13px',
                fontSize: '14px',
                fontWeight: 700,
                color: 'rgba(255,255,255,0.72)',
                cursor: 'pointer',
                minHeight: '46px',
            }}
        >
            <span style={{ fontSize: '18px', width: '22px', textAlign: 'center' }}>
                {isDyslexic ? '📖' : '🔤'}
            </span>
            <span>{isDyslexic ? 'Dyslexic font' : 'Default font'}</span>
            <div style={{
                marginLeft: 'auto',
                width: '40px',
                height: '22px',
                background: isDyslexic ? '#3AA898' : 'rgba(255,255,255,0.2)',
                borderRadius: '100px',
                position: 'relative',
                transition: 'background 0.22s',
                flexShrink: 0,
            }}>
                <div style={{
                    position: 'absolute',
                    top: '3px',
                    width: '16px',
                    height: '16px',
                    background: '#fff',
                    borderRadius: '50%',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                    transition: 'left 0.2s cubic-bezier(0.34,1.4,0.64,1)',
                    left: isDyslexic ? '21px' : '3px',
                }} />
            </div>
        </div>
    );
};

export default FontToggle;