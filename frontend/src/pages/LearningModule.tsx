// ============================================================
// FILE LOCATION: frontend/src/pages/LearningModule.tsx
// ============================================================

import { useState } from "react";
import { useNavigate } from "react-router-dom";

const modules = [
  {
    id: "alphabet",
    title: "Alphabet",
    subtitle: "A → Z",
    description: "Learn every letter, its sound, and daily words through See, Hear & Speak!",
    emoji: "🔤",
    features: ["Grid View", "Zoom & Phonics", "Echo Mic", "Daily Words"],
    route: "/learning/alphabet",
    cardBg: "#FFFDF5",
    cardBorder: "#E8C97A",
    badgeText: "26 Letters",
    badgeBg: "#FEF3C7",
    badgeColor: "#92400E",
    btnBg: "linear-gradient(135deg, #E8920C, #D97706)",
    chipBg: "#FEF9EC",
    chipBorder: "#F5D78A",
    chipColor: "#A16207",
    accentDot: "#F59E0B",
  },
  {
    id: "numbers",
    title: "Numbers",
    subtitle: "1 → 10",
    description: "Count, speak & connect numbers to real-life objects around you!",
    emoji: "🔢",
    features: ["Grid View", "Zoom & Count", "Echo Mic", "Daily Routine"],
    route: "/learning/numbers",
    cardBg: "#F5FEFA",
    cardBorder: "#86EFBC",
    badgeText: "10 Numbers",
    badgeBg: "#DCFCE7",
    badgeColor: "#14532D",
    btnBg: "linear-gradient(135deg, #22C55E, #16A34A)",
    chipBg: "#F0FDF4",
    chipBorder: "#86EFBC",
    chipColor: "#15803D",
    accentDot: "#22C55E",
  },
];

