import { sanitize } from './sanitize';
import { getSupabase } from './supabase';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Request timeout defaults
const DEFAULT_TIMEOUT = 10_000;  // 10 seconds
const UPLOAD_TIMEOUT = 120_000;  // 2 minutes

/**
 * Get the current user's JWT token for authenticated API requests.
 */
async function getAuthToken(): Promise<string | null> {
    try {
        const supabase = getSupabase();
        const { data } = await supabase.auth.getSession();
        return data?.session?.access_token || null;
    } catch {
        return null;
    }
}

/**
 * Fetch with timeout support using AbortController.
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await fetch(url, { ...options, signal: controller.signal });
        return res;
    } finally {
        clearTimeout(timeout);
    }
}

/**
 * Core API helper with auth, timeout, and error handling.
 */
async function fetchAPI<T>(path: string, options: RequestInit = {}, timeout = DEFAULT_TIMEOUT): Promise<T> {
    const token = await getAuthToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetchWithTimeout(`${API_BASE}${path}`, {
        ...options,
        headers,
    }, timeout);

    if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || `HTTP ${res.status}`);
    }
    return res.json();
}

// ── Materials ──────────────────────────────────
export interface Material {
    id: string;
    title: string;
    description?: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    user_id: string;
    file_path?: string;
    file_type?: string;
    created_at: string;
}

export async function uploadMaterial(formData: FormData) {
    const token = await getAuthToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetchWithTimeout(`${API_BASE}/materials/upload`, {
        method: 'POST',
        body: formData,
        headers,
    }, UPLOAD_TIMEOUT);

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(err.detail || `Upload failed (HTTP ${res.status})`);
    }
    return res.json();
}

export async function getMaterial(id: string): Promise<Material> {
    return fetchAPI<Material>(`/materials/${id}`);
}

export async function getUserMaterials(userId: string): Promise<Material[]> {
    return fetchAPI<Material[]>(`/materials/user/${userId}`);
}

export const deleteMaterial = async (materialId: string, userId: string) => {
    return fetchAPI(`/materials/${materialId}?user_id=${userId}`, { method: 'DELETE' });
};

export const deleteMaterialsBatch = async (materialIds: string[], userId: string) => {
    return fetchAPI(`/materials/batch/delete`, {
        method: 'POST',
        body: JSON.stringify({ material_ids: materialIds, user_id: userId })
    });
};
export async function generateSimulation(materialId: string) {
    return fetchAPI<any>(`/ai/simulation/generate/${materialId}`, { method: 'POST' }, 60000);
}

export async function getUserSessionHistory(userId: string) {
    return fetchAPI<any[]>(`/analytics/user/${userId}/history`);
}

// ── AI Results ────────────────────────────────

export async function getFlashcards(materialId: string) {
    return fetchAPI<any[]>(`/ai/flashcards/${materialId}`);
}

export async function updateFlashcardConfidence(flashcardId: string, score: number) {
    return fetchAPI(`/ai/flashcards/${flashcardId}/confidence?score=${score}`, { method: 'PATCH' });
}

export async function getExamPoints(materialId: string) {
    return fetchAPI<any[]>(`/ai/exampoints/${materialId}`);
}


export async function generatePracticalChallenge(materialId: string) {
    return fetchAPI<any>(`/ai/practical/generate/${materialId}`, { method: 'POST' });
}

export async function evaluatePracticalAnswer(materialId: string, challenge: string, answer: string) {
    return fetchAPI<{ feedback: string }>(`/ai/practical/evaluate/${materialId}`, {
        method: 'POST',
        body: JSON.stringify({ challenge, answer }),
    });
}

export async function chatMulti(materialIds: string[], question: string, userId?: string) {
    const safeQuestion = sanitize(question);
    return fetchAPI<any>(`/ai/chat-multi`, {
        method: 'POST',
        body: JSON.stringify({ material_ids: materialIds, question: safeQuestion, user_id: userId }),
    });
}

export async function chatWithMaterial(materialId: string, question: string, userId?: string) {
    const safeQuestion = sanitize(question);
    return fetchAPI<any>(`/ai/chat/${materialId}`, {
        method: 'POST',
        body: JSON.stringify({ question: safeQuestion, user_id: userId }),
    });
}

// ── Analytics ──────────────────────────────────

export async function startSession(userId: string, materialId: string) {
    return fetchAPI<{ session_id: string }>(`/analytics/session/start?user_id=${userId}&material_id=${materialId}`, { method: 'POST' });
}

export async function recordEvent(event: {
    session_id: string; material_id: string; event_type: string; topic?: string;
}) {
    return fetchAPI(`/analytics/event`, { method: 'POST', body: JSON.stringify(event) });
}

export async function getAnomalies(sessionId: string) {
    return fetchAPI<any[]>(`/analytics/anomalies/${sessionId}`);
}

export async function getSessionSummary(sessionId: string, userId?: string) {
    const q = userId ? `?user_id=${userId}` : '';
    return fetchAPI<any>(`/analytics/session/${sessionId}/summary${q}`);
}

// ── XR Labs ───────────────────────────────────

export async function getARLabs(category?: string) {
    const q = category ? `?category=${category}` : '';
    return fetchAPI<any[]>(`/xr/labs${q}`);
}

export async function getARLab(id: string) {
    return fetchAPI<any>(`/xr/labs/${id}`);
}
