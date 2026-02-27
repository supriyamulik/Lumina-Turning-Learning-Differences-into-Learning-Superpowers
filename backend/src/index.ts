// backend/src/index.ts
// ─────────────────────────────────────────────────────────────
// Lumina Express Backend — Entry Point
// ─────────────────────────────────────────────────────────────

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import authRouter from './routes/auth';
import studentRouter from './routes/student';
import progressRouter from './routes/progress';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ──────────────────────────────────────────────
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/student', studentRouter);
app.use('/api/progress', progressRouter);

// ── Health check ────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🦁 Lumina backend running on port ${PORT}`);
});

export default app;