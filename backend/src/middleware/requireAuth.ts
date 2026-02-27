// backend/src/middleware/requireAuth.ts
// Validates the Supabase JWT sent in the Authorization header
// Attaches req.user (the Supabase auth user) to the request

import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin';

export interface AuthRequest extends Request {
    user?: {
        id: string;         // Supabase auth.users id
        email?: string;
        role?: string;
    };
    studentProfile?: {
        id: string;         // child_profiles.id (UUID)
        name: string;
    };
}

export const requireAuth = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];

    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = {
        id: data.user.id,
        email: data.user.email,
        role: data.user.user_metadata?.role,
    };

    next();
};