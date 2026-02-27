import React, { useEffect, useRef, useState } from 'react';

// ─── Lumina Logo (book + light ray — calm, friendly, educational) ─────────────
const LuminaLogo = ({ size = 36, color = '#1A7A62' }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Open book shape */}
        <path d="M20 32 C20 32 8 27 8 14 L8 10 C8 10 14 11 20 16 C26 11 32 10 32 10 L32 14 C32 27 20 32 20 32Z"
            fill={color} opacity="0.15" />
        <path d="M20 30 C20 30 9 25.5 9 13.5 L9 11 C9 11 14.5 12 20 17 L20 30Z"
            fill={color} opacity="0.9" />
        <path d="M20 30 C20 30 31 25.5 31 13.5 L31 11 C31 11 25.5 12 20 17 L20 30Z"
            fill={color} opacity="0.7" />
        {/* Spine */}
        <rect x="19.2" y="17" width="1.6" height="13" rx="0.8" fill={color} />
        {/* Light ray / glow above book */}
        <circle cx="20" cy="8" r="3.5" fill="#F5A623" opacity="0.9" />
        <line x1="20" y1="3" x2="20" y2="1" stroke="#F5A623" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="24.5" y1="4.5" x2="25.8" y2="3.2" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="15.5" y1="4.5" x2="14.2" y2="3.2" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="26" y1="8" x2="28" y2="8" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="14" y1="8" x2="12" y2="8" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

