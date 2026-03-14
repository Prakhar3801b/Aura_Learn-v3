import { NextRequest, NextResponse } from 'next/server';

// In-memory rate limiting (per-instance, resets on restart)
const rateMap = new Map<string, { count: number; resetAt: number }>();

const GENERAL_LIMIT = 100;  // requests per window
const AUTH_LIMIT = 20;       // requests per window for auth routes
const WINDOW_MS = 60_000;   // 1 minute window

function getClientIP(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    const real = req.headers.get('x-real-ip');
    if (real) return real;
    return '127.0.0.1';
}

function isRateLimited(key: string, limit: number): boolean {
    const now = Date.now();
    const entry = rateMap.get(key);

    if (!entry || now > entry.resetAt) {
        rateMap.set(key, { count: 1, resetAt: now + WINDOW_MS });
        return false;
    }

    entry.count++;
    if (entry.count > limit) {
        return true;
    }
    return false;
}

// Cleanup old entries periodically (prevent memory leak)
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of rateMap.entries()) {
            if (now > entry.resetAt) {
                rateMap.delete(key);
            }
        }
    }, 60_000);
}

const AUTH_PATHS = ['/login', '/register', '/auth'];

export function middleware(req: NextRequest) {
    const ip = getClientIP(req);
    const path = req.nextUrl.pathname;

    // Determine rate limit based on path
    const isAuthRoute = AUTH_PATHS.some(p => path.startsWith(p));
    const limit = isAuthRoute ? AUTH_LIMIT : GENERAL_LIMIT;
    const key = `${ip}:${isAuthRoute ? 'auth' : 'general'}`;

    if (isRateLimited(key, limit)) {
        return new NextResponse(
            JSON.stringify({ error: 'Too many requests. Please try again later.' }),
            {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'Retry-After': '60',
                },
            }
        );
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Match all routes except static files and Next.js internals
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
    ],
};
