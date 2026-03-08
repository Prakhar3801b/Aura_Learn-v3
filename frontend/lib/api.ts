export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function fetchAPI<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
    });
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
    created_at: string;
}

export async function uploadMaterial(formData: FormData) {
    const res = await fetch(`${API_BASE}/materials/upload`, { method: 'POST', body: formData });
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

export async function getMindMap(materialId: string) {
    return fetchAPI<any>(`/ai/mindmap/${materialId}`);
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

// ── XR Labs ───────────────────────────────────

export async function getARLabs(category?: string) {
    const q = category ? `?category=${category}` : '';
    return fetchAPI<any[]>(`/xr/labs${q}`);
}

export async function getARLab(id: string) {
    return fetchAPI<any>(`/xr/labs/${id}`);
}