// ─── Animated Counter ─────────────────────────────────────────────────────────
const Counter = ({ target, suffix = '' }: { target: number; suffix?: string }) => {
    const [count, setCount] = useState<number>(0);
    const ref = useRef<HTMLSpanElement | null>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                let start = 0;
                const step = target / 60;

                const timer = setInterval(() => {
                    start += step;
                    if (start >= target) {
                        setCount(target);
                        clearInterval(timer);
                    } else {
                        setCount(Math.floor(start));
                    }
                }, 16);

                observer.disconnect();
            }
        }, { threshold: 0.5 });

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [target]);

    return <span ref={ref}>{count}{suffix}</span>;
};
// ─── Calm Muted Jungle SVG ────────────────────────────────────────────────────
// Soft, desaturated, gentle — not overwhelming
const CalmJungleBg = () => (
    <svg viewBox="0 0 1440 680" preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        xmlns="http://www.w3.org/2000/svg">
        <defs>
            {/* Very soft, pale sky */}
            <linearGradient id="calmSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D6EEF8" />
                <stop offset="60%" stopColor="#E8F6FB" />
                <stop offset="100%" stopColor="#E8F5E9" />
            </linearGradient>
            {/* Muted ground */}
            <linearGradient id="calmGround" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A5C8A0" />
                <stop offset="100%" stopColor="#8DB889" />
            </linearGradient>
            {/* Soft tree greens */}
            <radialGradient id="treeA" cx="40%" cy="35%" r="60%">
                <stop offset="0%" stopColor="#B5D6B2" />
                <stop offset="100%" stopColor="#7DAF78" />
            </radialGradient>
            <radialGradient id="treeB" cx="40%" cy="35%" r="60%">
                <stop offset="0%" stopColor="#C2DEC0" />
                <stop offset="100%" stopColor="#88B884" />
            </radialGradient>
            <radialGradient id="treeC" cx="40%" cy="35%" r="60%">
                <stop offset="0%" stopColor="#A8CFA4" />
                <stop offset="100%" stopColor="#6FA46A" />
            </radialGradient>
            {/* Soft sun */}
            <radialGradient id="calmSun" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFF8E1" />
                <stop offset="70%" stopColor="#FFE082" />
                <stop offset="100%" stopColor="#FFD54F" stopOpacity="0.6" />
            </radialGradient>
        </defs>

        {/* Sky */}
        <rect width="1440" height="680" fill="url(#calmSky)" />

        {/* Soft sun — muted, not blinding */}
        <circle cx="1100" cy="95" r="56" fill="url(#calmSun)" opacity="0.75" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
            const r = Math.PI * deg / 180;
            const x1 = 1100 + Math.cos(r) * 65, y1 = 95 + Math.sin(r) * 65;
            const x2 = 1100 + Math.cos(r) * 82, y2 = 95 + Math.sin(r) * 82;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="#FFD54F" strokeWidth="3.5" strokeLinecap="round" opacity="0.5" />;
        })}

        {/* Soft clouds — very gentle */}
        <g opacity="0.55">
            <ellipse cx="160" cy="80" rx="65" ry="30" fill="#fff" />
            <ellipse cx="208" cy="64" rx="48" ry="36" fill="#fff" />
            <ellipse cx="118" cy="74" rx="40" ry="26" fill="#fff" />
            <ellipse cx="245" cy="82" rx="34" ry="22" fill="#fff" />
        </g>
        <g opacity="0.45">
            <ellipse cx="540" cy="58" rx="56" ry="26" fill="#fff" />
            <ellipse cx="588" cy="42" rx="42" ry="30" fill="#fff" />
            <ellipse cx="496" cy="64" rx="34" ry="22" fill="#fff" />
        </g>
        <g opacity="0.4">
            <ellipse cx="840" cy="50" rx="50" ry="24" fill="#fff" />
            <ellipse cx="884" cy="34" rx="38" ry="28" fill="#fff" />
            <ellipse cx="800" cy="58" rx="30" ry="18" fill="#fff" />
        </g>

        {/* Far hills — very muted */}
        <ellipse cx="280" cy="580" rx="420" ry="160" fill="#B8D4B5" opacity="0.4" />
        <ellipse cx="900" cy="600" rx="500" ry="180" fill="#AEC8AB" opacity="0.38" />
        <ellipse cx="1360" cy="580" rx="380" ry="155" fill="#B8D4B5" opacity="0.4" />

        {/* Mid ground rolling hill */}
        <path d="M0 490 Q220 430 440 472 Q620 510 800 452 Q980 395 1160 462 Q1330 525 1440 478 L1440 680 L0 680Z"
            fill="#A8C8A4" opacity="0.85" />
        {/* Hill highlight */}
        <path d="M0 490 Q220 430 440 472 Q620 510 800 452 Q980 395 1160 462 Q1330 525 1440 478"
            fill="none" stroke="#BCD6BA" strokeWidth="5" opacity="0.5" />

        {/* Ground */}
        <path d="M0 562 Q280 538 560 550 Q840 564 1120 542 Q1300 528 1440 544 L1440 680 L0 680Z"
            fill="url(#calmGround)" />

        {/* Ground edge highlight */}
        <path d="M0 562 Q280 538 560 550 Q840 564 1120 542 Q1300 528 1440 544"
            fill="none" stroke="#B8D4B5" strokeWidth="4" opacity="0.6" />

        {/* Base strip */}
        <rect x="0" y="638" width="1440" height="42" fill="#8DB889" opacity="0.9" />

        {/* === LEFT TREE CLUSTER — muted, calm === */}
        {/* Tall rounded tree */}
        <g transform="translate(60, 290)">
            <rect x="-9" y="140" width="18" height="210" rx="9" fill="#9C7B5A" opacity="0.7" />
            <circle cx="0" cy="110" r="74" fill="url(#treeA)" opacity="0.85" />
            <circle cx="-30" cy="90" r="54" fill="url(#treeB)" opacity="0.8" />
            <circle cx="32" cy="88" r="50" fill="url(#treeC)" opacity="0.75" />
            <circle cx="0" cy="68" r="48" fill="#C2DEC0" opacity="0.7" />
            <circle cx="-12" cy="74" r="22" fill="#D4E8D2" opacity="0.45" />
        </g>

        {/* Small bush left */}
        <g transform="translate(185, 400)">
            <rect x="-7" y="80" width="14" height="150" rx="7" fill="#9C7B5A" opacity="0.6" />
            <circle cx="0" cy="62" r="52" fill="url(#treeB)" opacity="0.75" />
            <circle cx="-22" cy="46" r="36" fill="url(#treeA)" opacity="0.7" />
            <circle cx="24" cy="44" r="34" fill="url(#treeC)" opacity="0.68" />
            <circle cx="0" cy="30" r="30" fill="#C2DEC0" opacity="0.6" />
        </g>

        {/* Palm left */}
        <g transform="translate(290, 320)">
            <path d="M0 330 Q10 270 4 210 Q-2 155 6 100"
                stroke="#9C7B5A" strokeWidth="16" fill="none" strokeLinecap="round" opacity="0.65" />
            {[[-60, -8], [-32, -44], [0, -58], [32, -44], [60, -8], [44, 18], [-44, 18]].map(([dx, dy], i) => (
                <path key={i} d={`M6 100 Q${6 + dx * 0.5} ${100 + dy * 0.5} ${6 + dx} ${100 + dy}`}
                    stroke={['#88B884', '#7DAF78', '#A8CFA4', '#6FA46A', '#88B884', '#6FA46A', '#7DAF78'][i]}
                    strokeWidth="10" fill="none" strokeLinecap="round" opacity="0.72" />
            ))}
        </g>

        {/* === RIGHT TREE CLUSTER === */}
        <g transform="translate(1330, 300)">
            <rect x="-11" y="130" width="22" height="230" rx="11" fill="#9C7B5A" opacity="0.65" />
            <circle cx="0" cy="96" r="80" fill="url(#treeC)" opacity="0.82" />
            <circle cx="-36" cy="74" r="58" fill="url(#treeA)" opacity="0.78" />
            <circle cx="40" cy="72" r="54" fill="url(#treeB)" opacity="0.75" />
            <circle cx="0" cy="52" r="54" fill="#C2DEC0" opacity="0.7" />
            <circle cx="-14" cy="58" r="24" fill="#D4E8D2" opacity="0.4" />
        </g>

        <g transform="translate(1420, 290)">
            <path d="M0 330 Q-8 265 -3 205 Q3 148 -4 92"
                stroke="#9C7B5A" strokeWidth="14" fill="none" strokeLinecap="round" opacity="0.6" />
            {[[-58, -12], [-30, -48], [-2, -62], [30, -48], [58, -12], [42, 16], [-42, 16]].map(([dx, dy], i) => (
                <path key={i} d={`M-4 92 Q${-4 + dx * 0.5} ${92 + dy * 0.5} ${-4 + dx} ${92 + dy}`}
                    stroke={['#7DAF78', '#88B884', '#A8CFA4', '#7DAF78', '#6FA46A', '#88B884', '#6FA46A'][i]}
                    strokeWidth="9" fill="none" strokeLinecap="round" opacity="0.68" />
            ))}
        </g>

        <g transform="translate(1210, 390)">
            <rect x="-8" y="90" width="16" height="180" rx="8" fill="#9C7B5A" opacity="0.6" />
            <circle cx="0" cy="70" r="60" fill="url(#treeB)" opacity="0.75" />
            <circle cx="-22" cy="52" r="42" fill="url(#treeA)" opacity="0.7" />
            <circle cx="24" cy="50" r="38" fill="url(#treeC)" opacity="0.68" />
        </g>

        {/* === SMALL CUTE ANIMALS — simplified, calm === */}
        {/* Gentle monkey peeking from right tree */}
        <g transform="translate(1312, 288)" opacity="0.88">
            <ellipse cx="0" cy="4" rx="15" ry="18" fill="#D4A872" />
            <circle cx="0" cy="-14" r="14" fill="#D4A872" />
            <ellipse cx="0" cy="-10" rx="9" ry="8" fill="#E8C9A0" />
            <circle cx="-13" cy="-17" r="6.5" fill="#D4A872" />
            <circle cx="-13" cy="-17" r="4" fill="#E8C9A0" />
            <circle cx="13" cy="-17" r="6.5" fill="#D4A872" />
            <circle cx="13" cy="-17" r="4" fill="#E8C9A0" />
            <circle cx="-4.5" cy="-18" r="3.5" fill="#fff" />
            <circle cx="4.5" cy="-18" r="3.5" fill="#fff" />
            <circle cx="-3.8" cy="-18" r="2.2" fill="#3D2B1F" />
            <circle cx="5.2" cy="-18" r="2.2" fill="#3D2B1F" />
            <circle cx="-3.2" cy="-18.8" r="0.9" fill="#fff" />
            <circle cx="5.8" cy="-18.8" r="0.9" fill="#fff" />
            <ellipse cx="0" cy="-8" rx="3" ry="2" fill="#C09060" />
            <path d="M-4 -4 Q0 -1 4 -4" stroke="#C09060" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </g>

        {/* Little bird on left palm */}
        <g transform="translate(68, 235)" opacity="0.82">
            <ellipse cx="0" cy="0" rx="9" ry="11" fill="#90CAF9" />
            <circle cx="0" cy="-10" r="8" fill="#90CAF9" />
            <ellipse cx="0" cy="-6" rx="5" ry="6" fill="#E3F2FD" />
            <path d="M6 -12 Q13 -8 10 -4 Z" fill="#FFE082" />
            <circle cx="4.5" cy="-13" r="3" fill="#fff" />
            <circle cx="5.2" cy="-13" r="1.8" fill="#1A1A1A" />
            <circle cx="5.8" cy="-13.6" r="0.7" fill="#fff" />
            <path d="M-4 8 Q-6 14 -8 18" stroke="#FFE082" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M4 8 Q6 14 8 18" stroke="#FFE082" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>

        {/* === GENTLE FLOWERS on ground === */}
        {[100, 300, 520, 740, 980, 1180, 1380].map((x, i) => {
            const petalColors = [['#F8BBD0', '#F48FB1'], ['#FFF9C4', '#FFE082'], ['#B3E5FC', '#81D4FA'],
            ['#DCEDC8', '#AED581'], ['#F8BBD0', '#CE93D8'], ['#FFF9C4', '#FFCC02'], ['#B3E5FC', '#80DEEA']];
            const [p1, p2] = petalColors[i % petalColors.length];
            const y = 556 + (i % 3) * 7;
            return (
                <g key={i} transform={`translate(${x},${y})`}>
                    {[0, 60, 120, 180, 240, 300].map((deg, j) => {
                        const rr = Math.PI * deg / 180;
                        return <ellipse key={j} cx={Math.cos(rr) * 7} cy={Math.sin(rr) * 7}
                            rx="5.5" ry="3.5" fill={p1} opacity="0.85"
                            transform={`rotate(${deg} ${Math.cos(rr) * 7} ${Math.sin(rr) * 7})`} />;
                    })}
                    <circle cx="0" cy="0" r="4.5" fill={p2} opacity="0.9" />
                    <path d={`M0 4 Q${i % 2 ? 2 : -2} 10 0 18`} stroke="#88B884" strokeWidth="2" fill="none" strokeLinecap="round" />
                </g>
            );
        })}

        {/* Gentle mushroom */}
        <g transform="translate(420, 548)" opacity="0.7">
            <rect x="-4" y="0" width="8" height="16" rx="4" fill="#ECEFF1" />
            <ellipse cx="0" cy="1" rx="18" ry="11" fill="#EF9A9A" />
            <circle cx="-6" cy="4" r="3.5" fill="#fff" opacity="0.85" />
            <circle cx="4" cy="2" r="2.8" fill="#fff" opacity="0.85" />
        </g>
        <g transform="translate(960, 554)" opacity="0.65">
            <rect x="-3" y="0" width="6" height="13" rx="3" fill="#ECEFF1" />
            <ellipse cx="0" cy="1" rx="14" ry="9" fill="#CE93D8" />
            <circle cx="-4" cy="3" r="2.8" fill="#fff" opacity="0.85" />
            <circle cx="4" cy="2" r="2.2" fill="#fff" opacity="0.85" />
        </g>

        {/* Distant birds — very subtle */}
        {[[340, 130], [410, 108], [480, 138], [820, 96], [872, 78]].map(([x, y], i) => (
            <path key={i} d={`M${x} ${y} Q${x + 7} ${y - 5} ${x + 14} ${y}`}
                stroke="#8CAAA0" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.4" />
        ))}

        {/* Stepping stones path */}
        {[160, 300, 450, 610, 770, 930, 1090, 1260].map((x, i) => (
            <ellipse key={i} cx={x} cy={644 + (i % 2) * 8} rx="22" ry="7"
                fill="#9C7B5A" opacity="0.32" />
        ))}

        {/* Foreground corner leaves — dark, calm */}
        <path d="M0 670 Q44 618 102 644 Q58 676 0 680Z" fill="#6FA46A" opacity="0.55" />
        <path d="M0 678 Q62 636 128 655 Q76 680 0 680Z" fill="#7DAF78" opacity="0.38" />
        <path d="M1440 670 Q1396 618 1338 644 Q1382 676 1440 680Z" fill="#6FA46A" opacity="0.55" />
        <path d="M1440 678 Q1378 636 1312 655 Q1364 680 1440 680Z" fill="#7DAF78" opacity="0.38" />
    </svg>
);

