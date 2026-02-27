// frontend/src/routes/index.tsx

import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Landing from '../pages/Landing';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import Onboarding from '../pages/Onboarding';
import StudentDashboard from '../pages/StudentDashboard';
import IslandEntry from '../pages/IslandEntry';
import Flashcard from '../pages/activities/Flashcard';
import WordSort from '../pages/activities/WordSort';
import Blending from '../pages/activities/Blending';
import LearningModule from "../pages/LearningModule";
import AlphabetModule from '../pages/activities/AlphabetModule';

// ── Auth guard ────────────────────────────────────────────────
const RequireAuth = ({ children }: { children: React.ReactElement }) => {
    const token = localStorage.getItem('lumina_token');
    if (!token) return <Navigate to="/login" replace />;
    return children;
};

const guard = (el: React.ReactElement) => (
    <RequireAuth>{el}</RequireAuth>
);

// ── Router ────────────────────────────────────────────────────
export const router = createBrowserRouter([
    { path: '/', element: <Landing /> },
    { path: '/login', element: <Login /> },
    { path: '/signup', element: <Signup /> },
    { path: '/onboarding', element: guard(<Onboarding />) },
    { path: '/dashboard', element: guard(<StudentDashboard />) },

    // ── Island flow ──────────────────────────────────────────────
    { path: '/island/:id', element: guard(<IslandEntry />) },
    { path: '/island/:id/flashcard', element: guard(<Flashcard />) },
    { path: '/island/:id/word_sort', element: guard(<WordSort />) },
    { path: '/island/:id/blending', element: guard(<Blending />) },
    { path: '/learningmodule', element: guard(<LearningModule />) },
    { path: '/alphabetmodule', element: guard(<AlphabetModule />) },

    // Coming next:
    // { path: '/island/:id/word_sort',   element: guard(<WordSort />) },
    // { path: '/island/:id/blending',    element: guard(<Blending />) },
    // { path: '/island/:id/listen_find', element: guard(<ListenFind />) },
    // { path: '/island/:id/spell_it',    element: guard(<SpellIt />) },
    // { path: '/island/:id/results',     element: guard(<IslandResults />) },
]);