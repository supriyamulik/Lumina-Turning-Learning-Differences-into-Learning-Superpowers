import { useState } from "react";
import { useNavigate } from "react-router-dom";

// ─────────────────────────────────────────────────────────────
//  WORKSHEET DATA
//  👉 TO ADD MORE PDFs:
//     1. Drop your PDF into:  frontend/public/pdfs/
//     2. Set the pdf field below to: "/pdfs/your-file-name.pdf"
// ─────────────────────────────────────────────────────────────
const worksheets = [
    {
        id: 1,
        name: "Pattern Sequences",
        activity: "Worksheet Activity",
        ageRange: "Ages 5–8",
        description: "Visual pattern recognition using shapes and symbols to build logical thinking.",
        tags: ["Logic", "Visual"],
        emoji: "🔵",
        cardColor: "#fffdf5",
        tagColor: "#f4a12e",
        pdf: "/pdf/pattern_sequences.pdf",   // ✅ PDF linked — place file at: frontend/public/pdfs/pattern-sequences.pdf
    },
    {
        id: 2,
        name: "Sounds Like ",
        activity: "Worksheet Activity",
        ageRange: "Ages 5–8",
        description: "It helps students improve how they hear, identify, and match similar-sounding words, which builds stronger phonological awareness.",
        tags: ["Letters", "Art"],
        emoji: "🔤",
        cardColor: "#f0faf3",
        tagColor: "#52b788",
        pdf: "/pdf/sounds_like.pdf",   // 👉 Add your PDF: frontend/public/pdfs/letter-shapes.pdf  then change null to "/pdfs/letter-shapes.pdf"
    },
    {
        id: 3,
        name: "Choose the right color",
        activity: "Worksheet Activity",
        ageRange: "Ages 8–10",
        description: "Choose the Right Color” builds focus and comprehension by asking students to match colors correctly to given words or objects.",
        tags: ["Colours"],
        emoji: "📝",
        cardColor: "#fffdf5",
        tagColor: "#f4a12e",
        pdf: "/pdf/right_color.pdf",   // 👉 Add your PDF: frontend/public/pdfs/word-building.pdf  then change null to "/pdfs/word-building.pdf"
    },

];

