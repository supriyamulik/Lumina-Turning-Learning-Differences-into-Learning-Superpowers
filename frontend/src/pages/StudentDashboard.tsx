// frontend/src/pages/StudentDashboard.tsx
// Redesigned: permanent sidebar, 5 islands, clean Leo card, no popup

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentApi } from '../lib/api';
import FontToggle from '../components/FontToggle';

// ─── Types ────────────────────────────────────────────────────
interface IslandProgress {
    island_id: number;
    status: 'locked' | 'active' | 'completed';
    progress_pct: number;
    island: { id: number; name: string; phoneme: string; emoji: string; description: string };
}
interface MasteryRow {
    island_id: number;
    mastery_score: number;
    island: { name: string; phoneme: string };
}
interface DashboardData {
    profile: {
        id: string; name: string; avatar: string;
        sunCoins: number; streakDays: number;
        onboardingDone: boolean; interests: string[];
    };
    islands: IslandProgress[];
    mastery: MasteryRow[];
    leoMessage: string;
    activeIsland: IslandProgress | null;
}

// ─── 5-island map positions (% based, left-to-right path) ─────
const ISLAND_POSITIONS = [
    { x: 12, y: 72 },
    { x: 30, y: 50 },
    { x: 50, y: 34 },
    { x: 70, y: 50 },
    { x: 88, y: 28 },
];

// ─── Island accent colours (matches IslandEntry.tsx) ──────────
const ISLAND_COLORS: Record<number, string> = {
    1: '#2D8B7E',
    2: '#4A90C4',
    3: '#7B5EA7',
    4: '#E8920C',
    5: '#D4607A',
};

const skillColor = (s: number) =>
    s >= 80 ? '#27AE60' : s >= 50 ? '#E8920C' : s > 0 ? '#D4607A' : '#C8D4CE';

// ─── Nav items ────────────────────────────────────────────────
const NAV_ITEMS = [
    { icon: '🗺️', label: 'My Islands', href: '/dashboard', active: true },
    { icon: '📖', label: 'Learning Module', href: '/learningmodule', active: true },
    { icon: '🎯', label: "Today's Quest", href: '/quest', active: false },
    { icon: '📊', label: 'My Progress', href: '/progress', active: false },
    { icon: '🏆', label: 'Rewards', href: '/rewards', active: false },
    { icon: '⚙️', label: 'Settings', href: '/settings', active: false },
];

// ─── Lumina Logo ──────────────────────────────────────────────
const LuminaLogo: React.FC<{ size?: number; light?: boolean }> = ({ size = 28, light }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <path d="M20 32C20 32 8 27 8 14L8 10C8 10 14 11 20 16C26 11 32 10 32 10L32 14C32 27 20 32 20 32Z"
            fill={light ? '#fff' : '#2D8B7E'} opacity="0.18" />
        <path d="M20 30C20 30 9 25.5 9 13.5L9 11C9 11 14.5 12 20 17L20 30Z"
            fill={light ? '#fff' : '#2D8B7E'} opacity="0.92" />
        <path d="M20 30C20 30 31 25.5 31 13.5L31 11C31 11 25.5 12 20 17L20 30Z"
            fill={light ? '#fff' : '#2D8B7E'} opacity="0.7" />
        <circle cx="20" cy="8" r="3.5" fill="#E8920C" opacity="0.92" />
    </svg>
);

// ─── Leo Badge (clean illustrated card, no floating SVG) ──────
const LeoBadge: React.FC = () => (
    <div style={{
        width: 52, height: 52, borderRadius: '50%',
        background: 'linear-gradient(135deg, #F5A623, #E8920C)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 26, flexShrink: 0,
        boxShadow: '0 3px 12px rgba(232,146,12,0.38)',
        border: '2.5px solid rgba(255,255,255,0.7)',
        userSelect: 'none',
    }}>🦁</div>
);

// ─── Loading ──────────────────────────────────────────────────
const LoadingScreen: React.FC = () => (
    <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexDirection: 'column', gap: 18,
        background: 'linear-gradient(160deg,#C8E8F4 0%,#D4EDD8 50%,#FDF6ED 100%)',
        fontFamily: "'Lexend', sans-serif",
    }}>
        <style>{`@keyframes lspin{0%,100%{transform:scale(1) rotate(0deg)}50%{transform:scale(1.1) rotate(8deg)}}`}</style>
        <div style={{ fontSize: 64, animation: 'lspin 1.6s ease-in-out infinite' }}>🦁</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#2D8B7E', letterSpacing: '0.06em' }}>
            Loading your jungle…
        </div>
    </div>
);