// ─── Main Landing Page ────────────────────────────────────────────────────────
const Landing = () => {
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 30);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,700;1,9..144,500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --cream:      #F7F3EB;
          --cream2:     #F2EDE3;
          --teal:       #1A7A62;
          --teal-mid:   #2A9478;
          --teal-pale:  #E4F2EE;
          --amber:      #E8920C;
          --amber-soft: #F5B84C;
          --amber-pale: #FDF3DC;
          --text:       #1C2E24;
          --text-mid:   #304838;
          --text-soft:  #5A7866;
          --border:     rgba(26,122,98,0.12);
          --nav-h:      66px;
        }

        html { scroll-behavior: smooth; }
        body {
          font-family: 'Nunito', sans-serif;
          background: var(--cream);
          color: var(--text);
          overflow-x: hidden;
          /* Dyslexia-safe: generous letter spacing */
          letter-spacing: 0.018em;
        }

        /* ── Animations ── */
        @keyframes fadeUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes floatUp  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes pulse    { 0%{transform:scale(1);opacity:0.65} 100%{transform:scale(1.6);opacity:0} }
        @keyframes barSlide { from{width:0} to{width:var(--w)} }
        @keyframes bounce   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }

        .a1 { animation: fadeUp 0.7s 0.1s ease both; }
        .a2 { animation: fadeUp 0.7s 0.22s ease both; }
        .a3 { animation: fadeUp 0.7s 0.34s ease both; }
        .a4 { animation: fadeUp 0.7s 0.46s ease both; }
        .a5 { animation: fadeIn 0.8s 0.55s ease both; }

        /* ── Navbar ── */
        .nav {
          position: fixed; top:0; left:0; right:0; z-index:100;
          height: var(--nav-h);
          display: flex; align-items: center;
          padding: 0 6%;
          transition: all 0.3s ease;
        }
        .nav.solid {
          background: rgba(247,243,235,0.97);
          backdrop-filter: blur(16px);
          box-shadow: 0 1px 0 var(--border), 0 4px 20px rgba(0,0,0,0.05);
        }
        .nav.clear {
          background: rgba(255,255,255,0.18);
          backdrop-filter: blur(6px);
        }
        .nav-link {
          font-size: 14px; font-weight: 700; letter-spacing: 0.03em;
          text-decoration: none; color: var(--text-mid);
          transition: color 0.2s; position: relative; padding-bottom: 2px;
        }
        .nav-link::after {
          content:''; position:absolute; bottom:-2px; left:0;
          width:0; height:2.5px; background:var(--amber);
          transition: width 0.2s; border-radius:2px;
        }
        .nav-link:hover { color: var(--teal); }
        .nav-link:hover::after { width:100%; }

        /* Buttons */
        .btn-amber {
          display: inline-flex; align-items: center; gap: 7px;
          background: var(--amber); color: #fff;
          font-family: 'Nunito',sans-serif; font-weight: 800;
          font-size: 15px; letter-spacing: 0.03em;
          padding: 12px 28px; border-radius: 100px; border: none;
          cursor: pointer; text-decoration: none;
          box-shadow: 0 4px 16px rgba(232,146,12,0.38), 0 2px 0 #B36A00 inset;
          transition: all 0.2s;
        }
        .btn-amber:hover {
          background: #D07800; transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(232,146,12,0.46);
        }
        .btn-amber-lg {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--amber); color: #fff;
          font-family: 'Nunito',sans-serif; font-weight: 900;
          font-size: 17px; letter-spacing: 0.03em;
          padding: 16px 40px; border-radius: 100px; border: none;
          cursor: pointer; text-decoration: none;
          box-shadow: 0 6px 22px rgba(232,146,12,0.42), 0 3px 0 #B36A00 inset;
          transition: all 0.2s;
          animation: bounce 3s ease-in-out infinite;
        }
        .btn-amber-lg:hover {
          background: #C87000; transform: translateY(-3px);
          box-shadow: 0 10px 30px rgba(232,146,12,0.5);
          animation: none;
        }
        .btn-outline {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.7);
          color: var(--teal);
          font-family: 'Nunito',sans-serif; font-weight: 800;
          font-size: 16px; letter-spacing: 0.03em;
          padding: 15px 32px; border-radius: 100px;
          border: 2px solid rgba(26,122,98,0.3);
          cursor: pointer; text-decoration: none;
          backdrop-filter: blur(8px);
          transition: all 0.2s;
        }
        .btn-outline:hover {
          background: rgba(255,255,255,0.92);
          border-color: var(--teal); transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.08);
        }
        .btn-ghost-dark {
          display: inline-flex; align-items: center; gap: 8px;
          background: transparent; color: rgba(255,255,255,0.88);
          font-family: 'Nunito',sans-serif; font-weight: 700;
          font-size: 15px; letter-spacing: 0.03em;
          padding: 14px 28px; border-radius: 100px;
          border: 2px solid rgba(255,255,255,0.35);
          cursor: pointer; text-decoration: none;
          transition: all 0.2s;
        }
        .btn-ghost-dark:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.7); }

        /* Cards */
        .card {
          background: #fff; border-radius: 20px;
          border: 1.5px solid var(--border);
          box-shadow: 0 4px 20px rgba(26,122,98,0.07);
        }
        .card-lift { transition: transform 0.28s ease, box-shadow 0.28s ease; }
        .card-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(26,122,98,0.13) !important;
        }

        /* Section header pattern */
        .sect-eyebrow {
          font-size: 11px; font-weight: 800; letter-spacing: 0.24em;
          text-transform: uppercase; color: var(--amber);
        }
        .sect-h2 {
          font-family: 'Fraunces',serif;
          font-size: clamp(2rem, 4vw, 2.8rem);
          font-weight: 700; letter-spacing: -0.01em;
          color: var(--teal); line-height: 1.12;
        }
        .sect-body {
          font-size: 1.05rem; line-height: 1.85;
          color: var(--text-soft); font-weight: 600;
          letter-spacing: 0.025em; /* dyslexia safe */
        }

        /* Responsive */
        @media (max-width: 860px) {
          .feat-grid { grid-template-columns: 1fr !important; }
          .steps-grid { grid-template-columns: 1fr 1fr !important; }
          .res-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media (max-width: 540px) {
          .steps-grid { grid-template-columns: 1fr !important; }
        }

        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: var(--cream); }
        ::-webkit-scrollbar-thumb { background: var(--teal-mid); border-radius: 3px; }
      `}</style>

            {/* ══════ NAVBAR ══════ */}
            <nav className={`nav ${scrolled ? 'solid' : 'clear'}`}>
                {/* Logo */}
                <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
                    <LuminaLogo size={36} color={scrolled ? '#1A7A62' : '#1A6B56'} />
                    <span style={{
                        fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 22,
                        letterSpacing: '-0.015em',
                        color: scrolled ? 'var(--teal)' : '#1A3028',
                        transition: 'color 0.3s',
                    }}>Lumina</span>
                </a>

                {/* Links */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 28, margin: '0 auto' }}>
                    {['About', 'How it works', 'Research'].map(item => (
                        <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`} className="nav-link">{item}</a>
                    ))}
                </div>

                {/* CTA */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexShrink: 0 }}>
                    <a href="/login" style={{
                        fontSize: 14, fontWeight: 700, textDecoration: 'none', letterSpacing: '0.03em',
                        color: scrolled ? 'var(--text-mid)' : '#1A3028', transition: 'color 0.3s',
                    }}>Log in</a>
                    <a href="/signup" className="btn-amber" style={{ padding: '10px 22px', fontSize: 14 }}>
                        Get started
                    </a>
                </div>
            </nav>

            {/* ══════ HERO — single column, calm, centered ══════ */}
            <section style={{
                position: 'relative', minHeight: '100vh',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
                background: '#D6EEF8',
            }}>
                {/* Calm jungle SVG — muted palette, no dark overlay needed */}
                <CalmJungleBg />

                {/* Hero Content — centered single column */}
                <div className="a1" style={{
                    position: 'relative', zIndex: 5,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', textAlign: 'center',
                    maxWidth: 680, width: '90%',
                    padding: 'calc(var(--nav-h) + 32px) 0 48px',
                }}>
                    {/* Floating card wrapping the hero content */}
                    <div style={{
                        background: 'rgba(247,243,235,0.92)',
                        backdropFilter: 'blur(22px)',
                        WebkitBackdropFilter: 'blur(22px)',
                        border: '2px solid rgba(255,255,255,0.9)',
                        borderRadius: 32,
                        padding: '52px 56px 48px',
                        boxShadow:
                            '0 12px 56px rgba(26,100,70,0.13),' +
                            '0 2px 8px rgba(0,0,0,0.05),' +
                            'inset 0 2px 0 rgba(255,255,255,1)',
                        width: '100%',
                    }}>
                        {/* Eyebrow */}
                        <div className="a1" style={{ marginBottom: 18 }}>
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                background: 'var(--amber-pale)',
                                border: '1.5px solid rgba(232,146,12,0.28)',
                                borderRadius: 100, padding: '5px 16px',
                                fontSize: 11.5, fontWeight: 800, letterSpacing: '0.14em',
                                textTransform: 'uppercase', color: 'var(--amber)',
                            }}>
                                <LuminaLogo size={16} color="#E8920C" /> For children aged 5–7
                            </span>
                        </div>

                        {/* Headline */}
                        <h1 className="a2" style={{
                            fontFamily: 'Fraunces, serif',
                            fontSize: 'clamp(2.4rem, 5vw, 3.6rem)',
                            fontWeight: 700,
                            lineHeight: 1.10,
                            color: 'var(--text)',
                            letterSpacing: '-0.01em',
                            marginBottom: 20,
                        }}>
                            Reading feels like<br />
                            <em style={{ color: 'var(--amber)', fontStyle: 'italic' }}>
                                an adventure.
                            </em>
                        </h1>

                        {/* Body */}
                        <p className="a3" style={{
                            fontSize: '1.1rem', lineHeight: 1.88,
                            color: 'var(--text-mid)',
                            marginBottom: 36, fontWeight: 600,
                            letterSpacing: '0.025em',
                            maxWidth: 480, margin: '0 auto 36px',
                        }}>
                            Lumina is a phonics learning platform designed for children with dyslexia or reading challenges.
                            Backed by science, powered by joy.
                        </p>

                        {/* Buttons */}
                        <div className="a4" style={{
                            display: 'flex', gap: 14, justifyContent: 'center',
                            flexWrap: 'wrap', marginBottom: 36,
                        }}>
                            <a href="/signup" className="btn-amber-lg">Start for free</a>
                            <a href="/demo" className="btn-outline">Watch demo</a>
                        </div>

                        {/* Trust badges */}
                        <div className="a4" style={{
                            display: 'flex', justifyContent: 'center',
                            gap: 0, flexWrap: 'wrap',
                            paddingTop: 24,
                            borderTop: '1.5px solid rgba(26,122,98,0.09)',
                        }}>
                            {[
                                { icon: '👶', text: '1 in 5 kids affected' },
                                { icon: '🔬', text: 'Research-backed' },
                                { icon: '🎮', text: 'Game-based learning' },
                            ].map(({ icon, text }, i) => (
                                <div key={text} style={{
                                    display: 'flex', alignItems: 'center', gap: 7,
                                    paddingRight: i < 2 ? 22 : 0, marginRight: i < 2 ? 22 : 0,
                                    borderRight: i < 2 ? '1.5px solid rgba(26,122,98,0.1)' : 'none',
                                }}>
                                    <span style={{ fontSize: 17 }}>{icon}</span>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-soft)' }}>{text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Scroll cue */}
                <div style={{
                    position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
                    zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                    animation: 'fadeIn 2s 1.2s ease both',
                }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-soft)', letterSpacing: '0.08em' }}>
                        Scroll to explore
                    </span>
                    <span style={{ fontSize: 18, color: 'var(--teal)', animation: 'floatUp 1.8s ease-in-out infinite' }}>↓</span>
                </div>
            </section>

            {/* ══════ STATS BAND ══════ */}
            <section style={{ background: 'var(--teal)', padding: '48px 6%' }}>
                <div className="stats-grid" style={{
                    display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
                    gap: 28, maxWidth: 960, margin: '0 auto', textAlign: 'center',
                }}>
                    {[
                        { val: 20, suf: '%', lab: 'of children have dyslexia' },
                        { val: 8, suf: '', lab: 'phonics islands to explore' },
                        { val: 5, suf: '', lab: 'activity types per island' },
                        { val: 92, suf: '%', lab: 'of parents saw improvement' },
                    ].map(({ val, suf, lab }) => (
                        <div key={lab}>
                            <div style={{
                                fontFamily: 'Fraunces,serif', fontSize: '2.8rem',
                                fontWeight: 700, color: 'var(--amber-soft)', lineHeight: 1, marginBottom: 7,
                            }}>
                                <Counter target={val} suffix={suf} />
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.78)', fontSize: 13.5, lineHeight: 1.55, fontWeight: 600 }}>
                                {lab}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ══════ FEATURES ══════ */}
            <section id="how-it-works" style={{ background: 'var(--cream)', padding: '88px 6%' }}>
                <div style={{ maxWidth: 1060, margin: '0 auto' }}>

                    <div style={{ textAlign: 'center', marginBottom: 56 }}>
                        <p className="sect-eyebrow" style={{ marginBottom: 12 }}>Designed with care</p>
                        <h2 className="sect-h2" style={{ marginBottom: 14 }}>Every child is a superhero</h2>
                        <p className="sect-body" style={{ maxWidth: 480, margin: '0 auto' }}>
                            Lumina meets every learner where they are — and walks with them through the jungle.
                        </p>
                    </div>

                    <div className="feat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 22 }}>
                        {[
                            {
                                icon: '🦜', color: '#C07010', bg: '#FDF3DC',
                                title: 'For students',
                                desc: '8 phonics islands, 5 game types per island, and a friendly AI guide. Learning disguised as play.',
                                tags: ['Flash cards', 'Word sorts', 'Blending builder', 'Story reader'],
                            },
                            {
                                icon: '🐘', color: '#1A7A62', bg: '#E4F2EE',
                                title: 'For teachers',
                                desc: 'Class heat maps, at-risk alerts, and AI-generated lesson plans that save you hours.',
                                tags: ['Live progress', 'Heat maps', 'At-risk alerts', 'Group lessons'],
                            },
                            {
                                icon: '🦒', color: '#6B5EA4', bg: '#EDEAF8',
                                title: 'For parents',
                                desc: 'Plain-English progress updates and fun offline activities to reinforce learning at home.',
                                tags: ['Weekly reports', 'Home activities', 'Print-and-trace', 'Celebrate wins'],
                            },
                        ].map(({ icon, color, bg, title, desc, tags }) => (
                            <div key={title} className="card card-lift" style={{ padding: '30px 26px' }}>
                                <div style={{
                                    width: 64, height: 64, background: bg, borderRadius: 18,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 28, marginBottom: 18, border: `1.5px solid ${color}22`,
                                }}>{icon}</div>
                                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)', marginBottom: 9 }}>{title}</h3>
                                <p style={{ color: 'var(--text-soft)', fontSize: 14.5, lineHeight: 1.82, marginBottom: 18, fontWeight: 600 }}>{desc}</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                                    {tags.map(t => (
                                        <span key={t} style={{
                                            background: bg, color, fontSize: 12, fontWeight: 800,
                                            padding: '4px 12px', borderRadius: 100, border: `1px solid ${color}22`,
                                        }}>{t}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* How it works steps */}
                    <div style={{ marginTop: 72 }}>
                        <div style={{ textAlign: 'center', marginBottom: 44 }}>
                            <p className="sect-eyebrow" style={{ marginBottom: 12 }}>The journey</p>
                            <h2 className="sect-h2">How Lumina works</h2>
                        </div>
                        <div className="steps-grid" style={{
                            display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
                            gap: 18, position: 'relative',
                        }}>
                            {/* connector line */}
                            <div style={{
                                position: 'absolute', top: 28, left: '12.5%', right: '12.5%', height: 1.5,
                                background: 'repeating-linear-gradient(90deg,var(--teal) 0,var(--teal) 5px,transparent 5px,transparent 12px)',
                                opacity: 0.18, pointerEvents: 'none',
                            }} />
                            {[
                                { num: '01', icon: '🌟', title: 'Meet Luca', desc: 'Your child meets their AI jungle guide and completes a quick interest profile.' },
                                { num: '02', icon: '🗺', title: 'Pick an island', desc: 'The phonics map unlocks progressively. 8 islands, each building on the last.' },
                                { num: '03', icon: '🎮', title: 'Play & learn', desc: '5 science-based activity types per island in a vivid, joyful jungle world.' },
                                { num: '04', icon: '📊', title: 'Track progress', desc: 'Adaptive difficulty + real-time reporting for teachers and parents.' },
                            ].map(({ num, icon, title, desc }) => (
                                <div key={num} className="card card-lift" style={{ padding: '24px 20px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
                                    <div style={{
                                        fontFamily: 'Fraunces,serif', color: 'var(--amber)',
                                        fontSize: 12, fontWeight: 700, marginBottom: 10, letterSpacing: '0.1em',
                                    }}>{num}</div>
                                    <div style={{ fontSize: 32, marginBottom: 10 }}>{icon}</div>
                                    <h4 style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text)', marginBottom: 7 }}>{title}</h4>
                                    <p style={{ color: 'var(--text-soft)', fontSize: 13.5, lineHeight: 1.78, fontWeight: 600 }}>{desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════ ISLANDS ══════ */}
            <section style={{ background: 'var(--cream2)', padding: '88px 6%' }}>
                <div style={{ maxWidth: 1060, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 48 }}>
                        <p className="sect-eyebrow" style={{ marginBottom: 12 }}>The curriculum</p>
                        <h2 className="sect-h2" style={{ marginBottom: 14 }}>Your phonics adventure</h2>
                        <p className="sect-body" style={{ maxWidth: 440, margin: '0 auto' }}>
                            8 phonics islands, each a world of its own. Luca guides every step.
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 40 }}>
                        {[
                            { name: 'Short Vowels', u: true, d: true },
                            { name: 'Consonants', u: true, d: true },
                            { name: 'Blends', u: true, d: false, a: true },
                            { name: 'Digraphs', u: false, d: false },
                            { name: 'Silent E', u: false, d: false },
                            { name: 'Vowel Teams', u: false, d: false },
                            { name: 'R-controlled', u: false, d: false },
                            { name: 'Suffixes', u: false, d: false },
                        ].map(({ name, u, d, a }) => (
                            <div key={name} style={{
                                display: 'flex', alignItems: 'center', gap: 7,
                                fontWeight: 800, fontSize: 14, letterSpacing: '0.02em',
                                padding: '10px 20px', borderRadius: 100,
                                background: d ? 'var(--teal)' : u ? '#fff' : 'rgba(255,255,255,0.5)',
                                border: `1.5px solid ${d ? 'var(--teal)' : u ? 'var(--border)' : 'transparent'}`,
                                color: d ? '#fff' : u ? 'var(--teal)' : 'var(--text-soft)',
                                boxShadow: d ? '0 3px 12px rgba(26,122,98,0.22)' : u ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                                opacity: !u && !d ? 0.5 : 1,
                                cursor: u ? 'pointer' : 'default',
                                transition: 'all 0.2s',
                            }}>
                                <span style={{ fontSize: 15 }}>{d ? '✅' : u ? '🏝' : '🔒'}</span>
                                {name}
                                {a && (
                                    <span style={{
                                        background: 'var(--amber)', color: '#fff',
                                        fontSize: 9, fontWeight: 900, letterSpacing: '0.05em',
                                        padding: '2px 7px', borderRadius: 100,
                                    }}>NOW</span>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="card" style={{ padding: '28px 30px' }}>
                        <p className="sect-eyebrow" style={{ marginBottom: 18 }}>5 activity types per island</p>
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                            {[
                                { icon: '🃏', name: 'Flash Cards', desc: 'Sound recognition' },
                                { icon: '🔀', name: 'Word Sort', desc: 'Categorization' },
                                { icon: '🧩', name: 'Blending', desc: 'Build words' },
                                { icon: '👂', name: 'Listen & Find', desc: 'Auditory matching' },
                                { icon: '✏', name: 'Spell It', desc: 'Phoneme assembly' },
                            ].map(({ icon, name, desc }) => (
                                <div key={name} style={{ flex: '1 1 130px', display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{
                                        width: 44, height: 44, background: 'var(--amber-pale)', borderRadius: 13,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 20, flexShrink: 0,
                                        border: '1.5px solid rgba(232,146,12,0.18)',
                                    }}>{icon}</div>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)' }}>{name}</div>
                                        <div style={{ fontSize: 12.5, color: 'var(--text-soft)', marginTop: 2, fontWeight: 600 }}>{desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════ RESEARCH ══════ */}
            <section id="research" style={{ background: 'var(--cream)', padding: '88px 6%' }}>
                <div className="res-grid" style={{
                    maxWidth: 1060, margin: '0 auto',
                    display: 'grid', gridTemplateColumns: '1fr 1fr',
                    gap: 64, alignItems: 'center',
                }}>
                    <div>
                        <p className="sect-eyebrow" style={{ marginBottom: 14 }}>Science-backed</p>
                        <h2 className="sect-h2" style={{ marginBottom: 20, lineHeight: 1.15 }}>
                            Built on 50 years of<br /><em style={{ fontStyle: 'italic' }}>reading research</em>
                        </h2>
                        <p className="sect-body" style={{ marginBottom: 28 }}>
                            Lumina uses the Science of Reading framework — systematic phonics, phonemic awareness,
                            and multisensory approaches proven to support dyslexic learners.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                            {[
                                { icon: '👁', text: 'Webcam-based reading fluency tracking (WebGazer.js)' },
                                { icon: '🎙', text: 'Speech analysis via Whisper AI for phoneme accuracy' },
                                { icon: '✍', text: 'Handwriting reversal detection (EasyOCR)' },
                                { icon: '🧠', text: 'Adaptive difficulty engine adjusts in real time' },
                            ].map(({ icon, text }) => (
                                <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                    <div style={{
                                        width: 38, height: 38, background: 'var(--teal-pale)', borderRadius: 11,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 17, flexShrink: 0, border: '1.5px solid rgba(26,122,98,0.12)',
                                    }}>{icon}</div>
                                    <p style={{ color: 'var(--text-mid)', fontSize: 14.5, lineHeight: 1.75, paddingTop: 7, fontWeight: 600 }}>{text}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Accessibility card */}
                    <div className="card" style={{ padding: 32 }}>
                        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-soft)', marginBottom: 22 }}>
                            Accessibility-first design
                        </p>
                        <div style={{ marginBottom: 24 }}>
                            <p style={{ fontSize: 13, color: 'var(--text-soft)', marginBottom: 11, fontWeight: 700 }}>Dyslexia-safe colour palette</p>
                            <div style={{ display: 'flex', gap: 10 }}>
                                {[
                                    { bg: '#F7F3EB', label: 'Cream' },
                                    { bg: '#1A7A62', label: 'Teal' },
                                    { bg: '#E8920C', label: 'Amber' },
                                    { bg: '#6B5EA4', label: 'Violet' },
                                ].map(({ bg, label }) => (
                                    <div key={label} style={{ textAlign: 'center' }}>
                                        <div style={{
                                            width: 50, height: 50, borderRadius: 14, background: bg,
                                            border: '1.5px solid rgba(0,0,0,0.08)', marginBottom: 6,
                                        }} />
                                        <span style={{ fontSize: 11.5, color: 'var(--text-soft)', fontWeight: 700 }}>{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div style={{ marginBottom: 24 }}>
                            <p style={{ fontSize: 13, color: 'var(--text-soft)', marginBottom: 11, fontWeight: 700 }}>Typography</p>
                            <div style={{ background: 'var(--cream)', borderRadius: 11, padding: '14px 18px', border: '1.5px solid var(--border)' }}>
                                <p style={{ fontFamily: 'Nunito,sans-serif', fontSize: 18, color: 'var(--text)', lineHeight: 1.9, letterSpacing: '0.05em', marginBottom: 4 }}>
                                    The cat sat on the mat.
                                </p>
                                <p style={{ fontSize: 11.5, color: 'var(--text-soft)', fontWeight: 700 }}>Nunito · 1.9 line-height · 0.05em spacing</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                            {['No clutter', 'Calming palette', 'Clear fonts', 'Big tap targets', 'Audio support', 'No time pressure'].map(f => (
                                <span key={f} style={{
                                    background: 'var(--teal-pale)', color: 'var(--teal)',
                                    fontSize: 12.5, fontWeight: 800, padding: '5px 12px', borderRadius: 100,
                                    border: '1px solid rgba(26,122,98,0.15)',
                                }}>{f}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════ CTA ══════ */}
            <section style={{
                background: 'var(--teal)', padding: '88px 6%',
                position: 'relative', overflow: 'hidden', textAlign: 'center',
            }}>
                {/* Subtle bg circles */}
                <div style={{ position: 'absolute', top: -100, left: -100, width: 380, height: 380, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: -70, right: -70, width: 300, height: 300, borderRadius: '50%', background: 'rgba(232,146,12,0.1)', pointerEvents: 'none' }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    {/* Logo mark in CTA */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
                        <div style={{
                            width: 72, height: 72, background: 'rgba(255,255,255,0.12)',
                            borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '2px solid rgba(255,255,255,0.2)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        }}>
                            <LuminaLogo size={40} color="#fff" />
                        </div>
                    </div>

                    <p className="sect-eyebrow" style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 14 }}>Ready to begin?</p>
                    <h2 style={{
                        fontFamily: 'Fraunces,serif', fontSize: 'clamp(2rem,4vw,3rem)',
                        fontWeight: 700, color: '#fff', letterSpacing: '-0.01em',
                        marginBottom: 18, lineHeight: 1.15,
                    }}>
                        Start your child's<br />phonics adventure today.
                    </h2>
                    <p style={{
                        color: 'rgba(255,255,255,0.78)', fontSize: '1.05rem',
                        maxWidth: 420, margin: '0 auto 38px', lineHeight: 1.88, fontWeight: 600,
                        letterSpacing: '0.025em',
                    }}>
                        Free to try. No credit card needed. Built for every child who deserves to love reading.
                    </p>
                    <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <a href="/signup" className="btn-amber-lg" style={{ animation: 'none', fontSize: 16, padding: '15px 38px' }}>
                            Start for free
                        </a>
                        <a href="/login" className="btn-ghost-dark">Log in to dashboard</a>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12.5, marginTop: 22, fontWeight: 700 }}>
                        Free for teachers · Privacy-first · COPPA compliant
                    </p>
                </div>
            </section>

            {/* ══════ FOOTER ══════ */}
            <footer style={{
                background: 'var(--cream)', borderTop: '1.5px solid var(--border)',
                padding: '32px 6%',
            }}>
                <div style={{
                    maxWidth: 1060, margin: '0 auto',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: 16,
                }}>
                    <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
                        <LuminaLogo size={30} color="#1A7A62" />
                        <span style={{ fontFamily: 'Fraunces,serif', fontWeight: 700, fontSize: 19, color: 'var(--teal)', letterSpacing: '-0.01em' }}>
                            Lumina
                        </span>
                    </a>
                    <p style={{ color: 'var(--text-soft)', fontSize: 13, fontWeight: 700 }}>
                        &copy; 2026 Lumina &ndash; Early literacy for everyone.
                    </p>
                    <div style={{ display: 'flex', gap: 22 }}>
                        {['Privacy', 'Terms', 'Contact'].map(l => (
                            <a key={l} href={`/${l.toLowerCase()}`} style={{
                                color: 'var(--text-soft)', textDecoration: 'none',
                                fontSize: 13, fontWeight: 700, transition: 'color 0.2s',
                            }}
                                onMouseOver={(e: React.MouseEvent<HTMLSpanElement>) => {
                                    (e.currentTarget as HTMLElement).style.color = 'var(--teal)';
                                }}
                                onMouseOut={(e: React.MouseEvent<HTMLSpanElement>) => {
                                    (e.currentTarget as HTMLElement).style.color = 'var(--text-soft)';
                                }}
                            >
                                {l}</a>
                        ))}
                    </div>
                </div>
            </footer>
        </>
    );
};

export default Landing;