// ─────────────────────────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────────────────────────
export default function ResourceModule() {
    const navigate = useNavigate();
    const [selectedSheet, setSelectedSheet] = useState<(typeof worksheets)[0] | null>(null);

    return (
        <div style={styles.page}>

            {/* ── CLOUDS ── */}
            <div style={{ ...styles.cloud, top: 18, left: "8%" }}>☁️</div>
            <div style={{ ...styles.cloud, top: 12, left: "52%", fontSize: 52 }}>☁️</div>
            <div style={{ ...styles.cloud, top: 20, right: "6%", fontSize: 40 }}>☁️</div>
            <div style={styles.sun}>🌤️</div>

            {/* ── BACK BUTTON ── */}
            <button style={styles.backBtn} onClick={() => navigate("/dashboard")}>
                ← Dashboard
            </button>

            {/* ── HEADER ── */}
            <div style={styles.header}>
                <div style={styles.leoCircle}>🦁</div>
                <div style={styles.leoLabel}>📚 Explore Worksheets!</div>
                <h1 style={styles.title}>
                    Worksheet <span style={styles.titleAccent}>Resources</span>
                </h1>
                <p style={styles.subtitle}>
                    Print-ready activity sheets to support your learning journey 🌿
                </p>
            </div>

            {/* ── CARDS GRID ── */}
            <div style={styles.grid}>
                {worksheets.map((sheet) => (
                    <div key={sheet.id} style={{ ...styles.card, background: sheet.cardColor }}>

                        <span style={{ ...styles.badge, background: sheet.tagColor }}>
                            {sheet.ageRange}
                        </span>

                        <div style={styles.cardIcon}>{sheet.emoji}</div>
                        <h2 style={styles.cardName}>{sheet.name}</h2>
                        <p style={styles.cardActivity}>{sheet.activity}</p>
                        <p style={styles.cardDesc}>{sheet.description}</p>

                        <div style={styles.tagRow}>
                            {sheet.tags.map((tag) => (
                                <span
                                    key={tag}
                                    style={{
                                        ...styles.tag,
                                        background: sheet.tagColor + "22",
                                        color: sheet.tagColor,
                                        border: `1.5px solid ${sheet.tagColor}44`,
                                    }}
                                >
                                    ✓ {tag}
                                </span>
                            ))}
                        </div>

                        <button
                            style={{ ...styles.viewBtn, background: sheet.tagColor }}
                            onClick={() => setSelectedSheet(sheet)}
                        >
                            View Worksheet →
                        </button>
                    </div>
                ))}
            </div>

            {/* ── PDF MODAL — fullscreen-style, large ── */}
            {selectedSheet && (
                <div style={styles.modalOverlay} onClick={() => setSelectedSheet(null)}>
                    <div style={styles.modal} onClick={(e) => e.stopPropagation()}>

                        {/* Header */}
                        <div style={styles.modalHeader}>
                            <div>
                                <h3 style={styles.modalTitle}>{selectedSheet.name}</h3>
                                <p style={styles.modalSub}>
                                    {selectedSheet.activity} · {selectedSheet.ageRange}
                                </p>
                            </div>
                            <button style={styles.closeBtn} onClick={() => setSelectedSheet(null)}>
                                ✕
                            </button>
                        </div>

                        {/* Body — takes up all remaining space */}
                        <div style={styles.modalBody}>
                            {selectedSheet.pdf ? (
                                // ✅ PDF linked — full size iframe
                                <iframe
                                    src={selectedSheet.pdf}
                                    style={styles.pdfFrame}
                                    title={selectedSheet.name}
                                />
                            ) : (
                                // 🔲 No PDF yet — placeholder
                                <div style={styles.placeholder}>
                                    <div style={{ fontSize: 64 }}>📄</div>
                                    <h4 style={styles.placeholderTitle}>PDF Coming Soon</h4>
                                    <p style={styles.placeholderText}>
                                        Drop your PDF into{" "}
                                        <code style={styles.code}>frontend/public/pdfs/</code> then update
                                        the <code style={styles.code}>pdf</code> field for{" "}
                                        <strong>"{selectedSheet.name}"</strong> in the worksheets array.
                                    </p>
                                    <code style={styles.codeBlock}>
                                        {`pdf: "/pdfs/${selectedSheet.name.toLowerCase().replace(/ /g, "-")}.pdf"`}
                                    </code>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div style={styles.modalFooter}>
                            <button style={styles.cancelBtn} onClick={() => setSelectedSheet(null)}>
                                Close
                            </button>
                            {selectedSheet.pdf && (
                                <a
                                    href={selectedSheet.pdf}
                                    download
                                    style={{
                                        ...styles.downloadBtn,
                                        textDecoration: "none",
                                    }}
                                >
                                    ⬇ Download PDF
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── GRASS ── */}
            <div style={styles.grass}>🌿🌱🌿🌱🌿🌱🌿🌱🌿🌱🌿🌱🌿🌱🌿🌱</div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
    page: {
        minHeight: "100vh",
        background: "linear-gradient(180deg, #a8d8ea 0%, #c8ebc1 100%)",
        padding: "24px 20px 80px",
        fontFamily: "'Nunito', sans-serif",
        position: "relative",
        overflow: "hidden",
    },
    cloud: {
        position: "absolute",
        fontSize: 44,
        opacity: 0.85,
        pointerEvents: "none",
        userSelect: "none",
    },
    sun: {
        position: "absolute",
        top: 12,
        right: 80,
        fontSize: 58,
        pointerEvents: "none",
        userSelect: "none",
    },
    backBtn: {
        background: "rgba(255,255,255,0.75)",
        border: "none",
        borderRadius: 30,
        padding: "8px 18px",
        fontFamily: "'Nunito', sans-serif",
        fontWeight: 800,
        fontSize: "0.88rem",
        color: "#1a3022",
        cursor: "pointer",
        marginBottom: 28,
        display: "inline-block",
        position: "relative",
        zIndex: 2,
    },
    header: {
        textAlign: "center",
        marginBottom: 36,
        position: "relative",
        zIndex: 2,
    },
    leoCircle: {
        width: 64,
        height: 64,
        background: "#f4a12e",
        borderRadius: "50%",
        fontSize: 32,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 12px",
        boxShadow: "0 4px 16px rgba(244,161,46,0.4)",
    },
    leoLabel: {
        display: "inline-block",
        background: "rgba(255,255,255,0.75)",
        borderRadius: 30,
        padding: "6px 18px",
        fontWeight: 800,
        fontSize: "0.88rem",
        color: "#2d6a4f",
        marginBottom: 14,
    },
    title: {
        fontFamily: "'Fredoka One', cursive",
        fontSize: "2.2rem",
        color: "#1a3022",
        marginBottom: 8,
        lineHeight: 1.2,
    },
    titleAccent: {
        color: "#f4a12e",
        fontStyle: "italic",
    },
    subtitle: {
        fontSize: "1rem",
        color: "#3d5a47",
        fontWeight: 600,
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 24,
        maxWidth: 900,
        margin: "0 auto",
        position: "relative",
        zIndex: 2,
    },
    card: {
        borderRadius: 22,
        padding: "24px 22px 20px",
        boxShadow: "0 6px 24px rgba(45,106,79,0.13)",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        border: "2px solid rgba(255,255,255,0.6)",
    },
    badge: {
        position: "absolute",
        top: 16,
        right: 16,
        color: "white",
        fontWeight: 800,
        fontSize: "0.75rem",
        padding: "4px 12px",
        borderRadius: 30,
    },
    cardIcon: {
        fontSize: 36,
        marginBottom: 4,
    },
    cardName: {
        fontFamily: "'Fredoka One', cursive",
        fontSize: "1.4rem",
        color: "#1a3022",
        margin: 0,
    },
    cardActivity: {
        fontSize: "0.8rem",
        fontWeight: 800,
        color: "#6b8c74",
        textTransform: "uppercase",
        letterSpacing: "0.8px",
        margin: 0,
    },
    cardDesc: {
        fontSize: "0.9rem",
        color: "#3d5a47",
        lineHeight: 1.6,
        fontWeight: 600,
        margin: "4px 0 8px",
        flex: 1,
    },
    tagRow: {
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        marginBottom: 6,
    },
    tag: {
        fontSize: "0.78rem",
        fontWeight: 800,
        padding: "4px 12px",
        borderRadius: 30,
    },
    viewBtn: {
        display: "block",
        width: "100%",
        padding: "13px",
        border: "none",
        borderRadius: 14,
        color: "white",
        fontFamily: "'Nunito', sans-serif",
        fontWeight: 800,
        fontSize: "0.95rem",
        cursor: "pointer",
        marginTop: 6,
        letterSpacing: "0.3px",
        textAlign: "center",
    },

    // ── MODAL — made much larger ──
    modalOverlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(26,48,34,0.6)",
        backdropFilter: "blur(6px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,                  // small padding so modal nearly fills screen
    },
    modal: {
        background: "#fffdf5",
        borderRadius: 24,
        width: "96vw",                // 96% of viewport width
        height: "94vh",               // 94% of viewport height
        maxWidth: 1300,               // cap on very large screens
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
    },
    modalHeader: {
        padding: "10px 22px",
        background: "linear-gradient(135deg, #52b788, #2d6a4f)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,                // header never shrinks
    },
    modalTitle: {
        fontFamily: "'Fredoka One', cursive",
        fontSize: "1.1rem",
        color: "white",
        margin: 0,
    },
    modalSub: {
        fontSize: "0.78rem",
        opacity: 0.85,
        marginTop: 1,
        color: "white",
    },
    closeBtn: {
        width: 38,
        height: 38,
        background: "rgba(255,255,255,0.2)",
        border: "none",
        borderRadius: "50%",
        color: "white",
        fontSize: "1.1rem",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    modalBody: {
        flex: 1,                      // takes ALL available height between header & footer
        overflow: "hidden",
        background: "#f5faf7",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    pdfFrame: {
        width: "100%",
        height: "100%",               // fills the entire modal body
        border: "none",
        display: "block",
    },
    placeholder: {
        textAlign: "center",
        padding: 48,
        color: "#3d5a47",
    },
    placeholderTitle: {
        fontFamily: "'Fredoka One', cursive",
        fontSize: "1.4rem",
        color: "#1a3022",
        margin: "14px 0 10px",
    },
    placeholderText: {
        fontSize: "0.95rem",
        lineHeight: 1.7,
        color: "#6b8c74",
        maxWidth: 460,
        margin: "0 auto",
    },
    code: {
        background: "#e0f2e9",
        color: "#2d6a4f",
        padding: "2px 7px",
        borderRadius: 6,
        fontSize: "0.85rem",
        fontFamily: "monospace",
    },
    codeBlock: {
        display: "block",
        marginTop: 18,
        background: "#e0f2e9",
        color: "#2d6a4f",
        padding: "12px 20px",
        borderRadius: 12,
        fontSize: "0.84rem",
        fontFamily: "monospace",
    },
    modalFooter: {
        padding: "14px 28px",
        display: "flex",
        gap: 12,
        justifyContent: "flex-end",
        alignItems: "center",
        borderTop: "2px solid #e0f2e9",
        background: "#fffdf5",
        flexShrink: 0,                // footer never shrinks
    },
    cancelBtn: {
        padding: "11px 26px",
        border: "2px solid #c8e6c9",
        background: "white",
        borderRadius: 30,
        fontFamily: "'Nunito', sans-serif",
        fontWeight: 800,
        fontSize: "0.92rem",
        color: "#3d5a47",
        cursor: "pointer",
    },
    downloadBtn: {
        padding: "11px 26px",
        border: "none",
        borderRadius: 14,
        background: "#52b788",
        color: "white",
        fontFamily: "'Nunito', sans-serif",
        fontWeight: 800,
        fontSize: "0.92rem",
        cursor: "pointer",
        display: "inline-block",
        textAlign: "center",
    },
    grass: {
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        textAlign: "center",
        fontSize: 28,
        letterSpacing: 4,
        pointerEvents: "none",
        userSelect: "none",
        zIndex: 1,
    },
};