export default function LearningModule() {
  const navigate = useNavigate();
  const [leoSpeaking, setLeoSpeaking] = useState(false);

  const leoSpeak = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.85; u.pitch = 1.1;
      u.onstart = () => setLeoSpeaking(true);
      u.onend = () => setLeoSpeaking(false);
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,ital,wght@9..144,1,700;9..144,0,800&family=Lexend:wght@400;500;600;700;800&display=swap');

        .lm-bg {
          min-height: 100vh;
          background: linear-gradient(180deg,
            #9DD4EC 0%,
            #B8DFF0 15%,
            #C8EAF5 28%,
            #CEEBD8 52%,
            #C2E2C0 68%,
            #A8D4A0 100%
          );
          font-family: 'Lexend', sans-serif;
          position: relative;
          overflow-x: hidden;
          padding-bottom: 80px;
        }

        .lm-cloud {
          position: absolute;
          background: white;
          border-radius: 60px;
          opacity: 0.88;
          pointer-events: none;
        }
        .lm-cloud::before, .lm-cloud::after {
          content: '';
          position: absolute;
          background: white;
          border-radius: 50%;
        }
        .lm-c1 {
          width: 150px; height: 48px;
          top: 5%; left: 3%;
          animation: cDrift 20s ease-in-out infinite;
        }
        .lm-c1::before { width: 78px; height: 68px; top:-32px; left:20px; }
        .lm-c1::after  { width: 62px; height: 54px; top:-24px; left:66px; }

        .lm-c2 {
          width: 110px; height: 38px;
          top: 9%; right: 14%;
          animation: cDrift 26s ease-in-out infinite reverse;
        }
        .lm-c2::before { width: 60px; height: 54px; top:-24px; left:16px; }
        .lm-c2::after  { width: 48px; height: 44px; top:-18px; left:48px; }

        .lm-c3 {
          width: 88px; height: 30px;
          top: 3%; left: 40%;
          animation: cDrift 22s ease-in-out infinite 5s;
        }
        .lm-c3::before { width: 46px; height: 44px; top:-20px; left:12px; }
        .lm-c3::after  { width: 38px; height: 34px; top:-14px; left:38px; }

        @keyframes cDrift {
          0%,100% { transform: translateX(0); }
          50%      { transform: translateX(18px); }
        }

        .lm-sun {
          position: absolute;
          top: 3%; right: 5%;
          width: 80px; height: 80px;
          background: radial-gradient(circle at 42% 42%, #FFE566, #F5B528);
          border-radius: 50%;
          box-shadow:
            0 0 0 16px rgba(245,181,40,0.16),
            0 0 0 34px rgba(245,181,40,0.07);
          animation: sunPulse 4s ease-in-out infinite;
          pointer-events: none; z-index: 1;
        }
        @keyframes sunPulse {
          0%,100% { box-shadow: 0 0 0 16px rgba(245,181,40,0.16), 0 0 0 34px rgba(245,181,40,0.07); }
          50%      { box-shadow: 0 0 0 22px rgba(245,181,40,0.20), 0 0 0 44px rgba(245,181,40,0.09); }
        }

        .lm-trees {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          height: 130px;
          pointer-events: none;
          z-index: 0;
          opacity: 0.6;
        }

        .lm-back {
          position: fixed; top: 16px; left: 16px;
          display: flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,0.78);
          backdrop-filter: blur(10px);
          border: 1.5px solid rgba(255,255,255,0.95);
          border-radius: 100px;
          padding: 7px 18px;
          color: #1A3828; font-size: 13px; font-weight: 700;
          cursor: pointer;
          box-shadow: 0 2px 12px rgba(0,0,0,0.09);
          transition: all .2s; z-index: 100;
          font-family: 'Lexend', sans-serif;
        }
        .lm-back:hover { background: white; transform: translateX(-2px); }

        .lm-content { position: relative; z-index: 2; }

        .lm-header {
          text-align: center;
          padding: 60px 16px 28px;
        }
        .lm-leo-wrap {
          display: inline-flex; flex-direction: column;
          align-items: center; cursor: pointer;
          margin-bottom: 16px;
        }
        .lm-leo {
          width: 80px; height: 80px; border-radius: 50%;
          background: linear-gradient(135deg, #F5A623, #E8920C);
          border: 4px solid rgba(255,255,255,0.9);
          display: flex; align-items: center; justify-content: center;
          font-size: 38px;
          box-shadow: 0 6px 24px rgba(232,146,12,0.42);
          transition: transform .2s;
        }
        .lm-leo:hover     { transform: scale(1.07); }
        .lm-leo-active    { animation: leoBounce 0.9s ease-in-out infinite; }
        @keyframes leoBounce {
          0%,100% { transform: scale(1);    }
          50%      { transform: scale(1.11); }
        }

        .lm-bubble {
          margin-top: 10px;
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(10px);
          border: 1.5px solid rgba(255,255,255,0.95);
          border-radius: 20px;
          padding: 7px 20px;
          font-size: 13px; font-weight: 600; color: #3D2B00;
          box-shadow: 0 3px 14px rgba(0,0,0,0.07);
        }

        .lm-title {
          font-family: 'Fraunces', serif;
          font-size: clamp(26px, 4.5vw, 40px);
          font-weight: 800; color: #1A3828;
          margin: 8px 0 4px; line-height: 1.2;
        }
        .lm-title em { color: #E8920C; font-style: italic; }

        .lm-sub {
          font-size: 15px; font-weight: 500;
          color: #2D5040;
        }

        .lm-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          max-width: 820px;
          margin: 0 auto 28px;
          padding: 0 20px;
        }

        .lm-card {
          border-radius: 24px;
          border: 2px solid;
          padding: 28px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          transition: transform 0.28s cubic-bezier(0.34,1.4,0.64,1),
                      box-shadow 0.28s ease;
          animation: cardUp 0.5s ease both;
        }
        .lm-card:nth-child(2) { animation-delay: 0.14s; }
        .lm-card:hover {
          transform: translateY(-7px) scale(1.015);
          box-shadow: 0 18px 44px rgba(0,0,0,0.14);
        }
        @keyframes cardUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0);    }
        }

        .lm-blob {
          position: absolute; top: -28px; right: -28px;
          width: 90px; height: 90px; border-radius: 50%;
          opacity: 0.12; pointer-events: none;
        }

        .lm-card-top {
          display: flex; align-items: flex-start;
          justify-content: space-between; margin-bottom: 14px;
        }
        .lm-ebox {
          width: 58px; height: 58px; border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          font-size: 30px;
          box-shadow: 0 3px 10px rgba(0,0,0,0.09);
        }
        .lm-badge {
          font-size: 11px; font-weight: 800;
          padding: 4px 13px; border-radius: 100px;
        }

        .lm-card-title {
          font-family: 'Fraunces', serif;
          font-size: 25px; font-weight: 800;
          color: #1A3828; margin-bottom: 2px;
          display: flex; align-items: baseline; gap: 8px;
        }
        .lm-card-sub { font-size: 14px; font-weight: 500; color: #9CA3AF; }

        .lm-desc {
          font-size: 13.5px; color: #4B5563; line-height: 1.72;
          margin: 8px 0 16px; font-weight: 500;
        }

        .lm-chips { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 20px; }
        .lm-chip {
          font-size: 11.5px; font-weight: 700;
          padding: 4px 12px; border-radius: 100px; border: 1.5px solid;
        }

        .lm-btn {
          width: 100%; padding: 14px; border: none;
          border-radius: 16px; color: white;
          font-family: 'Lexend', sans-serif;
          font-size: 15px; font-weight: 800; cursor: pointer;
          box-shadow: 0 4px 16px rgba(0,0,0,0.14);
          transition: all .2s; letter-spacing: 0.01em;
        }
        .lm-btn:hover  { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(0,0,0,0.18); }
        .lm-btn:active { transform: scale(0.97); }

        .lm-strip {
          max-width: 820px; margin: 0 auto;
          padding: 0 20px;
        }
        .lm-strip-inner {
          background: rgba(255,255,255,0.68);
          backdrop-filter: blur(14px);
          border: 1.5px solid rgba(255,255,255,0.92);
          border-radius: 20px;
          padding: 14px 24px;
          display: flex; flex-wrap: wrap;
          align-items: center; justify-content: center; gap: 24px;
          box-shadow: 0 2px 16px rgba(0,0,0,0.06);
        }
        .lm-strip-item {
          display: flex; align-items: center; gap: 7px;
          font-size: 13px; font-weight: 700; color: #1A3828;
        }
      `}</style>

      <div className="lm-bg">

        <div className="lm-sun" />
        <div className="lm-cloud lm-c1" />
        <div className="lm-cloud lm-c2" />
        <div className="lm-cloud lm-c3" />

        <svg className="lm-trees" viewBox="0 0 1440 130" preserveAspectRatio="none">
          <ellipse cx="720" cy="125" rx="800" ry="30" fill="#8DC878" opacity="0.5" />
          {[60, 160, 280, 420, 540, 660, 780, 900, 1020, 1140, 1260, 1380].map((x, i) => {
            const h = 60 + (i % 3) * 22;
            const w = 36 + (i % 2) * 14;
            const trunk = 10 + (i % 2) * 4;
            const col = i % 3 === 0 ? "#5DB85A" : i % 3 === 1 ? "#4CAF50" : "#6DC96A";
            return (
              <g key={i} transform={`translate(${x}, ${130 - h})`}>
                <rect x={w / 2 - trunk / 2} y={h - 18} width={trunk} height={22} fill="#8B6534" rx="3" />
                <ellipse cx={w / 2} cy={h / 2} rx={w / 2} ry={h * 0.55} fill={col} opacity="0.9" />
                <ellipse cx={w / 2} cy={h / 2 - 8} rx={w / 2 - 4} ry={h * 0.42} fill={col} opacity="0.6" />
              </g>
            );
          })}
        </svg>

        <button className="lm-back" onClick={() => navigate("/dashboard")}>
          ← Dashboard
        </button>

        <div className="lm-content">

          <div className="lm-header">
            <div
              className="lm-leo-wrap"
              onClick={() => leoSpeak("Welcome to the Learning Cove! Choose Alphabet to learn letters and sounds, or Numbers to learn counting!")}
            >
              <div className={`lm-leo ${leoSpeaking ? "lm-leo-active" : ""}`}>🦁</div>
              <div className="lm-bubble">
                {leoSpeaking ? "🔊 Leo is speaking..." : "👆 Pick a module to begin!"}
              </div>
            </div>

            <h1 className="lm-title">
              Learning <em>feels like play.</em>
            </h1>
            <p className="lm-sub">Choose what you want to explore today 🌿</p>
          </div>

          <div className="lm-grid">
            {modules.map((mod) => (
              <div
                key={mod.id}
                className="lm-card"
                style={{ borderColor: mod.cardBorder, background: mod.cardBg }}
                onMouseEnter={() => leoSpeak(mod.description)}
                onMouseLeave={() => { window.speechSynthesis?.cancel(); setLeoSpeaking(false); }}
                onClick={() => navigate(mod.route)}
              >
                <div className="lm-blob" style={{ background: mod.accentDot }} />

                <div className="lm-card-top">
                  <div className="lm-ebox" style={{ background: mod.badgeBg }}>
                    {mod.emoji}
                  </div>
                  <span className="lm-badge" style={{ background: mod.badgeBg, color: mod.badgeColor }}>
                    {mod.badgeText}
                  </span>
                </div>

                <div className="lm-card-title">
                  {mod.title}
                  <span className="lm-card-sub">{mod.subtitle}</span>
                </div>

                <p className="lm-desc">{mod.description}</p>

                <div className="lm-chips">
                  {mod.features.map((f) => (
                    <span key={f} className="lm-chip"
                      style={{ background: mod.chipBg, borderColor: mod.chipBorder, color: mod.chipColor }}>
                      ✓ {f}
                    </span>
                  ))}
                </div>

                <button
                  className="lm-btn"
                  style={{ background: mod.btnBg }}
                  onClick={(e) => { e.stopPropagation(); navigate(mod.route); }}
                >
                  Start {mod.title} →
                </button>
              </div>
            ))}
          </div>

          <div className="lm-strip">
            <div className="lm-strip-inner">
              {[
                { icon: "🎙️", text: "Speak & Learn" },
                { icon: "⭐", text: "Earn Stars" },
                { icon: "📊", text: "Track Progress" },
                { icon: "🦁", text: "Leo Guides You" },
              ].map((item) => (
                <div key={item.text} className="lm-strip-item">
                  <span>{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}