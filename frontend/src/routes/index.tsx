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
import LearningModule from '../pages/LearningModule';
import AlphabetModule from '../pages/activities/AlphabetModule';
import NumberModule from '../pages/activities/NumberModule';
import ResourceModule from '../pages/ResourceModule';

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

    // 🔁 SAFE REDIRECTS (DO NOT REMOVE YET)
    { path: '/learningModule', element: <Navigate to="/learning" replace /> },
    { path: '/alphabetmodule', element: <Navigate to="/learning/alphabet" replace /> },

    { path: '/learning', element: guard(<LearningModule />) },
    { path: '/learning/alphabet', element: guard(<AlphabetModule />) },
    { path: '/learning/numbers', element: guard(<NumberModule />) },
    { path: '/resourcemodule', element: guard(<ResourceModule />) },

    // ── Island flow ──────────────────────────────────────────────
    { path: '/island/:id', element: guard(<IslandEntry />) },
    { path: '/island/:id/flashcard', element: guard(<Flashcard />) },
    { path: '/island/:id/word_sort', element: guard(<WordSort />) },
]);