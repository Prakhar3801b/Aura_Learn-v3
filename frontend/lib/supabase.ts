import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
    if (!_supabase) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error(
                'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
            );
        }
        _supabase = createClient(supabaseUrl, supabaseAnonKey);
    }
    return _supabase;
}

// Lazy proxy — avoids crashing at module load when env vars are missing.
// All property access is forwarded to the singleton from getSupabase().
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
    get(_target, prop, receiver) {
        const client = getSupabase();
        const value = Reflect.get(client, prop, receiver);
        return typeof value === 'function' ? value.bind(client) : value;
    },
});

export type { User, Session } from '@supabase/supabase-js';
