// frontend/src/lib/api.ts
// Central API client — all backend calls go through here

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// ── Token storage ─────────────────────────────────────────────
export const getToken = () => localStorage.getItem('lumina_token');
export const setToken = (token: string) => localStorage.setItem('lumina_token', token);
export const clearToken = () => localStorage.removeItem('lumina_token');

export const setProfile = (profile: any) =>
    localStorage.setItem('lumina_profile', JSON.stringify(profile));
export const getProfile = () => {
    const p = localStorage.getItem('lumina_profile');
    return p ? JSON.parse(p) : null;
};
export const clearProfile = () => localStorage.removeItem('lumina_profile');

// ── Base fetch wrapper ────────────────────────────────────────
async function apiFetch(path: string, options: RequestInit = {}) {
    const token = getToken();

    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || `Request failed: ${res.status}`);
    }

    return data;
}

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
    childSignup: (payload: {
        name: string;
        avatar: string;
        emojiPin: string[];
    }) => apiFetch('/auth/child/signup', { method: 'POST', body: JSON.stringify(payload) }),

    childLogin: (payload: {
        name: string;
        emojiPin: string[];
    }) => apiFetch('/auth/child/login', { method: 'POST', body: JSON.stringify(payload) }),

    adultSignup: (payload: {
        fullName: string;
        email: string;
        password: string;
        role: 'teacher' | 'parent';
    }) => apiFetch('/auth/adult/signup', { method: 'POST', body: JSON.stringify(payload) }),

    adultLogin: (payload: {
        email: string;
        password: string;
    }) => apiFetch('/auth/adult/login', { method: 'POST', body: JSON.stringify(payload) }),
};

// ── Student ───────────────────────────────────────────────────
export const studentApi = {
    getDashboard: () =>
        apiFetch('/student/dashboard'),

    getProfile: () =>
        apiFetch('/student/profile'),

    saveOnboarding: (payload: {
        interests: string[];
        consentWebcam: boolean;
        consentMic: boolean;
        consentEmotion: boolean;
    }) => apiFetch('/student/onboarding', { method: 'PUT', body: JSON.stringify(payload) }),

    startSession: () =>
        apiFetch('/student/session/start', { method: 'POST' }),

    endSession: (payload: {
        sessionId: string;
        activitiesDone: number;
        coinsEarned: number;
        islandsVisited: number[];
    }) => apiFetch('/student/session/end', { method: 'PUT', body: JSON.stringify(payload) }),
};

// ── Progress ──────────────────────────────────────────────────
export const progressApi = {
    saveActivity: (payload: {
        islandId: number;
        activityType: string;
        score: number;
        totalQuestions: number;
        correct: number;
        timeSpentSec?: number;
        phonemeErrors?: Record<string, string>;
    }) => apiFetch('/progress/activity', { method: 'POST', body: JSON.stringify(payload) }),

    getIslandProgress: (islandId: number) =>
        apiFetch(`/progress/island/${islandId}`),

    awardCoins: (amount: number, reason: string) =>
        apiFetch('/progress/coins', { method: 'POST', body: JSON.stringify({ amount, reason }) }),
};