const ErrorScreen: React.FC<{ message: string }> = ({ message }) => (
    <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#FDF6ED',
        fontFamily: "'Lexend', sans-serif",
    }}>
        <div style={{ textAlign: 'center', maxWidth: 340, padding: 32 }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>😞</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#D4607A', marginBottom: 8 }}>Something went wrong</div>
            <div style={{ fontSize: 14, color: '#5A7866', marginBottom: 22, lineHeight: 1.72 }}>{message}</div>
            <button onClick={() => window.location.reload()} style={{
                background: '#2D8B7E', color: '#fff', border: 'none',
                borderRadius: 14, padding: '12px 28px',
                fontFamily: "'Lexend', sans-serif", fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}>Try Again</button>
        </div>
    </div>
);

// ═══════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════
const StudentDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [muted, setMuted] = useState(false);
    const [leaves] = useState([true, false, false]);

    useEffect(() => {
        const token = localStorage.getItem('lumina_token');
        if (!token) { window.location.href = '/login'; return; }
        studentApi.getDashboard()
            .then(d => setData(d))
            .catch(err => {
                if (err.message?.includes('401') || err.message?.includes('token')) {
                    localStorage.removeItem('lumina_token');
                    localStorage.removeItem('lumina_profile');
                    window.location.href = '/login';
                } else setError(err.message);
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <LoadingScreen />;
    if (error) return <ErrorScreen message={error} />;
    if (!data) return null;

    const { profile, islands, mastery, leoMessage, activeIsland } = data;
    const completedCount = islands.filter(i => i.status === 'completed').length;
    const greeting = (() => {
        const h = new Date().getHours();
        return h < 12 ? '🌅 Good morning' : h < 17 ? '☀️ Good afternoon' : '🌙 Good evening';
    })();

    const handleLogout = () => {
        localStorage.removeItem('lumina_token');
        localStorage.removeItem('lumina_profile');
        window.location.href = '/login';
    };

    const goToIsland = (island: IslandProgress) => {
        if (island.status !== 'locked') navigate(`/island/${island.island_id}`);
    };

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,600;9..144,700;9..144,800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; overflow: hidden; }

        :root {
          --cream:      #FDF6ED;
          --cream2:     #F4EDE0;
          --cream3:     #EDE3D4;
          --teal:       #2D8B7E;
          --teal-mid:   #3AA898;
          --teal-pale:  #E8F5F3;
          --teal-deep:  #1A5C52;
          --amber:      #E8920C;
          --amber-pale: #FEF3DC;
          --amber-deep: #B36A00;
          --rose:       #D4607A;
          --green:      #27AE60;
          --text:       #1C2E24;
          --text-mid:   #304838;
          --text-soft:  #6B8876;
          --border:     rgba(45,139,126,0.11);
          --sidebar-w:  300px;
          --font-ui:    'Lexend', sans-serif;
          --font-h:     'Fraunces', serif;
          --font-read:  'OpenDyslexic', 'Lexend', sans-serif;
          --shadow-sm:  0 2px 10px rgba(45,100,80,0.07);
          --shadow:     0 4px 22px rgba(45,100,80,0.10);
          --radius:     18px;
        }

        body {
          font-family: var(--font-ui);
          background: var(--cream);
          color: var(--text);
          font-size: 16px;
          line-height: 1.65;
          letter-spacing: 0.02em;
        }

        /* ── Keyframes ── */
        @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes pop     { 0%{transform:translate(-50%,-50%) scale(0.6);opacity:0} 70%{transform:translate(-50%,-50%) scale(1.1)} 100%{transform:translate(-50%,-50%) scale(1);opacity:1} }
        @keyframes pulse   { 0%,100%{box-shadow:0 0 0 0 rgba(232,146,12,0.45)} 60%{box-shadow:0 0 0 12px rgba(232,146,12,0)} }
        @keyframes leafPop { 0%{transform:scale(0) rotate(-20deg);opacity:0} 70%{transform:scale(1.2) rotate(4deg)} 100%{transform:scale(1);opacity:1} }
        @keyframes flame   { 0%,100%{transform:scale(1) rotate(-3deg)} 50%{transform:scale(1.16) rotate(3deg)} }
        @keyframes barIn   { from{width:0} to{width:var(--w)} }

        /* ════════════════════════════════
           APP SHELL
        ════════════════════════════════ */
        .app-shell {
          display: flex;
          height: 100vh;
          overflow: hidden;
        }

        /* ════════════════════════════════
           PERMANENT SIDEBAR
        ════════════════════════════════ */
        .sidebar {
          width: var(--sidebar-w);
          flex-shrink: 0;
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: linear-gradient(180deg, var(--teal-deep) 0%, #1E7060 55%, #256B5E 100%);
          position: relative;
          z-index: 20;
          overflow: hidden;
        }

        /* subtle texture overlay */
        .sidebar::before {
          content: '';
          position: absolute; inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M20 0L40 20L20 40L0 20z'/%3E%3C/g%3E%3C/svg%3E");
          pointer-events: none;
        }

        /* Brand */
        .sb-brand {
          padding: 26px 20px 20px;
          display: flex; align-items: center; gap: 10px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          flex-shrink: 0;
        }
        .sb-brand-name {
          font-family: var(--font-h);
          font-size: 1.25rem; font-weight: 700;
          color: #fff; letter-spacing: -0.01em;
        }

        /* Avatar block */
        .sb-user {
          padding: 18px 20px 16px;
          display: flex; align-items: center; gap: 13px;
          border-bottom: 1px solid rgba(255,255,255,0.09);
          flex-shrink: 0;
        }
        .sb-avatar {
          width: 46px; height: 46px; border-radius: 50%;
          background: rgba(255,255,255,0.18);
          border: 2px solid rgba(255,255,255,0.4);
          display: flex; align-items: center; justify-content: center;
          font-size: 24px; flex-shrink: 0;
        }
        .sb-name {
          font-family: var(--font-h);
          font-size: 1rem; font-weight: 700; color: #fff;
          line-height: 1.25; margin-bottom: 3px;
        }
        .sb-streak {
          display: flex; align-items: center; gap: 5px;
          font-size: 12px; font-weight: 600;
          color: rgba(255,255,255,0.68);
        }
        .sb-streak .fl { animation: flame 1.9s ease-in-out infinite; display: inline-block; }

        /* Coin row */
        .sb-coins {
          margin: 14px 16px 4px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.18);
          border-radius: 14px;
          padding: 11px 15px;
          display: flex; align-items: center; gap: 10px;
          flex-shrink: 0;
        }
        .sb-coins-icon { font-size: 20px; }
        .sb-coins-label { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.65); margin-bottom: 1px; }
        .sb-coins-val   { font-size: 17px; font-weight: 800; color: #FFE082; letter-spacing: -0.01em; }

        /* Nav */
        .sb-nav { flex: 1; padding: 10px 10px; overflow-y: auto; }
        .sb-nav::-webkit-scrollbar { width: 3px; }
        .sb-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }

        .sb-section-lbl {
          font-size: 9.5px; font-weight: 800; letter-spacing: 0.18em;
          text-transform: uppercase; color: rgba(255,255,255,0.38);
          padding: 10px 12px 5px;
        }
        .sb-nav-item {
          display: flex; align-items: center; gap: 11px;
          padding: 11px 14px; border-radius: 13px;
          font-size: 14px; font-weight: 700;
          color: rgba(255,255,255,0.72);
          cursor: pointer; transition: all 0.17s;
          margin-bottom: 2px; text-decoration: none;
          border: 1.5px solid transparent;
          min-height: 48px; position: relative;
        }
        .sb-nav-item:hover  { background: rgba(255,255,255,0.1); color: #fff; }
        .sb-nav-item.active { background: rgba(255,255,255,0.16); color: #fff; border-color: rgba(255,255,255,0.2); }
        .sb-nav-item.soon   { opacity: 0.45; cursor: not-allowed; }
        .sb-nav-icon        { font-size: 18px; width: 22px; text-align: center; flex-shrink: 0; }
        .sb-soon-pill {
          margin-left: auto; font-size: 9px; font-weight: 800;
          background: rgba(255,255,255,0.12); color: rgba(255,255,255,0.55);
          padding: 2px 8px; border-radius: 100px; letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        /* Footer */
        .sb-footer {
          padding: 12px 10px 18px;
          border-top: 1px solid rgba(255,255,255,0.1);
          display: flex; flex-direction: column; gap: 5px;
          flex-shrink: 0;
        }
        .sb-sound {
          display: flex; align-items: center; gap: 11px;
          padding: 10px 14px; border-radius: 13px;
          font-size: 14px; font-weight: 700;
          color: rgba(255,255,255,0.72);
          cursor: pointer; transition: all 0.17s;
          min-height: 46px;
        }
        .sb-sound:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .sb-toggle {
          margin-left: auto; width: 40px; height: 22px;
          background: rgba(255,255,255,0.2); border-radius: 100px;
          position: relative; transition: background 0.22s; flex-shrink: 0;
        }
        .sb-toggle.on { background: var(--teal-mid); }
        .sb-toggle-dot {
          position: absolute; top: 3px; width: 16px; height: 16px;
          background: #fff; border-radius: 50%;
          box-shadow: 0 1px 4px rgba(0,0,0,0.25);
          transition: left 0.2s cubic-bezier(0.34,1.4,0.64,1); left: 3px;
        }
        .sb-toggle-dot.on { left: 21px; }
        .sb-logout {
          display: flex; align-items: center; gap: 11px;
          padding: 10px 14px; border-radius: 13px;
          font-size: 14px; font-weight: 700;
          color: rgba(255,160,160,0.85);
          cursor: pointer; transition: all 0.17s;
          min-height: 46px;
        }
        .sb-logout:hover { background: rgba(212,96,122,0.18); color: #FFB3B3; }

        /* ════════════════════════════════
           MAIN CONTENT
        ════════════════════════════════ */
        .main-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }

        /* ── Top bar ── */
        .topbar {
          height: 60px;
          background: rgba(253,246,237,0.97);
          backdrop-filter: blur(20px);
          border-bottom: 1.5px solid var(--border);
          display: flex; align-items: center;
          padding: 0 28px;
          justify-content: space-between;
          flex-shrink: 0;
          animation: fadeIn 0.4s ease both;
          position: relative; z-index: 10;
        }
        .topbar-left {
          display: flex; flex-direction: column;
        }
        .topbar-time {
          font-size: 10.5px; font-weight: 700; color: var(--text-soft);
          text-transform: uppercase; letter-spacing: 0.14em;
        }
        .topbar-greeting {
          font-family: var(--font-h);
          font-size: 1.1rem; font-weight: 700; color: var(--text);
          line-height: 1.2;
        }
        .topbar-greeting span { color: var(--teal); }
        .topbar-pills { display: flex; align-items: center; gap: 9px; }
        .pill {
          display: flex; align-items: center; gap: 6px;
          background: #fff; border: 1.5px solid var(--border);
          border-radius: 100px; padding: 6px 14px;
          font-size: 13px; font-weight: 700;
          box-shadow: var(--shadow-sm); white-space: nowrap;
        }
        .pill-streak { background: var(--amber-pale); border-color: rgba(232,146,12,0.22); color: var(--amber-deep); }
        .pill-coins  { background: #FFFBF0; border-color: rgba(232,146,12,0.18); color: var(--amber-deep); }

        /* ── Scroll area ── */
        .scroll-area {
          flex: 1;
          overflow-y: auto;
          padding: 24px 28px 40px;
        }
        .scroll-area::-webkit-scrollbar { width: 4px; }
        .scroll-area::-webkit-scrollbar-thumb { background: var(--cream3); border-radius: 2px; }

        /* ── Daily goal strip ── */
        .daily {
          background: #fff;
          border: 1.5px solid var(--border);
          border-radius: var(--radius);
          padding: 14px 20px;
          margin-bottom: 22px;
          box-shadow: var(--shadow-sm);
          display: flex; align-items: center; gap: 16px;
          animation: fadeUp 0.4s 0.05s ease both;
        }
        .daily-lbl {
          font-size: 11px; font-weight: 800; color: var(--text-soft);
          text-transform: uppercase; letter-spacing: 0.13em; white-space: nowrap;
        }
        .leaves { display: flex; gap: 7px; align-items: center; }
        .leaf {
          font-size: 24px; opacity: 0.14; filter: grayscale(1);
          transition: all 0.4s ease;
        }
        .leaf.on { opacity: 1; filter: none; animation: leafPop 0.5s cubic-bezier(0.34,1.5,0.64,1) both; }
        .daily-right { margin-left: auto; text-align: right; }
        .daily-pct { font-size: 12px; font-weight: 700; color: var(--text-soft); }
        .daily-track { width: 72px; height: 5px; background: var(--cream3); border-radius: 100px; margin-top: 4px; overflow: hidden; }
        .daily-fill  { height: 100%; border-radius: 100px; background: var(--teal); transition: width 0.7s ease; }

        /* ── Content grid ── */
        .content-grid {
          display: grid;
          grid-template-columns: 1fr 310px;
          gap: 20px;
          align-items: start;
          animation: fadeUp 0.45s 0.1s ease both;
        }

        /* ── Card base ── */
        .card {
          background: #fff;
          border: 1.5px solid var(--border);
          border-radius: var(--radius);
          box-shadow: var(--shadow-sm);
          overflow: hidden;
        }
        .card-head {
          padding: 18px 20px 0;
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 14px;
        }
        .card-title {
          font-family: var(--font-h);
          font-size: 1.05rem; font-weight: 700; color: var(--text);
          display: flex; align-items: center; gap: 8px;
        }
        .card-sub { font-size: 12px; font-weight: 600; color: var(--text-soft); }

        /* ── Island map ── */
        .map-wrap {
          position: relative; width: 100%; padding-bottom: 58%;
          background: linear-gradient(155deg, #B4DFF5 0%, #C6EDD5 35%, #D8F0C8 65%, #B8E4DC 100%);
          border-radius: 0 0 16px 16px;
          overflow: hidden;
        }
        .map-svg { position: absolute; inset: 0; width: 100%; height: 100%; }

        /* island node */
        .inode {
          position: absolute;
          transform: translate(-50%, -50%);
          display: flex; flex-direction: column; align-items: center; gap: 5px;
          z-index: 2;
          animation: pop 0.45s cubic-bezier(0.34,1.4,0.64,1) both;
        }
        .inode:not(.locked) { cursor: pointer; }

        .ibubble {
          width: 56px; height: 56px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 24px; border: 3px solid rgba(255,255,255,0.7);
          transition: transform 0.22s cubic-bezier(0.34,1.4,0.64,1), box-shadow 0.22s;
          position: relative;
        }
        .ibubble.completed {
          background: linear-gradient(135deg, #2D8B7E, #3AA898);
          box-shadow: 0 4px 16px rgba(45,139,126,0.38);
        }
        .ibubble.active {
          background: linear-gradient(135deg, #E8920C, #F5B528);
          box-shadow: 0 4px 18px rgba(232,146,12,0.46);
          animation: pulse 2.4s ease-in-out infinite;
        }
        .ibubble.locked {
          background: rgba(180,195,190,0.55);
          border-color: rgba(255,255,255,0.28);
          filter: grayscale(0.5); opacity: 0.7;
        }
        .inode:not(.locked):hover .ibubble {
          transform: scale(1.16);
          box-shadow: 0 8px 24px rgba(45,100,80,0.22);
        }
        .ibadge {
          position: absolute; top: -3px; right: -3px;
          width: 19px; height: 19px; border-radius: 50%;
          border: 2px solid #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 8px; font-weight: 800;
        }
        .ilabel {
          font-size: 10.5px; font-weight: 700; color: var(--text-mid);
          text-align: center; max-width: 70px; line-height: 1.3;
          background: rgba(253,246,237,0.92);
          padding: 2px 7px; border-radius: 7px;
        }
        .ilabel.locked { color: var(--text-soft); }

        /* island colour dot */
        .icolor-ring {
          position: absolute; inset: -3px; border-radius: 50%;
          border: 3px solid transparent;
        }

        /* ── Right column ── */
        .right-col { display: flex; flex-direction: column; gap: 16px; }

        /* ── Quest card ── */
        .quest-card {
          border-radius: var(--radius);
          padding: 20px;
          color: #fff;
          position: relative; overflow: hidden;
          background: linear-gradient(145deg, #145C50 0%, #1E7566 45%, #2D8B7E 100%);
          box-shadow: 0 6px 28px rgba(20,92,80,0.32);
          transition: transform 0.2s;
        }
        .quest-card:hover { transform: translateY(-2px); }
        .quest-card::after {
          content: '🌴';
          position: absolute; right: -8px; bottom: -16px;
          font-size: 68px; opacity: 0.1; transform: rotate(14deg);
          pointer-events: none; user-select: none;
        }
        .quest-tag {
          display: inline-flex; align-items: center; gap: 5px;
          background: rgba(255,255,255,0.16); border: 1px solid rgba(255,255,255,0.22);
          border-radius: 100px; padding: 3px 12px;
          font-size: 10px; font-weight: 800; text-transform: uppercase;
          letter-spacing: 0.1em; margin-bottom: 12px;
        }
        .quest-name {
          font-family: var(--font-h);
          font-size: 1.2rem; font-weight: 700; margin-bottom: 5px; line-height: 1.3;
        }
        .quest-meta {
          font-size: 12.5px; opacity: 0.82; margin-bottom: 7px;
          display: flex; gap: 13px; flex-wrap: wrap;
        }
        .quest-phoneme {
          font-size: 12.5px; opacity: 0.88; font-weight: 600;
          background: rgba(255,255,255,0.1); border-radius: 9px;
          padding: 7px 11px; margin-bottom: 16px;
          font-family: var(--font-read); letter-spacing: 0.05em; line-height: 1.6;
        }
        .quest-btn {
          background: var(--amber); color: #fff; border: none;
          border-radius: 13px; padding: 13px 16px;
          font-family: var(--font-ui); font-size: 15px; font-weight: 800;
          cursor: pointer; width: 100%; transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(0,0,0,0.18);
          display: flex; align-items: center; justify-content: center; gap: 7px;
          min-height: 50px;
        }
        .quest-btn:hover { background: #CC7A00; transform: translateY(-1px); }

        /* ── Skills card ── */
        .skills-body { padding: 4px 20px 18px; }
        .skill-row   { margin-bottom: 13px; }
        .skill-top   { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 5px; }
        .skill-name  { font-size: 13px; font-weight: 700; color: var(--text-mid); }
        .skill-ph    { font-size: 11px; font-weight: 500; color: var(--text-soft); margin-left: 5px; }
        .skill-pct   { font-size: 12px; font-weight: 700; flex-shrink: 0; }
        .skill-track { height: 8px; background: var(--cream3); border-radius: 100px; overflow: hidden; }
        .skill-fill  { height: 100%; border-radius: 100px; transition: width 1s cubic-bezier(0.34,1.2,0.64,1); }

        /* ── Leo message card ── */
        .leo-card {
          background: #fff;
          border: 1.5px solid var(--border);
          border-radius: var(--radius);
          box-shadow: var(--shadow-sm);
          overflow: hidden;
        }
        .leo-card-inner {
          display: flex; align-items: flex-start; gap: 14px;
          padding: 16px 18px;
        }
        .leo-bubble-text {
          flex: 1;
        }
        .leo-label {
          display: inline-flex; align-items: center; gap: 5px;
          background: var(--amber-pale);
          color: var(--amber-deep);
          font-size: 10px; font-weight: 800; letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 3px 10px; border-radius: 100px;
          margin-bottom: 7px;
          border: 1px solid rgba(232,146,12,0.2);
        }
        .leo-message {
          font-size: 14px; font-weight: 600;
          color: var(--text-mid); line-height: 1.75;
          letter-spacing: 0.022em;
        }

        /* ── Mobile responsive ── */
        @media (max-width: 900px) {
          .content-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 700px) {
          :root { --sidebar-w: 0px; }
          .sidebar { display: none; }
          .scroll-area { padding: 16px 14px 80px; }
          .topbar { padding: 0 16px; }
          .topbar-greeting { font-size: 1rem; }
        }
      `}</style>

            <div className="app-shell">

                {/* ══════════════════════════════════
            PERMANENT SIDEBAR
        ══════════════════════════════════ */}
                <aside className="sidebar">

                    {/* Brand */}
                    <div className="sb-brand">
                        <LuminaLogo size={28} light />
                        <span className="sb-brand-name">Lumina</span>
                    </div>

                    {/* User block */}
                    <div className="sb-user">
                        <div className="sb-avatar">{profile.avatar}</div>
                        <div>
                            <div className="sb-name">{profile.name}</div>
                            <div className="sb-streak">
                                <span className="fl">🔥</span>
                                {profile.streakDays > 0 ? `${profile.streakDays} day streak` : 'Start your streak!'}
                            </div>
                        </div>
                    </div>

                    {/* Coins */}
                    <div className="sb-coins">
                        <span className="sb-coins-icon">☀️</span>
                        <div>
                            <div className="sb-coins-label">Sun Coins</div>
                            <div className="sb-coins-val">{profile.sunCoins}</div>
                        </div>
                    </div>

                    {/* Nav */}
                    <nav className="sb-nav">
                        <div className="sb-section-lbl">Navigate</div>
                        {NAV_ITEMS.map(item => (
                            <a
                                key={item.label}
                                href={item.href}
                                className={`sb-nav-item${item.active ? ' active' : ' soon'}`}
                                onClick={e => { if (!item.active) e.preventDefault(); }}
                            >
                                <span className="sb-nav-icon">{item.icon}</span>
                                {item.label}
                                {!item.active && <span className="sb-soon-pill">Soon</span>}
                            </a>
                        ))}
                    </nav>

                    {/* Footer – sound toggle, font toggle, logout */}
                    <div className="sb-footer">
                        {/* Sound toggle */}
                        <div className="sb-sound" onClick={() => setMuted(m => !m)}>
                            <span className="sb-nav-icon">{muted ? '🔇' : '🔊'}</span>
                            <span>{muted ? 'Sound off' : 'Sound on'}</span>
                            <div className={`sb-toggle${muted ? '' : ' on'}`}>
                                <div className={`sb-toggle-dot${muted ? '' : ' on'}`} />
                            </div>
                        </div>

                        {/* Font toggle – uses same styling */}
                        <FontToggle />

                        {/* Logout */}
                        <div className="sb-logout" onClick={handleLogout}>
                            <span className="sb-nav-icon">🚪</span>Log out
                        </div>
                    </div>

                </aside>

                {/* ══════════════════════════════════
            MAIN CONTENT
        ══════════════════════════════════ */}
                <div className="main-area">

                    {/* Top bar */}
                    <div className="topbar">
                        <div className="topbar-left">
                            <div className="topbar-time">{greeting}</div>
                            <div className="topbar-greeting">Hello, <span>{profile.name}</span>! 🌴</div>
                        </div>
                        <div className="topbar-pills">
                            <div className="pill pill-streak">
                                <span style={{ animation: 'flame 2s ease-in-out infinite', display: 'inline-block' }}>🔥</span>
                                {profile.streakDays} day{profile.streakDays !== 1 ? 's' : ''}
                            </div>
                            <div className="pill pill-coins">☀️ {profile.sunCoins}</div>
                        </div>
                    </div>

                    {/* Scrollable content */}
                    <div className="scroll-area">

                        {/* Daily goal strip */}
                        <div className="daily">
                            <span className="daily-lbl">Today's goal</span>
                            <div className="leaves">
                                {leaves.map((on, i) => (
                                    <span key={i} className={`leaf${on ? ' on' : ''}`}
                                        style={{ animationDelay: `${i * 0.14}s` }}>🌿</span>
                                ))}
                            </div>
                            <div className="daily-right">
                                <div className="daily-pct">{leaves.filter(Boolean).length} / 3 done</div>
                                <div className="daily-track">
                                    <div className="daily-fill"
                                        style={{ width: `${(leaves.filter(Boolean).length / 3) * 100}%` }} />
                                </div>
                            </div>
                        </div>

                        {/* Content grid */}
                        <div className="content-grid">

                            {/* ── Island Map ── */}
                            <div className="card">
                                <div className="card-head">
                                    <div className="card-title">🗺️ Phonics Islands</div>
                                    <span className="card-sub">{completedCount} / {islands.length} completed</span>
                                </div>

                                <div className="map-wrap">
                                    {/* SVG path + decorations */}
                                    <svg className="map-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                                        {/* Dashed path through all islands */}
                                        <polyline
                                            points={ISLAND_POSITIONS.map(p => `${p.x},${p.y}`).join(' ')}
                                            fill="none" stroke="rgba(45,139,126,0.28)"
                                            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                                            strokeDasharray="3.5 3" />
                                        {/* Water ripples */}
                                        {[[22, 82], [60, 65], [80, 45], [42, 22]].map(([cx, cy], i) => (
                                            <ellipse key={i} cx={cx} cy={cy} rx="6" ry="2.2"
                                                fill="none" stroke="rgba(74,144,196,0.14)" strokeWidth="1" />
                                        ))}
                                        {/* Clouds */}
                                        {[[10, 8], [55, 6], [82, 12]].map(([cx, cy], i) => (
                                            <g key={i} opacity="0.22">
                                                <ellipse cx={cx} cy={cy} rx="7" ry="3.5" fill="white" />
                                                <ellipse cx={cx + 3} cy={cy - 1.5} rx="4.5" ry="3.2" fill="white" />
                                            </g>
                                        ))}
                                    </svg>

                                    {/* Island nodes */}
                                    {islands.map((island, idx) => {
                                        const pos = ISLAND_POSITIONS[island.island_id - 1];
                                        const color = ISLAND_COLORS[island.island_id] || '#2D8B7E';
                                        if (!pos) return null;
                                        return (
                                            <div key={island.island_id}
                                                className={`inode${island.status === 'locked' ? ' locked' : ''}`}
                                                style={{ left: `${pos.x}%`, top: `${pos.y}%`, animationDelay: `${idx * 0.08}s` }}
                                                onClick={() => goToIsland(island)}
                                                title={island.status !== 'locked' ? `Go to ${island.island.name}` : 'Locked'}
                                            >
                                                {/* Active progress ring */}
                                                {island.status === 'active' && (
                                                    <svg width="68" height="68"
                                                        style={{ position: 'absolute', top: -6, left: -6, pointerEvents: 'none' }}>
                                                        <circle cx="34" cy="34" r="30"
                                                            fill="none" stroke="rgba(232,146,12,0.14)" strokeWidth="4" />
                                                        <circle cx="34" cy="34" r="30"
                                                            fill="none" stroke="#E8920C" strokeWidth="4"
                                                            strokeDasharray={`${2 * Math.PI * 30 * island.progress_pct / 100} ${2 * Math.PI * 30}`}
                                                            strokeLinecap="round" transform="rotate(-90 34 34)" />
                                                    </svg>
                                                )}

                                                <div className={`ibubble ${island.status}`}
                                                    style={island.status === 'completed'
                                                        ? { background: `linear-gradient(135deg, ${color}CC, ${color})` }
                                                        : {}}>
                                                    {island.island.emoji}
                                                    {island.status === 'completed' && (
                                                        <div className="ibadge" style={{ background: '#27AE60' }}>✓</div>
                                                    )}
                                                    {island.status === 'locked' && (
                                                        <div className="ibadge" style={{ background: 'rgba(120,135,130,0.8)' }}>🔒</div>
                                                    )}
                                                </div>
                                                <div className={`ilabel${island.status === 'locked' ? ' locked' : ''}`}>
                                                    {island.island.name}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* ── Right column ── */}
                            <div className="right-col">

                                {/* Quest card */}
                                {activeIsland ? (
                                    <div className="quest-card">
                                        <div className="quest-tag">⚡ Today's Quest</div>
                                        <div className="quest-name">
                                            {activeIsland.island.name} {activeIsland.island.emoji}
                                        </div>
                                        <div className="quest-meta">
                                            <span>📖 5 min</span>
                                            <span>☀️ +20 coins</span>
                                        </div>
                                        <div className="quest-phoneme">
                                            Sounds: <strong>{activeIsland.island.phoneme}</strong>
                                        </div>
                                        <button
                                            className="quest-btn"
                                            onClick={() => navigate(`/island/${activeIsland.island_id}`)}
                                        >
                                            Start Quest! 🚀
                                        </button>
                                    </div>
                                ) : (
                                    <div className="quest-card">
                                        <div className="quest-tag">🏆 Champion!</div>
                                        <div className="quest-name">All islands conquered!</div>
                                        <div style={{ fontSize: 13, opacity: 0.85, fontWeight: 500, lineHeight: 1.65 }}>
                                            Amazing work, {profile.name}! 🎉<br />You have mastered all 5 phonics islands.
                                        </div>
                                    </div>
                                )}

                                {/* Skills card */}
                                <div className="card">
                                    <div className="card-head">
                                        <div className="card-title">📊 My Skills</div>
                                    </div>
                                    <div className="skills-body">
                                        {(() => {
                                            const masteryByIsland: Record<number, number> = {};
                                            for (const m of mastery) {
                                                if (m.island_id && m.mastery_score > 0) {
                                                    masteryByIsland[m.island_id] = m.mastery_score;
                                                }
                                            }
                                            for (const i of islands) {
                                                if (!(i.island_id in masteryByIsland) && i.progress_pct > 0) {
                                                    masteryByIsland[i.island_id] = i.progress_pct;
                                                }
                                            }

                                            const hasAnyScore = Object.keys(masteryByIsland).length > 0;
                                            if (!hasAnyScore) {
                                                return (
                                                    <p style={{ fontSize: 13.5, color: 'var(--text-soft)', fontWeight: 600, lineHeight: 1.75, paddingBottom: 4 }}>
                                                        Complete your first activity to see your skills here! 🌟
                                                    </p>
                                                );
                                            }

                                            return islands.map(i => {
                                                const score = masteryByIsland[i.island_id] ?? 0;
                                                const name = i.island?.name ?? `Island ${i.island_id}`;
                                                const phoneme = i.island?.phoneme ?? '';
                                                return (
                                                    <div className="skill-row" key={i.island_id}>
                                                        <div className="skill-top">
                                                            <div>
                                                                <span className="skill-name">{name}</span>
                                                                {phoneme && <span className="skill-ph">{phoneme}</span>}
                                                            </div>
                                                            <span className="skill-pct" style={{ color: skillColor(score) }}>
                                                                {score > 0 ? `${score}%` : '—'}
                                                            </span>
                                                        </div>
                                                        <div className="skill-track">
                                                            <div className="skill-fill" style={{
                                                                width: `${score}%`,
                                                                background: skillColor(score),
                                                            }} />
                                                        </div>
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>

                                {/* Leo message card */}
                                <div className="leo-card">
                                    <div className="leo-card-inner">
                                        <LeoBadge />
                                        <div className="leo-bubble-text">
                                            <div className="leo-label">🦁 Leo says</div>
                                            <div className="leo-message">{leoMessage}</div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default StudentDashboard;